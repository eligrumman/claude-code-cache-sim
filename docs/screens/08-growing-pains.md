# Level 8 — Growing Pains

## 1. Identity

- `id`: `L8`
- `title`: `Growing Pains`
- `tier`: `2`
- `objective`: “Six tickets just landed. Route each one before the session gets crowded.”
- One concept: inline work carries a growing main-session history; fresh subagents use an isolated bounded base.
- Prerequisites: prefix structure and subagent-cache behavior.
- `concept.id`: `context-routing`
- `concept.privateDesignerSummary`: “Inline requests reread growing history; subagents pay an isolated `26,237`-token base, with identical parallel spawns sharing its warm prefix.”
- `concept.postRevealRule`: “Keep small follow-ups inline; isolate parallel independent work once growing history costs more than the bounded spawn base.”
- `prerequisiteConceptIds`: `["prefix-structure", "subagent-cache"]`

## 2. Objects used

- `MAIN_SESSION_CONTEXT`
- `SUBAGENT_CONTEXT`
- `PREFIX_STACK`
- `PB_HISTORY`
- `PB_CURRENT`
- `Request`
- `CacheEntry`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Checkpoint`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_MAIN_CACHE_PANEL`
- `UI_TAPE_RENDERER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `ResultScreen`
- `CounterfactualOverlay`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_EXPLAIN_THEN_TRANSFER`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; `firstInteractiveBySec: 2` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Six ticket cards slap onto the desk. Copy: **“Release train leaves in ten minutes.”** |
| `0.6s` | The first card opens: **“Rename the helper you just added.”** The existing `PREFIX_STACK` is visible but its price is hidden. |
| `1.2s` | Two unlabeled route targets slide in: **“Keep here”** and **“Send out”**. |
| `2.0s` | Both targets accept pointer, touch, and keyboard placement. Copy: **“Where should this ticket run?”** |

No pre-play copy names the preferred route, bounded base, growing-history penalty, or final rule.

## 4. Exact event sequence

All requests use Sonnet (`C3`). Scenario timing keeps every relevant `CacheEntry` live; no expiry decision is introduced.

1. **Enter the level.**  
   Event → level mount.  
   Action → `ENTER_LEVEL { levelId: "L8" }`.  
   Mutations → initializes `ReducerState`, `Wallet($3.10)`, `MAIN_SESSION_CONTEXT`, empty subagent pool, six units, and the level-start `Checkpoint`. The visible main `PREFIX_STACK` begins with `34,000` carried tokens (`C29`).

2. **Predict ticket 1.**  
   Event → player selects a route for **“Rename the helper you just added”**.  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-route-1", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-route-1" }`; `SELECT_PREDICTION`; `COMMIT_PREDICTION`.  
   Mutations → `prediction` becomes committed; no request, price, or correctness is revealed.

3. **Run ticket 1.**  
   Event → player confirms **Keep here** or **Send out**.  
   Actions → `ROUTE_UNIT { unitId: "followup-rename", contextKind }`; `RUN_UNIT { unitId: "followup-rename" }`; `REVEAL_PREDICTION { promptId: "p-route-1", correctOptionId: "main" }`.  
   Reference mutation → `MAIN_SESSION_CONTEXT`, its `PREFIX_STACK`, `LedgerRow`, `Wallet`, and `lastRequests` change. Request `r-followup-rename-main`: `34,000 readTok` (`C29`), `2,000 inputTok` `[FICTION]`, `4,000 outTok` `[FICTION]`; cost `$0.0762`.  
   Post-reveal copy: **“That follow-up reused the conversation already holding its answer.”**

4. **Run ticket 2 as a transfer.**  
   Event → card: **“Update the assertion for that rename.”**  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-route-2", reason: "decision" }`; prediction actions for `p-route-2`; `ROUTE_UNIT`; `RUN_UNIT`; `REVEAL_PREDICTION { correctOptionId: "main" }`.  
   Reference request `r-followup-assert-main`: `56,000 readTok` (`34,000 + 22,000`, `C29`), `1,000 inputTok` `[FICTION]`, `2,000 outTok` `[FICTION]`; cost `$0.0498`.  
   Mutations → main `PREFIX_STACK` visibly lengthens; `LedgerRow`, `Wallet`, and `lastRequests` update.

