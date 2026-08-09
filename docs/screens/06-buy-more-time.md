# Level 6 — Buy More Time?

## 1. Identity

- `id`: `L6`
- `title`: **Buy More Time?**
- `tier`: `1`
- `objective`: **Choose a write for each work block. The gaps stay hidden until you commit.**
- ONE concept: the higher-premium write tier is worthwhile only when its longer TTL prevents enough rewrites.
- Prerequisite concepts: TTL expiry, cache reads versus writes, write/read cost.
- `concept.id`: `cache-tier-break-even`
- `concept.privateDesignerSummary`: Compare the 5-minute and 1-hour write tiers against the actual gap pattern.
- `concept.postRevealRule`: **Paying for longer life is worthwhile only when it prevents enough rewrites.**
- Unlock: `oneHourFlag`
- Introduced control: `oneHourFlag`
- Previously introduced controls remain locked except `run`.

## 2. Objects used

- `Request`
- `PricedRequest`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `CACHE_TIER_5M`
- `CACHE_TIER_1H`
- `RATE_CACHE_READ`
- `RATE_CACHE_WRITE_5M`
- `RATE_CACHE_WRITE_1H`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interactive control appears by `1s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Two face-down workday strips land on the desk: **MONDAY** and **TUESDAY**. Each contains four work-block cards separated by covered gaps. |
| `0.4s` | System copy: **“Four blocks today. The gaps are under the tape.”** |
| `0.8s` | The first block exposes two equal-weight buttons: **“Write · 5 min”** and **“Write · 1 hour”**. No rate, TTL comparison, recommendation, color cue, or future schedule is shown. |
| `1.0s` | Player may choose. Dispatch `CREATE_CHECKPOINT { checkpointId: "cp-r1-tier", reason: "decision" }`. |
| After all Monday choices | Copy: **“Lock Monday, then call your shot.”** Open `pred-r1`. |
| After Monday reveal | Tuesday slides forward with the same four covered gaps. Copy: **“New day. Same choice. New rhythm.”** |
| After all Tuesday choices | Open `pred-r2`; the schedule remains covered until commitment. |

The opening never names the cheaper tier, the gap lengths, the break-even ratio, or the number of rebuilds either tier will avoid.

## 4. Exact event sequence

All requests use Sonnet and a byte-identical `26,237`-token cacheable prefix (`C10`), with `freshInputTok=0` and `expectedOutputTok=0`. Gap timings are scenario fixtures marked `[FICTION]`. Dollar mutations use unrounded `PRICE_REQUEST` results.

1. **Enter level**
   - Event: screen opens.
   - Action: `ENTER_LEVEL { levelId: "L6" }`.
   - Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, `MAIN_SESSION_CONTEXT`, empty `CacheEntry` collection, empty ledger, attempt state.
   - Numbers: wallet `$0.60` `[FICTION]`; clock `0m`; ledger rows `0`.

2. **Checkpoint Monday**
   - Event: Monday tier controls become active.
   - Action: `CREATE_CHECKPOINT { checkpointId: "cp-r1-tier", reason: "decision" }`.
   - Mutates: `Checkpoint[]`.
   - Numbers: action boundary only; `$0`.

3. **Choose Monday writes**
   - Event: player chooses **5 min** or **1 hour** on each of `r1-b1…r1-b4`.
   - Action per card: `SELECT_WRITE_TIER { blockId, tier }`.
   - Mutates: selected tier for each block; no cache, ledger, clock, or wallet mutation.
   - Numbers: `4` choices `[FICTION]`.

4. **Predict Monday**
   - Event: fourth choice locks.
   - Actions:
     - `OPEN_PREDICTION { promptId: "pred-r1" }`
     - `SELECT_PREDICTION { promptId: "pred-r1", optionId }`
     - `COMMIT_PREDICTION { promptId: "pred-r1" }`
   - Mutates: `prediction`, `phase`.
   - Numbers: reveal remains blocked until commitment.

5. **Monday block 1**
   - Event: player presses **Run Monday** after committing.
   - Action: `SEND_REQUEST { request: r1-b1 }`.
   - Mutates: `CacheEntry`, ledger, `lastRequests`, `Wallet`, tape payload.
   - If `5m`: `writeTok=26,237`; cost `26,237×1.25×$3/M=$0.09838875` (`C1`, `C3`, `C10`); expiry `5m`.
   - If `1h`: `writeTok=26,237`; cost `26,237×2×$3/M=$0.157422` (`C1`, `C3`, `C10`); expiry `60m`.

6. **Reveal Monday gap 1**
   - Event: first cover peels back only after request 1.
   - Action: `ADVANCE { min: 2 }`.
   - Mutates: `Clock`; live entry derives `3m` remaining for 5m or `58m` for 1h.
   - Numbers: gap `2m` `[FICTION]`.

7. **Monday block 2**
   - Event: scan head reaches block 2.
   - Action: `SEND_REQUEST { request: r1-b2 }`.
   - Mutates: ledger, wallet, tape, `CacheEntry.lastTouchMin`, expiry.
   - Both tiers hit: `readTok=26,237`; cost `26,237×0.1×$3/M=$0.0078711` (`C1`, `C3`, `C10`, `C12`).
   - Successful read refreshes the selected entry’s TTL (`C12`).

8. **Monday blocks 3–4**
   - Events and actions, in order:
     - `ADVANCE { min: 2 }`
     - `SEND_REQUEST { request: r1-b3 }`
     - `ADVANCE { min: 2 }`
     - `SEND_REQUEST { request: r1-b4 }`
   - Mutates: `Clock`, ledger, wallet, tape, cache touch/expiry after each hit.
   - Numbers: each gap `2m` `[FICTION]`; each request reads `26,237` tokens for `$0.0078711` (`C1`, `C3`, `C10`, `C12`).

9. **Reveal Monday result**
   - Event: fourth request lands.
   - Action: `REVEAL_PREDICTION { promptId: "pred-r1", correctOptionId: "five-minute" }`.
   - Mutates: prediction result, phase; uncovers Monday schedule and totals.
   - Numbers:
     - all-5m total: `$0.09838875 + 3×$0.0078711 = $0.12200205`;
     - all-1h total: `$0.157422 + 3×$0.0078711 = $0.18103530`;
     - 1h premium with rebuilds avoided `0`: `$0.05903325`.
   - Aha is not stated yet; evidence copy: **“Every next block arrived while the short write was still alive.”**

10. **Monday causal failure**
    - Event: the player used 1h on any Monday block that required a write.
    - Action: `FREEZE_FAILURE { failure: { failureId: "fail-r1-premium", causeCode: "PREMIUM_NO_REBUILD_AVOIDED", message: "Monday stayed clustered. The longer write cost $0.05903 more and prevented no rebuild.", checkpointId: "cp-r1-tier" } }`.
    - Mutates: `clock.frozen`, `frozenFailure`, phase.
    - Numbers: `$0.05903325` premium (`C1`, `C3`, `C10`).
    - `UI_REWIND_CONTROL` label: **“Choose Monday again”**.
    - Rewind action: `REWIND_TO_CHECKPOINT { checkpointId: "cp-r1-tier" }`.

11. **Begin Tuesday**
    - Event: Monday passes with all four choices set to 5m.
    - Actions:
      - `DISCARD_CONTEXT { contextId: "main-l6-monday" }`
      - `ADVANCE { min: 24 }`
      - `CREATE_CHECKPOINT { checkpointId: "cp-r2-tier", reason: "decision" }`
    - Mutates: Monday cache namespace cleared; clock advances from `6m` to `30m`; Tuesday context starts cold; checkpoint added.
    - Numbers: day-separation advance `24m` `[FICTION]`; this action creates no ledger row and no cost.

12. **Choose and predict Tuesday**
    - Event: player chooses a tier for `r2-b1…r2-b4`, then locks the day.
    - Actions:
      - four `SELECT_WRITE_TIER { blockId, tier }`
      - `OPEN_PREDICTION { promptId: "pred-r2" }`
      - `SELECT_PREDICTION { promptId: "pred-r2", optionId }`
      - `COMMIT_PREDICTION { promptId: "pred-r2" }`
    - Mutates: selected tiers, prediction, phase.
    - Numbers: four choices `[FICTION]`; no economic mutation before Run.

13. **Tuesday block 1**
    - Event: player presses **Run Tuesday**.
    - Action: `SEND_REQUEST { request: r2-b1 }`.
    - Mutates: Tuesday `CacheEntry`, ledger, wallet, tape.
    - If `5m`: `$0.09838875`; if `1h`: `$0.157422` (`C1`, `C3`, `C10`).

14. **Reveal Tuesday gap 1**
    - Event: first cover peels back.
    - Action: `ADVANCE { min: 30 }`.
    - Mutates: `Clock`; 5m entry derives expired, 1h entry derives `30m` remaining.
    - Numbers: gap `30m` `[FICTION]`; TTLs `5m`/`60m` (`C1`).

15. **Tuesday block 2 — decisive transfer**
    - Event: scan head reaches block 2.
    - Action: `SEND_REQUEST { request: r2-b2 }`.
    - Mutates: ledger, wallet, tape, cache.
    - With 5m: entry expired, so `writeTok=26,237`; cost `$0.09838875`.
    - With 1h: entry live, so `readTok=26,237`; cost `$0.0078711`.
    - This is `ahaFrame=true`: the same gap turns the two purchases into visibly different buckets.

16. **Tuesday short-tier failure**
    - Event: `r2-b2` rewrites under the 5m choice.
    - Action: `FREEZE_FAILURE { failure: { failureId: "fail-r2-expiry", causeCode: "SHORT_TTL_REBUILD", message: "Block 2 arrived 30 minutes later. The 5-minute entry expired, so all 26,237 tokens rewrote.", checkpointId: "cp-r2-tier" } }`.
    - Mutates: clock frozen at the completed decisive request; failure state.
    - Numbers: arrival gap `30m` `[FICTION]`; TTL `5m`; rewrite `26,237` tokens; `$0.09838875` (`C1`, `C3`, `C10`).
    - Rewind label: **“Choose Tuesday again”**.
    - Rewind action: `REWIND_TO_CHECKPOINT { checkpointId: "cp-r2-tier" }`.

17. **Tuesday blocks 3–4**
    - Preconditions: Tuesday choices are 1h.
    - Events and actions:
      - `ADVANCE { min: 30 }`
      - `SEND_REQUEST { request: r2-b3 }`
      - `ADVANCE { min: 30 }`
      - `SEND_REQUEST { request: r2-b4 }`
    - Mutates: clock, ledger, wallet, tape, refreshed cache expiry.
    - Numbers: each gap `30m` `[FICTION]`; each hit reads `26,237` tokens for `$0.0078711` (`C1`, `C3`, `C10`, `C12`).

18. **Reveal Tuesday result**
    - Event: fourth Tuesday request lands.
    - Action: `REVEAL_PREDICTION { promptId: "pred-r2", correctOptionId: "one-hour" }`.
    - Mutates: prediction result, phase; uncovers the full Tuesday schedule and totals.
    - Numbers:
      - all-1h: `$0.157422 + 3×$0.0078711 = $0.18103530`;
      - all-5m: `4×$0.09838875 = $0.39355500`;
      - 1h saves `$0.21251970`;
      - rebuilds avoided: `3`.

19. **Complete attempt and unlock comparison**
    - Event: both days have resolved.
    - Actions:
      - `COMPLETE_ATTEMPT`
      - `REQUEST_COUNTERFACTUAL { comparisonId: "cf-tier-break-even" }`
      - `REVEAL_COUNTERFACTUAL { comparisonId: "cf-tier-break-even" }`
    - Mutates: gate result, stars, result summary, `UI_COUNTERFACTUAL_OVERLAY`.
    - Numbers:
      - reference total: `$0.12200205 + $0.18103530 = $0.30303735`;
      - anti-pattern total: `$0.18103530 + $0.39355500 = $0.57459030`;
      - anti-pattern delta: `$0.27155295`.
    - Only now reveal:
      - write premium: `(2−1.25)=0.75` base-rate units;
      - one avoided 5m rebuild is worth `(1.25−0.1)=1.15` base-rate units;
      - ratio: `0.75/1.15=0.652173…` (`C21`).
    - Reveal copy: **“The extra hour-write premium is about 0.65 of one avoided rebuild. Monday avoided none; Tuesday avoided three.”**
    - Post-reveal rule appears only here: **“Buy longer life when the schedule will prevent enough rewrites.”**

## 5. Level data

```ts
const L6: LevelDef = {
  id: "L6",
  tier: 1,
  title: "Buy More Time?",
  objective: "Choose a write for each work block. The gaps stay hidden until you commit.",
  concept: {
    id: "cache-tier-break-even",
    privateDesignerSummary:
      "The 1-hour write premium pays only when the gap pattern prevents enough 5-minute rewrites.",
    postRevealRule:
      "Paying for longer life is worthwhile only when it prevents enough rewrites.",
  },
  prerequisiteConceptIds: ["cache-ttl-expiry", "cache-read-write-cost"],

  unlocks: "oneHourFlag",
  introducedControls: ["oneHourFlag"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "keepWarm", "keepWarmMin", "hook", "skills",
    "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 60065,
  budgetUsd: 0.60, // [FICTION]
  clockCapMin: 120, // [FICTION]
  cfgOverride: {
    orchestratorModel: "sonnet",
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: false,
    keepWarm: false,
  },
  scenario: "gaps",
  scenarioData: {
    units: [
      { id: "r1-b1" }, { id: "r1-b2" }, { id: "r1-b3" }, { id: "r1-b4" },
      { id: "r2-b1" }, { id: "r2-b2" }, { id: "r2-b3" }, { id: "r2-b4" }
    ],
    contexts: [
      { id: "main-l6-monday", kind: "main" },
      { id: "main-l6-tuesday", kind: "main" }
    ],
    gaps: [
      { id: "r1-g1", min: 2 }, { id: "r1-g2", min: 2 }, { id: "r1-g3", min: 2 },
      { id: "r2-g1", min: 30 }, { id: "r2-g2", min: 30 }, { id: "r2-g3", min: 30 }
    ],
    allowedCfg: { oneHourFlag: [false, true] },
    estimates: [
      { label: "Monday gap", value: 2, tag: "[FICTION]" },
      { label: "Tuesday gap", value: 30, tag: "[FICTION]" },
      { label: "Level wallet", value: 0.60, tag: "[FICTION]" },
      { label: "Clock cap", value: 120, tag: "[FICTION]" }
    ]
  },

  gate: {
    predicateId: "l6-correct-tier-by-gap-pattern",
    behavioralRequirements: [
      "all r1-b1…r1-b4 choices are 5m",
      "all r2-b1…r2-b4 choices are 1h",
      "pred-r1 and pred-r2 were committed before their reveals"
    ],
    explanationRequirement:
      "player acknowledged explanation cache-tier-break-even after both causal tapes",
    transferRequirement:
      "Tuesday is completed with 1h after observing or predicting the 30m-gap consequence"
  },

  star2: {
    label: "Read both rhythms",
    predicate: "pred-r1 and pred-r2 select the correct cheaper tier",
    reason: "Correctly predicted which tier each hidden schedule would reward."
  },
  star3: {
    label: "No wasted rebuilds",
    predicate:
      "reference choices on the completed branch and spentUsd <= 0.30303735",
    reason: "Used 5m for clustered work and 1h for spaced work."
  },

  referenceCfg: { oneHourFlag: false }, // scenario patch: Monday 5m, Tuesday 1h
  antiCfg: { oneHourFlag: true },       // scenario patch: Monday 1h, Tuesday 5m

  counterfactuals: [{
    id: "cf-tier-break-even",
    unlockAfterEventId: "complete-attempt",
    kind: "alternate-choice",
    cfg: {},
    scenarioPatch: {
      estimates: [{
        label: "Inverted choices: Monday 1h, Tuesday 5m",
        value: 0.57459030,
        tag: "[FICTION]"
      }]
    },
    comparisonQuestion:
      "What did the write premium buy on each schedule?",
    revealCopy:
      "The extra hour-write premium is about 0.65 of one avoided rebuild. Monday avoided none; Tuesday avoided three."
  }],

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ]
};
```

`referenceCfg` and `antiCfg` require the stated per-round scenario patches because a single legacy `oneHourFlag` cannot encode opposite choices across two days.

## 6. Pricing walkthrough

Model: Sonnet, `$3/M` base (`C3`). Cacheable prefix: `26,237` tokens (`C10`). Output is deliberately absent because output pricing is not this level’s concept.

| Request class | Buckets | Equation | Exact USD |
|---|---|---:|---:|
| 5m cold write | `writeTok=26,237` | `26,237×1.25×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.09838875` |
| 1h cold write | `writeTok=26,237` | `26,237×2×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.15742200` |
| Warm read | `readTok=26,237` | `26,237×0.1×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.00787110` |

### Monday: `2m, 2m, 2m` gaps `[FICTION]`

| Choice | Request sequence | Total |
|---|---|---:|
| 5m | write5m, read, read, read | `$0.12200205` |
| 1h | write1h, read, read, read | `$0.18103530` |

The longer tier pays `$0.05903325` more and prevents `0` rebuilds.

### Tuesday: `30m, 30m, 30m` gaps `[FICTION]`

| Choice | Request sequence | Total |
|---|---|---:|
| 5m | write5m, write5m, write5m, write5m | `$0.39355500` |
| 1h | write1h, read, read, read | `$0.18103530` |

The longer tier prevents `3` rebuilds and saves `$0.21251970`.

### Totals

- 3-star reference: Monday 5m + Tuesday 1h = **`$0.30303735`**.
- Anti-pattern: Monday 1h + Tuesday 5m = **`$0.57459030`**.
- Anti-pattern penalty: **`$0.27155295`**.
- One-hour premium per cold write: `26,237×(2−1.25)×3/M = $0.05903325`.
- One avoided 5m rebuild: `26,237×(1.25−0.1)×3/M = $0.09051765`.
- Premium/avoided-rebuild value: `$0.05903325/$0.09051765 = 0.652173…` (`C21`), concealed until both rounds resolve.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`; hover enabled.

