import type { Model } from "../engine/types.js";
import { priceTokenBuckets } from "../sim/cost.js";

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
export function priceTaskChoice(route: WorkRoute, model: Model, effort: Effort): number {
  const scale = EFFORT_TOKENS[effort];
  return priceTokenBuckets({
    cacheWrite: Math.round(route.input * scale.input),
    output: Math.round(route.output * scale.output),
  }, { model, ttl: "1h" });
}

export function verdictForChoice(route: WorkRoute, model: Model, effort: Effort): RouteVerdict {
  const recommendedModel = route.model;
  const modelRank: Record<Model, number> = { haiku: 0, sonnet: 1, opus: 2, fable: 3 };
  const effortRank: Record<Effort, number> = { low: 0, medium: 1, high: 2 };
  if (modelRank[model] < modelRank[recommendedModel] || effortRank[effort] < effortRank[route.effort]) return "bad";
  if (modelRank[model] > modelRank[recommendedModel] || effortRank[effort] > effortRank[route.effort]) return "expensive";
  return "good";
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
