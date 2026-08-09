# Level 9 — Model the Work

## 1. Identity

- **id:** `09-model-the-work`
- **title:** Model the Work
- **tier:** 2
- **ONE concept:** `workload-cost-mix` — total model cost depends on the priced workload mix; generated output can dominate even when it is not the largest token count.
- **Prerequisite concept:** `write-vs-read`
- **Objective copy:** “Three jobs receive the same-sized repository excerpt. Predict which side of each request will cost more.”
- **New mechanic:** Three non-punitive cost-side predictions followed by one post-evidence transfer question.
- **Model control:** The per-job model picker is deliberately removed. The attempt uses fixed Sonnet requests; model-price comparisons appear only after completion.
- **Protected discovery:** No pre-play copy reveals token counts, output’s `5x` rate, the correct predictions, model prices, or reference totals.

## 2. Objects used

- `LevelDef`
- `Request`
- `PricedRequest`
- `PrefixStack`
- `PrefixBlock`
- `MAIN_SESSION_CONTEXT`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `PRICE_REQUEST`
- `RATE_INPUT`
- `RATE_OUTPUT`
- `UI_TAPE_RENDERER`
- `UI_PREDICTION_PROMPT`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `just-in-time-toast`
- `counterfactual-after-attempt`

This level does not instantiate `fail-freeze-rewind`: no prediction or explanation miss creates an economic route that could truthfully support `FREEZE_FAILURE`.

## 3. Cold-open / narrative

**0:00–0:01.** Three face-down job cards land beside a `$3.00` `Wallet` `[FICTION]`. Header: **“Same-sized repository excerpt. Three different jobs.”**

**0:01–0:02.** The cards turn over without exposing counts or prices:

1. **Search:** “Find every permission check. Return only file paths.”
2. **Codegen:** “Implement the permission layer, migrations, tests, and integration notes.”
3. **Short review:** “Read this six-line guard change. Return one verdict.”

Each card has one sealed choice labeled **“Which side will cost more?”**

**0:02 onward.** Search receives focus. Copy: **“Commit an estimate. Then the wire will show what happened.”**

No model picker is rendered. `devModel` remains locked to Sonnet during the attempt; its model spread is revealed only through the post-attempt counterfactual.

## 4. Exact event sequence

1. **Enter the level**  
   Event: the route opens Level 9.  
   Action: `ENTER_LEVEL { levelId: "09-model-the-work" }`.  
   Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, three scenario units, prediction state, empty ledger, and empty tape.  
   Numbers: seed `904409` `[FICTION]`; budget `$3.00` `[FICTION]`; minute `0`; exactly three priced units.

2. **Create the prediction checkpoint**  
   Event: Search becomes interactive.  
   Action: `CREATE_CHECKPOINT { checkpointId: "l9-before-jobs", reason: "prediction" }`.  
   Mutates: `Checkpoint[]` only.  
   Numbers: no request and no spend.

3. **Predict Search**  
   Event: the player opens Search’s sealed choice.  
   Actions: `OPEN_PREDICTION { promptId: "l9-search-cost-side" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION`.  
   Mutates: prediction state only.  
   Numbers: no token counts or rates are revealed.

4. **Run and reveal Search**  
   Event: the committed prediction unlocks **“Run Search.”**  
   Actions: `RUN_UNIT { unitId: "l9-search" }` → `REVEAL_PREDICTION { promptId: "l9-search-cost-side", correctOptionId: "input-side" }`.  
   Mutates: Search status, `LedgerRow[]`, `lastRequests`, `Wallet`, `Clock`, tape payload, and prediction reveal state.  
   Numbers: the authoritative request is `l9-search-sonnet` in §6. Input-side tokens and dollars both dominate.

5. **Predict Codegen**  
   Event: Codegen becomes active after the Search reveal.  
   Actions: `OPEN_PREDICTION { promptId: "l9-codegen-cost-side" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION`.  
   Mutates: prediction state only.  
   Numbers: no additional request or spend.

