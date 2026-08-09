# Level 1 — Red or Blue?

## 1. Identity

- `id`: `"01-red-or-blue"`
- `title`: `Red or Blue?`
- `tier`: `1`
- `objective`: “Send three related coding requests without draining Bob’s $0.30 wallet.”
- ONE concept: Reusing an unchanged context converts the saved prefix from `RATE_CACHE_WRITE_1H` to `RATE_CACHE_READ`.
- Prerequisite concepts: none.
- `concept.id`: `"write-vs-read"`
- `concept.privateDesignerSummary`: Reusing the same `MAIN_SESSION_CONTEXT` makes its saved prefix a read on later requests.
- `concept.postRevealRule`: “The expensive part was the saved context, not the new sentence.”

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
- `StatePredicate`
- `FailureRuleDef`
- `GateDef`
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
| `0.0s` | Show Bob’s task card, an empty `UI_TAPE_RENDERER`, compact `UI_MAIN_CACHE_PANEL`, and `Wallet` at **$0.30** `[FICTION]`. |
| `0.3s` `[ESTIMATE]` | Bob: “Login is broken. Ask Claude to fix it?” |
| `0.8s` `[ESTIMATE]` | Primary control appears: **Send**. No rate table, comparison, color legend, or cache explanation is visible. |
| First click | `l1-r1` settles as a red-dominant row; wallet becomes **$0.089736**. |
| After settle | Toast: “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `+1.2s` `[ESTIMATE]` | Bob replaces the task text with: “Add the matching logout route.” |
| Second click | `l1-r2` settles as a blue-dominant row; wallet becomes **$0.0774726**. |
| After settle | Toast: “Same saved context. **READ · $0.0122634**.” |
| `+0.8s` `[ESTIMATE]` | A related third task appears: “Add a test for both routes.” Bob asks whether to keep it in this chat or give it a clean thread. |

The third-task choice is an ordinary workspace decision:

- **Keep working here** — keeps the related login, logout, and test work together.
- **Open a clean chat** — gives the test a tidier isolated thread but leaves the prior saved context behind.

Both routes can produce the correct test. Their organization-versus-reuse tradeoff makes the choice plausible; the level does not teach that a clean chat is always wrong.

Vocabulary timing:

- “token” and “write” first appear after `l1-r1`.
- “read” first appears after `l1-r2`.
- TTL terminology remains hidden; expiry is not this level’s concept.

## 4. Exact event sequence

The reference route keeps the same `MAIN_SESSION_CONTEXT`. Its cacheable prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). All cacheable `PrefixBlock.identityHash` values remain byte-identical; only the fresh current sentence changes. Current-sentence and output fixtures are `[FICTION]`.

1. **Enter the level**
   - Event: route opens `"01-red-or-blue"`.
   - Action: `ENTER_LEVEL { levelId: "01-red-or-blue" }`.
   - Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, and empty ledger/tape state.
   - Numbers: wallet `$0.30` `[FICTION]`; clock `0m`; reusable prefix `34,738 tok` (`C34`).
   - Copy: “Login is broken. Ask Claude to fix it?”

2. **First send**
   - Event: player clicks **Send** for “Fix the login route.”
   - Action: `SEND_REQUEST { request: l1-r1 }`.
   - Mutates: `CacheEntry`, `UI_MAIN_CACHE_PANEL`, `LedgerRow[]`, `lastRequests`, `Wallet`, and the `UI_TAPE_RENDERER` payload.
   - Resolution: `readTok=0`, `inputTok=12`, `writeTok=34,738`, `outTok=120`, `cold=true`.
   - Price:
     - write: `$0.208428`
     - input: `$0.000036`
     - output: `$0.001800`
     - total: `$0.210264`
   - Wallet: `$0.3000000 → $0.0897360`.
   - Citations: `C1`, `C3`, `C34`; `12 input tok` and `120 outTok` `[FICTION]`.
   - Render: red write, red fresh-input, and violet output segments. No claim about later requests appears.

