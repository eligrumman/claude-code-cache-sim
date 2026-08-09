import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import App from "../App.svelte";

let nextFrameId = 1;
let frameNow = 0;
let frames = new Map<number, FrameRequestCallback>();
let cancelled: number[] = [];

beforeEach(() => {
  nextFrameId = 1;
  frameNow = 0;
  frames = new Map();
  cancelled = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelled.push(id);
    frames.delete(id);
  });
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function advanceFrames(count = 1): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const pending = [...frames.entries()];
    if (!pending.length) break;
    frames.clear();
    frameNow += 50;
    for (const [, callback] of pending) callback(frameNow);
  }
  await tick();
}

async function openTD(): Promise<void> {
  render(App);
  await fireEvent.click(screen.getByRole("button", { name: /Tokenloons TD/ }));
  await tick();
}

async function clockIn(): Promise<void> {
  await fireEvent.click(screen.getByRole("button", { name: /Clock in/ }));
  await waitFor(() => expect(frames.size).toBe(1));
}

describe("Tokenloons live screen", () => {
  it("plays a complete challenge wave and resets every run-scoped value", async () => {
    await openTD();
    const budget = screen.getByRole("slider", { name: /Budget/ });
    await fireEvent.input(budget, { target: { value: "15" } });
    await clockIn();
    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(900);

    expect(screen.getByText(/Next: Inbox Triage/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Inbox Triage/ })).toBeEnabled();
    expect(document.body.textContent).not.toMatch(/\$(?:NaN|Infinity|undefined)/);

    await fireEvent.click(screen.getByRole("button", { name: /Restart/ }));
    expect(screen.getByRole("button", { name: /Clock in/ })).toBeInTheDocument();
    await clockIn();
    expect(screen.getAllByText("$0.000").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/1\/5 · Refactor MOAR/)).toBeInTheDocument();
  });

  it("enters the challenge overdraft state, validates the IDE gag, and revives", async () => {
    await openTD();
    await fireEvent.input(screen.getByRole("slider", { name: /Budget/ }), { target: { value: "2" } });
    await clockIn();
    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(900);

    expect(screen.getByRole("heading", { name: /Out of tokens/ })).toBeInTheDocument();
    await fireEvent.input(screen.getByLabelText("Cache cost coding challenge"), {
      target: { value: "function cacheReadCost(tokens, dollarPerMTok) { return tokens * 0.1 * dollarPerMTok / 1_000_000; }" },
    });
    await fireEvent.click(screen.getByRole("button", { name: /Run tests/ }));
    expect(screen.getByText(/3 passed/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Resume dispatch/ }));
    expect(screen.queryByRole("heading", { name: /Out of tokens/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Rehired!/)).toBeInTheDocument();
  });

  it("selects a canvas task, updates its live quote, and dispatches the chosen monkey", async () => {
    await openTD();
    await clockIn();
    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(18);

    const canvas = screen.getByLabelText("Live task dispatch lane; click a task to select it") as HTMLCanvasElement;
    canvas.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 900, bottom: 330, width: 900, height: 330, toJSON: () => ({}) });
    await fireEvent.click(canvas, { clientX: 100, clientY: 72 });
    expect(screen.getByText("◇ plan")).toBeInTheDocument();

    const haiku = screen.getByRole("button", { name: /^Haiku · low/ });
    await fireEvent.click(screen.getByRole("button", { name: "auto-approve" }));
    const autoQuote = haiku.querySelector("strong")?.textContent;
    expect(screen.getByRole("button", { name: "auto-approve" })).toHaveClass("active");
    await fireEvent.click(screen.getByRole("button", { name: "TTL 1h" }));
    expect(haiku.querySelector("strong")?.textContent).not.toBe(autoQuote);

    await fireEvent.click(haiku);
    expect(screen.getByText(/Haiku · low → plan: bad output/)).toBeInTheDocument();
    expect(screen.getByText("1 bad")).toBeInTheDocument();
    expect(screen.getByText(/0 active · 9 incoming/)).toBeInTheDocument();
  });

  it("finishes every scenario in sandbox without entering the lose state", async () => {
    await openTD();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Sandbox mode/ }));
    await clockIn();

    for (const name of ["Refactor MOAR", "Inbox Triage", "Ship a Feature", "Debug Prod at 2am", "Subagent Swarm"]) {
      await fireEvent.click(screen.getByRole("button", { name: new RegExp(`Start ${name}`) }));
      await advanceFrames(1_200);
      expect(screen.queryByRole("heading", { name: /Out of tokens/ })).not.toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Workday routed." })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\$(?:NaN|Infinity|undefined)/);
  });

  it("cancels its animation loop when navigating back to the hub", async () => {
    await openTD();
    await clockIn();
    expect(frames.size).toBe(1);
    await fireEvent.click(screen.getByRole("button", { name: /Map/ }));
    expect(cancelled).toHaveLength(1);
    expect(frames.size).toBe(0);
    expect(screen.getByRole("button", { name: /The Article/ })).toBeInTheDocument();
  });

  it("smoke-loads the Article and its shared-engine Sandbox handoff", async () => {
    render(App);
    await fireEvent.click(screen.getByRole("button", { name: /The Article/ }));
    expect(screen.getByRole("heading", { name: /The surprisingly.*expensive pause/ })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Open the Sandbox/ }));
    expect(screen.getByRole("heading", { name: "Conversation playground" })).toBeInTheDocument();
  });
});
