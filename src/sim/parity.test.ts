import { describe, expect, it } from "vitest";
import { economyFromLedger, priceTDScenario, scenarioToTDWave } from "../td/engine.js";
import { priceScenario, SCENARIOS } from "./scenarios.js";

describe("shared simulation parity", () => {
  it.each(SCENARIOS)("prices $title identically through Sandbox and TD", (scenario) => {
    const config = { ...scenario.defaults, ttl: "1h" as const, keepWarm: true };
    const sandbox = priceScenario(scenario, config);
    const td = priceTDScenario(scenario, config);
    const wave = scenarioToTDWave(scenario, config);
    const balloonTotal = wave.balloons.reduce((sum, balloon) => sum + economyFromLedger(balloon.entry, wave.options).currentCost, 0);

    expect(td.totalUsd).toBeCloseTo(sandbox.totalUsd, 12);
    expect(wave.totalUsd).toBeCloseTo(sandbox.totalUsd, 12);
    expect(balloonTotal).toBeCloseTo(sandbox.totalUsd, 12);
    expect(Math.round(td.totalUsd * 100)).toBe(Math.round(sandbox.totalUsd * 100));
    expect(td.messages.map((message) => message.usd)).toEqual(sandbox.messages.map((message) => message.usd));
  });
});
