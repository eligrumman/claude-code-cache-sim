# Level 12 — Seven Cold Starts

## 1. Identity

- `id`: `"12-stable-at-the-front"`
- `title`: **Seven Cold Starts**
- `tier`: `3`
- Player-facing objective: **“Seven session starts. One tiny block keeps changing. Arrange the start packet, then estimate the next bill.”**
- One concept: early volatile content invalidates the reusable suffix; prefix position can outweigh block size (`C9`, `C22`, `C23`).
- `concept.id`: `"volatile-prefix-position"`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["prefix-reuse", "byte-identical-prefix", "prefix-loadout-sizing"]`
- `concept.privateDesignerSummary`: A changing 20-token status fixture placed before 24,300 reusable tokens forces that suffix to be rewritten on the next start.
- `concept.postRevealRule`: **“The first mismatch sets the reuse boundary. Put changing payload after stable cached context.”**
- `concept.solutionVocabulary`: `["stable", "front", "order", "boundary"]`
- Introduced control: reorderable `UI_PREFIX_STACK_VISUALIZER`.
- Vocabulary introduced at `l12-start-2-prediction-revealed`: **volatile** — “content whose exact bytes may change between starts.”

The live tradeoff is reducer-visible:

- retaining and correctly placing the dynamic status preserves `evidence.l12.dynamicStatusEnabled`, permits passage, and costs `$0.18996`;
- disabling the optional status completes a local attempt for `$0.18954`, saving `$0.00042`, but loses `fresh-session-status` and cannot pass.

Both branches reach an authored attempt outcome. The cheaper disabled branch therefore has a real `attemptResult.spentUsd` benefit, while the enabled branch provides the capability required by `pass(st)` and the stars. Leaving the enabled status before the reusable suffix is the reachable teaching-error branch; its harmful Start 2 request freezes locally and rewinds.

## 2. Objects used

- `PrefixBlock` instances using `PB_SYSTEM`, `PB_TOOLS`, `PB_INSTRUCTIONS`, `PB_HISTORY`, and `PB_CURRENT`
- `PREFIX_STACK`
- `Request`
- `MAIN_SESSION_CONTEXT`
- `CacheEntry` using `CACHE_TIER_1H`
- `RESOLVE_PREFIX`
- `PRICE_REQUEST`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Clock`
- `Checkpoint`
- `FrozenFailure`
- `LocalAttemptFailure`
- `AttemptMetrics`
- `AttemptResult`
- `EvidenceState`
- `TapeRenderer`
- `CounterfactualOverlay`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `"predict-before-reveal"`
- `"fail-freeze-rewind"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

All seconds in this section are presentation-only `[ESTIMATE]` values registered in `scenarioData.estimates`.

| Time | Beat |
|---:|---|
| `0.0s` | Seven closed terminal tabs land in a row, labelled **START 1** through **START 7**. Copy: **“Same project. Seven fresh starts.”** |
| `0.5s` | `UI_PREFIX_STACK_VISUALIZER` opens with five draggable cards. The 20-token card reads **“STATUS · 09:00 · clean”**. Cache colors, breakpoint labels, prices, stability labels, and answer copy remain hidden. |
| `1.0s` | Copy: **“This status line updates at every start. Arrange the packet.”** |
| `1.5s` | Cards become draggable. Controls: **“Drop status”** and **“Lock arrangement.”** Dropping shows only **“Startup status will be unavailable.”** |
| `2.0s` | First interaction is available. No tape, reference arrangement, cost comparison, or placement hint is visible. |
| After lock | `UI_PREDICTION_PROMPT` asks only **“What will Start 2 cost?”** The run remains disabled until one neutral dollar band is committed. |

The internal opening arrangement is deliberately harmful:

`PB_SYSTEM → PB_CURRENT(status) → PB_TOOLS → PB_INSTRUCTIONS → PB_HISTORY`

The player-facing stack does not label this arrangement as harmful. The reusable breakpoint follows `PB_HISTORY`.

Available reducer-visible choices:

- `REORDER_PREFIX_BLOCK` while retaining the dynamic status;
- `SET_PREFIX_BLOCK_ENABLED { enabled: false }`, accepting the lower-spend but capability-losing local outcome;
- lock the initial arrangement and observe its request-local consequence.

No choice is marked correct before play.

## 4. Exact event sequence

The four reusable blocks total `24,300` tokens (`C23`). The changing `PB_CURRENT` contains `20` tokens from fixture `l12-status-token-count`. Seven starts occur at five-minute intervals from minute `0` through minute `30`, using fixtures `l12-session-start-count`, `l12-start-gap-minutes`, and `l12-run-span-and-clock-cap`. This remains inside the 60-minute `MAIN_SESSION_CONTEXT` TTL (`C1`).

1. **Enter level**
   - Event ID: `l12-enter`.
   - Action: `ENTER_LEVEL { levelId: "12-stable-at-the-front" }`.
   - Mutates: `ReducerState`, scalar `wallet`, scalar clock fields, units, empty ledger, empty cache, and attempt-local evidence.
   - Numbers: wallet `$30` from fixture `l12-week-budget-usd`, calibrated to the week budget in `C31`; clock `0 min`.
   - Initializes:
     - `evidence.l12.dynamicStatusEnabled = true`;
     - `evidence.l12.statusBeforeStableBoundary = true`;
     - `evidence.l12.statusAfterStableBoundary = false`;
     - both read and invalidation counters to `0`.

2. **Initialize the puzzle**
   - Event ID: `l12-initialize`.
   - Action: `SET_PREFIX_BLOCKS { contextId: "l12-main", blocks: l12OpeningBlocks }`.
   - Mutates: `prefixStacks["l12-main"]`.
   - Numbers: reusable content `24,300 tok`; enabled status `20 tok`; serialized input-side content `24,320 tok`.

3. **Checkpoint the arrangement**
   - Event ID: `l12-arrangement-checkpoint`.
   - Trigger: first drag or alternate-control focus.
   - Action: `CREATE_CHECKPOINT { checkpointId: "before-l12-arrangement", reason: "decision" }`.
   - Mutates: `checkpoints` only.

4. **Configure the SessionStart packet**
   - Reorder action:
     - `REORDER_PREFIX_BLOCK { contextId: "l12-main", blockId: "l12-status", toIndex }`.
     - Moving to index `4` records:
       - `evidence.l12.statusBeforeStableBoundary = false`;
       - `evidence.l12.statusAfterStableBoundary = true`.
     - Any earlier position records the inverse values.
   - Drop action:
     - `SET_PREFIX_BLOCK_ENABLED { contextId: "l12-main", blockId: "l12-status", enabled: false }`.
     - Records `evidence.l12.dynamicStatusEnabled = false`.
   - Re-enabling the block records `evidence.l12.dynamicStatusEnabled = true`.
   - No request is sent and no price is revealed.
   - `l12-status` is optional at the `PrefixBlock` layer so the toggle is legal; the level gate separately requires the `fresh-session-status` capability.

5. **Lock arrangement and open the estimate**
   - Event ID: `l12-open-start2-prediction`.
   - Actions:
     1. `CREATE_CHECKPOINT { checkpointId: "before-l12-run", reason: "prediction" }`
     2. `OPEN_PREDICTION { promptId: "l12-start2-cost" }`
   - Mutates: checkpoint and prediction state only.

6. **Commit the estimate**
   - Event ID: `l12-commit-start2-prediction`.
   - Actions:
     1. `SELECT_PREDICTION { promptId: "l12-start2-cost", optionId }`
     2. `COMMIT_PREDICTION { promptId: "l12-start2-cost" }`
   - Mutates: committed prediction state only.
   - Prediction selection and correctness affect no wallet, failure, gate, pass, or star field.

7. **Start 1 establishes the cache**
   - Event ID: `l12-start-1-resolved`.
   - Trigger: player selects **“Run seven starts.”**
   - Action: `SEND_REQUEST { request: l12-start-1 }`.
   - Mutates atomically: `CacheEntry`, one `LedgerRow`, `wallet`, `lastRequests`, `attemptMetrics`, tape payload, and `UI_MAIN_CACHE_PANEL`.
   - Enabled status:
     - `readTok=0`;
     - `inputTok=20`;
     - `writeTok=24,300`;
     - `outTok=0`;
     - cost `$0.14586`.
   - Disabled status:
     - `readTok=0`;
     - `inputTok=0`;
     - `writeTok=24,300`;
     - `outTok=0`;
     - cost `$0.14580`.

8. **Update Start 2 content**
   - Event ID: `l12-start-2-content-updated`.
   - Event: clock reaches minute `5`; enabled status becomes **“STATUS · 09:05 · changes detected.”**
   - Actions for enabled status:
     1. `ADVANCE { min: 5 }`
     2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-02", tokenCount: 20 }`
   - The disabled route dispatches only `ADVANCE { min: 5 }`.
   - Mutates: `clockMin` and, when enabled, the status block identity and mismatch boundary.
   - This event sends no request, reveals no price, and cannot dispatch `FREEZE_FAILURE`.

