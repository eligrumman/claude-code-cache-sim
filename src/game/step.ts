// game/step.ts - the deterministic reducer over the SDLC unit graph (Section 5.3)
// and the replay driver (Section 5.5). The pipeline logic is ported verbatim from
// the proven vanilla mock (build/sim-mock.html): buildQueue, runUnit, handCode,
// applyGap, the hidden-cost accruals, and the win/lose transitions. Numbers are
// NOT changed - request costs come from the canonical engine (simulateRequest),
// and every calibration constant traces to engine/constants.ts.

import { RATE, MODEL_IN } from "../engine/pricing.js";
import { mainBaseTok } from "../engine/ledgers.js";
import { simulateRequest, ttlMin } from "../engine/simulate.js";
import {
  DEFAULT_CFG,
  DEV_Q,
  PLAN_Q,
  HOOK_POISON,
  CATALOG_FULL,
  N_DEV,
  MANUAL_MULT_GAME,
  SCOPE_SCALE,
  SCOPE_BUDGET,
  SCOPE_DAYS,
  DAY_LEN_MIN,
} from "../engine/constants.js";
import type { Config, Model } from "../engine/types.js";
import type {
  Action,
  GameState,
  LedgerRow,
  SaveFile,
  Scope,
  UnitInstance,
  UnitKind,
} from "./types.js";

