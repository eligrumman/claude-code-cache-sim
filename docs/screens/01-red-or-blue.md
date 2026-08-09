# Level 1 — Bob’s Login Bug

## 1. Identity

- `id`: `"01-red-or-blue"`
- `title`: `Bob’s Login Bug`
- `tier`: `1`
- `objective`: “Finish Bob’s login, logout, and test work, then explain the third bill.”
- ONE concept: Reusing an unchanged context converts the saved prefix from `RATE_CACHE_WRITE_1H` to `RATE_CACHE_READ`.
- Prerequisite concepts: none.
- `concept.id`: `"write-vs-read"`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `concept.privateDesignerSummary`: Reusing the same `MAIN_SESSION_CONTEXT` makes its saved prefix a read on later requests.
- `concept.postRevealRule`: “The expensive part was the saved context, not the new sentence.”
- `concept.solutionVocabulary`: `["red", "blue", "write", "read", "cache", "cached", "context", "reuse", "reusing", "same chat", "clean chat", "isolated thread"]`

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
- `AttemptMetrics`
- `AttemptResult`
- `StatePredicate`
- `GateDef`
- `StarDef`
- `RESOLVE_PREFIX`
- `PRICE_REQUEST`
- `ReducerState`
- `UnitSeed`
- `ContextSeed`
- `PrefixStackSeed`
- `ScenarioFixtureDef`
- `UI_TAPE_RENDERER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `"predict-before-reveal"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction appears within `1s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0s` | Show Bob’s task card, an empty `UI_TAPE_RENDERER`, and scalar `wallet` at **$0.30** from fixture `l1-budget`. Cache terminology remains hidden. |
| `0.3s` `[ESTIMATE]` | Bob: “Login is broken. Ask Claude to fix it?” |
| `0.8s` `[ESTIMATE]` | Primary control appears: **Send**. No rate table, comparison, color legend, or explanation is visible. |
| First click | `l1-r1` settles as a red-dominant row; wallet becomes **$0.089736**. |
| After settle | `UI_MAIN_CACHE_PANEL` appears. Toast: “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `+1.2s` `[ESTIMATE]` | Bob replaces the task text with: “Add the matching logout route.” |
| Second click | `l1-r2` settles as a blue-dominant row; wallet becomes **$0.0774726**. |
| After settle | Toast: “Same saved context. **READ · $0.0122634**.” |
| `+0.8s` `[ESTIMATE]` | A related third task appears: “Add a test for both routes.” Bob asks whether its review trail should stay with the implementation or remain isolated. |

The third-task decision has two completable routes and two reducer-visible benefits:

- **Keep working here** — the third request uses `l1-main`; its live prefix lowers `attemptMetrics.spentUsd`.
- **Open an isolated test thread** — the third request uses the separate `l1-clean` cache namespace. Completing that branch appends `l1-isolated-test-completed` to `completedEventIds`, which is an alternative route to `L1_STAR2`.

Both routes produce the requested test, permit the causal explanation, satisfy `l1Pass(st)`, and can earn three stars. Same-chat receives the economic benefit; isolated-thread receives the star-bearing separation benefit. Neither route dispatches `FREEZE_FAILURE`.

Vocabulary timing:

- “token” and “write” first appear after `l1-r1`.
- “read” first appears after `l1-r2`.
- Cache-namespace evidence may appear only after `l1-r2`.
- TTL terminology remains hidden; expiry is not this level’s concept.

## 4. Exact event sequence

The economical route keeps `l1-main`. Its cacheable prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). All cacheable `PrefixBlock.identityHash` values remain byte-identical; only the fresh current sentence changes. The isolated route uses the independently seeded `l1-clean` namespace with the same base content but no live entry.

1. **Enter the level**
   - Event: route opens `"01-red-or-blue"`.
   - Action: `ENTER_LEVEL { levelId: "01-red-or-blue" }`.
   - Mutates: `ReducerState`, scalar `wallet`, scalar `budget`, clock fields, `units`, the two `MAIN_SESSION_CONTEXT` objects, both `PREFIX_STACK` entries, `attemptMetrics`, and empty ledger/tape state.
   - Numbers: `wallet=$0.30`, `budget=$0.30`, and `clockCapMin=60` come from fixtures `l1-budget` and `l1-clock-cap`; reusable prefix `34,738 tok` is `C34`.
   - Copy: “Login is broken. Ask Claude to fix it?”