9. **Resolve the Start 2 request**
   - Event ID: `l12-start-2-request-resolved`.
   - Action: `SEND_REQUEST { request: l12-start-2 }`.
   - Dynamic status after the reusable breakpoint:
     - `readTok=24,300`;
     - `inputTok=20`;
     - `writeTok=0`;
     - `outTok=0`;
     - cost `$0.00735`;
     - increments `evidence.l12.fullStableReadCount`.
   - Dynamic status before the reusable suffix:
     - `readTok=0`;
     - `inputTok=20`;
     - `writeTok=24,300`;
     - `outTok=0`;
     - `invalidatedSuffixTok=24,300`;
     - cost `$0.14586`;
     - increments `evidence.l12.invalidatedRepeatCount`.
   - Disabled status:
     - `readTok=24,300`;
     - `inputTok=0`;
     - `writeTok=0`;
     - `outTok=0`;
     - cost `$0.00729`.
   - The Start 2 row and its uncharged local quote render before the attached `l12-freeze-early-dynamic` rule evaluates.
   - The local quote visible on this decisive frame is:
     - actual Start 2: `$0.14586`;
     - same request after the reusable context: `$0.00735`;
     - request-local difference: `$0.13851`.
   - When `lastRequests.0.writeTok === 24300`, the request event immediately dispatches:
     `FREEZE_FAILURE { failure: { failureId: "l12-early-volatile", causeCode: "VOLATILE_BEFORE_STABLE", message: "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.", checkpointId: "before-l12-run" } }`.
   - This dispatch occurs after the row and local quote render but before any `REVEAL_PREDICTION`.
   - No counterfactual action is needed to establish the quote; it derives from the same Start 2 buckets and `PRICE_REQUEST`.

10. **Reveal the Start 2 prediction on non-frozen branches**
    - Event ID: `l12-start-2-prediction-revealed`.
    - Preconditions:
      - `l12-start-2-request-resolved` completed;
      - `frozenFailure === null`;
      - `clockFrozen === false`.
    - Action:
      `REVEAL_PREDICTION { promptId: "l12-start2-cost", correctOptionId: resolvedStart2Band }`.
    - Mutates: prediction revelation state only.
    - The actual Start 2 row supplies `resolvedStart2Band`.
    - This event reveals the vocabulary term **volatile**.
    - The frozen harmful branch never dispatches this event.

11. **Stop the frozen branch**
    - Preconditions: `frozenFailure.failureId === "l12-early-volatile"`.
    - `clockFrozen` becomes `true`.
    - Starts 3–7 are not dispatched.
    - The actual harmful ledger therefore contains exactly two request rows and totals `$0.29172`.
    - Any seven-start harmful total remains unavailable until the player explicitly opens the post-freeze informational projection.

12. **Starts 3–7 continue only on non-frozen branches**
    - Event IDs: `l12-start-3-resolved` through `l12-start-7-resolved`.
    - Preconditions for every event:
      - `frozenFailure === null`;
      - `clockFrozen === false`.
    - For each enabled dynamic start `n ∈ 3…7`:
      1. `ADVANCE { min: 5 }`
      2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-0n", tokenCount: 20 }`
      3. `SEND_REQUEST { request: l12-start-n }`
    - For disabled status, each event advances and sends the request without changing `l12-status`.
    - Valid dynamic placement, each request:
      - `readTok=24,300`;
      - `inputTok=20`;
      - `writeTok=0`;
      - `outTok=0`;
      - cost `$0.00735`;
      - increments `evidence.l12.fullStableReadCount`.
    - Disabled placement, each request:
      - `readTok=24,300`;
      - `inputTok=0`;
      - `writeTok=0`;
      - `outTok=0`;
      - cost `$0.00729`.
    - After Start 7, a valid dynamic route has `evidence.l12.fullStableReadCount === 6`.

13. **Complete the cheaper capability-losing branch**
    - Event ID: `l12-status-capability-failed`.
    - Preconditions:
      - `l12-start-7-resolved` completed;
      - `evidence.l12.dynamicStatusEnabled === false`;
      - `frozenFailure === null`.
    - Action:
      `STOP_LOCAL_ATTEMPT { failure: { outcomeId: "l12-missing-live-status", causeCode: "MISSING_FRESH_SESSION_STATUS", message: "Cheap is not enough: the session still needs current status.", stoppedAtEventId: "l12-start-7-resolved", checkpointId: "before-l12-run", missingCapabilityIds: ["fresh-session-status"] } }`.
    - Mutates: `localAttemptFailure`; leaves `clockFrozen === false`, `frozenFailure === null`, and `ended === null`.
    - Event ID: `l12-complete-local-attempt`.
    - Action: `COMPLETE_ATTEMPT`.
    - Produces `attemptResult.outcome === "local-failed"` and `attemptResult.spentUsd === 0.18954`.

