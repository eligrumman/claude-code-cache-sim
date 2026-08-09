# Infrastructure Review

## Executive verdict

The current technology choices are fundamentally right. Svelte 5, strict TypeScript, Vite, a pure deterministic engine, Canvas2D, and a static offline deployment are fully capable of supporting an experience at the level of *The Evolution of Trust*, *The Password Game*, *Stimulation Clicker*, or *Universal Paperclips*. A framework rewrite or conventional game engine would slow the project down without raising its quality ceiling.

The repository is not yet a complete game-production foundation, however. It has an unusually strong economics engine and one effective visualization, but it lacks the reusable modules that turn correct simulations into thirteen polished, expressive, accessible levels. The most important missing seam is the level runtime described by `docs/screens/OBJECT_MODEL.md`: prediction, checkpoints, local failure, rewind, scene phases, interaction patterns, and post-attempt counterfactuals are still design concepts rather than executable infrastructure.

The right strategy is therefore:

1. Keep Svelte, TypeScript, Canvas2D, and the single-file build.
2. Deepen the reducer and level-authoring interface around the canonical `LevelDef`.
3. Add a small deterministic presentation runtime for motion, effects, and sound.
4. Add real-browser visual, keyboard, touch, and accessibility tests beside the existing logic tests.
5. Prove those systems with one complete redesigned vertical slice before multiplying them across thirteen levels.

The stack will not cap quality. Repeating bespoke screen logic without these modules will.

## 1. Current stack, honestly

### Svelte 5 runes

The application uses Svelte 5 runes directly: `$state` for mutable view state, `$derived` for projections, `$effect` for lifecycle reactions, and `$props` for inputs. `src/App.svelte` is a small conditional screen router; the play screens keep engine snapshots in Svelte state and replace them after reducer actions (`src/App.svelte`, `src/components/PlayScreen.svelte`, `src/components/L1PlayScreen.svelte`).

What it does well:

- Svelte is an excellent fit for DOM-first educational interactions: prediction prompts, forms, panels, tooltips, dialogs, result summaries, and accessible alternatives to canvas.
- Runes make the relationship between reducer state and presentation concise.
- Compile-time reactivity keeps the production runtime smaller than a heavier UI framework.
- Bespoke levels can remain ordinary Svelte modules rather than being forced through an unsuitable game-engine scene graph.
- Conditional routing is sufficient for a small offline campaign; a URL router is not required.

Its ceiling:

- Svelte supplies rendering and local reactivity, not a game runtime. It does not automatically provide ordered effects, deterministic animation cues, checkpoints, scene transitions, audio arbitration, particles, or replay controls.
- State ownership is already splitting: campaign/screen state lives in `src/App.svelte`, generic play state in `src/components/PlayScreen.svelte`, and L1-specific phase/timing behavior in `src/components/L1PlayScreen.svelte` and `src/components/ClockTtlBar.svelte`.
- Several prop-derived values are captured only at initialization in `PlayScreen.svelte`; this is acceptable only while screens are always remounted. It is a fragile implicit interface.
- The current `toFreeplay` interface accepts `ToolId[]`, while `App.svelte` passes `ControlId[]` from `unlockedControls`, showing that the strict type seam is not presently clean (`src/game/shell.ts`, `src/game/levels.ts`, `src/App.svelte`).

Verdict: **keep**. Svelte is not the bottleneck; the missing reusable game modules are.

### Vite 6 and the Svelte plugin

`package.json` declares Vite 6 and `@sveltejs/vite-plugin-svelte`; `vite.config.js` combines the Svelte plugin with `vite-plugin-singlefile`.

What it does well:

- Fast HMR is appropriate for tuning copy, timing, level fixtures, Canvas visuals, and sound cues.
- Vite can transform plain ESM asset imports into URLs or inline data without a custom bundler.
- The ecosystem supports dev-only browser tests, asset transformation, and bundle inspection without adding production runtime code.
- ES2020 is the configured browser target (`vite.config.js`).

Its ceiling:

- There is no project-specific level preview or event inspector, so HMR currently reloads screens rather than placing an author at the exact event being tuned.
- No bundle-size or “no external request” assertion protects the offline contract.
- Production code splitting is deliberately disabled. That is correct for one-file delivery, but every dependency and asset increases initial parse/decode cost.
- Vite is build infrastructure, not an asset-production pipeline; image/audio normalization and manifest validation still need to be added.
- `vite-plugin-singlefile` does not make `new URL("./asset", import.meta.url)` safe for this contract: those references may be emitted as separate files. Only an empirically verified import form may enter the asset manifest.

Verdict: **keep**, with build assertions and an authoring preview.

### Strict TypeScript

`tsconfig.json` enables `strict`, `noEmit`, `isolatedModules`, bundler resolution, and verbatim module syntax. The domain model is strongly typed across `src/engine/types.ts`, `src/game/types.ts`, `src/game/levels.ts`, and `src/game/shell.ts`.

What it does well:

- Discriminated unions make `Action`, `Screen`, model, cache tier, unit status, and level identity explicit.
- The pricing and reducer modules benefit materially from exhaustive state modeling.
- The planned `ReducerState`, `LevelDef`, `GateDef`, and event vocabulary in `docs/screens/OBJECT_MODEL.md` are well suited to TypeScript.
- Types can make invalid authoring states—such as a reveal without a prediction or an unknown cue ID—hard to express.

Its ceiling:

- “Strict configured” is not the same as “strict gate is green.” The current snapshot contains a concrete interface mismatch between the `ControlId[]` passed by `App.svelte` and the `ToolId[]` accepted by `toFreeplay`.
- Very wide literal `LevelDef` objects will become slow to author even if they are perfectly typed. The exhaustive canonical schema needs a narrower authoring facade.
- Functions embedded directly in level data, such as `pass`, `star2`, `star3`, and `learn.chip`, make schema inspection, serialization, preview tooling, and fixture generation harder (`src/game/levels.ts`).

Verdict: **keep**, but restore a green `check` gate and put a deep `defineLevel` module in front of the canonical runtime schema.

### Vitest, jsdom, and Testing Library

Vitest 4, jsdom, Testing Library, and jest-dom are configured in `package.json` and the `test` block of `vite.config.js`. Tests currently use the globally configured jsdom environment. `src/test-setup.dom.ts` provides a no-op Canvas2D adapter and captures `fillText` calls for renderer assertions.

What it does well:

- Pure engine tests cover pricing, request simulation, session generation, ledgers, reducer replay, levels, and campaign progression (`src/engine/*.test.ts`, `src/game/*.test.ts`).
- DOM tests drive the real Svelte tree through user-visible buttons and cover L1, routing, persistence, TTL timing, and regressions (`src/app.dom.test.ts`).
- Tape tests verify lifecycle safety, reduced motion, hover calculations, labels, and final text without requiring a browser (`src/render/tape.test.ts`).
- Fixed seeds and action sequences make failures reproducible.

Its ceiling:

- The Canvas adapter does not render pixels. It cannot detect clipping, incorrect colors, compositing errors, font metrics, DPR artifacts, animation jank, or a visually blank final frame except where a secondary assertion happens to expose it.
- jsdom does not validate real focus behavior, pointer geometry, touch interaction, Web Audio, media decoding, CSS layout, visual transitions, or browser performance.
- Running every pure engine test in jsdom adds unnecessary setup and obscures the distinction between logic tests and browser behavior.
- There is no screenshot/pixel regression suite and no real-browser campaign smoke test.

