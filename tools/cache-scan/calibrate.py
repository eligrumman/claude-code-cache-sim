#!/usr/bin/env python3
"""
calibrate.py — consume cache_scan.py's JSONL output and forecast, per
session, whether keeping the prompt cache warm is worth it, and in which
TTL mode (5m vs 1h).

Standard library only. No network calls.

------------------------------------------------------------------------
TOKEN-DENOMINATED MODEL (primary output)
------------------------------------------------------------------------
The user is on a Max subscription: dollar cost is secondary, what matters
is QUOTA TOKENS consumed. Everything below is computed in tokens first;
a dollar view is offered separately via --pricing as a convenience only.

ASSUMPTION (prominently flagged): Anthropic does not publish an official
token-equivalence weighting for how cache reads/writes count against a
Max subscription's quota. We use the same *relative* multipliers as the
published per-token API pricing ratios, applied to token counts rather
than dollars, as a reasonable proxy. If the real quota accounting differs,
these multipliers should be edited at the top of this file.

Multipliers (relative to 1 base input token = 1.0):
  CACHE_READ_MULTIPLIER   = 0.1   (cache hit: ~10% of a fresh input token)
  CACHE_WRITE_5M_MULT     = 1.25  (cache miss / creation, 5m TTL bucket)
  CACHE_WRITE_1H_MULT     = 2.0   (cache miss / creation, 1h TTL bucket)

KEEP-WARM COST/SAVING MODEL, per session, per TTL mode (5m or 1h):
  - To bridge an idle gap of G seconds without letting the cache lapse,
    you must send a refresh ping every (TTL - margin) seconds, where
    margin is a safety buffer (300s for 1h TTL, 60s for 5m TTL, mirroring
    the real system's safety margins). Each ping is modeled as a cache
    READ of the prefix (cheap) IF it lands before the TTL lapses — which
    is true by construction since we ping inside the margin-adjusted
    window. So ping cost per gap:
        pings_needed = ceil(G / (TTL - margin))
        ping_cost_tokens = pings_needed * prefix_tokens * CACHE_READ_MULTIPLIER
  - Without warming, a return after a gap > TTL pays a full cache
    CREATION rebuild: prefix_tokens * write_multiplier (write mult
    depends on TTL mode used for that rebuild).
  - With warming, the return instead pays a cache READ:
        prefix_tokens * CACHE_READ_MULTIPLIER
  - Net saving from warming, for a single gap event that would otherwise
    have caused a cold rebuild (gap > TTL for that mode):
        saving = prefix_tokens * (write_mult - CACHE_READ_MULTIPLIER)
                 - ping_cost_tokens
    Gaps that are already short enough that the cache survives naturally
    (gap <= TTL) need no pings and yield no saving (nothing to fix).
  - We sum this per-gap saving across every observed gap in the session's
    history to project a per-session total, separately for 5m-mode and
    1h-mode, then recommend whichever mode has the larger *positive*
    total (or DONT_WARM if neither is net positive).

PREFIX-SIZE ESTIMATE (documented assumption): we do not have a direct
measurement of "prefix tokens that must persist." We approximate it with
the MEDIAN of (cache_read_input_tokens + cache_creation_input_tokens)
across the session's turns — i.e. the typical total cache-relevant size
touched per turn. Median (not mean) is used for robustness against
outlier turns (e.g. a huge one-off paste). This is a proxy, not a
measurement of the true stable prefix; document this if numbers look off
for sessions with highly variable turn sizes.

HISTORICAL WASTE (not a forecast, a fact from the data): sum of
cache_creation_input_tokens over rows where cache_miss_after_gap is
true — tokens that were actually rebuilt from cold, as already flagged
by cache_scan.py's own gap/TTL/noise-floor logic.

RECOMMENDATION LOGIC per session:
  - Compute projected_net_savings_5m and projected_net_savings_1h as
    above.
  - If max(both) <= 0: DONT_WARM.
  - Else recommend whichever mode has the larger positive value:
    WARM-5M or WARM-1H.
  - Sessions whose gaps are almost all <5m naturally have near-zero
    savings under either mode (nothing to rebuild) -> DONT_WARM.

RECENCY: last_turn_ago_seconds = now - max(timestamp) for the session.
ACTIVE if last_turn_ago_seconds <= --active-within hours (default 24).
Only ACTIVE sessions are realistic keep-warm candidates (a cold session
has nothing live to warm); this is reported but does NOT zero out the
projection — the projection is left visible for transparency, with the
active flag reported alongside it so you can filter.

------------------------------------------------------------------------
OPTIONAL DOLLAR VIEW (secondary, via --pricing)
------------------------------------------------------------------------
If a --pricing JSON file is supplied (or the built-in DEFAULT_PRICING is
used with --show-dollars), the same token quantities are also priced in
USD using published per-model per-token rates. This is informational
only — the Max subscription context means token/quota savings are the
primary signal.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any, Optional

# --- token multiplier constants (SEE MODULE DOCSTRING ASSUMPTIONS) --------

CACHE_READ_MULTIPLIER = 0.1   # cache hit, relative to 1 base input token
CACHE_WRITE_5M_MULT = 1.25    # cache creation, 5m TTL bucket
CACHE_WRITE_1H_MULT = 2.0     # cache creation, 1h TTL bucket

TTL_SECONDS = {"5m": 300, "1h": 3600}
TTL_MARGIN_SECONDS = {"5m": 60, "1h": 300}
WRITE_MULT = {"5m": CACHE_WRITE_5M_MULT, "1h": CACHE_WRITE_1H_MULT}

# Optional, illustrative-only $/Mtok rates (secondary dollar view). Real
# rates vary by model; edit or replace via --pricing <file.json>.
DEFAULT_PRICING = {
    "default": {
        "input_per_mtok": 3.0,
        "cache_read_per_mtok": 0.30,
        "cache_write_5m_per_mtok": 3.75,
        "cache_write_1h_per_mtok": 6.00,
        "output_per_mtok": 15.0,
    }
}


# --- data loading -----------------------------------------------------------


def load_rows(path: Path) -> list[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def parse_ts(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except ValueError:
        return None


# --- per-session forecast ----------------------------------------------------


def gap_saving_for_mode(gap_seconds: float, prefix_tokens: float, mode: str) -> float:
    """Net token saving from warming across a single observed gap, under
    the given TTL mode. Returns 0 if the gap wouldn't have caused a cold
    rebuild in this mode (gap <= TTL), i.e. nothing to fix."""
    ttl = TTL_SECONDS[mode]
    if gap_seconds <= ttl:
        return 0.0
    margin = TTL_MARGIN_SECONDS[mode]
    interval = max(ttl - margin, 1)
    pings_needed = math.ceil(gap_seconds / interval)
    ping_cost = pings_needed * prefix_tokens * CACHE_READ_MULTIPLIER
    write_mult = WRITE_MULT[mode]
    raw_saving = prefix_tokens * (write_mult - CACHE_READ_MULTIPLIER)
    return raw_saving - ping_cost


def forecast_session(session_id: str, rows: list[dict], now: datetime, active_within_hours: float) -> dict:
    rows_sorted = sorted(rows, key=lambda r: r.get("turn_index", 0))

    prefix_samples = [
        (r.get("cache_read_input_tokens") or 0) + (r.get("cache_creation_input_tokens") or 0)
        for r in rows_sorted
    ]
    prefix_samples_nonzero = [v for v in prefix_samples if v > 0]
    prefix_tokens_est = median(prefix_samples_nonzero) if prefix_samples_nonzero else 0.0

    gaps = [r["gap_seconds"] for r in rows_sorted if r.get("gap_seconds") is not None]

    historical_miss_events = sum(1 for r in rows_sorted if r.get("cache_miss_after_gap"))
    historical_miss_tokens = sum(
        r.get("cache_creation_input_tokens") or 0 for r in rows_sorted if r.get("cache_miss_after_gap")
    )

    savings = {}
    for mode in ("5m", "1h"):
        total = 0.0
        for g in gaps:
            total += gap_saving_for_mode(g, prefix_tokens_est, mode)
        savings[mode] = total

    best_mode = max(savings, key=lambda m: savings[m])
    if savings[best_mode] > 0:
        recommendation = "WARM-5M" if best_mode == "5m" else "WARM-1H"
    else:
        recommendation = "DONT_WARM"

    timestamps = [parse_ts(r.get("timestamp")) for r in rows_sorted]
    timestamps = [t for t in timestamps if t is not None]
    last_turn = max(timestamps) if timestamps else None
    last_turn_ago_seconds = (now - last_turn).total_seconds() if last_turn else None
    active = (
        last_turn_ago_seconds is not None
        and last_turn_ago_seconds <= active_within_hours * 3600
    )

    gap_count = len(gaps)
    gaps_over_5m = sum(1 for g in gaps if g > TTL_SECONDS["5m"])
    gaps_over_1h = sum(1 for g in gaps if g > TTL_SECONDS["1h"])
    gaps_5_30m = sum(1 for g in gaps if TTL_SECONDS["5m"] < g <= 1800)
    gaps_1_3h = sum(1 for g in gaps if 3600 < g <= 10800)

    project_slug = rows_sorted[0].get("project_slug") if rows_sorted else None
    file_path = rows_sorted[0].get("file_path") if rows_sorted else None
    models = sorted({r.get("model") for r in rows_sorted if r.get("model")})

    return {
        "session_id": session_id,
        "project_slug": project_slug,
        "file_path": file_path,
        "models": models,
        "turns": len(rows_sorted),
        "prefix_tokens_estimate": round(prefix_tokens_est, 1),
        "gap_count": gap_count,
        "gaps_over_5m": gaps_over_5m,
        "gaps_over_1h": gaps_over_1h,
        "gaps_5m_to_30m": gaps_5_30m,
        "gaps_1h_to_3h": gaps_1_3h,
        "historical_cold_rebuild_events": historical_miss_events,
        "historical_cold_rebuild_tokens": historical_miss_tokens,
        "projected_net_savings_tokens_5m_mode": round(savings["5m"], 1),
        "projected_net_savings_tokens_1h_mode": round(savings["1h"], 1),
        "recommendation": recommendation,
        "last_turn_timestamp": last_turn.isoformat() if last_turn else None,
        "last_turn_ago_seconds": last_turn_ago_seconds,
        "active": active,
    }


def to_dollars(tokens: float, model: Optional[str], kind: str, pricing: dict) -> float:
    rates = pricing.get(model) if model else None
    if rates is None:
        rates = pricing.get("default", DEFAULT_PRICING["default"])
    per_mtok_key = {
        "read": "cache_read_per_mtok",
        "write_5m": "cache_write_5m_per_mtok",
        "write_1h": "cache_write_1h_per_mtok",
        "input": "input_per_mtok",
    }[kind]
    return tokens / 1_000_000.0 * rates.get(per_mtok_key, 0.0)


# --- CLI --------------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "Forecast, per session, whether keeping the Claude Code prompt "
            "cache warm is worth it (and in which TTL mode), from cache_scan.py "
            "JSONL output. Token-denominated; dollar view is secondary/optional."
        )
    )
    p.add_argument("in_path", nargs="?", default=None, help="Path to scan JSONL (positional).")
    p.add_argument("--in", dest="in_flag", default=None, help="Path to scan JSONL (alt form).")
    p.add_argument(
        "--now",
        type=str,
        default=None,
        help="ISO timestamp to treat as 'now' (default: current UTC time). "
        "Use for reproducible testing.",
    )
    p.add_argument(
        "--active-within",
        type=float,
        default=24.0,
        metavar="HOURS",
        help="Sessions whose last turn is within this many hours are flagged ACTIVE (default: 24).",
    )
    p.add_argument("--top", type=int, default=10, help="Print top N warm-worthy sessions (default: 10).")
    p.add_argument("--json", type=str, default=None, help="Write per-session forecast objects to this JSONL path.")
    p.add_argument(
        "--pricing",
        type=str,
        default=None,
        help="Optional JSON file of {model_or_default: {input_per_mtok, cache_read_per_mtok, "
        "cache_write_5m_per_mtok, cache_write_1h_per_mtok, output_per_mtok}} for a secondary dollar view.",
    )
    p.add_argument(
        "--show-dollars",
        action="store_true",
        help="Show an illustrative dollar view using --pricing (or built-in default rates) alongside token numbers.",
    )
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    in_path_str = args.in_flag or args.in_path
    if not in_path_str:
        print("error: must supply scan JSONL path (positional or --in)", file=sys.stderr)
        return 2
    in_path = Path(in_path_str).expanduser()
    if not in_path.exists():
        print(f"error: {in_path} does not exist", file=sys.stderr)
        return 2

    now = parse_ts(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        print(f"error: could not parse --now {args.now!r}", file=sys.stderr)
        return 2

    pricing = dict(DEFAULT_PRICING)
    if args.pricing:
        with open(args.pricing, "r", encoding="utf-8") as fh:
            pricing.update(json.load(fh))

    rows = load_rows(in_path)
    if not rows:
        print(f"No rows loaded from {in_path}", file=sys.stderr)
        return 0

    by_session: dict[str, list[dict]] = {}
    for r in rows:
        sid = r.get("session_id") or r.get("file_path")
        by_session.setdefault(sid, []).append(r)

    forecasts = [
        forecast_session(sid, srows, now, args.active_within) for sid, srows in by_session.items()
    ]

    if args.json:
        out_path = Path(args.json).expanduser()
        with out_path.open("w", encoding="utf-8") as fh:
            for f in forecasts:
                fh.write(json.dumps(f, ensure_ascii=False) + "\n")
        print(f"Wrote {len(forecasts)} session forecasts to {out_path}", file=sys.stderr)

    def best_savings(f: dict) -> float:
        return max(f["projected_net_savings_tokens_5m_mode"], f["projected_net_savings_tokens_1h_mode"])

    warm_worthy = [f for f in forecasts if f["recommendation"] != "DONT_WARM"]
    warm_worthy.sort(key=best_savings, reverse=True)

    print("=" * 78)
    print("ASSUMPTIONS (edit constants at top of calibrate.py to change):")
    print(f"  cache_read multiplier     = {CACHE_READ_MULTIPLIER}  (relative to 1 base input token)")
    print(f"  cache_write_5m multiplier = {CACHE_WRITE_5M_MULT}")
    print(f"  cache_write_1h multiplier = {CACHE_WRITE_1H_MULT}")
    print("  These are NOT an official Anthropic quota-weighting -- Max subscription")
    print("  quota accounting for cache read/write is not officially published.")
    print("  prefix_tokens_estimate = median(cache_read + cache_creation) per turn,")
    print("  a proxy for the stable warm prefix size, not a direct measurement.")
    print("=" * 78)
    print()
    print(f"=== Top {min(args.top, len(warm_worthy))} warm-worthy sessions (by projected net token savings) ===")
    for f in warm_worthy[: args.top]:
        active_tag = "ACTIVE" if f["active"] else "inactive"
        print(
            f"- [{f['recommendation']}] {f['project_slug']} / {f['session_id']} ({active_tag})\n"
            f"    turns={f['turns']} prefix_est={f['prefix_tokens_estimate']:.0f}tok "
            f"gaps>5m={f['gaps_over_5m']} gaps>1h={f['gaps_over_1h']} "
            f"gaps(5-30m)={f['gaps_5m_to_30m']} gaps(1-3h)={f['gaps_1h_to_3h']}\n"
            f"    historical_cold_rebuilds={f['historical_cold_rebuild_events']} "
            f"(tokens={f['historical_cold_rebuild_tokens']})\n"
            f"    projected_net_savings: 5m-mode={f['projected_net_savings_tokens_5m_mode']:.0f}tok "
            f"1h-mode={f['projected_net_savings_tokens_1h_mode']:.0f}tok "
            f"last_turn_ago={(f['last_turn_ago_seconds'] or 0)/3600:.1f}h"
        )

    total_5m = sum(f["projected_net_savings_tokens_5m_mode"] for f in forecasts if f["recommendation"] == "WARM-5M")
    total_1h = sum(f["projected_net_savings_tokens_1h_mode"] for f in forecasts if f["recommendation"] == "WARM-1H")
    n_5m = sum(1 for f in forecasts if f["recommendation"] == "WARM-5M")
    n_1h = sum(1 for f in forecasts if f["recommendation"] == "WARM-1H")
    n_dont = sum(1 for f in forecasts if f["recommendation"] == "DONT_WARM")
    n_active_warm = sum(1 for f in forecasts if f["recommendation"] != "DONT_WARM" and f["active"])

    total_hist_events = sum(f["historical_cold_rebuild_events"] for f in forecasts)
    total_hist_tokens = sum(f["historical_cold_rebuild_tokens"] for f in forecasts)

    print()
    print("=== Grand summary ===")
    print(f"sessions analyzed:                {len(forecasts)}")
    print(f"  recommended WARM-5M:             {n_5m}  (projected net savings: {total_5m:.0f} tokens)")
    print(f"  recommended WARM-1H:             {n_1h}  (projected net savings: {total_1h:.0f} tokens)")
    print(f"  recommended DONT_WARM:           {n_dont}")
    print(f"  of the warm-worthy, ACTIVE now (last turn <= {args.active_within:.0f}h ago): {n_active_warm}")
    print(f"TOTAL projected net token savings if all recommendations applied: {total_5m + total_1h:.0f} tokens")
    print(f"(for reference) historical cold-rebuild events already observed: {total_hist_events}")
    print(f"(for reference) historical cold-rebuild tokens already spent:    {total_hist_tokens}")

    if args.show_dollars:
        # Illustrative only: apply default/pricing $/Mtok rates to the
        # projected token savings as if they were cache-read-vs-write
        # deltas. Approximate -- see module docstring; token view above
        # is primary.
        def dollarize(tok: float) -> float:
            rates = pricing.get("default", DEFAULT_PRICING["default"])
            # crude: treat saved tokens as avoided write-minus-read delta
            # at default rates, per Mtok.
            per_tok = (rates["cache_write_5m_per_mtok"] - rates["cache_read_per_mtok"]) / 1_000_000.0
            return tok * per_tok

        print()
        print("=== Illustrative dollar view (secondary; token view above is primary) ===")
        print(f"  ~${dollarize(total_5m):.4f} (5m-mode) + ~${dollarize(total_1h):.4f} (1h-mode) "
              f"= ~${dollarize(total_5m + total_1h):.4f} using default/--pricing rates")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
