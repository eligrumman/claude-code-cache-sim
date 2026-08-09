# Level 2 — Beat the Clock

## 1. Identity

- `id`: `"02-beat-the-clock"`
- `title`: **Beat the Clock**
- `tier`: `1`
- `objective`: **“Fit Bob’s next two checks around the interruptions.”**
- ONE concept: an idle `CacheEntry` eventually expires, causing the next byte-identical `Request` to write its prefix again.
- `concept.id`: `"cache-expiry"`
- `concept.privateDesignerSummary`: “Idle TTL determines whether an identical request reads or rewrites.”
- `concept.postRevealRule`: **“Saved context expires after 60 idle minutes. After that, the next identical request writes it again.”**
- `prerequisiteConceptIds`: `["write-vs-read"]`
- New control: `"advanceTime"`
- Vocabulary first needed during play: **TTL**, introduced only after the opening request creates a `CacheEntry`.

The first interruption is a real time-versus-cost decision:

- Coffee preserves Bob’s current focus window but delays his blocker-clearing standup by `20 min` `[FICTION]`.
- Standup clears that blocker immediately but occupies `90 min` `[FICTION]`.

Neither card exposes the cache result before the player acts.

## 2. Objects used

- `Request`
- `PricedRequest`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `Clock`
- `Wallet`
- `Budget`
- `LedgerRow`
- `WireSegment`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `ReducerState`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `"predict-before-reveal"`
- `"fail-freeze-rewind"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

No Learn screen, comparison, TTL rule, answer key, or reference schedule appears before play.

| Time | Beat |
|---:|---|
| `0.0s` | Enter directly into the task desk. Header: **“BEAT THE CLOCK”**. Task card: **“Bob’s login fix needs one more check.”** |
| `0.5s` | Wallet shows **$0.65** `[FICTION]`. Primary control appears under the pointer: **“Run check.”** |
| `≤2.0s` | Player can click **“Run check.”** This is the first interaction `[ESTIMATE]`. |
| click | A red row crosses `UI_TAPE_RENDERER`; `UI_MAIN_CACHE_PANEL` gains one live entry. |
| immediately after | `UI_TTL_DRAIN_BAR` appears at `60:00`, then `toast-ttl-intro` introduces TTL. |
| `+0.5s` | Copy changes to **“Bob needs the same check again. What happens before you send it?”** |
| same beat | Two equally weighted cards appear: **“Coffee · 20 min · blocker waits”** and **“Standup · 90 min · blocker clears.”** |

The cards do not say “safe,” “expires,” “read,” “write,” red, blue, cheaper, correct, or which choice preserves the cache.

`coldOpen.maxInstructionCards = 0`; `coldOpen.firstInteractiveBySec = 2` `[ESTIMATE]`.

## 4. Exact event sequence

All requests use the same `MAIN_SESSION_CONTEXT`, byte-identical `PREFIX_STACK`, Sonnet, the `1h` write tier, and `MAIN_PREFIX_HEY = 34,738` cacheable tokens (`C34`). Each request has `freshInputTok=0` and `expectedOutputTok=0` `[FICTION]`. No content, model, namespace, or prefix ordering changes between requests.

1. **Enter level — `evt-enter`**
   - Event: route opens.
   - Action: `{ type: "ENTER_LEVEL", levelId: "02-beat-the-clock" }`
   - Mutates: `ReducerState`; `Clock.min=0`; `Wallet.initialUsd=Wallet.remainingUsd=0.65`; ledger, tape, and cache are empty.
   - The level-start checkpoint is created by `ENTER_LEVEL`.

2. **Opening check — `evt-opening-write`**
   - Event: player clicks **“Run check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_1 }`
   - `RESOLVE_PREFIX`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `34,738 × $6/M = $0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - one `CacheEntry` with `createdAtMin=0`, `lastTouchMin=0`, `expiresAtMin=60`, `ttlMin=60`;
     - one `LedgerRow`;
     - one red write `WireSegment`;
     - wallet `0.6500000 → 0.4415720`.
   - Fires `toast-first-write`, followed by `toast-ttl-intro`.
   - Then dispatches:
     `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-interruption", reason: "decision" }`.

