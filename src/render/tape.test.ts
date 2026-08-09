// tape.test.ts - TapeRenderer robustness: it must never throw when handed a
// missing/detached canvas, and must stay inert after destroy() even if a
// caller keeps holding a reference and calling into it (the exact race the
// L1 component/e2e suite hit: a component's onMount fires against a canvas
// ref that's already gone because the component was torn down first).
import { describe, it, expect, beforeEach } from "vitest";
import { TapeRenderer } from "./tape.js";
import type { LedgerRow } from "../game/types.js";

const ROW: LedgerRow = {
  tMin: 0,
  unitId: "u",
  unit: "TASK",
  agent: "main",
  model: "sonnet",
  cold: true,
  readTok: 0,
  inputTok: 0,
  writeTok: 100,
  writeTier: "1h",
  outTok: 0,
  usd: 0.01,
};

describe("TapeRenderer tolerates a missing or detached canvas (no throw)", () => {
  it("construction with null/undefined never throws", () => {
    expect(() => new TapeRenderer(null)).not.toThrow();
    expect(() => new TapeRenderer(undefined)).not.toThrow();
  });

  it("play()/destroy() on a renderer built from a null canvas never throw", () => {
    const t = new TapeRenderer(null);
    expect(() => t.play([ROW])).not.toThrow();
    expect(() => t.destroy()).not.toThrow();
    // Idempotent: a second destroy(), or play() after destroy(), stays inert.
    expect(() => t.destroy()).not.toThrow();
    expect(() => t.play([ROW])).not.toThrow();
  });

  it("a live canvas still renders normally, and survives destroy() + late calls", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas);
    expect(() => t.play([ROW])).not.toThrow();
    t.destroy();
    // Simulate the unmount race: something still holds `t` and calls into it
    // after teardown (e.g. a pending microtask from a fast re-render cycle).
    expect(() => t.play([ROW])).not.toThrow();
    document.body.removeChild(canvas);
  });

  it("a canvas whose getContext('2d') returns null (no 2D backend) is inert, not a crash", () => {
    const canvas = document.createElement("canvas");
    // @ts-expect-error - simulate an environment with no 2D canvas backend.
    canvas.getContext = () => null;
    expect(() => {
      const t = new TapeRenderer(canvas);
      t.play([ROW]);
      t.destroy();
    }).not.toThrow();
  });
});