6. **Run and reveal Codegen — aha frame**  
   Event: the committed prediction unlocks **“Run Codegen.”**  
   Actions: `RUN_UNIT { unitId: "l9-codegen" }` → `REVEAL_PREDICTION { promptId: "l9-codegen-cost-side", correctOptionId: "output" }`.  
   Mutates: Codegen status, ledger, `lastRequests`, `Wallet`, `Clock`, tape payload, and prediction reveal state.  
   Numbers: the authoritative request is `l9-codegen-sonnet` in §6. The output bucket contributes `$0.660` of the `$0.678` row, or `97.35%`, under `C1` and `C3`.  
   Copy: **“The input stayed the same. The long answer made this row 22.6× Search.”**

7. **Predict Short review**  
   Event: Short review becomes active after the Codegen reveal.  
   Actions: `OPEN_PREDICTION { promptId: "l9-review-cost-side" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION`.  
   Mutates: prediction state only.  
   Numbers: no additional request or spend.

8. **Run and reveal Short review**  
   Event: the committed prediction unlocks **“Run Short review.”**  
   Actions: `RUN_UNIT { unitId: "l9-short-review" }` → `REVEAL_PREDICTION { promptId: "l9-review-cost-side", correctOptionId: "input-side" }`.  
   Mutates: Short-review status, ledger, `lastRequests`, `Wallet`, `Clock`, tape payload, and prediction reveal state.  
   Numbers: the authoritative request is `l9-review-sonnet` in §6. Input-side tokens and dollars both dominate.

9. **Ask for the causal explanation**  
   Event: all three revealed rows remain pinned together.  
   Action: `ACK_EXPLANATION { explanationId }`.  
   Mutates: `acknowledgedExplanationIds` only.  
   Options:
   - `l9-cause-output-rate` — **“Codegen combined a long answer with the higher output rate.”**
   - `l9-cause-cache-size` — **“Codegen received a larger cached prefix.”**
   - `l9-cause-clock` — **“Codegen ran later in the minute counter.”**  
   Numbers: the correct explanation cites the identical `6,000 inputTok` across all three requests (`C28`) and output’s `5x` multiplier (`C1`).

10. **Create the transfer checkpoint**  
    Event: the causal explanation has been submitted.  
    Action: `CREATE_CHECKPOINT { checkpointId: "l9-before-transfer", reason: "decision" }`.  
    Mutates: `Checkpoint[]` only.  
    Numbers: the completed ledger and wallet remain unchanged.

11. **Begin the post-evidence transfer**  
    Event: a fourth, unpriced scenario card appears after all evidence.  
    Action: `BEGIN_TRANSFER { challengeId: "l9-cost-transfer" }`.  
    Mutates: phase and transfer state only.  
    Numbers shown now: `12,000` fresh input tokens and `3,000` output tokens `[FICTION]`; no request is sent and no wallet amount changes.

12. **Answer the transfer question**  
    Event: the player chooses which side of the fourth workload would cost more.  
    Action: `ACK_EXPLANATION { explanationId: "l9-transfer-input-cost" | "l9-transfer-output-cost" }`.  
    Mutates: explanation and transfer-completion state only.  
    Correct application: `3,000 × 5 = 15,000` cost-weighted output tokens, which exceeds `12,000 × 1 = 12,000` cost-weighted input tokens (`C1`).  
    Gate evidence: only `l9-transfer-output-cost`, submitted after `l9-reveal-review`, satisfies the behavioral gate.

13. **Retry an incorrect transfer answer**  
    Event: the player selects `l9-transfer-input-cost`.  
    Action: `REWIND_TO_CHECKPOINT { checkpointId: "l9-before-transfer" }`.  
    Mutates: only the transfer branch and its explanation selection; the three priced rows, prediction history, wallet, and revealed evidence remain intact.  
    Copy: **“Token count alone is not cost. Apply the rate to each side.”**  
    Numbers: no spend is added or reversed because the transfer card is unpriced.

14. **Complete the attempt**  
    Event: the correct post-evidence transfer answer has been acknowledged.  
    Action: `COMPLETE_ATTEMPT`.  
    Mutates: gate result, stars, attempt result, and result summary.  
    Numbers: the reference spend is the Sonnet total in §6. Prediction selections and prediction correctness are not inspected.

