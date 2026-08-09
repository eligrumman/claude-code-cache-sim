# Claude Code Cache Economics — Final Master Plan

## 1. Product vision

Build a thirteen-level browser game in which developers learn Claude Code prompt-cache economics by making consequential choices against a visible budget, clock, request tape, and cache state. The player should finish able to reason from prompt shape, cache lifetime, model price, workload mix, and organizational scale—not merely recall that “caching is cheaper.”

The teaching contract is:

1. Put a meaningful control under the pointer within two seconds.
2. Show a situation without exposing its solution.
3. Require a non-punitive prediction before the relevant reveal.
4. Execute the player’s choice through the deterministic reducer and real pricing engine.
5. Make the causal consequence visible in the request tape, cache, clock, prefix stack, or ledger.
6. Name the rule only after evidence exists.
7. Require a new post-evidence action that demonstrates transfer.
8. Freeze only on a real, visibly more expensive request; rewind to the nearest decision without replaying mastered setup.
9. Reveal reference and anti-pattern comparisons only after a meaningful attempt.
10. Celebrate demonstrated understanding and avoided waste, never spending itself.

The experience target is the clarity and hypothesis-testing of *The Evolution of Trust*, the immediacy of neal.fun, the live constraint feedback of *The Password Game*, and the earned scale shift of *Universal Paperclips*. The game remains a deterministic educational instrument: delight makes causality tactile but never changes economics.

## 2. The thirteen-level learning arc

### Level 1 — Bob’s Login Bug

The player sends two related requests and sees a `34,738`-token main prefix change from a `$0.210264` first write to a `$0.0122634` read. The transfer asks whether a third task should remain in the implementation thread or open in a faster isolated thread. Keeping it here costs `$0.0122604` and takes `12m`; isolating it costs `$0.210267` and takes `4m`. Both routes pass because the real tradeoff is spend versus completion time. The aha is that the short new sentence is not the expensive object—the available saved context is.

### Level 2 — One More Check

The player creates a live 60-minute main-cache entry, then chooses Coffee-first or Standup-first. Coffee sends the identical follow-up at minute `20`, producing a read and a `$0.2188494` total before finishing exactly at the minute-`110` deadline. Standup clears the blocker first, sends after expiry at minute `90`, and finishes twenty minutes earlier for `$0.4168560`. Both profiles pass. The aha is that byte-identical work can still rewrite when idle time crosses the cache lifetime; schedule progress can justify the higher request bill.

### Level 3 — Build the Prefix

The player watches `SYSTEM`, `TOOLS`, `INSTRUCTIONS`, and `HISTORY` form a reusable `34,738`-token front, then chooses where to place a reminder. A late HISTORY change rereads `21,655` tokens and rewrites `13,083`, producing a `$2.3500653` run that finishes at minute `58`; an early SYSTEM change rewrites all `34,738`, producing a `$2.4734988` run that finishes at minute `50` because the policy persists into the handoff. Both profiles pass. The aha is that reuse ends at the first changed block, while placement may also carry operational benefits beyond the current request.

### Level 4 — The Five-Minute Race

Eight subagent jobs are grouped into waves. Narrow grouping creates more six-minute inter-wave gaps and therefore more cold `26,237`-token writes; maximum width avoids a write but pays a superlinear coordinator-output cost. Width `4` is the minimum at `$7.37800410`, while width `8` costs `$8.23248645`; the full width-`1` projection is `$9.81111000`. A playable width-`1` branch freezes when Job 2 arrives at `6:00` and costs `$0.77638875` instead of the live-read alternative `$0.68587110`. The aha is a U-shaped batching decision: fewer waves preserve a short-lived shared prefix, but oversized coordination is not free.

### Level 5 — Eight Tiny Fixes

The player chooses between a greeting-first prompt that is ready in one minute and a normalized ticket-tail prompt that takes four setup minutes. Greeting-first causes each changed word to preserve `11,602` tokens but rewrite a `14,623`-token suffix; eight requests cost `$0.50660670`. Ticket-tail preserves the full `26,237`-token prefix; eight requests cost `$0.15348645`. Both routes can earn three stars through their distinct time or spend benefit, and a subsequent human-triage transfer requires ticket-first placement under a different constraint. The aha is not “tail is always correct”; exact byte identity and the active operational constraint determine placement.

### Level 6 — Buy More Time?