Verdict: **keep** for logic and DOM semantics; **add** a small real-browser tier.

### Immer

Immer is the only production dependency declared in `package.json`, but there are no imports or uses of it under `src/`. The reducer instead clones the complete `GameState` using `JSON.parse(JSON.stringify(state))` and then mutates the clone (`src/game/step.ts`).

What it does well here:

- Currently nothing at runtime; an unused, side-effect-free dependency can be removed by production tree-shaking, but that should be confirmed through the bundle measurement.
- It could provide structural sharing and concise immutable reducer implementation as the object model expands.

Its ceiling in the current state:

- An unused dependency creates ambiguity without leverage.
- Full JSON cloning is O(total state) per action. As ledgers, prefix stacks, checkpoints, predictions, audit data, and replay histories grow, this becomes unnecessary work.
- JSON cloning silently narrows the allowed state vocabulary: `Infinity`, `undefined`, typed arrays, Maps, and future richer objects do not survive faithfully.
- Svelte’s deep `$state` proxies and Immer drafts should not be composed accidentally.

Verdict: **use it deliberately or remove it**. The preferred path is `$state.raw` snapshots in the view and one Immer-powered reducer seam over plain serializable data. The zero-dependency alternative is explicit copy-on-write helpers.

### Single-file offline build

`vite.config.js` is configured to emit one self-contained `dist/index.html`: CSS splitting is disabled, dynamic imports are inlined, manual chunks are disabled, and `assetsInlineLimit` is `100000000`. `index.html` itself is deliberately minimal.

What it does well:

- The game is intended to be openable from disk, archived, emailed, or hosted on any static origin.
- Deployment requires no server state, database, authentication, or versioned asset coordination.
- Deterministic educational content can remain available without network dependencies.
- It is a stronger preservation and portability goal than most reference games provide.

Its ceiling:

- Base64 data URLs add roughly one-third to binary asset size.
- One large HTML file has no per-asset caching and must parse its full inline script on first load.
- An accidental large audio file can silently make the artifact unwieldy because the inline threshold is intentionally enormous.
- External embeds or network-dependent mechanics used by some reference games are incompatible with this constraint.
- The configuration expresses the contract but no test currently scans the built artifact for external URLs, unresolved asset paths, or size regressions.

Verdict: **keep**. Add budgets and validation; do not weaken the offline promise.

### Deterministic pricing engine

`src/engine/constants.ts` contains the calibrated constants and citations. `src/engine/pricing.ts` owns rate and model tables. `src/engine/simulate.ts` resolves cached requests and calculates their token buckets and cost. `src/game/step.ts` turns requests into ledger rows, wallet changes, hidden-cost buckets, and terminal state.

What it does well:

- Economic state is plain data and does not depend on the DOM or wall clock.
- Fixed seeds and action lists reproduce outcomes.
- Raw USD values remain unrounded; formatting is a presentation concern.
- Ledger rows provide an excellent seam between simulation and visualization.
- The engine already distinguishes main and subagent cache namespaces, write tiers, prompt identity, prefix growth, and model pricing.
- The tape consumes priced rows rather than inventing economics (`src/render/tape.ts`).

Its ceiling:

- The authoritative total-price equation is still implemented inline in `simulateRequest`; the canonical `PRICE_REQUEST` interface specified in `docs/screens/OBJECT_MODEL.md` does not yet exist as a single callable module.
- `makePrng` logic is duplicated between the step/session implementations, and the `GameState.prng` fields are initialized but not advanced by normal reducer actions (`src/game/step.ts`, `src/engine/session.ts`, `src/game/types.ts`).
- The current engine models aggregate prefixes by token count and prompt key. It does not yet implement ordered `PrefixBlock` identity, longest-prefix resolution, breakpoints, or invalidated suffixes required by the redesigned curriculum.
- The object model defines expiry at `clock.min >= expiresAtMin`. Current code treats equality as live: `src/engine/simulate.ts` expires only when elapsed time is `> ttl`, while `src/game/step.ts` considers elapsed time `<= ttl` live.
- Scenario IDs in `src/game/levels.ts` are mostly metadata today. `buildQueue` has distinct behavior only for `l1-onboarding` (`src/game/step.ts`).
- `IDLE_RESOLVE` and `TICK_REPLAY` are currently no-op reducer branches, while the runtime does not record its own `Action[]` (`src/game/types.ts`, `src/game/step.ts`).

Verdict: **keep the economics, upgrade the interface and scenario runtime**.

### Canvas2D `TapeRenderer`

`src/render/tape.ts` implements a DPR-aware Canvas2D request tape with scan-head animation, scaled read/write segments, costs, hover equations, TTL brackets, resize handling, reduced-motion final frames, and teardown safety. `src/render/dpr.ts` caps DPR at 3. `src/render/tween.ts` supplies interpolation, one easing curve, progress, clamp, and a reduced-motion probe.

What it does well:

- It is a deep module: callers provide ledger rows and receive a complete visualization and hover interface.
- Canvas is appropriate for dense, repeated, animated data marks.
- The renderer has one bounded `requestAnimationFrame` loop and cancels it during teardown.
- DPR capping prevents extreme backing-store allocations.
- DOM tooltip support allows richer accessible hosts without moving economics into the renderer.
- Reduced motion preserves final evidence rather than deleting content.

Its ceiling:

- It is one renderer, not a general visual-effects or scene system.
- Geometry, fonts, timings, and labels are hard-coded, which will make thirteen visually distinct mechanics expensive to tune consistently.
- Theme colors are fetched through repeated `getComputedStyle` calls during each draw; that is tolerable for one tape but a poor pattern for a multi-effect scene.
- The reduced-motion setting is sampled at construction even though `reducedMotion()` exposes subscription support.
- The tape binds `mousemove` and `mouseleave` only. It has no touch inspection path and its rows have no first-class keyboard/focus model.
- The tape only visualizes read/input/write width. Output is explanatory text but not yet a configurable visual segment, as required by `TapeSpec` in `docs/screens/OBJECT_MODEL.md`.
- There is no central frame scheduler or object pooling for particles and transient effects.

Verdict: **keep `TapeRenderer`; add presentation and input infrastructure around it**. Do not turn it into a universal renderer.

### Screen state machine and campaign state

`src/game/shell.ts` defines the pure `Screen` union and transitions among map, learn, play, result, and free play. Campaign progress is versioned and saved to localStorage. `src/App.svelte` owns the screen and campaign.

What it does well:

- Navigation is explicit, serializable in concept, and easy to test.
- Campaign persistence is isolated from engine economics.
- Corrupt or outdated saves fall back safely.
- There is no router or store dependency to learn.

Its ceiling:

- `learn`, `play`, and `result` are too coarse for the planned discovery rhythm.
- The current L1 already needs a special screen path; duplicating that approach for twelve levels will create thirteen local state machines.
- Prediction, reveal, explanation, transfer, failure freeze, checkpoint, rewind, and counterfactual state are absent from `GameState`.
- Save validation checks only a few top-level fields and has no migration path beyond rejecting a version.
- Current attempt actions are not persisted, so the existing `SaveFile` replay format is not connected to normal play.
- The generic `LearnScreen` explicitly runs and labels the anti-pattern and solution before play (`src/components/LearnScreen.svelte`), contrary to the post-attempt contract in `docs/screens/OBJECT_MODEL.md` and the redesign in `GAME_PLAN_V2.md`.

Verdict: **keep the outer shell; replace bespoke level-local phase logic with a canonical level runtime**.

