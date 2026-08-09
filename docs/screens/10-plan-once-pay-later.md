# Level 10 — Plan Once, Pay Later

## 1. Identity

- **id:** `10-plan-once-pay-later`
- **title:** Plan Once, Pay Later
- **tier:** 2
- **ONE concept:** Planning depth changes the amount of downstream review and CI rework.
- **Prerequisites:** model/workload cost decomposition; pipeline causality.
- **Objective copy:** “Ship the change. Choose how much planning time to buy before the pipeline starts.”
- **Introduced control:** `CHOOSE_PLAN_DEPTH`.
- All plan-quality effects and downstream branch counts are calibrated **[FICTION]**. Token prices remain exact under `PRICE_REQUEST`.

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `Request`
- `PricedRequest`
- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `TapeRenderer`
- `PredictionPromptWidget`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PRICE_REQUEST`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`
- `JUST_IN_TIME_TOAST`

## 3. Cold-open / narrative

The screen initially shows one ticket and a closed pipeline. No future branch counts, reference totals, failure labels, or comparative hints appear.

Ticket copy:

> **Checkout change**  
> Add regional tax handling without breaking refunds.  
> **PLAN → BUILD ×3 → REVIEW → CI**

First interaction timing:

- **0.0s:** Ticket drops onto the desk. Wallet reads **$5.00**.
- **0.7s:** Three face-down plan cards fan out: **Quick sketch**, **Working plan**, **Deep plan**.
- **1.2s:** Caption appears: “How much planning do you buy before anyone touches the code?”
- **1.8s:** Cards become clickable.
- **On hover:** Show only plan token volume and its own projected cost:
  - Quick sketch — `6,000 input + 2,000 output` — **$0.080**
  - Working plan — `6,000 input + 8,000 output` — **$0.230**
  - Deep plan — `6,000 input + 14,000 output` — **$0.380**
- **Never pre-play:** downstream unit counts, total estimates, “best” badge, quality score, or branch preview.
- **On selection:** button copy becomes **Lock plan and run**.

## 4. Exact event sequence

All downstream branch counts below are deterministic calibrated **[FICTION]** attached to the selected plan depth.

1. **Enter level**  
   Event: route opens level → `ENTER_LEVEL { levelId: "10-plan-once-pay-later" }` → initializes `ReducerState`, `Wallet`, `Budget`, `Clock`, empty ledger/tape, attempt `1`, and `Checkpoint` `cp-plan-choice` → wallet **$5.000**, clock **0m**.

2. **Create decision boundary**  
   Event: cards settle → `CREATE_CHECKPOINT { checkpointId: "cp-plan-choice", reason: "decision" }` → mutates `checkpoints` only → no cost.

3. **Choose hidden branch**  
   Event: player selects a card → `CHOOSE_PLAN_DEPTH { depth }` → mutates selected scenario branch only → no request and no cost.

4. **Run planning request**  
   Event: player clicks **Lock plan and run** → `RUN_UNIT { unitId: "plan" }` → appends one `LedgerRow`, deducts `Wallet`, advances pipeline:
   - `shallow`: Opus, `6,000 input / 2,000 output`, **$0.080**
   - `balanced`: Opus, `6,000 input / 8,000 output`, **$0.230**
   - `deep`: Opus, `6,000 input / 14,000 output`, **$0.380**

5. **Run fixed build spine**  
   Event: pipeline advances through three builds → three ordered actions:
   - `RUN_UNIT { unitId: "build-tax-core" }`
   - `RUN_UNIT { unitId: "build-refund-path" }`
   - `RUN_UNIT { unitId: "build-region-tests" }`  
   Each mutates ledger, tape, wallet, counts, `lastRequests`, and unit status with one Sonnet request of `6,000 input / 44,000 output`, **$0.678** each (`WORK_IN`, `WORK_OUT`, `C28`); fixed build subtotal **$2.034**.

6. **Commit prediction before branches turn over**  
   Event: pipeline reaches face-down **REVIEW** and **CI** nodes → `OPEN_PREDICTION { promptId: "p-branch-count" }` → phase becomes `predict`; reveal is blocked.  
   Player choice → `SELECT_PREDICTION` → `COMMIT_PREDICTION`.

7. **Reveal branch count**  
   Event: cards turn over → `REVEAL_PREDICTION { promptId: "p-branch-count", correctOptionId }` → records correctness and reveals only the selected branch:
   - `shallow`: **2 review repairs + 2 CI repairs**
   - `balanced`: **1 review repair**
   - `deep`: **0 repairs**  
   Each count is visibly labeled **“calibrated FICTION for this teaching scenario.”**

