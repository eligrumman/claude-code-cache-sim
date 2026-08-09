import { describe, it, expect } from "vitest";
import { generateSession, priceTurn, priceLayers, requestLayers, COMPACTION_THRESHOLD_TOK } from "./session.js";
import { DEFAULT_CFG } from "./constants.js";
import { RATE, MODEL_IN } from "./pricing.js";
import type { Config } from "./types.js";

const cfg: Config = { ...DEFAULT_CFG };

describe("generateSession determinism", () => {
  it("same (kind, seed, cfg) yields byte-identical streams", () => {
    const a = generateSession("main", 7, cfg);
    const b = generateSession("main", 7, cfg);
    expect(a).toEqual(b);
  });

  it("different seeds diverge", () => {
    const a = generateSession("main", 7, cfg);
    const b = generateSession("main", 8, cfg);
    expect(a.turns.length === b.turns.length && a.turns[0].cacheWrite === b.turns[0].cacheWrite).toBe(false);
  });
});

describe("generateSession shape invariants", () => {
  for (const kind of ["main", "subagent"] as const) {
    for (const seed of [1, 2, 3, 42, 99, 1234]) {
      it(`${kind} seed=${seed}: turn 0 is a cold write, cache_read monotonic between events`, () => {
        const s = generateSession(kind, seed, cfg);
        expect(s.turns.length).toBeGreaterThan(0);
        const t0 = s.turns[0];
        expect(t0.cacheRead).toBe(0);
        expect(t0.cacheWrite).toBeGreaterThan(0);

        let prevCtx = t0.cacheRead + t0.cacheWrite;
        for (let i = 1; i < s.turns.length; i++) {
          const t = s.turns[i];
          if (t.event === "rebuild" || t.event === "compaction") {
            // signature: read collapses to 0
            expect(t.cacheRead).toBe(0);
            expect(t.cacheWrite).toBeGreaterThan(0);
          } else {
            // monotonic growth: this turn's read >= previous accumulated ctx
            expect(t.cacheRead).toBeGreaterThanOrEqual(prevCtx);
          }
          prevCtx = t.cacheRead + t.cacheWrite;
        }
      });
    }
  }

  it("compaction fires once accumulated context crosses the threshold", () => {
    // Find a seed/kind combo that runs long enough to actually cross it.
    let found = false;
    for (let seed = 0; seed < 200 && !found; seed++) {
      const s = generateSession("main", seed, cfg);
      if (s.compactedAt.length > 0) {
        found = true;
        for (const idx of s.compactedAt) {
          const t = s.turns[idx];
          expect(t.event).toBe("compaction");
          expect(t.cacheRead).toBe(0);
        }
      }
    }
    expect(found).toBe(true);
  });

  it("rebuild rate across many seeds lands near the ~33% SESSION_PROFILE rate for eligible sessions", () => {
    let eligible = 0;
    let rebuilt = 0;
    for (let seed = 0; seed < 500; seed++) {
      const s = generateSession("main", seed, cfg);
      if (s.turns.length > 5) {
        eligible++;
        if (s.rebuiltAt.length > 0) rebuilt++;
      }
    }
    const rate = rebuilt / eligible;
    expect(rate).toBeGreaterThan(0.15);
    expect(rate).toBeLessThan(0.5);
  });
});

describe("requestLayers", () => {
  it("main layers sum to the total field", () => {
    const l = requestLayers(cfg, "main");
    expect(l.tools + l.system + l.hookCatalog + l.memory + l.messagesResidue).toBe(l.total);
  });
  it("subagent layers are scaled down from main (reduced toolset)", () => {
    const main = requestLayers(cfg, "main");
    const sub = requestLayers(cfg, "subagent");
    expect(sub.total).toBeLessThan(main.total);
  });
});

describe("price breakdown math", () => {
  it("cache_read is priced at exactly 0.1x model input price", () => {
    const turn = { idx: 1, input: 1, output: 100, cacheRead: 10000, cacheWrite: 0, writeTier: "1h" as const, pingPongs: 0, event: null };
    const bd = priceTurn(turn, "sonnet");
    const readLine = bd.lines.find((l) => l.label === "cache_read")!;
    expect(readLine.mult).toBe(RATE.read);
    expect(readLine.usd).toBeCloseTo(10000 * 0.1 * (MODEL_IN.sonnet / 1e6), 10);
  });

  it("5m cache_write is priced at 1.25x, 1h at 2x", () => {
    const t5m = { idx: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 1000, writeTier: "5m" as const, pingPongs: 0, event: null };
    const t1h = { ...t5m, writeTier: "1h" as const };
    const b5 = priceTurn(t5m, "opus").lines.find((l) => l.label.startsWith("cache_write"))!;
    const b1 = priceTurn(t1h, "opus").lines.find((l) => l.label.startsWith("cache_write"))!;
    expect(b5.mult).toBe(RATE.w5m);
    expect(b1.mult).toBe(RATE.w1h);
    expect(b1.usd).toBeCloseTo(b5.usd * (RATE.w1h / RATE.w5m), 10);
  });

  it("output is priced at 5x, input at 1x", () => {
    const t = { idx: 0, input: 500, output: 500, cacheRead: 0, cacheWrite: 0, writeTier: "1h" as const, pingPongs: 0, event: null };
    const bd = priceTurn(t, "fable");
    const outLine = bd.lines.find((l) => l.label === "output")!;
    const inLine = bd.lines.find((l) => l.label === "input")!;
    expect(outLine.mult).toBe(RATE.out);
    expect(inLine.mult).toBe(RATE.input);
    expect(outLine.usd).toBeCloseTo(inLine.usd * 5, 10);
  });

  it("priceLayers totals match manual per-token math", () => {
    const layers = requestLayers(cfg, "main");
    const bd = priceLayers(layers, "sonnet", "1h");
    const manual = layers.total * RATE.w1h * (MODEL_IN.sonnet / 1e6);
    expect(bd.totalUsd).toBeCloseTo(manual, 6);
  });

  it("math strings embed the literal multiplier", () => {
    const t = { idx: 0, input: 0, output: 0, cacheRead: 67787, cacheWrite: 0, writeTier: "1h" as const, pingPongs: 0, event: null };
    const bd = priceTurn(t, "sonnet");
    expect(bd.lines[0].math).toContain("x 0.1x");
  });
});

it(`[ESTIMATE] compaction threshold constant is documented and positive`, () => {
  expect(COMPACTION_THRESHOLD_TOK).toBeGreaterThan(0);
});
