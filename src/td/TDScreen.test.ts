import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import App from "../App.svelte";

let nextFrameId = 1;
let frameNow = 0;
let frames = new Map<number, FrameRequestCallback>();
let cancelled: number[] = [];

beforeEach(() => {
  nextFrameId = 1; frameNow = 0; frames = new Map(); cancelled = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { const id = nextFrameId++; frames.set(id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { cancelled.push(id); frames.delete(id); });
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function advanceFrames(count = 1): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const pending = [...frames.entries()];
    if (!pending.length) break;
    frames.clear(); frameNow += 50;
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
function liveRateText(): string { return screen.getByText("LIVE TASK RATE · REPRICES NOW").parentElement?.querySelector("b")?.textContent ?? ""; }

describe("Tokenloons live routing screen", () => {
  it("starts main-agent-only at Opus-high and resets run-scoped state", async () => {
    await openTD();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Sandbox mode/ }));
    await clockIn();
    expect(screen.getByLabelText("Main agent model")).toHaveValue("opus");
    expect(screen.getByLabelText("Main agent effort")).toHaveValue("high");
    expect(screen.getByRole("checkbox", { name: /Use subagents/ })).not.toBeChecked();
    expect(screen.getByText("1M context")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(1_000);
    expect(screen.getByText(/Next: Inbox Triage/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Inbox Triage/ })).toBeEnabled();
    expect(document.body.textContent).not.toMatch(/\$(?:NaN|Infinity|undefined)/);

    await fireEvent.click(screen.getByRole("button", { name: /Restart/ }));
    await clockIn();
    expect(screen.getAllByText("$0.000").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/1\/5 · Refactor MOAR/)).toBeInTheDocument();
  });

  it("visibly re-prices the live spend rate when main model and effort change", async () => {
    await openTD(); await clockIn();
    const opusHigh = liveRateText();
    await fireEvent.change(screen.getByLabelText("Main agent model"), { target: { value: "haiku" } });
    const haikuHigh = liveRateText();
    await fireEvent.change(screen.getByLabelText("Main agent effort"), { target: { value: "low" } });
    const haikuLow = liveRateText();
    expect(haikuHigh).not.toBe(opusHigh);
    expect(haikuLow).not.toBe(haikuHigh);
    expect(screen.getByText(/\$1\/M input/)).toBeInTheDocument();
  });

  it("reveals inherited per-type routes and allows an explicit docs override", async () => {
    await openTD(); await clockIn();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Use subagents/ }));
    expect(screen.getByLabelText("plan model")).toHaveValue("inherit");
    expect(screen.getByLabelText("docs model")).toHaveValue("inherit");
    expect(screen.getAllByRole("option", { name: "inherit (opus)" })).toHaveLength(7);
    await fireEvent.change(screen.getByLabelText("docs model"), { target: { value: "haiku" } });
    await fireEvent.change(screen.getByLabelText("docs effort"), { target: { value: "low" } });
    expect(screen.getByLabelText("docs model")).toHaveValue("haiku");
    expect(screen.getByLabelText("docs effort")).toHaveValue("low");
    expect(screen.getAllByText(/ideal:/).length).toBe(7);
  });

  it("routes a selected underpowered plan and exposes the BAD cascade tally", async () => {
    await openTD(); await clockIn();
    await fireEvent.change(screen.getByLabelText("Main agent model"), { target: { value: "haiku" } });
    await fireEvent.change(screen.getByLabelText("Main agent effort"), { target: { value: "low" } });
    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(18);

    const canvas = screen.getByLabelText("Live task routing lane; click a task to inspect it") as HTMLCanvasElement;
    canvas.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 900, bottom: 330, width: 900, height: 330, toJSON: () => ({}) });
    await fireEvent.click(canvas, { clientX: 100, clientY: 72 });
    expect(screen.getByText(/plan selected/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Route selected now/ }));
    expect(screen.getByText(/BAD ❌ MAIN AGENT Haiku/)).toBeInTheDocument();
    expect(screen.getByText("1 bad")).toBeInTheDocument();
    expect(screen.getByText(/0 active · 10 incoming/)).toBeInTheDocument();
  });

  it("fires the five-stage MOAB climax and scores panic-default routing", async () => {
    await openTD();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Sandbox mode/ }));
    await clockIn();
    for (const name of ["Refactor MOAR", "Inbox Triage", "Ship a Feature"]) {
      await fireEvent.click(screen.getByRole("button", { name: new RegExp(`Start ${name}`) }));
      await advanceFrames(1_400);
    }
    await fireEvent.click(screen.getByRole("button", { name: /Start Debug Prod at 2am/ }));
    await advanceFrames(12);
    expect(screen.getByText("🐛 MOAB INCIDENT")).toBeInTheDocument();
    expect(screen.getByText(/MOAB: production DOWN/)).toBeInTheDocument();
    await advanceFrames(1_600);
    expect(screen.getByText(/5\/5 stages/)).toBeInTheDocument();
    expect(screen.getByText("You panic-defaulted every stage.")).toBeInTheDocument();
  });

  it("enters challenge overdraft, validates the IDE gag, and revives", async () => {
    await openTD();
    await fireEvent.input(screen.getByRole("slider", { name: /Budget/ }), { target: { value: "10" } });
    await clockIn();
    await fireEvent.click(screen.getByRole("button", { name: /Start Refactor MOAR/ }));
    await advanceFrames(1_200);
    expect(screen.getByRole("heading", { name: /Out of tokens/ })).toBeInTheDocument();
    await fireEvent.input(screen.getByLabelText("Cache cost coding challenge"), { target: { value: "function cacheReadCost(tokens, dollarPerMTok) { return tokens * 0.1 * dollarPerMTok / 1_000_000; }" } });
    await fireEvent.click(screen.getByRole("button", { name: /Run tests/ }));
    expect(screen.getByText(/3 passed/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Resume dispatch/ }));
    expect(screen.queryByRole("heading", { name: /Out of tokens/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Rehired!/)).toBeInTheDocument();
  });

  it("finishes every scenario in sandbox without entering the lose state", async () => {
    await openTD();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Sandbox mode/ }));
    await clockIn();
    for (const name of ["Refactor MOAR", "Inbox Triage", "Ship a Feature", "Debug Prod at 2am", "Subagent Swarm"]) {
      await fireEvent.click(screen.getByRole("button", { name: new RegExp(`Start ${name}`) }));
      await advanceFrames(1_700);
      expect(screen.queryByRole("heading", { name: /Out of tokens/ })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "Workday routed." })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\$(?:NaN|Infinity|undefined)/);
  });

  it("cancels its animation loop when navigating back to the hub", async () => {
    await openTD(); await clockIn();
    expect(frames.size).toBe(1);
    await fireEvent.click(screen.getByRole("button", { name: /Map/ }));
    expect(cancelled).toHaveLength(1); expect(frames.size).toBe(0);
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
