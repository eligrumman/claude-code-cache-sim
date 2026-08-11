#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Keep this block in sync with src/engine/pricing.ts, the source of truth.
// Prices are USD per 1M input tokens; RATE values are billing multipliers.
export const RATE = Object.freeze({ input: 1, read: 0.1, w5m: 1.25, w1h: 2, out: 5 });
export const MODEL_IN = Object.freeze({ haiku: 1, sonnet: 3, opus: 5, fable: 10 });

const DAY_MS = 86_400_000;
const ZERO_USAGE = () => ({ input: 0, read: 0, write5m: 0, write1h: 0, output: 0 });

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function modelFamily(model) {
  const name = String(model || "").toLowerCase();
  if (name.includes("haiku")) return "haiku";
  if (name.includes("opus")) return "opus";
  if (name.includes("fable")) return "fable";
  return "sonnet";
}

function usageFromEvent(event) {
  if (!event || typeof event !== "object") return null;
  const isAssistant = event.type === "assistant" || event.message?.role === "assistant";
  if (!isAssistant) return null;
  const usage = event.message?.usage ?? event.usage;
  if (!usage || typeof usage !== "object") return null;

  const rawCreation = usage.cache_creation ?? usage.cacheCreation;
  const creation = rawCreation && typeof rawCreation === "object"
    ? rawCreation
    : {};
  const split5m = finiteNumber(creation.ephemeral_5m_input_tokens ?? creation.ephemeral5mInputTokens ?? usage.ephemeral_5m_input_tokens);
  const split1h = finiteNumber(creation.ephemeral_1h_input_tokens ?? creation.ephemeral1hInputTokens ?? usage.ephemeral_1h_input_tokens);
  const creationTotal = finiteNumber(usage.cache_creation_input_tokens ?? usage.cacheCreationInputTokens);
  const splitTotal = split5m + split1h;

  return {
    model: String(event.message?.model ?? event.model ?? "unknown"),
    input: finiteNumber(usage.input_tokens ?? usage.inputTokens),
    read: finiteNumber(usage.cache_read_input_tokens ?? usage.cacheReadInputTokens),
    write5m: split5m + Math.max(0, creationTotal - splitTotal),
    write1h: split1h,
    output: finiteNumber(usage.output_tokens ?? usage.outputTokens),
    assumed5m: creationTotal > splitTotal ? creationTotal - splitTotal : 0,
  };
}

export function priceUsage(usage, model = "sonnet") {
  const family = modelFamily(model);
  const base = MODEL_IN[family] / 1_000_000;
  const byClass = {
    input: finiteNumber(usage?.input) * RATE.input * base,
    read: finiteNumber(usage?.read) * RATE.read * base,
    write5m: finiteNumber(usage?.write5m) * RATE.w5m * base,
    write1h: finiteNumber(usage?.write1h) * RATE.w1h * base,
    output: finiteNumber(usage?.output) * RATE.out * base,
  };
  return { byClass, total: Object.values(byClass).reduce((sum, value) => sum + value, 0) };
}

function addUsage(target, source) {
  for (const key of ["input", "read", "write5m", "write1h", "output"]) target[key] += source[key];
}

function timestampOf(event, fallback) {
  const value = event?.timestamp ?? event?.created_at ?? event?.createdAt ?? fallback;
  const time = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return time < 10_000_000_000 ? time * 1000 : time;
}

