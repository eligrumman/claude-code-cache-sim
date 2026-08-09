import { describe, expect, it } from "vitest";
import { priceScenario, SCENARIOS } from "../sim/scenarios.js";
import {
  DEFAULT_MAIN, DEFAULT_TOGGLES, MAIN_CONTEXT_TOKENS, ROUTABLE_TASK_TYPES,
  createMoab, defaultRoutingControl, evaluateFit, isGameOver, overdraftLeft,
  priceRoutedTask, priceTDScenario, resolveRoute, routeTask, routeTaskWithControl,
  scenarioToDispatchWave, scoreMoab, type DispatchTask,
} from "./engine.js";

const task = (type: DispatchTask["type"]): DispatchTask => ({
  id: `test-${type}`, type, title: `A ${type} task`, atMin: 0,
  contextTok: 20_000, workInTok: 800, outputTok: 900, prefixKey: "main", origin: "scenario",
});

describe("Tokenloons routing economy", () => {
  it("routes everything through the Opus-high 1M main agent by default", () => {
    const control = defaultRoutingControl();
    for (const type of ROUTABLE_TASK_TYPES) {
      const route = resolveRoute(type, control);
      const routed = routeTaskWithControl(task(type), control, DEFAULT_TOGGLES);
      expect(route.context).toBe("main-1m");
      expect(route.worker).toEqual(DEFAULT_MAIN);
      expect(routed.ledgerOptions.prefixTok).toBe(MAIN_CONTEXT_TOKENS);
      expect(routed.usd).toBeCloseTo(routed.baselineUsd, 12);
    }
  });

  it("re-prices immediately when the live main model or effort changes", () => {
    const control = defaultRoutingControl();
    const work = task("debugging");
    const opusHigh = routeTaskWithControl(work, control, DEFAULT_TOGGLES).usd;
    control.main.model = "haiku";
    const haikuHigh = routeTaskWithControl(work, control, DEFAULT_TOGGLES).usd;
    control.main.effort = "low";
    const haikuLow = routeTaskWithControl(work, control, DEFAULT_TOGGLES).usd;
    expect(haikuHigh).toBeLessThan(opusHigh);
    expect(haikuLow).toBeLessThan(haikuHigh);
  });

  it("uses scoped context and per-type workers only when subagents are enabled", () => {
    const control = defaultRoutingControl();
    control.routes.docs = { model: "haiku", effort: "low" };
    expect(resolveRoute("docs", control).worker).toEqual(DEFAULT_MAIN);
    control.useSubagents = true;
    const route = resolveRoute("docs", control);
    const routed = routeTaskWithControl(task("docs"), control, DEFAULT_TOGGLES);
    expect(route.worker).toEqual({ model: "haiku", effort: "low" });
    expect(route.context).toBe("scoped");
    expect(routed.ledgerOptions.prefixTok).toBe(20_000);
    expect(routed.usd).toBeLessThan(routed.baselineUsd);
  });

  it("inherits both live main settings by default but still sheds the 1M context", () => {
    const control = defaultRoutingControl();
    control.main = { model: "sonnet", effort: "med" };
    control.useSubagents = true;
    const route = resolveRoute("code-review", control);
    expect(route.inherited).toBe(true);
    expect(route.worker).toEqual(control.main);
    expect(route.context).toBe("scoped");
    expect(routeTaskWithControl(task("code-review"), control, DEFAULT_TOGGLES).ledgerOptions.prefixTok).toBe(20_000);
  });

  it("fires GOOD, BAD with cascade, and EXPENSIVE with measured waste", () => {
    const good = routeTask(task("docs"), { model: "haiku", effort: "low" }, DEFAULT_TOGGLES, undefined, undefined, "scoped");
    const bad = routeTask(task("plan"), { model: "haiku", effort: "low" }, DEFAULT_TOGGLES, undefined, undefined, "scoped");
    const expensive = routeTask(task("docs"), { model: "fable", effort: "high" }, DEFAULT_TOGGLES, undefined, undefined, "scoped");
    expect(good.outcome).toBe("good-fit");
    expect(good.savingsUsd).toBeGreaterThan(0);
    expect(bad.outcome).toBe("bad-output");
    expect(bad.rework.map(item => item.type)).toEqual(["bug", "bug", "production-issue"]);
    expect(expensive.outcome).toBe("overkill");
    expect(expensive.wastedUsd).toBeGreaterThan(0);
  });

  it("encodes the documented ideal fits without scattered routing logic", () => {
    expect(evaluateFit("plan", { model: "opus", effort: "high" })).toBe("good-fit");
    expect(evaluateFit("hotfix", { model: "sonnet", effort: "high" })).toBe("good-fit");
    expect(evaluateFit("debugging", { model: "opus", effort: "med" })).toBe("good-fit");
    expect(evaluateFit("rca", { model: "opus", effort: "high" })).toBe("good-fit");
    expect(evaluateFit("code-review", { model: "sonnet", effort: "med" })).toBe("good-fit");
    expect(evaluateFit("testing", { model: "sonnet", effort: "low" })).toBe("good-fit");
    expect(evaluateFit("docs", { model: "haiku", effort: "low" })).toBe("good-fit");
  });

  it("spawns the complete urgent MOAB burst and scores against panic-default", () => {
    const stages = createMoab(10, "incident-1");
    expect(stages.map(stage => stage.type)).toEqual(["hotfix", "debugging", "rca", "code-review", "testing"]);
    expect(stages.every(stage => stage.urgent && stage.origin === "moab")).toBe(true);

    const panicControl = defaultRoutingControl();
    const panic = stages.map(stage => routeTaskWithControl(stage, panicControl, DEFAULT_TOGGLES));
    expect(scoreMoab(panic).panicDefaulted).toBe(true);

    const smart = defaultRoutingControl();
    smart.useSubagents = true;
    smart.routes.hotfix = { model: "sonnet", effort: "high" };
    smart.routes.debugging = { model: "opus", effort: "med" };
    smart.routes.rca = { model: "opus", effort: "high" };
    smart.routes["code-review"] = { model: "sonnet", effort: "med" };
    smart.routes.testing = { model: "sonnet", effort: "low" };
    const scored = scoreMoab(stages.map(stage => routeTaskWithControl(stage, smart, DEFAULT_TOGGLES)));
    expect(scored.panicDefaulted).toBe(false);
    expect(scored.draggedStages).toBe(0);
    expect(scored.actualUsd).toBeLessThan(scored.panicDefaultUsd);
  });

  it("maps every shared scenario and preserves canonical parity", () => {
    for (const scenario of SCENARIOS) {
      const tasks = scenarioToDispatchWave(scenario).tasks;
      expect(tasks).toHaveLength(scenario.script.length);
      for (const dispatchTask of tasks) {
        const routed = routeTask(dispatchTask, DEFAULT_MAIN, DEFAULT_TOGGLES);
        expect(Number.isFinite(routed.usd)).toBe(true);
        expect(routed.usd).toBeGreaterThanOrEqual(0);
      }
      expect(priceTDScenario(scenario).totalUsd).toBeCloseTo(priceScenario(scenario).totalUsd, 12);
    }
  });

  it("makes every global cost toggle measurable through the shared ledger", () => {
    const docs = { ...task("docs"), atMin: 20 };
    const worker = { model: "sonnet", effort: "low" } as const;
    const cold = priceRoutedTask(docs, worker, DEFAULT_TOGGLES, 0).usd;
    expect(priceRoutedTask(docs, worker, { ...DEFAULT_TOGGLES, keepWarm: true }, 0).usd).toBeLessThan(cold);
    expect(priceRoutedTask(docs, worker, { ...DEFAULT_TOGGLES, ttl: "1h" }, 0).usd).toBeLessThan(cold);
    expect(priceRoutedTask(docs, worker, { ...DEFAULT_TOGGLES, approval: "auto" }).usd).toBeLessThan(priceRoutedTask(docs, worker, DEFAULT_TOGGLES).usd);
    expect(priceRoutedTask(docs, worker, { ...DEFAULT_TOGGLES, docsSkill: true }).usd).toBeLessThan(priceRoutedTask(docs, worker, DEFAULT_TOGGLES).usd);
    expect(priceRoutedTask(docs, worker, { ...DEFAULT_TOGGLES, alwaysLoadedMcp: true }).usd).toBeGreaterThan(priceRoutedTask(docs, worker, DEFAULT_TOGGLES).usd);
  });

  it("carries real conversation state through auto-compaction and lazy tools", () => {
    const worker = { model: "sonnet", effort: "med" } as const;
    const longTask = { ...task("plan"), workInTok: 2_000, outputTok: 2_000 };
    const total = (autoCompact: boolean) => {
      let conversationTok = 0;
      let usd = 0;
      let compactionUsd = 0;
      for (let index = 0; index < 36; index += 1) {
        const priced = priceRoutedTask(
          { ...longTask, id: `long-${index}`, atMin: index }, worker,
          { ...DEFAULT_TOGGLES, ttl: "1h", autoCompact }, index ? index - 1 : undefined,
          "main-1m", conversationTok,
        );
        conversationTok = priced.nextConversationTok;
        usd += priced.usd;
        compactionUsd += priced.compactionUsd;
      }
      return { usd, compactionUsd };
    };
    const compact = total(true);
    const balloon = total(false);
    expect(compact.compactionUsd).toBeGreaterThan(0);
    expect(compact.usd).toBeLessThan(balloon.usd);

    const plain = { ...task("plan"), usesTools: false };
    const eager = priceRoutedTask(plain, worker, { ...DEFAULT_TOGGLES, lazyLoadTools: false });
    const lazy = priceRoutedTask(plain, worker, { ...DEFAULT_TOGGLES, lazyLoadTools: true });
    expect(eager.options.prefixTok - lazy.options.prefixTok).toBe(14_000);
    expect(lazy.usd).toBeLessThan(eager.usd);
  });

  it("keeps challenge and sandbox boundary helpers exact", () => {
    expect(isGameOver(8.09, 6, 2.1)).toBe(false);
    expect(isGameOver(8.1, 6, 2.1)).toBe(true);
    expect(overdraftLeft(7, 6, 2.1)).toBeCloseTo(1.1, 12);
    expect(overdraftLeft(100, 6, 2.1)).toBe(0);
  });
});
