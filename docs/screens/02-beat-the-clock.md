# Level 2 — Beat the Clock

## 1. Identity

- `id`: `l2-beat-the-clock`
- `title`: **Beat the Clock**
- `tier`: `1`
- `objective`: **“Finish the next two requests without wasting the wallet.”**
- ONE concept: a live `CacheEntry` expires after enough idle time; the next identical `Request` must write again.
- `concept.id`: `cache-idle-expiry`
- `concept.privateDesignerSummary`: “Idle TTL determines whether an identical request reads or rewrites.”
- `concept.postRevealRule`: **“Saved context expires after 60 idle minutes. After that, the next request writes it again.”**
- Prerequisite: `write-vs-read` from Level 1.
- `prerequisiteConceptIds`: `["write-vs-read"]`
- New control: `advanceTime`
- Vocabulary first needed during play: **TTL**, introduced only after the opening request creates a `CacheEntry`.

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
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

No Learn screen, comparison, TTL rule, or answer key appears before play.

| Time | Beat |
|---:|---|
| `0.0s` | Enter directly into the task desk. Header: **“BEAT THE CLOCK”**. Task card: **“Bob’s login fix needs one more check.”** |
| `0.5s` | Wallet shows **$0.65**. Primary control appears under the pointer: **“Run check”**. No interruption advice is visible yet. |
| `≤2.0s` | Player can click **“Run check”**. This is the first interaction. |
| click | A red row crosses `UI_TAPE_RENDERER`; `UI_MAIN_CACHE_PANEL` gains one live entry. |
| immediately after | `UI_TTL_DRAIN_BAR` appears at `60:00`, then the toast introduces TTL: **“Saved for now. TTL is the idle-time countdown.”** |
| `+0.5s` | Copy changes to **“Bob needs the same check again. What happens before you send it?”** Two equally weighted interruption cards appear: **“Coffee · 20 min”** and **“Standup · 90 min”**. Neither card says “safe,” “expires,” “read,” “write,” red, blue, cheaper, or correct. |

`coldOpen.maxInstructionCards = 0`; `coldOpen.firstInteractiveBySec = 2` `[ESTIMATE]`.

## 4. Exact event sequence

All three requests use the same `MAIN_SESSION_CONTEXT`, byte-identical `PREFIX_STACK`, Sonnet, `1h`, and `34,738` cacheable tokens (`MAIN_PREFIX_HEY`, `C6`). No content mutation occurs between requests.

1. **Enter level**
   - Event: route opens.
   - Action: `{ type: "ENTER_LEVEL", levelId: "l2-beat-the-clock" }`
   - Mutates: `ReducerState`, `Clock.min = 0`, `Wallet.initialUsd = Wallet.remainingUsd = 0.65`, empty ledger/tape/cache.
   - Then: `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-level-start", reason: "level-start" }`.

2. **Opening check**
   - Event: player clicks **“Run check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_1 }`
   - `RESOLVE_PREFIX`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - Mutates: one `CacheEntry` with `createdAtMin=0`, `lastTouchMin=0`, `expiresAtMin=60`, `ttlMin=60`; one `LedgerRow`; one red `WireSegment`; wallet `0.6500000 → 0.4415720`.
   - Numbers: `34,738 tok` (`C6`); `60 min`, `2x` write (`C1`); `$0.208428` (`C1`, `C3`, `C6`).
   - Fires `toast-ttl-intro`.
   - Then: `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-interruption", reason: "decision" }`.

3. **Choose an interruption**
   - Event: player clicks **Coffee · 20 min** or **Standup · 90 min**.
   - Action:
     - Coffee: `{ type: "ADVANCE", min: 20 }`
     - Standup: `{ type: "ADVANCE", min: 90 }`
   - Mutates only `Clock`; `UI_TTL_DRAIN_BAR` drains live through committed whole minutes.
   - Coffee branch: `Clock.min 0 → 20`, remaining TTL `60 → 40`.
   - Standup branch: `Clock.min 0 → 90`, remaining TTL `60 → 0`; entry is derived expired at minute `60`.
   - The Send control stays locked until the applicable prediction is committed.

4. **Prediction before the second check**
   - Event: interruption animation settles.
   - Action: `{ type: "OPEN_PREDICTION", promptId: "p2-next-color" }`
   - Player selects via `SELECT_PREDICTION`, then commits via `COMMIT_PREDICTION`.
   - Mutates: `PredictionState`; no economics or cache state.
   - Question and options are in §8.