Ordered reference rows:

1. `r1-b1`: **MON · BLOCK 1** — red `write`, `26,237`, `$0.09838875`.
2. `r1-b2`: **MON · BLOCK 2** — blue `read`, `26,237`, `$0.00787110`.
3. `r1-b3`: **MON · BLOCK 3** — blue `read`, `26,237`, `$0.00787110`.
4. `r1-b4`: **MON · BLOCK 4** — blue `read`, `26,237`, `$0.00787110`.
5. `r2-b1`: **TUE · BLOCK 1** — red `write`, `26,237`, `$0.15742200`.
6. `r2-b2`: **TUE · BLOCK 2** — blue `read`, `26,237`, `$0.00787110`.
7. `r2-b3`: **TUE · BLOCK 3** — blue `read`, `26,237`, `$0.00787110`.
8. `r2-b4`: **TUE · BLOCK 4** — blue `read`, `26,237`, `$0.00787110`.

Reveal groups:

- `monday-tape`: `r1-b1…r1-b4`, gated by `pred-r1`.
- `tuesday-first-gap`: `r2-b1,r2-b2`, gated by `pred-r2`.
- `tuesday-rest`: `r2-b3,r2-b4`, available after the decisive transfer.

`ahaRequestId = "r2-b2"`: freeze the scan head with the `30 MIN` gap label between `r2-b1` and `r2-b2`, the live/expired `UI_TTL_DRAIN_BAR`, and the resulting blue read or red rewrite simultaneously visible. No ratio appears in this frame.

