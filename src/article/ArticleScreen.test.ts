import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ArticleScreen from "./ArticleScreen.svelte";
import MacroRouteWidget from "./MacroRouteWidget.svelte";
import { priceMacroRoutes, totalMacroRoutes } from "./macroPricing.js";

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

  it("reveals and closes the deep dive with the |> control", async () => {
    renderArticle();
    const toggle = screen.getAllByRole("button", { name: /Deep dive/ })[0];
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("deep-dive")).toHaveTextContent("tokens × rate × MODEL_IN[model] / 1e6");

    await fireEvent.click(toggle);
    expect(screen.queryByTestId("deep-dive")).not.toBeInTheDocument();
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

  it("renders and interacts without console errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderArticle();
    await fireEvent.click(screen.getByRole("button", { name: "Macro" }));
    await fireEvent.click(screen.getAllByRole("button", { name: /Deep dive/ })[0]);
    await fireEvent.click(screen.getByRole("button", { name: "Toggle routed workload" }));
    expect(consoleError).not.toHaveBeenCalled();
  });
});
