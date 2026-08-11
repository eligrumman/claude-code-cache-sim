# The Gauntlet Prompt — filled in for this project, run via /outsourcerer

This is your pasted template with the placeholders resolved for the cache-sim level-spec work, plus the
concrete `/outsourcerer` execution recipe underneath.

---

## A. The filled gauntlet prompt (the reusable text)

> I want you to build **a level-design spec pack — one deep technical-implementation markdown file per
> game screen — for the Claude Code cache simulator** at the level of **ncase.me/trust and neal.fun**.
> It should be utterly perfect, **clean, tactile, discovery-first (learn by playing, never by being told)**,
> with every single thing done at **S-tier / ship quality**, from **the core interactive mechanic and its
> state machine** to **the pricing-engine wiring, the tape rendering, the copy, the fail-states, the
> prediction beats, and the QA gates** to anything you could think of.
>
> Fan out sub-agents and have sub-agents tackle **each screen** individually so that the **spec pack** is
> utterly perfect. You should **iterate** on each screen and have a separate sub-agent check it
> **blind, side-by-side against ncase/trust and neal.fun** to ensure it is **S-tier**. That separate
> sub-agent should be a really harsh critic, and if it isn't **S-tier**, it should keep going.
>
> Don't stop until each sub-agent is utterly wowed with the quality when compared with **ncase/trust and
> neal.fun**. It should literally compare them side by side blind and say which one looks better. Do this in
> **Svelte 5 + TypeScript + Canvas2D (against the existing engine/constants)** — **but at the PLANNING level
> only, markdown only, one .md file per screen.** Iterate until it's utterly perfect. Fan out sub-agents,
> one per screen, and don't converge until the harsh critic is wowed.

## B. How that maps onto /outsourcerer (the execution recipe)

The gauntlet becomes an **evaluator–optimizer loop over the WHOLE pack** (not per screen — that's overkill),
run on two different engines so the critic is genuinely independent of the builder:

- **Builder = GPT-5.6 `sol`** (codex-native lane) — drafts and revises the screen spec `.md` files.
- **Harsh critic = `fable`** (claude-native lane) — reads the whole pack in one pass, blind-scores every
  screen against the reference bar on a fixed rubric, and returns per-screen must-fixes + an overall
  PASS/REVISE verdict.
- **Loop over the pack (bounded):** `sol drafts all screens (fanned out) → fable critics the whole pack →
  (if REVISE) sol revises only the flagged screens → fable re-critics the whole pack`. Ends when fable
  says the pack is S-tier or the round cap is hit.
- **Fan-out is only the DRAFT/REVISE step** — screens draft in parallel; the critic is a single whole-pack
  judgment so the bar is applied consistently across screens.

**DRY architecture:** a single super-detailed `OBJECT_MODEL.md` defines every reusable object once; the thin
per-level specs only reference those objects and say exactly what happens in that level. Build the object
model first — every level spec depends on it.

Concretely (the sorcerer drives these; you never type a flag):
```
# Phase 0 — sol builds the shared OBJECT_MODEL.md (primitives, engine, UI components, patterns, LevelDef)
outsourcerer bg edit -m sol      "build docs/screens/OBJECT_MODEL.md per _BRIEF.md"
#          — fable harsh-critics the object model; sol revises until S-tier (it is the foundation)

# Phase 1 — builders draft all 13 thin level specs in parallel, each REFERENCING OBJECT_MODEL.md
outsourcerer fanout edit -m sol  --preamble "<shared: read _BRIEF.md + OBJECT_MODEL.md, reference don't repeat>" --tasks screens.tasks

# Phase 2 — ONE harsh critic pass over the WHOLE pack (fable, read-only)
outsourcerer bg explore -m fable "read OBJECT_MODEL.md + every NN-*.md + rubric; score each, overall verdict"

# Phase 3 — revise only the screens fable flagged REVISE (sol), then re-run Phase 2. Bounded, whole-pack loop.
outsourcerer fanout edit -m sol  --tasks flagged.tasks
```

- Cost: **$0 cash**; sol spends the ChatGPT plan limits, fable spends the Claude plan limits.
- Cloud consent already granted; a secret-scan runs on every delegation.
- Everything stays **markdown-only** — no application code is written by any agent.

The critic rubric (below) is the objective "is it S-tier?" gate that stops the loop.