Audit limitation: this review was performed in a read-only workspace, so commands that require Vite to write temporary configuration could not establish a green test/check result; that is an audit-environment limitation, while restoring a green writable-CI `check` gate remains required because the source-level `ControlId[]`/`ToolId[]` mismatch is independently verifiable.

## 2. What the reference games are built on

Exact production bundles can change, so this section distinguishes known architectural traits from inference. The important result is that none of these experiences requires a heavyweight game engine.

### *The Evolution of Trust*

**High-confidence:** *The Evolution of Trust* is a static, client-side, canvas-centric interactive built from custom JavaScript, illustrated assets, scripted scenes, and a slideshow-like progression. The simulation and explanatory sequence are tightly controlled in the browser; a backend is not part of normal gameplay.

**High-confidence inference:** Its animation is primarily bespoke scene/tween logic rather than a general physics or ECS engine. Character poses, coins, speech, camera-like movement, and transitions are authored as timed visual beats. Assets are preloaded and deployed alongside the static application. Sound and music are presentation effects, not inputs to the simulation.

Architectural lesson: its quality comes from a coherent scene grammar, authored timing, illustration, audio, and extremely clear causal staging—not from a large framework. The current Svelte/Canvas split can reproduce this approach.

### neal.fun and *The Password Game*

**Certain at the interaction level:** *The Password Game* is DOM-first. Its central object is an editable text field surrounded by a reactive list of rules, embedded challenges, and progressively changing page elements. Native text input, layout, accessibility semantics, and CSS are more important than canvas.

**High-confidence, version-sensitive:** neal.fun has historically used a Vue/Nuxt-family site architecture for many titles. The exact framework/version used by one current production title may have changed, but its design does not depend on a game engine.

Animation is a mix of CSS transitions, framework-driven DOM state changes, bespoke timers, and media-specific effects. Assets and special challenges are served through the normal web pipeline; some rules rely on online content or supporting endpoints, making their deployment constraint looser than this project’s offline contract.

Architectural lesson: use DOM for controls, copy, input, cards, rankings, and accessibility. Reserve canvas for dense or continuously animated visual evidence.

### *Stimulation Clicker*

**Certain at the experience level:** the title layers ordinary clicker controls with escalating animations, media, sound, overlays, visual interruptions, counters, and increasingly chaotic feedback.

**Inference:** the implementation likely mixes reactive DOM with canvas or similarly imperative effect layers. Individual effects can be bespoke; the important shared infrastructure is a cue/timeline system, asset preloading, audio mixing, and strict control over escalation.

Architectural lesson: “delight” does not require putting the whole game in canvas. It requires a reliable way for a state transition to trigger coordinated motion, particles, sound, and screen changes exactly once.

### *Universal Paperclips*

*Universal Paperclips* is not a neal.fun title, but it is an important reference for the class of experience.

**High-confidence:** it is largely traditional HTML/CSS/JavaScript: global simulation state, interval-driven production, DOM readouts and controls, and static web deployment. Its presentation is deliberately austere. The depth comes from pacing, state-machine escalation, resource relationships, and surprising phase changes rather than sophisticated rendering technology.

Architectural lesson: a simple web stack can sustain a long-form game when the state model and pacing are excellent. Technology does not need to resemble Unity to create a compelling systemic experience.

### Shared pattern across the references

The shared production model is:

- Static or mostly static client delivery.
- DOM for text, controls, and semantic interaction.
- Canvas/custom drawing only where it adds leverage.
- Bespoke state machines tailored to the experience.
- Small, authored animation/tween systems.
- Preloaded visual/audio assets.
- Carefully scheduled reveals and phase transitions.
- A simple deployment surface.

That is already close to this repository’s architectural direction. The missing work is production infrastructure for authoring and presentation, not stack replacement.

## 3. Gap analysis

Ratings are from 1 (low) to 5 (critical). “Learning” measures causal comprehension and feedback; “delight” measures personality, responsiveness, and emotional payoff.

| Capability | Current state | Learning | Delight | Assessment |
|---|---|---:|---:|---|
| Audio/SFX engine | No audio imports, Web Audio use, media elements, mute state, or cue vocabulary exist under `src/`. | 2 | 5 | Major delight gap |
| Tween/juice/easing layer | `src/render/tween.ts` has math helpers and one easing curve; tape and CSS transitions schedule themselves independently. | 3 | 5 | Major presentation gap |
| Sprite/particle/VFX system | No particle/sprite modules exist. Tape is the only animated canvas implementation. | 2 | 5 | Major delight gap |
| Scene transitions | `src/App.svelte` replaces conditional branches immediately; level phases are mostly local view state. | 2 | 4 | Noticeable quality gap |
| Deterministic RNG and replay runtime | Seeded PRNGs and `replay(save, init)` exist, but RNG is duplicated, actions are not recorded by play screens, checkpoint/rewind is absent, and presentation randomness has no separate stream. | 5 | 3 | Critical learning/QA gap |
| Asset embedding pipeline | The build has a high inline limit, but there are no ESM asset manifest, codec policy, preloader, empirical inline fixture, or artifact validation. | 2 | 4 | Required before asset production |
| Accessibility system | Most controls use native buttons/inputs, but tape rows are pointer-only, toasts lack complete live-region semantics, dialogs lack complete focus management, and drag equivalents do not exist. | 5 | 3 | Critical product-quality gap |
| Touch inspection | `TapeRenderer` binds only `mousemove`/`mouseleave`; the price calculator has no tap-to-inspect path or persistent touch dismissal rule. | 5 | 4 | Critical mobile learning gap |
| Canvas performance budget | Tape has DPR capping and one bounded RAF, but no frame budget, allocation policy, shared scheduler, instrumentation, or real-device tests. | 4 | 5 | Important before adding effects |
| Canonical level runtime | The target model exists in `docs/screens/OBJECT_MODEL.md`; current reducer lacks its prediction, phase, checkpoint, failure, prefix, loadout, and audit fields. | 5 | 5 | Highest-priority gap |
| Real-browser QA | Vitest/jsdom is strong for state but cannot verify pixels, animation, layout, audio, touch, or actual focus behavior. | 4 | 5 | High-priority shipping gap |

### Audio/SFX

Sound should reinforce evidence:

- A cold write can have a heavier, lower, more expensive cue.
- A cache read can have a short, light, high-frequency cue.
- Expiry can crack or decay.
- A successful prediction can resolve harmonically.
- Failure freeze and rewind need distinct, non-punitive cues.
- Stars and campaign unlocks need celebration.

Sound must never be the only channel. The engine should emit no audio directly. Presentation code should translate stable effect events—such as `{ cue: "cache.expired", actionIndex: 7 }`—through an `SfxBus`. The bus needs user-gesture unlock, mute, volume, decoding/preload state, exactly-once cue IDs, and safe no-op behavior when audio is unavailable.

### Tween and juice

A single timeline module should coordinate DOM and Canvas effects while keeping simulation time separate from wall-clock time. It should provide:

- Named easing curves.
- Delay, sequence, parallel, stagger, and cancellation.
- A manual-clock adapter for tests.
- Reduced-motion resolution to the same final evidence.
- Stable cue IDs so a Svelte re-render cannot replay an effect.
- Separation between critical teaching motion and decorative motion.

Use Svelte transitions and the Web Animations API for DOM transforms/opacity; use the same normalized timeline progress for Canvas. Avoid making every renderer own an unrelated RAF loop.

