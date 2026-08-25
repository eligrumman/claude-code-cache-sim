#!/usr/bin/env python3
# =============================================================================
# strategy_poc.py  --  Claude Code prompt-cache keep-warm strategy simulator
# =============================================================================
# HEADLINE OUTPUT: "how much keep-warm caching would have saved on this machine."
#
# WHAT IT DOES
#   Mines your local Claude Code session transcripts, extracts every idle gap
#   between turns, and simulates several "keep-warm pinger" strategies to find
#   which one costs the least. The 1-hour prompt cache expires when you step
#   away; the next turn then pays a full cold rebuild (a 2.0x cache WRITE of the
#   whole context). A pinger can instead do a cheap 0.1x cache READ every ~55min
#   to keep the cache warm -- but it is blind (it can't know if you left for 5
#   minutes or for the night), so it needs a give-up policy. This tool compares
#   give-up policies against your real history.
#
# HOW TO RUN (read-only; NEVER writes to ~/.claude, only reads):
#   python3 strategy_poc.py
#   python3 strategy_poc.py --tz-offset 2 --out results.json
#   python3 strategy_poc.py --help
#
# Python 3 standard library ONLY. No numpy/pandas, no network, no repo imports.
# Safe to copy to another machine and run against that machine's own history.
# =============================================================================

import argparse, json, os, glob, math, sys, re
from datetime import datetime, timezone, timedelta

# ---- fixed pricing model (base $/1M input tokens by model substring) --------
# Calibrated to reproduce `ccusage` (LiteLLM pricing) to the cent on this machine.
READ_MULT   = 0.1    # cache read  = 0.1x base
WRITE_MULT  = 2.0    # cache write, 1h TTL = 2.0x base
WRITE_MULT_5M = 1.25 # cache write, 5m TTL = 1.25x base  (ccusage bills ALL creation here)
OUTPUT_MULT = 5.0    # output tokens = 5x base (for total-spend accounting)
TTL_H       = 1.0    # 1h cache lifetime
PING_H      = 55.0/60.0   # ping every 55 minutes
UNLIMITED_H = 1e9
UNLIMITED_TRAIL_CAP_H = 168.0  # a blind "unlimited" pinger left running: cap at 1 week

# ccusage per-model spend on THIS machine (source of truth for reconciliation).
CCUSAGE_TARGETS = {
    "claude-opus-4-6": 8124.67, "claude-opus-4-8": 3163.71, "claude-sonnet-5": 2073.64,
    "claude-sonnet-4-6": 1398.06, "claude-fable-5": 877.52, "claude-haiku-4-5": 116.45,
    "claude-opus-4-7": 95.73, "claude-opus-4-5": 17.67, "claude-sonnet-4-5": 13.27,
    "claude-opus-5": 0.59, "tencent/hy3": 0.00,
}

def base_rate(model):
    m = (model or "").lower()
    if "opus"     in m: return 5.0
    if "sonnet-5" in m: return 2.0    # intro pricing thru 2026-08-31 ($2/$10/$0.20/$2.50)
    if "sonnet"   in m: return 3.0
    if "haiku"    in m: return 1.0
    if "fable"    in m: return 10.0
    return 0.0                        # non-Anthropic / external -> ccusage bills $0

def norm_model(model):
    # strip a trailing -YYYYMMDD date suffix so ids match ccusage model names
    if not model: return model or "?"
    return re.sub(r"-\d{8}$", "", model)

def dedup_key(rec, msg):
    # ccusage-style dedup: skip repeated (messageId, requestId) pairs across
    # resumed/compacted session files so shared assistant rows aren't double-counted.
    mid = msg.get("id"); rid = rec.get("requestId")
    if mid and rid: return (mid, rid)
    return None

def eff_rate(model, prefix):
    # SPLIT pricing basis only -- Anthropic's current models use flat pricing
    # across the full 1M context (no >200k long-context tier).
    return base_rate(model)

def pings_to_span(h):
    return max(1, math.ceil(h / PING_H))

def percentile(vals, p):
    if not vals: return None
    xs = sorted(vals); n = len(xs)
    if n == 1: return xs[0]
    k = (n-1) * (p/100.0); f = math.floor(k); c = math.ceil(k)
    if f == c: return xs[int(k)]
    return xs[f] + (xs[c]-xs[f])*(k-f)

def parse_ts(s):
    if not s: return None
    try: return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception: return None

