import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  toMap,
  enterLevel,
  toPlay,
  toResult,
  toFreeplay,
  retryLevel,
  saveCampaign,
  loadCampaign,
  clearCampaign,
} from "./shell.js";
import { newCampaign, completeLevel, LEVEL_BY_ID } from "./levels.js";
import { runScript } from "./step.js";

describe("shell transitions (Section B.1)", () => {
  it("toMap / enterLevel / toPlay / toResult / toFreeplay / retryLevel", () => {
    expect(toMap()).toEqual({ id: "map" });
    expect(enterLevel("L1")).toEqual({ id: "learn", level: "L1" });
    expect(toPlay("L1")).toEqual({ id: "play", level: "L1" });
    expect(toFreeplay(["run"])).toEqual({ id: "freeplay", toolset: ["run"] });
    expect(retryLevel("L2")).toEqual({ id: "learn", level: "L2" });

    const st = runScript(1, "session", {}, true);
    const outcome = {
      pass: true,
      stars: 1 as const,
      reason: "ok",
      spentUsd: 1,
      handCoded: 0,
      finalState: st,
    };
    expect(toResult("L1", outcome)).toEqual({ id: "result", level: "L1", outcome });
  });
});

describe("shell persistence (Section B.2)", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  it("round-trips a saved campaign", () => {
    let campaign = newCampaign();
    const st = runScript(LEVEL_BY_ID.L1.seed, LEVEL_BY_ID.L1.scope, LEVEL_BY_ID.L1.referenceCfg, false);
    campaign = completeLevel(campaign, "L1", st, st.counts.handCoded);
    saveCampaign(campaign);
    const loaded = loadCampaign();
    expect(loaded.unlocked).toEqual(campaign.unlocked);
    expect(loaded.currentTier).toEqual(campaign.currentTier);
    expect(loaded.levels.L1.stars).toEqual(campaign.levels.L1.stars);
    expect(loaded.levels.L1.attempts).toEqual(campaign.levels.L1.attempts);
  });

  it("missing save falls back to newCampaign()", () => {
    clearCampaign();
    expect(loadCampaign()).toEqual(newCampaign());
  });

  it("corrupt save falls back to newCampaign()", () => {
    localStorage.setItem("cc-sim-campaign", "{not json");
    expect(loadCampaign()).toEqual(newCampaign());
  });

  it("wrong-version save falls back to newCampaign()", () => {
    localStorage.setItem("cc-sim-campaign", JSON.stringify({ v: 99, campaign: newCampaign() }));
    expect(loadCampaign()).toEqual(newCampaign());
  });

  it("unlocks the next level on a passing completeLevel + save", () => {
    let campaign = newCampaign();
    expect(campaign.unlocked).toEqual(["run"]);
    const st = runScript(LEVEL_BY_ID.L1.seed, LEVEL_BY_ID.L1.scope, LEVEL_BY_ID.L1.referenceCfg, false);
    campaign = completeLevel(campaign, "L1", st, st.counts.handCoded);
    expect(campaign.unlocked).toContain(LEVEL_BY_ID.L2.unlocks);
    saveCampaign(campaign);
    expect(loadCampaign().unlocked).toContain(LEVEL_BY_ID.L2.unlocks);
  });
});
