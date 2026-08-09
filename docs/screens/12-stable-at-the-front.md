# Level 12 — Stable at the Front

## 1. Identity

- `id`: `stable-at-the-front`
- `title`: **Stable at the Front**
- `tier`: `3`
- Player-facing objective: **“Seven session starts. One tiny block keeps changing. Arrange the start packet, then predict what the cache will do.”**
- One concept: early volatile content invalidates the reusable suffix; prefix position can outweigh block size (`C9`, `C22`, `C23`).
- Prerequisites: prefix boundary and payload.
- `concept.id`: `volatile-prefix-position`
- `concept.privateDesignerSummary`: A changing 20-token hook `[FICTION]` placed before 24,300 stable tokens forces that suffix to be rewritten on every start (`C23`).
- `concept.postRevealRule`: **“The first mismatch sets the reuse boundary. Put changing payload after stable cached context.”**
- Introduced control: reorderable `UI_PREFIX_STACK_VISUALIZER`.
- Vocabulary introduced after evidence: **volatile** — “content whose exact bytes may change between starts.”

## 2. Objects used

- `PrefixBlock` instances `PB_SYSTEM`, `PB_TOOLS`, `PB_INSTRUCTIONS`, `PB_HISTORY`, and `PB_CURRENT`
- `PREFIX_STACK`
- `Request`
- `MAIN_SESSION_CONTEXT`
- `CacheEntry` using `CACHE_TIER_1H`
- `RESOLVE_PREFIX`
- `PRICE_REQUEST`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Clock`
- `TapeRenderer`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

Proposed presentation timings are `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Seven closed terminal tabs land in a row, labelled **START 1** through **START 7**. Copy: **“Same project. Seven fresh starts.”** |
| `0.5s` | `UI_PREFIX_STACK_VISUALIZER` opens with five draggable cards. The 20-token card reads **“STATUS · 09:00 · clean”**; no stability labels, cache colors, mismatch boundary, or answer copy appears. |
| `1.0s` | Copy: **“This status line updates at every start. Arrange the packet.”** |
| `1.5s` | Cards become draggable. Buttons: **“Make status static”**, **“Drop status”**, and **“Lock arrangement”**. Dropping shows only **“Some startup status will be unavailable.”** |
| `2.0s` | First interaction is available. No tape or reference arrangement is visible. |
| After lock | Exact prompt: **“Start 2 arrives with a new status line. What happens to the large block after it?”** The run remains disabled until prediction is committed. |

The opening arrangement is deliberately harmful:

`PB_SYSTEM → PB_CURRENT(status hook) → PB_TOOLS → PB_INSTRUCTIONS → PB_HISTORY`

The cache breakpoint begins after the combined stable suffix. The player may:

- move `PB_CURRENT` after that boundary while keeping it dynamic;
- make its content static;
- disable it and accept the scenario’s status-capability loss.

No option is marked correct before the attempt.

## 4. Exact event sequence

The stable blocks total exactly `24,300` tokens (`C23`). `PB_CURRENT` contains the changing 20-token timestamp/status hook `[FICTION]`. Starts occur at minutes `0, 5, 10, 15, 20, 25, 30` `[FICTION]`, within the 60-minute `MAIN_SESSION_CONTEXT` lifetime (`C1`).

1. **Enter level**
   - Event: route opens.
   - Action: `ENTER_LEVEL { levelId: "stable-at-the-front" }`.
   - Mutates: `ReducerState`, `Wallet`, `Clock`, units, empty ledger, empty cache, attempt-local prediction state.
   - Numbers: budget `$30` (`SCOPE_BUDGET.week`, `C30`); clock `0 min`.

2. **Initialize the puzzle**
   - Event: cold-open layout mounts.
   - Action: `SET_PREFIX_BLOCKS { contextId: "l12-main", blocks: [...] }`.
   - Mutates: `PREFIX_STACK`.
   - Numbers: stable suffix `24,300` tokens (`C23`); volatile hook `20` tokens `[FICTION]`; total request-side content `24,320` tokens.

