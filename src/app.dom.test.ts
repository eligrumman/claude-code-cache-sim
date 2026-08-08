// app.dom.test.ts - durable component/e2e suite for L1 (L1_REDESIGN.md), the
// game shell router, and campaign persistence. Renders the real App.svelte
// tree and drives it via simulated user clicks wherever practical; falls
// back to the shell/step reducer only where a DOM affordance doesn't exist
// (e.g. TTL expiry needs real minutes of dawdle, which we commit through the
// ADVANCE action rather than the live setInterval so the test stays fast and
// deterministic - L1_REDESIGN Section 5/7).
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/svelte";
import App from "./App.svelte";
import { clearCampaign } from "./game/shell.js";
import { canvasFillTextCalls, resetCanvasFillTextCalls } from "./test-setup.dom.js";

function localStorageStub() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageStub());
  vi.useFakeTimers();
  resetCanvasFillTextCalls();
  // TapeRenderer reads prefers-reduced-motion once at construction time and,
  // when reduced, cuts straight to the final revealed frame instead of
  // animating in over rAF ticks. jsdom under fake timers never actually
  // advances rAF, so without this the tape's bars/cost text never "finish"
  // drawing and canvasFillTextCalls assertions below would hang at 0 reveal
  // regardless of whether the underlying bug is fixed.
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: true,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function clickByText(text: string | RegExp) {
  const btn = screen.getByText(text);
  await fireEvent.click(btn);
}

// Drive the L1 intro cards (3 teaching cards + goal card) to the Start button.
async function dismissIntro() {
  await clickByText("Next"); // card 0 -> 1
  await clickByText("Next"); // card 1 -> 2
  await clickByText("Next"); // card 2 -> goal card
  await clickByText("Start");
}

describe("fresh start: map screen unlock state", () => {
  it("shows L1 unlocked (new) and L2-L13 locked", () => {
    render(App);
    const l1 = screen.getByTitle(/Finish Bob's 4 tasks/);
    expect(within(l1).getByText("new")).toBeInTheDocument();
    expect(l1.className).toContain("unlocked");

    for (const id of ["L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10", "L11", "L12", "L13"]) {
      const tile = screen.getByText(id).closest("button")!;
      expect(tile.className).toContain("locked");
      expect(tile).toBeDisabled();
    }
  });
});

describe("L1 intro + goal banner", () => {
  it("renders the 3 intro cards + goal card, then dismisses into play with a live goal banner", async () => {
    render(App);
    await clickByText("L1");

    // Card 0: token basics.
    expect(screen.getByText("What's a token?")).toBeInTheDocument();
    await clickByText("Next");
    // Card 1: the four things you pay for.
    expect(screen.getByText("The four things you pay for.")).toBeInTheDocument();
    await clickByText("Next");
    // Card 2: when does it cache / die.
    expect(screen.getByText(/When does it cache/)).toBeInTheDocument();
    await clickByText("Next");
    // Goal card.
    expect(screen.getByText("Finish Bob's morning under $0.55.")).toBeInTheDocument();
    await clickByText("Start");

    // Now in play: goal banner shows 0/5 done, $0.00 spent.
    expect(screen.getByText(/0\/5 done, \$0\.00 spent/)).toBeInTheDocument();

    // Running one task advances the counter and the spend.
    await clickByText(/Do next task/);
    expect(screen.getByText(/1\/5 done, \$0\.\d\d spent/)).toBeInTheDocument();
  });
});

describe("L1 clock + TTL", () => {
  it("the clock advances on RUN_UNIT and Coffee, and the TTL counts down", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    expect(screen.getByText("09:00")).toBeInTheDocument(); // day starts 09:00
    await clickByText(/Do next task/); // task0: 30 min -> 09:30
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.queryByText(/no cache yet/)).not.toBeInTheDocument();
    expect(screen.getByText(/warm - expires/)).toBeInTheDocument();

    await clickByText(/Coffee/); // +20 min -> 09:50
    expect(screen.getByText("09:50")).toBeInTheDocument();
    expect(screen.getByText(/warm - expires/)).toBeInTheDocument(); // 20 min < 60-min TTL
  });

  it("standup mid-work (90 min, past the 60-min TTL) expires the cache: the next task is a cold rewrite", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    await clickByText(/Do next task/); // task0 - cold write, cache now warm
    await clickByText(/Do next task/); // task1 - warm read
    await clickByText(/Standup/); // 90 min absence > 60-min TTL
    expect(screen.getAllByText(/EXPIRED/).length).toBeGreaterThan(0);

    await clickByText(/Do next task/); // task2 - must rebuild cold
    // 2 cold main writes now in the ledger -> the anti-run's rebuild toast fired.
    expect(screen.getByText(/rebuild cost \$0\.11 more/)).toBeInTheDocument();
  });
});

