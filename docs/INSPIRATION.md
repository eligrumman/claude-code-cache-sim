# Inspiration: an actionable pattern library

This document extracts interaction patterns from *The Evolution of Trust*, *The Password Game*, *Stimulation Clicker*, *Universal Paperclips*, and adjacent neal.fun toys, then maps them to the 13-level Claude Code prompt-cache game.

The goal is not to imitate their visual skins. It is to borrow the machinery beneath them: immediate agency, protected discoveries, escalating consequences, tactile feedback, meaningful accumulation, and payoffs that reframe everything the player has already learned.

> **Reference note:** This analysis draws on established knowledge of the experiences rather than a live browser audit. Exact low-level audiovisual details of *Stimulation Clicker* are marked **[inferred]** where appropriate. Recommendations are technique-level and do not depend on copying proprietary assets.

---

## 1. Per-game teardown

### The Evolution of Trust — ncase.me/trust

#### Core loop

The player repeatedly chooses between **cooperate** and **cheat**, first against a simple opponent and later inside a population of strategies. Each choice immediately changes both players’ coin outcomes. The game starts with a comprehensible local interaction, lets the player form a folk theory, then reveals how that theory behaves over repeated rounds, tournaments, mistakes, and changing social conditions.

The interaction is doing the explaining. The player does not begin with a lecture on game theory, Nash equilibria, or reciprocity. They press a button, see a consequence, and begin predicting.

#### The single trick that makes it stick

**The player discovers the opponent’s rule by probing it.**

Characters such as Copycat, Always Cheat, Always Cooperate, Grudger, and Detective are memorable because each is a behavior the player has personally collided with before it becomes an abstract strategy. The game converts a payoff matrix into a cast of personalities.

That structure is more important than the specific cooperate/cheat mechanic:

1. Expose a small system.
2. Let the player form a hypothesis.
3. Make the player commit.
4. Reveal the system’s response.
5. Only then name the rule.
6. Change the environment so the player must revise the rule.

For our game, cache behavior should feel like another “opponent” whose policy the player learns to read.

#### Teaching and reveal structure

The reveal cadence expands concentrically:

1. **One choice:** cooperate or cheat.
2. **Repeated interaction:** a single move is not the whole relationship.
3. **Named strategies:** different opponents embody different policies.
4. **Tournament:** local behaviors produce population-level winners.
5. **Changing conditions:** number of rounds, mistakes, and communication alter which strategy succeeds.
6. **Sandbox:** the player can manipulate the conditions after acquiring the mental model.

The tournament is the essential payoff. It does not merely congratulate the player; it reveals that a strategy which felt good in one encounter can behave differently across an ecology. The player’s earlier experiences become evidence for interpreting a larger system.

That is the model for **L13 — The Fleet Audit**. L13 should not feel like thirteen lessons stapled together. It should reveal that locally sensible choices create different fleet outcomes when TTLs, routing, prompt identity, model mix, and prefix load interact across five developers.

#### Sensory design

- Minimal line art makes causal state readable at a glance.
- Characters use small facial and pose changes to turn algorithms into personalities.
- Color is categorical rather than decorative.
- Motion is short and tied to the exchange of coins or the transition between states.
- The voice is friendly, direct, and lightly mischievous.
- Sound, where present, is subordinate to the visible consequence; the design does not require spectacle to make a choice feel consequential.

The restraint is doing real work. There is rarely ambiguity about what changed or why.

#### Sandbox-then-lesson rhythm

The strongest rhythm is actually:

> constrained play → player prediction → consequence → named lesson → broader sandbox

The sandbox is earned. It arrives after the variables mean something. Offering a full configuration panel first would destroy the discovery because the player would not yet know which dimensions matter.

#### The one thing we should steal

**Protect every causal rule until the player has generated evidence for it, then make the final level a tournament of those rules.**

Implementation target:

- Use `PATTERN_PREDICT_BEFORE_REVEAL` in every level.
- Use `PATTERN_EXPLAIN_THEN_TRANSFER` before completion.
- Make L13’s five reports behave like named strategies: each developer visibly embodies one prior lesson.
- Reveal fleet totals only after `SUBMIT_AUDIT_RANKING`.
- Let the post-attempt counterfactual act as the tournament table.

---

### The Password Game — neal.fun

#### Core loop

The player edits one password while rules arrive one at a time. Each new rule is initially small enough to understand, but later rules interact with earlier ones. Fixing the newest failure can break something that had already passed.

The loop is:

> new rule → inspect live failures → edit → several validations flip → brief relief → next rule

The password is both the player’s construction and the game board. There is no separation between configuration and consequence.

#### The single trick that makes it stick

**Every success creates the next problem.**

A passing state is never quite closure. It is permission for the game to become stranger. “One more rule” is compulsive because:

- the player has already invested in a fragile construction;
- the next requirement is hidden but imminent;
- each repair produces immediate local feedback;
- the existing password accumulates history and personality;
- interacting constraints create surprising dominoes;
- the player believes the next rule might be the last reasonable one.

This is a dread/delight loop: “Please stop” and “show me the next one” happen at the same time.

#### Teaching and reveal structure

Rules remain concrete and locally testable even when they become absurd. Representative requirements involve formatting, arithmetic, dynamic real-world answers, visual interpretation, or caring for an embedded character. The important structure is not the exact joke. It is that each rule:

1. arrives alone;
2. has visible validation;
3. mutates the meaning of the existing object;
4. sometimes reactivates an older failure;
5. produces a short-lived completion high before escalation.

The game teaches constraint interaction without explaining constraint satisfaction.

#### Sensory design

- Each rule has a persistent validation row.
- Success and failure are reactive at typing speed.
- Passed rules visually settle; broken rules demand attention.
- The password visibly accretes formatting, symbols, and odd artifacts.
- Absurd events such as fire or character maintenance turn validation into physical comedy.
- Most “juice” comes from stateful visual reactions, not a conventional score meter.
- Sound is not the primary carrier of the experience; the visual validator is strong enough to work silently.

#### The one thing we should steal

**Make complex configuration puzzles validate continuously, with old requirements capable of breaking when a new choice interacts with them.**

Best target: **L11 — Pack the Context**.

The ticket capability badges should be a live validator:

- `repo-navigation` ✓
- `team-conventions` ✓
- `crm-schema` missing
- prefix size: `11,504 tok`
- cold workspaces affected: `3`

