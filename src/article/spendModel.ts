import type { Model } from "../engine/types.js";
import { priceTokenBuckets, priceTokens, type Ttl, type TokenBuckets } from "../sim/cost.js";
import { SCENARIO_BY_ID } from "../sim/scenarios.js";
import { MACRO_ROUTES } from "./macroPricing.js";

export type SpendUnit = "message" | "task";
export type SpendClass = "input" | "cacheRead" | "cacheWrite" | "output";

export interface SpendRow {
  label: string;
  buckets: Required<Pick<TokenBuckets, SpendClass>>;
  usd: Record<SpendClass, number>;
}

export interface SpendBreakdown {
  rows: SpendRow[];
  tokens: Record<SpendClass, number>;
  usd: Record<SpendClass, number>;
  totalUsd: number;
  cacheReadPercent: number;
}

const EMPTY = (): Record<SpendClass, number> => ({ input: 0, cacheRead: 0, cacheWrite: 0, output: 0 });
const SPEND_CONFIG = { model: "opus", ttl: "5m" } as const;

/**
 * Deterministic teaching workload. Message labels and turn-sized input/output come
 * from the shared Ship a Feature scenario; task labels and task-sized tokens come
 * from MACRO_ROUTES. The growing cached prefix represents the accumulated repo,
 * tool, and conversation context that is re-read on every subsequent item.
 */
export function spendBreakdown(unit: SpendUnit, length: number): SpendBreakdown {
  const count = Math.max(1, Math.floor(length));
  const scenario = SCENARIO_BY_ID["ship-feature"];
  const rows = Array.from({ length: count }, (_, index): SpendRow => {
    const first = index === 0;
    const prefix = unit === "message"
      ? 300_000 + index * 18_000
      : 600_000 + index * 300_000;
    let input: number;
    let output: number;
    let label: string;
    if (unit === "message") {
      const source = scenario.script[index % scenario.script.length];
      input = source.workInTok ?? scenario.defaults.workInTok;
      output = source.outputTok ?? scenario.defaults.outputTok;
      label = `Message ${index + 1} · ${source.role === "user" ? "prompt" : "reply"}`;
    } else {
      const source = MACRO_ROUTES[index % MACRO_ROUTES.length];
      const cycle = Math.floor(index / MACRO_ROUTES.length);
      input = source.input;
      output = source.output;
      label = `${source.task}${cycle ? ` · pass ${cycle + 1}` : ""}`;
    }
    const buckets = {
      input,
      cacheRead: first ? 0 : prefix,
      cacheWrite: first ? prefix : 0,
      output,
    };
    return {
      label,
      buckets,
      usd: {
        input: priceTokens(buckets.input, "input", SPEND_CONFIG),
        cacheRead: priceTokens(buckets.cacheRead, "cacheRead", SPEND_CONFIG),
        cacheWrite: priceTokens(buckets.cacheWrite, "cacheWrite", SPEND_CONFIG),
        output: priceTokens(buckets.output, "output", SPEND_CONFIG),
      },
    };
  });
  const tokens = EMPTY();
  const usd = EMPTY();
  for (const row of rows) {
    for (const bucket of Object.keys(tokens) as SpendClass[]) {
      tokens[bucket] += row.buckets[bucket];
      usd[bucket] += row.usd[bucket];
    }
  }
  const totalUsd = priceTokenBuckets(tokens, SPEND_CONFIG);
  return { rows, tokens, usd, totalUsd, cacheReadPercent: totalUsd ? usd.cacheRead / totalUsd * 100 : 0 };
}

export function lifecycleComparison(prefixTokens: number, model: Model, ttl: Ttl) {
  const config = { model, ttl };
  const keepWarmUsd = priceTokens(prefixTokens, "cacheRead", config);
  const lapseUsd = priceTokens(prefixTokens, "cacheWrite", config);
  return {
    keepWarmUsd,
    lapseUsd,
    savedUsd: lapseUsd - keepWarmUsd,
    savedPercent: lapseUsd ? (lapseUsd - keepWarmUsd) / lapseUsd * 100 : 0,
  };
}

export function outputComparison(model: Model, prefixTokens: number, inputTokens: number, verboseOutput: number, leanOutput: number) {
  const config = { model, ttl: "5m" } as const;
  const price = (output: number) => priceTokenBuckets({ cacheRead: prefixTokens, input: inputTokens, output }, config);
  const verboseUsd = price(verboseOutput);
  const leanUsd = price(leanOutput);
  return { verboseUsd, leanUsd, savedUsd: verboseUsd - leanUsd };
}
