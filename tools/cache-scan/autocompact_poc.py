#!/usr/bin/env python3
# =============================================================================
# autocompact_poc.py  --  Claude Code auto-compact threshold optimizer
# =============================================================================
# HEADLINE OUTPUT: "at what context size should auto-compact fire to minimize
# total cost, accounting for the cost of compacting itself?"
#
# WHAT IT DOES
#   Mines your local Claude Code MAIN session transcripts, reconstructs the
#   per-turn context growth from message.usage, and simulates firing auto-compact
#   at a range of candidate context thresholds T. Every turn pays a cache READ of
#   the whole running context (0.1x base) -- so the bigger the context, the more
#   each turn costs, and once opus context passes 200K tokens the base rate itself
#   doubles (long-context premium). Compacting shrinks the context back down, but
#   compacting is not free: it costs one full read of the current context to
#   summarize it, plus generating the summary (output) and re-caching the new
#   smaller base (a 1h cache WRITE). This tool finds the T that minimizes
#   read-burden + compaction-cost across your real history.
#
# HOW TO RUN (read-only; NEVER writes to ~/.claude, only reads):
#   python3 autocompact_poc.py
#   python3 autocompact_poc.py --thresholds 150000,200000,250000 --out results.json
#   python3 autocompact_poc.py --help
#
# Python 3 standard library ONLY. No numpy/pandas, no network, no repo imports.
# Safe to copy to another machine and run against that machine's own history.
# =============================================================================

import argparse, json, os, glob, math, sys, re
from datetime import datetime, timezone, timedelta

# ---- fixed pricing model (base $/1M input tokens by model substring) --------
# (identical to strategy_poc.py so the numbers reconcile with the keep-warm run)
# Calibrated to reproduce `ccusage` (LiteLLM pricing) to the cent on this machine.
READ_MULT     = 0.1    # cache read  = 0.1x base
WRITE_MULT    = 2.0    # cache write, 1h TTL = 2.0x base
WRITE_MULT_5M = 1.25   # cache write, 5m TTL = 1.25x base  (ccusage bills ALL creation here)
OUTPUT_MULT   = 5.0    # output tokens = 5x base
PREMIUM_THRESHOLD = 200000  # >200K-token prefix on opus => long-context 2x tier

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

def eff_rate(model, prefix, premium):
    r = base_rate(model)
    if premium and "opus" in (model or "").lower() and prefix > PREMIUM_THRESHOLD:
        r *= 2.0
    return r

def eff_rate_out(model, prefix, premium):
    """Output rate: base rate scaled by 1.5x (not 2x) in a premium turn --
    matches SPLIT+PREM(o1.5) in verify_against_anthropic.py."""
    r = base_rate(model)
    if premium and "opus" in (model or "").lower() and prefix > PREMIUM_THRESHOLD:
        r *= 1.5
    return r

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
def mine(projects_dir, min_prefix, stats, seen):
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
            turns = []        # per-turn dict (chronological)
            events = []       # real compaction events from compactMetadata
            last_model = None # nearest preceding assistant model (file order)
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
                    # -- real compaction event (Claude Code writes compactMetadata) --
                    cm = d.get("compactMetadata")
                    if isinstance(cm, dict) and "preTokens" in cm:
                        events.append({
                            "trigger": cm.get("trigger"),
                            "pre": cm.get("preTokens", 0) or 0,
                            "post": cm.get("postTokens", 0) or 0,
                            "dropped": cm.get("cumulativeDroppedTokens", 0) or 0,
                            "model": last_model,
                            "ts": parse_ts(d.get("timestamp")),
                        })
                        continue
                    m = d.get("message")
                    if not isinstance(m, dict): continue
                    if m.get("model"): last_model = m.get("model")
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
                    inp = u.get("input_tokens", 0) or 0
                    cr  = u.get("cache_read_input_tokens", 0) or 0
                    cc  = u.get("cache_creation_input_tokens", 0) or 0
                    out = u.get("output_tokens", 0) or 0
                    eph = u.get("cache_creation") or {}
                    turns.append({
                        "ts": ts, "model": m.get("model"),
                        "input": inp, "cache_read": cr, "cache_creation": cc,
                        "output": out,
                        "eph_1h": eph.get("ephemeral_1h_input_tokens", 0) or 0,
                        "eph_5m": eph.get("ephemeral_5m_input_tokens", 0) or 0,
                        # derived
                        "prefix": inp + cr + cc,     # context size this turn
                        "new":    inp + cc,          # newly-added content this turn
                    })
            if not turns: continue
            turns.sort(key=lambda x: x["ts"])
            if not any(t["prefix"] >= min_prefix for t in turns):
                stats["skipped_tiny"] += 1
                continue
            sessions.append({"session_id": sid, "project": project,
                             "start_ts": turns[0]["ts"], "turns": turns,
                             "events": events})
    return sessions

