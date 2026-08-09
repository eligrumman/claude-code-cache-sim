# Level 7 — Keep It Alive

## 1. Identity

- **id:** `L7`
- **title:** Keep It Alive
- **tier:** `2`
- **Objective copy:** “Three pings. Five gaps. Keep the day moving without babysitting it.”
- **One concept:** `keep-warm-break-even` — a keep-warm request is worthwhile only when its accumulated cost is below the rewrite it prevents.
- **Prerequisite:** `ttl-tier-tradeoff` from Level 6.
- **Post-reveal rule:** “Ping only while the pings cost less than rebuilding.”
- **Unlocks:** `keepWarm`
- **Introduced control:** `keepWarmMin`

## 2. Objects used

- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `PB_SYSTEM`
- `PB_TOOLS`
- `PB_INSTRUCTIONS`
- `PB_HISTORY`
- `PB_CURRENT`
- `Request`
- `CacheEntry`
- `CACHE_TIER_1H`
- `Clock`
- `Wallet`
- `Budget`
- `LedgerRow`
- `WireSegment`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `TapeRenderer`
- `TTLDrainBar`
- `MainCachePanel`
- `HoverPriceCalculator`
- `ToastSystem`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `CounterfactualOverlay`
- `ResultScreen`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

No instruction card and no pre-play comparison.

| Time | Beat |
|---:|---|
| `0.0s` | A workday timeline slides under the cursor. Five closed gap cards read **Coffee**, **Lunch**, **Meeting**, **Commute**, **Overnight**. Their durations are visible; their outcomes are not. |
| `0.4s` | The `MainCachePanel` shows a live 60-minute entry. Three draggable ping markers land beside the timeline with the label **“3 pings left.”** |
| `0.8s` | Copy: **“Tomorrow’s release is already cached. Plan the gaps.”** |
| `1.2s` | The Lunch card pulses once. Copy: **“Drag pings onto the day, then choose what your policy should protect.”** |
| `1.6s` | The player can drag a ping. |
| `2.0s` | Three policy chips appear: **Always ping**, **Never ping**, **Only bridge selected gaps**. No chip is described as correct. |

`firstInteractiveBySec = 1.6` `[ESTIMATE]`.

## 4. Exact event sequence

The scenario uses a `34,738`-token main prefix (`C6`), Sonnet pricing (`C3`), and the 60-minute tier (`C1`). Work requests add `100` fresh input tokens and `100` output tokens `[FICTION]`. Pings add `1` fresh input token and `1` output token `[FICTION]`.

1. **Enter the planner**
   - Event: screen mounts.
   - Action: `{ type: "ENTER_LEVEL", levelId: "L7" }`
   - Mutates: `ReducerState`, `Clock`, `Wallet`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`.
   - Numbers: clock `0m`; wallet `$0.70` `[FICTION]`; ping inventory `3` `[FICTION]`; TTL `60m` (`C1`).

2. **Prime the workday**
   - Event: opening work request runs automatically.
   - Action: `{ type: "SEND_REQUEST", request: REQ_OPEN }`
   - Mutates: `CacheEntry`, `LedgerRow[]`, `Wallet`, `lastRequests`.
   - Numbers: `writeTok=34,738`, `inputTok=100`, `outTok=100`; cost `$0.210228` (`C1`, `C3`, `C6`).
   - Toast: `toast-first-write`.

3. **Create the decision checkpoint**
   - Event: the opening tape settles.
   - Action: `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-plan", reason: "decision" }`
   - Mutates: `Checkpoint[]`.
   - Numbers: action boundary only; no request and no cost.

4. **Place lunch ping 1**
   - Event: player drags a marker to `50m` inside Lunch.
   - Action: `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 50 }`
   - Mutates: scheduled ping set and remaining ping inventory.
   - Numbers: inventory `3→2`; no ledger row until execution.

5. **Place lunch ping 2**
   - Event: player drags a marker to `100m` inside Lunch.
   - Action: `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 100 }`
   - Mutates: scheduled ping set and remaining ping inventory.
   - Numbers: inventory `2→1`.

6. **Place commute ping**
   - Event: player drags the final marker to `50m` inside Commute.
   - Action: `{ type: "PLACE_KEEP_WARM_PING", gapId: "commute", atMin: 50 }`
   - Mutates: scheduled ping set and remaining ping inventory.
   - Numbers: inventory `1→0`.

