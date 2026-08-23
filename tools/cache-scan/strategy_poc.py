#!/usr/bin/env python3
# =============================================================================
# strategy_poc.py  --  Claude Code prompt-cache keep-warm strategy simulator
# =============================================================================
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

import argparse, json, os, glob, math, sys
from datetime import datetime, timezone, timedelta

# ---- fixed pricing model (base $/1M input tokens by model substring) --------
READ_MULT   = 0.1    # cache read  = 0.1x base
WRITE_MULT  = 2.0    # cache write, 1h TTL = 2.0x base
WRITE_MULT_5M = 1.25 # cache write, 5m TTL = 1.25x base
OUTPUT_MULT = 5.0    # output tokens = 5x base (for total-spend accounting)
TTL_H       = 1.0    # 1h cache lifetime
PING_H      = 55.0/60.0   # ping every 55 minutes
PREMIUM_THRESHOLD = 200000  # >200K-token prefix on opus => long-context 2x tier
UNLIMITED_H = 1e9
UNLIMITED_TRAIL_CAP_H = 168.0  # a blind "unlimited" pinger left running: cap at 1 week

def base_rate(model):
    m = (model or "").lower()
    if "opus"   in m: return 5.0
    if "sonnet" in m: return 3.0
    if "haiku"  in m: return 1.0
    if "fable"  in m: return 10.0
    return 5.0

