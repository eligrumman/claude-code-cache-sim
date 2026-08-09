# Level 4 — The Five-Minute Race

## 1. Identity

- **id:** `04-five-minute-race`
- **title:** The Five-Minute Race
- **tier:** `1`
- **objective:** “Eight jobs are queued. Choose how many launch together, then beat the clock.”
- **concept.id:** `shared-subagent-window`
- **privateDesignerSummary:** Short-lived shared subagent prefixes make serial-wave count valuable, while coordinating too many simultaneous jobs has its own priced cost.
- **prerequisiteConceptIds:** `["cache-expiry", "prefix-reuse"]`
- **postRevealRule:** “Fewer waves preserve more shared-prefix reuse, but launching everything together can create expensive coordination.”
- **unlock:** `width`

The five-minute expiry, the cheapest width, and the direction of the tradeoff remain hidden until the player completes a priced attempt.

## 2. Objects used

- `Request`
- `PricedRequest`
- `PrefixStack`
- `CacheEntry`
- `SUBAGENT_CONTEXT`
- `MAIN_SESSION_CONTEXT`
- `CACHE_TIER_5M`
- `Clock`
- `Checkpoint`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Budget`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`

## 3. Cold-open / narrative

No instruction card.

| Time | Beat |
|---:|---|
| `0.0s` `[ESTIMATE]` | Eight face-down job cards snap into a queue beneath: **“Eight jobs. One shared setup. The clock starts when the first job leaves.”** |
| `0.4s` `[ESTIMATE]` | An undrained `UI_TTL_DRAIN_BAR` appears with `5:00`; it is not yet labeled “TTL.” |
| `0.8s` `[ESTIMATE]` | The width control appears: **“Launch together: 1 2 3 4 5 6 7 8”**. Default `1`; keyboard focus lands on it. |
| `1.2s` `[ESTIMATE]` | Secondary copy: **“Larger groups leave fewer groups waiting. Every group also needs a coordinator.”** This exposes the existence of a tradeoff without revealing its direction or optimum. |
| `≤2.0s` `[ESTIMATE]` | The player can change width. Cards regroup into deterministic waves; no requests, colors, prices, or wallet mutations occur. |
| first width change | Primary button becomes **“Lock prediction”**. |

Pre-play UI must not show the cheapest width, reference tape, cold-write count, coordinator formula, or any “wider is cheaper”/“narrower is cheaper” claim.

## 4. Exact event sequence

The authored slow-race scenario uses six simulated minutes between wave starts. Because cache reads refresh idle TTL, each wave may reuse within itself, but the next wave begins after the five-minute entry has genuinely expired. All dollar symbols below resolve only through the single authoritative walkthrough in §6.

1. **`e1-enter` — Enter the level**
   - Trigger: route opens.
   - Action: `ENTER_LEVEL { type: "ENTER_LEVEL", levelId: "04-five-minute-race" }`.
   - Mutates: `ReducerState`, `Clock`, `Wallet`, `Budget`, queued `UnitInstance`s, nine `ExecutionContext`s, and seeded `PrefixStack`s.
   - Numbers: eight jobs `[FICTION]`; `BASE_IDENTICAL=26,237 tok` (`C10`); subagent TTL `5m` (`C1`).

2. **`e2-checkpoint` — Preserve the launch decision**
   - Trigger: first width interaction.
   - Action: `CREATE_CHECKPOINT { type: "CREATE_CHECKPOINT", checkpointId: "L4-before-width", reason: "decision" }`.
   - Mutates: `checkpoints`.
   - Economic effect: none.

3. **`e3-set-width` — Group the queue**
   - Trigger: player selects width `w`.
   - Action: `SET_FANOUT_WIDTH { type: "SET_FANOUT_WIDTH", width: w }`.
   - Mutates: `cfg.width` and deterministic wave grouping.
   - Numbers: `w ∈ {1…8}`; wave sizes are the ordered partition of eight jobs into groups of at most `w`; `waveCount=ceil(8/w)`.
   - No request is created and no price is previewed.

