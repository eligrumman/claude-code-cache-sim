import type { Model } from "../engine/types.js";
import { priceTokenBuckets, priceTokens } from "../sim/cost.js";

export type WorkRoute = {
  task: string;
  model: Model;
  effort: "low" | "medium" | "high";
  input: number;
  output: number;
  judgment: string;
  fit: string;
  underpowered: string;
  overkill: string;
};

export type Effort = WorkRoute["effort"];
export type RouteVerdict = "good" | "bad" | "expensive";
export type MacroLabStrategy = "uniform" | "routed";
export type MacroLoad = "light" | "normal" | "heavy";
export interface MacroMonthConfig {
  strategy: MacroLabStrategy;
  model: Model;
  effort: Effort;
  load: MacroLoad;
}
export const DEFAULT_MACRO_MONTH: MacroMonthConfig = {
  strategy: "routed", model: "opus", effort: "high", load: "normal",
};
export type MacroSpendClass = "input" | "cacheRead" | "cacheWrite" | "output";

export interface MacroDay {
  day: number;
  totalUsd: number;
  tasks: Array<{ task: string; model: Model; effort: Effort; usd: number }>;
  byModel: Record<Model, number>;
  byEffort: Record<Effort, number>;
}

export interface MacroMonth {
  days: MacroDay[];
  totalUsd: number;
  peakDay: number;
  byModel: Record<Model, number>;
  byEffort: Record<Effort, number>;
}

export interface MacroLabOptions {
  strategy: MacroLabStrategy;
  model: Model;
  effort: Effort;
  taskCount: number;
  /** Percentage of the carried prefix removed before later task reads. */
  contextDropped: number;
}

export interface MacroLabRow {
  label: string;
  activeModel: Model;
  activeEffort: Effort;
  verdict: RouteVerdict;
  buckets: Record<MacroSpendClass, number>;
  usd: number;
}

export interface MacroLabSpend {
  rows: MacroLabRow[];
  tokens: Record<MacroSpendClass, number>;
  usd: Record<MacroSpendClass, number>;
  totalUsd: number;
}

const EFFORT_TOKENS: Record<Effort, { input: number; output: number }> = {
  low: { input: 0.7, output: 0.65 },
  medium: { input: 1, output: 1 },
  high: { input: 1.35, output: 1.45 },
};

export const MACRO_ROUTES: readonly WorkRoute[] = [
  { task: "Plan", model: "sonnet", effort: "high", input: 18_000, output: 2_400, judgment: "Architecture and sequencing", fit: "Sonnet-high can trace dependencies before implementation fans out.", underpowered: "A shallow dependency map turns one cheap plan into several expensive corrections.", overkill: "Fable adds premium headroom to a bounded design problem without improving its evidence." },
  { task: "Hotfix", model: "haiku", effort: "low", input: 5_000, output: 700, judgment: "Local, reversible change", fit: "Haiku-low is enough when the patch is narrow and the test is decisive.", underpowered: "It is underpowered only after the blast radius or ambiguity stops being local.", overkill: "A premium model cannot make a deterministic one-line fix more correct than its focused test." },
  { task: "Debug", model: "opus", effort: "high", input: 28_000, output: 3_000, judgment: "Search a wide hypothesis tree", fit: "Opus-high earns its rate by pruning competing causes before the next edit.", underpowered: "A missed hypothesis buys another inspect-edit-test loop and drags context through the meter again.", overkill: "Fable charges above the route even though the debugger and tests already constrain the search." },
  { task: "RCA", model: "opus", effort: "high", input: 24_000, output: 2_600, judgment: "Reproduce, separate cause from symptom", fit: "Opus-high can build the defensible causal chain an RCA requires.", underpowered: "A plausible summary without reproduction mistakes correlation for cause.", overkill: "Fable is extra inference capacity after logs, reproduction, and timeline already bound the case." },
  { task: "Code review", model: "sonnet", effort: "medium", input: 14_000, output: 1_600, judgment: "Trace contracts across a bounded diff", fit: "Sonnet-medium catches cross-file consequences without pricing every review as research.", underpowered: "Haiku may verify syntax yet miss an invariant that lives beyond the edited file.", overkill: "Opus or Fable is waste unless the diff hides an architecture or incident-level question." },
  { task: "Tests", model: "haiku", effort: "medium", input: 9_000, output: 1_300, judgment: "Enumerate behavior and boundaries", fit: "The spec supplies the judgment; Haiku-medium supplies coverage and mechanics.", underpowered: "Low effort tends to repeat happy paths instead of enumerating boundary cases.", overkill: "A premium model does not add much when assertions and the runner provide immediate verification." },
  { task: "Docs", model: "haiku", effort: "low", input: 7_000, output: 1_800, judgment: "Faithful compression of known facts", fit: "Haiku-low is the economical route when the source material is explicit.", underpowered: "Escalate when the job is actually product reasoning or architecture synthesis disguised as docs.", overkill: "Fable cannot recover facts absent from the brief; it only charges more to phrase them." },
];

