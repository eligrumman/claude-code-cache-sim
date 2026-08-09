# Level 10 — The Checkout Ticket

## 1. Identity

- **id:** `10-plan-once-pay-later`
- **title:** The Checkout Ticket
- **tier:** 2
- **ONE concept:** `plan-depth-downstream-cost` — planning depth trades a visible planning cost against ticket-dependent downstream rework.
- **Prerequisite concept:** `workload-cost-mix`
- **Objective copy:** “Ship the regional-tax change without breaking refunds.”
- **Introduced control:** `planDepth`, dispatching `CHOOSE_PLAN_DEPTH`.
- Plan-output sizes and repair incidence are calibrated **[FICTION]** registered in `scenarioData.fixtures`. Cache and token prices use `PRICE_REQUEST` and canonical `C1`/`C3` rates.
- `title` and `objective` intentionally avoid the private `solutionVocabulary`.

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `AttemptMetrics`
- `AttemptResult`
- `StatePredicate`
- `GateDef`
- `StarDef`
- `Action`
- `UnitSeed`
- `WorkloadSeed`
- `ContextSeed`
- `PrefixStackSeed`
- `ScenarioFixtureDef`
- `ScenarioEstimateDef`
- `Request`
- `PricedRequest`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `UI_TOAST_SYSTEM`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `counterfactual-after-attempt`
- `just-in-time-toast`

## 3. Cold-open / narrative

The opening shows one ticket, an empty ledger, the main-cache panel, and a closed pipeline. No repair count, branch label, total, preferred depth, reference result, or transfer answer is visible.

Ticket copy:

> **Checkout change**  
> Add regional tax handling without breaking refunds.  
> **PLAN → BUILD ×3 → REVIEW → CI**

First interaction timing:

- **0.0s `[ESTIMATE]`:** Ticket lands. Wallet reads **$5.00 `[FICTION]`** from fixture `l10-budget-usd`.
- **0.7s `[ESTIMATE]`:** Three face-down cards appear: **Quick sketch**, **Working plan**, **Exhaustive plan**.
- **1.2s `[ESTIMATE]`:** Caption: “How much preparation do you buy before anyone touches the code?”
- **1.8s `[ESTIMATE]`:** Cards become clickable.
- **On hover:** `UI_HOVER_PRICE_CALCULATOR` exposes only the selected plan request:
  - Quick sketch — `6,000`-token 1h prefix write + `2,000` output — **$0.066**
  - Working plan — `6,000`-token 1h prefix write + `8,000` output — **$0.156**
  - Exhaustive plan — `6,000`-token 1h prefix write + `80,000` output — **$1.236**
- **Never pre-play:** repair incidence, completed totals, “best” badges, downstream previews, or reference comparisons.
- **After selection:** primary button reads **Lock plan and run**.

The visible plan prices create immediate pressure against maximizing the control. The two valid completion profiles retain distinct reducer-visible benefits: working depth minimizes live `attemptMetrics.spentUsd`, while exhaustive depth minimizes live `attemptMetrics.requestCount` and qualifies for the clean-pipeline arm of `star2`. `COMPLETE_ATTEMPT` later snapshots those values into `attemptResult` for result rendering.

## 4. Exact event sequence

All selected-depth plan outputs, repair counts, the scenario seed, budget, clock cap, plan-prefix size, and request spacing are deterministic calibrated **[FICTION]** registered in `scenarioData.fixtures`. Every request uses the same Sonnet `MAIN_SESSION_CONTEXT`, cache namespace, and byte-identical `6,000`-token stable prefix. Pipeline fresh work and output use `WORK_IN = 6,000` and `WORK_OUT = 44,000` (`C28`). Requests occur at consecutive simulated minutes, so the 1h entry remains live; each read refreshes it under `C12`.

1. **Enter level**  
   Route opens → `ENTER_LEVEL { levelId: "10-plan-once-pay-later" }` → initializes `ReducerState`, scalar `$5.00` `wallet` and `budget` from fixture `l10-budget-usd`, `Clock` at `0m`, empty ledger, empty cache, attempt `1`, zeroed `attemptMetrics`, `attemptResult: null`, and the level-start checkpoint.

2. **Create the decision boundary**  
   Cards settle → `CREATE_CHECKPOINT { checkpointId: "cp-plan-choice", reason: "decision" }` → appends `Checkpoint` only; no request or cost.

3. **Choose a hidden branch**  
   Card click → `CHOOSE_PLAN_DEPTH { depth }` → validates `shallow`, `balanced`, or `deep` and writes the selection to canonical `attemptMetrics.completedDepth`. It creates no `Request`, `LedgerRow`, cache mutation, or wallet mutation.

4. **Run the selected plan and create reusable state**  
   **Lock plan and run** dispatches the selected branch’s real unit action:

   - `shallow` → `RUN_UNIT { unitId: "plan-shallow" }`
   - `balanced` → `RUN_UNIT { unitId: "plan-balanced" }`
   - `deep` → `RUN_UNIT { unitId: "plan-deep" }`

   `RESOLVE_PREFIX` writes the stable `6,000`-token prefix to a 1h `CacheEntry`. The selected request has `readTok: 0`, `inputTok: 0`, `writeTok: 6_000`, and branch-specific `outTok`:

   - `shallow`: `2,000` output → **$0.066**
   - `balanced`: `8,000` output → **$0.156**
   - `deep`: `80,000` output → **$1.236**

   The action appends one `LedgerRow`, deducts the exact price from scalar `wallet`, refreshes `attemptMetrics.spentUsd` to `budget - wallet`, increments `attemptMetrics.requestCount` and `completedUnitCount`, sets `lastRequests` to that row, and renders the write and output `WireSegment`s.

