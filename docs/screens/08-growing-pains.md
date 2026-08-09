# Level 8 — Growing Pains

## 1. Identity

- `id`: `"08-growing-pains"`
- `title`: `Growing Pains`
- `tier`: `2`
- `objective`: “Six tickets just landed. Clear the release-train queue before the bell.”
- `concept.id`: `"inline-vs-subagent-routing"`
- `concept.privateDesignerSummary`: “The useful route depends on required conversation context, carried-history size, and the fixed cost of starting a bounded subagent.”
- `concept.postRevealRule`: “Keep work near useful context; move it only when the history it would carry costs more than fresh-room setup.”
- `concept.solutionVocabulary`: `["route", "routing", "inline", "subagent", "main session", "fresh room", "bounded spawn", "carried context", "dependent work", "independent work"]`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["prefix-reuse", "shared-subagent-window"]`

The central control has three economically distinct cases:

1. A dependent follow-up is cheaper in the current conversation because a fresh context must copy its dependency.
2. A tiny independent check is also cheaper in the current conversation because a cold `26,237`-token subagent write exceeds the main route’s marginal cached reread.
3. Four larger independent jobs are cheaper in a shared subagent wave once the main history reaches `600,000` tokens.

No route is therefore a universally dominant answer.

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
- `StatePredicate`
- `CounterfactualDef`
- `ScenarioFixtureDef`
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

`maxInstructionCards: 0`; `firstInteractiveBySec: 2` `[ESTIMATE]`. All beat timings below are presentation-only `[ESTIMATE]` values.

| Time | Beat |
|---:|---|
| `0.0s` | Six ticket cards slap onto the desk. Copy: **“Release train leaves in ten minutes.”** |
| `0.6s` | The first card opens: **“Rename the helper you just added.”** Its existing `PREFIX_STACK` is visible, but no route price or recommendation is shown. |
| `1.2s` | Two neutral targets slide in: **“Keep here”** and **“Send out.”** |
| `2.0s` | Both targets accept pointer, touch, and keyboard placement. Copy: **“Where should this ticket run?”** |

No pre-play copy names the preferred route, the bounded spawn base, the enlarged-history penalty, or the post-reveal rule. `title` and `objective` contain none of `concept.solutionVocabulary`.

## 4. Exact event sequence

All requests use Sonnet (`C3`). The four-request batch resolves within one live five-minute shared-subagent window (`C1`, `C27`). Request buckets and authoritative prices are defined once in §6.

1. **Enter the level — `ev-enter`.**  
   Trigger → level mount.  
   Action → `ENTER_LEVEL { levelId: "08-growing-pains" }`.  
   Mutations → initializes `ReducerState`, the level-start `Checkpoint`, scalar `wallet = GP_BUDGET_USD`, scalar `budget = GP_BUDGET_USD`, `MAIN_SESSION_CONTEXT`, the six `UnitSeed` instances, and the context seeds in §5. The first request sees the `34,000`-token inline base (`C29`).

2. **Predict the dependent follow-up — `ev-predict-followup`.**  
   Trigger → the player opens **“Rename the helper you just added.”**  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-route-followup", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-followup-cost" }`; `SELECT_PREDICTION`; `COMMIT_PREDICTION`.  
   Mutations → the prediction becomes committed. No route is selected, no request runs, and no correctness, price, or preferred target is revealed.

3. **Route and run the dependent follow-up — `ev-reveal-followup`.**  
   Trigger → after prediction commitment, the player independently chooses **Keep here** or **Send out**.  
   Actions → `ROUTE_UNIT { unitId: "followup-rename", contextKind }`; `RUN_UNIT { unitId: "followup-rename" }`; `REVEAL_PREDICTION { promptId: "p-followup-cost", correctOptionId: "main-costs-less" }`.  
   Mutations:

   - exactly one of `r-followup-main` or `r-followup-sub` appends as a `LedgerRow`;
   - scalar `wallet`, `attemptMetrics.spentUsd`, `attemptMetrics.requestCount`, `lastRequests`, the chosen `ExecutionContext`, and its `PREFIX_STACK` update;
   - the returned result enters the main conversation, leaving its next request with a fixed `56,000`-token cached history: `34,000 + 22,000` (`C29`).

   Reveal copy → **“The current conversation already held the change this follow-up needed.”**  
   A wrong prediction changes none of the route, request, wallet, failure, gate, or star rules.

4. **Test a small independent job — `ev-reveal-label-check`.**  
   Trigger → card: **“Read one package label. No release files are needed.”** The visible comparison shows a `56,000`-token live main prefix and a separate `26,237`-token cold spawn base, with no dollar labels or preferred styling.  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-route-label-check", reason: "decision" }`; complete the prediction cycle for `p-label-cost`; then dispatch `ROUTE_UNIT { unitId: "package-label", contextKind }`, `RUN_UNIT { unitId: "package-label" }`, and `REVEAL_PREDICTION { promptId: "p-label-cost", correctOptionId: "main-costs-less" }`.  
   Mutations:

   - exactly one of `r-label-main` or `r-label-sub` appends;
   - the subagent alternative uses an isolated cold namespace with no `sharedPrefixPoolId`;
   - the later batch cannot reuse a cache written by `r-label-sub`.

   Reveal copy → **“This job needed no conversation history, but its tiny payload cost less than opening a cold room.”**  
   This result is non-punitive: choosing the more expensive subagent route does not dispatch `FREEZE_FAILURE`, though its actual spend can prevent the three-star threshold.

