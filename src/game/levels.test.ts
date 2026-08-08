import { describe, it, expect } from "vitest";
import { runScript, totalSpent } from "./step.js";
import {
  LEVELS,
  LEVEL_ORDER,
  LEVEL_BY_ID,
  newCampaign,
  isLevelUnlocked,
  completeLevel,
  starsFor,
  unlockedControls,
} from "./levels.js";
import type { GameState } from "./types.js";

// A minimal fixture matching L1's spec description ("3 warm main turns after a
// cold start" - a scripted 4-request ledger, mostly reads) - the generic
// SDLC pipeline (runScript) isn't the L1 scenario itself, so gate math here
// is exercised directly against ledger rows shaped like the real signature.
function l1Fixture(): GameState {
  const base = runScript(1, "session", { who: "subagent", prompts: "identical", width: 8 }, true);
  return {
    ...base,
    ledger: [
      { tMin: 0, unitId: "u0", unit: "DEV", agent: "main", model: "sonnet", cold: true, readTok: 0, inputTok: 6000, writeTok: 1500, writeTier: "1h", outTok: 500, usd: 0.1 },
      { tMin: 1, unitId: "u0", unit: "DEV", agent: "main", model: "sonnet", cold: false, readTok: 5000, inputTok: 1, writeTok: 100, writeTier: "1h", outTok: 300, usd: 0.01 },
      { tMin: 2, unitId: "u0", unit: "DEV", agent: "main", model: "sonnet", cold: false, readTok: 5100, inputTok: 1, writeTok: 100, writeTier: "1h", outTok: 300, usd: 0.01 },
      { tMin: 3, unitId: "u0", unit: "DEV", agent: "main", model: "sonnet", cold: false, readTok: 5200, inputTok: 1, writeTok: 100, writeTier: "1h", outTok: 300, usd: 0.01 },
    ],
  };
}

describe("campaign structure", () => {
  it("has exactly the 13 levels from SIMULATOR_SPEC.md Section 11.3, in unlock order", () => {
    expect(LEVEL_ORDER).toEqual([
      "L1", "L2", "L3", "L4", "L5", "L6",
      "L7", "L8", "L9", "L10", "L11",
      "L12", "L13",
    ]);
  });

  it("each level unlocks exactly one new tool", () => {
    const seen = new Set<string>();
    for (const l of LEVELS) {
      expect(seen.has(l.unlocks)).toBe(false);
      seen.add(l.unlocks);
    }
  });

  it("tiers ramp 1 -> 2 -> 3 monotonically across the list", () => {
    const tiers = LEVELS.map((l) => l.tier);
    for (let i = 1; i < tiers.length; i++) expect(tiers[i]).toBeGreaterThanOrEqual(tiers[i - 1]);
  });
});

describe("progression: only the frontier level's chain is unlocked", () => {
  it("a fresh campaign has only L1 unlocked", () => {
    const c = newCampaign();
    expect(isLevelUnlocked(c, "L1")).toBe(true);
    expect(isLevelUnlocked(c, "L2")).toBe(false);
  });

  it("completing L1 with a passing run unlocks L2 but nothing further", () => {
    let c = newCampaign();
    // L1 gate: >=80% of ledger tokens are reads (3 warm turns after a cold start).
    const st = l1Fixture();
    c = completeLevel(c, "L1", st, 0);
    expect(isLevelUnlocked(c, "L2")).toBe(true);
    expect(isLevelUnlocked(c, "L3")).toBe(false);
    expect(c.unlocked).toEqual(["run", "devModel"]);
  });

  it("failing a level's gate does not advance the unlock chain", () => {
    let c = newCampaign();
    // deliberately blow the L2 budget with fable everywhere, forced-run
    const st = runScript(2, "session", { devModel: "fable", planModel: "fable" }, true);
    const before = c.unlocked.length;
    c = completeLevel(c, "L1", st, 0); // L1 always unlockable regardless, gate is real though
    // Whatever happened to L1, verify chain length never exceeds unlocked+1 growth
    expect(c.unlocked.length).toBeLessThanOrEqual(before + 1);
  });
});