7. **Choose the selective policy**
   - Event: player chooses **Only bridge selected gaps**.
   - Action: `{ type: "SET_CFG", patch: { keepWarm: true, keepWarmMin: 50 } }`
   - Mutates: `cfg.keepWarm`, `cfg.keepWarmMin`.
   - Numbers: interval `50m` `[FICTION]`.

8. **Commit the first prediction**
   - Event: player presses **Run the day**.
   - Actions, in order:
     1. `{ type: "OPEN_PREDICTION", promptId: "pred-lunch" }`
     2. `{ type: "SELECT_PREDICTION", promptId: "pred-lunch", optionId: "two-pings-win" }`
     3. `{ type: "COMMIT_PREDICTION", promptId: "pred-lunch" }`
   - Mutates: `phase`, `prediction`.
   - Numbers: reveal remains locked.

9. **Coffee**
   - Event: advance through the `20m` Coffee gap.
   - Actions:
     1. `{ type: "ADVANCE", min: 20 }`
     2. `{ type: "SEND_REQUEST", request: REQ_AFTER_COFFEE }`
   - Mutates: `Clock`, `CacheEntry.lastTouchMin`, `LedgerRow[]`, `Wallet`.
   - Numbers: cache hit; `readTok=34,738`, `inputTok=100`, `outTok=100`; `$0.0122214` (`C1`, `C3`, `C6`).

10. **Lunch ping 1 executes**
    - Event: Lunch reaches `50m`.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: PING_LUNCH_1 }`
    - Mutates: `Clock`, `CacheEntry.lastTouchMin`, `LedgerRow[]`, `Wallet`.
    - Numbers: `readTok=34,738`, `inputTok=1`, `outTok=1`; `$0.0104394` (`C1`, `C3`, `C6`); TTL refreshes (`C12`).

11. **Lunch ping 2 executes**
    - Event: Lunch reaches `100m`.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: PING_LUNCH_2 }`
    - Mutates: same objects as step 10.
    - Numbers: `$0.0104394`; TTL refreshes (`C12`).

12. **Lunch reveal**
    - Event: Lunch ends `20m` after its second ping and work resumes.
    - Actions:
      1. `{ type: "ADVANCE", min: 20 }`
      2. `{ type: "SEND_REQUEST", request: REQ_AFTER_LUNCH }`
      3. `{ type: "REVEAL_PREDICTION", promptId: "pred-lunch", correctOptionId: "two-pings-win" }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`, `prediction`, `phase`.
    - Numbers: work request `$0.0122214`; two pings cost `$0.0208788`; avoided rewrite delta is `$0.1980066`; net saving `$0.1771278` (`C1`, `C3`, `C6`, `C20`).
    - Aha remains unstated; only the observed Lunch result is revealed.
    - Toast: `toast-lunch-paid`.

13. **Meeting**
    - Event: advance `50m`, then resume work.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: REQ_AFTER_MEETING }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`.
    - Numbers: no ping; cache remains live because `50<60`; request `$0.0122214` (`C1`, `C3`, `C6`).
    - Toast: `toast-no-ping-needed`.

14. **Commute prediction**
    - Event: Commute begins.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-commute" }`
      2. player selection
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-commute" }`
    - Mutates: `phase`, `prediction`.

15. **Commute ping and reveal**
    - Event: the `90m` gap runs.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: PING_COMMUTE }`
      3. `{ type: "ADVANCE", min: 40 }`
      4. `{ type: "SEND_REQUEST", request: REQ_AFTER_COMMUTE }`
      5. `{ type: "REVEAL_PREDICTION", promptId: "pred-commute", correctOptionId: "one-ping-win" }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`, `prediction`.
    - Numbers: ping `$0.0104394`; work hit `$0.0122214`; ping prevents a `$0.1980066` hit-to-rewrite delta (`C1`, `C3`, `C6`, `C20`).

16. **Overnight prediction**
    - Event: the `1,260m` Overnight card expands.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-overnight" }`
      2. player selection
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-overnight" }`
    - Mutates: `phase`, `prediction`.
    - Numbers: `1,260m = 21h` `[FICTION]`; maintaining a `50m` policy would require `25` pings `[FICTION]`.