3. **Checkpoint before the decision**
   - Event: first drag or alternative-control focus.
   - Action: `CREATE_CHECKPOINT { checkpointId: "before-l12-arrangement", reason: "decision" }`.
   - Mutates: checkpoints only.
   - Numbers: none.

4. **Player configures the SessionStart packet**
   - Reorder event → `REORDER_PREFIX_BLOCK { contextId: "l12-main", blockId: "l12-status", toIndex }` → mutates `PREFIX_STACK.blocks`, ordering, and derived boundary.
   - Static event → `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-static", tokenCount: 20 }` → mutates the block identity and stability fixture.
   - Drop event → `SET_PREFIX_BLOCK_ENABLED { contextId: "l12-main", blockId: "l12-status", enabled: false }` → mutates the enabled stack and records loss of `fresh-session-status`.
   - No request is sent and no price is revealed.

5. **Lock arrangement and open prediction**
   - Event: player clicks **“Lock arrangement.”**
   - Actions:
     1. `CREATE_CHECKPOINT { checkpointId: "before-l12-run", reason: "prediction" }`
     2. `OPEN_PREDICTION { promptId: "l12-start2-suffix" }`
   - Mutates: checkpoint and prediction state.
   - Numbers: none.

6. **Commit prediction**
   - Event: player selects an option and clicks **“Lock prediction.”**
   - Actions:
     1. `SELECT_PREDICTION { promptId: "l12-start2-suffix", optionId }`
     2. `COMMIT_PREDICTION { promptId: "l12-start2-suffix" }`
   - Mutates: committed prediction evidence.
   - Numbers: none.

7. **Start 1 establishes the entry**
   - Event: player clicks **“Run seven starts.”**
   - Action: `SEND_REQUEST { request: l12-start-1 }`.
   - Mutates: `CacheEntry`, `LedgerRow`, `Wallet`, `lastRequests`, tape payload, `UI_MAIN_CACHE_PANEL`.
   - Reference arrangement numbers: `writeTok=24,300`, `inputTok=20`, `readTok=0`, `outTok=0`; cost `$0.14586`.
   - Harmful early-hook numbers: identical buckets and cost on the cold start.

8. **Start 2 changes the hook and resolves the boundary**
   - Event: clock reaches minute `5`; status becomes **“09:05 · 1 file changed”** `[FICTION]`.
   - Actions:
     1. `ADVANCE { min: 5 }`
     2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-02", tokenCount: 20 }`
     3. `SEND_REQUEST { request: l12-start-2 }`
     4. `REVEAL_PREDICTION { promptId: "l12-start2-suffix", correctOptionId: "depends-on-position" }`
   - Mutates: `Clock`, `PREFIX_STACK.firstMismatchBlockId`, `matchedPrefixTok`, `invalidatedSuffixTok`, `CacheEntry`, ledger, wallet, tape, prediction result.
   - Reference arrangement: `readTok=24,300`, `inputTok=20`, `writeTok=0`; `$0.00735`.
   - Harmful early-hook arrangement: `readTok=0`, `inputTok=20`, `writeTok=24,300`; `$0.14586`; `invalidatedSuffixTok=24,300` (`C9`, `C23`).

9. **Starts 3–7 propagate the observed result**
   - Event: each next tab opens at five-minute intervals `[FICTION]`.
   - For each `n ∈ 3…7`, actions:
     1. `ADVANCE { min: 5 }`
     2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-0n", tokenCount: 20 }`
     3. `SEND_REQUEST { request: l12-start-n }`
   - Mutates: clock, prefix resolution, cache, one ledger row, wallet, tape.
   - Reference arrangement, each start: `24,300` read + `20` input = `$0.00735`.
   - Harmful arrangement, each start: `24,300` write + `20` input = `$0.14586`.
   - Animation: the mismatch spark begins at the 20-token hook, then sweeps across the 24,300-token suffix. Starts 2–7 retain aligned red propagation trails so all seven rows can be compared.

