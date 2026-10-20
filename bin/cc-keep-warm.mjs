#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { WRITE, priceFor } from "./prices.mjs";

// Keeps idle Claude Code sessions' prompt cache warm, and measures whether that actually paid off.
//
// How a ping works: `claude -p --resume <id> --fork-session --no-session-persistence` replays the
// session's exact prefix (tools + system + history) plus one tiny message. The server reads the
// cached prefix, which resets its TTL. The fork is never written to disk, so the original transcript
// is untouched and nothing shows up in /resume. Everything stays local except that one request.

const TTL_MS = Object.freeze({ "5m": 5 * 60_000, "1h": 60 * 60_000 });
// Ping this long before expiry: enough slack for a slow `claude` start, small enough to matter.
const MARGIN_MS = Object.freeze({ "5m": 60_000, "1h": 8 * 60_000 });
const PROMPT = "Keep-alive ping from cc-keep-warm. Do not use any tools. Reply with exactly: ok";
// Env a parent Claude Code session leaks into child processes; inheriting it hijacks the child's session id.
const STRIP_ENV = ["CLAUDECODE", "CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION", "CLAUDE_CODE_REMOTE_SESSION_ID"];

// Besides reading the session, every ping writes its own tail to the cache: the resumed session's
// last turn re-rendered plus the ping message. Measured at 11-13k tokens on a real ping.
export const PING_TAIL = 12_000;
let pingTail = PING_TAIL;
/** Override the per-ping tail (e.g. 0 for an API keep-alive with max_tokens: 0). */
export function setPingTail(tokens) { pingTail = tokens; }

/** Rebuild vs ping cost for a prefix; `maxPings` is how many pings one avoided rebuild pays for. */
export function economics(prefixTokens, model, ttl) {
  const price = priceFor(model);
  const rebuild = (prefixTokens * price.input * WRITE[ttl]) / 1e6;
  const ping = (prefixTokens * price.read + pingTail * price.input * WRITE[ttl]) / 1e6;
  return { rebuild, ping, maxPings: ping > 0 ? Math.floor(rebuild / ping) - 1 : 0 };
}

const HOUR = 3_600_000;
export const BACKTEST_LIMITS = [1.5, 2, 3, 4, 6, 8, 12, 24].map((hours) => hours * HOUR);

/**
 * Replay real sessions against "keep warm for up to N hours" policies. For every time you came back
 * after the cache expired: if the policy would have bridged the gap, it pays for the pings and saves
 * the rebuild; if the gap was longer, it pays for the pings it sent before giving up and saves nothing.
 */
/** Working hours in local time, e.g. { from: 9, to: 19, days: [0,1,2,3,4] } (0 = Sunday). */
export function inWindow(window, time) {
  if (!window) return true;
  const date = new Date(time);
  const hour = date.getHours() + date.getMinutes() / 60;
  return window.days.includes(date.getDay()) && hour >= window.from && hour < window.to;
}

// A session idle this long with no return counts as abandoned (pings sent to it were wasted).
const ABANDONED_MS = 48 * HOUR;

/** Every idle stretch long enough for keep-warm to act on, including sessions you never came back to. */
export function idlePeriods(sessions, now = Date.now()) {
  const periods = [];
  for (const turns of sessions) {
    const ttl = summarize(turns)?.ttl ?? "1h";
    const every = TTL_MS[ttl] - MARGIN_MS[ttl];
    const push = (before, end, rebuilt) => {
      const prefix = before.input + before.read + before.write;
      const price = priceFor(before.model);
      const perToken = (price.input * WRITE[ttl] - price.read) / 1e6;
      periods.push({ start: before.at, end, ttl, ping: economics(prefix, before.model, ttl).ping, expected: prefix * perToken, saving: Math.min(rebuilt, prefix) * perToken });
    };
    for (let index = 1; index < turns.length; index += 1) {
      if (turns[index].at - turns[index - 1].at >= every) push(turns[index - 1], turns[index].at, turns[index].write);
    }
    const last = turns.at(-1);
    if (last && now - last.at > ABANDONED_MS) push(last, Infinity, 0);
  }
  return periods.sort((x, y) => x.start - y.start);
}

