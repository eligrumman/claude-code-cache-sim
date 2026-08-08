// game/types.ts - the SDLC unit graph + GameState + Action, from
// SIMULATOR_SPEC.md Section 5.1. Where TypeScript earns its keep.

import type { CacheState, Config, Model, WriteTier } from "../engine/types.js";

export type UnitKind =
  | "PLAN"
  | "DEV"
  | "CODE_REVIEW"
  | "ADDRESS_REVIEW"
  | "RE_REVIEW"
  | "WRITE_TESTS"
  | "CI_RUN"
  | "CI_FIX"
  | "QA"
  | "DEPLOY"
  | "POSTDEPLOY_BUG"
  | "DEBUG"
  | "HOTFIX"
  | "TASK" // L1-onboarding: one of Bob's 4 small coding tasks
  | "STANDUP"; // L1-onboarding: the 90-min out-of-order absence unit

export type UnitStatus = "queued" | "ready" | "done" | "handcoded";
export type ReworkCause = "plan-quality" | "dev-quality" | "scripted";
export type Ticket = 1 | 2 | 3;

export type ReworkTag = "review" | "ci" | "bug";

export interface UnitInstance {
  id: string;
  kind: UnitKind;
  ticket: Ticket;
  deps: string[];
  status: UnitStatus;
  hours: number;
  outTok: number;
  workIn: number;
  cause?: ReworkCause | null; // rework attribution for the report (internal)
  // Pipeline shape flags (ported from the mock unit table).
  fan?: boolean; // DEV wave: expands into a fan-out of N_DEV requests
  free?: boolean; // CI_RUN: runs on the machines, emits no tokens
  rework?: ReworkTag; // increments the matching counter when run
  scripted?: boolean; // scripted incident (POSTDEPLOY_BUG)
  label?: string | null; // player-facing label for rework instances
  growthTok?: number; // override for warm-inline-main growth-tail write (L1)
  anyOrder?: boolean; // playable regardless of queue position (L1's standup)
}

export interface LedgerRow {
  tMin: number;
  unitId: string;
  unit: UnitKind; // kind, for the tape + report
  agent: "main" | `sub${number}`;
  model: Model;
  cold: boolean;
  readTok: number;
  inputTok: number;
  writeTok: number;
  writeTier: WriteTier;
  outTok: number;
  usd: number;
}

// Silently accrued counters, surfaced only in the post-run report.
export interface Counts {
  reviewRounds: number;
  ciFixes: number;
  bugs: number;
  handCoded: number;
  spawns: number;
  coldSpawns: number;
  sessions: number;
  idleGaps: number;
}

export type Scope = "session" | "week" | "month";

export interface IdleLogEntry {
  startMin: number;
  gapMin: number;
  pinged: boolean;
  rebuiltTok: number;
}

// Silently accrued hidden-cost buckets, revealed only in the post-run report.
export interface HiddenCosts {
  reworkUsd: number;
  idleRebuildUsd: number;
  flagDeltaUsd: number;
  hookUsd: number;
  eagerSkillsUsd: number;
  inlineRereadUsd: number;
}

export interface GameEnd {
  result: "win" | "loss";
  lossId?: string;
}

export interface GameState {
  seed: number;
  scope: Scope;
  clockMin: number;
  endMin: number;
  dayLen: number;
  wallet: number;
  budget: number;
  manualHours: number;
  tedium: number; // 0..100
  cfg: Config;
  cache: CacheState;
  units: UnitInstance[]; // the queue
  idx: number; // head of the queue
  bugsOpen: number;
  ledger: LedgerRow[];
  lastRequests: LedgerRow[]; // requests from the most recent RUN_UNIT (drives the tape)
  prng: { s0: number; s1: number }; // xorshift128+ state
  idleLog: IdleLogEntry[];
  hidden: HiddenCosts;
  counts: Counts;
  sessionStarts: number;
  ratioNum: number; // rebuild/base numerator (1h flag verdict)
  ratioDen: number;
  ended: GameEnd | null;
  // L1-onboarding only: the standup lives outside the sequential units[]
  // queue because it is playable at any point (L1_REDESIGN Section 7, gap
  // #3). Undefined for every other scenario - fully backward compatible.
  standup?: UnitInstance;
}

export type Action =
  | { type: "RUN_UNIT"; unitId: string }
  | { type: "HAND_CODE"; unitId: string }
  | { type: "IDLE_RESOLVE"; choice: "die" | "nothing" }
  | { type: "SET_CFG"; patch: Partial<Config> }
  | { type: "TICK_REPLAY" }
  // Advances the sim clock only (cache expiry is a pure function of clockMin
  // via isLive, so nothing else needs to change). Used to commit both
  // scripted coffee breaks (min: 20) and the choice-screen real-time dawdle
  // drain, batched into whole sim-minutes right before the next user action -
  // wall-clock time itself never touches the engine, so replay(seed, actions)
  // stays byte-identical (L1_REDESIGN Section 5/7).
  | { type: "ADVANCE"; min: number };

// Save/replay format (Section 5.5): seed + action list only.
export interface SaveFile {
  v: 1;
  seed: number;
  mode: Scope;
  actions: Action[];
}
