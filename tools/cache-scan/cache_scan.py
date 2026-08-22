#!/usr/bin/env python3
"""
cache_scan.py — read-only scanner over Claude Code session transcripts.

Extracts raw per-turn token/cache/timing data needed to (a) calculate
prompt-cache cost and (b) forecast cost for keep-warm calibration.

Standard library only. No network calls. No message TEXT is ever read
into the output — only numeric usage fields, timestamps, ids, and model
names.

Input: ~/.claude/projects/<project-slug>/*.jsonl (Claude Code session
transcripts). Each line is a JSON record. Assistant turns have
"type": "assistant" and token usage at message.usage.

Confirmed schema (verified 2026-08-22 against real transcript files):
  Top-level record fields:
    - type            "assistant" for turns we care about
    - timestamp       ISO8601 UTC, e.g. "2026-06-03T17:00:53.682Z"
    - sessionId       session UUID (matches the .jsonl filename)
    - uuid            this record's own UUID
    - parentUuid      UUID of the parent record in the conversation tree
    - requestId       API request id, e.g. "req_011C..."
    - message         nested object (see below)

  message fields:
    - model           MODEL NAME IS HERE, e.g. "claude-opus-4-8"
                       (message.model — confirmed present on every
                       assistant record inspected)
    - usage           nested object (see below)

  message.usage fields:
    - input_tokens                  uncached, full-price input tokens
    - cache_creation_input_tokens   total tokens written to cache this
                                     turn (sum of the ephemeral buckets
                                     below)
    - cache_read_input_tokens       tokens served from cache this turn
    - output_tokens                 tokens generated this turn
    - cache_creation.ephemeral_1h_input_tokens   portion of the cache
                                     write that went to the 1-hour TTL
                                     bucket
    - cache_creation.ephemeral_5m_input_tokens   portion of the cache
                                     write that went to the 5-minute TTL
                                     bucket

  There is no explicit sequential "turn number" field in the raw data;
  we derive one by sorting each session's assistant records by
  timestamp (falling back to file order on ties) and assigning an
  incrementing index starting at 0. uuid/parentUuid/requestId are
  captured as-is for cross-referencing against the raw transcript if
  needed.

No message/prompt content is ever accessed or emitted — only the
fields enumerated above.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator, Optional

# --- constants ----------------------------------------------------------

# TTL of each cache bucket, used to flag a cold rebuild after an idle gap.
TTL_SECONDS = {
    "1h": 3600,
    "5m": 300,
}

# A cache-creation event below this many tokens is noise (small system
# prompt deltas, tool-def churn, etc.) and should not count as a
# "cache miss after gap" rebuild.
NOISE_FLOOR_TOKENS = 5000

OUTPUT_FIELDS = [
    "project_slug",
    "file_path",
    "session_id",
    "turn_index",
    "uuid",
    "parent_uuid",
    "request_id",
    "timestamp",
    "model",
    "input_tokens",
    "cache_read_input_tokens",
    "cache_creation_input_tokens",
    "cache_creation_1h",
    "cache_creation_5m",
    "output_tokens",
    "gap_seconds",
    "active_ttl_seconds",
    "cache_miss_after_gap",
    "is_subagent",
    "transcript_kind",
]


def classify_transcript(path: Path) -> tuple[bool, str]:
    """Classify a transcript file by its PATH (not isSidechain — ccusage,
    token-optimizer, and Total Recall all ignore isSidechain since it is
    unreliable). True/"workflow_subagent" when the path contains a
    "subagents/workflows" segment, True/"subagent" when it contains a
    "subagents" segment or the filename stem starts with "agent-",
    otherwise False/"main"."""
    parts = path.parts
    if "subagents" in parts:
        if "workflows" in parts:
            return True, "workflow_subagent"
        return True, "subagent"
    if path.stem.startswith("agent-"):
        return True, "subagent"
    return False, "main"


# --- parsing --------------------------------------------------------------


def parse_timestamp(ts: str) -> Optional[datetime]:
    if not ts:
        return None
    try:
        # Handle trailing "Z" (UTC) which datetime.fromisoformat doesn't
        # accept on Python < 3.11.
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except ValueError:
        return None


def iter_jsonl_records(path: Path) -> Iterator[dict]:
    """Yield parsed JSON objects from a .jsonl file, skipping bad lines."""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue
    except OSError as exc:
        print(f"warning: could not read {path}: {exc}", file=sys.stderr)


def extract_assistant_turns(path: Path) -> list[dict]:
    """Extract raw assistant-turn records (numeric/id fields only) from
    one session file, in timestamp order.

    Claude Code emits cumulative streaming usage chunks: the same
    assistant turn (identified by requestId, falling back to
    message.id) can appear on several JSONL lines, each carrying a
    running-total usage snapshot. Summing every line would double- (or
    N-)count tokens for that turn. Instead we group lines by
    requestId/message.id and take the MAX of each usage field across
    the group -- the max is the final cumulative total for that turn.
    This mirrors the dedup approach used by ccusage and
    token-optimizer. Records with neither requestId nor message.id are
    kept as their own row, undeduped (same fallback ccusage uses).
    """
    groups: dict[Any, dict] = {}
    ungrouped: list[dict] = []

    for rec in iter_jsonl_records(path):
        if rec.get("type") != "assistant":
            continue
        message = rec.get("message") or {}
        usage = message.get("usage") or {}
        if not usage:
            # No usage block -> not a billable API turn (e.g. a
            # synthetic/local record). Skip.
            continue

        cache_creation = usage.get("cache_creation") or {}
        ts_raw = rec.get("timestamp")
        ts_parsed = parse_timestamp(ts_raw)

        key = rec.get("requestId") or message.get("id")

        entry = {
            "session_id": rec.get("sessionId"),
            "uuid": rec.get("uuid"),
            "parent_uuid": rec.get("parentUuid"),
            "request_id": rec.get("requestId"),
            "timestamp": ts_raw,
            "_ts_parsed": ts_parsed,
            "model": message.get("model"),
            "input_tokens": usage.get("input_tokens", 0) or 0,
            "cache_read_input_tokens": usage.get("cache_read_input_tokens", 0) or 0,
            "cache_creation_input_tokens": usage.get("cache_creation_input_tokens", 0) or 0,
            "cache_creation_1h": cache_creation.get("ephemeral_1h_input_tokens", 0) or 0,
            "cache_creation_5m": cache_creation.get("ephemeral_5m_input_tokens", 0) or 0,
            "output_tokens": usage.get("output_tokens", 0) or 0,
        }

        if key is None:
            ungrouped.append(entry)
            continue

        existing = groups.get(key)
        if existing is None:
            groups[key] = entry
            continue

        # Later cumulative chunk for the same turn: keep the max of
        # each usage field, and prefer the latest timestamp/uuid seen
        # (they track the running snapshot).
        for field in (
            "input_tokens",
            "cache_read_input_tokens",
            "cache_creation_input_tokens",
            "cache_creation_1h",
            "cache_creation_5m",
            "output_tokens",
        ):
            existing[field] = max(existing[field], entry[field])
        if entry["_ts_parsed"] is not None and (
            existing["_ts_parsed"] is None or entry["_ts_parsed"] >= existing["_ts_parsed"]
        ):
            existing["timestamp"] = entry["timestamp"]
            existing["_ts_parsed"] = entry["_ts_parsed"]
            existing["uuid"] = entry["uuid"]
            existing["parent_uuid"] = entry["parent_uuid"]
            existing["model"] = entry["model"] or existing["model"]

    raw = list(groups.values()) + ungrouped

    # Sort by parsed timestamp (None sorts first via fallback ordinal),
    # preserving original file order as a tiebreak/fallback.
    raw.sort(key=lambda r: (r["_ts_parsed"] is None, r["_ts_parsed"] or datetime.min.replace(tzinfo=timezone.utc)))
    return raw


def derive_rows(path: Path, project_slug: str, raw_turns: list[dict]) -> list[dict]:
    is_subagent, transcript_kind = classify_transcript(path)
    rows = []
    prev_ts: Optional[datetime] = None
    for idx, t in enumerate(raw_turns):
        ts_parsed = t["_ts_parsed"]
        gap_seconds: Optional[float] = None
        if ts_parsed is not None and prev_ts is not None:
            gap_seconds = (ts_parsed - prev_ts).total_seconds()

        c1h = t["cache_creation_1h"]
        c5m = t["cache_creation_5m"]
        creation_total = t["cache_creation_input_tokens"]

        # Determine the active TTL bucket for this turn's cache write
        # (whichever bucket got tokens; if both/neither, fall back to
        # the shorter 5m TTL as the conservative default).
        if c1h > 0 and c5m == 0:
            active_ttl = TTL_SECONDS["1h"]
        elif c5m > 0 and c1h == 0:
            active_ttl = TTL_SECONDS["5m"]
        elif c1h > 0 and c5m > 0:
            active_ttl = max(TTL_SECONDS["1h"], TTL_SECONDS["5m"])
        else:
            active_ttl = TTL_SECONDS["5m"]

        cache_miss_after_gap = bool(
            gap_seconds is not None
            and gap_seconds > active_ttl
            and t["cache_read_input_tokens"] == 0
            and creation_total > NOISE_FLOOR_TOKENS
        )

        rows.append(
            {
                "project_slug": project_slug,
                "file_path": str(path),
                "session_id": t["session_id"],
                "turn_index": idx,
                "uuid": t["uuid"],
                "parent_uuid": t["parent_uuid"],
                "request_id": t["request_id"],
                "timestamp": t["timestamp"],
                "model": t["model"],
                "input_tokens": t["input_tokens"],
                "cache_read_input_tokens": t["cache_read_input_tokens"],
                "cache_creation_input_tokens": creation_total,
                "cache_creation_1h": c1h,
                "cache_creation_5m": c5m,
                "output_tokens": t["output_tokens"],
                "gap_seconds": gap_seconds,
                "active_ttl_seconds": active_ttl,
                "cache_miss_after_gap": cache_miss_after_gap,
                "is_subagent": is_subagent,
                "transcript_kind": transcript_kind,
            }
        )
        if ts_parsed is not None:
            prev_ts = ts_parsed
    return rows


# --- discovery --------------------------------------------------------------


def find_session_files(projects_dir: Path, since_days: Optional[int]) -> list[Path]:
    if not projects_dir.exists():
        return []

    cutoff: Optional[datetime] = None
    if since_days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=since_days)

    # Recursive discovery, scoped strictly to projects_dir, to catch all
    # three transcript shapes:
    #   <slug>/<session>.jsonl                                  (main)
    #   <slug>/<session>/subagents/<agent>.jsonl                (subagent)
    #   <slug>/<session>/subagents/workflows/<wf>/<agent>.jsonl (workflow subagent)
    # This intentionally does NOT broaden to ~/.claude at large (that
    # would wrongly pull in history.jsonl, jobs/**/timeline.jsonl,
    # plugin logs, etc.).
    files: list[Path] = []
    for jsonl_path in projects_dir.rglob("*.jsonl"):
        if cutoff is not None:
            try:
                mtime = datetime.fromtimestamp(jsonl_path.stat().st_mtime, tz=timezone.utc)
            except OSError:
                continue
            if mtime < cutoff:
                continue
        files.append(jsonl_path)
    files.sort()
    return files


# --- output -----------------------------------------------------------------


def write_jsonl(rows: Iterable[dict], out_path: Path) -> None:
    with out_path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_csv(rows: list[dict], out_path: Path) -> None:
    with out_path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def print_summary(rows: list[dict]) -> None:
    by_session: dict[str, list[dict]] = {}
    for row in rows:
        by_session.setdefault(row["session_id"] or row["file_path"], []).append(row)

    def totals(session_rows: list[dict]) -> dict:
        return {
            "turns": len(session_rows),
            "input_tokens": sum(r["input_tokens"] for r in session_rows),
            "cache_read_input_tokens": sum(r["cache_read_input_tokens"] for r in session_rows),
            "cache_creation_input_tokens": sum(r["cache_creation_input_tokens"] for r in session_rows),
            "cache_creation_1h": sum(r["cache_creation_1h"] for r in session_rows),
            "cache_creation_5m": sum(r["cache_creation_5m"] for r in session_rows),
            "output_tokens": sum(r["output_tokens"] for r in session_rows),
            "cache_miss_after_gap_count": sum(1 for r in session_rows if r["cache_miss_after_gap"]),
            "cache_miss_after_gap_tokens_rebuilt": sum(
                r["cache_creation_input_tokens"] for r in session_rows if r["cache_miss_after_gap"]
            ),
        }

    session_totals = []
    for sid, session_rows in by_session.items():
        t = totals(session_rows)
        t["session_id"] = sid
        t["file_path"] = session_rows[0]["file_path"]
        t["project_slug"] = session_rows[0]["project_slug"]
        session_totals.append(t)

    session_totals.sort(key=lambda t: t["cache_creation_input_tokens"], reverse=True)

    print("=== Per-session totals (top 20 by cache_creation_input_tokens) ===")
    for t in session_totals[:20]:
        print(
            f"- {t['project_slug']} / {t['session_id']}\n"
            f"    turns={t['turns']} input={t['input_tokens']} "
            f"cache_read={t['cache_read_input_tokens']} "
            f"cache_creation={t['cache_creation_input_tokens']} "
            f"(1h={t['cache_creation_1h']} 5m={t['cache_creation_5m']}) "
            f"output={t['output_tokens']} "
            f"cache_miss_after_gap={t['cache_miss_after_gap_count']} "
            f"(tokens_rebuilt={t['cache_miss_after_gap_tokens_rebuilt']})"
        )

    grand = totals(rows)
    print()
    print("=== Grand totals ===")
    print(f"sessions:                         {len(by_session)}")
    print(f"turns:                             {grand['turns']}")
    print(f"input_tokens:                      {grand['input_tokens']}")
    print(f"cache_read_input_tokens:           {grand['cache_read_input_tokens']}")
    print(f"cache_creation_input_tokens:       {grand['cache_creation_input_tokens']}")
    print(f"  cache_creation_1h:               {grand['cache_creation_1h']}")
    print(f"  cache_creation_5m:               {grand['cache_creation_5m']}")
    print(f"output_tokens:                     {grand['output_tokens']}")
    print(f"cache_miss_after_gap events:       {grand['cache_miss_after_gap_count']}")
    print(f"cache_miss_after_gap tokens rebuilt:{grand['cache_miss_after_gap_tokens_rebuilt']}")

    # --- breakdown by transcript kind (main / subagent / workflow_subagent) ---
    by_kind: dict[str, list[dict]] = {}
    for row in rows:
        by_kind.setdefault(row.get("transcript_kind") or "main", []).append(row)

    print()
    print("=== Breakdown by transcript kind (main vs subagent) ===")
    for kind in ("main", "subagent", "workflow_subagent"):
        kind_rows = by_kind.get(kind, [])
        if not kind_rows and kind != "main":
            continue
        t = totals(kind_rows)
        print(
            f"- {kind}: turns={t['turns']} input={t['input_tokens']} "
            f"cache_read={t['cache_read_input_tokens']} "
            f"cache_creation={t['cache_creation_input_tokens']} "
            f"(1h={t['cache_creation_1h']} 5m={t['cache_creation_5m']}) "
            f"output={t['output_tokens']} "
            f"cache_miss_after_gap={t['cache_miss_after_gap_count']} "
            f"(tokens_rebuilt={t['cache_miss_after_gap_tokens_rebuilt']})"
        )

    main_turns = len(by_kind.get("main", []))
    subagent_turns = grand["turns"] - main_turns
    print(f"main turns:                       {main_turns}")
    print(f"subagent turns (all kinds):       {subagent_turns}")


# --- CLI ----------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "Scan Claude Code session transcripts and extract raw "
            "per-turn cache/token usage data (no message text)."
        )
    )
    p.add_argument(
        "--projects-dir",
        type=str,
        default=str(Path.home() / ".claude" / "projects"),
        help="Root directory containing per-project session folders "
        "(default: ~/.claude/projects)",
    )
    p.add_argument(
        "--since",
        type=int,
        default=None,
        metavar="DAYS",
        help="Only scan session files modified within the last N days",
    )
    p.add_argument("--out", type=str, default=None, help="Write JSONL rows to this path")
    p.add_argument("--csv", type=str, default=None, help="Write CSV rows to this path")
    p.add_argument(
        "--summary",
        action="store_true",
        help="Print per-session and grand total summary to stdout",
    )
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    projects_dir = Path(args.projects_dir).expanduser()
    files = find_session_files(projects_dir, args.since)

    if not files:
        print(f"No session files found under {projects_dir}", file=sys.stderr)

    all_rows: list[dict] = []
    for path in files:
        try:
            project_slug = path.relative_to(projects_dir).parts[0]
        except ValueError:
            project_slug = path.parent.name
        raw_turns = extract_assistant_turns(path)
        rows = derive_rows(path, project_slug, raw_turns)
        all_rows.extend(rows)

    if args.out:
        write_jsonl(all_rows, Path(args.out).expanduser())
        print(f"Wrote {len(all_rows)} rows to {args.out}", file=sys.stderr)

    if args.csv:
        write_csv(all_rows, Path(args.csv).expanduser())
        print(f"Wrote {len(all_rows)} rows to {args.csv}", file=sys.stderr)

    if args.summary or (not args.out and not args.csv):
        print_summary(all_rows)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