3. **Second send**
   - Event: player clicks **Send** for “Add the matching logout route.”
   - Action: `SEND_REQUEST { request: l1-r2 }`.
   - Mutates: the live `CacheEntry`, its touch/expiry values, `LedgerRow[]`, `lastRequests`, `Wallet`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=14`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000042`
     - output: `$0.001800`
     - total: `$0.0122634`
   - Wallet: `$0.0897360 → $0.0774726`.
   - Citations: `C1`, `C3`, `C12`, `C34`; `14 input tok` and `120 outTok` `[FICTION]`.
   - Render: blue-dominant row with visible red and violet contributions. Only now may copy say that saved context was read.

4. **Create the route checkpoint**
   - Event: the related test task and the two thread choices appear.
   - Action: `CREATE_CHECKPOINT { checkpointId: "l1-before-third-route", reason: "decision" }`.
   - Mutates: `Checkpoint[]` only.
   - State remains: two ledger rows, live cache, wallet `$0.0774726`.

5. **Choose where the related test goes**
   - Reference event: player clicks **Keep working here**.
   - Reference action: `BEGIN_TRANSFER { challengeId: "l1-third-same-chat" }`.
   - Reference mutation: records the route choice without altering the cache, ledger, or wallet.
   - Anti-pattern event: player clicks **Open a clean chat**.
   - Anti-pattern action: `DISCARD_CONTEXT { contextId: "l1-main" }`.
   - Anti-pattern mutation: invalidates only the named cache namespace; `UI_MAIN_CACHE_PANEL` shows its cleared state.
   - Neither action produces a `LedgerRow` or changes the wallet.

6. **Open the route-specific prediction**
   - Event: after either route choice, player clicks **Predict, then send**.
   - Action: `OPEN_PREDICTION { promptId: "l1-third-color-cost" }`.
   - Mutates: `phase="predict"` and `prediction`.
   - The prompt repeats the chosen route but shows no correctness treatment or price result.

7. **Commit the prediction**
   - Event: player selects an option and clicks **Lock prediction**.
   - Actions, in order:
     - `SELECT_PREDICTION { promptId: "l1-third-color-cost", optionId }`
     - `COMMIT_PREDICTION { promptId: "l1-third-color-cost" }`
   - Mutates: `prediction.optionId`, then `prediction.committed=true`.
   - No request, cache touch, ledger row, wallet mutation, score, or star change occurs.
   - The third `SEND_REQUEST` remains disabled until commitment.

8. **Reference third send — aha frame**
   - Preconditions: route is `l1-third-same-chat`; prediction is committed.
   - Event: player clicks **Send and find out**.
   - Action: `SEND_REQUEST { request: l1-r3 }`.
   - Mutates: the live `CacheEntry`, `LedgerRow[]`, `lastRequests`, `Wallet`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=13`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000039`
     - output: `$0.001800`
     - total: `$0.0122604`
   - Wallet: `$0.0774726 → $0.0652122`.
   - Citations: `C1`, `C3`, `C12`, `C34`; `13 input tok` and `120 outTok` `[FICTION]`.
   - Render: the third differently worded request settles blue-dominant beside the first two rows.

9. **Reveal the reference prediction**
   - Event: `l1-r3` is fully priced and rendered.
   - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "blue-about-1-cent" }`.
   - Mutates: `prediction.correctOptionId`, `prediction.revealed=true`, `phase="reveal"`.
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
    - Preconditions: three requests completed and `l1-context-not-sentence` was acknowledged after `l1-reveal-third-reference`.
    - Action: `COMPLETE_ATTEMPT`.
    - Mutates: gate result, stars, `phase="result"`, and `UI_RESULT_SCREEN`.
    - Numbers: three ledger rows; spend `$0.2347878`; wallet `$0.0652122`.

12. **Anti-pattern third send**
    - Preconditions: player chose **Open a clean chat** and committed any prediction.
    - Event: player clicks **Send and find out**.
    - Action: `SEND_REQUEST { request: l1-r3-clean }`.
    - Mutates: a new `CacheEntry`, `LedgerRow[]`, `lastRequests`, `Wallet`, and tape.
    - Resolution: `readTok=0`, `inputTok=13`, `writeTok=34,738`, `outTok=120`, `cold=true`.
    - Price:
      - write: `$0.208428`
      - input: `$0.000039`
      - output: `$0.001800`
      - total: `$0.210267`
    - Wallet: `$0.0774726 → -$0.1327944`.
    - Anti-pattern attempt spend: `$0.4327944`.
    - Citations: `C1`, `C3`, `C34`; `13 input tok` and `120 outTok` `[FICTION]`.
    - Render: the third row settles red-dominant while the earlier blue row remains visible.

13. **Reveal the anti-pattern prediction**
    - Event: `l1-r3-clean` is fully priced and rendered.
    - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "red-about-21-cents" }`.
    - Mutates prediction evidence only.
    - Prediction correctness has no effect on the ensuing failure: the costly clean-chat route is the cause.

