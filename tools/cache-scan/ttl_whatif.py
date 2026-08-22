#!/usr/bin/env python3
"""
ttl_whatif.py -- 5m-vs-1h prompt-cache TTL what-if analysis from
cache_scan.py's JSONL output, split by transcript_kind (main / subagent /
workflow_subagent).

Standard library only. No network calls.

------------------------------------------------------------------------
THE TTL CONTROL REALITY (confirmed, read this before acting on numbers)
------------------------------------------------------------------------
- The MAIN conversation transcript, on a Max subscription, uses the 1-hour
  cache TTL by default. `ENABLE_PROMPT_CACHING_1H=1` / `FORCE_PROMPT_CACHING_5M=1`
  are the env vars that can override this behavior for the main session.
- SUBAGENT transcripts (transcript_kind == "subagent" or
  "workflow_subagent") are HARDCODED to the 5-minute TTL by Claude Code
  itself. This is NOT user-configurable -- there is no env var or setting
  that changes it.

Consequence: this tool's numbers for `main` are actionable (you can flip
an env var and change behavior). Its numbers for `subagent` /
`workflow_subagent` are DIAGNOSTIC ONLY -- they show whether the fixed
5m policy is costing you, but there is currently nothing you can do about
it for subagents short of Anthropic changing the platform default.

------------------------------------------------------------------------
WHAT IT COMPUTES, per transcript_kind
------------------------------------------------------------------------
1. Write mix: cache_creation_1h vs cache_creation_5m token share.
2. Cold-rebuild waste (cache_miss_after_gap == true rows), bucketed by
   gap_seconds:
     <=300s        -- would have missed under 5m TTL regardless of 1h
     300s-3600s    -- ADDRESSABLE: a 1h TTL would have kept this warm
     >3600s        -- dead either way, neither TTL survives this gap
   Reports count, rebuilt tokens, and $ per bucket.
3. Cost of switching all observed 5m writes to 1h writes:
     extra_$ = cache_creation_5m * (CACHE_WRITE_1H_MULT - CACHE_WRITE_5M_MULT) * base/1e6
     (i.e. the ADDITIONAL write premium of 1h over 5m, applied to every
     token that was actually written to the 5m bucket)
4. NET of switching to 1h = (300s-3600s bucket $ savings) - (switch cost $).
5. A one-line recommendation per kind: switch to 1h if NET > 0, else keep 5m.

Also prints gap_seconds distribution stats (median/p75/p95/mean) for
subagent rows, to make visually obvious how short-lived subagent
sessions are (they typically die out well before any TTL matters).

Same pricing constants as calibrate.py: base rates opus/opus5=$5,
fable5=$10, sonnet/sonnet5=$3, haiku=$1/Mtok; cache_read=0.1x,
write_5m=1.25x, write_1h=2.0x; unknown models default to $5/Mtok with a
printed count of unknowns.
"""

from __future__ import annotations

import argparse
import collections
import json
import statistics
import sys
from pathlib import Path
from typing import Optional

# --- pricing constants (mirrors calibrate.py) --------------------------------

CACHE_READ_MULTIPLIER = 0.1   # cache hit, relative to 1 base input token
CACHE_WRITE_5M_MULT = 1.25    # cache creation, 5m TTL bucket
CACHE_WRITE_1H_MULT = 2.0     # cache creation, 1h TTL bucket

BASE_RATES = {
    "opus": 5.0,
    "opus5": 5.0,
    "fable5": 10.0,
    "sonnet": 3.0,
    "sonnet5": 3.0,
    "haiku": 1.0,
}
DEFAULT_BASE_RATE = 5.0

KINDS = ("main", "subagent", "workflow_subagent")

GAP_LE = 300      # <= this many seconds: dead under 5m too, not addressable by switching to 1h
GAP_HI = 3600      # <= this many seconds: addressable band (5m misses it, 1h would not)