The player chooses a write tier for two different workday rhythms. On tightly clustered Monday, 5-minute writes total `$0.12200205` while 1-hour writes total `$0.18103530`; the premium avoids no rebuild. On Tuesday’s 30-minute gaps, 1-hour writes total `$0.18103530`, while 5-minute writes would total `$0.39355500`. Choosing 5m on Tuesday freezes at the first expired rewrite: `$0.09838875` instead of a `$0.00787110` live read. The reference route totals `$0.30303735`, versus `$0.57459030` for the reversed anti-pattern. The aha is that longer lifetime is an investment whose payoff depends on the schedule, with a canonical break-even ratio of approximately `0.652173`.

### Level 7 — The Long Day

The player receives exactly three keep-warm markers for five gaps. Coffee and Meeting remain warm without intervention; Lunch needs two pings, Commute needs one, and a 21-hour Overnight should expire. Each ping costs `$0.0104394`; it is worthwhile only while its accumulated cost remains below the `$0.1980066` cold-to-warm request delta. Selective protection costs `$0.5006598`, capped “always ping” costs `$0.6986664`, and never ping costs `$0.8653548`. The aha is that keep-warm is a finite investment decision, not a universal toggle: Lunch is worth tending and Overnight is not.

### Level 8 — Growing Pains

The player routes six tickets between the growing main conversation and bounded subagents. A dependent follow-up is cheaper in main (`$0.0762` versus `$0.26638875`); a tiny independent check is also cheaper in main (`$0.0258` versus `$0.10738875`) because a cold subagent base dominates its small payload. Once main history reaches `600,000` tokens, a larger four-job batch becomes cheaper in a shared subagent wave. The mixed reference costs `$0.53600205`; all-inline costs `$1.1736`, a `$0.63759795` or `54.33%` difference. The aha is that routing depends jointly on required relationship context, carried-history size, and cold-room setup—not independence alone.

### Level 9 — Model the Work

Three jobs receive the same `6,000`-token input but produce different outputs. Search costs `$0.030`, output-heavy Codegen costs `$0.678`, and Short review costs `$0.0255`; Codegen output contributes `$0.660`, or `97.35%`, of its Sonnet row. The player applies the `5x` output rate to a new workload after seeing all three tapes. The post-attempt model comparison shows the three-job set at `$0.7335` on Sonnet, `$1.2225` on Opus, and `$2.445` on Fable. The aha is that token count must be weighted by its billing bucket and model rate; the largest cost can sit on the smaller token side.

### Level 10 — The Checkout Ticket

The player buys Quick, Working, or Exhaustive planning before a fixed three-build pipeline. Plan requests cost `$0.0660`, `$0.1560`, and `$1.2360`; every build or repair costs `$0.6798`. Quick triggers four repairs and totals `$4.8246`; Working triggers one and totals `$2.8752`; Exhaustive triggers none but totals `$3.2754`. Quick freezes on its fourth repair because that `$0.6798` request exceeds the visible `$0.0900` Quick-to-Working plan increment. Working wins on spend, Exhaustive wins on request count, and a disposable prototype transfer makes Quick appropriate. The aha is marginal: buy preparation only while its next increment can repay itself in avoided downstream work. Repair incidence is explicitly ticket-specific `[FICTION]`; request pricing remains exact.

### Level 11 — Monday’s Three Tickets

The player packs one compound skills/memory/MCP loadout for three independent cold workspaces. Missing capability stops locally without fabricating a zero-cost request; loading everything completes safely but rewrites `38,738` prefix tokens in every workspace. The smallest sufficient invoked loadout writes `11,504` tokens and costs `$2.241072`; all-loaded costs `$2.731284`, a `$0.490212` or `21.87%` premium. Exploration is allowed, but repeating the exposed all-loaded setup freezes on a real `$0.910428` request versus the confirmed-use `$0.747024` alternative. The aha is constrained minimization: include every required capability and no passenger that will be multiplied across cold starts.

### Level 12 — Seven Cold Starts

A changing 20-token status block initially sits before `24,300` stable tokens. If retained at the tail, seven starts cost `$0.18996`; if disabled, they cost `$0.18954` but lose the required fresh-status capability and complete as a local failure. Leaving the status early freezes at Start 2 when `$0.14586` is charged instead of `$0.00735`; the seven-start harmful projection is `$1.02102`. The aha is the disproportion between cause and consequence: one tiny volatile block can invalidate a large stable suffix when it appears before the reuse boundary.

### Level 13 — The Fleet Audit