4. **`e4-commit-run-prediction` — Predict before the tape**
   - Trigger: player presses **“Lock prediction.”**
   - Actions:
     1. `OPEN_PREDICTION { type: "OPEN_PREDICTION", promptId: "L4-last-wave-color" }`
     2. `SELECT_PREDICTION { type: "SELECT_PREDICTION", promptId: "L4-last-wave-color", optionId }`
     3. `COMMIT_PREDICTION { type: "COMMIT_PREDICTION", promptId: "L4-last-wave-color" }`
   - Mutates: `phase`, `prediction`.
   - Economic effect: none. Launch is unavailable until commitment.

5. **`e5-send-coordinator` — Price a wave’s coordination**
   - Trigger: a committed launch reaches the start of a wave containing `s` jobs.
   - Action: `SEND_REQUEST { type: "SEND_REQUEST", request: coordinatorRequest }`.
   - Request:
     - context: `MAIN_SESSION_CONTEXT` `"L4-coordinator"`;
     - `cachePolicy="bypass"`;
     - `freshInputTok=COORD_INPUT_TOK`;
     - `expectedOutputTok=COORD_OUT(s)`;
     - `sentAtMin=waveOrdinal × WAVE_GAP_MIN`.
   - Mutates: one `Request`, one `LedgerRow`, `lastRequests`, `Wallet`, and tape payload.
   - The request is a real width cost. Its output grows superlinearly with simultaneous group size and is priced with the `outTok × 5` model (`C1`, `C3`).

6. **`e6-send-wave-jobs` — Send the jobs**
   - Trigger: the coordinator request resolves.
   - Action: one ordered `SEND_REQUEST` per job in the wave.
   - First job in every wave:
     - `readTok=0`;
     - `writeTok=BASE_IDENTICAL`;
     - `inputTok=WORK_IN`;
     - `outTok=WORK_OUT`;
     - `writeTier="5m"`.
   - Remaining jobs at the same `sentAtMin`:
     - `readTok=BASE_IDENTICAL`;
     - `writeTok=0`;
     - `inputTok=WORK_IN`;
     - `outTok=WORK_OUT`.
   - Mutates: each job’s `Request`, shared-prefix `CacheEntry`, one `LedgerRow` per request, `Wallet`, counts, and tape.
   - Sources: identical spawn prefix (`C10`), calibrated job workload (`C28`), Sonnet pricing and output rate (`C1`, `C3`).

7. **`e7-advance-wave` — Let the next group wait**
   - Trigger: queued jobs remain after a wave.
   - Action: `ADVANCE { type: "ADVANCE", min: WAVE_GAP_MIN }`.
   - Mutates: `Clock` and derived `UI_TTL_DRAIN_BAR` state only.
   - The previous wave’s last touch occurred at its start. At the next start, idle time exceeds the `5m` TTL, so the prior shared entry is expired under `C1`/`C12`.
   - Repeat `e5`–`e7` until all eight jobs complete.

8. **`e8-reveal-actual` — Reveal the player’s run**
   - Trigger: eighth job resolves.
   - Action: `REVEAL_PREDICTION { type: "REVEAL_PREDICTION", promptId: "L4-last-wave-color", correctOptionId: resolvedLastWaveOption }`.
   - Mutates: `prediction.revealed`, `phase`, completed-event evidence.
   - The tape now shows every coordinator, cold write, within-wave read, input, and output segment.
   - Prediction correctness changes no wallet, score, star, freeze, or gate field.

9. **`e9-open-reference-prediction` — Predict the comparison**
   - Trigger: the player requests **“Compare another grouping.”**
   - Action: `OPEN_PREDICTION { type: "OPEN_PREDICTION", promptId: "L4-width4-cost" }`.
   - Preconditions: `e8-reveal-actual` completed.
   - Mutates: second prediction state only.

10. **`e10-commit-reference-prediction` — Commit before comparison**
    - Trigger: player selects an option.
    - Actions:
      1. `SELECT_PREDICTION { type: "SELECT_PREDICTION", promptId: "L4-width4-cost", optionId }`
      2. `COMMIT_PREDICTION { type: "COMMIT_PREDICTION", promptId: "L4-width4-cost" }`
    - Economic effect: none.

