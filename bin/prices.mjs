// Anthropic list prices for the CLI tools in bin/, USD per 1M tokens (Oct 2026).
// Output is 5x input and cache writes are 1.25x (5-minute) or 2x (1-hour) input on every model;
// only the cache-read rate differs: 0.1x on most models, 0.05x on Opus 5.5, 0.025x on Fable 5.1.
// (The game engine in src/engine/pricing.ts keeps its own fixed teaching numbers on purpose.)
export const WRITE = Object.freeze({ "5m": 1.25, "1h": 2 });
export const OUTPUT = 5;

// First match wins, so specific model versions come before their family.
const TABLE = [
  [/fable|mythos/, { input: 10, read: 0.25 }],
  [/opus-5-5/, { input: 4, read: 0.2 }],
  [/opus/, { input: 5, read: 0.5 }],
  [/sonnet-5/, { input: 2, read: 0.2 }],
  [/sonnet/, { input: 3, read: 0.3 }],
  // Haiku 5.5 doubles past 100K-token prompts; Claude Code prompts rarely get there on Haiku.
  [/haiku-5/, { input: 0.1, read: 0.01 }],
  [/haiku/, { input: 1, read: 0.1 }],
];
const FALLBACK = TABLE.find(([pattern]) => pattern.test("sonnet-5"))[1];

/** Per-1M-token prices for a model name; unknown models get the current Sonnet price. */
export function priceFor(model) {
  const name = String(model || "").toLowerCase();
  const { input, read } = (TABLE.find(([pattern]) => pattern.test(name)) ?? [null, FALLBACK])[1];
  return { input, read, write5m: input * WRITE["5m"], write1h: input * WRITE["1h"], output: input * OUTPUT };
}
