#!/usr/bin/env python3
# =============================================================================
# session_cost.py -- cost of ONE controlled Claude Code session, computed from
#                    its JSONL transcript, for a controlled billing experiment.
# =============================================================================
# WHY
#   The user runs a single fresh session. This script computes what that
#   session should have cost under three pricing hypotheses. 24-48h later,
#   once Anthropic Console billing appears for that day, the user compares
#   the real $ to these numbers to determine which pricing model is real.
#
# OUTPUT
#   [A] SESSION SUMMARY   : file, session id, row counts, timestamp range, models
#   [B] TOKEN TOTALS       : per model input/output/cache_read/cc_1h/cc_5m, max prefix
#   [C] COST               : per model + TOTAL, FLAT / SPLIT
#   [D] PER-TURN TABLE     : turns with prefix > 150,000 tokens
#   [E] EXPERIMENT NOTE    : how to read the eventual Anthropic billing comparison
#
# READ-ONLY. Python 3 standard library only. Pricing core copied verbatim
# (constants + functions) from verify_against_anthropic.py so this script is
# self-contained -- no imports of local modules.
# =============================================================================

import argparse, json, os, glob, sys, re
from datetime import datetime, timezone

# ---- fixed pricing model (identical core to verify_against_anthropic.py) ----
READ_MULT     = 0.1    # cache read           = 0.1x  base
WRITE_MULT_1H = 2.0    # cache create, 1h TTL = 2.0x  base
WRITE_MULT_5M = 1.25   # cache create, 5m TTL = 1.25x base
OUTPUT_MULT   = 5.0    # output tokens        = 5x    base


def base_rate(model):
    """Base $/1M input tokens by model substring (matches verify_against_anthropic.py)."""
    m = (model or "").lower()
    if "opus"     in m: return 5.0
    if "sonnet-5" in m: return 2.0    # intro pricing thru 2026-08-31
    if "sonnet"   in m: return 3.0
    if "haiku"    in m: return 1.0
    if "fable"    in m: return 10.0
    return 0.0                        # non-Anthropic / external -> billed $0


def norm_model(model):
    """Strip a trailing -YYYYMMDD date suffix so ids match report model names."""
    if not model: return model or "?"
    return re.sub(r"-\d{8}$", "", model)


def dedup_key(rec, msg):
    """ccusage-style dedup: (messageId, requestId) across resumed/compacted files."""
    mid = msg.get("id"); rid = rec.get("requestId")
    if mid and rid: return (mid, rid)
    return None


def parse_ts(s):
    if not s: return None
    try: return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception: return None


def parse_iso_arg(s):
    """Parse a user-supplied --after ISO8601 string to an epoch timestamp."""
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except Exception:
        sys.stderr.write("ERROR: could not parse --after value %r as ISO8601\n" % s)
        sys.exit(2)


def find_latest_jsonl(projects_dir):
    """Recursively find the single newest .jsonl file (main + nested subagent dirs)
    under projects_dir, by mtime."""
    best = None
    best_mtime = -1.0
    for jf in glob.glob(os.path.join(projects_dir, "**", "*.jsonl"), recursive=True):
        try:
            mt = os.path.getmtime(jf)
        except OSError:
            continue
        if mt > best_mtime:
            best_mtime = mt
            best = jf
    return best


def session_id_from_path(path):
    """Best-effort session id: the filename stem, which Claude Code names as a
    UUID (or UUID-like) for each session/subagent transcript file."""
    return os.path.splitext(os.path.basename(path))[0]


def compute_turn_costs(model, inp, cr, cc, out, e1h, e5m):
    """Return (flat$, split$) for one assistant turn, in USD."""
    r = base_rate(model)
    if r == 0.0:
        return 0.0, 0.0
    read_cost = cr * READ_MULT * r
    out_cost  = out * OUTPUT_MULT * r
    inp_cost  = inp * r

    flat_write  = cc * WRITE_MULT_5M * r
    flat = (inp_cost + flat_write + read_cost + out_cost) / 1e6

    split_write = (e1h * WRITE_MULT_1H + e5m * WRITE_MULT_5M) * r
    split = (inp_cost + split_write + read_cost + out_cost) / 1e6

    return flat, split


