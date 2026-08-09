import { describe, expect, it } from "vitest";
import { priceScenario, SCENARIOS } from "../sim/scenarios.js";
import {
  DEFAULT_MONKEY, DEFAULT_TOGGLES, evaluateFit, isGameOver, overdraftLeft, priceRoutedTask, priceTDScenario, routeTask,
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
      const tasks = scenarioToDispatchWave(scenario).tasks;
      expect(tasks).toHaveLength(scenario.script.length);
      for (const dispatchTask of tasks) {
        const routed = routeTask(dispatchTask, DEFAULT_MONKEY, DEFAULT_TOGGLES);
        expect(Number.isFinite(routed.usd)).toBe(true);
        expect(Number.isFinite(routed.baselineUsd)).toBe(true);
        expect(routed.usd).toBeGreaterThanOrEqual(0);
      }
      expect(priceTDScenario(scenario).totalUsd).toBeCloseTo(priceScenario(scenario).totalUsd, 12);
    }
  });

  it("makes every global cost toggle measurable in the documented direction", () => {
    const docs = { ...task("docs"), atMin: 20 };
    const monkey = { model: "sonnet", effort: "low" } as const;
    const cold = priceRoutedTask(docs, monkey, DEFAULT_TOGGLES, 0).usd;
    const keptWarm = priceRoutedTask(docs, monkey, { ...DEFAULT_TOGGLES, keepWarm: true }, 0).usd;
    const longTtl = priceRoutedTask(docs, monkey, { ...DEFAULT_TOGGLES, ttl: "1h" }, 0).usd;
    const autoApproved = priceRoutedTask(docs, monkey, { ...DEFAULT_TOGGLES, approval: "auto" }).usd;
    const docsSkill = priceRoutedTask(docs, monkey, { ...DEFAULT_TOGGLES, docsSkill: true }).usd;
    const loadedMcp = priceRoutedTask(docs, monkey, { ...DEFAULT_TOGGLES, alwaysLoadedMcp: true }).usd;

    expect(keptWarm).toBeLessThan(cold);
    expect(longTtl).toBeLessThan(cold);
    expect(autoApproved).toBeLessThan(priceRoutedTask(docs, monkey, DEFAULT_TOGGLES).usd);
    expect(docsSkill).toBeLessThan(priceRoutedTask(docs, monkey, DEFAULT_TOGGLES).usd);
    expect(loadedMcp).toBeGreaterThan(priceRoutedTask(docs, monkey, DEFAULT_TOGGLES).usd);
  });

  it("prices every spawned cascade task through the shared ledger", () => {
    const badRoute = routeTask(task("plan"), { model: "haiku", effort: "low" }, DEFAULT_TOGGLES);
    const reworkCosts = badRoute.rework.map((rework) => routeTask(rework, DEFAULT_MONKEY, DEFAULT_TOGGLES).usd);
    expect(reworkCosts).toHaveLength(2);
    expect(reworkCosts.every((cost) => Number.isFinite(cost) && cost > 0)).toBe(true);
  });

  it("ends challenge exactly at the overdraft boundary while sandbox can ignore it", () => {
    expect(isGameOver(8.09, 6, 2.1)).toBe(false);
    expect(isGameOver(8.1, 6, 2.1)).toBe(true);
    expect(overdraftLeft(7, 6, 2.1)).toBeCloseTo(1.1, 12);
    expect(overdraftLeft(100, 6, 2.1)).toBe(0);
  });
});