`SET_SKILL_LOADOUT`, `SET_MEMORY_LOADOUT`, and `SET_MCP_LOADOUT` should update those rows immediately without revealing the optimal loadout. A newly added MCP can satisfy a capability while visibly increasing every cold prefix. The pleasure comes from making all requirements green with the smallest possible stack—not from selecting an answer shown elsewhere.

Secondary target: **L12 — Stable at the Front**, where moving one volatile block should simultaneously improve reuse but may affect the status capability.

---

### Stimulation Clicker — neal.fun

#### Core loop

The player clicks for stimulation, spends accumulated stimulation on additional sources of stimulation, and gradually surrounds the original button with more movement, media fragments, notifications, counters, and sound. The subject of the toy—attention overload—is also its interface.

The player buys the conditions that make concentration harder.

#### The single trick that makes it stick

**Progress is spatial and sensory accretion, not merely a larger number.**

Every unlock changes the composition of the screen. The toy does not say “stimulation +10%” and leave the world unchanged. It adds another claimant on the player’s attention. The interface becomes a visible autobiography of the player’s escalation.

Its self-aware critique works because the game performs the behavior it is critiquing. The player is entertained by the exact overload they can recognize as ridiculous.

#### Teaching and reveal structure

The initial action is almost insultingly simple. Complexity arrives through purchases rather than instructions. Each addition is individually legible; the absurdity emerges from their simultaneous presence.

The reveal sequence is roughly:

1. one button and one number;
2. a small automatic or ambient stimulus;
3. another independent visual layer;
4. notification-like interruptions;
5. competing motion and sound;
6. a screen whose excess is the punchline.

The player never needs a tutorial on sensory overload. They manufacture it.

#### Sensory design

Exact cue inventory is not verified here; the following is a technique-level reading **[inferred]**:

- Short, bright click transients make the base action feel immediate.
- Purchases use a larger confirmation sound than ordinary clicks.
- Notification-like pings occupy different pitches or stereo positions.
- Loops are introduced as separate layers rather than replacing one soundtrack with another.
- Visual modules retain independent motion cycles, causing controlled interference.
- Accumulation is staged: one layer is charming, three are busy, many become the joke.
- High-salience events briefly duck or interrupt ambient layers, preserving hierarchy inside the chaos.

The important sound lesson is not “make it loud.” It is **semantic layering**: each audible layer corresponds to a visible system the player has activated.

#### The one thing we should steal

**Let the audiovisual world accumulate only as the player gains systems—and let the final composition communicate scale.**

Our adaptation must be restrained because the game teaches economics, not overload:

- L1 begins nearly dry: send, write, read.
- L2 adds the audible clock.
- L3 adds prefix-block tactility.
- L4 introduces a shared subagent rhythm.
- L9 adds output coloration.
- L13 combines the learned motifs into a quiet fleet “orchestra.”

No layer may exist solely to demand attention. Every sound and motion must identify a reducer consequence.

---

### Universal Paperclips — decisionproblem.com

#### Core loop

The player manually makes paperclips, buys automation, manages wire, price, demand, marketing, investments, processors, memory, projects, and eventually autonomous production at planetary and interstellar scale.

The same objective—make paperclips—survives every phase, while the meaning and scale of that objective repeatedly transform.

#### The single trick that makes it stick

**A familiar number becomes incomprehensibly large through earned phase changes.**

“Number go up” alone would become flat. *Universal Paperclips* keeps it compelling by changing what the number controls:

- manual clicking becomes production management;
- production becomes market optimization;
- money becomes computational resources and trust;
- terrestrial resources become autonomous infrastructure;
- local optimization becomes cosmic replication.

Old mechanics are not discarded randomly. They become inputs into the next layer.

#### Teaching and reveal structure

- The game initially exposes only what the player can understand.
- New controls unlock when the preceding resource becomes meaningful.
- Projects function as authored surprises and phase gates.
- A stalled resource often forces the player to reinterpret an earlier variable.
- The sparse interface makes a new button feel momentous.
- The late game pays off the deliberately modest beginning through radical scale.

#### Sensory design

- Primarily typographic and numeric.
- Little dependence on sound or animation.
- New rows and panels are themselves the reward.
- Numbers update continuously, making causal relationships inspectable.
- The visual austerity grants enormous weight to phase transitions.

This is proof that juice can be structural. A newly unlocked system can feel more exciting than particles.

#### The one thing we should steal

**Use L13 as a genuine scale shift, not merely a harder level.**

The player has spent twelve levels inspecting individual requests. In L13:

- those requests become monthly ledgers;
- ledgers become five developer archetypes;
- archetypes become causal loss buckets;
- two interventions reshape next month;
- the result zooms from one selected remediation back down to representative tape rows that changed.

The fleet view should make the player feel: “That tiny red rewrite I learned in L2 is now $575.”

---

### Spend — neal.fun

#### Core loop

The player spends an enormous fortune by purchasing recognizable items in escalating quantities. The remaining balance updates immediately, while the catalog moves from everyday purchases to extravagant assets.

#### The single trick that makes it stick

**Abstract scale is translated into familiar objects.**

A billion dollars is difficult to feel. Thousands of coffees, homes, aircraft, or institutions provide anchors. The number becomes comprehensible through repeated comparison.

#### Teaching and reveal structure

- Begin with cheap, familiar objects.
- Preserve one stable balance while item scale escalates.
- Let rapid repeated purchases create tactile momentum.
- Use the remaining total to show how resistant extreme scale is to ordinary intuition.

#### Sensory design

- Bright product cards.
- Immediate quantity and balance updates.
- Repeated clicks support rapid experimentation.
- Motion is usually local to the purchased item and total rather than a screen-wide celebration.

#### The one thing we should steal

**Always pair an abstract cost with a concrete unit of consequence.**

Examples:

- L2: “That 90-minute gap bought another 34,738-token write.”
- L5: “One changed word volunteered 14,623 later tokens for rewrite.”
- L7: “This ping cost one request; it prevented one rebuild.”
- L13: “272 idle rebuilds became $575 this month.”

The wallet should never be the only explanation.

---

### Absurd Trolley Problems — neal.fun

#### Core loop

The player makes a sequence of binary trolley choices. Scenarios become increasingly strange, self-referential, or impossible to justify cleanly. After choosing, the toy reveals how other players answered.