The counterfactual overlay pairs each actual row with the same block under the alternate tier and labels only:

- **WRITE PREMIUM**
- **REBUILDS AVOIDED**
- **DAY TOTAL**

## 8. Prediction prompts

### `pred-r1`

Question: **“When Monday finishes, which write do you think will have cost less?”**

Options:

- `five-minute`: **“5-minute writes”**
- `one-hour`: **“1-hour writes”**
- `same`: **“They’ll tie”**

Reveal is blocked until `COMMIT_PREDICTION`. Correct option: `five-minute`.

Post-reveal causal sentence: **“The short gaps kept both entries alive, so the longer write bought no extra reads.”**

### `pred-r2`

Question: **“New schedule, still hidden: which write will cost less by block four?”**

Options:

- `five-minute`: **“5-minute writes”**
- `one-hour`: **“1-hour writes”**
- `same`: **“They’ll tie”**

Reveal is blocked until `COMMIT_PREDICTION`. Correct option: `one-hour`.

Post-reveal causal sentence: **“Thirty-minute gaps expired the short entry, while each long-tier read refreshed its hour.”**

Predictions never affect score directly; stars reward correct committed predictions as behavioral evidence.

## 9. Fail-state

### Monday: premium without benefit

- Decisive event: `r1-b4` completes and proves every short-tier entry would have remained live.
- Freeze copy: **“Monday stayed clustered. The longer write cost $0.05903 more and prevented no rebuild.”**
- Highlight: Monday’s first write premium, three equal read rows, and `0 REBUILDS AVOIDED`.
- Rewind: `REWIND_TO_CHECKPOINT "cp-r1-tier"` restores the four Monday choices while preserving the cold-open and committed prediction.