3. **Choose an interruption — `evt-first-gap`**
   - Event: player chooses Coffee or Standup.
   - Action:
     - Coffee: `{ type: "ADVANCE", min: 20 }`
     - Standup: `{ type: "ADVANCE", min: 90 }`
   - `ADVANCE` mutates only `Clock`; cache liveness and the TTL display are derived.
   - Coffee: `Clock.min 0 → 20`; displayed remaining TTL `60 → 40`.
   - Standup: `Clock.min 0 → 90`; displayed remaining TTL reaches `0` at minute `60`.
   - Time passage produces no `LedgerRow`.
   - The request control remains locked until `p2-next-color` is committed.

4. **Predict the second row — `evt-first-prediction`**
   - Event: the interruption animation settles.
   - Action: `{ type: "OPEN_PREDICTION", promptId: "p2-next-color" }`
   - The player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION`.
   - Mutates only `PredictionState`; prediction choice and correctness have no economic, failure, gate, score, or star effect.

5. **Coffee reveal — `evt-coffee-reveal`**
   - Preconditions: Coffee was chosen and `p2-next-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_COFFEE }`
   - `RESOLVE_PREFIX` at minute `20`: `readTok=34,738`, `inputTok=0`, `writeTok=0`, `outTok=0`, `cold=false`.
   - `PRICE_REQUEST`: `34,738 × $0.30/M = $0.0104214` (`C1`, `C3`, `C34`).
   - Mutates:
     - `CacheEntry.lastTouchMin 0 → 20`;
     - `CacheEntry.expiresAtMin 60 → 80` under the cache-touch rule (`C12`);
     - ledger/tape append one blue read row;
     - wallet `0.4415720 → 0.4311506`.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "blue-read" }`.
   - Fires `toast-coffee-read`.
   - This is the required short-gap evidence.

6. **Standup failure reveal — `evt-standup-failure-reveal`**
   - Preconditions: Standup was chosen and `p2-next-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_STANDUP }`
   - `RESOLVE_PREFIX` at minute `90`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `34,738 × $6/M = $0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - replacement `CacheEntry` at minute `90`, expiring at minute `150`;
     - ledger/tape append one red write row;
     - wallet `0.4415720 → 0.2331440`.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "red-write" }`.
   - The decisive frame shows:
     - actual expired rewrite: `$0.2084280`;
     - valid live-read alternative: `$0.0104214`;
     - visible ratio: `20×` (`C5`).
   - Only after the row and comparison are visible, dispatch:
     `{ type: "FREEZE_FAILURE", failure: { failureId: "f2-expired-rewrite", causeCode: "CACHE_EXPIRED_IDLE", message: "Same request, different timing: expiry turned a $0.0104 read into a $0.2084 write.", checkpointId: "cp-before-interruption" } }`.

7. **Local rewind — `evt-rewind-interruption`**
   - Event: player clicks **“Try the interruption again.”**
   - Action: `{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-before-interruption" }`
   - Deterministic replay restores:
     - `Clock.min=0`;
     - the opening ledger/tape row;
     - the opening live cache entry expiring at minute `60`;
     - wallet `$0.4415720`.
   - Failure history and attempt history remain available for star evaluation.
   - The cold-open and opening request do not replay.
   - The player now demonstrates Coffee → prediction → blue read.

8. **Long-gap transfer setup — `evt-transfer-start`**
   - Preconditions: `evt-coffee-reveal` completed.
   - Event: task card says **“One last identical check—but Bob’s standup runs long.”**
   - Actions:
     - `{ type: "BEGIN_TRANSFER", challengeId: "l2-long-gap-transfer" }`
     - `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-transfer", reason: "prediction" }`
     - `{ type: "ADVANCE", min: 90 }`
     - `{ type: "OPEN_PREDICTION", promptId: "p2-standup-color" }`
   - The player selects and commits the prediction.
   - `Clock.min 20 → 110`; the refreshed entry expired at minute `80`.
   - No request or price is revealed during the advance.