#### The single trick that makes it stick

**Commitment precedes social or systemic comparison.**

The player must own a choice before seeing the consensus. The reveal is interesting because it compares an authentic decision rather than a hypothetical opinion.

#### Teaching and reveal structure

- One choice per screen.
- Minimal setup.
- Immediate commitment.
- Post-choice percentage reveal.
- Escalation through changed framing rather than new controls.

The global percentage is not an answer key. It is a mirror shown after the player has acted.

#### Sensory design

- Strong central composition.
- Two unmistakable targets.
- Short transition between dilemma and result.
- Humor resides in the scenario and reveal, not in complicated controls.

#### The one thing we should steal

**Show reference behavior only after commitment.**

`UI_COUNTERFACTUAL_OVERLAY` should feel like the post-choice percentage reveal:

- “You kept the ping: `$0.004`.”
- “The rebuild would have cost `$0.098`.”
- “Your choice saved `$0.094`.”

Use this in L6, L7, L8, L10, and L13. The comparison earns attention because the player cannot revise their prediction after seeing it.

---

### The Size of Space — neal.fun

#### Core loop

The player continuously moves across orders of magnitude while familiar objects provide reference points. New scales arrive without breaking the spatial relationship to the previous scale.

#### The single trick that makes it stick

**A continuous camera makes discontinuous scale understandable.**

The player does not jump between unrelated fact cards. Motion preserves context: this object was large, then became tiny as the frame widened.

#### Teaching and reveal structure

- Begin with a legible reference.
- Move continuously.
- Introduce new labels at the scale where they matter.
- Preserve positional context.
- Alternate surprise with brief visual calm.

#### Sensory design

- Smooth camera motion.
- Strong silhouettes and sparse labels.
- Scale, rather than particle effects, creates awe.
- Visual density is controlled so each new order of magnitude remains readable.

#### The one thing we should steal

**Make scale transitions continuous.**

For L13, animate:

> one red `WireSegment` → its developer’s monthly tape → the five-report fleet → the `$692` hidden-cost rollup

The camera should zoom out while preserving the selected row as a visible thread. That continuity turns aggregation into understanding.

---

## 2. Addictiveness patterns

“Addictive” here means hard to disengage from because the player is curious, competent, and receiving clear causal feedback—not because the game applies opaque rewards or coercive pressure.

| Pattern | What it is | Why it hooks | Where it fits in our game |
|---|---|---|---|
| **Instant agency** | Put a meaningful control under the pointer within two seconds. | Action creates investment faster than exposition. | L1’s first `SEND_REQUEST`; L3’s first `PrefixBlock` placement; L8’s first `ROUTE_UNIT`. |
| **Discovery-gated reveal** | Hide the outcome until the player commits a prediction. | Converts passive observation into a test of the player’s model. | Every `UI_PREDICTION_PROMPT`; especially L1’s third color, L2’s post-standup request, L3’s mismatch boundary, and L13’s ranking. |
| **Escalating constraints** | Add one requirement that interacts with the existing construction. | The player protects prior progress while solving a new local problem. | L11’s capability-complete loadout using `SET_SKILL_LOADOUT`, `SET_MEMORY_LOADOUT`, and `SET_MCP_LOADOUT`; L12’s position-versus-capability choice. |
| **Reactive validation** | Show exactly which conditions pass or fail after every edit. | Shortens the thought-to-feedback loop and makes complex state manipulable. | L11 capability badges; L3 stack-order slots; L13 audit ranking completeness. Validation must not reveal optimality. |
| **Dread/delight escalation** | A successful action unlocks a new complication. | Closure and anticipation arrive together. | L6’s second hidden workday; L7’s lunch, commute, and overnight gaps; L10’s pipeline branches; L13’s remedies after ranking. |
| **Near-miss boundary** | Make failure occur just across a visible threshold. | “I almost had it” produces a specific revised plan rather than vague frustration. | L2 TTL crossing `60m`; L4 Job 4 arriving at `6:00` after a `5:00` expiry; L5’s first mismatching token; L6’s short cache missing a `30m` gap. |
| **Satisfying commit animation** | Give a discrete choice a short launch, impact, and settle sequence. | Makes abstract configuration feel physical and irreversible enough to matter. | Every `SEND_REQUEST`; `SUBMIT_LOADOUT`; `SUBMIT_AUDIT_RANKING`; `APPLY_REMEDIATION`. |
| **Number-go-up with meaning** | Let a number move continuously while tying it to visible causes. | Progress becomes legible and invites optimization. | Savings avoided in L6/L7; matched-prefix tokens in L3/L5/L12; recoverable dollars in L13. Prefer “saved” increasing over celebrating spend increasing. |
| **Wallet pressure** | A persistent limited resource reacts to each decision. | It turns invisible token economics into an embodied constraint. | `Wallet` across all levels. Each deduction must point to its new `LedgerRow`; never animate arbitrary loss. |
| **Unlock drip** | Introduce one control only after its prerequisite concept is playable. | New controls feel like capabilities rather than interface burden. | `advanceTime` in L2, prefix controls in L3, `width` in L4, `oneHourFlag` in L6, routing in L8, models in L9, plan depth in L10, audit in L13. |
| **Visual accretion** | Let acquired systems remain visible as later systems arrive. | Progress changes the world, not just a badge. | Campaign-wide: `UI_TAPE_RENDERER`, then `UI_TTL_DRAIN_BAR`, `UI_PREFIX_STACK_VISUALIZER`, subagent lanes, workload colors, and finally the fleet rollup. |
| **Layered audio accretion** | Give each learned system a restrained sonic identity, then recombine them. | Recognition makes later complexity feel mastered. | Read/write cues begin in L1; TTL in L2; prefix boundary in L3; wave rhythm in L4; output cue in L9; combined fleet mix in L13. |
| **Sandbox-then-consequence** | Let the player manipulate a small system, then run it deterministically. | Encourages hypothesis formation while preserving the drama of commitment. | L3 block assembly, L4 width grouping, L6 tier selection, L7 ping placement, L11 loadout, L12 reorder, L13 remediation. |
| **Counterfactual payoff** | Compare the actual run to one alternate after the attempt. | Resolves “what if?” without giving away the decision. | `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT` in L2, L6, L7, L8, L10, L11, L12, and L13. |
| **Phase-change reveal** | Reframe familiar primitives at a larger scale. | Makes prior mastery feel consequential and renews curiosity. | L9 introduces output as a new cost dimension; L13 turns `LedgerRow[]` into fleet economics. |
| **Tournament payoff** | Put learned strategies into one shared environment. | The player sees interactions that individual lessons could not expose. | L13’s five developer archetypes and ordering `idle > delegate > 5m-band > MCP` (`C17`). |
| **Local causal rewind** | Freeze on the decisive frame and return to the last meaningful choice. | Failure becomes information rather than lost time. | `PATTERN_FAIL_FREEZE_REWIND` in L2, L3, L4, L5, L6, L7, L10, L11, L12, and L13. |
| **Inspect-to-master** | Keep deeper equations available on hover or focus without forcing them into the main path. | Curious players gain confidence while others retain flow. | `UI_HOVER_PRICE_CALCULATOR` on every `LedgerRow`; report drill-down in L13. |
| **One-more-reveal** | End each result with a visible but unopened next question. | Curiosity carries the player across level boundaries. | L1 result previews a clock; L2 previews loose prefix blocks; L5 previews two write tiers; L12 previews five sealed reports. Do not preview the answer. |

