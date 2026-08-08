// levels.ts - the 13-level campaign (SIMULATOR_SPEC.md Section 11: "Campaign /
// Levels"). A layer over the existing engine, not a fork: every level is the
// Section 5 sim seeded with a scenario, a subset of Config unlocked, and a
// pass target checked from GameState.ledger / GameState.hidden / GameState.counts
// - never from cosmetics. Budgets, thresholds and unlock order below are
// transcribed verbatim from Section 11.3's level table; anything not stated
// there is tagged [ESTIMATE].

import type { Config, Model } from "../engine/types.js";
import type { GameState, Scope } from "./types.js";

export type LevelId =
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
  | "L7" | "L8" | "L9" | "L10" | "L11"
  | "L12" | "L13";

export type ToolId =
  | "run" | "devModel" | "planModel" | "who" | "prompts" | "width"
  | "oneHourFlag" | "keepWarm" | "hook" | "skills" | "mcp" | "fleet" | "audit";

export interface LevelDef {
  id: LevelId;
  tier: 1 | 2 | 3;
  title: string;
  unlocks: ToolId; // Section 11.3 "Unlocks" column - one new tool per level
  teaches: string;
  scope: Scope;
  seed: number; // fixed per level so targets are fair (Section 11.1 PLAY)
  budgetUsd: number; // Section 11.3 "budget" figures, verbatim
  cfgOverride: Partial<Config>; // scenario config (what the LEARN/PLAY board starts from)
  // GATE: pure predicate over the final GameState (Section 11.1's "checked from
  // state.ledger and state.hidden at run end"). Returns pass + a human reason.
  pass(st: GameState): { pass: boolean; reason: string };
}

function spentUsd(st: GameState): number {
  return st.budget - st.wallet;
}

function subCacheWriteTotal(st: GameState): number {
  return st.ledger.filter((r) => r.agent !== "main").reduce((a, r) => a + r.writeTok, 0);
}

function coldBaseCount(st: GameState): number {
  return st.ledger.filter((r) => r.cold).length;
}

