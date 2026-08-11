import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ArticleScreen from "./ArticleScreen.svelte";
import MacroRouteWidget from "./MacroRouteWidget.svelte";
import MacroTaskPicker from "./MacroTaskPicker.svelte";
import ContextCostWidget from "./ContextCostWidget.svelte";
import WorkdaySessionWidget from "./WorkdaySessionWidget.svelte";
import MacroMonthWidget from "./MacroMonthWidget.svelte";
import {
  MACRO_ROUTES,
  priceContextComparison,
  priceMacroRoutes,
  priceTaskChoice,
  simulateMacroMonth,
  totalMacroRoutes,
  verdictForChoice,
  type Effort,
} from "./macroPricing.js";
import type { Model } from "../engine/types.js";

beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderArticle() {
  return render(ArticleScreen, { onback: vi.fn(), onsandbox: vi.fn(), ontd: vi.fn() });
}

describe("Micro and Macro articles", () => {
  it("switches between both articles in-screen", async () => {
    renderArticle();
    expect(screen.getByRole("heading", { name: "Claude Code Costs - Explained" })).toBeInTheDocument();
    expect(screen.getByText(/This article breaks down where the money goes/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Five minutes or one hour?" })).toBeInTheDocument();
    expect(screen.queryByText("The surprisingly expensive pause.")).not.toBeInTheDocument();
    expect(screen.queryByText("This is real. Here's the tape.")).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    expect(screen.getByRole("heading", { name: "Stop making one giant agent do everything." })).toBeInTheDocument();
    expect(screen.queryByTestId("macro-lab-widget")).not.toBeInTheDocument();
    expect(screen.queryByTestId("macro-route-widget")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workday-session-widget")).not.toBeInTheDocument();
    expect(screen.queryByTestId("context-cost-widget")).not.toBeInTheDocument();
    const monthWidgets = screen.getAllByTestId("macro-month-widget");
    expect(monthWidgets).toHaveLength(5);
    expect(monthWidgets.map((widget) => widget.getAttribute("data-focus"))).toEqual(["strategy", "model", "effort", "load", "all"]);
    expect(screen.getByTestId("subagent-fleet-widget")).toBeInTheDocument();
    expect(screen.getAllByTestId("subagent-row")).toHaveLength(7);
    const fleetTotal = Number(screen.getByTestId("subagent-fleet-total").getAttribute("data-value"));
    const fitTotal = MACRO_ROUTES.reduce((sum, route) => sum + priceTaskChoice(route, route.model, route.effort), 0);
    const opusBaseline = MACRO_ROUTES.reduce((sum, route) => sum + priceTaskChoice(route, "opus", "high"), 0);
    expect(fleetTotal).toBeGreaterThan(0);
    expect(fleetTotal).toBeCloseTo(fitTotal);
    expect(fitTotal).toBeLessThan(opusBaseline);
    expect(screen.queryByTestId("spend-breakdown-task")).not.toBeInTheDocument();
    expect(screen.queryByTestId("route-rate-card-widget")).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Micro" }));
    expect(screen.getByRole("heading", { name: "Five minutes or one hour?" })).toBeInTheDocument();
    expect(screen.queryByText("0 · SPEND ANATOMY")).not.toBeInTheDocument();
    expect(screen.queryByText("0.1 · CACHE LIFECYCLE")).not.toBeInTheDocument();
    expect(screen.queryByText("0.2 · OUTPUT")).not.toBeInTheDocument();
  });

  it("reveals and closes an individual deep dive while TL;DR is on", async () => {
    renderArticle();
    const lesson = screen.getByRole("heading", { name: "Five minutes or one hour?" }).closest(".lesson")!;
    const toggle = lesson.querySelector<HTMLButtonElement>(".expand")!;
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const continuation = screen.getByTestId("deep-dive");
    expect(continuation).toHaveTextContent("20× the price");
    expect(continuation.closest("p")).toHaveTextContent("A longer cache costs more to write");
    expect(continuation.closest(".deep")).toBeNull();

    await fireEvent.click(toggle);
    expect(screen.queryByTestId("deep-dive")).not.toBeInTheDocument();
  });

  it("renders realistic, internally scrolling micro sessions", () => {
    const { container } = renderArticle();
    const widgets = Array.from(document.querySelectorAll(".lesson .widget"));
    expect(widgets).toHaveLength(5);
    expect(widgets.map((widget) => widget.querySelectorAll(".tick").length)).toEqual([12, 10, 4, 6, 12]);
    expect(screen.getAllByTestId("lever-scroll")).toHaveLength(5);
    expect(screen.getByText(/intermittent checkout timeout/)).toBeInTheDocument();
    expect(screen.getByText(/pagination diff for contract regressions/)).toBeInTheDocument();
    expect(screen.getByText(/Start from the stable CLAUDE.md/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Updating CLAUDE.md isn't free." })).toBeInTheDocument();
    expect(screen.getByText(/flaky notification test/)).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\bhelpers?\b/i);
  });

  it("puts each setup prompt after its interactive widget and the real-usage report CTA last", () => {
    renderArticle();
    const lessons = Array.from(document.querySelectorAll(".lesson"));
    for (const lesson of lessons) {
      const widget = lesson.querySelector(".widget, .toycard");
      const setup = lesson.querySelector(".section-setup");
      expect(widget).not.toBeNull();
      expect(setup).not.toBeNull();
      expect(widget!.compareDocumentPosition(setup!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    const reporter = document.querySelector(".article-diagnose");
    const setups = document.querySelectorAll(".section-setup");
    const lastSetup = setups[setups.length - 1];
    expect(lastSetup.compareDocumentPosition(reporter!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("npx github:eligrumman/claude-code-cache-sim cc-cache-report")).toBeInTheDocument();
    expect(screen.getByText("npm run report")).toBeInTheDocument();
    expect(reporter).not.toHaveTextContent("A–F grade");
  });

  it("explains cascading subagent cache misses in the same-prompt deep dive", async () => {
    renderArticle();
    const lesson = screen.getByRole("heading", { name: "One word can poison the shared prefix." }).closest(".lesson")!;
    await fireEvent.click(lesson.querySelector<HTMLButtonElement>(".expand")!);
    const detail = screen.getByTestId("deep-dive");
    expect(detail).toHaveTextContent("HEY-versus-HELLO experiment");
    expect(detail).toHaveTextContent("~15K tokens");
    expect(detail).toHaveTextContent("~9–10K tools, skills, and MCP block");
    expect(detail).toHaveTextContent("variable task last");
  });

  it("uses TL;DR as collapse-all / expand-all and preserves individual controls afterward", async () => {
    renderArticle();
    expect(screen.queryAllByTestId("deep-dive")).toHaveLength(0);

    await fireEvent.click(screen.getByRole("switch", { name: "TL;DR" }));
    expect(screen.getByRole("switch", { name: "TL;DR" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getAllByTestId("deep-dive")).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: /Close detail/ }).every((button) => button.getAttribute("aria-expanded") === "true")).toBe(true);

    await fireEvent.click(screen.getAllByRole("button", { name: /Close detail/ })[0]);
    expect(screen.getAllByTestId("deep-dive")).toHaveLength(4);

    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    expect(screen.getAllByTestId("deep-dive")).toHaveLength(6);

    await fireEvent.click(screen.getByRole("switch", { name: "TL;DR" }));
    expect(screen.queryAllByTestId("deep-dive")).toHaveLength(0);
  });

  it("prices the macro mini-widget through the shared sim cost path", () => {
    const routed = priceMacroRoutes(true);
    const baseline = priceMacroRoutes(false);
    expect([...routed, ...baseline].every((route) => Number.isFinite(route.usd) && route.usd >= 0)).toBe(true);
    expect(totalMacroRoutes(true)).toBe(routed.reduce((sum, route) => sum + route.usd, 0));

    render(MacroRouteWidget);
    const total = Number(screen.getByTestId("macro-total").getAttribute("data-value"));
    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it("prices every task choice and gives representative verdicts", async () => {
    const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
    const efforts: Effort[] = ["low", "medium", "high"];
    for (const route of MACRO_ROUTES) {
      for (const model of models) {
        for (const effort of efforts) {
          const usd = priceTaskChoice(route, model, effort);
          expect(Number.isFinite(usd)).toBe(true);
          expect(usd).toBeGreaterThanOrEqual(0);
        }
      }
    }

    expect(verdictForChoice(MACRO_ROUTES[0], "haiku", "high")).toBe("bad");
    expect(verdictForChoice(MACRO_ROUTES[4], "sonnet", "medium")).toBe("good");
    expect(verdictForChoice(MACRO_ROUTES[6], "fable", "low")).toBe("expensive");

    render(MacroTaskPicker);
    expect(screen.getAllByTestId("route-verdict")).toHaveLength(MACRO_ROUTES.length);
    expect(Array.from(document.querySelectorAll<HTMLElement>(".money")).every((node) => {
      const value = Number(node.dataset.value);
      return Number.isFinite(value) && value >= 0;
    })).toBe(true);

    await fireEvent.change(screen.getByLabelText("Plan model"), { target: { value: "haiku" } });
    expect(screen.getAllByTestId("route-verdict")[0]).toHaveTextContent("bad · likely underpowered");
    expect(screen.getByText(/shallow dependency map/)).toBeInTheDocument();
    await fireEvent.change(screen.getByLabelText("Docs model"), { target: { value: "fable" } });
    expect(screen.getAllByTestId("route-verdict")[6]).toHaveTextContent("expensive · more than this needs");
    expect(screen.getByText(/cannot recover facts absent from the brief/)).toBeInTheDocument();
  });

  it("builds and renders a reconciling 30-day macro month", () => {
    const routed = simulateMacroMonth({ strategy: "routed", model: "opus", effort: "high", load: "normal" });
    const uniform = simulateMacroMonth({ strategy: "uniform", model: "opus", effort: "high", load: "normal" });
    const light = simulateMacroMonth({ strategy: "routed", model: "opus", effort: "high", load: "light" });
    const heavy = simulateMacroMonth({ strategy: "routed", model: "opus", effort: "high", load: "heavy" });
    expect(routed.days).toHaveLength(30);
    expect(routed.totalUsd).toBeGreaterThan(0);
    expect(routed.totalUsd).toBeLessThan(uniform.totalUsd);
    expect(Object.values(routed.byModel).reduce((sum, value) => sum + value, 0)).toBeCloseTo(routed.totalUsd, 2);
    expect(Object.values(routed.byEffort).reduce((sum, value) => sum + value, 0)).toBeCloseTo(routed.totalUsd, 2);
    expect(heavy.totalUsd).toBeGreaterThan(light.totalUsd);
    render(MacroMonthWidget);
    expect(screen.getAllByTestId("macro-month-day")).toHaveLength(30);
    expect(Number(screen.getByTestId("macro-month-total").getAttribute("data-value"))).toBeCloseTo(routed.totalUsd, 8);
  });

  it("prices both sides of the context example", () => {
    for (const model of ["haiku", "sonnet", "opus", "fable"] as Model[]) {
      const priced = priceContextComparison(model);
      expect([priced.mainCold, priced.mainWarm, priced.scopedCold, priced.scopedWarm]
        .every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
      expect(priced.mainCold).toBeGreaterThan(priced.scopedCold);
      expect(priced.mainWarm).toBeGreaterThan(priced.scopedWarm);
    }
    render(ContextCostWidget);
    expect(screen.getByTestId("context-cost-widget")).toBeInTheDocument();
  });

  it("compares cumulative scripted workdays through the scenario ledger", async () => {
    render(WorkdaySessionWidget);
    const giant = () => Number(screen.getByTestId("workday-giant-total").getAttribute("data-value"));
    const scoped = () => Number(screen.getByTestId("workday-scoped-total").getAttribute("data-value"));
    expect(giant()).toBeGreaterThan(scoped());
    const shipFeatureTotal = giant();

    await fireEvent.change(screen.getByLabelText("Workday scenario"), { target: { value: "debug-prod" } });
    expect(giant()).toBeGreaterThan(scoped());
    expect(giant()).not.toBe(shipFeatureTotal);
    expect(screen.getByText(/70,000-token, opus backpack/)).toBeInTheDocument();
  });

  it("renders and interacts without console errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderArticle();
    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    await fireEvent.click(screen.getAllByRole("button", { name: /Deep dive/ })[0]);
    await fireEvent.click(screen.getAllByRole("button", { name: "Uniform" }).slice(-1)[0]);
    await fireEvent.change(screen.getAllByLabelText("Month model").slice(-1)[0], { target: { value: "fable" } });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