9. **Long-gap transfer reveal — `evt-transfer-reveal`**
   - Preconditions: `p2-standup-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_3_STANDUP }`
   - `RESOLVE_PREFIX` at minute `110`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `$0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - new `CacheEntry` at minute `110`, expiring at minute `170`;
     - ledger/tape append one red write row;
     - wallet `0.4311506 → 0.2227226`.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-standup-color", correctOptionId: "red-write" }`.
   - Fires `toast-expiry-cause`.
   - The wrong prediction is revealed neutrally and remains non-punitive.
   - The post-reveal rule is still withheld pending the explanation choice.

10. **Post-evidence explanation — `evt-explain-expiry`**
    - Preconditions: both `evt-coffee-reveal` and `evt-transfer-reveal` are visible.
    - Event: player answers **“What changed the bill?”**
    - Each selected card dispatches:
      `{ type: "ACK_EXPLANATION", explanationId: <selected-id> }`
    - Options:
      - `expiry-idle-gap`: **“The saved entry sat idle past its lifetime.”**
      - `request-text-changed`: **“The request text changed.”**
      - `model-price-changed`: **“The model switched prices.”**
    - An incorrect explanation changes no wallet, cache, failure, prediction, or completed evidence and leaves the choices available.
    - Selecting `expiry-idle-gap` satisfies the post-evidence gate action and reveals `concept.postRevealRule`.
    - Fires `toast-transfer-rule`.

11. **Complete — `evt-complete`**
    - Preconditions: `expiry-idle-gap` was acknowledged after `evt-transfer-reveal`.
    - Action: `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates: gate result, stars, result screen, and campaign progress.
    - Only now may `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` expose the authored reference and anti-pattern schedules.

## 5. Level data

```ts
const L2_LOCKED_CFG = {
  orchestratorModel: "sonnet",
  who: "inline",
  prompts: "identical",
  oneHourFlag: true,
  keepWarm: false
} satisfies Partial<Config>;