5. **Second identical check — Coffee branch**
   - Preconditions: Coffee chosen; `p2-next-color` committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_COFFEE }`
   - `RESOLVE_PREFIX`: live hit at minute `20`; `readTok=34,738`, `inputTok=0`, `writeTok=0`, `outTok=0`, `cold=false`.
   - Mutates: `CacheEntry.lastTouchMin 0 → 20`, `expiresAtMin 60 → 80` (`C12`); ledger/tape append one blue row; wallet `0.4415720 → 0.4311506`.
   - Numbers: `34,738 tok` (`C6`); `0.1x` (`C1`); `$0.0104214` (`C1`, `C3`, `C6`).
   - Then: `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "blue-read" }`.
   - Fires `toast-coffee-read`.
   - This establishes the required successful short-gap evidence.

6. **Second identical check — Standup branch**
   - Preconditions: Standup chosen; `p2-next-color` committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_STANDUP }`
   - `RESOLVE_PREFIX`: no live entry at minute `90`; `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - Mutates: replacement `CacheEntry` at minute `90`, expiring at `150`; ledger/tape append one red row; wallet `0.4415720 → 0.2331440`.
   - Numbers: idle gap `90 min`; expiry at `60 min` (`C1`); `34,738 tok` (`C6`); `$0.208428` (`C1`, `C3`, `C6`).
   - Then: `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "red-write" }`.
   - This row is the aha frame.
   - Immediately dispatch:
     `{ type: "FREEZE_FAILURE", failure: { failureId: "f2-expired-rewrite", causeCode: "CACHE_EXPIRED_IDLE", message: "Same request, different timing: expiry turned a read into a write.", checkpointId: "cp-before-interruption" } }`.

7. **Local rewind after Standup**
   - Event: player clicks **“Try the interruption again.”**
   - Action: `{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-before-interruption" }`
   - Mutates: deterministic branch replay restores minute `0`, the opening ledger row, live expiry at minute `60`, and wallet `$0.441572`; retains attempt count and mastered opening.
   - No cold-open replay.
   - Player must now demonstrate Coffee → prediction → blue read.

8. **Transfer: predict the long gap**
   - Preconditions: Coffee branch completed with a blue read.
   - Event: task card says **“One last identical check—but standup runs long.”**
   - Action sequence:
     - `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-transfer", reason: "prediction" }`
     - `{ type: "ADVANCE", min: 90 }`
     - `{ type: "OPEN_PREDICTION", promptId: "p2-standup-color" }`
     - select and commit prediction.
   - From the Coffee branch, clock goes `20 → 110`; refreshed expiry was `80`, so the TTL reaches zero before the request.

9. **Transfer reveal**
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_3_STANDUP }`
   - `RESOLVE_PREFIX`: expired; `readTok=0`, `writeTok=34,738`, `cold=true`.
   - Mutates: new `CacheEntry` at `110`, expiring at `170`; ledger/tape append red row; wallet `0.4311506 → 0.2227226`.
   - Then:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-standup-color", correctOptionId: "red-write" }`.
   - Fires `toast-expiry-cause`; shows the post-reveal rule.
   - This reveal does not freeze if the player already demonstrated the Coffee read; a wrong prediction remains non-punitive.

