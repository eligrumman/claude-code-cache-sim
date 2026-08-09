# GAME_PLAN_V2 — Redesigning the Cache Sim to the neal.fun / ncase-trust bar

**Status:** Design proposal (no code changed). Synthesizes two independent expert reviews:
- **GPT-5.6 (sol)** — pedagogy + game-design review of the 13-level curriculum (read the full repo).
- **agent-browser** — live UX/visual playthrough of L1 + L2 against neal.fun / ncase.me/trust.

Both reviews converge on the same conclusions. This document is the merged, actionable plan.

---

## 0. The one-paragraph verdict

The **engine and teaching primitives are genuinely excellent** — arguably deeper than *The Evolution of
Trust*. The deterministic pricing core, the "requests on the wire" tape (blue read vs orange write with
per-bar $), the live TTL drain bar, the hover price calculator, and L1's sequenced toasts are a
world-class foundation. **The problem is not the engine — it's the pedagogy layer and the delight layer.**
Twelve of thirteen levels **show the answer before you play** (the `LearnScreen` runs the bad config next
to the good one, labels which is correct, shows the dollar delta, *then* lets you "play" by reproducing
it). That is a tutorial, not discovery — the exact opposite of what makes trust/neal work. Fixing this is
mostly *subtraction and re-sequencing*, not new content.

**Distance from the bar (browser-measured):** L1 is ~70% there on *substance*, ~40% on *delight*. L2+ are
functionally playable but visibly pre-polish (jargon leaks, empty placeholder bars, dropped toasts).

---

## 1. What's already great (protect these)

| Asset | Why it matters | Keep as-is |
|---|---|---|
| Deterministic, measured pricing engine | Every $ traces to a real constant; credibility neal.fun can't match | ✅ core |
| "Requests on the wire" canvas tape | Best dataviz in the app; the red→blue contrast IS the core insight | ✅ visual grammar |
| Live TTL drain bar (`warm — expires 11:02`) | Makes an invisible clock visible and tense | ✅ |
| Hover price calculator | "Learn by inspecting" depth that rewards curiosity | ✅ extend to all levels |
| L1's sequenced in-play toasts | The red-write-then-blue-read "aha" genuinely lands | ✅ **port forward to every level** |
| L1's task/coffee/standup timing decision | The one real discovery mechanic in the game today | ✅ template for others |

---

## 2. The five structural problems (both reviews agree)

1. **Answer-key-before-play.** `LearnScreen` reveals `withoutCfg` / `withCfg` / the winning $ delta before
   play on L2–L13. Levels become "copy the config you were just shown." **This is the #1 fix.**
2. **Wrong teaching order.** L2/L3 detour into model-selection & (fictional) rework economics *before* the
   cache mental model is complete. The distinctive, *measured* subject gets interrupted by the *fictional*
   one too early.
3. **A foundational concept is never taught: the prefix stack.** `system │ tools │ instructions │ history │
   current request`. L4/L5/L9/L10/L11 all silently depend on "which blocks are stable, which grow, where a
   change breaks reuse" — but it only ever exists as prose. Players learn *rules*, not a *model*.
4. **"One new control per level" is not actually true.** L7 exposes 3 controls, L10 exposes 3, L2 exposes 2.
   Learners face simultaneous choices where they should face one.
5. **Gates check budget, not understanding.** Most L2–L13 predicates only check `spent <= budget`. The L13
   audit capstone never checks whether you *ranked the cost levers correctly* — the whole point of an audit.

Plus a live bug and a delight gap from the browser pass:
- **Render bug:** tape rows draw as **blank dark bars until you hover them** (redraw-on-interaction timing
  gap). A user glancing at the static frame thinks two requests cost nothing. Fix: draw final state
  immediately, not only on hover.
- **Delight gap:** monochrome-dark + two accents, no motion/personality/sound; the **result screen for a
  3-star pass looks like an error dialog** (three lines + two buttons, no celebration, no summary chart).
- **L1 lets you win without feeling the trap.** You can pass having taken the standup *last*, so you never
  experience the TTL death + 2x rewrite the level exists to teach.

---

