// session.ts - realistic per-session message-stream generator.
// SIMULATOR_SPEC.md ties every calibration number to a source; this module's
// numbers trace to /Users/user/claude-cache-findings/build/SESSION_PROFILE.md
// (mined from 819 real jsonl transcripts: 88 main sessions, 705 subagent
// transcripts, last 30 days). Constants below cite the exact section.
// Deterministic: same (kind, seed, cfg) -> byte-identical stream. No
// Date.now / Math.random anywhere in this module (matches engine/simulate.ts).

import type { Config, Model } from "./types.js";
import { RATE, MODEL_IN } from "./pricing.js";
import { TOOLS_BASE, SYSTEM_BASE, CATALOG_FULL, CATALOG_RESIDUE, MEMORY_PER_FILE } from "./constants.js";
import { mcpShare, SUB_SCALE } from "./ledgers.js";

// ======================= xorshift128+ PRNG (byte-identical shape to game/step.ts) =======================
export interface SessionPrng {
  next(): number; // [0,1)
}
export function makeSessionPrng(seed: number): SessionPrng {
  let s0 = (seed ^ 0x9e3779b9) >>> 0;
  let s1 = (seed * 2654435761) >>> 0 || 1;
  return {
    next() {
      let x = s0;
      const y = s1;
      s0 = y;
      x ^= x << 23;
      x ^= x >>> 17;
      x ^= y ^ (y >>> 26);
      s1 = x >>> 0;
      return ((s0 + s1) >>> 0) / 4294967296;
    },
  };
}
function ri(pr: SessionPrng, lo: number, hi: number): number {
  return Math.round(lo + pr.next() * (hi - lo));
}

// ======================= SESSION_PROFILE.md distributions =======================
// Section 1: main sessions min 1 / median 7 / p90 377 / max 1023 user turns
// (assistant-turn count ~3.6x user turns, we model assistant turns directly
// since that's what carries usage rows). Bimodal: short-chat mass vs a long
// tail of ops/monitoring sessions.
export const MAIN_TURNS_SHORT_MEDIAN = 25; // ~ "median 25.5 real assistant-turn count" (Section 4)
export const MAIN_TURNS_LONG_P90 = 1091; // Section 4 p90 assistant-turn count
export const MAIN_TURNS_MAX = 2685; // Section 4 max assistant-turn count
export const LONG_SESSION_PROB = 0.12; // [ESTIMATE] calibrated so p90 of the sampler lands near real p90

// Section 1: subagents min 1 / median 14 / p90 54 / max 843 (deduped assistant turns)
export const SUB_TURNS_MEDIAN = 14;
export const SUB_TURNS_P90 = 54;
export const SUB_TURNS_MAX = 843;

// Section 2: ping-pong (tool_use -> tool_result) medians
export const MAIN_PINGPONG_MEDIAN = 22.5;
export const SUB_PINGPONG_MEDIAN = 19;
// [ESTIMATE] burst-mode markov: once in a tool-heavy stretch, stay tool-heavy
// with this probability each turn (bursts, not uniform spread - Section "How
// the simulator should use this").
export const BURST_STICKINESS = 0.72;

// Section 3 (warm-session table): per-turn output tokens, typical range +
// occasional spike.
export const OUTPUT_TYP_LO = 100;
export const OUTPUT_TYP_HI = 1200;
export const OUTPUT_SPIKE_LO = 2000;
export const OUTPUT_SPIKE_HI = 4000;
export const OUTPUT_SPIKE_PROB = 0.1; // "~1-in-10"

// Section 3: cache_read grows ~monotonically +2-3K tok/turn (context accretion).
export const CTX_GROWTH_LO = 2000;
export const CTX_GROWTH_HI = 3000;

// Section 3: cold-base write range seen at turn 0 of main sessions (25-65K).
export const MAIN_COLD_BASE_LO = 25000;
export const MAIN_COLD_BASE_HI = 65000;
// Section 5: subagent turn-1 cache_write median 38,347 / p90 49,818 / max 97,594.
export const SUB_COLD_WRITE_MEDIAN = 38347;
export const SUB_COLD_WRITE_P90 = 49818;
export const SUB_COLD_WRITE_MAX = 97594;

// Section 3: warm-turn cache_write is small - "a few hundred to ~5K tok".
export const WARM_WRITE_LO = 300;
export const WARM_WRITE_HI = 5500;

// Section "cold rebuilds": found in 29/88 main sessions (~33%) long enough to
// hit a TTL gap or idle period.
export const REBUILD_PROB = 29 / 88;
// Rebuilds only make sense once a session has run long enough to have TTL-gap
// exposure; [ESTIMATE] floor turn count below which we never fire one.
export const REBUILD_MIN_TURN = 5;

// [ESTIMATE] not in SESSION_PROFILE.md: context-window compaction threshold.
// Claude Code compacts near its context ceiling; 150K tok approximates "most
// of a 200K window consumed by cached history" without claiming a measured
// number. Tag: [ESTIMATE].
export const COMPACTION_THRESHOLD_TOK = 150000;

