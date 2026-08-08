// tape.test.ts - TapeRenderer robustness: it must never throw when handed a
// missing/detached canvas, and must stay inert after destroy() even if a
// caller keeps holding a reference and calling into it (the exact race the
// L1 component/e2e suite hit: a component's onMount fires against a canvas
// ref that's already gone because the component was torn down first).
import { describe, it, expect } from "vitest";
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