11. **`e11-reveal-reference` — Reveal width 4**
    - Trigger: second prediction is committed.
    - Actions:
      1. `REQUEST_COUNTERFACTUAL { type: "REQUEST_COUNTERFACTUAL", comparisonId: "L4-actual-vs-width4" }`
      2. `REVEAL_COUNTERFACTUAL { type: "REVEAL_COUNTERFACTUAL", comparisonId: "L4-actual-vs-width4" }`
      3. `REVEAL_PREDICTION { type: "REVEAL_PREDICTION", promptId: "L4-width4-cost", correctOptionId: resolvedReferenceOption }`
    - Mutates: comparison and prediction evidence only; actual ledger and wallet remain unchanged.
    - Counterfactual uses the same seed and workload with `cfg.width=4`.
    - Aha pairing: the player’s Job 2 cold row at width `1` is paired with width 4’s Job 2 warm row; coordinator-output rows remain alongside the pair so “maximum width” is not presented as free.

12. **`e12-freeze-too-narrow` — Freeze the visible multiple**
    - Trigger: `e11-reveal-reference` completes and the attempted width was `1`.
    - Action:
      ```ts
      {
        type: "FREEZE_FAILURE",
        failure: {
          failureId: "L4-eight-cold-waves",
          causeCode: "TOO_MANY_COLD_WAVES",
          message:
            "Eight one-job waves bought eight coordinators and rewrote the shared prefix eight times.",
          checkpointId: "L4-before-width"
        }
      }
      ```
    - Mutates: `Clock.frozen`, `frozenFailure`.
    - The actual and valid-alternative totals, fourfold cold-write multiple, and decisive final late-wave row are already visible.
    - No failure predicate inspects either prediction.

13. **`e13-explain` — Demonstrate understanding**
    - Trigger: a non-frozen attempt has revealed `e11-reveal-reference`.
    - Action: `ACK_EXPLANATION { type: "ACK_EXPLANATION", explanationId }`.
    - Mutates: `acknowledgedExplanationIds`.
    - Correct option: `"L4-balance-waves-and-coordination"`.
    - This post-evidence explanation choice, not either pre-reveal prediction, is the behavioral gate action.

14. **`e14-rewind` — Regroup after failure**
    - Trigger: player presses **“Regroup the jobs.”**
    - Action: `REWIND_TO_CHECKPOINT { type: "REWIND_TO_CHECKPOINT", checkpointId: "L4-before-width" }`.
    - Mutates: deterministic attempt branch, queue, clock, cache, ledger, wallet, predictions, and failure state.
    - Restores the moment before width selection without replaying the cold-open.

15. **`e15-complete` — Complete the attempt**
    - Trigger: correct explanation acknowledged on a non-frozen run.
    - Action: `COMPLETE_ATTEMPT { type: "COMPLETE_ATTEMPT" }`.
    - Mutates: result and campaign progression.
    - `pass(st)` evaluates only the post-evidence behavior and completed economic run.

## 5. Level data

Level-specific calibrated constants:

```ts
const L4_SEED = 405;                    // [FICTION]
const L4_BUDGET_USD = 10;               // [FICTION]
const L4_CLOCK_CAP_MIN = 48;            // [FICTION]
const L4_JOB_COUNT = 8;                 // [FICTION]
const WAVE_GAP_MIN = 6;                 // [FICTION]
const COORD_INPUT_TOK = 5_000;          // [FICTION]
const COORD_OUT_BASE_TOK = 29_000;      // [FICTION]
const COORD_OUT_QUAD_TOK = 3_000;       // [FICTION]

const COORD_OUT = (waveSize: number) =>
  COORD_OUT_BASE_TOK
  + COORD_OUT_QUAD_TOK * (waveSize - 1) ** 2;
```

The quadratic coordinator fixture represents pairwise merge/reconciliation work. It is deliberately calibrated fiction, but every produced token is a real `outTok` bucket priced by `PRICE_REQUEST`.

Scenario seeds:

- Units `job1` through `job8`: `kind="TASK"`, `ticket=1`, `deps=[]`, `hours=1` `[FICTION]`, `workIn=WORK_IN`, `outTok=WORK_OUT`, `fan=true`, `scripted=true`.
- Contexts `sub1` through `sub8`: eight `SubagentContext` seeds with distinct `cacheNamespace`s, identical prefix fixtures, and `sharedPrefixPoolId="L4-shared-spawn"`.
- Context `"L4-coordinator"`: one `MainSessionContext`; its authored coordinator requests use `cachePolicy="bypass"`.
- Each subagent `PrefixStackSeed` resolves the measured `BASE_IDENTICAL=26,237`-token spawn prefix (`C10`); the level does not redefine its blocks.