/** Aggregate raw Claude events, or scanner records shaped as { event, session, fileMtime }. */
export function aggregateUsage(events = []) {
  const totals = ZERO_USAGE();
  const models = new Map();
  const days = new Map();
  const sessions = new Map();
  const spend = { input: 0, read: 0, write5m: 0, write1h: 0, output: 0 };
  let assumed5mTokens = 0;
  let assistantEvents = 0;

  for (const entry of Array.isArray(events) ? events : []) {
    const event = entry?.event ?? entry;
    const usage = usageFromEvent(event);
    if (!usage) continue;
    assistantEvents += 1;
    addUsage(totals, usage);
    assumed5mTokens += usage.assumed5m;
    const priced = priceUsage(usage, usage.model);
    for (const key of Object.keys(spend)) spend[key] += priced.byClass[key];

    const modelName = usage.model || "unknown";
    const model = models.get(modelName) ?? { model: modelName, family: modelFamily(modelName), ...ZERO_USAGE(), events: 0, cost: 0 };
    addUsage(model, usage);
    model.events += 1;
    model.cost += priced.total;
    models.set(modelName, model);

    const sessionId = String(entry?.session ?? event.session_id ?? event.sessionId ?? "unknown");
    const session = sessions.get(sessionId) ?? { session: sessionId, ...ZERO_USAGE(), events: 0, timestamp: null, cost: 0 };
    addUsage(session, usage);
    session.events += 1;
    session.cost += priced.total;
    const timestamp = timestampOf(event, entry?.fileMtime);
    if (timestamp !== null) session.timestamp = Math.max(session.timestamp ?? 0, timestamp);
    sessions.set(sessionId, session);

    if (timestamp !== null) {
      const dayKey = new Date(timestamp).toISOString().slice(0, 10);
      const day = days.get(dayKey) ?? { day: dayKey, ...ZERO_USAGE(), events: 0, cost: 0 };
      addUsage(day, usage);
      day.events += 1;
      day.cost += priced.total;
      days.set(dayKey, day);
    }
  }

  const prefixTokens = totals.input + totals.read + totals.write5m + totals.write1h;
  const totalTokens = prefixTokens + totals.output;
  const totalCost = Object.values(spend).reduce((sum, value) => sum + value, 0);
  return {
    totals,
    spend,
    totalTokens,
    totalCost,
    cacheHitRate: prefixTokens ? totals.read / prefixTokens : 0,
    assistantEvents,
    assumed5mTokens,
    models: [...models.values()].sort((a, b) => b.cost - a.cost),
    days: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    sessions: [...sessions.values()].sort((a, b) => b.cost - a.cost),
    daysCovered: days.size,
  };
}

function money(value) {
  return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
}