5. **Expose the first independent job without its answer.**  
   Event → four cards fan out: **“Audit auth imports”**, **“Generate migration”**, **“Check API callers”**, **“Review dependency licenses.”** A bracket labels them **“No shared edits”**.  
   Actions → `CREATE_CHECKPOINT { checkpointId: "cp-parallel-route", reason: "decision" }`; `OPEN_PREDICTION { promptId: "p-parallel" }`.  
   Mutations → prediction phase opens; route controls remain neutral. The main stack shows `92,000` carried history `[FICTION]`, including `C29`-anchored growth and scenario traffic.

6. **Decisive inline failure.**  
   Event → player commits **Keep here** for **“Audit auth imports”**.  
   Actions → `COMMIT_PREDICTION`; `ROUTE_UNIT { unitId: "audit-imports", contextKind: "main" }`; `RUN_UNIT { unitId: "audit-imports" }`.  
   Mutations → request `r-audit-main` appends with `92,000 readTok` `[FICTION]`, `6,000 inputTok` and `44,000 outTok` (`C28`); `Wallet` drops by `$0.7056`; `UI_TAPE_RENDERER` stops on the `92,000`-token blue segment while `PB_CURRENT` highlights `6,000`.  
   Action → `FREEZE_FAILURE { failureId: "f-92k", causeCode: "INLINE_HISTORY_OVERREAD", message: "This task reread 92k history to use 6k relevant input.", checkpointId: "cp-parallel-route" }`.  
   Mutations → `clock.frozen=true`; route and run controls lock; `frozenFailure` is set.

7. **Rewind the local failure.**  
   Event → player activates **“Route the audit again”**.  
   Action → `REWIND_TO_CHECKPOINT { checkpointId: "cp-parallel-route" }`.  
   Mutations → deterministic replay restores the unopened parallel-route decision, `$2.9740` remaining after tickets 1–2, no `r-audit-main`, and the committed earlier follow-up evidence.

8. **Route the parallel batch.**  
   Event → player commits **Send out** and places the four independent cards on fresh subagents.  
   Actions → `COMMIT_PREDICTION { promptId: "p-parallel" }`; four `ROUTE_UNIT { contextKind: "subagent" }`; four `RUN_UNIT`; `REVEAL_PREDICTION { promptId: "p-parallel", correctOptionId: "subagent-batch" }`.  
   Mutations:
   - `r-audit-sub`: new `SUBAGENT_CONTEXT`; `26,237 writeTok` (`C10`) at `CACHE_TIER_5M`, `6,000 inputTok`, `44,000 outTok` (`C28`); `$0.77638875`.
   - `r-migration-sub`: fresh `SUBAGENT_CONTEXT` using the live identical `sharedPrefixPoolId`; `26,237 readTok` (`C10`), `18,000 inputTok` `[FICTION]`, `44,000 outTok` (`C28`); `$0.7218711`.
   - `r-callers-sub`: `26,237 readTok`, `6,000 inputTok`, `44,000 outTok`; `$0.6858711`.
   - `r-licenses-sub`: `26,237 readTok`, `6,000 inputTok`, `44,000 outTok`; `$0.6858711`.
   - Four isolated `PREFIX_STACK` records and four `LedgerRow`s append; the shared subagent `CacheEntry` is written once and touched three times. The main `PB_HISTORY` does not absorb these jobs.
   
   `ahaFrame: true` on `r-callers-sub`: four short equal blue bases align beneath the frozen ghost outline of the `92,000`-token inline row. Copy appears only now: **“Fresh rooms, one bounded base. The independent jobs did not drag the main conversation behind them.”**