15. **Reveal the model counterfactual**  
    Event: the result screen exposes **“Compare model prices.”**  
    Actions: `REQUEST_COUNTERFACTUAL { comparisonId: "l9-model-spread" }` → `REVEAL_COUNTERFACTUAL { comparisonId: "l9-model-spread" }`.  
    Mutates: counterfactual visibility only.  
    Numbers: the Sonnet, Opus, and Fable values are the single authoritative table in §6; the actual ledger is not replaced.

## 5. Level data

```ts
const SEARCH_OUT = 800;       // [ESTIMATE]
const REVIEW_OUT = 500;       // [ESTIMATE]
const TRANSFER_IN = 12_000;   // [FICTION]
const TRANSFER_OUT = 3_000;   // [FICTION]

const level09: LevelDef = {
  id: "09-model-the-work",
  tier: 2,
  title: "Model the Work",
  objective:
    "Three jobs receive the same-sized repository excerpt. Predict which side of each request will cost more.",

  concept: {
    id: "workload-cost-mix",
    privateDesignerSummary:
      "Total model cost depends on the priced input/output mix, not token count or model identity alone.",
    postRevealRule:
      "Apply each bucket's rate: long generated output can dominate the bill."
  },
  prerequisiteConceptIds: ["write-vs-read"],

  unlocks: "devModel",
  introducedControls: [],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel",
    "who", "prompts", "width", "oneHourFlag",
    "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 904409,
  budgetUsd: 3.00,
  clockCapMin: 3,
  cfgOverride: {
    devModel: "sonnet",
    who: "inline",
    prompts: "identical"
  },
  scenario: "dev-only",

  scenarioData: {
    units: [
      {
        id: "l9-search",
        kind: "TASK",
        ticket: 1,
        deps: [],
        hours: 1,
        outTok: SEARCH_OUT,
        workIn: WORK_IN,
        label: "Search"
      },
      {
        id: "l9-codegen",
        kind: "DEV",
        ticket: 2,
        deps: ["l9-search"],
        hours: 1,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Codegen"
      },
      {
        id: "l9-short-review",
        kind: "CODE_REVIEW",
        ticket: 3,
        deps: ["l9-codegen"],
        hours: 1,
        outTok: REVIEW_OUT,
        workIn: WORK_IN,
        label: "Short review"
      }
    ],

    contexts: [
      {
        kind: "main",
        id: "l9-search-context",
        sessionId: "l9-search-session",
        cacheNamespace: "l9-search-cache",
        initialPrefixStackId: "l9-search-prefix"
      },
      {
        kind: "main",
        id: "l9-codegen-context",
        sessionId: "l9-codegen-session",
        cacheNamespace: "l9-codegen-cache",
        initialPrefixStackId: "l9-codegen-prefix"
      },
      {
        kind: "main",
        id: "l9-review-context",
        sessionId: "l9-review-session",
        cacheNamespace: "l9-review-cache",
        initialPrefixStackId: "l9-review-prefix"
      }
    ],

    prefixStacks: [
      {
        id: "l9-search-prefix",
        contextId: "l9-search-context",
        blocks: [{
          id: "l9-search-current",
          kind: "current",
          label: "Repository excerpt",
          tokenCount: WORK_IN,
          identityHash: "l9-repo-search",
          order: 0,
          cacheable: false,
          breakpointAfter: false,
          stability: "volatile"
        }]
      },
      {
        id: "l9-codegen-prefix",
        contextId: "l9-codegen-context",
        blocks: [{
          id: "l9-codegen-current",
          kind: "current",
          label: "Repository excerpt",
          tokenCount: WORK_IN,
          identityHash: "l9-repo-codegen",
          order: 0,
          cacheable: false,
          breakpointAfter: false,
          stability: "volatile"
        }]
      },
      {
        id: "l9-review-prefix",
        contextId: "l9-review-context",
        blocks: [{
          id: "l9-review-current",
          kind: "current",
          label: "Repository excerpt",
          tokenCount: WORK_IN,
          identityHash: "l9-repo-review",
          order: 0,
          cacheable: false,
          breakpointAfter: false,
          stability: "volatile"
        }]
      }
    ],

    workloads: [
      {
        id: "search",
        label: "Search",
        role: "dev",
        unitIds: ["l9-search"],
        inputTok: WORK_IN,
        outTok: SEARCH_OUT,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "codegen",
        label: "Codegen",
        role: "dev",
        unitIds: ["l9-codegen"],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "short-review",
        label: "Short review",
        role: "dev",
        unitIds: ["l9-short-review"],
        inputTok: WORK_IN,
        outTok: REVIEW_OUT,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "cost-transfer",
        label: "Deployment summary",
        role: "dev",
        unitIds: [],
        inputTok: TRANSFER_IN,
        outTok: TRANSFER_OUT,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet", "opus", "fable"]
      }
    ],

    estimates: [
      { label: "search output", value: SEARCH_OUT, tag: "[ESTIMATE]" },
      { label: "short-review output", value: REVIEW_OUT, tag: "[ESTIMATE]" },
      { label: "transfer input", value: TRANSFER_IN, tag: "[FICTION]" },
      { label: "transfer output", value: TRANSFER_OUT, tag: "[FICTION]" },
      { label: "unit duration", value: 1, tag: "[FICTION]" }
    ]
  },

  coldOpen: coldOpen09,
  sequence: level09Sequence,
  predictions: level09Predictions,
  toasts: level09Toasts,

  interactionPatterns: [
    "predict-before-reveal",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "none",
    cite: "C1",
    line:
      "A prediction miss is evidence, not failure; the player retries only the post-evidence transfer."
  },
  failureRules: [],
  checkpoints: [
    {
      id: "l9-before-jobs",
      createBeforeEventId: "l9-predict-search",
      reason: "prediction",
      resumeLabel: "Replay the jobs"
    },
    {
      id: "l9-before-transfer",
      createBeforeEventId: "l9-begin-transfer",
      reason: "decision",
      resumeLabel: "Try the new workload again"
    }
  ],

  gate: {
    predicateId: "l9-apply-cost-mix",
    evidenceRevealEventIds: [
      "l9-reveal-search",
      "l9-reveal-codegen",
      "l9-reveal-review"
    ],
    postEvidenceActionRequirements: [{
      id: "l9-transfer-action-after-evidence",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "l9-reveal-review",
      match: { explanationId: "l9-transfer-output-cost" }
    }],
    behavioralRequirements: [{
      id: "l9-transfer-rule-applied",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l9-transfer-output-cost",
      observedAfterEventId: "l9-reveal-review"
    }],
    transferRequirement: {
      id: "l9-transfer-completed",
      kind: "includes",
      path: "completedTransferIds",
      value: "l9-cost-transfer"
    }
  },

  pass(st) {
    const applied =
      st.acknowledgedExplanationIds.includes("l9-transfer-output-cost") &&
      st.completedTransferIds.includes("l9-cost-transfer");

    return {
      pass: applied,
      reason: applied
        ? "Applied output pricing to a novel workload."
        : "Apply the revealed rates to the transfer workload.",
      evidence: applied
        ? ["l9-reveal-review", "l9-transfer-output-cost"]
        : ["l9-reveal-review"]
    };
  },

  star2: {
    label: "Name the cause",
    predicate: {
      id: "l9-causal-explanation",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l9-cause-output-rate",
      observedAfterEventId: "l9-reveal-codegen"
    },
    reason:
      "Identify the interaction between answer length and output's rate."
  },

  star3: {
    label: "Clean transfer",
    predicate: {
      id: "l9-reference-spend",
      kind: "all",
      predicates: [
        {
          id: "l9-star3-cause",
          kind: "includes",
          path: "acknowledgedExplanationIds",
          value: "l9-cause-output-rate"
        },
        {
          id: "l9-star3-transfer",
          kind: "includes",
          path: "acknowledgedExplanationIds",
          value: "l9-transfer-output-cost"
        },
        {
          id: "l9-star3-wallet",
          kind: "compare",
          path: "wallet",
          op: "gte",
          value: 2.26
        },
        {
          id: "l9-star3-first-attempt",
          kind: "compare",
          path: "attempt",
          op: "eq",
          value: 1
        }
      ]
    },
    reason:
      "Explain the cause, apply it to the transfer, and keep spend at or below $0.74 on the first attempt."
  },

  referenceCfg: {
    devModel: "sonnet"
  },
  antiCfg: {
    devModel: "fable"
  },

  counterfactuals: [
    {
      id: "l9-model-spread-reference",
      unlockAfterEventId: "l9-complete-attempt",
      kind: "reference",
      cfg: { devModel: "sonnet" },
      comparisonQuestion:
        "Which workload carries most of the model-price difference?",
      revealCopy:
        "The long generated answer carries most of the spread."
    },
    {
      id: "l9-model-spread-anti",
      unlockAfterEventId: "l9-complete-attempt",
      kind: "anti-pattern",
      cfg: { devModel: "fable" },
      comparisonQuestion:
        "Did the model multiplier affect all three jobs equally?",
      revealCopy:
        "No. It multiplies every bucket, but Codegen owns most of the priced work."
    }
  ],

  tape: level09Tape,
  result: level09Result,
  vocabulary: level09Vocabulary,
  qa: level09Qa
};
```

