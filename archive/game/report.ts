// report.ts - the post-run report: a cache_diagnose.py pastiche computed over
// state.ledger, plus the "WHAT THE UI NEVER TOLD YOU" hidden-cost ledger and the
// real-tool CTA. Ported from build/sim-mock.html showReport / issueLines /
// leverName. Pure: given a finished GameState it returns strings + rows.

import { totalSpent } from "./step.js";
import type { GameState, HiddenCosts, LedgerRow } from "./types.js";

export function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
function pad(s: string | number, n: number): string {
  let out = String(s);
  while (out.length < n) out = " " + out;
  return out;
}
const tokCol = (n: number): string => pad(fmt(Math.round(n)), 16);

function biggest(h: HiddenCosts): keyof HiddenCosts {
  let best: keyof HiddenCosts = "idleRebuildUsd";
  let bv = -1;
  (Object.keys(h) as (keyof HiddenCosts)[]).forEach((k) => {
    if (h[k] > bv) {
      bv = h[k];
      best = k;
    }
  });
  return best;
}
const LEVER: Record<keyof HiddenCosts, string> = {
  idleRebuildUsd: "Idle rebuilds (came back after >1h)",
  reworkUsd: "Rework from cheap models",
  inlineRereadUsd: "Inline context re-reads",
  hookUsd: "Dynamic hook catalog poisoning",
  eagerSkillsUsd: "Eager skills catalog",
  flagDeltaUsd: "1h flag below break-even",
};

export interface HiddenRow {
  label: string;
  amount: number;
  note: string;
  href: string;
}

export interface Report {
  grade: "A" | "B" | "C" | "D";
  won: boolean;
  title: string;
  lead: string;
  pre: string;
  hiddenRows: HiddenRow[];
  hiddenTotal: number;
  handCodedHrs: string;
  offerWeek: boolean;
}

const LOSS_NAME: Record<string, string> = {
  L1: "The Overnight Tax",
  L2: "The $400 Fan-Out",
  L5: "The Poisoned Catalog",
  L6: "You Paid 2x For Nothing",
  L7: "Cheap But Late",
  L8: "Bob Coded It Himself",
};

