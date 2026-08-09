# Level 10 — Plan Once, Pay Later

## 1. Identity

- **id:** `10-plan-once-pay-later`
- **title:** Plan Once, Pay Later
- **tier:** 2
- **ONE concept:** `plan-depth-downstream-cost` — planning depth trades a visible planning cost against ticket-dependent downstream rework.
- **Prerequisite concept:** `workload-cost-mix`
- **Objective copy:** “Ship the change. Choose how much planning to buy before the pipeline starts.”
- **Introduced control:** `planDepth`, dispatching `CHOOSE_PLAN_DEPTH`.
- Plan-output sizes and repair incidence are calibrated **[FICTION]**. Cache and token prices use `PRICE_REQUEST` and the canonical `C1`/`C3` rates.

## 2. Objects used

- `LevelDef`
- `ReducerState`
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

- **0.0s `[ESTIMATE]`:** Ticket lands. Wallet reads **$5.00 `[FICTION]`**.
- **0.7s `[ESTIMATE]`:** Three face-down cards appear: **Quick sketch**, **Working plan**, **Exhaustive plan**.
- **1.2s `[ESTIMATE]`:** Caption: “How much planning do you buy before anyone touches the code?”
- **1.8s `[ESTIMATE]`:** Cards become clickable.
- **On hover:** `UI_HOVER_PRICE_CALCULATOR` exposes only the selected plan request:
  - Quick sketch — `6,000`-token 1h prefix write + `2,000` output — **$0.066**
  - Working plan — `6,000`-token 1h prefix write + `8,000` output — **$0.156**
  - Exhaustive plan — `6,000`-token 1h prefix write + `80,000` output — **$1.236**
- **Never pre-play:** repair incidence, completed totals, “best” badges, downstream previews, or reference comparisons.
- **After selection:** primary button reads **Lock plan and run**.

The large visible exhaustive-plan price establishes the other side of the decision without revealing whether its additional planning will pay back on this ticket.

## 4. Exact event sequence

All selected-depth repair counts are deterministic calibrated **[FICTION]**. Every request uses the same Sonnet `MAIN_SESSION_CONTEXT`, cache namespace, and byte-identical `6,000`-token stable ticket/planning prefix (`WORK_IN`, `C28`). Requests occur at consecutive simulated minutes, so the 1h entry remains live; each read refreshes it under `C12`.

1. **Enter level**  
   Route opens → `ENTER_LEVEL { levelId: "10-plan-once-pay-later" }` → initializes `ReducerState`, `$5.00` `Wallet`/`Budget` `[FICTION]`, `Clock` at `0m`, empty ledger, empty cache, attempt `1`, and the level-start checkpoint.

2. **Create the decision boundary**  
   Cards settle → `CREATE_CHECKPOINT { checkpointId: "cp-plan-choice", reason: "decision" }` → appends `Checkpoint` only; no request or cost.

3. **Choose a hidden branch**  
   Card click → `CHOOSE_PLAN_DEPTH { depth }` → records `shallow`, `balanced`, or `deep`; no `Request`, `LedgerRow`, cache mutation, or wallet mutation.

4. **Run the plan and create reusable state**  
   **Lock plan and run** → `RUN_UNIT { unitId: "plan" }` → `RESOLVE_PREFIX` writes the stable `6,000`-token prefix to a 1h `CacheEntry`; the request has `readTok: 0`, `inputTok: 0`, `writeTok: 6_000`, and branch-specific `outTok`:
   - `shallow`: `2,000` output → **$0.066**
   - `balanced`: `8,000` output → **$0.156**
   - `deep`: `80,000` output → **$1.236**

   The action appends one `LedgerRow`, deducts the exact price from `Wallet`, sets `lastRequests` to that row, and renders the write and output `WireSegment`s.

5. **Run the fixed build spine through the cache**  
   Three ordered actions execute:
   - `RUN_UNIT { unitId: "build-tax-core" }`
   - `RUN_UNIT { unitId: "build-refund-path" }`
   - `RUN_UNIT { unitId: "build-region-tests" }`

   Each request has Sonnet `readTok: 6_000`, `inputTok: 6_000`, `writeTok: 0`, and `outTok: 44_000`. Each costs **$0.6798**; the three-build subtotal is **$2.0394**. Each read touches the live entry. Each action appends exactly one ledger/tape row and updates wallet, counts, unit status, cache liveness, and `lastRequests`.

