# Architecture

The Claude Code Simulator. Multi-file Svelte + Vite source that builds to **one
self-contained offline HTML** (`dist/index.html`, zero external requests).

## Build flow: many source files -> one HTML

```
src/**  (Svelte components, JS engine, canvas renderers)
  |  vite build
  |    + @sveltejs/vite-plugin-svelte  (compile .svelte)
  |    + vite-plugin-singlefile        (inline all JS/CSS)
  |    + assetsInlineLimit: 100MB      (inline every asset as data: URI)
  v
dist/index.html   <- one file, no <link>/<script src=http>, works offline
```

`npm run dev` = live Vite dev server. `npm run build` = the single file.
`npm test` = vitest over the engine (`src/engine/*.test.js`).

## Layout

- `src/engine/` — **the deterministic core (built + tested now).** No DOM, no
  Date.now, no Math.random.
  - `pricing.js` — RATE multipliers, MODEL_IN prices, priceTable, tokCost (C1-C5).
  - `constants.js` — every calibration constant, C-number cited (Section 2).
  - `ledgers.js` — base-size (prefix) functions: mainBaseTok / subBaseTok /
    mcpShare / ledgerScale (Section 5.2).
  - `simulate.js` — `computeRun` (canonical fan-out, byte-identical to the
    prototype) + `simulateRequest` (single request, Section 5.4) + keep-warm.
  - `*.test.js` — vitest invariants (price cells, ledgers, $5.58 / $22.49,
    global minimum, TTL expiry, 20x gap).
- `src/render/` — canvas renderers.
  - `dpr.js` — DPR-aware canvas sizing (`getDpr`/`sizeCanvas`/`tapeHeight`),
    ported from tape-prototype `resize()`.
  - `tween.js` — `lerp`/`easeInOut`/`progress`/`reducedMotion`, ported from the
    prototype's tick/easeInOut/mq helpers. Pure + SSR-safe.
  - `tape.js` — blue read / red write tapes + TTL drain bars — **stub, imports
    dpr+tween; draw()/sweep loop ports next from tape-prototype.html.**
- `src/components/` — compact ncase-style config controls (Section 8) — **stub.**
- `src/widgets/` — per-article-section entrypoints S0-S6 (Section 9) — **stub.**
- `src/game/` — the `step(state, action)` reducer over the SDLC unit graph
  (Section 5.3), rework/PRNG (3.4/5.5), win/lose (6), report (7) — **stub.**
- `src/App.svelte` — placeholder shell proving the build + engine wiring.

## Source of truth

The engine extends two canonical prototypes, never contradicts them:
`build/tape-prototype.html` (simulateSend) and `build/sim-fanout-prototype.html`
(computeRun). `SIMULATOR_SPEC.md` is the spec; its Section 10 invariants are the
tests.
