# Level 8 — Growing Pains

## 1. Identity

- `id`: `"08-growing-pains"`
- `title`: `Growing Pains`
- `tier`: `2`
- `objective`: “Six tickets just landed. Route each one before the session gets crowded.”
- `concept.id`: `"inline-vs-subagent-routing"`
- `concept.privateDesignerSummary`: “Dependent follow-ups benefit from the live main prefix; independent parallel work avoids an enlarged main history by using an isolated, bounded shared spawn prefix.”
- `concept.postRevealRule`: “Keep work that needs this conversation here; route independent parallel work away when carried history costs more than the bounded spawn base.”
- `prerequisiteConceptIds`: `["prefix-reuse", "shared-subagent-window"]`

The central choice is a real tradeoff: the main route is cheaper for the two dependent follow-ups, while the shared subagent route is cheaper for the four independent jobs.

## 2. Objects used

- `MAIN_SESSION_CONTEXT`
- `SUBAGENT_CONTEXT`
- `PREFIX_STACK`
- `PB_HISTORY`
- `PB_CURRENT`
- `Request`
- `CacheEntry`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Checkpoint`
- `FailureRuleDef`
- `GateDef`
- `CounterfactualDef`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_MAIN_CACHE_PANEL`
- `UI_TAPE_RENDERER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `UI_COUNTERFACTUAL_OVERLAY`
- `"predict-before-reveal"`
- `"fail-freeze-rewind"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

The explain-and-transfer phase uses the composition recipe in `OBJECT_MODEL.md`; it is not an additional `InteractionPatternId`.

## 3. Cold-open / narrative

`maxInstructionCards: 0`; `firstInteractiveBySec: 2` `[ESTIMATE]`. All beat timings below are `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Six ticket cards slap onto the desk. Copy: **“Release train leaves in ten minutes.”** |
| `0.6s` | The first card opens: **“Rename the helper you just added.”** Its existing `PREFIX_STACK` is visible, but no route price or recommendation is shown. |
| `1.2s` | Two neutral route targets slide in: **“Keep here”** and **“Send out.”** |
| `2.0s` | Both targets accept pointer, touch, and keyboard placement. Copy: **“Where should this ticket run?”** |

No pre-play copy names the preferred route, the bounded spawn base, the enlarged-history penalty, or the post-reveal rule.

## 4. Exact event sequence

All requests use Sonnet (`C3`). The six fixture requests complete within the live five-minute shared-subagent window (`C1`, `C27`). Request buckets and authoritative prices are defined once in §6.

1. **Enter the level — `ev-enter`.**  
   Trigger → level mount.  
   Action → `ENTER_LEVEL { levelId: "08-growing-pains" }`.  
   Mutations → initializes `ReducerState`, the level-start `Checkpoint`, `Wallet` with `GP_BUDGET_USD`, `MAIN_SESSION_CONTEXT`, the six `UnitSeed` instances, and the context seeds in §5. The first main request sees the `34,000`-token inline fixture (`C29`).

2. **Predict the first follow-up — `ev-predict-rename`.**  
   Trigger → the player opens **“Rename the helper you just added.”**  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-route-rename", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-rename-cost" }`; `SELECT_PREDICTION`; `COMMIT_PREDICTION`.  
   Mutations → the prediction becomes committed. No route is selected, no request runs, and no correctness, price, or preferred target is revealed.

3. **Route and run the first follow-up — `ev-reveal-rename`.**  
   Trigger → after prediction commitment, the player independently chooses **Keep here** or **Send out**.  
   Actions → `ROUTE_UNIT { unitId: "followup-rename", contextKind }`; `RUN_UNIT { unitId: "followup-rename" }`; `REVEAL_PREDICTION { promptId: "p-rename-cost", correctOptionId: "main-costs-less" }`.  
   Mutations → exactly one of `r-followup-rename-main` or `r-followup-rename-sub` appends as a `LedgerRow`; `Wallet`, `lastRequests`, the chosen `ExecutionContext`, and its `PREFIX_STACK` update.  
   Reveal copy → **“Keeping it here reused the conversation that already held the change.”**  
   A wrong prediction changes none of the route, request, wallet, failure, gate, or star rules.

4. **Predict, route, and run the dependent assertion — `ev-reveal-assert`.**  
   Trigger → card: **“Update the assertion for that rename.”**  
   Actions → create `cp-route-assert`; run the complete prediction cycle for `p-assert-cost`; then dispatch `ROUTE_UNIT`, `RUN_UNIT`, and `REVEAL_PREDICTION { correctOptionId: "main-costs-less" }`.  
   Mutations → exactly one of `r-followup-assert-main` or `r-followup-assert-sub` appends. On the reference route, the main request reads `56,000` cached history tokens, derived from the `34,000` base plus one `22,000` growth step (`C29`).  
   Reveal copy → **“This task depended on the rename, so sending it out would have copied that context into another room.”**