export const DEFAULT_MAIN_CONTEXT_TOKENS = 1_000_000;

export function priceMacroRoutes(routed: boolean) {
  return MACRO_ROUTES.map((route, index) => {
    const activeModel: Model = routed ? route.model : "opus";
    const activeEffort: Effort = routed ? route.effort : "high";
    const scale = EFFORT_TOKENS[activeEffort];
    const input = Math.round(route.input * scale.input);
    const output = Math.round(route.output * scale.output);
    const buckets = routed
      ? { cacheWrite: input, output }
      : {
          input,
          cacheWrite: index === 0 ? DEFAULT_MAIN_CONTEXT_TOKENS : 0,
          cacheRead: index === 0 ? 0 : DEFAULT_MAIN_CONTEXT_TOKENS,
          output,
        };
    return {
      ...route,
      activeModel,
      activeEffort,
      usd: priceTokenBuckets(buckets, { model: activeModel, ttl: "1h" }),
    };
  });
}

export function totalMacroRoutes(routed: boolean): number {
  return priceMacroRoutes(routed).reduce((sum, route) => sum + route.usd, 0);
}

/** Price a teaching-widget choice through the same token buckets as the simulator. */
export function taskChoiceBuckets(route: WorkRoute, effort: Effort) {
  const scale = EFFORT_TOKENS[effort];
  return {
    cacheWrite: Math.round(route.input * scale.input),
    output: Math.round(route.output * scale.output),
  };
}

/** Price a teaching-widget choice through the same token buckets as the simulator. */
export function priceTaskChoice(route: WorkRoute, model: Model, effort: Effort): number {
  return priceTokenBuckets(taskChoiceBuckets(route, effort), { model, ttl: "1h" });
}

/** A deterministic engineering month, priced through the shared task-choice path. */
export function simulateMacroMonth(config: MacroMonthConfig): MacroMonth {
  const emptyModels = (): Record<Model, number> => ({ haiku: 0, sonnet: 0, opus: 0, fable: 0 });
  const emptyEfforts = (): Record<Effort, number> => ({ low: 0, medium: 0, high: 0 });
  const monthModels = emptyModels();
  const monthEfforts = emptyEfforts();
  const incidentDays = new Set([9, 18, 26]);
  const normalRouteIndexes = [0, 4, 5, 6, 1];
  const days = Array.from({ length: 30 }, (_, index): MacroDay => {
    const day = index + 1;
    const weekday = day % 7;
    const weekend = weekday === 6 || weekday === 0;
    const baseRouteIndexes = incidentDays.has(day)
      ? [2, 3, 4, 5, 2]
      : weekend
        ? (day % 2 === 0 ? [6] : [1, 6])
        : Array.from({ length: 3 + (day % 3) }, (__, offset) => normalRouteIndexes[(day + offset * 2) % normalRouteIndexes.length]);
    const loadScale: Record<MacroLoad, number> = { light: 0.6, normal: 1, heavy: 1.5 };
    const taskCount = incidentDays.has(day) || weekend
      ? baseRouteIndexes.length
      : Math.max(1, Math.round(baseRouteIndexes.length * loadScale[config.load]));
    const routeIndexes = Array.from({ length: taskCount }, (__, offset) => baseRouteIndexes[offset % baseRouteIndexes.length]);
    const byModel = emptyModels();
    const byEffort = emptyEfforts();
    const tasks = routeIndexes.map((routeIndex) => {
      const route = MACRO_ROUTES[routeIndex];
      const model: Model = config.strategy === "routed" ? route.model : config.model;
      const effort: Effort = config.strategy === "routed" ? route.effort : config.effort;
      const usd = priceTaskChoice(route, model, effort);
      byModel[model] += usd;
      byEffort[effort] += usd;
      monthModels[model] += usd;
      monthEfforts[effort] += usd;
      return { task: route.task, model, effort, usd };
    });
    return { day, totalUsd: tasks.reduce((sum, task) => sum + task.usd, 0), tasks, byModel, byEffort };
  });
  const totalUsd = days.reduce((sum, day) => sum + day.totalUsd, 0);
  const peakDay = days.reduce((peak, day, index) => day.totalUsd > days[peak].totalUsd ? index : peak, 0);
  return { days, totalUsd, peakDay, byModel: monthModels, byEffort: monthEfforts };
}

export function verdictForChoice(route: WorkRoute, model: Model, effort: Effort): RouteVerdict {
  const recommendedModel = route.model;
  const modelRank: Record<Model, number> = { haiku: 0, sonnet: 1, opus: 2, fable: 3 };
  const effortRank: Record<Effort, number> = { low: 0, medium: 1, high: 2 };
  if (modelRank[model] < modelRank[recommendedModel] || effortRank[effort] < effortRank[route.effort]) return "bad";
  if (modelRank[model] > modelRank[recommendedModel] || effortRank[effort] > effortRank[route.effort]) return "expensive";
  return "good";
}

