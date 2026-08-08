// constants.js - calibration constants from SIMULATOR_SPEC.md Section 2.
// Every value traces to a real measured number (diag / TC-D / content) or is
// explicitly labeled [FICTION]. Citations are the C-numbers in the spec table.

// ---- Work per dev task (C28) [FICTION, calibrated so the scripted runs land] ----
export const WORK_IN = 6000; // fresh file/context tokens read per task (1x)
export const WORK_OUT = 44000; // code generated per task (5x) - where fable bleeds

// ---- Inline session growth (C29) [FICTION, anchored to C6 base] ----
export const INLINE_B0 = 34000; // context carried into task 1
export const INLINE_GROWTH = 22000; // context added per task

// ---- Fan-out / TTL (C27) ----
// ~90s per spawn, 5m warm window => ~3 serial waves stay warm.
export const WARM_WAVES = 3;

// ---- Fan-out reference budget (fanout prototype BUDGET; drives diedAt) ----
export const FANOUT_BUDGET = 15;

// ---- Month economy (Section 3.1) ----
export const BUDGET_MONTHLY = 90; // API-equivalent list price [FICTION, anchored]
export const MANUAL_MULT = 6; // manualHours = unitHours * MANUAL_MULT [FICTION]
export const TEDIUM_PER_UNIT_HOUR = 8; // tedium += 8 * unitHours per hand-coded unit

// ---- Base-size decomposition (C6, C7, C24, C32) ----
export const TOOLS_BASE = 16295; // tool definitions in every session/subagent (C24)
export const SYSTEM_BASE = 2750; // system prompt (C6)
export const CATALOG_FULL = 13083; // injected skills catalog block, 150 entries (C7)
export const MESSAGES_BASE = 15693; // messages block (C6); catalog is 13,083 of it
export const CATALOG_RESIDUE = MESSAGES_BASE - CATALOG_FULL; // 2,610 stable msg residue
export const MEMORY_PER_FILE = 400; // per memory file [FICTION, plausible]
export const MAIN_PREFIX_HEY = 34738; // main "hey" prefix total (C6)
export const CATALOG_PER_ENTRY = CATALOG_FULL / 150; // ~87 tok/entry (C32, derived)
export const SKILL_BODY_TOK = Math.round(CATALOG_PER_ENTRY * 20); // ~1,700 tok on trigger

// ---- Canonical cache ledgers (measured, exact usage-derived numbers) ----
// Identical-prompt subagent (C10): spawn 1 writes 26,237 / reads 0;
// later spawn in the warm window reads 26,237 / writes 0.
export const BASE_IDENTICAL = 26237;
// One-word-diff (HEY/HELLO) varied spawn (C11): rewrites 14,623, reads 11,602
// each time (total ~26,225).
export const VAR_W = 14623;
export const VAR_R = 11602;

// ---- Break-even and keep-warm (C19, C21) ----
// 1h-flag break-even ratio vs the 5m counterfactual (C21, CORRECTED):
//   (RATE.w1h - RATE.w5m) / (RATE.w5m - RATE.read) = (2 - 1.25) / (1.25 - 0.1) = 0.652.
// The old 0.40 used the wrong (no-cache) counterfactual. USE 0.65 everywhere.
export const ONEHOUR_BREAKEVEN = (2 - 1.25) / (1.25 - 0.1); // ~0.6522
// Keep-warm break-even idle hours (C19): (write-mult * TTL-min) / 6.
//   1h tier: (2 * 60) / 6 = 20 h.   5m tier: (1.25 * 5) / 6 ~= 1 h.
export const KEEPWARM_BREAKEVEN_1H_H = (2 * 60) / 6; // 20 h
export const KEEPWARM_BREAKEVEN_5M_H = (1.25 * 5) / 6; // ~1.04 h

// ---- Min cacheable prefix / max breakpoints (C26) ----
export const MIN_CACHEABLE_PREFIX = 1024;
export const MAX_BREAKPOINTS = 4;

// ---- MCP schema sizes (C24 / Section 4.10) ----
// Four fictional servers whose sizes sum to ~16,295 (the tool base).
export const MCP_SIZES = [6295, 4000, 3000, 3000];

// ---- Default config (Section 8 table; deliberately-bad defaults) ----
export const DEFAULT_CFG = {
  orchestratorModel: "sonnet",
  planModel: "opus",
  devModel: "sonnet",
  who: "subagent",
  prompts: "identical",
  width: 8,
  oneHourFlag: false,
  keepWarm: false,
  keepWarmMin: 50,
  hook: "dynamic",
  skills: 150,
  skillsMode: "eager",
  memoryFiles: 10,
  mcp: [true, true, true, true],
};

// ---- Planning-quality / dev-quality multipliers (Section 3.4) [FICTION] ----
export const DEV_Q = { sonnet: 1.5, opus: 1.0, fable: 0.7 };
export const PLAN_Q = { sonnet: 1.6, opus: 1.0, fable: 0.75 };