### Sprites, particles, and effects

The game does not need a generic scene graph. It needs a narrow Canvas effects module:

- Pooled particles with a fixed cap.
- Sprite-atlas drawing.
- Small primitives such as burst, trail, crack, pulse, shake, dissolve, and glow.
- A cosmetic RNG stream forked from the level seed and effect ID.
- A single scheduler and a reduced-motion final state.
- No allocation inside hot loops where practical.

Effects should be anchored to domain objects—request row, cache entry, wallet, prediction—not arbitrary screen coordinates embedded in level data.

### Deterministic RNG and replay

The current seed/action concept is the correct foundation, but it needs to become the actual runtime interface:

- One `Rng` module with `next`, `int`, `pick`, and `fork(label)`.
- Separate streams for economic simulation and cosmetic effects.
- An action recorder owned by the level runtime.
- Stable `requestId`, `eventId`, and `actionIndex`.
- Checkpoints represented as replay positions, as specified in `OBJECT_MODEL.md`.
- Rewind by replaying prior actions, not restoring a mutable view snapshot.
- Exportable replay fixtures for bug reports and golden tests.

Decorative particles must never consume the same RNG stream as economic outcomes. Turning effects on or off must not alter the ledger.

### Asset embedding

Use plain ESM imports in a typed manifest:

```ts
import cacheWrite from "./sfx/cache-write.mp3";
import cacheRead from "./sfx/cache-read.mp3";
import cacheSprite from "./sprites/cache.webp";

export const ASSETS = {
  sfx: {
    cacheWrite,
    cacheRead,
  },
  sprites: {
    cache: cacheSprite,
  },
} as const;
```

Do not use `new URL("./sfx/cache-write.mp3", import.meta.url).href`: `vite-plugin-singlefile` does not inline that form and may emit a separate file. Plain ESM imports pass through Vite’s asset pipeline, where the configured `assetsInlineLimit: 100000000` can convert them into `data:` URLs.

The first asset-pipeline commit must verify this empirically with a real imported fixture:

1. Build in a writable environment.
2. Assert the imported asset appears as a `data:` URL in `dist/index.html`.
3. Assert `dist/` contains no sibling runtime asset.
4. Scan HTML attributes, CSS `url(...)`, module text, and runtime requests for unresolved relative or external asset references.
5. Record the fixture type, encoded byte count, and scan result in this section or a checked-in artifact report.

Verification status at this review: **pending**. The supplied checkout contains no `dist/index.html`, so there is no existing artifact from which to record an empirical result. Asset work remains blocked until the fixture proof and post-build external-reference scan are green.

Every budget below is an `[ESTIMATE]` pre-measurement placeholder, not a baseline or product fact:

| Metric | Current measured value | Initial placeholder | Measurement action |
|---|---|---:|---|
| Minified application JavaScript | Unavailable; no built artifact is present | `<250 KB` `[ESTIMATE]` | Run `npm run build` in writable CI, extract/count the inline application module, and record raw and gzip sizes. |
| Encoded images and fonts | Unavailable; no built artifact is present | `<1 MB` combined `[ESTIMATE]` | Sum decoded source bytes and encoded `data:` payload bytes from the asset manifest/build report. |
| Encoded audio | Unavailable; no built artifact is present | `<1.5 MB` `[ESTIMATE]` | Sum source and in-artifact encoded bytes by cue and codec. |
| Complete raw offline HTML | `dist/index.html` absent in the reviewed checkout | Warning at `4 MB`; hard review at `6 MB` `[ESTIMATE]` | Record `dist/index.html` byte count on every production build and compare with the previous main-branch artifact. |
| First usable interaction after local-file open | Not measured | `<1 second` `[ESTIMATE]` | Measure navigation-to-enabled-first-control in the agreed mid-range mobile profile, using both a hosted artifact and supported `file://` paths. |

Replace placeholders with measured budgets after the first representative vertical slice. Base64 overhead makes short, aggressively compressed assets or synthesized UI SFX especially attractive.

### Accessibility and input parity

The DOM-first architecture is an advantage. Preserve it by requiring:

- Every Canvas visualization to have a semantic DOM summary or table derived from the same ledger rows.
- Keyboard focus for inspectable tape rows and the same tooltip equations available on focus.
- Tap-to-inspect for every hover-only evidence surface. A first tap selects and opens the calculator; tapping another row moves it; tapping outside or using an explicit close control dismisses it.
- Pointer, keyboard, and touch inspection to expose the same row, equations, time, and TTL evidence without dispatching different economic actions.
- Keyboard alternatives for reordering and dragging prefix blocks.
- `aria-live="polite"` for teaching/status cues and `"assertive"` only for decisive frozen failures.
- Focus trap, initial focus, Escape handling, and focus restoration for dialogs.
- Persistent mute control independent of reduced motion.
- `prefers-reduced-motion`, high contrast, non-color status markers, and minimum target sizes.
- Automated axe checks plus manual keyboard, touch, and screen-reader smoke tests.

### Canvas performance

Before adding effects, establish a budget:

- One central presentation RAF.
- Target p95 script+draw below 8 ms per active frame on a mid-range mobile device `[ESTIMATE]`, replaced after profiling.
- No more than two simultaneously animating canvases without profiling `[ESTIMATE]`.
- Initial particle cap of roughly 150–250 `[ESTIMATE]`, tuned from measurement.
- Cached theme/style values; do not call `getComputedStyle` repeatedly per frame.
- Reuse arrays/objects in hot effects.
- Cap total live canvas backing stores, not only individual DPR.
- Pause decorative rendering when the document is hidden.
- Record duration and dropped-frame counters in a dev-only overlay.

Do not introduce OffscreenCanvas or workers until profiling shows a real main-thread problem.

### V1 operational completeness

The v1 support contract must be explicit and verified against the built artifact:

| Environment | Hosted static artifact | Direct `file://` open | Required checks |
|---|---|---|---|
| Chromium desktop | Required | Required | Campaign smoke, reload/save, inline assets, audio unlock/decode, no network requests. |
| Firefox desktop | Required | Required | Campaign smoke, module execution from disk, inline assets, save/export/reset. |
| Safari macOS | Required | Required | Inline module execution from disk, `data:`-URL audio decode, mute/unlock, Canvas final frames. |
| Safari on iOS/iPadOS | Required | Provisional until device-tested | Touch inspection, Files/share-sheet launch behavior, audio decode/unlock, persistence limits. |
| Chrome on Android | Required | Provisional until device-tested | Tap-to-inspect, downloaded-file launch behavior, audio decode/unlock, Canvas/DPR budget. |

“Required” means the release matrix must pass on the current and previous major browser version where practical. A provisional direct-file path must not be advertised until a real-device fixture passes; hosted static use remains required.

Font policy for v1 is the existing system stack. Embed WOFF2 only when a measured typographic need justifies its source bytes, base64 growth, decode cost, and licensing; any font must use the same ESM-import manifest and artifact scan as other assets.

Campaign persistence must gain player-facing **Export save** and **Reset progress** controls. Export emits a versioned JSON payload containing campaign progress and any supported replay/action data. Import, if offered, validates the schema and version before mutation. Reset requires confirmation, states exactly what will be cleared, and removes campaign plus in-progress attempt data without affecting unrelated origin storage.

V1 has **no telemetry, no runtime network requests, no backend dependency, and no i18n framework**. It ships English-only. Any later analytics, online content, cloud save, or localization proposal is a separate product and privacy decision, not an implicit infrastructure task.