```ts
const level04: LevelDef = {
  id: "04-five-minute-race",
  tier: 1,
  title: "The Five-Minute Race",
  objective:
    "Eight jobs are queued. Choose how many launch together, then beat the clock.",
  concept: {
    id: "shared-subagent-window",
    privateDesignerSummary:
      "Short-lived shared subagent prefixes make serial-wave count valuable, while coordinating too many simultaneous jobs has its own priced cost.",
    postRevealRule:
      "Fewer waves preserve more shared-prefix reuse, but launching everything together can create expensive coordination."
  },
  prerequisiteConceptIds: ["cache-expiry", "prefix-reuse"],

  unlocks: "width",
  introducedControls: ["width"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "prompts",
    "oneHourFlag",
    "keepWarm",
    "keepWarmMin",
    "hook",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp"
  ],

  scope: "session",
  seed: L4_SEED,
  budgetUsd: L4_BUDGET_USD,
  clockCapMin: L4_CLOCK_CAP_MIN,
  cfgOverride: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "identical",
    width: 1,
    oneHourFlag: false
  },
  scenario: "fanout8-slow",
  scenarioData: {
    units: L4_UNITS,
    contexts: L4_CONTEXTS,
    prefixStacks: L4_PREFIX_STACKS,
    allowedCfg: {
      width: [1, 2, 3, 4, 5, 6, 7, 8]
    },
    estimates: [
      { label: "seed", value: L4_SEED, tag: "[FICTION]" },
      { label: "budget USD", value: L4_BUDGET_USD, tag: "[FICTION]" },
      { label: "clock cap minutes", value: L4_CLOCK_CAP_MIN, tag: "[FICTION]" },
      { label: "job count", value: L4_JOB_COUNT, tag: "[FICTION]" },
      { label: "wave gap minutes", value: WAVE_GAP_MIN, tag: "[FICTION]" },
      { label: "coordinator input tokens", value: COORD_INPUT_TOK, tag: "[FICTION]" },
      { label: "coordinator output base", value: COORD_OUT_BASE_TOK, tag: "[FICTION]" },
      { label: "coordinator quadratic output coefficient", value: COORD_OUT_QUAD_TOK, tag: "[FICTION]" }
    ]
  },

  coldOpen: L4_COLD_OPEN,
  sequence: L4_SEQUENCE,
  predictions: L4_PREDICTIONS,
  toasts: L4_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "fiveMinuteBandUsd",
    cite: "C1, C3, C10",
    line:
      "Serial waves can repeatedly rebuild a short-lived shared prefix; unlimited concurrency is not free either."
  },
  failureRules: [L4_EIGHT_COLD_WAVES_FAILURE],
  checkpoints: [
    {
      id: "L4-before-width",
      createBeforeEventId: "e3-set-width",
      reason: "decision",
      resumeLabel: "Regroup the jobs"
    }
  ],

  gate: L4_GATE,
  pass: passLevel04,
  star2: L4_STAR_2,
  star3: L4_STAR_3,

  referenceCfg: { width: 4 },
  antiCfg: { width: 1 },
  counterfactuals: [
    {
      id: "L4-actual-vs-width4",
      unlockAfterEventId: "e8-reveal-actual",
      kind: "reference",
      cfg: { width: 4 },
      comparisonQuestion:
        "How does four-at-a-time change cold waves and coordination?",
      revealCopy:
        "Four-at-a-time needs two cold waves without paying the largest coordinator output."
    }
  ],

  tape: L4_TAPE,
  result: L4_RESULT,
  vocabulary: L4_VOCABULARY,
  qa: L4_QA
};
```

Gate predicates:

```ts
const L4_GATE: GateDef = {
  predicateId: "L4-post-evidence-causal-explanation",
  evidenceRevealEventIds: [
    "e8-reveal-actual",
    "e11-reveal-reference"
  ],
  postEvidenceActionRequirements: [
    {
      id: "L4-correct-explanation-action",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "e11-reveal-reference",
      match: {
        explanationId: "L4-balance-waves-and-coordination"
      }
    }
  ],
  behavioralRequirements: [
    {
      id: "L4-work-completed",
      kind: "event-completed",
      eventId: "e8-reveal-actual"
    },
    {
      id: "L4-not-frozen",
      kind: "compare",
      path: "frozenFailure",
      op: "eq",
      value: null,
      observedAfterEventId: "e11-reveal-reference"
    },
    {
      id: "L4-rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "L4-balance-waves-and-coordination",
      observedAfterEventId: "e11-reveal-reference"
    }
  ],
  explanationRequirement: {
    id: "L4-explanation-required",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "L4-balance-waves-and-coordination",
    observedAfterEventId: "e11-reveal-reference"
  }
};
```

