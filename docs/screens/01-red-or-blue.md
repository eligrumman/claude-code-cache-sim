# Level 1 — Bob’s Login Bug

## 1. Identity

- `id`: `"01-red-or-blue"`
- `title`: `Bob’s Login Bug`
- `tier`: `1`
- `objective`: “Finish Bob’s login, logout, and test work without draining his $0.30 wallet.”
- ONE concept: Reusing an unchanged context converts the saved prefix from `RATE_CACHE_WRITE_1H` to `RATE_CACHE_READ`.
- Prerequisite concepts: none.
- `concept.id`: `"write-vs-read"`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `concept.privateDesignerSummary`: Reusing the same `MAIN_SESSION_CONTEXT` makes its saved prefix a read on later requests.
- `concept.postRevealRule`: “The expensive part was the saved context, not the new sentence.”
- `concept.solutionVocabulary`: `["red", "blue", "write", "read", "cache", "cached", "context", "reuse", "reusing", "same chat", "clean chat"]`

Neither `title` nor `objective` contains registered solution vocabulary. Mechanic terms appear only after the player produces the corresponding evidence.

## 2. Objects used

- `LevelDef`
- `Token`
- `TokenCount`
- `PrefixBlock`
- `PREFIX_STACK`
- `Request`
- `PricedRequest`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `AttemptMetrics`
- `AttemptResult`
- `StatePredicate`
- `FailureRuleDef`
- `GateDef`
- `StarDef`
- `RESOLVE_PREFIX`
- `PRICE_REQUEST`
- `ReducerState`
- `UI_TAPE_RENDERER`
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

`maxInstructionCards: 0`; first interaction appears by `1s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Show Bob’s task card, an empty `UI_TAPE_RENDERER`, and scalar `wallet` at **$0.30** `[FICTION]`. The cache panel and its terminology remain hidden. |
| `0.3s` `[ESTIMATE]` | Bob: “Login is broken. Ask Claude to fix it?” |
| `0.8s` `[ESTIMATE]` | Primary control appears: **Send**. No rate table, comparison, color legend, or explanation is visible. |
| First click | `l1-r1` settles as a red-dominant row; wallet becomes **$0.089736**. |
| After settle | `UI_MAIN_CACHE_PANEL` appears with the evidence. Toast: “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `+1.2s` `[ESTIMATE]` | Bob replaces the task text with: “Add the matching logout route.” |
| Second click | `l1-r2` settles as a blue-dominant row; wallet becomes **$0.0774726**. |
| After settle | Toast: “Same saved context. **READ · $0.0122634**.” |
| `+0.8s` `[ESTIMATE]` | A related third task appears: “Add a test for both routes.” Bob asks whether to keep it in this chat or give it a clean thread. |

The third-task choice is an ordinary workspace decision:

- **Keep working here** — keeps the related login, logout, and test work together.
- **Open a clean chat** — gives the test a tidier isolated thread but leaves the prior saved context behind.

Both routes produce the correct test. This first-level choice is the explicit taught one-shot exception documented in §13; no score, gate, or state predicate pretends that the qualitative organization benefit is a modeled gameplay reward.

Vocabulary timing:

- “token” and “write” first appear after `l1-r1`.
- “read” first appears after `l1-r2`.
- TTL terminology remains hidden; expiry is not this level’s concept.

## 4. Exact event sequence

The reference route keeps the same `MAIN_SESSION_CONTEXT`. Its cacheable prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). All cacheable `PrefixBlock.identityHash` values remain byte-identical; only the fresh current sentence changes. Current-sentence and output fixtures are `[FICTION]`.

1. **Enter the level**
   - Event: route opens `"01-red-or-blue"`.
   - Action: `ENTER_LEVEL { levelId: "01-red-or-blue" }`.
   - Mutates: `ReducerState`, scalar `wallet`, scalar `budget`, clock fields, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, `attemptMetrics`, and empty ledger/tape state.
   - Numbers: `wallet=$0.30` `[FICTION]`; `budget=$0.30` `[FICTION]`; `clockMin=0`; reusable prefix `34,738 tok` (`C34`).
   - Copy: “Login is broken. Ask Claude to fix it?”

2. **First send**
   - Event: player clicks **Send** for “Fix the login route.”
   - Action: `SEND_REQUEST { request: l1-r1 }`.
   - Mutates: `CacheEntry`, `UI_MAIN_CACHE_PANEL`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics.spentUsd`, `attemptMetrics.requestCount`, and the `UI_TAPE_RENDERER` payload.
   - Resolution: `readTok=0`, `inputTok=12`, `writeTok=34,738`, `outTok=120`, `cold=true`.
   - Price:
     - write: `$0.208428`
     - input: `$0.000036`
     - output: `$0.001800`
     - total: `$0.210264`
   - Wallet: `$0.3000000 → $0.0897360`.
   - Attempt metrics: `spentUsd=$0.210264`; `requestCount=1`.
   - Citations: `C1`, `C3`, `C34`; `12 input tok` and `120 outTok` `[FICTION]`.
   - Render: red write, red fresh-input, and violet output segments. No claim about later requests appears.

