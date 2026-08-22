#!/usr/bin/env python3
"""
return_patterns.py — read-only temporal-return-pattern analyzer, per project.

Answers: "At what times of the week is the user likely to RETURN to and
continue a session, broken down PER PROJECT?" This is the
temporal-return-pattern piece of a cache keep-warm analyzer.

Clean-room implementation — does not import or copy from token-optimizer.

Standard library only. No network calls. No message text is ever read.

Input: the per-turn JSONL produced by cache_scan.py (one JSON object per
line). Rows are expected to carry (at minimum): project_slug, session_id,
turn_index, timestamp (ISO8601 UTC, e.g. "2026-06-03T17:00:53.682Z"),
gap_seconds (float or null), model. Any other fields present in the row
are ignored.

Two different events are modeled separately:
  - a "continuation" turn: gap_seconds is small/absent — the session was
    already in active use.
  - a "RETURN" event: gap_seconds > --return-threshold-min minutes — the
    user came BACK to this project after being away. These are the events
    that predict future returns; they are what a cache-warmer should aim
    a ping at ahead of.

Per project_slug this tool computes:
  1. A 7x24 (day-of-week x hour-of-day) heatmap of ALL turns, in LOCAL
     time (see --tz below).
  2. A separate 7x24 heatmap of RETURN events only.
  3. The top (day, hour) windows ranked by return-event frequency.
  4. Median / p75 gap length of return events, total return-event count,
     and recency (hours since the project's last turn).
  5. A predictability/concentration score over the return heatmap: how
     much of the project's return mass sits in its busiest few cells vs.
     spread evenly across all 168. High concentration => predictable =>
     a good keep-warm candidate (you can aim pings at specific windows).
     Low concentration => diffuse => warming would need to run
     continuously to catch returns, which is wasteful.

Timezone handling: raw timestamps in the scan JSONL are UTC. Weekly
day/hour patterns are meaningless in UTC unless the user happens to live
there, so every timestamp is converted to a LOCAL timezone before
bucketing. The local zone defaults to the machine's system local
timezone (datetime.now().astimezone().tzinfo) and can be overridden with
--tz (an IANA zone name, e.g. "Asia/Jerusalem" or "America/New_York"),
resolved via the stdlib zoneinfo module. The resolved zone is printed/
recorded in the output so results are never silently misleading.

Known limitations (see README for the full discussion):
  - A tz-naive "system local zone" is a snapshot at run time; it does not
    account for the user traveling or changing timezone over the period
    the data spans, nor for daylight-saving transitions being applied
    retroactively to a fixed offset in edge cases (zoneinfo handles DST
    correctly per-instant, but a session that itself spans a DST
    transition, or was conducted while traveling, will still be bucketed
    under whatever offset applies to that exact instant in the chosen
    zone — which may not be the zone the user was physically in at the
    time).
  - Small-sample projects (few return events) produce noisy heatmaps and
    unstable "top windows" / concentration scores; a minimum count is
    not enforced by this tool, but the return-event count is always
    reported so the reader can judge confidence for themselves.
  - A historical return-time pattern is a WEAK predictor of any single
    future return; it describes a tendency across the sampled history,
    not a scheduled commitment. Use it to bias warm-ping timing
    probabilistically, not as a guarantee.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - py3.9 always has zoneinfo
    ZoneInfo = None  # type: ignore

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
DENSITY_CHARS = " .:-=+*#%@"


# --- parsing ----------------------------------------------------------------


def parse_timestamp(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def resolve_tz(name: Optional[str]):
    if name:
        if ZoneInfo is None:
            raise SystemExit("zoneinfo module unavailable; cannot resolve --tz")
        try:
            return ZoneInfo(name), name
        except Exception as exc:
            raise SystemExit(f"could not resolve --tz {name!r}: {exc}")
    local_tz = datetime.now().astimezone().tzinfo
    label = str(local_tz)
    return local_tz, label


def iter_rows(path: Path):
    with path.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


# --- stats helpers ------------------------------------------------------


def percentile(sorted_vals: list[float], pct: float) -> Optional[float]:
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    k = (len(sorted_vals) - 1) * (pct / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_vals[int(k)]
    d0 = sorted_vals[f] * (c - k)
    d1 = sorted_vals[c] * (k - f)
    return d0 + d1


def format_gap(seconds: Optional[float]) -> str:
    if seconds is None:
        return "n/a"
    hours = seconds / 3600.0
    if hours >= 1:
        return f"{hours:.1f}h"
    return f"{seconds / 60.0:.0f}m"


def concentration_score(heat: dict[tuple[int, int], int], top_k: int = 5) -> tuple[float, str]:
    """Fraction of total return-event mass held by the busiest `top_k`
    cells out of the 168 (day, hour) cells. 1.0 = all returns land in
    top_k cells (maximally predictable / concentrated); ~top_k/168 = flat
    /uniform distribution (diffuse / unpredictable). This is a simple
    concentration ratio, not full entropy, chosen for interpretability:
    "the top 5 hourly windows account for X% of historical returns."
    """
    total = sum(heat.values())
    if total == 0:
        return 0.0, "no return events"
    top = sorted(heat.values(), reverse=True)[:top_k]
    ratio = sum(top) / total
    uniform_ratio = min(top_k, len(heat) if heat else 168) / 168.0
    if ratio >= 0.5:
        label = "CONCENTRATED (predictable — good warm candidate)"
    elif ratio >= 0.25:
        label = "MODERATE"
    else:
        label = "DIFFUSE (unpredictable — warming likely wastes pings)"
    return ratio, f"{label}; top-{top_k} cells hold {ratio*100:.0f}% of returns (uniform baseline {uniform_ratio*100:.0f}%)"


# --- core analysis --------------------------------------------------------


def analyze(rows: list[dict], tz, return_threshold_seconds: float, now: datetime):
    by_project: dict[str, dict[str, Any]] = {}

    for row in rows:
        slug = row.get("project_slug") or "(unknown)"
        ts = parse_timestamp(row.get("timestamp"))
        if ts is None:
            continue
        local_dt = ts.astimezone(tz)
        dow = local_dt.weekday()  # 0=Mon
        hour = local_dt.hour

        proj = by_project.setdefault(
            slug,
            {
                "all_heat": defaultdict(int),
                "return_heat": defaultdict(int),
                "return_gaps": [],
                "total_turns": 0,
                "last_ts_utc": None,
            },
        )
        proj["total_turns"] += 1
        proj["all_heat"][(dow, hour)] += 1

        if proj["last_ts_utc"] is None or ts > proj["last_ts_utc"]:
            proj["last_ts_utc"] = ts

        gap = row.get("gap_seconds")
        if gap is not None and gap > return_threshold_seconds:
            proj["return_heat"][(dow, hour)] += 1
            proj["return_gaps"].append(gap)

    results = []
    for slug, d in by_project.items():
        gaps_sorted = sorted(d["return_gaps"])
        median_gap = percentile(gaps_sorted, 50)
        p75_gap = percentile(gaps_sorted, 75)
        return_count = len(gaps_sorted)

        recency_hours = None
        if d["last_ts_utc"] is not None:
            recency_hours = (now - d["last_ts_utc"]).total_seconds() / 3600.0

        top_windows = sorted(
            d["return_heat"].items(), key=lambda kv: kv[1], reverse=True
        )[:1000]  # trimmed to --top-windows later

        ratio, concentration_label = concentration_score(d["return_heat"])

        results.append(
            {
                "project_slug": slug,
                "total_turns": d["total_turns"],
                "return_event_count": return_count,
                "median_return_gap_seconds": median_gap,
                "p75_return_gap_seconds": p75_gap,
                "recency_hours": recency_hours,
                "concentration_ratio": ratio,
                "concentration_label": concentration_label,
                "top_windows_raw": top_windows,
                "all_heat": d["all_heat"],
                "return_heat": d["return_heat"],
            }
        )

    results.sort(key=lambda r: r["total_turns"], reverse=True)
    return results


# --- rendering --------------------------------------------------------------


def window_label(day: int, hour: int) -> str:
    end_hour = (hour + 1) % 24
    return f"{DAY_NAMES[day]} {hour:02d}:00-{end_hour:02d}:00"


def render_heatmap(heat: dict[tuple[int, int], int]) -> str:
    max_v = max(heat.values()) if heat else 0
    lines = []
    header = "      " + "".join(f"{h % 10}" for h in range(24))
    lines.append(header)
    for dow in range(7):
        row_chars = []
        for hour in range(24):
            v = heat.get((dow, hour), 0)
            if max_v == 0:
                idx = 0
            else:
                idx = int(round((v / max_v) * (len(DENSITY_CHARS) - 1)))
            row_chars.append(DENSITY_CHARS[idx])
        lines.append(f"{DAY_NAMES[dow]}   " + "".join(row_chars))
    return "\n".join(lines)


def print_report(results: list[dict], tz_label: str, top_projects: int, top_windows: int, threshold_min: float):
    print(f"Local timezone used for bucketing: {tz_label}")
    print(f"Return threshold: gap_seconds > {threshold_min} minutes")
    print(f"Projects analyzed: {len(results)} (showing top {min(top_projects, len(results))} by turn volume)")
    print("=" * 78)

    for proj in results[:top_projects]:
        print(f"\nPROJECT: {proj['project_slug']}")
        print(f"  total turns: {proj['total_turns']}")
        print(f"  return events (gap > threshold): {proj['return_event_count']}")
        print(
            f"  return gap length: median={format_gap(proj['median_return_gap_seconds'])} "
            f"p75={format_gap(proj['p75_return_gap_seconds'])}"
        )
        rec = proj["recency_hours"]
        rec_str = f"{rec:.1f}h ago" if rec is not None else "n/a"
        active_tag = "ACTIVE" if rec is not None and rec <= 24 else "inactive"
        print(f"  last turn: {rec_str} ({active_tag})")
        print(f"  predictability: {proj['concentration_label']}")

        if proj["return_event_count"] == 0:
            print("  (no return events above threshold — nothing to rank)")
        else:
            print(f"  top {top_windows} likely-return windows:")
            for (dow, hour), count in proj["top_windows_raw"][:top_windows]:
                print(f"    - {window_label(dow, hour)}  ({count} return event(s))")

        print("\n  ASCII heatmap — ALL activity (rows=day Mon-Sun, cols=hour 0-23 local):")
        print("  " + render_heatmap(proj["all_heat"]).replace("\n", "\n  "))
        print("\n  ASCII heatmap — RETURN events only:")
        print("  " + render_heatmap(proj["return_heat"]).replace("\n", "\n  "))
        print("-" * 78)


def build_json_output(results: list[dict], top_windows: int, tz_label: str, threshold_min: float) -> list[dict]:
    out = []
    for proj in results:
        out.append(
            {
                "project_slug": proj["project_slug"],
                "local_timezone": tz_label,
                "return_threshold_minutes": threshold_min,
                "total_turns": proj["total_turns"],
                "return_event_count": proj["return_event_count"],
                "median_return_gap_seconds": proj["median_return_gap_seconds"],
                "p75_return_gap_seconds": proj["p75_return_gap_seconds"],
                "recency_hours": proj["recency_hours"],
                "active": (proj["recency_hours"] is not None and proj["recency_hours"] <= 24),
                "concentration_ratio": proj["concentration_ratio"],
                "concentration_label": proj["concentration_label"],
                "top_return_windows": [
                    {"day": DAY_NAMES[d], "hour": h, "label": window_label(d, h), "count": c}
                    for (d, h), c in proj["top_windows_raw"][:top_windows]
                ],
                "all_activity_heatmap": {
                    f"{DAY_NAMES[d]}_{h:02d}": v for (d, h), v in sorted(proj["all_heat"].items())
                },
                "return_event_heatmap": {
                    f"{DAY_NAMES[d]}_{h:02d}": v for (d, h), v in sorted(proj["return_heat"].items())
                },
            }
        )
    return out


# --- CLI ----------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "Read-only per-project analysis of WHEN (day-of-week x hour-of-day, "
            "local time) a user is likely to RETURN to and continue a Claude Code "
            "session, using the cache_scan.py per-turn JSONL as input."
        )
    )
    p.add_argument("--in", dest="in_path", required=True, help="Path to cache_scan.py JSONL output.")
    p.add_argument(
        "--return-threshold-min",
        type=float,
        default=30.0,
        help="Gap length (minutes) above which a turn counts as a RETURN event (default: 30).",
    )
    p.add_argument(
        "--tz",
        type=str,
        default=None,
        help="IANA timezone name to bucket local time into (default: system local timezone).",
    )
    p.add_argument("--top-projects", type=int, default=15, help="Show only the N most-active projects (default: 15).")
    p.add_argument("--top-windows", type=int, default=5, help="Return windows to list per project (default: 5).")
    p.add_argument("--json", type=str, default=None, help="Write per-project pattern objects to this JSONL path.")
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    in_path = Path(args.in_path)
    if not in_path.exists():
        print(f"error: input file not found: {in_path}", file=sys.stderr)
        return 1

    tz, tz_label = resolve_tz(args.tz)
    threshold_seconds = args.return_threshold_min * 60.0
    now = datetime.now(timezone.utc)

    rows = list(iter_rows(in_path))
    if not rows:
        print("error: no rows parsed from input", file=sys.stderr)
        return 1

    results = analyze(rows, tz, threshold_seconds, now)

    print_report(results, tz_label, args.top_projects, args.top_windows, args.return_threshold_min)

    if args.json:
        json_out = build_json_output(results, args.top_windows, tz_label, args.return_threshold_min)
        out_path = Path(args.json)
        with out_path.open("w", encoding="utf-8") as fh:
            for obj in json_out:
                fh.write(json.dumps(obj, ensure_ascii=False) + "\n")
        print(f"\nWrote {len(json_out)} per-project pattern objects to {out_path}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