function compact(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function insightsFor(report) {
  if (report.assistantEvents < 3 || report.totalTokens === 0) return ["Not enough data yet. Run a few Claude Code sessions, then generate this report again."];
  const insights = [];
  const hit = report.cacheHitRate;
  if (hit >= 0.75) insights.push(`${Math.round(hit * 100)}% of prefix tokens were cache reads. Your cache is doing substantial work.`);
  else if (hit >= 0.4) insights.push(`${Math.round(hit * 100)}% of prefix tokens were cache reads. Caching is helping, with room to preserve more stable prefixes.`);
  else insights.push(`Only ${Math.round(hit * 100)}% of prefix tokens were cache reads. Frequent cold starts or changing prefixes may be dominating.`);

  const coldSessions = report.sessions.filter((session) => session.read === 0).length;
  insights.push(`${coldSessions} of ${report.sessions.length} session${report.sessions.length === 1 ? "" : "s"} recorded no warm-cache reads.`);

  const opus = report.models.filter((model) => model.family === "opus");
  const opusCost = opus.reduce((sum, model) => sum + model.cost, 0);
  if (opusCost > 0) {
    const eligibleSaving = opusCost * (1 - MODEL_IN.sonnet / MODEL_IN.opus);
    insights.push(`Opus accounted for ${money(opusCost)}. If that work were eligible for Sonnet, the same token mix would cost about ${money(eligibleSaving)} less.`);
  } else {
    const largest = report.models[0];
    if (largest) insights.push(`${largest.model} was your largest model cost at ${money(largest.cost)}.`);
  }

  const outputShare = report.totalCost ? report.spend.output / report.totalCost : 0;
  if (outputShare >= 0.5) insights.push(`${Math.round(outputShare * 100)}% of estimated spend was output tokens, so cache tuning can only affect the remaining share.`);
  if (report.assumed5mTokens > 0) insights.push(`${compact(report.assumed5mTokens)} cache-write tokens had no TTL split and were conservatively priced at the 5-minute rate.`);
  return insights.slice(0, 5);
}

export function renderReport(report, options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const hitPercent = Math.round(report.cacheHitRate * 100);
  const billing = [
    ["Input", report.spend.input, "#67a9ef"],
    ["Cache read", report.spend.read, "#62d39a"],
    ["Cache write", report.spend.write5m + report.spend.write1h, "#f2c94c"],
    ["Output", report.spend.output, "#f0785e"],
  ];
  const maxSpend = Math.max(report.totalCost, 0.000001);
  const bar = billing.map(([label, value, color]) => `<span title="${label}: ${money(value)}" style="width:${(value / maxSpend) * 100}%;background:${color}"></span>`).join("");
  const legend = billing.map(([label, value, color]) => `<li><i style="background:${color}"></i><span>${label}</span><strong>${money(value)}</strong></li>`).join("");
  const realModels = report.models.filter((model) => model.model !== "<synthetic>" && model.input + model.read + model.write5m + model.write1h + model.output > 0);
  const models = realModels.length
    ? realModels.map((model) => `<tr><td>${escapeHtml(model.model)}</td><td>${compact(model.input + model.read + model.write5m + model.write1h + model.output)}</td><td>${Math.round((model.read / Math.max(1, model.input + model.read + model.write5m + model.write1h)) * 100)}%</td><td>${money(model.cost)}</td></tr>`).join("")
    : `<tr><td colspan="4">No assistant usage events found in this period.</td></tr>`;
  const biggest = report.sessions.slice(0, 5).map((session) => `<li><span>${escapeHtml(path.basename(session.session))}</span><strong>${money(session.cost)}</strong></li>`).join("") || "<li><span>No sessions found</span></li>";
  const insights = insightsFor(report).map((insight) => `<li>${escapeHtml(insight)}</li>`).join("");
  const dayRange = report.days.length ? `${report.days[0].day} → ${report.days[report.days.length - 1].day}` : "No dated events";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Claude Code cache report</title>
<style>
:root{color-scheme:light;--cream:#fffdf8;--paper:#fffef9;--ink:#20201d;--gold:#f2c94c;--green:#62d39a;--red:#f0785e;--blue:#67a9ef;--muted:#67645c}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif}main{width:min(960px,calc(100% - 28px));margin:0 auto;padding:64px 0}header{text-align:center;margin-bottom:32px}.eyebrow{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#9b6410}h1{max-width:760px;margin:8px auto 12px;font-size:clamp(2.4rem,7vw,5.5rem);line-height:.92;letter-spacing:-.055em}p{color:var(--muted);line-height:1.55}.hero,.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.card{min-width:0;background:var(--paper);border:2px solid var(--ink);border-radius:20px 17px 22px 16px;box-shadow:7px 8px 0 #dedbd0;padding:24px;margin-bottom:22px}.metric{display:block;font-size:clamp(3.2rem,9vw,6.5rem);font-weight:950;line-height:1;font-variant-numeric:tabular-nums}.green{background:#ddf8e9}.gold{background:#fff2b8}h2{margin:0 0 14px;font-size:1.25rem}.stack{display:flex;width:100%;height:32px;border:2px solid var(--ink);border-radius:999px;overflow:hidden;background:#eee}.stack span{display:block;min-width:0}.legend,.sessions{list-style:none;padding:0;margin:18px 0 0}.legend li,.sessions li{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;margin:9px 0}.legend i{width:13px;height:13px;border:1.5px solid var(--ink);border-radius:4px}.sessions li{grid-template-columns:1fr auto}.sessions span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}table{width:100%;border-collapse:collapse;font-size:.86rem}th,td{text-align:right;padding:10px 8px;border-bottom:1px dashed #bbb7aa;font-variant-numeric:tabular-nums}th:first-child,td:first-child{text-align:left;overflow-wrap:anywhere}.insights{margin:0;padding-left:1.35rem}.insights li{margin:.75rem 0;line-height:1.5}.meta{text-align:center;font-size:.8rem}.fine{border-top:2px dashed #bbb7aa;margin-top:32px;padding-top:22px;font-size:.75rem;text-align:center;color:var(--muted)}@media(max-width:640px){main{padding-top:36px}.hero,.grid{grid-template-columns:1fr}.card{padding:18px;overflow:hidden}th,td{padding-inline:4px;font-size:.72rem}}
</style></head><body><main>
<header><span class="eyebrow">Your local Claude Code usage</span><h1>What your cache actually did.</h1><p>${escapeHtml(dayRange)} · generated ${escapeHtml(generatedAt.toLocaleString())}</p></header>
<section class="hero"><article class="card green"><span class="eyebrow">Cache-hit rate</span><strong class="metric">${hitPercent}%</strong><p>Share of prefix input served from cache.</p></article><article class="card gold"><span class="eyebrow">List-price value</span><strong class="metric">${money(report.totalCost)}</strong><p>What these tokens would cost at Anthropic API list prices — not your subscription bill.</p><p>${compact(report.totalTokens)} tokens · ${report.sessions.length} sessions · ${report.daysCovered} active days</p></article></section>
<section class="card"><h2>Spend by billing class</h2><div class="stack" aria-label="Spend by billing class">${bar}</div><ul class="legend">${legend}</ul></section>
<section class="grid"><article class="card"><h2>Per model</h2><table><thead><tr><th>Model</th><th>Tokens</th><th>Hit rate</th><th>Spend</th></tr></thead><tbody>${models}</tbody></table></article><article class="card"><h2>Biggest sessions</h2><ul class="sessions">${biggest}</ul></article></section>
<section class="card"><h2>What the numbers say</h2><ol class="insights">${insights}</ol></section>
<p class="fine">Built only from your own local Claude Code logs. No data leaves this machine. Rates mirror <code>src/engine/pricing.ts</code>: input 1×, cache read 0.1×, 5m write 1.25×, 1h write 2×, output 5×, multiplied by model input price. Cache creation without a 5m/1h split is priced at 5m; unknown models use the Sonnet rate. On a subscription/Max plan, this is a counterfactual valuation at list prices, not what you were billed.</p>
</main></body></html>`;
}

function parseArgs(argv) {
  const options = { dir: path.join(os.homedir(), ".claude", "projects"), out: path.join(os.homedir(), "claude-cache-report.html"), days: 30, open: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") return { ...options, help: true };
    if (arg === "--no-open") options.open = false;
    else if (["--dir", "--out", "--days"].includes(arg)) {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} needs a value`);
      if (arg === "--dir") options.dir = path.resolve(value.replace(/^~(?=$|\/)/, os.homedir()));
      if (arg === "--out") options.out = path.resolve(value.replace(/^~(?=$|\/)/, os.homedir()));
      if (arg === "--days") {
        options.days = Number(value);
        if (!Number.isFinite(options.days) || options.days <= 0) throw new Error("--days must be a positive number");
      }
    } else if (arg !== "--no-open") throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function jsonlFiles(root) {
  const found = [];
  const visit = (directory) => {
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) found.push(fullPath);
    }
  };
  visit(root);
  return found;
}