/**
 * Replay one idle stretch: at each ping time, ask the policy whether to ping. The cache stays warm until
 * TTL after the last touch; once the policy declines, the chain is broken and the cache dies.
 */
function simulate(period, decide) {
  const every = TTL_MS[period.ttl] - MARGIN_MS[period.ttl];
  const stop = Math.min(period.end, period.start + ABANDONED_MS);
  let aliveUntil = period.start + TTL_MS[period.ttl];
  let sent = 0;
  for (let at = period.start + every; at < stop; at += every) {
    if (!decide(at, period)) break;
    sent += 1;
    aliveUntil = at + TTL_MS[period.ttl];
  }
  const neededRescue = period.end - period.start >= TTL_MS[period.ttl] && period.end !== Infinity;
  return { sent, rescued: neededRescue && aliveUntil > period.end };
}

function score(periods, decide, limit) {
  let spent = 0;
  let saved = 0;
  let rescued = 0;
  for (const period of periods) {
    const result = simulate(period, decide);
    spent += result.sent * period.ping;
    if (result.rescued) { saved += period.saving; rescued += 1; }
  }
  return { limit, rescued, spent, saved, net: saved - spent };
}

const hourBlock = (time) => Math.floor(new Date(time).getHours() / 3);
const idleBucket = (idle) => (idle < 2 * HOUR ? 0 : idle < 4 * HOUR ? 1 : idle < 8 * HOUR ? 2 : 3);

/**
 * Learn, from past idle stretches, how likely you are to come back within the next TTL given the time
 * of day and how long you have already been away. Returns p(time, idle).
 */
export function learnReturns(periods) {
  const cells = new Map();
  const pooled = new Map();
  const bump = (map, key, hit) => { const c = map.get(key) ?? { hit: 0, n: 0 }; c.hit += hit; c.n += 1; map.set(key, c); };
  for (const period of periods) {
    const every = TTL_MS[period.ttl] - MARGIN_MS[period.ttl];
    for (let at = period.start + every; at < Math.min(period.end, period.start + ABANDONED_MS); at += every) {
      const hit = period.end <= at + TTL_MS[period.ttl] ? 1 : 0;
      bump(cells, `${hourBlock(at)}:${idleBucket(at - period.start)}`, hit);
      bump(pooled, idleBucket(at - period.start), hit);
    }
  }
  return (time, idle) => {
    const cell = cells.get(`${hourBlock(time)}:${idleBucket(idle)}`);
    const base = pooled.get(idleBucket(idle)) ?? { hit: 0, n: 0 };
    const prior = (base.hit + 1) / (base.n + 2);
    // Shrink sparse cells toward the pooled rate so a handful of samples can't dominate.
    return cell ? (cell.hit + 5 * prior) / (cell.n + 5) : prior;
  };
}

/** Ping only when the chance you are back before the cache dies pays for the ping. */
export function smartPolicy(p) {
  return (at, period) => p(at, at - period.start) * period.expected >= period.ping;
}

/**
 * Replay real sessions against keep-warm policies: a plain max-idle limit, optionally only during working
 * hours. Every idle stretch counts: pings that bridged a gap save the rebuild; pings sent before you came
 * back anyway, before the policy gave up, or to sessions you abandoned are spent for nothing.
 */
export function backtest(sessions, limits = BACKTEST_LIMITS, window = null, now = Date.now()) {
  const periods = idlePeriods(sessions, now);
  const cold = periods.filter((p) => p.end !== Infinity && p.end - p.start >= TTL_MS[p.ttl]);
  const policies = limits.map((limit) => score(periods, (at, period) => at - period.start <= limit && inWindow(window, at), limit));
  return { gaps: cold.map((p) => ({ ...p, gap: p.end - p.start })), periods, policies, rebuildCost: cold.reduce((sum, g) => sum + g.saving, 0) };
}

