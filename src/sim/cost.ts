import { RATE, MODEL_IN, tokCost } from "../engine/pricing.js";
import type { Model } from "../engine/types.js";

export { RATE, MODEL_IN };

export type Ttl = "5m" | "1h";
export type CostBucket = "input" | "cacheWrite" | "cacheRead" | "output" | "keepWarm";

export interface CostConfig {
  model: Model;
  ttl: Ttl;
}

export interface ContextLeverConfig {
  autoCompact: boolean;
  lazyLoadTools: boolean;
}

export interface ContextTurnInput {
  /** Stable instructions/repository context, before conversation history and tools. */
  basePrefixTok: number;
  /** Conversation tokens added by the completed turn. */
  growthTok: number;
  /** True for the minority of turns which actually invoke a skill or MCP tool. */
  usesTools: boolean;
}

export interface ContextLeverState { conversationTok: number }

export interface ContextTurnResult {
  prefixTok: number;
  toolTok: number;
  compactedTok: number;
  compactionInputTok: number;
  compactionOutputTok: number;
  nextState: ContextLeverState;
}

// A representative workstation exposes ~2k tokens of skill instructions and four MCP
// servers averaging ~3k tokens of schemas: 14k tokens when loaded eagerly. Lazy mode
// pays that context only on a turn that invokes one of those tools.
export const TOOL_CONTEXT_TOKENS = { skills: 2_000, mcps: 12_000 } as const;
export const TOTAL_TOOL_CONTEXT_TOKENS = TOOL_CONTEXT_TOKENS.skills + TOOL_CONTEXT_TOKENS.mcps;

// Compact after 32k tokens of conversation history and retain an 8k working set.
// The summarizer reads the old history and emits an 800-token summary on Haiku; using
// MODEL_IN.haiku through priceTokens keeps this modest but real rather than a rebate.
export const COMPACTION = { thresholdTok: 32_000, workingSetTok: 8_000, summaryTok: 800 } as const;

/** Pure context transition shared by Sandbox, scripted ledgers, and Tokenloons TD. */
export function applyContextLevers(
  state: ContextLeverState,
  input: ContextTurnInput,
  levers: ContextLeverConfig,
): ContextTurnResult {
  let conversationTok = state.conversationTok;
  let compactedTok = 0;
  let compactionInputTok = 0;
  let compactionOutputTok = 0;
  if (levers.autoCompact && conversationTok > COMPACTION.thresholdTok) {
    compactedTok = conversationTok - COMPACTION.workingSetTok;
    compactionInputTok = conversationTok;
    compactionOutputTok = COMPACTION.summaryTok;
    conversationTok = COMPACTION.workingSetTok;
  }
  const toolTok = levers.lazyLoadTools && !input.usesTools ? 0 : TOTAL_TOOL_CONTEXT_TOKENS;
  return {
    prefixTok: input.basePrefixTok + conversationTok + toolTok,
    toolTok,
    compactedTok,
    compactionInputTok,
    compactionOutputTok,
    nextState: { conversationTok: conversationTok + input.growthTok },
  };
}

export function priceCompaction(inputTok: number, outputTok: number): number {
  const config: CostConfig = { model: "haiku", ttl: "5m" };
  return priceTokens(inputTok, "input", config) + priceTokens(outputTok, "output", config);
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
