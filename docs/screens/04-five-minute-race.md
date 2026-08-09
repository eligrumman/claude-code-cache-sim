# Level 4 — The Five-Minute Race

## 1. Identity

- **id:** `04-five-minute-race`
- **title:** The Five-Minute Race
- **tier:** `1`
- **objective:** “Eight jobs are queued. Choose how many launch together, then beat the clock.”
- **concept.id:** `shared-subagent-window`
- **conceptScope:** `{ kind: "single", reusedConceptIds: [] }`
- **concept.solutionVocabulary:** `["cache", "shared prefix", "coordinator", "fan-out", "warm read", "cold write", "four-at-a-time", "width 4", "fewer waves"]`
- **privateDesignerSummary:** Short-lived shared subagent prefixes make serial-wave count valuable, while coordinating too many simultaneous jobs has its own priced cost.
- **prerequisiteConceptIds:** `["cache-expiry", "prefix-reuse"]`
- **postRevealRule:** “Fewer waves preserve more shared-prefix reuse, but launching everything together can create expensive coordination.”
- **unlock:** `width`

The five-minute expiry, coordinator pressure, cheapest width, and direction of the tradeoff remain hidden until priced evidence appears. The title and objective frame the situation without using any registered solution vocabulary.

## 2. Objects used

- `ReducerState`
- `AttemptMetrics`
- `AttemptResult`
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
- `FailureRuleDef`
- `GateDef`
- `StarDef`
- `StatePredicate`
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
| `1.2s` `[ESTIMATE]` | Secondary copy: **“Larger groups leave fewer groups waiting.”** |
| `≤2.0s` `[ESTIMATE]` | The player can change or confirm the width. Cards regroup into deterministic waves; no requests, colors, prices, or wallet mutations occur. |
| first width confirmation | Primary button becomes **“Lock prediction.”** |

The cold open does not mention coordinators or their cost. Pre-play UI must not show the reference tape, cheapest width, cold-write count, coordinator formula, or any “wider is cheaper”/“narrower is cheaper” claim.

## 4. Exact event sequence

The authored scenario uses six simulated minutes between wave starts. A same-wave read refreshes the shared entry, but no work occurs during the six-minute inter-wave gap. The next wave therefore begins after the five-minute idle lifetime has expired. All prices resolve only through `PRICE_REQUEST` and the authoritative walkthrough in §6.

1. **`e1-enter` — Enter the level**
   - Trigger: route opens.
   - Action: `ENTER_LEVEL { type: "ENTER_LEVEL", levelId: "04-five-minute-race" }`.
   - Mutates: `ReducerState`, scalar `wallet`, scalar `budget`, queued `UnitInstance`s, nine `ExecutionContext`s, seeded `PrefixStack`s, `attemptMetrics`, and attempt-local evidence.
   - Numbers: eight jobs `[FICTION]`; `BASE_IDENTICAL=26,237 tok` (`C10`); subagent idle lifetime `5m` (`C1`).

2. **`e2-checkpoint` — Preserve the launch decision**
   - Trigger: first width interaction.
   - Action: `CREATE_CHECKPOINT { type: "CREATE_CHECKPOINT", checkpointId: "L4-before-width", reason: "decision" }`.
   - Mutates: `checkpoints`.
   - Economic effect: none.

3. **`e3-set-width` — Group the queue**
   - Trigger: player selects or confirms width `w`.
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
   - Mutates: `phase` and `prediction`.
   - Economic effect: none. Launch is unavailable until commitment.

5. **`e5-send-coordinator` — Price the current group’s coordination**
   - Trigger: a committed launch reaches a wave containing `s` jobs.
   - Action: `SEND_REQUEST { type: "SEND_REQUEST", request: coordinatorRequest }`.
   - Request:
     - context: `MAIN_SESSION_CONTEXT` `"L4-coordinator"`;
     - `cachePolicy="bypass"`;
     - `freshInputTok=COORD_INPUT_TOK`;
     - `expectedOutputTok=COORD_OUT(s)`;
     - `sentAtMin=waveOrdinal × WAVE_GAP_MIN`.
   - Mutates: one `Request`, one `LedgerRow`, `lastRequests`, scalar `wallet`, `attemptMetrics.spentUsd`, `attemptMetrics.requestCount`, and tape payload.
   - The first occurrence reveals the coordinator card and `L4-coordinator-output` toast. Coordinator output grows superlinearly with group size and is priced at the Sonnet output rate (`C1`, `C3`).