/** Learn return patterns from the older half of your history, then score on the newer half. */
export function backtestSmart(sessions, now = Date.now()) {
  const periods = idlePeriods(sessions, now);
  const split = Math.floor(periods.length / 2);
  const train = periods.slice(0, split);
  const test = periods.slice(split);
  const fixed = (limit) => (at, period) => at - period.start <= limit;
  const best = (scores) => scores.reduce((x, y) => (y.net > x.net ? y : x));
  // Everything smart decides comes from the older half: its time limit and its return odds.
  const learnedLimit = best(BACKTEST_LIMITS.map((limit) => score(train, fixed(limit), limit))).limit;
  const p = learnReturns(train);
  const smart = score(test, (at, period) => fixed(learnedLimit)(at, period) && smartPolicy(p)(at, period), learnedLimit);
  const bestSimple = best(BACKTEST_LIMITS.map((limit) => score(test, fixed(limit), limit)));
  return { smart, learnedLimit, bestSimple, testFrom: test[0]?.start, testCount: test.length };
}

export function formatBacktest({ gaps, periods, policies, rebuildCost }, days, window = null) {
  if (!gaps.length) return `No returns to an expired cache in the last ${days} days. Keep-warm has nothing to save for you.`;
  const buckets = [[1, 2], [2, 4], [4, 8], [8, 24], [24, Infinity]].map(([from, to]) => {
    const inside = gaps.filter((g) => g.gap >= from * HOUR && g.gap < to * HOUR);
    return `  ${to === Infinity ? `${from}h+` : `${from}-${to}h`}`.padEnd(9) + `${String(inside.length).padStart(5)} times   rebuilds ${money(inside.reduce((sum, g) => sum + g.saving, 0))}`;
  });
  const best = policies.reduce((a, b) => (b.net > a.net ? b : a));
  const label = (limit) => (limit === Infinity ? "while in hours" : `up to ${limit / HOUR}h`);
  const row = (p) => `  ${label(p.limit).padEnd(16)}  ${String(p.rescued).padStart(5)} rescued   pings ${money(p.spent).padStart(8)}   saved ${money(p.saved).padStart(8)}   net ${money(p.net).padStart(8)}`;
  return [
    `Last ${days} days: you came back to an expired cache ${gaps.length} time${gaps.length === 1 ? "" : "s"}. Those rebuilds cost ${money(rebuildCost)}.`,
    `(${periods.filter((p) => p.end === Infinity).length} sessions you never came back to are counted too: pings sent to them are wasted.)`,
    "",
    "How long you were away:",
    ...buckets,
    "",
    window ? `If keep-warm had been running, only during working hours (${describeWindow(window)}), for at most...` : "If keep-warm had been running, keeping sessions warm for at most...",
    ...policies.map(row),
    "",
    best.net > 0
      ? `Best for you: keep sessions warm ${label(best.limit)}${window ? ` during ${describeWindow(window)}` : ""}. Net ${money(best.net)} over ${days} days (~${money((best.net * 30) / days)}/month).`
      : "Keep-warm would not have paid off for how you work: the pings cost more than the rebuilds they avoid.",
    `Each ping is priced as a cache read of the session plus ~${pingTail / 1000}k new tokens written${pingTail === PING_TAIL ? " (measured)" : " (--tail)"}. List prices, not your subscription bill.`,
  ].join("\n");
}

function usageOf(event) {
  const usage = event?.message?.usage;
  if (!usage || typeof usage !== "object") return null;
  const n = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  const creation = usage.cache_creation ?? {};
  return {
    input: n(usage.input_tokens),
    read: n(usage.cache_read_input_tokens),
    write: n(usage.cache_creation_input_tokens),
    write1h: n(creation.ephemeral_1h_input_tokens),
    write5m: n(creation.ephemeral_5m_input_tokens),
  };
}

/** Main-thread assistant turns of one transcript, oldest first. */
export function parseTurns(lines) {
  const turns = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type !== "assistant" || event.isSidechain) continue;
    const usage = usageOf(event);
    const at = Date.parse(event.timestamp);
    if (!usage || !Number.isFinite(at) || event.message?.model === "<synthetic>") continue;
    turns.push({ at, model: event.message.model, cwd: event.cwd, sessionId: event.sessionId, ...usage });
  }
  return turns;
}

