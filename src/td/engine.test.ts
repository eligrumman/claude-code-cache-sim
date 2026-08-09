import { describe, expect, it } from "vitest";
import { priceScenario, SCENARIOS } from "../sim/scenarios.js";
import {
  DEFAULT_MONKEY, DEFAULT_TOGGLES, evaluateFit, priceRoutedTask, priceTDScenario, routeTask,
  scenarioToDispatchWave, type DispatchTask,
} from "./engine.js";

const task = (type: DispatchTask["type"]): DispatchTask => ({
  id: `test-${type}`, type, title: `A ${type} task`, atMin: 0,
  contextTok: 20_000, workInTok: 800, outputTok: 900, prefixKey: "main", origin: "scenario",
});

describe("Tokenloons dispatch economy", () => {
  it("uses Opus-high and shared-ledger pricing for default routing", () => {
    const routed = routeTask(task("dev"), DEFAULT_MONKEY, DEFAULT_TOGGLES);
    const direct = priceRoutedTask(task("dev"), DEFAULT_MONKEY, DEFAULT_TOGGLES);
    expect(routed.baselineUsd).toBeCloseTo(direct.usd, 12);
    expect(routed.usd).toBeCloseTo(routed.baselineUsd, 12);
  });

  it("marks an underpowered plan bad and spawns bug plus production fallout", () => {
    const routed = routeTask(task("plan"), { model: "haiku", effort: "low" }, DEFAULT_TOGGLES);
    expect(routed.outcome).toBe("bad-output");
    expect(routed.rework.map((item) => item.type)).toEqual(["bug", "production-issue"]);
  });

  it("flags an overpowered docs route and quantifies shared-engine waste", () => {
    const routed = routeTask(task("docs"), { model: "fable", effort: "high" }, DEFAULT_TOGGLES);
    expect(routed.outcome).toBe("overkill");
    expect(routed.wastedUsd).toBeGreaterThan(0);
  });

  it("clears the documented ideal fits cleanly", () => {
    expect(evaluateFit("dev", { model: "sonnet", effort: "high" })).toBe("good-fit");
    expect(evaluateFit("code-review", { model: "sonnet", effort: "med" })).toBe("good-fit");
    expect(evaluateFit("browser-test", { model: "sonnet", effort: "low" })).toBe("good-fit");
  });

  it("maps every shared scenario and prices it identically to the canonical engine", () => {
    for (const scenario of SCENARIOS) {
      expect(scenarioToDispatchWave(scenario).tasks).toHaveLength(scenario.script.length);
      expect(priceTDScenario(scenario).totalUsd).toBeCloseTo(priceScenario(scenario).totalUsd, 12);
    }
  });
});
