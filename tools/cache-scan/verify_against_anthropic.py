#!/usr/bin/env python3
# =============================================================================
# verify_against_anthropic.py -- reconcile our local JSONL cost estimate against
#                                Anthropic's ACTUAL billing (Admin API).
# =============================================================================
# WHY
#   We estimate Claude Code spend locally from ~/.claude/projects/*.jsonl using a
#   fixed pricing model. This tool proves those numbers against Anthropic's own
#   ground truth by pulling two org-level Admin API reports and printing all three
#   sources side by side:
#
#     Source 1 -- Admin API Cost Report  : REAL USD Anthropic billed (gold standard)
#     Source 2 -- Admin API Usage Report : authoritative token counts WITH the
#                                          1h/5m cache-creation split Anthropic bills
#     Source 3 -- OUR local estimate     : from the JSONL, two bases:
#                   FLAT  = all cache_create @1.25x (what buggy ccusage reports)
#                   SPLIT = 1h@2.0x + 5m@1.25x      (what we believe is the true cost)
#
# OUTPUT
#   [1] RECONCILIATION HEADLINE : per model + TOTAL, real$ vs our SPLIT$ vs FLAT$
#   [2] TOKEN CROSS-CHECK       : our JSONL tokens vs Anthropic usage tokens, %% diff
#   [3] NOTES                   : counts, date range, which sources succeeded
#
# READ-ONLY. Python 3 standard library ONLY (urllib, json, argparse, datetime,
# glob, os). No pip installs -- safe to copy to the API-billed machine and run.
#
# The admin key is read from --admin-key or env ANTHROPIC_ADMIN_KEY only. It is
# NEVER printed, logged, or written to --out.
# =============================================================================

import argparse, json, os, glob, sys, re
from datetime import datetime, timezone, timedelta
import urllib.request, urllib.error, urllib.parse

# ---- fixed pricing model (identical core to autocompact_poc.py) --------------
READ_MULT     = 0.1    # cache read           = 0.1x  base
WRITE_MULT_1H = 2.0    # cache create, 1h TTL = 2.0x  base
WRITE_MULT_5M = 1.25   # cache create, 5m TTL = 1.25x base
OUTPUT_MULT   = 5.0    # output tokens        = 5x    base
PREMIUM_THRESHOLD = 200000  # >200K-token prefix on opus => long-context 2x tier

API_BASE   = "https://api.anthropic.com"
API_VER    = "2023-06-01"
COST_PATH  = "/v1/organizations/cost_report"
USAGE_PATH = "/v1/organizations/usage_report/messages"


def base_rate(model):
    """Base $/1M input tokens by model substring (matches autocompact_poc.py)."""
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


