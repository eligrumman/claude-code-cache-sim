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
  /** Optional conversation-local context state when multiple lanes share one cached prefix. */
  contextKey?: string;
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

export interface DayConversationLane {
  id: string;
  label: string;
  kind: "main" | "subagent";
  messages: MessageLedgerEntry[];
  totalUsd: number;
}

export interface DayConversationLedger {
  lanes: DayConversationLane[];
  messages: MessageLedgerEntry[];
  totalUsd: number;
}

export type PromptSegmentTier = "read" | "write" | "input";

export interface PromptLogicalSegment { label: string; tokens: number }

export interface PromptCascadeSegment extends PromptLogicalSegment {
  id: string;
  tier: PromptSegmentTier;
  rate: number;
  usd: number;
  /** True on the first segment at or after cache reuse stops. */
  cursor: boolean;
}

export interface PromptCascadeReceipt {
  cacheRead: number;
  cacheWrite: number;
  freshInput: number;
}

/**
 * Itemize an ordered prompt against the provider's billing buckets. Logical rows
 * are split at billing boundaries, so the cache-break cursor is exact even when
 * it falls part-way through tool schemas or a message.
 */
export function segmentPromptCascade(
  logical: readonly PromptLogicalSegment[],
  receipt: PromptCascadeReceipt,
  model: Model,
  ttl: Ttl,
): PromptCascadeSegment[] {
  const expected = receipt.cacheRead + receipt.cacheWrite + receipt.freshInput;
  const actual = logical.reduce((sum, segment) => sum + segment.tokens, 0);
  if (actual !== expected) {
    throw new Error(`Prompt segments total ${actual} tokens; receipt totals ${expected}`);
  }
  const spans: Array<{ tier: PromptSegmentTier; remaining: number; rate: number }> = [
    { tier: "read", remaining: receipt.cacheRead, rate: RATE.read },
    { tier: "write", remaining: receipt.cacheWrite, rate: ttl === "5m" ? RATE.w5m : RATE.w1h },
    { tier: "input", remaining: receipt.freshInput, rate: RATE.input },
  ];
  const rows: PromptCascadeSegment[] = [];
  let spanIndex = 0;
  let serial = 0;
  let cursorPlaced = false;
  for (const segment of logical) {
    let remaining = segment.tokens;
    let part = 0;
    while (remaining > 0) {
      while (spanIndex < spans.length && spans[spanIndex].remaining === 0) spanIndex += 1;
      const span = spans[spanIndex];
      if (!span) throw new Error("Prompt receipt ran out before logical segments");
      const tokens = Math.min(remaining, span.remaining);
      const cursor = !cursorPlaced && span.tier !== "read";
      if (cursor) cursorPlaced = true;
      rows.push({
        id: `${serial++}-${span.tier}`,
        label: part === 0 ? segment.label : `${segment.label} (continued)`,
        tokens,
        tier: span.tier,
        rate: span.rate,
        usd: priceTokens(tokens, span.tier === "read" ? "cacheRead" : span.tier === "write" ? "cacheWrite" : "input", { model, ttl }),
        cursor,
      });
      remaining -= tokens;
      span.remaining -= tokens;
      part += 1;
    }
  }
  return rows;
}

/**
 * Build one modeled workday as concurrent main/subagent lanes. All lanes use the
 * same prefix identity when `sharePrefix` is true, exposing cross-conversation
 * cache reuse while retaining independent lane histories and totals.
 */
export function simulateDayConvos(
  script: readonly ScriptedMessage[],
  options: MessageLedgerOptions,
  subagentCount: number,
  sharePrefix: boolean,
): DayConversationLedger {
  const laneDefs: Array<{ id: string; label: string; kind: "main" | "subagent"; script: ScriptedMessage[] }> = [];
  const prefixFor = (laneId: string) => sharePrefix ? "shared-boilerplate" : laneId;
  laneDefs.push({
    id: "main", label: "Main thread", kind: "main",
    script: script.map((message, index) => ({
      ...message,
      id: `main:${message.id}`,
      prefixKey: prefixFor("main"),
      contextKey: "main",
      contextTok: message.contextTok ?? (options.contextLevers ? options.prefixTok : options.prefixTok + index * Math.round(options.workInTok * 0.7)),
    })),
  });
  for (let laneIndex = 0; laneIndex < subagentCount; laneIndex += 1) {
    const laneId = `sub${laneIndex + 1}`;
    const source = script.filter((_message, index) => index % Math.max(2, subagentCount + 1) === laneIndex % Math.max(2, subagentCount + 1)).slice(0, 4);
    const fallback = script.slice(0, Math.min(3, script.length));
    const selected = source.length ? source : fallback;
    laneDefs.push({
      id: laneId, label: `Subagent ${laneIndex + 1}`, kind: "subagent",
      script: selected.map((message, index) => ({
        ...message,
        id: `${laneId}:${message.id}`,
        subagent: true,
        atMin: message.atMin + laneIndex * 0.2 + 0.1,
        prefixKey: prefixFor(laneId),
        contextKey: laneId,
        contextTok: options.contextLevers ? options.prefixTok : options.prefixTok + index * Math.round(options.workInTok * 0.55),
        workInTok: Math.max(80, Math.round((message.workInTok ?? options.workInTok) * 0.72)),
        outputTok: Math.max(120, Math.round((message.outputTok ?? options.outputTok) * 0.68)),
      })),
    });
  }
  const combined = laneDefs.flatMap((lane) => lane.script)
    .sort((left, right) => left.atMin - right.atMin || left.id.localeCompare(right.id));
  const ledger = simulateMessageLedger(combined, options);
  const lanes = laneDefs.map((lane): DayConversationLane => {
    const messages = ledger.messages.filter((message) => message.id.startsWith(`${lane.id}:`));
    return { id: lane.id, label: lane.label, kind: lane.kind, messages, totalUsd: messages.reduce((sum, message) => sum + message.usd, 0) };
  });
  return { lanes, messages: ledger.messages, totalUsd: ledger.totalUsd };
}