def scan_file(path, after_ts, seen, turns):
    """Parse one JSONL session file, dedup by (message.id, requestId), and
    append per-turn records to `turns` (list of dicts). Returns stats dict."""
    stats = {"rows_counted": 0, "dup_rows": 0, "bad_lines": 0, "bad_ts": 0,
             "out_of_range": 0, "no_usage": 0}
    try:
        fh = open(path, errors="replace")
    except OSError as e:
        sys.stderr.write("ERROR: could not open %s: %s\n" % (path, e))
        sys.exit(2)
    with fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except Exception:
                stats["bad_lines"] += 1
                continue
            m = d.get("message")
            if not isinstance(m, dict):
                continue
            u = m.get("usage")
            if not isinstance(u, dict):
                stats["no_usage"] += 1
                continue

            key = dedup_key(d, m)
            if key is not None:
                if key in seen:
                    stats["dup_rows"] += 1
                    continue
                seen.add(key)

            ts_raw = d.get("timestamp")
            ts = parse_ts(ts_raw)
            if ts is None:
                stats["bad_ts"] += 1
                continue
            if after_ts is not None and ts < after_ts:
                stats["out_of_range"] += 1
                continue

            model = m.get("model")
            inp = u.get("input_tokens", 0) or 0
            cr  = u.get("cache_read_input_tokens", 0) or 0
            cc  = u.get("cache_creation_input_tokens", 0) or 0
            out = u.get("output_tokens", 0) or 0
            eph = u.get("cache_creation") or {}
            e1h = eph.get("ephemeral_1h_input_tokens", 0) or 0
            e5m = eph.get("ephemeral_5m_input_tokens", 0) or 0
            if e1h == 0 and e5m == 0 and cc > 0:
                e5m = cc  # no split reported -> treat all creation as 5m (FLAT assumption)

            flat, split = compute_turn_costs(model, inp, cr, cc, out, e1h, e5m)
            prefix = inp + cr + cc

            turns.append({
                "ts": ts, "ts_raw": ts_raw, "model": norm_model(model), "raw_model": model,
                "input": inp, "output": out, "cache_read": cr,
                "cc_1h": e1h, "cc_5m": e5m, "prefix": prefix,
                "flat": flat, "split": split,
            })
            stats["rows_counted"] += 1
    return stats


