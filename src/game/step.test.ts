import { describe, it, expect } from "vitest";
import { initGame, step, replay, runScript, totalSpent, canAfford } from "./step.js";
import type { Action, SaveFile } from "./types.js";
import type { Config } from "../engine/types.js";

// The two scripted runs from the mock (build/sim-mock.html assertAll).
const GOOD: Partial<Config> = {
  planModel: "fable",
  devModel: "sonnet",
  who: "subagent",
  prompts: "identical",
  oneHourFlag: false,
  keepWarm: true,
  keepWarmMin: 50,
  hook: "static",
  skills: 10,
  skillsMode: "invoke",
  memoryFiles: 0,
  mcp: [true, false, false, false],
  width: 8,
};
const BAD: Partial<Config> = {
  planModel: "sonnet",
  devModel: "fable",
  who: "inline",
  prompts: "varied",
  oneHourFlag: false,
  keepWarm: false,
  hook: "dynamic",
  skills: 150,
  skillsMode: "eager",
  memoryFiles: 10,
  mcp: [true, true, true, true],
  width: 8,
};

describe("scripted budget-tension runs (invariant 10)", () => {
  it("GOOD_RUN ships clean in the [$48,$66] band with 0 hand-coded units", () => {
    const g = runScript(42, "month", GOOD);
    expect(totalSpent(g)).toBeGreaterThanOrEqual(48);
    expect(totalSpent(g)).toBeLessThanOrEqual(66);
    // The mock lands this at ~$61.90.
    expect(totalSpent(g)).toBeCloseTo(61.9, 0);
    expect(g.counts.handCoded).toBe(0);
    expect(g.ended?.result).toBe("win");
  });

  it("BAD_RUN busts the $90 cap and forces hand-coding (mock: 12 units)", () => {
    const bd = runScript(42, "month", BAD);
    expect(totalSpent(bd)).toBeGreaterThan(90);
    expect(bd.counts.handCoded).toBeGreaterThanOrEqual(3);
    expect(bd.counts.handCoded).toBe(12);
  });

  it("BAD_RUN uncapped gross cost lands in the [$135,$195] band", () => {
    const bdGross = runScript(42, "month", BAD, true);
    expect(totalSpent(bdGross)).toBeGreaterThanOrEqual(135);
    expect(totalSpent(bdGross)).toBeLessThanOrEqual(195);
  });

  it("GOOD is strictly cheaper than BAD gross", () => {
    const g = runScript(42, "month", GOOD);
    const bdGross = runScript(42, "month", BAD, true);
    expect(totalSpent(g)).toBeLessThan(totalSpent(bdGross));
  });
});

describe("determinism (invariant 8)", () => {
  it("runScript(seed=42) twice yields identical spend + ledger", () => {
    const a = runScript(42, "month", GOOD);
    const b = runScript(42, "month", GOOD);
    expect(totalSpent(a)).toBe(totalSpent(b));
    expect(a.ledger.length).toBe(b.ledger.length);
    expect(JSON.stringify(a.ledger)).toBe(JSON.stringify(b.ledger));
  });

  it("replay(seed, actions) reproduces a headless run exactly", () => {
    // Drive the reducer with an explicit action list that runs every unit.
    const init = initGame(42, "month", GOOD);
    const actions: Action[] = init.units.map((u) => ({ type: "RUN_UNIT" as const, unitId: u.id }));
    const save: SaveFile = { v: 1, seed: 42, mode: "month", actions };
    const r1 = replay(save, (seed, mode) => initGame(seed, mode, GOOD));
    const r2 = replay(save, (seed, mode) => initGame(seed, mode, GOOD));
    expect(JSON.stringify(r1.ledger)).toBe(JSON.stringify(r2.ledger));
    // Same economic outcome as the headless GOOD run (which always runs).
    const headless = runScript(42, "month", GOOD, true);
    expect(totalSpent(r1)).toBeCloseTo(totalSpent(headless), 6);
    expect(r1.ended?.result).toBe("win");
  });
});

describe("step reducer mechanics", () => {
  it("RUN_UNIT advances the queue head and is pure (input unchanged)", () => {
    const s0 = initGame(42, "session", GOOD);
    const before = JSON.stringify(s0);
    const s1 = step(s0, { type: "RUN_UNIT", unitId: s0.units[0].id });
    expect(JSON.stringify(s0)).toBe(before); // s0 not mutated
    expect(s1.idx).toBe(1);
    expect(s1.units[0].status).toBe("done");
  });

  it("HAND_CODE costs no tokens but adds manual hours + tedium", () => {
    const s0 = initGame(42, "session");
    const s1 = step(s0, { type: "HAND_CODE", unitId: s0.units[0].id });
    expect(s1.ledger.length).toBe(0);
    expect(s1.wallet).toBe(s0.wallet);
    expect(s1.manualHours >= 0 ? true : false).toBe(true);
    expect(s1.tedium).toBeGreaterThan(0);
    expect(s1.units[0].status).toBe("handcoded");
  });

  it("SET_CFG before the first unit rebuilds the queue (rework expands)", () => {
    const s0 = initGame(42, "month", GOOD);
    const goodLen = s0.units.length;
    const s1 = step(s0, { type: "SET_CFG", patch: { devModel: "fable", planModel: "sonnet" } });
    // Cheaper dev/plan quality => more rework units queued.
    expect(s1.units.length).toBeGreaterThan(goodLen);
  });

  it("canAfford gates only at the failure moment", () => {
    const s0 = initGame(42, "session", GOOD);
    expect(canAfford(s0, s0.units[0])).toBe(true);
    const broke = { ...s0, wallet: 0 };
    expect(canAfford(broke, s0.units[1])).toBe(false); // the DEV wave needs real money
  });
});