9. **Explain, then transfer.**  
   Event → player answers `p-rule`, then receives two unseen cards: **“Change the error string you just reviewed”** and **“Scan an unrelated package tree.”**  
   Actions → `ACK_EXPLANATION { explanationId: "routing-rule" }`; `BEGIN_TRANSFER { challengeId: "route-transfer-pair" }`; two prediction cycles; two `ROUTE_UNIT` actions.  
   Required choices → error-string follow-up routes to `main`; package scan routes to `subagent`.  
   Mutations → transfer evidence is stored for the gate. Incorrect routing rewinds only to `cp-transfer`.

10. **Complete and compare.**  
    Event → both transfer choices are correct.  
    Actions → `COMPLETE_ATTEMPT`; then, on player request, `REQUEST_COUNTERFACTUAL { comparisonId: "all-inline" }`; `REVEAL_COUNTERFACTUAL { comparisonId: "all-inline" }`.  
    Mutations → `ResultScreen` evaluates gate/stars. Only after completion, `CounterfactualOverlay` reveals the all-inline tape and `$0.02799795` `[FICTION]` routing delta for the six-ticket fixture.

## 5. Level data

```ts
const level8: LevelDef = {
  id: "L8",
  tier: 2,
  title: "Growing Pains",
  objective: "Six tickets just landed. Route each one before the session gets crowded.",
  concept: {
    id: "context-routing",
    privateDesignerSummary:
      "Inline requests reread growing history; subagents use an isolated bounded base.",
    postRevealRule:
      "Keep small follow-ups inline; isolate parallel independent work once growing history costs more than the bounded spawn base."
  },
  prerequisiteConceptIds: ["prefix-structure", "subagent-cache"],

  unlocks: "route",
  introducedControls: ["route"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "prompts", "width",
    "oneHourFlag", "keepWarm", "hook", "skills", "skillsMode",
    "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 8292,
  budgetUsd: 3.10, // [FICTION]
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
    workloads: [
      { id: "followup-rename", inputTok: 2000, outputTok: 4000, relation: "follow-up" },
      { id: "followup-assert", inputTok: 1000, outputTok: 2000, relation: "follow-up" },
      { id: "audit-imports", inputTok: 6000, outputTok: 44000, relation: "independent" },
      { id: "migration", inputTok: 18000, outputTok: 44000, relation: "independent" },
      { id: "callers", inputTok: 6000, outputTok: 44000, relation: "independent" },
      { id: "licenses", inputTok: 6000, outputTok: 44000, relation: "independent" }
    ],
    allowedCfg: { who: ["inline", "subagent"] },
    estimates: [
      { label: "budgetUsd", value: 3.10, tag: "[FICTION]" },
      { label: "followup-rename input", value: 2000, tag: "[FICTION]" },
      { label: "followup-rename output", value: 4000, tag: "[FICTION]" },
      { label: "followup-assert input", value: 1000, tag: "[FICTION]" },
      { label: "followup-assert output", value: 2000, tag: "[FICTION]" },
      { label: "migration input", value: 18000, tag: "[FICTION]" },
      { label: "failure-frame main history", value: 92000, tag: "[FICTION]" },
      { label: "all-inline comparison delta", value: 0.02799795, tag: "[FICTION]" }
    ]
  },

  gate: {
    predicateId: "mixed-routing-transfer",
    behavioralRequirements: [
      "initial two dependent follow-ups routed to main",
      "four-card independent batch routed to subagent contexts"
    ],
    explanationRequirement:
      "p-rule == relationship-and-carried-context",
    transferRequirement:
      "transfer follow-up == main && transfer independent scan == subagent"
  },

  star2: {
    label: "Read the relationships",
    predicate:
      "gate passes and at least five of six fixture routes match reference",
    reason: "You separated dependent follow-ups from independent work."
  },
  star3: {
    label: "Clean split",
    predicate:
      "all six fixture routes match reference && transfer pair correct && spentUsd <= 2.99600205",
    reason: "Every follow-up stayed inline and every independent job stayed isolated."
  },

  referenceCfg: { who: "subagent", width: 4, prompts: "identical" },
  antiCfg: { who: "inline", width: 1, prompts: "identical" },

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_EXPLAIN_THEN_TRANSFER",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ]
};
```

