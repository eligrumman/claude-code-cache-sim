import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import App from "../App.svelte";

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now() + 400), 0) as unknown as number);
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("sandbox screen", () => {
  it("is reachable from home and makes a baseline-isolated A/B change", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    expect(screen.getByRole("heading", { name: "Where did Claude's money go?" })).toBeInTheDocument();
    expect(screen.getByText("You're looking at:", { exact: false })).toHaveTextContent("Keep-warm ping");
    expect(screen.getByRole("button", { name: /B ON/ })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: /B ON/ }));
    expect(screen.getByText(/Changing keep-warm ping to ON/)).toBeInTheDocument();
    expect(document.querySelectorAll(".segment.cacheWrite").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".segment.cacheRead").length).toBeGreaterThan(0);
  });

  it("gives another persona a matched TTL story and exposes every lever", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));
    await fireEvent.click(screen.getByRole("button", { name: /PMTwo planning sessions/ }));
    await fireEvent.click(screen.getByRole("button", { name: /Cache TTL/ }));

    expect(screen.getByRole("button", { name: /B 5 MIN/ })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /B 5 MIN/ }));
    expect(screen.getByText(/Changing cache ttl to 5 MIN/)).toHaveTextContent("for the PM");
    for (const label of ["Subagents prompt", "Cache TTL", "Context size", "Approval mode", "Keep-warm ping", "Model"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });
});