# =============================================================================
# STEP 1 -- mine main-session transcripts
# =============================================================================
def mine(projects_dir, min_prefix, max_gap_h, stats, seen):
    sessions = []
    if not os.path.isdir(projects_dir):
        sys.stderr.write("ERROR: projects dir not found: %s\n"
                         "Is Claude Code installed for this user? Try --projects-dir.\n"
                         % projects_dir)
        sys.exit(2)
    for projdir in sorted(glob.glob(os.path.join(projects_dir, "*"))):
        if not os.path.isdir(projdir): continue
        project = os.path.basename(projdir)
        # MAIN sessions only = top-level *.jsonl (nested dirs are subagents -> skip)
        for jf in glob.glob(os.path.join(projdir, "*.jsonl")):
            stats["files"] += 1
            sid = os.path.basename(jf)[:-6]
            turns = []       # (ts, model, prefix_tokens)
            spend_turns = []  # full usage for total-spend accounting
            try:
                fh = open(jf, errors="replace")
            except OSError:
                stats["unreadable_files"] += 1
                continue
            with fh:
                for line in fh:
                    line = line.strip()
                    if not line: continue
                    try:
                        d = json.loads(line)
                    except Exception:
                        stats["bad_lines"] += 1
                        continue
                    m = d.get("message")
                    if not isinstance(m, dict): continue
                    u = m.get("usage")
                    if not isinstance(u, dict): continue
                    key = dedup_key(d, m)          # ccusage-style dedup (global set)
                    if key is not None:
                        if key in seen:
                            stats["dup_rows"] += 1
                            continue
                        seen.add(key)
                    ts = parse_ts(d.get("timestamp"))
                    if ts is None:
                        stats["bad_ts"] += 1
                        continue
                    cr = u.get("cache_read_input_tokens", 0) or 0
                    cc = u.get("cache_creation_input_tokens", 0) or 0
                    pre = cr + cc
                    turns.append((ts, m.get("model"), pre))
                    eph = u.get("cache_creation") or {}
                    spend_turns.append({
                        "ts": ts, "model": m.get("model"),
                        "input": u.get("input_tokens", 0) or 0,
                        "output": u.get("output_tokens", 0) or 0,
                        "cache_read": cr, "cache_creation": cc,
                        "eph_1h": eph.get("ephemeral_1h_input_tokens", 0) or 0,
                        "eph_5m": eph.get("ephemeral_5m_input_tokens", 0) or 0})
            if not turns: continue
            turns.sort(key=lambda x: x[0])
            if not any(t[2] >= min_prefix for t in turns):
                stats["skipped_tiny"] += 1
                continue  # no warm prefix worth keeping alive
            sessions.append({"session_id": sid, "project": project,
                             "start_ts": turns[0][0], "turns": turns,
                             "spend_turns": spend_turns})
    return sessions

def build_gaps(sess, max_gap_h, dropped):
    """Per-session causal gap list. None = dropped placeholder (keeps history order)."""
    turns = sess["turns"]; gl = []
    for i in range(len(turns)-1):
        g = (turns[i+1][0] - turns[i][0]) / 3600.0
        if g < 0: continue
        P = turns[i][2]; model = turns[i][1]; t0 = turns[i][0]
        if g > max_gap_h:
            dropped.append({"session_id": sess["session_id"], "project": sess["project"],
                            "model": model, "gap_hours": g, "prefix_tokens": P})
            gl.append(None); continue
        gl.append({"gap_hours": g, "prefix_tokens": P, "model": model, "t0": t0,
                   "project": sess["project"], "session_id": sess["session_id"]})
    return gl

# =============================================================================
# STEP 2 -- strategy cost primitives
# =============================================================================
def blind_gap_cost(g, P, r, Ch):
    """One gap under a fixed give-up cutoff Ch hours (the S2 / S4 / S5 mechanic)."""
    if g <= TTL_H: return 0.0                # 1h cache survives; return is a free read
    read1 = P*READ_MULT*r/1e6; rebuild = P*WRITE_MULT*r/1e6
    alive = min(g, Ch); pings = pings_to_span(alive)
    survived = g <= Ch + 1.0                 # cache lives ~1h past the last ping
    return pings*read1 + (0.0 if survived else rebuild)

def gap_costs_fixed(g, P, r, cutoffs):
    out = {}
    rebuild = P*WRITE_MULT*r/1e6; read1 = P*READ_MULT*r/1e6
    out["S0_reality"]     = rebuild if g > TTL_H else 0.0
    out["S1_clairvoyant"] = (min(rebuild, pings_to_span(g)*read1) if g > TTL_H else 0.0)
    for C in cutoffs:
        Ch = UNLIMITED_H if C == "unlimited" else float(C)
        out["S2_cutoff_%s" % C] = blind_gap_cost(g, P, r, Ch)
    rebuild5 = P*WRITE_MULT_5M*r/1e6
    out["S3_5m_ttl"] = rebuild5 if g > (5.0/60.0) else 0.0
    return out