const LEVEL_02: LevelDef = {
  id: "02-beat-the-clock",
  tier: 1,
  title: "Beat the Clock",
  objective: "Fit Bob’s next two checks around the interruptions.",
  concept: {
    id: "cache-expiry",
    privateDesignerSummary:
      "Idle TTL determines whether an identical request reads or rewrites.",
    postRevealRule:
      "Saved context expires after 60 idle minutes. After that, the next identical request writes it again."
  },
  prerequisiteConceptIds: ["write-vs-read"],

  unlocks: "run",
  introducedControls: ["advanceTime"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "oneHourFlag", "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 2002,
  budgetUsd: 0.65,
  clockCapMin: 180,
  cfgOverride: L2_LOCKED_CFG,
  scenario: "l1-onboarding",
  scenarioData: L2_SCENARIO_DATA,

  coldOpen: L2_COLD_OPEN,
  sequence: L2_SEQUENCE,
  predictions: L2_PREDICTIONS,
  toasts: L2_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: L2_FAIL_LESSON,
  failureRules: L2_FAILURE_RULES,
  checkpoints: L2_CHECKPOINTS,

  gate: L2_GATE,
  pass: passLevel02,
  star2: L2_STAR_2,
  star3: L2_STAR_3,

  referenceCfg: L2_LOCKED_CFG,
  antiCfg: L2_LOCKED_CFG,
  counterfactuals: L2_COUNTERFACTUALS,

  tape: L2_TAPE,
  result: L2_RESULT,
  vocabulary: L2_VOCABULARY,
  qa: L2_QA
};
```

Level-specific scenario values:

- `seed=2002` `[FICTION]`
- `budgetUsd=0.65` `[FICTION]`
- `clockCapMin=180` `[FICTION]`, allowing the off-screen anti-pattern to finish
- Coffee gap `20 min` `[FICTION]`
- Standup/release-review gap `90 min` `[FICTION]`
- `freshInputTok=0` and `expectedOutputTok=0` per request `[FICTION]`
- Cold-open and animation timings `[ESTIMATE]`

`L2_SCENARIO_DATA.gaps` contains the player-facing fixtures:

```ts
[
  {
    id: "g-coffee-first",
    contextId: "ctx-main-l2",
    startMin: 0,
    durationMin: 20,
    permitsKeepWarm: false
  },
  {
    id: "g-standup-first",
    contextId: "ctx-main-l2",
    startMin: 0,
    durationMin: 90,
    permitsKeepWarm: false
  },
  {
    id: "g-transfer-standup",
    contextId: "ctx-main-l2",
    startMin: 20,
    durationMin: 90,
    permitsKeepWarm: false
  }
]
```

`referenceCfg` and `antiCfg` are intentionally identical because configuration is not the causal variable. Their exact scenario ordering is authoritative in these counterfactual patches:

```ts
const REFERENCE_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-ref-coffee",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 20,
      permitsKeepWarm: false
    },
    {
      id: "g-ref-standup",
      contextId: "ctx-main-l2",
      startMin: 20,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Requests resolve at minutes 0, 20, and 110.

const ANTI_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-anti-standup",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 90,
      permitsKeepWarm: false
    },
    {
      id: "g-anti-release-review",
      contextId: "ctx-main-l2",
      startMin: 90,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Requests resolve at minutes 0, 90, and 180.
```

```ts
const L2_COUNTERFACTUALS: CounterfactualDef[] = [
  {
    id: "cf-l2-reference",
    unlockAfterEventId: "evt-complete",
    kind: "reference",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: REFERENCE_SCENARIO_PATCH,
    comparisonQuestion:
      "What changed when the short interruption came before the long one?",
    revealCopy:
      "One live read replaced one expired rewrite."
  },
  {
    id: "cf-l2-anti",
    unlockAfterEventId: "evt-complete",
    kind: "anti-pattern",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: ANTI_SCENARIO_PATCH,
    comparisonQuestion:
      "What did two long idle gaps do to the identical prefix?",
    revealCopy:
      "Both follow-ups arrived after expiry and rewrote the prefix."
  }
];
```

## 6. Pricing walkthrough

Sonnet prices a 1-hour cache write at `$6/M`, a cache read at `$0.30/M`, and output at `$15/M` (`C1`, `C3`). The complete repeated prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`).

This is the only authoritative price table for the level:

| Request outcome | Time | `readTok` | `inputTok` | `writeTok` | `outTok` | Calculation | Cost |
|---|---:|---:|---:|---:|---:|---|---:|
| `R2_1` opening write | `0` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |
| `R2_2_COFFEE` live read | `20` | `34,738` | `0` | `0` | `0` | `34,738 × $0.30 / 1,000,000` | `$0.0104214` |
| `R2_3_STANDUP` expired write | `110` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |

Three-star reference total:

```text
$0.2084280 + $0.0104214 + $0.2084280 = $0.4272774
```

Anti-pattern total at minutes `0`, `90`, and `180`:

```text
3 × $0.2084280 = $0.6252840
```

Avoidable anti-pattern delta:

```text
$0.6252840 - $0.4272774 = $0.1980066
```

The anti-pattern costs approximately `46.3%` more than the reference, and an individual expired 1-hour rewrite costs `20×` its live read (`C5`). Exact values remain unrounded in state; display values may be `$0.2084`, `$0.0104`, `$0.4273`, and `$0.6253`.