14. **Open the post-evidence transfer**
    - Event ID: `l12-transfer-open`.
    - Preconditions:
      - `l12-start-7-resolved` completed;
      - `evidence.l12.dynamicStatusEnabled === true`;
      - `evidence.l12.fullStableReadCount === 6`;
      - `frozenFailure === null`;
      - `localAttemptFailure === null`.
    - Actions:
      1. `BEGIN_TRANSFER { challengeId: "l12-changing-report" }`
      2. `SET_PREFIX_BLOCKS { contextId: "l12-transfer", blocks: l12TransferBlocks }`
    - Copy: **“A 2,000-token report changes every start. Place it in this new packet.”**
    - The transfer sends no `Request` and changes no ledger or wallet field.

15. **Demonstrate the rule**
    - Event ID: `l12-transfer-placed`.
    - Action:
      `REORDER_PREFIX_BLOCK { contextId: "l12-transfer", blockId: "l12-report", toIndex: 4 }`.
    - Mutates:
      - transfer stack order;
      - `evidence.l12.transferReportAfterBoundary = true`;
      - appends `"l12-transfer-placed"` to `completedEventIds`.
    - This authored action, rather than prediction correctness or inferred action history, supplies the post-evidence marker used by `pass(st)`.

16. **Acknowledge and complete**
    - Event ID: `l12-complete-attempt`.
    - Player selects: **“The first changed bytes cut off reuse for everything after them.”**
    - Actions:
      1. `ACK_EXPLANATION { explanationId: "l12-position-rule" }`
      2. `COMPLETE_ATTEMPT`
    - Mutates:
      - appends `"l12-position-rule"` to `acknowledgedExplanationIds`;
      - snapshots `attemptResult`;
      - evaluates pass and stars.
    - Passing spend is `$0.18996`.

17. **Reveal an outcome-specific informational projection**
    - Success event ID: `l12-reveal-comparison-success`.
      - Uses comparison definition `l12-front-vs-tail-success`.
      - The control remains hidden until `l12-complete-attempt` completes.
      - Actions:
        1. `REQUEST_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail-success" }`
        2. `REVEAL_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail-success" }`
    - Frozen event ID: `l12-reveal-comparison-frozen`.
      - Uses comparison definition `l12-front-vs-tail-frozen`.
      - Preconditions:
        - `l12-start-2-request-resolved` completed;
        - `frozenFailure.failureId === "l12-early-volatile"`;
        - the request event has already dispatched `FREEZE_FAILURE`.
      - Actions:
        1. `REQUEST_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail-frozen" }`
        2. `REVEAL_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail-frozen" }`
    - Both definitions mutate comparison visibility only.
    - For a frozen harmful branch, Starts 3–7 are rendered as explicitly labelled projection rows, not `LedgerRow` or actual tape rows.
    - The projection shows:
      - seven-start harmful projection: `$1.02102`;
      - valid dynamic route: `$0.18996`;
      - projected difference: `$0.83106`;
      - projected reduction: `81.4%`.
    - Neither comparison event can dispatch `FREEZE_FAILURE`, mutate actual wallet or ledger state, or retroactively become the economic basis of the Start 2 freeze.

## 5. Level data

Level-specific `PrefixBlock` instances:

```ts
const l12OpeningBlocks: PrefixBlock[] = [
  {
    id: "l12-system",
    kind: "system",
    label: "BOOT",
    tokenCount: 2_750, // C6
    identityHash: "l12-system-v1",
    order: 0,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-status",
    kind: "current",
    label: "STATUS · 09:00 · clean",
    tokenCount: 20, // fixture l12-status-token-count
    identityHash: "l12-status-01",
    order: 1,
    cacheable: false,
    breakpointAfter: false,
    stability: "volatile",
  },
  {
    id: "l12-tools",
    kind: "tools",
    label: "TOOLS",
    tokenCount: 16_295, // C24
    identityHash: "l12-tools-v1",
    order: 2,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-instructions",
    kind: "instructions",
    label: "PROJECT",
    tokenCount: 3_000, // fixture l12-instruction-token-count
    identityHash: "l12-instructions-v1",
    order: 3,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-history",
    kind: "history",
    label: "HISTORY",
    tokenCount: 2_255, // fixture l12-history-token-count
    identityHash: "l12-history-v1",
    order: 4,
    cacheable: true,
    breakpointAfter: true,
    stability: "stable",
  },
];
```

The reusable block counts satisfy `2,750 + 16,295 + 3,000 + 2,255 = 24,300` (`C6`, `C23`, `C24`, and the two registered L12 fixtures). The reference action moves `l12-status` to index `4`, after the breakpoint-bearing `l12-history`, without changing its size or dynamic behavior.

```ts
const l12TransferBlocks: PrefixBlock[] = [
  {
    id: "l12-transfer-system",
    kind: "system",
    label: "BOOT",
    tokenCount: 2_750, // C6
    identityHash: "l12-transfer-system-v1",
    order: 0,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-report",
    kind: "current",
    label: "CHANGING REPORT",
    tokenCount: 2_000, // fixture l12-transfer-report-token-count
    identityHash: "l12-report-01",
    order: 1,
    cacheable: false,
    breakpointAfter: false,
    stability: "volatile",
  },
  {
    id: "l12-transfer-tools",
    kind: "tools",
    label: "TOOLS",
    tokenCount: 16_295, // C24
    identityHash: "l12-transfer-tools-v1",
    order: 2,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-transfer-instructions",
    kind: "instructions",
    label: "PROJECT",
    tokenCount: 3_000, // fixture l12-instruction-token-count
    identityHash: "l12-transfer-instructions-v1",
    order: 3,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable",
  },
  {
    id: "l12-transfer-history",
    kind: "history",
    label: "HISTORY",
    tokenCount: 2_255, // fixture l12-history-token-count
    identityHash: "l12-transfer-history-v1",
    order: 4,
    cacheable: true,
    breakpointAfter: true,
    stability: "stable",
  },
];
```

