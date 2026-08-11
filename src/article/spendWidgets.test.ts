import { describe, expect, it } from "vitest";
import { MACRO_ROUTES, priceTaskChoice } from "./macroPricing.js";
import { lifecycleComparison, outputComparison, spendBreakdown } from "./spendModel.js";

describe("article spend teaching models", () => {
  it("reconciles all four billed classes to the displayed total", () => {
    for (const unit of ["message", "task"] as const) {
      const result = spendBreakdown(unit, unit === "message" ? 16 : 12);
      const summed = result.usd.input + result.usd.cacheRead + result.usd.cacheWrite + result.usd.output;
      expect(summed).toBeCloseTo(result.totalUsd, 10);
    }
  });

  it("grows cache-read share as a session or task workload lengthens", () => {
    for (const unit of ["message", "task"] as const) {
      const lengths = unit === "message" ? [1, 8, 20, 40] : [1, 7, 14, 21];
      const shares = lengths.map((length) => spendBreakdown(unit, length).cacheReadPercent);
      for (let index = 1; index < shares.length; index += 1) expect(shares[index]).toBeGreaterThan(shares[index - 1]);
    }
  });

  it("prices a keep-warm read below a lapsed rewrite", () => {
    for (const ttl of ["5m", "1h"] as const) {
      const result = lifecycleComparison(250_000, "opus", ttl);
      expect(result.keepWarmUsd).toBeLessThan(result.lapseUsd);
    }
  });

  it("prices verbose output above lean output", () => {
    const result = outputComparison("opus", 180_000, 1_200, 2_400, 600);
    expect(result.verboseUsd).toBeGreaterThan(result.leanUsd);
  });

  it("prices the same task lower on Haiku than Opus", () => {
    const route = MACRO_ROUTES[0];
    expect(priceTaskChoice(route, "haiku", route.effort)).toBeLessThan(priceTaskChoice(route, "opus", route.effort));
  });
});