/** What a ping needs to know about a session, from its transcript. Null if it never got a real reply. */
export function summarize(turns) {
  const last = turns.at(-1);
  if (!last) return null;
  const lastWrite = [...turns].reverse().find((turn) => turn.write > 0);
  const ttl = lastWrite && lastWrite.write1h === 0 && lastWrite.write5m > 0 ? "5m" : "1h";
  return { sessionId: last.sessionId, model: last.model, cwd: last.cwd, lastActivity: last.at, prefix: last.input + last.read + last.write, ttl };
}

/** Decide what to do with one session right now. Pure: every input is explicit. */
export function plan(session, record, now, maxIdleMs, window = null) {
  const pings = record?.since === session.lastActivity ? record.pings : [];
  const lastTouch = Math.max(session.lastActivity, pings.at(-1)?.at ?? 0);
  const idle = now - session.lastActivity;
  const sinceTouch = now - lastTouch;
  const ttl = TTL_MS[session.ttl];
  if (record?.disabled) return { action: "skip", reason: record.disabled };
  if (sinceTouch >= ttl) return { action: "skip", reason: "already cold" };
  if (sinceTouch < ttl - MARGIN_MS[session.ttl]) return { action: "wait", inMs: ttl - MARGIN_MS[session.ttl] - sinceTouch };
  if (idle > maxIdleMs) return { action: "skip", reason: "past --max-idle" };
  if (!inWindow(window, now)) return { action: "skip", reason: "outside working hours" };
  const { maxPings } = economics(session.prefix, session.model, session.ttl);
  if (pings.length >= maxPings) return { action: "skip", reason: "more pings would cost more than the rebuild" };
  return { action: "ping" };
}

/** Did the user come back after a ping and get a warm read? Compares the first real turn after the last ping. */
export function verify(record, turns) {
  const lastPing = record?.pings?.at(-1);
  if (!lastPing || record.outcome) return null;
  const next = turns.find((turn) => turn.at > lastPing.at);
  if (!next) return null;
  const warm = next.read >= 0.8 * lastPing.prefix;
  return { warm, at: next.at, read: next.read, write: next.write };
}

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function describeWindow(window) {
  const days = window.days.length === 7 ? "every day" : window.days.map((day) => DAY_NAMES[day]).join(",");
  return `${String(window.from).padStart(2, "0")}:00-${String(window.to).padStart(2, "0")}:00, ${days}`;
}

/** "9-19" -> {from, to}; "sun-thu" or "mon,wed" -> day indexes. */
export function parseHours(value) {
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(String(value));
  if (!match || Number(match[1]) >= Number(match[2]) || Number(match[2]) > 24) throw new Error(`bad --hours: ${value} (use e.g. 9-19)`);
  return { from: Number(match[1]), to: Number(match[2]) };
}

export function parseDays(value) {
  const days = new Set();
  for (const part of String(value).toLowerCase().split(",")) {
    const [a, b = a] = part.split("-").map((name) => DAY_NAMES.indexOf(name.slice(0, 3)));
    if (a < 0 || b < 0) throw new Error(`bad --workdays: ${value} (use e.g. sun-thu or mon-fri)`);
    for (let day = a; ; day = (day + 1) % 7) { days.add(day); if (day === b) break; }
  }
  return [...days].sort();
}

function parseDuration(value) {
  const match = /^(\d+(?:\.\d+)?)(m|h)?$/.exec(String(value));
  if (!match) throw new Error(`bad duration: ${value} (use e.g. 90m or 8h)`);
  return Number(match[1]) * (match[2] === "m" ? 60_000 : 3_600_000);
}