## 4. Keep / Upgrade / Add

| Subsystem | Decision | Concrete implementation | Size and determinism tradeoff |
|---|---|---|---|
| Svelte 5 UI | **KEEP** | Continue DOM-first Svelte modules and runes. Use `$state.raw` for reducer snapshots replaced as a whole. | No new dependency; avoids nested proxy interaction with Immer. |
| Outer screen shell | **KEEP** | Retain `Screen` and pure map/level/result navigation in `src/game/shell.ts`. | Tiny and deterministic. |
| In-level runtime | **UPGRADE** | Add `LevelRuntime` implementing `LevelPhase`, action recording, prediction, checkpoints, freeze/rewind, explanation, transfer, and counterfactual requests from `OBJECT_MODEL.md`. | Moderate code; major leverage across 13 levels. All persistent state remains serializable. |
| Level definitions | **UPGRADE** | Split `src/game/levels.ts` into one file per level plus a `defineLevel` authoring module that resolves defaults into canonical `LevelDef`. | Slight build increase; much better locality and HMR. |
| Scenario system | **UPGRADE** | Make `scenario` an executable registry keyed by `ScenarioId`; `initLevel(def)` must consume `scenarioData`. | Deterministic when scenario inputs and seed are explicit. |
| Pricing constants | **KEEP** | Preserve `RATE`, `MODEL_IN`, and calibrated constants. | Zero cost; credibility-critical. |
| Price interface | **UPGRADE** | Implement canonical `priceRequest(bucketArgs)` and route request totals and assertions through it. | Tiny; eliminates formula drift without changing outcomes. |
| TTL semantics | **UPGRADE** | Make the canonical rule authoritative: live only while `clock.min < expiresAtMin`; elapsed time equal to TTL is expired. Update `simulateRequest`, `step` liveness, and gap attribution together. | Small code change with broad fixture impact; requires same-commit golden re-locking. |
| Prefix model | **ADD** | Implement `PrefixBlock`, `PrefixStack`, `RESOLVE_PREFIX`, stable hashes, mismatch suffix, and breakpoints as defined in `OBJECT_MODEL.md`. | More state, but required for the redesigned curriculum. Prefer counts+hashes over allocating every token. |
| Reducer copying | **UPGRADE** | Preferred: use installed Immer `produce` behind the reducer interface with plain `$state.raw` input. Alternative: explicit structural-copy helpers and remove Immer. | Immer adds roughly single-digit gzip KB; structural sharing reduces growing-state copy cost. Determinism is unchanged if state stays plain data. |
| Reducer schema migration | **UPGRADE** | Migrate current `GameState` into canonical `ReducerState`. Expand `HiddenCosts` from the current six fields by adding `delegateUsd`, `fiveMinuteBandUsd`, and `mcpUsd`, initializing all nine buckets to zero and migrating older saves explicitly. | Small state growth; prevents fleet-audit fields from becoming ad hoc or undefined. |
| RNG | **UPGRADE** | Consolidate existing xorshift logic into `Rng` with deterministic `fork(label)` streams. Do not add `seedrandom`. | Tiny zero-dependency module; prevents cosmetic/economic coupling. |
| Replay | **UPGRADE** | Runtime-owned `Action[]`, stable IDs, checkpoints by action index, import/export fixtures, save-schema migrations, and player-facing save export/reset. | More stored data; deterministic debugging and rewind pay for it. |
| Tape renderer | **KEEP** | Keep `TapeRenderer` as the ledger visualization. Cache theme values, subscribe to motion preference, and add DOM row adapters for focus, pointer, and tap-to-inspect. | Small changes; no framework cost. |
| Touch input | **ADD** | Use Pointer Events or explicit touch handling at the DOM adapter boundary; tap selects a row persistently and outside-tap/close dismisses it. Test equivalence with mouse hover and keyboard focus. | Tiny runtime cost; restores the complete price-inspection lesson on phones. |
| Animation | **ADD** | Build a small `PresentationClock`/`Timeline` over RAF, Web Animations, `svelte/easing`, and cancellation tokens. | Preferred zero-dependency approach. GSAP is capable but unnecessary and materially larger. |
| DOM motion | **ADD** | Use Svelte transitions/Web Animations through the shared timeline rather than local timers. | No production dependency; deterministic final state, wall-clock timing remains ephemeral. |
| Audio | **ADD AFTER VERTICAL SLICE** | After the functional vertical slice is green, add a small Web Audio `SfxBus` with decoded buffers, cue IDs, unlock/mute/volume, and an HTMLAudio fallback. Consider Howler only if measured compatibility work justifies it. | Audio assets, not code, will dominate size; it must not block proving the teaching runtime. |
| Particles/sprites | **ADD AFTER VERTICAL SLICE** | After the functional vertical slice is green, add a pooled Canvas2D `FxLayer` with a typed effect vocabulary and embedded WebP/PNG atlas. | Tens of KB of code/assets rather than hundreds of KB for a general engine. Cosmetic RNG must be forked. |
| Scene transitions | **ADD** | A `ScreenTransition` host with enter/exit timelines and reduced-motion cuts. | Small; no simulation impact. |
| Assets | **ADD** | Typed manifest using plain ESM imports, preprocessing script, preload/decode status, empirical inline fixture, and post-build offline scan. Do not use `new URL(..., import.meta.url)` for bundled runtime assets. | Base64 adds about 33%; size budgets are mandatory. |
| Fonts | **KEEP SYSTEM STACK** | Use system fonts for v1. Any later WOFF2 must be an ESM import and pass the same byte and offline checks. | Avoids unmeasured font weight and decode cost. |
| CSS/design tokens | **UPGRADE** | Keep existing CSS variables in `src/app.css`; add semantic motion, spacing, typography, z-index, tape geometry, and effect tokens exposed to Canvas through one cached theme adapter. | Tiny; avoids hard-coded drift across renderers. |
| Logic tests | **KEEP** | Retain Vitest tests for pricing, reducer, levels, replay, and DOM semantics. | Dev-only. |
| Test environments | **UPGRADE** | Use Vitest projects: `node` for pure engine tests, `jsdom` for Svelte semantic tests. | Faster tests; no production cost. |
| Browser QA | **ADD** | Add `@playwright/test` for Chromium/WebKit campaign smoke, screenshot goldens, reduced motion, keyboard flow, focus, real Canvas output, mobile viewports, and tap-to-inspect parity. Supplement direct-file and mobile audio cases with real-device checks where automation cannot represent the launch path. | No production bundle cost; CI browser install and snapshot maintenance cost. |
| Accessibility | **ADD** | Shared focus, live-region, canvas-summary, tap inspection, keyboard-reorder, and dialog modules built into interaction patterns. | Small runtime cost; large quality and reach benefit. |
| Performance | **ADD** | Dev-only frame meter, asset/bundle budgets, canvas backing-store guard, and browser performance smoke scenario. | Near-zero production cost when dev instrumentation is stripped. |
| Offline deploy | **KEEP** | Preserve one `dist/index.html`; add an artifact contract test that rejects external/runtime asset references and network activity. | Strong portability; stricter size discipline than normal web deployment. |
| Phaser/Pixi/Three/ECS | **DO NOT ADD** | Reconsider only if future levels need hundreds of interactive world objects, physics, camera transforms, or complex skeletal animation. | Large bundle and interface tax with little current leverage. |

## 5. Velocity levers

### 5.1 A level-authoring DSL over canonical `LevelDef`

