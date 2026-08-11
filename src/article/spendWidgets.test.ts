import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import MacroLabWidget from "./MacroLabWidget.svelte";
import { MACRO_ROUTES, macroLabComparison, priceMacroLab, priceTaskChoice, totalMacroRoutes } from "./macroPricing.js";
import { lifecycleComparison, outputComparison, spendBreakdown } from "./spendModel.js";

afterEach(cleanup);

describe("article spend teaching models", () => {
  it("reconciles all four billed classes to the displayed total", () => {
    const micro = spendBreakdown("message", 16);
    expect(micro.usd.input + micro.usd.cacheRead + micro.usd.cacheWrite + micro.usd.output).toBeCloseTo(micro.totalUsd, 10);

    const macro = priceMacroLab({ strategy: "uniform", model: "opus", effort: "high", taskCount: 12, contextDropped: 30 });
    expect(macro.usd.input + macro.usd.cacheRead + macro.usd.cacheWrite + macro.usd.output).toBeCloseTo(macro.totalUsd, 10);
  });

  it("grows cache-read share as a message session lengthens", () => {
    const shares = [1, 8, 20, 40].map((length) => spendBreakdown("message", length).cacheReadPercent);
    for (let index = 1; index < shares.length; index += 1) expect(shares[index]).toBeGreaterThan(shares[index - 1]);
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

  it("saves money by right-sizing an all-Opus workday", () => {
    const result = macroLabComparison({ strategy: "uniform", model: "opus", effort: "high", taskCount: 7, contextDropped: 0 });
    expect(result.uniform.totalUsd).toBeGreaterThan(result.routed.totalUsd);
    expect(result.savedUsd).toBeGreaterThan(0);
    expect(result.uniform.totalUsd).toBeCloseTo(totalMacroRoutes(false), 10);
    expect(result.routed.totalUsd).toBeCloseTo(totalMacroRoutes(true), 10);
  });

  it("lowers later prefix reads as compaction drops more context", () => {
    const base = priceMacroLab({ strategy: "uniform", model: "opus", effort: "high", taskCount: 14, contextDropped: 0 });
    const compacted = priceMacroLab({ strategy: "uniform", model: "opus", effort: "high", taskCount: 14, contextDropped: 60 });
    expect(compacted.totalUsd).toBeLessThan(base.totalUsd);
    expect(compacted.tokens.cacheRead).toBeLessThan(base.tokens.cacheRead);
  });

  it("renders four stacked-bar percentages that sum to approximately 100", () => {
    render(MacroLabWidget);
    const percentages = ["input", "cacheRead", "cacheWrite", "output"].map((key) =>
      Number(screen.getByTestId(`macrolab-${key}`).getAttribute("data-percent")),
    );
    expect(percentages.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 8);
  });
});