# =============================================================================
# STEP 2 -- reality accounting + real compaction detection
# =============================================================================
def turn_spend(t, premium, default_write=WRITE_MULT_5M):
    """Actual $ cost of one assistant turn from its usage fields (same as strategy_poc).
    Cache creation is billed at the 5m rate (1.25x) by default -- ccusage/LiteLLM does
    NOT honor the ephemeral 1h/5m split, so billing all creation at 5m reconciles to
    the cent (billing the 1h portion at 2.0x overshoots ccusage by ~9-46% per model)."""
    r = base_rate(t["model"])
    if r == 0.0:
        return 0.0    # external / non-Anthropic model -> ccusage shows $0
    prefix = t["cache_read"] + t["cache_creation"]
    is_prem = premium and "opus" in (t["model"] or "").lower() and prefix > PREMIUM_THRESHOLD
    r_in = r * 2.0 if is_prem else r     # input/cache_read/cache_creation: 2x in premium turns
    out_prem_o15 = 1.5 if is_prem else 1.0   # output: 1.5x (not 2x) in premium turns
    write = t["cache_creation"] * default_write
    return (t["input"]*r_in + write*r_in + t["cache_read"]*READ_MULT*r_in
            + t["output"]*OUTPUT_MULT*r*out_prem_o15) / 1e6

def detect_real_compactions(sess, drop_frac, big_prefix):
    """Points where reality actually reset context: prefix drops sharply between
    consecutive turns. Returns list of the prefix size JUST BEFORE each reset."""
    pts = []
    turns = sess["turns"]
    for i in range(1, len(turns)):
        prev = turns[i-1]["prefix"]; cur = turns[i]["prefix"]
        if prev > big_prefix and cur < drop_frac * prev:
            pts.append(prev)
    return pts

# =============================================================================
# STEP 3 -- the auto-compact economic simulation
# =============================================================================
def simulate_threshold(sess, T, summary_size, reset_to, base_tokens, premium,
                       observed_max_prefix):
    """Walk one session's turns tracking simulated running context C.
    Returns (total_cost, compactions, was_extrapolated).
    Per-turn cost = C*read_rate + new*write_rate_1h + output*output_rate.
    Compaction (when C >= T): C*read_rate + summary_size*output_rate
                              + summary_size*write_rate_1h, then C reset to reset_to.
    summary_size / reset_to are MEASURED means (from compactMetadata) when real
    events exist, else the --summary-tokens / base+summary assumption.
    A session is flagged EXTRAPOLATED for this T when T exceeds the largest context
    we ever actually observed in it (we'd be inventing growth we never saw)."""
    C = float(base_tokens)
    total = 0.0
    compactions = 0
    extrapolated = T > observed_max_prefix
    for t in sess["turns"]:
        C += t["new"]
        r = eff_rate(t["model"], C, premium)          # premium flips at 200k (input/read/write: 2x)
        r_out = eff_rate_out(t["model"], C, premium)  # premium flips at 200k (output: 1.5x)
        read_rate   = r * READ_MULT
        write_rate  = r * WRITE_MULT_5M               # Claude Code writes 5m cache by default
        output_rate = r_out * OUTPUT_MULT
        # per-turn intrinsic work + the read burden (the lever)
        total += (C * read_rate
                  + t["new"] * write_rate
                  + t["output"] * output_rate) / 1e6
        if C >= T:
            # compaction cost: one full read to summarize + gen summary + re-cache
            total += (C * read_rate
                      + summary_size * output_rate
                      + summary_size * write_rate) / 1e6
            compactions += 1
            C = float(reset_to)
    return total, compactions, extrapolated