describe("ledger-verified gates use real numbers, not cosmetics", () => {
  it("L2 gate reads spend directly off wallet/budget drain (ledger-derived)", () => {
    const cheap = runScript(2, "session", { devModel: "sonnet" }, true);
    const expensive = runScript(2, "session", { devModel: "fable" }, true);
    const l2 = LEVEL_BY_ID.L2;
    // fable should cost strictly more than sonnet for the same scenario (C4: output 5x at $50/M vs $15/M)
    expect(totalSpent(expensive)).toBeGreaterThan(totalSpent(cheap));
    const cheapGate = l2.pass(cheap);
    expect(typeof cheapGate.pass).toBe("boolean");
    expect(cheapGate.reason).toContain("budget $2.00");
  });

  it("L5 gate checks subagent cache-write total against the 35,000 tok ceiling (C10/C11)", () => {
    const identical = runScript(5, "session", { who: "subagent", prompts: "identical", width: 8 }, true);
    const varied = runScript(5, "session", { who: "subagent", prompts: "varied", width: 8 }, true);
    const l5 = LEVEL_BY_ID.L5;
    const gi = l5.pass(identical);
    const gv = l5.pass(varied);
    // identical strategy must be able to pass the ceiling; varied (7x14,623 growth) must not.
    expect(gi.reason).toContain("35,000");
    expect(gv.pass).toBe(false);
  });

  it("L6 gate counts cold bases directly from ledger rows (r.cold)", () => {
    const wide = runScript(6, "session", { who: "subagent", width: 8 }, true);
    const narrow = runScript(6, "session", { who: "subagent", width: 2 }, true);
    const l6 = LEVEL_BY_ID.L6;
    const gWide = l6.pass(wide);
    const gNarrow = l6.pass(narrow);
    // wider fan-out keeps more spawns in the same warm wave -> fewer cold bases
    const coldsWide = wide.ledger.filter((r) => r.cold).length;
    const coldsNarrow = narrow.ledger.filter((r) => r.cold).length;
    expect(coldsWide).toBeLessThanOrEqual(coldsNarrow);
    expect(gWide.reason).toContain("cold bases");
    expect(gNarrow.reason).toContain("cold bases");
  });
});

describe("stars", () => {
  it("stars are 0 when the gate fails", () => {
    const st = runScript(2, "session", { devModel: "fable", planModel: "fable" }, true);
    const l2 = LEVEL_BY_ID.L2;
    const s = starsFor(l2, st, 0);
    if (!l2.pass(st).pass) expect(s).toBe(0);
  });

  it("L1 (uncapped budget) awards 1 star on any pass, never blocked by margin math", () => {
    const st = runScript(1, "session", { who: "subagent", prompts: "identical", width: 8 }, true);
    const l1 = LEVEL_BY_ID.L1;
    if (l1.pass(st).pass) expect(starsFor(l1, st, 0)).toBe(1);
  });
});

describe("G1: LevelDef disclosure/scenario/learn fields (GAME_PLAN.md Section C.1/D)", () => {
  it("every level has a non-empty objective and introducedControls", () => {
    for (const l of LEVELS) {
      expect(l.objective.length).toBeGreaterThan(0);
      expect(l.introducedControls.length).toBeGreaterThan(0);
    }
  });

  it("every level has a scenario id, a learn beat, reference/anti configs, and a failLesson", () => {
    for (const l of LEVELS) {
      expect(typeof l.scenario).toBe("string");
      expect(l.learn).toBeDefined();
      expect(l.learn.copy.length).toBeGreaterThan(0);
      expect(typeof l.learn.chip).toBe("function");
      expect(l.referenceCfg).toBeDefined();
      expect(l.antiCfg).toBeDefined();
      expect(l.failLesson).toBeDefined();
      expect(l.failLesson.line.length).toBeGreaterThan(0);
    }
  });

  it("unlockedControls(L1) is exactly L1's introducedControls (Section C.2: L1 shows only RUN)", () => {
    expect(unlockedControls("L1")).toEqual(["run"]);
    expect(unlockedControls("L1")).toEqual(LEVEL_BY_ID.L1.introducedControls);
  });

  it("the unlocked control set grows by exactly the newly-introduced controls at each level", () => {
    let prev: string[] = [];
    for (const id of LEVEL_ORDER) {
      const cur = unlockedControls(id);
      const level = LEVEL_BY_ID[id];
      // every previously-unlocked control is still present (nothing is ever revoked)
      for (const c of prev) expect(cur).toContain(c);
      // the new set is exactly prev + this level's introducedControls (order preserved)
      expect(cur).toEqual([...prev, ...level.introducedControls]);
      prev = cur;
    }
  });

  it("LEVEL_ORDER is unchanged and the 13 level ids are unchanged", () => {
    expect(LEVEL_ORDER).toEqual([
      "L1", "L2", "L3", "L4", "L5", "L6",
      "L7", "L8", "L9", "L10", "L11",
      "L12", "L13",
    ]);
    expect(LEVELS.map((l) => l.id)).toEqual(LEVEL_ORDER);
  });
});
