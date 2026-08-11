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
  L1_RED_BLUE_LABELS,
  initL2,
  runL2Coffee,
  runL2Standup,
  initL3,
  runL3Followup,
  runL3Boot,
} from "./step.js";
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

describe("redesigned L1: real cache tradeoff", () => {
  it("ADVANCE only moves the clock - no cache/ledger side effects", () => {
    const s0 = initGame(42, "session", GOOD);
    const s1 = step(s0, { type: "ADVANCE", min: 37 });
    expect(s1.clockMin).toBe(s0.clockMin + 37);
    expect(s1.ledger).toEqual(s0.ledger);
    expect(s1.cache).toEqual(s0.cache);
  });

  it("prices the cold first request and warm second request from the canonical engine", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r1" });
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r2" });
    expect(st.ledger[0]).toMatchObject({ readTok: 0, inputTok: 12, writeTok: 34_738, outTok: 120, cold: true });
    expect(st.ledger[0].usd).toBeCloseTo(0.210264, 12);
    expect(st.ledger[1]).toMatchObject({ readTok: 34_738, inputTok: 14, writeTok: 0, outTok: 120, cold: false });
    expect(st.ledger[1].usd).toBeCloseTo(0.0122634, 12);
    expect(st.cache.entries["l1-main"].prefixTok).toBe(34_738);
  });

  it("same-chat route realizes the spend benefit in state", () => {
    const st = runL1Reference();
    expect(st.l1Route).toBe("same-chat");
    expect(st.ledger[2]).toMatchObject({ readTok: 34_738, inputTok: 13, writeTok: 0, cold: false });
    expect(st.ledger[2].usd).toBeCloseTo(0.0122604, 12);
    expect(totalSpent(st)).toBeCloseTo(0.2347878, 12);
    expect(st.clockMin).toBe(12);
    expect(st.ledger.filter((r) => r.agent === "main" && r.cold).length).toBe(1);
    expect(st.ended).toEqual({ result: "win" });
  });

  it("isolated route realizes the time benefit through a separate cold namespace", () => {
    const st = runL1Anti();
    expect(st.l1Route).toBe("isolated");
    expect(st.ledger[2]).toMatchObject({ readTok: 0, inputTok: 13, writeTok: 34_738, cold: true });
    expect(st.ledger[2].usd).toBeCloseTo(0.210267, 12);
    expect(totalSpent(st)).toBeCloseTo(0.4327944, 12);
    expect(st.clockMin).toBe(4);
    expect(st.ledger.filter((r) => r.agent === "main" && r.cold).length).toBe(2);
    expect(st.cache.entries["l1-main"]).toBeDefined();
    expect(st.cache.entries["l1-clean"]).toBeDefined();
    expect(st.ended).toEqual({ result: "win" });
  });

  it("route choice and prediction have no economic side effects; prediction gates request three", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r1" });
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r2" });
    const before = JSON.stringify({ ledger: st.ledger, wallet: st.wallet, clockMin: st.clockMin });
    st = step(st, { type: "CHOOSE_L1_ROUTE", route: "isolated" });
    expect(JSON.stringify({ ledger: st.ledger, wallet: st.wallet, clockMin: st.clockMin })).toBe(before);
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r3" });
    expect(st.ledger).toHaveLength(2);
    st = step(st, { type: "COMMIT_L1_PREDICTION" });
    expect(st.ledger).toHaveLength(2);
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r3" });
    expect(st.ledger).toHaveLength(3);
  });

  it("does not pass until the post-reveal causal explanation is acknowledged", () => {
    let st = initL1();
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r1" });
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r2" });
    st = step(st, { type: "CHOOSE_L1_ROUTE", route: "same-chat" });
    st = step(st, { type: "COMMIT_L1_PREDICTION" });
    st = step(st, { type: "RUN_UNIT", unitId: "l1-r3" });
    expect(st.ended).toBeNull();
    st = step(st, { type: "ACK_L1_EXPLANATION", correct: false });
    expect(st.ended).toBeNull();
    st = step(st, { type: "ACK_L1_EXPLANATION", correct: true });
    expect(st.ended).toEqual({ result: "win" });
  });

  it("keeps three distinct task labels in ledger order", () => {
    const st = runL1Reference();
    const labels = st.ledger.map((row) => st.units.find((u) => u.id === row.unitId)?.label);
    expect(labels).toEqual(L1_RED_BLUE_LABELS);
  });
});