function parseArgs(argv) {
  const home = os.homedir();
  const options = { dir: path.join(home, ".claude", "projects"), state: path.join(home, ".claude", "keep-warm", "state.json"), maxIdleMs: 2 * 3_600_000, claude: "claude", mode: "once", dryRun: false, interval: 60_000 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = () => {
      const next = argv[++index];
      if (!next) throw new Error(`${arg} needs a value`);
      return next;
    };
    if (arg === "--help" || arg === "-h") options.mode = "help";
    else if (arg === "--watch") options.mode = "watch";
    else if (arg === "--report") options.mode = "report";
    else if (arg === "--backtest") { options.mode = "backtest"; options.days = /^\d+$/.test(argv[index + 1] ?? "") ? Number(argv[++index]) : 30; }
    else if (arg === "--test") { options.mode = "test"; options.testSession = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "latest"; }
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--smart") options.smart = true;
    else if (arg === "--tail") { const tail = Number(value()); if (!Number.isFinite(tail) || tail < 0) throw new Error("--tail must be a token count"); setPingTail(tail); }
    else if (arg === "--max-idle") options.maxIdleMs = parseDuration(value());
    else if (arg === "--dir") options.dir = path.resolve(value().replace(/^~(?=$|\/)/, home));
    else if (arg === "--state") options.state = path.resolve(value().replace(/^~(?=$|\/)/, home));
    else if (arg === "--claude") options.claude = value();
    else if (arg === "--hours") options.window = { days: options.window?.days ?? [0, 1, 2, 3, 4, 5, 6], ...parseHours(value()) };
    else if (arg === "--workdays") options.window = { from: 9, to: 19, ...options.window, days: parseDays(value()) };
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

/** Top-level session transcripts (`<project>/<session-id>.jsonl`), skipping subagent files. */
function transcripts(dir, newerThan) {
  const found = [];
  let projects;
  try { projects = fs.readdirSync(dir, { withFileTypes: true }); } catch { return found; }
  for (const project of projects) {
    if (!project.isDirectory()) continue;
    const projectDir = path.join(dir, project.name);
    let files;
    try { files = fs.readdirSync(projectDir, { withFileTypes: true }); } catch { continue; }
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".jsonl")) continue;
      const fullPath = path.join(projectDir, file.name);
      try { if (fs.statSync(fullPath).mtimeMs >= newerThan) found.push(fullPath); } catch { /* vanished mid-scan */ }
    }
  }
  return found;
}

function readTurns(file) {
  try { return parseTurns(fs.readFileSync(file, "utf8").split(/\r?\n/)); } catch { return []; }
}

function loadState(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return { sessions: {}, ledger: [] }; }
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

/** Send one keep-alive. Returns what it cost and how much of the session's prefix it actually read. */
export function ping(session, options, run = spawnSync) {
  const env = { ...process.env };
  for (const key of STRIP_ENV) delete env[key];
  const args = ["-p", PROMPT, "--resume", session.sessionId, "--fork-session", "--no-session-persistence", "--output-format", "json", "--model", session.model];
  // Windows installs claude as a .cmd shim, which Node only launches through a shell.
  const windows = process.platform === "win32";
  const result = run(windows ? `"${options.claude}"` : options.claude, windows ? args.map((arg) => `"${arg}"`) : args, { cwd: session.cwd && fs.existsSync(session.cwd) ? session.cwd : undefined, env, encoding: "utf8", timeout: 180_000, shell: windows });
  if (result.error?.code === "ENOENT") return { ok: false, error: `can't find "${options.claude}". Is Claude Code installed? Pass its path with --claude <path>.` };
  if (result.error || result.status !== 0) return { ok: false, error: String(result.error?.message ?? result.stderr ?? "").trim().slice(0, 300) || `exit ${result.status}` };
  let out;
  try { out = JSON.parse(result.stdout); } catch { return { ok: false, error: "claude printed no JSON result" }; }
  if (out.is_error) return { ok: false, error: String(out.result ?? out.subtype).slice(0, 300) };
  const usage = out.usage ?? {};
  const read = Number(usage.cache_read_input_tokens) || 0;
  return { ok: true, read, write: Number(usage.cache_creation_input_tokens) || 0, cost: Number(out.total_cost_usd) || 0, hit: session.prefix ? read / session.prefix : 0 };
}

const money = (value) => `${value < 0 ? "-" : ""}$${Math.abs(value) < 0.1 ? Math.abs(value).toFixed(4) : Math.abs(value).toFixed(2)}`;
const mins = (ms) => `${Math.round(ms / 60_000)}m`;
const short = (id) => String(id).slice(0, 8);

