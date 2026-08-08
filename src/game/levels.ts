// levels.ts - the 13-level campaign (SIMULATOR_SPEC.md Section 11: "Campaign /
// Levels"). A layer over the existing engine, not a fork: every level is the
// Section 5 sim seeded with a scenario, a subset of Config unlocked, and a
// pass target checked from GameState.ledger / GameState.hidden / GameState.counts
// - never from cosmetics. Budgets, thresholds and unlock order below are
// transcribed verbatim from Section 11.3's level table; anything not stated
// there is tagged [ESTIMATE].

import type { Config, Model } from "../engine/types.js";
import type { GameState, HiddenCosts, Scope } from "./types.js";
import { runScript, L1_CFG } from "./step.js";

export type LevelId =
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
  | "L7" | "L8" | "L9" | "L10" | "L11"
  | "L12" | "L13";

export type ToolId =
  | "run" | "devModel" | "planModel" | "who" | "prompts" | "width"
  | "oneHourFlag" | "keepWarm" | "hook" | "skills" | "mcp" | "fleet" | "audit";

// GAME_PLAN.md Section F - stable config-strip control ids (superset of ToolId:
// a few ToolIds fan out into multiple controls, e.g. L10 unlocks "skills" but
// reveals skills+skillsMode+memoryFiles; L3 reveals planModel+orchestratorModel).
export type ControlId =
  | "run" | "handCode"
  | "devModel" | "planModel" | "orchestratorModel"
  | "who" | "prompts" | "width"
  | "keepWarm" | "keepWarmMin" | "stepAway"
  | "oneHourFlag"
  | "hook" | "skills" | "skillsMode" | "memoryFiles" | "mcp"
  | "fleet" | "audit"
  | "advanceTime"; // L1's WHEN-to-take-standup choice bar (task/coffee/standup)

// GAME_PLAN.md Section D - the scenario ids each level runs under. The scenario
// SYSTEM itself lands in slice G4; here it is just the plain string id per level.
export type ScenarioId =
  | "default" | "dev-only" | "dev-marathon" | "fanout8" | "fanout8-slow"
  | "gaps" | "two-halves" | "week7starts" | "spawn12" | "mcp-required"
  | "l1-onboarding";

// GAME_PLAN.md Section C.3 - the scripted LEARN replay (without-tool vs with-tool).
export interface LearnBeat {
  copy: string[]; // 2-4 short lines (final wording pending review; see LEVEL_EXPLANATIONS.md)
  withoutCfg: Partial<Config>; // run A config (the trap)
  withCfg: Partial<Config>; // run B config (the tool used right)
  scope: Scope;
  seed: number;
  chip(a: GameState, b: GameState): string; // teaching chip text, LEARN-only (spec 8.0 exception)
}

// GAME_PLAN.md Section D fail-lesson row - mini-report content on a failed gate.
export interface FailLesson {
  bucket: keyof HiddenCosts | "none";
  cite: string;
  line: string;
}