17. **Abandon overnight — aha frame**
    - Event: no ping is scheduled; time advances and next-day work resumes.
    - Actions:
      1. `{ type: "ADVANCE", min: 1260 }`
      2. `{ type: "SEND_REQUEST", request: REQ_NEXT_DAY }`
      3. `{ type: "REVEAL_PREDICTION", promptId: "pred-overnight", correctOptionId: "let-expire" }`
    - Mutates: `Clock`, expired and replacement `CacheEntry`, `LedgerRow[]`, `Wallet`, `prediction`.
    - Numbers: next request rewrites `34,738` tokens and costs `$0.210228`; `25` hypothetical pings cost `$0.260985`, exceeding the `$0.1980066` rewrite delta. The `21h` gap also exceeds the `20h` 1-hour-tier break-even (`C19`, `C20`).
    - `ahaFrame=true`.
    - Copy revealed now: **“Lunch was worth tending. Overnight wasn’t.”**

18. **Submit understanding**
    - Event: player answers the transfer question and presses **Finish**.
    - Actions:
      1. `{ type: "ACK_EXPLANATION", explanationId: "keep-warm-rule" }`
      2. `{ type: "BEGIN_TRANSFER", challengeId: "classify-gaps" }`
      3. `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates: explanation evidence, transfer evidence, result state.
    - Numbers: reference total `$0.5006598`.

19. **Post-attempt counterfactual**
    - Event: result screen opens **Compare policies**.
    - Actions:
      1. `{ type: "REQUEST_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
      2. `{ type: "REVEAL_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
    - Mutates: comparison visibility only.
    - Numbers: selective `$0.5006598`; always `$0.5740776`; never `$0.8653548`.
    - Copy: **“Always paid past the rebuild. Never paid for avoidable rebuilds.”**

## 5. Level data

```ts
const L7: LevelDef = {
  id: "L7",
  tier: 2,
  title: "Keep It Alive",
  objective: "Three pings. Five gaps. Keep the day moving without babysitting it.",
  concept: {
    id: "keep-warm-break-even",
    privateDesignerSummary:
      "A keep-warm ping pays only while cumulative ping cost remains below the avoided rewrite.",
    postRevealRule:
      "Ping only while the pings cost less than rebuilding."
  },
  prerequisiteConceptIds: ["ttl-tier-tradeoff"],

  unlocks: "keepWarm",
  introducedControls: ["keepWarmMin"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "oneHourFlag", "hook", "skills", "skillsMode",
    "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 7007,
  budgetUsd: 0.70, // [FICTION]
  clockCapMin: 1590, // [FICTION]
  cfgOverride: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true,
    keepWarm: false,
    keepWarmMin: 50
  },
  scenario: "gaps",
  scenarioData: {
    gaps: [
      { id: "coffee", label: "Coffee", durationMin: 20 },
      { id: "lunch", label: "Lunch", durationMin: 120 },
      { id: "meeting", label: "Meeting", durationMin: 50 },
      { id: "commute", label: "Commute", durationMin: 90 },
      { id: "overnight", label: "Overnight", durationMin: 1260 }
    ],
    estimates: [
      { label: "budgetUsd", value: 0.70, tag: "[FICTION]" },
      { label: "availablePings", value: 3, tag: "[FICTION]" },
      { label: "workFreshInputTok", value: 100, tag: "[FICTION]" },
      { label: "workOutputTok", value: 100, tag: "[FICTION]" },
      { label: "pingFreshInputTok", value: 1, tag: "[FICTION]" },
      { label: "pingOutputTok", value: 1, tag: "[FICTION]" },
      { label: "coffeeMin", value: 20, tag: "[FICTION]" },
      { label: "lunchMin", value: 120, tag: "[FICTION]" },
      { label: "meetingMin", value: 50, tag: "[FICTION]" },
      { label: "commuteMin", value: 90, tag: "[FICTION]" },
      { label: "overnightMin", value: 1260, tag: "[FICTION]" }
    ]
  },

  gate: {
    predicateId: "l7-selective-policy",
    behavioralRequirements: [
      "exactly two pings occur during lunch",
      "exactly one ping occurs during commute",
      "no ping occurs during coffee, meeting, or overnight",
      "pred-overnight is committed before REQ_NEXT_DAY",
      "classify-gaps transfer answer is correct"
    ],
    explanationRequirement: "keep-warm-rule acknowledged",
    transferRequirement: "classify-gaps completed"
  },

  star2: {
    label: "Day planner",
    predicate: "pass && spentUsd <= 0.55",
    reason: "Bridge the useful gaps without costly extras."
  },
  star3: {
    label: "Exact caretaker",
    predicate:
      "pass && spentUsd === 0.5006598 && ping request count === 3",
    reason: "Use the three pings only where each remains cheaper than rebuilding."
  },

  referenceCfg: {
    oneHourFlag: true,
    keepWarm: true,
    keepWarmMin: 50
  },
  antiCfg: {
    oneHourFlag: true,
    keepWarm: false,
    keepWarmMin: 50
  },

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ]
};
```

`referenceCfg` is paired with scheduled pings at Lunch `50m/100m` and Commute `50m`. `antiCfg` represents **Never ping**. The post-attempt **Always ping** comparison uses the same seed with a `50m` policy over every gap.

## 6. Pricing walkthrough

Sonnet rates are input `$3/M`, read `$0.30/M`, 1-hour write `$6/M`, and output `$15/M` (`C1`, `C3`). The reusable prefix is `34,738` tokens (`C6`).

### Request prices

- **Cold work request**
  - `writeTok=34,738`: `34,738 × $6/M = $0.208428`
  - `inputTok=100`: `100 × $3/M = $0.000300`
  - `outTok=100`: `100 × $15/M = $0.001500`
  - **Total: `$0.210228`**

- **Warm work request**
  - `readTok=34,738`: `34,738 × $0.30/M = $0.0104214`
  - `inputTok=100`: `$0.000300`
  - `outTok=100`: `$0.001500`
  - **Total: `$0.0122214`**

- **Keep-warm ping**
  - `readTok=34,738`: `$0.0104214`
  - `inputTok=1`: `$0.000003`
  - `outTok=1`: `$0.000015`
  - **Total: `$0.0104394`**

- **Rewrite delta avoided by a successful ping chain**
  - `$0.210228 − $0.0122214 = $0.1980066`

### Per-gap evidence

| Gap | Reference action | Ping total | Rewrite delta avoided | Result |
|---|---|---:|---:|---|
| Coffee `20m` | No ping | `$0` | No expiry | Cache hit |
| Lunch `120m` | Two pings | `$0.0208788` | `$0.1980066` | Pings win by `$0.1771278` |
| Meeting `50m` | No ping | `$0` | No expiry | Cache hit |
| Commute `90m` | One ping | `$0.0104394` | `$0.1980066` | Ping wins by `$0.1875672` |
| Overnight `1,260m` | Let expire | hypothetical `$0.260985` | `$0.1980066` | Rebuild wins by `$0.0629784` |

The overnight result agrees with the `20h` 1-hour-tier keep-warm break-even (`C19`) and the decision rule in `C20`.

### Totals

- **3-star reference**
  - Two cold work requests: `2 × $0.210228 = $0.420456`
  - Four warm daytime work requests: `4 × $0.0122214 = $0.0488856`
  - Three pings: `3 × $0.0104394 = $0.0313182`
  - **Total: `$0.5006598`**

- **Never ping anti-pattern**
  - Four cold work requests: `4 × $0.210228 = $0.840912`
  - Two warm work requests: `2 × $0.0122214 = $0.0244428`
  - **Total: `$0.8653548`**

- **Always ping anti-pattern**
  - One cold work request: `$0.210228`
  - Five warm work requests: `5 × $0.0122214 = $0.061107`
  - Twenty-nine pings: `29 × $0.0104394 = $0.3027426`
  - **Total: `$0.5740776`**

The always-policy ping count is `2` Lunch + `1` Meeting + `1` Commute + `25` Overnight. Coffee needs none because it ends before the first `50m` interval. This comparison is hidden until the player completes an attempt.

## 7. Tape sequence

`TapeRenderer.rowSource = "ledger"`.

Exact 3-star order:

1. `REQ_OPEN` — write `34,738`; input `100`; output `100`
2. `REQ_AFTER_COFFEE` — read `34,738`; input `100`; output `100`
3. `PING_LUNCH_1` — read `34,738`; input `1`; output `1`
4. `PING_LUNCH_2` — read `34,738`; input `1`; output `1`
5. `REQ_AFTER_LUNCH` — read `34,738`; input `100`; output `100`
6. `REQ_AFTER_MEETING` — read `34,738`; input `100`; output `100`
7. `PING_COMMUTE` — read `34,738`; input `1`; output `1`
8. `REQ_AFTER_COMMUTE` — read `34,738`; input `100`; output `100`
9. `REQ_NEXT_DAY` — write `34,738`; input `100`; output `100`

Reveal groups:

- `opening`: `REQ_OPEN`
- `coffee`: `REQ_AFTER_COFFEE`
- `lunch`: `PING_LUNCH_1`, `PING_LUNCH_2`, `REQ_AFTER_LUNCH`; gated by `pred-lunch`
- `meeting`: `REQ_AFTER_MEETING`
- `commute`: `PING_COMMUTE`, `REQ_AFTER_COMMUTE`; gated by `pred-commute`
- `overnight`: `REQ_NEXT_DAY`; gated by `pred-overnight`

`ahaRequestId = "REQ_NEXT_DAY"`.

At the aha frame, the Overnight card expands into two aligned totals:

- **25 pings: `$0.260985`**
- **Let expire, then rebuild: `$0.210228`**

Only then does the timeline annotate Lunch and Commute with **“worth it”** and Overnight with **“stop here.”**

## 8. Prediction prompts

### `pred-lunch`

**Question:** “Lunch is 120 minutes. What will two pings do to the next request?”

Options:

- `two-pings-win`: **“Keep it blue, for less than a rewrite.”**
- `two-pings-lose`: **“Cost more than letting it expire.”**
- `still-expires`: **“Expire before lunch ends anyway.”**

Correct: `two-pings-win`.

### `pred-commute`

**Question:** “One ping sits 50 minutes into a 90-minute commute. What reaches the other side?”

Options:

- `one-ping-win`: **“The saved context.”**
- `cache-expires`: **“A rewrite.”**
- `same-cost`: **“Exactly the same bill.”**

Correct: `one-ping-win`.

### `pred-overnight`

**Question:** “The overnight gap is 21 hours. Which bill will be smaller?”

Options:

- `let-expire`: **“Let it expire, then rebuild.”**
- `keep-pinging`: **“Ping every 50 minutes.”**
- `same-cost`: **“They meet at the same price.”**

Correct: `let-expire`.

### Transfer prompt

**Question:** “A new gap needs 4 pings. Together they cost `$0.0417576`; the rewrite delta is `$0.1980066`. Protect it?”

Options:

- **“Yes — the pings are still cheaper.”** — correct
- **“No — any expiry risk means rebuild.”**
- **“Only if the gap has a meeting label.”**

The transfer values are derived from the same request prices (`C1`, `C3`, `C6`, `C20`).

## 9. Fail-state

Two local failures use `PATTERN_FAIL_FREEZE_REWIND`.

### Failure A — never ping

- **Decisive event:** `REQ_AFTER_LUNCH` becomes a cold rewrite.
- Action:
  ```ts
  {
    type: "FREEZE_FAILURE",
    failure: {
      failureId: "fail-lunch-rewrite",
      causeCode: "PING_UNDERSPEND",
      message:
        "Lunch expired the cache: $0.0208788 of pings would have avoided a $0.1980066 rewrite delta.",
      checkpointId: "cp-plan"
    }
  }
  ```
- Highlight: Lunch gap, empty ping slots, expired `CacheEntry`, write segment, wallet delta.
- Timeline itemization:
  - **Pings skipped: `$0.0208788`**
  - **Extra rewrite paid: `$0.1980066`**
- Rewind: **“Rewind to ping placement”** dispatches `{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-plan" }`. Opening request and its explanation do not replay.

### Failure B — always ping

- **Decisive event:** the twentieth overnight ping makes cumulative overnight ping cost exceed the rewrite delta.
- At ping 19: `$0.1983486 > $0.1980066`.
- Action:
  ```ts
  {
    type: "FREEZE_FAILURE",
    failure: {
      failureId: "fail-overnight-overping",
      causeCode: "PING_OVERSPEND",
      message:
        "Overnight ping 19 crossed the line: $0.1983486 in pings now costs more than the rewrite it avoids.",
      checkpointId: "cp-plan"
    }
  }
  ```
- Highlight: ping 19, cumulative ping meter, rewrite-delta marker.
- Rewind restores `cp-plan`; the player can remove overnight coverage without replaying the opening.

## 10. Gate & stars

### Pass predicate

`pass(st)` returns true only when all are true:

- Lunch contains exactly two executed pings.
- Commute contains exactly one executed ping.
- Coffee, Meeting, and Overnight contain zero executed pings.
- `pred-lunch`, `pred-commute`, and `pred-overnight` were committed before their gated reveals.
- `pred-overnight.optionId === "let-expire"`.
- The transfer prompt is answered **“Yes — the pings are still cheaper.”**
- `keep-warm-rule` is acknowledged after the aha frame.
- The attempt reaches `REQ_NEXT_DAY`.

Budget alone cannot pass the level.

### Stars

- **1 star:** behavioral pass.
- **2 stars:** pass and spend at most `$0.55` `[FICTION]`.
- **3 stars:** pass, execute exactly three pings, and spend exactly `$0.5006598` before display rounding.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `toast-first-write` | `REQ_OPEN` resolves | **“Day started. Saved context is live for 60 idle minutes.”** |
| `toast-lunch-ping-1` | `PING_LUNCH_1` resolves | **“Ping · `$0.0104394`. The idle clock restarts.”** |
| `toast-lunch-paid` | `REQ_AFTER_LUNCH` resolves | **“Lunch crossed safely: `$0.0208788` in pings avoided a `$0.1980066` rewrite delta.”** |
| `toast-no-ping-needed` | `REQ_AFTER_MEETING` resolves | **“50 minutes. Still alive without a ping.”** |
| `toast-commute-paid` | `REQ_AFTER_COMMUTE` resolves | **“One small ping bridged the commute.”** |
| `toast-overnight-line` | Overnight comparison reveals | **“Past 20 hours, tending this 1-hour cache costs more than rebuilding.”** |
| `toast-rule` | explanation acknowledged | **“Keep-warm is a price comparison, not a promise.”** |

The term **keep-warm ping** first appears when the player places the first marker. The `20h` break-even is not shown until `pred-overnight` is committed and revealed.

## 12. QA gate

Real-browser click-through must assert:

1. The first draggable ping is usable by `1.6s` `[ESTIMATE]`.
2. No copy before the first attempt states which gaps should receive pings.
3. Lunch, Commute, and Overnight outcomes cannot reveal before their prediction is committed.
4. Pointer drag and keyboard placement dispatch identical `PLACE_KEEP_WARM_PING` actions.
5. Policy chips are keyboard reachable and expose selected state.
6. Reference play yields exactly `9` `LedgerRow`s and exactly `9` tape rows.
7. Each priced request produces one ledger row; each tape row maps to that request.
8. All request costs are positive.
9. No positive amount displays as `$0.0000`; ping input/output details retain sufficient precision.
10. Every price equals `PRICE_REQUEST` using `C1`, `C3`, and `C6`.
11. Reference total is exactly `$0.5006598` before rounding.
12. Never-ping total is exactly `$0.8653548`.
13. Always-ping total is exactly `$0.5740776`.
14. Overnight ping 19 freezes at cumulative `$0.1983486`, before further economic actions.
15. Rewind to `cp-plan` deterministically preserves the opening ledger row and restores all three ping markers.
16. Static tape bars render immediately without hover.
17. Hover calculations sum to the authoritative row cost.
18. `TTLDrainBar` refreshes on each successful ping (`C12`).
19. Reduced-motion mode produces identical actions, ledger rows, costs, and reveal order.
20. The three-policy comparison is absent before `COMPLETE_ATTEMPT`.
21. The fixed seed is winnable without hidden controls.
22. `referenceCfg` passes the behavioral gate.
23. `antiCfg` fails at Lunch for the intended causal reason.
24. Wallet arithmetic uses unrounded values and may visibly cross the budget in anti-pattern runs.
25. The result screen reports behavior separately from budget.

## 13. Reference-bar justification

The screen opens directly on a tactile day planner, gives the player one legible resource—three pings—and withholds the governing rule. Short gaps establish intuition through motion; Lunch rewards intervention; Meeting rewards restraint; Overnight overturns the tempting “keep everything alive” strategy only after a committed prediction.

Failure stops on the exact ping or rewrite that changed the comparison, itemizes the two competing costs, and rewinds to the placement decision. The post-attempt three-policy overlay confirms the discovered rule without pre-solving the toy. That rhythm—touch, predict, observe, revise, transfer—keeps the lesson causal and gives both extremes a vivid, local consequence.
