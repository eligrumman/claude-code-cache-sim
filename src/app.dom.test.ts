import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/svelte";
import App from "./App.svelte";
import { canvasFillTextCalls, resetCanvasFillTextCalls } from "./test-setup.dom.js";

function localStorageStub() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageStub());
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  resetCanvasFillTextCalls();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function click(text: string | RegExp) {
  await fireEvent.click(screen.getByText(text));
}

async function reachRouteChoice() {
  await click("L1");
  await click("Send");
  await click("Send");
}

async function finishRoute(route: "same" | "isolated") {
  await reachRouteChoice();
  await click(route === "same" ? "Keep working here" : "Open an isolated parallel test thread");
  await fireEvent.click(screen.getByLabelText(route === "same" ? /Mostly blue/ : /Mostly red/));
  await click("Lock prediction");
  await click("Send and find out");
  await click(/One thread could read saved context/);
}

describe("redesigned L1 live flow", () => {
  it("opens immediately on the first Send without revealing cache vocabulary", async () => {
    render(App);
    const l1 = screen.getByTitle(/Finish Bob's login, logout, and test work/);
    expect(within(l1).getByText("new")).toBeInTheDocument();
    await click("L1");
    expect(screen.getByText("Login is broken. Ask Claude to fix it?")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.queryByText(/cache read|cold-write|saved context/i)).not.toBeInTheDocument();
  });

  it("reveals the exact engine-priced write and read only after their requests", async () => {
    render(App);
    await click("L1");
    await click("Send");
    expect(screen.getByText(/First request: Claude saved/)).toBeInTheDocument();
    expect(screen.getByText(/WRITE · \$0\.210264/)).toBeInTheDocument();
    await click("Send");
    expect(screen.getByText(/READ · \$0\.0122634/)).toBeInTheDocument();
    expect(screen.getByText("Keep working here")).toBeInTheDocument();
    expect(screen.getByText("Open an isolated parallel test thread")).toBeInTheDocument();
  });

  it("same-chat route visibly delivers the lower-spend benefit and passes", async () => {
    render(App);
    await reachRouteChoice();
    await click("Keep working here");
    await fireEvent.click(screen.getByLabelText(/Mostly blue/));
    await click("Lock prediction");
    await click("Send and find out");
    expect(screen.getByText(/34,738 read · 0 written/)).toBeInTheDocument();
    expect(screen.getAllByText("$0.0122604").length).toBeGreaterThan(0);
    expect(screen.getByText(/saved \$0\.1980066/)).toBeInTheDocument();
    await click(/One thread could read saved context/);
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
    expect(screen.getByText(/★★★/)).toBeInTheDocument();
  });

  it("isolated route visibly delivers the faster benefit and also passes", async () => {
    render(App);
    await reachRouteChoice();
    await click("Open an isolated parallel test thread");
    await fireEvent.click(screen.getByLabelText(/Mostly red/));
    await click("Lock prediction");
    await click("Send and find out");
    expect(screen.getByText(/0 read · 34,738 written/)).toBeInTheDocument();
    expect(screen.getAllByText("$0.210267").length).toBeGreaterThan(0);
    expect(screen.getByText(/completed 8 minutes earlier/)).toBeInTheDocument();
    await click(/One thread could read saved context/);
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
    expect(screen.getByText(/★★★/)).toBeInTheDocument();
  });

  it("a wrong explanation is non-punitive and keeps focus on the evidence", async () => {
    render(App);
    await reachRouteChoice();
    await click("Keep working here");
    await fireEvent.click(screen.getByLabelText(/Mostly blue/));
    await click("Lock prediction");
    await click("Send and find out");
    await click("The test sentence was longer.");
    expect(screen.getByText(/Look at the red and blue token counts/)).toBeInTheDocument();
    expect(screen.queryByText(/Failed/)).not.toBeInTheDocument();
  });

  it("draws all three priced requests and unlocks L2 after either valid route", async () => {
    render(App);
    await finishRoute("same");
    expect(canvasFillTextCalls.some((t) => t === "$0.2103")).toBe(true);
    expect(canvasFillTextCalls.some((t) => t === "$0.0123")).toBe(true);
    await click("Back to map");
    const l2 = screen.getByText("L2").closest("button")!;
    expect(l2).not.toBeDisabled();
    expect(l2.className).toContain("unlocked");
  });
});
