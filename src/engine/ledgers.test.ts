import { describe, it, expect } from "vitest";
import { mainBaseTok, subBaseTok, mcpShare, SUB_SCALE } from "./ledgers.js";
import { DEFAULT_CFG, BASE_IDENTICAL } from "./constants.js";
import type { Config } from "./types.js";

describe("base-size functions (Section 5.2, invariant 6)", () => {
  it("mainBaseTok(defaultCfg) === 34738 + 400*10", () => {
    expect(mainBaseTok(DEFAULT_CFG)).toBe(34738 + 400 * 10);
  });

  it("subBaseTok(defaultCfg) === 26,237 (C10) via SUB_SCALE", () => {
    expect(subBaseTok(DEFAULT_CFG)).toBe(BASE_IDENTICAL);
    expect(SUB_SCALE).toBeCloseTo(26237 / 38738, 12);
  });

  it("mcpShare is 1 with all servers on, shrinks when trimmed", () => {
    expect(mcpShare([true, true, true, true])).toBe(1);
    const trimmed = mcpShare([false, true, true, true]);
    expect(trimmed).toBeLessThan(1);
    expect(trimmed).toBeGreaterThan(0);
  });

  it("trimming MCP and skills shrinks the base", () => {
    const lean: Config = {
      ...DEFAULT_CFG,
      mcp: [true, false, false, false],
      skills: 10,
      skillsMode: "invoke",
      memoryFiles: 0,
    };
    expect(mainBaseTok(lean)).toBeLessThan(mainBaseTok(DEFAULT_CFG));
  });
});
