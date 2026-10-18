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

/** Rebuild vs ping cost for a prefix; `maxPings` is how many pings one avoided rebuild pays for. */
export function economics(prefixTokens, model, ttl) {
  const price = priceFor(model);
  const rebuild = (prefixTokens * price.input * WRITE[ttl]) / 1e6;
  const ping = (prefixTokens * price.read) / 1e6;
  return { rebuild, ping, maxPings: ping > 0 ? Math.floor(rebuild / ping) - 1 : 0 };
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
export function plan(session, record, now, maxIdleMs) {
  const pings = record?.since === session.lastActivity ? record.pings : [];
  const lastTouch = Math.max(session.lastActivity, pings.at(-1)?.at ?? 0);
  const idle = now - session.lastActivity;
  const sinceTouch = now - lastTouch;
  const ttl = TTL_MS[session.ttl];
  if (record?.disabled) return { action: "skip", reason: record.disabled };
  if (sinceTouch >= ttl) return { action: "skip", reason: "already cold" };
  if (sinceTouch < ttl - MARGIN_MS[session.ttl]) return { action: "wait", inMs: ttl - MARGIN_MS[session.ttl] - sinceTouch };
  if (idle > maxIdleMs) return { action: "skip", reason: "past --max-idle" };
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

function parseDuration(value) {
  const match = /^(\d+(?:\.\d+)?)(m|h)?$/.exec(String(value));
  if (!match) throw new Error(`bad duration: ${value} (use e.g. 90m or 8h)`);
  return Number(match[1]) * (match[2] === "m" ? 60_000 : 3_600_000);
}

function parseArgs(argv) {
  const home = os.homedir();
  const options = { dir: path.join(home, ".claude", "projects"), state: path.join(home, ".claude", "keep-warm", "state.json"), maxIdleMs: 8 * 3_600_000, claude: "claude", mode: "once", dryRun: false, interval: 60_000 };
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
    else if (arg === "--test") { options.mode = "test"; options.testSession = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : "latest"; }
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--max-idle") options.maxIdleMs = parseDuration(value());
    else if (arg === "--dir") options.dir = path.resolve(value().replace(/^~(?=$|\/)/, home));
    else if (arg === "--state") options.state = path.resolve(value().replace(/^~(?=$|\/)/, home));
    else if (arg === "--claude") options.claude = value();
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

const money = (value) => `$${value < 0.1 ? value.toFixed(4) : value.toFixed(2)}`;
const mins = (ms) => `${Math.round(ms / 60_000)}m`;
const short = (id) => String(id).slice(0, 8);

function activeSessions(options, now) {
  const window = options.maxIdleMs + TTL_MS["1h"];
  return transcripts(options.dir, now - window)
    .map((file) => ({ turns: readTurns(file) }))
    .map(({ turns }) => ({ turns, session: summarize(turns) }))
    .filter(({ session }) => session?.sessionId && now - session.lastActivity <= window);
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
      const { rebuild, ping: readCost } = economics(pings.at(-1).prefix, session.model, session.ttl);
      state.ledger.push({ session: id, model: session.model, pings: pings.length, pingCost: pings.reduce((sum, p) => sum + p.cost, 0), warm: outcome.warm, avoided: outcome.warm ? rebuild - readCost : 0, at: outcome.at });
      record.outcome = outcome.warm ? "warm" : "cold";
      log(`${short(id)}  you came back ${outcome.warm ? "to a WARM cache" : "to a COLD cache"} after ${pings.length} ping(s)`);
    }
    if (record && record.since !== session.lastActivity) record = state.sessions[id] = { since: session.lastActivity, pings: [], disabled: record.disabled };
    const decision = plan(session, record, now, options.maxIdleMs);
    if (decision.action !== "ping") continue;
    const { rebuild, ping: estimate } = economics(session.prefix, session.model, session.ttl);
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

function selfTest(options, log = console.log) {
  const all = activeSessions({ ...options, maxIdleMs: 30 * 86_400_000 }, Date.now());
  const pick = options.testSession === "latest"
    ? all.sort((a, b) => b.session.lastActivity - a.session.lastActivity)[0]
    : all.find(({ session }) => session.sessionId.startsWith(options.testSession));
  if (!pick) { log("No matching session found. Use a session from the last 30 days."); return 1; }
  const { session } = pick;
  const idle = Date.now() - session.lastActivity;
  const { rebuild, ping: estimate, maxPings } = economics(session.prefix, session.model, session.ttl);
  log(`Session ${short(session.sessionId)}  ${session.model}  ${Math.round(session.prefix / 1000)}k-token prefix  ${session.ttl} TTL  idle ${mins(idle)}`);
  if (idle >= TTL_MS[session.ttl]) log("Its cache has already expired, so this ping will rebuild it; the test still shows what a ping reads and costs.");
  const result = ping(session, options);
  if (!result.ok) { log(`Ping failed: ${result.error}`); return 1; }
  log(`Ping read ${Math.round(result.read / 1000)}k of ${Math.round(session.prefix / 1000)}k prefix tokens (${Math.round(result.hit * 100)}%), wrote ${Math.round(result.write / 1000)}k, cost ${money(result.cost)}.`);
  log(`A cold rebuild of this session costs ~${money(rebuild)}. Ideal ping ~${money(estimate)}: one avoided rebuild pays for ~${maxPings} pings.`);
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
  --report         What pinging has spent vs. the rebuilds it avoided
  --dry-run        Show what would be pinged, send nothing
  --max-idle <d>   Stop pinging after this much idle time (default 8h; e.g. 90m, 12h)
  --dir <path>     Claude projects directory (default ~/.claude/projects)
  --state <file>   State file (default ~/.claude/keep-warm/state.json)
  --claude <bin>   claude executable (default: claude on PATH)`;

export function main(argv = process.argv.slice(2)) {
  let options;
  try { options = parseArgs(argv); } catch (error) { console.error(`cc-keep-warm: ${error.message}\nRun with --help for usage.`); return 1; }
  if (options.mode === "help") { console.log(HELP); return 0; }
  if (options.mode === "report") { console.log(report(loadState(options.state))); return 0; }
  if (options.mode === "test") return selfTest(options);
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