`referenceCfg.who` is the batch default; the ordered reference route vector is
`[main, main, subagent, subagent, subagent, subagent]`. `antiCfg` expands to
`[main, main, main, main, main, main]`.

## 6. Pricing walkthrough

Sonnet rates are input `$3/M`, cache read `$0.30/M`, 5-minute write `$3.75/M`, and output `$15/M` (`C1`, `C3`). All totals use `PRICE_REQUEST` without intermediate rounding.

| Request | Route | Buckets | Exact cost |
|---|---|---|---:|
| `r-followup-rename-main` | main | `34,000 read` (`C29`) + `2,000 input` `[FICTION]` + `4,000 output` `[FICTION]` | `34,000×$0.30/M + 2,000×$3/M + 4,000×$15/M = $0.0762` |
| `r-followup-assert-main` | main | `56,000 read` (`C29`) + `1,000 input` `[FICTION]` + `2,000 output` `[FICTION]` | `$0.0168 + $0.0030 + $0.0300 = $0.0498` |
| `r-audit-sub` | subagent cold | `26,237 write` (`C10`) + `6,000 input` + `44,000 output` (`C28`) | `$0.09838875 + $0.018 + $0.66 = $0.77638875` |
| `r-migration-sub` | subagent warm | `26,237 read` (`C10`) + `18,000 input` `[FICTION]` + `44,000 output` (`C28`) | `$0.0078711 + $0.054 + $0.66 = $0.7218711` |
| `r-callers-sub` | subagent warm | `26,237 read` + `6,000 input` + `44,000 output` (`C10`, `C28`) | `$0.0078711 + $0.018 + $0.66 = $0.6858711` |
| `r-licenses-sub` | subagent warm | same as `r-callers-sub` | `$0.6858711` |

Three-star reference total:

```text
$0.0762 + $0.0498 + $0.77638875 + $0.7218711
+ $0.6858711 + $0.6858711
= $2.99600205
```

The anti-pattern’s independent inline requests carry `92,000`, `114,000`, `136,000`, and `158,000` history tokens `[FICTION]`:

```text
audit:      92,000×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.7056
migration: 114,000×$0.30/M +18,000×$3/M + 44,000×$15/M = $0.7482
callers:   136,000×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.7188
licenses:  158,000×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.7254
```

Anti-pattern total:

```text
$0.0762 + $0.0498 + $0.7056 + $0.7482 + $0.7188 + $0.7254
= $3.0240
```

Post-attempt delta: `$3.0240 − $2.99600205 = $0.02799795` `[FICTION]`. The comparison explicitly shows that the first cold subagent is expensive; the batch wins because later identical parallel spawns read the bounded `26,237`-token base (`C10`) while inline history continues growing (`C29`).

## 7. Tape sequence

`rowSource: "ledger"`; hover is enabled through `UI_HOVER_PRICE_CALCULATOR`.

Ordered segments:

1. `r-followup-rename-main`: `read 34,000` → `input 2,000` → `output 4,000`.
2. `r-followup-assert-main`: `read 56,000` → `input 1,000` → `output 2,000`.
3. Failure-only `r-audit-main`: `read 92,000` → `input 6,000` → `output 44,000`.
4. After rewind, `r-audit-sub`: `write 26,237` → `input 6,000` → `output 44,000`.
5. `r-migration-sub`: `read 26,237` → `input 18,000` → `output 44,000`.
6. `r-callers-sub`: `read 26,237` → `input 6,000` → `output 44,000`.
7. `r-licenses-sub`: `read 26,237` → `input 6,000` → `output 44,000`.