The capstone turns familiar request evidence into five developer reports and a two-remedy allocation problem. The nine sampled requests cost `$6.69987735` from the separate `$90` API wallet, while the organizational hidden-loss ledger totals `$692`: Ari idle rebuilds `$575`, Bea prompt drift `$72`, Cy short-cache misses `$30`, and Dev tool-schema load `$15`. Eli’s `8,800,000` legitimate output tokens are a deliberate false visual heuristic. After ranking and matching unlabeled values, the player chooses two remedies by recovery, implementation reserve, and delivery time. Four non-dominated pairs pass, from Bea+Dev at `$34` net in `45m` to Ari+Bea at `$257` net in `210m`; dominated pairs remain completable and rewindable. The aha is fleet triage: the largest activity signal need not be the largest recoverable loss, and the best plan lies on a net-value/time frontier rather than at “fix the two biggest numbers.”

## 3. Curriculum progression

### Campaign arcs

| Arc | Levels | Player capability |
|---|---|---|
| Read the mechanism | L1–L6 | Interpret writes, reads, expiry, prefix boundaries, subagent windows, prompt identity, and write-tier premiums. |
| Shape execution | L7–L10 | Decide when to preserve a cache, where work should run, which priced bucket dominates, and how much planning is worth buying. |
| Shape the system | L11–L13 | Design a capability-sufficient prefix, control volatile ordering, and allocate interventions across fleet-scale losses. |

### Dependency ordering

| Concept | Introduced | Reinforced or consumed later |
|---|---|---|
| Write versus read | L1 | L2–L13; supplies the visual and economic grammar for every later tape. |
| Cache expiry and idle TTL | L2 | L4, L6, L7, L12, L13. |
| Ordered prefix reuse | L3 | L5, L8, L11, L12, L13. |
| Shared subagent 5m window | L4 | L5, L8, L13. |
| Byte-identical prompt identity | L5 | L8, L12, L13. |
| 5m versus 1h write tiers | L6 | L7 and fleet diagnosis in L13. |
| Rebuild penalty and keep-warm break-even | L2, quantified in L6–L7 | Ari’s fleet leak in L13. The 1h rewrite/read ratio is `20x`; keep-warm remains governed by actual ping cost versus avoided rewrite cost. |
| Routing and bounded contexts | L8 | Loadout multiplication in L11 and fleet prompt-drift diagnosis in L13. |
| Input/output workload mix and model tiers | L9 | L10 planning cost, L11 cold-prefix/output composition, and Eli’s legitimate output volume in L13. |
| Planning versus downstream rework | L10 | Fleet implementation-burden reasoning in L13. |
| Capability-constrained prefix sizing and cold starts | L11 | L12 ordering and Dev’s schema-load diagnosis in L13. |
| Volatile prefix position | L12 | Integrated diagnosis in L13. |
| Fleet economics and efficient intervention | L13 | Campaign synthesis; no new pricing rule is introduced. |

The canonical concept IDs and exact prerequisite arrays are those in `docs/screens/OBJECT_MODEL.md`. Campaign unlock order remains L1 through L13 even if engineering implementation is sequenced differently.

## 4. Shared architecture

`docs/screens/OBJECT_MODEL.md` is the normative authority. Level files instantiate its objects; they do not redefine tokens, cache semantics, predicate language, interaction patterns, or UI contracts.

### State ownership

`ReducerState` remains plain, serializable, deterministic data. Its major regions are:

- Simulation: seed, scope, scalar `clockMin`, scalar `wallet` and `budget`, configuration, cache, units, ledger, counters, hidden costs, and PRNG state.
- Discovery runtime: `phase`, prediction state, checkpoints, frozen or local failures, event/explanation/transfer evidence, attempt number, and action index.
- Bespoke puzzle state: prefix stacks, cache entries, selected loadout, finite marker inventories, audit ranking and value matching.
- Evidence: canonical level-specific fields such as `evidence.l12` and attempt-local evidence.
- Attempt aggregation: mutable `attemptMetrics` during play and immutable `attemptResult` only after completion.

Components never own authoritative economics, gate evidence, checkpoint positions, or prediction correctness. Local Svelte state is limited to ephemeral focus, hover, drag preview, and animation progress.

### Actions and reducer contracts

The canonical `Action` union is grouped around:

- Existing work: `RUN_UNIT`, `HAND_CODE`, `SET_CFG`, `ADVANCE`.
- Discovery: level entry, checkpoints, prediction selection/commit/reveal, explanation, and transfer.
- Prefix/cache manipulation: block setup, reorder, content change, enablement, breakpoints, prompt normalization, context discard, and request send.
- Scheduling/routing: time placement, fan-out width, route, keep-warm request, write tier, model, and plan depth.
- Finite inventories, loadout submission, audit ranking/matching, remediation, failure, rewind, counterfactual, and completion.

