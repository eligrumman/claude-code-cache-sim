# STATUS

Current state of the Claude Code Cache Simulator, for anyone (human or AI) picking this up cold.
Last verified: local HEAD `55dfeb5` on branch checked out at time of writing.

## 1. What this is

A game that teaches how Claude Code's prompt cache and context economics actually work, by making
you spend a fake budget. You play Bob, a developer (later a team lead, later a fleet budget
manager), running Claude Code across a leveled campaign: map -> learn (a scripted before/after
replay showing a dollar delta) -> play (you set a config loadout and step a task queue while a
canvas "tape" renders priced requests hitting the wire) -> result (pass/fail gate, 1-3 stars) ->
unlock (the next level reveals exactly one new control). Every dollar figure the player sees is
computed by the same deterministic pricing engine end to end, not window dressing.

The player fantasy, one line per tier: Tier 1 (L1-L6) is "every token is read, written, or
generated, and the multipliers decide everything." Tier 2 (L7-L11) is "the cache is a clock -
TTLs, idle gaps, and session starts are where real money leaks." Tier 3 (L12-L13) is "at fleet
scale you rank the levers by dollars and set policy, not per-turn control."

The whole game is a layer over a pure pricing/session-economics engine; it never contradicts the
underlying spec's numbers.

## 2. Tech stack + how it works

- **Svelte 5** (runes: `$state`, `$derived`, `$effect`, `$props`) for all UI.
- **Vite 6** + `@sveltejs/vite-plugin-svelte` + `vite-plugin-singlefile`, with
  `assetsInlineLimit` set to ~100MB, `cssCodeSplit: false`, and no manual chunking. The build
  inlines every JS/CSS asset as a `data:` URI into one HTML file. See `vite.config.js` and
  `ARCHITECTURE.md`.
- **Engine** (`src/engine/`): a pure, deterministic reducer core. No `Date.now`, no
  `Math.random`, no DOM. Given a seed and a config it always produces the same priced ledger.
- **Renderer** (`src/render/`): a Canvas2D "tape" that draws blue read / red write segments per
  request as it happens, DPR-aware sizing, and easing helpers.
- **TypeScript** throughout, strict mode, `noEmit` (Vite/esbuild transpiles; Vitest runs `.ts`
  natively). `tsconfig.json` targets ES2020, `moduleResolution: bundler`.
- **Vitest 4**, environment `jsdom` globally (a no-op for the pure engine tests, needed for the
  newer component/e2e tests that mount real Svelte components).
- Immer (`immer` dependency) is used inside the `src/game/step.ts` reducer for state updates.

The build produces exactly one self-contained offline `dist/index.html` with zero external
resource references (no `http://`, no `src="//"`, no external `<link>`/`@import url()`). The only
`https://` literal strings baked into the bundle are Svelte's own inert error-doc links inside its
runtime throw messages (`https://svelte.dev/e/...`) - they are never fetched, just string text.
This is documented and intentional in `ARCHITECTURE.md`; do not "fix" it by stripping strings.

## 3. How to run / build / test

```
npm install                          # installs deps (Svelte, Vite, Vitest, etc.)
npm run dev                          # live Vite dev server
npx vitest run                       # run the full test suite once (npm test does the same)
npx vitest                           # watch mode (npm run test:watch)
npx vite build                       # produces dist/index.html (npm run build)
npm run check                        # svelte-check (tsc over .ts + .svelte)
npm run preview                      # preview the built dist/ output
```

`dist/index.html` is the single build artifact. It must stay self-contained and offline - no
`<script src="http...">`, no external stylesheets, no runtime `fetch`/network calls. This is
enforced by the vite-plugin-singlefile config, not by a separate CI check right now, so verify by
eye after any build-config change.

**Measured right now** (this session, from a clean `npx vitest run` and `npx vite build`):
- Tests: **9 test files, 108 tests, all passing, exit code 0.**
- Build: **dist/index.html, 137.76 kB** reported by Vite (~136 KiB on disk), build time ~0.6s,
  142 modules transformed.
- The build/test run emits several Svelte 5 `state_referenced_locally` warnings (non-fatal) from
  `PlayScreen.svelte` and `SessionStream.svelte` about `$state` values captured by closures
  instead of read reactively. These are warnings, not errors - the app builds and the tests pass,
  but they are worth cleaning up (see Next Steps).

