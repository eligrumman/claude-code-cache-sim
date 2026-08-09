import { describe, it, expect } from "vitest";
import { RATE, MODEL_IN, priceTable, tokCost } from "./pricing.js";

describe("price tables to the cent (C2-C4)", () => {
  it("haiku is the cheap dispatch tier", () => {
    const p = priceTable("haiku");
    expect(p.input).toBe(1);
    expect(p.read).toBeCloseTo(0.1, 10);
    expect(p.output).toBe(5);
  });

  it("sonnet per 1M (C3)", () => {
    const p = priceTable("sonnet");
    expect(p.input).toBe(3);
    expect(p.read).toBeCloseTo(0.3, 10);
    expect(p.write5m).toBe(3.75);
    expect(p.write1h).toBe(6);
    expect(p.output).toBe(15);
  });

  it("opus per 1M (C2) - input is $5/M NOT $15", () => {
    const p = priceTable("opus");
    expect(p.input).toBe(5);
    expect(p.read).toBe(0.5);
    expect(p.write5m).toBe(6.25);
    expect(p.write1h).toBe(10);
    expect(p.output).toBe(25);
  });

  it("fable per 1M (C4)", () => {
    const p = priceTable("fable");
    expect(p.input).toBe(10);
    expect(p.read).toBe(1);
    expect(p.write5m).toBe(12.5);
    expect(p.write1h).toBe(20);
    expect(p.output).toBe(50);
  });
});

describe("rate structure", () => {
  it("20x read-vs-1h-write gap (C5)", () => {
    expect(RATE.w1h / RATE.read).toBe(20);
  });

  it("MODEL_IN base prices", () => {
    expect(MODEL_IN).toEqual({ haiku: 1, sonnet: 3, opus: 5, fable: 10 });
  });

  it("tokCost matches tok * rate * price/1e6", () => {
    // 1M sonnet output tokens at 5x = $15.
    expect(tokCost(1_000_000, RATE.out, "sonnet")).toBeCloseTo(15, 9);
  });
});