function scanLogs(files, cutoff) {
  const records = [];
  for (const file of files) {
    let stat;
    let contents;
    try { stat = fs.statSync(file); contents = fs.readFileSync(file, "utf8"); } catch { continue; }
    if (stat.mtimeMs < cutoff) continue;
    for (const line of contents.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        const timestamp = timestampOf(event, stat.mtimeMs);
        if (timestamp !== null && timestamp < cutoff) continue;
        records.push({ event, session: file, fileMtime: stat.mtimeMs });
      } catch { /* A damaged line should not hide the rest of the session. */ }
    }
  }
  return records;
}

function openReport(file) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", file] : [file];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.on("error", () => {});
    child.unref();
  } catch { /* The report still exists even when no desktop opener is available. */ }
}

export function main(argv = process.argv.slice(2)) {
  let options;
  try { options = parseArgs(argv); } catch (error) { console.error(`cc-cache-report: ${error.message}\nRun with --help for usage.`); return 1; }
  if (options.help) {
    console.log(`Usage: cc-cache-report [options]\n\n  --dir <path>   Claude projects directory (default: ~/.claude/projects)\n  --days <N>     Include the last N days (default: 30)\n  --out <file>   HTML output (default: ~/claude-cache-report.html)\n  --no-open      Do not open the generated report\n  -h, --help     Show this help`);
    return 0;
  }
  if (!fs.existsSync(options.dir)) {
    console.log(`No Claude Code logs found. Claude Code normally stores them in ~/.claude/projects/.\nLooked in: ${options.dir}`);
    return 0;
  }
  const files = jsonlFiles(options.dir);
  if (files.length === 0) {
    console.log(`No .jsonl session logs found in ${options.dir}. Claude Code normally stores them under ~/.claude/projects/.`);
    return 0;
  }
  const report = aggregateUsage(scanLogs(files, Date.now() - options.days * DAY_MS));
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, renderReport(report), "utf8");
  console.log(`${Math.round(report.cacheHitRate * 100)}% cache hit · ${money(report.totalCost)} · ${report.sessions.length} sessions · ${report.daysCovered} days`);
  console.log(`Report: ${options.out}`);
  if (options.open) openReport(options.out);
  return 0;
}

let invokedAsMain = false;
try {
  invokedAsMain = Boolean(process.argv[1])
    && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
} catch { /* Importing the pure functions must never trigger CLI side effects. */ }
if (invokedAsMain) process.exitCode = main();