def base_rate(model: Optional[str], unknown_counter: collections.Counter) -> float:
    m = (model or "").lower()
    if "fable5" in m or "fable" in m:
        return BASE_RATES["fable5"]
    if "opus" in m:
        return BASE_RATES["opus"]
    if "sonnet" in m:
        return BASE_RATES["sonnet"]
    if "haiku" in m:
        return BASE_RATES["haiku"]
    unknown_counter[model] += 1
    return DEFAULT_BASE_RATE


def kind_of(row: dict) -> str:
    tk = row.get("transcript_kind")
    if tk in KINDS:
        return tk
    return "subagent" if row.get("is_subagent") else "main"


def load_rows(path: Path):
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


def pct_stats(values):
    if not values:
        return None
    values = sorted(values)
    n = len(values)

    def pct(p):
        idx = min(n - 1, int(p * n))
        return values[idx]

    return {
        "n": n,
        "median": pct(0.5),
        "p75": pct(0.75),
        "p95": pct(0.95),
        "mean": statistics.mean(values),
        "max": values[-1],
    }


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "5m-vs-1h prompt-cache TTL what-if analysis from cache_scan.py JSONL "
            "output, split by transcript_kind. Diagnostic for subagents -- their "
            "TTL is hardcoded to 5m and not user-configurable."
        )
    )
    p.add_argument("in_path", nargs="?", default=None, help="Path to scan JSONL (positional).")
    p.add_argument("--in", dest="in_flag", default=None, help="Path to scan JSONL (alt form).")
    return p