6. **`e6-send-wave-jobs` — Send each job in the current wave**
   - Trigger: the current wave’s coordinator resolves.
   - Action: one ordered `SEND_REQUEST` per job. Each concrete event instance is named `e6-send-L4-J{n}`.
   - First worker in a wave:
     - `readTok=0`;
     - `writeTok=BASE_IDENTICAL`;
     - `inputTok=WORK_IN`;
     - `outTok=WORK_OUT`;
     - `writeTier="5m"`.
   - Remaining workers at the same `sentAtMin`:
     - `readTok=BASE_IDENTICAL`;
     - `writeTok=0`;
     - `inputTok=WORK_IN`;
     - `outTok=WORK_OUT`.
   - Mutates per worker: `Request`, shared-prefix `CacheEntry`, one `LedgerRow`, scalar `wallet`, `attemptMetrics`, `counts`, and tape.
   - Sources: identical spawn prefix (`C10`), calibrated job workload (`C28`), Sonnet rates (`C1`, `C3`).
   - Immediately after each worker `SEND_REQUEST` resolves, the reducer evaluates `L4_FIRST_LATE_COLD_FAILURE`.
   - Under `cfg.width=1`, `e6-send-L4-J2` resolves at `clockMin=6` as the first cold late-wave worker. That actual economic action satisfies the failure rule and immediately dispatches:
     ```ts
     {
       type: "FREEZE_FAILURE",
       failure: {
         failureId: "L4-first-late-cold",
         causeCode: "FIRST_LATE_WAVE_REWRITE",
         message:
           "Job 2 arrived at 6:00—after the shared setup expired—so 26,237 tokens were rewritten instead of read.",
         checkpointId: "L4-before-width"
       }
     }
     ```
   - No later request is dispatched after this freeze.

7. **`e7-advance-wave` — Let the next group wait**
   - Trigger: queued jobs remain after a completed, non-frozen wave.
   - Action: `ADVANCE { type: "ADVANCE", min: WAVE_GAP_MIN }`.
   - Mutates: `clockMin` and derived `UI_TTL_DRAIN_BAR` state only.
   - The previous wave’s final touch occurred at its start. At the next start, idle time is `6m`, exceeding the `5m` lifetime under `C1` and `C12`.
   - Repeat `e5`–`e7` until all eight jobs complete or an actual worker request triggers the freeze.

8. **`e8-reveal-actual` — Reveal the completed player run**
   - Trigger: the eighth job resolves on a non-frozen branch.
   - Action: `REVEAL_PREDICTION { type: "REVEAL_PREDICTION", promptId: "L4-last-wave-color", correctOptionId: resolvedLastWaveOption }`.
   - Mutates: `prediction.revealed`, `phase`, and `completedEventIds`.
   - The tape shows every coordinator, cold write, within-wave read, input, and output segment.
   - A width-1 branch cannot reach this event; its committed prediction remains unrevealed and is cleared by rewind.
   - Prediction correctness changes no wallet, score, star, freeze, or gate field.

9. **`e9-open-reference-prediction` — Predict the comparison**
   - Trigger: after `e8-reveal-actual`, the player requests **“Compare another grouping.”**
   - Action: `OPEN_PREDICTION { type: "OPEN_PREDICTION", promptId: "L4-width4-cost" }`.
   - Mutates: second prediction state only.

10. **`e10-commit-reference-prediction` — Commit before comparison**
    - Trigger: player selects an option.
    - Actions:
      1. `SELECT_PREDICTION { type: "SELECT_PREDICTION", promptId: "L4-width4-cost", optionId }`
      2. `COMMIT_PREDICTION { type: "COMMIT_PREDICTION", promptId: "L4-width4-cost" }`
    - Economic effect: none.

11. **`e11-reveal-reference` — Reveal width 4**
    - Trigger: the second prediction is committed.
    - Actions:
      1. `REQUEST_COUNTERFACTUAL { type: "REQUEST_COUNTERFACTUAL", comparisonId: "L4-actual-vs-width4" }`
      2. `REVEAL_COUNTERFACTUAL { type: "REVEAL_COUNTERFACTUAL", comparisonId: "L4-actual-vs-width4" }`
      3. `REVEAL_PREDICTION { type: "REVEAL_PREDICTION", promptId: "L4-width4-cost", correctOptionId: resolvedReferenceOption }`
    - Mutates: comparison evidence, prediction evidence, and `completedEventIds` only.
    - Actual ledger, wallet, `attemptMetrics`, `clockFrozen`, and `frozenFailure` remain unchanged.
    - The comparison uses the same seed and workload with `cfg.width=4`.
    - This event is strictly informational. It never evaluates a `FailureRuleDef` and never dispatches `FREEZE_FAILURE`.