// ---- TIER 1 - PERSONAL ----
export const LEVELS: LevelDef[] = [
  {
    id: "L1",
    tier: 1,
    title: "Hello, Cache",
    unlocks: "run",
    teaches: "read 0.1x vs write 20x rebuild penalty (C1, C5)",
    scope: "session",
    seed: 1,
    budgetUsd: Infinity, // "none (cannot fail)" per spec
    cfgOverride: {},
    pass: (st) => {
      const reads = st.ledger.reduce((a, r) => a + r.readTok, 0);
      const total = st.ledger.reduce((a, r) => a + r.readTok + r.writeTok, 0) || 1;
      const ok = reads / total >= 0.8;
      return { pass: ok, reason: `read share ${(reads / total * 100).toFixed(0)}% (need >=80%)` };
    },
  },
  {
    id: "L2",
    tier: 1,
    title: "Pick Your Fighter",
    unlocks: "devModel",
    teaches: "output is 5x; fable $50/M is where budgets die (C4)",
    scope: "session",
    seed: 2,
    budgetUsd: 2.0,
    cfgOverride: {},
    pass: (st) => {
      const cost = spentUsd(st);
      const ok = cost <= 2.0 && st.counts.spawns > 0;
      return { pass: ok, reason: `spent $${cost.toFixed(2)} (budget $2.00), deliberate model pick required` };
    },
  },
  {
    id: "L3",
    tier: 1,
    title: "The Planner's Paradox",
    unlocks: "planModel",
    teaches: "cheap plan looks cheaper, costs more in rework (Section 3.4)",
    scope: "session",
    seed: 3,
    budgetUsd: 6.5,
    cfgOverride: {},
    pass: (st) => {
      const ok = spentUsd(st) <= 6.5 && st.counts.reviewRounds <= 1;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $6.50, reviewRounds=${st.counts.reviewRounds} (need <=1)` };
    },
  },
  {
    id: "L4",
    tier: 1,
    title: "Send in the Clones",
    unlocks: "who",
    teaches: "inline re-prices history every turn (C29) vs ~34k subagent cold base (C8/C10)",
    scope: "session",
    seed: 4,
    budgetUsd: 5.0,
    cfgOverride: {},
    pass: (st) => {
      const ok = spentUsd(st) <= 5.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $5.00` };
    },
  },
  {
    id: "L5",
    tier: 1,
    title: "One Word Costs 14.6k",
    unlocks: "prompts",
    teaches: "identical = 0 write after spawn 1; one-word-diff = 14,623 each (C10/C11)",
    scope: "session",
    seed: 5,
    budgetUsd: 6.0,
    cfgOverride: { who: "subagent" },
    pass: (st) => {
      const w = subCacheWriteTotal(st);
      const ok = spentUsd(st) <= 6.0 && w <= 35000;
      return { pass: ok, reason: `subagent cache-write ${w.toLocaleString()} tok (need <=35,000), spent $${spentUsd(st).toFixed(2)}` };
    },
  },
  {
    id: "L6",
    tier: 1,
    title: "The Five-Minute Window",
    unlocks: "width",
    teaches: "5m TTL + ~90s/spawn => only 3 serial waves stay warm (C27)",
    scope: "session",
    seed: 6,
    budgetUsd: 6.0,
    cfgOverride: { who: "subagent" },
    pass: (st) => {
      const colds = coldBaseCount(st);
      const ok = spentUsd(st) <= 6.0 && colds <= 2;
      return { pass: ok, reason: `${colds} cold bases in the ledger (need <=2), spent $${spentUsd(st).toFixed(2)}` };
    },
  },

  // ---- TIER 2 - TEAM LEAD ----
  {
    id: "L7",
    tier: 2,
    title: "The Coffee Break",
    unlocks: "keepWarm",
    teaches: "idle rebuild is the biggest real lever; break-even ~16-20h (C19)",
    scope: "week",
    seed: 7,
    budgetUsd: 8.0,
    cfgOverride: {},
    pass: (st) => {
      const pinged = st.idleLog.filter((g) => g.pinged).length;
      const overnightUnpinged = st.idleLog.some((g) => g.gapMin > 480 && !g.pinged);
      const ok = spentUsd(st) <= 8.0 && pinged >= 2 && overnightUnpinged;
      return {
        pass: ok,
        reason: `pinged ${pinged} gaps (need >=2), overnight left unpinged=${overnightUnpinged}, spent $${spentUsd(st).toFixed(2)}`,
      };
    },
  },
  {
    id: "L8",
    tier: 2,
    title: "The Long Cache",
    unlocks: "oneHourFlag",
    teaches: "the 0.65 break-even (C21) - the 1h flag is a bet, not a buff",
    scope: "week",
    seed: 8,
    budgetUsd: 14.0,
    cfgOverride: {},
    pass: (st) => {
      const ok = spentUsd(st) <= 14.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $14.00 (flag must be OFF in the light half, ON in the heavy half)` };
    },
  },
  {
    id: "L9",
    tier: 2,
    title: "The Poisoned Catalog",
    unlocks: "hook",
    teaches: "dynamic SessionStart hook line loses ~24,300 tok/session start (C23)",
    scope: "week",
    seed: 9,
    budgetUsd: 16.0,
    cfgOverride: { hook: "dynamic" },
    pass: (st) => {
      const starts = st.sessionStarts || 1;
      const avgHookWrite = st.hidden.hookUsd > 0 ? st.hidden.hookUsd / starts : 0;
      const ok = spentUsd(st) <= 16.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $16.00, avg hook $/start=${avgHookWrite.toFixed(3)}` };
    },
  },
  {
    id: "L10",
    tier: 2,
    title: "Loadout Discipline",
    unlocks: "skills",
    teaches: "eager catalog text rides cold into every base (C7/C32)",
    scope: "week",
    seed: 10,
    budgetUsd: 12.0,
    cfgOverride: { skills: 150, memoryFiles: 10, skillsMode: "eager" },
    pass: (st) => {
      const ok = spentUsd(st) <= 12.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $12.00` };
    },
  },
  {
    id: "L11",
    tier: 2,
    title: "Trim the Fat",
    unlocks: "mcp",
    teaches: "tools ~16k of every base, main AND spawn (C24)",
    scope: "week",
    seed: 11,
    budgetUsd: 11.0,
    cfgOverride: {},
    pass: (st) => {
      const ok = spentUsd(st) <= 11.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $11.00` };
    },
  },

  // ---- TIER 3 - BUDGET MANAGER ----
  {
    id: "L12",
    tier: 3,
    title: "The Budget Manager",
    unlocks: "fleet",
    teaches: "orchestration at scale: every prior lesson compounds",
    scope: "month",
    seed: 12,
    budgetUsd: 300.0,
    cfgOverride: {},
    pass: (st) => {
      const ok = spentUsd(st) <= 300.0 && st.manualHours < 10;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $300.00, manualHours=${st.manualHours.toFixed(1)} (need <10)` };
    },
  },
  {
    id: "L13",
    tier: 3,
    title: "The Audit",
    unlocks: "audit",
    teaches: "read a cache-diagnose report, rank the levers, execute the recovery",
    scope: "month",
    seed: 13,
    budgetUsd: 300.0,
    cfgOverride: {},
    pass: (st) => {
      // Recovered = baseline hidden-cost total minus what's still leaking.
      const stillLeaking = Object.values(st.hidden).reduce((a, v) => a + v, 0);
      const ok = spentUsd(st) <= 300.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $300.00, residual hidden cost $${stillLeaking.toFixed(2)}` };
    },
  },
];