6. **Commit a prediction before downstream revelation**  
   After `build-region-tests`, REVIEW and CI remain face-down → `OPEN_PREDICTION { promptId: "p-branch-count" }`.  
   Player selection → `SELECT_PREDICTION`; lock → `COMMIT_PREDICTION`.  
   Correctness changes no score, stars, wallet, failure rule, or gate state.

7. **Reveal only the chosen branch**  
   `REVEAL_PREDICTION { promptId: "p-branch-count", correctOptionId }` reveals:
   - `shallow`: two review repairs and two CI repairs;
   - `balanced`: one review repair;
   - `deep`: no repair requests.

   The reveal carries: **“Repair incidence is calibrated FICTION for this ticket.”** Unchosen branch outcomes remain hidden.

8. **Run each revealed causal repair**  
   Each repair executes via one `RUN_UNIT`, producing one Sonnet request with the same authoritative `6,000` read, `6,000` fresh input, `44,000` output, and **$0.6798** cost:
   - `shallow`:
     1. `review-tax-boundary` — **Quick sketch omitted tax ownership**
     2. `review-refund-contract` — **Quick sketch omitted the refund contract**
     3. `ci-rounding-fixture` — **Review repair changed rounding behavior**
     4. `ci-refund-regression` — **Review repair changed refund behavior**
   - `balanced`:
     1. `review-rounding-clarification` — **Working plan left one rounding rule unresolved**
   - `deep`: no repair units.

9. **Freeze the economically losing shallow route**  
   When `ci-refund-regression` resolves, its row raises the selected route to **$4.8246** → `FREEZE_FAILURE` with:
   - `failureId: "shallow-rework-chain"`
   - `causeCode: "PLAN_DEPTH_REWORK"`
   - `checkpointId: "cp-plan-choice"`
   - `actualUsd: 4.8246`
   - `validAlternativeUsd: 2.8752`

   The visible repair subtotal is **$2.7192**, which is **2.32×** the largest exposed plan premium, **$1.1700**. The actual shallow route is **67.8% `[FICTION]`** more expensive than the valid balanced route. `Clock`, wallet, tape, and economic actions freeze on the decisive fourth repair.

10. **Retry from retained evidence**  
    **Try another plan** → `REWIND_TO_CHECKPOINT { checkpointId: "cp-plan-choice" }` → deterministic replay to the decision boundary. Frozen state and attempt-local ledger/cache rows clear; attempt count and observed evidence persist. The tried card shows its observed repair count and total. Untried downstream results remain hidden.

11. **Complete a valid checkout attempt**  
    A `balanced` or `deep` branch reaches the end → `COMPLETE_ATTEMPT`. The completed ledger persists. This unlocks, but does not reveal, the comparison.

12. **Predict the comparison**  
    `OPEN_PREDICTION { promptId: "p-largest-bill" }` opens before any alternate total appears. Selection and commitment use `SELECT_PREDICTION` and `COMMIT_PREDICTION`; correctness remains non-punitive.

13. **Reveal the same-seed counterfactuals**  
    Commitment enables `REQUEST_COUNTERFACTUAL { comparisonId: "plan-depth-bill" }`; the same seed and fixed build spine run off-screen. `REVEAL_COUNTERFACTUAL { comparisonId: "plan-depth-bill" }` then displays:
    - Quick sketch: **$4.8246**
    - Working plan: **$2.8752**
    - Exhaustive plan: **$3.2754**

    The reveal explains that working depth wins this ticket: exhaustive planning costs **$1.0800** more than working planning but avoids only one **$0.6798** repair, leaving it **$0.4002** more expensive overall.

14. **Choose the post-evidence explanation**  
    Player opens the causal trace and selects: **“Planning should stop when the next planning increment costs more than the rework it can avoid.”**  
    Correct selection → `ACK_EXPLANATION { explanationId: "plan-depth-is-ticket-dependent" }`. Incorrect explanation choices have no penalty and may be revised.