Reveal groups:

- `followups`: rows 1–2, each gated by its route prediction.
- `failure-marginal`: failure-only row 3, gated by `p-parallel`.
- `isolated-batch`: rows 4–7, revealed only after rewind and recommit.
- `counterfactual-all-inline`: hidden until `COMPLETE_ATTEMPT`.

`ahaRequestId: "r-callers-sub"`. At that frame, the three warm `26,237`-token reads align while a non-ledger ghost ruler marks the prior `92,000` history span. The ghost carries no price and cannot be mistaken for a request.

## 8. Prediction prompts

### `p-route-1`

**Question:** “Which route will cost less for this rename?”

- `main`: “Keep it in this conversation.”
- `subagent`: “Open a fresh subagent.”

Reveal sentence: **“The conversation already contained the code and decision this follow-up needed.”**

### `p-route-2`

**Question:** “The assertion depends on the rename. Keep it here or send it out?”

- `main`: “Keep here.”
- `subagent`: “Send out.”

Reveal sentence: **“Its useful context was already in the main prefix.”**

### `p-parallel`

**Question:** “Four unrelated jobs can start together. Which route will make the shorter tape?”

- `main-batch`: “Keep all four here.”
- `subagent-batch`: “Give each job a fresh subagent.”
- `split-randomly`: “Split them two and two.”

No styling, stack color, cost preview, or disabled state indicates correctness before commitment.

### `p-rule`

**Question:** “What made the cheaper route change?”

- `task-size-only`: “Only the number of task tokens.”
- `relationship-and-carried-context`: “Whether the job needed this conversation, plus how much history the route carried.”
- `fresh-is-always-cheaper`: “Fresh subagents are always cheaper.”

Correct option: `relationship-and-carried-context`.

### Transfer prompts

- **“Change the error string you just reviewed.”** Options: `main`, `subagent`; correct: `main`.
- **“Scan an unrelated package tree.”** Options: `main`, `subagent`; correct: `subagent`.

Every `RUN_UNIT` in a reveal group is disabled until its corresponding prediction is committed.

## 9. Fail-state

- `failureRuleId`: `inline-92k-overread`
- Decisive event: routing `audit-imports` to `MAIN_SESSION_CONTEXT`.
- Predicate: `unitId=="audit-imports" && route=="main" && PB_HISTORY.tokenCount==92000`.
- Freeze after the priced row is fully visible, before the next ticket can run.
- Cause code: `INLINE_HISTORY_OVERREAD`.
- Exact causal message: **“This task reread 92k history to use 6k relevant input.”**
- Highlight: the `92,000` `PB_HISTORY` span, the `6,000` `PB_CURRENT` span, the corresponding `WireSegment`s, and the `$0.7056` `LedgerRow`.
- `UI_REWIND_CONTROL` label: **“Route the audit again.”**
- Rewind target: `cp-parallel-route`; preserves both completed follow-up predictions and their tape rows.

The freeze demonstrates marginal context cost, not wallet exhaustion.

## 10. Gate & stars

Pass requires all of the following:

- The two dependent fixture follow-ups are routed to `MAIN_SESSION_CONTEXT`.
- The four independent fixture jobs are routed to `SUBAGENT_CONTEXT`s.
- `p-rule` selects `relationship-and-carried-context`.
- In the unseen transfer pair, the dependent error-string task routes inline and the unrelated package scan routes out.
- No unit is hand-coded.

Budget alone cannot pass the level.

- **1 star:** behavioral gate passes.
- **2 stars — “Read the relationships”:** pass, with at least five of six fixture routes matching the reference route vector.
- **3 stars — “Clean split”:** all six fixture routes match, both transfer routes are correct on their first committed attempt, no hand-coding, and spend is at most `$2.99600205`.

Result copy:

- Pass headline: **“You gave each job the context it deserved.”**
- Fail headline: **“The routes still follow one rule for every task.”**
- Evidence line: **“Follow-ups stayed with their useful history; independent work kept the growing session out.”**
- Continue: **“Next shift”**
- Retry: **“Reroute the tickets”**

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `t-main-growth` | After `r-followup-assert-main` renders | **“Main context: 56k carried into this request.”** |
| `t-isolated-base` | After `r-audit-sub` renders | **“Fresh subagent: separate 26,237-token base.”** |
| `t-shared-read` | After the first warm parallel spawn renders | **“Identical spawn prefix reused: 26,237-token read.”** |
| `t-92k-cause` | `FREEZE_FAILURE` with `INLINE_HISTORY_OVERREAD` | **“This task reread 92k history to use 6k relevant input.”** |
| `t-route-rule` | After `p-rule` reveal | **“Route by dependency, not by habit.”** |
| `t-reference` | Counterfactual reveal | **“One cold base, then three bounded reads beat four growing inline histories.”** |

`t-92k-cause` is assertive and remains through the freeze; all others are polite, `3,500ms` `[ESTIMATE]`, and deduplicated per attempt.

## 12. QA gate

Real-browser click-through must establish:

1. First meaningful route control is interactive by `2s` `[ESTIMATE]`; no answer, comparison, or route recommendation appears first.
2. Pointer, touch, and keyboard routing dispatch identical `ROUTE_UNIT` actions.
3. No gated `RUN_UNIT` or `REVEAL_PREDICTION` succeeds before `COMMIT_PREDICTION`.
4. Each priced `Request` produces exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row; the failure-only row disappears after rewind.
5. Each rendered row’s non-zero `WireSegment`s exactly match its `readTok`, `inputTok`, `writeTok`, and `outTok`.
6. Every request cost is positive and matches `PRICE_REQUEST`; no positive amount displays as `$0.0000`.
7. `r-audit-sub` alone writes `26,237`; the next three identical subagent spawns each read `26,237` (`C10`).
8. Main and subagent cache namespaces remain isolated; the main panel never displays the shared subagent `CacheEntry`.
9. Inline `audit-imports` freezes on the fully rendered `92,000`/`6,000` row with exact copy: **“This task reread 92k history to use 6k relevant input.”**
10. `REWIND_TO_CHECKPOINT("cp-parallel-route")` restores wallet, ledger, caches, route choices, and prediction state byte-identically from the fixed seed.
11. Static final bars render with their final colors and prices without hover; reduced motion presents identical evidence immediately.
12. Hover/focus equations reproduce every cost in the pricing table above.
13. The fixed reference route vector passes with `$2.99600205`; the all-inline route vector totals `$3.0240` and fails the behavioral gate.
14. The player can win using only documented route, prediction, rewind, explanation, and completion controls.
15. `CounterfactualOverlay`, route labels, reference total, and post-reveal rule remain unavailable until a meaningful attempt completes.
16. At `320px` CSS width, the active route target, decisive tape row, toast, and rewind control do not overlap.
17. Screen-reader order is ticket → prediction → route controls → revealed row → causal caption; failure announcement uses `aria-live="assertive"`.

## 13. Reference-bar justification

The screen opens on a tactile sorting decision, withholds economics until commitment, and lets the first two tiny follow-ups establish a tempting habit. The `92k` freeze then makes that habit fail at one concrete request, and the immediate rewind converts surprise into agency. Only after the player discovers the bounded parallel pattern does the game name the rule and test it on unseen surface details. The post-attempt all-inline overlay confirms the mechanism without becoming a pre-play answer key, matching the discovery, causal feedback, and fast-transfer rhythm of the reference experiences.

Assumption: task-shape and the `92,000` history fixture are calibrated `[FICTION]`; pricing multipliers, Sonnet rates, `26,237` subagent base, `6,000/44,000` canonical workload, and inline growth anchors cite `C1`, `C3`, `C10`, `C28`, and `C29`.
