// simulate.js - the pure, deterministic cost functions.
//   computeRun(cfg)     : a full 8-task fan-out run (byte-identical to
//                         sim-fanout-prototype.html computeRun - canonical).
//   simulateRequest(...) : a single request against a cache (extends the Tape's
//                         simulateSend, per SIMULATOR_SPEC.md Section 5.4).
// No Date.now / Math.random anywhere in this module.

import { RATE, MODEL_IN, priceTable } from "./pricing.js";
import {
  WORK_IN,
  WORK_OUT,
  INLINE_B0,
  INLINE_GROWTH,
  WARM_WAVES,
  FANOUT_BUDGET,
  BASE_IDENTICAL,
  VAR_W,
  VAR_R,
  MIN_CACHEABLE_PREFIX,
} from "./constants.js";
import { subBaseTok, ledgerScale } from "./ledgers.js";

export { priceTable };

// ======================= Canonical fan-out run =======================
// Cost one full run, task by task, segment by segment. Returns tasks[] each with
// segs [{tok, rate, role, kind}], outTok, cost, cum; plus total, shipped, diedAt,
// and a rolled-up breakdown. Verbatim from the fan-out prototype (the numbers
// $5.58 / $22.49 are asserted in the tests).
export function computeRun(cfg) {
  const P = MODEL_IN[cfg.model];
  const perTokUSD = P / 1e6;
  const tasks = [];
  let cum = 0,
    total = 0,
    diedAt = null;
  const bd = {
    work: 0,
    output: 0,
    baseWrite: 0,
    baseRead: 0,
    variedWrite: 0,
    variedRead: 0,
    inlineRead: 0,
    inlineWrite: 0,
    coldBases: 0,
    warmReads: 0,
  };

  for (let s = 0; s < 8; s++) {
    const segs = [];
    if (cfg.who === "inline") {
      const prefix = INLINE_B0 + INLINE_GROWTH * s;
      segs.push({ tok: prefix, rate: RATE.read, role: "read", kind: "prefix" });
      segs.push({ tok: INLINE_GROWTH, rate: RATE.w1h, role: "write", kind: "tail" });
      segs.push({ tok: WORK_IN, rate: RATE.input, role: "write", kind: "work" });
      bd.inlineRead += prefix * RATE.read * perTokUSD;
      bd.inlineWrite += INLINE_GROWTH * RATE.w1h * perTokUSD;
    } else if (cfg.prompts === "identical") {
      const wave = Math.floor(s / cfg.width);
      const coldWave = wave % WARM_WAVES === 0;
      const firstInWave = s % cfg.width === 0;
      const cold = coldWave && firstInWave;
      if (cold) {
        segs.push({ tok: BASE_IDENTICAL, rate: RATE.w5m, role: "write", kind: "base" });
        bd.baseWrite += BASE_IDENTICAL * RATE.w5m * perTokUSD;
        bd.coldBases++;
      } else {
        segs.push({ tok: BASE_IDENTICAL, rate: RATE.read, role: "read", kind: "base" });
        bd.baseRead += BASE_IDENTICAL * RATE.read * perTokUSD;
        bd.warmReads++;
      }
      segs.push({ tok: WORK_IN, rate: RATE.input, role: "write", kind: "work" });
    } else {
      // subagent varied
      segs.push({ tok: VAR_R, rate: RATE.read, role: "read", kind: "varied" });
      segs.push({ tok: VAR_W, rate: RATE.w5m, role: "write", kind: "varied" });
      segs.push({ tok: WORK_IN, rate: RATE.input, role: "write", kind: "work" });
      bd.variedRead += VAR_R * RATE.read * perTokUSD;
      bd.variedWrite += VAR_W * RATE.w5m * perTokUSD;
    }

    let cost = 0,
      inTok = 0;
    for (let i = 0; i < segs.length; i++) {
      cost += segs[i].tok * segs[i].rate;
      inTok += segs[i].tok;
    }
    const outCost = WORK_OUT * RATE.out;
    cost = (cost + outCost) * perTokUSD;
    bd.work += WORK_IN * RATE.input * perTokUSD;
    bd.output += outCost * perTokUSD;

    cum += cost;
    total += cost;
    if (diedAt === null && cum > FANOUT_BUDGET) diedAt = s + 1;
    tasks.push({ index: s, segs, inTok, outTok: WORK_OUT, cost, cum });
  }
  return { tasks, total, shipped: diedAt === null, diedAt, breakdown: bd };
}

