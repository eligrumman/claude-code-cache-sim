import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import MacroLabWidget from "./MacroLabWidget.svelte";
import { MACRO_ROUTES, macroLabComparison, priceMacroLab, priceTaskChoice, totalMacroRoutes } from "./macroPricing.js";

afterEach(cleanup);

describe("article spend teaching models", () => {
  it("reconciles all four billed classes to the displayed total", () => {
    const macro = priceMacroLab({ strategy: "uniform", model: "opus", effort: "high", taskCount: 12, contextDropped: 30 });
    expect(macro.usd.input + macro.usd.cacheRead + macro.usd.cacheWrite + macro.usd.output).toBeCloseTo(macro.totalUsd, 10);
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

  it("focuses strategy and summarizes the held parameters", () => {
    render(MacroLabWidget, { highlight: "strategy" });
    expect(screen.getByTestId("macrolab-control-strategy")).toHaveClass("focus-control");
    expect(document.querySelector(".held-at")).toHaveTextContent("Held at: model opus · high · 7 tasks/day · 0% compaction");
    expect(screen.queryByLabelText("Uniform model")).not.toBeInTheDocument();
    expect(screen.getByTestId("macrolab-uniform-total")).toBeInTheDocument();
    expect(screen.getByTestId("macrolab-routed-total")).toBeInTheDocument();
  });

  it("shows a with/without comparison when compaction is focused", () => {
    render(MacroLabWidget, { highlight: "compaction" });
    expect(screen.getByText("Without compaction")).toBeInTheDocument();
    expect(screen.getByText("With 0% compaction")).toBeInTheDocument();
    expect(screen.getByText("compaction saves")).toBeInTheDocument();
    expect(screen.queryByLabelText("Task type breakdown")).not.toBeInTheDocument();
  });

  it("keeps the full default controls and per-task table", () => {
    render(MacroLabWidget);
    expect(screen.getByTestId("macro-lab-widget")).toHaveAttribute("data-highlight", "all");
    expect(screen.getByLabelText("Uniform model")).toBeInTheDocument();
    expect(screen.getByLabelText("Uniform effort")).toBeInTheDocument();
    expect(screen.getByLabelText("Task type breakdown")).toBeInTheDocument();
    expect(screen.getAllByTestId("macrolab-verdict")).toHaveLength(7);
  });

  it("reconciles the four focused spend classes to its selected total", () => {
    render(MacroLabWidget, { highlight: "model" });
    const classes = ["input", "cacheRead", "cacheWrite", "output"].map((key) =>
      Number(screen.getByTestId(`macrolab-${key}`).getAttribute("data-value")),
    );
    const total = Number(screen.getByTestId("macrolab-total").getAttribute("data-value"));
    expect(classes.reduce((sum, value) => sum + value, 0)).toBeCloseTo(total, 10);
  });
});
