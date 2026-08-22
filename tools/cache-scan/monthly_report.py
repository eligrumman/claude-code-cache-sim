#!/usr/bin/env python3
"""
monthly_report.py -- per-calendar-month cost table from cache_scan.py's
JSONL output.

Standard library only. No network calls.

For each YYYY-MM (by turn timestamp), computes:
  uncached_$   = input_tokens*base/1e6
               + cache_creation_5m*CACHE_WRITE_5M_MULT*base/1e6
               + cache_creation_1h*CACHE_WRITE_1H_MULT*base/1e6
  cache_read_$ = cache_read_input_tokens*CACHE_READ_MULTIPLIER*base/1e6
  total_$      = uncached_$ + cache_read_$
  recoverable_$ (GROSS) = for rows where cache_miss_after_gap is true:
      (input_tokens + cache_creation_input_tokens) * base/1e6 * 0.9
      else 0
  rec%         = recoverable_$ / total_$

recoverable_$ is a GROSS figure: the dollar value of cold-rebuild tokens
that a warm cache would have avoided, BEFORE subtracting the cost of the
keep-warm pings that would have been needed to actually hold the cache
open. It is NOT a net savings estimate -- for a NET (post-warming-cost)
per-session projection, see calibrate.py in this same directory.

Same pricing constants and model-rate lookup as calibrate.py: base rates
opus/opus5=$5, fable5=$10, sonnet/sonnet5=$3, haiku=$1/Mtok; unknown
models default to $5/Mtok, with a printed count of how many rows hit the
unknown-model default so silent mispricing is visible, not hidden.
"""

from __future__ import annotations

import argparse
import calendar
import collections
import json
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
DEFAULT_BASE_RATE = 5.0  # applied to unknown models; counted and reported

KINDS = ("main", "subagent", "workflow_subagent")


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


def kind_of(row: dict) -> str:
    tk = row.get("transcript_kind")
    if tk in KINDS:
        return tk
    return "subagent" if row.get("is_subagent") else "main"


def new_bucket() -> dict:
    return {"uncached": 0.0, "read": 0.0, "recoverable": 0.0}


def month_end_day(month: str) -> int:
    year, mon = (int(x) for x in month.split("-"))
    return calendar.monthrange(year, mon)[1]


def accumulate(row: dict, bucket: dict, unknown_counter: collections.Counter) -> None:
    base = base_rate(row.get("model"), unknown_counter)

    input_tokens = row.get("input_tokens") or 0
    cache_read = row.get("cache_read_input_tokens") or 0
    c5m = row.get("cache_creation_5m") or 0
    c1h = row.get("cache_creation_1h") or 0
    ccreate = row.get("cache_creation_input_tokens") or 0

    uncached = (
        input_tokens * base / 1e6
        + c5m * CACHE_WRITE_5M_MULT * base / 1e6
        + c1h * CACHE_WRITE_1H_MULT * base / 1e6
    )
    cache_read_dollar = cache_read * CACHE_READ_MULTIPLIER * base / 1e6

    recoverable = 0.0
    if row.get("cache_miss_after_gap") is True:
        recoverable = (input_tokens + ccreate) * base / 1e6 * 0.9

    bucket["uncached"] += uncached
    bucket["read"] += cache_read_dollar
    bucket["recoverable"] += recoverable