3. **Second send**
   - Event: player clicks **Send** for “Add the matching logout route.”
   - Action: `SEND_REQUEST { request: l1-r2 }`.
   - Mutates: the live `CacheEntry`, its touch/expiry values, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=14`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000042`
     - output: `$0.001800`
     - total: `$0.0122634`
   - Wallet: `$0.0897360 → $0.0774726`.
   - Attempt metrics: `spentUsd=$0.2225274`; `requestCount=2`.
   - Citations: `C1`, `C3`, `C12`, `C34`; `14 input tok` and `120 outTok` `[FICTION]`.
   - Render: blue-dominant row with visible red and violet contributions. Only now may copy say that saved context was read.

4. **Create the route checkpoint**
   - Event: the related test task and two thread choices appear.
   - Action: `CREATE_CHECKPOINT { checkpointId: "l1-before-third-route", reason: "decision" }`.
   - Mutates: `checkpoints` only.
   - State remains: two ledger rows, live cache, `wallet=$0.0774726`.

5. **Choose where the related test goes**
   - Reference event: player clicks **Keep working here**.
   - Reference action: `BEGIN_TRANSFER { challengeId: "l1-third-same-chat" }`.
   - Reference mutation: records the route choice without altering cache, ledger, or wallet.
   - Clean-chat event: player clicks **Open a clean chat**.
   - Clean-chat action: `DISCARD_CONTEXT { contextId: "l1-main" }`.
   - Clean-chat mutation: invalidates only the named cache namespace; `UI_MAIN_CACHE_PANEL` shows its cleared state.
   - Neither action produces a `LedgerRow`, changes `wallet`, or changes `attemptMetrics.spentUsd`.

6. **Open the route-specific prediction**
   - Event: after either route choice, player clicks **Predict, then send**.
   - Action: `OPEN_PREDICTION { promptId: "l1-third-color-cost" }`.
   - Mutates: `phase="predict"` and `prediction`.
   - The prompt repeats the chosen route but shows no correctness treatment or numeric result.

7. **Commit the prediction**
   - Event: player selects an option and clicks **Lock prediction**.
   - Actions, in order:
     - `SELECT_PREDICTION { promptId: "l1-third-color-cost", optionId }`
     - `COMMIT_PREDICTION { promptId: "l1-third-color-cost" }`
   - Mutates: `prediction.optionId`, then `prediction.committed=true`.
   - No request, cache touch, ledger row, wallet mutation, score, gate, or star change occurs.
   - The third `SEND_REQUEST` remains disabled until commitment.

8. **Reference third send — aha frame**
   - Preconditions: route is `l1-third-same-chat`; prediction is committed.
   - Event: player clicks **Send and find out**.
   - Action: `SEND_REQUEST { request: l1-r3 }`.
   - Mutates: the live `CacheEntry`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=13`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000039`
     - output: `$0.001800`
     - total: `$0.0122604`
   - Wallet: `$0.0774726 → $0.0652122`.
   - Attempt metrics: `spentUsd=$0.2347878`; `requestCount=3`.
   - Citations: `C1`, `C3`, `C12`, `C34`; `13 input tok` and `120 outTok` `[FICTION]`.
   - Render: the third differently worded request settles blue-dominant beside the first two rows.

9. **Reveal the reference prediction**
   - Event: `l1-r3` is fully priced and rendered.
   - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "blue-pennies" }`.
   - Mutates: `prediction.correctOptionId`, `prediction.revealed=true`, `phase="reveal"`, and `completedEventIds`.
   - Copy: “The sentence was new. The **34,738-token context** was already saved.”
   - This is evidence event `l1-reveal-third-reference`.

10. **Post-evidence explanation choice**
    - Event: after `l1-reveal-third-reference`, the player answers: “Why was this request cheap even though the sentence was new?”
    - Correct action: `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }`.
    - Other choices dispatch `ACK_EXPLANATION` with their own explanation IDs and return focus to the evidence; they do not spend money, freeze, alter the prediction, or complete the gate.
    - Correct copy: “It read the saved context; only the task sentence was new.”
    - Mutates: `acknowledgedExplanationIds` and `phase`.
    - This post-evidence action, not the prediction, supplies the one-star gate evidence.

11. **Complete the reference attempt**
    - Event ID: `l1-complete-reference`.
    - Preconditions: three requests completed and `l1-context-not-sentence` was acknowledged after `l1-reveal-third-reference`.
    - Action: `COMPLETE_ATTEMPT`.
    - Mutates: gate result, stars, `attemptResult`, `phase="result"`, and `UI_RESULT_SCREEN`.
    - Numbers: three ledger rows; `attemptResult.spentUsd=$0.2347878`; `wallet=$0.0652122`.

12. **Clean-chat third send**
    - Preconditions: player chose **Open a clean chat** and committed any prediction.
    - Event: player clicks **Send and find out**.
    - Action: `SEND_REQUEST { request: l1-r3-clean }`.
    - Mutates: a new `CacheEntry`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape.
    - Resolution: `readTok=0`, `inputTok=13`, `writeTok=34,738`, `outTok=120`, `cold=true`.
    - Price:
      - write: `$0.208428`
      - input: `$0.000039`
      - output: `$0.001800`
      - total: `$0.210267`
    - Wallet: `$0.0774726 → -$0.1327944`.
    - Attempt metrics: `spentUsd=$0.4327944`; `requestCount=3`.
    - Citations: `C1`, `C3`, `C34`; `13 input tok` and `120 outTok` `[FICTION]`.
    - Render: event `l1-third-clean-settled` leaves the actual third row red-dominant while the earlier blue row remains visible.

13. **Reveal the clean-chat prediction**
    - Event: `l1-r3-clean` is fully priced and rendered.
    - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "red-much-more" }`.
    - Mutates prediction evidence only.
    - Prediction correctness has no effect on failure; the costly clean-chat request is the cause.