Every accepted action must be exhaustively reduced, replay-serializable, and validated before mutation. Invalid actions are rejected atomically and create no request, spend, event marker, or partial state change.

`SEND_REQUEST`, priced `RUN_UNIT`, and `PLACE_KEEP_WARM_PING` are the only kinds of operations that may create their authored request rows. Each request resolves prefix buckets, prices them, mutates cache, appends exactly one `LedgerRow`, deducts scalar `wallet`, and updates `attemptMetrics` atomically.

### Predicate language

All events, failures, gates, stars, and QA assertions use the declarative `StatePredicate` registry:

- Kinds: `compare`, `includes`, `event-completed`, `action-observed`, `all`, `any`, and `not`.
- Comparison operators: `eq`, `neq`, `lt`, `lte`, `gt`, and `gte`.
- Membership uses `includes`; `op: "contains"` is invalid.
- Paths must resolve to fields declared by `ReducerState`.
- No executable closures appear inside serialized event data.

The implementation may retain a pure `pass(st)` function for direct evaluation, but its logic must correspond exactly to the declarative `GateDef`.

### Fixtures, estimates, and pricing

The pricing source of truth is `src/engine/pricing.ts`:

```text
readUsd   = readTok  × 0.1  × modelBase / 1,000,000
inputUsd  = inputTok × 1    × modelBase / 1,000,000
writeUsd  = writeTok × tier × modelBase / 1,000,000
outputUsd = outTok   × 5    × modelBase / 1,000,000
```

Write tier is `1.25x` for 5m and `2x` for 1h. Model bases are Sonnet `$3/M`, Opus `$5/M`, and Fable `$10/M`. State stores unrounded values; only presentation rounds.

Implementation should add the canonical `priceRequest` wrapper and route all authoritative totals through it instead of duplicating the equation in request simulation.

Number discipline:

- A semantically matching `C` constant is measured or derived engine evidence.
- Gameplay calibration without such a constant is declared once in `ScenarioData.fixtures` as `[FICTION]`.
- Animation timings, dimensions, and provisional performance budgets use `[ESTIMATE]`.
- Numerical equality does not establish provenance.
- Every positive value receives enough display precision to avoid `$0.0000`.

### Gate, stars, and failure

Prediction is required for revelation but never affects score, stars, wallet, failure, or passage. Each gate requires one or more `action-observed` predicates after a declared evidence reveal and at least one behavioral requirement.

A failed economic route may freeze only when:

- The decisive request belongs to the actual attempt.
- Its complete row is already visible.
- `actualUsd > validAlternativeUsd`.
- The comparison is request-local and causally equivalent.
- The freeze happens before any downstream economic action.

Missing capability or a non-economic unsuccessful outcome uses `STOP_LOCAL_ATTEMPT`, not a fabricated request or `FREEZE_FAILURE`. Counterfactual/reference events are informational and may never mutate actual economics or failure state.

### `COMPLETE_ATTEMPT` lifecycle

Before completion, `attemptMetrics` is the live current-branch aggregate. It is updated in the same reducer transaction as the underlying ledger, unit, or normalization action:

- `spentUsd === budget - wallet`
- `requestCount` equals actual-attempt priced requests
- `completedUnitCount`, `completedDepth`, normalization counts, and authored passing subtotals remain current

`attemptResult` stays `null` until `COMPLETE_ATTEMPT`. Completion:

1. Evaluates the behavioral gate and stars against current reducer evidence.
2. Determines `passed`, `gate-failed`, or `local-failed`.
3. Copies every declared metric into an immutable snapshot.
4. Records local-failure identity when applicable.
5. Enters the result phase.
6. Unlocks, but does not automatically run, post-attempt comparisons.

Result UI reads the snapshot. Rewinds and restarted attempts must not mutate a completed result in place.

## 5. Implementation plan

### Current repository baseline

Commit `2341083` establishes the useful implementation direction for redesigned L1:

- Route and prediction choices are reducer actions in `src/game/step.ts`.
- Level identity, pass, and stars live in `src/game/levels.ts`.
- Rendering and input live in `src/components/L1PlayScreen.svelte`.
- Requests still use the real simulation and tape infrastructure.
- `src/App.svelte` selects the dedicated level experience.
- Engine, reducer, level, and DOM tests cover the route.

Keep that separation, but do not repeat its bespoke `l1Route`, `l1PredictionCommitted`, `CHOOSE_L1_ROUTE`, and component-local prediction pattern twelve more times. L1 is the reference for ownership boundaries, not the final reusable runtime.