// ---- xorshift-ish PRNG, byte-identical to the mock's makePRNG ----
interface Prng {
  next(): number;
  s0: number;
  s1: number;
}
function makePrng(seed: number): Prng {
  let s0 = (seed ^ 0x9e3779b9) >>> 0;
  let s1 = (seed * 2654435761) >>> 0 || 1;
  return {
    get s0() {
      return s0;
    },
    get s1() {
      return s1;
    },
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

// ---- the scripted single-ticket pipeline (mock unitDefs, spec 3.3) ----
type UnitDef = Omit<UnitInstance, "id" | "ticket" | "deps" | "status" | "cause">;
function unitDefs(): UnitDef[] {
  return [
    { kind: "PLAN", hours: 2.0, workIn: 3000, outTok: 8000 },
    { kind: "DEV", hours: 1.5, workIn: 6000, outTok: 44000, fan: true },
    { kind: "CODE_REVIEW", hours: 1.0, workIn: 9000, outTok: 6000 },
    { kind: "ADDRESS_REVIEW", hours: 0.75, workIn: 4000, outTok: 15000, rework: "review" },
    { kind: "WRITE_TESTS", hours: 1.0, workIn: 7000, outTok: 25000 },
    { kind: "CI_RUN", hours: 0.25, workIn: 0, outTok: 0, free: true },
    { kind: "CI_FIX", hours: 0.75, workIn: 8000, outTok: 12000, rework: "ci" },
    { kind: "QA", hours: 1.5, workIn: 6000, outTok: 12000 },
    { kind: "DEPLOY", hours: 0.5, workIn: 2000, outTok: 4000 },
    { kind: "POSTDEPLOY_BUG", hours: 0.5, workIn: 6000, outTok: 6000, scripted: true },
    { kind: "DEBUG", hours: 1.0, workIn: 8000, outTok: 20000, rework: "bug" },
    { kind: "HOTFIX", hours: 0.5, workIn: 8000, outTok: 4000 },
  ];
}

// L1-onboarding scenario (L1_REDESIGN.md Section 3/7): 4 fixed-order TASK
// units on the growing main session. The standup is NOT in this queue - it
// lives on GameState.standup because it is playable at any point (gap #3).
// Real task identities per L1_REDESIGN.md Section 3's unit table ("fix the
// login bug", "add the logout route", "write the tests", "update the docs")
// - a display label only, read by the UI (ChoiceBar/tape row labels); the
// engine numbers (hours/workIn/outTok/growthTok) are unchanged.
export const L1_TASK_LABELS = [
  "Fix the login bug",
  "Add the logout route",
  "Write the tests",
  "Update the docs",
];

export function buildL1Tasks(): UnitInstance[] {
  const tasks: UnitInstance[] = [];
  for (let i = 0; i < 4; i++) {
    tasks.push({
      id: "task" + i,
      kind: "TASK",
      ticket: 1,
      deps: [],
      status: "queued",
      cause: null,
      hours: 0.5, // 30 min
      workIn: 2000,
      outTok: 3000,
      growthTok: 3000,
      label: L1_TASK_LABELS[i],
    });
  }
  return tasks;
}

export function buildL1Standup(): UnitInstance {
  return {
    id: "standup",
    kind: "STANDUP",
    ticket: 1,
    deps: [],
    status: "queued",
    cause: null,
    hours: 1.5, // 90 min
    workIn: 0,
    outTok: 0,
    free: true, // no request emitted - absence, not work (Section 3)
    anyOrder: true,
    label: "Standup",
  };
}

// Build the unit queue, expanding rework deterministically from model quality.
// Ported exactly from the mock (including PRNG consumption order).
export function buildQueue(cfg: Config, seed: number, scenario?: string): UnitInstance[] {
  if (scenario === "l1-onboarding") return buildL1Tasks();
  const pr = makePrng(seed ^ 0x5151);
  const q = 0.8 / (DEV_Q[cfg.devModel] * DEV_Q[cfg.devModel] * PLAN_Q[cfg.planModel]);
  const extraReview = Math.round(q + pr.next() * 0.6);
  const ciFail = q > 0.8 ? 1 + Math.round(pr.next() * 0.5) : 0;
  let extraBug = Math.round((q - 0.4) * (0.7 + pr.next() * 0.4));
  if (extraBug < 0) extraBug = 0;

  const out: UnitInstance[] = [];
  let id = 0;
  const push = (d: UnitDef, cause: UnitInstance["cause"] = null): void => {
    out.push({ id: "u" + id++, ticket: 1, deps: [], status: "queued", cause, ...d });
  };
  unitDefs().forEach((d) => {
    if (d.kind === "ADDRESS_REVIEW") {
      const rounds = 1 + extraReview;
      for (let r = 0; r < rounds; r++)
        push({ ...d, label: rounds > 1 ? "review round " + (r + 1) : null }, r > 0 ? "plan-quality" : null);
    } else if (d.kind === "CI_FIX") {
      if (ciFail === 0) return;
      for (let c = 0; c < ciFail; c++) push({ ...d, label: "CI failed: fix" }, "dev-quality");
    } else if (d.kind === "DEBUG") {
      const bugs = 1 + extraBug;
      for (let b = 0; b < bugs; b++)
        push({ ...d, label: bugs > 1 ? "debug bug " + (b + 1) : null }, b > 0 ? "plan-quality" : null);
    } else {
      push(d);
    }
  });
  return out;
}

// ---- game factory ----
export function initGame(
  seed: number,
  scope: Scope,
  cfgOverride: Partial<Config> = {},
  clockCapMin?: number,
  scenario?: string,
): GameState {
  const cfg: Config = { ...DEFAULT_CFG, ...cfgOverride };
  const budget = scenario === "l1-onboarding" ? 0.55 : SCOPE_BUDGET[scope];
  // LevelDef.clockCapMin (GAME_PLAN.md Section C.1) overrides the default
  // scope-day clock so a level's scripted queue (hours + idle gaps) has room
  // to actually finish under interactive step-by-step play, not just under
  // runScript's end-of-run-only checkEnd.
  const endMin = clockCapMin ?? DAY_LEN_MIN * SCOPE_DAYS[scope];
  const prng = makePrng(seed);
  return {
    seed,
    scope,
    clockMin: 0,
    endMin,
    dayLen: DAY_LEN_MIN,
    wallet: budget,
    budget,
    manualHours: 0,
    tedium: 0,
    cfg,
    cache: { entries: {} },
    units: buildQueue(cfg, seed, scenario),
    idx: 0,
    bugsOpen: 0,
    ledger: [],
    lastRequests: [],
    prng: { s0: prng.s0, s1: prng.s1 },
    idleLog: [],
    hidden: {
      reworkUsd: 0,
      idleRebuildUsd: 0,
      flagDeltaUsd: 0,
      hookUsd: 0,
      eagerSkillsUsd: 0,
      inlineRereadUsd: 0,
    },
    counts: {
      reviewRounds: 0,
      ciFixes: 0,
      bugs: 0,
      handCoded: 0,
      spawns: 0,
      coldSpawns: 0,
      sessions: 0,
      idleGaps: 0,
    },
    sessionStarts: 0,
    ratioNum: 0,
    ratioDen: 0,
    ended: null,
    standup: scenario === "l1-onboarding" ? buildL1Standup() : undefined,
  };
}

// ---- helpers (all pure, all deterministic) ----
function modelFor(st: GameState, u: UnitInstance): Model {
  if (u.kind === "PLAN") return st.cfg.planModel;
  if (u.kind === "DEV") return st.cfg.devModel;
  return st.cfg.orchestratorModel;
}

// Idle schedule: which unit indices are preceded by a gap (minutes). Mock idleBefore.
function idleBefore(st: GameState, unitIndex: number): number {
  // L1-onboarding has no scripted idle gaps (L1_REDESIGN Section 7, item 3):
  // its only "gaps" are the player-chosen coffee/standup ADVANCE actions.
  // `standup` is only ever set for this scenario, so it doubles as the flag.
  if (st.standup) return 0;
  if (unitIndex === 3) return 35; // after DEV wave
  if (unitIndex === 7) return 40; // before QA
  if (st.scope !== "session") {
    if (unitIndex === 5) return 720; // overnight
    if (st.scope === "month" && unitIndex === 9) return 720; // second overnight
  }
  return 0;
}

function isLive(st: GameState, key: string, nowMin: number): boolean {
  const e = st.cache.entries[key];
  if (!e) return false;
  return nowMin - e.lastTouchMin <= ttlMin(e.tier);
}

// Expire + keep-warm handling across a gap of G minutes on the main cache.
function applyGap(st: GameState, G: number): void {
  if (G <= 0) return;
  st.counts.idleGaps++;
  const main = st.cache.entries["main"];
  if (st.cfg.keepWarm && main) {
    const pings = Math.floor(G / st.cfg.keepWarmMin);
    const per = MODEL_IN[st.cfg.orchestratorModel] / 1e6;
    st.wallet -= pings * main.prefixTok * RATE.read * per;
    main.lastTouchMin = st.clockMin + G; // stays warm
  } else if (main) {
    if (G > ttlMin(main.tier)) {
      const per = MODEL_IN[st.cfg.orchestratorModel] / 1e6;
      const mult = main.tier === "1h" ? RATE.w1h : RATE.w5m;
      st.hidden.idleRebuildUsd += main.prefixTok * (mult - RATE.read) * per;
    }
  }
  st.clockMin += G;
  if (G >= 480) st.counts.sessions++;
}

// ---- hidden-cost accruals (mock accrueInline / accrueBaseSide / trackFlag / trackEager) ----
function trackFlag(st: GameState, r: LedgerRow): void {
  if (r.cold && r.writeTok > 0) {
    st.ratioDen += r.writeTok;
    if (r.writeTier === "1h") {
      st.ratioNum += r.writeTok;
      if (st.cfg.oneHourFlag && r.agent !== "main") {
        const per = MODEL_IN[r.model] / 1e6;
        st.hidden.flagDeltaUsd += r.writeTok * (RATE.w1h - RATE.w5m) * per;
      }
    }
  }
}
function trackEager(st: GameState, r: LedgerRow): void {
  if (r.cold && r.writeTok > 0 && st.cfg.skillsMode === "eager") {
    const eagerTok = CATALOG_FULL * (st.cfg.skills / 150 - 10 / 150);
    if (eagerTok > 0) {
      const share = eagerTok / Math.max(1, mainBaseTok(st.cfg));
      const per = MODEL_IN[r.model] / 1e6;
      const mult = r.writeTier === "1h" ? RATE.w1h : RATE.w5m;
      st.hidden.eagerSkillsUsd += r.writeTok * share * mult * per;
    }
  }
}
function accrueInline(st: GameState, r: LedgerRow): void {
  if (r.readTok > 0) {
    const per = MODEL_IN[r.model] / 1e6;
    st.hidden.inlineRereadUsd += r.readTok * RATE.read * per;
  }
  trackFlag(st, r);
  trackEager(st, r);
}
function accrueBaseSide(st: GameState, r: LedgerRow): void {
  trackFlag(st, r);
  trackEager(st, r);
}

// One priced request through the canonical engine, tagged into a game LedgerRow.
function emit(
  st: GameState,
  u: UnitInstance,
  agent: "main" | "sub",
  spawnIdx: number,
  promptHash: string,
  model: Model,
  workIn: number,
  outTok: number,
  nowMin: number,
  growthTok?: number,
): LedgerRow {
  const key = agent === "main" ? "main" : "sub:" + promptHash;
  const cold = !isLive(st, key, nowMin);
  const { row, cache } = simulateRequest(st.cache, st.cfg, {
    agent,
    promptHash,
    model,
    workIn,
    outTok,
    nowMin,
    unitId: u.id,
    growthTok,
  });
  st.cache = cache;
  const led: LedgerRow = {
    tMin: st.clockMin,
    unitId: u.id,
    unit: u.kind,
    agent: agent === "main" ? "main" : (`sub${spawnIdx + 1}` as `sub${number}`),
    model,
    cold,
    readTok: row.readTok,
    inputTok: row.inputTok,
    writeTok: row.writeTok,
    writeTier: row.writeTier,
    outTok: row.outTok,
    usd: row.usd,
  };
  return led;
}

// ---- RUN_UNIT (mock runUnit) ----
function runUnit(st: GameState, u: UnitInstance): void {
  const gap = idleBefore(st, st.idx);
  applyGap(st, gap);
  st.clockMin += u.hours * 60;

  if (u.free) {
    u.status = "done";
    st.idx++;
    st.lastRequests = [];
    return;
  }

  const K = SCOPE_SCALE[st.scope];
  const workIn = Math.round(u.workIn * K);
  const outTok = Math.round(u.outTok * K);
  const model = modelFor(st, u);
  const isSessionStart = st.idx === 0 || gap >= 480;
  if (isSessionStart) {
    st.sessionStarts++;
    if (st.sessionStarts > 1 && st.cfg.hook === "dynamic") {
      const per = MODEL_IN[st.cfg.orchestratorModel] / 1e6;
      st.hidden.hookUsd += HOOK_POISON * (RATE.w1h - RATE.read) * per;
    }
  }

  const reqs: LedgerRow[] = [];
  if (u.fan) {
    if (st.cfg.who === "inline") {
      for (let i = 0; i < N_DEV; i++) {
        const r = emit(st, u, "main", 0, "main", model, workIn, outTok, st.clockMin + i);
        accrueInline(st, r);
        reqs.push(r);
      }
    } else {
      for (let j = 0; j < N_DEV; j++) {
        const varied = st.cfg.prompts === "varied";
        const ph = varied ? "dev-" + j : "dev-identical";
        const r = emit(st, u, "sub", j, ph, model, workIn, outTok, st.clockMin + j);
        st.counts.spawns++;
        if (r.cold) st.counts.coldSpawns++;
        accrueBaseSide(st, r);
        reqs.push(r);
      }
    }
  } else {
    // single requests run on the growing main session.
    const r = emit(st, u, "main", 0, "main", model, workIn, outTok, st.clockMin, u.growthTok);
    accrueInline(st, r);
    reqs.push(r);
  }

  let spent = 0;
  for (const r of reqs) {
    st.ledger.push(r);
    spent += r.usd;
    st.wallet -= r.usd;
  }
  if (u.cause) st.hidden.reworkUsd += spent;
  if (u.rework === "review") st.counts.reviewRounds++;
  if (u.rework === "ci") st.counts.ciFixes++;
  if (u.rework === "bug") st.counts.bugs++;

  u.status = "done";
  st.idx++;
  st.lastRequests = reqs;
}

// ---- HAND_CODE (mock handCode) ----
function handCode(st: GameState, u: UnitInstance): void {
  st.clockMin += u.hours * 60 * MANUAL_MULT_GAME;
  st.tedium = Math.min(100, st.tedium + 8 * u.hours);
  st.counts.handCoded++;
  u.status = "handcoded";
  st.idx++;
  st.lastRequests = [];
}

// Affordability floor: the cheapest possible request (mock canAfford).
export function canAfford(st: GameState, u: UnitInstance): boolean {
  if (u.free) return true;
  const K = SCOPE_SCALE[st.scope];
  const per = MODEL_IN[modelFor(st, u)] / 1e6;
  const floor = (u.workIn * K * RATE.input + u.outTok * K * RATE.out) * per * 0.9;
  return st.wallet >= floor;
}

function biggestHidden(st: GameState): keyof GameState["hidden"] {
  const h = st.hidden;
  let best: keyof GameState["hidden"] = "idleRebuildUsd";
  let bv = -1;
  (Object.keys(h) as (keyof GameState["hidden"])[]).forEach((k) => {
    if (h[k] > bv) {
      bv = h[k];
      best = k;
    }
  });
  return best;
}
function lossFromHidden(st: GameState): string {
  const map: Partial<Record<keyof GameState["hidden"], string>> = {
    idleRebuildUsd: "L1",
    reworkUsd: "L7",
    flagDeltaUsd: "L6",
    hookUsd: "L5",
    eagerSkillsUsd: "L2",
    inlineRereadUsd: "L2",
  };
  return "L8:" + (map[biggestHidden(st)] || "L1");
}

// End-condition check (mock checkEnd). Sets state.ended.
export function checkEnd(st: GameState): void {
  const allDone = st.idx >= st.units.length && (!st.standup || st.standup.status === "done");
  if (st.tedium >= 100) {
    st.ended = { result: "loss", lossId: lossFromHidden(st) };
    return;
  }
  if (st.clockMin > st.endMin && !allDone) {
    st.ended = { result: "loss", lossId: "L7" };
    return;
  }
  if (allDone) st.ended = { result: "win" };
}

// step(state, action) -> next state (pure). SIMULATOR_SPEC.md Section 5.3.
export function step(state: GameState, action: Action): GameState {
  // JSON deep-clone: GameState is pure JSON data (no Dates/Maps/functions), and
  // this is proxy-safe (Svelte 5 wraps $state in Proxies that structuredClone
  // rejects). Deterministic - the reducer stays pure.
  const st: GameState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case "SET_CFG":
      // Config edits allowed between units only. Rebuild the queue if untouched.
      Object.assign(st.cfg, action.patch);
      if (st.idx === 0) st.units = buildQueue(st.cfg, st.seed);
      break;
    case "RUN_UNIT": {
      if (st.ended) break;
      // The standup lives outside units[] and is playable at any queue
      // position (L1_REDESIGN Section 7, gap #3): no gap/idx bookkeeping,
      // just a pure clock advance with no request emitted.
      if (st.standup && action.unitId === st.standup.id && st.standup.status === "queued") {
        st.clockMin += st.standup.hours * 60;
        st.standup.status = "done";
        st.lastRequests = [];
        checkEnd(st);
        break;
      }
      const u = st.units[st.idx];
      if (u && (action.unitId === u.id || action.unitId === "")) {
        runUnit(st, u);
        checkEnd(st);
      }
      break;
    }
    case "ADVANCE": {
      if (st.ended) break;
      st.clockMin += action.min;
      break;
    }
    case "HAND_CODE": {
      if (st.ended) break;
      const u = st.units[st.idx];
      if (u && (action.unitId === u.id || action.unitId === "")) {
        handCode(st, u);
        checkEnd(st);
      }
      break;
    }
    case "IDLE_RESOLVE":
      break;
    case "TICK_REPLAY":
      break;
    default: {
      const _never: never = action;
      return _never;
    }
  }
  return st;
}

// Headless scripted run: play the whole queue, running when affordable else
// hand-coding (mock runScript). `forceRun` measures the uncapped economic cost.
export function runScript(
  seed: number,
  scope: Scope,
  cfgOverride: Partial<Config> = {},
  forceRun = false,
  clockCapMin?: number,
): GameState {
  const st = initGame(seed, scope, cfgOverride, clockCapMin);
  let guard = 0;
  while (st.idx < st.units.length && guard++ < 500) {
    const u = st.units[st.idx];
    if (forceRun || canAfford(st, u)) runUnit(st, u);
    else handCode(st, u);
  }
  checkEnd(st);
  return st;
}

// Total spent = budget drained from the wallet.
export function totalSpent(st: GameState): number {
  return st.budget - st.wallet;
}

// ---- L1-onboarding fixed config + scripted reference/anti runs (L1_REDESIGN
// Section 3/8) - used by levels.ts (referenceCfg/antiCfg) and boot-asserted in
// assert.ts / step.test.ts. Numbers: reference $0.416 (3 stars), anti $0.525
// (2 cold main writes -> fails the cold-write gate clause).
export const L1_CFG: Partial<Config> = {
  who: "inline",
  hook: "static",
  skillsMode: "invoke",
  skills: 10,
  memoryFiles: 0,
  mcp: [true, true, true, true],
};

export function initL1(seed = 1): GameState {
  return initGame(seed, "session", L1_CFG, DAY_LEN_MIN, "l1-onboarding");
}

// Tasks 1-4 back-to-back, one 20-min coffee anywhere, standup last: 1 cold
// main write, $0.416, 3 stars.
export function runL1Reference(seed = 1): GameState {
  let st = initL1(seed);
  st = step(st, { type: "RUN_UNIT", unitId: "task0" });
  st = step(st, { type: "RUN_UNIT", unitId: "task1" });
  st = step(st, { type: "ADVANCE", min: 20 }); // coffee, well under the 60-min TTL
  st = step(st, { type: "RUN_UNIT", unitId: "task2" });
  st = step(st, { type: "RUN_UNIT", unitId: "task3" });
  st = step(st, { type: "RUN_UNIT", unitId: "standup" });
  return st;
}

// Standup taken between tasks 2 and 3: the 90-min absence outlives the 60-min
// TTL, so task 3 rebuilds cold. 2 cold main writes, ~$0.525 -> fails the
// cold-write clause even though the dollar total alone would pass.
export function runL1Anti(seed = 1): GameState {
  let st = initL1(seed);
  st = step(st, { type: "RUN_UNIT", unitId: "task0" });
  st = step(st, { type: "RUN_UNIT", unitId: "task1" });
  st = step(st, { type: "RUN_UNIT", unitId: "standup" });
  st = step(st, { type: "RUN_UNIT", unitId: "task2" });
  st = step(st, { type: "RUN_UNIT", unitId: "task3" });
  return st;
}

// replay(save, init) -> final state. Deterministic given (seed, actions) alone
// (invariant 8: two replays => identical ledger).
export function replay(
  save: SaveFile,
  init: (seed: number, mode: SaveFile["mode"]) => GameState,
): GameState {
  let state = init(save.seed, save.mode);
  for (const action of save.actions) state = step(state, action);
  return state;
}