14. **Freeze the economically true failure**
    - Decisive actual-attempt event: `l1-third-clean-settled`.
    - Actual request: `$0.210267`.
    - Valid same-chat alternative: `$0.0122604`.
    - Visible excess: `$0.1980066`; the clean-chat request costs about `17.15×` the same-chat request.
    - The freeze frame presents both prices before dispatch.
    - Action:

```ts
FREEZE_FAILURE {
  failure: {
    failureId: "l1-clean-chat-rewrite",
    causeCode: "CONTEXT_DISCARDED",
    message:
      "The clean chat left the saved context behind, so 34,738 tokens were written again.",
    checkpointId: "l1-before-third-route"
  }
}
```

   - Mutates: `clockFrozen=true` and `frozenFailure`; blocks economic actions.
   - Highlights: cleared `UI_MAIN_CACHE_PANEL`, red `l1-r3-clean`, blue `l1-r2`, and `wallet=-$0.1327944`.
   - This is an actual-attempt freeze. No counterfactual or reference-reveal action dispatches `FREEZE_FAILURE`.

15. **Rewind**
    - Event: player clicks **Choose the thread again**.
    - Action: `REWIND_TO_CHECKPOINT { checkpointId: "l1-before-third-route" }`.
    - Mutates: deterministic replay restores the live cache, two-row ledger, `wallet=$0.0774726`, `attemptMetrics.spentUsd=$0.2225274`, unchosen route, and no committed prediction.
    - The introduction and first two sends are not replayed; no duplicate ledger rows are created.

16. **Optional post-attempt comparison**
    - Availability: only after a passing attempt.
    - Actions:
      - `REQUEST_COUNTERFACTUAL { comparisonId: "l1-clean-chat-comparison" }`
      - `REVEAL_COUNTERFACTUAL { comparisonId: "l1-clean-chat-comparison" }`
    - `UI_COUNTERFACTUAL_OVERLAY` pairs `l1-r3` with `l1-r3-clean`.
    - It shows `$0.0122604` versus `$0.210267` and the `$0.1980066` delta without mutating the completed attempt.
    - Neither action may dispatch `FREEZE_FAILURE`.

## 5. Level data

```ts
const LEVEL_01_RED_OR_BLUE: LevelDef = {
  id: "01-red-or-blue",
  tier: 1,
  title: "Bob’s Login Bug",
  objective:
    "Finish Bob’s login, logout, and test work without draining his $0.30 wallet.",

  concept: {
    id: "write-vs-read",
    privateDesignerSummary:
      "Reusing the same main-session context converts the saved prefix from a 1h write to a read.",
    postRevealRule:
      "The expensive part was the saved context, not the new sentence.",
    solutionVocabulary: [
      "red",
      "blue",
      "write",
      "read",
      "cache",
      "cached",
      "context",
      "reuse",
      "reusing",
      "same chat",
      "clean chat"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: [],

  unlocks: "run",
  introducedControls: ["run"],
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
  seed: 1001,
  budgetUsd: 0.30,
  clockCapMin: 60,

  cfgOverride: {
    orchestratorModel: "sonnet",
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },

  scenario: "l1-onboarding",
  scenarioData: {
    units: ["fix-login", "add-logout", "test-routes"],
    contexts: ["l1-main"],
    prefixStacks: ["l1-main-prefix-34738"],
    fixtures: [
      {
        id: "l1-budget",
        label: "Level wallet and budget",
        semanticRole: "Initial spend cap for the L1 onboarding attempt",
        value: 0.30,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "l1-seed",
        label: "Deterministic level seed",
        semanticRole: "Replay seed for the L1 onboarding scenario",
        value: 1001,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l1-r1-fresh-input",
        label: "First request fresh input",
        semanticRole: "Fresh current-sentence tokens for l1-r1",
        value: 12,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l1-r2-fresh-input",
        label: "Second request fresh input",
        semanticRole: "Fresh current-sentence tokens for l1-r2",
        value: 14,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l1-r3-fresh-input",
        label: "Third request fresh input",
        semanticRole: "Fresh current-sentence tokens for either third-request route",
        value: 13,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l1-output-per-request",
        label: "Generated output per request",
        semanticRole: "Output-token fixture for each of the three L1 requests",
        value: 120,
        unit: "tok",
        tag: "[FICTION]"
      }
    ],
    estimates: [
      {
        label: "Cold-open first interaction seconds",
        value: 1,
        tag: "[ESTIMATE]"
      }
    ]
  },

  coldOpen: "§3 ColdOpenDef",
  sequence: "§4 LevelEventDef[]",

  predictions: ["l1-third-color-cost"],
  toasts: [
    "l1-first-write",
    "l1-first-read",
    "l1-third-reveal",
    "l1-clean-chat",
    "l1-frozen"
  ],
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "none",
    cite: "C34",
    line:
      "Opening a clean chat left the reusable context behind, so the related request rewrote 34,738 tokens."
  },

  failureRules: [L1_CLEAN_CHAT_REWRITE],
  checkpoints: [
    {
      id: "l1-before-third-route",
      createBeforeEventId: "l1-third-route-choice",
      reason: "decision",
      resumeLabel: "Choose the thread again"
    }
  ],

  gate: L1_GATE,
  pass: l1Pass,
  star2: L1_STAR2,
  star3: L1_STAR3,

  referenceCfg: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },

  antiCfg: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true
  },

  counterfactuals: [
    {
      id: "l1-clean-chat-comparison",
      unlockAfterEventId: "l1-complete-reference",
      kind: "alternate-choice",
      cfg: {
        devModel: "sonnet",
        who: "inline",
        oneHourFlag: true
      },
      comparisonQuestion:
        "What changed when the related test moved to a clean chat?",
      revealCopy:
        "The task sentence stayed tiny; the new chat had to write the 34,738-token context again."
    }
  ],

  tape: "§7 TapeSpec",
  result: "§10 ResultSpec",
  vocabulary: ["token", "write", "read"],
  qa: "§12 QaAssertion[]"
};
```