5. **Expose the large independent batch — `ev-open-batch`.**  
   Trigger → four cards fan out: **“Audit auth imports,” “Check API callers,” “Review dependency licenses,”** and **“Scan package exports.”** A neutral bracket says **“Can run together.”**  
   Actions → `SET_PREFIX_BLOCK_CONTENT` sets the batch-phase main `PB_HISTORY` to `GP_BATCH_HISTORY_TOK`, the `[FICTION]` value registered by fixture `"gp-batch-history-tok"`; `CREATE_CHECKPOINT { checkpointId: "cp-parallel-route", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-batch-cost" }`.  
   Mutations → `UI_PREFIX_STACK_VISUALIZER` shows the enlarged main stack without price, good/bad styling, or a route recommendation. The four-card bracket remains unplaced.

6. **Commit the batch prediction, then choose its route — `ev-route-batch`.**  
   Trigger → the player commits `p-batch-cost`.  
   Actions → `COMMIT_PREDICTION { promptId: "p-batch-cost" }`; the neutral route targets unlock; dropping the bracket dispatches four `ROUTE_UNIT` actions, all with `contextKind: "main"` or all with `contextKind: "subagent"`.  
   Mutations → prediction state and route state remain separate. The bracket is one group-routing gesture, so partial mixed batches and route-dependent price branches are unreachable by construction.

7. **Resolve the expensive main-batch choice — `ev-inline-audit-failure`.**  
   Preconditions → the batch bracket was routed to `MAIN_SESSION_CONTEXT`.  
   Action → `RUN_UNIT { unitId: "audit-imports" }`.  
   Mutations → `r-audit-main` appends, charging `GP_AUDIT_INLINE_USD`; scalar `wallet` remains above zero.

   After the complete row renders, the failure frame displays:

   - the charged `r-audit-main` ledger row;
   - its `600,000`-token `PB_HISTORY` span;
   - its `6,000`-token `PB_CURRENT` span (`C28`);
   - an authored, uncharged alternative quote with the exact `r-audit-sub` buckets and `GP_AUDIT_SUB_USD`;
   - `GP_AUDIT_ROUTE_PENALTY_USD`.

   Action → `FREEZE_FAILURE` with failure `f-inline-audit`.  
   Mutations → `clockFrozen = true`; economic controls lock; `frozenFailure` records the cause and `cp-parallel-route`. Prediction correctness is not inspected.

8. **Rewind locally — `ev-rewind-audit`.**  
   Trigger → player activates **“Route the batch again.”**  
   Action → `REWIND_TO_CHECKPOINT { checkpointId: "cp-parallel-route" }`.  
   Mutations → deterministic replay removes failure-only `r-audit-main`, restores scalar `wallet`, cache, routes, and batch prediction state to the checkpoint, and preserves the two completed pre-batch rows and reveals.

9. **Resolve the shared subagent batch — `ev-reveal-batch`.**  
   Preconditions → all four batch cards are routed to `SUBAGENT_CONTEXT`s and `p-batch-cost` is committed.  
   Actions → four `RUN_UNIT` actions; then `REVEAL_PREDICTION { promptId: "p-batch-cost", correctOptionId: "subagent-batch-costs-less" }`.  
   Mutations:

   - `r-audit-sub` writes the measured `26,237`-token identical spawn prefix at `CACHE_TIER_5M` (`C10`);
   - `r-callers-sub`, `r-licenses-sub`, and `r-exports-sub` each read that live `26,237`-token prefix (`C10`, `C12`);
   - four isolated `PREFIX_STACK` records and four `LedgerRow`s append;
   - the shared subagent `CacheEntry` is written once and touched three times;
   - main and subagent cache namespaces remain isolated;
   - main `PB_HISTORY` does not absorb the four jobs before their requests resolve.

   `ahaFrame: true` attaches to `r-callers-sub`. Only now show: **“The larger batch reused one bounded base instead of carrying the enlarged conversation four times.”**

10. **Explain after evidence — `ev-explain-routing`.**  
    Trigger → after `ev-reveal-batch`, the player chooses one causal explanation.  
    Action → `ACK_EXPLANATION { explanationId }`.  
    Required explanation → `"relationship-history-and-fixed-cost"`.  
    Mutations → the accepted ID appends to `acknowledgedExplanationIds`. This is post-evidence gate evidence, not a prediction.

11. **Apply the rule to unseen work — `ev-transfer-routing`.**  
    Actions → `CREATE_CHECKPOINT { checkpointId: "cp-transfer", reason: "decision" }`; `BEGIN_TRANSFER { challengeId: "route-transfer-trio" }`.  
    Hypothetical cards:

    - **“Change the error string you just reviewed.”**
    - **“Scan a large unrelated package tree from a 600k-token conversation.”**
    - **“Read one manifest field from a 56k-token live thread.”**

    Required post-evidence actions:

    - `ROUTE_UNIT { unitId: "transfer-error-string", contextKind: "main" }`;
    - `ROUTE_UNIT { unitId: "transfer-package-scan", contextKind: "subagent" }`;
    - `ROUTE_UNIT { unitId: "transfer-manifest-field", contextKind: "main" }`.

    After all three accepted actions, the transfer validator appends `"route-transfer-trio"` to the canonical `completedTransferIds`. These cards test routing only and create no `Request`, `LedgerRow`, or wallet mutation. An incorrect trio returns to `cp-transfer` without invoking `FREEZE_FAILURE`.

12. **Complete and compare — `ev-complete`.**  
    Trigger → the explanation and transfer trio satisfy the gate.  
    Actions → `COMPLETE_ATTEMPT`; on player request, `REQUEST_COUNTERFACTUAL { comparisonId: "all-inline" }`; then `REVEAL_COUNTERFACTUAL { comparisonId: "all-inline" }`.  
    Mutations → `UI_RESULT_SCREEN` evaluates the post-evidence gate and stars, then snapshots `attemptResult`. Only after completion, `UI_COUNTERFACTUAL_OVERLAY` reveals `GP_ALL_INLINE_USD`, `GP_REFERENCE_USD`, `GP_ROUTE_DELTA_USD`, and the derived percentage reduction. Counterfactual processing cannot mutate the actual ledger, wallet, `attemptResult`, `clockFrozen`, or `frozenFailure`, and cannot dispatch `FREEZE_FAILURE`.

