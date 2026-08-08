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
  | "HOTFIX";

export type UnitStatus = "queued" | "ready" | "done" | "handcoded";
export type ReworkCause = "plan-quality" | "dev-quality" | "scripted";
export type Ticket = 1 | 2 | 3;

export interface UnitInstance {
  id: string;
  kind: UnitKind;
  ticket: Ticket;
  deps: string[];
  status: UnitStatus;
  hours: number;
  outTok: number;
  workIn: number;
  cause?: ReworkCause; // rework attribution for the report (internal)
}

export interface LedgerRow {
  tMin: number;
  unitId: string;
  agent: "main" | `sub${number}`;
  model: Model;
  readTok: number;
  inputTok: number;
  writeTok: number;
  writeTier: WriteTier;
  outTok: number;
  usd: number;
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
  wallet: number;
  budget: number;
  manualHours: number;
  tedium: number; // 0..100
  cfg: Config;
  cache: CacheState;
  units: UnitInstance[];
  bugsOpen: number;
  ledger: LedgerRow[];
  prng: { s0: number; s1: number }; // xorshift128+ state
  idleLog: IdleLogEntry[];
  hidden: HiddenCosts;
  ended: GameEnd | null;
}

export type Action =
  | { type: "RUN_UNIT"; unitId: string }
  | { type: "HAND_CODE"; unitId: string }
  | { type: "IDLE_RESOLVE"; choice: "die" | "nothing" }
  | { type: "SET_CFG"; patch: Partial<Config> }
  | { type: "TICK_REPLAY" };

// Save/replay format (Section 5.5): seed + action list only.
export interface SaveFile {
  v: 1;
  seed: number;
  mode: Scope;
  actions: Action[];
}