14. **Freeze the economically true failure**
    - Decisive event: `l1-r3-clean` resolved for `$0.210267`.
    - Valid alternative: `l1-r3` would have resolved for `$0.0122604`.
    - Visible excess: `$0.1980066`; the clean-chat request costs about `17.15×` the same-chat request.
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

   - Mutates: `clock.frozen=true` and `frozenFailure`; blocks economic actions.
   - Highlights: cleared `UI_MAIN_CACHE_PANEL`, red `l1-r3-clean`, blue `l1-r2`, and wallet `-$0.1327944`.

15. **Rewind**
    - Event: player clicks **Choose the thread again**.
    - Action: `REWIND_TO_CHECKPOINT { checkpointId: "l1-before-third-route" }`.
    - Mutates: deterministic replay restores the live cache, two-row ledger, wallet `$0.0774726`, unchosen route, and no committed prediction.
    - The introduction and first two sends are not replayed; no duplicate ledger rows are created.

16. **Optional post-attempt comparison**
    - Availability: only after a passing attempt.
    - Actions:
      - `REQUEST_COUNTERFACTUAL { comparisonId: "l1-clean-chat-comparison" }`
      - `REVEAL_COUNTERFACTUAL { comparisonId: "l1-clean-chat-comparison" }`
    - `UI_COUNTERFACTUAL_OVERLAY` pairs `l1-r3` with `l1-r3-clean`.
    - It shows `$0.0122604` versus `$0.210267` and the `$0.1980066` delta without mutating the completed attempt.

## 5. Level data

