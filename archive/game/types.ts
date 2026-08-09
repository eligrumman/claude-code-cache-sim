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

// L3 keeps the authored prefix visible in reducer state so the placement
// choice changes the actual matched/read and invalidated/write token buckets.
export interface PrefixBlockState {
  id: string;
  kind: "system" | "tools" | "instructions" | "history" | "current";
  label: string;
  tokenCount: number;
  identityHash: string;
  cacheable: boolean;
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
  // Redesigned L1's only additional state: the selected tradeoff and the
  // post-reveal causal explanation. Undefined for every other level.
  scenario?: string;
  l1Route?: "same-chat" | "isolated";
  l1PredictionCommitted?: boolean;
  l1ExplanationAcknowledged?: boolean;
  // Redesigned L2's schedule profile, prediction gate, and post-reveal
  // understanding check. Undefined outside the dedicated L2 scenario.
  l2Profile?: "coffee" | "standup";
  l2PredictionCommitted?: boolean;
  l2FollowupRevealed?: boolean;
  l2ExplanationAcknowledged?: boolean;
  // Redesigned L3's prefix stacks and evidence-bearing flow. Undefined for
  // every other level so the established campaign state remains compatible.
  l3MainPrefix?: PrefixBlockState[];
  l3HandoffPrefix?: PrefixBlockState[];
  l3Placement?: "boot" | "followup";
  l3PredictionCommitted?: "cold" | "repeat" | "change" | "handoff";
  l3FirstMismatchBlockId?: string | null;
  l3MatchedPrefixTok?: number;
  l3InvalidatedSuffixTok?: number;
  l3ExplanationAnswered?: boolean;
  l3ExplanationAcknowledged?: boolean;
  completedEventIds?: string[];
  completedTransferIds?: string[];
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
  | { type: "ADVANCE"; min: number }
  | { type: "CHOOSE_L1_ROUTE"; route: "same-chat" | "isolated" }
  | { type: "COMMIT_L1_PREDICTION" }
  | { type: "ACK_L1_EXPLANATION"; correct: boolean }
  | { type: "SEND_L2_CHECK" }
  | { type: "CHOOSE_L2_PROFILE"; profile: "coffee" | "standup" }
  | { type: "COMMIT_L2_PREDICTION" }
  | { type: "REVEAL_L2_FOLLOWUP" }
  | { type: "ACK_L2_EXPLANATION"; correct: boolean }
  | { type: "COMMIT_L3_PREDICTION"; stage: "cold" | "repeat" | "change" | "handoff" }
  | { type: "SEND_L3_REQUEST" }
  | {
      type: "SET_PREFIX_BLOCK_CONTENT";
      contextId: "l3-main" | "l3-handoff";
      blockId: string;
      identityHash: string;
      tokenCount: number;
    }
  | { type: "ACK_L3_EXPLANATION"; correct: boolean };

// Save/replay format (Section 5.5): seed + action list only.
export interface SaveFile {
  v: 1;
  seed: number;
  mode: Scope;
  actions: Action[];
}