12. **`e12-explain` — Demonstrate understanding**
    - Trigger: a non-frozen attempt has revealed `e11-reveal-reference`.
    - Action: `ACK_EXPLANATION { type: "ACK_EXPLANATION", explanationId }`.
    - Mutates: `acknowledgedExplanationIds`.
    - Correct option: `"L4-balance-waves-and-coordination"`.
    - This post-evidence action, not either prediction, is the behavioral gate action.

13. **`e13-rewind` — Regroup after failure**
    - Trigger: player presses **“Regroup the jobs.”**
    - Action: `REWIND_TO_CHECKPOINT { type: "REWIND_TO_CHECKPOINT", checkpointId: "L4-before-width" }`.
    - Mutates: deterministic attempt branch, queue, clock, cache, ledger, wallet, prediction, attempt metrics, and failure state.
    - Restores the moment before width selection without replaying the cold open.

14. **`e14-complete` — Complete the attempt**
    - Trigger: the correct explanation is acknowledged on a non-frozen run.
    - Action: `COMPLETE_ATTEMPT { type: "COMPLETE_ATTEMPT" }`.
    - Mutates: `attemptResult` and campaign progression.
    - `attemptResult.spentUsd` is copied from `attemptMetrics.spentUsd`, which equals `budget - wallet`.
    - `passLevel04(st)` inspects only declared `ReducerState` fields.

## 5. Level data

Level-specific calibrated constants:

```ts
const L4_SEED = 405;                    // [FICTION]
const L4_BUDGET_USD = 10;               // [FICTION]
const L4_CLOCK_CAP_MIN = 48;            // [FICTION]
const L4_JOB_COUNT = 8;                 // [FICTION]
const L4_JOB_HOURS = 1;                 // [FICTION]
const WAVE_GAP_MIN = 6;                 // [FICTION]
const COORD_INPUT_TOK = 5_000;          // [FICTION]
const COORD_OUT_BASE_TOK = 29_000;      // [FICTION]
const COORD_OUT_QUAD_TOK = 3_000;       // [FICTION]

const COORD_OUT = (waveSize: number) =>
  COORD_OUT_BASE_TOK
  + COORD_OUT_QUAD_TOK * (waveSize - 1) ** 2;
```

The quadratic coordinator fixture represents merge and reconciliation work. Its token counts are calibrated fiction; every produced token is nevertheless a real `outTok` bucket priced by `PRICE_REQUEST`.

Scenario seeds:

- Units `job1` through `job8`: `kind="TASK"`, `ticket=1`, `deps=[]`, `hours=L4_JOB_HOURS`, `workIn=WORK_IN`, `outTok=WORK_OUT`, `fan=true`, `scripted=true`.
- Contexts `sub1` through `sub8`: eight `SubagentContext` seeds with distinct `cacheNamespace`s, identical prefix fixtures, and `sharedPrefixPoolId="L4-shared-spawn"`.
- Context `"L4-coordinator"`: one `MainSessionContext`; its coordinator requests use `cachePolicy="bypass"`.
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
      "Fewer waves preserve more shared-prefix reuse, but launching everything together can create expensive coordination.",
    solutionVocabulary: [
      "cache",
      "shared prefix",
      "coordinator",
      "fan-out",
      "warm read",
      "cold write",
      "four-at-a-time",
      "width 4",
      "fewer waves"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
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
    fixtures: [
      {
        id: "L4_SEED_FIXTURE",
        label: "Level seed",
        semanticRole: "Deterministic L4 scenario seed",
        value: L4_SEED,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "L4_BUDGET_FIXTURE",
        label: "Attempt budget",
        semanticRole: "Initial L4 wallet cap",
        value: L4_BUDGET_USD,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "L4_CLOCK_CAP_FIXTURE",
        label: "Clock cap",
        semanticRole: "Maximum simulated minutes in the projected eight-job schedule",
        value: L4_CLOCK_CAP_MIN,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "L4_JOB_COUNT_FIXTURE",
        label: "Queued jobs",
        semanticRole: "Number of jobs available for grouping",
        value: L4_JOB_COUNT,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "L4_JOB_HOURS_FIXTURE",
        label: "Job unit-hours",
        semanticRole: "UnitSeed hours assigned to each L4 job",
        value: L4_JOB_HOURS,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "L4_WAVE_GAP_FIXTURE",
        label: "Inter-wave gap",
        semanticRole: "Idle minutes between consecutive wave starts",
        value: WAVE_GAP_MIN,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "L4_COORD_INPUT_FIXTURE",
        label: "Coordinator input",
        semanticRole: "Fresh input tokens for each coordinator request",
        value: COORD_INPUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "L4_COORD_OUTPUT_BASE_FIXTURE",
        label: "Coordinator output base",
        semanticRole: "Base generated output for a coordinator request",
        value: COORD_OUT_BASE_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "L4_COORD_OUTPUT_QUAD_FIXTURE",
        label: "Coordinator output quadratic coefficient",
        semanticRole: "Generated output added per squared simultaneous-branch distance",
        value: COORD_OUT_QUAD_TOK,
        unit: "tok",
        tag: "[FICTION]"
      }
    ],
    estimates: [
      {
        label: "job-card arrival seconds",
        value: 0,
        tag: "[ESTIMATE]"
      },
      {
        label: "TTL-bar arrival seconds",
        value: 0.4,
        tag: "[ESTIMATE]"
      },
      {
        label: "width-control arrival seconds",
        value: 0.8,
        tag: "[ESTIMATE]"
      },
      {
        label: "secondary-copy arrival seconds",
        value: 1.2,
        tag: "[ESTIMATE]"
      },
      {
        label: "first-interaction target seconds",
        value: 2,
        tag: "[ESTIMATE]"
      },
      {
        label: "paired-outline hold seconds",
        value: 0.7,
        tag: "[ESTIMATE]"
      }
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
    cite: "C1, C3, C10, C28",
    line:
      "A late serial wave can rewrite the same shared setup that an in-window job would have read; unlimited concurrency still carries priced coordination."
  },
  failureRules: [L4_FIRST_LATE_COLD_FAILURE],
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
      id: "L4-reference-completed",
      kind: "event-completed",
      eventId: "e11-reveal-reference"
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

`ACK_EXPLANATION` is reducer-valid only after causal evidence is visible, so the state-backed `pass(st)` projection remains pure and does not require an invented action-history field:

```ts
function passLevel04(st: ReducerState): GateResult {
  const workCompleted =
    st.completedEventIds.includes("e8-reveal-actual");
  const referenceCompleted =
    st.completedEventIds.includes("e11-reveal-reference");
  const explanationAcknowledged =
    st.acknowledgedExplanationIds.includes(
      "L4-balance-waves-and-coordination"
    );

  const pass =
    workCompleted
    && referenceCompleted
    && st.frozenFailure === null
    && explanationAcknowledged;

  return {
    pass,
    reason: pass
      ? "The completed run was followed by the causal balance explanation."
      : "Complete the run, inspect the comparison, and explain the balance.",
    evidence: [
      `actual=${workCompleted}`,
      `reference=${referenceCompleted}`,
      `notFrozen=${st.frozenFailure === null}`,
      `explained=${explanationAcknowledged}`
    ]
  };
}
```

Neither `passLevel04` nor any declarative predicate inspects prediction selection, commitment, or correctness.

## 6. Pricing walkthrough

All workers use Sonnet (`C3`), the measured identical shared spawn prefix (`C10`), calibrated worker input/output (`C28`), and `CACHE_TIER_5M` (`C1`).

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

The failure’s request-local comparison uses the same Job 2 input and output on both sides. Only the shared-prefix bucket changes:

```text
P_FIRST_LATE_EXCESS =
  P_COLD_JOB − P_WARM_JOB
= $0.77638875 − $0.68587110
= $0.09051765
```

This comparison traces to `C1`, `C3`, `C10`, and `C28`. It is rendered beside the actual `L4-J2` ledger row before the freeze. It is not a reference run or post-attempt counterfactual.

Coordinator request for wave size `s`:

```text
inputTok = 5,000
outTok   = 29,000 + 3,000 × (s − 1)²

P_COORD(s) =
  inputTok × $3/M
+ outTok   × $15/M
```

The `$15/M` output rate is Sonnet’s `5x` output multiplier (`C1`, `C3`). Coordinator token counts are `[FICTION]`; their price becomes authoritative when passed to `PRICE_REQUEST`.

This is the level’s only authoritative full-schedule projection table:

| Width | Wave sizes | Full-route requests | Cold writes | Warm reads | Coordinator subtotal | Full-route total |
|---:|---|---:|---:|---:|---:|---:|
| `1` | `1+1+1+1+1+1+1+1` | `16` | `8` | `0` | `$3.60000000` | `$9.81111000` |
| `2` | `2+2+2+2` | `12` | `4` | `4` | `$1.98000000` | `$7.82903940` |
| `3` | `3+3+2` | `11` | `3` | `5` | `$1.75500000` | `$7.51352175` |
| `4` | `4+4` | `10` | `2` | `6` | `$1.71000000` | `$7.37800410` |
| `5` | `5+3` | `10` | `2` | `6` | `$1.80000000` | `$7.46800410` |
| `6` | `6+2` | `10` | `2` | `6` | `$2.07000000` | `$7.73800410` |
| `7` | `7+1` | `10` | `2` | `6` | `$2.52000000` | `$8.18800410` |
| `8` | `8` | `9` | `1` | `7` | `$2.65500000` | `$8.23248645` |

The width-1 row is a deterministic pricing projection required for anti-pattern verification; the playable width-1 branch freezes after its fourth ledger row and does not execute the remaining projected requests.

Width `4` is the three-star reference at `$7.37800410`. Width `8` avoids one cold wave but pays enough superlinear coordinator output to cost more than width `4`. The central decision is therefore a U-curve, not a dial-to-maximum.

`PRICE_REQUEST` stores unrounded values. Normal currency labels may round to cents; hover equations retain enough precision to distinguish every positive bucket.

## 7. Tape sequence

`UI_TAPE_RENDERER` consumes the actual `ledger` in request order. Every request creates exactly one row. Counterfactual rows remain in `UI_COUNTERFACTUAL_OVERLAY` and never replace the actual ledger.

For reference width `4`, the exact tape order is:

1. `L4-C1`: **Coordinator · Wave 1 · 0:00** — `input COORD_INPUT_TOK | output COORD_OUT(4)`.
2. `L4-J1`: **Job 1 · 0:00** — `write BASE_IDENTICAL | input WORK_IN | output WORK_OUT`.
3. `L4-J2`: **Job 2 · 0:00** — `read BASE_IDENTICAL | input WORK_IN | output WORK_OUT`.
4. `L4-J3`: **Job 3 · 0:00** — warm worker buckets.
5. `L4-J4`: **Job 4 · 0:00** — warm worker buckets.
6. `L4-C2`: **Coordinator · Wave 2 · 6:00** — `input COORD_INPUT_TOK | output COORD_OUT(4)`.
7. `L4-J5`: **Job 5 · 6:00** — cold worker buckets.
8. `L4-J6`: **Job 6 · 6:00** — warm worker buckets.
9. `L4-J7`: **Job 7 · 6:00** — warm worker buckets.
10. `L4-J8`: **Job 8 · 6:00** — warm worker buckets.

For playable width `1`, the exact emitted tape before failure is:

1. `L4-C1`: **Coordinator · Wave 1 · 0:00**.
2. `L4-J1`: **Job 1 · 0:00** — cold worker buckets.
3. `L4-C2`: **Coordinator · Wave 2 · 6:00**.
4. `L4-J2`: **Job 2 · 6:00** — cold worker buckets; decisive request.

The fourth row freezes in place. `UI_HOVER_PRICE_CALCULATOR` anchors an adjacent two-line comparison:

- **Arrived at 6:00 · write · `$0.77638875`**
- **Inside the window · read · `$0.68587110`**

No Job 3 request or later width-1 request is emitted.

### Aha frame

At `e11-reveal-reference`, completed runs use a width-specific causal pairing:

| Actual width | Actual focus | Width-4 focus | Revealed contrast |
|---:|---|---|---|
| `2` | `L4-J3` cold at `6:00` | `L4-J3-reference` warm at `0:00` | Earlier grouping changes a write into a read. |
| `3` | `L4-J4` cold at `6:00` | `L4-J4-reference` warm at `0:00` | Earlier grouping changes a write into a read. |
| `4` | `L4-C1` and `L4-C2` | matching reference rows | Same grouping produces the same tape and total. |
| `5` | `L4-J6` cold | `L4-J6-reference` warm | Regrouping changes the shared-prefix bucket while coordinator cost also changes. |
| `6` | `L4-J7` cold | `L4-J7-reference` warm | Regrouping changes the shared-prefix bucket while coordinator cost also changes. |
| `7` | `L4-J8` cold | `L4-J8-reference` warm | Regrouping changes the shared-prefix bucket while coordinator cost also changes. |
| `8` | `L4-J5` warm plus `L4-C1` | `L4-J5-reference` cold plus both reference coordinators | One wave saves a write, but its larger coordinator costs more than that saving. |

Width `1` has no post-attempt aha frame because its actual request already caused a local freeze.

Hold the paired outline for `700ms` `[ESTIMATE]`. For widths `2`, `3`, `5`, `6`, and `7`, show:

**“Same job. Same setup. Its place in the grouping changed a rewrite into a read.”**

Keep coordinator rows visible and follow with:

**“But the largest group asks its coordinator to merge more branches.”**

The `UI_TAPE_RENDERER` canonical visual-weight formula is binding: row length is proportional to authoritative USD, and segment geometry includes `readTok`, `inputTok`, `writeTok`, and `outTok`. Coordinator violet output uses `outTok × 5`, and worker violet output retains its full priced weight (`C1`, `C3`, `C28`).

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
  ahaRequestId: "L4-C1-reference",
  hoverEnabled: true,
  explainOutputPricingFromEventId: "e5-send-coordinator"
};
```

## 8. Prediction prompts

### `L4-last-wave-color`

**Question:** “When the last group reaches the wire, what happens to its shared setup?”

- `all-blue` — “Every job reads it”
- `red-then-blue` — “The first writes it; its group-mates read it”
- `all-red` — “Every job writes it”

Resolved correct option:

- singleton final group: `all-red`;
- final group with at least two jobs: `red-then-blue`.

No option is styled as correct before `e8-reveal-actual`. A width-1 failure does not reveal or score the prediction. A wrong answer changes evidence copy only.

### `L4-width4-cost`

Shown only after a non-frozen actual attempt completes and before the reference counterfactual appears.

**Question:** “What will four-at-a-time do to the total compared with your run?”

- `lower` — “Lower total”
- `same` — “The same total”
- `higher` — “Higher total”

Resolved correct option is `same` when the attempted width was `4`; for every other completed width it is `lower`.

Reveal copy:

**“Four-at-a-time paid for two cold waves and two moderate coordinators. Narrower runs bought more waves; the widest run bought heavier coordination.”**

Prediction selection, commitment, and correctness are excluded from gate, star, wallet, failure, and `pass(st)` logic.

## 9. Fail-state

```ts
const L4_FIRST_LATE_COLD_FAILURE: FailureRuleDef = {
  id: "L4-first-late-cold",
  predicate: {
    id: "L4-first-late-cold-all",
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
        id: "L4-clock-is-six",
        kind: "compare",
        path: "clockMin",
        op: "eq",
        value: 6
      },
      {
        id: "L4-job2-request-completed",
        kind: "event-completed",
        eventId: "e6-send-L4-J2"
      }
    ]
  },
  decisiveEventId: "e6-send-L4-J2",
  causeCode: "FIRST_LATE_WAVE_REWRITE",
  message:
    "Job 2 arrived at 6:00—after the shared setup expired—so 26,237 tokens were rewritten instead of read.",
  checkpointId: "L4-before-width",
  highlightObjectIds: [
    "L4-J2",
    "L4-shared-spawn",
    "L4-ttl-drain",
    "L4-J2-cold-vs-live-read"
  ],
  actualUsd: P_COLD_JOB,
  validAlternativeUsd: P_WARM_JOB
};
```

- **Decisive event:** the actual `SEND_REQUEST` for `L4-J2` at `6:00`, during the run.
- **Economic truth:** `$0.77638875 > $0.68587110`; the request paid `$0.09051765` more because `26,237` prefix tokens were written rather than read.
- **Visible comparison:** the actual ledger row and its same-request in-window read price are simultaneously visible before `FREEZE_FAILURE`.
- **Supporting line:** **“The setup expired at 5:00. Job 2 arrived one minute later.”**
- **Frozen controls:** clock, width, launch, and every economic action.
- **Available control:** `UI_REWIND_CONTROL`, labeled **“Regroup the jobs.”**
- **Rewind target:** `L4-before-width`.
- **Restored state:** original scalar wallet, empty ledger, queued jobs, `clockMin=0`, no cache entry, no prediction, reset `attemptMetrics`, and no failure. The cold-open animation is not replayed.
- **Reachability:** `antiCfg={width:1}` deterministically freezes after four ledger rows.
- Widths `2…8` never satisfy this rule and may complete with lower stars.
- `e11-reveal-reference` is informational and cannot dispatch this or any other freeze.

## 10. Gate & stars

Passing requires:

- a completed eight-job run;
- no active `frozenFailure`;
- `e8-reveal-actual` and `e11-reveal-reference` completed;
- after `e11-reveal-reference`, the player chooses:
  **“Balance the number of cold waves against the coordinator work inside each wave.”**

The gate does not inspect prediction state or budget.

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
        id: "L4-star2-run-completed",
        kind: "event-completed",
        eventId: "e8-reveal-actual"
      },
      {
        id: "L4-star2-reference-completed",
        kind: "event-completed",
        eventId: "e11-reveal-reference"
      },
      {
        id: "L4-star2-not-frozen",
        kind: "compare",
        path: "frozenFailure",
        op: "eq",
        value: null,
        observedAfterEventId: "e11-reveal-reference"
      },
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
        id: "L4-star3-run-completed",
        kind: "event-completed",
        eventId: "e8-reveal-actual"
      },
      {
        id: "L4-star3-reference-completed",
        kind: "event-completed",
        eventId: "e11-reveal-reference"
      },
      {
        id: "L4-star3-not-frozen",
        kind: "compare",
        path: "frozenFailure",
        op: "eq",
        value: null,
        observedAfterEventId: "e11-reveal-reference"
      },
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
    "Four-at-a-time produces the lowest deterministic full-run total for this queue."
};
```