The current code also contains known migration gaps:

- Legacy `LevelId` values are `L1`…`L13`, while the canonical IDs are descriptive slugs.
- `LevelDef` still centers on pre-play `LearnBeat`.
- L1/L2 discovery fields and actions are bespoke.
- Scenario IDs are mostly metadata rather than an executable scenario registry.
- Prefix resolution is aggregate-token based rather than ordered-block based.
- Current TTL code treats equality as live; the canonical rule treats equality as expired.
- `TapeRenderer` sizes rows from input-side tokens and does not yet render output as a proportional violet segment.
- `HiddenCosts` lacks `delegateUsd`, `fiveMinuteBandUsd`, and `mcpUsd`.
- Reducer actions are not yet recorded as the normal replay source.
- `LearnScreen` reveals solution comparisons before play for legacy levels.
- `ControlId[]` versus `ToolId[]` remains a type seam to repair.

### Substrate before campaign multiplication

1. Restore a green `check` and test gate.
2. Add canonical `priceRequest`, pricing goldens, and exact TTL-boundary tests.
3. Correct all liveness sites together to `clock.min < expiresAtMin`.
4. Upgrade tape geometry to authoritative USD, including output.
5. Introduce canonical reducer fields and save migration defaults.
6. Add runtime-owned `Action[]`, stable action indices, checkpoints, and replay-based rewind.
7. Implement the five canonical interaction-pattern modules.
8. Add executable scenario initialization from `scenarioData`.
9. Add ordered `PrefixBlock`/`PrefixStack` resolution using counts plus stable hashes.
10. Add a typed `defineLevel` facade that returns ordinary canonical `LevelDef`.
11. Add a generic `LevelHost` for phase sequencing while preserving bespoke central toys.
12. Remove pre-play use of `LearnScreen`; retain its deterministic runs only as post-attempt counterfactual adapters.

### Minimal recipe for adding a level

Each level should require only:

1. One module under `src/levels/<canonical-id>.ts` using `defineLevel`.
2. One scenario factory or registered scenario-data instance.
3. Declarative event, prediction, gate, star, checkpoint, failure, counterfactual, and QA data.
4. Pricing golden fixtures for every request class and final branch total.
5. One bespoke Svelte toy only when the central interaction cannot be expressed by shared components.
6. A thin registration entry in the campaign registry.
7. Reducer work only when the canonical `Action` union does not yet implement a required shared behavior.
8. Logic, replay, DOM, and browser fixtures derived from the same authored action sequences.

The rendering layer receives state and dispatches canonical actions. It does not calculate prices, infer completed events, append gate markers, or maintain its own economic branch.

### Recommended implementation order

Engineering order may differ from player order; the shipped campaign remains L1–L13.

| Order | Work | Reason |
|---:|---|---|
| 0 | Shared substrate | Remove systemic risk before duplicating levels. |
| 1 | L6 as an internal vertical slice | Exercises tier choice, exact TTL, prediction, priced requests, counterfactual, local freeze, replay rewind, explanation, transfer, completion, and result. |
| 2 | Port L1 to the shared runtime | Preserve commit `2341083` economics and UX while deleting bespoke phase/action state. |
| 3 | L2 | Validates two completable time/spend profiles and TTL visualization without punitive failure. |
| 4 | L3 | Establishes ordered prefix blocks, mismatch boundaries, shared namespaces, and handoff verification. |
| 5 | L4 | Adds executable fan-out waves, 5m shared prefixes, coordinator pricing, and batch visualization. |
| 6 | L5 | Reuses prefix identity for prompt normalization and validates route-specific attempt subtotals. |
| 7 | L7 | Adds finite marker inventory and atomically priced keep-warm requests. |
| 8 | L8 | Adds contextual routing, bounded shared pools, and history-growth comparisons. |
| 9 | L9 | Hardens output-inclusive tape geometry and post-attempt model-tier comparison. |
| 10 | L10 | Adds `completedDepth`, calibrated rework branches, and live-to-snapshot completion semantics. |
| 11 | L11 | Adds compound loadouts, capabilities, local failure, fingerprint counts, and reactive validation. |
| 12 | L12 | Combines prefix reorder, optional capability, canonical evidence paths, and projected-versus-actual distinction. |
| 13 | L13 | Adds audit matching, fleet hidden-cost buckets, two-marker remediation, and efficient-frontier evaluation. |

After the internal L6 proof, the first player-facing release slice is L1–L3: it demonstrates the complete “act, predict, reveal, explain, transfer” rhythm and establishes the visual language needed by the rest of the campaign.