### Campaign cadence

The 13 levels should form four rising arcs rather than thirteen equal beats:

1. **L1–L3: learn the language**
   - Red/blue.
   - Expiry.
   - Prefix boundary.

2. **L4–L7: race the clock**
   - Subagent waves.
   - Prompt identity.
   - Write-tier choice.
   - Keep-warm policy.

3. **L8–L12: shape the system**
   - Routing.
   - Workload/model choice.
   - Planning consequences.
   - Context loadout.
   - Prefix position.

4. **L13: see the ecology**
   - Diagnose.
   - Rank.
   - Intervene.
   - Watch the next month change.

Each arc should end with a transfer challenge that combines its earlier mechanics, but only L13 should combine the entire system.

---

## 3. Sound design playbook

The game currently has no sound. Add it as a state-derived feedback layer, never as an economic authority. Audio listens to committed reducer transitions and appended ledger evidence; it never determines state, timing, prices, gates, or replay.

### Audio character

The sonic palette should feel like a small, precise desktop instrument:

- **Reads:** glass, ceramic, soft magnetic clicks.
- **Writes:** wood, card stock, muted mechanical impacts.
- **TTL:** sand, breath, or a very quiet clockwork texture.
- **Wallet:** small metal ticks, not casino coins.
- **Prefix blocks:** paper/card placement with a dry snap.
- **Success:** a short resolved interval, not a fanfare.
- **Failure:** sudden subtraction and silence, not a buzzer.

Avoid sci-fi laser sounds. The subject is hidden infrastructure becoming tactile.

### Event-to-cue map

| Reducer evidence | Cue | Tone and construction | Layering rule |
|---|---|---|---|
| `SEND_REQUEST` begins | **Send launch** | `50–80ms` filtered click plus a quiet upward air sweep. | One launch per request, even if its tape bar has several `WireSegment`s. |
| `SEND_REQUEST` or `RUN_UNIT` appends a row with `readTok > 0` and little/no write | **Cache-hit read** | Warm glass “tik,” short high-mid tone, descending into a soft resolved fifth. This is the most satisfying routine cue. | Pitch may rise slightly with `readTok` ratio, but never with raw token count. |
| `SEND_REQUEST` or `RUN_UNIT` appends a cold/write-heavy row | **Cache-miss write** | Low wooden thunk with a brief paper scrape. A `1h` write is deeper and longer than a `5m` write. | Never make it comically punitive; it must communicate weight, not shame. |
| One request contains both `readTok` and `writeTok` | **Partial rewrite** | Read “tik,” then a shorter thunk at the visual mismatch boundary. | Synchronize to the blue-to-red transition in `UI_TAPE_RENDERER`. |
| `ADVANCE` changes a previously live `CacheEntry` to expired | **TTL expiry** | Quiet winding-down texture ending in one dry crack/pop. | Fire once on the liveness transition, never on every drained frame. |
| `ADVANCE` crosses the `dangerThresholdRatio` | **TTL danger** | One subdued clock tick or brushed click. | No repeating alarm. The visual bar carries urgency. |
| A read refreshes `lastTouchMin` | **TTL refresh** | Very soft upward “settle” paired with the read cue. | Omit if the read cue already makes the refresh obvious in L1. Introduce in L2. |
| A priced action changes `Wallet.remainingUsd` | **Wallet deduction** | Up to three muted coin ticks, pitch stepping downward with relative wallet impact. | Cap at three ticks regardless of cents; do not sonify every decimal. |
| `DISCARD_CONTEXT` | **Cache clear** | Short suction followed by a hollow click. | Silence the cache’s warm tonal layer immediately. |
| `SELECT_PREDICTION` | **Selection** | Barely audible card tap. | No correctness color or pitch before commitment. |
| `COMMIT_PREDICTION` | **Commit** | Firmer latch sound. | Disable repeated playback while locked. |
| `REVEAL_PREDICTION` correct | **Prediction resolved** | Two-note consonant response. | Do not turn prediction correctness into points. |
| `REVEAL_PREDICTION` incorrect | **Prediction contradicted** | Neutral two-note downward answer, followed immediately by causal evidence. | No error buzzer. Wrong predictions are productive. |
| `REORDER_PREFIX_BLOCK` | **Block move** | Dry card lift, then snap into slot. | One sound at pickup and one at committed placement; none during every drag pixel. |
| `SET_PREFIX_BLOCK_CONTENT` or `NORMALIZE_PROMPTS` changes the boundary | **Boundary sweep** | Narrow noise sweep traveling left-to-right with the invalidation visualization. | Stop at the exact first mismatch. |
| `SET_PREFIX_BLOCK_ENABLED`, loadout setters | **Pack/unpack** | Soft toggle with different in/out articulation. | Continuous size-meter changes remain silent. |
| `SUBMIT_LOADOUT` | **Bag close** | Fabric/paper fold plus latch. | Follow with either capability completion or a missing-capability stop. |
| `SET_FANOUT_WIDTH` | **Wave grouping** | Cards clack into groups. | Only sound after the new grouping settles, not on every slider input event. |
| `PLACE_KEEP_WARM_PING` | **Ping placed** | Small hollow marker tap. | The actual priced ping gets a normal request cue when sent. |
| `CHOOSE_MODEL` or `CHOOSE_PLAN_DEPTH` | **Choice card** | Distinct but neutral card-placement tones. | Models must not encode “better” through prettier sounds. |
| `SUBMIT_AUDIT_RANKING` | **Ranking lock** | Four descending blocks settle into a rail. | Dollar reveal begins only after the lock completes. |
| `APPLY_REMEDIATION` | **Repair applied** | Tight mechanical ratchet followed by the removed-loss layer fading. | Targeted remediation should sound precise; fleet-wide policy should sound broader and heavier. |
| `FREEZE_FAILURE` | **Fail-freeze** | Cut ambient tails, add one low stopped impact, then `250ms` of deliberate quiet. | The decisive event’s cue plays first; freeze follows. |
| `REWIND_TO_CHECKPOINT` | **Rewind** | `250–400ms` reversed tape/card sweep. | Restore only the sounds of the resumed state; do not replay mastered setup. |
| `COMPLETE_ATTEMPT` passes | **Gate pass** | Three compact notes assembled from learned read/write tonal material. | One star adds one light harmonic; no confetti cannon sound. |
| `COMPLETE_ATTEMPT` fails | **Result unresolved** | Open interval with no bass impact. | Keep the rewind control inviting. |

