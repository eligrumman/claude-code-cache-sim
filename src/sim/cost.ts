import { RATE, MODEL_IN, tokCost } from "../engine/pricing.js";
import type { Model } from "../engine/types.js";

export { RATE, MODEL_IN };

export type Ttl = "5m" | "1h";
export type CostBucket = "input" | "cacheWrite" | "cacheRead" | "output" | "keepWarm";

export interface CostConfig {
  model: Model;
  ttl: Ttl;
}

/** The only app-level entry point for turning tokens into dollars. */
export function priceTokens(tokens: number, bucket: CostBucket, config: CostConfig): number {
  const rate = bucket === "input" ? RATE.input
    : bucket === "cacheWrite" ? (config.ttl === "5m" ? RATE.w5m : RATE.w1h)
      : bucket === "output" ? RATE.out : RATE.read;
  return tokCost(tokens, rate, config.model);
}

export interface TokenBuckets {
  input?: number;
  cacheWrite?: number;
  cacheRead?: number;
  output?: number;
  keepWarm?: number;
}

export function priceTokenBuckets(buckets: TokenBuckets, config: CostConfig): number {
  return (Object.entries(buckets) as [CostBucket, number][])
    .reduce((total, [bucket, tokens]) => total + priceTokens(tokens, bucket, config), 0);
}
