// ledgers.js - base-size (prefix) functions, the single source of truth for
// how big every cold write is. SIMULATOR_SPEC.md Section 5.2.

import {
  TOOLS_BASE,
  SYSTEM_BASE,
  CATALOG_FULL,
  CATALOG_RESIDUE,
  MEMORY_PER_FILE,
  MCP_SIZES,
  BASE_IDENTICAL,
  DEFAULT_CFG,
} from "./constants.js";

// Enabled-share of the MCP tool schema (C24). Trimming servers shrinks every
// cold write everywhere - the "highest universal leverage".
export function mcpShare(mcp) {
  const total = MCP_SIZES.reduce((a, b) => a + b, 0);
  let enabled = 0;
  for (let i = 0; i < MCP_SIZES.length; i++) if (mcp[i]) enabled += MCP_SIZES[i];
  return enabled / total;
}

// Main-session base prefix size in tokens (C6/C7/C24/C32).
//   tools(16,295 * mcpShare) + system(2,750) + catalog + memory + msg-residue(2,610)
// EAGER skills load skills/150 of the 13,083-tok catalog; INVOKE-ONLY loads only
// the floor 10/150 share into the base.
export function mainBaseTok(cfg) {
  const tools = TOOLS_BASE * mcpShare(cfg.mcp);
  const system = SYSTEM_BASE;
  const catalog = CATALOG_FULL * (cfg.skillsMode === "eager" ? cfg.skills / 150 : 10 / 150);
  const memory = MEMORY_PER_FILE * cfg.memoryFiles;
  const rest = CATALOG_RESIDUE; // 2,610
  return Math.round(tools + system + catalog + memory + rest);
}

// subScale calibrates the subagent base so that at the default loadout it equals
// the measured 26,237 (C10). Asserted at boot / in tests (invariant 6).
export const SUB_SCALE = BASE_IDENTICAL / mainBaseTok(DEFAULT_CFG);

// Subagent base prefix size in tokens: the main formula, scaled to land on the
// measured 26,237 at defaults and to scale linearly with the loadout.
export function subBaseTok(cfg) {
  return Math.round(mainBaseTok(cfg) * SUB_SCALE);
}

// Loadout scale factor applied to the measured ledger constants (26,237 / 14,623
// / 11,602) when the config differs from the default loadout (Section 5.2).
export function ledgerScale(cfg) {
  return subBaseTok(cfg) / BASE_IDENTICAL;
}