5. **Run the fixed build spine through the cache**  
   Three ordered actions execute:

   - `RUN_UNIT { unitId: "build-tax-core" }`
   - `RUN_UNIT { unitId: "build-refund-path" }`
   - `RUN_UNIT { unitId: "build-region-tests" }`

   Each request has Sonnet `readTok: 6_000`, `inputTok: 6_000`, `writeTok: 0`, and `outTok: 44_000`. Each costs **$0.6798**; the three-build subtotal is **$2.0394**. Each read touches the live entry. Each action appends exactly one ledger/tape row and updates scalar `wallet`, `attemptMetrics`, unit status, cache liveness, and `lastRequests`.

6. **Commit a prediction before downstream revelation**  
   After `build-region-tests`, REVIEW and CI remain face-down → `OPEN_PREDICTION { promptId: "p-branch-count" }`.  
   Player selection → `SELECT_PREDICTION`; lock → `COMMIT_PREDICTION`.  
   Correctness changes no score, stars, wallet, failure rule, or gate state.

7. **Reveal only the chosen branch**  
   Event `branch-revealed` dispatches `REVEAL_PREDICTION { promptId: "p-branch-count", correctOptionId }` and reveals:

   - `shallow`: two review repairs and two CI repairs;
   - `balanced`: one review repair;
   - `deep`: no repair requests.

   The reveal carries: **“Repair incidence is calibrated FICTION for this ticket.”** Unchosen full-branch outcomes remain hidden.

8. **Run each revealed causal repair**  
   Each repair executes via one `RUN_UNIT`, producing one Sonnet request with the authoritative `6,000` read, `6,000` fresh input, `44,000` output, and **$0.6798** cost:

   - `shallow`:
     1. `review-tax-boundary` — **Quick sketch omitted tax ownership**
     2. `review-refund-contract` — **Quick sketch omitted the refund contract**
     3. `ci-rounding-fixture` — **Review repair changed rounding behavior**
     4. `ci-refund-regression` — **Review repair changed refund behavior**
   - `balanced`:
     1. `review-rounding-clarification` — **Working plan left one rounding rule unresolved**
   - `deep`: no repair units.

9. **Freeze on the decisive harmful request**  
   Event `ci-refund-regression-resolved` is the actual `RUN_UNIT { unitId: "ci-refund-regression" }` resolution. It atomically posts the fourth shallow repair row and immediately evaluates `shallow-rework-chain`; no later economic or completion action occurs first.

   The decisive row costs **$0.6798**. The failure frame compares it with the already visible **$0.0900** incremental cost of upgrading the plan from quick to working, which avoids this fourth request for the calibrated ticket. The same event dispatches:

   ```ts
   FREEZE_FAILURE {
     failure: {
       failureId: "shallow-rework-chain",
       causeCode: "PLAN_DEPTH_REWORK",
       checkpointId: "cp-plan-choice",
       message:
         "The fourth $0.6798 repair cost more than the $0.0900 working-plan upgrade."
     }
   }
   ```

   `FailureRuleDef.actualUsd` is the request-local **$0.6798** and `validAlternativeUsd` is the request-local **$0.0900** planning increment. The cumulative ledger is **$4.8246** at this frame, but cumulative totals are supporting context rather than the values used to trigger `FREEZE_FAILURE`. `Clock`, wallet, tape, and economic actions freeze immediately. No reference or counterfactual event can dispatch this freeze.

10. **Retry from retained evidence**  
    **Try another plan** → `REWIND_TO_CHECKPOINT { checkpointId: "cp-plan-choice" }` → deterministic replay to the decision boundary. Frozen state and attempt-local ledger/cache rows clear; attempt count and observed evidence persist. The tried card shows its observed repair count and total. Untried full-branch outcomes remain hidden.

11. **Close a valid checkout branch without completing the attempt**  
    The valid branch’s final actual request completes branch-specific evidence:

    - balanced: the `review-rounding-clarification` resolution completes `l10-checkout-balanced-complete`;
    - deep: the final `build-region-tests` resolution, once the committed branch reveal confirms there are no repairs, completes `l10-checkout-deep-complete`.

    The completed ledger and live checkout aggregates remain in `attemptMetrics`. No `COMPLETE_ATTEMPT` is dispatched here, and `attemptResult` remains `null`.

12. **Choose the causal explanation from actual evidence**  
    After either branch-specific checkout-complete event, the player opens the causal trace and selects: **“Preparation should stop when the next increment costs more than the rework it can avoid.”**  
    Correct selection → `ACK_EXPLANATION { explanationId: "plan-depth-is-ticket-dependent" }`. Incorrect explanation choices have no penalty and may be revised.

13. **Apply the rule to a new ticket**  
    `BEGIN_TRANSFER { challengeId: "prototype-no-review" }` completes event `transfer-opened` and reveals:

    > **Prototype spike**  
    > One fixed build. Review and CI are disabled, and the artifact will be discarded after the demo.

    The same three plan-line costs remain visible. Selecting **Quick sketch** and accepting the transfer dispatches:

    ```ts
    ACK_EXPLANATION {
      explanationId: "prototype-shallow-plan"
    }
    ```

    This post-`transfer-opened` action does not dispatch `CHOOSE_PLAN_DEPTH` and therefore does not change `attemptMetrics.completedDepth`. When, and only when, that action is accepted after `transfer-opened`, the level validator atomically appends `"prototype-no-review"` once to `completedTransferIds`. A different choice causes no freeze or score deduction; the transfer remains editable until the qualifying acknowledgement is accepted.

14. **Complete and evaluate the attempt**  
    After the qualifying transfer action, the completion control becomes enabled and dispatches `COMPLETE_ATTEMPT`. That action alone evaluates the declarative `GateDef`, pure `pass(st)`, and `StarDef`s against live `attemptMetrics` and the post-evidence acknowledgement/transfer fields. It then copies all declared `AttemptMetrics` values into immutable `attemptResult`, including:

    - `attemptResult.completedDepth`;
    - `attemptResult.spentUsd`;
    - `attemptResult.requestCount`;
    - `attemptResult.completedUnitCount`.

    The completed ledger persists. Event `l10-complete-attempt` unlocks, but does not reveal, the informational comparison. Prediction selection and correctness are never read by the gate or stars.

