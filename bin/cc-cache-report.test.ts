// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aggregateUsage, priceUsage } from "./cc-cache-report.mjs";

describe("cc-cache-report aggregation", () => {
  it("computes cache-hit rate from all prefix-token billing classes", () => {
    const report = aggregateUsage([{
      type: "assistant",
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 100,
          cache_read_input_tokens: 600,
          cache_creation_input_tokens: 300,
          cache_creation: {
            ephemeral_5m_input_tokens: 200,
            ephemeral_1h_input_tokens: 100,
          },
          output_tokens: 50,
        },
      },
    }]);

    expect(report.cacheHitRate).toBeCloseTo(0.6);
    expect(report.totalTokens).toBe(1_050);
  });

  it("prices every class with the source-of-truth Sonnet multipliers", () => {
    const priced = priceUsage({ input: 100, read: 600, write5m: 200, write1h: 100, output: 50 }, "sonnet");

    expect(priced.byClass.input).toBeCloseTo(0.0003, 10);
    expect(priced.byClass.read).toBeCloseTo(0.00018, 10);
    expect(priced.byClass.write5m).toBeCloseTo(0.00075, 10);
    expect(priced.byClass.write1h).toBeCloseTo(0.0006, 10);
    expect(priced.byClass.output).toBeCloseTo(0.00075, 10);
    expect(priced.total).toBeCloseTo(0.00258);
  });

  it("ignores malformed and empty events without throwing", () => {
    expect(() => aggregateUsage([null, {}, "bad", { type: "assistant" }, { type: "user", usage: {} }])).not.toThrow();
    expect(aggregateUsage([null, {}, "bad"]).totals).toEqual({ input: 0, read: 0, write5m: 0, write1h: 0, output: 0 });
    expect(aggregateUsage([]).totalCost).toBe(0);
  });
});