### Layered audio accretion

Borrow the *Stimulation Clicker* technique, but constrain it semantically:

- **L1:** send, read, write, wallet.
- **L2:** add one TTL layer.
- **L3:** add block-placement and mismatch sweep.
- **L4:** subagent launches form a brief rhythmic pattern by wave.
- **L5:** partial rewrites create a read-then-write split cue.
- **L6–L7:** tier and ping cues join the clock motif.
- **L8:** main and subagent routes use related timbres with different spatial positions.
- **L9:** output adds a soft violet-toned tail after the input-side cue.
- **L10:** pipeline stages reuse cues from their actual requests rather than receiving arbitrary stage jingles.
- **L11–L12:** prefix manipulation becomes the dominant tactile layer.
- **L13:** each report recalls its lesson’s motif. Applying a remediation removes or resolves that motif from the next-month playback.

The final fleet mix should feel like recognition, not noise.

### Mixing and restraint rules

- Maximum six simultaneous voices.
- Maximum one high-salience cue at a time.
- Request impact ducks ambient layers by roughly `4–6dB` for `100–180ms`.
- No persistent music during prediction prompts.
- No repeating danger beep.
- No cue longer than the state change it explains, except a very quiet active-cache bed.
- Rapid repeated rows collapse wallet sounds into one aggregate deduction.
- Do not pitch-map raw dollars across levels; relative impact within the current wallet is more legible.
- Tape rows rendered in a batch may form one rhythm, but every audible hit must still correspond to one `LedgerRow`.
- Failure silence is more powerful than a loud negative sound.
- UI hover remains silent.

### Offline implementation

For a single-file offline build:

- Create cues procedurally with the Web Audio API using oscillators, envelopes, filtered noise, and one generated impulse buffer.
- Initialize `AudioContext` only after the first user gesture.
- Keep audio state outside `ReducerState`; derive cues from reducer action/result deltas.
- Use request IDs and action indices to deduplicate cues during Svelte rerenders.
- Do not fetch audio, fonts, samples, or manifests at runtime.
- Keep one master gain, semantic buses for `request`, `ui`, `clock`, and `result`, and a hard limiter or conservative master gain.
- Suspend the context while muted or when the page is hidden.

### Mute and accessibility

- Persistent **Sound on/off** control visible from the first level.
- Optional **Reduced audio** mode: keep commits, reveals, expiry, failure, and result; remove ambient and repeated wallet cues.
- Respect operating-system reduced-motion settings, but do not assume reduced motion means muted audio.
- Never communicate hit/miss, expiry, correctness, or gate state through sound alone.
- Every cue has simultaneous visible evidence.
- Do not rely on stereo position alone; main/subagent distinction also uses labels and color.
- Pause or substantially reduce sound when the tab loses focus.
- Screen-reader announcements remain governed by `UI_TOAST_SYSTEM`, not by audio playback.

---

## 4. Visualization and juice playbook

### Global motion grammar

Use a small vocabulary consistently:

| Meaning | Motion |
|---|---|
| Player commits | `90–140ms` ease-in compression, then release |
| Request travels | `300–650ms` fast-out sweep |
| Cache accepts a write | weighty fill with slight overshoot |
| Cache serves a read | quick blue pulse traveling from cache to tape |
| Time advances | linear drain tied to committed simulated minutes |
| Rule is contradicted | motion stops at the causal boundary |
| Rewind | short reverse sweep to the checkpoint |
| Pass | elements settle into alignment; stars arrive last |

Recommended curves:

- Direct manipulation: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Heavy write impact: `cubic-bezier(0.16, 1, 0.3, 1)` with at most `4%` overshoot.
- Rewind: `cubic-bezier(0.7, 0, 0.84, 0)`.
- Wallet digits: `180–320ms` ease-out.
- Failure freeze: immediate after the decisive animation, never mid-cause.

Motion should clarify phase order: choice, execution, consequence, explanation.

### `UI_TAPE_RENDERER`

#### What animates

- A scan head enters from the left.
- Each request row reveals once from left to right.
- Segment color resolves as its bucket becomes visible.
- Partial hits visibly cross from blue into red at the same moment the prefix mismatch appears.
- The final dollar total settles after the last segment, not before.
- Hover/focus adds an outline and `UI_HOVER_PRICE_CALCULATOR`; it does not redraw missing content.

#### How

- Use `requestAnimationFrame` and Canvas2D.
- Reveal duration follows the existing contract: `min(1600ms, 500ms + rows×260ms)`.
- Width uses token count, while price appears as text; do not imply width equals dollars.
- A read emits at most `4–6` small blue motes that travel toward the cache panel.
- A write emits at most `3–5` heavier red squares that settle into the cache panel.
- Output, once introduced in L9, trails as a violet cap rather than competing with the input-side causal grammar.
- Seed incidental particle positions from `requestId` so screenshots and replay remain stable.
- Draw the complete final frame when animation completes, without requiring pointer interaction.

#### Aha frames

