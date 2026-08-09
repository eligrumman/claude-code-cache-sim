import type { Model } from "../engine/types.js";
import { priceTokenBuckets } from "../sim/cost.js";

export type WorkRoute = {
  task: string;
  model: Model;
  effort: "low" | "medium" | "high";
  input: number;
  output: number;
};

export const MACRO_ROUTES: readonly WorkRoute[] = [
  { task: "Plan", model: "sonnet", effort: "high", input: 18_000, output: 2_400 },
  { task: "Hotfix", model: "haiku", effort: "low", input: 5_000, output: 700 },
  { task: "Debug", model: "opus", effort: "high", input: 28_000, output: 3_000 },
  { task: "RCA", model: "opus", effort: "high", input: 24_000, output: 2_600 },
  { task: "Code review", model: "sonnet", effort: "medium", input: 14_000, output: 1_600 },
  { task: "Tests", model: "haiku", effort: "medium", input: 9_000, output: 1_300 },
  { task: "Docs", model: "haiku", effort: "low", input: 7_000, output: 1_800 },
];

export const DEFAULT_MAIN_CONTEXT_TOKENS = 1_000_000;

export function priceMacroRoutes(routed: boolean) {
  return MACRO_ROUTES.map((route, index) => {
    const activeModel: Model = routed ? route.model : "opus";
    const buckets = routed
      ? { cacheWrite: route.input, output: route.output }
      : {
          input: route.input,
          cacheWrite: index === 0 ? DEFAULT_MAIN_CONTEXT_TOKENS : 0,
          cacheRead: index === 0 ? 0 : DEFAULT_MAIN_CONTEXT_TOKENS,
          output: route.output,
        };
    return {
      ...route,
      activeModel,
      usd: priceTokenBuckets(buckets, { model: activeModel, ttl: "1h" }),
    };
  });
}

export function totalMacroRoutes(routed: boolean): number {
  return priceMacroRoutes(routed).reduce((sum, route) => sum + route.usd, 0);
}