/** Deterministic per-message ledger shared by the Sandbox, article, and TD. */
export function simulateMessageLedger(script: ScriptedMessage[], options: MessageLedgerOptions): MessageLedger {
  const ttlMin = options.ttl === "5m" ? 5 : 60;
  const writeRate = options.ttl === "5m" ? RATE.w5m : RATE.w1h;
  let lastTouch = Number.NEGATIVE_INFINITY;
  let lastPrefixKey: string | undefined;
  let requestIndex = 0;
  const contextStates = new Map<string, ContextLeverState>();
  const messages = script.map((message, index): MessageLedgerEntry => {
    const gapMin = index === 0 ? 0 : message.atMin - script[index - 1].atMin;
    const isRequest = message.role === "user";
    const prefixKey = message.prefixKey ?? "main";
    const contextKey = message.contextKey ?? prefixKey;
    const priorMessage = script[index - 1];
    // Some request-only consumers seed the ledger with a zero-token assistant
    // marker for an earlier request that happened outside the supplied script.
    // Treat that timestamp as the omitted request's touch without billing the
    // marker itself or letting ordinary assistant replies refresh the cache.
    if (isRequest && !Number.isFinite(lastTouch) && priorMessage?.role === "assistant"
      && priorMessage.contextTok === 0 && priorMessage.workInTok === 0 && priorMessage.outputTok === 0) {
      lastTouch = priorMessage.atMin;
      lastPrefixKey = priorMessage.prefixKey ?? "main";
    }
    const samePrefix = lastPrefixKey === undefined || prefixKey === lastPrefixKey;
    const naturalWarm = samePrefix && message.atMin - lastTouch < ttlMin;
    let pingTokens = 0;

    const workInTok = isRequest ? message.workInTok ?? options.workInTok : 0;
    const hasAssistantResponse = script[index + 1]?.role === "assistant";
    // Request-only simulations keep their output on the request entry. In a
    // conversation, the following assistant entry owns that same output cost.
    const outputTok = isRequest
      ? hasAssistantResponse ? 0 : message.outputTok ?? options.outputTok
      : message.outputTok ?? options.outputTok;
    const responseOutputTok = hasAssistantResponse
      ? script[index + 1].outputTok ?? options.outputTok
      : outputTok;
    const contextTurn = isRequest && options.contextLevers
      ? applyContextLevers(
        contextStates.get(contextKey) ?? { conversationTok: 0 },
        {
          basePrefixTok: message.contextTok ?? options.prefixTok,
          growthTok: message.contextGrowthTok ?? workInTok + responseOutputTok,
          usesTools: Boolean(message.usesTools),
        },
        options.contextLevers,
      )
      : null;
    // When neither an explicit contextLever prefix nor an explicit per-message
    // contextTok is supplied, the cached prefix grows each turn: the prior turn's
    // user input and assistant output both become part of the cached context that
    // the next request re-reads, so request N's flat-fallback prefix is the base
    // prefix plus N * (workIn + output) rather than a constant.
    const growthPerTurn = (options.workInTok || 0) + (options.outputTok || 0);
    const flatFallback = options.prefixTok + requestIndex * growthPerTurn;
    const prefixTok = isRequest ? contextTurn?.prefixTok ?? message.contextTok ?? flatFallback : 0;
    if (contextTurn) contextStates.set(contextKey, contextTurn.nextState);

    if (isRequest && options.keepWarm && samePrefix && Number.isFinite(lastTouch) && !naturalWarm) {
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
    const cacheReason = !isRequest
      ? `assistant output: ${outputTok.toLocaleString()} tokens billed at the output rate`
      : warm
      ? `${pingTokens ? "kept warm" : "warm read"}: prefix still live, ${prefixTok.toLocaleString()} × 0.1 × $${MODEL_IN[options.model]}/M = ${prefixPrice}`
      : !samePrefix
        ? `prompt changed: a different prefix must be written, ${prefixTok.toLocaleString()} tokens at ${writeRate}× = ${prefixPrice}`
        : requestIndex === 0
          ? `first message: ${prefixTok.toLocaleString()}-tok prefix written at ${writeRate}× = ${prefixPrice}`
          : `TTL expired: ${message.atMin - lastTouch} min gap > ${ttlMin} min → ${prefixTok.toLocaleString()}-tok prefix rebuilt at ${writeRate}× = ${prefixPrice}`;
    const reason = contextTurn?.compactedTok
      ? `Auto-compact summarized ${contextTurn.compactedTok.toLocaleString()} old context tokens for $${compactionUsd.toFixed(3)}. ${cacheReason}`
      : cacheReason;

    if (isRequest) {
      lastTouch = message.atMin;
      lastPrefixKey = prefixKey;
      requestIndex += 1;
    }
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