Result values:

```ts
const L4_RESULT: ResultSpec = {
  headlinePass: "You found the balance.",
  headlineFail: "The next group arrived too late.",
  evidenceLines: [
    "Waves: {waveCountDerivedFromCfgWidth}",
    "Cold writes: {coldWriteCountDerivedFromLedger}",
    "Warm reads: {readCountDerivedFromLedger}",
    "Coordinator output: {coordinatorOutTokDerivedFromLedger}",
    "Total: {attemptResult.spentUsd}"
  ],
  comparisonIds: ["L4-actual-vs-width4"],
  continueLabel: "Next race",
  retryLabel: "Try another grouping"
};
```

The first four result values are presentation derivations from `cfg.width` and `ledger`; they are not additional reducer fields.

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `L4-coordinator-output` | First coordinator row resolves at `e5-send-coordinator` | **“Coordinator output · merging this group’s jobs · priced at output rate.”** |
| `L4-shared-prefix` | First worker write resolves | **“Shared prefix saved · 26,237 tokens · five-minute idle lifetime.”** |
| `L4-first-read` | First same-wave worker reads the shared entry | **“Same setup, same group · cache read.”** |
| `L4-wave-wait` | First `ADVANCE` resolves | **“The next group waits six minutes.”** |
| `L4-expired` | First later-wave cold write resolves | **“Expired between groups · the shared prefix must be written again.”** |
| `L4-failure-gap` | `L4_FIRST_LATE_COLD_FAILURE` freezes | **“At 6:00: write `$0.77638875`. Inside the window: read `$0.68587110`.”** |
| `L4-aha-cache` | `e11-reveal-reference`, actual width `2`, `3`, `5`, `6`, or `7` | **“Regrouped: one rewrite became a read. Coordinator work changed too.”** |
| `L4-aha-match` | `e11-reveal-reference`, actual width `4` | **“Same grouping, same requests, same total.”** |
| `L4-aha-coordination` | `e11-reveal-reference`, actual width `8` | **“One wave saved a rewrite. Its larger coordinator cost more than that saving.”** |