### Tuesday: first expired short write

- Decisive event: `r2-b2` resolves after the first `30m` gap as a rewrite under `CACHE_TIER_5M`.
- Freeze copy: **“Block 2 arrived 30 minutes later. The 5-minute entry expired, so all 26,237 tokens rewrote.”**
- Highlight: expired `CacheEntry`, `30 MIN` gap, and red `r2-b2` write segment.
- Rewind: `REWIND_TO_CHECKPOINT "cp-r2-tier"` restores Tuesday choices without replaying Monday.

After either day’s meaningful attempt, `UI_COUNTERFACTUAL_OVERLAY` may show write premium versus rebuilds avoided. The `0.652173…` ratio remains locked until both days have produced causal evidence.

## 10. Gate & stars

Pass predicate:

```ts
pass =
  mondayTierChoices.every(tier => tier === "5m") &&
  tuesdayTierChoices.every(tier => tier === "1h") &&
  prediction("pred-r1").committedBeforeReveal &&
  prediction("pred-r2").committedBeforeReveal &&
  explanationAcknowledged("cache-tier-break-even") &&
  transferCompleted("tuesday-spaced-work");
```

Budget alone cannot pass the level.

- **1 star — Pattern matched:** pass predicate true.
- **2 stars — Read both rhythms:** pass predicate true and both committed predictions selected the eventual cheaper tier.
- **3 stars — No wasted rebuilds:** 2-star predicate, reference branch completed, `spentUsd <= $0.30303735`, and no failure branch remains active.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `toast-tier-choice` | First `SELECT_WRITE_TIER` | **“You’re buying how long this write can wait for its next read.”** |
| `toast-monday-live` | `r1-b2` hits after the first `2m` gap | **“Still alive. This block reads the saved 26,237 tokens.”** |
| `toast-monday-premium` | Monday resolves with 1h | **“Extra lifetime bought; no rebuild avoided.”** |
| `toast-tuesday-expired` | `r2-b2` rewrites under 5m | **“Expired after 5 idle minutes. Block 2 has to write again.”** |
| `toast-tuesday-refresh` | `r2-b2` reads under 1h | **“Read at 30 minutes. The idle clock refreshes.”** |
| `toast-counterfactual` | `REVEAL_COUNTERFACTUAL "cf-tier-break-even"` | **“Premium ÷ one avoided rebuild ≈ 0.65. The schedule decides whether you earn that rebuild back.”** |