def print_table(title: str, rows_by_key, key_order, total_label="TOTAL", indent=""):
    print(f"{indent}{title}")
    header = f"{indent}{'Month':10} {'Uncached$':>12} {'CacheRead$':>12} {'Total$':>12} {'Recoverable$':>14} {'Rec%':>7}"
    print(header)
    tot = new_bucket()
    for k in key_order:
        d = rows_by_key[k]
        total = d["uncached"] + d["read"]
        pct = (d["recoverable"] / total * 100) if total else 0.0
        print(
            f"{indent}{k:10} {d['uncached']:12.2f} {d['read']:12.2f} {total:12.2f} "
            f"{d['recoverable']:14.2f} {pct:6.2f}%"
        )
        tot["uncached"] += d["uncached"]
        tot["read"] += d["read"]
        tot["recoverable"] += d["recoverable"]
    total_all = tot["uncached"] + tot["read"]
    pct = (tot["recoverable"] / total_all * 100) if total_all else 0.0
    print(
        f"{indent}{total_label:10} {tot['uncached']:12.2f} {tot['read']:12.2f} {total_all:12.2f} "
        f"{tot['recoverable']:14.2f} {pct:6.2f}%"
    )
    print()


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "Per-calendar-month cost table from cache_scan.py JSONL output. "
            "recoverable_$ is GROSS (before keep-warm overhead) -- see calibrate.py for NET."
        )
    )
    p.add_argument("in_path", nargs="?", default=None, help="Path to scan JSONL (positional).")
    p.add_argument("--in", dest="in_flag", default=None, help="Path to scan JSONL (alt form).")
    p.add_argument(
        "--by-kind",
        action="store_true",
        help="Additionally split each month by transcript_kind (main/subagent/workflow_subagent).",
    )
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

    months: dict = collections.defaultdict(new_bucket)
    months_by_kind: dict = collections.defaultdict(lambda: collections.defaultdict(new_bucket))
    max_ts_by_month: dict = {}

    for row in rows:
        ts = row.get("timestamp") or ""
        month = ts[:7] if len(ts) >= 7 else "unknown"
        day = ts[:10] if len(ts) >= 10 else None

        accumulate(row, months[month], unknown_counter)
        if args.by_kind:
            accumulate(row, months_by_kind[month][kind_of(row)], unknown_counter)

        if day:
            prev = max_ts_by_month.get(month)
            if prev is None or day > prev:
                max_ts_by_month[month] = day

    ordered_months = sorted(m for m in months if m != "unknown")

    print("=" * 78)
    print("recoverable_$ is GROSS: dollar value of cache_miss_after_gap rebuild")
    print("tokens, BEFORE subtracting keep-warm ping overhead. For a NET")
    print("(post-warming-cost) per-session projection, use calibrate.py.")
    print(f"Pricing: opus/opus5=$5 fable5=$10 sonnet/sonnet5=$3 haiku=$1 per Mtok;")
    print(f"cache_read={CACHE_READ_MULTIPLIER}x write_5m={CACHE_WRITE_5M_MULT}x write_1h={CACHE_WRITE_1H_MULT}x")
    if unknown_counter:
        total_unknown = sum(unknown_counter.values())
        print(
            f"WARNING: {total_unknown} rows had an unrecognized model and were priced "
            f"at the default ${DEFAULT_BASE_RATE}/Mtok: {dict(unknown_counter.most_common(10))}"
        )
    print("=" * 78)
    print()

    # flag last month as PARTIAL if data doesn't reach month-end
    last_label_map = {}
    for m in ordered_months:
        label = m
        if m == ordered_months[-1]:
            last_day_seen = max_ts_by_month.get(m)
            if last_day_seen:
                seen_day_num = int(last_day_seen[8:10])
                if seen_day_num < month_end_day(m):
                    label = f"{m}*"
        last_label_map[m] = label

    display_months = {last_label_map[m]: months[m] for m in ordered_months}
    display_order = [last_label_map[m] for m in ordered_months]

    print_table("=== Monthly cost table ===", display_months, display_order)
    if display_order and display_order[-1].endswith("*"):
        print("(*) partial month -- last observed day does not reach month-end.")
        print()

    if "unknown" in months:
        d = months["unknown"]
        print(f"Rows with unparseable/missing timestamp (excluded from table above): "
              f"uncached=${d['uncached']:.2f} read=${d['read']:.2f} recoverable=${d['recoverable']:.2f}")
        print()

    if args.by_kind:
        print("=== Per-month breakdown by transcript_kind ===")
        for m in ordered_months:
            label = last_label_map[m]
            by_kind = months_by_kind[m]
            present_kinds = [k for k in KINDS if k in by_kind]
            if not present_kinds:
                continue
            print_table(f"-- {label} --", by_kind, present_kinds, total_label="  kind-total", indent="  ")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