10. **Freeze a harmful attempt**
    - Event: Start 7 finishes and the six repeated invalidations remain visible.
    - Action: `FREEZE_FAILURE { failure: { id: "l12-early-volatile", checkpointId: "before-l12-run", message: "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.", causeObjectIds: ["l12-status", "l12-stable-suffix"] } }`.
    - Mutates: `clock.frozen`, `frozenFailure`; economic actions stop.
    - Numbers: six avoidable rewrites × `24,300` = `145,800` rewritten tokens (`C23`); harmful total `$1.02102`.
    - The first causal mismatch remains pinned on Start 2 even though the freeze waits for the seven-row propagation animation.

11. **Successful completion**
    - Event: all seven starts finish with the dynamic hook after the stable cache boundary.
    - Actions:
      1. `ACK_EXPLANATION { explanationId: "l12-position-rule" }`
      2. `COMPLETE_ATTEMPT`
    - Mutates: explanation evidence, gate result, stars, result summary.
    - Numbers: reference total `$0.18996`; `24,300` stable tokens read on Starts 2–7 (`C23`).

12. **Post-attempt comparison**
    - Event: player clicks **“Compare placements.”**
    - Actions:
      1. `REQUEST_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail" }`
      2. `REVEAL_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail" }`
    - Mutates: comparison visibility only.
    - Numbers revealed only now: `$1.02102` early versus `$0.18996` after-boundary; delta `$0.83106`, or `81.4%` less.

## 5. Level data

```ts
const level12: LevelDef = {
  id: "stable-at-the-front",
  tier: 3,
  title: "Stable at the Front",
  objective:
    "Seven session starts. One tiny block keeps changing. Arrange the start packet, then predict what the cache will do.",
  concept: {
    id: "volatile-prefix-position",
    privateDesignerSummary:
      "A changing 20-token hook placed before 24,300 stable tokens forces the stable suffix to be rewritten.",
    postRevealRule:
      "The first mismatch sets the reuse boundary. Put changing payload after stable cached context.",
  },
  prerequisiteConceptIds: ["prefix-boundary", "payload"],
  unlocks: "prefix-block-reorder",
  introducedControls: ["prefix-block-reorder"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "prompts",
    "width",
    "oneHourFlag",
    "keepWarm",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp",
  ],

  scope: "week",
  seed: 122430,
  budgetUsd: 30,
  clockCapMin: 30,
  cfgOverride: {
    orchestratorModel: "sonnet",
    who: "main",
    hook: "dynamic",
    oneHourFlag: true,
  },
  scenario: "week7starts",
  scenarioData: {
    units: [
      { id: "l12-start-1" },
      { id: "l12-start-2" },
      { id: "l12-start-3" },
      { id: "l12-start-4" },
      { id: "l12-start-5" },
      { id: "l12-start-6" },
      { id: "l12-start-7" },
    ],
    contexts: [{ id: "l12-main", kind: "main" }],
    prefixStacks: [{ id: "l12-session-start", contextId: "l12-main" }],
    allowedCfg: {
      hook: ["dynamic", "static", "off"],
    },
    estimates: [
      { label: "volatile status-hook tokens", value: 20, tag: "[FICTION]" },
      { label: "minutes between starts", value: 5, tag: "[FICTION]" },
      { label: "deterministic seed", value: 122430, tag: "[FICTION]" },
      { label: "cold-open first interaction seconds", value: 2, tag: "[ESTIMATE]" },
    ],
  },

  coldOpen: { /* §3 exact beats */ },
  sequence: [/* §4 exact events */],
  predictions: [/* §8 */],
  toasts: [/* §11 */],
  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT",
  ],

  failLesson: {
    id: "l12-early-volatile",
    copy:
      "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.",
  },
  failureRules: [
    {
      id: "l12-freeze-early-dynamic",
      predicateId: "dynamic-hook-precedes-stable-breakpoint-after-seven-starts",
      checkpointId: "before-l12-run",
    },
  ],
  checkpoints: [
    { id: "before-l12-arrangement", reason: "decision" },
    { id: "before-l12-run", reason: "prediction" },
  ],

  gate: {
    predicateId: "l12-position-understanding",
    behavioralRequirements: [
      { id: "prediction-committed-before-start2-reveal" },
      { id: "dynamic-status-retained" },
      { id: "status-ordered-after-stable-cache-boundary" },
      { id: "starts-2-through-7-read-24300-stable-tokens" },
    ],
    explanationRequirement: {
      id: "l12-position-rule-acknowledged-after-evidence",
    },
  },
  pass: passLevel12,
  star2: {
    label: "No poisoned replay",
    predicate: { id: "at-most-one-early-hook-attempt" },
    reason: "Found the causal boundary with no more than one poisoned run.",
  },
  star3: {
    label: "Fresh and reusable",
    predicate: {
      id: "first-run-dynamic-hook-after-boundary-and-six-full-stable-reads",
    },
    reason:
      "Kept current status while reusing all 24,300 stable tokens on Starts 2–7.",
  },

  referenceCfg: {
    orchestratorModel: "sonnet",
    who: "main",
    hook: "dynamic",
    oneHourFlag: true,
  },
  antiCfg: {
    orchestratorModel: "sonnet",
    who: "main",
    hook: "dynamic",
    oneHourFlag: true,
  },
  counterfactuals: [
    {
      id: "l12-front-vs-tail",
      unlockAfterEventId: "l12-complete-attempt",
      kind: "anti-pattern",
      cfg: { hook: "dynamic" },
      scenarioPatch: {},
      comparisonQuestion:
        "What did changing the block’s position change?",
      revealCopy:
        "The hook stayed 20 tokens. Moving it behind the boundary prevented six rewrites of the 24,300-token stable suffix.",
    },
  ],

  tape: { /* §7 */ },
  result: {
    title: "Same payload. Different boundary.",
    successCopy:
      "Starts 2–7 reused the stable front while the status stayed current at the tail.",
  },
  vocabulary: [
    {
      term: "volatile",
      revealAfterEventId: "l12-start-2-reveal",
      copy: "Content whose exact bytes may change between starts.",
    },
  ],
  qa: [/* §12 */],
};
```