## 5. Level data

Level-specific calibrated values:

```ts
const GP_SEED = 8_292;                       // [FICTION]
const GP_BUDGET_USD = 1.00;                  // [FICTION]
const GP_CLOCK_CAP_MIN = 5;                  // [FICTION]
const GP_UNIT_HOURS = 1;                     // [FICTION]
const GP_BATCH_HISTORY_TOK = 600_000;        // [FICTION]
const GP_INDEPENDENT_OUT_TOK = 4_000;        // [FICTION]
const GP_DEPENDENT_IN_TOK = 2_000;           // [FICTION]
const GP_DEPENDENT_OUT_TOK = 4_000;          // [FICTION]
const GP_TINY_IN_TOK = 500;                  // [FICTION]
const GP_TINY_OUT_TOK = 500;                 // [FICTION]

const GP_REFERENCE_USD = 0.53600205;         // derived in §6
const GP_ALL_INLINE_USD = 1.1736;            // derived in §6
const GP_ROUTE_DELTA_USD = 0.63759795;       // derived in §6
```

`GP_BATCH_HISTORY_TOK` is followed by the canonical `22,000`-token inline growth step from `C29`, producing the four all-inline batch history sizes priced in §6. Lowering the batch review/scan tasks to `GP_INDEPENDENT_OUT_TOK` keeps output present and fully priced while allowing routing to drive the batch decision.

The six fixture `UnitSeed` values are:

| `id` | `kind` | `deps` | `workIn` | `outTok` | Notes |
|---|---|---|---:|---:|---|
| `followup-rename` | `TASK` | `[]` | `GP_DEPENDENT_IN_TOK` | `GP_DEPENDENT_OUT_TOK` | Depends on pre-level conversation content; its report leaves main history at `56,000` tokens (`C29`). |
| `package-label` | `TASK` | `[]` | `GP_TINY_IN_TOK` | `GP_TINY_OUT_TOK` | Independent and deliberately too small to amortize a cold spawn write. |
| `audit-imports` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent batch leader. |
| `check-callers` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |
| `review-licenses` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |
| `scan-exports` | `TASK` | `[]` | `6,000` (`C28`) | `GP_INDEPENDENT_OUT_TOK` | Independent. |

All six use ticket `1`, Sonnet, and `hours: GP_UNIT_HOURS`. The one-hour authored unit value is registered by fixture `"gp-unit-hours"` and does not set simulated request spacing. The four batch requests resolve inside the five-minute live shared-prefix window (`C1`, `C27`).

Context seeds instantiate:

- one `MAIN_SESSION_CONTEXT`;
- one ad-hoc dependent-work `SUBAGENT_CONTEXT` without `sharedPrefixPoolId`;
- one ad-hoc package-label `SUBAGENT_CONTEXT` without `sharedPrefixPoolId`;
- four batch `SUBAGENT_CONTEXT`s sharing `sharedPrefixPoolId: "gp-independent-pool"` while retaining distinct execution contexts;
- corresponding `PrefixStackSeed` values using canonical `PrefixBlock` kinds.