`WORK_IN = 6,000` and `WORK_OUT = 44,000` are `C28`. The three clean `MAIN_SESSION_CONTEXT` instances prevent unrelated growing history or cache reuse from changing the workload comparison. Each request uses `cachePolicy: "bypass"` and resolves to `0 readTok`, `6,000 inputTok`, `0 writeTok`, and its authored `outTok`.

## 6. Pricing walkthrough

This is the level’s single authoritative price table. Every request uses `PRICE_REQUEST`, with input at `1x` and output at `5x` (`C1`). Model bases and per-million prices are `C2–C4`. Search and Short review use calibrated output estimates; Codegen uses `WORK_OUT` (`C28`).

| Workload | Model | readTok | inputTok | writeTok | outTok | Input $ | Output $ | Request total $ |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Search | Sonnet (`C3`) | 0 | 6,000 (`C28`) | 0 | 800 `[ESTIMATE]` | 0.018 | 0.012 | **0.030** |
| Codegen | Sonnet (`C3`) | 0 | 6,000 (`C28`) | 0 | 44,000 (`C28`) | 0.018 | 0.660 | **0.678** |
| Short review | Sonnet (`C3`) | 0 | 6,000 (`C28`) | 0 | 500 `[ESTIMATE]` | 0.018 | 0.0075 | **0.0255** |
| **Three-job total** | **Sonnet** | **0** | **18,000** | **0** | **45,300** | **0.054** | **0.6795** | **0.7335** |
| Search | Opus (`C2`) | 0 | 6,000 (`C28`) | 0 | 800 `[ESTIMATE]` | 0.030 | 0.020 | **0.050** |
| Codegen | Opus (`C2`) | 0 | 6,000 (`C28`) | 0 | 44,000 (`C28`) | 0.030 | 1.100 | **1.130** |
| Short review | Opus (`C2`) | 0 | 6,000 (`C28`) | 0 | 500 `[ESTIMATE]` | 0.030 | 0.0125 | **0.0425** |
| **Three-job total** | **Opus** | **0** | **18,000** | **0** | **45,300** | **0.090** | **1.1325** | **1.2225** |
| Search | Fable (`C4`) | 0 | 6,000 (`C28`) | 0 | 800 `[ESTIMATE]` | 0.060 | 0.040 | **0.100** |
| Codegen | Fable (`C4`) | 0 | 6,000 (`C28`) | 0 | 44,000 (`C28`) | 0.060 | 2.200 | **2.260** |
| Short review | Fable (`C4`) | 0 | 6,000 (`C28`) | 0 | 500 `[ESTIMATE]` | 0.060 | 0.025 | **0.085** |
| **Three-job total** | **Fable** | **0** | **18,000** | **0** | **45,300** | **0.180** | **2.265** | **2.445** |

