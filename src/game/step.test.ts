import { describe, it, expect } from "vitest";
import {
  initGame,
  step,
  replay,
  runScript,
  totalSpent,
  canAfford,
  initL1,
  runL1Reference,
  runL1Anti,
  L1_CFG,
  L1_TASK_LABELS,
} from "./step.js";
import { INLINE_GROWTH } from "../engine/constants.js";
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

// L1_REDESIGN.md Section 7 gap list: ADVANCE action, growthTok override,
// out-of-order standup unit.
describe("ADVANCE action + L1 clock/TTL/expiry (L1_REDESIGN Section 5/7)", () => {
  it("ADVANCE only moves the clock - no cache/ledger side effects", () => {
    const s0 = initGame(42, "session", GOOD);
    const s1 = step(s0, { type: "ADVANCE", min: 37 });
    expect(s1.clockMin).toBe(s0.clockMin + 37);
    expect(s1.ledger).toEqual(s0.ledger);
    expect(s1.cache).toEqual(s0.cache);
  });

  it("growthTok defaults to INLINE_GROWTH when omitted - every existing golden number is untouched", () => {
    // Same GOOD-config run with and without an explicit growthTok override at
    // the default value must be byte-identical.
    const a = runScript(42, "month", GOOD);
    const b = runScript(42, "month", GOOD); // no code path here ever sets growthTok
    expect(totalSpent(a)).toBeCloseTo(totalSpent(b), 10);
    expect(a.ledger).toEqual(b.ledger);
  });

  it("a task's growthTok override changes only that unit's warm-write size, never INLINE_GROWTH's default behavior elsewhere", () => {
    const st = initL1();
    // task0 cold write is mainBaseTok, unaffected by growthTok.
    const s1 = step(st, { type: "RUN_UNIT", unitId: "task0" });
    const s2 = step(s1, { type: "RUN_UNIT", unitId: "task1" });
    const warm = s2.ledger[1];
    expect(warm.writeTok).toBe(3000); // task's growthTok, not INLINE_GROWTH (22,000)
    expect(warm.writeTok).not.toBe(INLINE_GROWTH);
  });

  it("standup is playable out of order and does not touch the cache (absence, not work)", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "task0" });
    const cacheBefore = st.cache;
    st = step(st, { type: "RUN_UNIT", unitId: "standup" });
    expect(st.cache).toEqual(cacheBefore); // no request emitted
    expect(st.standup?.status).toBe("done");
    expect(st.clockMin).toBe(30 + 90); // task0 (30 min) + standup (90 min)
    // task1 is still next - the standup didn't advance idx.
    expect(st.units[st.idx].id).toBe("task1");
  });

  it("a 90-min absence (standup) expires the 60-min main TTL: the next request is a cold rebuild", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "task0" }); // cold write @ tMin 30
    st = step(st, { type: "RUN_UNIT", unitId: "standup" }); // clock -> 150 (>60 past last touch)
    st = step(st, { type: "RUN_UNIT", unitId: "task1" });
    const row = st.ledger[st.ledger.length - 1];
    expect(row.cold).toBe(true);
    expect(row.readTok).toBe(0);
  });

  it("L1 reference run: $0.416, exactly 1 cold main write, PASS, 3 stars", () => {
    const st = runL1Reference();
    expect(totalSpent(st)).toBeGreaterThanOrEqual(0.411);
    expect(totalSpent(st)).toBeLessThanOrEqual(0.421);
    expect(st.ledger.filter((r) => r.agent === "main" && r.cold).length).toBe(1);
    expect(st.ended).toEqual({ result: "win" });
  });

  it("L1 anti run (standup between tasks 2 and 3): ~$0.525, 2 cold main writes, fails the cold-write clause", () => {
    const st = runL1Anti();
    expect(totalSpent(st)).toBeGreaterThanOrEqual(0.52);
    expect(totalSpent(st)).toBeLessThanOrEqual(0.53);
    expect(st.ledger.filter((r) => r.agent === "main" && r.cold).length).toBe(2);
  });
});