15. **Predict the comparison**  
    `OPEN_PREDICTION { promptId: "p-largest-bill" }` opens after `COMPLETE_ATTEMPT` and before any alternate total appears. Selection and commitment use `SELECT_PREDICTION` and `COMMIT_PREDICTION`; correctness remains non-punitive.

16. **Reveal the same-seed counterfactuals**  
    Commitment enables `REQUEST_COUNTERFACTUAL { comparisonId: "plan-depth-bill" }`; the same seed and fixed build spine run off-screen. Event `counterfactual-revealed` dispatches `REVEAL_COUNTERFACTUAL { comparisonId: "plan-depth-bill" }` and displays:

    - Quick sketch: **$4.8246**
    - Working plan: **$2.8752**
    - Exhaustive plan: **$3.2754**

    The reveal confirms why working depth wins this ticket: exhaustive planning costs **$1.0800** more than working planning but avoids only one **$0.6798** repair, leaving it **$0.4002** more expensive overall. These post-attempt informational actions do not mutate the actual ledger, wallet, `attemptResult`, `clockFrozen`, failure state, gate outcome, or stars.

## 5. Level data

```ts
const L10_SEED = 1010;
const L10_BUDGET_USD = 5.00;
const L10_CLOCK_CAP_MIN = 300;
const L10_REQUEST_SPACING_MIN = 1;
const L10_PLAN_PREFIX_TOK = 6_000;
const L10_SHALLOW_PLAN_OUT_TOK = 2_000;
const L10_BALANCED_PLAN_OUT_TOK = 8_000;
const L10_DEEP_PLAN_OUT_TOK = 80_000;
const L10_SHALLOW_REPAIR_COUNT = 4;
const L10_BALANCED_REPAIR_COUNT = 1;
const L10_DEEP_REPAIR_COUNT = 0;

{
  id: "10-plan-once-pay-later",
  tier: 2,
  title: "The Checkout Ticket",
  objective: "Ship the regional-tax change without breaking refunds.",
  concept: {
    id: "plan-depth-downstream-cost",
    privateDesignerSummary:
      "Planning depth trades plan-generation cost against ticket-dependent downstream rework.",
    postRevealRule:
      "Buy another layer of planning only when it costs less than the rework it is expected to avoid.",
    solutionVocabulary: [
      "plan depth",
      "planning depth",
      "planning premium",
      "downstream rework",
      "working plan",
      "quick plan",
      "exhaustive plan"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: ["workload-cost-mix"],

  unlocks: "planDepth",
  introducedControls: ["planDepth"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
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
  seed: L10_SEED,
  budgetUsd: L10_BUDGET_USD,
  clockCapMin: L10_CLOCK_CAP_MIN,
  cfgOverride: {
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },
  scenario: "default",

  scenarioData: {
    contexts: [{
      kind: "main",
      id: "checkout-main",
      sessionId: "checkout-session",
      cacheNamespace: "checkout-plan-cache",
      initialPrefixStackId: "checkout-pipeline-prefix"
    }],

    prefixStacks: [{
      id: "checkout-pipeline-prefix",
      contextId: "checkout-main",
      blocks: [
        {
          id: "checkout-stable-prefix",
          kind: "instructions",
          label: "Checkout ticket and planning context",
          tokenCount: L10_PLAN_PREFIX_TOK,
          identityHash: "l10-checkout-stable-prefix-v1",
          order: 0,
          cacheable: true,
          breakpointAfter: true,
          stability: "session"
        },
        {
          id: "checkout-current-slot",
          kind: "current",
          label: "Current pipeline request",
          tokenCount: 0,
          identityHash: "l10-current-slot-empty",
          order: 1,
          cacheable: false,
          breakpointAfter: false,
          stability: "volatile"
        }
      ]
    }],

    units: [
      {
        id: "plan-shallow",
        kind: "PLAN",
        ticket: 1,
        deps: [],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: L10_SHALLOW_PLAN_OUT_TOK,
        workIn: L10_PLAN_PREFIX_TOK,
        scripted: true,
        label: "Quick sketch"
      },
      {
        id: "plan-balanced",
        kind: "PLAN",
        ticket: 1,
        deps: [],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: L10_BALANCED_PLAN_OUT_TOK,
        workIn: L10_PLAN_PREFIX_TOK,
        scripted: true,
        label: "Working plan"
      },
      {
        id: "plan-deep",
        kind: "PLAN",
        ticket: 1,
        deps: [],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: L10_DEEP_PLAN_OUT_TOK,
        workIn: L10_PLAN_PREFIX_TOK,
        scripted: true,
        label: "Exhaustive plan"
      },
      {
        id: "build-tax-core",
        kind: "DEV",
        ticket: 1,
        deps: [],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Build tax core"
      },
      {
        id: "build-refund-path",
        kind: "DEV",
        ticket: 1,
        deps: ["build-tax-core"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Build refund path"
      },
      {
        id: "build-region-tests",
        kind: "WRITE_TESTS",
        ticket: 1,
        deps: ["build-refund-path"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Build regional tests"
      },
      {
        id: "review-tax-boundary",
        kind: "ADDRESS_REVIEW",
        ticket: 1,
        deps: ["build-region-tests"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        cause: "scripted",
        rework: "review",
        scripted: true,
        label: "Repair tax ownership"
      },
      {
        id: "review-refund-contract",
        kind: "ADDRESS_REVIEW",
        ticket: 1,
        deps: ["review-tax-boundary"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        cause: "scripted",
        rework: "review",
        scripted: true,
        label: "Repair refund contract"
      },
      {
        id: "ci-rounding-fixture",
        kind: "CI_FIX",
        ticket: 1,
        deps: ["review-refund-contract"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        cause: "scripted",
        rework: "ci",
        scripted: true,
        label: "Repair rounding fixture"
      },
      {
        id: "ci-refund-regression",
        kind: "CI_FIX",
        ticket: 1,
        deps: ["ci-rounding-fixture"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        cause: "scripted",
        rework: "ci",
        scripted: true,
        label: "Repair refund regression"
      },
      {
        id: "review-rounding-clarification",
        kind: "ADDRESS_REVIEW",
        ticket: 1,
        deps: ["build-region-tests"],
        hours: L10_REQUEST_SPACING_MIN / 60,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        cause: "scripted",
        rework: "review",
        scripted: true,
        label: "Clarify rounding rule"
      }
    ],

    workloads: [
      {
        id: "plan-shallow",
        label: "Quick-sketch planning request",
        role: "plan",
        unitIds: ["plan-shallow"],
        inputTok: L10_PLAN_PREFIX_TOK,
        outTok: L10_SHALLOW_PLAN_OUT_TOK,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "plan-balanced",
        label: "Working-plan request",
        role: "plan",
        unitIds: ["plan-balanced"],
        inputTok: L10_PLAN_PREFIX_TOK,
        outTok: L10_BALANCED_PLAN_OUT_TOK,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "plan-deep",
        label: "Exhaustive-plan request",
        role: "plan",
        unitIds: ["plan-deep"],
        inputTok: L10_PLAN_PREFIX_TOK,
        outTok: L10_DEEP_PLAN_OUT_TOK,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      },
      {
        id: "pipeline-work",
        label: "Checkout build and repair work",
        role: "dev",
        unitIds: [
          "build-tax-core",
          "build-refund-path",
          "build-region-tests",
          "review-tax-boundary",
          "review-refund-contract",
          "ci-rounding-fixture",
          "ci-refund-regression",
          "review-rounding-clarification"
        ],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: [],
        allowedModels: ["sonnet"]
      }
    ],

    fixtures: [
      {
        id: "l10-seed",
        label: "Checkout scenario seed",
        semanticRole: "Deterministic seed for checkout branch replay",
        value: L10_SEED,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l10-budget-usd",
        label: "Checkout attempt budget",
        semanticRole: "Initial reducer wallet and budget for each checkout attempt",
        value: L10_BUDGET_USD,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "l10-clock-cap-min",
        label: "Checkout scenario clock cap",
        semanticRole: "Maximum simulated duration available to the checkout scenario",
        value: L10_CLOCK_CAP_MIN,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l10-request-spacing-min",
        label: "Pipeline request spacing",
        semanticRole: "Simulated minutes between consecutive scripted requests",
        value: L10_REQUEST_SPACING_MIN,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l10-plan-prefix-tok",
        label: "Stable checkout planning prefix",
        semanticRole: "Cacheable ticket and planning-context tokens written by the plan request and read downstream",
        value: L10_PLAN_PREFIX_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l10-shallow-plan-output-tok",
        label: "Quick-sketch output",
        semanticRole: "Generated output tokens billed for shallow planning",
        value: L10_SHALLOW_PLAN_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l10-balanced-plan-output-tok",
        label: "Working-plan output",
        semanticRole: "Generated output tokens billed for balanced planning",
        value: L10_BALANCED_PLAN_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l10-deep-plan-output-tok",
        label: "Exhaustive-plan output",
        semanticRole: "Generated output tokens billed for deep planning",
        value: L10_DEEP_PLAN_OUT_TOK,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l10-shallow-repair-count",
        label: "Quick-sketch repair incidence",
        semanticRole: "Priced repair requests activated by the shallow checkout branch",
        value: L10_SHALLOW_REPAIR_COUNT,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l10-balanced-repair-count",
        label: "Working-plan repair incidence",
        semanticRole: "Priced repair requests activated by the balanced checkout branch",
        value: L10_BALANCED_REPAIR_COUNT,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l10-deep-repair-count",
        label: "Exhaustive-plan repair incidence",
        semanticRole: "Priced repair requests activated by the deep checkout branch",
        value: L10_DEEP_REPAIR_COUNT,
        unit: "count",
        tag: "[FICTION]"
      }
    ],

    estimates: [
      { label: "ticket landing time in seconds", value: 0.0, tag: "[ESTIMATE]" },
      { label: "plan cards appearance time in seconds", value: 0.7, tag: "[ESTIMATE]" },
      { label: "cold-open caption time in seconds", value: 1.2, tag: "[ESTIMATE]" },
      { label: "first interactive time in seconds", value: 1.8, tag: "[ESTIMATE]" }
    ]
  },

  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "counterfactual-after-attempt",
    "just-in-time-toast"
  ],

  checkpoints: [{
    id: "cp-plan-choice",
    createBeforeEventId: "plan-depth-chosen",
    reason: "decision",
    resumeLabel: "Try another plan"
  }],

  failLesson: {
    bucket: "reworkUsd",
    cite: "C1,C3,C28",
    line: "A cheap plan can become expensive when its omissions create an additional priced request."
  },

  failureRules: [{
    id: "shallow-rework-chain",
    predicate: {
      id: "shallow-fourth-repair-expensive",
      kind: "all",
      predicates: [
        {
          id: "shallow-depth-active",
          kind: "compare",
          path: "attemptMetrics.completedDepth",
          op: "eq",
          value: "shallow"
        },
        {
          id: "fourth-repair-resolved",
          kind: "event-completed",
          eventId: "ci-refund-regression-resolved"
        },
        {
          id: "decisive-repair-row",
          kind: "compare",
          path: "lastRequests.0.unitId",
          op: "eq",
          value: "ci-refund-regression"
        },
        {
          id: "decisive-repair-cost",
          kind: "compare",
          path: "lastRequests.0.usd",
          op: "gte",
          value: 0.6798
        }
      ]
    },
    decisiveEventId: "ci-refund-regression-resolved",
    causeCode: "PLAN_DEPTH_REWORK",
    message:
      "The fourth $0.6798 repair cost more than the $0.0900 working-plan upgrade.",
    checkpointId: "cp-plan-choice",
    highlightObjectIds: [
      "plan-shallow",
      "ci-refund-regression"
    ],
    actualUsd: 0.6798,
    validAlternativeUsd: 0.0900
  }],

  gate: {
    predicateId: "apply-plan-depth-rule-after-evidence",
    evidenceRevealEventIds: [
      "l10-checkout-balanced-complete",
      "l10-checkout-deep-complete"
    ],
    postEvidenceActionRequirements: [
      {
        id: "ack-ticket-dependent-rule-after-checkout",
        kind: "any",
        predicates: [
          {
            id: "ack-rule-after-balanced-checkout",
            kind: "action-observed",
            actionType: "ACK_EXPLANATION",
            afterEventId: "l10-checkout-balanced-complete",
            match: {
              explanationId: "plan-depth-is-ticket-dependent"
            }
          },
          {
            id: "ack-rule-after-deep-checkout",
            kind: "action-observed",
            actionType: "ACK_EXPLANATION",
            afterEventId: "l10-checkout-deep-complete",
            match: {
              explanationId: "plan-depth-is-ticket-dependent"
            }
          }
        ]
      },
      {
        id: "right-size-prototype-after-evidence",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "transfer-opened",
        match: {
          explanationId: "prototype-shallow-plan"
        }
      }
    ],
    behavioralRequirements: [
      {
        id: "checkout-completed-validly",
        kind: "any",
        predicates: [
          {
            id: "balanced-checkout-completed",
            kind: "compare",
            path: "attemptMetrics.completedDepth",
            op: "eq",
            value: "balanced"
          },
          {
            id: "deep-checkout-completed",
            kind: "compare",
            path: "attemptMetrics.completedDepth",
            op: "eq",
            value: "deep"
          }
        ]
      },
      {
        id: "valid-checkout-spend",
        kind: "compare",
        path: "attemptMetrics.spentUsd",
        op: "lte",
        value: 3.2754
      },
      {
        id: "causal-rule-retained",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "plan-depth-is-ticket-dependent"
      },
      {
        id: "prototype-transfer-completed",
        kind: "includes",
        path: "completedTransferIds",
        value: "prototype-no-review",
        observedAfterEventId: "transfer-opened"
      }
    ],
    explanationRequirement: {
      id: "rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "plan-depth-is-ticket-dependent"
    },
    transferRequirement: {
      id: "prototype-no-review-accepted",
      kind: "includes",
      path: "completedTransferIds",
      value: "prototype-no-review",
      observedAfterEventId: "transfer-opened"
    }
  },

  pass(st) {
    const metrics = st.attemptMetrics;
    const completedAtValidDepth =
      metrics.completedDepth === "balanced" ||
      metrics.completedDepth === "deep";
    const stayedWithinValidSpend =
      metrics.spentUsd <= 3.2754;
    const explained =
      st.acknowledgedExplanationIds.includes(
        "plan-depth-is-ticket-dependent"
      );
    const transferred =
      st.completedTransferIds.includes("prototype-no-review");

    const passed =
      completedAtValidDepth &&
      stayedWithinValidSpend &&
      explained &&
      transferred;

    return {
      pass: passed,
      reason: passed
        ? "Right-sized planning for checkout, then stopped at quick depth when downstream review disappeared."
        : "Complete a valid checkout, acknowledge the revealed marginal-cost rule, and apply it to the no-review prototype.",
      evidence: passed
        ? [
            metrics.completedDepth ?? "valid-checkout",
            "plan-depth-is-ticket-dependent",
            "prototype-no-review"
          ]
        : [
            "l10-checkout-balanced-complete|l10-checkout-deep-complete"
          ]
    };
  },

  star2: {
    label: "Efficient checkout",
    predicate: {
      id: "efficient-checkout-profile",
      kind: "any",
      predicates: [
        {
          id: "right-sized-checkout-profile",
          kind: "all",
          predicates: [
            {
              id: "balanced-checkout-depth",
              kind: "compare",
              path: "attemptMetrics.completedDepth",
              op: "eq",
              value: "balanced"
            },
            {
              id: "balanced-checkout-spend",
              kind: "compare",
              path: "attemptMetrics.spentUsd",
              op: "lte",
              value: 2.8752
            }
          ]
        },
        {
          id: "clean-pipeline-profile",
          kind: "all",
          predicates: [
            {
              id: "deep-checkout-depth",
              kind: "compare",
              path: "attemptMetrics.completedDepth",
              op: "eq",
              value: "deep"
            },
            {
              id: "deep-checkout-request-count",
              kind: "compare",
              path: "attemptMetrics.requestCount",
              op: "lte",
              value: 4
            },
            {
              id: "deep-checkout-spend-cap",
              kind: "compare",
              path: "attemptMetrics.spentUsd",
              op: "lte",
              value: 3.2754
            }
          ]
        }
      ]
    },
    reason:
      "Either minimize the ticket bill with working depth or pay more planning cost to finish with no repair request."
  },

  star3: {
    label: "Evidence-based planner",
    predicate: {
      id: "balanced-after-evidence-at-reference-cost",
      kind: "all",
      predicates: [
        {
          id: "balanced-completed-depth",
          kind: "compare",
          path: "attemptMetrics.completedDepth",
          op: "eq",
          value: "balanced"
        },
        {
          id: "balanced-total",
          kind: "compare",
          path: "attemptMetrics.spentUsd",
          op: "lte",
          value: 2.8752
        },
        {
          id: "balanced-reselection",
          kind: "action-observed",
          actionType: "CHOOSE_PLAN_DEPTH",
          afterEventId: "branch-revealed",
          match: {
            depth: "balanced"
          }
        },
        {
          id: "prototype-shallow-transfer",
          kind: "includes",
          path: "completedTransferIds",
          value: "prototype-no-review",
          observedAfterEventId: "transfer-opened"
        }
      ]
    },
    reason:
      "Used observed branch evidence to complete checkout at working depth, stayed within $2.8752, and chose quick depth for the no-review prototype."
  },

  referenceCfg: {
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },

  antiCfg: {
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  }
}
```

