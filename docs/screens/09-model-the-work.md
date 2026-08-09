# Level 9 — Model the Work

## 1. Identity

- **id:** `model-the-work`
- **title:** Model the Work
- **tier:** 2
- **ONE concept:** Total model cost depends on workload mix; output-heavy work amplifies the selected model’s price.
- **Prerequisite concept:** Cost decomposition into `readTok`, `inputTok`, `writeTok`, and `outTok`.
- **Objective copy:** “Three jobs share the same context. Estimate what each job spends most heavily, then assign its model.”
- **New control:** Per-job dominant-bucket estimate, followed by model selection.
- **Protected discovery:** No pre-play copy identifies code generation as the costly job or names output’s `5x` rate.

## 2. Objects used

- `LevelDef`
- `Request`
- `PricedRequest`
- `PrefixStack`
- `PrefixBlock`
- `MAIN_SESSION_CONTEXT`
- `CacheEntry`
- `CACHE_TIER_1H`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `PRICE_REQUEST`
- `RATE_CACHE_READ`
- `RATE_INPUT`
- `RATE_OUTPUT`
- `TapeRenderer`
- `UI_PREDICTION_PROMPT`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

**0:00–0:02.** Three face-down job cards land beside a `$3.00` `Wallet`. Header: **“Same repository. Three different jobs.”**

**0:02–0:05.** Cards turn over without revealing token counts:

1. **Search:** “Find every permission check and return the file paths.”
2. **Codegen:** “Implement the validated permission layer.”
3. **Short review:** “Review this six-line guard change.”

Each card shows two controls in sequence: **“What dominates?”** and, only after that estimate is committed, **“Choose model.”**

**0:05 onward.** The Search card pulses. Copy above it: **“Estimate first. The tape stays sealed until you commit.”** No price table, output multiplier, correct estimate, or reference configuration appears before play.

## 4. Exact event sequence

1. **Enter level**  
   Event: route opens Level 9.  
   Action: `ENTER_LEVEL { levelId: "model-the-work" }`.  
   Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, scenario units, empty ledger and tape.  
   Numbers: seed `904409`; `Wallet.initialUsd = Wallet.remainingUsd = $3.00`; `Clock.min = 0`.

2. **Create decision checkpoint**  
   Event: first job card becomes active.  
   Action: `CREATE_CHECKPOINT { checkpointId: "l9-before-estimates", reason: "decision" }`.  
   Mutates: `Checkpoint[]` only.  
   Numbers: no tokens and no cost.

3. **Estimate Search**  
   Event: player opens Search’s estimate.  
   Actions: `OPEN_PREDICTION { promptId: "l9-search-bucket" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION`.  
   Mutates: prediction state only.  
   Options: **“Context coming in”**, **“Answer coming out.”**  
   Correct option remains hidden.

4. **Choose Search model**  
   Event: committed estimate unlocks the model chips.  
   Action: `CHOOSE_MODEL { workloadId: "search", role: "dev", model }`.  
   Mutates: Search workload configuration only.  
   Numbers: available models use `C2–C4`; no request or cost yet.

5. **Estimate Codegen and choose its model**  
   Event: player advances to Codegen.  
   Actions: `OPEN_PREDICTION { promptId: "l9-codegen-bucket" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION` → `CHOOSE_MODEL { workloadId: "codegen", role: "dev", model }`.  
   Mutates: prediction state and Codegen workload configuration.  
   Numbers: no request or cost yet.

6. **Estimate Short review and choose its model**  
   Event: player advances to Short review.  
   Actions: `OPEN_PREDICTION { promptId: "l9-review-bucket" }` → `SELECT_PREDICTION` → `COMMIT_PREDICTION` → `CHOOSE_MODEL { workloadId: "short-review", role: "dev", model }`.  
   Mutates: prediction state and Short-review workload configuration.  
   Numbers: no request or cost yet.