All teaching toasts dedupe per attempt. Failure cause toasts remain visible while frozen.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. First tier control is interactive by `1s` `[ESTIMATE]`; no instruction card blocks it.
2. Covered gaps expose no timing, relative width, color, tooltip, accessibility label, or DOM text before the relevant prediction commits.
3. `Run Monday` and `Run Tuesday` remain disabled until their predictions are committed.
4. Monday always resolves the fixed `2m,2m,2m` schedule; Tuesday always resolves `30m,30m,30m` from seed `60065`.
5. Every `SEND_REQUEST` yields exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row.
6. Reference completion yields exactly eight request rows.
7. Non-request actions—tier selection, prediction, checkpoint, advance, discard, freeze, rewind, and counterfactual request—yield no ledger row.
8. Every request cost is positive and matches `PRICE_REQUEST`.
9. Exact request prices are `$0.09838875`, `$0.15742200`, or `$0.00787110` as specified.
10. No positive price renders as `$0.0000`.
11. A 5m entry is live after `2m`, expired after `30m`; a 1h entry is live after `30m` (`C1`).
12. Every successful read refreshes `lastTouchMin` and expiry (`C12`).
13. Monday 5m total is `$0.12200205`; Monday 1h total is `$0.18103530`.
14. Tuesday 5m total is `$0.39355500`; Tuesday 1h total is `$0.18103530`.
15. Reference total is `$0.30303735`; anti-pattern total is `$0.57459030`.
16. The `0.652173…` ratio and its interpretation are absent from pre-play copy, prediction options, hidden DOM, hover text, and accessibility text.
17. `REVEAL_COUNTERFACTUAL` is rejected before a meaningful attempt and remains ratio-redacted until both days resolve.
18. Failure freezes after the decisive request is priced and rendered; it never rolls back the evidence before freezing.
19. Monday rewind returns byte-identically to `cp-r1-tier`; Tuesday rewind returns byte-identically to `cp-r2-tier`.
20. Rewind retains mastered earlier-day evidence and does not replay the cold-open.
21. Reference choices pass; inverted choices trigger the intended causal failure and fail the behavioral gate.
22. Final tape colors and prices render without hover.
23. `UI_HOVER_PRICE_CALCULATOR` equations reconcile with authoritative ledger totals.
24. Pointer and keyboard paths dispatch equivalent action sequences.
25. Reduced-motion mode exposes identical final rows, failures, totals, and gate evidence.
26. `UI_RESULT_SCREEN` names why each star was earned or missed and offers **“Try the days again”** / **“Continue”**.
27. The level is winnable from seed `60065` without undocumented controls.

## 13. Reference-bar justification

The screen opens on one tactile choice, withholds the schedule, and makes the player commit twice before evidence appears. Monday creates a compact expectation; Tuesday transfers the same control into a different rhythm and freezes on the first causal divergence. Only after both attempts does the counterfactual attach the numerical `C21` rule to evidence the player already produced. The loop is therefore action → prediction → reveal → local rewind → transfer → concise rule, with no pre-play answer key.
