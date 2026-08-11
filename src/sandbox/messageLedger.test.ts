import { describe, expect, it } from "vitest";
import { simulateMessageLedger } from "./model.js";

describe("per-message cache ledger", () => {
  it("charges cache activity only on user requests and rebuilds after the TTL", () => {
    const day = simulateMessageLedger([
      { id: "m1", role: "user", text: "Refactor the auth module", atMin: 0 },
      { id: "m2", role: "assistant", text: "Running tests…", atMin: 2 },
      { id: "m3", role: "user", text: "Fix the failing test", atMin: 10 },
    ], { ttl: "5m", model: "sonnet", prefixTok: 260_000, workInTok: 0, outputTok: 0 });

    expect(day.messages[0].warm).toBe(false);
    expect(day.messages[0].usd).toBeCloseTo(1, 1);
    expect(day.messages[1].warm).toBe(true);
    expect(day.messages[1].buckets.prefix.tokens).toBe(0);
    expect(day.messages[1].buckets.keepWarm.tokens).toBe(0);
    expect(day.messages[1].usd).toBe(0);
    expect(day.messages[2].warm).toBe(false);
    expect(day.messages[2].usd).toBeCloseTo(day.messages[0].usd);
  });
});