export function buildReport(st: GameState): Report {
  const spent = totalSpent(st);
  const agg = { input: 0, output: 0, read: 0, write1h: 0, write5m: 0, cost: 0 };
  const byModel: Record<string, number> = {};
  st.ledger.forEach((r: LedgerRow) => {
    agg.input += r.inputTok;
    agg.output += r.outTok;
    agg.read += r.readTok;
    if (r.writeTier === "1h") agg.write1h += r.writeTok;
    else agg.write5m += r.writeTok;
    agg.cost += r.usd;
    byModel[r.model] = (byModel[r.model] || 0) + r.usd;
  });
  const writeTot = agg.write1h + agg.write5m;
  const h = st.hidden;
  const hiddenTotal =
    h.reworkUsd + h.inlineRereadUsd + h.idleRebuildUsd + h.hookUsd + h.eagerSkillsUsd + h.flagDeltaUsd;
  const recoverable = Math.min(hiddenTotal, spent);
  const pctRec = spent > 0 ? (recoverable / spent) * 100 : 0;
  const manualH = st.manualHours;
  const ratio = st.ratioDen > 0 ? st.ratioNum / st.ratioDen : 0;

  const gradeVal = st.wallet - 4 * manualH;
  const grade: Report["grade"] =
    gradeVal > st.budget * 0.3 ? "A" : gradeVal > 0 ? "B" : gradeVal > -st.budget * 0.4 ? "C" : "D";
  const won = st.ended?.result === "win";

  const issues = [
    [
      "Delegate tax (repeated cold subagent bases)",
      h.eagerSkillsUsd + (st.counts.coldSpawns > 0 ? 0.0001 : 0),
      st.counts.coldSpawns + " fully cold spawns rewrite a base",
    ],
    [
      "Idle rebuilds (came back after >1h)",
      h.idleRebuildUsd,
      st.counts.idleGaps + " idle gaps rebuilt the base at write price",
    ],
    [
      "Rework from upstream model choice",
      h.reworkUsd,
      st.counts.reviewRounds + " review rounds + " + st.counts.bugs + " bugs",
    ],
    ["Oversized tool base (MCP / catalogs)", h.eagerSkillsUsd, "eager skills + MCP carried into every cold base"],
  ] as [string, number, string][];
  const issueLines = issues
    .map((it, i) => "  " + (i + 1) + ". " + it[0] + "\n     ~$" + it[1].toFixed(2) + " API-equiv - " + it[2])
    .join("\n");

  const byModelLines = Object.keys(byModel)
    .map((mm) => "    " + pad(mm, 7) + " ~$" + pad(byModel[mm].toFixed(2), 9))
    .join("\n");

  const pre =
    "====================================================================\n" +
    "CACHE DIAGNOSIS  -  your run (Bob's auth ticket)\n" +
    "sessions=" + Math.max(1, st.sessionStarts) + "  subagents=" + st.counts.spawns + "\n" +
    "====================================================================\n\n" +
    "USAGE (this run, ccusage-style, API-equivalent):\n" +
    "  input       " + tokCol(agg.input) + " tok\n" +
    "  output      " + tokCol(agg.output) + " tok\n" +
    "  cache-read  " + tokCol(agg.read) + " tok\n" +
    "  cache-write " + tokCol(writeTot) + " tok   (1h=" + fmt(agg.write1h) + " 5m=" + fmt(agg.write5m) + ")\n" +
    "  TOTAL COST  ~$" + spent.toFixed(2) + "  (what these tokens would cost on the API\n" +
    "              at list price, not your subscription bill)\n" +
    "  by model:\n" +
    byModelLines + "\n\n" +
    "HEADLINE\n" +
    "  About " + pctRec.toFixed(0) + "% of this run's API-equivalent cost (~$" + recoverable.toFixed(2) +
    " of ~$" + spent.toFixed(2) + ") was recoverable.\n" +
    "  Biggest lever: " + LEVER[biggest(h)] + ".\n\n" +
    "TTL SPLIT  (cache-write tokens: how long the cache is asked to live)\n" +
    "  MAIN + SUBS : 1h " + pad(fmt(agg.write1h), 12) + "   5m " + pad(fmt(agg.write5m), 12) + "\n\n" +
    "ISSUES FOUND\n" +
    issueLines +
    "\n====================================================================\n" +
    "BOTTOM LINE  (API-equivalent, list price, not your subscription bill)\n" +
    "====================================================================\n" +
    "  Total this ticket : ~$" + spent.toFixed(2) + "   of Bob's $" + st.budget.toFixed(0) + " cap\n" +
    "  Recoverable       : ~$" + recoverable.toFixed(2) + "  (" + pctRec.toFixed(0) + "%)\n" +
    "  Hand-coded units  : " + st.counts.handCoded + "   (+" + manualH.toFixed(1) + " h of Bob's own hands)\n" +
    "  Tedium            : " + st.tedium.toFixed(0) + "/100";

  const gh = "https://github.com/anthropics/claude-code";
  const hiddenRows: HiddenRow[] = [
    {
      label: "rework from cheap plan/dev models",
      amount: h.reworkUsd,
      note: st.counts.reviewRounds + " review rounds, " + st.counts.ciFixes + " CI fixes, " + st.counts.bugs + " bugs",
      href: gh,
    },
    { label: "inline context re-priced every turn", amount: h.inlineRereadUsd, note: "history re-read at 0.1x, tail rewritten at 2x", href: gh },
    { label: "idle rebuilds you could have pinged", amount: h.idleRebuildUsd, note: st.counts.idleGaps + " gaps; 1 rebuild = 20 pings", href: gh },
    { label: "dynamic hook catalog poisoning", amount: h.hookUsd, note: "~24,300 tok per session start", href: gh },
    { label: "eager skills you never invoked", amount: h.eagerSkillsUsd, note: "catalog carried cold into every base", href: gh },
    { label: "1h flag below the 0.65 break-even", amount: h.flagDeltaUsd, note: "your ratio: " + ratio.toFixed(2), href: gh },
  ];

  const lossId = st.ended?.lossId || "";
  const lossName = LOSS_NAME[lossId] || LOSS_NAME[lossId.split(":").pop() || ""] || "Bob Coded It Himself";
  const title = won ? "Ticket shipped" : lossName;
  const lead = won
    ? "Auth is live. Bob kept $" + st.wallet.toFixed(2) + " of his $" + st.budget.toFixed(0) + " and hand-coded " + manualH.toFixed(1) + " h."
    : "The wallet drained and the clock/tedium caught up. Here is what actually happened.";

  return {
    grade,
    won,
    title,
    lead,
    pre,
    hiddenRows,
    hiddenTotal,
    handCodedHrs: manualH.toFixed(1),
    offerWeek: st.scope === "session",
  };
}