`referenceCfg` and `antiCfg` intentionally share the fixed configuration. Their `CounterfactualDef.scenarioPatch` values activate different deterministic unit subsets:

- reference: `plan-balanced`, the fixed build spine, and `review-rounding-clarification`;
- anti-pattern: `plan-shallow`, the fixed build spine, and all four shallow repair units;
- alternate choice: `plan-deep` and the fixed build spine, with no repair units.

Planning depth is selected by the checkout’s `CHOOSE_PLAN_DEPTH`, never smuggled into `Config`. The valid checkout remains in live `attemptMetrics` through the explanation and transfer. The transfer uses `ACK_EXPLANATION { explanationId: "prototype-shallow-plan" }`, so it cannot overwrite `attemptMetrics.completedDepth`; only the later `COMPLETE_ATTEMPT` snapshots checkout values into immutable `attemptResult`.

## 6. Pricing walkthrough

The authoritative Sonnet rates are cache read **$0.30/M**, fresh input **$3/M**, 1h write **$6/M**, and output **$15/M** (`C1`, `C3`). Pipeline fresh work and output use `WORK_IN = 6,000` and `WORK_OUT = 44,000` (`C28`). The plan prefix, plan outputs, and repair counts use the semantically named L10 fixtures.

| Row or completed branch | Buckets and calculation | Authoritative cost |
|---|---|---:|
| Quick plan request | `6000×$6/M write + 2000×$15/M output` | **$0.0660** |
| Working plan request | `6000×$6/M write + 8000×$15/M output` | **$0.1560** |
| Exhaustive plan request | `6000×$6/M write + 80000×$15/M output` | **$1.2360** |
| Any build/repair request | `6000×$0.30/M read + 6000×$3/M input + 44000×$15/M output` | **$0.6798** |
| Quick branch | `$0.0660 + 7×$0.6798`; `8` rows | **$4.8246** |
| Working branch — reference | `$0.1560 + 4×$0.6798`; `5` rows | **$2.8752** |
| Exhaustive branch | `$1.2360 + 3×$0.6798`; `4` rows | **$3.2754** |