# =============================================================================
# SOURCE 3 -- our local estimate from ~/.claude/projects JSONL
# =============================================================================
def scan_local(projects_dir, start_ts, end_ts, stats, seen):
    """Aggregate per normalized-model FLAT/SPLIT $ and token counts from the JSONL.
    Scans MAIN sessions (top-level *.jsonl) AND subagent/workflow files (nested)
    so the total matches what Anthropic billed for the whole org window.
    Only rows whose timestamp is within [start_ts, end_ts) are counted."""
    permodel = {}   # norm model -> aggregate dict

    def slot(nm):
        if nm not in permodel:
            permodel[nm] = {"flat": 0.0, "split": 0.0, "split_prem": 0.0,
                            "split_prem_o15": 0.0,
                            "input": 0, "output": 0, "cache_read": 0,
                            "cache_create_1h": 0, "cache_create_5m": 0,
                            "turns": 0, "prem_turns": 0,
                            "prem_delta_input": 0.0, "prem_delta_cread": 0.0,
                            "prem_delta_ccreate": 0.0, "prem_delta_output": 0.0}
        return permodel[nm]

    def account(rec, msg):
        u = msg.get("usage")
        if not isinstance(u, dict): return
        key = dedup_key(rec, msg)             # ONE global dedup set (main + nested)
        if key is not None:
            if key in seen:
                stats["dup_rows"] += 1; return
            seen.add(key)
        ts = parse_ts(rec.get("timestamp"))
        if ts is None:
            stats["bad_ts"] += 1; return
        if start_ts is not None and ts < start_ts: stats["out_of_range"] += 1; return
        if end_ts   is not None and ts >= end_ts:  stats["out_of_range"] += 1; return

        model = msg.get("model")
        r = base_rate(model)
        inp = u.get("input_tokens", 0) or 0
        cr  = u.get("cache_read_input_tokens", 0) or 0
        cc  = u.get("cache_creation_input_tokens", 0) or 0
        out = u.get("output_tokens", 0) or 0
        eph = u.get("cache_creation") or {}
        e1h = eph.get("ephemeral_1h_input_tokens", 0) or 0
        e5m = eph.get("ephemeral_5m_input_tokens", 0) or 0
        # If the ephemeral split is absent but a creation total exists, treat all
        # creation as 5m (that is exactly what FLAT/ccusage assume).
        if e1h == 0 and e5m == 0 and cc > 0:
            e5m = cc

        nm = norm_model(model)
        s = slot(nm)
        s["input"]           += inp
        s["output"]          += out
        s["cache_read"]      += cr
        s["cache_create_1h"] += e1h
        s["cache_create_5m"] += e5m
        s["turns"] += 1
        stats["rows_counted"] += 1

        if r == 0.0:                          # external model -> $0 (both bases)
            return
        read_cost = cr * READ_MULT * r
        out_cost  = out * OUTPUT_MULT * r
        inp_cost  = inp * r
        flat_write  = cc * WRITE_MULT_5M * r
        split_write = (e1h * WRITE_MULT_1H + e5m * WRITE_MULT_5M) * r
        s["flat"]  += (inp_cost + flat_write  + read_cost + out_cost) / 1e6
        s["split"] += (inp_cost + split_write + read_cost + out_cost) / 1e6
        # SPLIT + long-context premium: on opus turns whose prefix (input+read+
        # create) exceeds 200k tokens, Anthropic doubles the base rate for that
        # turn (same premium logic as autocompact_poc.py / strategy_poc.py).
        prefix = inp + cr + cc
        is_prem = ("opus" in (model or "").lower() and prefix > PREMIUM_THRESHOLD)
        prem = 2.0 if is_prem else 1.0
        rp = r * prem
        write_base = (e1h * WRITE_MULT_1H + e5m * WRITE_MULT_5M) * r   # 1x-base write $ (per-token rate already folds 1h/5m mult)
        s["split_prem"] += (inp * rp + write_base * prem
                            + cr * READ_MULT * rp + out * OUTPUT_MULT * rp) / 1e6
        # SPLIT+PREM(o1.5): identical premium logic, EXCEPT output is billed at
        # 1.5x base instead of 2x base in a premium turn. Input/cache_read/
        # cache_creation stay at 2x (same as split_prem above).
        out_prem_o15 = 1.5 if is_prem else 1.0
        s["split_prem_o15"] += (inp * rp + write_base * prem + cr * READ_MULT * rp
                                + out * OUTPUT_MULT * r * out_prem_o15) / 1e6
        if is_prem:
            s["prem_turns"] += 1
            # component deltas: extra $ that the 2x premium adds over 1x base,
            # for this turn, per component (used by the [1b] diagnostic below).
            s["prem_delta_input"]   += (inp * r * 2.0 - inp * r) / 1e6
            s["prem_delta_cread"]   += (cr * READ_MULT * r * 2.0 - cr * READ_MULT * r) / 1e6
            s["prem_delta_ccreate"] += (write_base * 2.0 - write_base) / 1e6
            s["prem_delta_output"]  += (out * OUTPUT_MULT * r * 2.0 - out * OUTPUT_MULT * r) / 1e6

    if not os.path.isdir(projects_dir):
        sys.stderr.write("ERROR: projects dir not found: %s\n"
                         "Is Claude Code installed for this user? Try --projects-dir.\n"
                         % projects_dir)
        sys.exit(2)

    for projdir in sorted(glob.glob(os.path.join(projects_dir, "*"))):
        if not os.path.isdir(projdir): continue
        # every *.jsonl under the project (main + nested subagent files)
        for jf in glob.glob(os.path.join(projdir, "**", "*.jsonl"), recursive=True):
            stats["files"] += 1
            is_main = (os.path.dirname(jf) == projdir)
            stats["main_files" if is_main else "sub_files"] += 1
            try:
                fh = open(jf, errors="replace")
            except OSError:
                stats["unreadable_files"] += 1; continue
            with fh:
                seen_session = False
                for line in fh:
                    line = line.strip()
                    if not line: continue
                    try:
                        d = json.loads(line)
                    except Exception:
                        stats["bad_lines"] += 1; continue
                    m = d.get("message")
                    if isinstance(m, dict) and isinstance(m.get("usage"), dict):
                        account(d, m)
                        if not seen_session:
                            seen_session = True; stats["sessions"] += 1
    return permodel