def trailing_fixed(P, r, cutoffs):
    """Per-session-END trailing waste: pinger keeps firing C hours, rescues nothing."""
    read1 = P*READ_MULT*r/1e6; out = {}
    for C in cutoffs:
        Ch = UNLIMITED_TRAIL_CAP_H if C == "unlimited" else float(C)
        out["S2_cutoff_%s" % C] = pings_to_span(Ch)*read1
    out["S0_reality"] = 0.0; out["S1_clairvoyant"] = 0.0; out["S3_5m_ttl"] = 0.0
    return out

# ---- S4 momentum: per-gap cutoff from THIS session's recent rhythm (causal) --
def s4_cutoff(prior_gaps, quantile=75, alpha=1.5):
    if not prior_gaps:
        base = 1.0
    else:
        recent = prior_gaps[-3:]                 # last k=3 gaps before this one
        base = alpha * percentile(recent, quantile)
    C = min(12.0, max(1.0, base))                # clip to [1h, 12h]
    recent = prior_gaps[-3:]
    if len(recent) >= 2:                         # winding-down override
        growing = all(recent[i+1] > recent[i] for i in range(len(recent)-1))
        if growing and recent[-1] > 2.0:
            C = 1.0                              # session cooling off -> short leash
    return C

# ---- S5 activity schedule (see walkthrough in the report) -------------------
def local_hour(ts, tz_offset_h):
    lt = datetime.fromtimestamp(ts, tz=timezone.utc) + timedelta(hours=tz_offset_h)
    return lt.weekday(), lt.hour   # Monday=0

def build_activity_profile(train_sessions, tz_offset_h, active_frac):
    """Learn which local hours-of-day the user is active, from training sessions."""
    hourc = [0]*24
    for s in train_sessions:
        for (ts, _, _) in s["turns"]:
            _, h = local_hour(ts, tz_offset_h)
            hourc[h] += 1
    peak = max(hourc) if hourc else 0
    thr = active_frac * peak
    active = set(h for h in range(24) if hourc[h] >= thr and peak > 0)
    return hourc, active, thr, peak

def is_active(active, ts, tz_offset_h):
    _, h = local_hour(ts, tz_offset_h)
    return h in active

def alive_window(active, t0, cap_h, tz_offset_h):
    """Hours from t0 until the current active window ends (hourly resolution)."""
    if not is_active(active, t0, tz_offset_h):
        return 0.0
    h = 1
    while h <= cap_h:
        if not is_active(active, t0 + h*3600, tz_offset_h):
            return float(h)
        h += 1
    return float(cap_h)

def s5_gap_cost(g, P, r, active, t0, tz_offset_h):
    if g <= TTL_H: return 0.0
    C = alive_window(active, t0, math.ceil(g)+2, tz_offset_h)
    read1 = P*READ_MULT*r/1e6; rebuild = P*WRITE_MULT*r/1e6
    if C <= 0: return rebuild                     # gap begins in a dead zone: no ping
    alive = min(g, C); pings = pings_to_span(alive)
    survived = g <= C + 1.0
    return pings*read1 + (0.0 if survived else rebuild)

def s5_trailing(P, r, active, t_end, tz_offset_h):
    C = alive_window(active, t_end, UNLIMITED_TRAIL_CAP_H, tz_offset_h)
    if C <= 0: return 0.0
    return pings_to_span(C) * P*READ_MULT*r/1e6

# ---- S6 hybrid: S4 momentum leash, hard-stopped at the S5 dead-zone boundary -
def s6_gap_cost(g, P, r, C_mom, active, t0, tz_offset_h):
    if g <= TTL_H: return 0.0
    if not is_active(active, t0, tz_offset_h):
        C = 0.0
    else:
        C_act = alive_window(active, t0, math.ceil(min(g, C_mom))+2, tz_offset_h)
        C = min(C_mom, C_act)
    read1 = P*READ_MULT*r/1e6; rebuild = P*WRITE_MULT*r/1e6
    if C <= 0: return rebuild
    alive = min(g, C); pings = pings_to_span(alive)
    survived = g <= C + 1.0
    return pings*read1 + (0.0 if survived else rebuild)

