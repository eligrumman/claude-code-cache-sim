import { describe, expect, it } from "vitest";
import { RATE, tokCost } from "../engine/pricing.js";
import { segmentPromptCascade, simulateDayConvos, type ScriptedMessage } from "./ledger.js";

const script: ScriptedMessage[] = [
  { id: "a", role: "user", text: "Inspect", atMin: 540 },
  { id: "b", role: "assistant", text: "Working", atMin: 542 },
  { id: "c", role: "user", text: "Test it", atMin: 544 },
  { id: "d", role: "assistant", text: "Done", atMin: 546 },
];

describe("modeled multi-conversation workday", () => {
  it("sums lane costs and reuses a shared boilerplate prefix", () => {
    const options = { ttl: "5m" as const, model: "sonnet" as const, prefixTok: 10_000, workInTok: 400, outputTok: 600 };
    const shared = simulateDayConvos(script, options, 2, true);
    const isolated = simulateDayConvos(script, options, 2, false);

    expect(shared.lanes).toHaveLength(3);
    expect(shared.totalUsd).toBeCloseTo(shared.lanes.reduce((sum, lane) => sum + lane.totalUsd, 0), 12);
    expect(shared.totalUsd).toBeLessThan(isolated.totalUsd);
    expect(shared.lanes.filter((lane) => lane.kind === "subagent").every((lane) => lane.messages.length > 0)).toBe(true);
  });
});

describe("prompt invalidation cascade", () => {
  it("prices before-cursor segments as reads and invalidated segments as writes", () => {
    const rows = segmentPromptCascade([
      { label: "System prompt", tokens: 100 },
      { label: "Tool schemas", tokens: 80 },
      { label: "Message 1", tokens: 60 },
      { label: "Changed message", tokens: 40 },
    ], { cacheRead: 180, cacheWrite: 60, freshInput: 40 }, "sonnet", "5m");
    const cursor = rows.findIndex((row) => row.cursor);

    expect(cursor).toBeGreaterThan(0);
    expect(rows.slice(0, cursor).every((row) => row.tier === "read" && row.rate === RATE.read)).toBe(true);
    expect(rows.filter((row) => row.tier === "write").every((row) => row.rate === RATE.w5m)).toBe(true);
    expect(rows.reduce((sum, row) => sum + row.usd, 0)).toBeCloseTo(
      tokCost(180, RATE.read, "sonnet") + tokCost(60, RATE.w5m, "sonnet") + tokCost(40, RATE.input, "sonnet"),
      12,
    );
  });
});