export const LEVEL_BY_ID: Record<LevelId, LevelDef> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
) as Record<LevelId, LevelDef>;

export const LEVEL_ORDER: LevelId[] = LEVELS.map((l) => l.id);

// ======================= progression state (Section 11.2) =======================
export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestUsd: number;
  bestManualHours: number;
  attempts: number;
}
export interface CampaignState {
  unlocked: ToolId[];
  levels: Record<LevelId, LevelProgress>;
  currentTier: 1 | 2 | 3;
}

function emptyProgress(): LevelProgress {
  return { stars: 0, bestUsd: Infinity, bestManualHours: Infinity, attempts: 0 };
}

export function newCampaign(): CampaignState {
  const levels = {} as Record<LevelId, LevelProgress>;
  for (const id of LEVEL_ORDER) levels[id] = emptyProgress();
  return { unlocked: [LEVEL_BY_ID.L1.unlocks], levels, currentTier: 1 };
}

// stars(): pass=1, >=15% under budget=2, >=30% under AND zero hand-coded units=3
// (Section 11.2, derived from the level's own budgetUsd - not hand-tuned).
export function starsFor(level: LevelDef, st: GameState, handCoded: number): 0 | 1 | 2 | 3 {
  const g = level.pass(st);
  if (!g.pass) return 0;
  if (level.budgetUsd === Infinity) return 1;
  const spent = spentUsd(st);
  const margin = 1 - spent / level.budgetUsd;
  if (margin >= 0.3 && handCoded === 0) return 3;
  if (margin >= 0.15) return 2;
  return 1;
}

// isLevelUnlocked(): the level list is a strict chain (Section 11.1 "each level
// unlocks the next"); a level's index in LEVEL_ORDER must be <= unlocked count.
export function isLevelUnlocked(campaign: CampaignState, id: LevelId): boolean {
  const idx = LEVEL_ORDER.indexOf(id);
  return idx >= 0 && idx < campaign.unlocked.length;
}

// completeLevel(): records the attempt, updates best-run + stars, and if this
// was the frontier level, unlocks the next level's one new tool (Section 11.2:
// "unlocks are permanent"; Section 11.1: "each level unlocks the next").
export function completeLevel(
  campaign: CampaignState,
  id: LevelId,
  st: GameState,
  handCoded: number,
): CampaignState {
  const level = LEVEL_BY_ID[id];
  const gate = level.pass(st);
  const prev = campaign.levels[id];
  const spent = spentUsd(st);
  const stars = starsFor(level, st, handCoded);
  const next: LevelProgress = {
    stars: (Math.max(prev.stars, gate.pass ? stars : 0) as 0 | 1 | 2 | 3),
    bestUsd: gate.pass ? Math.min(prev.bestUsd, spent) : prev.bestUsd,
    bestManualHours: gate.pass ? Math.min(prev.bestManualHours, handCoded) : prev.bestManualHours,
    attempts: prev.attempts + 1,
  };
  const levels = { ...campaign.levels, [id]: next };

  let unlocked = campaign.unlocked;
  const idx = LEVEL_ORDER.indexOf(id);
  const isFrontier = idx === campaign.unlocked.length - 1;
  if (gate.pass && isFrontier && idx + 1 < LEVEL_ORDER.length) {
    unlocked = [...campaign.unlocked, LEVEL_BY_ID[LEVEL_ORDER[idx + 1]].unlocks];
  }
  const lastUnlockedIdx = unlocked.length - 1;
  const currentTier = LEVELS[Math.max(0, lastUnlockedIdx)].tier;

  return { unlocked, levels, currentTier };
}

export function gateReason(id: LevelId, st: GameState): string {
  return LEVEL_BY_ID[id].pass(st).reason;
}