5. **Expose the independent batch without revealing its route — `ev-open-batch`.**  
   Trigger → four cards fan out: **“Audit auth imports,” “Check API callers,” “Review dependency licenses,”** and **“Scan package exports.”** A neutral bracket says **“Can run together.”**  
   Actions → `SET_PREFIX_BLOCK_CONTENT` sets the main batch-phase `PB_HISTORY` fixture to `600,000` tokens `[FICTION]`; `CREATE_CHECKPOINT { checkpointId: "cp-parallel-route", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-batch-cost" }`.  
   Mutations → `UI_PREFIX_STACK_VISUALIZER` shows the enlarged main stack without price, good/bad styling, or a route recommendation. The four route cards remain unplaced.

6. **Commit the batch prediction, then choose a route — `ev-route-batch`.**  
   Trigger → the player commits `p-batch-cost`.  
   Actions → `COMMIT_PREDICTION { promptId: "p-batch-cost" }`; the neutral route targets unlock; the player then dispatches four `ROUTE_UNIT` actions with either `contextKind: "main"` or `contextKind: "subagent"`.  
   Mutations → prediction state and route state remain separate. Changing the prediction option cannot select a route or alter economics.

7. **Resolve an inline mistake — `ev-inline-audit-failure`.**  
   Preconditions → `audit-imports` is routed to `MAIN_SESSION_CONTEXT`.  
   Action → `RUN_UNIT { unitId: "audit-imports" }`.  
   Mutations → `r-audit-main` appends, charging `GP_AUDIT_INLINE_USD`; `Wallet` remains above zero, proving that the lesson is not budget exhaustion.  
   After the complete row renders, the failure frame displays:
   - the charged `r-audit-main` ledger row;
   - its `600,000`-token `PB_HISTORY` span;
   - its `6,000`-token `PB_CURRENT` span (`C28`);
   - an authored, uncharged alternative quote with the exact buckets and `GP_AUDIT_SUB_USD`;
   - `GP_AUDIT_ROUTE_PENALTY_USD`.

   Action → `FREEZE_FAILURE` with failure `f-inline-audit`.  
   Mutations → `clock.frozen = true`; economic controls lock; the comparison proves `actualUsd > validAlternativeUsd`. Prediction correctness is not inspected.

8. **Rewind locally — `ev-rewind-audit`.**  
   Trigger → player activates **“Route the batch again.”**  
   Action → `REWIND_TO_CHECKPOINT { checkpointId: "cp-parallel-route" }`.  
   Mutations → deterministic replay removes `r-audit-main`, restores wallet, cache, routes, and batch prediction state to the checkpoint, and preserves both completed follow-up rows and reveals.

9. **Resolve the shared subagent batch — `ev-reveal-batch`.**  
   Preconditions → the four independent cards are routed to `SUBAGENT_CONTEXT`s and `p-batch-cost` is committed.  
   Actions → four `RUN_UNIT` actions; then `REVEAL_PREDICTION { promptId: "p-batch-cost", correctOptionId: "subagent-batch-costs-less" }`.  
   Mutations:
   - `r-audit-sub` writes the measured `26,237`-token identical spawn prefix at `CACHE_TIER_5M` (`C10`);
   - `r-callers-sub`, `r-licenses-sub`, and `r-exports-sub` each read that live `26,237`-token prefix (`C10`, `C12`);
   - four isolated `PREFIX_STACK` records and four `LedgerRow`s append;
   - the shared subagent `CacheEntry` is written once and touched three times;
   - main and subagent cache namespaces remain isolated;
   - the main `PB_HISTORY` does not absorb the four jobs.

   `ahaFrame: true` attaches to `r-callers-sub`. Only now show: **“Four fresh rooms reused one bounded base instead of carrying the whole conversation.”**

10. **Explain after evidence — `ev-explain-routing`.**  
    Trigger → after `ev-reveal-batch`, the player chooses one causal explanation.  
    Action → `ACK_EXPLANATION { explanationId }`.  
    Required explanation → `"relationship-and-carried-context"`.  
    Mutations → the selected explanation is stored in `acknowledgedExplanationIds`. This is post-evidence gate evidence, not a prediction.