## 3. The design rhythm every level must follow

> **unresolved situation → player predicts → player acts → system visibly changes → player explains the
> change → one concise rule is named → novel transfer challenge**

Current generic rhythm (to be deleted):

> rule is named → correct answer demonstrated → player selects that answer → budget confirms it

**The single highest-leverage principle: protect the surprise.** Never put the aha in a title, an
objective, or a pre-play diagram. "One Word Costs 14.6k" gives away L5 in its own name.

---

## 4. The redesigned 13-level curriculum

Re-ordered so the **entire cache model is built before** branching into model economics, then payload, then
policy. Each level: **one concept · one prerequisite · one mechanic · one aha · one fail-lesson.**

### Tier 1 — See the cache (complete mental model before anything else)

| # | Level | Teaches (one concept) | Builds on | Core mechanic / decision | Aha | Fail-state lesson |
|---|---|---|---|---|---|---|
| 1 | **Red or Blue?** | Reuse turns an expensive first write into a cheap read | — (token defined in context) | $0.30, three tiny requests, click **Send**. 1st = big red, 2nd = tiny blue. **Predict the 3rd's color before sending.** | "The expensive part was saved *context*, not the new sentence" | Discard the session → next request goes red, wallet drops |
| 2 | **Beat the Clock** | A cache expires after idle time; the next request rewrites it | write vs read | L1's task/coffee/standup, but **start in play, no pre-reveal**. Offer 20-min and 90-min interruptions, don't say which is safe | TTL hits zero during standup → identical request turns red | "Same request, different timing: expiry turned a read into a write" |
| 3 | **Build the Prefix** ⭐NEW | The cache reuses an *unchanged prefix*, not a vague "conversation" | write/read/expiry | Assemble a request from visible blocks: `system│tools│instructions│history│current`. Send twice, then change one block; highlight the reuse boundary | A tiny *early* change invalidates everything after it; a late change preserves most | Show exactly which blocks were reread / rewritten / fresh |
| 4 | **The Five-Minute Race** | Short-lived shared subagent caches force work inside a 5-min window | TTL + prefix reuse | Eight jobs; group into serial waves with a width control while a 5-min clock runs. **Don't disclose the 3-wave threshold** | Wider fan-out is *cheaper* because later jobs arrive before the shared cache dies | Freeze on first late wave: "Job 4 arrived at 6:00; shared prefix expired at 5:00" |
| 5 | **One Word** | Byte-identical prompts reuse; early variation forces rewrites | prefix identity + subagent reuse | Eight prompts differing only near the front. Player normalizes them (shared template + late task pointer) | Moving variation to the *tail* turns repeated red into blue | Diff marks the first mismatching token + the 14,623-tok suffix it invalidated |
| 6 | **Buy More Time?** | The 1-hour cache writes cost more; worth it only for the right gap pattern | TTL behavior + write/read cost | Two workdays with hidden gap schedules. Buy a 5-min or 1-hour write before each block. Round 1 = tight gaps, round 2 = 30-min gaps | The long cache *loses* on clustered work, *wins* when it prevents enough rebuilds | Counterfactual overlay: write premium vs rebuilds avoided (reveal the ~0.65 ratio only *after* discovery) |

### Tier 2 — Shape the workload

| # | Level | Teaches | Builds on | Mechanic / decision | Aha | Fail-lesson |
|---|---|---|---|---|---|---|
| 7 | **Keep It Alive** | A keep-warm ping pays off only below the rebuild cost | TTL tier tradeoff | Day planner with coffee/lunch/meeting/commute/overnight gaps. Place limited pings, then set a policy | Ping lunch, abandon overnight — "always" and "never" both lose | Timeline itemizes ping cost vs avoided rewrite per gap |
| 8 | **Growing Pains** | Inline re-reads growing history; subagents pay a separate bounded cold base | prefix structure + subagent cache | Route tasks inline or to fresh subagents; main context stack visibly grows; task sizes vary so neither route always wins | Small follow-ups belong inline; parallel independent jobs are cheaper isolated | Marginal cost: "This task reread 92k history to use 6k relevant input" |
| 9 | **Model the Work** | Total model cost depends on workload mix; output-heavy amplifies price | cost decomposition | Pick models for search-heavy / codegen-heavy / short-review jobs. **Estimate the dominant token bucket first** | Same model choice, very different result by output volume | Highlight the bucket that dominated the miss (no universal "Sonnet always wins") |
| 10 | **Plan Once, Pay Later** | Weak/cheap planning creates expensive downstream rework | model/workload cost + pipeline causality | Choose plan depth without seeing future failures; run pipeline; review/CI branches emerge; allow a second attempt on evidence | Optimizing the smallest visible line item inflates the whole bill | Trace every extra review/CI unit to the plan choice (label clearly as calibrated fiction) |