// ======================= Single-request simulation =======================
// TTL in minutes for a write tier.
export function ttlMin(tier) {
  return tier === "1h" ? 60 : 5;
}

function isExpired(entry, nowMin) {
  return nowMin - entry.lastTouchMin > ttlMin(entry.tier);
}

// simulateRequest(cache, cfg, req) -> { row, cache }
// Extends the Tape's simulateSend. Deterministic. Rules per Section 5.4:
//  - key: "main" | "sub:<promptHash>"
//  - cold: read 0, write baseTok (varied subs: write VAR_W*scale / read VAR_R*scale)
//  - warm identical: read prefix, write 0
//  - warm inline main: read prefix, write growth (INLINE_GROWTH) @ w1h
//  - workIn @ 1x, outTok @ 5x
//  - min-prefix rule (<1,024 tok never caches, C26)
export function simulateRequest(cache, cfg, req) {
  const { agent, promptHash, model, workIn, outTok, nowMin } = req;
  const key = agent === "main" ? "main" : `sub:${promptHash}`;
  const entries = { ...cache.entries };
  const existing = entries[key];
  const live = existing && !isExpired(existing, nowMin) ? existing : null;

  const scale = ledgerScale(cfg);
  const isVaried = agent === "sub" && cfg.prompts === "varied";
  // main writes 1h; subs write 1h iff the flag is on, else 5m (C12/C22).
  const writeTier = agent === "main" ? "1h" : cfg.oneHourFlag ? "1h" : "5m";
  const writeRate = writeTier === "1h" ? RATE.w1h : RATE.w5m;

  let readTok = 0;
  let writeTok = 0;
  let newPrefix;

  if (!live) {
    // Cold.
    if (isVaried) {
      readTok = Math.round(VAR_R * scale); // parent's shared front is warm (C11)
      writeTok = Math.round(VAR_W * scale);
      newPrefix = Math.round(subBaseTok(cfg));
    } else {
      readTok = 0;
      writeTok = agent === "main" ? mainBase(cfg) : subBaseTok(cfg);
      newPrefix = writeTok;
    }
  } else if (agent === "main") {
    // Warm inline main: re-read whole prefix, rewrite the growth tail (C29).
    readTok = live.prefixTok;
    writeTok = INLINE_GROWTH;
    newPrefix = live.prefixTok + INLINE_GROWTH;
  } else if (isVaried) {
    // Warm but varied still rewrites its one-word diff every time (C11).
    readTok = Math.round(VAR_R * scale);
    writeTok = Math.round(VAR_W * scale);
    newPrefix = live.prefixTok;
  } else {
    // Warm identical: full hit (C10 spawn-2).
    readTok = live.prefixTok;
    writeTok = 0;
    newPrefix = live.prefixTok;
  }

  const per = MODEL_IN[model] / 1e6;
  const usd =
    (readTok * RATE.read + writeTok * writeRate + workIn * RATE.input + outTok * RATE.out) * per;

  const row = {
    tMin: nowMin,
    unitId: req.unitId || null,
    agent,
    model,
    readTok,
    inputTok: workIn,
    writeTok,
    writeTier,
    outTok,
    usd,
  };

  // Min-prefix rule: prefixes below 1,024 tok never cache (C26).
  if (newPrefix >= MIN_CACHEABLE_PREFIX) {
    entries[key] = {
      prefixTok: newPrefix,
      tier: writeTier,
      lastTouchMin: nowMin,
      keyId: key,
    };
  } else {
    delete entries[key];
  }

  return { row, cache: { entries } };
}

// mainBase re-exported through a thin wrapper to avoid a circular import shape.
import { mainBaseTok as _mainBaseTok } from "./ledgers.js";
function mainBase(cfg) {
  return _mainBaseTok(cfg);
}

// Keep-warm during a gap of G minutes: cost = floor(G / interval) pings, each
// prefixTok * 0.1x; entry stays warm. Section 5.4.
export function keepWarmCost(prefixTok, gapMin, intervalMin, model) {
  const pings = Math.floor(gapMin / intervalMin);
  return pings * prefixTok * RATE.read * (MODEL_IN[model] / 1e6);
}