The scenario adapter expands the three unit IDs, context ID, and prefix-stack ID into the canonical `UnitSeed`, `ContextSeed`, and `PrefixStackSeed` objects. It must use `MAIN_PREFIX_HEY`, not define a second main-prefix value.

`seed`, wallet, current-sentence sizes, output size, and presentation timing are deterministic `[FICTION]`/`[ESTIMATE]` fixtures. The reusable prefix, cache behavior, and rates are grounded in `C1`, `C3`, `C12`, and `C34`.

## 6. Pricing walkthrough

Model: Sonnet. `RATE_INPUT=$3/M`, `RATE_CACHE_READ=$0.30/M`, `RATE_CACHE_WRITE_1H=$6/M`, and `RATE_OUTPUT=$15/M` (`C1`, `C3`). The reusable prefix is `MAIN_PREFIX_HEY = 34,738 tok` (`C34`).

This is the sole authoritative request-price table for the level:

| Request | Route | Priced buckets | `PRICE_REQUEST` calculation | Cost |
|---|---|---|---:|---:|
| `l1-r1` | First request | `0 read + 12 input + 34,738 write + 120 output` | `0 + 12×$3/M + 34,738×$6/M + 120×$15/M` | `$0.210264` |
| `l1-r2` | Same chat | `34,738 read + 14 input + 0 write + 120 output` | `34,738×$0.30/M + 14×$3/M + 120×$15/M` | `$0.0122634` |
| `l1-r3` | Keep working here | `34,738 read + 13 input + 0 write + 120 output` | `34,738×$0.30/M + 13×$3/M + 120×$15/M` | `$0.0122604` |
| `l1-r3-clean` | Open a clean chat | `0 read + 13 input + 34,738 write + 120 output` | `0 + 13×$3/M + 34,738×$6/M + 120×$15/M` | `$0.210267` |

Three-star reference result:

```text
spend
= $0.210264 + $0.0122634 + $0.0122604
= $0.2347878

wallet remaining
= $0.3000000 - $0.2347878
= $0.0652122
```

Clean-chat failed-branch result:

```text
spend
= $0.210264 + $0.0122634 + $0.210267
= $0.4327944

wallet remaining
= $0.3000000 - $0.4327944
= -$0.1327944
```

Economically true failure comparison:

```text
third-request excess
= $0.210267 - $0.0122604
= $0.1980066
```

The clean-chat third request is about `17.15×` the same-chat third request. The failed branch costs about `84.33%` more than the reference attempt. Both comparisons derive from `C1`, `C3`, and `C34`.

The `20×` one-hour-write-to-read input-side rate ratio (`C5`) may appear only after the attempt. It is not shown before the player has produced the evidence.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"` and `hoverEnabled = true`.

1. Reveal group `l1-first`
   - request: `l1-r1`
   - ordered segments: `write(34,738)`, `input(12)`, `output(120)`
   - label: `Fix login`

2. Reveal group `l1-second`
   - request: `l1-r2`
   - ordered segments: `read(34,738)`, `input(14)`, `output(120)`
   - label: `Add logout`