```ts
const LEVEL_01_RED_OR_BLUE: LevelDef = {
  id: "01-red-or-blue",
  tier: 1,
  title: "Red or Blue?",
  objective:
    "Send three related coding requests without draining Bob’s $0.30 wallet.",

  concept: {
    id: "write-vs-read",
    privateDesignerSummary:
      "Reusing the same main-session context converts the saved prefix from a 1h write to a read.",
    postRevealRule:
      "The expensive part was the saved context, not the new sentence."
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
    estimates: [
      { label: "budgetUsd", value: 0.30, tag: "[FICTION]" },
      { label: "seed", value: 1001, tag: "[FICTION]" },
      { label: "r1 fresh input tokens", value: 12, tag: "[FICTION]" },
      { label: "r2 fresh input tokens", value: 14, tag: "[FICTION]" },
      { label: "r3 fresh input tokens", value: 13, tag: "[FICTION]" },
      { label: "output tokens per request", value: 120, tag: "[FICTION]" },
      { label: "cold-open first interaction seconds", value: 1, tag: "[ESTIMATE]" }
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

  failureRules: ["l1-clean-chat-rewrite"],
  checkpoints: ["l1-before-third-route"],

  gate: {
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
  },

  pass: "pure predicate specified in §10",

  star2: {
    label: "Kept the thread",
    predicate:
      "pass and l1-r3 resolves with readTok=34738, writeTok=0, cold=false",
    reason:
      "Kept the related work in the context that already contained it."
  },

  star3: {
    label: "Three in a row",
    predicate:
      "star2 and exactly one cold write, two reads, spend <= 0.2347878, and no rewind",
    reason:
      "Completed all three related requests with one write and two reads."
  },

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

Clean-chat anti-pattern result:

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

The clean-chat third request is about `17.15×` the same-chat third request. The anti-pattern attempt costs about `84.33%` more than the reference attempt. Both comparisons derive from `C1`, `C3`, and `C34`.

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

> “You chose **{Keep working here | Open a clean chat}**. Before you send: what color will most of this request be, and about what will it cost?”

Options:

- `blue-about-1-cent`: “Blue — about 1¢”
- `red-about-21-cents`: “Red — about 21¢”
- `violet-about-2-cents`: “Violet — about 2¢”

Controls:

- Before selection: **Choose one**
- After selection: **Lock prediction**
- After commitment: **Send and find out**

Correct reveal evidence depends only on the executed route:

- `l1-r3`: `blue-about-1-cent`
- `l1-r3-clean`: `red-about-21-cents`

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

Failure rule: `l1-clean-chat-rewrite`.

- Plausible player action: **Open a clean chat**, offered as the normal way to give the related test a tidy isolated thread.
- Decisive event: `l1-r3-clean` settles after that new thread discarded access to the live cache namespace.
- Actual request cost: `$0.210267`.
- Valid same-chat alternative: `$0.0122604`.
- Visible excess: `$0.1980066`.
- Freeze frame:
  - cleared `UI_MAIN_CACHE_PANEL`;
  - red-dominant `l1-r3-clean`;
  - prior blue `l1-r2`;
  - wallet `-$0.1327944`;
  - both third-request prices visible for comparison.
- Causal message: **“The clean chat left the saved context behind, so 34,738 tokens were written again.”**
- Supporting line: “The new test sentence was only 13 tokens `[FICTION]`; rebuilding `MAIN_PREFIX_HEY` caused the drop.”
- Rewind control: **Choose the thread again**
- Rewind target: `l1-before-third-route`
- Restored state: live cache, two ledger rows, wallet `$0.0774726`, route unchosen, prediction uncommitted.
- No cold-open, first request, or second request is replayed.
- Freeze blocks all economic actions until rewind.

The freeze is independent of prediction correctness and is economically true because `$0.210267 > $0.0122604`.

## 10. Gate & stars

Behavioral pass predicate:

```ts
pass =
  ledger.length === 3 &&
  completedEventIds.includes("l1-reveal-third-reference") &&
  actionObserved({
    actionType: "ACK_EXPLANATION",
    afterEventId: "l1-reveal-third-reference",
    match: {
      explanationId: "l1-context-not-sentence"
    }
  }) &&
  acknowledgedExplanationIds.includes("l1-context-not-sentence");