### Tier 3 — Control the prefix and the organization

| # | Level | Teaches | Builds on | Mechanic / decision | Aha | Fail-lesson |
|---|---|---|---|---|---|---|
| 11 | **Pack the Context** (merge old L10+L11) | Every always-loaded token multiplies across cold bases; keep the *smallest sufficient* set | prefix size + cold bases + workload needs | Tickets have explicit capability requirements. Pack skills/memory/MCP into a visible prefix with a size meter. Missing capability → task fails; excess → every cold write grows | Optimum is not "turn everything off" — it's the smallest loadout that completes the work | Split loss into *missing-capability* cost vs *prefix-bloat* cost |
| 12 | **Stable at the Front** (old L9, promoted) | Volatile content *early* in the prefix poisons reuse; position beats size | prefix boundary + payload | Reorderable SessionStart blocks; a timestamp/status hook changes each session. Make it static, move it past the boundary, or drop it at a functional cost | A 20-token timestamp invalidates 24,300 later tokens — *location* matters more than size | Animate the mismatch propagating through the suffix across seven starts |
| 13 | **The Fleet Audit** (capstone) | At scale: diagnose heterogeneous leaks; spend remediation on the biggest recoverable $ | every prior lesson | Five devs, distinct timelines/reports. **Rank the causes first**, then choose targeted vs fleet-wide fixes, then simulate next month | The visually largest token count is *not* the biggest dollar lever | Show $ left on the table by ranking error + collateral cost of over-broad policy |

**Minimum-viable reorder** (if renaming/re-theming is too costly right now, keep names, just re-sequence):
`L1 → new prefix-foundation → L5 → L6 → L8 → L7 → L4 → L2 → L3 → merge L10/L11 → L9 → L12 → L13`

**Why this is stronger:** the first six levels form one uninterrupted chain (read/write → TTL → prefix →
short TTL → identity → tier choice); every later optimization points back to a primitive already seen; model
economics stops interrupting cache onboarding; the redundant "trim payload" pair (old L10/L11) becomes one
constrained loadout puzzle; hook-poisoning becomes an *application* of prefix order, not an orphan hygiene
rule; and the audit becomes a real final assessment instead of another pre-solved replay.

---

## 5. The redesigned L1 cold-open (first 60 seconds)

neal.fun/trust put a playable object under your cursor in ~1 second. Today L1 makes you click **Next**
through four cards (token def → four billing categories → TTL → a goal card that *states the solution*:
"Standup is 90 minutes. The cache lives 60. You do the math."). Replace with just-in-time teaching:

- **0–10s** — A compact task card: *"Bob needs to fix login. Wallet **$0.30**. [Ask Claude]"*. No map
  tutorial, no definitions, no four-category table. Click → a **red** request streaks the wire, wallet
  drops. Caption at the moment it matters: *"First request: Claude saved 22,527 tokens of context. **WRITE ·
  $0.14**."*
- **10–25s** — *"Add the matching logout route. [Ask Claude again]"* → a **blue** segment, wallet barely
  moves. *"Same context, reused. **READ · $0.007**."* Then ask **"Why was that one cheaper?"** with two
  playful predictions ("The task was easier." / "Claude reused saved context.") — locks in the causal model.
- **25–40s** — *Now* introduce the live TTL bar: *"Saved context expires after 60 idle minutes."* Offer Next
  task (30m) / Coffee (20m) / Standup (90m). **Don't say where standup goes.**