describe("redesigned L2: idle expiry schedule tradeoff", () => {
  it("prices the opening check as a canonical 1-hour Sonnet cache write", () => {
    const s0 = initL2();
    const st = step(s0, { type: "SEND_L2_CHECK" });
    expect(st.ledger).toHaveLength(1);
    expect(st.ledger[0]).toMatchObject({
      unitId: "R2_1", readTok: 0, inputTok: 0, writeTok: 34_738,
      writeTier: "1h", outTok: 0, cold: true,
    });
    expect(st.ledger[0].usd).toBeCloseTo(0.208428, 12);
    expect(st.wallet).toBeCloseTo(0.441572, 12);
    expect(st.cache.entries["l2-main"]).toMatchObject({ prefixTok: 34_738, lastTouchMin: 0 });
  });

  it("Coffee preserves the live entry, spends less, and completes at minute 110", () => {
    const st = runL2Coffee();
    expect(st.l2Profile).toBe("coffee");
    expect(st.ledger[1]).toMatchObject({
      unitId: "R2_2", readTok: 34_738, inputTok: 0, writeTok: 0, outTok: 0, cold: false,
    });
    expect(st.ledger[1].usd).toBeCloseTo(0.0104214, 12);
    expect(totalSpent(st)).toBeCloseTo(0.2188494, 12);
    expect(st.cache.entries["l2-main"].lastTouchMin).toBe(20);
    expect(st.clockMin).toBe(110);
    expect(st.units[0].status).toBe("done");
    expect(st.ended).toEqual({ result: "win" });
  });

  it("Standup clears real work first, expires the entry, and completes at minute 90", () => {
    const st = runL2Standup();
    expect(st.l2Profile).toBe("standup");
    expect(st.ledger[1]).toMatchObject({
      unitId: "R2_2", readTok: 0, inputTok: 0, writeTok: 34_738, outTok: 0, cold: true,
    });
    expect(st.ledger[1].usd).toBeCloseTo(0.208428, 12);
    expect(totalSpent(st)).toBeCloseTo(0.416856, 12);
    expect(st.clockMin).toBe(90);
    expect(st.units[0].status).toBe("done");
    expect(st.ended).toEqual({ result: "win" });
  });

  it("locks profiles and gates the follow-up behind a committed prediction", () => {
    let st = initL2();
    st = step(st, { type: "SEND_L2_CHECK" });
    st = step(st, { type: "CHOOSE_L2_PROFILE", profile: "coffee" });
    st = step(st, { type: "CHOOSE_L2_PROFILE", profile: "standup" });
    expect(st.l2Profile).toBe("coffee");
    st = step(st, { type: "ADVANCE", min: 20 });
    st = step(st, { type: "SEND_L2_CHECK" });
    expect(st.ledger).toHaveLength(1);
    st = step(st, { type: "COMMIT_L2_PREDICTION" });
    st = step(st, { type: "SEND_L2_CHECK" });
    expect(st.ledger).toHaveLength(2);
  });

  it("requires a correct post-reveal explanation without punishing wrong attempts", () => {
    let st = initL2();
    st = step(st, { type: "SEND_L2_CHECK" });
    st = step(st, { type: "CHOOSE_L2_PROFILE", profile: "standup" });
    st = step(st, { type: "RUN_UNIT", unitId: "u2-blocker-standup" });
    st = step(st, { type: "COMMIT_L2_PREDICTION" });
    st = step(st, { type: "SEND_L2_CHECK" });
    st = step(st, { type: "ACK_L2_EXPLANATION", correct: true });
    expect(st.ended).toBeNull();
    st = step(st, { type: "REVEAL_L2_FOLLOWUP" });
    const economics = JSON.stringify({ ledger: st.ledger, wallet: st.wallet, clockMin: st.clockMin });
    st = step(st, { type: "ACK_L2_EXPLANATION", correct: false });
    expect(JSON.stringify({ ledger: st.ledger, wallet: st.wallet, clockMin: st.clockMin })).toBe(economics);
    expect(st.ended).toBeNull();
    st = step(st, { type: "ACK_L2_EXPLANATION", correct: true });
    expect(st.ended).toEqual({ result: "win" });
  });
});