10. **Complete**
    - Event: player acknowledges the evidence.
    - Actions:
      - `{ type: "ACK_EXPLANATION", explanationId: "expiry-rule" }`
      - `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates: gate/stars/result.
    - Only now may `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` expose the alternate schedule.

## 5. Level data

```ts
const LEVEL_02: LevelDef = {
  id: "l2-beat-the-clock",
  tier: 1,
  title: "Beat the Clock",
  objective: "Finish the next two requests without wasting the wallet.",
  concept: {
    id: "cache-idle-expiry",
    privateDesignerSummary:
      "Idle TTL determines whether an identical request reads or rewrites.",
    postRevealRule:
      "Saved context expires after 60 idle minutes. After that, the next request writes it again."
  },
  prerequisiteConceptIds: ["write-vs-read"],

  unlocks: "advanceTime",
  introducedControls: ["advanceTime"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "oneHourFlag", "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 2002,
  budgetUsd: 0.65,
  clockCapMin: 110,
  cfgOverride: {
    orchestratorModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    keepWarm: false
  },
  scenario: "l1-onboarding",

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ],

  referenceCfg: {
    orchestratorModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    keepWarm: false
  },
  antiCfg: {
    orchestratorModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    keepWarm: false
  }
};
```

`scenarioData` supplies three byte-identical requests using `MAIN_PREFIX_HEY = 34,738` tokens (`C6`). The two configuration objects are intentionally identical: the reference/anti distinction is the ordered interruption choice in `scenarioPatch`, not a hidden configuration change.

Scenario-specific presentation values:

- `seed=2002` `[FICTION]`
- `budgetUsd=0.65` `[FICTION]`
- Coffee gap `20 min` `[FICTION]`
- Standup gap `90 min` `[FICTION]`
- Cold-open and animation timing `[ESTIMATE]`

`referenceCfg` scenario order: Coffee `20`, then Standup `90`.

`antiCfg` scenario order: Standup `90`, rewind omitted in the counterfactual, then another Standup `90`.

## 6. Pricing walkthrough

Sonnet rates are cache read `$0.30/M` and 1-hour write `$6/M` (`C1`, `C3`). Every request contains the same `34,738`-token cached prefix (`C6`) and no separately introduced fresh-input or output bucket.

| Request | Time | Resolution | Calculation | Cost |
|---|---:|---|---|---:|
| `R2_1` | `0` | `34,738` write | `34,738 × $6 / 1,000,000` | `$0.2084280` |
| `R2_2_COFFEE` | `20` | `34,738` read | `34,738 × $0.30 / 1,000,000` | `$0.0104214` |
| `R2_3_STANDUP` | `110` | `34,738` write | `34,738 × $6 / 1,000,000` | `$0.2084280` |

Three-star reference total:

```text
$0.2084280 + $0.0104214 + $0.2084280 = $0.4272774
```

Anti-pattern total, with both follow-ups arriving after expiry:

```text
$0.2084280 × 3 = $0.6252840
```

Avoidable anti-pattern delta:

```text
$0.6252840 - $0.4272774 = $0.1980066
```

The identical prefix costs `20x` more as a 1-hour rewrite than as a read (`2 / 0.1`, `C5`). Exact values remain unrounded in state; UI may show `$0.2084`, `$0.0104`, `$0.4273`, and `$0.6253`.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"` and rows appear only after their gated request resolves.

1. `R2_1` — red `write`, `34,738 tok`, `$0.208428`.
2. `R2_2_COFFEE` — blue `read`, `34,738 tok`, `$0.0104214`; gated by `p2-next-color`.
3. `R2_3_STANDUP` — red `write`, `34,738 tok`, `$0.208428`; gated by `p2-standup-color`.

`ahaRequestId = "R2_3_STANDUP"`.

Aha frame:

- Freeze the TTL bar visually at `0:00`.
- Keep `R2_2_COFFEE` blue immediately above `R2_3_STANDUP` red.
- Pulse only the expired `CacheEntry`, the zero point on `UI_TTL_DRAIN_BAR`, and the new red row.
- Caption after reveal: **“The request stayed identical. The live cache did not.”**
- Do not add an unpriced “expiry” tape row; expiry is clock/cache state, not a request.

## 8. Prediction prompts

### `p2-next-color`

Question:

> **After this interruption, what color will the identical request be?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

The correct option is branch-dependent and is supplied only to `REVEAL_PREDICTION` after `SEND_REQUEST`:

- Coffee `20 min` → `blue-read`
- Standup `90 min` → `red-write`

### `p2-standup-color`

Question:

> **The request is still identical after a 90-minute standup. What reaches the wire?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

Correct option: `red-write`, withheld until commitment and request resolution.

No option includes the rule, the `60`-minute threshold, or evaluative styling before commitment.

## 9. Fail-state

- Failure rule id: `f2-expired-rewrite`
- Decisive event: `R2_2_STANDUP` resolves after the first `90`-minute interruption.
- Predicate: the first chosen interruption is Standup, the identical follow-up has `cold=true`, and `writeTok=34,738`.
- Freeze highlights:
  - `UI_TTL_DRAIN_BAR` at `0:00`
  - expired opening `CacheEntry`
  - the red `R2_2_STANDUP` tape row
  - its `$0.208428` wallet deduction
- Exact causal message:

> **Same request, different timing: expiry turned a read into a write.**

- Rewind control label: **“Try the interruption again”**
- Destination: `cp-before-interruption`
- Rewind preserves the opening request and skips all mastered setup.
- Cause toast remains visible while frozen and is announced assertively.
- Failure is behavioral, not merely `Wallet.remainingUsd` crossing a threshold.

## 10. Gate & stars

Behavioral pass predicate:

```text
pass iff
  exists a 20-minute interruption followed by a request with
    readTok = 34,738 and writeTok = 0
  AND p2-standup-color was committed before R2_3_STANDUP
  AND R2_3_STANDUP resolved with writeTok = 34,738
  AND expiry-rule was acknowledged after both rows were visible
```

Failure reason when unmet:

> **“Show that you can preserve one live read, then predict what the long idle gap changes.”**