```ts
const level12: LevelDef = {
  id: "12-stable-at-the-front",
  tier: 3,
  title: "Seven Cold Starts",
  objective:
    "Seven session starts. One tiny block keeps changing. Arrange the start packet, then estimate the next bill.",
  concept: {
    id: "volatile-prefix-position",
    privateDesignerSummary:
      "A changing 20-token status before 24,300 reusable tokens rewrites that suffix on the next start.",
    postRevealRule:
      "The first mismatch sets the reuse boundary. Put changing payload after stable cached context.",
    solutionVocabulary: ["stable", "front", "order", "boundary"],
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: [],
  },
  prerequisiteConceptIds: [
    "prefix-reuse",
    "byte-identical-prefix",
    "prefix-loadout-sizing",
  ],

  unlocks: "prefix",
  introducedControls: ["prefixBlocks"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "prompts",
    "width",
    "oneHourFlag",
    "keepWarm",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp",
  ],

  scope: "week",
  seed: 122430,
  budgetUsd: 30,
  clockCapMin: 30,
  cfgOverride: {
    orchestratorModel: "sonnet",
    who: "inline",
    hook: "dynamic",
    oneHourFlag: true,
  },
  scenario: "week7starts",
  scenarioData: {
    units: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
      id: `l12-start-${n}`,
      kind: "TASK",
      ticket: 1,
      deps: [],
      hours: 0,
      outTok: 0,
      workIn: 20,
      scripted: true,
      label: `START ${n}`,
    })),
    contexts: [
      {
        kind: "main",
        id: "l12-main",
        sessionId: "l12-session",
        cacheNamespace: "l12-main-cache",
        initialPrefixStackId: "l12-session-start",
      },
      {
        kind: "main",
        id: "l12-transfer",
        sessionId: "l12-transfer-session",
        cacheNamespace: "l12-transfer-cache",
        initialPrefixStackId: "l12-transfer-stack",
      },
    ],
    prefixStacks: [
      {
        id: "l12-session-start",
        contextId: "l12-main",
        blocks: l12OpeningBlocks,
      },
      {
        id: "l12-transfer-stack",
        contextId: "l12-transfer",
        blocks: l12TransferBlocks,
      },
    ],
    allowedCfg: {
      hook: ["dynamic", "none"],
    },
    fixtures: [
      {
        id: "l12-session-start-count",
        label: "Session-start request count",
        semanticRole: "Number of starts in a completed non-frozen L12 run",
        value: 7,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l12-status-token-count",
        label: "Changing status size",
        semanticRole: "Fresh status payload included in every enabled start",
        value: 20,
        unit: "tok",
        tag: "[FICTION]",
      },
      {
        id: "l12-instruction-token-count",
        label: "Project instruction size",
        semanticRole: "Authored instruction portion of the 24,300-token reusable context",
        value: 3000,
        unit: "tok",
        tag: "[FICTION]",
      },
      {
        id: "l12-history-token-count",
        label: "History size",
        semanticRole: "Authored history portion of the 24,300-token reusable context",
        value: 2255,
        unit: "tok",
        tag: "[FICTION]",
      },
      {
        id: "l12-start-output-token-count",
        label: "Session-start output size",
        semanticRole: "Generated output bucket for every authored L12 start request",
        value: 0,
        unit: "tok",
        tag: "[FICTION]",
      },
      {
        id: "l12-start-gap-minutes",
        label: "Minutes between starts",
        semanticRole: "Simulation interval separating consecutive session starts",
        value: 5,
        unit: "min",
        tag: "[FICTION]",
      },
      {
        id: "l12-run-span-and-clock-cap",
        label: "Seven-start span and level clock cap",
        semanticRole: "Elapsed simulation time from Start 1 through Start 7 and the matching level cap",
        value: 30,
        unit: "min",
        tag: "[FICTION]",
      },
      {
        id: "l12-display-start-minute-of-day",
        label: "Displayed first-start time",
        semanticRole: "Minute of day rendered as 09:00 for Start 1",
        value: 540,
        unit: "min",
        tag: "[FICTION]",
      },
      {
        id: "l12-transfer-report-token-count",
        label: "Changing transfer report size",
        semanticRole: "Novel volatile payload used by the post-evidence transfer",
        value: 2000,
        unit: "tok",
        tag: "[FICTION]",
      },
      {
        id: "l12-deterministic-seed",
        label: "Deterministic scenario seed",
        semanticRole: "Replay seed for the authored L12 scenario",
        value: 122430,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l12-week-budget-usd",
        label: "Level wallet budget",
        semanticRole: "Initial wallet for the L12 week-scope attempt, calibrated to C31",
        value: 30,
        unit: "usd",
        tag: "[FICTION]",
      },
      {
        id: "l12-day-length-minutes",
        label: "Week-scope reducer day length",
        semanticRole: "Reducer day length inherited by the level's week scope",
        value: 300,
        unit: "min",
        tag: "[FICTION]",
      },
      {
        id: "l12-two-star-attempt-cap",
        label: "Two-star attempt cap",
        semanticRole: "Maximum attempt number that earns the recovery star",
        value: 2,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l12-three-star-attempt-number",
        label: "Three-star first-attempt requirement",
        semanticRole: "Attempt number required for a no-rewind three-star result",
        value: 1,
        unit: "count",
        tag: "[FICTION]",
      },
    ],
    estimates: [
      { label: "terminal-tab arrival seconds", value: 0, tag: "[ESTIMATE]" },
      { label: "prefix-stack opening seconds", value: 0.5, tag: "[ESTIMATE]" },
      { label: "scenario-copy reveal seconds", value: 1, tag: "[ESTIMATE]" },
      { label: "control reveal seconds", value: 1.5, tag: "[ESTIMATE]" },
      { label: "first-interaction seconds", value: 2, tag: "[ESTIMATE]" },
    ],
  },

  coldOpen: level12ColdOpen,
  sequence: level12Sequence,
  predictions: [
    {
      id: "l12-start2-cost",
      question: "What will Start 2 cost?",
      options: [
        { id: "band-under-one-cent", label: "$0.005–$0.010" },
        { id: "band-ten-to-twenty-cents", label: "$0.10–$0.20" },
        { id: "band-fifty-cents-to-one-dollar", label: "$0.50–$1.00" },
      ],
      revealId: "l12-start-2-prediction-revealed",
      explanationId: "l12-position-rule",
    },
  ],
  toasts: level12Toasts,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt",
  ],

  failLesson: {
    bucket: "hookUsd",
    cite: "C9, C22, C23",
    line:
      "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.",
  },
  failureRules: [
    {
      id: "l12-freeze-early-dynamic",
      predicate: {
        id: "l12-start2-poisoned",
        kind: "all",
        predicates: [
          {
            id: "l12-start2-request-visible",
            kind: "event-completed",
            eventId: "l12-start-2-request-resolved",
          },
          {
            id: "l12-start2-rewrote-stable-suffix",
            kind: "compare",
            path: "lastRequests.0.writeTok",
            op: "eq",
            value: 24300,
          },
        ],
      },
      decisiveEventId: "l12-start-2-request-resolved",
      causeCode: "VOLATILE_BEFORE_STABLE",
      message:
        "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.",
      checkpointId: "before-l12-run",
      highlightObjectIds: ["l12-status", "l12-history", "l12-start-2"],
      actualUsd: 0.14586,
      validAlternativeUsd: 0.00735,
    },
  ],
  checkpoints: [
    {
      id: "before-l12-arrangement",
      createBeforeEventId: "l12-arrangement-checkpoint",
      reason: "decision",
      resumeLabel: "Restart arrangement",
    },
    {
      id: "before-l12-run",
      createBeforeEventId: "l12-open-start2-prediction",
      reason: "prediction",
      resumeLabel: "Rewind to arrangement",
    },
  ],

  gate: {
    predicateId: "l12-position-understanding",
    evidenceRevealEventIds: [
      "l12-start-2-prediction-revealed",
      "l12-start-7-resolved",
    ],
    postEvidenceActionRequirements: [
      {
        id: "l12-transfer-report-reordered-after-evidence",
        kind: "action-observed",
        actionType: "REORDER_PREFIX_BLOCK",
        afterEventId: "l12-transfer-open",
        match: {
          contextId: "l12-transfer",
          blockId: "l12-report",
          toIndex: 4,
        },
      },
    ],
    behavioralRequirements: [
      {
        id: "l12-dynamic-status-retained",
        kind: "compare",
        path: "evidence.l12.dynamicStatusEnabled",
        op: "eq",
        value: true,
      },
      {
        id: "l12-status-after-stable-boundary",
        kind: "compare",
        path: "evidence.l12.statusAfterStableBoundary",
        op: "eq",
        value: true,
      },
      {
        id: "l12-six-full-stable-reads",
        kind: "compare",
        path: "evidence.l12.fullStableReadCount",
        op: "eq",
        value: 6,
      },
      {
        id: "l12-transfer-after-boundary",
        kind: "compare",
        path: "evidence.l12.transferReportAfterBoundary",
        op: "eq",
        value: true,
        observedAfterEventId: "l12-transfer-placed",
      },
    ],
    explanationRequirement: {
      id: "l12-position-rule-acknowledged",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "l12-transfer-placed",
      match: { explanationId: "l12-position-rule" },
    },
    transferRequirement: {
      id: "l12-transfer-completed",
      kind: "event-completed",
      eventId: "l12-transfer-placed",
    },
  },

  pass(st) {
    const applied =
      st.evidence.l12.dynamicStatusEnabled === true &&
      st.evidence.l12.statusAfterStableBoundary === true &&
      st.evidence.l12.fullStableReadCount === 6 &&
      st.evidence.l12.transferReportAfterBoundary === true &&
      st.completedEventIds.includes("l12-transfer-placed") &&
      st.acknowledgedExplanationIds.includes("l12-position-rule") &&
      st.frozenFailure === null &&
      st.localAttemptFailure === null;

    return {
      pass: applied,
      reason: applied
        ? "Preserved current status and applied the observed mismatch rule to the transfer."
        : "Preserve current status, inspect the completed run, and place the changing report from the evidence.",
      evidence: applied
        ? [
            "l12-start-2-prediction-revealed",
            "l12-start-7-resolved",
            "l12-transfer-placed",
            "l12-position-rule",
          ]
        : ["l12-start-2-prediction-revealed"],
    };
  },

  star2: {
    label: "Fast recovery",
    predicate: {
      id: "l12-at-most-two-attempts",
      kind: "compare",
      path: "attempt",
      op: "lte",
      value: 2,
    },
    reason: "Passed on the first try or after one local rewind.",
  },
  star3: {
    label: "Fresh and reusable",
    predicate: {
      id: "l12-three-star",
      kind: "all",
      predicates: [
        {
          id: "l12-first-attempt-valid",
          kind: "compare",
          path: "attempt",
          op: "eq",
          value: 1,
        },
        {
          id: "l12-three-star-spend",
          kind: "compare",
          path: "attemptMetrics.spentUsd",
          op: "lte",
          value: 0.18996,
        },
        {
          id: "l12-three-star-dynamic-status",
          kind: "compare",
          path: "evidence.l12.dynamicStatusEnabled",
          op: "eq",
          value: true,
        },
        {
          id: "l12-three-star-six-reads",
          kind: "compare",
          path: "evidence.l12.fullStableReadCount",
          op: "eq",
          value: 6,
        },
      ],
    },
    reason:
      "Kept current status while reusing all 24,300 reusable tokens on Starts 2–7.",
  },

  referenceCfg: {
    orchestratorModel: "sonnet",
    who: "inline",
    hook: "dynamic",
    oneHourFlag: true,
  },
  antiCfg: {
    orchestratorModel: "sonnet",
    who: "inline",
    hook: "dynamic",
    oneHourFlag: true,
  },
  counterfactuals: [
    {
      id: "l12-front-vs-tail-success",
      unlockAfterEventId: "l12-complete-attempt",
      kind: "anti-pattern",
      cfg: {
        orchestratorModel: "sonnet",
        who: "inline",
        hook: "dynamic",
        oneHourFlag: true,
      },
      scenarioPatch: {
        prefixStacks: [
          {
            id: "l12-session-start",
            contextId: "l12-main",
            blocks: l12OpeningBlocks,
          },
        ],
      },
      comparisonQuestion:
        "What would seven starts cost if the same Start 2 pattern continued?",
      revealCopy:
        "Projection only: six repeated rewrites would make seven starts cost $1.02102, versus $0.18996 when the changing status follows the reusable context.",
    },
    {
      id: "l12-front-vs-tail-frozen",
      unlockAfterEventId: "l12-start-2-request-resolved",
      kind: "anti-pattern",
      cfg: {
        orchestratorModel: "sonnet",
        who: "inline",
        hook: "dynamic",
        oneHourFlag: true,
      },
      scenarioPatch: {
        prefixStacks: [
          {
            id: "l12-session-start",
            contextId: "l12-main",
            blocks: l12OpeningBlocks,
          },
        ],
      },
      comparisonQuestion:
        "What would seven starts cost if the same Start 2 pattern continued?",
      revealCopy:
        "Projection only: six repeated rewrites would make seven starts cost $1.02102, versus $0.18996 when the changing status follows the reusable context.",
    },
  ],

  tape: {
    rowSource: "ledger",
    labels: {
      "l12-start-1": "START 1 · 09:00",
      "l12-start-2": "START 2 · 09:05",
      "l12-start-3": "START 3 · 09:10",
      "l12-start-4": "START 4 · 09:15",
      "l12-start-5": "START 5 · 09:20",
      "l12-start-6": "START 6 · 09:25",
      "l12-start-7": "START 7 · 09:30",
    },
    revealGroups: [
      { id: "l12-cold", requestIds: ["l12-start-1"] },
      {
        id: "l12-boundary",
        requestIds: ["l12-start-2"],
        gatedByPredictionId: "l12-start2-cost",
      },
      {
        id: "l12-propagation",
        requestIds: [
          "l12-start-3",
          "l12-start-4",
          "l12-start-5",
          "l12-start-6",
          "l12-start-7",
        ],
      },
    ],
    ahaRequestId: "l12-start-2",
    hoverEnabled: true,
  },
  result: {
    headlinePass: "Same payload. Different boundary.",
    headlineFail: "A tiny change poisoned the reusable suffix.",
    evidenceLines: [
      "Starts 2–7 reused all 24,300 reusable tokens.",
      "Current status remained enabled.",
      "The transfer report followed its reusable context.",
    ],
    comparisonIds: [
      "l12-front-vs-tail-success",
      "l12-front-vs-tail-frozen",
    ],
    continueLabel: "Open fleet audit",
    retryLabel: "Rewind to arrangement",
  },
  vocabulary: [
    {
      term: "volatile",
      definition: "Content whose exact bytes may change between starts.",
      firstNeededEventId: "l12-start-2-prediction-revealed",
      toastId: "l12-toast-volatile",
    },
  ],
  qa: level12Qa,
};
```