`docs/screens/OBJECT_MODEL.md` correctly defines the complete runtime contract, but asking authors to fill every field directly would create a shallow, exhausting interface. Put a deep authoring module in front of it:

```ts
export default defineLevel({
  id: "03-build-the-prefix",
  concept: concept("prefix-reuse"),
  prerequisiteConceptIds: ["write-vs-read", "cache-expiry"],
  scenario: "prefix-builder",
  scenarioData: scenarios.prefixBuilder({
    blocks: ["system", "tools", "instructions", "history", "current"],
  }),
  interactionPatterns: [
    "predict-before-reveal",
    "counterfactual-after-attempt",
  ],
  sequence: [
    events.openPrediction("which-block-breaks"),
    events.sendRequest("baseline"),
    events.changePrefixBlock("tools"),
    events.sendRequest("changed"),
    events.beginTransfer("late-variation"),
  ],
  gate: gates.all(
    gates.maxInvalidatedSuffix(14_623),
    gates.actionObservedAfter("late-variation", "changed"),
    gates.transferPassed("late-variation"),
  ),
});
```

`defineLevel` should:

- Supply default tape/result/vocabulary/QA fields.
- Validate canonical `LevelId`, `ConceptId`, prerequisite lists, `ScenarioId`, and `InteractionPatternId` values.
- Validate unique IDs, event ordering, known cue names, prediction-before-reveal, checkpoint references, and non-empty behavioral gates.
- Resolve named `UI_*` modules and canonical kebab-case interaction pattern IDs rather than duplicating their mechanics.
- Reject uppercase `PATTERN_*` strings; they are not aliases and are not valid IDs.
- Tag all non-registry numbers as `[ESTIMATE]` or `[FICTION]`.
- Produce the exhaustive canonical `LevelDef` used by runtime and tests.
- Fail at module load in development and through a campaign-wide validation test in CI.

Avoid a large production schema dependency initially. TypeScript `satisfies`, pure validation functions, and registered predicate IDs are sufficient. Valibot is a reasonable small option if runtime validation later justifies it; Zod is unnecessary for this closed, compile-time-authored dataset.

Move each level into one module named for its canonical ID, from `src/levels/01-red-or-blue.ts` through `src/levels/13-fleet-audit.ts`. The current `src/game/levels.ts` combines vocabulary, authoring data, gates, progression, and registry logic. Splitting it improves locality without fragmenting the runtime interface.

### 5.2 Shared interaction-pattern library

Implement only the canonical interaction patterns from `OBJECT_MODEL.md` as executable modules:

- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`
- `limited-marker-inventory`

Blind A/B reveal and explain-then-transfer remain composition recipes; they are not additional `InteractionPatternId` values.

A pattern is not only a Svelte component. Its seam is:

- **Reducer:** owns all persistent pattern state and is the only layer that mutates `ReducerState`.
- **Level runtime:** validates pattern preconditions, dispatches registered `Action` variants, sequences level events, and emits stable presentation cues.
- **Svelte component:** renders canonical state and dispatches actions; it does not infer phase, prediction correctness, checkpoint position, or gate passage.
- **Presentation layer:** consumes stable effect events without mutating economic state.
- **Pattern module:** exports its action-union contribution, reducer branch, runtime binding, component ID, fixtures, and assertions.

`predict-before-reveal` should have an interface at this fidelity:

```ts
type PredictBeforeRevealAction =
  | {
      type: "CREATE_CHECKPOINT";
      checkpointId: string;
      reason: Checkpoint["reason"];
    }
  | { type: "OPEN_PREDICTION"; promptId: string }
  | {
      type: "SELECT_PREDICTION";
      promptId: string;
      optionId: string;
    }
  | { type: "COMMIT_PREDICTION"; promptId: string }
  | {
      type: "REVEAL_PREDICTION";
      promptId: string;
      correctOptionId: string;
    };

interface PredictBeforeRevealBinding {
  id: "predict-before-reveal";
  prompt: PredictionPromptDef;
  checkpointId: string;
  hiddenEventId: string;
  revealEventId: string;
  widget: "UI_PREDICTION_PROMPT";
  actions: readonly [
    "CREATE_CHECKPOINT",
    "OPEN_PREDICTION",
    "SELECT_PREDICTION",
    "COMMIT_PREDICTION",
    "REVEAL_PREDICTION",
  ];
  canReveal(state: ReducerState): boolean;
  reduce(
    state: ReducerState,
    action: PredictBeforeRevealAction,
  ): ReducerState;
  effects(
    previous: ReducerState,
    next: ReducerState,
    action: PredictBeforeRevealAction,
  ): readonly PresentationCue[];
  fixtures: {
    uncommittedRevealRejected: ReplayFixture;
    wrongPredictionNonPunitive: ReplayFixture;
    committedRevealSucceeds: ReplayFixture;
  };
}
```

The root action registry composes the pattern action unions explicitly:

```ts
type Action =
  | ExistingEngineAction
  | PredictBeforeRevealAction
  | FailFreezeRewindAction
  | JustInTimeToastAction
  | CounterfactualAfterAttemptAction
  | LimitedMarkerInventoryAction
  | OtherCanonicalAction;