// ======================= request layer composition =======================
// Mirrors ledgers.ts mainBaseTok's internals but returns the breakdown instead
// of the sum, so the UI can price + label each layer honestly (DESIGN_TOKENS.md:
// tools ~16,295/14-tool main; system ~2,750; the "13,083" block is this
// machine's SessionStart-hook (token-optimizer) output, NOT a universal skills
// catalog - label it that way, never "skills catalog" alone).
export interface RequestLayers {
  tools: number;
  system: number;
  hookCatalog: number; // SessionStart hook (catalog) block
  memory: number;
  messagesResidue: number;
  total: number;
}
export function requestLayers(cfg: Config, who: "main" | "subagent"): RequestLayers {
  const tools = TOOLS_BASE * mcpShare(cfg.mcp);
  const system = SYSTEM_BASE;
  const hookCatalog = CATALOG_FULL * (cfg.skillsMode === "eager" ? cfg.skills / 150 : 10 / 150);
  const memory = MEMORY_PER_FILE * cfg.memoryFiles;
  const messagesResidue = CATALOG_RESIDUE;
  const scale = who === "subagent" ? SUB_SCALE : 1;
  const round = (x: number) => Math.round(x * scale);
  const layers = {
    tools: round(tools),
    system: round(system),
    hookCatalog: round(hookCatalog),
    memory: round(memory),
    messagesResidue: round(messagesResidue),
    total: 0,
  };
  layers.total = layers.tools + layers.system + layers.hookCatalog + layers.memory + layers.messagesResidue;
  return layers;
}

// ======================= session turn stream =======================
export type TurnEvent = "compaction" | "rebuild" | null;

export interface SessionTurn {
  idx: number;
  input: number; // uncached "input_tokens" (near-flat, tiny per Section 3)
  output: number;
  cacheRead: number;
  cacheWrite: number;
  writeTier: "5m" | "1h";
  pingPongs: number; // tool_use<->tool_result cycles this turn
  event: TurnEvent;
}

export interface SessionStream {
  kind: "main" | "subagent";
  seed: number;
  turns: SessionTurn[];
  layers: RequestLayers; // composition of the turn-0 (or post-compaction) cold base
  totalPingPongs: number;
  rebuiltAt: number[]; // turn indices where a TTL/idle rebuild fired
  compactedAt: number[]; // turn indices where compaction fired
}

function sampleTurnCount(pr: SessionPrng, kind: "main" | "subagent"): number {
  if (kind === "subagent") {
    // triangular-ish: mostly near median, tail toward p90/max.
    const u = pr.next();
    if (u < 0.75) return Math.max(1, ri(pr, 1, SUB_TURNS_MEDIAN * 2));
    if (u < 0.95) return ri(pr, SUB_TURNS_MEDIAN, SUB_TURNS_P90);
    return ri(pr, SUB_TURNS_P90, SUB_TURNS_MAX);
  }
  // main: bimodal - short-chat mass vs long ops-session tail.
  if (pr.next() < LONG_SESSION_PROB) {
    return ri(pr, MAIN_TURNS_SHORT_MEDIAN, MAIN_TURNS_LONG_P90 > MAIN_TURNS_MAX ? MAIN_TURNS_MAX : MAIN_TURNS_LONG_P90);
  }
  return Math.max(1, ri(pr, 1, MAIN_TURNS_SHORT_MEDIAN * 2));
}

function sampleOutput(pr: SessionPrng): number {
  if (pr.next() < OUTPUT_SPIKE_PROB) return ri(pr, OUTPUT_SPIKE_LO, OUTPUT_SPIKE_HI);
  return ri(pr, OUTPUT_TYP_LO, OUTPUT_TYP_HI);
}

function sampleColdWrite(pr: SessionPrng, kind: "main" | "subagent"): number {
  if (kind === "main") return ri(pr, MAIN_COLD_BASE_LO, MAIN_COLD_BASE_HI);
  const u = pr.next();
  if (u < 0.75) return ri(pr, 20000, SUB_COLD_WRITE_MEDIAN);
  if (u < 0.95) return ri(pr, SUB_COLD_WRITE_MEDIAN, SUB_COLD_WRITE_P90);
  return ri(pr, SUB_COLD_WRITE_P90, SUB_COLD_WRITE_MAX);
}