7. **Run Search**  
   Event: player presses **“Run the work”**; Search is the first atomic unit.  
   Action: `RUN_UNIT { unitId: "search" }`.  
   Mutates: `CacheEntry` touch time, `LedgerRow[]`, `lastRequests`, `Wallet`, Search unit status, tape payload.  
   Numbers: `26,237 readTok` (`C10`), `6,000 inputTok` (`C28`), `0 writeTok`, `2,000 outTok` `[ESTIMATE]`, at minute `1`. With Sonnet: `$0.0078711 + $0.018 + $0.030 = $0.0558711` (`C1`, `C3`, `C10`, `C28`).

8. **Reveal Search estimate**  
   Event: its complete tape row locks into place.  
   Action: `REVEAL_PREDICTION { promptId: "l9-search-bucket", correctOptionId: "input-side" }`.  
   Mutates: prediction reveal state only.  
   Evidence: input-side total is `32,237` tokens versus `2,000 outTok`; for Sonnet, input-side costs `$0.0258711` and output costs `$0.030`. The token-count estimate is input-side; hover immediately shows that dollar dominance is already close because output is priced at `5x` (`C1`).

9. **Run Codegen**  
   Event: player confirms **“Next job.”**  
   Action: `RUN_UNIT { unitId: "codegen" }`.  
   Mutates: same object classes as step 7, now for Codegen.  
   Numbers: `26,237 readTok` (`C10`), `6,000 inputTok`, `0 writeTok`, `44,000 outTok` (`C28`), at minute `2`. With Sonnet: `$0.0078711 + $0.018 + $0.660 = $0.6858711` (`C1`, `C3`, `C10`, `C28`).

10. **Reveal Codegen estimate and aha frame**  
    Event: the violet output segment expands after the row’s input side is visible.  
    Action: `REVEAL_PREDICTION { promptId: "l9-codegen-bucket", correctOptionId: "output" }`.  
    Mutates: prediction reveal state only.  
    Numbers: output is `44,000 / 76,237 = 57.71%` of tokens but `$0.660 / $0.6858711 = 96.23%` of Sonnet cost. Copy: **“Same context. Same model. This job spent 11.6× more because the answer was long.”** The ratio compares `$0.6858711 / $0.0558711`.

11. **Run Short review**  
    Event: player confirms **“Last job.”**  
    Action: `RUN_UNIT { unitId: "short-review" }`.  
    Mutates: same object classes as step 7, now for Short review.  
    Numbers: `26,237 readTok` (`C10`), `6,000 inputTok`, `0 writeTok`, `500 outTok` `[ESTIMATE]`, at minute `3`. With Sonnet: `$0.0078711 + $0.018 + $0.0075 = $0.0333711` (`C1`, `C3`, `C10`, `C28`).

12. **Reveal Short-review estimate**  
    Event: final row settles.  
    Action: `REVEAL_PREDICTION { promptId: "l9-review-bucket", correctOptionId: "input-side" }`.  
    Mutates: prediction reveal state only.  
    Evidence: input-side is `32,237` tokens and `$0.0258711`; output is `500` tokens and `$0.0075` on Sonnet.

13. **Evaluate understanding**  
    Event: all three rows and prediction reveals are visible.  
    Action: `COMPLETE_ATTEMPT`.  
    Mutates: gate result, stars, result summary.  
    Numbers: three-job Sonnet reference total is `$0.7751133`.

14. **Local failure, when applicable**  
    Event: `COMPLETE_ATTEMPT` finds fewer than two correct dominant-bucket estimates.  
    Action: `FREEZE_FAILURE { failure: { id: "l9-bucket-miss", checkpointId: "l9-before-estimates", message: bucketSpecificMessage } }`.  
    Mutates: `Clock.frozen`, frozen failure state; ledger and tape remain visible.  
    Numbers: freeze highlights the largest cost bucket of the first missed job.