2. **First send**
   - Event: player clicks **Send** for “Fix the login route.”
   - Action: `SEND_REQUEST { request: l1-r1 }`.
   - Request context: `l1-main`.
   - Mutates: `CacheEntry`, `UI_MAIN_CACHE_PANEL`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics.spentUsd`, `attemptMetrics.requestCount`, and the `UI_TAPE_RENDERER` payload.
   - Resolution: `readTok=0`, `inputTok=12`, `writeTok=34,738`, `outTok=120`, `cold=true`.
   - Price:
     - write: `$0.208428`
     - input: `$0.000036`
     - output: `$0.001800`
     - total: `$0.210264`
   - Wallet: `$0.3000000 → $0.0897360`.
   - Attempt metrics: `spentUsd=$0.210264`; `requestCount=1`.
   - Citations: `C1`, `C3`, `C34`; fresh input and output use fixtures `l1-r1-fresh-input` and `l1-output-per-request`.
   - Render: red write, red fresh-input, and violet output segments. No claim about later requests appears.

3. **Second send**
   - Event: player clicks **Send** for “Add the matching logout route.”
   - Action: `SEND_REQUEST { request: l1-r2 }`.
   - Request context: `l1-main`.
   - Mutates: the live `CacheEntry`, its touch/expiry values, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=14`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000042`
     - output: `$0.001800`
     - total: `$0.0122634`
   - Wallet: `$0.0897360 → $0.0774726`.
   - Attempt metrics: `spentUsd=$0.2225274`; `requestCount=2`.
   - Citations: `C1`, `C3`, `C12`, `C34`; fresh input and output use fixtures `l1-r2-fresh-input` and `l1-output-per-request`.
   - Render: blue-dominant row with visible red and violet contributions. Only now may copy say that saved context was read.

4. **Choose the third task’s thread**
   - Availability: only after `l1-r2` evidence is visible.
   - Same-chat event: player clicks **Keep working here**.
   - Same-chat action: `BEGIN_TRANSFER { challengeId: "l1-third-same-chat" }`.
   - Same-chat event completion appends `"l1-route-same-chat-chosen"` to `completedEventIds`.
   - Isolated event: player clicks **Open an isolated test thread**.
   - Isolated action: `BEGIN_TRANSFER { challengeId: "l1-third-isolated" }`.
   - Isolated event completion appends `"l1-route-isolated-chosen"` to `completedEventIds`.
   - Each accepted choice records exactly one route marker. Neither action creates a `LedgerRow`, changes `wallet`, changes `attemptMetrics.spentUsd`, or invalidates the other context’s cache.

5. **Open the route-specific prediction**
   - Event: after either route marker is recorded, player clicks **Predict, then send**.
   - Action: `OPEN_PREDICTION { promptId: "l1-third-color-cost" }`.
   - Mutates: `phase="predict"` and `prediction`.
   - The prompt repeats the chosen route but shows no correctness treatment or numeric result.

6. **Commit the prediction**
   - Event: player selects an option and clicks **Lock prediction**.
   - Actions, in order:
     - `SELECT_PREDICTION { promptId: "l1-third-color-cost", optionId }`
     - `COMMIT_PREDICTION { promptId: "l1-third-color-cost" }`
   - Mutates: `prediction.optionId`, then `prediction.committed=true`.
   - No request, cache touch, ledger row, wallet mutation, score, gate, star, or route-benefit change occurs.
   - The third `SEND_REQUEST` remains disabled until commitment.

7. **Same-chat third send**
   - Preconditions: `completedEventIds` includes `"l1-route-same-chat-chosen"` and the prediction is committed.
   - Event: player clicks **Send and find out**.
   - Action: `SEND_REQUEST { request: l1-r3 }`.
   - Request context: `l1-main`.
   - Mutates: the live `CacheEntry`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=13`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Price:
     - read: `$0.0104214`
     - input: `$0.000039`
     - output: `$0.001800`
     - total: `$0.0122604`
   - Wallet: `$0.0774726 → $0.0652122`.
   - Attempt metrics: `spentUsd=$0.2347878`; `requestCount=3`.
   - Citations: `C1`, `C3`, `C12`, `C34`; fresh input and output use fixtures `l1-r3-fresh-input` and `l1-output-per-request`.
   - Event completion appends `"l1-third-same-chat-settled"` to `completedEventIds`.
   - Consequential benefit: the route retains the lower reducer-owned spend.

8. **Reveal the same-chat prediction**
   - Event: `l1-r3` is fully priced and rendered.
   - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "blue-pennies" }`.
   - Mutates: prediction evidence, `phase="reveal"`, and `completedEventIds`.
   - Event ID: `"l1-reveal-third-same-chat"`.
   - Copy: “The sentence was new. The **34,738-token context** was already saved.”

9. **Isolated-thread third send**
   - Preconditions: `completedEventIds` includes `"l1-route-isolated-chosen"` and the prediction is committed.
   - Event: player clicks **Send and find out**.
   - Action: `SEND_REQUEST { request: l1-r3-clean }`.
   - Request context: `l1-clean`.
   - Mutates: a new `CacheEntry` in `l1-clean`, `ledger`, `lastRequests`, `wallet`, `attemptMetrics`, and tape. The live `l1-main` entry remains intact.
   - Resolution: `readTok=0`, `inputTok=13`, `writeTok=34,738`, `outTok=120`, `cold=true`.
   - Price:
     - write: `$0.208428`
     - input: `$0.000039`
     - output: `$0.001800`
     - total: `$0.210267`
   - Wallet: `$0.0774726 → -$0.1327944`.
   - Attempt metrics: `spentUsd=$0.4327944`; `requestCount=3`.
   - Citations: `C1`, `C3`, `C34`; fresh input and output use fixtures `l1-r3-fresh-input` and `l1-output-per-request`.
   - Event completion atomically appends both `"l1-third-isolated-settled"` and `"l1-isolated-test-completed"` to `completedEventIds`.
   - Consequential benefit: `"l1-isolated-test-completed"` is the reducer-visible alternative route in `L1_STAR2`.
   - No failure freezes. A negative scalar wallet is permitted by `Wallet` and is not the behavioral gate.

10. **Reveal the isolated-thread prediction**
    - Event: `l1-r3-clean` is fully priced and rendered.
    - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "red-much-more" }`.
    - Mutates prediction evidence, `phase="reveal"`, and `completedEventIds`.
    - Event ID: `"l1-reveal-third-isolated"`.
    - Copy: “The isolated thread got its own work trail—and had to save its own **34,738-token context**.”
    - Prediction correctness has no effect on route completion or rewards.