- **L1:** first red row and second blue row remain aligned for direct comparison.
- **L3:** tape split and `PREFIX_STACK.firstMismatchBlockId` illuminate simultaneously.
- **L4:** freeze row 4 at `6:00` beside the expired `5:00` entry.
- **L5:** pin `11,602` blue and `14,623` red while the changed word is highlighted.
- **L9:** expose the violet output contribution only after the bucket prediction.
- **L13:** zoom from the selected fleet loss bucket into representative rows.

### `UI_MAIN_CACHE_PANEL`

#### Write

- The panel’s empty cavity fills from bottom to top with a muted red-to-neutral material sweep.
- Saved token count increments in grouped digits, not one token at a time.
- The write-tier badge stamps in once.
- The panel settles with a low visual “weight”: `2–3px` downward squash, then return.

#### Read

- A blue pulse travels across the saved entry.
- `lastTouchMin` and `expiresAtMin` update together.
- The TTL bar gently expands back to full over `180–260ms`.
- Do not replay the write-fill animation.

#### Discard

- Contents desaturate and contract inward.
- The clear state remains visibly empty; it must not look like a free request.
- The next write should feel costly partly because the player saw what was discarded.

### `UI_TTL_DRAIN_BAR`

- Drain linearly with simulation time; easing would misrepresent TTL.
- Wall-clock animation interpolates only between committed `Clock.min` values.
- At the danger threshold, change hue and add one restrained edge pulse.
- At zero, the fill reaches exactly the boundary before the entry cracks/fades.
- Cache expiry should leave a faint historical outline so the player can see what used to exist.
- A hit refresh uses a quick reverse sweep to full.
- During `FREEZE_FAILURE`, stop every pulse and hold the exact causal frame.
- In reduced motion, snap to the new ratio and use a static cracked state.

L2 and L4 depend on the TTL bar being dramatic enough to watch but honest enough to trust.

### `Wallet`

- Keep the prior amount faintly visible for `250ms`.
- Roll only the digits that changed.
- Pair a large deduction with a short red underline traveling toward the responsible tape row.
- Pair a saving revealed by a counterfactual with a blue/green avoided-cost bracket; do not add fake currency to the actual wallet.
- Never shake the entire screen on overspend.
- When negative, stop at the exact value and freeze the cause before presenting failure copy.

### `UI_PREFIX_STACK_VISUALIZER`

#### Assembly

- Blocks land with card-like weight.
- Minimum widths preserve labels; token-proportional interior fills show true scale.
- Valid placement snaps; invalid placement resists by `6–10px` then returns.
- Keyboard moves trigger the same action and settle animation as drag.

#### Diff

- Matched prefix receives a left-to-right blue wash.
- The first mismatch gets one vertical high-contrast cut.
- Red propagation begins at that cut and travels through the invalidated suffix.
- `PB_CURRENT` uses neutral/red hatching so fresh content is not confused with waste.
- Concrete invalidated tokens count upward only while the red wave advances.
- Never reveal the cut before the required prediction is committed.

#### Reorder

- Neighboring blocks make space before the moved block lands.
- Maintain block identity and size throughout motion.
- A change in cost is not displayed until the player commits and runs.
- L12’s 20-token volatile card should remain visually small even though its downstream red propagation is huge. That contrast is the lesson.

### Subagent waves

For L4:

- Eight job cards sit in one stable horizontal queue.
- `SET_FANOUT_WIDTH` groups them without pricing.
- On commit, each wave launches as a synchronized row.
- The shared cache pulse begins at the first job and visibly weakens between waves.
- When the fourth serial wave arrives late, stop it at the cache boundary for one beat before the red write lands.
- Avoid eight independent particle showers; one wave front plus eight row impacts is enough.

### Pipeline visualization

For L10:

- Keep `PLAN → BUILD ×3 → REVIEW → CI` closed before commitment.
- The chosen plan enters the pipeline as a physical card.
- Downstream branches unfold only when generated by the calibrated `[FICTION]` outcome.
- Trace each extra review or CI request back to the plan branch with one persistent line.
- Fictional causal branch counts must be labeled in the explanation/result, while every request price remains tied to `PRICE_REQUEST`.

### Fleet zoom

For L13:

1. Begin with five folders.
2. Expand one folder into its timeline.
3. Collapse representative rows into a monthly loss strip.
4. Arrange the five strips into the fleet total.
5. After remediation, animate affected red rows thinning or disappearing.
6. Preserve unaffected costs, especially Eli’s legitimate output volume.
7. End on the before/after total with two representative request pairs still inspectable.

This is the *Size of Space* steal: continuous scale, never a disconnected dashboard swap.

### Particle and flash budget

- Maximum `12` live particles for one local event.
- Maximum `24` across the full screen.
- Maximum one full-panel flash per request group.
- No full-screen white flash.
- Color persistence beats particle volume.
- Decorative particles never cross text, controls, the decisive tape row, or a tooltip.
- Results may use a compact burst around earned stars; zero particles on a failed attempt.
- All animation is cancellable and must settle into a complete static frame.

### The restraint line

Juice is justified only when it answers one of these questions:

- What did I just do?
- What changed?
- Where did the cost come from?
- Which boundary mattered?
- What should I inspect next?

If an effect answers none of them, remove it.

---

## 5. Voice and tone

### Register

Use a voice that is:

- **Dry-witty:** the joke is the situation, not a stream of punchlines.
- **Second-person:** choices and consequences belong to the player.
- **Confident:** state what happened without hedging.
- **Concrete:** name the request, time, token count, or block.
- **Brief:** one line before action, one line at consequence.
- **Nonjudgmental:** a wrong prediction is a useful model being updated.
- **Economically literate:** distinguish measured pricing from calibrated fiction.
- **Protective of surprise:** pre-play copy poses a problem; post-reveal copy names the rule.

Avoid mascot chatter, faux urgency, corporate slogans, and anthropomorphizing the cache so heavily that its mechanics become inaccurate.

### Copy rhythm

Before action:

> situation + constraint + invitation

At reveal:

> concrete event + mechanism + visible consequence

At result:

> what the player proved + one transferable rule

### Rewritten lines from the levels