8. **Run each causal repair**  
   Event: revealed repair node enters the runner → one `RUN_UNIT` per node → each adds exactly one Sonnet `LedgerRow` of `6,000 input / 44,000 output`, **$0.678** (`C28`):
   - `shallow`:
     1. `review-tax-boundary` — cause label: **Quick sketch omitted tax ownership**
     2. `review-refund-contract` — cause label: **Quick sketch omitted refund contract**
     3. `ci-rounding-fixture` — cause label: **Review repair changed rounding behavior**
     4. `ci-refund-regression` — cause label: **Review repair changed refund behavior**
   - `balanced`:
     1. `review-rounding-clarification` — cause label: **Working plan left one rounding rule unresolved**
   - `deep`: none.

9. **Decisive fail-freeze on shallow path**  
   Event: `ci-refund-regression` posts its ledger row → `FREEZE_FAILURE` with `failureId: "shallow-rework-chain"`, `causeCode: "PLAN_DEPTH_REWORK"`, checkpoint `cp-plan-choice` → freezes `Clock`, wallet, economic actions, and tape on the fourth repair at **$4.826 total**. The selected plan row and all four descendant repairs remain connected by a highlighted causal line.

10. **Second attempt on evidence**  
    Event: player clicks **Try another plan** → `REWIND_TO_CHECKPOINT { checkpointId: "cp-plan-choice" }` → deterministic replay to the choice boundary, retains attempt count/history evidence, clears frozen state and attempt-local ledger rows. The previously chosen card shows its observed total; untried cards still reveal only their plan-line cost.

11. **Complete a non-shallow run**  
    Event: balanced or deep branch finishes → `COMPLETE_ATTEMPT` → evaluates behavioral gate and stars, then unlocks result comparison.

12. **Post-attempt counterfactual**  
    Event: player clicks **Compare all three** → `REQUEST_COUNTERFACTUAL { comparisonId: "plan-depth-bill" }`, then `REVEAL_COUNTERFACTUAL` → displays all three totals using the same seed and fixed build spine:
    - Quick sketch: **$4.826**
    - Working plan: **$2.942**
    - Deep plan: **$2.414**

## 5. Level data

```ts
{
  id: "10-plan-once-pay-later",
  tier: 2,
  title: "Plan Once, Pay Later",
  objective: "Ship the change. Choose how much planning time to buy before the pipeline starts.",
  concept: {
    id: "planning-depth-rework",
    label: "Planning depth changes downstream rework"
  },
  prerequisiteConceptIds: [
    "workload-cost-decomposition",
    "pipeline-causality"
  ],

  unlocks: "planDepth",
  introducedControls: ["planDepth"],
  cfgLocked: [
    "orchestratorModel",
    "devModel",
    "who",
    "prompts",
    "width",
    "oneHourFlag",
    "keepWarm",
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
    planModel: "opus",
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },
  scenario: "default",
  scenarioData: {
    ticketId: "checkout-regional-tax",
    planDepthBranches: {
      shallow: {
        planInputTok: 6000,
        planOutputTok: 2000,
        repairUnitIds: [
          "review-tax-boundary",
          "review-refund-contract",
          "ci-rounding-fixture",
          "ci-refund-regression"
        ]
      },
      balanced: {
        planInputTok: 6000,
        planOutputTok: 8000,
        repairUnitIds: ["review-rounding-clarification"]
      },
      deep: {
        planInputTok: 6000,
        planOutputTok: 14000,
        repairUnitIds: []
      }
    },
    calibratedFiction: true
  },

  gate: {
    behavioralRequirements: [
      "commit p-branch-count before branch reveal",
      "complete a balanced or deep attempt",
      "inspect the causal trace from plan choice to every repair unit"
    ]
  },
  star2: {
    label: "Evidence-based retry",
    predicate: "attempt >= 2 && completedDepth !== 'shallow'",
    reason: "Used observed pipeline evidence to revise the plan choice."
  },
  star3: {
    label: "Plan once",
    predicate: "completedDepth === 'deep' && repairUnitCount === 0",
    reason: "Completed the fixed build spine with no downstream repair units."
  },

  referenceCfg: { planModel: "opus", devModel: "sonnet" },
  antiCfg: { planModel: "opus", devModel: "sonnet" }
}
```