15. **Rewind**  
    Event: player presses **“Re-estimate jobs.”**  
    Action: `REWIND_TO_CHECKPOINT { checkpointId: "l9-before-estimates" }`.  
    Mutates: deterministic action branch, attempt-retained state, prediction selections, workload model choices, ledger, tape, `Wallet`, and frozen state.  
    Numbers: returns to `$3.00`, minute `0`, with no priced rows.

16. **Post-attempt comparison**  
    Event: after any completed attempt, player presses **“Compare model prices.”**  
    Actions: `REQUEST_COUNTERFACTUAL { comparisonId: "l9-model-spread" }` → `REVEAL_COUNTERFACTUAL { comparisonId: "l9-model-spread" }`.  
    Mutates: comparison visibility only.  
    Numbers: reference and anti-pattern totals become visible only now.

## 5. Level data

```ts
const level09: LevelDef = {
  id: "model-the-work",
  tier: 2,
  title: "Model the Work",
  objective:
    "Three jobs share the same context. Estimate what each job spends most heavily, then assign its model.",
  concept: {
    id: "workload-mix-cost",
    statement:
      "Total model cost depends on workload mix; output-heavy work amplifies model price."
  },
  prerequisiteConceptIds: ["cost-decomposition"],

  unlocks: "model-picker",
  introducedControls: ["dominant-bucket-estimate", "per-workload-model-picker"],
  cfgLocked: [
    "who", "prompts", "width", "oneHourFlag", "keepWarm",
    "keepWarmMin", "hook", "skills", "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 904409,
  budgetUsd: 3.00,
  clockCapMin: 3,
  cfgOverride: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "identical",
    oneHourFlag: true
  },
  scenario: "spawn12",
  scenarioData: {
    workloadIds: ["search", "codegen", "short-review"],
    sharedReadTok: 26237,
    freshInputTok: 6000,
    outputTokByWorkload: {
      search: 2000,
      codegen: 44000,
      "short-review": 500
    },
    outputTokenLabels: {
      search: "[ESTIMATE]",
      codegen: "C28",
      "short-review": "[ESTIMATE]"
    }
  },

  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "counterfactual-after-attempt"
  ],

  gate: {
    id: "l9-identify-mix",
    description:
      "Commit all three estimates before execution and correctly identify at least two dominant token buckets, including Codegen as output."
  },
  star2: {
    id: "l9-all-buckets",
    description: "Correctly estimate all three dominant token buckets."
  },
  star3: {
    id: "l9-reference-cost",
    description:
      "Meet the two-star predicate and finish at or below $0.80 without rewinding."
  },

  referenceCfg: {
    devModel: "sonnet"
  },
  antiCfg: {
    devModel: "fable"
  }
};
```

`pass(st)` requires committed pre-run predictions for all three jobs, at least two correct estimates, and `l9-codegen-bucket === "output"`. Budget alone never passes the level.

## 6. Pricing walkthrough

All requests use a live identical `26,237`-token prefix (`C10`), `6,000` fresh input tokens (`C28`), no write, and the selected model. `PRICE_REQUEST` applies read `0.1x`, input `1x`, and output `5x` (`C1`).

| Request | Model | readTok | inputTok | writeTok | outTok | Read $ | Input $ | Output $ | Total $ |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `l9-search-sonnet` | Sonnet | 26,237 | 6,000 | 0 | 2,000 `[ESTIMATE]` | 0.0078711 | 0.018 | 0.030 | **0.0558711** |
| `l9-codegen-sonnet` | Sonnet | 26,237 | 6,000 | 0 | 44,000 (`C28`) | 0.0078711 | 0.018 | 0.660 | **0.6858711** |
| `l9-review-sonnet` | Sonnet | 26,237 | 6,000 | 0 | 500 `[ESTIMATE]` | 0.0078711 | 0.018 | 0.0075 | **0.0333711** |

**Three-star reference total:** `$0.7751133`, displayed as **`$0.78`**, using Sonnet’s `$0.30/M` read, `$3/M` input, and `$15/M` output prices (`C3`).

The post-attempt counterfactual keeps token counts identical:

| Configuration | Search | Codegen | Short review | Total |
|---|---:|---:|---:|---:|
| Sonnet reference (`C3`) | $0.0558711 | $0.6858711 | $0.0333711 | **$0.7751133** |
| Opus (`C2`) | $0.0931185 | $1.1431185 | $0.0556185 | **$1.2918555** |
| Fable anti-pattern (`C4`) | $0.186237 | $2.286237 | $0.111237 | **$2.583711** |

**Anti-pattern total:** `$2.583711`, displayed as **`$2.58`**. Of the `$1.8085977` gap from the reference, `$1.54` comes from Codegen output alone. Copy: **“The model multiplier did not hurt every job equally. The long answer carried most of the difference.”**

Model choice is not graded as a universal rule. The behavioral gate grades workload estimation; the cost star rewards the measured configuration for this scenario only.

## 7. Tape sequence

`TapeRenderer` renders exactly three request rows in ledger order:

1. `l9-search`
   - `read` — `26,237`, `0.1x`
   - `input` — `6,000`, `1x`
   - `output` — `2,000`, `5x`

2. `l9-codegen`
   - `read` — `26,237`, `0.1x`
   - `input` — `6,000`, `1x`
   - `output` — `44,000`, `5x`

3. `l9-short-review`
   - `read` — `26,237`, `0.1x`
   - `input` — `6,000`, `1x`
   - `output` — `500`, `5x`

Zero-token `write` segments are omitted.

**Aha frame:** On Codegen, the read and input segments arrive first; the output segment stays masked until its prediction is committed, then grows to its final width and price. Search remains pinned immediately above it so the player sees equal input-side bars but radically different totals. Hover labels show tokens, rate, and dollars; the UI does not calculate authoritative cost.

## 8. Prediction prompts

### `l9-search-bucket`

**Question:** “Before Search runs: which side will contain more tokens?”

- `input-side` — “Context coming in”
- `output` — “Answer coming out”

Post-reveal sentence: **“Search read 32,237 input-side tokens and returned 2,000.”**

### `l9-codegen-bucket`

**Question:** “Before Codegen runs: which side will contain more tokens?”

- `input-side` — “Context coming in”
- `output` — “Answer coming out”

Post-reveal sentence: **“Codegen returned 44,000 tokens; at the `5x` output rate, that became 96% of this request’s Sonnet cost.”** (`C1`, `C3`, `C28`)

### `l9-review-bucket`

**Question:** “Before Short review runs: which side will contain more tokens?”

- `input-side` — “Context coming in”
- `output` — “Answer coming out”

Post-reveal sentence: **“Short review read 32,237 input-side tokens and returned 500.”**

Every model picker and reveal is disabled until its job’s estimate is committed.

## 9. Fail-state

**Decisive event:** `COMPLETE_ATTEMPT` detects fewer than two correct estimates or a non-output estimate for Codegen.

The first missed workload freezes with its dominant tape bucket outlined; all unrelated rows dim to 35% `[ESTIMATE]`.

Bucket-specific causal copy:

- Search miss: **“Search’s miss came from the input side: 32,237 tokens arrived, 2,000 came back.”**
- Codegen miss: **“Codegen’s miss came from output: 44,000 generated tokens produced 96% of this request’s Sonnet cost.”**
- Short-review miss: **“Short review’s miss came from the input side: 32,237 tokens arrived, only 500 came back.”**

No failure message says a model always wins. Footer: **“Estimate the workload, not the logo.”**

`UI_REWIND_CONTROL` label: **“Re-estimate jobs.”** It dispatches `REWIND_TO_CHECKPOINT` to `l9-before-estimates`, preserving the mastered cold-open while clearing the three estimates, model choices, requests, and spend.

## 10. Gate & stars