`L4-expired` and `L4-failure-gap` remain visible during the width-1 freeze. Other toasts deduplicate per attempt according to `just-in-time-toast`.

Just-in-time vocabulary:

```ts
const L4_VOCABULARY: VocabularyDef[] = [
  {
    term: "coordinator output",
    definition:
      "Generated tokens used to reconcile the jobs launched in one group.",
    firstNeededEventId: "e5-send-coordinator",
    toastId: "L4-coordinator-output"
  },
  {
    term: "shared prefix",
    definition:
      "The identical spawn setup that jobs in the same live pool can reuse.",
    firstNeededEventId: "e6-send-L4-J1",
    toastId: "L4-shared-prefix"
  }
];
```

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. The width control is interactive by `2s` `[ESTIMATE]`.
2. Pre-play UI contains no coordinator reference, reference total, cheapest-width claim, cold-write count, coordinator formula, or safe-width answer.
3. `ENTER_LEVEL` uses the slug `04-five-minute-race`.
4. `concept.id` is `shared-subagent-window`; `conceptScope` is single; prerequisites are exactly `["cache-expiry", "prefix-reuse"]`.
5. `title` and `objective` contain none of `concept.solutionVocabulary`, including obvious inflections or hyphenated variants.
6. Changing width dispatches only `SET_FANOUT_WIDTH`; it creates no ledger row and changes no scalar wallet value.
7. Launch cannot execute until `L4-last-wave-color` is committed.
8. A wrong prediction changes no score, star, wallet, freeze, gate, or result value.
9. Six minutes between waves expires a five-minute entry from its last touch; no fixed original-expiry shortcut is used.
10. Within a wave, the first worker writes `BASE_IDENTICAL` and every later worker at the same `sentAtMin` reads it.
11. Each wave produces one real coordinator request whose `outTok` matches `COORD_OUT(waveSize)`.
12. Every request creates exactly one `LedgerRow` and exactly one tape row.
13. Width `4` produces ten rows, two cold worker writes, six warm worker reads, and passes after the correct post-evidence explanation.
14. Width `8` has one cold worker write but costs more than width `4` because its coordinator output is larger.
15. Width `1` emits exactly four rows—two coordinators and two cold workers—before freezing; no Job 3 request is created.
16. The width-1 freeze occurs during `e6-send-L4-J2` at `clockMin=6`, not after attempt completion.
17. The freeze displays `P_COLD_JOB=$0.77638875` and `P_WARM_JOB=$0.68587110` beside the actual Job 2 row.
18. `L4_FIRST_LATE_COLD_FAILURE.actualUsd` is strictly greater than `validAlternativeUsd`.
19. No economic action can execute while frozen.
20. **“Regroup the jobs”** deterministically restores `L4-before-width`, including wallet, ledger, clock, cache, prediction, and `attemptMetrics`.
21. `referenceCfg={width:4}` passes from `L4_SEED`.
22. `antiCfg={width:1}` reaches the authored in-run economic freeze.
23. The width-4 counterfactual is unavailable before a meaningful attempt completes and before `L4-width4-cost` is committed.
24. `e11-reveal-reference` mutates no actual ledger, wallet, attempt metrics, result, or failure state and never dispatches `FREEZE_FAILURE`.
25. `L4_GATE.postEvidenceActionRequirements` observes `ACK_EXPLANATION` after `e11-reveal-reference`.
26. Neither `COMMIT_PREDICTION` nor prediction correctness appears in gate, star, failure, wallet, or `pass(st)` logic.
27. Every failure, gate, and star predicate uses only declared `ReducerState` paths, legal predicate kinds, and legal comparison ops.
28. Every worker and coordinator price matches `PRICE_REQUEST` with `C1`/`C3`; worker prefix and workload quantities additionally trace to `C10`/`C28`.
29. Every positive request cost displays above zero; no positive value renders as `$0.0000`.
30. Every rendered `WireSegment` matches its authoritative ledger bucket.
31. `UI_TAPE_RENDERER` row widths and segment geometry include `outTok`; coordinator output is visibly violet and worker output retains its true visual weight.
32. Static final tape bars preserve colors, segments, and totals without hover.
33. Pointer and keyboard paths dispatch equivalent width, prediction, explanation, comparison, and rewind actions.
34. Reduced-motion mode reaches byte-identical reducer, ledger, wallet, gate, failure, and result state.
35. Width totals form the authored U-curve: width `4` is cheaper than both width `1`’s full-route projection and width `8`.
36. The player can win without undocumented controls.
37. The document exposes one authoritative full-schedule price table and no superseded failure-total comparison.
38. Every `[FICTION]` gameplay quantity has a semantically matching `ScenarioFixtureDef`.

## 13. Reference-bar justification

The screen opens on one tactile act: reshape eight cards into groups against a visible clock. It does not pre-announce coordinator work. The player commits a prediction, then their own launch produces the evidence: cold writes, same-wave reads, and a real coordinator request whose output changes with group size.

The width-1 anti-pattern now follows the local fail lesson from `GAME_PLAN_V2`: the run freezes on the first cold late-wave worker, while the decisive Job 2 row is still fresh. Its actual `$0.77638875` request is paired directly with the same request’s `$0.68587110` in-window read price. Rewind returns to the width choice without finishing the bad schedule, revealing a reference run, or replaying mastered setup.

This spec deliberately departs from `GAME_PLAN_V2`’s simpler **“wider fan-out is cheaper”** aha. The added, visibly priced quadratic coordinator output makes the total curve U-shaped: wider groups reduce cold waves, but the largest group is not free. That deviation preserves the short-lived shared-prefix lesson while satisfying the live-tradeoff invariant and preventing width `8` from becoming a strictly dominant answer.

Only a completed non-frozen run can request the width-4 comparison. That comparison remains informational, exposes the U-curve, and asks for a post-evidence causal explanation. The rhythm is therefore touch, predict, consequence, local recovery or completion, compare, and explain.
