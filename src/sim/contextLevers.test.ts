import { describe, expect, it } from "vitest";
import { simulateMessageLedger, type ScriptedMessage } from "./ledger.js";

const options = {
  ttl: "1h" as const,
  model: "sonnet" as const,
  prefixTok: 20_000,
  workInTok: 0,
  outputTok: 0,
};

describe("shared context cost levers", () => {
  it("auto-compact charges real Haiku summary events and wins on a long session", () => {
    const script: ScriptedMessage[] = Array.from({ length: 36 }, (_, index) => ({
      id: `long-${index}`, role: index % 2 ? "assistant" : "user", text: `turn ${index}`,
      atMin: index, contextGrowthTok: 4_000,
    }));
    const compact = simulateMessageLedger(script, {
      ...options, contextLevers: { autoCompact: true, lazyLoadTools: true },
    });
    const balloon = simulateMessageLedger(script, {
      ...options, contextLevers: { autoCompact: false, lazyLoadTools: true },
    });

    expect(compact.compactionCount).toBeGreaterThan(0);
    expect(compact.messages.some((message) => message.buckets.compaction.usd > 0)).toBe(true);
    expect(compact.messages.find((message) => message.compactedTok > 0)?.reason).toMatch(/Auto-compact summarized/);
    expect(compact.totalUsd).toBeLessThan(balloon.totalUsd);
  });

  it("eager tool context inflates every prefix while lazy context appears only when invoked", () => {
    const script: ScriptedMessage[] = [
      { id: "plain", role: "user", text: "Explain this function", atMin: 0, usesTools: false, contextGrowthTok: 0 },
      { id: "tool", role: "user", text: "Search the MCP", atMin: 1, usesTools: true, contextGrowthTok: 0 },
    ];
    const eager = simulateMessageLedger(script, {
      ...options, contextLevers: { autoCompact: false, lazyLoadTools: false },
    });
    const lazy = simulateMessageLedger(script, {
      ...options, contextLevers: { autoCompact: false, lazyLoadTools: true },
    });

    expect(eager.messages[0].buckets.prefix.tokens - lazy.messages[0].buckets.prefix.tokens).toBe(14_000);
    expect(lazy.messages[1].buckets.prefix.tokens).toBe(eager.messages[1].buckets.prefix.tokens);
    expect(lazy.totalUsd).toBeLessThan(eager.totalUsd);
  });
});