Evidence lines:

- **“20-minute gap: 34,738 tokens read.”**
- **“90-minute gap: 34,738 tokens rewritten.”**
- **“Prediction committed before the long-gap reveal.”**

Stars:

- **1 star — Demonstrated the rule:** behavioral gate passes.
- **2 stars — Called the long gap:** gate passes and `p2-standup-color.optionId === "red-write"`.
- **3 stars — Clean schedule:** 2-star predicate, Coffee is chosen without first triggering `f2-expired-rewrite`, and actual total is exactly `$0.4272774`.

A wrong prediction never blocks completion; it only prevents the corresponding prediction star.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `toast-first-write` | `R2_1` appends | **“WRITE · 34,738 tokens · $0.2084”** |
| `toast-ttl-intro` | opening `CacheEntry` appears | **“Saved for now. TTL is the idle-time countdown.”** |
| `toast-coffee-read` | Coffee follow-up resolves blue | **“Still live. READ · 34,738 tokens · $0.0104”** |
| `toast-expired` | drain first reaches zero | **“TTL · 0:00”** |
| `toast-expiry-cause` | long-gap red row resolves | **“Expired while idle. WRITE again · $0.2084”** |
| `toast-transfer-rule` | `p2-standup-color` reveals | **“Same request, different timing.”** |

Only one teaching toast is shown at once. `toast-expired` contains status only; it does not reveal the next row before the player commits a prediction and sends.

## 12. QA gate

Real-browser click-through assertions:

1. Level opens with no Learn screen and **“Run check”** is clickable by `2s` `[ESTIMATE]`.
2. No player-facing pre-play copy states the `60`-minute lifetime, which interruption survives, or the next row’s color.
3. Opening click creates exactly one `LedgerRow`, one tape row, and one live `CacheEntry`.
4. Opening price is exactly `$0.2084280` (`C1`, `C3`, `C6`).
5. Coffee dispatches one `ADVANCE(20)`; no request or ledger row is produced by time passage.
6. Coffee leaves `40` minutes before the send; its hit refreshes `lastTouchMin` to `20` and `expiresAtMin` to `80` (`C12`).
7. Coffee request price is exactly `$0.0104214` (`C1`, `C3`, `C6`).
8. Standup dispatches one `ADVANCE(90)`; TTL visibly reaches `0` before Send becomes available.
9. Neither gated Send can execute before its prediction is committed.
10. The identical post-Standup request resolves cold with `writeTok=34,738`, costs `$0.2084280`, and renders red.
11. Failure freezes on the decisive red row, not before it; economic actions are blocked until rewind.
12. Rewind returns to `cp-before-interruption` without replaying the opening request.
13. A complete reference click-through is winnable: opening → Coffee → predict blue → send → Standup → predict red → send → acknowledge.
14. Reference total is `$0.4272774`; anti-pattern total is `$0.6252840`.
15. Every real request has `usd > 0`; no UI renders a positive amount as `$0.0000`.
16. Tape-row count equals ledger-row count at every action boundary.
17. Every tape row corresponds to exactly one priced request; the TTL animation creates none.
18. All row token buckets sum to `34,738`; no token appears in both read and write for one request.
19. `R2_2_COFFEE` and `R2_3_STANDUP` have byte-identical request content; only `sentAtMin` differs.
20. Prediction options have no correctness styling before commitment.
21. Keyboard and screen-reader flows can choose either interruption, select/commit each prediction, send, inspect price details, and activate rewind.
22. Reduced-motion mode replaces drain/pulse animation with immediate state transitions while preserving ordering.
23. Restart with seed `2002` replays identical state, ledger, wallet, prediction gates, and tape.
24. `UI_RESULT_SCREEN` displays behavioral evidence and star reasons; it does not present budget alone as mastery.

## 13. Reference-bar justification

The screen opens on a tactile request instead of instruction. The first red write creates a visible object worth protecting; two unlabeled interruption choices then turn an invisible idle-time rule into a physical countdown. Prediction locks attention before each row appears. Coffee produces the reassuring cheap blue read, while Standup lets the bar die and makes the same request snap red—the causal contrast is discovered through action, not announced.

The failure remains at the precise expired request, names timing as the cause, and rewinds one choice in seconds. The final transfer asks the player to predict the long-gap outcome before confirmation, so the gate measures a usable mental model rather than passive exposure or wallet luck.

Assumption/tradeoff: the level uses `MAIN_PREFIX_HEY = 34,738` (`C6`) as the complete cacheable request payload and zero fresh/output tokens, keeping Level 2 exclusively about TTL-driven read versus rewrite while deferring later pricing vocabulary.