The reference configuration is Sonnet at `$0.7335`, displayed as **`$0.73`**. The anti-pattern counterfactual is Fable at `$2.445`, displayed as **`$2.45`**.

The Fable-to-Sonnet gap is `$1.7115`; `$1.54` of that gap comes from Codegen output alone. Copy revealed after completion: **“The model multiplier touched every row. The long answer carried most of the difference.”**

The three pre-reveal prediction answers are unambiguous in both tokens and dollars:

- Search: `6,000 inputTok > 800 outTok`, and `$0.018 input > $0.012 output`.
- Codegen: `44,000 outTok > 6,000 inputTok`, and `$0.660 output > $0.018 input`.
- Short review: `6,000 inputTok > 500 outTok`, and `$0.018 input > $0.0075 output`.

## 7. Tape sequence

`UI_TAPE_RENDERER` renders exactly three rows from `ledger`, in this order:

1. `l9-search-sonnet`
   - `input` — `6,000`, `1x`
   - `output` — `800`, `5x`

2. `l9-codegen-sonnet`
   - `input` — `6,000`, `1x`
   - `output` — `44,000`, `5x`

3. `l9-review-sonnet`
   - `input` — `6,000`, `1x`
   - `output` — `500`, `5x`

Zero-token `read` and `write` segments are omitted.