`passLevel04` is pure and returns pass only when all `L4_GATE` predicates hold. Prediction option, correctness, and commitment are not inspected.

## 6. Pricing walkthrough

All worker requests use Sonnet (`C3`), the measured identical shared spawn prefix (`C10`), the calibrated worker input/output fixture (`C28`), and `CACHE_TIER_5M` (`C1`).

Named worker prices:

```text
P_COLD_JOB =
  26,237 write × 1.25 × $3/M
+  6,000 input × 1    × $3/M
+ 44,000 output × 5   × $3/M
= $0.77638875

P_WARM_JOB =
  26,237 read  × 0.1 × $3/M
+  6,000 input × 1   × $3/M
+ 44,000 output × 5  × $3/M
= $0.68587110

P_1C7W = P_COLD_JOB + 7 × P_WARM_JOB
       = $5.57748645

P_2C6W = 2 × P_COLD_JOB + 6 × P_WARM_JOB
       = $5.66800410
```

Coordinator request for wave size `s`:

```text
inputTok = 5,000
outTok   = 29,000 + 3,000 × (s − 1)²

P_COORD(s) =
  inputTok × $3/M
+ outTok   × $15/M
```

The `$15/M` output rate is Sonnet’s `5x` output multiplier (`C1`, `C3`). Coordinator token counts are `[FICTION]`; their price is not fictional once passed to `PRICE_REQUEST`.

This is the level’s only authoritative price table:

| Width | Wave sizes | Requests | Cold writes | Warm reads | Coordinator subtotal | Full total |
|---:|---|---:|---:|---:|---:|---:|
| `1` | `1+1+1+1+1+1+1+1` | `16` | `8` | `0` | `$3.60000000` | `$9.81111000` |
| `2` | `2+2+2+2` | `12` | `4` | `4` | `$1.98000000` | `$7.82903940` |
| `3` | `3+3+2` | `11` | `3` | `5` | `$1.75500000` | `$7.51352175` |
| `4` | `4+4` | `10` | `2` | `6` | `$1.71000000` | `$7.37800410` |
| `5` | `5+3` | `10` | `2` | `6` | `$1.80000000` | `$7.46800410` |
| `6` | `6+2` | `10` | `2` | `6` | `$2.07000000` | `$7.73800410` |
| `7` | `7+1` | `10` | `2` | `6` | `$2.52000000` | `$8.18800410` |
| `8` | `8` | `9` | `1` | `7` | `$2.65500000` | `$8.23248645` |

Authoritative comparison:

```text
width-1 excess = $9.81111000 − $7.37800410
               = $2.43310590

width-1 multiple = $9.81111000 / $7.37800410
                 ≈ 1.33×
```

Width `1` therefore produces four times the reference cold writes and a bill approximately `33%` higher. Width `8` avoids a cold wave but pays enough superlinear coordinator output to remain more expensive than width `4`. The mechanic is a live balance, not a dial-to-maximum.

`PRICE_REQUEST` stores unrounded values. Normal currency labels may round to cents; hover equations retain enough precision to distinguish every positive bucket.

## 7. Tape sequence

`UI_TAPE_RENDERER` consumes the actual `ledger` in request order. Every request creates exactly one row. Counterfactual rows remain in `UI_COUNTERFACTUAL_OVERLAY` and never replace the actual ledger.

For reference width `4`, the exact tape order is:

