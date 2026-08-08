// pricing.js - the ONE source of truth for cache economics.
// Byte-identical to sim-fanout-prototype.html and tape-prototype.html.
// Sources: SIMULATOR_SPEC.md Section 2 (C1-C4), TECHNICAL_CRITIQUE.md Section D.

// Rate multipliers on a model's base input price (C1).
//   input 1x, cache-read 0.1x, 5m-write 1.25x, 1h-write 2x, output 5x.
// The 20x rebuild penalty (C5) is RATE.w1h / RATE.read = 2 / 0.1 = 20.
export const RATE = { input: 1, read: 0.1, w5m: 1.25, w1h: 2, out: 5 };

// Model base input price per 1,000,000 tokens (C2-C4).
//   NOTE (drift trap, TC-D): Opus input is $5/M, NOT $15/M.
export const MODEL_IN = { sonnet: 3, opus: 5, fable: 10 };

// Per-1M price table for a model, across all five tiers (for display + assertions).
// sonnet -> in $3 / read $0.30 / w5m $3.75 / w1h $6 / out $15   (C3)
// opus   -> in $5 / read $0.50 / w5m $6.25 / w1h $10 / out $25  (C2)
// fable  -> in $10 / read $1 / w5m $12.50 / w1h $20 / out $50   (C4)
export function priceTable(model) {
  const P = MODEL_IN[model];
  return {
    input: P * RATE.input,
    read: P * RATE.read,
    write5m: P * RATE.w5m,
    write1h: P * RATE.w1h,
    output: P * RATE.out,
  };
}

// Cost in USD of `tok` tokens billed at a given RATE tier for a given model.
//   usd = tok * rate * (MODEL_IN[model] / 1e6)
export function tokCost(tok, rateTier, model) {
  return tok * rateTier * (MODEL_IN[model] / 1e6);
}

// Per-token USD at the base (1x) input rate for a model. Callers multiply by
// segment RATE to get the tier cost (mirrors fanout `perTokUSD`).
export function perTokUSD(model) {
  return MODEL_IN[model] / 1e6;
}