// generateSession(kind, seed, cfg) -> a deterministic realistic turn stream.
// Turn 0 (and the turn right after any compaction/rebuild) pays the cold base
// write; cache_read grows monotonically between those events; warm turns pay
// small incremental writes; ~33% of sessions get one mid-session TTL rebuild
// (cache_read collapses to 0, cache_write ~= prior cache_read); crossing
// COMPACTION_THRESHOLD_TOK forces the same cold-write signature.
export function generateSession(kind: "main" | "subagent", seed: number, cfg: Config): SessionStream {
  const pr = makeSessionPrng(seed);
  const n = sampleTurnCount(pr, kind);
  const writeTier: "5m" | "1h" = kind === "main" ? "1h" : cfg.oneHourFlag ? "1h" : "5m";
  const layers = requestLayers(cfg, kind);

  // Decide, once, whether this session gets a TTL/idle rebuild (only sessions
  // long enough to have gap exposure - REBUILD_MIN_TURN floor).
  const eligible = n > REBUILD_MIN_TURN;
  const willRebuild = eligible && pr.next() < REBUILD_PROB;
  const rebuildTurn = willRebuild ? ri(pr, REBUILD_MIN_TURN, n - 1) : -1;

  const turns: SessionTurn[] = [];
  const rebuiltAt: number[] = [];
  const compactedAt: number[] = [];
  let cachedCtx = 0; // running cached prefix size (cache_read baseline for next turn)
  let burstMode = pr.next() < 0.5;
  let totalPingPongs = 0;

  for (let t = 0; t < n; t++) {
    // Burst/quiet stretches (markov chain), not uniform spread.
    if (pr.next() > BURST_STICKINESS) burstMode = !burstMode;
    const pingBase = kind === "main" ? MAIN_PINGPONG_MEDIAN : SUB_PINGPONG_MEDIAN;
    const perTurnAvg = pingBase / n;
    const pingPongs = burstMode
      ? Math.round(perTurnAvg * ri(pr, 2, 4))
      : pr.next() < 0.5
        ? 0
        : Math.round(perTurnAvg * 0.5);
    totalPingPongs += pingPongs;

    const output = sampleOutput(pr);
    const input = ri(pr, 1, 3); // Section 3: "essentially flat at 1-3 tokens"

    let cacheRead: number;
    let cacheWrite: number;
    let event: TurnEvent = null;

    const overThreshold = cachedCtx >= COMPACTION_THRESHOLD_TOK;
    if (t === 0) {
      cacheRead = 0;
      cacheWrite = sampleColdWrite(pr, kind);
      cachedCtx = cacheWrite;
    } else if (overThreshold) {
      // Compaction: history dropped, fresh cold base write next turn.
      cacheRead = 0;
      cacheWrite = layers.total > 0 ? layers.total : sampleColdWrite(pr, kind);
      cachedCtx = cacheWrite;
      event = "compaction";
      compactedAt.push(t);
    } else if (t === rebuildTurn) {
      // TTL/idle rebuild signature: read collapses to 0, write ~= prior read.
      cacheRead = 0;
      cacheWrite = cachedCtx;
      cachedCtx = cacheWrite;
      event = "rebuild";
      rebuiltAt.push(t);
    } else {
      cacheRead = cachedCtx;
      cacheWrite = ri(pr, WARM_WRITE_LO, WARM_WRITE_HI);
      cachedCtx = cacheRead + cacheWrite;
    }

    turns.push({ idx: t, input, output, cacheRead, cacheWrite, writeTier, pingPongs, event });
  }

  return { kind, seed, turns, layers, totalPingPongs, rebuiltAt, compactedAt };
}

// ======================= price breakdown (for the hover UI) =======================
export interface PriceLine {
  label: string;
  tok: number;
  mult: number;
  perM: number; // model's $/1M base input price
  usd: number;
  math: string; // human-readable "tok x mult x $perM/M = $usd"
}
export interface TurnPriceBreakdown {
  lines: PriceLine[];
  totalUsd: number;
}

function line(label: string, tok: number, mult: number, model: Model): PriceLine {
  const perM = MODEL_IN[model];
  const usd = tok * mult * (perM / 1e6);
  const math = `${tok.toLocaleString()} tok x ${mult}x x $${perM}/M = $${usd.toFixed(4)}`;
  return { label, tok, mult, perM, usd, math };
}

// priceTurn(turn, model) -> exact per-layer $ breakdown with the multiplier
// math spelled out, per RATE (0.1x read / 1.25x 5m-write / 2x 1h-write / 1x
// input / 5x output). Hard UI requirement: show the multiplier math, not just
// the total.
export function priceTurn(turn: SessionTurn, model: Model): TurnPriceBreakdown {
  const lines: PriceLine[] = [];
  if (turn.cacheRead > 0) lines.push(line("cache_read", turn.cacheRead, RATE.read, model));
  if (turn.cacheWrite > 0) {
    const mult = turn.writeTier === "1h" ? RATE.w1h : RATE.w5m;
    lines.push(line(`cache_write (${turn.writeTier})`, turn.cacheWrite, mult, model));
  }
  if (turn.input > 0) lines.push(line("input", turn.input, RATE.input, model));
  if (turn.output > 0) lines.push(line("output", turn.output, RATE.out, model));
  const totalUsd = lines.reduce((a, l) => a + l.usd, 0);
  return { lines, totalUsd };
}

export function priceLayers(layers: RequestLayers, model: Model, writeTier: "5m" | "1h"): TurnPriceBreakdown {
  const mult = writeTier === "1h" ? RATE.w1h : RATE.w5m;
  const lines: PriceLine[] = [
    line("tools base", layers.tools, mult, model),
    line("system prompt", layers.system, mult, model),
    line("SessionStart hook (catalog)", layers.hookCatalog, mult, model),
    line("memory files", layers.memory, mult, model),
    line("messages residue", layers.messagesResidue, mult, model),
  ].filter((l) => l.tok > 0);
  const totalUsd = lines.reduce((a, l) => a + l.usd, 0);
  return { lines, totalUsd };
}
