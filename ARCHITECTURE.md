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
`npm test` = vitest over the engine (`src/engine/*.test.ts`). `npm run check` =
svelte-check (tsc for `.ts` + `.svelte`).

TypeScript throughout: `tsconfig.json` (strict, moduleResolution bundler, target
ES2020, noEmit — Vite/esbuild transpiles; vitest runs `.ts` natively).

## Layout

- `src/engine/` — **the deterministic core (built + tested now).** No DOM, no
  Date.now, no Math.random.
  - `types.ts` — Model/Tier/Config/CacheState + fan-out/request shapes (Section 5.1).
  - `pricing.ts` — RATE multipliers, MODEL_IN prices, priceTable, tokCost (C1-C5).
  - `constants.ts` — every calibration constant, C-number cited (Section 2).
  - `ledgers.ts` — base-size (prefix) functions: mainBaseTok / subBaseTok /
    mcpShare / ledgerScale (Section 5.2).
  - `simulate.ts` — `computeRun` (canonical fan-out, byte-identical to the
    prototype) + `simulateRequest` (single request, Section 5.4) + keep-warm.
  - `*.test.ts` — vitest invariants (price cells, ledgers, $5.58 / $22.49,
    global minimum, TTL expiry, 20x gap).
- `src/render/` — canvas renderers.
  - `dpr.ts` — DPR-aware canvas sizing (`getDpr`/`sizeCanvas`/`tapeHeight`),
    ported from tape-prototype `resize()`.
  - `tween.ts` — `lerp`/`easeInOut`/`progress`/`reducedMotion`, ported from the
    prototype's tick/easeInOut/mq helpers. Pure + SSR-safe.
  - `tape.ts` — blue read / red write tapes + TTL drain bars — **stub, imports
    dpr+tween; draw()/sweep loop ports next from tape-prototype.html.**
- `src/components/` — compact ncase-style config controls (Section 8) — **stub.**
- `src/widgets/` — per-article-section entrypoints S0-S6 (Section 9) — **stub.**
- `src/game/` — the reducer over the SDLC unit graph.
  - `types.ts` — UnitKind/UnitInstance/LedgerRow/GameState/Action/SaveFile (5.1).
  - `step.ts` — typed `step(state, action)` + `replay({seed, actions})` (immer);
    signatures wired, full pipeline (5.3/3.4/5.5/6/7) lands next phase.
- `src/App.svelte` — placeholder shell (`<script lang="ts">`) proving the build.

## Source of truth

The engine extends two canonical prototypes, never contradicts them:
`build/tape-prototype.html` (simulateSend) and `build/sim-fanout-prototype.html`
(computeRun). `SIMULATOR_SPEC.md` is the spec; its Section 10 invariants are the
tests.