# =============================================================================
# Admin API helpers (Source 1 & 2)
# =============================================================================
def api_get(path, params, admin_key):
    """GET a paginated Admin API report; returns the concatenated list of buckets
    (the 'data' arrays merged). Raises urllib.error.HTTPError on 4xx/5xx."""
    buckets = []
    page = None
    while True:
        q = list(params)                      # list of (k, v) preserving repeats
        if page: q = q + [("page", page)]
        url = API_BASE + path + "?" + urllib.parse.urlencode(q, doseq=False)
        req = urllib.request.Request(url, method="GET")
        req.add_header("x-api-key", admin_key)        # admin key never logged
        req.add_header("anthropic-version", API_VER)
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        buckets.extend(body.get("data", []) or [])
        if body.get("has_more") and body.get("next_page"):
            page = body["next_page"]
        else:
            break
    return buckets


def fetch_cost(start_iso, end_iso, admin_key):
    """Source 1: real USD per model. amount is 'lowest currency units' (cents) as a
    decimal string -> divide by 100 for USD. Grouped by description to get model."""
    params = [("starting_at", start_iso), ("ending_at", end_iso),
              ("bucket_width", "1d"), ("group_by[]", "description"),
              ("limit", "31")]
    buckets = api_get(COST_PATH, params, admin_key)
    permodel = {}   # norm model -> USD
    total = 0.0
    per_day = {}
    for b in buckets:
        day = (b.get("starting_at") or "")[:10]
        for item in b.get("results", []) or []:
            if (item.get("currency") or "USD") != "USD":
                continue
            try:
                usd = float(item.get("amount", "0")) / 100.0   # cents -> USD
            except (TypeError, ValueError):
                usd = 0.0
            total += usd
            per_day[day] = per_day.get(day, 0.0) + usd
            nm = norm_model(item.get("model")) if item.get("model") else "(non-token)"
            permodel[nm] = permodel.get(nm, 0.0) + usd
    return {"permodel": permodel, "total": total, "per_day": per_day,
            "buckets": len(buckets)}


def fetch_usage(start_iso, end_iso, admin_key):
    """Source 2: token counts per model with the 1h/5m cache-creation split."""
    params = [("starting_at", start_iso), ("ending_at", end_iso),
              ("bucket_width", "1d"), ("group_by[]", "model"),
              ("limit", "31")]
    buckets = api_get(USAGE_PATH, params, admin_key)
    permodel = {}

    def slot(nm):
        if nm not in permodel:
            permodel[nm] = {"input": 0, "output": 0, "cache_read": 0,
                            "cache_create_1h": 0, "cache_create_5m": 0}
        return permodel[nm]

    for b in buckets:
        for item in b.get("results", []) or []:
            nm = norm_model(item.get("model")) if item.get("model") else "?"
            s = slot(nm)
            cc = item.get("cache_creation") or {}
            s["input"]           += item.get("uncached_input_tokens", 0) or 0
            s["output"]          += item.get("output_tokens", 0) or 0
            s["cache_read"]      += item.get("cache_read_input_tokens", 0) or 0
            s["cache_create_1h"] += cc.get("ephemeral_1h_input_tokens", 0) or 0
            s["cache_create_5m"] += cc.get("ephemeral_5m_input_tokens", 0) or 0
    return {"permodel": permodel, "buckets": len(buckets)}


