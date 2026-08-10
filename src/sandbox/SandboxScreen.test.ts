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
  it("is reachable from home and applies panel changes in real time", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    expect(screen.getByRole("heading", { name: "Conversation playground" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Tune the workday" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "💬 Conversation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "🔧 Under the hood" })).toBeInTheDocument();
    expect(screen.getByLabelText("Running cache savings")).toHaveTextContent(/with cache.*uncached.*saved/);
    expect(screen.getByLabelText("Daily, weekly, and monthly totals")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "on" }));
    expect(screen.getByRole("button", { name: "on" })).toHaveClass("chosen");
    expect(screen.getByText("● Modified")).toBeInTheDocument();
    expect(screen.getByLabelText("Running cache savings")).toHaveTextContent("with cache");
  });

  it("keeps lever edits independent and resets to the current persona defaults", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));
    await fireEvent.click(screen.getByRole("button", { name: /PM/ }));
    await fireEvent.click(screen.getByRole("button", { name: "different" }));
    await fireEvent.click(screen.getByRole("button", { name: "5 min" }));

    expect(screen.getByText("📋 PM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "different" })).toHaveClass("chosen");
    expect(screen.getByRole("button", { name: "5 min" })).toHaveClass("chosen");

    await fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(screen.getByText("Defaults")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "same prompt" })).toHaveClass("chosen");
    expect(screen.getByRole("button", { name: "1 hour" })).toHaveClass("chosen");

    for (const label of ["Subagent prompt", "Cache TTL", "Context size", "Approval mode", "Keep-warm", "Auto-compact", "Skills + MCP schemas", "Model"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("button", { name: "enabled" })).toHaveClass("chosen");
    expect(screen.getByRole("button", { name: "lazy" })).toHaveClass("chosen");
  });

  it("resets auto-compact and lazy tools with the rest of the persona defaults", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));
    await fireEvent.click(screen.getByRole("button", { name: "disabled" }));
    await fireEvent.click(screen.getByRole("button", { name: "eager 14k" }));
    expect(screen.getByRole("button", { name: "disabled" })).toHaveClass("chosen");
    expect(screen.getByRole("button", { name: "eager 14k" })).toHaveClass("chosen");

    await fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(screen.getByRole("button", { name: "enabled" })).toHaveClass("chosen");
    expect(screen.getByRole("button", { name: "lazy" })).toHaveClass("chosen");
  });

  it("uses one corner transport control and opens the captured receipt", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    const pause = screen.getByRole("button", { name: "⏸ Pause" });
    expect(screen.queryByRole("button", { name: "↻ Replay" })).not.toBeInTheDocument();
    await fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();
    await fireEvent.click(screen.getByTitle("Inspect this API round trip"));

    expect(screen.getByRole("button", { name: "🔧 Under the hood" })).toHaveClass("active");
    expect(screen.getByText("Message receipt · step 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Prompt chunks")).toHaveTextContent("47 005 tok");
    expect(screen.getByText("output (incl. thinking)")).toBeInTheDocument();
    expect(screen.getByText(/47 005 tok × \$0.50\/M = \$0.023503/)).toBeInTheDocument();
    expect(screen.getByText(/With cache \$0.062344 vs \$0.270640 uncached · 77.0% saved/)).toBeInTheDocument();
  });

  it("opens and closes the narrow-screen configuration drawer", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    const toggle = screen.getByRole("button", { name: "Open configuration" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await fireEvent.click(screen.getAllByRole("button", { name: "Close configuration" })[0]);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