11. **Apply the rule to unseen work — `ev-transfer-routing`.**  
    Actions → `CREATE_CHECKPOINT { checkpointId: "cp-transfer", reason: "decision" }`; `BEGIN_TRANSFER { challengeId: "route-transfer-pair" }`.  
    Cards:
    - **“Change the error string you just reviewed.”**
    - **“Scan an unrelated package tree.”**

    Required post-evidence actions:
    - `ROUTE_UNIT { unitId: "transfer-error-string", contextKind: "main" }`;
    - `ROUTE_UNIT { unitId: "transfer-package-scan", contextKind: "subagent" }`.

    These transfer cards test routing only and create no `Request`, `LedgerRow`, or wallet mutation. An incorrect pair returns to `cp-transfer` without invoking `FREEZE_FAILURE`.

12. **Complete and compare — `ev-complete`.**  
    Trigger → the explanation and transfer pair satisfy the gate.  
    Actions → `COMPLETE_ATTEMPT`; on player request, `REQUEST_COUNTERFACTUAL { comparisonId: "all-inline" }`; then `REVEAL_COUNTERFACTUAL { comparisonId: "all-inline" }`.  
    Mutations → `UI_RESULT_SCREEN` evaluates the post-evidence gate and stars. Only after completion, `UI_COUNTERFACTUAL_OVERLAY` reveals `GP_ALL_INLINE_USD`, `GP_REFERENCE_USD`, `GP_ROUTE_DELTA_USD`, and the derived percentage reduction.

## 5. Level data

Level-specific calibrated values:

```ts
const GP_BUDGET_USD = 1.00;               // [FICTION]
const GP_BATCH_HISTORY_TOK = 600_000;      // [FICTION]
const GP_INDEPENDENT_OUT_TOK = 4_000;      // [FICTION]
```

`GP_BATCH_HISTORY_TOK` is followed by the canonical `22,000`-token inline growth step from `C29`, producing the four main-route history sizes priced in §6. Lowering these review/scan tasks to `GP_INDEPENDENT_OUT_TOK` keeps output present and fully priced while allowing routing—not generated-code volume—to drive this level’s decision.

The six fixture `UnitSeed` values are:

| `id` | `kind` | `deps` | `workIn` | `outTok` | Notes |
|---|---|---|---:|---:|---|
| `followup-rename` | `TASK` | `[]` | `2,000` `[FICTION]` | `4,000` `[FICTION]` | Depends on pre-level conversation content. |
| `followup-assert` | `TASK` | `["followup-rename"]` | `1,000` `[FICTION]` | `2,000` `[FICTION]` | Depends on the preceding rename. |
| `audit-imports` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent batch leader. |
| `check-callers` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |
| `review-licenses` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |
| `scan-exports` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |

All six use ticket `1`, Sonnet, and an authored `1`-hour unit duration `[FICTION]`; those hours do not set simulated request spacing. The four independent requests are scheduled inside the five-minute live shared-prefix window (`C1`, `C27`).

Context seeds instantiate:

- one `MAIN_SESSION_CONTEXT`;
- two ad-hoc dependent-work `SUBAGENT_CONTEXT`s without a `sharedPrefixPoolId`, so copied dependency context cannot cross namespaces;
- four independent-work `SUBAGENT_CONTEXT`s sharing `sharedPrefixPoolId: "gp-independent-pool"` while retaining distinct execution contexts;
- corresponding `PrefixStackSeed` values using canonical `PrefixBlock` kinds.