def main():
    ap = argparse.ArgumentParser(
        description="Compute the cost of ONE controlled Claude Code session from "
                    "its JSONL transcript, under three pricing hypotheses, for "
                    "comparison against Anthropic Console billing 24-48h later. "
                    "Read-only, stdlib only.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("path", nargs="?", default=None,
                     help="Path to a specific .jsonl session file.")
    ap.add_argument("--latest", action="store_true",
                     help="If no path given, auto-pick the newest .jsonl file "
                          "under --projects-dir (recursive, incl. nested subagent dirs).")
    ap.add_argument("--after", default=None,
                     help="ISO8601 timestamp; only count rows with .timestamp >= this "
                          "(use to isolate new turns after a --continue).")
    ap.add_argument("--projects-dir", default="~/.claude/projects",
                     help="Root dir to search when using --latest.")
    args = ap.parse_args()

    projects_dir = os.path.expanduser(args.projects_dir)

    if args.path:
        path = args.path
    elif args.latest:
        if not os.path.isdir(projects_dir):
            sys.stderr.write("ERROR: projects dir not found: %s\n" % projects_dir)
            sys.exit(2)
        path = find_latest_jsonl(projects_dir)
        if not path:
            sys.stderr.write("ERROR: no .jsonl files found under %s\n" % projects_dir)
            sys.exit(2)
        print("Auto-picked newest session file (--latest): %s" % path)
    else:
        sys.stderr.write("ERROR: give a path, or pass --latest to auto-pick the "
                          "newest session file.\n")
        sys.exit(2)

    path = os.path.expanduser(path)
    if not os.path.isfile(path):
        sys.stderr.write("ERROR: file not found: %s\n" % path)
        sys.exit(2)

    after_ts = parse_iso_arg(args.after) if args.after else None

    seen = set()
    turns = []
    stats = scan_file(path, after_ts, seen, turns)

    # ======================= aggregate per model =======================
    permodel = {}

    def slot(nm):
        if nm not in permodel:
            permodel[nm] = {"flat": 0.0, "split": 0.0,
                             "input": 0, "output": 0, "cache_read": 0,
                             "cc_1h": 0, "cc_5m": 0, "max_prefix": 0, "turns": 0}
        return permodel[nm]

    for t in turns:
        s = slot(t["model"])
        s["flat"] += t["flat"]; s["split"] += t["split"]
        s["input"] += t["input"]; s["output"] += t["output"]
        s["cache_read"] += t["cache_read"]
        s["cc_1h"] += t["cc_1h"]; s["cc_5m"] += t["cc_5m"]
        s["max_prefix"] = max(s["max_prefix"], t["prefix"])
        s["turns"] += 1

    # ======================= PRINT =======================
    P = print
    def money(x): return "{:,.4f}".format(x)
    def toks(x):  return "{:,d}".format(int(x))

    P("=" * 90)
    P("  SESSION COST -- controlled billing experiment (JSONL-derived estimate)")
    P("=" * 90)

    # ---- [A] SESSION SUMMARY ----
    P("\n[A] SESSION SUMMARY")
    P("    file           : %s" % path)
    P("    session id     : %s" % session_id_from_path(path))
    if turns:
        tmin = min(t["ts"] for t in turns); tmax = max(t["ts"] for t in turns)
        rng = "%s .. %s" % (
            datetime.fromtimestamp(tmin, tz=timezone.utc).isoformat(),
            datetime.fromtimestamp(tmax, tz=timezone.utc).isoformat())
    else:
        rng = "(no counted rows)"
    P("    timestamp range: %s" % rng)
    P("    rows counted   : %d" % stats["rows_counted"])
    P("    rows skipped   : %d dup, %d out-of-range(--after), %d bad-timestamp, "
      "%d malformed, %d no-usage"
      % (stats["dup_rows"], stats["out_of_range"], stats["bad_ts"],
         stats["bad_lines"], stats["no_usage"]))
    P("    models seen    : %s" % (", ".join(sorted(permodel)) if permodel else "(none)"))
    if after_ts is not None:
        P("    --after filter : %s" % args.after)

    if not turns:
        P("\nNo usage rows counted -- nothing further to report.")
        return

    order = sorted(permodel, key=lambda nm: -permodel[nm]["split"])

    # ---- [B] TOKEN TOTALS ----
    P("\n[B] TOKEN TOTALS per model")
    P("    %-22s %12s %12s %12s %12s %12s %14s"
      % ("model", "input", "output", "cache_read", "cc_1h", "cc_5m", "max prefix"))
    P("    " + "-" * 100)
    for nm in order:
        s = permodel[nm]
        P("    %-22s %12s %12s %12s %12s %12s %14s"
          % (nm[:22], toks(s["input"]), toks(s["output"]), toks(s["cache_read"]),
             toks(s["cc_1h"]), toks(s["cc_5m"]), toks(s["max_prefix"])))

    # ---- [C] COST per model + TOTAL ----
    P("\n[C] COST per model  (USD)")
    P("    %-22s %14s %14s" % ("model", "FLAT$", "SPLIT$"))
    P("    " + "-" * 52)
    t_flat = t_split = 0.0
    for nm in order:
        s = permodel[nm]
        t_flat += s["flat"]; t_split += s["split"]
        P("    %-22s %14s %14s"
          % (nm[:22], money(s["flat"]), money(s["split"])))
    P("    " + "-" * 52)
    P("    %-22s %14s %14s" % ("TOTAL", money(t_flat), money(t_split)))
    P("    FLAT  = all cache-creation billed @5m (ccusage-equivalent, buggy basis)")
    P("    SPLIT = honors the 1h/5m cache-creation split "
      "(our official-correct flat-pricing basis)")

    # ---- [D] PER-TURN TABLE (prefix > 150,000) ----
    P("\n[D] PER-TURN TABLE  (turns with prefix > 150,000 tokens)")
    big = [t for t in turns if t["prefix"] > 150000]
    if not big:
        P("    (no turns exceeded 150,000 prefix tokens)")
    else:
        big.sort(key=lambda t: t["ts"])
        P("    %-6s %-26s %-22s %14s %14s"
          % ("turn#", "timestamp", "model", "prefix", "SPLIT$"))
        P("    " + "-" * 90)
        # build turn index over ALL turns in timestamp order for stable numbering
        all_sorted = sorted(turns, key=lambda t: t["ts"])
        idx_of = {id(t): i for i, t in enumerate(all_sorted, start=1)}
        for t in big:
            P("    %-6d %-26s %-22s %14s %14s"
              % (idx_of[id(t)], t["ts_raw"] or "?", t["model"][:22], toks(t["prefix"]),
                 money(t["split"])))

    # ---- [E] EXPERIMENT NOTE ----
    P("\n[E] EXPERIMENT NOTE")
    P("    Compare the day's Anthropic Console cost for this model to the SPLIT total.")
    P("    If billing ~= SPLIT, flat pricing is confirmed and JSONL is complete.")
    P("    If billing >> SPLIT, other usage hit this key or transcripts are missing.")
    P("=" * 90)


if __name__ == "__main__":
    main()