- **40–60s** — First real scheduling decision. If they take standup, let them **fail fast and vividly**: TTL
  drains to zero, cache cracks/fades, next request goes red, wallet dips below target, one line: *"The code
  did not change. The timing did."* Then **instant rewind** to just before standup (seconds, not a replayed
  intro).

**Defer vocabulary:** L1 needs only *write*, *read*, TTL. Fresh *input* enters with the prefix stack (L3);
*output* pricing enters with the model level (L9); the *5-minute* tier enters with subagents (L4). Also drop
the "about three-quarters of a word" precision trap — "tokens are small chunks of text you're billed for"
is enough.

---

## 6. Top 10 prioritized changes (learning-impact per effort)

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | **Remove the answer-key Learn screen** from L2–L13; reuse the A/B pair as a *post-attempt* counterfactual or a prediction-gated unlock | Transformational | Moderate |
| 2 | **Rewrite objectives to state the problem, not the solution** (e.g. L5 → "Seven identical mornings cost seven different prices. Find why."). Protect ahas in titles too | Very high | Low |
| 3 | **Add the manipulable prefix-stack level** (new L3) — becomes the visual grammar for L4/L5/L9/L10/L11 | Very high | Moderate |
| 4 | **Replace generic config strips with one bespoke mechanic per level** (schedule gaps, route cards, normalize prompts, pack capabilities, reorder blocks, rank audit buckets) | Very high | High (essential) |
| 5 | **Make failure local, causal, rewindable** — pause at the decisive event, let the player rewind one choice | High | Moderate |
| 6 | **Reorder curriculum** so cache fundamentals complete before model-quality economics | High | Low design / mod data |
| 7 | **Merge skills+memory+MCP into one "smallest sufficient loadout" puzzle** with visible ticket requirements | High | Moderate |
| 8 | **Add a prediction prompt before every reveal** (Red or blue? Which route? Will it survive? Which bucket?) — makes deterministic demos cognitively active | High | Low |
| 9 | **Gate on demonstrated understanding, not budget alone** (classifications, max cold writes, required tools retained, correct audit ranking) | High | Moderate |
| 10 | **Compress L1's four-card preamble into just-in-time play** (see §5) | High | Moderate |

### Delight / polish track (from the browser pass — parallel to the above)
- **P1. Fix the transient empty-tape render** (bars blank until hovered) — it undermines trust in the core
  visual. Draw final state immediately.
- **P2. Celebrate the result screen** — cost-breakdown chart + reward motion; a 3-star pass currently looks
  like an error dialog.
- **P3. Give the landing a live hook** — an auto-playing "$0.14 → $0.007" teaser tape above the level grid.
- **P4. De-jargon L2+** — friendly pipeline labels, hide internal IDs (`C28`, `WORK_OUT`, `C1,C5`), fill or
  remove empty placeholder bars, **port L1's toasts + MAIN CACHE panel forward to every level.**
- **P5. Add warmth** — one personality/color/motion element (and optional sound) to close the delight gap.

---

## 7. Suggested execution order (one level at a time, to L1's bar)

1. **Ship the pedagogy substrate first** (changes #1, #2, #8, #10 + P1) — these are mostly subtraction and
   apply everywhere. Big quality jump for low effort, no new level content.
2. **Build the prefix-stack level (#3)** — unblocks the visual grammar the whole middle of the game needs.
3. **Re-sequence (#6)** and convert levels to bespoke mechanics (#4/#5/#7) in dependency order, each passing
   the existing real-browser QA gate (segment count = priced requests, every cost > 0, click-through
   completion) before moving on.
4. **Tighten gates (#9)** as each level's mechanic solidifies.
5. **Delight pass (P2–P5)** last, once the learning spine is right.

---

## 8. Source reviews

- Full GPT-5.6 review: concept-dependency graph, per-level discovery test, redesigned curriculum, cold-open,
  top-10 changes (delivered via outsourcerer sol lane).
- Full agent-browser review: 17 screenshots `01-landing.png … 17-L2-run1.png`, live bug + delight findings.

Both are archived in the session; key findings are merged verbatim above.