function activeSessions(options, now) {
  const window = options.maxIdleMs + TTL_MS["1h"];
  return transcripts(options.dir, now - window)
    .map((file) => ({ turns: readTurns(file) }))
    .map(({ turns }) => ({ turns, session: summarize(turns) }))
    .filter(({ session }) => session?.sessionId && now - session.lastActivity <= window);
}

let learned = { at: -Infinity, p: null };
/** Your return patterns from the last 120 days of transcripts, relearned at most hourly. */
function returnModel(options, now) {
  if (now - learned.at > HOUR) {
    const since = now - 120 * 86_400_000;
    const sessions = transcripts(options.dir, since).map((file) => readTurns(file).filter((turn) => turn.at >= since)).filter((turns) => turns.length);
    learned = { at: now, p: learnReturns(idlePeriods(sessions, now)) };
  }
  return learned.p;
}

/** One pass over recent sessions: settle outcomes of earlier pings, then ping whatever is about to expire. */
export function runOnce(options, now = Date.now(), pinger = ping, log = console.log) {
  const state = loadState(options.state);
  state.sessions ??= {};
  state.ledger ??= [];
  for (const { session, turns } of activeSessions(options, now)) {
    const id = session.sessionId;
    let record = state.sessions[id];
    const outcome = verify(record, turns);
    if (outcome) {
      const pings = record.pings;
      const { rebuild } = economics(pings.at(-1).prefix, session.model, session.ttl);
      const readCost = (pings.at(-1).prefix * priceFor(session.model).read) / 1e6;
      state.ledger.push({ session: id, model: session.model, pings: pings.length, pingCost: pings.reduce((sum, p) => sum + p.cost, 0), warm: outcome.warm, avoided: outcome.warm ? rebuild - readCost : 0, at: outcome.at });
      record.outcome = outcome.warm ? "warm" : "cold";
      log(`${short(id)}  you came back ${outcome.warm ? "to a WARM cache" : "to a COLD cache"} after ${pings.length} ping(s)`);
    }
    if (record && record.since !== session.lastActivity) record = state.sessions[id] = { since: session.lastActivity, pings: [], disabled: record.disabled };
    const decision = plan(session, record, now, options.maxIdleMs, options.window);
    if (decision.action !== "ping") continue;
    const { rebuild, ping: estimate } = economics(session.prefix, session.model, session.ttl);
    if (options.smart && !smartPolicy(returnModel(options, now))(now, { start: session.lastActivity, expected: rebuild, ping: estimate })) continue;
    if (options.dryRun) {
      log(`${short(id)}  would ping (${session.model}, ${Math.round(session.prefix / 1000)}k prefix, idle ${mins(now - session.lastActivity)}): ~${money(estimate)} now vs ${money(rebuild)} rebuild`);
      continue;
    }
    const result = pinger(session, options);
    record = state.sessions[id] ??= { since: session.lastActivity, pings: [] };
    if (!result.ok) {
      log(`${short(id)}  ping failed: ${result.error}`);
      continue;
    }
    record.pings.push({ at: now, prefix: session.prefix, read: result.read, write: result.write, cost: result.cost });
    if (result.hit < 0.8) record.disabled = `ping read only ${Math.round(result.hit * 100)}% of the prefix, so it can't keep this session warm`;
    else if (result.cost >= rebuild) record.disabled = `a ping cost ${money(result.cost)}, more than the ${money(rebuild)} rebuild it prevents`;
    log(`${short(id)}  pinged: read ${Math.round(result.read / 1000)}k of ${Math.round(session.prefix / 1000)}k (${Math.round(result.hit * 100)}%), cost ${money(result.cost)} vs ${money(rebuild)} rebuild${record.disabled ? "  -> disabled for this session" : ""}`);
  }
  if (!options.dryRun) saveState(options.state, state);
  return state;
}