### Universal acceptance checklist

Every level must pass all of the following:

- First meaningful control is available within two seconds under normal and reduced motion.
- Title, objective, and cold open do not reveal registered solution vocabulary.
- Each reveal is blocked until prediction commitment.
- Wrong predictions change no economics, failure, gate, or stars.
- At least one qualifying player action occurs after evidence and is observed by the gate.
- Every actual request maps one-to-one to one ledger row and one tape row.
- Every request price equals `priceRequest`; all positive prices display nonzero.
- Tape row width and every segment are proportional to USD, including output.
- Every failure proves `actualUsd > validAlternativeUsd` before freezing.
- Counterfactuals never mutate wallet, ledger, cache, attempt result, or failure state.
- Rewind reproduces state by deterministic action replay.
- Pointer, keyboard, and touch paths dispatch equivalent actions.
- Every Canvas view has a DOM summary from the same source rows.
- Reduced motion produces identical final evidence and gate outcome.
- Reference and anti-pattern action sequences are fixed-seed golden fixtures.
- `COMPLETE_ATTEMPT` snapshots all live metrics exactly once.
- All gameplay fiction has a named semantic fixture; estimates are presentation-only.
- The level is winnable using only documented controls.

### Level-specific acceptance checklist

| Level | Required proof |
|---|---|
| L1 | Exactly three rows. Same-chat total `$0.2347878` at `12m`; isolated total `$0.4327944` at `4m`. Both pass and can earn three stars. No freeze. |
| L2 | Coffee produces `$0.2188494` at minute `110`; Standup produces `$0.4168560` at minute `90`. Both clear the blocker and pass. |
| L3 | FOLLOW-UP totals `$2.3500653` at minute `58`; BOOT PATCH totals `$2.4734988` at minute `50`. R4 reads all `34,738` tokens on both branches. |
| L4 | Width table reproduces all eight totals; width `4` is `$7.37800410`. Width `1` freezes only after Job 2’s `$0.77638875` row is visible beside `$0.68587110`. |
| L5 | Front and tail each emit eight rows. Totals are `$0.50660670` at `1m` and `$0.15348645` at `4m`. Both pass after the ticket-first triage transfer. |
| L6 | Monday 5m and Tuesday 1h produce `$0.30303735`. Tuesday 5m freezes at block 2 and rewinds without replaying Monday. |
| L7 | Exactly three marker-backed ping requests occur on the reference path. Total is `$0.5006598`; “always” cannot create more effects than marker capacity. |
| L8 | Dependent and tiny tickets demonstrate main-route benefits before the large batch flips to subagents. Reference is `$0.53600205`; all-inline is `$1.1736`. |
| L9 | Three actual Sonnet rows total `$0.7335`; Codegen’s output occupies `97.35%` of its cost weight. Model controls remain post-attempt comparison only. |
| L10 | Row counts and totals are Quick `8/$4.8246`, Working `5/$2.8752`, Exhaustive `4/$3.2754`. Quick freezes on the fourth repair, not bankruptcy. |
| L11 | Missing capabilities create no request. Smallest sufficient totals `$2.241072`; all-loaded totals `$2.731284`. Repeated bloat alone may freeze. |
| L12 | Valid dynamic route totals `$0.18996`; disabled route locally fails at `$0.18954`; harmful actual ledger stops after two rows at `$0.29172`. Projection rows never enter the ledger. |
| L13 | Nine ingest rows total `$6.69987735`; wallet remains `$83.30012265`; hidden loss is separately `$692`. All four frontier pairs pass; both dominated pairs complete as gate failures without `FREEZE_FAILURE`. |

## 6. Infrastructure and production polish

### Preserve the stack

Keep Svelte 5, strict TypeScript, Vite, Canvas2D, the deterministic engine, and the one-file offline build. Do not introduce a general game engine, universal Canvas scene graph, backend, router, state framework, telemetry, or cloud dependency.

DOM owns text, controls, cards, dialogs, focus, accessibility, and result summaries. Canvas owns dense animated evidence such as request tapes and bounded effects.

### Single-file offline contract

The release artifact is one self-contained `dist/index.html` with no runtime network requests.

Mandatory controls:

- Use plain ESM imports for bundled assets.
- Do not use `new URL(..., import.meta.url)` for runtime asset-manifest entries.
- Prove with a real fixture that assets become `data:` URLs and no sibling runtime file is emitted.
- Scan HTML, CSS URLs, inline modules, and observed runtime requests for relative or external dependencies.
- Track raw HTML and encoded asset sizes on every build.
- Keep the system font stack until an embedded font has a measured benefit.
- Validate hosted and direct-file launch in Chromium, Firefox, and Safari desktop; validate hosted mobile behavior in iOS Safari and Android Chrome.
- Do not advertise mobile direct-file support until real-device testing passes.