1. `L4-C1`: **Coordinator · Wave 1 · 0:00** — `input COORD_INPUT_TOK | output COORD_OUT(4)`.
2. `L4-J1`: **Job 1 · 0:00** — `write BASE_IDENTICAL | input WORK_IN | output WORK_OUT`.
3. `L4-J2`: **Job 2 · 0:00** — `read BASE_IDENTICAL | input WORK_IN | output WORK_OUT`.
4. `L4-J3`: **Job 3 · 0:00** — same warm worker buckets.
5. `L4-J4`: **Job 4 · 0:00** — same warm worker buckets.
6. `L4-C2`: **Coordinator · Wave 2 · 6:00** — `input COORD_INPUT_TOK | output COORD_OUT(4)`.
7. `L4-J5`: **Job 5 · 6:00** — cold worker buckets.
8. `L4-J6`: **Job 6 · 6:00** — warm worker buckets.
9. `L4-J7`: **Job 7 · 6:00** — warm worker buckets.
10. `L4-J8`: **Job 8 · 6:00** — warm worker buckets.

For width `1`, the exact pattern is eight repetitions of:

1. coordinator row for wave size `1`;
2. one cold worker row;
3. `ADVANCE` before the next repetition, except after Job 8.

The width-1 tape therefore contains sixteen rows and no warm worker row.

### Aha frame

At `e11-reveal-reference`, pair:

- actual width-1 `L4-J2` at `6:00`: cold red write;
- reference width-4 `L4-J2` at `0:00`: warm blue read.

Hold the paired outline for `700ms` `[ESTIMATE]`, then show:

**“Same job. Same setup. Earlier wave changed a rewrite into a read.”**

Keep the coordinator rows visible beside the pair and follow with:

**“But the widest group asks its coordinator to merge more branches.”**

The `UI_TAPE_RENDERER` canonical visual-weight formula is binding: row length is proportional to authoritative USD, and segment width includes `readTok`, `inputTok`, `writeTok`, and `outTok`. In particular, coordinator violet output uses `outTok × 5`, and worker violet output remains the dominant worker-row segment (`C1`, `C3`, `C28`). Hiding an output label before its toast may not remove its visual weight.

```ts
const L4_TAPE: TapeSpec = {
  rowSource: "ledger",
  labels: L4_TAPE_LABELS,
  revealGroups: [
    {
      id: "L4-actual-run",
      requestIds: L4_ACTUAL_REQUEST_IDS,
      gatedByPredictionId: "L4-last-wave-color"
    }
  ],
  ahaRequestId: "L4-J2-reference",
  hoverEnabled: true,
  explainOutputPricingFromEventId: "e5-send-coordinator"
};
```

## 8. Prediction prompts

### `L4-last-wave-color`

**Question:** “When the last wave reaches the wire, what happens to its shared setup?”

- `all-blue` — “Every job reads it”
- `red-then-blue` — “The first writes it; its wave-mates read it”
- `all-red` — “Every job writes it”

Resolved correct option:

- singleton final wave: `all-red`;
- final wave with at least two jobs: `red-then-blue`.

No option is styled as correct before `e8-reveal-actual`. A wrong answer changes evidence copy only.

### `L4-width4-cost`

Shown only after the actual attempt completes and before the reference counterfactual appears.

**Question:** “What will four-at-a-time do to the total compared with your run?”

- `lower` — “Lower total”
- `same` — “The same total”
- `higher` — “Higher total”

Resolved correct option is `same` only when the attempted width was `4`; otherwise it is `lower`.

Reveal copy:

**“Four-at-a-time paid for two cold waves and two moderate coordinators. Narrower runs bought more waves; wider runs bought heavier coordination.”**

Prediction selection, commitment, and correctness are excluded from gates, stars, wallet mutations, and failure predicates.

## 9. Fail-state

```ts
const L4_EIGHT_COLD_WAVES_FAILURE: FailureRuleDef = {
  id: "L4-eight-cold-waves",
  predicate: {
    id: "L4-width-one-after-reference",
    kind: "all",
    predicates: [
      {
        id: "L4-width-is-one",
        kind: "compare",
        path: "cfg.width",
        op: "eq",
        value: 1
      },
      {
        id: "L4-reference-visible",
        kind: "event-completed",
        eventId: "e11-reveal-reference"
      }
    ]
  },
  decisiveEventId: "e11-reveal-reference",
  causeCode: "TOO_MANY_COLD_WAVES",
  message:
    "Eight one-job waves bought eight coordinators and rewrote the shared prefix eight times.",
  checkpointId: "L4-before-width",
  highlightObjectIds: [
    "L4-J8",
    "L4-shared-spawn",
    "L4-width1-cold-write-stack",
    "L4-actual-vs-width4"
  ],
  actualUsd: L4_PRICE.width1.totalUsd,
  validAlternativeUsd: L4_PRICE.width4.totalUsd
};
```