3. Reference reveal group `l1-third-reference`
   - request: `l1-r3`
   - `gatedByPredictionId: "l1-third-color-cost"`
   - ordered segments: `read(34,738)`, `input(13)`, `output(120)`
   - label: `Test both`

4. Clean-chat branch reveal group `l1-third-clean`
   - request: `l1-r3-clean`
   - `gatedByPredictionId: "l1-third-color-cost"`
   - ordered segments: `write(34,738)`, `input(13)`, `output(120)`
   - label: `Test both · clean chat`

`ahaRequestId: "l1-r3"`.

Aha frame: the three settled reference rows remain visible together. Row one is red-dominant; rows two and three are blue-dominant despite their different current sentences. Only after `REVEAL_PREDICTION` does the caption appear: “Three different requests. One saved context.”

The tape cites the canonical output-aware geometry from `UI_TAPE_RENDERER`:

```text
segment.widthRatio = segment.usd / row.usd
segment.startRatio = sum(previousSegment.usd) / row.usd
```

Therefore each request’s `$0.001800` output charge contributes violet visual width from its first render. Hiding or delaying an output label may not remove `outTok` from bar weight. `UI_HOVER_PRICE_CALCULATOR` shows every nonzero bucket and asserts its contributions against the authoritative `LedgerRow.usd`.

Static final bars render before hover.

## 8. Prediction prompt

### `l1-third-color-cost`

Route-specific question:

> “You chose **{Keep working here | Open a clean chat}**. Before you send: which color will dominate, and will the cost stay small or jump?”

Options:

- `blue-pennies`: “Blue — pennies”
- `red-much-more`: “Red — much more”
- `violet-mostly-output`: “Violet — mostly output”

The prompt does not expose the clean-chat branch’s `$0.210267` magnitude before play.

Controls:

- Before selection: **Choose one**
- After selection: **Lock prediction**
- After commitment: **Send and find out**

Correct reveal evidence depends only on the executed route:

- `l1-r3`: `blue-pennies`
- `l1-r3-clean`: `red-much-more`

The selected option and its correctness remain hidden until the corresponding third row is priced and rendered. A wrong prediction:

- changes no wallet value;
- changes no request resolution;
- causes no freeze;
- removes no star;
- does not affect the gate or `pass(st)`.

Keyboard and pointer selection dispatch identical action sequences.

After the reference reveal, the post-evidence explanation prompt asks:

> “Why was this request cheap even though the sentence was new?”

Options:

- `l1-context-not-sentence`: “It read the saved context; only the task sentence was new.”
- `l1-short-is-always-cheap`: “Short requests are always cheap.”
- `l1-tests-cost-less`: “Tests are billed at a cheaper rate.”

Only `l1-context-not-sentence`, chosen after `l1-reveal-third-reference`, satisfies the behavioral gate. Incorrect explanation choices spend nothing and leave the evidence visible for another choice.

## 9. Fail-state

The authoritative failure rule is:

```ts
const L1_CLEAN_CHAT_REWRITE: FailureRuleDef = {
  id: "l1-clean-chat-rewrite",
  predicate: {
    id: "l1-clean-request-settled",
    kind: "all",
    predicates: [
      {
        id: "l1-last-request-is-clean",
        kind: "compare",
        path: "lastRequests.0.requestId",
        op: "eq",
        value: "l1-r3-clean"
      },
      {
        id: "l1-clean-request-is-cold",
        kind: "compare",
        path: "lastRequests.0.cold",
        op: "eq",
        value: true
      },
      {
        id: "l1-clean-request-rewrote-prefix",
        kind: "compare",
        path: "lastRequests.0.writeTok",
        op: "eq",
        value: 34738
      },
      {
        id: "l1-clean-request-cost-reached",
        kind: "compare",
        path: "lastRequests.0.usd",
        op: "gte",
        value: 0.210267
      }
    ]
  },
  decisiveEventId: "l1-third-clean-settled",
  causeCode: "CONTEXT_DISCARDED",
  message:
    "The clean chat left the saved context behind, so 34,738 tokens were written again.",
  checkpointId: "l1-before-third-route",
  highlightObjectIds: [
    "l1-r3-clean",
    "l1-r2",
    "UI_MAIN_CACHE_PANEL",
    "wallet"
  ],
  actualUsd: 0.210267,
  validAlternativeUsd: 0.0122604
};
```

Failure presentation:

- Plausible player action: **Open a clean chat**, offered as the normal way to give the related test a tidy isolated thread.
- Decisive actual-attempt event: `l1-third-clean-settled`.
- Actual request cost: `$0.210267`.
- Valid same-chat alternative: `$0.0122604`.
- Visible excess: `$0.1980066`.
- Freeze frame:
  - cleared `UI_MAIN_CACHE_PANEL`;
  - red-dominant `l1-r3-clean`;
  - prior blue `l1-r2`;
  - `wallet=-$0.1327944`;
  - both third-request prices visible for comparison.