- **Pass:** All three estimates were committed before their reveals; at least two are correct; Codegen was identified as output-dominant.
- **2 stars:** Pass plus all three dominant token buckets are correct.
- **3 stars:** Two-star predicate, no rewind, and total spend `<= $0.80`.
- Spending below `$0.80` without the behavioral predicate fails.
- An incorrect prediction never deducts score by itself; failure follows only from the final demonstrated-understanding predicate.
- Any model assignment is allowed. Model selection affects cost and evidence, not the conceptual correctness of the estimate.

Result copy:

- Pass headline: **“You priced the work, not just the model.”**
- Fail headline: **“One bucket escaped the estimate.”**
- Evidence line: **“Same cached context; output volume moved the bill.”**
- Continue: **“Continue”**
- Retry: **“Re-estimate jobs”**

## 11. Toasts

| Toast id | Trigger | Exact copy |
|---|---|---|
| `l9-estimate-first` | First `OPEN_PREDICTION` | **“Estimate first. Prices stay sealed until you commit.”** |
| `l9-output-jit` | Codegen output segment is revealed | **“Generated tokens are output. Each is priced at `5x` the model’s base input rate.”** (`C1`) |
| `l9-same-context` | Codegen row settles beside Search | **“Same 32,237 input-side tokens. A much longer answer changed the result.”** |
| `l9-review-contrast` | Short-review row settles | **“Short answer, small output bill—even with the same context.”** |
| `l9-counterfactual` | `REVEAL_COUNTERFACTUAL` | **“A model multiplier bites hardest where the dominant bucket is largest.”** |

Only `l9-output-jit` introduces **output** as priced vocabulary, and it fires after the first committed output prediction.

## 12. QA gate

Real-browser click-through must assert:

1. The opening screen contains no token counts, rate multipliers, correct options, reference total, or anti-pattern total.
2. Each workload’s model picker remains disabled until its estimate is committed.
3. `RUN_UNIT` remains disabled until all three estimates and model choices are committed.
4. Each `RUN_UNIT` produces exactly one `LedgerRow` and one tape row.
5. Exactly three priced requests and three tape rows exist after completion.
6. Each visible nonzero `WireSegment` equals its request’s authoritative priced bucket.
7. Every request cost is greater than zero; no positive value renders as `$0.0000`.
8. Sonnet reference request totals equal `$0.0558711`, `$0.6858711`, and `$0.0333711`; total equals `$0.7751133`.
9. Fable anti-pattern total equals `$2.583711`.
10. Prediction reveals cannot dispatch before their matching `COMMIT_PREDICTION`.
11. The Codegen aha frame shows `44,000 outTok`, `$0.660` output cost, and `$0.6858711` total for Sonnet.
12. A failed attempt freezes on the first missed workload and highlights only its actual dominant bucket.
13. `REWIND_TO_CHECKPOINT` restores minute `0`, `$3.00`, an empty ledger, an empty tape, and enabled estimate controls.
14. Counterfactual controls are absent before a completed attempt.
15. The reference configuration is winnable and reaches three stars.
16. The anti-configuration remains completable but exceeds the three-star cost threshold; it does not falsely teach that model identity alone is failure.
17. Keyboard users can estimate, commit, choose a model, run, inspect each segment, reveal the counterfactual, and rewind.
18. Screen-reader announcements state workload, bucket, token count, rate, and dollars in ledger order.
19. Exact replay from seed `904409` and the same `Action[]` yields byte-identical ledger, wallet, predictions, stars, and result.

## 13. Reference-bar justification

The level puts three tactile cards under the cursor immediately, withholds all decisive quantities, and makes the player commit a bucket estimate before each reveal. Repetition establishes a visual baseline—identical context—then Codegen breaks it with one large output segment. The short review provides immediate transfer evidence that prevents the player from turning “output is expensive” into another universal rule. Failure freezes on the player’s actual missed bucket, while the post-attempt model spread turns the discovery into a concrete pricing comparison without leaking it beforehand.

**Assumption:** Search’s `2,000` and Short review’s `500` output tokens are calibrated `[ESTIMATE]` scenario values; Codegen’s `44,000`, fresh input `6,000`, and shared prefix `26,237` trace to `C28` and `C10`.
