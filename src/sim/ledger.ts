import type { Model } from "../engine/types.js";
import { MODEL_IN, RATE, priceTokens, type Ttl } from "./cost.js";

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
  };
  usd: number;
}

export interface MessageLedgerOptions {
  ttl: Ttl;
  model: Model;
  prefixTok: number;
  workInTok: number;
  outputTok: number;
  keepWarm?: boolean;
}

export interface MessageLedger { messages: MessageLedgerEntry[]; totalUsd: number }

/** Deterministic per-message ledger shared by the Sandbox, article, and TD. */
export function simulateMessageLedger(script: ScriptedMessage[], options: MessageLedgerOptions): MessageLedger {
  const ttlMin = options.ttl === "5m" ? 5 : 60;
  const writeRate = options.ttl === "5m" ? RATE.w5m : RATE.w1h;
  let lastTouch = Number.NEGATIVE_INFINITY;
  let lastPrefixKey: string | undefined;
  const messages = script.map((message, index): MessageLedgerEntry => {
    const gapMin = index === 0 ? 0 : message.atMin - script[index - 1].atMin;
    const prefixKey = message.prefixKey ?? "main";
    const samePrefix = lastPrefixKey === undefined || prefixKey === lastPrefixKey;
    const naturalWarm = samePrefix && message.atMin - lastTouch < ttlMin;
    let pingTokens = 0;

    if (options.keepWarm && samePrefix && Number.isFinite(lastTouch) && !naturalWarm) {
      const pingEvery = Math.max(1, ttlMin - 1);
      let pingAt = lastTouch + pingEvery;
      while (pingAt < message.atMin) {
        pingTokens += message.contextTok ?? options.prefixTok;
        lastTouch = pingAt;
        pingAt += pingEvery;
      }
    }

    const prefixTok = message.contextTok ?? options.prefixTok;
    const workInTok = message.workInTok ?? options.workInTok;
    const outputTok = message.outputTok ?? options.outputTok;
    const warm = samePrefix && message.atMin - lastTouch < ttlMin;
    const prefixBucket = warm ? "cacheRead" : "cacheWrite";
    const prefixUsd = priceTokens(prefixTok, prefixBucket, options);
    const workInUsd = priceTokens(workInTok, "input", options);
    const outputUsd = priceTokens(outputTok, "output", options);
    const keepWarmUsd = priceTokens(pingTokens, "keepWarm", options);
    const prefixPrice = `$${prefixUsd.toFixed(3)}`;
    const reason = warm
      ? `${pingTokens ? "kept warm" : "warm read"}: prefix still live, ${prefixTok.toLocaleString()} × 0.1 × $${MODEL_IN[options.model]}/M = ${prefixPrice}`
      : !samePrefix
        ? `prompt changed: a different prefix must be written, ${prefixTok.toLocaleString()} tokens at ${writeRate}× = ${prefixPrice}`
        : index === 0
          ? `first message: ${prefixTok.toLocaleString()}-tok prefix written at ${writeRate}× = ${prefixPrice}`
          : `TTL expired: ${gapMin} min gap > ${ttlMin} min → ${prefixTok.toLocaleString()}-tok prefix rebuilt at ${writeRate}× = ${prefixPrice}`;

    lastTouch = message.atMin;
    lastPrefixKey = prefixKey;
    const buckets = {
      prefix: { tokens: prefixTok, usd: prefixUsd },
      workIn: { tokens: workInTok, usd: workInUsd },
      output: { tokens: outputTok, usd: outputUsd },
      keepWarm: { tokens: pingTokens, usd: keepWarmUsd },
    };
    return { ...message, gapMin, warm, reason, buckets, usd: prefixUsd + workInUsd + outputUsd + keepWarmUsd };
  });
  return { messages, totalUsd: messages.reduce((sum, message) => sum + message.usd, 0) };
}