```ts
const growingPains: LevelDef = {
  id: "08-growing-pains",
  tier: 2,
  title: "Growing Pains",
  objective:
    "Six tickets just landed. Route each one before the session gets crowded.",

  concept: {
    id: "inline-vs-subagent-routing",
    privateDesignerSummary:
      "Dependent follow-ups benefit from the live main prefix; independent parallel work avoids enlarged main history through a bounded shared spawn prefix.",
    postRevealRule:
      "Keep work that needs this conversation here; route independent parallel work away when carried history costs more than the bounded spawn base."
  },
  prerequisiteConceptIds: ["prefix-reuse", "shared-subagent-window"],

  unlocks: "route",
  introducedControls: ["route"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "prompts",
    "width",
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
  seed: 8292, // [FICTION] deterministic identifier
  budgetUsd: GP_BUDGET_USD,
  clockCapMin: 5, // C1
  cfgOverride: {
    devModel: "sonnet",
    who: "inline",
    prompts: "identical",
    width: 4,
    oneHourFlag: false
  },
  scenario: "mixed-routing",
  scenarioData: {
    units: GP_UNIT_SEEDS,
    contexts: GP_CONTEXT_SEEDS,
    prefixStacks: GP_PREFIX_STACK_SEEDS,
    workloads: GP_WORKLOAD_SEEDS,
    allowedCfg: { who: ["inline", "subagent"] },
    estimates: [
      { label: "budgetUsd", value: GP_BUDGET_USD, tag: "[FICTION]" },
      {
        label: "independent-phase main history",
        value: GP_BATCH_HISTORY_TOK,
        tag: "[FICTION]"
      },
      {
        label: "independent review output per request",
        value: GP_INDEPENDENT_OUT_TOK,
        tag: "[FICTION]"
      },
      {
        label: "followup rename input",
        value: 2000,
        tag: "[FICTION]"
      },
      {
        label: "followup rename output",
        value: 4000,
        tag: "[FICTION]"
      },
      {
        label: "followup assertion input",
        value: 1000,
        tag: "[FICTION]"
      },
      {
        label: "followup assertion output",
        value: 2000,
        tag: "[FICTION]"
      }
    ]
  },

  coldOpen: GP_COLD_OPEN_FROM_SECTION_3,
  sequence: GP_EVENTS_FROM_SECTION_4,
  predictions: GP_PREDICTIONS_FROM_SECTION_8,
  toasts: GP_TOASTS_FROM_SECTION_11,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "inlineRereadUsd",
    cite: "C29",
    line:
      "The independent audit carried a 600,000-token main history when a bounded spawn base was cheaper."
  },
  failureRules: [
    {
      id: "f-inline-audit",
      predicate: GP_INLINE_AUDIT_PREDICATE,
      decisiveEventId: "ev-inline-audit-failure",
      causeCode: "INLINE_HISTORY_OVERREAD",
      message:
        "The audit carried 600k history. The bounded spawn route costs $0.08161125 less.",
      checkpointId: "cp-parallel-route",
      highlightObjectIds: [
        "main-history-600k",
        "r-audit-main",
        "audit-sub-route-quote"
      ],
      actualUsd: GP_AUDIT_INLINE_USD,
      validAlternativeUsd: GP_AUDIT_SUB_USD
    }
  ],
  checkpoints: [
    {
      id: "cp-route-rename",
      createBeforeEventId: "ev-reveal-rename",
      reason: "decision",
      resumeLabel: "Route the rename again"
    },
    {
      id: "cp-route-assert",
      createBeforeEventId: "ev-reveal-assert",
      reason: "decision",
      resumeLabel: "Route the assertion again"
    },
    {
      id: "cp-parallel-route",
      createBeforeEventId: "ev-route-batch",
      reason: "decision",
      resumeLabel: "Route the batch again"
    },
    {
      id: "cp-transfer",
      createBeforeEventId: "ev-transfer-routing",
      reason: "decision",
      resumeLabel: "Try the transfer pair again"
    }
  ],

  gate: {
    predicateId: "post-evidence-routing-transfer",
    evidenceRevealEventIds: ["ev-reveal-batch"],
    postEvidenceActionRequirements: [
      {
        id: "explain-after-batch",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "ev-reveal-batch",
        match: { explanationId: "relationship-and-carried-context" }
      },
      {
        id: "route-dependent-transfer-main",
        kind: "action-observed",
        actionType: "ROUTE_UNIT",
        afterEventId: "ev-reveal-batch",
        match: {
          unitId: "transfer-error-string",
          contextKind: "main"
        }
      },
      {
        id: "route-independent-transfer-subagent",
        kind: "action-observed",
        actionType: "ROUTE_UNIT",
        afterEventId: "ev-reveal-batch",
        match: {
          unitId: "transfer-package-scan",
          contextKind: "subagent"
        }
      }
    ],
    behavioralRequirements: [
      GP_ACKNOWLEDGED_CAUSAL_EXPLANATION,
      GP_COMPLETED_TRANSFER_PAIR
    ],
    explanationRequirement: GP_ACKNOWLEDGED_CAUSAL_EXPLANATION,
    transferRequirement: GP_COMPLETED_TRANSFER_PAIR
  },

  pass(st) {
    return GP_PURE_PASS_EVALUATOR(st);
  },

  star2: {
    label: "Route the relationship",
    predicate: GP_GATE_PASSED_WITH_NO_HAND_CODE,
    reason:
      "You applied the revealed rule to both unseen tasks without hand-coding."
  },
  star3: {
    label: "Clean split",
    predicate: GP_GATE_PASSED_NO_HAND_CODE_AND_REFERENCE_SPEND,
    reason:
      "Your economic route actions matched the mixed reference and spent no more than GP_REFERENCE_USD."
  },

  referenceCfg: {
    who: "subagent",
    width: 4,
    prompts: "identical"
  },
  antiCfg: {
    who: "inline",
    width: 1,
    prompts: "identical"
  },
  counterfactuals: [
    {
      id: "all-inline",
      unlockAfterEventId: "ev-complete",
      kind: "anti-pattern",
      cfg: {
        who: "inline",
        width: 1,
        prompts: "identical"
      },
      scenarioPatch: GP_ALL_INLINE_ROUTE_PATCH,
      comparisonQuestion:
        "What changed when the four independent jobs carried the main conversation?",
      revealCopy:
        "The mixed route cut this fixture's bill by 53.24% because three warm bounded reads replaced four growing main-history reads."
    }
  ],

  tape: GP_TAPE_FROM_SECTION_7,
  result: GP_RESULT_FROM_SECTION_10,
  vocabulary: [
    {
      term: "carried context",
      definition:
        "Earlier conversation tokens included with the current request.",
      firstNeededEventId: "ev-reveal-assert",
      toastId: "t-main-growth"
    }
  ],
  qa: GP_QA_FROM_SECTION_12
};
```