Initial size warnings may use the infrastructure review’s estimates—`4 MB` warning and `6 MB` hard review—but replace them with measured budgets after the representative vertical slice.

### Determinism and economics

- Economic state uses simulation time only; player thinking time never expires a cache.
- Presentation timing, sound, and particles never consume economic RNG or mutate reducer state.
- Consolidate RNG and fork labeled cosmetic streams.
- Correct TTL equality everywhere in one commit and re-lock all fixed-seed goldens.
- Use one canonical price function.
- Cache and prefix resolution use stable hashes and token counts rather than allocating individual token objects.
- Rewind replays actions before the checkpoint.
- Save/export stores version, seed, mode, and actions; migrations preserve campaign progress and discard only incompatible attempt data.

### Tape and price guardrail

The tape is a visualization of priced `LedgerRow`s, not a token-volume chart:

```text
row width ∝ row.usd
segment width ∝ bucketUsd / row.usd
```

Read, input, write, and output all contribute. Output is visible as geometry from the first request even when its vocabulary label is delayed until L9. Canvas may explain equations but never calculate authoritative totals.

Final bars must exist without hover. Hover, keyboard focus, and tap selection expose identical time, bucket, TTL, and price equations. Touch selection persists until another row, outside tap, or explicit close.

### Presentation runtime

Add one cancellable presentation timeline with:

- sequence, parallel, stagger, named easing, and a manual test clock;
- stable cue IDs keyed by action index and event ID;
- identical final evidence under reduced motion;
- exactly-once sound and effect dispatch;
- separation between teaching motion and decorative motion.

Add audio and bounded effects only after the functional vertical slice is green. Use a small Web Audio bus with first-gesture unlock, persistent mute, reduced-audio mode, and no sound-only evidence. Canvas effects remain pooled, capped, deterministic, and anchored to domain objects.

### Accessibility and input

- Every drag has move-left/move-right or equivalent keyboard controls.
- Every status uses label or pattern in addition to color.
- Every Canvas visualization has a semantic DOM table or summary.
- Toasts use `aria-live="polite"`; decisive failure alone may use `"assertive"`.
- Dialogs implement initial focus, trap, Escape, and restoration.
- Touch targets meet platform minimums.
- Reduced motion, high contrast, mute, and reduced audio are independent.
- Add automated axe checks plus manual keyboard, screen-reader, and real-device touch smoke tests.

### Test pyramid

- Node Vitest: pricing, prefix resolution, scenario initialization, reducer, predicates, pass/stars, replay, save migration, and goldens.
- jsdom Vitest: Svelte semantics, focus-independent state, controls, live regions, and result content.
- Playwright Chromium/WebKit: actual Canvas final frames, screenshot goldens, reduced motion, keyboard flow, mobile viewport, tap-to-inspect, campaign smoke, and offline artifact behavior.
- Manual device matrix: Safari data-audio decoding, file launch paths, mobile persistence, and touch ergonomics.

CI must reject type errors, unknown IDs, illegal predicate operators, duplicate events, reveal-before-commit paths, untagged authored numbers, external artifact references, and pricing-golden drift.

## 7. UX north star

### Interaction rhythm

The canonical level rhythm is:

```text
instant agency
→ player hypothesis
→ commitment
→ deterministic consequence
→ causal evidence
→ concise rule
→ changed-context transfer
→ result
→ optional counterfactual
```

Not every level needs a punitive failure, but every level needs an owned decision or prediction and a post-evidence demonstration.

### Visual grammar

- Blue means priced cache read.
- Red means fresh input or write, differentiated by label/pattern where needed.
- Violet means priced output.
- A stable matched prefix receives a blue wash.
- The first mismatch is one sharp boundary.
- Invalidated suffix propagation travels red from that boundary.
- TTL drains linearly with committed simulated time.
- A write feels weighty; a read feels quick; a freeze stops at the exact cause.
- Wallet deductions point back to their responsible row.
- L13 continuously zooms from request to developer to fleet instead of swapping to a disconnected dashboard.

Motion exists only to answer: what did I do, what changed, where did the cost come from, which boundary mattered, and what should I inspect next?

### Voice

Use dry-witty, brief, second-person, concrete, and nonjudgmental copy:

- Before action: situation, constraint, invitation.
- At reveal: concrete event, mechanism, visible consequence.
- At result: what the player proved and one transferable rule.

