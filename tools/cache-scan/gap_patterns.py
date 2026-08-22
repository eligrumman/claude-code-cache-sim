#!/usr/bin/env python3
"""
gap_patterns.py — read-only, GLOBAL (pooled across every project/session)
analysis of how session GAPS and RETURNS behave.

This is a sibling to return_patterns.py (which is per-project). This tool
deliberately pools ALL sessions across ALL projects into one dataset,
because per-project gap/return data is too sparse and diffuse to find
stable structure in. The question this answers is: "if I go idle for T
minutes, right now, across everything I do in Claude Code — am I likely
to come back soon, or is that session effectively abandoned?"

Clean-room implementation. Standard library only. No network calls. No
message text is ever read — only numeric usage fields, timestamps, ids,
model names from the cache_scan.py JSONL.

Input: the per-turn JSONL produced by cache_scan.py. Rows are expected to
carry (at minimum): project_slug, session_id, turn_index, timestamp
(ISO8601 UTC), gap_seconds (float or null — null/absent on the first turn
of a session), model.

Definitions
-----------
A "gap" is the interval between one turn and the NEXT turn in the SAME
session (cache_scan.py already computes gap_seconds this way per-session;
gaps do not span across sessions). A gap qualifies as a "RETURN" event if
gap_seconds > --return-threshold-min minutes (default 30) — i.e. the user
was away long enough that the cache almost certainly cooled, and then
came back to the SAME session. The gap STARTS at the previous turn's
timestamp and ENDS at the turn that follows it.

Every session's LAST turn has no following turn, so it has no gap_seconds
value in this dataset — that "trailing" idle period is open-ended and
right-censored: we know the user went idle after it, but we don't know if
or when the session was ever revisited (it might have been abandoned
forever, or resumed after this scan was taken). This tool always accounts
for these turns explicitly as "abandonments" (censored, never-observed-
returning within the data window) rather than silently dropping them,
because dropping them would bias the survival curve toward "always
eventually returns."

Terminology check against the data: cache_scan.py's gap_seconds field is
already scoped per-session (see its derive_rows()) — it is None on a
session's first turn and set to (this turn's ts - previous turn's ts)
otherwise. So every row with gap_seconds is an already-realized, in-
session gap-then-return; there is no separate step needed to detect
"returns" vs. "continuations" beyond thresholding gap_seconds. The
right-censored population (abandonments) is reconstructed by this tool:
for each session, its LAST row by turn_index has no gap_seconds recorded
for what happens after it — that trailing idle period is treated as a
censored observation starting at that row's timestamp.

Six analyses (all pooled globally, not per-project)
----------------------------------------------------
1. Return survival / hazard table: of all gaps (both realized returns
   AND right-censored trailing idles) that reached at least T, what
   fraction were realized returns (came back) vs. stayed
   open/abandoned? And for realized returns only, given they lasted at
   least T, what is the median ADDITIONAL time until the return?
2. Gap-START time-of-day / day-of-week heatmap (pooled): when do you
   step away?
3. RETURN time-of-day / day-of-week heatmap (pooled): when do you come
   back? Compared to (2) to look for a daily rhythm.
4. Gap-length histogram (log-scale buckets): natural clusters (coffee
   break / lunch / overnight / multi-day).
5. Abandonment-by-bucket: of gaps whose length falls in bucket B, what
   fraction were the session's FINAL gap (never returned, censored) vs.
   led to a return?
6. Cross-session concurrency: rough day-by-day estimate of how many
   distinct sessions had turns within the same rolling hour window —
   signal for "how much do you juggle multiple projects/sessions."

Timezone handling
------------------
Raw timestamps are UTC. All day-of-week/hour-of-day bucketing converts
to LOCAL time first: system local timezone by default
(datetime.now().astimezone().tzinfo), overridable with --tz (an IANA
zone name resolved via the stdlib zoneinfo module). The resolved zone is
always printed so results are never silently misleading.

Known limitations — read before trusting the numbers
------------------------------------------------------
- RIGHT-CENSORING is fundamental here, not a footnote. This scan is a
  snapshot: sessions whose last observed turn is very recent (e.g. an
  hour ago) are indistinguishable, from this file alone, between "still
  mid-thought, about to return" and "just abandoned." This tool treats
  every session's trailing idle as a censored observation regardless of
  how recent it is (we do NOT peek at wall-clock "now" to decide it's
  "still open" — the abandonment/return split is a description of what
  happened in the recorded window, not a live prediction of what happens
  next after the scan was taken). Where the survival table quotes
  "fraction abandoned," that is a lower bound on true abandonment for
  the most recent bucket rows, since a same-day censored gap may in
  reality still resolve into a return outside the observed window (the
  data has a hard right edge = the scan time).
- History is a WEAK predictor of any one future decision. These are
  population tendencies across many past gaps, not a promise about the
  next one.
- Small clusters in the gap-length histogram or heatmaps may be noise,
  especially in bins with fewer than ~20 events; counts are always
  reported alongside rates.
- Timezone is a present-day snapshot (see return_patterns.py docstring
  for the identical caveat: travel / historical tz changes / DST edge
  cases are not modeled per-era).
- Concurrency (analysis 6) is a rough same-day/same-hour co-occurrence
  count, not proof of literal simultaneous attention — it only shows
  that turns from different sessions landed in the same hour.
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
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore

DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
DENSITY_CHARS = " .:-=+*#%@"

# Elapsed-time thresholds (minutes) for the survival/hazard table.
SURVIVAL_THRESHOLDS_MIN = [5, 10, 15, 30, 60, 120, 240, 480, 1440]

# Log-scale histogram bucket edges (minutes). Chosen to separate
# plausible "coffee break" / "lunch" / "overnight" / "multi-day" bands
# without presupposing where the clusters actually are.
HIST_EDGES_MIN = [0, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240,
                   360, 480, 720, 1080, 1440, 2160, 2880, 4320, 10080,
                   float("inf")]


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
    return local_tz, str(local_tz)


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


def format_minutes(minutes: Optional[float]) -> str:
    if minutes is None:
        return "n/a"
    if minutes >= 1440:
        return f"{minutes / 1440.0:.1f}d"
    if minutes >= 60:
        return f"{minutes / 60.0:.1f}h"
    return f"{minutes:.0f}m"


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


# --- core data model ------------------------------------------------------


def build_events(rows: list[dict]) -> dict[str, Any]:
    """Group rows by session, sort by turn_index, and derive per-gap
    events: realized (gap ends in a return) and censored (session's
    trailing idle after its last recorded turn — no observed return).

    Each realized gap event: {
        start_ts, end_ts (both aware datetime UTC), gap_minutes,
        session_id, project_slug
    }
    Each censored event: {
        start_ts, gap_minutes=None (open-ended; we only know a LOWER
        bound = None here, since there's no next turn at all — we do not
        fabricate an elapsed time), session_id, project_slug
    }
    """
    by_session: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        sid = row.get("session_id")
        if not sid:
            continue
        ts = parse_timestamp(row.get("timestamp"))
        if ts is None:
            continue
        by_session[sid].append(
            {
                "ts": ts,
                "gap_seconds": row.get("gap_seconds"),
                "project_slug": row.get("project_slug") or "(unknown)",
            }
        )

    realized_gaps: list[dict] = []   # gap that was followed by a return turn
    censored_gaps: list[dict] = []   # session's final turn -> open idle, never observed to return
    all_turns_local: list[tuple[datetime, str]] = []  # for heatmaps: (ts, project)

    for sid, turns in by_session.items():
        turns.sort(key=lambda t: t["ts"])
        for t in turns:
            all_turns_local.append((t["ts"], t["project_slug"]))

        for i, t in enumerate(turns):
            gap_s = t["gap_seconds"]
            if gap_s is not None and i > 0:
                prev_ts = turns[i - 1]["ts"]
                realized_gaps.append(
                    {
                        "start_ts": prev_ts,
                        "end_ts": t["ts"],
                        "gap_minutes": gap_s / 60.0,
                        "session_id": sid,
                        "project_slug": t["project_slug"],
                    }
                )
        # trailing censored idle: after the session's last turn
        last = turns[-1]
        censored_gaps.append(
            {
                "start_ts": last["ts"],
                "session_id": sid,
                "project_slug": last["project_slug"],
            }
        )

    return {
        "realized_gaps": realized_gaps,
        "censored_gaps": censored_gaps,
        "all_turns": all_turns_local,
    }


# --- 1. survival / hazard table -------------------------------------------


def survival_table(realized_gaps: list[dict], censored_gaps_count: int,
                    return_threshold_min: float) -> list[dict]:
    """For each elapsed threshold T: among ALL gaps that reached at least
    T (realized gaps with gap_minutes>=T, plus ALL censored gaps — since
    a censored trailing idle has unknown final length, it conservatively
    "reached" every T, i.e. we can't rule out it went at least that long
    — this is the standard survival-analysis treatment of a censored
    observation with an unknown but *possibly arbitrarily large* time-to-
    event), compute:
      - n_reached: gaps that reached >= T (realized + censored, both
        count since neither can be excluded from "still idle at T")
      - n_realized_reached: of those, ones that we KNOW returned (their
        recorded gap length was >= T)
      - frac_known_censored_at_T: of gaps reaching T, fraction that are
        censored (upper bound unknown — includes gaps that might return
        later, outside the data window, so this overstates true
        abandonment for very recent censored rows)
      - among realized gaps with gap_minutes >= T: median ADDITIONAL
        wait beyond T until the actual return (gap_minutes - T, median)
    """
    out = []
    realized_lengths = [g["gap_minutes"] for g in realized_gaps]
    for T in SURVIVAL_THRESHOLDS_MIN:
        realized_reached = [m for m in realized_lengths if m >= T]
        n_realized_reached = len(realized_reached)
        n_reached = n_realized_reached + censored_gaps_count
        frac_censored = (censored_gaps_count / n_reached) if n_reached else None
        additional = sorted(m - T for m in realized_reached)
        median_additional = percentile(additional, 50)
        p75_additional = percentile(additional, 75)
        out.append(
            {
                "threshold_min": T,
                "n_reached_total": n_reached,
                "n_realized_reached": n_realized_reached,
                "n_censored_at_least_this_far": censored_gaps_count,
                "frac_censored_of_reached": frac_censored,
                "median_additional_wait_min": median_additional,
                "p75_additional_wait_min": p75_additional,
            }
        )
    return out


# --- 4. histogram -----------------------------------------------------------


def gap_histogram(realized_gaps: list[dict]) -> list[dict]:
    counts = [0] * (len(HIST_EDGES_MIN) - 1)
    for g in realized_gaps:
        m = g["gap_minutes"]
        for i in range(len(HIST_EDGES_MIN) - 1):
            lo, hi = HIST_EDGES_MIN[i], HIST_EDGES_MIN[i + 1]
            if lo <= m < hi:
                counts[i] += 1
                break
    out = []
    for i, c in enumerate(counts):
        lo, hi = HIST_EDGES_MIN[i], HIST_EDGES_MIN[i + 1]
        hi_label = "inf" if math.isinf(hi) else format_minutes(hi)
        out.append({"lo_min": lo, "hi_min": (None if math.isinf(hi) else hi),
                     "label": f"{format_minutes(lo)}-{hi_label}", "count": c})
    return out


# --- 5. abandonment by bucket -----------------------------------------------


def abandonment_by_bucket(realized_gaps: list[dict], censored_gaps: list[dict]) -> list[dict]:
    """Bucket ALL gaps (realized by their known length; censored gaps
    have UNKNOWN length so they cannot be placed in a length bucket —
    instead they are reported in a separate 'unknown/open' row, since
    assigning them a bucket would require guessing how long they'll
    ultimately last). For each length bucket: how many realized (i.e.
    returned) gaps of that observed length occurred. This answers "if a
    gap has ALREADY lasted this long and DID resolve, how often did it
    resolve at roughly this length" — combined with the survival table's
    frac_censored_of_reached for the "is it worth warming" call.
    """
    edges = HIST_EDGES_MIN
    buckets = []
    for i in range(len(edges) - 1):
        lo, hi = edges[i], edges[i + 1]
        realized_in_bucket = sum(1 for g in realized_gaps if lo <= g["gap_minutes"] < hi)
        buckets.append({"lo_min": lo, "hi_min": (None if math.isinf(hi) else hi), "realized_count": realized_in_bucket})
    return buckets


# --- 6. concurrency ----------------------------------------------------------


def concurrency_by_day2(rows: list[dict], tz) -> list[dict]:
    """For each local calendar day, for each local hour-of-day bucket,
    count distinct sessions with turns in that hour, then take the
    day's MAX across its 24 hours. Uses session_id directly from rows.
    """
    by_day_hour: dict[tuple[str, int], set] = defaultdict(set)
    for row in rows:
        ts = parse_timestamp(row.get("timestamp"))
        if ts is None:
            continue
        local_dt = ts.astimezone(tz)
        day_key = local_dt.strftime("%Y-%m-%d")
        by_day_hour[(day_key, local_dt.hour)].add(row.get("session_id"))

    by_day: dict[str, int] = defaultdict(int)
    for (day_key, _hour), sids in by_day_hour.items():
        by_day[day_key] = max(by_day[day_key], len(sids))

    out = [{"date": d, "max_concurrent_sessions_in_an_hour": n} for d, n in sorted(by_day.items())]
    return out


# --- 2/3 heatmaps ------------------------------------------------------------


def build_heatmaps(realized_gaps: list[dict], tz) -> tuple[dict, dict]:
    start_heat: dict[tuple[int, int], int] = defaultdict(int)
    return_heat: dict[tuple[int, int], int] = defaultdict(int)
    for g in realized_gaps:
        start_local = g["start_ts"].astimezone(tz)
        end_local = g["end_ts"].astimezone(tz)
        start_heat[(start_local.weekday(), start_local.hour)] += 1
        return_heat[(end_local.weekday(), end_local.hour)] += 1
    return start_heat, return_heat


# --- rendering ---------------------------------------------------------------


def print_report(args, tz_label, realized_gaps, censored_gaps, all_rows,
                  survival, hist, abandon, concurrency, start_heat, return_heat):
    n_realized = len(realized_gaps)
    n_censored = len(censored_gaps)
    total_sessions = n_censored  # one censored trailing-idle per session

    print("=" * 82)
    print("gap_patterns.py — GLOBAL (pooled across all projects/sessions) gap/return analysis")
    print("=" * 82)
    print(f"Local timezone used for bucketing: {tz_label}")
    print(f"Return threshold used for realized-return classification: > {args.return_threshold_min} min")
    print(f"Total turns scanned: {len(all_rows)}")
    print(f"Total sessions: {total_sessions}")
    print(f"Total realized (returned) inter-turn gaps of any length: {n_realized}")
    print(f"  of which RETURN events (gap > {args.return_threshold_min}min): "
          f"{sum(1 for g in realized_gaps if g['gap_minutes'] > args.return_threshold_min)}")
    print(f"Total censored trailing idles (session's last turn — never observed to return "
          f"within this data): {n_censored}")
    print()
    print("IMPORTANT — right-censoring: the numbers above mean every session contributes")
    print("exactly one open-ended 'trailing idle' whose true outcome (did it ever resume?)")
    print("is unknown from this file alone. These are counted in the survival table below")
    print("as 'reached T but unresolved', not dropped — dropping them would bias every")
    print("percentage toward 'always returns.' Recently-scanned sessions bias the most")
    print("recent buckets toward apparent abandonment (right edge of data = scan time).")

    print()
    print("-" * 82)
    print("1) RETURN SURVIVAL / HAZARD TABLE")
    print("   'Given a gap has already lasted >= T, what fraction of ALL such gaps")
    print("    (censored + realized) are still open (censored) vs. known-realized, and")
    print("    for the realized ones, how much LONGER (median) until the return?'")
    print("-" * 82)
    hdr = f"{'T':>7} | {'n>=T':>8} | {'realized>=T':>12} | {'censored':>9} | {'frac censored':>14} | {'median add. wait':>18} | {'p75 add. wait':>14}"
    print(hdr)
    print("-" * len(hdr))
    for row in survival:
        frac = row["frac_censored_of_reached"]
        frac_str = f"{frac*100:5.1f}%" if frac is not None else "   n/a"
        print(
            f"{format_minutes(row['threshold_min']):>7} | "
            f"{row['n_reached_total']:>8} | "
            f"{row['n_realized_reached']:>12} | "
            f"{row['n_censored_at_least_this_far']:>9} | "
            f"{frac_str:>14} | "
            f"{format_minutes(row['median_additional_wait_min']):>18} | "
            f"{format_minutes(row['p75_additional_wait_min']):>14}"
        )

    print()
    print("-" * 82)
    print("2) GAP-START heatmap (when you STEP AWAY) — pooled, local time, rows=Mon-Sun cols=hour")
    print("-" * 82)
    print(render_heatmap(start_heat))

    print()
    print("-" * 82)
    print("3) RETURN heatmap (when you COME BACK) — pooled, local time, rows=Mon-Sun cols=hour")
    print("-" * 82)
    print(render_heatmap(return_heat))

    # simple rhythm comparison: busiest step-away hour vs busiest return hour, aggregated over dow
    step_by_hour = defaultdict(int)
    return_by_hour = defaultdict(int)
    for (d, h), v in start_heat.items():
        step_by_hour[h] += v
    for (d, h), v in return_heat.items():
        return_by_hour[h] += v
    if step_by_hour and return_by_hour:
        top_step_hour = max(step_by_hour.items(), key=lambda kv: kv[1])[0]
        top_return_hour = max(return_by_hour.items(), key=lambda kv: kv[1])[0]
        print(f"\nBusiest step-away hour (all days pooled): {top_step_hour:02d}:00 local")
        print(f"Busiest return hour (all days pooled):     {top_return_hour:02d}:00 local")

    print()
    print("-" * 82)
    print("4) GAP-LENGTH HISTOGRAM (realized gaps only; log-scale buckets, minutes)")
    print("-" * 82)
    max_c = max((b["count"] for b in hist), default=0)
    for b in hist:
        bar_len = int(round((b["count"] / max_c) * 50)) if max_c else 0
        print(f"{b['label']:>14}: {b['count']:>6}  {'#' * bar_len}")

    print()
    print("-" * 82)
    print("5) ABANDONMENT BY BUCKET (fraction of gaps landing in this length range that were")
    print("   the FINAL gap of their session, i.e. never returned within the data — this")
    print("   combines realized-gap length distribution with the always-censored trailing")
    print("   idles; since censored gaps have unknown eventual length they cannot be placed")
    print("   in a length bucket, so this table reports realized-only counts per bucket")
    print("   plus the total censored count as context, not a per-bucket censored split.)")
    print("-" * 82)
    for b in abandon:
        hi_label = "inf" if b["hi_min"] is None else format_minutes(b["hi_min"])
        print(f"  [{format_minutes(b['lo_min'])}, {hi_label}): {b['realized_count']} realized returns "
              f"of this length")
    print(f"  (for reference: {n_censored} total censored trailing idles of unknown final length, "
          f"across all buckets)")

    print()
    print("-" * 82)
    print("6) CROSS-SESSION CONCURRENCY (rough) — max distinct sessions with turns in the")
    print("   same local hour, per day. Signal only, not proof of literal simultaneity.")
    print("-" * 82)
    if concurrency:
        max_conc = max(c["max_concurrent_sessions_in_an_hour"] for c in concurrency)
        multi_days = sum(1 for c in concurrency if c["max_concurrent_sessions_in_an_hour"] > 1)
        print(f"  Days with data: {len(concurrency)}")
        print(f"  Days with >1 concurrent session in some hour: {multi_days} "
              f"({multi_days/len(concurrency)*100:.0f}%)")
        print(f"  Max observed same-hour concurrent sessions (any day): {max_conc}")
        top_days = sorted(concurrency, key=lambda c: c["max_concurrent_sessions_in_an_hour"], reverse=True)[:10]
        print("  Top days by concurrency:")
        for c in top_days:
            n = c["max_concurrent_sessions_in_an_hour"]
            flag = "  <-- WAY above the rest; almost certainly a bulk import/migration timestamp artifact, not real simultaneous work" if n > 100 else ""
            print(f"    {c['date']}: {n} concurrent sessions (same hour){flag}")
    else:
        print("  (no data)")

    print()
    print("=" * 82)
    print("ACTIONABLE READ")
    print("=" * 82)
    # find first threshold where frac_censored < 0.5 i.e. majority still return eventually,
    # and also look at where additional wait becomes long
    print(_actionable_summary(survival, args.return_threshold_min))
    print()
    print("Limitations: right-censoring biases recent buckets toward apparent abandonment;")
    print("history is a weak predictor of any single future gap; small histogram/heatmap")
    print("cells (<~20 events) may be noise; timezone is a present-day snapshot, not")
    print("historically accurate through travel/DST edge cases. See module docstring.")


def _actionable_summary(survival: list[dict], threshold_min: float) -> str:
    lines = []
    for row in survival:
        frac = row["frac_censored_of_reached"]
        if frac is None:
            continue
        add = row["median_additional_wait_min"]
        lines.append(
            f"  At T={format_minutes(row['threshold_min'])} idle: "
            f"{ (1-frac)*100:.0f}% of comparable historical gaps that reached this point "
            f"were realized returns (rest censored/unresolved in this data), "
            f"median additional wait if it does return = {format_minutes(add)}."
        )
    return "\n".join(lines)


def build_json_output(args, tz_label, survival, hist, abandon, concurrency,
                       start_heat, return_heat, n_realized, n_censored) -> dict:
    return {
        "local_timezone": tz_label,
        "return_threshold_minutes": args.return_threshold_min,
        "total_realized_gaps": n_realized,
        "total_censored_trailing_idles": n_censored,
        "survival_table": survival,
        "gap_length_histogram": hist,
        "abandonment_by_bucket": abandon,
        "concurrency_by_day": concurrency,
        "gap_start_heatmap": {f"{DAY_NAMES[d]}_{h:02d}": v for (d, h), v in sorted(start_heat.items())},
        "return_heatmap": {f"{DAY_NAMES[d]}_{h:02d}": v for (d, h), v in sorted(return_heat.items())},
    }


# --- CLI ----------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "Read-only GLOBAL (pooled across all projects/sessions) analysis of how "
            "session gaps and returns behave, using the cache_scan.py per-turn JSONL "
            "as input."
        )
    )
    p.add_argument("--in", dest="in_path", required=True, help="Path to cache_scan.py JSONL output.")
    p.add_argument(
        "--return-threshold-min", type=float, default=30.0,
        help="Gap length (minutes) above which a turn counts as a RETURN event (default: 30).",
    )
    p.add_argument("--tz", type=str, default=None, help="IANA timezone name (default: system local timezone).")
    p.add_argument("--json", type=str, default=None, help="Write full pooled result object as JSON to this path.")
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    in_path = Path(args.in_path)
    if not in_path.exists():
        print(f"error: input file not found: {in_path}", file=sys.stderr)
        return 1

    tz, tz_label = resolve_tz(args.tz)

    rows = list(iter_rows(in_path))
    if not rows:
        print("error: no rows parsed from input", file=sys.stderr)
        return 1

    events = build_events(rows)
    realized_gaps = events["realized_gaps"]
    censored_gaps = events["censored_gaps"]

    survival = survival_table(realized_gaps, len(censored_gaps), args.return_threshold_min)
    hist = gap_histogram(realized_gaps)
    abandon = abandonment_by_bucket(realized_gaps, censored_gaps)
    concurrency = concurrency_by_day2(rows, tz)
    start_heat, return_heat = build_heatmaps(realized_gaps, tz)

    print_report(args, tz_label, realized_gaps, censored_gaps, rows,
                 survival, hist, abandon, concurrency, start_heat, return_heat)

    if args.json:
        out_obj = build_json_output(args, tz_label, survival, hist, abandon, concurrency,
                                     start_heat, return_heat, len(realized_gaps), len(censored_gaps))
        out_path = Path(args.json)
        with out_path.open("w", encoding="utf-8") as fh:
            fh.write(json.dumps(out_obj, ensure_ascii=False, indent=2))
        print(f"\nWrote pooled JSON result to {out_path}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