```ts
const growingPains: LevelDef = {
  id: "08-growing-pains",
  tier: 2,
  title: "Growing Pains",
  objective:
    "Six tickets just landed. Clear the release-train queue before the bell.",

  concept: {
    id: "inline-vs-subagent-routing",
    privateDesignerSummary:
      "The useful route depends on required conversation context, carried-history size, and the fixed cost of starting a bounded subagent.",
    postRevealRule:
      "Keep work near useful context; move it only when the history it would carry costs more than fresh-room setup.",
    solutionVocabulary: [
      "route",
      "routing",
      "inline",
      "subagent",
      "main session",
      "fresh room",
      "bounded spawn",
      "carried context",
      "dependent work",
      "independent work"
    ]
  },
  conceptScope: { kind: "single", reusedConceptIds: [] },
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
  seed: GP_SEED,
  budgetUsd: GP_BUDGET_USD,
  clockCapMin: GP_CLOCK_CAP_MIN,
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
    fixtures: [
      {
        id: "gp-seed",
        label: "Level seed",
        semanticRole: "Deterministic replay seed for the Growing Pains scenario",
        value: GP_SEED,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "gp-budget-usd",
        label: "Attempt budget",
        semanticRole: "Initial wallet and spend cap for the routing attempt",
        value: GP_BUDGET_USD,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "gp-clock-cap-min",
        label: "Level clock cap",
        semanticRole:
          "Maximum simulated minutes available to the Growing Pains attempt",
        value: GP_CLOCK_CAP_MIN,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "gp-unit-hours",
        label: "Unit duration",
        semanticRole: "UnitSeed hours assigned to each of the six routed tickets",
        value: GP_UNIT_HOURS,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "gp-batch-history-tok",
        label: "Batch-phase main history",
        semanticRole:
          "Main-session PB_HISTORY tokens carried into the first large batch request",
        value: GP_BATCH_HISTORY_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "gp-batch-output-tok",
        label: "Batch output per request",
        semanticRole:
          "Expected output tokens generated by each independent batch request",
        value: GP_INDEPENDENT_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "gp-dependent-input-tok",
        label: "Dependent follow-up input",
        semanticRole:
          "Fresh current-input tokens required by the dependent rename request",
        value: GP_DEPENDENT_IN_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "gp-dependent-output-tok",
        label: "Dependent follow-up output",
        semanticRole:
          "Expected output tokens generated by the dependent rename request",
        value: GP_DEPENDENT_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "gp-label-input-tok",
        label: "Package-label input",
        semanticRole:
          "Fresh current-input tokens required by the tiny package-label request",
        value: GP_TINY_IN_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "gp-label-output-tok",
        label: "Package-label output",
        semanticRole:
          "Expected output tokens generated by the tiny package-label request",
        value: GP_TINY_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      }
    ],
    estimates: [
      {
        label: "ticket-card arrival seconds",
        value: 0,
        tag: "[ESTIMATE]"
      },
      {
        label: "first-ticket opening seconds",
        value: 0.6,
        tag: "[ESTIMATE]"
      },
      {
        label: "route-target reveal seconds",
        value: 1.2,
        tag: "[ESTIMATE]"
      },
      {
        label: "first-interaction target seconds",
        value: 2,
        tag: "[ESTIMATE]"
      },
      {
        label: "default non-frozen toast duration milliseconds",
        value: 3500,
        tag: "[ESTIMATE]"
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
      "The large independent audit carried a 600,000-token main history when a bounded spawn base was cheaper."
  },
  failureRules: [
    {
      id: "f-inline-audit",
      predicate: {
        id: "f-inline-audit-predicate",
        kind: "all",
        predicates: [
          {
            id: "f-inline-audit-routed-main",
            kind: "action-observed",
            actionType: "ROUTE_UNIT",
            afterEventId: "ev-open-batch",
            match: {
              unitId: "audit-imports",
              contextKind: "main"
            }
          },
          {
            id: "f-inline-audit-ran",
            kind: "action-observed",
            actionType: "RUN_UNIT",
            afterEventId: "ev-route-batch",
            match: {
              unitId: "audit-imports"
            }
          }
        ]
      },
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
      id: "cp-route-followup",
      createBeforeEventId: "ev-reveal-followup",
      reason: "decision",
      resumeLabel: "Route the follow-up again"
    },
    {
      id: "cp-route-label-check",
      createBeforeEventId: "ev-reveal-label-check",
      reason: "decision",
      resumeLabel: "Route the label check again"
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
      resumeLabel: "Try the transfer cards again"
    }
  ],

  gate: {
    predicateId: "post-evidence-routing-transfer",
    evidenceRevealEventIds: ["ev-reveal-batch"],
    postEvidenceActionRequirements: [
      {
        id: "gate-explain-after-batch",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "ev-reveal-batch",
        match: {
          explanationId: "relationship-history-and-fixed-cost"
        }
      },
      {
        id: "gate-route-dependent-main",
        kind: "action-observed",
        actionType: "ROUTE_UNIT",
        afterEventId: "ev-reveal-batch",
        match: {
          unitId: "transfer-error-string",
          contextKind: "main"
        }
      },
      {
        id: "gate-route-large-independent-subagent",
        kind: "action-observed",
        actionType: "ROUTE_UNIT",
        afterEventId: "ev-reveal-batch",
        match: {
          unitId: "transfer-package-scan",
          contextKind: "subagent"
        }
      },
      {
        id: "gate-route-tiny-independent-main",
        kind: "action-observed",
        actionType: "ROUTE_UNIT",
        afterEventId: "ev-reveal-batch",
        match: {
          unitId: "transfer-manifest-field",
          contextKind: "main"
        }
      }
    ],
    behavioralRequirements: [
      {
        id: "gate-causal-explanation-recorded",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "relationship-history-and-fixed-cost",
        observedAfterEventId: "ev-reveal-batch"
      },
      {
        id: "gate-transfer-trio-completed",
        kind: "includes",
        path: "completedTransferIds",
        value: "route-transfer-trio",
        observedAfterEventId: "ev-reveal-batch"
      }
    ],
    explanationRequirement: {
      id: "gate-explanation-requirement",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "relationship-history-and-fixed-cost",
      observedAfterEventId: "ev-reveal-batch"
    },
    transferRequirement: {
      id: "gate-transfer-requirement",
      kind: "includes",
      path: "completedTransferIds",
      value: "route-transfer-trio",
      observedAfterEventId: "ev-reveal-batch"
    }
  },

  pass(st) {
    const explained = st.acknowledgedExplanationIds.includes(
      "relationship-history-and-fixed-cost"
    );
    const transferred = st.completedTransferIds.includes(
      "route-transfer-trio"
    );
    const evidence: string[] = [];

    if (explained) {
      evidence.push("relationship-history-and-fixed-cost");
    }
    if (transferred) {
      evidence.push("route-transfer-trio");
    }

    return {
      pass: explained && transferred,
      reason:
        explained && transferred
          ? "The player explained the cost boundary and applied it to all three unseen cases."
          : "The explanation and three-case transfer are both required.",
      evidence
    };
  },

  star2: {
    label: "Route the relationship",
    predicate: {
      id: "star2-route-relationship",
      kind: "all",
      predicates: [
        {
          id: "star2-explanation",
          kind: "includes",
          path: "acknowledgedExplanationIds",
          value: "relationship-history-and-fixed-cost"
        },
        {
          id: "star2-transfer",
          kind: "includes",
          path: "completedTransferIds",
          value: "route-transfer-trio"
        },
        {
          id: "star2-no-hand-code",
          kind: "compare",
          path: "counts.handCoded",
          op: "eq",
          value: 0
        }
      ]
    },
    reason:
      "You applied the revealed rule to a dependent task and both sizes of independent task without hand-coding."
  },
  star3: {
    label: "Clean split",
    predicate: {
      id: "star3-clean-split",
      kind: "all",
      predicates: [
        {
          id: "star3-explanation",
          kind: "includes",
          path: "acknowledgedExplanationIds",
          value: "relationship-history-and-fixed-cost"
        },
        {
          id: "star3-transfer",
          kind: "includes",
          path: "completedTransferIds",
          value: "route-transfer-trio"
        },
        {
          id: "star3-no-hand-code",
          kind: "compare",
          path: "counts.handCoded",
          op: "eq",
          value: 0
        },
        {
          id: "star3-reference-spend",
          kind: "compare",
          path: "attemptMetrics.spentUsd",
          op: "lte",
          value: GP_REFERENCE_USD
        }
      ]
    },
    reason:
      "Your economic actions passed the transfer and spent no more than the mixed-route reference."
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
        "What changed when the four large jobs carried the main conversation?",
      revealCopy:
        "The mixed route cut this fixture's bill by 54.33% because three warm bounded reads replaced four growing main-history reads."
    }
  ],

  tape: GP_TAPE_FROM_SECTION_7,
  result: GP_RESULT_FROM_SECTION_10,
  vocabulary: [
    {
      term: "carried context",
      definition:
        "Earlier conversation tokens included with the current request.",
      firstNeededEventId: "ev-reveal-followup",
      toastId: "t-main-growth"
    }
  ],
  qa: GP_QA_FROM_SECTION_12
};
```

