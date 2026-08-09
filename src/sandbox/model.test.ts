import { describe, expect, it } from "vitest";
import { RATE } from "../engine/pricing.js";
import { bucketCost, configForLever, PERSONAS, simulateDay, type PersonaProfile, type SandboxConfig } from "./model.js";

const config: SandboxConfig = {
  subagents: "same", ttl: "1h", context: 1, approval: "auto", keepWarm: false, model: "sonnet",
};

describe("sandbox day simulator", () => {
  it("reproduces the canonical 34,738-token warm and cold costs", () => {
    expect(bucketCost(34_738, "cacheRead", config)).toBeCloseTo(0.0104214, 10);
    expect(bucketCost(34_738, "cacheWrite", config)).toBeCloseTo(0.208428, 10);
    expect(bucketCost(34_738, "cacheWrite", config) / bucketCost(34_738, "cacheRead", config))
      .toBe(RATE.w1h / RATE.read);
  });

  it("makes manual approval rebuild more often under a five-minute TTL", () => {
    const profile = PERSONAS.developer;
    const auto = simulateDay(profile, { ...profile.defaults, ttl: "5m", approval: "auto" });
    const manual = simulateDay(profile, { ...profile.defaults, ttl: "5m", approval: "manual" });
    expect(manual.rebuiltPrefixTok).toBeGreaterThan(auto.rebuiltPrefixTok);
    expect(manual.totalUsd).toBeGreaterThan(auto.totalUsd);
  });

  it("reuses same-prompt subagents but rewrites different prompts", () => {
    const profile = PERSONAS.oneManCompany;
    const same = simulateDay(profile, { ...profile.defaults, subagents: "same" });
    const different = simulateDay(profile, { ...profile.defaults, subagents: "different" });
    expect(different.rebuiltPrefixTok).toBeGreaterThan(same.rebuiltPrefixTok);
    expect(different.totalUsd).toBeGreaterThan(same.totalUsd);
  });

  it("changes only the spotlighted lever from the baseline", () => {
    const baseline = PERSONAS.pm.defaults;
    const changed = configForLever(baseline, "keepWarm", true);
    expect(changed.keepWarm).toBe(!baseline.keepWarm);
    expect({ ...changed, keepWarm: baseline.keepWarm }).toEqual(baseline);
  });

  it("uses the strict gap < TTL boundary and lets pings reset that TTL", () => {
    const profile: PersonaProfile = {
      ...PERSONAS.pm,
      sessions: 1,
      requestsPerSession: 2,
      subagentsPerSession: 0,
      requestGapsMin: [5],
      defaults: { ...config, ttl: "5m" },
    };
    const coldAtFive = simulateDay(profile, { ...profile.defaults, keepWarm: false });
    const pingedAtFive = simulateDay(profile, { ...profile.defaults, keepWarm: true });
    expect(coldAtFive.segments.filter((s) => s.bucket === "cacheWrite")).toHaveLength(2);
    expect(pingedAtFive.segments.filter((s) => s.bucket === "keepWarm")).toHaveLength(1);
    expect(pingedAtFive.segments.filter((s) => s.bucket === "cacheWrite")).toHaveLength(1);
    expect(pingedAtFive.segments.filter((s) => s.bucket === "cacheRead")).toHaveLength(1);
  });
});
