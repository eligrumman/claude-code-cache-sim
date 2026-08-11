import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import App from "../App.svelte";
import ConversationView from "./ConversationView.svelte";
import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";

const replayScript: ScriptedMessage[] = [
  { id: "first", role: "user", atMin: 0, text: "Please inspect this replay" },
  { id: "second", role: "assistant", atMin: 2, text: "Here is the result" },
];
const replayOptions: MessageLedgerOptions = { ttl: "5m", model: "sonnet", prefixTok: 8_000, workInTok: 500, outputTok: 240 };

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
  it("renders the conversation toggle with flex-aligned end positions without IntersectionObserver", async () => {
    render(ConversationView, {
      props: {
        script: replayScript,
        options: replayOptions,
        off: replayOptions,
        on: replayOptions,
        offLabel: "disabled",
        onLabel: "enabled",
      },
    });

    const toggle = screen.getByRole("button", { name: "Switch to enabled" });
    const knob = toggle.querySelector("i") as HTMLElement;
    expect(toggle).toHaveClass("switch-flex");
    expect(knob).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();

    await fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Switch to disabled" })).toHaveClass("on");
  });

  it("starts replay once the conversation is at least 55% visible", async () => {
    let callback: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    const observer = { disconnect, observe, root: null, rootMargin: "0px", thresholds: [0.55], takeRecords: () => [], unobserve: vi.fn() } as unknown as IntersectionObserver;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(next: IntersectionObserverCallback) { callback = next; }
      observe = observe;
      disconnect = disconnect;
      root = null;
      rootMargin = "0px";
      thresholds = [0.55];
      takeRecords = () => [];
      unobserve = vi.fn();
    });

    render(ConversationView, { props: { script: replayScript, options: replayOptions } });
    expect(observe).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();

    callback?.([{ isIntersecting: true, intersectionRatio: 0.54 } as IntersectionObserverEntry], observer);
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();
    callback?.([{ isIntersecting: true, intersectionRatio: 0.55 } as IntersectionObserverEntry], observer);
    expect(await screen.findByRole("button", { name: "⏸ Pause" })).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("is reachable from home and applies panel changes in real time", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    expect(screen.getByRole("heading", { name: "Conversation playground" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Tune the workday" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "💬 Parallel conversations" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "🔧 Under the hood" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Concurrent conversation lanes")).toHaveTextContent(/Main thread.*Subagent 1/s);
    expect(screen.getByLabelText("Daily cost strip")).toHaveTextContent(/average.*month total/);
    expect(screen.getByLabelText("Daily, weekly, and monthly totals")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "on" }));
    expect(screen.getByRole("button", { name: "on" })).toHaveClass("chosen");
    expect(screen.getByText("● Modified")).toBeInTheDocument();
    expect(screen.getByText(/Configuration queued → applies Day 2/)).toBeInTheDocument();
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

  it("uses a speed control and opens the modeled cascade receipt", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /Sandbox/ }));

    const pause = screen.getByRole("button", { name: "⏸ Pause" });
    expect(screen.getByRole("slider", { name: "Simulation speed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "↺ Reset" })).toBeInTheDocument();
    await fireEvent.click(pause);
    expect(screen.getByRole("button", { name: "▶ Play" })).toBeInTheDocument();
    await fireEvent.click(screen.getAllByRole("button", { name: /Main thread message 1:/ })[0]);

    expect(screen.getByText("Message receipt · Main thread")).toBeInTheDocument();
    expect(screen.getByTitle("Raw logs").querySelector("button")).toBeInTheDocument();
    expect(screen.getByLabelText("Ordered modeled prompt segments and cache invalidation cursor")).toHaveTextContent(/cache breaks here.*System prompt.*THE NEW \/ CHANGED MESSAGE/s);
    expect(screen.getByText("output")).toBeInTheDocument();
    expect(screen.getByText(/With shared cache.*uncached/)).toBeInTheDocument();
  });

  it("shows color-banded message spend before the spend bar and opens a receipt with raw logs", async () => {
    render(ConversationView, { props: { script: replayScript, options: replayOptions } });

    const bubble = screen.getByRole("button", { name: /You · 9:00a.*Please inspect this replay.*\$\d/ });
    expect(bubble).toHaveTextContent(/You · 9:00a.*Please inspect this replay.*\$\d/);
    const price = bubble.querySelector(".price");
    const spendBar = bubble.querySelector(".mini");
    expect(price).toHaveClass("pricey");
    expect(spendBar).toBeInTheDocument();
    expect(price!.compareDocumentPosition(spendBar!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "▶ Play" }));
    const cheapBubble = await screen.findByRole("button", { name: /Claude · 9:02a.*Here is the result.*\$\d/ });
    expect(cheapBubble.querySelector(".price")).toHaveClass("cheap");
    const chat = bubble.closest(".chat") as HTMLDivElement;
    expect(chat.style.overflow).toBe("hidden");
    Object.defineProperties(chat, { clientHeight: { configurable: true, value: 100 }, scrollHeight: { configurable: true, value: 400 } });
    chat.scrollTop = 0;
    await fireEvent.scroll(chat);
    const scrollUp = screen.getByRole("button", { name: "Scroll messages up" });
    const scrollDown = screen.getByRole("button", { name: "Scroll messages down" });
    expect(scrollUp).toBeDisabled();
    expect(scrollDown).toBeEnabled();
    await fireEvent.click(scrollDown);
    expect(chat.scrollTop).toBe(120);
    expect(scrollUp).toBeEnabled();
    chat.scrollTop = 290;
    await fireEvent.scroll(chat);
    await fireEvent.click(scrollDown);
    expect(chat.scrollTop).toBe(300);
    expect(scrollDown).toBeDisabled();

    await fireEvent.click(bubble);
    expect(screen.getByText("Message receipt")).toBeInTheDocument();
    expect(screen.getByText("raw logs")).toBeInTheDocument();
    expect(screen.getByTitle("Raw logs").querySelector("button")).toBeInTheDocument();
    expect(screen.getByLabelText("Ordered modeled prompt segments and cache invalidation cursor")).toBeInTheDocument();
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
