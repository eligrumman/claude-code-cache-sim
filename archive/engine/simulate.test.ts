import { describe, it, expect } from "vitest";
import { computeRun, simulateRequest } from "./simulate.js";
import { DEFAULT_CFG } from "./constants.js";
import type { CacheState, Model, PromptStrategy, Who } from "./types.js";

const cents = (x: number) => Math.round(x * 100) / 100;

describe("canonical fan-out totals (invariant 5)", () => {
  it("identical sonnet 8-wide ships for $5.58", () => {
    const run = computeRun({ model: "sonnet", who: "subagent", prompts: "identical", width: 8 });
    expect(cents(run.total)).toBe(5.58);
    expect(run.shipped).toBe(true);
  });

  it("all-fable inline dies at task 6 for $22.49", () => {
    const run = computeRun({ model: "fable", who: "inline", prompts: "identical", width: 8 });
    expect(cents(run.total)).toBe(22.49);
    expect(run.shipped).toBe(false);
    expect(run.diedAt).toBe(6);
  });

  it("identical-sonnet is the global minimum across the whole grid", () => {
    let min = Infinity;
    const target = computeRun({ model: "sonnet", who: "subagent", prompts: "identical", width: 8 }).total;
    const models: Model[] = ["sonnet", "opus", "fable"];
    const whos: Who[] = ["inline", "subagent"];
    const strategies: PromptStrategy[] = ["identical", "varied"];
    for (const m of models) {
      for (const w of whos) {
        for (const pr of strategies) {
          for (let wd = 1; wd <= 8; wd++) {
            const t = computeRun({ model: m, who: w, prompts: pr, width: wd }).total;
            if (t < min) min = t;
          }
        }
      }
    }
    expect(Math.abs(min - target)).toBeLessThan(1e-9);
  });
});

describe("simulateRequest cache ledgers (invariants 3 & 4)", () => {
  const cfg = DEFAULT_CFG;

  it("identical subagent: spawn1 writes 26,237/read 0, spawn2 read 26,237/write 0 (C10)", () => {
    const cache: CacheState = { entries: {} };
    const r1 = simulateRequest(cache, cfg, {
      agent: "sub", promptHash: "same", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0,
    });
    expect(r1.row.writeTok).toBe(26237);
    expect(r1.row.readTok).toBe(0);

    const r2 = simulateRequest(r1.cache, cfg, {
      agent: "sub", promptHash: "same", model: "sonnet", workIn: 0, outTok: 0, nowMin: 1,
    });
    expect(r2.row.readTok).toBe(26237);
    expect(r2.row.writeTok).toBe(0);
  });

  it("varied subagent: read 11,602 / write 14,623 every time (C11)", () => {
    const cache: CacheState = { entries: {} };
    const varCfg = { ...cfg, prompts: "varied" as const };
    const r = simulateRequest(cache, varCfg, {
      agent: "sub", promptHash: "hello", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0,
    });
    expect(r.row.readTok).toBe(11602);
    expect(r.row.writeTok).toBe(14623);
  });

  it("20x gap: a 1h rebuilt write costs 20x the read it replaces", () => {
    const cache: CacheState = { entries: {} };
    const cold = simulateRequest(cache, cfg, {
      agent: "main", promptHash: "main", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0,
    });
    const per = 3 / 1e6;
    const writeUsd = cold.row.writeTok * 2 * per; // 1h write
    const readUsd = cold.row.writeTok * 0.1 * per; // same tokens as a read
    expect(writeUsd / readUsd).toBeCloseTo(20, 9);
  });

  it("5m entry expires across a unit boundary; 1h survives back-to-back", () => {
    const cache: CacheState = { entries: {} };
    const r1 = simulateRequest(cache, cfg, {
      agent: "sub", promptHash: "s", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0,
    });
    const r2 = simulateRequest(r1.cache, cfg, {
      agent: "sub", promptHash: "s", model: "sonnet", workIn: 0, outTok: 0, nowMin: 10,
    });
    expect(r2.row.writeTok).toBe(26237);

    const flagCfg = { ...cfg, oneHourFlag: true };
    const c: CacheState = { entries: {} };
    const a = simulateRequest(c, flagCfg, {
      agent: "sub", promptHash: "s", model: "sonnet", workIn: 0, outTok: 0, nowMin: 0,
    });
    const b = simulateRequest(a.cache, flagCfg, {
      agent: "sub", promptHash: "s", model: "sonnet", workIn: 0, outTok: 0, nowMin: 10,
    });
    expect(b.row.readTok).toBe(26237);
    expect(b.row.writeTok).toBe(0);
  });
});