describe("L1 toasts fire exactly once", () => {
  it("cold-write and warm-read toasts each appear once, not on every subsequent task", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    await clickByText(/Do next task/); // task0: cold write toast (t1)
    expect(screen.getAllByText(/22,527 tokens written/)).toHaveLength(1);

    await clickByText(/Do next task/); // task1: warm read toast (t2)
    expect(screen.getAllByText(/read back at 0\.1x/)).toHaveLength(1);

    // Dismiss the toast and run more tasks - the same toast must not reappear.
    await clickByText(/read back at 0\.1x/);
    await clickByText(/Coffee/);
    await clickByText(/Do next task/); // task2
    expect(screen.queryAllByText(/22,527 tokens written/)).toHaveLength(0);
    expect(screen.queryAllByText(/read back at 0\.1x/)).toHaveLength(0);
  });
});

describe("L1 reference path: win, 3 stars, unlocks L2", () => {
  it("tasks stacked with standup last stays under budget with exactly 1 cold main write", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    await clickByText(/Do next task/); // task0
    await clickByText(/Do next task/); // task1
    await clickByText(/Coffee/); // 20 min, well under TTL
    await clickByText(/Do next task/); // task2
    await clickByText(/Do next task/); // task3
    await clickByText(/Standup/); // standup last

    expect(screen.getByText(/Passed/)).toBeInTheDocument();
    expect(screen.getByText(/★★★/)).toBeInTheDocument(); // 3 stars, no empty ones
    expect(screen.getAllByText(/\$0\.4\d/).length).toBeGreaterThan(0); // ~$0.416

    await clickByText("Back to map");
    const l2 = screen.getByText("L2").closest("button")!;
    expect(l2.className).toContain("unlocked");
    expect(l2).not.toBeDisabled();
  });
});

describe("L1 anti path: fails the cold-write gate, retry resets to a fresh run", () => {
  it("standup mid-work costs more and fails even though it would clear the dollar budget alone", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    await clickByText(/Do next task/); // task0
    await clickByText(/Do next task/); // task1
    await clickByText(/Standup/); // mid-work, expires the TTL
    await clickByText(/Do next task/); // task2 - cold rebuild
    await clickByText(/Do next task/); // task3

    expect(screen.getByText(/Failed/)).toBeInTheDocument();
    expect(screen.getByText(/2 cold main writes/)).toBeInTheDocument();

    await clickByText("Retry");
    // Retry must land back on L1's own intro/play flow, not the generic
    // LearnScreen (regression test for the goRetry L1 special-case).
    expect(screen.getByText("What's a token?")).toBeInTheDocument();
    await dismissIntro();
    // A fresh run: goal banner back at 0/5, $0.00.
    expect(screen.getByText(/0\/5 done, \$0\.00 spent/)).toBeInTheDocument();
  });
});