Request-local failure comparison:

- decisive fourth repair: **$0.6798** (`C1`, `C3`, `C28`);
- quick-to-working planning increment: `$0.1560 − $0.0660` = **$0.0900**;
- local excess: `$0.6798 − $0.0900` = **$0.5898**.

Derived post-attempt evidence:

- Quick saves **$0.0900** on its plan line versus working, then creates three additional repair requests costing **$2.0394**; its total is **$1.9494** higher.
- Exhaustive spends **$1.0800** more on planning than working and avoids one **$0.6798** repair; its total is therefore **$0.4002** higher.
- Working depth is the ticket-specific dollar minimum.
- Exhaustive depth is a completable clean-pipeline profile with `attemptResult.requestCount === 4`, versus `5` for working depth after `COMPLETE_ATTEMPT`.
- The transfer ticket demonstrates that neither profile is a universal answer.

The wallet remains positive on every branch at its terminal frame:

- quick: **$0.1754**
- working: **$2.1248**
- exhaustive: **$1.7246**

The shallow freeze is therefore caused by the decisive rework request, not bankruptcy.

## 7. Tape sequence

`UI_TAPE_RENDERER` uses `rowSource: "ledger"` and renders one row per priced request.

Common order:

1. selected `plan-shallow`, `plan-balanced`, or `plan-deep`, labeled `PLAN`
2. `build-tax-core`
3. `build-refund-path`
4. `build-region-tests`

