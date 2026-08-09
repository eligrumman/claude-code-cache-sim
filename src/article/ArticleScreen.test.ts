import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ArticleScreen from "./ArticleScreen.svelte";
import MacroRouteWidget from "./MacroRouteWidget.svelte";
import MacroTaskPicker from "./MacroTaskPicker.svelte";
import ContextCostWidget from "./ContextCostWidget.svelte";
import {
  MACRO_ROUTES,
  priceContextComparison,
  priceMacroRoutes,
  priceTaskChoice,
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
    expect(screen.getByRole("heading", { name: "Which caching configs spend the fewest tokens?" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    expect(screen.getByRole("heading", { name: "Which agents and efforts fit each task?" })).toBeInTheDocument();
    expect(screen.getByTestId("macro-route-widget")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Micro" }));
    expect(screen.getByRole("heading", { name: "Five minutes or one hour?" })).toBeInTheDocument();
  });

  it("reveals and closes an individual deep dive while TL;DR is on", async () => {
    renderArticle();
    const toggle = screen.getAllByRole("button", { name: /Deep dive/ })[0];
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
    expect(screen.getAllByTestId("deep-dive")).toHaveLength(5);

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
    await fireEvent.change(screen.getByLabelText("Docs model"), { target: { value: "fable" } });
    expect(screen.getAllByTestId("route-verdict")[6]).toHaveTextContent("expensive · more than this needs");
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

  it("renders and interacts without console errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderArticle();
    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    await fireEvent.click(screen.getAllByRole("button", { name: /Deep dive/ })[0]);
    await fireEvent.click(screen.getByRole("button", { name: "Toggle routed workload" }));
    expect(consoleError).not.toHaveBeenCalled();
  });
});