`seed: 122430` is `[FICTION]`. `budgetUsd: 30` traces to the week scope budget (`C30`). The reference and anti-pattern share all configuration values; their `scenarioData.prefixStacks` differ only in `l12-status.order` relative to the breakpoint.

## 6. Pricing walkthrough

All requests use Sonnet and `CACHE_TIER_1H`: Sonnet input `$3/M`, read `$0.30/M`, 1-hour write `$6/M` (`C1`, `C3`). Output is zero for this SessionStart fixture, so no output segment is rendered.

### Three-star reference: dynamic hook after the boundary

| Request | Read | Fresh input | Write | Calculation | Cost |
|---|---:|---:|---:|---|---:|
| Start 1 | `0` | `20` | `24,300` | `20×$3/M + 24,300×$6/M` | `$0.14586` |
| Start 2 | `24,300` | `20` | `0` | `24,300×$0.30/M + 20×$3/M` | `$0.00735` |
| Starts 3–7, each | `24,300` | `20` | `0` | same as Start 2 | `$0.00735` |
| **Total** | `145,800` | `140` | `24,300` | `$0.14586 + 6×$0.00735` | **`$0.18996`** |

### Anti-pattern: dynamic hook before the stable suffix

| Request | Read | Fresh input | Write | Calculation | Cost |
|---|---:|---:|---:|---|---:|
| Start 1 | `0` | `20` | `24,300` | `20×$3/M + 24,300×$6/M` | `$0.14586` |
| Starts 2–7, each | `0` | `20` | `24,300` | same cold-side buckets after the early mismatch | `$0.14586` |
| **Total** | `0` | `140` | `170,100` | `7×$0.14586` | **`$1.02102`** |

The early placement causes `145,800` avoidable rewritten tokens: `6 × 24,300` (`C23`). The cost delta is `$0.83106`. Exact state retains unrounded values; displays may show `$0.14586`, `$0.00735`, `$0.18996`, and `$1.02102`, never `$0.0000`.