`GP_PURE_PASS_EVALUATOR` reads only `acknowledgedExplanationIds` and `completedTransferIds`. It never reads the prediction option, prediction correctness, wallet, or initial fixture-route correctness.

The reference route vector is `[main, main, subagent, subagent, subagent, subagent]`. `referenceCfg.who` is the four-card batch default; the two dependent follow-up routes are explicit player actions. `GP_ALL_INLINE_ROUTE_PATCH` is `[main, main, main, main, main, main]`.

## 6. Pricing walkthrough

Sonnet prices are input `$3/M`, cache read `$0.30/M`, five-minute write `$3.75/M`, and output `$15/M` (`C1`, `C3`). Every value below is produced by `PRICE_REQUEST` without intermediate rounding.

For dependent work routed out, the required main-session material becomes fresh `inputTok` because the new `SUBAGENT_CONTEXT` cannot read the main cache namespace. Each ad-hoc dependent subagent is cold and does not join the independent batch’s shared pool.

This is the level’s sole authoritative request-price table:

| Request | Route | Authoritative buckets | Exact USD |
|---|---|---|---:|
| `r-followup-rename-main` | main | `34,000 read` (`C29`) + `2,000 input` `[FICTION]` + `4,000 output` `[FICTION]` | `$0.0762` |
| `r-followup-rename-sub` | isolated cold subagent | `26,237 write` (`C10`) + `36,000 input` (`34,000` required context plus `2,000` current) + `4,000 output` | `$0.26638875` |
| `r-followup-assert-main` | main | `56,000 read` (`C29`) + `1,000 input` `[FICTION]` + `2,000 output` `[FICTION]` | `$0.0498` |
| `r-followup-assert-sub` | isolated cold subagent | `26,237 write` (`C10`) + `57,000 input` (`56,000` required context plus `1,000` current) + `2,000 output` | `$0.29938875` |
| `r-audit-sub` | shared-pool cold subagent | `26,237 write` (`C10`) + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.17638875` |
| `r-callers-sub` | shared-pool warm subagent | `26,237 read` (`C10`) + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.0858711` |
| `r-licenses-sub` | shared-pool warm subagent | same authoritative buckets as `r-callers-sub` | `$0.0858711` |
| `r-exports-sub` | shared-pool warm subagent | same authoritative buckets as `r-callers-sub` | `$0.0858711` |
| `r-audit-main` | main | `600,000 read` `[FICTION]` + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.2580` |
| `r-callers-main` | main | `622,000 read` (`600,000 + C29`) + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.2646` |
| `r-licenses-main` | main | `644,000 read` (`600,000 + 2×C29`) + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.2712` |
| `r-exports-main` | main | `666,000 read` (`600,000 + 3×C29`) + `6,000 input` (`C28`) + `4,000 output` `[FICTION]` | `$0.2778` |

The decisive failure is economically true:

```text
GP_AUDIT_INLINE_USD = $0.2580
GP_AUDIT_SUB_USD = $0.17638875
GP_AUDIT_ROUTE_PENALTY_USD
  = $0.2580 − $0.17638875
  = $0.08161125
```

The punished inline request is `46.27%` more expensive than its valid subagent alternative; choosing the subagent saves `31.63%` of that request’s inline cost. Both rows include the `4,000` output tokens at the `5x` output rate (`C1`, `C3`).

Reference total:

```text
GP_REFERENCE_USD
  = $0.0762
  + $0.0498
  + $0.17638875
  + 3×$0.0858711
  = $0.56000205