def main(argv: Optional[list] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    in_path_str = args.in_flag or args.in_path
    if not in_path_str:
        print("error: must supply scan JSONL path (positional or --in), or use stdin '-'", file=sys.stderr)
        return 2

    if in_path_str == "-":
        rows = [json.loads(line) for line in sys.stdin if line.strip()]
    else:
        in_path = Path(in_path_str).expanduser()
        if not in_path.exists():
            print(f"error: {in_path} does not exist", file=sys.stderr)
            return 2
        rows = load_rows(in_path)

    if not rows:
        print("No rows loaded.", file=sys.stderr)
        return 0

    unknown_counter: collections.Counter = collections.Counter()

    write_mix = {k: {"1h": 0, "5m": 0} for k in KINDS}
    buckets = {
        k: {
            "le300": {"n": 0, "tok": 0, "usd": 0.0},
            "mid": {"n": 0, "tok": 0, "usd": 0.0},
            "gt3600": {"n": 0, "tok": 0, "usd": 0.0},
        }
        for k in KINDS
    }
    extra_cost_if_all_1h = {k: 0.0 for k in KINDS}
    five_m_tokens = {k: 0 for k in KINDS}
    subagent_gaps = []

    n_rows = 0
    for row in rows:
        n_rows += 1
        tk = kind_of(row)
        rate = base_rate(row.get("model"), unknown_counter)

        c1h = row.get("cache_creation_1h") or 0
        c5m = row.get("cache_creation_5m") or 0
        write_mix[tk]["1h"] += c1h
        write_mix[tk]["5m"] += c5m
        five_m_tokens[tk] += c5m
        extra_cost_if_all_1h[tk] += c5m * (CACHE_WRITE_1H_MULT - CACHE_WRITE_5M_MULT) * rate / 1e6

        if row.get("cache_miss_after_gap"):
            gap = row.get("gap_seconds")
            if gap is not None:
                rebuilt_tok = row.get("cache_creation_input_tokens") or 0
                usd = rebuilt_tok * rate / 1e6
                if gap <= GAP_LE:
                    b = "le300"
                elif gap <= GAP_HI:
                    b = "mid"
                else:
                    b = "gt3600"
                buckets[tk][b]["n"] += 1
                buckets[tk][b]["tok"] += rebuilt_tok
                buckets[tk][b]["usd"] += usd

        if tk == "subagent" and row.get("gap_seconds") is not None:
            subagent_gaps.append(row["gap_seconds"])

    print("=" * 78)
    print("TTL CONTROL REALITY:")
    print("  main            -- 1h TTL by default on Max subscription.")
    print("                     ENABLE_PROMPT_CACHING_1H=1 / FORCE_PROMPT_CACHING_5M=1")
    print("                     can override. ACTIONABLE.")
    print("  subagent /")
    print("  workflow_subagent -- HARDCODED to 5m TTL by Claude Code. NOT")
    print("                     user-configurable. Numbers below are DIAGNOSTIC")
    print("                     ONLY for these kinds -- nothing to flip.")
    print(f"Rows scanned: {n_rows}")
    if unknown_counter:
        total_unknown = sum(unknown_counter.values())
        print(
            f"WARNING: {total_unknown} rows had an unrecognized model, priced at "
            f"the default ${DEFAULT_BASE_RATE}/Mtok: {dict(unknown_counter.most_common(10))}"
        )
    print("=" * 78)
    print()

    print("=== 1) WRITE MIX (cache_creation tokens, 1h vs 5m bucket) ===")
    for k in KINDS:
        tot = write_mix[k]["1h"] + write_mix[k]["5m"]
        if tot == 0:
            print(f"  {k}: no cache-creation writes")
            continue
        print(
            f"  {k}: 1h={write_mix[k]['1h']} ({100*write_mix[k]['1h']/tot:.1f}%)  "
            f"5m={write_mix[k]['5m']} ({100*write_mix[k]['5m']/tot:.1f}%)"
        )
    print()

    print("=== 2) COLD-REBUILD WASTE, bucketed by gap_seconds (cache_miss_after_gap rows) ===")
    for k in KINDS:
        print(f"  {k}:")
        print(f"    <= {GAP_LE}s (dead under 5m too):        "
              f"n={buckets[k]['le300']['n']:5d}  tok={buckets[k]['le300']['tok']:>12}  "
              f"${buckets[k]['le300']['usd']:.2f}")
        print(f"    {GAP_LE}s-{GAP_HI}s (ADDRESSABLE by 1h): "
              f"n={buckets[k]['mid']['n']:5d}  tok={buckets[k]['mid']['tok']:>12}  "
              f"${buckets[k]['mid']['usd']:.2f}")
        print(f"    > {GAP_HI}s (dead either way):           "
              f"n={buckets[k]['gt3600']['n']:5d}  tok={buckets[k]['gt3600']['tok']:>12}  "
              f"${buckets[k]['gt3600']['usd']:.2f}")
    print()

    print("=== 3) COST OF SWITCHING ALL 5m WRITES -> 1h ===")
    for k in KINDS:
        print(f"  {k}: 5m_tokens_written={five_m_tokens[k]}  extra_$_if_switched_to_1h=${extra_cost_if_all_1h[k]:.2f}")
    print()

    print("=== 4) NET of switching to 1h ( = addressable-bucket $ savings - switch cost $ ) ===")
    nets = {}
    for k in KINDS:
        net = buckets[k]["mid"]["usd"] - extra_cost_if_all_1h[k]
        nets[k] = net
        print(
            f"  {k}: addressable_savings=${buckets[k]['mid']['usd']:.2f}  "
            f"switch_cost=${extra_cost_if_all_1h[k]:.2f}  NET=${net:.2f}"
        )
    print()

    print("=== 5) RECOMMENDATION per kind ===")
    for k in KINDS:
        note = ""
        if k != "main":
            note = "  (diagnostic only -- TTL is hardcoded, not user-configurable)"
        verdict = "SWITCH TO 1H" if nets[k] > 0 else "KEEP 5M"
        print(f"  {k}: {verdict} (net=${nets[k]:.2f}){note}")
    print()

    print("=== SUBAGENT gap_seconds DISTRIBUTION (shows how short-lived subagents are) ===")
    stats = pct_stats(subagent_gaps)
    if stats:
        print(
            f"  n={stats['n']}  median={stats['median']:.1f}s  p75={stats['p75']:.1f}s  "
            f"p95={stats['p95']:.1f}s  mean={stats['mean']:.1f}s  max={stats['max']:.1f}s"
        )
    else:
        print("  no subagent rows with gap_seconds present")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