describe("shell router + persistence", () => {
  it("map -> play -> result -> map, and the campaign persists across a fresh App mount", async () => {
    const r1 = render(App);
    await clickByText("L1");
    await dismissIntro();
    await clickByText(/Do next task/);
    await clickByText(/Do next task/);
    await clickByText(/Coffee/);
    await clickByText(/Do next task/);
    await clickByText(/Do next task/);
    await clickByText(/Standup/);
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
    await clickByText("Back to map");
    expect(screen.getByText("The Claude Code Simulator - Campaign")).toBeInTheDocument();
    r1.unmount();

    // A brand-new App instance reads the same localStorage and sees L2 unlocked.
    render(App);
    const l2 = screen.getByText("L2").closest("button")!;
    expect(l2.className).toContain("unlocked");
  });

  it("a corrupt save falls back to a fresh campaign (L1 unlocked, nothing else)", () => {
    localStorage.setItem("cc-sim-campaign", "{not json");
    render(App);
    const l1 = screen.getByTitle(/Finish Bob's 4 tasks/);
    expect(l1.className).toContain("unlocked");
    const l2 = screen.getByText("L2").closest("button")!;
    expect(l2.className).toContain("locked");
  });
});

// Regression coverage for two real browser bugs jsdom's non-visual assertions
// previously missed entirely: the "requests on the wire" tape staying empty
// (TapeRenderer built from a not-yet-mounted canvas, see L1PlayScreen.svelte)
// and reference costs displaying as "$0.0000" (IntroCards.svelte's demo tape
// frames had `usd: 0` hardcoded instead of computed from the pricing table).
// A <canvas> paints pixels, not DOM nodes - screen.getByText() can never see
// what the tape drew - so these assert on canvas SIZING (a real DOM/element
// property) and on `canvasFillTextCalls` (every string the mocked 2D context
// actually had fillText() called with - see test-setup.dom.ts). That's the
// render model, not pixels, and it runs in CI without a real browser.
describe("L1 requests-on-the-wire tape actually binds to a live canvas", () => {
  it("the play-screen canvas is resized off its untouched 300x150 default once the play phase mounts", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();

    // A <canvas> nobody has ever called getContext-driven resize logic on
    // keeps the browser's literal default backing store size, 300x150. If
    // TapeRenderer was constructed against a canvas ref that didn't exist
    // yet (the intro-phase bug), it stays dead forever and this canvas is
    // still sitting at 300x150 even after the play screen is showing.
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(canvas.width === 300 && canvas.height === 150).toBe(false);
  });

  it("running a task feeds a non-empty request into the tape, which actually draws bars (not the empty-state placeholder)", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();
    resetCanvasFillTextCalls();
    await clickByText(/Do next task/);

    // draw() only ever fillText()s "Run a unit to see its requests drawn to
    // scale." when handed zero rows - so if the wire panel is truly wired
    // up and got a real request, that placeholder must never be drawn, and
    // the priced cost string must be.
    expect(canvasFillTextCalls).not.toContain("Run a unit to see its requests drawn to scale.");
    expect(canvasFillTextCalls.some((t) => /^\$0\.\d{4}$/.test(t))).toBe(true);
  });
});

describe("L1 cost readouts never render as $0.0000", () => {
  it("the goal banner's running spend is non-zero and non-empty after a task", async () => {
    render(App);
    await clickByText("L1");
    await dismissIntro();
    await clickByText(/Do next task/);

    expect(screen.queryByText(/\$0\.0000/)).not.toBeInTheDocument();
    expect(screen.getByText(/\$0\.\d\d spent/)).toBeInTheDocument();
  });

  it("the intro's 3 reference-tape demo rows (cold write / warm read / cold rebuild) price to real, distinct, non-zero dollars", async () => {
    render(App);
    await clickByText("L1");
    resetCanvasFillTextCalls();
    await clickByText("Next"); // card 0 -> 1
    await clickByText("Next"); // card 1 -> 2 (the cache-lifecycle demo tape mounts + draws)

    // Regression for the exact bug: these 3 rows used to carry a hardcoded
    // `usd: 0`, which the tape formats as "$0.0000" (toFixed(4) of 0).
    expect(canvasFillTextCalls).not.toContain("$0.0000");
    // Same 22,527 tokens: a cold 1h write (2x) must cost 20x a warm read
    // (0.1x) - the two cold writes are identical, the read is far cheaper.
    expect(canvasFillTextCalls.filter((t) => t === "$0.1352")).toHaveLength(2); // both cold writes
    expect(canvasFillTextCalls).toContain("$0.0068"); // the warm read
  });
});