`seed`, `budgetUsd`, `clockCapMin`, every billed fictional token bucket, the start interval, transfer size, and star attempt thresholds are registered in `scenarioData.fixtures`. `scenarioData.estimates` contains presentation timing only.

`referenceCfg` and `antiCfg` intentionally share configuration. Their economic difference comes from the ordered `REORDER_PREFIX_BLOCK` action: the anti-pattern leaves `l12-status` at index `1`; the reference moves it to index `4`.

The frozen comparison definition’s `unlockAfterEventId` is necessary but not sufficient for visibility: the route-specific reveal event additionally requires `frozenFailure.failureId === "l12-early-volatile"`. The healthy branch therefore cannot expose the frozen comparison after Start 2.

## 6. Pricing walkthrough

All requests use Sonnet and `CACHE_TIER_1H`. Sonnet input is `$3/M`, cache read is `$0.30/M`, 1-hour write is `$6/M`, and output is `$15/M` (`C1`, `C3`). Every request has authoritative `outTok=0` from fixture `l12-start-output-token-count`.

| Route | Actual request group | Count | Read/request | Input/request | Write/request | Output/request | Cost/request | Actual route total |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Dynamic status after breakpoint | Start 1 | `1` | `0` | `20` | `24,300` | `0` | `20×$3/M + 24,300×$6/M = $0.14586` | |
| Dynamic status after breakpoint | Starts 2–7 | `6` | `24,300` | `20` | `0` | `0` | `24,300×$0.30/M + 20×$3/M = $0.00735` | **`$0.18996`** |
| Status disabled | Start 1 | `1` | `0` | `0` | `24,300` | `0` | `24,300×$6/M = $0.14580` | |
| Status disabled | Starts 2–7 | `6` | `24,300` | `0` | `0` | `0` | `24,300×$0.30/M = $0.00729` | **`$0.18954`** |
| Dynamic status before suffix, frozen | Start 1 | `1` | `0` | `20` | `24,300` | `0` | `$0.14586` | |
| Dynamic status before suffix, frozen | Start 2 | `1` | `0` | `20` | `24,300` | `0` | `$0.14586` | **`$0.29172` actual ledger** |