Note: `ARCHITECTURE.md`'s own text says "62 existing vitest tests" - that referred to an earlier
point in the project's history (pre-L1-redesign, pre-campaign-shell). The real number today, as
measured, is 108 tests across 9 files. Treat the 108 number as current truth.

## 4. Repo layout

```
src/
  engine/            pure deterministic pricing core (no DOM, no Date.now/Math.random)
    types.ts           Model/Tier/Config/CacheState + fan-out/request shapes
    pricing.ts         RATE multipliers, MODEL_IN prices, priceTable, tokCost
    constants.ts       every calibration constant, C-number cited - canonical numbers source
    ledgers.ts         base-size (prefix) functions: mainBaseTok / subBaseTok / mcpShare / ledgerScale
    simulate.ts        computeRun (fan-out) + simulateRequest (single request) + keep-warm math
    *.test.ts          invariant tests (price cells, ledgers, golden totals, TTL expiry, 20x gap)

  game/               the reducer over the SDLC unit graph + the 13-level campaign
    types.ts            UnitKind/UnitInstance/LedgerRow/GameState/Action/SaveFile
    step.ts             typed step(state, action) + replay/runScript (immer-based), L1_CFG constant
    levels.ts            the 13 LevelDef entries (Section 11 of SIMULATOR_SPEC), gates, stars, unlock chain
    shell.ts             screen state machine (map -> learn -> play -> result), localStorage persistence
    report.ts            hidden-cost ledger / mini-report formatting
    assert.ts             boot-time invariant assertions (reference/anti-pattern checks)
    *.test.ts             tests for the above

  render/             canvas renderers
    dpr.ts              DPR-aware canvas sizing (getDpr/sizeCanvas/tapeHeight)
    tween.ts            lerp/easeInOut/progress/reducedMotion helpers
    tape.ts             TapeRenderer: blue read / red write tape segments + TTL drain bars
    tape.test.ts

  components/         Svelte UI
    MapScreen.svelte      13-tile level map (3 tier rows), stars, locked tiles
    LearnScreen.svelte    generic before/after LEARN replay (used by L2-L13)
    PlayScreen.svelte     generic config-strip + unit-board PLAY screen (used by L2-L13)
    ResultScreen.svelte   pass/fail gate result + mini-report
    L1PlayScreen.svelte   L1-SPECIFIC play screen (clock/TTL/standup mechanic doesn't fit the generic shape)
    IntroCards.svelte     L1's 3-card intro (replaces the generic LEARN screen for L1 only)
    ClockTtlBar.svelte    L1's live clock + TTL countdown bar
    ChoiceBar.svelte      L1's task/coffee/standup timing choice control
    ConfigStrip.svelte    the per-level progressive-disclosure config controls
    Hud.svelte            objective line, clock strip
    SessionStream.svelte  embeddable request-stream strip
    UnitBoard.svelte      the SDLC unit queue board
    Toast.svelte          in-play teaching toasts (L1)
    ReportModal.svelte    hidden-cost report modal

  App.svelte           router across the screen state machine
  main.ts               entry point
  app.css
  test-setup.dom.ts     jsdom test setup
  app.dom.test.ts       app-level jsdom smoke test
```

## 5. Current state (be precise, be honest)

### L1 - "The First Hour": DONE

L1 is finished, playable end to end, and was QA'd by actually clicking through it in a real
browser (agent-browser / CDP), not just via jsdom logic tests. Screenshots from that QA pass live
in `qa-shots/` in this repo (map, intro cards, learn/cost replay states, play-with-wire states,
hover price tooltips, finish screen, and a couple of full replay sequences including a WIN run).

Mechanics (see `src/components/L1PlayScreen.svelte`, `src/components/IntroCards.svelte`,
`src/components/ClockTtlBar.svelte`, `src/components/ChoiceBar.svelte`, and the external design
doc `L1_REDESIGN.md`):
- A live in-game **clock** running across a ~5-hour session window (`clockCapMin: 300`).
- A **60-minute TTL** on the main session cache: `mainEntry.lastTouchMin + 60 - clockMin`. If the
  player dawdles past it, the cache dies and the next request rewrites cold at the full 2x rate.
- A **standup-timing choice** (task / coffee / standup) via `ChoiceBar.svelte` - a genuine
  decision, not a config toggle, about *when* to take the out-of-order standup unit relative to
  the cache's remaining warm window.