Selected branch suffix:

- `shallow`:
  5. `review-tax-boundary`
  6. `review-refund-contract`
  7. `ci-rounding-fixture`
  8. `ci-refund-regression`
- `balanced`:
  5. `review-rounding-clarification`
- `deep`: no suffix.

The plan row shows a red 1h-write segment and violet output segment. Every downstream row shows blue cache-read, red fresh-input, and violet output segments.

Tape geometry uses the canonical authoritative-cost model from `OBJECT_MODEL.md`: every non-zero bucket contributes to row width, including `outTok` priced at `5x`; each `WireSegment.widthRatio` is its USD share of the row. Thus the `44,000` output-token charge remains the dominant visible weight.

The shallow fail frame pins:

- **DECISIVE REPAIR $0.6798**
- **WORKING-PLAN INCREMENT $0.0900**
- **LOCAL EXCESS $0.5898**
- supporting cumulative context:
  - **PLAN $0.0660**
  - **FIXED BUILD $2.0394**
  - **REPAIRS $2.7192**
  - **TOTAL $4.8246**
- the live cache entry and seven read touches;
- a causal connector from `plan-shallow` to `ci-refund-regression`, labeled **“ticket-specific repair incidence · calibrated FICTION.”**

The post-attempt comparison is the tradeoff-confirmation frame: exhaustive planning has the largest plan row and fewest total rows, while working depth has one additional repair but the lowest total spend.

## 8. Prediction prompts

### `p-branch-count`

Shown after `build-region-tests` and before REVIEW or CI reveals.

> **The build is done. What happens when review and CI inspect this plan?**

- `no-repairs` — “It passes straight through.”
- `one-repair` — “One repair request opens.”
- `several-repairs` — “Several repair requests open.”

Branch-specific correct result:

- quick → `several-repairs`
- working → `one-repair`
- exhaustive → `no-repairs`

Button: **Lock prediction**.

### `p-largest-bill`

Shown after `COMPLETE_ATTEMPT` and before alternate totals are requested.

> **For this same checkout ticket, which plan produced the largest total bill?**

- `quick-total` — “Quick sketch”
- `working-total` — “Working plan”
- `exhaustive-total` — “Exhaustive plan”

Correct result: `quick-total`.

Button: **Lock prediction and compare**.

Both prompts satisfy `predict-before-reveal`. A wrong answer changes only revealed evidence; it never affects wallet, gate, failure, or stars.

## 9. Fail-state

Decisive event: the actual `ci-refund-regression-resolved` request posts its one **$0.6798** row and immediately dispatches `FREEZE_FAILURE`.

Freeze copy:

> **The fourth $0.6798 repair cost more than the $0.0900 working-plan upgrade.**

Supporting copy:

> This one repair exceeded the visible alternative by **$0.5898**. Repair incidence is calibrated **FICTION**; every displayed token price is authoritative.

The failure is request-locally economically true:

- decisive actual request: **$0.6798**
- valid incremental alternative: **$0.0900**
- local difference: **$0.5898**
- cumulative shallow spend visible at the same frame: **$4.8246**
- projected valid working total, revealed only in the later post-attempt comparison: **$2.8752**

Rewind behavior:

- **Try another plan** dispatches `REWIND_TO_CHECKPOINT { checkpointId: "cp-plan-choice" }`.
- The cold-open is skipped.
- The previous ledger and causal trace remain in a collapsed **Previous run** drawer.
- The tried card retains its observed repair count and total.
- Untried full-branch outcomes remain hidden.
- Attempt count persists.
- Attempt-local ledger rows, cache state, and `attemptMetrics` are reconstructed from the checkpoint on the new branch.
- No economic action is enabled while frozen.
- `COMPLETE_ATTEMPT` is not dispatched on the frozen shallow branch.
- `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, and reference reveals are informational and can never dispatch this failure.

## 10. Gate & stars

Before completion, the pure `pass(st)` reads only canonical live reducer state:

- `attemptMetrics.completedDepth` equals `balanced` or `deep`;
- `attemptMetrics.spentUsd <= 3.2754`;
- `acknowledgedExplanationIds` includes `"plan-depth-is-ticket-dependent"`;
- `completedTransferIds` includes `"prototype-no-review"`.

The transfer marker is appended only by the qualifying post-`transfer-opened` `ACK_EXPLANATION { explanationId: "prototype-shallow-plan" }`. That transfer action does not write planning depth, so live checkout evidence remains intact in `attemptMetrics` until `COMPLETE_ATTEMPT` evaluates the gate and stars.

Prediction commitment is only a reveal precondition. Prediction option and correctness are forbidden gate/star evidence.

Stars:

- **1 star — Ticket reader:** satisfy the behavioral gate.
- **2 stars — Efficient checkout:** satisfy the gate with either:
  - balanced checkout at `attemptMetrics.spentUsd <= 2.8752`; or
  - deep checkout at `attemptMetrics.spentUsd <= 3.2754` and `attemptMetrics.requestCount <= 4`.
- **3 stars — Evidence-based planner:** after an earlier `branch-revealed` event, choose `balanced`, reach `attemptMetrics.completedDepth === "balanced"` and `attemptMetrics.spentUsd <= 2.8752`, then append `"prototype-no-review"` through the accepted transfer acknowledgement.

Consequences:

- A first-attempt exhaustive run can pass and earn **2 stars** for the reducer-visible clean-pipeline profile.
- A first-attempt working run can earn **2 stars** for the lowest-spend profile.
- A working run chosen after observed branch evidence can earn **3 stars**.
- A shallow-only run cannot pass because it freezes on its decisive fourth repair until rewind.
- Budget alone cannot pass the level.
- Every predicate uses a declared `ReducerState` path, legal `StatePredicate` kind, and legal comparison op.
- `attemptResult.*` is read only after `COMPLETE_ATTEMPT` for result rendering and post-completion QA.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| Plan row lands | “PLAN wrote 6,000 stable tokens to the 1h cache.” |
| First build reads | “BUILD read the plan prefix at 0.1x, then paid for fresh work and output.” |
| First fixed build lands | “6,000 read + 6,000 fresh + 44,000 output · $0.6798.” |
| Branch prediction opens | “Review and CI are still face-down. Predict before they turn over.” |
| First repair appears | “This branch is a new priced request, not a warning icon.” |
| Repair connector receives focus | “Cause: {causeLabel} · calibrated FICTION.” |
| Shallow freeze | “One repair: $0.6798. Working-plan increment: $0.0900.” |
| Rewind completes | “Evidence kept. Untried outcomes hidden again.” |
| Exhaustive branch clears CI | “Zero repairs—but the plan itself cost $1.2360.” |
| Counterfactual reveals | “Working wins on dollars; exhaustive wins on request count.” |
| Transfer opens | “New ticket, new stopping point: no review or CI can repay extra planning.” |
| Transfer accepted | “Prototype rule applied.” |
| Output segment first receives focus | “Output is priced at 5x and contributes its full cost to tape width.” |

## 12. QA gate

Real-browser click-through assertions:

1. Initial UI exposes only ticket copy, plan token volumes, plan-line costs, wallet, and closed pipeline.
2. No branch count, completed total, preferred depth, or comparison appears before play.
3. Card click dispatches exactly one `CHOOSE_PLAN_DEPTH`, writes the chosen value to `attemptMetrics.completedDepth`, and creates no `LedgerRow`.
4. **Lock plan and run** dispatches exactly one of `plan-shallow`, `plan-balanced`, or `plan-deep` and creates one row with `writeTok: 6000`, `readTok: 0`, and the selected authoritative output count.
5. `scenarioData.units` contains valid `UnitSeed` objects, and `scenarioData.prefixStacks` contains a valid `PrefixStackSeed` with one last-position `current` block.
6. Every `WorkloadSeed` has a nonempty `label` and a declared `requiredCapabilityIds` array.
7. The plan creates one live 1h `CacheEntry`; every subsequent build/repair reads exactly `6,000` tokens and refreshes it.
8. Each build/repair row has `readTok: 6000`, `inputTok: 6000`, `writeTok: 0`, `outTok: 44000`, and exact cost `0.6798`.
9. REVIEW and CI cannot reveal before `COMMIT_PREDICTION("p-branch-count")`.
10. Wrong predictions change no wallet value, failure rule, gate predicate, or star predicate.
11. Exact ledger/tape row counts are quick `8`, working `5`, and exhaustive `4`.
12. `UI_TAPE_RENDERER` row count equals priced-request count at every frame.
13. Every non-zero output bucket contributes its authoritative USD share to tape geometry.
14. Every request yields exactly one `LedgerRow`; every row has `usd > 0`.
15. No positive amount displays as `$0.0000`.
16. Exact unrounded totals are quick `4.8246`, working `2.8752`, and exhaustive `3.2754`.
17. The shallow failure records request-local `actualUsd: 0.6798` and `validAlternativeUsd: 0.0900`.
18. `FREEZE_FAILURE` fires atomically from `ci-refund-regression-resolved`, after its row renders and before any `COMPLETE_ATTEMPT` or later economic action.
19. The decisive frame visibly proves `$0.6798 > $0.0900`; the cumulative `$4.8246` is supporting ledger context, not the failure-rule comparison.
20. Shallow freezes with a positive wallet of `0.1754`, proving bankruptcy is not the cause.
21. Rewind returns to `cp-plan-choice`, preserves prior evidence/attempt count, clears attempt-local economics, and conceals untried full-branch outcomes.
22. Counterfactual totals remain inaccessible until `COMPLETE_ATTEMPT` has produced a valid checkout result and `p-largest-bill` is committed.
23. The comparison uses the same seed, context, stable prefix, build spine, and pricing function for all depths.
24. Counterfactual/reference processing cannot dispatch `FREEZE_FAILURE`, change `clockFrozen`, replace `attemptResult`, or mutate the actual wallet or ledger.
25. Gate passage requires a causal explanation acknowledgement after `l10-checkout-balanced-complete` or `l10-checkout-deep-complete`, plus `completedTransferIds.includes("prototype-no-review")`.
26. Neither `p-branch-count` nor `p-largest-bill` correctness appears in `pass(st)`, `star2`, or `star3`.
27. Before completion, a balanced checkout has `attemptMetrics.completedDepth: "balanced"`, `attemptMetrics.spentUsd: 2.8752`, `attemptMetrics.requestCount: 5`, and `attemptResult === null`; `COMPLETE_ATTEMPT` snapshots those exact values into `attemptResult`.
28. Before completion, a deep checkout has `attemptMetrics.completedDepth: "deep"`, `attemptMetrics.spentUsd: 3.2754`, `attemptMetrics.requestCount: 4`, and `attemptResult === null`; `COMPLETE_ATTEMPT` snapshots those exact values into `attemptResult`.
29. A post-`transfer-opened` `ACK_EXPLANATION { explanationId: "prototype-shallow-plan" }` appends `"prototype-no-review"` once to `completedTransferIds`, leaves `attemptMetrics.completedDepth` unchanged, and leaves `attemptResult === null`.
30. After the qualifying transfer action, the enabled completion control dispatches `COMPLETE_ATTEMPT`; that action alone evaluates the gate and stars and snapshots `attemptResult`.
31. A first-attempt exhaustive completion can earn `2` stars through the clean-pipeline arm.
32. A first-attempt working completion can earn `2` stars through the lowest-spend arm, not `3`.
33. A working choice made after earlier `branch-revealed` evidence, followed by the accepted transfer, earns `3` stars at live `attemptMetrics.spentUsd <= 2.8752`; the later snapshot preserves that spend in `attemptResult`.
34. The pure `pass(st)` inspects `attemptMetrics.completedDepth`, `attemptMetrics.spentUsd`, `acknowledgedExplanationIds`, and `completedTransferIds`; it reads no `attemptResult`, action-history, or view-local field before completion.
35. All three primary branches are reachable from the `$5.00` wallet; the economically inferior shallow branch invokes the teaching freeze.
36. Balanced and deep are both completable: balanced has the lower `spentUsd`, while deep has the lower `requestCount`; both benefits affect `star2`.
37. Every failure, gate, and star predicate resolves against declared `ReducerState` fields and uses only `compare`, `includes`, `event-completed`, `action-observed`, `all`, `any`, or `not`, with comparison ops limited to `eq`, `neq`, `lt`, `lte`, `gt`, or `gte`.
38. Every gameplay fiction value is registered in `scenarioData.fixtures` with `id`, `semanticRole`, `unit`, and `[FICTION]`; `scenarioData.estimates` contains presentation timing only.
39. The exact title **“The Checkout Ticket”** and objective **“Ship the regional-tax change without breaking refunds.”** contain none of `concept.solutionVocabulary`.
40. `conceptScope` is exactly `{ kind: "single", reusedConceptIds: [] }`.
41. Keyboard focus exposes the same plan prices, segment calculations, causal labels, and prediction controls as pointer hover.
42. Reduced-motion mode reveals the same final evidence and gate result.
43. Refresh/replay with seed `1010` produces byte-identical action order, prefix resolution, cache touches, ledger rows, totals, branch labels, transfer marker, completion snapshot, counterfactual reveal, and star result.

## 13. Reference-bar justification

The first screen offers a genuine tradeoff: deeper planning has an unmistakable immediate price, while its downstream payoff remains unknown. The player commits, watches the plan create reusable cache state, predicts the closed pipeline, and then sees ticket-specific repair requests grow causally from the choice. The shallow failure freezes on the actual fourth repair request and compares its **$0.6798** charge directly with the visible **$0.0900** planning alternative before rewinding to the decision.

A valid branch first leaves its actual evidence in live `attemptMetrics`. The player acknowledges the causal rule, applies it to the no-review prototype without changing checkout depth, and then explicitly completes the attempt. Only that `COMPLETE_ATTEMPT` evaluates the gate and stars and snapshots `attemptResult`; the full comparison remains informational and appears afterward. Working depth wins on spend, while exhaustive depth wins on request count and earns a separate reducer-visible two-star profile. This preserves a real choice instead of making working depth dominate every scored outcome.

Authoring tradeoff: the exhaustive plan uses an intentionally large `80,000`-token output fixture so its authoritative Sonnet output charge is large enough to expose marginal-cost reasoning. The repair incidence is also explicitly ticket-specific. The accepted transfer is represented by `ACK_EXPLANATION { explanationId: "prototype-shallow-plan" }` and `"prototype-no-review"` in `completedTransferIds`, preventing the transfer from corrupting the live checkout metrics that `COMPLETE_ATTEMPT` evaluates and snapshots.