| Level | Current line | Recommended voice |
|---|---|---|
| **L1 — Red or Blue?** | “Login is broken. Ask Claude to fix it?” | **“Bob broke login. You have $0.30 and a Send button.”** |
| **L2 — Beat the Clock** | “Saved for now. TTL is the idle-time countdown.” | **“Saved. It stays warm for 60 idle minutes. The clock starts now.”** |
| **L4 — The Five-Minute Race** | “Job 4 arrived at 6:00. The shared prefix expired at 5:00, so it rewrote.” | **“Job 4 arrived at 6:00. Its shared cache left at 5:00. The red row is the reunion fee.”** |
| **L5 — One Word** | “‘HELLO’ mismatched near the front. It invalidated the 14,623-token suffix, so job 2 rewrote it.” | **“‘HELLO’ changed near the front. The next 14,623 tokens got volunteered for rewrite.”** |
| **L11 — Pack the Context** | “Each workspace starts cold. Pack one loadout for all three.” | **“Three cold workspaces. One bag. Pack it.”** |
| **L13 — The Fleet Audit** | “FINOPS: Claude spend is up again. Five developer reports attached.” | **“Spend is up. Five reports disagree about why. You get two fixes.”** |

The witty phrase should never displace the causal sentence. For example, L4 may use “reunion fee,” but the screen must still display `arrived 6:00`, `expired 5:00`, and the resulting write.

### Vocabulary timing

- **Write** after L1’s first red request.
- **Read** after L1’s first blue request.
- **TTL** after L2 creates a live `CacheEntry`.
- **Prefix** when L3 places the blocks on screen.
- **Mismatch** when L3 reveals the first changed block.
- **Subagent** when L4’s jobs launch.
- **Output** when L9 asks which bucket dominates.
- **Volatile** after L12 shows a changing block invalidate the suffix.
- **Recoverable dollars** when L13 locks the ranking.

Never use internal identifiers such as `C28`, `WORK_OUT`, or `PB_CURRENT` in player-facing copy.

---

## 6. Anti-patterns and guardrails

### Answer-key-before-play

**Failure:** A comparison screen labels the good configuration and its savings before the player acts.

**Why it feels cheap:** The interaction becomes transcription.

**Guardrail:** `referenceCfg`, `antiCfg`, and `UI_COUNTERFACTUAL_OVERLAY` remain unavailable until a meaningful attempt and `REQUEST_COUNTERFACTUAL`.

### Password-style constraint pileup without control

**Failure:** Several requirements break at once, with no indication of which choice caused which failure.

**Why it becomes annoying:** The player is repairing opaque state rather than reasoning.

**Guardrail:** Only one new constraint per reveal. Reactive validation names affected requirements. L11 may show multiple consequences from one loadout edit, but the changed item and token delta remain highlighted.

### Escalation that erases mastery

**Failure:** A new level introduces unrelated controls and makes previous knowledge irrelevant.

**Why it feels arbitrary:** Surprise becomes randomness.

**Guardrail:** Every new control consumes a prior concept. `oneHourFlag` requires TTL knowledge; routing requires prefix/history knowledge; audit requires all prior causal buckets.

### Constant sensory escalation

**Failure:** Every level becomes louder, brighter, and busier.

**Why it feels exhausting:** Nothing retains salience.

**Guardrail:** Accrete semantic motifs, then remove inactive ones. L13 may combine cues briefly, but prediction and explanation moments return to near-silence.

### Casino wallet feedback

**Failure:** Coin showers, slot-machine sounds, streaks, or variable rewards celebrate spending.

**Why it damages the lesson:** The game confuses economic understanding with gambling stimulation.

**Guardrail:** Wallet sounds are quiet and proportional. Celebrate demonstrated understanding and avoided cost, not raw transaction volume.

### Punitive failure

**Failure:** A bad choice empties the wallet, displays a generic failure modal, and restarts the level.

**Why it breaks discovery:** The player remembers lost time rather than the mechanism.

**Guardrail:** Use `PATTERN_FAIL_FREEZE_REWIND`. Freeze on the decisive request, name the cause, and restore the nearest `Checkpoint`.

### Fake urgency

**Failure:** Wall-clock countdowns pressure the player even though the engine is deterministic and turn-based.

**Why it feels manipulative:** It creates stress unrelated to the concept.

**Guardrail:** TTL motion visualizes committed simulation time only. Player thinking time never expires the cache.

### Coy causal copy

**Failure:** The game protects surprise even after the event, using lines such as “Something changed!”

**Why it frustrates:** Mystery has already served its purpose.

**Guardrail:** Once revealed, name the exact time, block, token bucket, or request that caused the outcome.

### Decorative data

**Failure:** Tape width, particles, or chart area imply dollar magnitude when they actually encode tokens.

**Why it undermines trust:** The visual system contradicts `PRICE_REQUEST`.

**Guardrail:** Label encodings. Tape width represents input-side tokens; dollars remain explicit text. Output uses its own segment after L9.

### Fiction presented as measurement

**Failure:** L10’s plan-quality branch counts appear as universal Claude economics.

**Why it misleads:** The game’s credibility comes from traceable pricing.

**Guardrail:** Mark downstream plan/rework effects `[FICTION]` in authoring and describe them as the scenario’s pipeline behavior. Keep token prices exact.

### Toast confetti

**Failure:** Several status, teaching, and reward toasts compete with the decisive row.

**Why it feels like a cheap mobile game:** The system talks over its own evidence.

**Guardrail:** One teaching toast at a time; cause before status; never cover the active control or tape evidence.

### Animation as a lock

**Failure:** The player waits through repeated tape reveals or result ceremonies.

**Why it kills “one more level”:** Juice becomes latency.

**Guardrail:** Allow click-to-settle after the first viewing. Reduced motion draws the final state immediately. Rewind never replays mastered setup.

### Universal Paperclips-style scale without phase design

**Failure:** Later levels merely increase token counts and budgets.

**Why it becomes spreadsheet work:** Larger numbers alone do not create meaning.

**Guardrail:** L13 changes the unit of reasoning from request to developer to fleet, while keeping drill-down continuity.

### Social comparison as correctness

**Failure:** A reference run or population percentage is presented as the morally or technically correct answer.

**Why it narrows learning:** Players imitate the majority.

**Guardrail:** Counterfactuals explain consequences. Behavioral gates remain grounded in the level’s causal rule, not popularity.

### Inaccessible tactility

**Failure:** Dragging, color, motion, or sound is the only way to understand state.

**Guardrail:** Every drag has keyboard actions; every color has a label/pattern; every cue has visual evidence; reduced-motion and mute preserve identical gates.