Internal IDs and citations never appear in player copy. Fictional pipeline effects are described as scenario behavior, not universal measurements.

### Sensory progression

Accrete semantic motifs rather than raw intensity:

- L1: send, read, write, wallet.
- L2: clock and expiry.
- L3: block placement and mismatch.
- L4: subagent-wave rhythm.
- L5: partial read-then-write cue.
- L6–L7: tier and keep-warm cadence.
- L8: distinct main/subagent spatial timbres.
- L9: output’s violet tail.
- L10: request-driven pipeline.
- L11–L12: tactile prefix manipulation.
- L13: a restrained orchestration of previously learned motifs, with remediated loss motifs removed.

Use silence after failure and alignment after success. Avoid casino wallet feedback, alarms, full-screen flashes, mascot chatter, and animation that delays replay.

## 8. Risks, sequencing, and validation

| Risk | Consequence | Required mitigation and exit criterion |
|---|---|---|
| Bespoke level state machines | Thirteen inconsistent implementations | Shared runtime and pattern modules are green before broad level work; L1 bespoke fields are removed during its port. |
| TTL equality drift | Incorrect expiry, costs, and failure frames | All liveness sites use `< expiresAtMin`; exact 5m and 60m equality goldens pass. |
| Duplicate pricing formulas | Dollar drift between engine, tape, and copy | Every request total uses canonical `priceRequest`; Canvas only consumes rows. |
| Prefix-model migration | Existing calibrated results change silently | Preserve aggregate scenarios through adapters; add block-resolution goldens before migrating level fixtures. |
| Replay/checkpoint incompleteness | Rewind claims become nondeterministic | Runtime records all actions; replay equality is asserted after every authored checkpoint. |
| Output omitted from tape weight | L9 and output-heavy levels teach false scale | USD-proportional tape geometry passes pixel and numeric assertions before L9 production. |
| Counterfactual mutation | Informational comparisons corrupt attempts | Counterfactual tests assert byte-identical wallet, ledger, cache, failure, and result before/after reveal. |
| Over-engineered schema | Slow authoring and brittle abstractions | Implement canonical fields only as exercised; expose a thin `defineLevel` facade, not a parser or editor. |
| Scenario metadata remains inert | Specs cannot actually run | Each registered scenario must initialize its authored units, contexts, stacks, gaps, workloads, and fixtures in a fixed-seed test. |
| Local versus punitive failure confusion | Fabricated economic punishment | Missing capability uses `STOP_LOCAL_ATTEMPT`; freezes require a real overpriced request and local quote. |
| Save incompatibility | Existing progress breaks | Versioned migration, export, confirmed reset, and owned-key-only clearing are complete before public release. |
| Offline asset leakage | “Single-file” build fetches files at runtime | Artifact scan and browser network assertions are mandatory release gates. |
| Hover-only evidence | Mobile players miss price calculations | Persistent tap inspection and mobile browser tests ship with the tape upgrade. |
| Effects destabilize teaching | Motion or audio obscures causality | Functional vertical slice passes silently first; effects consume stable cues afterward. |
| L13 becomes a spreadsheet | Capstone loses emotional payoff | Continuous request-to-fleet zoom, inspectable source rows, finite remedies, and frontier visualization are required. |

### Delivery milestones

1. **Economic substrate:** green typecheck, canonical pricing, TTL correction, output-inclusive tape, goldens.
2. **Runtime substrate:** actions, phases, predicates, checkpoints, replay, failure, transfer, completion snapshots, save migration.
3. **Internal vertical slice:** L6 passes logic, DOM, browser, touch, reduced-motion, and offline-artifact gates.
4. **First playable campaign slice:** shared-runtime L1–L3 with production-quality final frames and no pre-play Learn screen.
5. **Execution curriculum:** L4–L10, stopping for goldens and browser acceptance at each level.
6. **System curriculum:** L11–L12 with loadout and prefix-order accessibility.
7. **Capstone:** L13 only after all prerequisite scenario outputs and hidden-cost buckets are locked.
8. **Polish pass:** sound, bounded effects, result celebrations, campaign continuity, and fleet zoom.
9. **Release gate:** full campaign replay, browser/file matrix, artifact scan, performance profile, save/export/reset, and manual accessibility smoke.

A level is complete only when its fixed-seed reference path, every valid alternate profile, every reachable unsuccessful branch, and its counterfactual all reproduce the locked spec values. Visual approval without economic replay evidence is insufficient; economic correctness without tactile, accessible real-browser evidence is also insufficient.