- **Decisive frame:** actual width-1 tape and width-4 reference are simultaneously visible after a completed attempt.
- **Economic truth:** `actualUsd > validAlternativeUsd`; the actual route shows eight cold writes versus two and a `1.33×` total.
- **Supporting line:** **“The gap between waves exceeded the five-minute idle lifetime every time.”**
- **Frozen controls:** clock, width, launch, and all economic actions.
- **Available control:** `UI_REWIND_CONTROL`, labeled **“Regroup the jobs.”**
- **Rewind target:** `L4-before-width`.
- **Restored state:** original wallet, empty ledger, queued jobs, `clockMin=0`, no cache entry, no prediction, and no failure. The cold-open animation is not replayed.
- **Reachability:** `antiCfg={width:1}` deterministically reaches this freeze.
- Other non-reference widths may finish and receive lower stars; they are not frozen merely for being non-optimal.

## 10. Gate & stars

Passing requires:

- a completed eight-job run;
- no active `frozenFailure`;
- both evidence reveals completed;
- after `e11-reveal-reference`, the player chooses the explanation:
  **“Balance the number of cold waves against the coordinator work inside each wave.”**

The gate does not inspect prediction option, prediction correctness, or budget.

- **1 star:** `L4_GATE` passes.
- **2 stars:** `L4_GATE` passes and attempted width is within `3…5`.
- **3 stars:** `L4_GATE` passes and attempted width is `4`.

Canonical star predicates:

```ts
const L4_STAR_2: StarDef = {
  label: "Balanced launch",
  predicate: {
    id: "L4-star2-all",
    kind: "all",
    predicates: [
      {
        id: "L4-star2-explained",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "L4-balance-waves-and-coordination",
        observedAfterEventId: "e11-reveal-reference"
      },
      {
        id: "L4-star2-min-width",
        kind: "compare",
        path: "cfg.width",
        op: "gte",
        value: 3
      },
      {
        id: "L4-star2-max-width",
        kind: "compare",
        path: "cfg.width",
        op: "lte",
        value: 5
      }
    ]
  },
  reason:
    "The launch avoided both repeated narrow waves and the largest coordination bill."
};

const L4_STAR_3: StarDef = {
  label: "Cheapest balance",
  predicate: {
    id: "L4-star3-all",
    kind: "all",
    predicates: [
      {
        id: "L4-star3-explained",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "L4-balance-waves-and-coordination",
        observedAfterEventId: "e11-reveal-reference"
      },
      {
        id: "L4-star3-width",
        kind: "compare",
        path: "cfg.width",
        op: "eq",
        value: 4
      }
    ]
  },
  reason:
    "Four-at-a-time produced the lowest deterministic total for this queue."
};
```

Result values:

```ts
const L4_RESULT: ResultSpec = {
  headlinePass: "You found the balance.",
  headlineFail: "The queue kept rebuilding its setup.",
  evidenceLines: [
    "Waves: {waveCount}",
    "Cold writes: {coldWriteCount}",
    "Warm reads: {readCount}",
    "Coordinator output: {coordinatorOutTok}",
    "Total: {spentUsd}"
  ],
  comparisonIds: ["L4-actual-vs-width4"],
  continueLabel: "Next race",
  retryLabel: "Try another grouping"
};
```

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `L4-coordinator-output` | First coordinator row resolves at `e5-send-coordinator` | **“Coordinator output · merging this wave’s jobs · priced at output rate.”** |
| `L4-shared-prefix` | First worker write resolves | **“Shared prefix saved · 26,237 tokens · five-minute idle lifetime.”** |
| `L4-first-read` | First same-wave worker reads the shared entry | **“Same setup, same wave · cache read.”** |
| `L4-wave-wait` | First `ADVANCE` resolves | **“The next wave waits six minutes.”** |
| `L4-expired` | First later-wave cold write resolves | **“Expired between waves · the shared prefix must be written again.”** |
| `L4-aha` | `e11-reveal-reference` pairs Job 2 | **“Earlier wave: rewrite became read. Wider wave: coordinator grew.”** |

`L4-expired` is a cause toast; it remains visible during the failure freeze. Other toasts deduplicate per attempt according to `just-in-time-toast`.

Just-in-time vocabulary:

```ts
const L4_VOCABULARY: VocabularyDef[] = [
  {
    term: "coordinator output",
    definition:
      "Generated tokens used to reconcile the jobs launched in one wave.",
    firstNeededEventId: "e5-send-coordinator",
    toastId: "L4-coordinator-output"
  },
  {
    term: "shared prefix",
    definition:
      "The identical spawn setup that jobs in the same live pool can reuse.",
    firstNeededEventId: "e6-send-wave-jobs",
    toastId: "L4-shared-prefix"
  }
];
```

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. The width control is interactive by `2s` `[ESTIMATE]`.
2. Pre-play UI contains no reference total, cheapest-width claim, cold-write count, coordinator formula, or safe-width answer.
3. `ENTER_LEVEL` uses the slug `04-five-minute-race`.
4. `concept.id` is `shared-subagent-window`; prerequisites are exactly `["cache-expiry", "prefix-reuse"]`.
5. Changing width dispatches only `SET_FANOUT_WIDTH`; it creates no ledger row and changes no wallet value.
6. Launch cannot execute until `L4-last-wave-color` is committed.
7. A wrong prediction changes no score, star, wallet, freeze, gate, or result value.
8. Six minutes between waves expires a five-minute entry from its last touch; no fixed original-expiry shortcut is used.
9. Within one wave, the first worker writes `BASE_IDENTICAL` and every later simultaneous worker reads it.
10. Each wave produces one real coordinator request whose `outTok` matches `COORD_OUT(waveSize)`.
11. Every request creates exactly one `LedgerRow` and exactly one tape row.
12. Width `4` produces ten rows, two cold worker writes, six warm worker reads, and passes after the correct post-evidence explanation.
13. Width `8` has one cold worker write but costs more than width `4` because its coordinator output is larger.
14. Width `1` produces sixteen rows, eight cold worker writes, and reaches `L4-eight-cold-waves`.
15. The width-1 freeze occurs only after the actual and valid-alternative totals are visible.
16. The frozen `actualUsd` is strictly greater than `validAlternativeUsd`.
17. No economic action or Job request can execute while frozen.
18. **“Regroup the jobs”** deterministically restores `L4-before-width`.
19. `referenceCfg={width:4}` passes from `L4_SEED`.
20. `antiCfg={width:1}` fails through the authored, reachable economic freeze.
21. The counterfactual is unavailable before a meaningful attempt completes and before `L4-width4-cost` is committed.
22. `L4_GATE.postEvidenceActionRequirements` observes `ACK_EXPLANATION` after `e11-reveal-reference`.
23. Neither `COMMIT_PREDICTION` nor prediction correctness appears in gate, star, failure, wallet, or `pass(st)` logic.
24. Every worker price and coordinator price matches `PRICE_REQUEST` with `C1`/`C3`.
25. Every positive request cost displays above zero; no positive value renders as `$0.0000`.
26. Every rendered `WireSegment` matches its authoritative ledger bucket.
27. `UI_TAPE_RENDERER` row widths and segment geometry include `outTok`; coordinator output is visibly violet and worker output retains its true visual weight.
28. Static final tape bars preserve colors, segments, and totals without hover.
29. Pointer and keyboard paths dispatch equivalent width, prediction, explanation, counterfactual, and rewind actions.
30. Reduced-motion mode reaches byte-identical reducer, ledger, wallet, gate, and result state.
31. The player can win without undocumented controls.
32. The document exposes one authoritative price table and contains no superseded price branch.

## 13. Reference-bar justification

The screen opens on one tactile act: reshape eight cards into waves. The five-minute clock suggests urgency, while the coordinator card quietly prevents “turn the dial to eight” from becoming a fake choice. The player commits a prediction, then watches their own schedule create cold writes, same-wave reads, and priced coordinator output.

Only after that attempt does width `4` appear as a counterfactual. The paired Job 2 rows convert an abstract TTL rule into a visible red-to-blue change, while the retained coordinator rows reveal why maximum concurrency is not free. A too-narrow run freezes only after the tape proves a fourfold cold-write difference and a `1.33×` bill, so the failure is causal and economically true. The gate then asks for a post-evidence causal explanation rather than rewarding a lucky prediction.

That rhythm—touch, predict, consequence, compare, explain, and locally rewind—protects the surprise while making the single width control feel consequential and playful.