11. **Post-evidence explanation choice**
    - Availability: after either `"l1-reveal-third-same-chat"` or `"l1-reveal-third-isolated"`.
    - Prompt: “Why did the two thread choices produce different bills?”
    - Correct action: `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }`.
    - Other choices dispatch `ACK_EXPLANATION` with their own IDs and return focus to the evidence. They do not spend money, freeze, alter route rewards, or complete the gate.
    - Correct copy: “The sentence stayed small; the bill changed because one thread could read saved context and the other had to write its own.”
    - Mutates: `acknowledgedExplanationIds` and `phase`.
    - This post-evidence action, not the prediction, supplies the one-star gate evidence.

12. **Complete either attempt**
    - Event ID: `"l1-complete-attempt"`.
    - Preconditions: three requests completed, one route marker and its matching reveal are complete, and `"l1-context-not-sentence"` was acknowledged after that reveal.
    - Action: `COMPLETE_ATTEMPT`.
    - Mutates: gate result, stars, `attemptResult`, `phase="result"`, and `UI_RESULT_SCREEN`.
    - Same-chat result: `attemptResult.spentUsd=$0.2347878`; `wallet=$0.0652122`.
    - Isolated result: `attemptResult.spentUsd=$0.4327944`; `wallet=-$0.1327944`.
    - Both results pass and are three-star eligible.

13. **Optional post-attempt comparison**
    - Availability: only after `"l1-complete-attempt"`.
    - Actions:
      - `REQUEST_COUNTERFACTUAL { comparisonId: "l1-thread-choice-comparison" }`
      - `REVEAL_COUNTERFACTUAL { comparisonId: "l1-thread-choice-comparison" }`
    - `UI_COUNTERFACTUAL_OVERLAY` pairs `l1-r3` with `l1-r3-clean`.
    - It shows `$0.0122604` versus `$0.210267` and the `$0.1980066` delta, alongside the isolated route’s `"l1-isolated-test-completed"` reward.
    - Neither action mutates the completed attempt or dispatches `FREEZE_FAILURE`.

## 5. Level data