# =============================================================================
# main
# =============================================================================
def main():
    ap = argparse.ArgumentParser(
        description="Reconcile our local Claude Code cost estimate against "
                    "Anthropic's actual billing (Admin API). Read-only.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ap.add_argument("--admin-key", default=None,
                    help="Org Admin key (sk-ant-admin01-...). Else env ANTHROPIC_ADMIN_KEY. "
                         "Never printed or written to --out.")
    ap.add_argument("--start", default=None, help="Start date ISO (YYYY-MM-DD). Default: 30 days ago.")
    ap.add_argument("--end",   default=None, help="End date ISO (YYYY-MM-DD, exclusive). Default: today.")
    ap.add_argument("--projects-dir", default="~/.claude/projects",
                    help="Claude Code transcripts directory (~ expanded).")
    ap.add_argument("--tz-offset", type=float, default=3.0,
                    help="Local UTC offset in hours (informational; ranges are UTC).")
    ap.add_argument("--out", default=None, help="Optional JSON dump path (key never included).")
    ap.add_argument("--no-api", action="store_true",
                    help="Skip the Admin API; run the local estimate only.")
    args = ap.parse_args()

    # ---- resolve date range (UTC day boundaries) ----
    today = datetime.now(timezone.utc).date()
    end_date   = datetime.fromisoformat(args.end).date()   if args.end   else today
    start_date = datetime.fromisoformat(args.start).date() if args.start else (end_date - timedelta(days=30))
    start_iso = start_date.strftime("%Y-%m-%dT00:00:00Z")
    end_iso   = end_date.strftime("%Y-%m-%dT00:00:00Z")
    start_ts  = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc).timestamp()
    end_ts    = datetime(end_date.year, end_date.month, end_date.day, tzinfo=timezone.utc).timestamp()

    projects_dir = os.path.expanduser(args.projects_dir)

    # ---- Source 3: local estimate (always) ----
    stats = {"files": 0, "main_files": 0, "sub_files": 0, "sessions": 0,
             "rows_counted": 0, "dup_rows": 0, "bad_lines": 0, "bad_ts": 0,
             "out_of_range": 0, "unreadable_files": 0}
    seen = set()
    local = scan_local(projects_dir, start_ts, end_ts, stats, seen)

    # ---- Source 1 & 2: Admin API (unless --no-api) ----
    admin_key = args.admin_key or os.environ.get("ANTHROPIC_ADMIN_KEY")
    cost = usage = None
    api_error = None
    src1_ok = src2_ok = False
    if not args.no_api:
        if not admin_key:
            api_error = ("No admin key provided. Pass --admin-key or set "
                         "ANTHROPIC_ADMIN_KEY (org Admin key sk-ant-admin01-...).")
        else:
            try:
                cost = fetch_cost(start_iso, end_iso, admin_key); src1_ok = True
            except urllib.error.HTTPError as e:
                api_error = "Cost Report HTTP %s: %s" % (e.code, e.reason)
                if e.code in (401, 403):
                    api_error += ("  -- individual/non-admin keys cannot use org "
                                  "endpoints; need an org Admin key sk-ant-admin01-...")
            except Exception as e:
                api_error = "Cost Report request failed: %s" % e
            if src1_ok:
                try:
                    usage = fetch_usage(start_iso, end_iso, admin_key); src2_ok = True
                except urllib.error.HTTPError as e:
                    api_error = "Usage Report HTTP %s: %s" % (e.code, e.reason)
                except Exception as e:
                    api_error = "Usage Report request failed: %s" % e

    # ======================= PRINT =======================
    P = print
    def money(x): return "{:,.2f}".format(x)
    def toks(x):  return "{:,d}".format(int(x))
    def pct(a, b):
        if not b: return "   n/a"
        return "%+7.1f%%" % ((a - b) / b * 100.0)

    P("=" * 84)
    P("  RECONCILE LOCAL ESTIMATE vs ANTHROPIC ACTUAL BILLING")
    P("=" * 84)
    P("  Window (UTC): %s  ..  %s   (exclusive end)" % (start_iso, end_iso))
    P("  Projects dir: %s" % projects_dir)
    api_note = "(local-only, --no-api)" if args.no_api else \
               ("Src1+Src2 OK" if src2_ok else ("Src1 OK" if src1_ok else "API unavailable"))
    P("  Sources     : Source 3 local always; Admin API: %s" % api_note)
    if api_error:
        P("  ADMIN API   : %s" % api_error)
        if not args.no_api:
            P("                Falling back to local-estimate-only.")
            P("                MANUAL FALLBACK: Console -> platform.claude.com -> Usage / Cost")
            P("                -> export CSV for %s..%s and compare to our SPLIT total below."
              % (start_date, end_date))
    P("=" * 84)

    # ---- union of model ids across sources ----
    models = set(local) | (set(cost["permodel"]) if cost else set()) \
                        | (set(usage["permodel"]) if usage else set())
    # sort by our local SPLIT descending
    def local_split(nm): return local.get(nm, {}).get("split", 0.0)
    order = sorted(models, key=lambda nm: -local_split(nm))

    # =================== [1] RECONCILIATION HEADLINE ===================
    P("\n[1] RECONCILIATION HEADLINE  (USD per model)")
    P("    %-20s %14s %14s %14s %14s %14s %13s"
      % ("model", "real$ (Src1)", "SPLIT+PREM$", "SPLIT+PREM(o1.5)$", "SPLIT$", "FLAT$", "prem vs real"))
    P("    " + "-" * 108)
    t_real = t_split = t_flat = t_prem = t_prem15 = 0.0
    for nm in order:
        l = local.get(nm, {})
        sp = l.get("split", 0.0); fl = l.get("flat", 0.0); pr = l.get("split_prem", 0.0)
        pr15 = l.get("split_prem_o15", 0.0)
        real = cost["permodel"].get(nm) if cost else None
        t_split += sp; t_flat += fl; t_prem += pr; t_prem15 += pr15
        real_s = money(real) if real is not None else "   (n/a)"
        if real is not None:
            t_real += real
            diff = pct(pr, real)
        else:
            diff = "   n/a"
        # skip all-zero external rows to keep the table clean
        if sp == 0 and fl == 0 and pr == 0 and (real is None or real == 0):
            continue
        P("    %-20s %14s %14s %18s %14s %14s %13s"
          % (nm[:20], real_s, money(pr), money(pr15), money(sp), money(fl), diff))
    P("    " + "-" * 108)
    real_tot_s = money(t_real) if cost else "   (n/a)"
    P("    %-20s %14s %14s %18s %14s %14s %13s"
      % ("TOTAL", real_tot_s, money(t_prem), money(t_prem15), money(t_split), money(t_flat),
         pct(t_prem, t_real) if cost else "   n/a"))
    if cost:
        # cost report may include non-token line items (code_execution, web_search,
        # session_usage) that our token-only estimate cannot see.
        nontok = cost["permodel"].get("(non-token)", 0.0)
        if nontok:
            P("    note: Src1 real total includes $%s of non-token line items "
              "(code exec / web search / session) that Source 3 does not model."
              % money(nontok))
        P("    note: SPLIT+PREM is our best match to the real bill: SPLIT basis PLUS "
          "the 200k long-context")
        P("          premium (opus turns whose prefix >200k billed at 2x base). "
          "SPLIT/FLAT omit that premium.")
        P("    note: SPLIT+PREM(o1.5) is a hypothesis test -- same as SPLIT+PREM, "
          "except OUTPUT tokens in a premium")
        P("          turn are billed at 1.5x base instead of 2x base. Input/cache_read/"
          "cache_creation stay at 2x in both.")

    # =================== [1b] PREMIUM DIAGNOSTIC (per model) ===================
    P("\n[1b] PREMIUM DIAGNOSTIC (per model)")
    P("    Breaks the SPLIT+PREM delta over SPLIT into its four component deltas, so we")
    P("    can see exactly how many dollars each component's 2x premium adds, and how much")
    P("    the gap would shrink if OUTPUT were billed at 1.5x instead of 2x in premium turns.")
    P("    " + "-" * 108)
    for nm in order:
        l = local.get(nm, {})
        turns = l.get("turns", 0)
        if turns == 0:
            continue
        prem_turns = l.get("prem_turns", 0)
        if prem_turns == 0:
            continue    # no premium turns for this model -> nothing to diagnose
        pct_prem = 100.0 * prem_turns / turns if turns else 0.0
        sp = l.get("split", 0.0)
        pr = l.get("split_prem", 0.0)
        delta = pr - sp
        d_in  = l.get("prem_delta_input", 0.0)
        d_cr  = l.get("prem_delta_cread", 0.0)
        d_cc  = l.get("prem_delta_ccreate", 0.0)
        d_out = l.get("prem_delta_output", 0.0)
        d_out15 = d_out / 2.0   # extra $ output premium would add at 1.5x instead of 2x
        P("    %s" % nm[:40])
        P("      turns total=%d  premium turns=%d (%.1f%%)"
          % (turns, prem_turns, pct_prem))
        P("      SPLIT (no premium) $   = %s" % money(sp))
        P("      SPLIT+PREM delta  $    = %s   (= SPLIT+PREM - SPLIT)" % money(delta))
        P("        input-premium$      = %s" % money(d_in))
        P("        cache_read-prem$    = %s" % money(d_cr))
        P("        cache_creation-prem$= %s" % money(d_cc))
        P("        output-premium$     = %s   (2x - 1x on output, premium turns)" % money(d_out))
        P("        output-premium$@1.5x= %s   (half of above; delta if output were 1.5x not 2x)"
          % money(d_out15))
        P("      SPLIT+PREM(o1.5) delta $ = %s   (input+cread+ccreate@2x, output@1.5x)"
          % money(d_in + d_cr + d_cc + d_out15))
    P("    " + "-" * 108)

    # =================== [2] TOKEN CROSS-CHECK ===================
    P("\n[2] TOKEN CROSS-CHECK  (our JSONL Src3 vs Anthropic usage Src2)")
    if not usage:
        P("    Source 2 unavailable (%s)." % ("--no-api" if args.no_api else "API error"))
        P("    Showing our local token counts only:")
        P("    %-20s %14s %14s %14s %14s %14s"
          % ("model", "input", "output", "cache_read", "cc_1h", "cc_5m"))
        for nm in order:
            l = local.get(nm)
            if not l: continue
            if not any(l[k] for k in ("input","output","cache_read","cache_create_1h","cache_create_5m")):
                continue
            P("    %-20s %14s %14s %14s %14s %14s"
              % (nm[:20], toks(l["input"]), toks(l["output"]), toks(l["cache_read"]),
                 toks(l["cache_create_1h"]), toks(l["cache_create_5m"])))
    else:
        fields = [("input", "input"), ("output", "output"),
                  ("cache_read", "cache_read"),
                  ("cache_create_1h", "cc_1h"), ("cache_create_5m", "cc_5m")]
        flagged = []
        for nm in order:
            l = local.get(nm, {}); u = usage["permodel"].get(nm, {})
            if not l and not u: continue
            has = any(l.get(f[0], 0) or u.get(f[0], 0) for f in fields)
            if not has: continue
            P("    %s" % nm[:40])
            P("      %-16s %16s %16s %10s" % ("field", "ours (Src3)", "Anthropic (Src2)", "diff%"))
            for f, label in fields:
                ov = l.get(f, 0); av = u.get(f, 0)
                d = pct(ov, av)
                mark = ""
                if av and abs(ov - av) / av > 0.02:
                    mark = "  <-- >2%"
                    flagged.append((nm, label))
                P("      %-16s %16s %16s %10s%s" % (label, toks(ov), toks(av), d, mark))
        # TOTAL row
        P("    %s" % "TOTAL (all models)")
        P("      %-16s %16s %16s %10s" % ("field", "ours (Src3)", "Anthropic (Src2)", "diff%"))
        for f, label in fields:
            ov = sum(local.get(nm, {}).get(f, 0) for nm in models)
            av = sum(usage["permodel"].get(nm, {}).get(f, 0) for nm in models)
            P("      %-16s %16s %16s %10s" % (label, toks(ov), toks(av), pct(ov, av)))
        if flagged:
            P("    FLAGGED >2%% token diff: %s"
              % ", ".join("%s/%s" % (m, f) for m, f in flagged))
        else:
            P("    All per-model token fields within 2%% of Anthropic's records.")

    # =================== [3] NOTES ===================
    P("\n[3] NOTES")
    P("    date range used : %s .. %s (UTC, exclusive end)" % (start_date, end_date))
    P("    local files     : %d total (%d main, %d nested subagent), %d unreadable"
      % (stats["files"], stats["main_files"], stats["sub_files"], stats["unreadable_files"]))
    P("    local sessions  : %d   rows counted: %d   dups skipped: %d"
      % (stats["sessions"], stats["rows_counted"], stats["dup_rows"]))
    P("    rows dropped    : %d out-of-range, %d bad-timestamp, %d malformed lines"
      % (stats["out_of_range"], stats["bad_ts"], stats["bad_lines"]))
    P("    sources         : Source 3 (local) = OK; Source 1 (cost) = %s; Source 2 (usage) = %s"
      % ("OK" if src1_ok else "unavailable", "OK" if src2_ok else "unavailable"))
    if cost:
        P("    Src1 real total : $%s over %d daily buckets" % (money(cost["total"]), cost["buckets"]))
        if cost["per_day"]:
            P("    per-day USD (Src1):")
            for day in sorted(cost["per_day"]):
                P("      %s  $%s" % (day, money(cost["per_day"][day])))
    P("    pricing basis   : read %.2fx / output %dx / cache-create 5m %.2fx, 1h %.2fx of base;"
      % (READ_MULT, int(OUTPUT_MULT), WRITE_MULT_5M, WRITE_MULT_1H))
    P("                      FLAT bills all cache-create @5m; SPLIT honors the 1h/5m fields.")
    P("=" * 84)

    # ---- optional JSON dump (NEVER contains the key) ----
    if args.out:
        out = {
            "meta": {"start": str(start_date), "end": str(end_date),
                     "start_iso": start_iso, "end_iso": end_iso,
                     "projects_dir": projects_dir, "tz_offset": args.tz_offset,
                     "stats": stats,
                     "src1_ok": src1_ok, "src2_ok": src2_ok, "api_error": api_error},
            "source3_local": local,
            "source1_cost": {"permodel": cost["permodel"], "total": cost["total"],
                             "per_day": cost["per_day"]} if cost else None,
            "source2_usage": usage["permodel"] if usage else None,
            "totals": {"real": t_real if cost else None, "split_prem": t_prem,
                       "split_prem_o15": t_prem15,
                       "split": t_split, "flat": t_flat},
        }
        try:
            with open(os.path.expanduser(args.out), "w") as f:
                json.dump(out, f, indent=2)
            P("results JSON -> %s  (admin key NOT included)" % args.out)
        except OSError as e:
            sys.stderr.write("could not write --out file: %s\n" % e)


if __name__ == "__main__":
    main()