---

## 7. Top 10 steals, ranked

### 1. The Evolution of Trust’s predict–act–reveal loop

**Target:** L1 — Red or Blue?, then every level.

**Why first:** It changes the experience from tutorial to discovery without requiring a new economic engine.

**Implementation:**

- Drive the sequence through `OPEN_PREDICTION`, `SELECT_PREDICTION`, `COMMIT_PREDICTION`, `SEND_REQUEST`, and `REVEAL_PREDICTION`.
- Disable only the gated reveal, not inspection.
- In Svelte 5, render `UI_PREDICTION_PROMPT` directly from `ReducerState.prediction`.
- Keep correctness styling absent until `revealed === true`.
- Canvas renders the final tape state from the appended ledger row; the DOM prompt supplies accessible controls.

### 2. The Password Game’s live validator

**Target:** L11 — Pack the Context.

**Why second:** L11’s smallest-sufficient-loadout puzzle becomes tactile only when capability and bloat respond instantly.

**Implementation:**

- Derive validation rows from `selectedLoadout` and ticket capabilities after every loadout action.
- Animate only rows whose status changed.
- Keep “capable” and “small” as separate dimensions.
- Use `UI_PREFIX_STACK_VISUALIZER` for size and DOM rows for accessible validation.
- Do not calculate spend until `SUBMIT_LOADOUT`; preview tokens, not the winning total.

### 3. The Evolution of Trust’s tournament payoff

**Target:** L13 — The Fleet Audit.

**Why third:** It makes the campaign cohere.

**Implementation:**

- Treat Ari, Bea, Cy, Dev, and Eli as five behavioral archetypes.
- Each folder recalls a known motif: TTL, prompt mismatch, five-minute waves, MCP load, legitimate output.
- Lock ranking with `SUBMIT_AUDIT_RANKING`.
- Reveal `C17` only afterward.
- Run remediation through the same deterministic ledger machinery and pair changed requests in `UI_COUNTERFACTUAL_OVERLAY`.

### 4. Stimulation Clicker’s semantic audiovisual accretion

**Target:** L13, built progressively from L1.

**Why fourth:** It provides delight without adding arbitrary decoration.

**Implementation:**

- Build a small Web Audio cue graph inside the offline bundle.
- Subscribe to action/result deltas rather than component lifecycle.
- Reuse learned motifs in L13 and remove a motif when its causal loss is remediated.
- Keep Canvas particles pooled and capped.
- Store mute/reduced-audio preferences locally; never store audio state in replay.

### 5. The near-miss freeze

**Target:** L2 — Beat the Clock and L4 — The Five-Minute Race.

**Why fifth:** TTL becomes emotionally legible when failure lands just past a visible boundary.

**Implementation:**

- Interpolate `UI_TTL_DRAIN_BAR` linearly to zero.
- Render the late row.
- Dispatch `FREEZE_FAILURE` only after the causal frame exists.
- Draw a static bracket from `expires 5:00` to `arrived 6:00`.
- Offer `REWIND_TO_CHECKPOINT` with “Try the wave again.”
- Do not reset the prediction or replay the cold open.

### 6. The Password Game’s “one more constraint”

**Target:** L7 — Keep It Alive and L11 — Pack the Context.

**Why sixth:** It turns optimization into a sequence of revised policies rather than one guessed setting.

**Implementation:**

- L7 reveals lunch, then commute, then overnight; each gap tests the same ping policy under a new pattern.
- L11 adds ticket requirements one at a time during the transfer challenge.
- Keep the same underlying objects visible so the player modifies an invested construction.
- Never introduce more than one new requirement in a single beat.

### 7. Universal Paperclips’ phase change

**Target:** L13 — The Fleet Audit.

**Why seventh:** The capstone needs a new scale, not merely stricter thresholds.

**Implementation:**

- Use one Canvas camera transform to zoom from `WireSegment` to monthly developer strip to fleet rollup.
- Preserve request IDs across aggregation so selecting a fleet bucket can zoom back to evidence.
- Add no new pricing rule in L13.
- The phase change is representational: request economics become organizational policy.

### 8. Spend’s concrete scale anchors

**Target:** L5 — One Word and L13 — The Fleet Audit.

**Why eighth:** Token counts and monthly totals are otherwise too abstract.

**Implementation:**

- Pair cost totals with causal units: rewritten suffixes, rebuild counts, affected cold bases.
- In L5, keep the changed word physically adjacent to the `14,623 tok` invalidation bracket.
- In L13, animate `272 rebuilds → $575`, not merely `$575` appearing.
- Keep the dollar calculation inspectable through `UI_HOVER_PRICE_CALCULATOR`.

### 9. Absurd Trolley Problems’ post-commit comparison

**Target:** L6 — Buy More Time?, L7 — Keep It Alive, and L10 — Plan Once, Pay Later.

**Why ninth:** Counterfactuals become compelling when the player has already owned a choice.

**Implementation:**

- Preserve actual actions and ledger.
- Run the alternate deterministically off-screen after `REQUEST_COUNTERFACTUAL`.
- Reveal paired requests only through `REVEAL_COUNTERFACTUAL`.
- Animate the two outcomes side by side without “good/bad” labels.
- Ask for the cause before showing the concise rule.

### 10. The Size of Space’s continuous scale camera

**Target:** L13 result and campaign finale.

**Why tenth:** It converts aggregation into comprehension and gives the campaign a memorable ending.

**Implementation:**

- Use a single Canvas2D scene graph with nested coordinate spaces for request, developer, and fleet views.
- Tween camera scale and translation while keeping one selected red row anchored.
- Reveal labels only at their relevant zoom level.
- Under reduced motion, replace the zoom with three static linked frames: request → developer → fleet.
- Finish on the remediated next-month total, then leave every source row inspectable.

---

## Build priorities

If delight work must be staged, use this order:

1. Correct final-frame rendering in `UI_TAPE_RENDERER`.
2. Prediction-gated reveals.
3. Local fail-freeze-rewind.
4. L11 reactive validation.
5. Read/write/expiry sound cues.
6. Prefix mismatch animation.
7. Passing result treatment.
8. Campaign-wide audio accretion.
9. L13 fleet zoom and tournament playback.
10. Secondary particles and ambient layers.

The governing rule is simple:

> First make the consequence unmistakable. Then make it satisfying.