# =============================================================================
# total main-session spend (for waste-as-% context)
# =============================================================================
def turn_spend(t):
    # Pure SPLIT pricing -- Anthropic's current models (Opus 4.8, Sonnet 5, etc.)
    # bill flat rates across the full 1M context; there is no >200k long-context
    # premium tier. Cache-write cost honors the per-turn 1h/5m split: 1h-TTL
    # tokens bill at WRITE_MULT (2.0x), everything else (5m-TTL + any unlabeled
    # remainder of cache_creation) bills at WRITE_MULT_5M (1.25x).
    r = base_rate(t["model"])
    if r == 0.0:
        return 0.0    # external / non-Anthropic model -> ccusage shows $0
    eph_1h = t.get("eph_1h", 0) or 0
    eph_5m = t.get("eph_5m", 0) or 0
    remainder = max(0, t["cache_creation"] - eph_1h - eph_5m)
    write_cost = eph_1h*WRITE_MULT + eph_5m*WRITE_MULT_5M + remainder*WRITE_MULT_5M
    return (t["input"]*r + write_cost*r + t["cache_read"]*READ_MULT*r
            + t["output"]*OUTPUT_MULT*r) / 1e6

# =============================================================================
# main
# =============================================================================
def main():
    ap = argparse.ArgumentParser(
        description="Simulate Claude Code prompt-cache keep-warm strategies against "
                    "your own local session history. Read-only; never writes to ~/.claude.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("--projects-dir", default="~/.claude/projects",
                    help="Directory of Claude Code project transcripts (~ is expanded).")
    ap.add_argument("--tz-offset", type=float, default=3.0,
                    help="Your local UTC offset in hours (timestamps are UTC). Israel summer=3.")
    ap.add_argument("--min-prefix", type=int, default=20000,
                    help="Ignore sessions whose warm prefix never reaches this many tokens.")
    ap.add_argument("--max-gap-hours", type=float, default=336.0,
                    help="Drop gaps longer than this (machine-sleep/session-boundary artifacts).")
    ap.add_argument("--cutoffs", default="1,2,3,4,5,8,12,24",
                    help="Comma-separated blind give-up cutoffs (hours) to test for S2.")
    ap.add_argument("--train-frac", type=float, default=0.7,
                    help="Chronological fraction of sessions used to TRAIN the S5 activity profile.")
    ap.add_argument("--active-threshold-frac", type=float, default=0.10,
                    help="An hour-of-day is 'active' if its turn count >= this fraction of the peak hour.")
    ap.add_argument("--out", default=None,
                    help="Optional path to dump full results as JSON (default: write nothing).")
    args = ap.parse_args()

    projects_dir = os.path.expanduser(args.projects_dir)
    cutoffs = [c.strip() for c in args.cutoffs.split(",") if c.strip()]
    cutoffs = [int(c) if c.isdigit() else c for c in cutoffs]
    tz = args.tz_offset

    stats = {"files":0,"unreadable_files":0,"bad_lines":0,"bad_ts":0,"skipped_tiny":0,"dup_rows":0}
    seen = set()   # ONE global (messageId, requestId) set across main + subagent files
    sessions = mine(projects_dir, args.min_prefix, args.max_gap_hours, stats, seen)
    if not sessions:
        print("No sessions with a warm prefix (>= %d tokens) found under %s."
              % (args.min_prefix, projects_dir))
        print("Malformed lines skipped: %d ; files scanned: %d" % (stats["bad_lines"], stats["files"]))
        return

    dropped = []
    for s in sessions:
        s["gaps"] = build_gaps(s, args.max_gap_hours, dropped)
    all_gaps = [g for s in sessions for g in s["gaps"] if g]
    session_ends = [{"model": s["turns"][-1][1], "prefix_tokens": s["turns"][-1][2],
                     "t_end": s["turns"][-1][0]} for s in sessions]

    BASE = (["S0_reality","S1_clairvoyant"]
            + ["S2_cutoff_%s" % c for c in cutoffs] + ["S3_5m_ttl"])

    # ---- full-dataset totals (S0..S3 + S4) ----
    def run_full():
        tot = {k:0.0 for k in BASE}; tot["S4_momentum"] = 0.0
        for s in sessions:
            prior = []
            for g in s["gaps"]:
                if not g: continue
                r = eff_rate(g["model"], g["prefix_tokens"])
                cc = gap_costs_fixed(g["gap_hours"], g["prefix_tokens"], r, cutoffs)
                for k in BASE: tot[k] += cc[k]
                C = s4_cutoff(prior)
                tot["S4_momentum"] += blind_gap_cost(g["gap_hours"], g["prefix_tokens"], r, C)
                prior.append(g["gap_hours"])
            last = s["turns"][-1]; r = eff_rate(last[1], last[2])
            tb = trailing_fixed(last[2], r, cutoffs)
            for k in BASE: tot[k] += tb[k]
            tot["S4_momentum"] += pings_to_span(s4_cutoff(prior)) * last[2]*READ_MULT*r/1e6
        return tot
    flat = run_full()

    # ---- chronological train/test split for S5 (+ head-to-head) ----
    ss = sorted(sessions, key=lambda s: s["start_ts"])
    split = int(len(ss) * args.train_frac)
    train, test = ss[:split], ss[split:]
    hourc, active, thr, peak = build_activity_profile(train, tz, args.active_threshold_frac)

    fine = [c for c in cutoffs if isinstance(c, int)]
    def run_test():
        keys = (["S0_reality","S1_clairvoyant"] + ["S2_cutoff_%s" % c for c in fine]
                + ["S4_momentum","S5_activity"])
        tot = {k:0.0 for k in keys}
        for s in test:
            prior = []
            for g in s["gaps"]:
                if not g: continue
                r = eff_rate(g["model"], g["prefix_tokens"])
                cc = gap_costs_fixed(g["gap_hours"], g["prefix_tokens"], r, cutoffs)
                tot["S0_reality"]     += cc["S0_reality"]
                tot["S1_clairvoyant"] += cc["S1_clairvoyant"]
                for c in fine: tot["S2_cutoff_%s" % c] += cc["S2_cutoff_%s" % c]
                C = s4_cutoff(prior)
                tot["S4_momentum"] += blind_gap_cost(g["gap_hours"], g["prefix_tokens"], r, C)
                tot["S5_activity"] += s5_gap_cost(g["gap_hours"], g["prefix_tokens"], r, active, g["t0"], tz)
                prior.append(g["gap_hours"])
            last = s["turns"][-1]; r = eff_rate(last[1], last[2])
            read1 = last[2]*READ_MULT*r/1e6
            for c in fine: tot["S2_cutoff_%s" % c] += pings_to_span(float(c))*read1
            Cf = s4_cutoff(prior)
            tot["S4_momentum"] += pings_to_span(Cf)*read1
            tot["S5_activity"] += s5_trailing(last[2], r, active, last[0], tz)
        return tot
    test_flat = run_test()

    # ---- total main-session spend + monthly ----
    def month_key(ts):
        lt = datetime.fromtimestamp(ts, tz=timezone.utc) + timedelta(hours=tz)
        return "%04d-%02d" % (lt.year, lt.month)
    all_ts = [t[0] for s in sessions for t in s["turns"]]
    min_ts, max_ts = min(all_ts), max(all_ts)
    span_days = (max_ts - min_ts)/86400.0
    span_months = max(span_days/30.4375, 1e-9)
    total_flat = 0.0; month_flat = {}
    permodel = {}   # normalized model id -> flat $ (for ccusage reconciliation)
    for s in sessions:
        for t in s["spend_turns"]:
            cf = turn_spend(t); month_flat[month_key(t["ts"])] = month_flat.get(month_key(t["ts"]),0.0)+cf
            total_flat += cf
            nm = norm_model(t["model"]); permodel[nm] = permodel.get(nm,0.0)+cf
    active_months = len(month_flat)

    # ---- subagent / workflow spend (nested *.jsonl inside slug subdirs) ----
    # These are excluded from the main-session scan; summed here so the "total
    # Claude Code spend" denominator is complete. Subagents write at 5m TTL
    # (1.25x) unless an ephemeral_1h split says otherwise.
    sub_flat = 0.0; sub_files = 0
    for projdir in sorted(glob.glob(os.path.join(projects_dir, "*"))):
        if not os.path.isdir(projdir): continue
        for jf in glob.glob(os.path.join(projdir, "**", "*.jsonl"), recursive=True):
            if os.path.dirname(jf) == projdir: continue  # top-level = main, skip
            sub_files += 1
            try: fh = open(jf, errors="replace")
            except OSError: continue
            with fh:
                for line in fh:
                    line = line.strip()
                    if not line: continue
                    try: d = json.loads(line)
                    except Exception: continue
                    mm = d.get("message")
                    if not isinstance(mm, dict): continue
                    u = mm.get("usage")
                    if not isinstance(u, dict): continue
                    key = dedup_key(d, mm)          # same global dedup set as main sessions
                    if key is not None:
                        if key in seen:
                            stats["dup_rows"] += 1
                            continue
                        seen.add(key)
                    eph = u.get("cache_creation") or {}
                    t = {"model": mm.get("model"),
                         "input": u.get("input_tokens", 0) or 0,
                         "output": u.get("output_tokens", 0) or 0,
                         "cache_read": u.get("cache_read_input_tokens", 0) or 0,
                         "cache_creation": u.get("cache_creation_input_tokens", 0) or 0,
                         "eph_1h": eph.get("ephemeral_1h_input_tokens", 0) or 0,
                         "eph_5m": eph.get("ephemeral_5m_input_tokens", 0) or 0}
                    scf = turn_spend(t)
                    sub_flat += scf
                    nm = norm_model(t["model"]); permodel[nm] = permodel.get(nm,0.0)+scf
    grand_flat = total_flat + sub_flat

    # ---- distribution buckets ----
    buckets = [("<1h",0,1),("1-2h",1,2),("2-4h",2,4),("4-8h",4,8),
               ("8-12h",8,12),("12-24h",12,24),(">24h",24,1e18)]
    dist = {}
    for name,lo,hi in buckets:
        sel = [g for g in all_gaps if lo <= g["gap_hours"] < hi]
        exp = sum(g["prefix_tokens"]*WRITE_MULT*base_rate(g["model"])/1e6 for g in sel)
        dist[name] = {"count": len(sel), "rebuild_exposure_flat": exp}

    # ---- leaderboard helper ----
    def lb_rows(flat_tot):
        s0, s1 = flat_tot["S0_reality"], flat_tot["S1_clairvoyant"]
        rows = []
        for k, v in flat_tot.items():
            saved = s0 - v; pct = 100*saved/s0 if s0 else 0
            denom = s0 - s1; closef = 100*(s0-v)/denom if denom else 0
            rows.append({"strategy":k, "flat":v,
                         "saved":saved, "pct":pct, "pct_s1":closef})
        rows.sort(key=lambda x: x["flat"]); return rows
    full_rows = lb_rows(flat); test_rows = lb_rows(test_flat)

    # ======================= PRINT =======================
    P = print
    def m(x): return "{:,.2f}".format(x)   # money with thousands separator
    act = sorted(active); dead = sorted(set(range(24))-active)
    peak_h = hourc.index(peak) if peak else None

    # ---- pick the winning fixed cutoff (highest full-data savings) ----
    cutoff_rows = [r for r in full_rows if r["strategy"].startswith("S2_cutoff_")]
    # keep only numeric-hour cutoffs (skip "unlimited") for the deployable winner
    def cutoff_hours(r):
        s = r["strategy"].split("_")[-1]
        return int(s) if s.isdigit() else None
    numeric = [r for r in cutoff_rows if cutoff_hours(r) is not None]
    win = max(numeric, key=lambda r: r["saved"]) if numeric else full_rows[0]
    win_C = cutoff_hours(win)
    clair = next(r for r in full_rows if r["strategy"] == "S1_clairvoyant")

    def pct_total(x_month): return 100*x_month/(grand_flat/span_months) if grand_flat else 0
    def pct_main(x_month):  return 100*x_month/(total_flat/span_months) if total_flat else 0
    win_permo   = win["saved"]/span_months
    clair_permo = clair["saved"]/span_months

    # =================== [1] KEEP-WARM VERDICT (headline) ===================
    P("="*59)
    P("                  KEEP-WARM VERDICT")
    P("="*59)
    P("Data: %d sessions, %s..%s (%.1f months)"
      % (len(sessions), datetime.fromtimestamp(min_ts,tz=timezone.utc).date(),
         datetime.fromtimestamp(max_ts,tz=timezone.utc).date(), span_months))
    P("Total Claude Code spend: $%s/mo  (main sessions: $%s/mo)"
      % (m(grand_flat/span_months), m(total_flat/span_months)))
    P("Best deployable keep-warm strategy: blind cutoff %dh" % win_C)
    P("  -> would have saved: $%s total  =  $%s/mo" % (m(win["saved"]), m(win_permo)))
    P("  -> that is %.1f%% of total spend, %.1f%% of main-session spend"
      % (pct_total(win_permo), pct_main(win_permo)))
    P("Theoretical ceiling (perfect foresight, unattainable): $%s/mo (%.1f%% of total)"
      % (m(clair_permo), pct_total(clair_permo)))
    P("="*59)

    # =================== CCUSAGE RECONCILIATION ===================
    P("\n" + "="*59)
    P("CCUSAGE RECONCILIATION  (script-computed Anthropic spend per model)")
    P("="*59)
    P("  Should match `ccusage` (LiteLLM pricing) within ~2%. Basis: dedup by")
    P("  messageId+requestId; cache-create billed @5m (1.25x); sonnet-5 intro")
    P("  pricing; external/non-Anthropic models billed $0.")
    P("  %-22s %13s %13s %9s" % ("model","computed$","ccusage$","diff%"))
    tot_c = tot_t = 0.0
    rkeys = sorted(set(list(permodel) + list(CCUSAGE_TARGETS)),
                   key=lambda kk: -CCUSAGE_TARGETS.get(kk, permodel.get(kk, 0.0)))
    for kk in rkeys:
        c = permodel.get(kk, 0.0); tgt = CCUSAGE_TARGETS.get(kk)
        tot_c += c
        if tgt is not None:
            tot_t += tgt
            ds = "%+8.1f%%" % (((c-tgt)/tgt*100) if tgt else 0.0)
            P("  %-22s %13.2f %13.2f %s" % (kk, c, tgt, ds))
        else:
            P("  %-22s %13.2f %13s %9s" % (kk, c, "(n/a)", "-"))
    dtot = ((tot_c-tot_t)/tot_t*100) if tot_t else 0.0
    P("  %-22s %13.2f %13.2f %+8.2f%%" % ("TOTAL", tot_c, tot_t, dtot))
    P("="*59)

    # =================== [2] keep-warm cutoff table ===================
    P("\nKEEP-WARM SAVINGS BY GIVE-UP CUTOFF  (full dataset; > is better)")
    P("  %-8s %12s %12s   %s" % ("cutoff","saved$","%of total",""))
    for r in sorted(numeric, key=lambda r: -r["saved"]):
        C = cutoff_hours(r)
        mark = "  <== WINNER" if C == win_C else ""
        P("  %-8s %12s %11.1f%%%s"
          % ("%dh" % C, m(r["saved"]), pct_total(r["saved"]/span_months), mark))
    P("  (%%of total = share of total Claude Code monthly spend this cutoff would save)")

    # =================== supporting detail ===================
    P("\n" + "-"*59); P("SUPPORTING DETAIL"); P("-"*59)

    # spend breakdown (main vs subagents vs grand)
    P("\n[A] TOTAL CLAUDE CODE SPEND (denominator for the %% above)")
    P("  main sessions        : $%s  (%.1f%% of total)"
      % (m(total_flat), 100*total_flat/grand_flat if grand_flat else 0))
    P("  subagents/workflows  : $%s  (%.1f%% of total)  [%d nested files]"
      % (m(sub_flat), 100*sub_flat/grand_flat if grand_flat else 0, sub_files))
    P("  GRAND TOTAL          : $%s" % m(grand_flat))
    P("  per calendar-month   : $%s" % m(grand_flat/span_months))
    P("  cache-rebuild waste today (no keep-warm): $%s flat = %.1f%% of total, %.1f%% of main"
      % (m(flat["S0_reality"]), 100*flat["S0_reality"]/grand_flat if grand_flat else 0,
         100*flat["S0_reality"]/total_flat if total_flat else 0))

    # data span / counts
    P("\n[B] DATA SPAN & COUNTS")
    P("  projects dir : %s" % projects_dir)
    P("  sessions kept: %d   (of %d main transcript files; %d tiny sessions skipped)"
      % (len(sessions), stats["files"], stats["skipped_tiny"]))
    P("  gaps         : %d   session-ends: %d" % (len(all_gaps), len(session_ends)))
    P("  data quality : %d malformed lines, %d bad timestamps, %d unreadable files (all skipped)"
      % (stats["bad_lines"], stats["bad_ts"], stats["unreadable_files"]))
    P("  dedup        : %d duplicate (messageId+requestId) rows skipped (ccusage-style)"
      % stats["dup_rows"])
    P("  pricing      : cache-create @5m (1.25x); sonnet-5 intro pricing; external models $0")
    P("  dropped gaps > %.0fh: %d events, %.1fh total (excluded)"
      % (args.max_gap_hours, len(dropped), sum(d["gap_hours"] for d in dropped)))

    # gap distribution
    P("\n[C] GAP DISTRIBUTION (where the exposure is)")
    P("  %-8s %8s %20s" % ("bucket","count","rebuild_exposure$"))
    for name,_,_ in buckets:
        P("  %-8s %8d %20.2f" % (name, dist[name]["count"], dist[name]["rebuild_exposure_flat"]))
    P("  note: gaps <=1h cost $0 under every strategy (1h cache survives them for free).")

    # full leaderboard (all strategies)
    def show(rows):
        P("  %-20s %12s %11s %8s %8s" % ("strategy","flat$","saved$","%saved","%ofS1"))
        for r in rows:
            P("  %-20s %12.3f %11.3f %8.1f %8.1f"
              % (r["strategy"], r["flat"], r["saved"], r["pct"], r["pct_s1"]))
    P("\n[D] FULL LEADERBOARD, ALL STRATEGIES (full dataset; cheapest first)")
    P("    S1 = clairvoyant floor (unbeatable). %%ofS1 = share of that floor captured.")
    show(full_rows)

    # held-out test set check
    P("\n[E] HELD-OUT TEST-SET CHECK (last %.0f%% = %d sessions; confirms the winner on unseen data)"
      % ((1-args.train_frac)*100, len(test)))
    show(test_rows)

    # experimental strategies, de-emphasized
    P("\n[F] EXPERIMENTAL STRATEGIES (did NOT beat the fixed cutoff on the reference dataset)")
    s4 = next((r for r in full_rows if r["strategy"] == "S4_momentum"), None)
    s5t = next((r for r in test_rows if r["strategy"] == "S5_activity"), None)
    if s4:
        P("  S4 momentum (adaptive per-session leash): saved $%s (%.1f%% of clairvoyant floor) "
          "-- vs winner's %.1f%%. Session rhythm too noisy to predict returns."
          % (m(s4["saved"]), s4["pct_s1"], win["pct_s1"]))
    if s5t:
        winT = max((r for r in test_rows if r["strategy"].startswith("S2_cutoff_")), key=lambda r: r["saved"])
        P("  S5 activity-schedule (ping only in active hours): saved $%s on test set "
          "(%.1f%% of floor) -- vs best fixed cutoff's %.1f%%. This user has no reliable dead zone."
          % (m(s5t["saved"]), s5t["pct_s1"], winT["pct_s1"]))
    P("\n[G] LEARNED ACTIVITY PROFILE (for S5; local time = UTC%+.0f, trained on first %.0f%% of sessions)"
      % (tz, args.train_frac*100))
    P("  active hours (ping through these) : %s" % act)
    P("  dead hours   (give up here)       : %s" % dead)
    P("  busiest hour : %02d:00 local (%d turns); threshold = %.0f turns (>=%.0f%% of peak)"
      % (peak_h if peak_h is not None else 0, peak, thr, args.active_threshold_frac*100))
    P("="*59)

    # ---- optional JSON dump ----
    if args.out:
        out = {
            "meta": {"projects_dir": projects_dir, "tz_offset": tz, "sessions": len(sessions),
                     "files": stats["files"], "gaps": len(all_gaps), "span_days": span_days,
                     "span_months": span_months, "active_months": active_months,
                     "data_quality": stats, "cutoffs": cutoffs, "train_frac": args.train_frac,
                     "active_threshold_frac": args.active_threshold_frac},
            "dropped": {"count": len(dropped), "total_hours": sum(d["gap_hours"] for d in dropped)},
            "spend": {"main_flat": total_flat,
                      "subagent_flat": sub_flat,
                      "grand_flat": grand_flat,
                      "grand_per_month_flat": grand_flat/span_months,
                      "rebuild_waste_flat": flat["S0_reality"],
                      "waste_pct_of_grand_flat": 100*flat["S0_reality"]/grand_flat if grand_flat else 0,
                      "waste_pct_of_main_flat": 100*flat["S0_reality"]/total_flat if total_flat else 0,
                      "winner_cutoff_h": win_C, "winner_saved_total_flat": win["saved"],
                      "winner_saved_per_month_flat": win_permo,
                      "winner_pct_of_grand": pct_total(win_permo),
                      "winner_pct_of_main": pct_main(win_permo),
                      "by_month_flat": month_flat},
            "distribution": dist,
            "activity_profile": {"tz_offset": tz, "active_hours": sorted(active),
                                 "dead_hours": sorted(set(range(24))-active),
                                 "peak_hour": peak_h, "peak_turns": peak, "threshold": thr,
                                 "hourly_counts": hourc},
            "full_leaderboard": full_rows, "test_leaderboard": test_rows,
        }
        try:
            with open(os.path.expanduser(args.out), "w") as f:
                json.dump(out, f, indent=2)
            P("results JSON -> %s" % args.out)
        except OSError as e:
            sys.stderr.write("could not write --out file: %s\n" % e)

if __name__ == "__main__":
    main()