Although this scenario intentionally has `outTok=0`, `UI_TAPE_RENDERER` still uses the canonical cost-share geometry for every row: output would contribute at Sonnet’s `$15/M` rate (`5×`, `C1`, `C3`). Hiding an output label never removes output’s visual weight.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`. Rows appear only after their request resolves.

Reference branch:

1. `R2_1` — red write segment, `34,738 tok`, `$0.2084280`.
2. `R2_2_COFFEE` — blue read segment, `34,738 tok`, `$0.0104214`; reveal gated by `p2-next-color`.
3. `R2_3_STANDUP` — red write segment, `34,738 tok`, `$0.2084280`; reveal gated by `p2-standup-color`.

Failure branch replaces row 2 with `R2_2_STANDUP`, a red `34,738`-token write costing `$0.2084280`. Rewind removes that branch row by deterministic replay before the reference branch continues.

`ahaRequestId = "R2_3_STANDUP"`.

Aha frame:

- Hold `UI_TTL_DRAIN_BAR` at `0:00`.
- Keep `R2_2_COFFEE` immediately above `R2_3_STANDUP`.
- Pulse the expired `CacheEntry`, the zero point on the TTL bar, and the new red row.
- After revelation, caption: **“The request stayed identical. The live cache did not.”**
- Do not add an unpriced expiry row; expiry is clock/cache state, not a request.
- Segment geometry is `segment.usd / row.usd` across read, input, write, and output buckets. Because each authored row has one non-zero bucket, its sole segment has `widthRatio=1`.

## 8. Prediction prompts

### `p2-next-color`

Question:

> **After this interruption, what color will the identical request be?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

The correct option is supplied only after commitment and request resolution:

- Coffee branch → `blue-read`
- Standup branch → `red-write`

### `p2-standup-color`

Question:

> **The request is still identical after the long standup. What reaches the wire?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

Correct option: `red-write`, withheld until commitment and `R2_3_STANDUP` resolution.

No prompt option includes the rule, the `60`-minute threshold, evaluative styling, or a dollar clue before commitment. Prediction correctness never affects gate passage, stars, score, wallet, failure, or rewind.

## 9. Fail-state

- Failure rule id: `f2-expired-rewrite`
- Decisive event: `evt-standup-failure-reveal`
- Predicate:
  - first interruption is `g-standup-first`;
  - `R2_2_STANDUP.cold === true`;
  - `R2_2_STANDUP.writeTok === 34,738`.
- The predicate does not inspect prediction choice or correctness.
- `actualUsd`: `$0.2084280`
- `validAlternativeUsd`: `$0.0104214`
- Visible economic difference: `$0.1980066`, or `20×` for rewrite versus read (`C5`).
- Freeze highlights:
  - `UI_TTL_DRAIN_BAR` at `0:00`;
  - the expired opening `CacheEntry`;
  - the red `R2_2_STANDUP` row;
  - its `$0.2084` wallet deduction;
  - the post-reveal comparison chip **“Expired write $0.2084 · Live read $0.0104 · 20×.”**
- Exact causal message:

> **Same request, different timing: expiry turned a $0.0104 read into a $0.2084 write.**

- Rewind label: **“Try the interruption again”**
- Destination: `cp-before-interruption`
- Rewind preserves the mastered opening request and failure history.
- Economic actions remain blocked while frozen.
- Failure is triggered by the visible expensive request, never by budget alone.
- A wrong prediction never triggers or changes this failure.

## 10. Gate & stars

The post-evidence explanation in `evt-explain-expiry` is the understanding check. Prediction commitment is required structurally to unlock each reveal, but prediction identity and correctness are absent from the gate and star predicates.

Behavioral pass predicate:

```text
pass iff
  a request after the 20-minute gap resolved with
    readTok = 34,738 and writeTok = 0
  AND a later byte-identical request after the 90-minute gap resolved with
    readTok = 0 and writeTok = 34,738
  AND, after evt-transfer-reveal,
    ACK_EXPLANATION was observed with explanationId = "expiry-idle-gap"