- Causal message: **“The clean chat left the saved context behind, so 34,738 tokens were written again.”**
- Supporting line: “The new test sentence was only 13 tokens `[FICTION]`; rebuilding `MAIN_PREFIX_HEY` caused the drop.”
- Rewind control: **Choose the thread again**
- Rewind target: `l1-before-third-route`
- Restored state: live cache, two ledger rows, `wallet=$0.0774726`, `attemptMetrics.spentUsd=$0.2225274`, route unchosen, prediction uncommitted.
- No cold-open, first request, or second request is replayed.
- Freeze blocks all economic actions until rewind.

The freeze is independent of prediction correctness and is economically true because `$0.210267 > $0.0122604`. It is dispatched only from the actual economic branch, never from `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, or any reference/counterfactual reveal.

## 10. Gate & stars

The authoritative gate uses only legal `StatePredicate` kinds and canonical state paths:

```ts
const L1_GATE: GateDef = {
  predicateId: "l1-post-reveal-causal-explanation",

  evidenceRevealEventIds: [
    "l1-reveal-third-reference"
  ],

  postEvidenceActionRequirements: [
    {
      id: "l1-explanation-action-after-reveal",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "l1-reveal-third-reference",
      match: {
        explanationId: "l1-context-not-sentence"
      }
    }
  ],

  behavioralRequirements: [
    {
      id: "l1-three-priced-requests",
      kind: "compare",
      path: "ledger.length",
      op: "eq",
      value: 3,
      observedAfterEventId: "l1-reveal-third-reference"
    },
    {
      id: "l1-reference-reveal-completed",
      kind: "event-completed",
      eventId: "l1-reveal-third-reference"
    },
    {
      id: "l1-causal-rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l1-context-not-sentence",
      observedAfterEventId: "l1-reveal-third-reference"
    }
  ],

  explanationRequirement: {
    id: "l1-explanation-required",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "l1-context-not-sentence",
    observedAfterEventId: "l1-reveal-third-reference"
  }
};
```

`pass(st)` reads only declared `ReducerState` paths. The gate evaluator separately enforces the legal post-evidence `action-observed` requirement:

```ts
function l1Pass(st: ReducerState): GateResult {
  const passed =
    st.ledger.length === 3 &&
    st.completedEventIds.includes("l1-reveal-third-reference") &&
    st.acknowledgedExplanationIds.includes(
      "l1-context-not-sentence"
    );

  return {
    pass: passed,
    reason: passed
      ? "The player identified saved-context reuse after seeing the third row."
      : "Read the third row, then choose what made it cheap.",
    evidence: passed
      ? [
          "After the reveal: It read the saved context; only the task sentence was new.",
          "Third request: 34,738 read · 0 written.",
          "Three requests produced three ledger rows."
        ]
      : []
  };
}
```

The authoritative star predicates are:

```ts
const L1_STAR2: StarDef = {
  label: "Kept the thread",
  reason:
    "Kept the related work in the context that already contained it.",
  predicate: {
    id: "l1-star2",
    kind: "all",
    predicates: [
      {
        id: "l1-star2-reference-revealed",
        kind: "event-completed",
        eventId: "l1-reveal-third-reference"
      },
      {
        id: "l1-star2-explanation-after-reveal",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "l1-reveal-third-reference",
        match: {
          explanationId: "l1-context-not-sentence"
        }
      },
      {
        id: "l1-star2-explanation-acknowledged",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "l1-context-not-sentence"
      },
      {
        id: "l1-star2-three-rows",
        kind: "compare",
        path: "ledger.length",
        op: "eq",
        value: 3
      },
      {
        id: "l1-star2-one-last-request",
        kind: "compare",
        path: "lastRequests.length",
        op: "eq",
        value: 1
      },
      {
        id: "l1-star2-reference-request",
        kind: "compare",
        path: "lastRequests.0.requestId",
        op: "eq",
        value: "l1-r3"
      },
      {
        id: "l1-star2-reference-read",
        kind: "compare",
        path: "lastRequests.0.readTok",
        op: "eq",
        value: 34738
      },
      {
        id: "l1-star2-no-reference-write",
        kind: "compare",
        path: "lastRequests.0.writeTok",
        op: "eq",
        value: 0
      },
      {
        id: "l1-star2-reference-warm",
        kind: "compare",
        path: "lastRequests.0.cold",
        op: "eq",
        value: false
      }
    ]
  }
};