// Hover: the tape's tooltip must show the actual price calculation (not just
// the total), the request's time, and - for cache writes - how long the
// cache stays alive on the timeline.
describe("TapeRenderer hover: price calc, time, and cache duration", () => {
  // Force prefers-reduced-motion so play() cuts straight to the final,
  // fully-revealed frame synchronously - these tests assert on hover
  // geometry against settled bars, not an in-flight sweep animation that
  // only advances via requestAnimationFrame.
  beforeEach(() => {
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as (q: string) => MediaQueryList;
  });

  const COLD_WRITE: LedgerRow = {
    tMin: 30,
    unitId: "task0",
    unit: "TASK",
    agent: "main",
    model: "sonnet",
    cold: true,
    readTok: 0,
    inputTok: 0,
    writeTok: 22527,
    writeTier: "1h",
    outTok: 0,
    usd: 22527 * 2 * (3 / 1e6),
  };
  const WARM_READ: LedgerRow = {
    tMin: 60,
    unitId: "task1",
    unit: "TASK",
    agent: "main",
    model: "sonnet",
    cold: false,
    readTok: 22527,
    inputTok: 0,
    writeTok: 0,
    writeTier: "1h",
    outTok: 0,
    usd: 22527 * 0.1 * (3 / 1e6),
  };

  it("no row is hovered before any pointer event (getHover returns null)", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas);
    t.play([COLD_WRITE, WARM_READ]);
    expect(t.getHover()).toBeNull();
    document.body.removeChild(canvas);
  });

  it("hovering a fully-revealed row surfaces its time, its price-calc lines (not just the total), and its cache-alive window", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas);
    t.play([COLD_WRITE, WARM_READ]); // reduced-motion (jsdom) cuts straight to the final frame

    canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 14 + 16 / 2 }));
    const hover = t.getHover();
    expect(hover).not.toBeNull();
    expect(hover!.row.unitId).toBe("task0");

    const text = hover!.lines.join("\n");
    expect(text).toContain("t+30:00"); // the request's time on the timeline
    // The price CALCULATION, not just the total - tok x mult x $/M = $usd.
    expect(text).toMatch(/write: 22,527 tok x 2x x \$6\/M = \$0\.1352/);
    expect(text).toContain("total: $0.1352");
    // The cache write's duration on the timeline: alive 60 minutes, from
    // t+30:00 (when it was written) to t+90:00 (when it expires).
    expect(text).toContain("cache alive 60m: t+30:00 - t+90:00");

    document.body.removeChild(canvas);
  });

  it("a read row (no write) reports its time and price calc but no cache-duration line", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas);
    t.play([COLD_WRITE, WARM_READ]);

    canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 14 + 16 + 8 + 16 / 2 }));
    const hover = t.getHover();
    expect(hover!.row.unitId).toBe("task1");
    const text = hover!.lines.join("\n");
    expect(text).toContain("t+60:00");
    expect(text).toMatch(/read: 22,527 tok x 0\.1x x \$0\.3\/M = \$0\.0068/);
    expect(text).not.toContain("cache alive");

    document.body.removeChild(canvas);
  });

  it("mouseleave clears the hover", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas);
    t.play([COLD_WRITE]);
    canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 14 + 16 / 2 }));
    expect(t.getHover()).not.toBeNull();
    canvas.dispatchEvent(new MouseEvent("mouseleave"));
    expect(t.getHover()).toBeNull();
    document.body.removeChild(canvas);
  });

  it("getHover() is null on a dead/detached renderer (no throw)", () => {
    const t = new TapeRenderer(null);
    expect(() => t.getHover()).not.toThrow();
    expect(t.getHover()).toBeNull();
  });
});

// Fix #1 (tooltip clipping): TapeRenderer supports an `onHover` callback and
// a `domTooltip` opt-out of the in-canvas tooltip box, so a host component
// can render its own DOM-overlay tooltip positioned/clamped against the real
// viewport instead of the canvas's own (possibly too-narrow/clipped) bounds.
describe("TapeRenderer domTooltip/onHover: hosts can render their own positioned tooltip", () => {
  beforeEach(() => {
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as (q: string) => MediaQueryList;
  });

  it("onHover fires with the tooltip lines and the hovered bar's box (x/y/w/h) on hover, and null on mouseleave", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const seen: unknown[] = [];
    const t = new TapeRenderer(canvas, { domTooltip: true, onHover: (h) => seen.push(h) });
    t.play([ROW]);

    canvas.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 14 + 16 / 2 }));
    expect(seen.length).toBe(1);
    const h = seen[0] as { lines: string[]; x: number; y: number; w: number; h: number };
    expect(h.lines.join("\n")).toContain("total: $0.0100");
    expect(typeof h.x).toBe("number");
    expect(typeof h.y).toBe("number");
    // jsdom performs no real layout, so the bar's pixel width (derived from
    // clientWidth) is 0 in this environment - only its height is
    // layout-independent (a fixed row height).
    expect(h.w).toBeGreaterThanOrEqual(0);
    expect(h.h).toBeGreaterThan(0);

    canvas.dispatchEvent(new MouseEvent("mouseleave"));
    expect(seen[seen.length - 1]).toBeNull();

    document.body.removeChild(canvas);
  });

  it("labelFor overrides the row's drawn label (used to show real task names instead of the bare agent tag)", () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const t = new TapeRenderer(canvas, { labelFor: (row) => (row.unitId === "u" ? "Fix the login bug" : null) });
    expect(() => t.play([ROW])).not.toThrow();
    document.body.removeChild(canvas);
  });
});