Reference totals:

- `readTok = 6 × 24,300 = 145,800`
- `inputTok = 7 × 20 = 140`
- `writeTok = 24,300`
- `outTok = 0`
- total `= $0.14586 + 6 × $0.00735 = $0.18996`

Disabled-status totals:

- `readTok = 145,800`
- `inputTok = 0`
- `writeTok = 24,300`
- `outTok = 0`
- total `= $0.14580 + 6 × $0.00729 = $0.18954`

The disabled branch therefore saves `$0.00042` in reducer-maintained spend while losing the required capability.

The punitive comparison is request-local:

- actual harmful Start 2: `$0.14586`;
- valid Start 2 alternative: `$0.00735`;
- local difference: `$0.13851`;
- actual is approximately `19.84×` the valid alternative.

The seven-start harmful figure is not an actual-attempt total. It is an informational projection:

- projected `readTok = 0`;
- projected `inputTok = 7 × 20 = 140`;
- projected `writeTok = 7 × 24,300 = 170,100`;
- projected `outTok = 0`;
- projected total `= 7 × $0.14586 = $1.02102`.

Compared with the valid `$0.18996` route, that projection is `$0.83106` higher. Starts 3–7 in this projection never enter the actual ledger or wallet.

All values derive from `PRICE_REQUEST`, `C1`, `C3`, `C23`, and the registered 20-token fiction fixture. Exact state retains unrounded USD values.

## 7. Tape sequence

`TapeRenderer` reads actual `LedgerRow` objects in ledger order.

Successful dynamic and disabled branches contain:

1. `l12-start-1` — **START 1 · 09:00**
2. `l12-start-2` — **START 2 · 09:05**
3. `l12-start-3` — **START 3 · 09:10**
4. `l12-start-4` — **START 4 · 09:15**
5. `l12-start-5` — **START 5 · 09:20**
6. `l12-start-6` — **START 6 · 09:25**
7. `l12-start-7` — **START 7 · 09:30**

The harmful frozen branch contains only:

1. `l12-start-1`
2. `l12-start-2`

Reveal groups:

- `l12-cold`: Start 1.
- `l12-boundary`: Start 2, gated by committed prediction `l12-start2-cost`.
- `l12-propagation`: Starts 3–7, dispatched only while `frozenFailure === null`.

Harmful Start 2 animation:

`20-token input spark → first-mismatch marker → red sweep over 24,300-token write segment → freeze`

Reference Start 2 animation:

`24,300-token blue read segment → 20-token red input tick at the tail`

Aha frame: `ahaRequestId: "l12-start-2"`.

Hover copy:

- Harmful actual row: **“20 changed here · 24,300 after it could not be reused.”**
- Reference actual row: **“24,300 matched first · 20 fresh tokens arrived after the boundary.”**

After a meaningful completed or frozen attempt, `CounterfactualOverlay` may show Starts 3–7 as striped, explicitly announced **PROJECTED · NOT SENT** rows. Those rows are not supplied to `TapeRenderer`, do not correspond to `LedgerRow`, and do not affect wallet or request counts.

Every actual `WireSegment` uses:

`segment.widthRatio = segment.usd / row.usd`

The denominator includes read, input, write, and output cost. This fixture’s `outTok=0`, so no violet segment appears, but the canonical output bucket remains present in `PRICE_REQUEST` and geometry (`C1`, `C3`).

## 8. Prediction prompts

### Required pre-reveal estimate

Question:

**“What will Start 2 cost?”**

Options:

- `band-under-one-cent`: **“$0.005–$0.010”**
- `band-ten-to-twenty-cents`: **“$0.10–$0.20”**
- `band-fifty-cents-to-one-dollar`: **“$0.50–$1.00”**

No option is styled or announced as preferred.

`REVEAL_PREDICTION` cannot dispatch before `COMMIT_PREDICTION`. The correct option derives from the actual Start 2 `LedgerRow`:

