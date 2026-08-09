import type { Model } from "../engine/types.js";
import {
  applyContextLevers, MODEL_IN, priceCompaction, RATE, priceTokens,
  type ContextLeverConfig, type ContextLeverState, type Ttl,
} from "./cost.js";

export type { Ttl } from "./cost.js";

export interface ScriptedMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  atMin: number;
  /** A changed identity cannot reuse the prior cached prefix. */
  prefixKey?: string;
  /** Used by scenario consumers such as TD to render fan-out work. */
  subagent?: boolean;
  contextTok?: number;
  workInTok?: number;
  outputTok?: number;
  /** Conversation growth can differ from billed work/output for synthetic workloads. */
  contextGrowthTok?: number;
  /** Whether this turn invokes a skill or MCP and therefore needs lazy tool context. */
  usesTools?: boolean;
}

export interface MessageBucket { tokens: number; usd: number }

export interface MessageLedgerEntry extends ScriptedMessage {
  gapMin: number;
  warm: boolean;
  reason: string;
  buckets: {
    prefix: MessageBucket;
    workIn: MessageBucket;
    output: MessageBucket;
    keepWarm: MessageBucket;
    /** Haiku summary event: input + output tokens are combined for display. */
    compaction: MessageBucket;
  };
  compactedTok: number;
  usd: number;
}

export interface MessageLedgerOptions {
  ttl: Ttl;
  model: Model;
  prefixTok: number;
  workInTok: number;
  outputTok: number;
  keepWarm?: boolean;
  contextLevers?: ContextLeverConfig;
}

export interface MessageLedger { messages: MessageLedgerEntry[]; totalUsd: number; compactionCount: number }

/** Deterministic per-message ledger shared by the Sandbox, article, and TD. */
export function simulateMessageLedger(script: ScriptedMessage[], options: MessageLedgerOptions): MessageLedger {
  const ttlMin = options.ttl === "5m" ? 5 : 60;
  const writeRate = options.ttl === "5m" ? RATE.w5m : RATE.w1h;
  let lastTouch = Number.NEGATIVE_INFINITY;
  let lastPrefixKey: string | undefined;
  const contextStates = new Map<string, ContextLeverState>();
  const messages = script.map((message, index): MessageLedgerEntry => {
    const gapMin = index === 0 ? 0 : message.atMin - script[index - 1].atMin;
    const prefixKey = message.prefixKey ?? "main";
    const samePrefix = lastPrefixKey === undefined || prefixKey === lastPrefixKey;
    const naturalWarm = samePrefix && message.atMin - lastTouch < ttlMin;
    let pingTokens = 0;

    const workInTok = message.workInTok ?? options.workInTok;
    const outputTok = message.outputTok ?? options.outputTok;
    const contextTurn = options.contextLevers
      ? applyContextLevers(
        contextStates.get(prefixKey) ?? { conversationTok: 0 },
        {
          basePrefixTok: message.contextTok ?? options.prefixTok,
          growthTok: message.contextGrowthTok ?? workInTok + outputTok,
          usesTools: Boolean(message.usesTools),
        },
        options.contextLevers,
      )
      : null;
    const prefixTok = contextTurn?.prefixTok ?? message.contextTok ?? options.prefixTok;
    if (contextTurn) contextStates.set(prefixKey, contextTurn.nextState);

    if (options.keepWarm && samePrefix && Number.isFinite(lastTouch) && !naturalWarm) {
      const pingEvery = Math.max(1, ttlMin - 1);
      let pingAt = lastTouch + pingEvery;
      while (pingAt < message.atMin) {
        pingTokens += prefixTok;
        lastTouch = pingAt;
        pingAt += pingEvery;
      }
    }

    // Compaction rewrites only the history suffix; the stable cached system/repository
    // prefix remains reusable. The Haiku summary event above pays for the changed suffix.
    const warm = samePrefix && message.atMin - lastTouch < ttlMin;
    const prefixBucket = warm ? "cacheRead" : "cacheWrite";
    const prefixUsd = priceTokens(prefixTok, prefixBucket, options);
    const workInUsd = priceTokens(workInTok, "input", options);
    const outputUsd = priceTokens(outputTok, "output", options);
    const keepWarmUsd = priceTokens(pingTokens, "keepWarm", options);
    const compactionTokens = (contextTurn?.compactionInputTok ?? 0) + (contextTurn?.compactionOutputTok ?? 0);
    const compactionUsd = priceCompaction(contextTurn?.compactionInputTok ?? 0, contextTurn?.compactionOutputTok ?? 0);
    const prefixPrice = `$${prefixUsd.toFixed(3)}`;
    const cacheReason = warm
      ? `${pingTokens ? "kept warm" : "warm read"}: prefix still live, ${prefixTok.toLocaleString()} × 0.1 × $${MODEL_IN[options.model]}/M = ${prefixPrice}`
      : !samePrefix
        ? `prompt changed: a different prefix must be written, ${prefixTok.toLocaleString()} tokens at ${writeRate}× = ${prefixPrice}`
        : index === 0
          ? `first message: ${prefixTok.toLocaleString()}-tok prefix written at ${writeRate}× = ${prefixPrice}`
          : `TTL expired: ${gapMin} min gap > ${ttlMin} min → ${prefixTok.toLocaleString()}-tok prefix rebuilt at ${writeRate}× = ${prefixPrice}`;
    const reason = contextTurn?.compactedTok
      ? `Auto-compact summarized ${contextTurn.compactedTok.toLocaleString()} old context tokens for $${compactionUsd.toFixed(3)}. ${cacheReason}`
      : cacheReason;

    lastTouch = message.atMin;
    lastPrefixKey = prefixKey;
    const buckets = {
      prefix: { tokens: prefixTok, usd: prefixUsd },
      workIn: { tokens: workInTok, usd: workInUsd },
      output: { tokens: outputTok, usd: outputUsd },
      keepWarm: { tokens: pingTokens, usd: keepWarmUsd },
      compaction: { tokens: compactionTokens, usd: compactionUsd },
    };
    return {
      ...message, gapMin, warm, reason, buckets, compactedTok: contextTurn?.compactedTok ?? 0,
      usd: prefixUsd + workInUsd + outputUsd + keepWarmUsd + compactionUsd,
    };
  });
  return {
    messages,
    totalUsd: messages.reduce((sum, message) => sum + message.usd, 0),
    compactionCount: messages.filter((message) => message.compactedTok > 0).length,
  };
}