def eff_rate(model, prefix, premium):
    r = base_rate(model)
    if premium and "opus" in (model or "").lower() and prefix > PREMIUM_THRESHOLD:
        r *= 2.0
    return r

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
def mine(projects_dir, min_prefix, max_gap_h, stats):
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
def turn_spend(t, premium):
    r = base_rate(t["model"])
    prefix = t["cache_read"] + t["cache_creation"]
    if premium and "opus" in (t["model"] or "").lower() and prefix > PREMIUM_THRESHOLD:
        r *= 2.0
    e1, e5 = t["eph_1h"], t["eph_5m"]
    write = (e1*WRITE_MULT + e5*WRITE_MULT_5M) if (e1+e5) > 0 else t["cache_creation"]*WRITE_MULT
    return (t["input"]*r + write*r + t["cache_read"]*READ_MULT*r + t["output"]*OUTPUT_MULT*r) / 1e6

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

    stats = {"files":0,"unreadable_files":0,"bad_lines":0,"bad_ts":0,"skipped_tiny":0}
    sessions = mine(projects_dir, args.min_prefix, args.max_gap_hours, stats)
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
    def run_full(premium):
        tot = {k:0.0 for k in BASE}; tot["S4_momentum"] = 0.0
        for s in sessions:
            prior = []
            for g in s["gaps"]:
                if not g: continue
                r = eff_rate(g["model"], g["prefix_tokens"], premium)
                cc = gap_costs_fixed(g["gap_hours"], g["prefix_tokens"], r, cutoffs)
                for k in BASE: tot[k] += cc[k]
                C = s4_cutoff(prior)
                tot["S4_momentum"] += blind_gap_cost(g["gap_hours"], g["prefix_tokens"], r, C)
                prior.append(g["gap_hours"])
            last = s["turns"][-1]; r = eff_rate(last[1], last[2], premium)
            tb = trailing_fixed(last[2], r, cutoffs)
            for k in BASE: tot[k] += tb[k]
            tot["S4_momentum"] += pings_to_span(s4_cutoff(prior)) * last[2]*READ_MULT*r/1e6
        return tot
    flat = run_full(False); premium = run_full(True)

    # ---- chronological train/test split for S5 (+ head-to-head) ----
    ss = sorted(sessions, key=lambda s: s["start_ts"])
    split = int(len(ss) * args.train_frac)
    train, test = ss[:split], ss[split:]
    hourc, active, thr, peak = build_activity_profile(train, tz, args.active_threshold_frac)

    fine = [c for c in cutoffs if isinstance(c, int)]
    def run_test(premium):
        keys = (["S0_reality","S1_clairvoyant"] + ["S2_cutoff_%s" % c for c in fine]
                + ["S4_momentum","S5_activity","S6_hybrid"])
        tot = {k:0.0 for k in keys}
        for s in test:
            prior = []
            for g in s["gaps"]:
                if not g: continue
                r = eff_rate(g["model"], g["prefix_tokens"], premium)
                cc = gap_costs_fixed(g["gap_hours"], g["prefix_tokens"], r, cutoffs)
                tot["S0_reality"]     += cc["S0_reality"]
                tot["S1_clairvoyant"] += cc["S1_clairvoyant"]
                for c in fine: tot["S2_cutoff_%s" % c] += cc["S2_cutoff_%s" % c]
                C = s4_cutoff(prior)
                tot["S4_momentum"] += blind_gap_cost(g["gap_hours"], g["prefix_tokens"], r, C)
                tot["S5_activity"] += s5_gap_cost(g["gap_hours"], g["prefix_tokens"], r, active, g["t0"], tz)
                tot["S6_hybrid"]   += s6_gap_cost(g["gap_hours"], g["prefix_tokens"], r, C, active, g["t0"], tz)
                prior.append(g["gap_hours"])
            last = s["turns"][-1]; r = eff_rate(last[1], last[2], premium)
            read1 = last[2]*READ_MULT*r/1e6
            for c in fine: tot["S2_cutoff_%s" % c] += pings_to_span(float(c))*read1
            Cf = s4_cutoff(prior)
            tot["S4_momentum"] += pings_to_span(Cf)*read1
            tot["S5_activity"] += s5_trailing(last[2], r, active, last[0], tz)
            if is_active(active, last[0], tz):
                Cf_act = alive_window(active, last[0], math.ceil(Cf)+2, tz)
                C6 = min(Cf, Cf_act)
                tot["S6_hybrid"] += (pings_to_span(C6)*read1 if C6 > 0 else 0.0)
        return tot
    test_flat = run_test(False); test_prem = run_test(True)

    # ---- total main-session spend + monthly ----
    def month_key(ts):
        lt = datetime.fromtimestamp(ts, tz=timezone.utc) + timedelta(hours=tz)
        return "%04d-%02d" % (lt.year, lt.month)
    all_ts = [t[0] for s in sessions for t in s["turns"]]
    min_ts, max_ts = min(all_ts), max(all_ts)
    span_days = (max_ts - min_ts)/86400.0
    span_months = max(span_days/30.4375, 1e-9)
    total_flat = total_prem = 0.0; month_flat = {}
    for s in sessions:
        for t in s["spend_turns"]:
            cf = turn_spend(t, False); month_flat[month_key(t["ts"])] = month_flat.get(month_key(t["ts"]),0.0)+cf
            total_flat += cf; total_prem += turn_spend(t, True)
    active_months = len(month_flat)

    # ---- distribution buckets ----
    buckets = [("<1h",0,1),("1-2h",1,2),("2-4h",2,4),("4-8h",4,8),
               ("8-12h",8,12),("12-24h",12,24),(">24h",24,1e18)]
    dist = {}
    for name,lo,hi in buckets:
        sel = [g for g in all_gaps if lo <= g["gap_hours"] < hi]
        exp = sum(g["prefix_tokens"]*WRITE_MULT*base_rate(g["model"])/1e6 for g in sel)
        dist[name] = {"count": len(sel), "rebuild_exposure_flat": exp}

    # ---- leaderboard helper ----
    def lb_rows(flat_tot, prem_tot):
        s0, s1 = flat_tot["S0_reality"], flat_tot["S1_clairvoyant"]
        rows = []
        for k, v in flat_tot.items():
            saved = s0 - v; pct = 100*saved/s0 if s0 else 0
            denom = s0 - s1; closef = 100*(s0-v)/denom if denom else 0
            rows.append({"strategy":k, "flat":v, "premium":prem_tot[k],
                         "saved":saved, "pct":pct, "pct_s1":closef})
        rows.sort(key=lambda x: x["flat"]); return rows
    full_rows = lb_rows(flat, premium); test_rows = lb_rows(test_flat, test_prem)

    # ======================= PRINT =======================
    P = print
    def m(x): return "{:,.2f}".format(x)   # money with thousands separator
    P("="*74); P("CLAUDE CODE KEEP-WARM STRATEGY SIMULATOR  (read-only analysis)"); P("="*74)
    # (a) span + counts + dropped
    P("\n[a] DATA SPAN & COUNTS")
    P("  projects dir : %s" % projects_dir)
    P("  date span    : %s .. %s  (%.1f days = %.2f months; %d active months)"
      % (datetime.fromtimestamp(min_ts,tz=timezone.utc).date(),
         datetime.fromtimestamp(max_ts,tz=timezone.utc).date(), span_days, span_months, active_months))
    P("  sessions kept: %d   (of %d transcript files; %d tiny sessions skipped)"
      % (len(sessions), stats["files"], stats["skipped_tiny"]))
    P("  gaps         : %d   session-ends: %d" % (len(all_gaps), len(session_ends)))
    P("  data quality : %d malformed json lines, %d bad timestamps, %d unreadable files (all skipped)"
      % (stats["bad_lines"], stats["bad_ts"], stats["unreadable_files"]))
    P("  dropped gaps > %.0fh: %d events, %.1fh total (excluded)"
      % (args.max_gap_hours, len(dropped), sum(d["gap_hours"] for d in dropped)))
    # (b) spend
    P("\n[b] TOTAL MAIN-SESSION SPEND & CACHE-REBUILD WASTE")
    P("  total main spend : $%s flat   /   $%s premium" % (m(total_flat), m(total_prem)))
    P("  rebuild waste(S0): $%s flat   =  %.2f%% of total spend (flat)"
      % (m(flat["S0_reality"]), 100*flat["S0_reality"]/total_flat if total_flat else 0))
    P("  avg main spend   : $%s / calendar-month   ($%s / active-month)"
      % (m(total_flat/span_months), m(total_flat/active_months if active_months else 0)))
    P("  per-month spend (flat):")
    for k in sorted(month_flat): P("     %s : $%s" % (k, m(month_flat[k])))
    # (c) distribution
    P("\n[c] GAP DISTRIBUTION (where the exposure is)")
    P("  %-8s %8s %20s" % ("bucket","count","rebuild_exposure$"))
    for name,_,_ in buckets:
        P("  %-8s %8d %20.2f" % (name, dist[name]["count"], dist[name]["rebuild_exposure_flat"]))
    P("  note: gaps <=1h cost $0 under every strategy (1h cache survives them for free).")
    # (d) activity profile
    P("\n[d] LEARNED ACTIVITY PROFILE  (local time = UTC%+.0f, trained on first %.0f%% of sessions)"
      % (tz, args.train_frac*100))
    act = sorted(active); dead = sorted(set(range(24))-active)
    peak_h = hourc.index(peak) if peak else None
    P("  active hours (ping through these) : %s" % act)
    P("  dead hours   (give up here)       : %s" % dead)
    P("  busiest hour : %02d:00 local (%d turns); threshold = %.0f turns (>=%.0f%% of peak)"
      % (peak_h if peak_h is not None else 0, peak, thr, args.active_threshold_frac*100))
    # (e) full leaderboard
    def show(rows, s1key="S1_clairvoyant"):
        P("  %-20s %12s %12s %11s %8s %8s" % ("strategy","flat$","premium$","saved$","%saved","%ofS1"))
        for r in rows:
            P("  %-20s %12.3f %12.3f %11.3f %8.1f %8.1f"
              % (r["strategy"], r["flat"], r["premium"], r["saved"], r["pct"], r["pct_s1"]))
    P("\n[e] FULL-DATASET LEADERBOARD (all %d sessions; cheapest first)" % len(sessions))
    P("    S1 = clairvoyant floor (unbeatable). %%ofS1 = share of that floor captured.")
    show(full_rows)
    # (f) test leaderboard
    P("\n[f] HELD-OUT TEST-SET LEADERBOARD (last %.0f%% = %d sessions; fair S5 comparison)"
      % ((1-args.train_frac)*100, len(test)))
    show(test_rows)
    # (g) winner
    real = [r for r in full_rows if r["strategy"] not in ("S1_clairvoyant",)]
    win = real[0]
    P("\n[g] WINNER: %s  ->  saves $%s over the %.2f-month span = $%s/calendar-month "
      "($%s/active-month); captures %.1f%% of the clairvoyant floor."
      % (win["strategy"], m(win["saved"]), span_months, m(win["saved"]/span_months),
         m(win["saved"]/active_months if active_months else 0), win["pct_s1"]))
    P("="*74)

    # ---- optional JSON dump ----
    if args.out:
        out = {
            "meta": {"projects_dir": projects_dir, "tz_offset": tz, "sessions": len(sessions),
                     "files": stats["files"], "gaps": len(all_gaps), "span_days": span_days,
                     "span_months": span_months, "active_months": active_months,
                     "data_quality": stats, "cutoffs": cutoffs, "train_frac": args.train_frac,
                     "active_threshold_frac": args.active_threshold_frac},
            "dropped": {"count": len(dropped), "total_hours": sum(d["gap_hours"] for d in dropped)},
            "spend": {"total_flat": total_flat, "total_premium": total_prem,
                      "rebuild_waste_flat": flat["S0_reality"],
                      "waste_pct_of_total_flat": 100*flat["S0_reality"]/total_flat if total_flat else 0,
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