```

All-inline post-attempt total:

```text
GP_ALL_INLINE_USD
  = $0.0762
  + $0.0498
  + $0.2580
  + $0.2646
  + $0.2712
  + $0.2778
  = $1.1976
```

Derived routing difference:

```text
GP_ROUTE_DELTA_USD
  = GP_ALL_INLINE_USD − GP_REFERENCE_USD
  = $0.63759795

GP_ROUTE_SAVINGS_RATIO
  = $0.63759795 / $1.1976
  = 0.5323964178356712
```

The mixed route reduces the six-ticket bill by `53.24%`, comfortably exceeding the required `20%` effect. `GP_ROUTE_DELTA_USD` is arithmetic derived from the priced rows; it is not a separate `[FICTION]` estimate. Its underlying `600,000`-token history and `4,000`-token outputs remain explicitly tagged `[FICTION]`.

With `GP_BUDGET_USD`, the reference leaves `$0.43999795`; the all-inline counterfactual overspends by `$0.1976`. Budget is presentation evidence only and is not part of the pass gate.

## 7. Tape sequence

`tape.rowSource: "ledger"` and `hoverEnabled: true`.

Actual tape slots:

1. `followup-rename`: exactly one of `r-followup-rename-main` or `r-followup-rename-sub`.
2. `followup-assert`: exactly one of `r-followup-assert-main` or `r-followup-assert-sub`.
3. `audit-imports`: `r-audit-main` on the failure branch or `r-audit-sub` on the shared-subagent branch.
4. `check-callers`: `r-callers-sub` on the reference branch.
5. `review-licenses`: `r-licenses-sub` on the reference branch.
6. `scan-exports`: `r-exports-sub` on the reference branch.

`REWIND_TO_CHECKPOINT("cp-parallel-route")` removes the failure-only `r-audit-main` row before the corrected branch appends `r-audit-sub`.

Reveal groups:

```ts
[
  {
    id: "rename",
    requestIds: ["r-followup-rename-main", "r-followup-rename-sub"],
    gatedByPredictionId: "p-rename-cost"
  },
  {
    id: "assert",
    requestIds: ["r-followup-assert-main", "r-followup-assert-sub"],
    gatedByPredictionId: "p-assert-cost"
  },
  {
    id: "batch",
    requestIds: [
      "r-audit-sub",
      "r-callers-sub",
      "r-licenses-sub",
      "r-exports-sub"
    ],
    gatedByPredictionId: "p-batch-cost"
  }
]
```

Only the request ID that exists in the actual ledger renders. Alternative IDs in a reveal group do not create ghost tape rows.

`ahaRequestId: "r-callers-sub"`. At that frame, the first warm `26,237`-token read aligns with the cold bounded write above it while a labeled, uncharged ruler recalls the earlier `600,000`-token main span.

`UI_TAPE_RENDERER` uses the canonical `tapeWeight` and segment-share formulas from `OBJECT_MODEL.md`. Every row includes output in its geometry from its first rendered frame:

```text
row weight ∝ readTok×0.1 + inputTok + writeTok×tier + outTok×5
```

Thus the violet output segment contributes its full priced share even before output pricing receives a teaching label. No visual width may be computed from input-side tokens alone.

The all-inline tape remains unavailable until `ev-complete`.

## 8. Prediction prompts

Prediction commitment unlocks evidence but never chooses a route, spends wallet, freezes the level, changes stars, or satisfies the gate.

### `p-rename-cost`

**Question:** “Before you route it: which room do you expect to cost less for this rename?”

- `main-costs-less`: “The current conversation.”
- `subagent-costs-less`: “A fresh subagent.”

After commitment, both route targets remain independently selectable.

Reveal sentence: **“The current conversation already contained the code and decision this follow-up needed.”**

### `p-assert-cost`

**Question:** “The assertion depends on the rename. Which route do you expect to cost less?”

- `main-costs-less`: “Keep it here.”
- `subagent-costs-less`: “Send it out.”

Reveal sentence: **“Sending it out had to copy the dependency context into an isolated namespace.”**

### `p-batch-cost`

The visible `600,000`-token stack and the **“Can run together”** bracket provide inferable evidence, but neither route has a dollar label.

**Question:** “Four unrelated jobs can start together. Which route do you expect to cost less?”

- `main-batch-costs-less`: “Carry this conversation into all four.”
- `subagent-batch-costs-less`: “Give the four jobs fresh subagents.”

Reveal sentence: **“One bounded spawn write and three warm reads cost less than four growing main-history reads.”**

No styling, order, disabled state, stack color, animation, or cost preview signals the correct prediction before commitment.

### Post-evidence explanation

This is not a `PredictionPromptDef`.

**Question:** “What made the cheaper route change between the follow-ups and the batch?”

- `task-size-only`: “Only the current task’s input size.”
- `relationship-and-carried-context`: “Whether the job needed this conversation, plus how much history its route carried.”
- `fresh-is-always-cheaper`: “Fresh subagents are always cheaper.”

Selecting an explanation dispatches `ACK_EXPLANATION`. Only `"relationship-and-carried-context"` satisfies the post-evidence explanation requirement.

## 9. Fail-state

- `failureRuleId`: `f-inline-audit`
- Decisive event: `ev-inline-audit-failure`
- Predicate: the player routes `audit-imports` to `MAIN_SESSION_CONTEXT` and runs it after `ev-open-batch`.
- Cause code: `INLINE_HISTORY_OVERREAD`
- Freeze timing: after `r-audit-main` and every non-zero `WireSegment` are fully visible, before any later independent ticket runs.
- Exact causal message: **“The audit carried 600k history. The bounded spawn route costs $0.08161125 less.”**
- Charged route: `GP_AUDIT_INLINE_USD`
- Valid alternative: `GP_AUDIT_SUB_USD`
- Rewind label: **“Route the batch again.”**
- Rewind target: `cp-parallel-route`

The decisive frame visibly places the charged ledger row beside the authored uncharged alternative quote, including both sets of token buckets. The alternative is labeled **“Not charged — route comparison”** and is not a `Request`, `LedgerRow`, or tape row.

The freeze is local and economically true:

```text
GP_AUDIT_INLINE_USD > GP_AUDIT_SUB_USD
```

The wallet is still positive at the freeze, so wallet exhaustion cannot masquerade as the cause. The failure predicate does not inspect `PredictionState`; a wrong `p-batch-cost` prediction followed by the subagent route cannot freeze.

## 10. Gate & stars

The one-star pass gate uses only actions taken after `ev-reveal-batch`:

1. `ACK_EXPLANATION` records `"relationship-and-carried-context"`.
2. The unseen dependent error-string task is routed to `MAIN_SESSION_CONTEXT`.
3. The unseen unrelated package scan is routed to `SUBAGENT_CONTEXT`.

The initial three prediction choices and their correctness are excluded from `GateDef`, `pass(st)`, failure evaluation, wallet mutation, and every star predicate. The initial fixture routes are economic play actions and may affect actual spend, but the prediction records themselves never do.

- **1 star:** the post-evidence explanation and transfer gate passes.
- **2 stars — “Route the relationship”:** pass, and `counts.handCoded == 0`.
- **3 stars — “Clean split”:** two-star condition, plus actual spend is at most `GP_REFERENCE_USD`. Implement this with an `lte`/`gte` threshold, never exact floating-point equality.

Result copy:

- Pass headline: **“You gave each job the context it deserved.”**
- Fail headline: **“The new tickets still need two different routes.”**
- Evidence line: **“Dependent work stayed with useful history; independent work avoided carrying the enlarged session.”**
- Comparison line: **“Mixed routing saved $0.63759795, or 53.24%, on this fixture.”**
- Continue label: **“Next shift”**
- Retry label: **“Reroute the tickets”**

Budget cannot independently pass the level.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `t-main-growth` | After `ev-reveal-assert` renders the main reference row | **“Carried context: 56k reused for this dependent follow-up.”** |
| `t-batch-history` | After `ev-open-batch` completes | **“Main context now carries 600k tokens.”** |
| `t-isolated-base` | After `r-audit-sub` renders | **“Fresh subagent: separate 26,237-token base.”** |
| `t-shared-read` | After `r-callers-sub` renders | **“Identical spawn prefix reused: 26,237-token read.”** |
| `t-inline-cause` | `FREEZE_FAILURE` with `INLINE_HISTORY_OVERREAD` | **“The audit carried 600k history. The bounded spawn route costs $0.08161125 less.”** |
| `t-route-rule` | After the correct post-evidence explanation | **“Route by dependency and carried context, not by habit.”** |
| `t-reference` | After the all-inline counterfactual reveals | **“One bounded write and three reads replaced four growing main-history reads.”** |

`t-inline-cause` has `priority: "cause"`, uses `aria-live="assertive"`, and remains visible while frozen. Other toasts are polite, use the default `3,500ms` duration `[ESTIMATE]`, and deduplicate per attempt.

## 12. QA gate

Real-browser click-through must establish:

1. The first route interaction is available by `2s` `[ESTIMATE]`; no answer, dollar comparison, bounded-base explanation, or route recommendation appears first.
2. The level enters with `ENTER_LEVEL { levelId: "08-growing-pains" }`.
3. `concept.id` and `prerequisiteConceptIds` match the canonical registry exactly.
4. `LevelDef.interactionPatterns` contains only canonical kebab-case IDs.
5. Pointer, touch, and keyboard paths dispatch equivalent prediction and `ROUTE_UNIT` actions.
6. Prediction commitment and route choice are separate actions; committing any prediction cannot select a route.
7. No gated request or `REVEAL_PREDICTION` succeeds before its corresponding `COMMIT_PREDICTION`.
8. A wrong prediction followed by the same route produces byte-identical wallet, ledger, stars, failure, and gate state as a correct prediction followed by that route.
9. The one-star gate observes `ACK_EXPLANATION` and both transfer `ROUTE_UNIT` actions after `ev-reveal-batch`; no pre-reveal guess can pass or fail it.
10. Each priced `Request` produces exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row.
11. Rewinding to `cp-parallel-route` removes the failure-only `r-audit-main` row and restores wallet, cache, routes, and prediction state deterministically.
12. Every request cost is positive and matches `PRICE_REQUEST`; no positive amount displays as `$0.0000`.
13. Every rendered row’s non-zero `readTok`, `inputTok`, `writeTok`, and `outTok` produces exactly one corresponding `WireSegment`.
14. `UI_TAPE_RENDERER` row width is proportional to authoritative USD and includes `outTok × 5`; output-heavy visual weight cannot disappear when its teaching label is hidden.
15. `r-audit-sub` writes `26,237`; the next three independent spawns each read `26,237` while live (`C10`, `C12`).
16. Main and subagent cache namespaces remain isolated; `UI_MAIN_CACHE_PANEL` never displays the shared subagent entry.
17. The inline audit freezes only after its complete charged row renders.
18. The failure frame displays `GP_AUDIT_INLINE_USD`, `GP_AUDIT_SUB_USD`, their full bucket equations, and `GP_AUDIT_ROUTE_PENALTY_USD`.
19. `FailureRuleDef.actualUsd > FailureRuleDef.validAlternativeUsd`; the exact punished request is `46.27%` more expensive than its valid alternative.
20. The reference route produces `GP_REFERENCE_USD`; the post-attempt all-inline route produces `GP_ALL_INLINE_USD`; their derived difference is `GP_ROUTE_DELTA_USD`.
21. The reference route lowers the six-ticket bill by `53.24%`, exceeding the required `20%`.
22. The fixed reference route passes from seed `8292`; the all-inline route reaches the intended failure and cannot satisfy the post-evidence transfer gate without correction.
23. Static final tape bars show their final colors, output segments, and prices without hover.
24. Hover and keyboard focus equations reproduce every row in the sole pricing table.
25. Reduced-motion mode reveals identical final evidence immediately.
26. `UI_COUNTERFACTUAL_OVERLAY`, the all-inline total, the derived delta, and `concept.postRevealRule` remain unavailable until a meaningful attempt completes.
27. The player can win with only documented prediction, route, rewind, explanation, and completion controls.
28. At `320px` CSS width, the active route target, decisive tape row, cause toast, comparison quote, and rewind control do not overlap.
29. Screen-reader order is ticket → prediction → route controls → revealed row → causal caption; the failure announcement is assertive.
30. No stale alternative total, superseded price, unreachable failure rule, uppercase pattern alias, or legacy level/concept ID appears.

## 13. Reference-bar justification

The screen opens on one tactile sorting action and lets two dependent follow-ups establish that keeping work nearby can be economically sensible. It then enlarges the visible main stack and asks the player to reconsider the same control for unrelated parallel work. Choosing inline creates an immediate, truthful comparison: `$0.2580` versus `$0.17638875`, followed by a local rewind. The corrected batch reveals one bounded write and three warm reads, after which the player must articulate and transfer the rule to unseen tasks.

The post-attempt overlay confirms a material result—`53.24%` lower spend—without becoming a pre-play answer key. This preserves the predict, act, reveal, rewind, explain, and transfer rhythm of the reference experiences.

Significant calibration tradeoff: the independent review jobs use `4,000 outTok` `[FICTION]` instead of the `44,000` development-task output fixture in `C28`, and the pre-batch main history is `600,000` tokens `[FICTION]`. Those choices make routing visibly causal while retaining the canonical `6,000` work input (`C28`), measured `26,237` spawn prefix (`C10`), `22,000` inline growth (`C29`), and the full output-cost contribution required by `C1`, `C3`, and `UI_TAPE_RENDERER`.