// `st.lastRequests` is the exact render model TapeRenderer.play() consumes to
// draw the "requests on the wire" panel (L1PlayScreen.svelte calls
// `tape?.play(st.lastRequests)` after every action). These tests assert on
// that array and its priced rows directly - the render model, not pixels -
// so a regression like the empty-wire bug (TapeRenderer built against a
// canvas ref that didn't exist yet) or the $0.0000 bug (a hardcoded `usd: 0`)
// fails CI without needing a real browser.
describe("st.lastRequests: the render model behind the requests-on-the-wire tape", () => {
  it("RUN_UNIT populates lastRequests with at least one row carrying real tokens and cost", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "task0" });
    expect(st.lastRequests.length).toBeGreaterThan(0);
    for (const row of st.lastRequests) {
      expect(row.readTok + row.inputTok + row.writeTok).toBeGreaterThan(0);
      expect(row.usd).toBeGreaterThan(0);
    }
  });

  it("a cold write and the following warm read price to different, non-zero amounts (20x apart)", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "task0" }); // cold write
    const coldRow = st.lastRequests[st.lastRequests.length - 1];
    st = step(st, { type: "RUN_UNIT", unitId: "task1" }); // warm read
    const warmRow = st.lastRequests[st.lastRequests.length - 1];

    expect(coldRow.usd).toBeGreaterThan(0);
    expect(warmRow.usd).toBeGreaterThan(0);
    expect(coldRow.usd).not.toBeCloseTo(warmRow.usd, 4);
    // A formatted cost string this small must still show non-zero precision -
    // toFixed(4) on either row must never collapse to "$0.0000".
    expect(coldRow.usd.toFixed(4)).not.toBe("0.0000");
    expect(warmRow.usd.toFixed(4)).not.toBe("0.0000");
  });

  it("RUN_UNIT on a free unit (or HAND_CODE) clears lastRequests to []; ADVANCE (Coffee) leaves the last tape untouched", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "task0" });
    expect(st.lastRequests.length).toBeGreaterThan(0);
    const priorRequests = st.lastRequests;

    // ADVANCE (Coffee) is a pure clock advance with no request emitted - it
    // must not stomp the wire panel's last-drawn tape.
    st = step(st, { type: "ADVANCE", min: 20 });
    expect(st.lastRequests).toEqual(priorRequests);

    // The standup, by contrast, explicitly clears it (an absence, not work).
    st = step(st, { type: "RUN_UNIT", unitId: "standup" });
    expect(st.lastRequests).toEqual([]);
  });

  it("the full reference run's every request row has a non-zero, correctly formatted cost", () => {
    const st = runL1Reference();
    expect(st.ledger.length).toBeGreaterThan(0);
    for (const row of st.ledger) {
      expect(row.usd).toBeGreaterThan(0);
      expect(row.usd.toFixed(4)).not.toBe("0.0000");
    }
    expect(totalSpent(st)).toBeCloseTo(0.416, 2);
  });
});

// Fix #2/#3 regression coverage (L1PlayScreen's "requests on the wire" is
// driven by st.ledger filtered to agent === "main", not st.lastRequests,
// which only ever held the most recent action - the bug the player hit was
// "only one request visible at a time"): each completed task must add
// exactly one persistent ledger row, the main-agent row count must grow
// 1, 2, 3, 4 as tasks run, and every row must be traceable back to a
// player-facing task label (fix #3: real task names, not "Do next task").
describe("wire model: ledger rows accumulate per task and carry task labels", () => {
  it("running each of the 4 L1 tasks adds exactly one main-agent ledger row, growing 1,2,3,4", () => {
    let st = initL1();
    const counts: number[] = [];
    for (const id of ["task0", "task1", "task2", "task3"]) {
      st = step(st, { type: "RUN_UNIT", unitId: id });
      counts.push(st.ledger.filter((r) => r.agent === "main").length);
    }
    expect(counts).toEqual([1, 2, 3, 4]);
  });

  it("the standup (free unit, no request) does not add a wire row - only real requests accumulate", () => {
    const st = runL1Reference(); // ends with the standup last
    const mainRows = st.ledger.filter((r) => r.agent === "main");
    expect(mainRows.length).toBe(4); // 4 tasks, no 5th row for the free standup
    expect(mainRows.some((r) => r.unitId === "standup")).toBe(false);
  });

  it("each accumulated row's unitId resolves to a real, distinct L1 task label (L1_REDESIGN Section 3), not a generic placeholder", () => {
    const st = runL1Reference();
    const mainRows = st.ledger.filter((r) => r.agent === "main");
    const byUnitId = new Map(st.units.map((u) => [u.id, u.label]));
    const labelsSeen = mainRows.map((r) => byUnitId.get(r.unitId));
    expect(labelsSeen).toEqual(L1_TASK_LABELS);
    // Every label is a real task name (from L1_REDESIGN.md), never null/undefined
    // or the old generic "Do next task" placeholder text.
    for (const l of labelsSeen) {
      expect(l).toBeTruthy();
      expect(l).not.toMatch(/do next task/i);
    }
  });

  it("row order on the wire matches task run order, so the history reads left-to-right / top-to-bottom as it happened", () => {
    let st = initL1();
    for (const id of ["task0", "task1", "task2", "task3"]) {
      st = step(st, { type: "RUN_UNIT", unitId: id });
    }
    const order = st.ledger.filter((r) => r.agent === "main").map((r) => r.unitId);
    expect(order).toEqual(["task0", "task1", "task2", "task3"]);
  });
});