This level relies on the canonical `UI_TAPE_RENDERER` cost-weight formula from `OBJECT_MODEL.md`: the output contribution is `MODEL_IN[row.model] × row.outTok × 5`, and each segment occupies its authoritative share of `row.usd`. Output geometry is present even while its teaching label remains masked. Hiding the answer before reveal never removes `outTok` from row or segment width.

**Aha frame:** Search remains pinned above Codegen. Both input segments have equal width and cost. Codegen’s violet output segment then expands to `97.35%` of its row’s cost weight, making the row `22.6×` Search. Short review settles underneath with the same input segment and a small output tail, preventing “output always dominates” from becoming a false rule.

Hover and keyboard focus expose each bucket’s tokens, multiplier, dollars, and authoritative total through `UI_HOVER_PRICE_CALCULATOR`.

## 8. Prediction prompts

### `l9-search-cost-side`

**Question:** “Before Search runs: which side will cost more?”

- `input-side` — **“Repository excerpt coming in”**
- `output` — **“File-path answer coming out”**

Post-reveal sentence: **“Search spent `$0.018` on input and `$0.012` on its short answer.”**

### `l9-codegen-cost-side`

**Question:** “Before Codegen runs: which side will cost more?”

- `input-side` — **“Repository excerpt coming in”**
- `output` — **“Implementation coming out”**

Post-reveal sentence: **“Codegen spent `$0.660` on generated output—`97.35%` of its Sonnet row.”** (`C1`, `C3`, `C28`)

### `l9-review-cost-side`

**Question:** “Before Short review runs: which side will cost more?”

- `input-side` — **“Repository excerpt coming in”**
- `output` — **“One verdict coming out”**

Post-reveal sentence: **“Short review spent `$0.018` on input and `$0.0075` on its answer.”**

Each `RUN_UNIT` and its matching reveal remain disabled until that prompt’s `COMMIT_PREDICTION`. The committed option and its correctness affect no wallet value, score, star, failure, or gate predicate.

### Post-evidence transfer: `l9-cost-transfer`

This is not a prediction and does not dispatch `COMMIT_PREDICTION`. It appears only after all three evidence reveals and starts with `BEGIN_TRANSFER`.

**Question:** “A deployment summary receives `12,000` input tokens and returns `3,000`. Which side costs more at the rates you just saw?”

- `l9-transfer-input-cost` — **“Input costs more”**
- `l9-transfer-output-cost` — **“Output costs more”**

Reveal after submission: **“`3,000 × 5 = 15,000` cost-weighted output tokens; `12,000 × 1 = 12,000` cost-weighted input tokens.”** (`C1`)

The correct post-evidence action, not any pre-reveal guess, satisfies the gate.

## 9. Fail-state

There is no economic fail-freeze in this level:

- A wrong pre-reveal prediction is retained beside the evidence and has no gameplay penalty.
- A wrong causal explanation does not alter the wallet or freeze the screen; it simply withholds the optional second star.
- A wrong transfer answer cannot dispatch `COMPLETE_ATTEMPT`. The transfer panel shows **“Token count alone is not cost. Apply the rate to each side.”**
- `UI_REWIND_CONTROL`, labeled **“Try the new workload again,”** dispatches `REWIND_TO_CHECKPOINT { checkpointId: "l9-before-transfer" }`.
- Rewind preserves the three priced rows, their reveals, the wallet, and all prediction history. It clears only the transfer branch.

If an invalid client forces `COMPLETE_ATTEMPT` before `l9-transfer-output-cost`, `UI_RESULT_SCREEN` returns:

- Headline: **“Apply the rates once more.”**
- Evidence: **“The three tapes are complete; the new workload still needs a cost-side decision.”**
- Retry: **“Try the new workload again.”**

`failureRules` is empty because no wrong selection creates a priced route where `actualUsd > validAlternativeUsd`. This prevents a ledger-contradicting freeze.

## 10. Gate & stars

- **Pass / 1 star:** After `l9-reveal-review`, the player dispatches `BEGIN_TRANSFER { challengeId: "l9-cost-transfer" }`, then acknowledges `l9-transfer-output-cost`.
- **2 stars:** Pass plus acknowledge `l9-cause-output-rate` after Codegen evidence is visible.
- **3 stars:** Two-star predicate, first attempt, and authoritative spend at or below `$0.74`.
- Spending below the threshold without the post-evidence transfer action does not pass.
- No gate or star reads a prediction option, prediction correctness, or equality with `correctOptionId`.
- Every prediction sequence may be entirely wrong while the same post-evidence actions still earn three stars.
- The removed model picker cannot silently determine the cost star; the attempt’s model is fixed and visible as Sonnet.
- The post-attempt Opus and Fable comparisons confirm the rule but cannot satisfy the gate retroactively.

Result copy:

- Pass headline: **“You priced the workload.”**
- Fail headline: **“Apply the rates once more.”**
- Evidence line: **“Same input size; answer length moved the bill.”**
- Continue: **“Continue”**
- Retry: **“Try the new workload again”**

## 11. Toasts

| Toast id | Trigger | Exact copy |
|---|---|---|
| `l9-estimate-first` | First `OPEN_PREDICTION` | **“Commit an estimate. Then the wire will show what happened.”** |
| `l9-output-jit` | `l9-reveal-search` completes | **“Generated answer tokens are output. Output is priced at `5x` the model’s base input rate.”** (`C1`) |
| `l9-codegen-contrast` | Codegen row settles beside Search | **“Same input bill. A much longer answer made this row 22.6× larger.”** |
| `l9-review-transfer` | Short-review row settles | **“A short answer leaves input in charge. The rate matters together with the workload.”** |
| `l9-transfer-hint` | Incorrect transfer explanation is acknowledged | **“Weight each side by its rate before comparing.”** |
| `l9-counterfactual` | `REVEAL_COUNTERFACTUAL` | **“The model multiplier bites hardest where the priced workload is largest.”** |

The word **output** first appears as priced vocabulary only when `l9-output-jit` fires after the first committed prediction and resolved request.

## 12. QA gate

Real-browser click-through must assert:

1. The opening screen contains no token counts, multipliers, correct options, model picker, model-price table, reference total, or anti-pattern total.
2. `ENTER_LEVEL` receives the slug `09-model-the-work`.
3. The level’s concept is `workload-cost-mix`; its only prerequisite is `write-vs-read`.
4. `scenario === "dev-only"` instantiates exactly three priced units, not the twelve-spawn scenario.
5. `cfg.who === "inline"` and `cfg.devModel === "sonnet"` remain locked during the attempt.
6. Every job uses exactly one clean `MAIN_SESSION_CONTEXT`; no cache entry or growing history changes the authored input.
7. Each `RUN_UNIT` is disabled until its matching `COMMIT_PREDICTION`.
8. Each `RUN_UNIT` produces exactly one `LedgerRow` and one tape row.
9. Exactly three priced requests and three tape rows exist after all jobs complete.
10. Every real request cost is positive; no positive value renders as `$0.0000`.
11. All request and total values equal the single authoritative table in §6 under `PRICE_REQUEST`.
12. Search and Short review are input-dominant in both tokens and dollars; Codegen is output-dominant in both.
13. Codegen’s final static tape row includes its output cost in row width and segment geometry.
14. `UI_TAPE_RENDERER` output geometry remains identical before and after the output teaching label becomes visible.
15. A wrong Search, Codegen, or Short-review prediction changes no score, star, wallet, failure, or gate result.
16. Prediction correctness is absent from `pass(st)`, `FailureRuleDef`, `GateDef`, and both `StarDef` predicates.
17. The transfer card is absent until `l9-reveal-review` completes.
18. The transfer shows `12,000 inputTok` and `3,000 outTok` without sending a priced request.
19. `ACK_EXPLANATION { explanationId: "l9-transfer-input-cost" }` does not pass and exposes the local retry.
20. Rewinding to `l9-before-transfer` preserves all three ledger rows, tape rows, reveals, wallet spend, and prediction history.
21. `ACK_EXPLANATION { explanationId: "l9-transfer-output-cost" }` after the evidence reveal passes regardless of all three prediction selections.
22. `COMPLETE_ATTEMPT` cannot pass before a qualifying post-evidence action.
23. No `FREEZE_FAILURE` can dispatch in this level; `failureRules.length === 0`.
24. The reference Sonnet configuration plus the correct transfer action is winnable from seed `904409` and reaches three stars.
25. The anti-pattern replay combines `antiCfg.devModel === "fable"` with `l9-transfer-input-cost`; it fails the behavioral gate and exceeds the three-star spend threshold.
26. A Fable counterfactual paired with the correct transfer action may demonstrate understanding; model identity alone is never a behavioral failure.
27. Counterfactual controls and model-price totals are absent before `COMPLETE_ATTEMPT`.
28. The post-attempt overlay uses the §6 values and does not create ledger rows or mutate the wallet.
29. Keyboard and pointer users can commit every prediction, run every job, inspect every segment, answer and retry the transfer, complete the level, and reveal the counterfactual.
30. Screen-reader announcements state workload, bucket, token count, rate, dollars, and row total in ledger order.
31. Reduced-motion mode draws the same final tape geometry without requiring hover.
32. Exact replay from seed `904409` and the same `Action[]` yields byte-identical ledger, wallet, predictions, acknowledged explanations, transfer state, stars, and result.
33. Static final tape bars remain legible without hover, and every output segment retains its authoritative visual weight.
34. The specification contains one authoritative request-price table and no superseded totals or unreachable failure branch.

## 13. Reference-bar justification

The opening reaches a tactile prediction in two seconds and withholds every answer-shaped number. Search establishes a compact baseline, Codegen breaks it with a visually overwhelming output segment, and Short review immediately prevents overgeneralization. Because the prompt asks about dollars, Search’s token and dollar dominance now agree unambiguously instead of teaching two competing answers.

The predictions unlock evidence but never determine success. Understanding is measured only after all evidence exists, when the player applies output’s rate to a new workload whose smaller output token count still costs more. A wrong transfer answer rewinds only that decision and preserves the mastered tapes.

The per-job model picker is removed rather than silently making Sonnet the hidden three-star answer. Model differences return after completion as a counterfactual, where they clarify that the multiplier affects every workload but the output-heavy job carries most of the dollar spread. The tape cites the canonical `outTok × 5` visual-weight model, so the aha is economically and visually truthful.

**Assumptions and tradeoffs:** Search’s `800 outTok`, Short review’s `500 outTok`, and the transfer workload are calibrated scenario values. They are tagged `[ESTIMATE]` or `[FICTION]`; `6,000 inputTok`, `44,000 Codegen output tokens`, rate multipliers, and model prices trace to `C28` and `C1–C4`. Separate clean main contexts intentionally remove cache and history variation so workload mix is the only causal variable.