export function report(state) {
  const ledger = state.ledger ?? [];
  const pending = Object.values(state.sessions ?? {}).filter((record) => record.pings?.length && !record.outcome);
  const spent = ledger.reduce((sum, row) => sum + row.pingCost, 0) + pending.reduce((sum, record) => sum + record.pings.reduce((s, p) => s + p.cost, 0), 0);
  const avoided = ledger.reduce((sum, row) => sum + row.avoided, 0);
  const warm = ledger.filter((row) => row.warm).length;
  return [
    `Sessions you came back to: ${ledger.length} (${warm} warm, ${ledger.length - warm} cold)`,
    `Still idle, outcome unknown: ${pending.length}`,
    `Spent on pings:   ${money(spent)}`,
    `Rebuilds avoided: ${money(avoided)}`,
    `Net:              ${money(avoided - spent)} ${avoided >= spent ? "saved" : "lost — keep-warm isn't paying off for how you work"}`,
    "List-price value of tokens, not your subscription bill.",
  ].join("\n");
}

/** The session --test should ping: one whose cache is still warm, since a cold one can only show a rebuild. */
export function pickTestSession(sessions, wanted, now) {
  const matches = wanted === "latest" ? sessions : sessions.filter((session) => session.sessionId.startsWith(wanted));
  const warm = matches.filter((session) => now - session.lastActivity < TTL_MS[session.ttl] - 60_000);
  const newest = (list) => [...list].sort((a, b) => b.lastActivity - a.lastActivity)[0];
  return { session: newest(warm), coldMatch: warm.length ? undefined : newest(matches) };
}

function selfTest(options, log = console.log) {
  const now = Date.now();
  const sessions = activeSessions({ ...options, maxIdleMs: 30 * 86_400_000 }, now).map(({ session }) => session);
  const { session, coldMatch } = pickTestSession(sessions, options.testSession, now);
  if (!session) {
    if (coldMatch) log(`Session ${short(coldMatch.sessionId)} was last used ${mins(now - coldMatch.lastActivity)} ago, so its cache is gone and a ping would just pay for a rebuild.`);
    else log("No matching Claude Code session found in the last 30 days.");
    log("Use Claude Code for a minute (any session), then run --test again within the hour.");
    return 1;
  }
  const idle = now - session.lastActivity;
  const { rebuild, ping: estimate, maxPings } = economics(session.prefix, session.model, session.ttl);
  log(`Session ${short(session.sessionId)}  ${session.model}  ${Math.round(session.prefix / 1000)}k-token prefix  ${session.ttl} TTL  idle ${mins(idle)}`);
  const result = ping(session, options);
  if (!result.ok) { log(`Ping failed: ${result.error}`); return 1; }
  log(`Ping read ${Math.round(result.read / 1000)}k of ${Math.round(session.prefix / 1000)}k prefix tokens (${Math.round(result.hit * 100)}%), wrote ${Math.round(result.write / 1000)}k, cost ${money(result.cost)}.`);
  log(`A cold rebuild of this session costs ~${money(rebuild)}. Expected ping ~${money(estimate)}: one avoided rebuild pays for ~${maxPings} pings.`);
  if (result.hit < 0.8) log("VERDICT: the ping did not reuse this session's cache (different model/effort/settings?). Keep-warm won't help this session.");
  else if (result.cost >= rebuild) log("VERDICT: the ping hit the cache, but extra requests made it cost more than the rebuild. Keep-warm loses money in this setup; don't run it.");
  else if (result.cost > rebuild / 3) log("VERDICT: the ping hit the cache, but extra requests made it expensive. Run --report after a few days before trusting it.");
  else log("VERDICT: works. Pings are cheap relative to a rebuild. Run it with --watch and check --report in a week.");
  return 0;
}