def measured_compaction_cost(pre, post, model, premium):
    """$ cost of one REAL compaction event under our pricing:
    big read of pre-context + generate summary (post tokens) + re-cache summary."""
    r = eff_rate(model, pre, premium)
    r_out = eff_rate_out(model, pre, premium)
    return (pre * r * READ_MULT
            + post * r_out * OUTPUT_MULT
            + post * r * WRITE_MULT_5M) / 1e6

# =============================================================================
# main
# =============================================================================
def main():
    ap = argparse.ArgumentParser(
        description="Find the context-size threshold at which Claude Code auto-compact "
                    "should fire to minimize total cost, accounting for the cost of "
                    "compacting itself. Read-only; never writes to ~/.claude.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("--projects-dir", default="~/.claude/projects",
                    help="Directory of Claude Code project transcripts (~ is expanded).")
    ap.add_argument("--tz-offset", type=float, default=3.0,
                    help="Your local UTC offset in hours (timestamps are UTC). Israel summer=3.")
    ap.add_argument("--min-prefix", type=int, default=20000,
                    help="Ignore sessions whose context never reaches this many tokens.")
    ap.add_argument("--thresholds",
                    default="100000,150000,175000,190000,200000,220000,250000,300000,400000,500000",
                    help="Comma-separated candidate compaction thresholds (absolute tokens).")
    ap.add_argument("--summary-tokens", type=int, default=8000,
                    help="Assumed size of the compaction summary (output + re-cached base).")
    ap.add_argument("--base-tokens", type=int, default=15000,
                    help="Assumed fixed base context (system prompt + tool defs).")
    ap.add_argument("--reset-drop-frac", type=float, default=0.5,
                    help="A prefix drop below this fraction of the previous turn = a real reset.")
    ap.add_argument("--big-prefix", type=int, default=50000,
                    help="Only count a real reset if the pre-drop context exceeded this.")
    ap.add_argument("--out", default=None,
                    help="Optional path to dump full results as JSON (default: write nothing).")
    args = ap.parse_args()

    projects_dir = os.path.expanduser(args.projects_dir)
    tz = args.tz_offset
    thresholds = [int(x.strip()) for x in args.thresholds.split(",") if x.strip()]
    thresholds.sort()

    stats = {"files":0,"unreadable_files":0,"bad_lines":0,"bad_ts":0,"skipped_tiny":0,"dup_rows":0}
    seen = set()   # ONE global (messageId, requestId) set across main + subagent files
    sessions = mine(projects_dir, args.min_prefix, stats, seen)
    if not sessions:
        print("No sessions with a context >= %d tokens found under %s."
              % (args.min_prefix, projects_dir))
        print("Malformed lines skipped: %d ; files scanned: %d" % (stats["bad_lines"], stats["files"]))
        return

    # ---- per-session derived facts ----
    for s in sessions:
        s["real_compactions"] = detect_real_compactions(s, args.reset_drop_frac, args.big_prefix)
        s["observed_max_prefix"] = max(t["prefix"] for t in s["turns"])

    all_turns = [t for s in sessions for t in s["turns"]]
    all_ts = [t["ts"] for t in all_turns]
    min_ts, max_ts = min(all_ts), max(all_ts)
    span_days = (max_ts - min_ts)/86400.0
    span_months = max(span_days/30.4375, 1e-9)

    # ---- S0 reality: actual total cost straight from usage ----
    s0_flat = s0_prem = 0.0
    def month_key(ts):
        lt = datetime.fromtimestamp(ts, tz=timezone.utc) + timedelta(hours=tz)
        return "%04d-%02d" % (lt.year, lt.month)
    month_flat = {}
    permodel = {}   # normalized model id -> flat $ (for ccusage reconciliation)
    for t in all_turns:
        cf = turn_spend(t, False)
        s0_flat += cf; s0_prem += turn_spend(t, True)
        month_flat[month_key(t["ts"])] = month_flat.get(month_key(t["ts"]),0.0)+cf
        nm = norm_model(t["model"]); permodel[nm] = permodel.get(nm,0.0)+cf

    # ---- subagent / workflow spend (nested *.jsonl) for the total denominator ----
    sub_flat = sub_prem = 0.0; sub_files = 0
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
                    scf = turn_spend(t, False, default_write=WRITE_MULT_5M)
                    sub_flat += scf
                    sub_prem += turn_spend(t, True,  default_write=WRITE_MULT_5M)
                    nm = norm_model(t["model"]); permodel[nm] = permodel.get(nm,0.0)+scf
    grand_flat = s0_flat + sub_flat
    grand_prem = s0_prem + sub_prem

    # ---- REAL compaction events (empirical, from compactMetadata) ----
    all_events = [e for s in sessions for e in s["events"]]
    ev_pre  = [e["pre"] for e in all_events if e["pre"]]
    ev_post = [e["post"] for e in all_events if e["post"]]
    have_measured = len(all_events) >= 1
    if have_measured:
        meas_summary = sum(ev_post)/len(ev_post) if ev_post else args.summary_tokens
        meas_pre     = sum(ev_pre)/len(ev_pre) if ev_pre else None
        # postTokens IS the resulting context (base + preserved + summary); reset to it.
        sim_summary = meas_summary
        sim_reset   = meas_summary
        summary_source = "MEASURED"
    else:
        sim_summary = float(args.summary_tokens)
        sim_reset   = float(args.base_tokens + args.summary_tokens)
        summary_source = "ASSUMED"
    # does summary size scale with context, or is it roughly constant?
    scale_note = ""
    if have_measured and len(ev_pre) >= 3 and len(ev_post) >= 3:
        lo_post = [e["post"] for e in all_events if e["pre"] and e["pre"] < 250000 and e["post"]]
        hi_post = [e["post"] for e in all_events if e["pre"] and e["pre"] >= 250000 and e["post"]]
        if lo_post and hi_post:
            lo_m = sum(lo_post)/len(lo_post); hi_m = sum(hi_post)/len(hi_post)
            ratio = hi_m/lo_m if lo_m else 0
            scale_note = ("summary size %s with context (<250k mean=%.0f, >=250k mean=%.0f, ratio %.2fx)"
                          % ("scales up" if ratio > 1.3 else "roughly constant", lo_m, hi_m, ratio))

    # ---- sweep candidate thresholds ----
    results = {}   # T -> dict
    for T in thresholds:
        tf = tp = 0.0
        comps = 0
        meas_flat = extr_flat = 0.0
        n_extr_sessions = 0
        for s in sessions:
            cf, c, extr = simulate_threshold(s, T, sim_summary, sim_reset, args.base_tokens,
                                             False, s["observed_max_prefix"])
            cp, _, _    = simulate_threshold(s, T, sim_summary, sim_reset, args.base_tokens,
                                             True, s["observed_max_prefix"])
            tf += cf; tp += cp; comps += c
            if extr: extr_flat += cf; n_extr_sessions += 1
            else:    meas_flat += cf
        results[T] = {"flat": tf, "premium": tp, "compactions": comps,
                      "measured_flat": meas_flat, "extrapolated_flat": extr_flat,
                      "n_extrapolated_sessions": n_extr_sessions}

    # ---- reality's OBSERVED compaction points ----
    # Prefer the EMPIRICAL compactMetadata preTokens; fall back to structural detection.
    if ev_pre:
        real_points = list(ev_pre)
        real_points_src = "compactMetadata.preTokens"
    else:
        real_points = [p for s in sessions for p in s["real_compactions"]]
        real_points_src = "structural prefix-drop detection"
    real_median = percentile(real_points, 50) if real_points else None

    # ---- winner = min total flat cost ----
    win_T = min(results, key=lambda T: results[T]["flat"])
    win = results[win_T]

    # savings vs S0 reality
    def saved_flat(T): return s0_flat - results[T]["flat"]
    def saved_prem(T): return s0_prem - results[T]["premium"]
    win_saved_flat = saved_flat(win_T)
    win_saved_prem = saved_prem(win_T)
    win_saved_permo = win_saved_flat / span_months

    def pct_total(x_month): return 100*x_month/(grand_flat/span_months) if grand_flat else 0
    def pct_main(x_month):  return 100*x_month/(s0_flat/span_months) if s0_flat else 0

    # ---- 200k premium cliff effect ----
    # how much of the winner's premium-basis saving comes from staying below 200k.
    prem_gap_s0  = s0_prem - s0_flat            # premium surcharge reality paid
    prem_gap_win = win["premium"] - win["flat"] # premium surcharge winner pays
    cliff_saved  = prem_gap_s0 - prem_gap_win   # premium surcharge avoided

    # ---- context-size distribution across turns ----
    dbuckets = [("<50k",0,50000),("50-100k",50000,100000),("100-150k",100000,150000),
                ("150-200k",150000,200000),("200-300k",200000,300000),
                ("300-500k",300000,500000),(">500k",500000,1e18)]
    dist = {}
    for name,lo,hi in dbuckets:
        sel = [t for t in all_turns if lo <= t["prefix"] < hi]
        read_exp = sum(t["prefix"]*READ_MULT*base_rate(t["model"])/1e6 for t in sel)
        dist[name] = {"count": len(sel), "read_exposure_flat": read_exp}

    # ======================= PRINT =======================
    P = print
    def m(x): return "{:,.2f}".format(x)
    def k(x): return "{:,.0f}".format(x)

    total_extr_flat = sum(results[T]["extrapolated_flat"] for T in [win_T])

    # =================== [1] AUTO-COMPACT VERDICT (headline) ===================
    P("="*63)
    P("                  AUTO-COMPACT VERDICT")
    P("="*63)
    P("Data: %d main sessions, %s..%s (%.1f months)"
      % (len(sessions), datetime.fromtimestamp(min_ts,tz=timezone.utc).date(),
         datetime.fromtimestamp(max_ts,tz=timezone.utc).date(), span_months))
    P("Total Claude Code spend: $%s/mo  (main sessions: $%s/mo)"
      % (m(grand_flat/span_months), m(s0_flat/span_months)))
    P("Best auto-compact threshold (min total cost): %s tokens" % k(win_T))
    P("  -> vs reality would have saved: $%s flat total = $%s/mo"
      % (m(win_saved_flat), m(win_saved_permo)))
    P("  -> that is %.1f%% of total spend, %.1f%% of main-session spend"
      % (pct_total(win_saved_permo), pct_main(win_saved_permo)))
    P("  -> premium-basis saving: $%s total ($%s/mo)"
      % (m(win_saved_prem), m(win_saved_prem/span_months)))
    if real_median is not None:
        P("Reality compacts today at ~%s tokens (median of %d observed resets, %s)"
          % (k(real_median), len(real_points), real_points_src))
    else:
        P("Reality: no clear compaction/reset events detected in this history.")
    P("Compaction cost model: %s summary size = %s tok (%s)"
      % (summary_source, k(sim_summary),
         ("mean of %d real events" % len(all_events)) if have_measured else "assumed default"))
    P("200k premium cliff: winner avoids $%s of long-context surcharge"
      % m(cliff_saved))
    if win["n_extrapolated_sessions"]:
        P("CAVEAT: winner is EXTRAPOLATED in %d/%d sessions ($%s of $%s = %.1f%% of its cost)"
          % (win["n_extrapolated_sessions"], len(sessions),
             m(win["extrapolated_flat"]), m(win["flat"]),
             100*win["extrapolated_flat"]/win["flat"] if win["flat"] else 0))
    P("="*63)

    # =================== CCUSAGE RECONCILIATION ===================
    P("\n" + "="*63)
    P("CCUSAGE RECONCILIATION  (script-computed Anthropic spend per model)")
    P("="*63)
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
    P("="*63)

    # =================== [2] threshold sweep table ===================
    P("\nTHRESHOLD SWEEP  (total simulated cost; lower is better)")
    P("  %-9s %12s %12s %12s %12s %8s %6s"
      % ("threshold","total flat$","total prem$","saved$ flat","saved$ prem","%of tot","comps"))
    for T in thresholds:
        r = results[T]
        mark = "  <== WINNER" if T == win_T else ""
        P("  %-9s %12s %12s %12s %12s %7.1f%% %6d%s"
          % (k(T), m(r["flat"]), m(r["premium"]),
             m(saved_flat(T)), m(saved_prem(T)),
             pct_total(saved_flat(T)/span_months), r["compactions"], mark))
    P("  (saved$ = vs S0 reality $%s flat / $%s prem ; %%of tot = share of total CC monthly spend)"
      % (m(s0_flat), m(s0_prem)))
    if summary_source == "MEASURED":
        P("  ASSUMPTIONS: summary/reset size = %s tok  (MEASURED: mean of %d real compactions;"
          % (k(sim_summary), len(all_events)))
        P("               NOT the --summary-tokens default). read %.2fx / write5m %.2fx / output %dx base;"
          % (READ_MULT, WRITE_MULT_5M, int(OUTPUT_MULT)))
    else:
        P("  ASSUMPTIONS: summary=%s tok, base=%s tok  (ASSUMED -- no real compactions found);"
          % (k(args.summary_tokens), k(args.base_tokens)))
        P("               read %.2fx / write5m %.2fx / output %dx base;"
          % (READ_MULT, WRITE_MULT_5M, int(OUTPUT_MULT)))
    P("               compaction cost = full read + summary output + summary re-cache.")
    P("  DEDUP: rows deduped by messageId+requestId (ccusage-style); cache-create")
    P("         billed @5m (1.25x) default; sonnet-5 intro pricing; external models $0.")

    # =================== supporting detail ===================
    P("\n" + "-"*63); P("SUPPORTING DETAIL"); P("-"*63)

    # [A] spend breakdown
    P("\n[A] TOTAL CLAUDE CODE SPEND (denominator for the %% above)")
    P("  main sessions        : $%s flat / $%s premium  (%.1f%% of total)"
      % (m(s0_flat), m(s0_prem), 100*s0_flat/grand_flat if grand_flat else 0))
    P("  subagents/workflows  : $%s flat / $%s premium  (%.1f%% of total)  [%d nested files]"
      % (m(sub_flat), m(sub_prem), 100*sub_flat/grand_flat if grand_flat else 0, sub_files))
    P("  GRAND TOTAL          : $%s flat / $%s premium" % (m(grand_flat), m(grand_prem)))
    P("  per calendar-month   : $%s flat / $%s premium" % (m(grand_flat/span_months), m(grand_prem/span_months)))

    # [B] data span / counts
    P("\n[B] DATA SPAN & COUNTS")
    P("  projects dir : %s" % projects_dir)
    P("  sessions kept: %d   (of %d main transcript files; %d tiny sessions skipped)"
      % (len(sessions), stats["files"], stats["skipped_tiny"]))
    P("  turns        : %d   real resets detected: %d" % (len(all_turns), len(real_points)))
    P("  data quality : %d malformed lines, %d bad timestamps, %d unreadable files (all skipped)"
      % (stats["bad_lines"], stats["bad_ts"], stats["unreadable_files"]))
    P("  dedup        : %d duplicate (messageId+requestId) rows skipped (ccusage-style)"
      % stats["dup_rows"])

    # [C] context-size distribution
    P("\n[C] CONTEXT-SIZE DISTRIBUTION ACROSS TURNS (where the read exposure is)")
    P("  %-10s %8s %20s" % ("bucket","turns","read_exposure$"))
    for name,_,_ in dbuckets:
        P("  %-10s %8d %20.2f" % (name, dist[name]["count"], dist[name]["read_exposure_flat"]))
    P("  note: read exposure = context x 0.1x base, summed per turn (the burden compaction trims).")

    # [D] full leaderboard
    P("\n[D] FULL LEADERBOARD, ALL THRESHOLDS (cheapest total first)")
    P("  %-9s %12s %12s %12s %8s %6s %10s"
      % ("threshold","flat$","premium$","saved$flat","%saved","comps","extrap$"))
    for T in sorted(thresholds, key=lambda T: results[T]["flat"]):
        r = results[T]
        pct = 100*saved_flat(T)/s0_flat if s0_flat else 0
        P("  %-9s %12.2f %12.2f %12.2f %7.1f%% %6d %10.2f"
          % (k(T), r["flat"], r["premium"], saved_flat(T), pct,
             r["compactions"], r["extrapolated_flat"]))

    # [E] MEASURED compaction cost vs context size (empirical, from compactMetadata)
    P("\n[E] MEASURED COMPACTION COST vs CONTEXT SIZE (real events from compactMetadata)")
    if have_measured:
        trig = {}
        for e in all_events: trig[e["trigger"]] = trig.get(e["trigger"],0)+1
        P("  %d real compaction events found (%s)."
          % (len(all_events), ", ".join("%s=%d" % (t,c) for t,c in sorted(trig.items()))))
        P("  overall: mean pre-context=%s tok, mean summary(post)=%s tok"
          % (k(meas_pre) if meas_pre else "n/a", k(meas_summary)))
        if scale_note: P("  %s" % scale_note)
        cb = [("<150k",0,150000),("150-200k",150000,200000),("200-300k",200000,300000),
              ("300-500k",300000,500000),(">500k",500000,1e18)]
        P("  %-10s %6s %12s %12s %12s %12s"
          % ("bucket","events","mean ctx","mean summ","mean $/comp","mean $prem"))
        for name,lo,hi in cb:
            sel = [e for e in all_events if e["pre"] and lo <= e["pre"] < hi]
            if not sel:
                P("  %-10s %6d %12s %12s %12s %12s" % (name,0,"-","-","-","-")); continue
            mc = sum(e["pre"] for e in sel)/len(sel)
            ms = sum(e["post"] for e in sel)/len(sel)
            cf = sum(measured_compaction_cost(e["pre"], e["post"], e["model"], False) for e in sel)/len(sel)
            cp = sum(measured_compaction_cost(e["pre"], e["post"], e["model"], True)  for e in sel)/len(sel)
            P("  %-10s %6d %12s %12s %12.4f %12.4f"
              % (name, len(sel), k(mc), k(ms), cf, cp))
        tot_cf = sum(measured_compaction_cost(e["pre"], e["post"], e["model"], False) for e in all_events)
        tot_cp = sum(measured_compaction_cost(e["pre"], e["post"], e["model"], True)  for e in all_events)
        P("  TOTAL measured compaction spend already paid: $%s flat / $%s premium"
          % (m(tot_cf), m(tot_cp)))
    else:
        P("  NO compaction events detected on this machine.")
        P("  This can mean 1M-context sessions rarely fill enough to trigger auto-compact.")
        P("  Sessions that ever reached each context bucket (max prefix per session):")
        smb = [("<150k",0,150000),("150-200k",150000,200000),("200-300k",200000,300000),
               ("300-500k",300000,500000),(">500k",500000,1e18)]
        for name,lo,hi in smb:
            c = sum(1 for s in sessions if lo <= s["observed_max_prefix"] < hi)
            P("    %-10s %4d sessions" % (name, c))

    # [F] observed real compaction points distribution
    P("\n[F] OBSERVED REAL COMPACTION POINTS  (source: %s)" % real_points_src)
    if real_points:
        P("  events: %d   min: %s   median: %s   p75: %s   max: %s"
          % (len(real_points), k(min(real_points)), k(percentile(real_points,50)),
             k(percentile(real_points,75)), k(max(real_points))))
        rb = [("<100k",0,100000),("100-150k",100000,150000),("150-200k",150000,200000),
              ("200-300k",200000,300000),(">300k",300000,1e18)]
        P("  distribution of pre-reset context size:")
        for name,lo,hi in rb:
            c = sum(1 for p in real_points if lo <= p < hi)
            P("    %-10s %4d" % (name, c))
    else:
        P("  none detected. Reality may rarely hit auto-compact, or sessions end before")
        P("  growing large. All higher thresholds are then extrapolated.")

    # [G] extrapolation caveat
    P("\n[G] EXTRAPOLATION CAVEAT (measured vs extrapolated per threshold)")
    P("  A session is EXTRAPOLATED for threshold T when T exceeds the largest context we")
    P("  actually observed in it -- we then invent growth we never saw. Simulating LOWER")
    P("  (more aggressive) than reality is faithful; simulating HIGHER is an estimate.")
    P("  %-9s %10s %14s %14s %8s"
      % ("threshold","sessions","measured$","extrapolated$","%extrap"))
    for T in thresholds:
        r = results[T]
        pe = 100*r["extrapolated_flat"]/r["flat"] if r["flat"] else 0
        P("  %-9s %10s %14.2f %14.2f %7.1f%%"
          % (k(T), "%d/%d" % (r["n_extrapolated_sessions"], len(sessions)),
             r["measured_flat"], r["extrapolated_flat"], pe))
    P("="*63)

    # ---- optional JSON dump ----
    if args.out:
        out = {
            "meta": {"projects_dir": projects_dir, "tz_offset": tz, "sessions": len(sessions),
                     "files": stats["files"], "turns": len(all_turns),
                     "span_days": span_days, "span_months": span_months,
                     "data_quality": stats, "thresholds": thresholds,
                     "summary_tokens": args.summary_tokens, "base_tokens": args.base_tokens,
                     "reset_drop_frac": args.reset_drop_frac, "big_prefix": args.big_prefix},
            "spend": {"main_flat": s0_flat, "main_premium": s0_prem,
                      "subagent_flat": sub_flat, "subagent_premium": sub_prem,
                      "grand_flat": grand_flat, "grand_premium": grand_prem,
                      "grand_per_month_flat": grand_flat/span_months,
                      "by_month_flat": month_flat},
            "winner": {"threshold": win_T, "flat": win["flat"], "premium": win["premium"],
                       "saved_flat": win_saved_flat, "saved_premium": win_saved_prem,
                       "saved_per_month_flat": win_saved_permo,
                       "pct_of_total": pct_total(win_saved_permo),
                       "pct_of_main": pct_main(win_saved_permo),
                       "cliff_saved": cliff_saved,
                       "n_extrapolated_sessions": win["n_extrapolated_sessions"]},
            "sweep": {str(T): results[T] for T in thresholds},
            "real_compactions": {"count": len(real_points), "median": real_median,
                                 "source": real_points_src, "points": real_points},
            "measured_compaction": {"summary_source": summary_source,
                                    "n_events": len(all_events),
                                    "mean_pre": meas_pre if have_measured else None,
                                    "mean_summary": sim_summary if have_measured else None,
                                    "sim_summary": sim_summary, "sim_reset": sim_reset},
            "context_distribution": dist,
        }
        try:
            with open(os.path.expanduser(args.out), "w") as f:
                json.dump(out, f, indent=2)
            P("results JSON -> %s" % args.out)
        except OSError as e:
            sys.stderr.write("could not write --out file: %s\n" % e)

if __name__ == "__main__":
    main()