const emptyMacroClasses = (): Record<MacroSpendClass, number> => ({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });

/**
 * Engine-priced Macro Lab workload. At seven tasks, zero compaction, Opus-high
 * uniform and right-sized totals reconcile exactly with priceMacroRoutes.
 * Compaction only changes later reads of the shared uniform-route prefix;
 * right-sized tasks already write isolated, task-sized contexts.
 */
export function priceMacroLab(options: MacroLabOptions): MacroLabSpend {
  const taskCount = Math.max(1, Math.floor(options.taskCount));
  const dropped = Math.min(100, Math.max(0, options.contextDropped)) / 100;
  const reconciled = taskCount === MACRO_ROUTES.length && dropped === 0
    ? priceMacroRoutes(options.strategy === "routed")
    : null;
  const rows = Array.from({ length: taskCount }, (_, index): MacroLabRow => {
    const route = MACRO_ROUTES[index % MACRO_ROUTES.length];
    const pass = Math.floor(index / MACRO_ROUTES.length);
    const activeModel = options.strategy === "routed" ? route.model : options.model;
    const activeEffort = options.strategy === "routed" ? route.effort : options.effort;
    const scaled = taskChoiceBuckets(route, activeEffort);
    const buckets: Record<MacroSpendClass, number> = options.strategy === "routed"
      ? { input: 0, cacheRead: 0, cacheWrite: scaled.cacheWrite, output: scaled.output }
      : {
          input: scaled.cacheWrite,
          cacheRead: index === 0 ? 0 : Math.round(DEFAULT_MAIN_CONTEXT_TOKENS * (1 - dropped)),
          cacheWrite: index === 0 ? DEFAULT_MAIN_CONTEXT_TOKENS : 0,
          output: scaled.output,
        };
    const computedUsd = options.strategy === "routed"
      ? priceTaskChoice(route, activeModel, activeEffort)
      : priceTokenBuckets(buckets, { model: activeModel, ttl: "1h" });
    const canReuseReconciled = reconciled
      && (options.strategy === "routed" || (options.model === "opus" && options.effort === "high"));
    return {
      label: `${route.task}${pass ? ` · pass ${pass + 1}` : ""}`,
      activeModel,
      activeEffort,
      verdict: verdictForChoice(route, activeModel, activeEffort),
      buckets,
      usd: canReuseReconciled ? reconciled[index].usd : computedUsd,
    };
  });
  const tokens = emptyMacroClasses();
  const usd = emptyMacroClasses();
  for (const row of rows) {
    for (const key of Object.keys(tokens) as MacroSpendClass[]) {
      tokens[key] += row.buckets[key];
      usd[key] += priceTokens(row.buckets[key], key, { model: row.activeModel, ttl: "1h" });
    }
  }
  let totalUsd = usd.input + usd.cacheRead + usd.cacheWrite + usd.output;
  if (reconciled && (options.strategy === "routed" || (options.model === "opus" && options.effort === "high"))) {
    totalUsd = totalMacroRoutes(options.strategy === "routed");
  }
  return { rows, tokens, usd, totalUsd };
}

export function macroLabComparison(options: MacroLabOptions) {
  const uniform = priceMacroLab({ ...options, strategy: "uniform" });
  const routed = priceMacroLab({ ...options, strategy: "routed" });
  const selected = options.strategy === "uniform" ? uniform : routed;
  const withoutCompaction = priceMacroLab({ ...options, contextDropped: 0 });
  const savedUsd = uniform.totalUsd - routed.totalUsd;
  return {
    uniform,
    routed,
    selected,
    savedUsd,
    savedPercent: uniform.totalUsd ? savedUsd / uniform.totalUsd * 100 : 0,
    withoutCompactionUsd: withoutCompaction.totalUsd,
    compactionSavedUsd: withoutCompaction.totalUsd - selected.totalUsd,
  };
}

export function priceContextComparison(model: Model = "sonnet") {
  const route = MACRO_ROUTES[4];
  const scopedTokens = route.input;
  return {
    mainCold: priceTokenBuckets({ cacheWrite: DEFAULT_MAIN_CONTEXT_TOKENS, output: route.output }, { model, ttl: "1h" }),
    mainWarm: priceTokenBuckets({ cacheRead: DEFAULT_MAIN_CONTEXT_TOKENS, output: route.output }, { model, ttl: "1h" }),
    scopedCold: priceTokenBuckets({ cacheWrite: scopedTokens, output: route.output }, { model, ttl: "1h" }),
    scopedWarm: priceTokenBuckets({ cacheRead: scopedTokens, output: route.output }, { model, ttl: "1h" }),
    scopedTokens,
  };
}