const HELP = `Usage: cc-keep-warm [options]

Keeps idle Claude Code sessions' prompt cache warm, then measures whether it paid off.

  (no flag)        One pass: ping sessions about to go cold (run from cron every ~5 min)
  --watch          Keep running, one pass per minute
  --test [id]      Ping one session now (default: latest) and show what it read and cost
  --backtest [days] Replay your last 30 days (or N): would keep-warm have paid off, and for how long?
                   Sends nothing, costs nothing.
  --report         What pinging has spent vs. the rebuilds it avoided
  --dry-run        Show what would be pinged, send nothing
  --tail <tokens>  What-if for --backtest: tokens each ping writes (default 12000, measured; 0 = API keep-alive)
  --smart          Only ping when your history says you're likely back before the cache dies
  --hours <a-b>    Only ping during these local hours, e.g. 9-19 (also used by --backtest)
  --workdays <d>   Only ping on these days, e.g. sun-thu or mon-fri
  --max-idle <d>   Stop pinging after this much idle time (default 2h; run --backtest to find yours)
  --dir <path>     Claude projects directory (default ~/.claude/projects)
  --state <file>   State file (default ~/.claude/keep-warm/state.json)
  --claude <bin>   claude executable (default: claude on PATH)`;

export function main(argv = process.argv.slice(2)) {
  let options;
  try { options = parseArgs(argv); } catch (error) { console.error(`cc-keep-warm: ${error.message}\nRun with --help for usage.`); return 1; }
  if (options.mode === "help") { console.log(HELP); return 0; }
  if (options.mode === "report") { console.log(report(loadState(options.state))); return 0; }
  if (options.mode === "test") return selfTest(options);
  if (options.mode === "backtest") {
    const since = Date.now() - options.days * 86_400_000;
    const sessions = transcripts(options.dir, since).map((file) => readTurns(file).filter((turn) => turn.at >= since)).filter((turns) => turns.length > 1);
    const first = Math.min(...sessions.map((turns) => turns[0].at));
    const covered = sessions.length ? Math.max(1, Math.ceil((Date.now() - first) / 86_400_000)) : 0;
    const days = covered || options.days;
    console.log(formatBacktest(backtest(sessions), days));
    const window = options.window ?? { from: 9, to: 19, days: [0, 1, 2, 3, 4, 5, 6] };
    console.log(`\n${"-".repeat(72)}\n`);
    console.log(formatBacktest(backtest(sessions, [2 * HOUR, 4 * HOUR, 8 * HOUR, Infinity], window), days, window));
    if (!options.window) console.log("(Default working hours. Set yours with --hours 9-19 --workdays sun-thu.)");
    const smart = backtestSmart(sessions);
    console.log(`\n${"-".repeat(72)}\n`);
    if (smart.testCount < 40) console.log("Smart mode needs more history to learn your patterns (try --backtest 120).");
    else console.log([
      "Smart mode: learns when you usually come back (by hour of day and how long you've been away),",
      "and pings only when that chance pays for the ping. Learned on your older half, scored on the newer half:",
      `  smart (≤${smart.learnedLimit / HOUR}h + odds)   ${String(smart.smart.rescued).padStart(5)} rescued   pings ${money(smart.smart.spent).padStart(8)}   saved ${money(smart.smart.saved).padStart(8)}   net ${money(smart.smart.net).padStart(8)}`,
      `  best fixed limit (${smart.bestSimple.limit / HOUR}h) ${String(smart.bestSimple.rescued).padStart(5)} rescued   pings ${money(smart.bestSimple.spent).padStart(8)}   saved ${money(smart.bestSimple.saved).padStart(8)}   net ${money(smart.bestSimple.net).padStart(8)}`,
      `  (newer half starts ${new Date(smart.testFrom).toISOString().slice(0, 10)}; the fixed limit is picked with hindsight, smart is not)`,
    ].join("\n"));
    if (covered && covered < options.days - 1) console.log(`\nYou asked for ${options.days} days, but your logs only go back ${covered} (to ${new Date(first).toISOString().slice(0, 10)}). Claude Code deletes old transcripts; raise "cleanupPeriodDays" in ~/.claude/settings.json to keep more.`);
    return 0;
  }
  runOnce(options);
  if (options.mode === "watch") setInterval(() => runOnce(options), options.interval);
  return 0;
}

let invokedAsMain = false;
try {
  invokedAsMain = Boolean(process.argv[1])
    && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
} catch { /* Importing the pure functions must never trigger CLI side effects. */ }
if (invokedAsMain) process.exitCode = main();
