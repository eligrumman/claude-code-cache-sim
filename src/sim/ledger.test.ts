import { describe, expect, it } from "vitest";
import { simulateMessageLedger, type ScriptedMessage } from "./ledger.js";

describe("simulateMessageLedger prefix growth", () => {
  it("grows the flat-fallback prefix per turn instead of pricing every warm turn identically", () => {
    // Real Claude Code re-reads the accumulating prior context every turn at the
    // 0.1x cache-read rate, so per-turn cost should rise across a conversation
    // instead of staying flat when no explicit contextTok/contextLevers are given.
    const options = { ttl: "1h" as const, model: "sonnet" as const, prefixTok: 20_000, workInTok: 500, outputTok: 700 };
    const script: ScriptedMessage[] = Array.from({ length: 12 }, (_, index) => ({
      id: `t${index}`, role: index % 2 ? "assistant" : "user", text: `turn ${index}`, atMin: index,
    }));

    const ledger = simulateMessageLedger(script, options);

    // Turn 0 still uses the base prefix unchanged.
    expect(ledger.messages[0].buckets.prefix.tokens).toBe(options.prefixTok);

    // Every subsequent turn's prefix is strictly greater than the last.
    for (let i = 1; i < ledger.messages.length; i += 1) {
      expect(ledger.messages[i].buckets.prefix.tokens).toBeGreaterThan(ledger.messages[i - 1].buckets.prefix.tokens);
    }

    // Among warm turns (turn 0 pays a one-off cache write, so compare turn 1 onward,
    // where every turn is a warm cache read on the accumulated, growing prefix),
    // per-turn cost strictly rises instead of staying flat.
    for (let i = 2; i < ledger.messages.length; i += 1) {
      expect(ledger.messages[i].usd).toBeGreaterThan(ledger.messages[i - 1].usd);
    }
  });

  it("does not grow the prefix when an explicit message.contextTok is supplied", () => {
    const options = { ttl: "1h" as const, model: "sonnet" as const, prefixTok: 20_000, workInTok: 500, outputTok: 700 };
    const script: ScriptedMessage[] = Array.from({ length: 5 }, (_, index) => ({
      id: `t${index}`, role: index % 2 ? "assistant" : "user", text: `turn ${index}`, atMin: index, contextTok: 9_000,
    }));

    const ledger = simulateMessageLedger(script, options);

    expect(ledger.messages.every((message) => message.buckets.prefix.tokens === 9_000)).toBe(true);
  });
});
