import { describe, expect, it } from "vitest";
import {
  REAL_SESSION_COSTS,
  REAL_SESSION_RATES,
  totalRealSessionCosts,
} from "./realSession.js";

describe("captured Claude Code session pricing", () => {
  it("prices the first round trip through the shared pricing engine", () => {
    const first = REAL_SESSION_COSTS[0];

    expect(first.costWarm).toBeCloseTo(0.06234375, 8);
    expect(first.costCold).toBeCloseTo(0.27064, 8);
    expect(first.savedPct).toBeCloseTo(76.964, 3);
    expect(REAL_SESSION_RATES).toEqual({
      cacheRead: 0.5,
      cacheWrite: 6.25,
      freshInput: 5,
      output: 25,
    });
  });

  it("reproduces the captured nine-step totals", () => {
    const total = totalRealSessionCosts();

    expect(REAL_SESSION_COSTS).toHaveLength(9);
    expect(total.costWarm).toBeCloseTo(0.35438975, 8);
    expect(total.costCold).toBeCloseTo(2.419735, 8);
    expect(total.savedPct).toBeCloseTo(85.3541917, 6);
  });
});