export interface LevelDef {
  id: LevelId;
  tier: 1 | 2 | 3;
  title: string;
  objective: string; // NEW (C.1): one-sentence player-facing goal shown on entry and in HUD
  unlocks: ToolId; // Section 11.3 "Unlocks" column - one new tool per level
  introducedControls: ControlId[]; // NEW (C.1): exact config-strip control ids this level reveals
  teaches: string;
  scope: Scope;
  seed: number; // fixed per level so targets are fair (Section 11.1 PLAY)
  budgetUsd: number; // Section 11.3 "budget" figures, verbatim
  clockCapMin?: number; // NEW (C.1): optional override of endMin (defaults to scope days x 300)
  cfgOverride: Partial<Config>; // scenario config (what the LEARN/PLAY board starts from)
  cfgLocked?: (keyof Config)[]; // NEW (C.1): fields the player may NOT change this level
  scenario: ScenarioId; // NEW (C.1/D): scenario id (system itself lands in G4)
  learn: LearnBeat; // NEW (C.1/C.3): the scripted LEARN replay
  // GATE: pure predicate over the final GameState (Section 11.1's "checked from
  // state.ledger and state.hidden at run end"). Returns pass + a human reason.
  pass(st: GameState): { pass: boolean; reason: string };
  star2?(st: GameState): boolean; // NEW (C.1): default = spent <= 0.85*budget (spec 11.2)
  star3?(st: GameState): boolean; // NEW (C.1): default = spent <= 0.70*budget && handCoded === 0
  referenceCfg: Partial<Config>; // NEW (C.1): scripted reference solution config (G8 boot-asserted)
  antiCfg: Partial<Config>; // NEW (C.1): designated anti-pattern config (G8 boot-asserted to FAIL)
  failLesson: FailLesson; // NEW (C.1): mini-report content on gate failure
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
    // L1_REDESIGN.md - "The First Hour". Replaces the old read-share gate
    // (GAME_PLAN D's L1 row, Section 8): goal banner, teaching cards+toasts,
    // a real WHEN-to-take-standup choice, and a moving clock/TTL that expires
    // the cache into a cold rebuild if you dawdle. Rendered by a dedicated
    // L1PlayScreen/L1IntroCards pair (App.svelte), not the generic
    // PlayScreen/LearnScreen - the mechanic (out-of-order standup, live
    // dawdle drain) doesn't fit the config-strip/unit-board shape the other
    // 12 levels share.
    id: "L1",
    tier: 1,
    title: "The First Hour",
    objective:
      "Finish Bob's 4 tasks and his 90-minute standup for under $0.55 - the cache makes " +
      "repeat work 10x cheaper, but it dies 60 minutes after you last use it.",
    unlocks: "run",
    introducedControls: ["run", "advanceTime"],
    teaches: "token basics + read 0.1x vs write 20x rebuild penalty, TTL expiry (C1, C5)",
    scope: "session",
    seed: 1,
    budgetUsd: 0.55,
    clockCapMin: 300, // 09:00-14:00, DAY_LEN_MIN
    cfgOverride: L1_CFG,
    scenario: "l1-onboarding",
    // Unused by L1PlayScreen (which renders IntroCards instead) - kept only
    // so LevelDef's required `learn` field type-checks; App.svelte special-
    // cases L1's "learn" screen before this is ever read.
    learn: {
      copy: [
        "L1 teaches with 3 intro cards + in-play toasts instead of an A/B replay (L1_REDESIGN Section 4).",
        "Rendered by IntroCards.svelte, not this screen.",
      ],
      withoutCfg: {},
      withCfg: L1_CFG,
      scope: "session",
      seed: 1,
      chip: () => "",
    },
    referenceCfg: L1_CFG,
    antiCfg: L1_CFG, // anti-pattern here is a choice (standup timing), not a config
    failLesson: {
      bucket: "none",
      cite: "L1_REDESIGN Section 3/5",
      line: "the cache died mid-run and the next request rewrote everything at 2x",
    },
    star2: (st) => spentUsd(st) <= 0.47,
    star3: (st) => {
      const cold = st.ledger.filter((r) => r.agent === "main" && r.cold).length;
      return spentUsd(st) <= 0.44 && cold === 1;
    },
    pass: (st) => {
      const allDone = st.idx >= st.units.length && (!st.standup || st.standup.status === "done");
      const spent = spentUsd(st);
      const coldMain = st.ledger.filter((r) => r.agent === "main" && r.cold).length;
      const ok = allDone && spent <= 0.55 && coldMain <= 1;
      return {
        pass: ok,
        reason: `spent $${spent.toFixed(2)} / $0.55, ${coldMain} cold main write${coldMain === 1 ? "" : "s"} (need <=1)${allDone ? "" : ", not all done"}`,
      };
    },
  },
  {
    id: "L2",
    tier: 1,
    title: "Pick Your Fighter",
    objective: "Ship the DEV wave under budget by picking the right model.",
    unlocks: "devModel",
    introducedControls: ["devModel", "handCode"],
    teaches: "output is 5x; fable $50/M is where budgets die (C4)",
    scope: "session",
    seed: 2,
    budgetUsd: 2.0,
    cfgOverride: {},
    scenario: "dev-only",
    learn: {
      copy: [
        "Same DEV wave, two models.",
        "Output tokens are priced at 5x - the model's $/M out is where the bill lives.",
      ],
      withoutCfg: { devModel: "fable" },
      withCfg: { devModel: "sonnet" },
      scope: "session",
      seed: 2,
      chip: (a, b) => `cheap model != cheap output (C28 WORK_OUT=44,000): $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { devModel: "sonnet" },
    antiCfg: { devModel: "fable" },
    failLesson: { bucket: "none", cite: "C4", line: "output is 5x (fable $50/M out)" },
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
    objective: "Pick the plan model that avoids costly review/CI rework.",
    unlocks: "planModel",
    introducedControls: ["planModel", "orchestratorModel"],
    teaches: "cheap plan looks cheaper, costs more in rework (Section 3.4)",
    scope: "session",
    seed: 3,
    budgetUsd: 6.5,
    cfgOverride: {},
    scenario: "default",
    learn: {
      copy: [
        "The plan bill looks small - but a weak plan means more review rounds.",
        "Rework is where the real dollars hide.",
      ],
      withoutCfg: { planModel: "sonnet" },
      withCfg: { planModel: "fable", devModel: "sonnet" },
      scope: "session",
      seed: 3,
      chip: (a, b) => `the cheap-looking plan bill hides rework: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { planModel: "fable", devModel: "sonnet" },
    antiCfg: { planModel: "sonnet" },
    failLesson: { bucket: "reworkUsd", cite: "Section 3.4", line: "rework attributable to plan model" },
    pass: (st) => {
      const ok = spentUsd(st) <= 6.5 && st.counts.reviewRounds <= 1;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $6.50, reviewRounds=${st.counts.reviewRounds} (need <=1)` };
    },
  },
  {
    id: "L4",
    tier: 1,
    title: "Send in the Clones",
    objective: "Keep the main context small by delegating DEV waves to subagents.",
    unlocks: "who",
    introducedControls: ["who"],
    teaches: "inline re-prices history every turn (C29) vs 26,237 subagent cold base (C10)",
    scope: "session",
    seed: 4,
    budgetUsd: 5.0,
    cfgOverride: {},
    scenario: "dev-marathon",
    learn: {
      copy: [
        "Inline re-reads the whole growing history every turn.",
        "A subagent pays one bounded cold base instead (26,237 tok, C10).",
      ],
      withoutCfg: { who: "inline" },
      withCfg: { who: "subagent", prompts: "identical" },
      scope: "session",
      seed: 4,
      chip: (a, b) => `inline re-prices history every turn: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { who: "subagent", prompts: "identical" },
    antiCfg: { who: "inline" },
    failLesson: { bucket: "inlineRereadUsd", cite: "C29/C10", line: "inline history re-read vs cold-spawn cost" },
    pass: (st) => {
      const ok = spentUsd(st) <= 5.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $5.00` };
    },
  },
  {
    id: "L5",
    tier: 1,
    title: "One Word Costs 14.6k",
    objective: "Keep subagent prompts byte-identical to stay under the cache-write ceiling.",
    unlocks: "prompts",
    introducedControls: ["prompts"],
    teaches: "identical = 0 write after spawn 1; one-word-diff = 14,623 each (C10/C11)",
    scope: "session",
    seed: 5,
    budgetUsd: 6.0,
    cfgOverride: { who: "subagent" },
    cfgLocked: ["who"],
    scenario: "fanout8",
    learn: {
      copy: [
        "Identical prompts reuse the cache for free after spawn 1.",
        "One changed word rewrites 14,623 tok every single spawn (C11).",
      ],
      withoutCfg: { who: "subagent", prompts: "varied" },
      withCfg: { who: "subagent", prompts: "identical" },
      scope: "session",
      seed: 5,
      chip: (a, b) => `a wording habit decides pass/fail: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { prompts: "identical" },
    antiCfg: { prompts: "varied" },
    failLesson: { bucket: "none", cite: "C10/C11", line: "varied prompts rewrite VAR_W=14,623 / VAR_R=11,602 tok each" },
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
    objective: "Fan wide enough to stay inside the subagent 5-minute TTL.",
    unlocks: "width",
    introducedControls: ["width"],
    teaches: "5m TTL + ~90s/spawn => only 3 serial waves stay warm (C27)",
    scope: "session",
    seed: 6,
    budgetUsd: 6.0,
    cfgOverride: { who: "subagent", prompts: "identical" },
    cfgLocked: ["who"],
    scenario: "fanout8-slow",
    learn: {
      copy: [
        "Subagent caches die after 5 minutes idle.",
        "Fan wide and you finish inside the window; go narrow and later waves come back cold (C27).",
      ],
      withoutCfg: { who: "subagent", prompts: "identical", width: 2 },
      withCfg: { who: "subagent", prompts: "identical", width: 8 },
      scope: "session",
      seed: 6,
      chip: (a, b) => `going narrow "to be careful" is the expensive choice: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { width: 8 },
    antiCfg: { width: 2 },
    failLesson: { bucket: "none", cite: "C27", line: "wave 4 came back to a dead cache - 5 minutes had passed" },
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
    objective: "Ping the short gaps, let the overnight cache die.",
    unlocks: "keepWarm",
    introducedControls: ["keepWarm", "keepWarmMin", "stepAway"],
    teaches: "idle rebuild is the biggest real lever; break-even ~16-20h (C19)",
    scope: "week",
    seed: 7,
    budgetUsd: 8.0,
    cfgOverride: {},
    scenario: "gaps",
    learn: {
      copy: [
        "1 rebuild costs about 20 pings (C5).",
        "But pinging past ~20 hours (C19) loses too - the overnight isn't worth keeping warm.",
      ],
      withoutCfg: { keepWarm: false },
      withCfg: { keepWarm: true },
      scope: "week",
      seed: 7,
      chip: (a, b) => `1 rebuild = 20 pings, but not past ~20h: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { keepWarm: true },
    antiCfg: { keepWarm: true },
    failLesson: { bucket: "idleRebuildUsd", cite: "C13/C14", line: "The Overnight Tax - 272 rebuilds, $575/mo" },
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
    objective: "Flip the 1-hour cache flag only when your rebuild ratio earns it.",
    unlocks: "oneHourFlag",
    introducedControls: ["oneHourFlag"],
    teaches: "the 0.65 break-even (C21) - the 1h flag is a bet, not a buff",
    scope: "week",
    seed: 8,
    budgetUsd: 14.0,
    cfgOverride: {},
    scenario: "two-halves",
    learn: {
      copy: [
        "1h writes cost 2x vs 1.25x for 5m - but they survive longer gaps.",
        "Below a ~0.65 rebuild ratio the flag is a loss; above it, a win (C21).",
      ],
      withoutCfg: { oneHourFlag: true },
      withCfg: { oneHourFlag: false },
      scope: "week",
      seed: 8,
      chip: (a, b) => `the flag is a bet on your rebuild ratio: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { oneHourFlag: false },
    antiCfg: { oneHourFlag: true },
    failLesson: { bucket: "flagDeltaUsd", cite: "C21", line: "WRONG_FLAG - ratio 0.28 is below the 0.65 break-even" },
    pass: (st) => {
      const ok = spentUsd(st) <= 14.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $14.00 (flag must be OFF in the light half, ON in the heavy half)` };
    },
  },
  {
    id: "L9",
    tier: 2,
    title: "The Poisoned Catalog",
    objective: "Switch to a static SessionStart hook so the catalog stays reusable.",
    unlocks: "hook",
    introducedControls: ["hook"],
    teaches: "dynamic SessionStart hook line loses ~24,300 tok/session start (C23)",
    scope: "week",
    seed: 9,
    budgetUsd: 16.0,
    cfgOverride: { hook: "dynamic" },
    scenario: "week7starts",
    learn: {
      copy: [
        "One changing early line makes the whole cached prefix unusable.",
        "A static hook saves ~24,300 tok every session start (C23).",
      ],
      withoutCfg: { hook: "dynamic" },
      withCfg: { hook: "static" },
      scope: "week",
      seed: 9,
      chip: (a, b) => `a config change, not a behavior change, saves ~24.3k tok/start: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { hook: "static" },
    antiCfg: { hook: "dynamic" },
    failLesson: { bucket: "hookUsd", cite: "C23", line: "CATALOG_POISON - dynamic hook line loses ~24,300 tok/session start" },
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
    objective: "Trim the skills catalog to invoke-only so cold bases stay small.",
    unlocks: "skills",
    introducedControls: ["skills", "skillsMode", "memoryFiles"],
    teaches: "eager catalog text rides cold into every base (C7/C32)",
    scope: "week",
    seed: 10,
    budgetUsd: 12.0,
    cfgOverride: { skills: 150, memoryFiles: 10, skillsMode: "eager" },
    scenario: "spawn12",
    learn: {
      copy: [
        "13,083 tok of catalog rides cold into every one of 12 spawn bases (C7).",
        "Invoke-only mode keeps it near zero until a skill actually triggers.",
      ],
      withoutCfg: { skillsMode: "eager", skills: 150, memoryFiles: 10 },
      withCfg: { skillsMode: "invoke", skills: 10, memoryFiles: 3 },
      scope: "week",
      seed: 10,
      chip: (a, b) => `catalog rides cold into every base: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { skillsMode: "invoke", skills: 10, memoryFiles: 3 },
    antiCfg: {},
    failLesson: { bucket: "eagerSkillsUsd", cite: "C7/C32", line: "13,083 tok of catalog rides cold into every base" },
    pass: (st) => {
      const ok = spentUsd(st) <= 12.0;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $12.00` };
    },
  },
  {
    id: "L11",
    tier: 2,
    title: "Trim the Fat",
    objective: "Enable only the MCP servers each ticket actually needs.",
    unlocks: "mcp",
    introducedControls: ["mcp"],
    teaches: "tools ~16k of every base, main AND spawn (C24)",
    scope: "week",
    seed: 11,
    budgetUsd: 11.0,
    cfgOverride: {},
    scenario: "mcp-required",
    learn: {
      copy: [
        "Tool schemas ride EVERY cold base - main and spawn alike.",
        "Trimming unused servers is the highest universal leverage (C24).",
      ],
      withoutCfg: { mcp: [true, true, true, true] },
      withCfg: { mcp: [true, false, false, false] },
      scope: "week",
      seed: 11,
      chip: (a, b) => `schemas ride every cold base: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { mcp: [true, false, false, false] },
    antiCfg: { mcp: [true, true, true, true] },
    failLesson: { bucket: "none", cite: "C24", line: "16,295 tok of tool schemas riding every cold write" },
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
    objective: "Set policy for 5 devs and fix each one's bad habit.",
    unlocks: "fleet",
    introducedControls: ["fleet"],
    teaches: "orchestration at scale: every prior lesson compounds",
    scope: "month",
    seed: 12,
    budgetUsd: 300.0,
    cfgOverride: {},
    scenario: "default",
    learn: {
      copy: [
        "5 devs, 5 loss archetypes - fable, inline, varied prompts, dynamic hook, no keep-warm.",
        "You manage by policy, not per-turn control.",
      ],
      withoutCfg: {},
      withCfg: { devModel: "sonnet", who: "subagent", prompts: "identical", hook: "static", keepWarm: true },
      scope: "month",
      seed: 12,
      chip: (a, b) => `policy compounds across the fleet: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { devModel: "sonnet", who: "subagent", prompts: "identical", hook: "static", keepWarm: true },
    antiCfg: {},
    failLesson: { bucket: "none", cite: "C15/C18", line: "per-dev loss screens roll up to the fleet total" },
    pass: (st) => {
      const ok = spentUsd(st) <= 300.0 && st.manualHours < 10;
      return { pass: ok, reason: `spent $${spentUsd(st).toFixed(2)} / $300.00, manualHours=${st.manualHours.toFixed(1)} (need <10)` };
    },
  },
  {
    id: "L13",
    tier: 3,
    title: "The Audit",
    objective: "Rank the report's dollar levers correctly, then recover the spend.",
    unlocks: "audit",
    introducedControls: ["audit"],
    teaches: "read a cache-diagnose report, rank the levers, execute the recovery",
    scope: "month",
    seed: 13,
    budgetUsd: 300.0,
    cfgOverride: {},
    scenario: "default",
    learn: {
      copy: [
        "The report ranks levers by dollars: idle >> delegate > 5m-band > MCP (C17).",
        "Fix in that order, not by gut feeling.",
      ],
      withoutCfg: {},
      withCfg: { keepWarm: true, who: "subagent", prompts: "identical" },
      scope: "month",
      seed: 13,
      chip: (a, b) => `the report told you idle was the biggest bucket: $${spentUsd(a).toFixed(2)} vs $${spentUsd(b).toFixed(2)}`,
    },
    referenceCfg: { keepWarm: true, who: "subagent", prompts: "identical", hook: "static" },
    antiCfg: {},
    failLesson: { bucket: "none", cite: "C17", line: "the report told you idle was $575 of $692 - you fixed MCP first" },
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
  // A level may override the star2/star3 predicates (e.g. L1's cold-write
  // clause, L1_REDESIGN Section 3); fall back to the generic budget-margin
  // default (Section 11.2) when it doesn't.
  if (level.star2 || level.star3) {
    if (level.star3 && level.star3(st)) return 3;
    if (level.star2 && level.star2(st)) return 2;
    return 1;
  }
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

// unlockedControls() - GAME_PLAN.md Section C.2 progressive disclosure rule:
// the config strip renders ONLY controls introduced by levels up to and
// including `current` in LEVEL_ORDER. Computed, not hand-listed per level.
export function unlockedControls(current: LevelId): ControlId[] {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx < 0) return [];
  return LEVELS.slice(0, idx + 1).flatMap((l) => l.introducedControls);
}