```

`L2_GATE`:

```ts
{
  predicateId: "gate-l2-cache-expiry",
  evidenceRevealEventIds: [
    "evt-coffee-reveal",
    "evt-transfer-reveal"
  ],
  postEvidenceActionRequirements: [
    {
      id: "l2-post-evidence-explanation",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "evt-transfer-reveal",
      match: { explanationId: "expiry-idle-gap" }
    }
  ],
  behavioralRequirements: [
    {
      id: "l2-observed-live-read",
      kind: "compare",
      path: "ledger.byRequest.R2_2_COFFEE.readTok",
      op: "eq",
      value: 34738,
      observedAfterEventId: "evt-coffee-reveal"
    },
    {
      id: "l2-observed-expired-write",
      kind: "compare",
      path: "ledger.byRequest.R2_3_STANDUP.writeTok",
      op: "eq",
      value: 34738,
      observedAfterEventId: "evt-transfer-reveal"
    }
  ],
  explanationRequirement: {
    id: "l2-explained-idle-expiry",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "expiry-idle-gap",
    observedAfterEventId: "evt-transfer-reveal"
  }
}
```

Failure reason when unmet:

> **“Compare the live and expired rows, then identify what changed the bill.”**

Result evidence:

- **“20-minute gap: 34,738 tokens read.”**
- **“90-minute gap: 34,738 tokens rewritten.”**
- **“Cause identified after both rows were visible: idle expiry.”**

Stars:

- **1 star — Demonstrated expiry:** the behavioral gate passes.
- **2 stars — Clean first schedule:** the gate passes and no `f2-expired-rewrite` was triggered before completion.
- **3 stars — Read the evidence cleanly:** the 2-star predicate passes, `expiry-idle-gap` was the first post-evidence explanation selected, and `Wallet.spentUsd <= 0.4272774`.

The cost predicate uses `<=`, not floating-point equality. No star predicate reads either prediction.

## 11. Toasts

| ID | Trigger | Priority | Exact copy |
|---|---|---|---|
| `toast-first-write` | `R2_1` appends | status | **“WRITE · 34,738 tokens · $0.2084”** |
| `toast-ttl-intro` | opening `CacheEntry` appears | teaching | **“Saved for now. TTL is the idle-time countdown.”** |
| `toast-coffee-read` | `R2_2_COFFEE` resolves | teaching | **“Still live. READ · 34,738 tokens · $0.0104”** |
| `toast-expired` | TTL first reaches zero | status | **“TTL · 0:00”** |
| `toast-expiry-cause` | `R2_3_STANDUP` resolves | cause | **“Expired while idle. WRITE again · $0.2084”** |
| `toast-transfer-rule` | `expiry-idle-gap` is acknowledged | teaching | **“Saved context expires after 60 idle minutes.”** |

Only one teaching toast is visible at once. `toast-expired` reports status only; it does not reveal the next request’s row or correct prediction.

## 12. QA gate

Real-browser click-through assertions:

1. The level opens with no Learn screen; **“Run check”** is clickable by `2s` `[ESTIMATE]`.
2. No pre-play copy states the cache lifetime, surviving interruption, next row color, or cheaper schedule.
3. `ENTER_LEVEL` uses `"02-beat-the-clock"`.
4. `concept.id` is `"cache-expiry"` and its only prerequisite is `"write-vs-read"`.
5. `interactionPatterns` contains only canonical kebab-case IDs.
6. The opening click creates exactly one `LedgerRow`, one tape row, and one live `CacheEntry`.
7. Opening price is exactly `$0.2084280` (`C1`, `C3`, `C34`).
8. Coffee dispatches exactly one `ADVANCE(20)` and produces no request during time passage.
9. Coffee leaves `40 min` on the original TTL; its read refreshes `lastTouchMin` to `20` and `expiresAtMin` to `80` (`C12`).
10. Coffee’s request costs exactly `$0.0104214` (`C1`, `C3`, `C34`).
11. Standup dispatches exactly one `ADVANCE(90)`; TTL reaches zero before Send becomes available.
12. Neither request reveal can execute before its applicable prediction is committed.
13. Wrong predictions change no wallet, score, star, failure, rewind, or gate result.
14. The post-Standup request resolves with `readTok=0`, `writeTok=34,738`, costs `$0.2084280`, and renders red.
15. Failure freezes only after the decisive red row and the `$0.2084280` versus `$0.0104214` comparison are visible.
16. The failure rule satisfies `actualUsd > validAlternativeUsd` and exposes the `20×` difference (`C5`).
17. Rewind returns to `cp-before-interruption` without replaying or repricing `R2_1`.
18. A complete reference click-through is winnable: opening → Coffee → predict → send → long standup → predict → send → choose `expiry-idle-gap` → complete.
19. The gate observes `ACK_EXPLANATION` after `evt-transfer-reveal`; it does not inspect prediction state.
20. An incorrect post-evidence explanation is retryable and changes no economics.
21. Reference requests resolve at minutes `0`, `20`, and `110`; their total is `$0.4272774`.
22. Anti-pattern requests resolve at minutes `0`, `90`, and `180`; their total is `$0.6252840`.
23. `referenceCfg` and `antiCfg` are identical; their respective `scenarioPatch.gaps` arrays are the sole authored ordering difference.
24. Counterfactual configuration, schedule, totals, and labels remain hidden until `evt-complete`.
25. Every real request has `usd > 0`; no positive amount renders as `$0.0000`.
26. Tape-row count equals ledger-row count at every action boundary.
27. Time passage and expiry animations create no tape or ledger rows.
28. Every request’s input-side buckets total `34,738`; no token appears in both read and write buckets.
29. Every authored request has `outTok=0`, but tape geometry still includes the canonical output-cost bucket and Sonnet’s `$15/M` output rate (`C1`, `C3`).
30. Static final tape bars remain visible without hover.
31. `R2_1`, `R2_2_COFFEE`, `R2_2_STANDUP`, and `R2_3_STANDUP` use byte-identical prefix content; only `sentAtMin` and cache liveness differ.
32. Prediction options have no correctness styling before commitment.
33. Keyboard and pointer flows can choose interruptions, select and commit predictions, send requests, inspect prices, answer the explanation, and rewind.
34. Screen readers announce the frozen causal message and both compared prices.
35. Reduced-motion mode replaces drain and pulse animation with immediate state transitions while preserving action order and final evidence.
36. Restarting with seed `2002` reproduces byte-identical state, ledger, wallet, cache, checkpoints, and tape.
37. `UI_RESULT_SCREEN` displays behavioral evidence and star reasons; budget alone never indicates mastery.
38. The document contains one authoritative pricing table and no superseded request total, threshold, or unreachable branch.
39. Both interruption cards expose a real non-answer tradeoff—blocker timing versus elapsed idle time—without revealing the cache outcome.
40. The reference configuration passes; the anti-pattern fails the intended scheduling behavior.

## 13. Reference-bar justification

The screen opens on a tactile request rather than an explanation. Its first red write creates something visible to protect, and the two interruption cards turn an invisible idle-time mechanism into a moving object. The cards expose a genuine calendar tradeoff without naming the cache answer. Their durations and the live bar provide enough evidence for prediction instead of forcing a coin flip.

Coffee produces the cheap blue read. The later standup lets the same saved entry die and makes the byte-identical request snap red. The failed long-gap route freezes only after its `$0.2084` cost can be compared with the `$0.0104` live-read alternative, so the lesson agrees with the ledger. Rewind returns directly to the consequential decision.

The final gate does not reward the pre-reveal guess. It waits until both contrasting rows are visible and asks the player to identify the cause. Only then does the level state the rule and unlock its exact reference/anti-pattern schedules.

Assumption/tradeoff: the level deliberately assigns `expectedOutputTok=0` `[FICTION]` to isolate TTL-driven read-versus-rewrite economics. `UI_TAPE_RENDERER` nevertheless retains the canonical output-inclusive cost geometry so this level does not introduce a conflicting tape model.