describe("redesigned L3: first-mismatch prefix tradeoff", () => {
  it("seeds the canonical five-block stack and gates every request behind prediction", () => {
    let st = initL3();
    expect(st.l3MainPrefix?.map((block) => block.label)).toEqual([
      "SYSTEM", "TOOLS", "INSTRUCTIONS", "HISTORY", "CURRENT",
    ]);
    expect(st.l3MainPrefix?.map((block) => block.tokenCount)).toEqual([
      2_750, 16_295, 2_610, 13_083, 6_000,
    ]);
    st = step(st, { type: "SEND_L3_REQUEST" });
    expect(st.ledger).toHaveLength(0);
    const before = JSON.stringify({ wallet: st.wallet, clockMin: st.clockMin, ledger: st.ledger });
    st = step(st, { type: "COMMIT_L3_PREDICTION", stage: "cold" });
    expect(JSON.stringify({ wallet: st.wallet, clockMin: st.clockMin, ledger: st.ledger })).toBe(before);
    st = step(st, { type: "SEND_L3_REQUEST" });
    expect(st.ledger).toHaveLength(1);
    expect(st.ledger[0]).toMatchObject({
      unitId: "R1_COLD", readTok: 0, writeTok: 34_738, inputTok: 6_000, outTok: 44_000,
    });
    expect(st.ledger[0].usd).toBeCloseTo(0.886428, 12);
  });

  it("FOLLOW-UP preserves 21,655 tokens, spends least, and finishes at minute 58", () => {
    const st = runL3Followup();
    expect(st.l3Placement).toBe("followup");
    expect(st.ledger).toHaveLength(4);
    expect(st.ledger[1]).toMatchObject({
      unitId: "R2_IDENTICAL", readTok: 34_738, writeTok: 0, inputTok: 6_000, outTok: 44_000,
    });
    expect(st.ledger[1].usd).toBeCloseTo(0.6884214, 12);
    expect(st.ledger[2]).toMatchObject({
      unitId: "R3_LATE_CHANGE", readTok: 21_655, writeTok: 13_083, inputTok: 6_000, outTok: 44_000,
    });
    expect(st.ledger[2].usd).toBeCloseTo(0.7629945, 12);
    expect(st.ledger[3]).toMatchObject({
      unitId: "R4_HISTORY_REAPPLIED", readTok: 34_738, writeTok: 0, inputTok: 100, outTok: 100,
    });
    expect(st.ledger[3].usd).toBeCloseTo(0.0122214, 12);
    expect(totalSpent(st)).toBeCloseTo(2.3500653, 12);
    expect(st.wallet).toBeCloseTo(0.1499347, 12);
    expect(st.clockMin).toBe(58);
    expect(st.completedTransferIds).toContain("l3-reapplied-history");
    expect(st.ended).toEqual({ result: "win" });
  });

  it("BOOT PATCH rewrites the full cached front but persists into the minute-50 handoff", () => {
    const st = runL3Boot();
    expect(st.l3Placement).toBe("boot");
    expect(st.ledger[2]).toMatchObject({
      unitId: "R3_EARLY_CHANGE", readTok: 0, writeTok: 34_738, inputTok: 6_000, outTok: 44_000,
    });
    expect(st.ledger[2].usd).toBeCloseTo(0.886428, 12);
    expect(st.ledger[3]).toMatchObject({
      unitId: "R4_BOOT_PERSISTED", readTok: 34_738, writeTok: 0, inputTok: 100, outTok: 100,
    });
    expect(totalSpent(st)).toBeCloseTo(2.4734988, 12);
    expect(st.wallet).toBeCloseTo(0.0265012, 12);
    expect(st.clockMin).toBe(50);
    expect(st.l3HandoffPrefix?.find((block) => block.kind === "system")?.identityHash)
      .toBe("system-v2-reminder");
    expect(st.completedTransferIds).toContain("l3-persisted-policy-read");
    expect(st.ended).toEqual({ result: "win" });
  });

  it("records the real first mismatch and cannot switch placement after choosing", () => {
    let st = initL3();
    for (const stage of ["cold", "repeat"] as const) {
      st = step(st, { type: "COMMIT_L3_PREDICTION", stage });
      st = step(st, { type: "SEND_L3_REQUEST" });
    }
    st = step(st, {
      type: "SET_PREFIX_BLOCK_CONTENT", contextId: "l3-main", blockId: "PB_HISTORY_L3",
      identityHash: "history-v2-reminder", tokenCount: 13_083,
    });
    st = step(st, {
      type: "SET_PREFIX_BLOCK_CONTENT", contextId: "l3-main", blockId: "PB_SYSTEM_L3",
      identityHash: "system-v2-reminder", tokenCount: 2_750,
    });
    expect(st.l3Placement).toBe("followup");
    expect(st.l3FirstMismatchBlockId).toBe("PB_HISTORY_L3");
    expect(st.l3MatchedPrefixTok).toBe(21_655);
    expect(st.l3InvalidatedSuffixTok).toBe(13_083);
  });
});