```

The composed `Action` must remain payload-compatible with the canonical union in `OBJECT_MODEL.md`. Adding a pattern action therefore requires, in the same commit:

1. Adding its variant to the root `Action`.
2. Registering its exhaustive reducer branch.
3. Registering runtime preconditions and emitted cues.
4. Adding replay serialization coverage.
5. Adding component, keyboard, pointer, touch, and reduced-motion assertions where the pattern renders interaction.

Each pattern should also own:

- Stable event/cue IDs.
- Default focus behavior.
- Default audio and motion cues.
- Reduced-motion behavior.
- Accessibility announcements.
- Test fixtures and mandatory assertions.
- Slots for level-specific copy and rendered domain objects.

The deletion test is decisive: without these modules, prediction gating, focus restoration, cue deduplication, rewind, and QA logic would reappear in many level screens. This is the highest-leverage way to build thirteen levels without thirteen implementations of the same teaching rhythm.

Do not force bespoke mechanics such as prefix reordering or fleet ranking through one generic config strip. Share interaction rhythm and infrastructure; allow each level’s central toy to be bespoke.

### 5.3 Pricing fixtures and golden files

The current tests assert valuable individual numbers, but the redesigned engine needs a canonical fixture corpus shared by pricing, replay, tape, and level validation.

Create immutable fixtures such as:

```ts
interface PricingGolden {
  id: string;
  cites: string[];
  request: PriceRequestArgs;
  expected: {
    readTok: number;
    inputTok: number;
    writeTok: number;
    outTok: number;
    usd: number;
  };
}
```

Required goldens should include:

- Sonnet/Opus/Fable rate tables.
- First main write and warm main growth.
- Identical subagent cold/warm requests.
- One-word variation (`11,602` read, `14,623` write).
- Exact expiry at 5 and 60 minutes, with equality expired.
- Minimum cacheable prefix at 1,023/1,024 tokens.
- Prefix mismatch and invalidated suffix.
- Reference and anti-pattern output for every level.
- Counterfactual pairing from the same seed.
- Replay equality after rewind.

The TTL semantics commit must change all liveness sites together so that `elapsed < ttl` is live and `elapsed >= ttl` is expired. In that same commit, re-lock `runL1Reference` and `runL1Anti` outputs plus every existing fixed-seed test, even if an individual fixture’s numbers remain unchanged. This prevents an engine-wide boundary change from being accepted through partial test coverage.

Golden updates must be an explicit developer action and show a readable diff. CI must never silently regenerate them.

### 5.4 Hot-reload level preview

Add a dev-only lab route, not Storybook:

```text
?lab=03-build-the-prefix&event=prefix-changed&seed=3&motion=reduce
```

The lab should provide:

- Level and scenario picker.
- Seed input.
- Event/action stepper.
- Jump to checkpoint or result.
- Actual reducer state and ledger inspector.
- Prediction committed/uncommitted toggles.
- Reduced-motion and audio toggles.
- Viewport presets.
- Touch-mode inspection.
- Effect replay without rerunning the economic action.
- Fixture export for a failing state.
- Frame-time and canvas-size overlay.

The lab must be absent from the production artifact. Use a top-level statically removable development branch around a dynamic lab entry:

```ts
if (import.meta.env.DEV) {
  void import("./lab/register.js").then(({ registerLab }) => {
    registerLab();
  });
}
```

Only inside that dynamically imported development module may level discovery use an eager `import.meta.glob`. Do not place an eager glob in a production-reachable module and assume a later runtime guard will remove it. The production artifact scan must verify that the lab query handler, inspector copy, fixture exporter, and lab-only module identifiers are absent from `dist/index.html`.

This will save more time than a generalized authoring GUI. The level files remain the source of truth; the lab makes exact states immediately inspectable.

### 5.5 Design tokens for tape, panels, and effects

`src/app.css` already has a useful color-token foundation. Extend it into a typed presentation system:

- Color roles: read, write, fresh input, output, stable prefix, mismatch, invalidated suffix, success, failure, warning.
- Typography roles: display, body, label, numeric, ledger.
- Geometry: tape row height/gap, gutters, panel radii, focus ring, target minimum, tooltip padding.
- Motion: instant, fast, teaching, celebration; standard easing curves; stagger.
- Audio: cue gain groups rather than file-level arbitrary volume.
- Layers: base, tape, particles, tooltip, toast, modal, transition.
- Effects: particle counts, lifetime, shake amplitude, glow radius.

Expose Canvas-consumed values through one `readVisualTheme()` call cached until theme/media settings change. Do not read CSS variables independently on every animation frame.

### 5.6 A vertical-slice template

Before implementing all thirteen levels, finish one redesigned level that exercises the full substrate. Build it in two explicit passes.

Functional pass:

1. Cold open.
2. Prediction.
3. Priced request.
4. Tape animation.
5. Stable presentation cue emitted to a silent/test adapter.
6. Cache/clock state change.
7. Local failure.
8. Freeze and rewind.
9. Explanation.
10. Transfer.
11. Result state.
12. Replay plus browser keyboard, touch, reduced-motion, and screenshot tests.

Polish pass, only after the functional pass is green:

13. Wire the stable cues to the audio bus.
14. Add bounded Canvas effects and result celebration.
15. Re-run determinism, artifact, accessibility, mobile input, performance, and browser-support gates.

`02-beat-the-clock` or `03-build-the-prefix` are good candidates. Once the template is deep, later levels mostly supply scenario data, copy, and one bespoke toy.

## 6. Risks and migration cost

Effort assumes one experienced engineer familiar with the codebase: **S** is roughly 0.5–2 engineering days, **M** is roughly 3–7 days, and **L** is roughly 2–4 weeks including tests and integration.

| Change | Effort | Main risk | Mitigation | Redesign status |
|---|---:|---|---|---|
| Restore a clean `check`/test gate | S | Existing type issues can mask regressions. | Fix the verified `ControlId[]`/`ToolId[]` mismatch; run writable CI; split test environments. | **Blocking before broad changes** |
| Canonical `LevelRuntime` | L | Implementing every aspirational field before a level needs it becomes over-engineering. | Build only the fields exercised by the first vertical slice; retain backward-compatible legacy fields. | **Blocking for redesigned levels** |
| `defineLevel` authoring module | M | A DSL can become more obscure than plain objects. | Keep it typed and functional; return ordinary canonical `LevelDef`; no magic parser. | **Blocking before authoring 13 levels** |
| Interaction-pattern registry | M | Pattern behavior splits between reducer, runtime, and Svelte or introduces noncanonical IDs. | Use the explicit ownership seam and action-union registration contract in §5.2; validate only canonical kebab-case IDs. | **Blocking before cloning teaching rhythms** |
| Scenario registry and prefix model | L | Changing cache resolution can invalidate calibrated numbers. | Preserve old aggregate scenarios as adapters; add golden fixtures before migration. | **Blocking for prefix-based curriculum** |
| TTL equality correction | S | Boundary changes alter costs, liveness UI, hidden-cost attribution, and fixed-seed expectations. | The specification wins: equality is expired. Change every liveness site and re-lock L1 reference/anti runs plus all fixed-seed tests in the same commit. | **Blocking before L2/L4 fixtures** |
| `HiddenCosts`/reducer migration | S–M | New fleet buckets are undefined in old state or saves. | Add `delegateUsd`, `fiveMinuteBandUsd`, and `mcpUsd`; initialize all nine fields; add explicit migration and round-trip tests. | **Blocking before fleet-audit state** |
| Immer reducer conversion | M | Svelte proxy/Immer proxy interaction or accidental non-serializable state. | Use `$state.raw`; Immer only receives plain snapshots; replay-serialize every fixture. | Incremental, but do before state becomes much larger |
| RNG consolidation and action recorder | M | Changed PRNG consumption alters existing fixed-seed results. | Preserve the current algorithm and consumption order; fork only new labeled streams; lock old goldens. | **Blocking for rewind/replay claims** |
| Presentation timeline | M | Motion sequencing leaks back into level views or replays effects after rerender. | Stable cue IDs, cancellation ownership, manual test clock, exactly-once effect ledger. | **Blocking before cloning polished patterns** |
| Functional vertical slice | M–L | Presentation work obscures runtime or teaching defects. | Complete the silent-cue functional pass first; require deterministic, accessible keyboard/touch/browser evidence before audio/FX. | **Blocking before campaign multiplication** |
| Audio engine and first SFX set | M | Browser autoplay restrictions, Safari data-URL decode failures, annoyance, and asset bloat. | Start only after the functional slice; unlock on first gesture, muted fallback, volume persistence, short compressed cues, no sound-only evidence. | Incremental after functional vertical slice |
| Canvas `FxLayer` | M | Particles create jank or turn into a premature scene engine. | Start only after the functional slice; fixed typed effects, pool/cap, central RAF, profile on mobile, no physics abstraction. | Incremental after functional vertical slice and timeline |
| Asset manifest and artifact validation | S–M | Incorrect import form emits separate files; base64 growth surprises late. | Plain ESM imports only; empirical fixture; post-build external-reference scan; record current artifact bytes; optimize before import. | **Blocking before substantial asset work** |
| Browser screenshot/interaction suite | M | Brittle snapshots and slow CI. | Keep a small critical matrix; mask timestamps; prefer semantic assertions plus a few visual goldens. | **Blocking for high-confidence visual shipping** |
| Touch input parity | S–M | Tap behavior conflicts with scrolling or leaves transient evidence inaccessible. | DOM adapter with persistent selected row, outside-tap/close dismissal, adequate targets, mobile Playwright plus real-device smoke tests. | **Blocking at tape/pattern level** |
| Accessibility modules | M | Retrofitting after custom interactions multiplies cost. | Put keyboard, touch, focus, and live-region behavior inside shared patterns from their first use. | **Blocking at pattern level; incremental by level** |
| Canvas performance harness | S | Synthetic budget may not represent players’ devices. | Use a representative throttled browser profile and supplement with manual device checks. | Incremental before effect escalation |
| Save migration/export/reset | S–M | Old campaign data breaks as progress and replay formats expand, or reset clears too much storage. | Versioned migration functions; preserve stars/unlocks; discard only incompatible attempts; export before reset; clear only owned keys. | Required before public redesign release |
| Browser/file support validation | M | A one-file build exists but fails through a browser-specific disk-open or audio path. | Enforce the §3 matrix, especially Safari module/data-audio behavior and mobile downloaded-file launch paths. | **Blocking before advertising offline support** |
| Remove pre-play `LearnScreen` | M | Old levels depend on its A/B pair and copy. | Reuse those deterministic runs as post-attempt counterfactual adapters. | **Blocking for pedagogy redesign** |

### Specific migration hazards

1. **Scenario metadata is ahead of implementation.** Do not assume existing `scenario` values select distinct queues. Introduce a registry and prove each scenario before tuning gates.

2. **The specification wins on TTL equality.** `isLive` is `clock.min < expiresAtMin`; expiry begins at `clock.min >= expiresAtMin`. Change `src/engine/simulate.ts`, `src/game/step.ts` liveness, and gap-expiry attribution together. In the same commit, re-lock the L1 reference/anti outputs and every existing fixed-seed test, plus add exact 5-minute and 60-minute equality fixtures.

3. **Current level gates are uneven.** Some gates measure behavior, while others only check spend. The new `GateDef.behavioralRequirements` cannot be introduced as a type-only rename; each level needs evidence-based migration.

4. **L1-specific local behavior should not become the template.** Preserve its working reducer numbers except where the canonical TTL boundary legitimately changes a fixture, but move prediction, toast deduplication, dawdle commit, failure, and rewind into reusable runtime modules before porting the rhythm.

5. **Audio and particles must be downstream effects.** If they mutate reducer state or consume economic RNG, replay correctness will become dependent on presentation settings.

6. **A single-file artifact shifts cost into startup.** Every “tiny” library and source asset arrives at once. Measure the final HTML, not only JavaScript gzip reports intended for server delivery.

7. **Asset syntax is part of the offline contract.** `new URL(..., import.meta.url)` is prohibited for runtime manifest entries. Only plain ESM imports with a recorded built-fixture result and green external-reference scan are accepted.

8. **Touch cannot be inferred from hover accessibility.** Keyboard focus does not give a phone user the calculator. Every inspectable Canvas row needs persistent tap selection and equivalent evidence.

9. **Reducer migration includes concrete hidden-cost drift.** The current six `HiddenCosts` fields are not the canonical nine. `delegateUsd`, `fiveMinuteBandUsd`, and `mcpUsd` must be added and initialized before fleet-audit scenarios or save migrations rely on them.

## 7. Recommendation

### Is the infrastructure solid enough to proceed?

**Yes—with a short substrate phase before mass level construction.**

The existing foundation is stronger than the current experience suggests. The pricing engine, ledger model, seeded reducer, campaign shell, Svelte DOM layer, tape visualization, and offline build configuration are appropriate and worth protecting. The stack can reach the reference bar.

It is not yet efficient to build all thirteen redesigned levels. Today, each bespoke level would have to reinvent phase sequencing, prediction gating, effects, failure freeze, rewind, accessibility, touch behavior, and real-browser QA. That would slow development and produce inconsistent quality.

### Highest-ROI investments before building the campaign

#### 1. Canonical level runtime plus a thin `defineLevel` authoring interface

**ROI: highest.**

Implement only the `OBJECT_MODEL.md` capabilities needed by one vertical slice: phases, action log, prediction, checkpoint, freeze/rewind, behavioral gate, and post-attempt counterfactual. Put canonical kebab-case interaction patterns behind the reducer/runtime/component interfaces in §5.2.

This converts thirteen levels from thirteen state machines into thirteen authored uses of a shared runtime.

#### 2. Golden economic/replay fixtures plus real-browser QA

**ROI: very high.**

Centralize `PRICE_REQUEST`, make TTL equality conform to the specification, lock prefix edge cases, and add browser coverage for Canvas final frames, reduced motion, keyboard flow, tap-to-inspect, focus, and campaign completion. Restore a clean typecheck gate first.

This protects the project’s strongest asset—credible deterministic evidence—while catching the visual and input bugs jsdom cannot see.

#### 3. A unified presentation timeline with an effects cue interface

**ROI: very high.**

Create one testable clock for DOM transitions, tape reveals, failure freezes, celebrations, and effect cancellation. Effects are triggered by stable event IDs and action indices. Initially route cues to a silent/test adapter so presentation infrastructure can be proven without asset production.

This is the smallest module that turns correct state changes into authored game beats.

#### 4. Complete the functional vertical slice

**ROI: very high.**

Finish one level through prediction, pricing, tape, TTL/cache mutation, local failure, rewind, transfer, result, replay, accessibility, keyboard, touch, and browser assertions. Do not start campaign-wide level production or production audio/FX until this slice is green.

This validates the substrate against a real teaching loop instead of an abstract framework.

#### 5. Add audio and bounded Canvas effects after the functional vertical slice

**ROI: high, correctly sequenced.**

Once the functional slice is stable, connect its existing cue IDs to distinct read/write/expiry/rewind/success sounds and a small vocabulary of pooled visual effects. Use Web Audio and Canvas2D first; add Howler only if measured compatibility work proves more expensive than its bundle cost.

Sound and causal motion can then close the delight gap without destabilizing the engine or masking runtime defects.

#### 6. Asset/offline budgets and a dev-only level lab

**ROI: high.**

Before the first production asset, prove plain ESM inlining with a real fixture, add the artifact validator and current-size report, and enforce the browser/file-open matrix. Add the exact-state HMR preview behind a statically removable development-only dynamic entry.

This prevents late single-file surprises and lets authors tune the thirteenth level as quickly as the first.

### What explicitly not to do

- Do not rewrite the application in React, Vue, or another UI framework.
- Do not introduce Phaser, PixiJS, Three.js, an ECS, or a universal scene graph for the current design.
- Do not move the whole experience into Canvas; predictions, controls, copy, results, and accessibility belong in the DOM.
- Do not add Redux, XState, a URL router, a backend, a database, telemetry, or cloud persistence without a demonstrated requirement.
- Do not implement all fields in `OBJECT_MODEL.md` abstractly before the first vertical slice exercises them.
- Do not build a generalized visual level editor. A code-first DSL plus a dev lab is faster and safer.
- Do not use Storybook as the primary level preview; it does not naturally model reducer action history and checkpoints.
- Do not allow animation time, audio state, or particle RNG to affect economic state.
- Do not commission a large soundtrack or asset library before the functional interaction rhythm is proven.
- Do not add workers or OffscreenCanvas until profiling shows a real problem.
- Do not use `new URL(..., import.meta.url)` for runtime asset-manifest entries.
- Do not assume keyboard support makes a hover-only surface usable by touch.
- Do not relax or advertise the single-file offline constraint without passing the artifact and browser/file-open matrices.

The architectural direction is therefore not “replace the stack.” It is “deepen the missing modules.” Preserve the deterministic engine and Canvas tape, make the canonical object model executable, and add just enough production-grade presentation and verification infrastructure that every new level inherits quality by default.