- **Token-basics teaching** delivered via 3 intro cards plus 6 in-play toasts, not a scripted
  before/after LEARN replay (L1 is the one level that doesn't use the generic
  LearnScreen/PlayScreen - its mechanic doesn't fit that shape).
- A **hover price calculator** on the tape/wire so the player can inspect the per-request cost
  breakdown before or after it fires.
- The **requests-on-the-wire tape** (canvas TapeRenderer) actually renders segments with real,
  non-zero costs during play - this was previously broken (commit `0043a19` fixed an empty tape
  and `$0.0000` reference costs) and commit `55dfeb5` fixed a related bug where the real-time TTL
  drain could expire the cache before a human player could physically finish clicking.

Gate (`LEVEL_BY_ID.L1` in `src/game/levels.ts`): pass requires all 4 tasks + the standup done,
total spend `<= $0.55`, and `<= 1` cold main-session write. Star 2 at spend `<= $0.47`. Star 3 at
spend `<= $0.44` AND exactly 1 cold main write. The scripted reference config (`L1_CFG` in
`src/game/step.ts`) lands at **$0.416, 3 stars**; the anti-pattern path lands at **$0.525**
(comment in `step.ts` line ~555).

### L2-L13: ENTERABLE but UNTUNED - not yet implemented to L1's bar

All 13 levels exist as data in `src/game/levels.ts` (id, tier, title, objective, unlocks,
introducedControls, teaches, scope, seed, budgetUsd, cfgOverride, scenario id, learn beat,
gate predicate, star2/star3, referenceCfg, antiCfg, failLesson) and are reachable from the map
screen. They render through the **generic** `LearnScreen.svelte` / `PlayScreen.svelte` /
`ConfigStrip.svelte` shape. What's missing, per the external `GAME_PLAN.md` Section G slice plan:
scenario-specific queue/idle-gap/clock behavior (the `ScenarioId` system, slice G4), tightened
gate predicates per spec Section 11.3 (slice G5), the fleet driver for L12 (slice G6), and
visibility/UI polish passes (G7, G9). Screens currently work off the *default* scenario shape for
levels that are supposed to have distinct scenario mechanics (gaps, fan-out timing, week
boundaries, etc.) - so playing L7-L13 today will not yet exercise the specific lesson each level
is designed to teach.

The 13 levels, from `GAME_PLAN.md` Section D (all currently NOT YET IMPLEMENTED beyond L1):

**Tier 1 - Personal** (single ~5h session)
- L1 "The First Hour" - DONE (see above). Unlocks `run`.
- L2 "Pick Your Fighter" - unlocks `devModel`. Lesson: output tokens price at 5x; the cheap model
  ($50/M out for `fable`) is where budgets die.
- L3 "The Planner's Paradox" - unlocks `planModel`. Lesson: a cheap plan model looks cheaper but
  costs more in review/CI rework.
- L4 "Send in the Clones" - unlocks `who` (inline vs subagent). Lesson: inline re-prices the whole
  growing history every turn; a subagent pays one bounded 26,237-tok cold base instead.
- L5 "One Word Costs 14.6k" - unlocks `prompts` (identical vs varied). Lesson: identical subagent
  prompts reuse cache free after spawn 1; one changed word rewrites 14,623 tok every spawn.
- L6 "The Five-Minute Window" - unlocks `width` (fan-out width). Lesson: subagent caches die after
  5 minutes idle; fan wide enough to finish inside the window.

**Tier 2 - Team Lead** (a week: three tickets, coffee breaks, overnights)
- L7 "The Coffee Break" - unlocks `keepWarm`. Lesson: idle rebuild is the biggest real lever, but
  pinging the cache warm past ~16-20 idle hours stops paying off.
- L8 "The Long Cache" - unlocks `oneHourFlag`. Lesson: the 1-hour cache flag is a bet on your
  rebuild ratio (break-even ~0.65), not a free buff.
- L9 "The Poisoned Catalog" - unlocks `hook`. Lesson: a dynamic SessionStart hook line poisons the
  cached prefix, losing ~24,300 tok every session start; a static hook fixes it.
- L10 "Loadout Discipline" - unlocks `skills` (+ `skillsMode`, `memoryFiles`). Lesson: an eager
  150-entry skills catalog rides ~13,083 tok cold into every base; invoke-only mode keeps it near
  zero until a skill actually triggers.
- L11 "Trim the Fat" - unlocks `mcp`. Lesson: MCP tool schemas ride ~16k tok into every cold base,
  main and spawn alike; enabling only what a ticket needs is the highest universal lever.

**Tier 3 - Budget Manager** (a month, 5-dev fleet)
- L12 "The Budget Manager" - unlocks `fleet`. Lesson: set weekly policy for 5 devs, each with a
  different bad habit (fable, inline, varied prompts, dynamic hook, no keep-warm); every prior
  level's lesson compounds at fleet scale.
- L13 "The Audit" - unlocks `audit`. Lesson: read a cache-diagnose-style report, rank the dollar
  levers correctly (idle >> delegate > 5m-band > MCP), and execute the recovery in that order.

### The 9-slice implementation plan (G1-G9, from GAME_PLAN.md Section G)

| Slice | What | Status |
|---|---|---|
| G1 | Level-data model extension (13 LevelDef entries, all C.1 fields) | **Done** - `src/game/levels.ts` has all 13 entries |
| G2 | Shell state machine + map/learn/result screens, App.svelte as router | **Done** - `src/game/shell.ts`, `MapScreen.svelte`, `LearnScreen.svelte`, `ResultScreen.svelte`, `PlayScreen.svelte` all exist and the map->learn->play->result->unlock loop works for L1 |
| (L1 redesign) | Time-aware onboarding: clock, TTL expiry, standup choice, token-basics teaching | **Done** - separately from the numbered slices, per `L1_REDESIGN.md` |
| G3 | Reducer instrumentation for gates (idleLog, sessionStart tagging, cfgTouches, skill-trigger rolls, scenario marks) | **Pending** |
| G4 | Scenario system (`ScenarioId`, per-scenario queue/idle/clock overrides) | **Pending** - `ScenarioId` type exists in `levels.ts` and each level cites a scenario string, but the scenario *system* (`src/game/scenarios.ts`) that gives each scenario distinct behavior is not built |
| G5 | Gate tightening to spec 11.3 (replace weak/generic predicates with the real per-level ones) | **Pending** - most L2-L13 gates today are simple "spent <= budget" checks, not the richer predicates the design calls for |
| G6 | Fleet driver + L12/L13 screens (`fleet.ts`, `FleetScreen.svelte`, `AuditScreen.svelte`) | **Pending** |
| G7 | Play-screen visibility layer (progressive ControlId disclosure, run bar polish, spec 8.0 no-cost-badge audit) | **Pending** |
| G8 | Boot invariants + reference/anti-pattern assertions for all 13 levels | **Pending** - `src/game/assert.ts` exists but full 13-level invariant coverage is not confirmed |
| G9 | Result/loss/report polish (mini-report bucket filtering, citation links) | **Pending** |

## 6. The grounding principle

Every number the game shows must trace to one of: `src/engine/constants.ts` (the canonical
in-repo numbers source, with C-number citations), the mitmproxy findings files 01-06 in
`/Users/user/claude-cache-findings/` (the raw measured data), or `SESSION_PROFILE.md` (mined
real-session shape data) - or it must be explicitly tagged `[ESTIMATE]` or `[FICTION]` in a
comment. `constants.ts` itself follows this discipline inline (e.g. `WORK_IN`/`WORK_OUT` are
tagged `[FICTION, calibrated so the scripted runs land]`; the cache ledger numbers like
`BASE_IDENTICAL = 26237` are tagged as measured/exact).

Key canonical numbers, and where they come from:
- **Rate multipliers** (C1): read 0.1x, write-5m 1.25x, write-1h 2x, output 5x. Defined in
  `src/engine/pricing.ts`'s `RATE` table.
- **Cache TTLs**: main session cache is 1 hour; subagent cache is 5 minutes. This is the core
  tension L1 and L6 teach.
- **Break-even ratio for the 1-hour flag** (C21, corrected): `ONEHOUR_BREAKEVEN = (2 - 1.25) /
  (1.25 - 0.1) ~= 0.6522` in `constants.ts`. The comment there notes an earlier 0.40 figure used
  the wrong no-cache counterfactual and was corrected to 0.65 - use 0.65 everywhere, not 0.40.
- **Keep-warm break-even idle hours** (C19): 1h tier ~20h, 5m tier ~1.04h.
- **Base cold-write sizes** (C6, C7, C10, C24): main session tool definitions 16,295 tok (14-tool
  set); system prompt 2,750 tok; skills catalog 13,083 tok (150 entries, ~87 tok/entry); identical
  subagent cold base 26,237 tok (measured, C10); one-word-diff subagent rewrite 14,623 tok write /
  11,602 tok read each spawn (C11).
- **Fan-out timing** (C27): ~90s per spawn against a 5-minute subagent TTL means only ~3 serial
  waves stay warm - this is L6's whole lesson.
- **Month economy figures** ($90 monthly budget, 6x manual-hours multiplier, tedium accrual) are
  explicitly tagged `[FICTION, anchored]` in `constants.ts` - deliberately fictional but calibrated
  so the scripted campaign runs land where the design intends.

## 7. Testing + QA workflow (the hard-won lesson)

jsdom logic tests are necessary but **not sufficient**. Earlier in this project's history, a fully
green `vitest run` shipped a build that was visibly broken when actually played: the tape rendered
empty (no request segments drawn), reference costs displayed as `$0.0000`, and the level was not
winnable by clicking through it as a human would. The jsdom tests passed because they exercised
the reducer's pure state transitions, not the rendered DOM output or the real-time clock/TTL
interaction a human player experiences. Commits `0043a19` and `55dfeb5` are the fixes for this
class of bug.

**The required QA gate for every new level**, going forward:
1. `npx vitest run` green (necessary, not sufficient).
2. **agent-browser** (CDP browser automation) actually playing the level: navigate to the built
   page, and click through it with human-length pauses between actions - not instant scripted DOM
   dispatch. This is what caught the empty-tape and TTL-expires-before-a-human-can-click bugs.
   Screenshots from L1's pass are saved in `qa-shots/`.
3. **Render-model assertions**: canvas/DOM checks that the number of tape segments matches the
   number of priced requests, every segment's cost is `> 0`, and the formatted cost string is
   never `"$0.0000"`.
4. A **click-through test** that plays the level to completion (or to a defined failure) via
   simulated user interaction, not by calling reducer functions directly.

Do not consider a new level "done" on green tests alone. L1 is the only level that has been
through this full gate; L2-L13 have not.

## 8. Publishing

The built `dist/index.html` from this repo is copied into a **separate** Pages repo,
`/Users/user/sources/claude-code-cache-site` (or wherever that repo is checked out locally;
remote is `eligrumman/claude-code-cache-explained`), as `sim.html`. That is the repo that actually
publishes to GitHub Pages. The live URL is:

```
https://eligrumman.github.io/claude-code-cache-explained/sim.html
```

This repo (`claude-code-cache-sim`) holds source and never publishes directly; the site repo holds
only the published artifact. Publishing a new build means: `npx vite build` here, then copy
`dist/index.html` to that repo as `sim.html`, commit, and push there.

This repo's own remote is `origin = git@github.com:eligrumman/claude-code-cache-sim.git`.

## 9. Next steps

1. **Build L2-L13 to L1's bar**, one at a time, each going through: Fable design input (external,
   pending) -> sonnet implementation against `GAME_PLAN.md` Section D + the relevant G-slice ->
   agent-browser QA by actually clicking through it -> render-model + click-through tests ->
   publish to the site repo. This is gated on the user supplying further Fable design inputs per
   level/slice.
2. Work through the G3-G9 slices in dependency order (G3 -> G4 -> G5/G7 -> G6 -> G8/G9) as the
   mechanism for getting L2-L13 to parity with L1, rather than hand-rolling each level ad hoc.
3. A deferred **visual-polish ("wow") pass** - explicitly out of scope for the functional slices
   above; GAME_PLAN.md's global constraints say "plain DOM + the existing TapeRenderer... ncase-
   grade polish is a later phase."
4. The **LEVEL_EXPLANATIONS.md** copy (per-level teaching text, external doc) is pending review -
   the objective/teaches/learn-beat copy currently in `levels.ts` should be checked against it
   before or during each level's implementation.
5. Minor cleanup: the `state_referenced_locally` Svelte 5 warnings in `PlayScreen.svelte` and
   `SessionStream.svelte` (harmless today, but worth fixing so real bugs don't hide in the noise).