`GP_SEED`, `GP_CLOCK_CAP_MIN`, and `GP_UNIT_HOURS` are independent calibrated scenario fixtures. In particular, `GP_CLOCK_CAP_MIN = 5` is not derived from or justified by the five-minute cache TTL in `C1`; the numerical equality is coincidental.

The reference route vector is `[main, main, subagent, subagent, subagent, subagent]`: dependent follow-up in main, tiny independent label check in main, and the four large independent jobs in the shared subagent pool. `referenceCfg.who` is the four-card batch default; the first two routes are explicit player actions. `GP_ALL_INLINE_ROUTE_PATCH` is `[main, main, main, main, main, main]`.

## 6. Pricing walkthrough

Sonnet prices are input `$3/M`, cache read `$0.30/M`, five-minute write `$3.75/M`, and output `$15/M` (`C1`, `C3`). Every value below is produced by `PRICE_REQUEST` without intermediate rounding.

For the dependent work routed out, required main-session material becomes fresh `inputTok` because the new `SUBAGENT_CONTEXT` cannot read the main cache namespace. The ad-hoc dependent and label-check subagents do not join the batch’s shared pool.

This is the level’s sole authoritative request-price table:

| Request | Route | Authoritative buckets | Exact USD |
|---|---|---|---:|
| `r-followup-main` | main | `34,000 read` (`C29`) + `GP_DEPENDENT_IN_TOK` input (fixture `"gp-dependent-input-tok"`) + `GP_DEPENDENT_OUT_TOK` output (fixture `"gp-dependent-output-tok"`) | `$0.0762` |
| `r-followup-sub` | isolated cold subagent | `26,237 write` (`C10`) + `36,000 input` (`34,000` required context plus `GP_DEPENDENT_IN_TOK` current) + `GP_DEPENDENT_OUT_TOK` output | `$0.26638875` |
| `r-label-main` | main | `56,000 read` (`34,000 + C29 growth`) + `GP_TINY_IN_TOK` input (fixture `"gp-label-input-tok"`) + `GP_TINY_OUT_TOK` output (fixture `"gp-label-output-tok"`) | `$0.0258` |
| `r-label-sub` | isolated cold subagent | `26,237 write` (`C10`) + `GP_TINY_IN_TOK` input + `GP_TINY_OUT_TOK` output | `$0.10738875` |
| `r-audit-sub` | shared-pool cold subagent | `26,237 write` (`C10`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output (fixture `"gp-batch-output-tok"`) | `$0.17638875` |
| `r-callers-sub` | shared-pool warm subagent | `26,237 read` (`C10`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output | `$0.0858711` |
| `r-licenses-sub` | shared-pool warm subagent | same authoritative buckets as `r-callers-sub` | `$0.0858711` |
| `r-exports-sub` | shared-pool warm subagent | same authoritative buckets as `r-callers-sub` | `$0.0858711` |
| `r-audit-main` | main | `GP_BATCH_HISTORY_TOK` read (fixture `"gp-batch-history-tok"`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output | `$0.2580` |
| `r-callers-main` | main | `622,000 read` (`GP_BATCH_HISTORY_TOK + C29`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output | `$0.2646` |
| `r-licenses-main` | main | `644,000 read` (`GP_BATCH_HISTORY_TOK + 2×C29`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output | `$0.2712` |
| `r-exports-main` | main | `666,000 read` (`GP_BATCH_HISTORY_TOK + 3×C29`) + `6,000 input` (`C28`) + `GP_INDEPENDENT_OUT_TOK` output | `$0.2778` |

The tiny independent ticket supplies the required counter-pressure:

```text
GP_LABEL_MAIN_USD
  = 56,000×$0.30/M
  + 500×$3/M
  + 500×$15/M
  = $0.0258

GP_LABEL_SUB_USD
  = 26,237×$3.75/M
  + 500×$3/M
  + 500×$15/M
  = $0.10738875

GP_LABEL_COLD_PENALTY_USD
  = $0.10738875 − $0.0258
  = $0.08158875
```

The common `500`-input/`500`-output payload costs the same on both routes. The decision flips because the main route’s cached reread costs `$0.0168`, while the cold subagent write costs `$0.09838875`. Independence alone is not a sufficient routing rule.

The decisive batch failure remains economically true:

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
  + $0.0258
  + $0.17638875
  + 3×$0.0858711
  = $0.53600205
```

All-inline post-attempt total:

```text
GP_ALL_INLINE_USD
  = $0.0762
  + $0.0258
  + $0.2580
  + $0.2646
  + $0.2712
  + $0.2778
  = $1.1736
```

Derived routing difference:

```text
GP_ROUTE_DELTA_USD
  = GP_ALL_INLINE_USD − GP_REFERENCE_USD
  = $0.63759795

GP_ROUTE_SAVINGS_RATIO
  = $0.63759795 / $1.1736
  = 0.5432838701431493
```

The mixed route reduces the six-ticket bill by `54.33%`, exceeding the required `20%` effect. `GP_ROUTE_DELTA_USD` is arithmetic derived from the priced rows; it is not a separate fiction fixture. Its underlying `600,000`-token history, `500`-token tiny payload buckets, and `4,000`-token batch outputs are registered once in `scenarioData.fixtures`.

With `GP_BUDGET_USD`, the reference leaves `$0.46399795`; the all-inline comparison exceeds the budget by `$0.1736`. Budget is presentation evidence only and is not part of the pass gate.

## 7. Tape sequence

`tape.rowSource: "ledger"` and `hoverEnabled: true`.

Actual tape slots:

1. `followup-rename`: exactly one of `r-followup-main` or `r-followup-sub`.
2. `package-label`: exactly one of `r-label-main` or `r-label-sub`.
3. `audit-imports`: `r-audit-main` on the failure branch or `r-audit-sub` on the shared-subagent branch.
4. `check-callers`: `r-callers-sub` on the reference branch.
5. `review-licenses`: `r-licenses-sub` on the reference branch.
6. `scan-exports`: `r-exports-sub` on the reference branch.

`REWIND_TO_CHECKPOINT { checkpointId: "cp-parallel-route" }` removes failure-only `r-audit-main` before the corrected branch appends `r-audit-sub`.

Reveal groups:

```ts
[
  {
    id: "followup",
    requestIds: ["r-followup-main", "r-followup-sub"],
    gatedByPredictionId: "p-followup-cost"
  },
  {
    id: "label-check",
    requestIds: ["r-label-main", "r-label-sub"],
    gatedByPredictionId: "p-label-cost"
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

Only the request ID present in the actual ledger renders. Alternative IDs do not create ghost tape rows.

`ahaRequestId: "r-callers-sub"`. At that frame, the first warm `26,237`-token read aligns with the cold bounded write above it while a labeled, uncharged ruler recalls the earlier `600,000`-token main span.

`UI_TAPE_RENDERER` uses canonical `tapeWeight` and segment-share formulas. Every row includes output in its geometry from its first rendered frame:

```text
row weight ∝ readTok×0.1 + inputTok + writeTok×tier + outTok×5
```

The violet output segment contributes its full priced share even before output pricing receives a teaching label. No visual width may be computed from input-side tokens alone. The all-inline tape remains unavailable until `ev-complete`.

## 8. Prediction prompts

Prediction commitment unlocks evidence but never chooses a route, spends wallet, freezes the level, changes stars, or satisfies the gate.

### `p-followup-cost`

**Question:** “Before you place it: which room do you expect to cost less for this follow-up?”

- `main-costs-less`: “The current conversation.”
- `subagent-costs-less`: “A fresh subagent.”

After commitment, both route targets remain independently selectable.

Reveal sentence: **“The current conversation already contained the code and decision this follow-up needed.”**

### `p-label-cost`

The player sees the `56,000`-token live prefix, the `26,237`-token cold spawn base, and the ticket’s `500`-input/`500`-output payload. No dollar label or preferred styling appears.

**Question:** “This label check needs no release files. Which room do you expect to cost less?”

- `main-costs-less`: “Keep it here.”
- `subagent-costs-less`: “Open a fresh subagent.”

Reveal sentence: **“The cached reread was cheaper than paying the fixed cold write for such a small job.”**

### `p-batch-cost`

The visible `600,000`-token stack and **“Can run together”** bracket provide inferable evidence, but neither route has a dollar label.

**Question:** “Four larger jobs can start together. Which room do you expect to cost less?”

- `main-batch-costs-less`: “Carry this conversation into all four.”
- `subagent-batch-costs-less`: “Give the four jobs fresh subagents.”

Reveal sentence: **“One bounded spawn write and three warm reads cost less than four growing main-history reads.”**

No styling, order, disabled state, stack color, animation, or cost preview signals a correct prediction before commitment.

### Post-evidence explanation

This is not a `PredictionPromptDef`.

**Question:** “Why did the cheaper room change across these tickets?”

- `independence-only`: “Independent tickets should always be sent out.”
- `relationship-history-and-fixed-cost`: “Required context, carried-history size, and cold-room setup all matter.”
- `fresh-is-always-cheaper`: “Fresh subagents are always cheaper.”

Selecting an explanation dispatches `ACK_EXPLANATION`. Only `"relationship-history-and-fixed-cost"` satisfies the post-evidence explanation requirement.

## 9. Fail-state

- `failureRuleId`: `f-inline-audit`
- Decisive event: `ev-inline-audit-failure`
- Literal predicate: the `StatePredicate` in §5 observes both `ROUTE_UNIT { unitId: "audit-imports", contextKind: "main" }` and the subsequent `RUN_UNIT { unitId: "audit-imports" }`.
- Cause code: `INLINE_HISTORY_OVERREAD`
- Freeze timing: after `r-audit-main` and every non-zero `WireSegment` are fully visible, before any later batch ticket runs.
- Exact causal message: **“The audit carried 600k history. The bounded spawn route costs $0.08161125 less.”**
- Charged route: `GP_AUDIT_INLINE_USD`
- Valid alternative: `GP_AUDIT_SUB_USD`
- Rewind label: **“Route the batch again.”**
- Rewind target: `cp-parallel-route`

The decisive frame places the charged ledger row beside the authored uncharged alternative quote, including both sets of token buckets. The alternative is labeled **“Not charged — route comparison”** and is not a `Request`, `LedgerRow`, or tape row.

The freeze is local and economically true:

```text
GP_AUDIT_INLINE_USD > GP_AUDIT_SUB_USD
```

Scalar `wallet` is still positive at the freeze, so wallet exhaustion cannot masquerade as the cause. The failure predicate does not inspect `PredictionState`. A wrong `p-batch-cost` prediction followed by the subagent route cannot freeze.

The more expensive `r-label-sub` outcome is an ordinary, non-freezing teaching beat. The all-inline counterfactual is informational and cannot dispatch `FREEZE_FAILURE`; only the live actual-attempt `r-audit-main` event can do so.

## 10. Gate & stars

The one-star pass gate uses only actions taken after `ev-reveal-batch`:

1. `ACK_EXPLANATION` records `"relationship-history-and-fixed-cost"`.
2. The unseen dependent error-string task is routed to `MAIN_SESSION_CONTEXT`.
3. The unseen large unrelated scan is routed to `SUBAGENT_CONTEXT`.
4. The unseen tiny unrelated manifest check is routed to `MAIN_SESSION_CONTEXT`.
5. The accepted trio appends `"route-transfer-trio"` to `completedTransferIds`.

The three prediction choices and their correctness are excluded from `GateDef`, `pass(st)`, failure evaluation, wallet mutation, and every star predicate. Initial fixture routes are economic play actions and may affect actual spend, but prediction records never do.

- **1 star:** the literal explanation and transfer predicates pass.
- **2 stars — “Route the relationship”:** pass and `counts.handCoded == 0`.
- **3 stars — “Clean split”:** the two-star behavior plus `attemptMetrics.spentUsd <= GP_REFERENCE_USD`.

The three-star comparison uses legal `op: "lte"` rather than floating-point equality. Budget cannot independently pass the level.

Result copy:

- Pass headline: **“You gave each job the context it deserved.”**
- Fail headline: **“The new tickets still need three different judgments.”**
- Evidence line: **“Useful history stayed nearby; the large batch avoided the enlarged session; the tiny check avoided unnecessary cold setup.”**
- Comparison line: **“Mixed routing saved $0.63759795, or 54.33%, on this fixture.”**
- Continue label: **“Next shift”**
- Retry label: **“Reroute the tickets”**

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `t-main-growth` | After `ev-reveal-followup` renders | **“Carried context: the next main request sees 56k cached tokens.”** |
| `t-tiny-boundary` | After `ev-reveal-label-check` renders | **“Tiny job: $0.0168 cached reread versus $0.09838875 cold write.”** |
| `t-batch-history` | After `ev-open-batch` completes | **“Main context now carries 600k tokens.”** |
| `t-isolated-base` | After `r-audit-sub` renders | **“Fresh subagent: separate 26,237-token base.”** |
| `t-shared-read` | After `r-callers-sub` renders | **“Identical spawn prefix reused: 26,237-token read.”** |
| `t-inline-cause` | `FREEZE_FAILURE` with `INLINE_HISTORY_OVERREAD` | **“The audit carried 600k history. The bounded spawn route costs $0.08161125 less.”** |
| `t-route-rule` | After the correct post-evidence explanation | **“Judge required context, carried history, and cold setup together.”** |
| `t-reference` | After the all-inline counterfactual reveals | **“One bounded write and three reads replaced four growing main-history reads.”** |

`t-inline-cause` has `priority: "cause"`, uses `aria-live="assertive"`, and remains visible while frozen. Other toasts are polite, use the default `3,500ms` duration `[ESTIMATE]`, and deduplicate per attempt. The duration is presentation-only and cannot affect reducer state, pass, stars, spend, or request timing.

## 12. QA gate

Real-browser click-through must establish:

1. The first route interaction is available by `2s` `[ESTIMATE]`; no answer, dollar comparison, bounded-base explanation, or route recommendation appears first.
2. The level enters with `ENTER_LEVEL { levelId: "08-growing-pains" }`.
3. `concept.id`, `conceptScope`, and `prerequisiteConceptIds` match the canonical registry exactly.
4. `title` and `objective` contain none of `concept.solutionVocabulary`; the assertion uses `kind: "identity-no-solution-vocabulary"` and exact assertion text `"title and objective contain no solution vocabulary"`.
5. `LevelDef.interactionPatterns` contains only canonical kebab-case IDs.
6. Pointer, touch, and keyboard paths dispatch equivalent prediction and `ROUTE_UNIT` actions.
7. Prediction commitment and route choice are separate actions; committing any prediction cannot select a route.
8. No gated request or `REVEAL_PREDICTION` succeeds before its corresponding `COMMIT_PREDICTION`.
9. A wrong prediction followed by the same route produces byte-identical wallet, ledger, stars, failure, and gate state as a correct prediction followed by that route.
10. The one-star gate observes `ACK_EXPLANATION` and all three transfer `ROUTE_UNIT` actions after `ev-reveal-batch`; no pre-reveal guess can pass or fail it.
11. Every failure, gate, transfer, and star predicate is a literal `StatePredicate`; every state path exists in `ReducerState`; every predicate kind and comparison op belongs to the legal registry.
12. Each priced `Request` produces exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row.
13. Rewinding to `cp-parallel-route` removes failure-only `r-audit-main` and restores scalar `wallet`, cache, routes, and batch prediction state deterministically.
14. Every request cost is positive and matches `PRICE_REQUEST`; no positive amount displays as `$0.0000`.
15. Every rendered row’s non-zero `readTok`, `inputTok`, `writeTok`, and `outTok` produces exactly one corresponding `WireSegment`.
16. `UI_TAPE_RENDERER` row width is proportional to authoritative USD and includes `outTok × 5`; output-heavy visual weight cannot disappear when its teaching label is hidden.
17. `r-label-main` costs `$0.0258`; `r-label-sub` costs `$0.10738875`; the tiny independent ticket is cheaper in main by `$0.08158875`.
18. `r-label-sub` cannot populate or touch `"gp-independent-pool"`.
19. The tiny-ticket outcome never dispatches `FREEZE_FAILURE`, regardless of route.
20. The batch bracket permits only four-main or four-subagent routing; partial mixed batches and their unpriced branches are unreachable.
21. `r-audit-sub` writes `26,237`; the next three batch spawns each read `26,237` while live (`C10`, `C12`).
22. Main and subagent cache namespaces remain isolated; `UI_MAIN_CACHE_PANEL` never displays the shared subagent entry.
23. The live inline audit freezes only after its complete charged row renders.
24. The failure frame displays `GP_AUDIT_INLINE_USD`, `GP_AUDIT_SUB_USD`, their full bucket equations, and `GP_AUDIT_ROUTE_PENALTY_USD`.
25. `FailureRuleDef.actualUsd > FailureRuleDef.validAlternativeUsd`; the punished request is `46.27%` more expensive than its valid alternative.
26. No actual or off-screen action processed by `REQUEST_COUNTERFACTUAL` or `REVEAL_COUNTERFACTUAL` dispatches `FREEZE_FAILURE`.
27. The reference route produces `GP_REFERENCE_USD`; the post-attempt all-inline route produces `GP_ALL_INLINE_USD`; their difference is `GP_ROUTE_DELTA_USD`.
28. The reference route lowers the six-ticket bill by `54.33%`, exceeding the required `20%`.
29. The fixed reference route passes from seed `8292`; an actual live all-inline replay reaches the local audit failure and rewinds to `cp-parallel-route`.
30. Choosing either expensive pre-batch alternative can still pass one star after the post-evidence gate, but cannot satisfy the three-star spend threshold.
31. Static final tape bars show final colors, output segments, and prices without hover.
32. Hover and keyboard-focus equations reproduce every row in the sole pricing table.
33. Reduced-motion mode reveals identical final evidence immediately.
34. `UI_COUNTERFACTUAL_OVERLAY`, the all-inline total, the derived delta, and `concept.postRevealRule` remain unavailable until a meaningful attempt completes.
35. The player can win with only documented prediction, route, rewind, explanation, and completion controls.
36. At `320px` CSS width, the active route target, decisive tape row, cause toast, comparison quote, and rewind control do not overlap.
37. Screen-reader order is ticket → prediction → route controls → revealed row → causal caption; the failure announcement is assertive.
38. `scenarioData.fixtures` contains distinct `ScenarioFixtureDef`s for seed `8292`, budget `$1.00`, clock cap `5min`, unit duration `1`, batch history, request outputs, and tiny/dependent payload buckets; every fixture has an `id`, `semanticRole`, legal `unit`, and `[FICTION]` tag.
39. `scenarioData.estimates` registers the ticket-card arrival, first-ticket opening, route-target reveal, first-interaction target, and default non-frozen toast duration as `[ESTIMATE]` presentation values; they do not affect pass, stars, spend, deadlines, request spacing, or reducer state.
40. `GP_CLOCK_CAP_MIN` resolves through fixture `"gp-clock-cap-min"` and does not cite or borrow provenance from the semantically unrelated five-minute cache TTL.
41. No stale assertion request, superseded price, stale `53.24%` value, symbolic `GP_*` predicate, illegal predicate op, unreachable price branch, uppercase pattern alias, or legacy level/concept ID appears.

## 13. Reference-bar justification

The screen opens on one tactile sorting action and uses a single dependent follow-up to establish that nearby context can be economically useful. It then presents a tiny independent check whose cold subagent write is more expensive than the live main prefix’s marginal reread. That counter-pressure prevents the player from reducing the lesson to “independent means subagent.”

Only then does the main stack enlarge to `600,000` tokens. Choosing main for the large bracket creates an immediate, truthful comparison—`$0.2580` versus `$0.17638875`—and a local rewind. The corrected batch reveals one bounded write and three warm reads. The player must explain why the route boundary moved and apply that rule to a dependent task, a large independent task, and a tiny independent task.

The post-attempt overlay confirms a material result—`54.33%` lower spend—without becoming a pre-play answer key. The informational counterfactual cannot freeze or mutate the completed attempt. This preserves the predict, act, reveal, rewind, explain, and transfer rhythm of the reference experiences.

Significant calibration tradeoff: the batch jobs use the `4,000 outTok` fixture `"gp-batch-output-tok"` instead of the `44,000` development-task output fixture in `C28`; the tiny label job uses the `500 inputTok` and `500 outTok` fixtures `"gp-label-input-tok"` and `"gp-label-output-tok"`; and the pre-batch main history uses the `600,000`-token fixture `"gp-batch-history-tok"`. These choices create two reachable sides of the routing tradeoff while retaining the canonical `6,000` batch input (`C28`), measured `26,237` spawn prefix (`C10`), `22,000` inline growth (`C29`), and full output-cost contribution required by `C1`, `C3`, and `UI_TAPE_RENDERER`. The seed, clock cap, and unit hours are separately registered fiction fixtures; none borrows provenance merely because it resembles a measured constant.