```ts
const LEVEL_01_RED_OR_BLUE: LevelDef = {
  id: "01-red-or-blue",
  tier: 1,
  title: "Bob’s Login Bug",
  objective:
    "Finish Bob’s login, logout, and test work, then explain the third bill.",

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
      "clean chat",
      "isolated thread"
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
    units: [
      {
        id: "fix-login",
        kind: "DEBUG",
        ticket: 1,
        deps: [],
        hours: 0,
        outTok: 120,
        workIn: 12,
        cause: null,
        scripted: true,
        label: "Fix login"
      },
      {
        id: "add-logout",
        kind: "DEV",
        ticket: 1,
        deps: ["fix-login"],
        hours: 0,
        outTok: 120,
        workIn: 14,
        cause: null,
        scripted: true,
        label: "Add logout"
      },
      {
        id: "test-routes",
        kind: "WRITE_TESTS",
        ticket: 1,
        deps: ["fix-login", "add-logout"],
        hours: 0,
        outTok: 120,
        workIn: 13,
        cause: null,
        scripted: true,
        label: "Test both routes"
      }
    ] satisfies UnitSeed[],

    contexts: [
      {
        kind: "main",
        id: "l1-main",
        sessionId: "l1-bob-implementation",
        cacheNamespace: "l1-main-ns",
        initialPrefixStackId: "l1-main-prefix"
      },
      {
        kind: "main",
        id: "l1-clean",
        sessionId: "l1-bob-isolated-test",
        cacheNamespace: "l1-clean-ns",
        initialPrefixStackId: "l1-clean-prefix"
      }
    ] satisfies ContextSeed[],

    prefixStacks: [
      {
        id: "l1-main-prefix",
        contextId: "l1-main",
        blocks: [
          {
            id: "l1-main-system",
            kind: "system",
            label: "System",
            tokenCount: 2750,
            identityHash: "l1-system-c6",
            order: 0,
            cacheable: true,
            breakpointAfter: false,
            stability: "stable"
          },
          {
            id: "l1-main-tools",
            kind: "tools",
            label: "Tools",
            tokenCount: 16295,
            identityHash: "l1-tools-c24",
            order: 1,
            cacheable: true,
            breakpointAfter: false,
            stability: "stable"
          },
          {
            id: "l1-main-history",
            kind: "history",
            label: "Bob’s saved work",
            tokenCount: 15693,
            identityHash: "l1-bob-history-c6",
            order: 2,
            cacheable: true,
            breakpointAfter: true,
            stability: "session"
          },
          {
            id: "l1-main-current",
            kind: "current",
            label: "Current task",
            tokenCount: 0,
            identityHash: "l1-current-placeholder",
            order: 3,
            cacheable: false,
            breakpointAfter: false,
            stability: "volatile"
          }
        ]
      },
      {
        id: "l1-clean-prefix",
        contextId: "l1-clean",
        blocks: [
          {
            id: "l1-clean-system",
            kind: "system",
            label: "System",
            tokenCount: 2750,
            identityHash: "l1-system-c6",
            order: 0,
            cacheable: true,
            breakpointAfter: false,
            stability: "stable"
          },
          {
            id: "l1-clean-tools",
            kind: "tools",
            label: "Tools",
            tokenCount: 16295,
            identityHash: "l1-tools-c24",
            order: 1,
            cacheable: true,
            breakpointAfter: false,
            stability: "stable"
          },
          {
            id: "l1-clean-history",
            kind: "history",
            label: "Bob’s saved work",
            tokenCount: 15693,
            identityHash: "l1-bob-history-c6",
            order: 2,
            cacheable: true,
            breakpointAfter: true,
            stability: "session"
          },
          {
            id: "l1-clean-current",
            kind: "current",
            label: "Current task",
            tokenCount: 0,
            identityHash: "l1-current-placeholder",
            order: 3,
            cacheable: false,
            breakpointAfter: false,
            stability: "volatile"
          }
        ]
      }
    ] satisfies PrefixStackSeed[],

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
        id: "l1-clock-cap",
        label: "Level clock cap",
        semanticRole: "Maximum simulated duration available to the onboarding attempt",
        value: 60,
        unit: "min",
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
        id: "l1-task-count",
        label: "Scripted task count",
        semanticRole: "Number of related Bob tasks and priced requests in a completed route",
        value: 3,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l1-context-count",
        label: "Available thread count",
        semanticRole: "Main implementation thread plus isolated test thread",
        value: 2,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l1-scripted-unit-duration",
        label: "Explicit-send unit duration",
        semanticRole: "UnitSeed hours value because simulation time does not advance during explicit sends",
        value: 0,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l1-first-attempt-index",
        label: "No-restart star target",
        semanticRole: "Attempt index required by the three-star first-try condition",
        value: 1,
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
      },
      {
        label: "Bob opening-line delay seconds",
        value: 0.3,
        tag: "[ESTIMATE]"
      },
      {
        label: "Initial Send-control reveal seconds",
        value: 0.8,
        tag: "[ESTIMATE]"
      },
      {
        label: "Second-task transition seconds",
        value: 1.2,
        tag: "[ESTIMATE]"
      },
      {
        label: "Third-task transition seconds",
        value: 0.8,
        tag: "[ESTIMATE]"
      },
      {
        label: "Keyboard-and-pointer readiness QA seconds",
        value: 2,
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
    "l1-isolated-thread",
    "l1-route-benefit"
  ],
  interactionPatterns: [
    "predict-before-reveal",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "none",
    cite: "C34",
    line:
      "Both thread choices complete; the saved-context route spends less while the isolated route earns a reducer-recorded separation benefit."
  },

  failureRules: [],
  checkpoints: [],

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
      id: "l1-thread-choice-comparison",
      unlockAfterEventId: "l1-complete-attempt",
      kind: "alternate-choice",
      cfg: {
        devModel: "sonnet",
        who: "inline",
        oneHourFlag: true
      },
      comparisonQuestion:
        "What did each thread choice gain?",
      revealCopy:
        "Keeping the task here preserved the lower bill; isolating it earned the separate-test-thread benefit but wrote its own 34,738-token prefix."
    }
  ],

  tape: "§7 TapeSpec",
  result: "§10 ResultSpec",
  vocabulary: ["token", "write", "read"],
  qa: "§12 QaAssertion[]"
};
```

The two prefix stacks use measured components: system `2,750` (`C6`), tools `16,295` (`C24`), and saved messages/history `15,693` (`C6`), totaling `34,738` (`C34`). The two stacks deliberately share byte identities but remain isolated by their distinct `cacheNamespace` values.

All gameplay fiction is declared in `scenarioData.fixtures`. `scenarioData.estimates` contains presentation timing only.

## 6. Pricing walkthrough

Model: Sonnet. `RATE_INPUT=$3/M`, `RATE_CACHE_READ=$0.30/M`, `RATE_CACHE_WRITE_1H=$6/M`, and `RATE_OUTPUT=$15/M` (`C1`, `C3`). The reusable prefix is `MAIN_PREFIX_HEY = 34,738 tok` (`C34`).

This is the sole authoritative request-price table for the level:

| Request | Route | Priced buckets | `PRICE_REQUEST` calculation | Cost |
|---|---|---|---:|---:|
| `l1-r1` | First request | `0 read + 12 input + 34,738 write + 120 output` | `0 + 12×$3/M + 34,738×$6/M + 120×$15/M` | `$0.210264` |
| `l1-r2` | Same implementation thread | `34,738 read + 14 input + 0 write + 120 output` | `34,738×$0.30/M + 14×$3/M + 120×$15/M` | `$0.0122634` |
| `l1-r3` | Keep working here | `34,738 read + 13 input + 0 write + 120 output` | `34,738×$0.30/M + 13×$3/M + 120×$15/M` | `$0.0122604` |
| `l1-r3-clean` | Isolated test thread | `0 read + 13 input + 34,738 write + 120 output` | `0 + 13×$3/M + 34,738×$6/M + 120×$15/M` | `$0.210267` |

Same-chat three-star-eligible result:

```text
spend
= $0.210264 + $0.0122634 + $0.0122604
= $0.2347878

wallet remaining
= $0.3000000 - $0.2347878
= $0.0652122
```

Isolated-thread three-star-eligible result:

```text
spend
= $0.210264 + $0.0122634 + $0.210267
= $0.4327944

wallet remaining
= $0.3000000 - $0.4327944
= -$0.1327944
```

Request-local comparison:

```text
third-request difference
= $0.210267 - $0.0122604
= $0.1980066
```

The isolated third request is about `17.15×` the same-chat third request. This is informational evidence, not a failure trigger: the isolated route also records `"l1-isolated-test-completed"` and remains completable.

The `20×` one-hour-write-to-read input-side rate ratio (`C5`) may appear only after an attempt. It is not shown before the player produces the evidence.

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

3. Same-chat reveal group `l1-third-same-chat`
   - request: `l1-r3`
   - `gatedByPredictionId: "l1-third-color-cost"`
   - ordered segments: `read(34,738)`, `input(13)`, `output(120)`
   - label: `Test both · work thread`

4. Isolated-thread reveal group `l1-third-isolated`
   - request: `l1-r3-clean`
   - `gatedByPredictionId: "l1-third-color-cost"`
   - ordered segments: `write(34,738)`, `input(13)`, `output(120)`
   - label: `Test both · isolated thread`

`ahaRequestIds: ["l1-r3", "l1-r3-clean"]`, selected by the executed route.

Same-chat aha frame: the three settled rows remain visible together. Row one is red-dominant; rows two and three are blue-dominant despite their different current sentences.

Isolated aha frame: the original red/blue pair stays visible beside the isolated red-dominant third row. A separate-namespace badge is backed by `"l1-isolated-test-completed"` rather than view-local state.

Only after `REVEAL_PREDICTION` does the route-specific caption appear:

- Same-chat: “Three different requests. One saved context.”
- Isolated: “One separate work trail. One separate context write.”

The tape uses canonical output-aware geometry:

```text
segment.widthRatio = segment.usd / row.usd
segment.startRatio = sum(previousSegment.usd) / row.usd
```

Each request’s `$0.001800` output charge contributes violet visual width from its first render. Hiding or delaying an output label may not remove `outTok` from bar weight. `UI_HOVER_PRICE_CALCULATOR` shows every nonzero bucket and asserts its contributions against the authoritative `LedgerRow.usd`.

Static final bars render before hover.

## 8. Prediction prompt

### `l1-third-color-cost`

Route-specific question:

> “You chose **{Keep working here | Open an isolated test thread}**. Before you send: which color will dominate, and will the cost stay small or jump?”

Options:

- `blue-pennies`: “Blue — pennies”
- `red-much-more`: “Red — much more”
- `violet-mostly-output`: “Violet — mostly output”

The prompt does not expose the isolated branch’s `$0.210267` magnitude before play.

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
- causes no failure;
- removes no star;
- does not affect the gate or `pass(st)`.

Keyboard and pointer selection dispatch identical action sequences.

After either reveal, the post-evidence explanation prompt asks:

> “Why did the two thread choices produce different bills?”

Options:

- `l1-context-not-sentence`: “One thread could read saved context; the isolated thread had to write its own.”
- `l1-short-is-always-cheap`: “Short requests are always cheap.”
- `l1-tests-cost-less`: “Tests are billed at a cheaper rate.”

Only `l1-context-not-sentence`, chosen after the executed route’s reveal, satisfies the behavioral gate. Incorrect explanation choices spend nothing and leave the evidence visible for another choice.

## 9. Fail-state

There is no punitive branch in this level:

```ts
const L1_FAILURE_RULES: FailureRuleDef[] = [];
```

Both third-task routes are intentional, completable decisions:

- **Keep working here** confers the lower `attemptMetrics.spentUsd`.
- **Open an isolated test thread** confers `"l1-isolated-test-completed"`, which affects `L1_STAR2`.

The isolated request is more expensive, but cost alone does not make an otherwise valid, rewarded route a failure. Therefore:

- no `FREEZE_FAILURE` follows `l1-r3` or `l1-r3-clean`;
- no rewind checkpoint is created;
- a negative wallet does not substitute for the behavioral gate;
- prediction correctness never creates failure;
- counterfactual events are informational and cannot freeze.

An invalid premature send is rejected before request creation. It produces no `LedgerRow`, spend, freeze, or completed route marker.

## 10. Gate & stars

The authoritative gate uses only legal `StatePredicate` kinds and canonical state paths:

```ts
const L1_ROUTE_REVEALED: StatePredicate = {
  id: "l1-route-revealed",
  kind: "any",
  predicates: [
    {
      id: "l1-same-chat-reveal-completed",
      kind: "event-completed",
      eventId: "l1-reveal-third-same-chat"
    },
    {
      id: "l1-isolated-reveal-completed",
      kind: "event-completed",
      eventId: "l1-reveal-third-isolated"
    }
  ]
};

const L1_ROUTE_RECORDED: StatePredicate = {
  id: "l1-route-recorded",
  kind: "any",
  predicates: [
    {
      id: "l1-same-chat-route-recorded",
      kind: "includes",
      path: "completedEventIds",
      value: "l1-route-same-chat-chosen"
    },
    {
      id: "l1-isolated-route-recorded",
      kind: "includes",
      path: "completedEventIds",
      value: "l1-route-isolated-chosen"
    }
  ]
};

const L1_POST_REVEAL_EXPLANATION: StatePredicate = {
  id: "l1-explanation-action-after-executed-reveal",
  kind: "any",
  predicates: [
    {
      id: "l1-explanation-after-same-chat-reveal",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "l1-reveal-third-same-chat",
      match: {
        explanationId: "l1-context-not-sentence"
      }
    },
    {
      id: "l1-explanation-after-isolated-reveal",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "l1-reveal-third-isolated",
      match: {
        explanationId: "l1-context-not-sentence"
      }
    }
  ]
};

const L1_GATE: GateDef = {
  predicateId: "l1-post-reveal-causal-explanation",

  evidenceRevealEventIds: [
    "l1-reveal-third-same-chat",
    "l1-reveal-third-isolated"
  ],

  postEvidenceActionRequirements: [
    L1_POST_REVEAL_EXPLANATION
  ],

  behavioralRequirements: [
    {
      id: "l1-three-priced-requests",
      kind: "compare",
      path: "ledger.length",
      op: "eq",
      value: 3
    },
    L1_ROUTE_RECORDED,
    L1_ROUTE_REVEALED,
    {
      id: "l1-causal-rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l1-context-not-sentence"
    }
  ],

  explanationRequirement: {
    id: "l1-explanation-required",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "l1-context-not-sentence"
  }
};
```

`pass(st)` is pure and reads only declared `ReducerState` fields and real arrays:

```ts
function l1Pass(st: ReducerState): GateResult {
  const sameChatRoute =
    st.completedEventIds.includes("l1-route-same-chat-chosen") &&
    st.completedEventIds.includes("l1-third-same-chat-settled") &&
    st.completedEventIds.includes("l1-reveal-third-same-chat") &&
    st.lastRequests.length === 1 &&
    st.lastRequests[0].requestId === "l1-r3";

  const isolatedRoute =
    st.completedEventIds.includes("l1-route-isolated-chosen") &&
    st.completedEventIds.includes("l1-third-isolated-settled") &&
    st.completedEventIds.includes("l1-isolated-test-completed") &&
    st.completedEventIds.includes("l1-reveal-third-isolated") &&
    st.lastRequests.length === 1 &&
    st.lastRequests[0].requestId === "l1-r3-clean";

  const passed =
    st.ledger.length === 3 &&
    (sameChatRoute || isolatedRoute) &&
    st.acknowledgedExplanationIds.includes(
      "l1-context-not-sentence"
    );

  return {
    pass: passed,
    reason: passed
      ? "The player connected the third bill to saved-context availability."
      : "Finish either thread route, read its third row, then explain the bill.",
    evidence: passed
      ? [
          sameChatRoute
            ? "Same thread: 34,738 read · 0 written."
            : "Isolated thread: 0 read · 34,738 written.",
          "The route choice was recorded before the third request.",
          "Three requests produced three ledger rows."
        ]
      : []
  };
}
```

The gate evaluator additionally enforces `L1_POST_REVEAL_EXPLANATION`, so an acknowledgment created before the executed reveal cannot pass.

The authoritative star predicates are:

```ts
const L1_STAR2: StarDef = {
  label: "Made the tradeoff count",
  reason:
    "Either preserved the lower bill in one thread or completed the reducer-recorded isolated-test benefit.",
  predicate: {
    id: "l1-star2",
    kind: "any",
    predicates: [
      {
        id: "l1-star2-economy-route",
        kind: "all",
        predicates: [
          {
            id: "l1-star2-same-chat-chosen",
            kind: "includes",
            path: "completedEventIds",
            value: "l1-route-same-chat-chosen"
          },
          {
            id: "l1-star2-same-chat-request",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "l1-r3"
          },
          {
            id: "l1-star2-same-chat-spend",
            kind: "compare",
            path: "attemptMetrics.spentUsd",
            op: "lte",
            value: 0.2347878
          }
        ]
      },
      {
        id: "l1-star2-isolation-route",
        kind: "all",
        predicates: [
          {
            id: "l1-star2-isolated-chosen",
            kind: "includes",
            path: "completedEventIds",
            value: "l1-route-isolated-chosen"
          },
          {
            id: "l1-star2-isolated-benefit",
            kind: "includes",
            path: "completedEventIds",
            value: "l1-isolated-test-completed"
          },
          {
            id: "l1-star2-isolated-request",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "l1-r3-clean"
          },
          {
            id: "l1-star2-isolated-cold",
            kind: "compare",
            path: "lastRequests.0.cold",
            op: "eq",
            value: true
          }
        ]
      }
    ]
  }
};

const L1_STAR3: StarDef = {
  label: "Explained it first try",
  reason:
    "Completed either consequential route and identified the saved-context cause without restarting.",
  predicate: {
    id: "l1-star3",
    kind: "all",
    predicates: [
      L1_STAR2.predicate,
      L1_ROUTE_REVEALED,
      L1_POST_REVEAL_EXPLANATION,
      {
        id: "l1-star3-explanation-acknowledged",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "l1-context-not-sentence"
      },
      {
        id: "l1-star3-three-rows",
        kind: "compare",
        path: "ledger.length",
        op: "eq",
        value: 3
      },
      {
        id: "l1-star3-one-last-request",
        kind: "compare",
        path: "lastRequests.length",
        op: "eq",
        value: 1
      },
      {
        id: "l1-star3-valid-third-request",
        kind: "any",
        predicates: [
          {
            id: "l1-star3-same-chat-third",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "l1-r3"
          },
          {
            id: "l1-star3-isolated-third",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "l1-r3-clean"
          }
        ]
      },
      {
        id: "l1-star3-no-restart",
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

- **1 star — Read the evidence:** `l1Pass(st).pass` succeeds after the executed route’s post-evidence explanation.
- **2 stars — Made the tradeoff count:** `L1_STAR2.predicate` recognizes the lower-spend same-chat benefit or the reducer-recorded isolated-test benefit.
- **3 stars — Explained it first try:** `L1_STAR3.predicate` succeeds on either route without a restart.

Result copy:

- Pass headline: **“You found what changed.”**
- Pass rule: **“The expensive part was the saved context, not the new sentence.”**
- Same-chat benefit: **“Lower bill: the existing thread read its saved context.”**
- Isolated benefit: **“Separate trail: the test completed in its own recorded thread.”**
- Continue: **Next level**
- Retry explanation: **Read the third row again**

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l1-first-write` | `l1-r1` settles | “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `l1-first-read` | `l1-r2` settles | “Same saved context. **READ · $0.0122634**.” |
| `l1-third-reveal` | Either route’s `REVEAL_PREDICTION` | “The new sentence was tiny. The available saved context decided the bill.” |
| `l1-isolated-thread` | `l1-route-isolated-chosen` completes | “Isolated test thread ready. Its work trail will be recorded separately.” |
| `l1-route-benefit` | `"l1-complete-attempt"` | Same-chat: “Lower spend preserved.” Isolated: “Separate test trail recorded.” |

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
4. `concept.solutionVocabulary` is present, and neither `title` nor `objective` contains any registered solution term.
5. All three `interactionPatterns` values are canonical kebab-case IDs.
6. Within `2s` `[ESTIMATE]`, first **Send** is keyboard- and pointer-operable; no instruction card blocks it.
7. Before `l1-r1`, no player-facing copy reveals that later requests will be blue, cheaper, read, cached, or reused.
8. `scenarioData.units` contains three actual `UnitSeed` objects, not string IDs.
9. `scenarioData.contexts` contains two actual `ContextSeed` objects with distinct cache namespaces.
10. `scenarioData.prefixStacks` contains two actual `PrefixStackSeed` objects.
11. Each prefix stack contains ordered `system`, `tools`, `history`, and final `current` blocks.
12. Each cacheable base totals `2,750 + 16,295 + 15,693 = 34,738` tokens from `C6`, `C24`, and `C34`.
13. Every gameplay `[FICTION]` scalar is represented by a semantically matching `ScenarioFixtureDef`.
14. `scenarioData.estimates` contains presentation timing only.
15. First **Send** dispatches one `SEND_REQUEST`, creates one `LedgerRow`, one tape row, and one live `l1-main` `CacheEntry`.
16. `l1-r1` prices exactly to `$0.210264` from `C1`, `C3`, and `C34`.
17. Second **Send** adds exactly one ledger/tape row; `l1-r2` prices to `$0.0122634`.
18. `l1-r2` reads `34,738`, writes `0`, and refreshes the live `l1-main` entry under `C12`.
19. The third route controls appear only after `l1-r2` evidence is visible.
20. Both thread choices are keyboard- and pointer-operable and produce the requested test.
21. Same-chat choice records `"l1-route-same-chat-chosen"` through its accepted `BEGIN_TRANSFER`.
22. Isolated choice records `"l1-route-isolated-chosen"` through its accepted `BEGIN_TRANSFER`.
23. Exactly one route-choice marker exists before the third request.
24. Neither choice action creates a ledger row or changes scalar `wallet`.
25. The same-chat request uses `l1-main`; the isolated request uses `l1-clean`.
26. Choosing the isolated thread neither deletes nor invalidates the live `l1-main` entry.
27. After either route choice, the third `SEND_REQUEST` cannot dispatch before `COMMIT_PREDICTION`.
28. Prediction selection alone does not unlock sending.
29. No correctness treatment appears before the selected route’s third request is priced and rendered.
30. The prediction options expose no exact `$0.210267` or `21¢` magnitude.
31. `l1-r3` prices to `$0.0122604`, reads `34,738`, writes `0`, and refreshes `l1-main`.
32. `l1-r3-clean` prices to `$0.210267`, reads `0`, writes `34,738`, and creates a live entry in `l1-clean`.
33. Same-chat completion leaves `attemptMetrics.spentUsd=$0.2347878`.
34. Isolated completion leaves `attemptMetrics.spentUsd=$0.4327944` and appends `"l1-isolated-test-completed"`.
35. The same-chat benefit affects reducer-owned spend.
36. The isolated-thread benefit affects `L1_STAR2`.
37. Both branches reach `COMPLETE_ATTEMPT` and can earn three stars.
38. Neither third request dispatches `FREEZE_FAILURE`.
39. A negative wallet on the isolated branch does not replace or fail the behavioral gate.
40. A wrong prediction changes no score, star, wallet, failure state, gate result, or request resolution.
41. The one-star gate does not inspect prediction option identity or correctness.
42. The gate observes `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }` after the executed reveal.
43. An explanation action before the executed reveal is rejected and cannot satisfy the gate.
44. Incorrect explanation choices create no request or economic penalty.
45. `l1Pass(st)` is pure and reads only `ledger`, `lastRequests`, `completedEventIds`, and `acknowledgedExplanationIds`.
46. Every gate and star predicate uses only canonical state paths, legal predicate kinds, and legal comparison ops.
47. Array state uses indexed paths such as `lastRequests.0.requestId`; no object-style unit-ID path appears.
48. Each priced request maps to exactly one `LedgerRow` and one tape row.
49. Every real request cost is positive and equals `PRICE_REQUEST`.
50. No positive price displays as `$0.0000`.
51. Static final tape bars render without hover and preserve ledger order.
52. `UI_TAPE_RENDERER` segments equal the priced buckets; no decorative segment is treated as a request.
53. `outTok` contributes to every row’s canonical segment width and total visual weight.
54. The `$0.001800` output contribution remains available in `UI_HOVER_PRICE_CALCULATOR`.
55. `UI_COUNTERFACTUAL_OVERLAY` remains unavailable before `"l1-complete-attempt"`.
56. The comparison uses the same seed and authoritative `$0.0122604`, `$0.210267`, and `$0.1980066` values.
57. Counterfactual rendering does not mutate `wallet`, `ledger`, `attemptResult`, `clockFrozen`, or `frozenFailure`.
58. No `FREEZE_FAILURE` dispatch occurs during either actual route, `REQUEST_COUNTERFACTUAL`, or `REVEAL_COUNTERFACTUAL`.
59. Pointer and keyboard paths produce equivalent `Action[]`.
60. Reduced-motion mode produces identical final state, pricing, reveal order, tape geometry, route benefit, and gate evidence.
61. Refresh/replay from seed `1001` and saved `Action[]` reproduces byte-identical `ReducerState`, ledger, wallet, and result.
62. Each authoritative request count, token count, cost, total, and threshold has only one implementable value.
63. `MAIN_PREFIX_HEY` is cited as `C34`; the level defines no competing main-prefix constant.

## 13. Reference-bar justification

The screen opens on one inviting action and lets the first wallet hit land before naming anything. A second related request produces the surprising blue contrast through play. Only then does the player apply that evidence to a real workspace decision and commit a coarse prediction.

The third-task choice obeys invariant 14 without an exception. Keeping the task in the implementation thread provides the reducer-visible spend benefit: the third request costs `$0.0122604`, and the completed route retains `attemptMetrics.spentUsd=$0.2347878`. Opening an isolated test thread provides a different reducer-visible benefit: the work uses a distinct `cacheNamespace`, completes normally, and records `"l1-isolated-test-completed"` as an alternative route through `L1_STAR2`. Neither choice dominates on every scored dimension, and both can pass and earn three stars.

No failure is fabricated from the higher isolated-thread cost. The differing prices become causal evidence for the concept and an optional post-attempt comparison. Prediction correctness remains non-punitive, while the required post-reveal explanation demonstrates understanding.

The rhythm is act, notice, choose, predict, reveal, explain, and compare. The implementation-thread route is the economic reference; the isolated-thread route is the deliberate separation tradeoff. All request prices remain derived from `C1`, `C3`, `C12`, and `C34`, and no correct dollar figure changed.