```

No prediction field is inspected.

Failure reason when false:

> “Read the third row, then choose what made it cheap.”

Evidence on pass:

- “After the reveal: **It read the saved context; only the task sentence was new.**”
- “Third request: **34,738 read · 0 written**.”
- “Three requests produced three ledger rows.”

Stars:

- **1 star — Read the evidence:** the behavioral pass predicate succeeds.
- **2 stars — Kept the thread:** pass and `l1-r3` resolves with `readTok=34,738`, `writeTok=0`, and `cold=false`.
- **3 stars — Three in a row:** two-star predicate, exactly one cold write and two reads, no rewind, and spend `≤ $0.2347878`.

Prediction selection and correctness affect none of the three predicates.

The reference route is winnable from seed `1001` and earns three stars. The clean-chat route produces two cold writes and freezes on its visibly more expensive third request. After rewind, the player can pass without replaying mastered setup.

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
3. All four `interactionPatterns` values are canonical kebab-case IDs; no uppercase `PATTERN_*` alias appears.
4. Within `2s` `[ESTIMATE]`, first **Send** is keyboard- and pointer-operable; no instruction card blocks it.
5. Before `l1-r1`, no copy reveals that later requests will be blue, cheaper, read, cached, or reused.
6. First **Send** dispatches one `SEND_REQUEST`, creates one `LedgerRow`, one tape row, and one live `CacheEntry`.
7. `l1-r1` prices to exactly `$0.210264` from `C1`, `C3`, and `C34`.
8. Second **Send** adds exactly one ledger/tape row; `l1-r2` prices to `$0.0122634`.
9. `l1-r2` reads `34,738`, writes `0`, and refreshes the live entry under `C12`.
10. The third route controls appear only after `l1-r2` evidence is visible.
11. **Keep working here** and **Open a clean chat** are both keyboard- and pointer-operable and both can complete the test request.
12. **Open a clean chat** dispatches `DISCARD_CONTEXT` as an ordinary thread-management action, not a control labeled as failure.
13. `DISCARD_CONTEXT` creates no ledger row and changes no wallet value.
14. After either route choice, the third `SEND_REQUEST` cannot dispatch before `COMMIT_PREDICTION`.
15. Prediction selection alone does not unlock sending; commitment does.
16. No correctness treatment appears before the selected route’s third request is priced and rendered.
17. Reference `l1-r3` prices to `$0.0122604`, reads `34,738`, writes `0`, and refreshes the cache.
18. Clean-chat `l1-r3-clean` prices to `$0.210267`, reads `0`, writes `34,738`, and creates the third ledger/tape row.
19. A wrong prediction changes no score, star, wallet, failure predicate, gate result, or request resolution.
20. The one-star gate does not inspect `prediction.optionId`, `correctOptionId`, or prediction correctness.
21. The gate observes `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }` after `l1-reveal-third-reference`.
22. An explanation action before the reveal cannot satisfy the gate.
23. Incorrect explanation choices create no request and no economic penalty; the player can inspect the tape and retry.
24. Each priced request maps to exactly one `LedgerRow` and one tape row.
25. Every real request cost is positive and equals `PRICE_REQUEST`.
26. No positive price displays as `$0.0000`; sufficiently precise values appear in detailed views.
27. Static final tape bars render without hover and preserve ledger order.
28. `UI_TAPE_RENDERER` segments equal the priced buckets; no decorative segment is treated as a request.
29. `outTok` contributes to every row’s canonical segment width and total visual weight.
30. The `$0.001800` output contribution remains available in `UI_HOVER_PRICE_CALCULATOR`.
31. Freeze occurs only after `l1-r3-clean`, its `$0.210267` cost, and the `$0.0122604` valid alternative are visible.
32. Failure rule validation asserts `actualUsd=$0.210267 > validAlternativeUsd=$0.0122604`.
33. The route choice is reachable: clean thread offers organization/isolation while same chat retains reusable context.
34. **Choose the thread again** restores the checkpoint byte-identically: two rows, wallet `$0.0774726`, live cache, no route, and no committed prediction.
35. Rewind creates no duplicate rows and does not replay either mastered send.
36. Reference seed/configuration is winnable and earns three stars regardless of prediction correctness.
37. The anti-pattern action path freezes independently of budget-only gate logic.
38. `UI_COUNTERFACTUAL_OVERLAY` remains unavailable before a meaningful completed attempt.
39. The post-attempt comparison uses the same seed and authoritative `$0.0122604`, `$0.210267`, and `$0.1980066` values.
40. Pointer and keyboard paths produce equivalent `Action[]`.
41. Reduced-motion mode produces identical final state, pricing, reveal order, tape geometry, and gate evidence.
42. Refresh/replay from seed `1001` and saved `Action[]` reproduces byte-identical `ReducerState`, ledger, wallet, and result.
43. Each authoritative request count, token count, cost, total, and threshold has only one implementable value.
44. `MAIN_PREFIX_HEY` is cited as `C34`; the level does not define a competing main-prefix constant.

## 13. Reference-bar justification

The screen opens on one inviting action and lets the first wallet hit land before naming anything. A second related request then produces the surprising blue contrast through play, not explanation. The player applies that evidence to an ordinary workspace choice—keep related work together or give it a tidy clean thread—commits a prediction, and only then sees the third request settle.

The route choice is plausible rather than a purpose-built failure button: a clean thread has a recognizable organization benefit, while the same chat preserves economically useful context for this related ticket. Choosing the clean thread exposes a genuine, visible consequence, freezes only after the ledger proves it is more expensive, and rewinds directly to the thread decision.

Finally, the one-star gate asks for a causal explanation after the reveal. The pre-reveal guess remains psychologically useful but economically and mechanically non-punitive. The rhythm is act, notice, choose, predict, reveal, explain, and—if necessary—rewind, preserving the surprise while requiring demonstrated understanding.

Assumption: this level uses the measured `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). Tiny request/output sizes, wallet, seed, and presentation timings remain explicitly `[FICTION]` or `[ESTIMATE]`. The clean-chat benefit is intentionally qualitative workspace organization; both routes complete the task, while the visible ledger supplies the level’s economic teaching consequence.