`referenceCfg` selects the `deep` scenario branch; `antiCfg` selects `shallow`. Branch selection remains `scenarioData`, because `Config` carries model choice while `CHOOSE_PLAN_DEPTH` carries planning depth.

## 6. Pricing walkthrough

All requests bypass reusable prefix economics for this closed pipeline fixture: `readTok = 0`, `writeTok = 0`; the listed `inputTok` and `outTok` are priced by `PRICE_REQUEST`. Plan and repair incidence is **[FICTION]**. The three base build requests use calibrated `WORK_IN = 6,000` and `WORK_OUT = 44,000` (`C28`).

Rates:

- Opus input **$5/M**, output **$25/M** (`C2`; output multiplier `5x`, `C1`).
- Sonnet input **$3/M**, output **$15/M** (`C3`; output multiplier `5x`, `C1`).

| Request kind | Model | Input | Output | Calculation | Cost |
|---|---:|---:|---:|---|---:|
| Quick plan | Opus | 6,000 | 2,000 | `6000×5/1M + 2000×25/1M` | $0.080 |
| Working plan | Opus | 6,000 | 8,000 | `6000×5/1M + 8000×25/1M` | $0.230 |
| Deep plan | Opus | 6,000 | 14,000 | `6000×5/1M + 14000×25/1M` | $0.380 |
| Build/repair unit | Sonnet | 6,000 | 44,000 | `6000×3/1M + 44000×15/1M` | $0.678 |

Totals:

| Branch | Plan | Fixed builds | Repairs | Total |
|---|---:|---:|---:|---:|
| `shallow` anti-pattern | $0.080 | `3×$0.678 = $2.034` | `4×$0.678 = $2.712` | **$4.826** |
| `balanced` | $0.230 | $2.034 | `1×$0.678 = $0.678` | **$2.942** |
| `deep` 3-star reference | $0.380 | $2.034 | $0.000 | **$2.414** |

Post-attempt result copy:

> You saved **$0.300** on the visible plan line, then bought **$2.712** of repairs.  
> Branch counts are calibrated **FICTION**; token prices use the real rate table.

The `$0.300` comparison is `deep plan $0.380 − shallow plan $0.080`. The shallow total exceeds the deep reference by **$2.412**.

## 7. Tape sequence

`TapeRenderer` uses `rowSource: "ledger"` and renders exactly one row per request.

Common ordered rows:

1. `plan`
2. `build-tax-core`
3. `build-refund-path`
4. `build-region-tests`

Branch suffixes:

- `shallow`:
  5. `review-tax-boundary`
  6. `review-refund-contract`
  7. `ci-rounding-fixture`
  8. `ci-refund-regression`
- `balanced`:
  5. `review-rounding-clarification`
- `deep`: no suffix.

Every row renders its input and output `WireSegment`s. Review and CI rows use distinct row labels but identical authoritative pricing.

The aha frame is `ci-refund-regression` on the shallow path. Freeze with:

- the tiny **$0.080 PLAN** row pinned at the top;
- four repair rows stacked below;
- one continuous causal connector labeled **“spawned by omissions in this plan — calibrated FICTION”**;
- wallet settled at **$0.174**;
- subtotal badges **PLAN $0.080** and **DOWNSTREAM $4.746**.

No alternate branch or answer is visible before this frame.

## 8. Prediction prompts

### `p-branch-count`

Shown after the fixed third build and before review/CI nodes turn over.

> **The build is done. What happens when review and CI inspect this plan?**

Options depend on the committed depth but do not expose correctness:

- `no-repairs` — “It passes straight through.”
- `one-repair` — “One repair branch opens.”
- `several-repairs` — “Several repair branches open.”

Correct option:

- shallow → `several-repairs`
- balanced → `one-repair`
- deep → `no-repairs`

Button copy: **Lock prediction**.

### `p-largest-bill`

Shown before post-attempt comparison is revealed.

> **Across the same ticket, which choice do you think produced the largest total bill?**

- `shallow-total` — “Quick sketch”
- `balanced-total` — “Working plan”
- `deep-total` — “Deep plan”

Correct option: `shallow-total`.

`REVEAL_COUNTERFACTUAL` remains blocked until this prediction is committed.

## 9. Fail-state

Decisive event: completion of `ci-refund-regression` on the shallow branch.

Freeze message:

> **The $0.08 plan spawned four $0.678 repairs.** Every branch shown here traces to an omitted plan decision — calibrated **FICTION**.

Supporting copy:

> The pricing is real. The simulated relationship between plan depth and repair count is not a universal quality guarantee.

Rewind behavior:

- **Try another plan** dispatches `REWIND_TO_CHECKPOINT("cp-plan-choice")`.
- It skips the cold-open and returns directly to the three plan cards.
- The shallow card retains an evidence chip: **Observed: 4 repairs · $4.826 total**.
- Untested cards retain hidden downstream outcomes.
- Attempt count increments; prior evidence remains available in a collapsed **Previous run** drawer.
- No economic action is possible while frozen.

## 10. Gate & stars

Pass requires all of:

- at least one committed `p-branch-count` prediction before its reveal;
- completion using `balanced` or `deep`;
- opening the causal trace and inspecting every repair node produced by the completed or prior shallow attempt.

Budget alone cannot pass the level.

Stars:

- **1 star — Pipeline reader:** satisfy the behavioral gate.
- **2 stars — Evidence-based retry:** finish on `balanced` or `deep` after observing a previous attempt.
- **3 stars — Plan once:** choose `deep`, complete all three fixed builds, and produce **0** repair units; exact total **$2.414**.

The deep branch is always winnable from the initial **$5.00** wallet. The shallow branch deliberately remains above zero at **$0.174**, ensuring failure is causal rather than an arbitrary bankrupt screen.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| Plan row lands | “Plan locked. The rest of the pipeline can now react to it.” |
| First fixed build lands | “BUILD · 6,000 input + 44,000 output · $0.678” |
| Prediction opens | “Review and CI are still face-down. Predict before they turn over.” |
| First repair appears | “This is a new priced request, not a warning icon.” |
| Hover a repair connector | “Cause: **{causeLabel}** · calibrated FICTION.” |
| Shallow freeze | “$0.300 saved on planning; $2.712 added in repairs.” |
| Rewind completes | “Evidence kept. Future branches hidden again.” |
| Deep run clears CI | “No repair request was created.” |
| Counterfactual reveals | “Smallest plan line. Largest total bill.” |
| Fiction label first becomes relevant | “Repair counts are teaching calibration, not a claim that longer plans always win.” |

## 12. QA gate

Real-browser click-through assertions:

1. Initial screen exposes plan-line costs but no branch count, repair label, total, preferred choice, or reference comparison.
2. Clicking a plan card dispatches exactly one `CHOOSE_PLAN_DEPTH`; it creates no `LedgerRow`.
3. **Lock plan and run** produces exactly one plan row followed by exactly three fixed build rows.
4. Review/CI cards cannot reveal before `COMMIT_PREDICTION("p-branch-count")`.
5. Deterministic branch row counts are:
   - shallow: `8` total ledger/tape rows;
   - balanced: `5`;
   - deep: `4`.
6. `TapeRenderer` row count equals priced-request count at every animation frame.
7. Every ledger row has `usd > 0`; no positive amount renders as `$0.0000`.
8. Exact totals, using unrounded state:
   - shallow `4.826`;
   - balanced `2.942`;
   - deep `2.414`.
9. Each repair node has one visible parent cause; no repair cost is aggregated without its own request and `LedgerRow`.
10. The words **calibrated FICTION** appear beside downstream branch causality, in the fail-freeze, and in the comparison.
11. On shallow failure, economic actions are blocked until rewind.
12. Rewind returns to `cp-plan-choice`, preserves prior evidence and attempt count, and hides untried outcomes.
13. A first-attempt deep run passes and is winnable from `$5.00`.
14. A shallow-only run cannot pass even though its wallet remains positive.
15. Star predicates award:
    - deep first attempt: 1 star unless the evidence-based transfer requirements are completed;
    - balanced/deep after an observed retry: at least 2 stars;
    - deep with zero repairs and all gate evidence: 3 stars.
16. Counterfactual totals remain inaccessible until an attempt completes and `p-largest-bill` is committed.
17. Refresh/replay with seed `1010` produces byte-identical action history, ledger order, totals, and branch labels.

## 13. Reference-bar justification

The screen begins with one tactile, consequential choice and withholds the system response. The player first optimizes the only visible number, commits a prediction, and then watches the pipeline physically grow from that choice. Failure freezes on the exact final repair rather than on a detached result modal; rewind returns directly to the decision with evidence preserved and future outcomes concealed. Only after play does the counterfactual expose all totals. That rhythm—choice, commitment, surprising causal motion, local failure, immediate retry, then concise confirmation—meets the discovery standard without stating the lesson in advance.
