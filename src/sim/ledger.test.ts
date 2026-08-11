import { describe, expect, it } from "vitest";
import { simulateMessageLedger, type ScriptedMessage } from "./ledger.js";

describe("simulateMessageLedger prefix growth", () => {
  it("grows the flat-fallback prefix per request instead of pricing every warm request identically", () => {
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

    const requests = ledger.messages.filter((message) => message.role === "user");
    for (let i = 1; i < requests.length; i += 1) {
      expect(requests[i].buckets.prefix.tokens).toBeGreaterThan(requests[i - 1].buckets.prefix.tokens);
    }
  });

  it("does not grow the prefix when an explicit message.contextTok is supplied", () => {
    const options = { ttl: "1h" as const, model: "sonnet" as const, prefixTok: 20_000, workInTok: 500, outputTok: 700 };
    const script: ScriptedMessage[] = Array.from({ length: 5 }, (_, index) => ({
      id: `t${index}`, role: index % 2 ? "assistant" : "user", text: `turn ${index}`, atMin: index, contextTok: 9_000,
    }));

    const ledger = simulateMessageLedger(script, options);

    expect(ledger.messages.filter((message) => message.role === "user")
      .every((message) => message.buckets.prefix.tokens === 9_000)).toBe(true);
  });

  it("attributes all request-side cache activity to user turns", () => {
    const ledger = simulateMessageLedger([
      { id: "u1", role: "user", text: "Start", atMin: 0 },
      { id: "a1", role: "assistant", text: "Done", atMin: 3 },
      { id: "u2", role: "user", text: "Continue", atMin: 12 },
      { id: "a2", role: "assistant", text: "Done again", atMin: 20 },
    ], { ttl: "5m", model: "sonnet", prefixTok: 20_000, workInTok: 500, outputTok: 700, keepWarm: true });

    for (const assistant of ledger.messages.filter((message) => message.role === "assistant")) {
      expect(assistant.buckets.prefix.tokens).toBe(0);
      expect(assistant.buckets.prefix.usd).toBe(0);
      expect(assistant.buckets.keepWarm.tokens).toBe(0);
      expect(assistant.buckets.keepWarm.usd).toBe(0);
      expect(assistant.buckets.workIn.tokens).toBe(0);
      expect(assistant.buckets.output.tokens).toBe(700);
    }
  });

  it("classifies cache warmth from user request timing, ignoring assistant timing", () => {
    const ledger = simulateMessageLedger([
      { id: "u1", role: "user", text: "Start", atMin: 0 },
      { id: "a1", role: "assistant", text: "A late response", atMin: 4 },
      { id: "u2", role: "user", text: "Still warm", atMin: 4.5 },
      { id: "a2", role: "assistant", text: "An immediate response", atMin: 4.6 },
      { id: "u3", role: "user", text: "Now cold", atMin: 10 },
    ], { ttl: "5m", model: "sonnet", prefixTok: 20_000, workInTok: 500, outputTok: 700 });

    const [first, withinTtl, afterTtl] = ledger.messages.filter((message) => message.role === "user");
    expect(first.warm).toBe(false);
    expect(withinTtl.warm).toBe(true);
    expect(afterTtl.warm).toBe(false);
    expect(withinTtl.reason).toMatch(/warm read/);
    expect(afterTtl.reason).toMatch(/TTL expired/);
  });

  it("preserves one combined request's token charges across a user-assistant pair", () => {
    const options = { ttl: "5m" as const, model: "sonnet" as const, prefixTok: 20_000, workInTok: 500, outputTok: 700 };
    const ledger = simulateMessageLedger([
      { id: "u1", role: "user", text: "Start", atMin: 0 },
      { id: "a1", role: "assistant", text: "Done", atMin: 1 },
    ], options);

    expect(ledger.messages[0].buckets.prefix.tokens).toBe(options.prefixTok);
    expect(ledger.messages[0].buckets.workIn.tokens).toBe(options.workInTok);
    expect(ledger.messages[0].buckets.output.tokens).toBe(0);
    expect(ledger.messages[1].buckets.output.tokens).toBe(options.outputTok);
    expect(ledger.messages[0].buckets.prefix.tokens + ledger.messages[0].buckets.workIn.tokens
      + ledger.messages[1].buckets.output.tokens).toBe(options.prefixTok + options.workInTok + options.outputTok);
  });
});