- dynamic reference `$0.00735` maps to `band-under-one-cent`;
- disabled status `$0.00729` maps to `band-under-one-cent`;
- harmful dynamic placement `$0.14586` maps to `band-ten-to-twenty-cents`.

On the harmful branch, the request-local failure freezes immediately after the Start 2 row and quote render, before `l12-start-2-prediction-revealed`; the reveal action is therefore never dispatched on that branch.

Prediction correctness is reflection-only and absent from failure rules, `gate`, `pass(st)`, stars, wallet mutations, and score.

### Required post-evidence transfer

After a complete seven-row valid attempt:

**“A 2,000-token report changes every start. Place it in this new packet.”**

Moving `l12-report` after the reusable breakpoint dispatches the post-evidence `REORDER_PREFIX_BLOCK` action and writes the canonical `evidence.l12.transferReportAfterBoundary` marker. The transfer is unpriced.

## 9. Fail-state

The decisive event is the actual harmful request `l12-start-2-request-resolved`.

After its row and uncharged local quote render, the failure rule requires exactly:

```ts
{
  id: "l12-start2-poisoned",
  kind: "all",
  predicates: [
    {
      id: "l12-start2-request-visible",
      kind: "event-completed",
      eventId: "l12-start-2-request-resolved",
    },
    {
      id: "l12-start2-rewrote-stable-suffix",
      kind: "compare",
      path: "lastRequests.0.writeTok",
      op: "eq",
      value: 24300,
    },
  ],
}
```

Exact message:

**“The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.”**

Secondary line:

**“Start 2 cost $0.14586. The same live status after the reusable context costs $0.00735.”**

The visible request-local comparison is economically true:

`$0.14586 > $0.00735`

The displayed difference is `$0.13851`. The rule inspects neither prediction selection nor correctness.

`FREEZE_FAILURE` occurs immediately after the Start 2 request row and local quote render, before `REVEAL_PREDICTION`. It prevents every subsequent economic action on that branch; Starts 3–7 are not sent. The actual ledger contains two rows totaling `$0.29172`.

`UI_REWIND_CONTROL` label: **“Rewind to arrangement”**.

It dispatches:

`REWIND_TO_CHECKPOINT { checkpointId: "before-l12-run" }`

Deterministic replay restores the pre-run wallet, cache, clock, ledger, `lastRequests`, `AttemptMetrics`, and prediction state while preserving the chosen arrangement for editing and retaining cross-attempt evidence. Focus returns to `l12-status`; Start 1 is not replayed until the player recommits and runs.

The `$1.02102` seven-start harmful amount may appear only after the freeze as a non-punitive projection. It does not justify or trigger the freeze.

The frozen comparison uses `l12-front-vs-tail-frozen`. Although its definition names `l12-start-2-request-resolved` as the unlock event, its route-specific reveal additionally requires `frozenFailure.failureId === "l12-early-volatile"`, so a healthy Start 2 cannot expose it.

The disabled-status branch does not freeze. It sends seven requests, spends `$0.18954`, dispatches `STOP_LOCAL_ATTEMPT`, then `COMPLETE_ATTEMPT`, leaving `clockFrozen === false`, `frozenFailure === null`, and `ended === null`.

## 10. Gate & stars

Pass requires:

- `evidence.l12.dynamicStatusEnabled === true`;
- `evidence.l12.statusAfterStableBoundary === true`;
- `evidence.l12.fullStableReadCount === 6`;
- `evidence.l12.transferReportAfterBoundary === true`;
- `completedEventIds` includes `"l12-transfer-placed"`;
- `acknowledgedExplanationIds` includes `"l12-position-rule"`;
- `frozenFailure === null`;
- `localAttemptFailure === null`.

The pre-reveal estimate is required only to unlock Start 2. Its option and correctness are absent from all scoring predicates.

The pure implementation is:

```ts
pass(st) {
  const applied =
    st.evidence.l12.dynamicStatusEnabled === true &&
    st.evidence.l12.statusAfterStableBoundary === true &&
    st.evidence.l12.fullStableReadCount === 6 &&
    st.evidence.l12.transferReportAfterBoundary === true &&
    st.completedEventIds.includes("l12-transfer-placed") &&
    st.acknowledgedExplanationIds.includes("l12-position-rule") &&
    st.frozenFailure === null &&
    st.localAttemptFailure === null;

  return {
    pass: applied,
    reason: applied
      ? "Preserved current status and applied the observed mismatch rule to the transfer."
      : "Preserve current status, inspect the completed run, and place the changing report from the evidence.",
    evidence: applied
      ? [
          "l12-start-2-prediction-revealed",
          "l12-start-7-resolved",
          "l12-transfer-placed",
          "l12-position-rule",
        ]
      : ["l12-start-2-prediction-revealed"],
  };
}
```

Stars:

- **1 star — Rule applied:** satisfy the behavioral gate and post-evidence transfer.
- **2 stars — Fast recovery:** pass with `attempt <= 2`.
- **3 stars — Fresh and reusable:** pass on `attempt === 1`, retain the enabled dynamic status, record six full 24,300-token reads, and have `attemptMetrics.spentUsd <= $0.18996` when `COMPLETE_ATTEMPT` evaluates stars.

Every path is canonical `ReducerState` state. No predicate uses an invented field, object-key access into `units`, prediction correctness, exact floating-point equality, or an illegal comparison op.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First drag of `l12-status` | **“Blocks are sent left to right.”** |
| Status disabled | **“Status removed · the packet is smaller, but startup state is unavailable.”** |
| Prediction committed | **“Estimate locked. Opening Start 1…”** |
| Start 1 with enabled status | **“START 1 · 24,300 tokens cached · WRITE $0.14580”** |
| Harmful Start 2 mismatch appears | **“First mismatch: STATUS changed here.”** |
| Harmful sweep reaches suffix end | **“Everything after it missed · 24,300 rewritten.”** |
| Harmful Start 2 freezes | **“START 2 · $0.14586 actual · $0.00735 valid placement.”** |
| Reference Start 2 completes | **“Stable prefix matched · 24,300 reused · READ $0.00729”** |
| `l12-start-2-prediction-revealed` | **“Volatile: its exact bytes can change between starts.”** |
| Disabled attempt completes | **“Smaller, but blind: current project status is missing.”** |
| Successful Start 7 completes | **“Seven starts. One cold write.”** |
| Transfer opens | **“New packet. Same rule. Place the changing report.”** |
| Transfer succeeds | **“The changing report stays fresh without poisoning the reusable prefix.”** |
| Explanation acknowledged | **“Position beats size when an early change controls the suffix.”** |
| Projection opens | **“Projection only · Starts 3–7 were not sent on the frozen branch.”** |

`$0.14580` and `$0.00729` are the isolated 24,300-token write and read segments from `PRICE_REQUEST` (`C1`, `C3`, `C23`). Enabled full-row labels add the separate `$0.00006` fresh status input.

## 12. QA gate