const L1_STAR3: StarDef = {
  label: "Three in a row",
  reason:
    "Completed all three related requests with one write and two reads.",
  predicate: {
    id: "l1-star3",
    kind: "all",
    predicates: [
      L1_STAR2.predicate,
      {
        id: "l1-star3-first-request",
        kind: "compare",
        path: "ledger.0.requestId",
        op: "eq",
        value: "l1-r1"
      },
      {
        id: "l1-star3-first-cold",
        kind: "compare",
        path: "ledger.0.cold",
        op: "eq",
        value: true
      },
      {
        id: "l1-star3-first-write",
        kind: "compare",
        path: "ledger.0.writeTok",
        op: "eq",
        value: 34738
      },
      {
        id: "l1-star3-second-request",
        kind: "compare",
        path: "ledger.1.requestId",
        op: "eq",
        value: "l1-r2"
      },
      {
        id: "l1-star3-second-warm",
        kind: "compare",
        path: "ledger.1.cold",
        op: "eq",
        value: false
      },
      {
        id: "l1-star3-second-read",
        kind: "compare",
        path: "ledger.1.readTok",
        op: "eq",
        value: 34738
      },
      {
        id: "l1-star3-third-request",
        kind: "compare",
        path: "ledger.2.requestId",
        op: "eq",
        value: "l1-r3"
      },
      {
        id: "l1-star3-third-warm",
        kind: "compare",
        path: "ledger.2.cold",
        op: "eq",
        value: false
      },
      {
        id: "l1-star3-third-read",
        kind: "compare",
        path: "ledger.2.readTok",
        op: "eq",
        value: 34738
      },
      {
        id: "l1-star3-reference-spend",
        kind: "compare",
        path: "attemptMetrics.spentUsd",
        op: "lte",
        value: 0.2347878
      },
      {
        id: "l1-star3-no-rewind",
        kind: "compare",
        path: "attempt",
        op: "eq",
        value: 1
      }
    ]
  }
};
```

No gate or star predicate reads `prediction.optionId`, `prediction.correctOptionId`, or prediction correctness.

Stars:

- **1 star — Read the evidence:** `l1Pass(st).pass` succeeds after the canonical post-evidence action requirement.
- **2 stars — Kept the thread:** `L1_STAR2.predicate` succeeds.
- **3 stars — Three in a row:** `L1_STAR3.predicate` succeeds.

The reference route is winnable from seed `1001` and earns three stars regardless of prediction correctness. The clean-chat route produces two cold writes and freezes on its visibly more expensive third request. After rewind, the player can pass without replaying mastered setup.

Result copy:

- Pass headline: **“You found the reuse.”**
- Pass rule: **“The expensive part was the saved context, not the new sentence.”**
- Fail headline: **“The clean chat rebuilt the context.”**
- Continue: **Next level**
- Retry: **Choose the thread again**

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l1-first-write` | `l1-r1` settles | “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `l1-first-read` | `l1-r2` settles | “Same saved context. **READ · $0.0122634**.” |
| `l1-third-reveal` | Reference `REVEAL_PREDICTION` | “Three different requests. One saved context.” |
| `l1-clean-chat` | `DISCARD_CONTEXT` from **Open a clean chat** | “Clean chat opened. The previous saved context stays behind.” |
| `l1-frozen` | `FREEZE_FAILURE` | “That related request had to write the context again.” |

Vocabulary:

- `token`
  - First needed: `l1-r1`
  - Definition: “A small chunk of text you’re billed for.”
  - Toast: `l1-first-write`
- `write`
  - First needed: `l1-r1`
  - Definition: “Saving new reusable context at its write rate.”
  - Toast: `l1-first-write`
- `read`
  - First needed: `l1-r2`
  - Definition: “Reusing saved context at its read rate.”
  - Toast: `l1-first-read`

No player-facing copy introduces TTL or expiry.

## 12. QA gate

Real-browser click-through assertions:

1. `"01-red-or-blue"` validates against the canonical `LevelId` union.
2. `"write-vs-read"` validates against the canonical `ConceptId` registry; `prerequisiteConceptIds` is exactly `[]`.
3. `conceptScope` is exactly `{ kind: "single", reusedConceptIds: [] }`.
4. `title` and `objective` contain none of `concept.solutionVocabulary`; the identity QA assertion is `{ kind: "identity-no-solution-vocabulary", forbiddenTerms: concept.solutionVocabulary, assertion: "title and objective contain no solution vocabulary" }`.
5. All four `interactionPatterns` values are canonical kebab-case IDs; no uppercase `PATTERN_*` alias appears.
6. Within `2s` `[ESTIMATE]`, first **Send** is keyboard- and pointer-operable; no instruction card blocks it.
7. Before `l1-r1`, no player-facing copy or component label reveals that later requests will be blue, cheaper, read, cached, or reused.
8. First **Send** dispatches one `SEND_REQUEST`, creates one `LedgerRow`, one tape row, and one live `CacheEntry`.
9. `l1-r1` prices to exactly `$0.210264` from `C1`, `C3`, and `C34`.
10. Second **Send** adds exactly one ledger/tape row; `l1-r2` prices to `$0.0122634`.
11. `l1-r2` reads `34,738`, writes `0`, and refreshes the live entry under `C12`.
12. The third route controls appear only after `l1-r2` evidence is visible.
13. **Keep working here** and **Open a clean chat** are both keyboard- and pointer-operable and both produce the requested test.
14. **Open a clean chat** dispatches `DISCARD_CONTEXT` as an ordinary thread-management action, not a control labeled as failure.
15. `DISCARD_CONTEXT` creates no ledger row and changes neither scalar `wallet` nor `attemptMetrics.spentUsd`.
16. After either route choice, the third `SEND_REQUEST` cannot dispatch before `COMMIT_PREDICTION`.
17. Prediction selection alone does not unlock sending; commitment does.
18. No correctness treatment appears before the selected route’s third request is priced and rendered.
19. The prediction options contain no exact `$0.210267` or `21¢` magnitude; the clean-chat option reads **“Red — much more.”**
20. Reference `l1-r3` prices to `$0.0122604`, reads `34,738`, writes `0`, and refreshes the cache.
21. Clean-chat `l1-r3-clean` prices to `$0.210267`, reads `0`, writes `34,738`, and creates the third ledger/tape row.
22. A wrong prediction changes no score, star, wallet, failure predicate, gate result, or request resolution.
23. The one-star gate does not inspect `prediction.optionId`, `correctOptionId`, or prediction correctness.
24. The gate observes `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }` after `l1-reveal-third-reference`.
25. An explanation action before the reveal is rejected by the `ACK_EXPLANATION` contract and cannot satisfy the gate.
26. Incorrect explanation choices create no request and no economic penalty; the player can inspect the tape and retry.
27. Every gate, failure, and star predicate uses only canonical `ReducerState` paths, legal `StatePredicate` kinds, and legal comparison ops.
28. Each priced request maps to exactly one `LedgerRow` and one tape row.
29. Every real request cost is positive and equals `PRICE_REQUEST`.
30. No positive price displays as `$0.0000`; sufficiently precise values appear in detailed views.
31. Static final tape bars render without hover and preserve ledger order.
32. `UI_TAPE_RENDERER` segments equal the priced buckets; no decorative segment is treated as a request.
33. `outTok` contributes to every row’s canonical segment width and total visual weight.
34. The `$0.001800` output contribution remains available in `UI_HOVER_PRICE_CALCULATOR`.
35. Freeze occurs only after actual-attempt event `l1-third-clean-settled`, its `$0.210267` cost, and the `$0.0122604` valid alternative are visible.
36. Failure rule validation asserts `actualUsd=$0.210267 > validAlternativeUsd=$0.0122604`.
37. No `FREEZE_FAILURE` dispatch occurs while processing `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, or any reference/counterfactual reveal.
38. The clean-thread branch is reachable and its qualitative organization appeal is stated honestly; §13 explicitly declares the critic-authorized L1 taught one-shot exception instead of claiming an unmodeled invariant-14 reward.
39. **Choose the thread again** restores the checkpoint byte-identically: two rows, `wallet=$0.0774726`, `attemptMetrics.spentUsd=$0.2225274`, live cache, no route, and no committed prediction.
40. Rewind creates no duplicate rows and does not replay either mastered send.
41. Reference seed/configuration is winnable and earns three stars regardless of prediction correctness.
42. The failed branch freezes independently of budget-only gate logic.
43. `UI_COUNTERFACTUAL_OVERLAY` remains unavailable before a meaningful completed attempt.
44. The post-attempt comparison uses the same seed and authoritative `$0.0122604`, `$0.210267`, and `$0.1980066` values.
45. Counterfactual rendering does not mutate `wallet`, `ledger`, `attemptResult`, `clockFrozen`, or `frozenFailure`.
46. Pointer and keyboard paths produce equivalent `Action[]`.
47. Reduced-motion mode produces identical final state, pricing, reveal order, tape geometry, and gate evidence.
48. Refresh/replay from seed `1001` and saved `Action[]` reproduces byte-identical `ReducerState`, ledger, wallet, and result.
49. Each authoritative request count, token count, cost, total, and threshold has only one implementable value.
50. Every `[FICTION]` gameplay scalar has a semantically matching `ScenarioFixtureDef`; presentation timing alone uses `[ESTIMATE]`.
51. `MAIN_PREFIX_HEY` is cited as `C34`; the level does not define a competing main-prefix constant.

## 13. Reference-bar justification

The screen opens on one inviting action and lets the first wallet hit land before naming anything. A second related request then produces the surprising blue contrast through play, not explanation. The player applies that evidence to an ordinary workspace choice, commits a deliberately coarse prediction, and only then sees the third request settle.

The clean-thread route has recognizable real-world organization appeal, but the canonical model contains no scored organization metric and the route’s actual request is economically and mechanically worse in this onboarding fixture. This specification therefore makes the binding, explicit declaration permitted by the L1 round-3 work order: **Level 1 is a taught one-shot onboarding exception to invariant 14.** It does not claim that qualitative tidiness is a modeled counter-pressure or that the two routes are equally viable. The exception is confined to this first guided application; later core decisions must carry live modeled tradeoffs.

Choosing the clean thread exposes a genuine, visible economic consequence, freezes only after the actual-attempt ledger proves it is more expensive, and rewinds directly to the thread decision. The freeze is never attached to the optional counterfactual comparison.

Finally, the one-star gate asks for a causal explanation after the reveal. The pre-reveal guess remains psychologically useful but economically and mechanically non-punitive. The rhythm is act, notice, choose, predict, reveal, explain, and—if necessary—rewind, preserving the surprise while requiring demonstrated understanding.

Assumption: this level uses the measured `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). Tiny request/output sizes, wallet, seed, and presentation timings remain explicitly `[FICTION]` or `[ESTIMATE]`. No dollar figure changed in this revision.