A static 20-token hook is a post-attempt alternate choice: first request writes `24,320`, later requests read `24,320`, for `$0.189696`. It is slightly cheaper but fails the behavioral gate because session status is no longer current. Dropping the hook costs `$0.18954` but likewise fails capability evidence. Neither alternate is shown before the first attempt.

## 7. Tape sequence

`TapeRenderer` uses `rowSource: "ledger"` and renders exactly seven rows in this order:

1. `l12-start-1` — **START 1 · 09:00**
2. `l12-start-2` — **START 2 · 09:05**
3. `l12-start-3` — **START 3 · 09:10**
4. `l12-start-4` — **START 4 · 09:15**
5. `l12-start-5` — **START 5 · 09:20**
6. `l12-start-6` — **START 6 · 09:25**
7. `l12-start-7` — **START 7 · 09:30**

Reveal groups:

- `l12-cold`: Start 1; revealed when the run begins.
- `l12-boundary`: Start 2; gated by `l12-start2-suffix`.
- `l12-propagation`: Starts 3–7; revealed sequentially only after Start 2’s prediction reveal.

For the harmful arrangement, each repeated row animates in this order:

`20-token input spark → first-mismatch marker → red sweep over 24,300-token write segment`

For the reference arrangement:

`24,300-token blue read segment → 20-token red input tick at the tail`

Aha frame: `ahaRequestId: "l12-start-2"`. Both rows pause with identical 20-token hook ticks while the later 24,300 tokens differ in tier. Hover copy is:

- Harmful: **“20 changed here · 24,300 after it could not be reused.”**
- Reference: **“24,300 matched first · 20 fresh tokens arrived after the boundary.”**

## 8. Prediction prompts

### Required prediction before Start 2

Question:

**“Start 2 arrives with a new status line. What happens to the large block after it?”**

Options:

- `all-reused`: **“It is reused; only the 20 changed tokens matter.”**
- `all-rewritten`: **“It is rewritten because the earlier block changed.”**
- `depends-on-position`: **“It depends on which side of the boundary the changing block sits.”**

The widget does not mark, hint at, or visually privilege an option. `REVEAL_PREDICTION` cannot dispatch before `COMMIT_PREDICTION`. Correct option: `depends-on-position`.

### Transfer prediction after the first successful reveal

Question:

**“A 2,000-token report changes every start. Where would you place it?”**

Options:

- `front`: **“Before the stable project context.”**
- `tail`: **“After the stable cached boundary.”**

Correct option: `tail`. This prompt precedes its explanatory transfer overlay and supplies the `transferRequirement` evidence if enabled; it does not alter the seven priced requests.

## 9. Fail-state

Decisive event: Start 2’s changed `PB_CURRENT` is resolved before the stable suffix, producing `firstMismatchBlockId: "l12-status"` and `invalidatedSuffixTok: 24,300`.

The tape continues its committed seven-start causal animation, then freezes with Start 2 pinned and Starts 3–7 aligned beneath it.

Exact message:

**“The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.”**

Secondary line:

**“The block was small. Its position made the damage large.”**

`UI_REWIND_CONTROL` label: **“Rewind to arrangement”**.

It dispatches `REWIND_TO_CHECKPOINT { checkpointId: "before-l12-run" }`, preserves the player’s arrangement for editing, clears the seven attempt-local ledger rows and prediction result by deterministic replay, restores the pre-run wallet/cache/clock, and focuses `l12-status`. The player does not replay the cold-open.

Static or dropped-hook attempts do not freeze: they finish, explain the freshness/capability tradeoff, and fail the behavioral gate locally with **“Cheap, but the session no longer has current status.”**

## 10. Gate & stars

Pass requires all of the following behavioral evidence:

- a prediction was committed before Start 2’s reveal;
- `l12-status` remained dynamic and enabled;
- `l12-status` was ordered after the stable cache boundary;
- Starts 2–7 each recorded exactly `readTok=24,300`, `writeTok=0`, and `inputTok=20`;
- `l12-position-rule` was acknowledged only after causal evidence appeared.

Budget alone cannot pass the level.

Stars:

- **1 star — Boundary found:** pass the behavioral gate.
- **2 stars — No poisoned replay:** pass with at most one completed harmful early-hook run.
- **3 stars — Fresh and reusable:** on the first economic run, retain the dynamic status hook after the boundary and produce the `$0.18996` reference total with six complete 24,300-token reads.

Making the hook static or dropping it can beat the three-star dollar total but earns no pass: the taught behavior is preserving function while controlling position.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First drag of `l12-status` | **“Blocks are sent left to right.”** |
| Prediction committed | **“Prediction locked. Opening Start 1…”** |
| Start 1 completes | **“START 1 · 24,300 stable tokens saved · WRITE $0.14580”** |
| Harmful Start 2 mismatch marker appears | **“First mismatch: STATUS changed here.”** |
| Harmful sweep reaches suffix end | **“Everything after it missed · 24,300 rewritten.”** |
| Reference Start 2 completes | **“Stable front matched · 24,300 reused · READ $0.00729”** |
| Static attempt completes | **“Reusable, but stale: every start still says 09:00.”** |
| Dropped attempt completes | **“Smaller, but blind: current project status is missing.”** |
| Successful Start 7 completes | **“Seven starts. One cold write.”** |
| Explanation acknowledged | **“Position beats size when an early change controls the suffix.”** |

Toast component prices may isolate the named segment; the ledger and wallet always use the full request cost, including the 20-token fresh input.

## 12. QA gate

Real-browser click-through must assert:

1. The first draggable control is usable by `2s` `[ESTIMATE]`.
2. No pre-play copy, color, animation, option styling, DOM label, or accessibility description says that the hook belongs after the boundary.
3. The seven-start button remains disabled until `l12-start2-suffix` is committed.
4. Drag, keyboard reorder, static, and drop controls dispatch only their specified reducer actions.
5. The harmful layout resolves Starts 2–7 to `readTok=0`, `inputTok=20`, `writeTok=24,300`.
6. The reference layout resolves Starts 2–7 to `readTok=24,300`, `inputTok=20`, `writeTok=0`.
7. Reference total is exactly `$0.18996`; anti-pattern total is exactly `$1.02102` before display rounding.
8. Every request produces one `LedgerRow`; the tape contains exactly seven rows and no decorative row is priced.
9. Every row cost is greater than zero; no positive segment or request displays as `$0.0000`.
10. Harmful propagation originates at the 20-token hook and crosses the 24,300-token suffix on all six repeated starts.
11. Failure freezes economic input, pins Start 2 as the first causal mismatch, and exposes only **“Rewind to arrangement.”**
12. Rewind restores the exact pre-run wallet, cache, clock, and ledger while retaining attempt count.
13. A static hook and a dropped hook remain playable but cannot satisfy the behavioral gate.
14. Counterfactual prices and placement labels remain absent until an attempt-relevant run completes.
15. `UI_HOVER_PRICE_CALCULATOR` values equal `PRICE_REQUEST`; segment token sums equal each request’s input-side buckets.
16. Cache liveness remains valid throughout the fixture under the 60-minute main TTL (`C1`).
17. The reference configuration is winnable and receives three stars; `antiCfg` fails the intended gate.
18. Reduced motion replaces the suffix sweep with an instantaneous mismatch marker plus six aligned invalidation highlights, preserving ordering and evidence.
19. Keyboard and screen-reader output announces block order, boundary position, prediction lock, first mismatch, invalidated token count, and rewind focus.
20. The post-reveal transfer prompt cannot be answered before the seven-start evidence is visible.

## 13. Reference-bar justification

The screen begins with a tactile object, not an explanation: seven closed starts and one suspiciously small draggable status card. The player first commits an arrangement, then predicts the consequence, then watches the answer emerge from the first mismatch and propagate across six later starts.

The surprise is protected because neither the objective nor the opening stack names the correct position. Failure is immediate in causal terms, visually accumulative across the promised seven starts, and rewinds directly to the arrangement. The successful run preserves useful current status rather than rewarding indiscriminate deletion. Only after the player has generated evidence does the counterfactual expose that the unchanged 20-token size produced an `$0.83106` difference solely through position.