Real-browser click-through must assert:

1. The first draggable control is usable by `2s` `[ESTIMATE]`.
2. The route and `LevelDef.id` are `"12-stable-at-the-front"`.
3. `concept.id` is `"volatile-prefix-position"`, `conceptScope` is `{ kind: "single", reusedConceptIds: [] }`, and prerequisites are exactly `["prefix-reuse", "byte-identical-prefix", "prefix-loadout-sizing"]`.
4. The title and objective contain none of `"stable"`, `"front"`, `"order"`, or `"boundary"`, including obvious inflections or hyphenation variants.
5. No pre-play copy, color, animation, DOM label, option styling, or accessibility description says where status belongs.
6. The pre-run prompt asks **“What will Start 2 cost?”** and shows only the three specified bands.
7. The run remains disabled until `l12-start2-cost` is committed.
8. A wrong band changes no score, star, wallet, failure, gate, or `pass(st)` result.
9. Pointer reorder, keyboard reorder, drop, and re-enable controls dispatch only their specified legal actions.
10. Harmful Start 2 resolves to `readTok=0`, `inputTok=20`, `writeTok=24,300`, `outTok=0`.
11. Reference Starts 2–7 resolve to `readTok=24,300`, `inputTok=20`, `writeTok=0`, `outTok=0`.
12. Disabled Starts 2–7 resolve to `readTok=24,300`, `inputTok=0`, `writeTok=0`, `outTok=0`.
13. Reference total is `$0.18996`, disabled local-outcome total is `$0.18954`, frozen harmful ledger total is `$0.29172`, and harmful seven-start projection is `$1.02102`.
14. Every actual request produces exactly one `LedgerRow` and one tape row.
15. Successful and disabled branches contain seven actual rows; the frozen harmful branch contains exactly two.
16. Every real request cost is positive, and no positive request or segment displays as `$0.0000`.
17. `UI_HOVER_PRICE_CALCULATOR` values equal `PRICE_REQUEST`; segment widths include every priced bucket and retain `outTok` in the denominator.
18. `l12-start-2-content-updated` completes before `l12-start-2-request-resolved`; `FREEZE_FAILURE` cannot fire before the harmful `l12-start-2` row and uncharged local quote have rendered and the request event has completed.
19. The harmful branch dispatches `FREEZE_FAILURE` immediately from `l12-start-2-request-resolved`, before `l12-start-2-prediction-revealed`; it does not wait for Start 7 or `COMPLETE_ATTEMPT`.
20. The failure frame displays request-local `$0.14586 > $0.00735` and the `$0.13851` difference.
21. Starts 3–7 are never dispatched when `frozenFailure.failureId === "l12-early-volatile"`; projected rows never enter ledger, tape source, wallet, `lastRequests`, or request counts.
22. The failure predicate uses `l12-start-2-request-resolved` plus `lastRequests.0.writeTok === 24300` and inspects no prediction selection or correctness.
23. Rewind after the Start 2 freeze restores the exact pre-run wallet, cache, clock, ledger, `lastRequests`, `AttemptMetrics`, and prediction state while retaining cross-attempt evidence.
24. The disabled-status branch is reachable, sends all seven requests, dispatches `STOP_LOCAL_ATTEMPT` and `COMPLETE_ATTEMPT`, leaves `clockFrozen === false`, `frozenFailure === null`, and `ended === null`, and records `$0.18954`.
25. The `$0.00042` disabled-route saving is reducer-visible through `attemptResult.spentUsd`; the enabled route’s benefit is reducer-visible through capability evidence, pass, and stars.
26. The success comparison remains unavailable until `l12-complete-attempt`; the frozen comparison remains unavailable until `l12-start-2-request-resolved` has dispatched `FREEZE_FAILURE`, and a healthy Start 2 cannot unlock it.
27. `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` mutate comparison visibility only and cannot dispatch `FREEZE_FAILURE`.
28. Projection rows are announced as **PROJECTED · NOT SENT** and cannot masquerade as actual `LedgerRow` evidence.
29. The transfer cannot open before all seven valid dynamic rows are visible.
30. The gate observes `REORDER_PREFIX_BLOCK` on `l12-report` after `l12-transfer-open`.
31. Merely committing or correctly answering the prediction cannot pass.
32. Cache liveness remains valid throughout the successful 30-minute fixture under the 60-minute main TTL (`C1`).
33. The reference action script is winnable and receives three stars.
34. The anti-pattern script freezes after its second actual request with `actualUsd > validAlternativeUsd`.
35. Static final tape bars render without hover; interactive bars expose exact bucket values.
36. Reduced motion replaces the harmful Start 2 sweep with an instantaneous mismatch marker and suffix highlight before the same freeze; projection evidence remains striped and informational.
37. Keyboard and pointer reorder paths produce equivalent actions and evidence mutations.
38. Screen-reader output announces block order, committed estimate, actual band on non-frozen branches, first mismatch, invalidated token count, immediate Start 2 request freeze, local alternative quote, projected-versus-actual status, transfer state, local-failure state, and rewind focus.
39. Every gameplay `[FICTION]` value is registered in `scenarioData.fixtures` with `id`, `semanticRole`, and `unit`; `scenarioData.estimates` contains presentation timing only.
40. Every gate, star, failure, and `pass(st)` reference uses a canonical `ReducerState` path and legal predicate operation.
41. The player can win without an undocumented control.

The structured identity assertion is:

```ts
{
  kind: "identity-no-solution-vocabulary",
  forbiddenTerms: ["stable", "front", "order", "boundary"],
  assertion: "title and objective contain no solution vocabulary",
}
```

## 13. Reference-bar justification

The screen begins with a tactile object: seven closed starts and one suspiciously small status card. The player manipulates the packet, commits a neutral cost estimate, and sees the causal answer emerge from the actual Start 2 ledger row.

The failure is strictly local. The first harmful repeated request visibly costs `$0.14586`, while the same request with identical current status after the reusable context costs `$0.00735`. The reducer freezes at `l12-start-2-request-resolved`, before prediction revelation, and never fabricates Starts 3–7. This keeps the economic lesson causal, truthful, and immediately rewindable.

The seven-start rhythm survives where it is honest: a correct dynamic route produces all seven actual rows, while the harmful continuation appears only as an explicitly non-economic projection after a meaningful attempt. Passing still requires a novel post-evidence action on the differently sized 2,000-token report.

The live counter-pressure is small but real and queryable. Dropping status saves `$0.00042` and completes a cheaper local attempt; retaining it is required for capability, passage, and stars. The player must therefore optimize reuse without deleting useful current context.

Implementation tradeoff: the corrected design gives up the previous six-request punitive accumulation so that failure remains local to Start 2. The later red bars are preserved only as striped projection evidence and never enter actual reducer economics. Successful and frozen comparison definitions remain separate so neither route exposes comparison evidence prematurely.