15. **Apply the rule to a new ticket**  
    `BEGIN_TRANSFER { challengeId: "prototype-no-review" }` reveals:

    > **Prototype spike**  
    > One fixed build. Review and CI are disabled, and the artifact will be discarded after the demo.

    The same three plan-line costs remain visible. Player dispatches `CHOOSE_PLAN_DEPTH` for the transfer. `shallow` is the demonstrated-understanding action because no downstream request can repay deeper planning. A different choice causes no freeze or score deduction; the transfer remains editable until `shallow` is selected.

16. **Evaluate pass and stars**  
    A correct post-evidence transfer choice → `COMPLETE_ATTEMPT` → evaluates the behavioral gate and star predicates. Neither prediction selection nor prediction correctness is read by `pass(st)`.

## 5. Level data

```ts
{
  id: "10-plan-once-pay-later",
  tier: 2,
  title: "Plan Once, Pay Later",
  objective: "Ship the change. Choose how much planning to buy before the pipeline starts.",
  concept: {
    id: "plan-depth-downstream-cost",
    privateDesignerSummary:
      "Planning depth trades plan-generation cost against ticket-dependent downstream rework.",
    postRevealRule:
      "Buy another layer of planning only when it costs less than the rework it is expected to avoid."
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
  seed: 1010,
  budgetUsd: 5.00,
  clockCapMin: 300,
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
    prefixStacks: ["checkout-pipeline-prefix"],
    units: [
      "plan",
      "build-tax-core",
      "build-refund-path",
      "build-region-tests",
      "review-tax-boundary",
      "review-refund-contract",
      "ci-rounding-fixture",
      "ci-refund-regression",
      "review-rounding-clarification"
    ],
    workloads: [
      {
        id: "plan-shallow",
        role: "plan",
        unitIds: ["plan"],
        inputTok: 6000,
        outTok: 2000,
        allowedModels: ["sonnet"]
      },
      {
        id: "plan-balanced",
        role: "plan",
        unitIds: ["plan"],
        inputTok: 6000,
        outTok: 8000,
        allowedModels: ["sonnet"]
      },
      {
        id: "plan-deep",
        role: "plan",
        unitIds: ["plan"],
        inputTok: 6000,
        outTok: 80000,
        allowedModels: ["sonnet"]
      },
      {
        id: "pipeline-work",
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
        inputTok: 6000,
        outTok: 44000,
        allowedModels: ["sonnet"]
      }
    ],
    estimates: [
      { label: "initial wallet", value: 5.00, tag: "[FICTION]" },
      { label: "quick plan output tokens", value: 2000, tag: "[FICTION]" },
      { label: "working plan output tokens", value: 8000, tag: "[FICTION]" },
      { label: "exhaustive plan output tokens", value: 80000, tag: "[FICTION]" },
      { label: "quick repair requests", value: 4, tag: "[FICTION]" },
      { label: "working repair requests", value: 1, tag: "[FICTION]" },
      { label: "exhaustive repair requests", value: 0, tag: "[FICTION]" }
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
    line: "A cheap plan can become expensive when its omissions create additional priced requests."
  },
  failureRules: [{
    id: "shallow-rework-chain",
    decisiveEventId: "ci-refund-regression-resolved",
    causeCode: "PLAN_DEPTH_REWORK",
    message:
      "The $0.066 quick plan led to four $0.6798 repair requests.",
    checkpointId: "cp-plan-choice",
    highlightObjectIds: [
      "plan",
      "review-tax-boundary",
      "review-refund-contract",
      "ci-rounding-fixture",
      "ci-refund-regression"
    ],
    actualUsd: 4.8246,
    validAlternativeUsd: 2.8752
  }],

  gate: {
    predicateId: "apply-plan-depth-rule-after-evidence",
    evidenceRevealEventIds: [
      "branch-revealed",
      "counterfactual-revealed"
    ],
    postEvidenceActionRequirements: [
      {
        id: "ack-ticket-dependent-rule",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "counterfactual-revealed",
        match: { explanationId: "plan-depth-is-ticket-dependent" }
      },
      {
        id: "right-size-prototype",
        kind: "action-observed",
        actionType: "CHOOSE_PLAN_DEPTH",
        afterEventId: "transfer-opened",
        match: { depth: "shallow" }
      }
    ],
    behavioralRequirements: [
      {
        id: "checkout-completed-validly",
        kind: "any",
        predicates: [
          {
            id: "balanced-completed",
            kind: "compare",
            path: "attemptResult.completedDepth",
            op: "eq",
            value: "balanced"
          },
          {
            id: "deep-completed",
            kind: "compare",
            path: "attemptResult.completedDepth",
            op: "eq",
            value: "deep"
          }
        ]
      },
      {
        id: "causal-trace-inspected",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "plan-depth-is-ticket-dependent",
        observedAfterEventId: "counterfactual-revealed"
      }
    ],
    explanationRequirement: {
      id: "rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "plan-depth-is-ticket-dependent",
      observedAfterEventId: "counterfactual-revealed"
    },
    transferRequirement: {
      id: "prototype-transfer-completed",
      kind: "includes",
      path: "completedTransferIds",
      value: "prototype-no-review",
      observedAfterEventId: "transfer-opened"
    }
  },

  star2: {
    label: "Right-sized checkout",
    predicate: {
      id: "balanced-checkout",
      kind: "compare",
      path: "attemptResult.completedDepth",
      op: "eq",
      value: "balanced"
    },
    reason: "Completed the checkout ticket with its lowest-cost planning depth."
  },

  star3: {
    label: "Evidence-based planner",
    predicate: {
      id: "balanced-after-evidence",
      kind: "all",
      predicates: [
        {
          id: "balanced-total",
          kind: "compare",
          path: "attemptResult.spentUsd",
          op: "lte",
          value: 2.8752
        },
        {
          id: "balanced-reselection",
          kind: "action-observed",
          actionType: "CHOOSE_PLAN_DEPTH",
          afterEventId: "branch-revealed",
          match: { depth: "balanced" }
        },
        {
          id: "prototype-shallow-transfer",
          kind: "action-observed",
          actionType: "CHOOSE_PLAN_DEPTH",
          afterEventId: "transfer-opened",
          match: { depth: "shallow" }
        }
      ]
    },
    reason:
      "Used observed evidence to choose working depth for checkout and quick depth for the no-review prototype."
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

- reference: working plan plus `review-rounding-clarification`;
- anti-pattern: quick plan plus all four shallow repair units;
- alternate choice: exhaustive plan with no repair units.

Planning depth is selected by `CHOOSE_PLAN_DEPTH`, not smuggled into `Config`.

## 6. Pricing walkthrough

The authoritative Sonnet rates are cache read **$0.30/M**, fresh input **$3/M**, 1h write **$6/M**, and output **$15/M** (`C1`, `C3`). The shared prefix and each pipeline unit’s fresh work use `WORK_IN = 6,000`; pipeline output uses `WORK_OUT = 44,000` (`C28`). Plan outputs and repair counts are calibrated **[FICTION]**.

| Row or completed branch | Buckets and calculation | Authoritative cost |
|---|---|---:|
| Quick plan request | `6000×$6/M write + 2000×$15/M output` | **$0.0660** |
| Working plan request | `6000×$6/M write + 8000×$15/M output` | **$0.1560** |
| Exhaustive plan request | `6000×$6/M write + 80000×$15/M output` | **$1.2360** |
| Any build/repair request | `6000×$0.30/M read + 6000×$3/M input + 44000×$15/M output` | **$0.6798** |
| Quick branch | `$0.0660 + 7×$0.6798`; `8` rows | **$4.8246** |
| Working branch — reference | `$0.1560 + 4×$0.6798`; `5` rows | **$2.8752** |
| Exhaustive branch | `$1.2360 + 3×$0.6798`; `4` rows | **$3.2754** |

Derived post-attempt evidence:

- Quick saves **$0.0900** on its plan line versus working, then creates three additional repair requests costing **$2.0394**; its total is **$1.9494** higher.
- Exhaustive spends **$1.0800** more on planning than working and avoids one **$0.6798** repair; its total is therefore **$0.4002** higher.
- The working branch is the ticket-specific minimum. The transfer ticket demonstrates that this is not a universal “always choose working” answer.

The wallet remains positive on every completed branch:

- quick: **$0.1754**
- working: **$2.1248**
- exhaustive: **$1.7246**

The shallow freeze is therefore caused by demonstrated rework economics, not bankruptcy.

## 7. Tape sequence

`UI_TAPE_RENDERER` uses `rowSource: "ledger"` and renders one row per priced request.

Common order:

1. `plan`
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

Tape geometry uses the canonical authoritative-cost model from `OBJECT_MODEL.md`: every non-zero bucket contributes to row width, including `outTok` priced at `5x`; each `WireSegment.widthRatio` is its USD share of the row. Thus the `44,000` output-token charge remains the dominant visible weight instead of being hidden behind the much smaller input buckets.

The shallow fail frame pins:

- **PLAN $0.0660**
- **FIXED BUILD $2.0394**
- **REPAIRS $2.7192**
- **TOTAL $4.8246**
- the live cache entry and seven read touches;
- a continuous causal connector from the selected plan to all four repair rows, labeled **“ticket-specific repair incidence · calibrated FICTION.”**

The post-attempt comparison is the tradeoff-confirmation frame: the exhaustive row is visibly much larger than the working row, while the working branch contains one additional repair.

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

Shown after a valid attempt completes and before alternate totals are requested.

> **For this same checkout ticket, which plan produced the largest total bill?**

- `quick-total` — “Quick sketch”
- `working-total` — “Working plan”
- `exhaustive-total` — “Exhaustive plan”

Correct result: `quick-total`.

Button: **Lock prediction and compare**.

Both prompts satisfy `predict-before-reveal`. A wrong answer changes only revealed evidence; it never affects wallet, gate, failure, or stars.

## 9. Fail-state

Decisive event: `ci-refund-regression` posts the fourth shallow repair row.

Freeze copy:

> **The $0.066 quick plan led to four $0.6798 repair requests.**

Supporting copy:

> Repairs now cost **$2.7192**—more than twice the largest planning premium you were offered. Repair incidence is calibrated **FICTION**; every displayed token price is real.

The failure is economically true:

- frozen shallow total: **$4.8246**
- valid working alternative: **$2.8752**
- visible difference: **$1.9494**
- shallow penalty: **67.8% `[FICTION]`**

Rewind behavior:

- **Try another plan** dispatches `REWIND_TO_CHECKPOINT { checkpointId: "cp-plan-choice" }`.
- The cold-open is skipped.
- The previous ledger and causal trace remain in a collapsed **Previous run** drawer.
- The tried card retains its observed repair count and total.
- Untried branch outcomes remain hidden.
- Attempt count persists.
- Attempt-local ledger rows and cache state are reconstructed from the checkpoint on the new branch.
- No economic action is enabled while frozen.

## 10. Gate & stars

Pass requires all of:

- complete the checkout using `balanced` or `deep`;
- reveal the same-seed comparison after an attempt;
- after that evidence, acknowledge `plan-depth-is-ticket-dependent`;
- begin `prototype-no-review`;
- choose `shallow` for that transfer ticket after its constraints are visible.

Prediction commitment is only a reveal precondition. Prediction option and correctness are forbidden gate/star evidence.

Stars:

- **1 star — Ticket reader:** satisfy the behavioral gate.
- **2 stars — Right-sized checkout:** satisfy the gate and complete checkout with `balanced` at **$2.8752**.
- **3 stars — Evidence-based planner:** after observing an earlier branch reveal, choose `balanced`, finish at or below **$2.8752**, and then choose `shallow` for `prototype-no-review`.

Consequences:

- A first-attempt exhaustive run can pass after the transfer but earns exactly **1 star**.
- A first-attempt working run can earn **2 stars**, because its checkout choice preceded evidence.
- A working run chosen after observed branch evidence can earn **3 stars**.
- A shallow-only run cannot pass because it remains frozen until rewind.
- Budget alone cannot pass the level.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| Plan row lands | “PLAN wrote 6,000 stable tokens to the 1h cache.” |
| First build reads | “BUILD read the plan prefix at 0.1x, then paid for fresh work and output.” |
| First fixed build lands | “6,000 read + 6,000 fresh + 44,000 output · $0.6798.” |
| Branch prediction opens | “Review and CI are still face-down. Predict before they turn over.” |
| First repair appears | “This branch is a new priced request, not a warning icon.” |
| Repair connector receives focus | “Cause: {causeLabel} · calibrated FICTION.” |
| Shallow freeze | “$0.066 planned; $2.7192 repaired.” |
| Rewind completes | “Evidence kept. Untried outcomes hidden again.” |
| Exhaustive branch clears CI | “Zero repairs—but the plan itself cost $1.2360.” |
| Counterfactual reveals | “Working wins this ticket. Exhaustive planning did not repay its premium.” |
| Transfer opens | “New ticket, new stopping point: no review or CI can repay extra planning.” |
| Output segment first receives focus | “Output is priced at 5x and contributes its full cost to tape width.” |

## 12. QA gate

Real-browser click-through assertions:

1. Initial UI exposes only ticket copy, plan token volumes, plan-line costs, wallet, and closed pipeline.
2. No branch count, completed total, preferred depth, or comparison appears before play.
3. Card click dispatches exactly one `CHOOSE_PLAN_DEPTH` and creates no `LedgerRow`.
4. **Lock plan and run** creates one plan row with `writeTok: 6000`, `readTok: 0`, and the selected authoritative output count.
5. The plan creates one live 1h `CacheEntry`; every subsequent build/repair reads exactly `6,000` tokens and refreshes it.
6. Each build/repair row has `readTok: 6000`, `inputTok: 6000`, `writeTok: 0`, `outTok: 44000`, and exact cost `0.6798`.
7. REVIEW and CI cannot reveal before `COMMIT_PREDICTION("p-branch-count")`.
8. Wrong predictions change no wallet value, failure rule, gate predicate, or star predicate.
9. Exact ledger/tape row counts are quick `8`, working `5`, and exhaustive `4`.
10. `UI_TAPE_RENDERER` row count equals priced-request count at every frame.
11. Every non-zero output bucket contributes its authoritative USD share to tape geometry.
12. Every request yields exactly one `LedgerRow`; every row has `usd > 0`.
13. No positive amount displays as `$0.0000`.
14. Exact unrounded totals are quick `4.8246`, working `2.8752`, and exhaustive `3.2754`.
15. The shallow freeze records `actualUsd: 4.8246` and `validAlternativeUsd: 2.8752`; it cannot fire before `ci-refund-regression`.
16. Shallow freezes with a positive wallet of `0.1754`, proving bankruptcy is not the cause.
17. Rewind returns to `cp-plan-choice`, preserves prior evidence/attempt count, clears attempt-local economics, and conceals untried outcomes.
18. Counterfactual totals remain inaccessible until a checkout attempt completes and `p-largest-bill` is committed.
19. The comparison uses the same seed, context, stable prefix, build spine, and pricing function for all depths.
20. Gate passage requires `ACK_EXPLANATION` and a `CHOOSE_PLAN_DEPTH { depth: "shallow" }` action after the transfer opens.
21. Neither `p-branch-count` nor `p-largest-bill` correctness appears in `pass(st)`, `star2`, or `star3`.
22. A first-attempt exhaustive completion earns exactly `1` star after satisfying the transfer gate.
23. A first-attempt working completion earns `2` stars, not `3`.
24. A working choice made after earlier branch evidence, followed by the correct transfer, earns `3` stars at spend `<= 2.8752`.
25. All three primary branches remain winnable from the `$5.00` wallet; only the economically inferior shallow branch invokes the teaching freeze.
26. Keyboard focus exposes the same plan prices, segment calculations, causal labels, and prediction controls as pointer hover.
27. Refresh/replay with seed `1010` produces byte-identical action order, prefix resolution, cache touches, ledger rows, totals, branch labels, and star result.

## 13. Reference-bar justification

The first screen offers a genuine tradeoff: deeper planning has an unmistakable immediate price, while its downstream payoff remains unknown. The player commits, watches the plan create reusable cache state, predicts the closed pipeline, and then sees ticket-specific repair requests grow causally from the choice. The shallow failure freezes on a visibly expensive repair chain and rewinds directly to the decision.

Only after a completed attempt does the comparison reveal the second surprise: exhaustive planning avoids all repair but still loses to working depth because its premium is larger than the repair it avoids. The final no-review prototype prevents “working” from becoming another hidden universal answer and gates completion on a post-evidence transfer choice. The rhythm remains tactile and discovery-led: choose, cache, predict, reveal, trace, retry, compare, then transfer.

Authoring tradeoff: the exhaustive plan uses an intentionally large `80,000`-token output **[FICTION]** so its real Sonnet output charge is large enough to break deep-plan dominance; the screen explicitly limits that calibration to this ticket and teaches a marginal-cost rule rather than “shorter” or “longer” as a universal policy.
