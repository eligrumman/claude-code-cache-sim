# Shared brief for the screen-spec gauntlet (builder = sol, critic = fable)

We are producing a **spec pack** for an educational browser game, **claude-code-cache-sim**, which teaches
Claude Code's prompt-cache economics by making the player spend a fake budget.

**PLANNING ONLY. Markdown only. Never write or change application code.**

## The architecture (READ THIS — it governs everything)
The pack is **DRY**. There are two kinds of file:

1. **`OBJECT_MODEL.md`** — ONE super-detailed document that defines every reusable object exactly once:
   the primitives, the engine, the UI components, the interaction patterns, and the `LevelDef` schema.
   This is the shared vocabulary. It is verbose and precise on purpose.

2. **`NN-<slug>.md`** — ONE thin spec per game screen. A level spec **MUST NOT re-explain** what a token,
   cache, TTL, tape segment, prefix block, wallet, toast, or reducer is — those live in `OBJECT_MODEL.md`.
   A level spec only says, by **referencing objects by their exact name from `OBJECT_MODEL.md`**:
   - which objects/components/patterns this screen instantiates,
   - the exact ordered sequence of what happens (each event → which reducer action → which objects change →
     the concrete numbers),
   - the values unique to this level (copy, seed, budget, token counts, thresholds, gate).

   If you find yourself defining a shared concept in a level spec, STOP — add/extend it in `OBJECT_MODEL.md`
   and reference it instead.

## The quality bar (the REFERENCE)
- **ncase.me/trust** — gold standard for teaching a system through progressively-revealed interactive
  mechanics where the player DISCOVERS the lesson by playing, never by being told; each level adds one idea
  and protects its surprise.
- **neal.fun** — instant tactile hook, one perfect mechanic per toy, delight and personality.

A spec is S-tier only if a developer building from it would produce a screen that stands **blind,
side-by-side** against a trust/neal.fun level and win on *learning-by-discovery* and *polish*.

## Ground truth (in the repo)
- `GAME_PLAN_V2.md` — the redesigned 13-level curriculum; honor each screen's concept / prerequisite /
  mechanic / aha / fail-lesson.
- `src/engine/constants.ts`, `src/engine/pricing.ts` — every number MUST trace to a real constant (cite the
  C-number) or be tagged `[ESTIMATE]`/`[FICTION]`. Multipliers: input 1x, cache-read 0.1x, 5m-write 1.25x,
  1h-write 2x, output 5x. Model base $/M: sonnet 3, opus 5, fable 10. Main cache TTL 60m; subagent TTL 5m.
- `src/game/step.ts` (reducer), `src/game/levels.ts` (`LevelDef`), `src/render/tape.ts` (`TapeRenderer`),
  `src/components/*.svelte` — everything must be implementable against THESE in Svelte 5 + TS + Canvas2D.

## Hard design rules (non-negotiable)
1. **Never reveal the answer before play** — no "without/with" pre-play A/B; confirm only AFTER the attempt.
2. **Protect the surprise** — aha never in title, objective, or pre-play diagram.
3. **Predict-before-reveal** — player commits a prediction before each reveal.
4. **One new concept + ideally one new control** per screen.
5. **Fail local, causal, rewindable** — freeze at the decisive event, name the cause, allow fast rewind.
6. **Gate on demonstrated understanding, not budget alone.**
7. **Just-in-time vocabulary** — introduce a term only when it's first needed.

## What `OBJECT_MODEL.md` must define (the builder of that file owns all of this)
- **Primitives:** Token, Request, CacheEntry (tier + TTL + lastTouch), PrefixBlock set
  (`system│tools│instructions│skills│memory│mcp│history│current`), WireSegment, Wallet/Budget, Clock,
  Session vs Subagent context.
- **Engine:** the pricing function, the four rate tiers, the constants registry (each C-number with meaning),
  the reducer `State` shape and the full `Action` union (existing + any newly-proposed actions, each with a
  precise contract).
- **UI components:** `TapeRenderer`, TTL drain bar, MAIN CACHE panel, hover price calculator, toast system,
  prediction-prompt widget, result screen, rewind control, the prefix-stack visualizer.
- **Interaction patterns (named, reusable):** predict-before-reveal, fail-freeze-rewind, just-in-time toast,
  counterfactual-after-attempt, blind-A/B reveal.
- **`LevelDef` schema:** every field, its type, and its meaning, so level specs fill in values, not prose.

## Required sections of each THIN level spec `NN-<slug>.md`
1. **Identity** — id, title, tier, the ONE concept, the prerequisite concept.
2. **Objects used** — bullet list of `OBJECT_MODEL.md` object names this screen instantiates (no re-defining).
3. **Cold-open / narrative** — the opening beat + level-specific copy, second-by-second for first interaction.
4. **Exact event sequence** — ordered steps; each step = event → reducer Action → objects mutated → numbers.
5. **Level data** — the `LevelDef` instance values (seed, budgetUsd, cfgOverride, scenario, gate, star2/3,
   referenceCfg, antiCfg).
6. **Pricing walkthrough** — the specific requests on the wire, token counts, tiers, computed $ (cite
   C-numbers); the 3-star reference total and the anti-pattern total.
7. **Tape sequence** — the exact ordered segments this level renders (via `TapeRenderer`) and the aha frame.
8. **Prediction prompt(s)** — the exact question + options before each reveal.
9. **Fail-state** — the decisive event to freeze on, the one-line causal message, rewind behavior.
10. **Gate & stars** — the behavioral pass predicate + star2/star3 thresholds.
11. **Toasts** — the level-specific just-in-time captions and their fire triggers.
12. **QA gate** — real-browser click-through assertions + invariants (segments = priced requests, every
    cost > 0, never "$0.0000", winnable).
13. **Reference-bar justification** — why this screen matches the trust/neal.fun discovery rhythm.

Write densely; prefer exact object names, numbers, and reducer action names over prose. Reference, don't repeat.
