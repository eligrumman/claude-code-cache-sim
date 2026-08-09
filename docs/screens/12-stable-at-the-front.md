# Level 12 — Stable at the Front

## 1. Identity

- `id`: `"12-stable-at-the-front"`
- `title`: **Stable at the Front**
- `tier`: `3`
- Player-facing objective: **“Seven session starts. One tiny block keeps changing. Arrange the start packet, then estimate the next bill.”**
- One concept: early volatile content invalidates the reusable suffix; prefix position can outweigh block size (`C9`, `C22`, `C23`).
- `concept.id`: `"volatile-prefix-position"`
- `prerequisiteConceptIds`: `["prefix-reuse", "byte-identical-prefix", "prefix-loadout-sizing"]`
- `concept.privateDesignerSummary`: A changing 20-token hook `[FICTION]` placed before 24,300 stable tokens forces that suffix to be rewritten on every start (`C23`).
- `concept.postRevealRule`: **“The first mismatch sets the reuse boundary. Put changing payload after stable cached context.”**
- Introduced control: reorderable `UI_PREFIX_STACK_VISUALIZER`.
- Vocabulary introduced after evidence: **volatile** — “content whose exact bytes may change between starts.”

The player must preserve fresh session status. Making the status static or dropping it may reduce cost, but removes the required `fresh-session-status` capability; moving the dynamic status therefore remains a functional and economic decision rather than a delete-to-win optimization.

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
- `TapeRenderer`
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

Proposed presentation timings are `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Seven closed terminal tabs land in a row, labelled **START 1** through **START 7**. Copy: **“Same project. Seven fresh starts.”** |
| `0.5s` | `UI_PREFIX_STACK_VISUALIZER` opens with five draggable cards. The 20-token card reads **“STATUS · 09:00 · clean”**. Stability labels, cache colors, breakpoint labels, prices, and answer copy remain hidden. |
| `1.0s` | Copy: **“This status line updates at every start. Arrange the packet.”** |
| `1.5s` | Cards become draggable. Controls: **“Make status static”**, **“Drop status”**, and **“Lock arrangement”**. Dropping shows only **“Some startup status will be unavailable.”** |
| `2.0s` | First interaction is available. No tape, reference arrangement, or placement hint is visible. |
| After lock | `UI_PREDICTION_PROMPT` asks only: **“What will Start 2 cost?”** Three neutral dollar bands appear. The run remains disabled until one band is committed. |

The internal opening order is deliberately harmful:

`PB_SYSTEM → PB_CURRENT(status) → PB_TOOLS → PB_INSTRUCTIONS → PB_HISTORY`

The player-facing stack does not label this order as harmful. The stable cache breakpoint follows `PB_HISTORY`.

Available decisions:

- reorder the still-dynamic `PB_CURRENT`;
- make its bytes static;
- disable it and accept loss of `fresh-session-status`.

No option is marked correct before an attempt.

## 4. Exact event sequence

The four stable blocks total `24,300` tokens (`C23`). The changing `PB_CURRENT` status contains `20` tokens `[FICTION]`. Seven starts `[FICTION]` occur at minutes `0`, `5`, `10`, `15`, `20`, `25`, and `30` `[FICTION]`, within the 60-minute `MAIN_SESSION_CONTEXT` TTL (`C1`).

1. **Enter level**
   - Event ID: `l12-enter`.
   - Event: route opens.
   - Action: `ENTER_LEVEL { levelId: "12-stable-at-the-front" }`.
   - Mutates: `ReducerState`, `Wallet`, `Clock`, units, empty ledger, empty cache, and attempt-local discovery state.
   - Numbers: wallet `$30` from the week budget (`C31`); clock `0 min`.

2. **Initialize the puzzle**
   - Event ID: `l12-initialize`.
   - Event: cold-open stack mounts.
   - Action: `SET_PREFIX_BLOCKS { contextId: "l12-main", blocks: l12OpeningBlocks }`.
   - Mutates: `PREFIX_STACK`.
   - Numbers: stable content `24,300` tokens (`C23`); status `20` tokens `[FICTION]`; total serialized request-side content `24,320` tokens.

3. **Checkpoint the decision**
   - Event ID: `l12-arrangement-checkpoint`.
   - Event: first drag or alternate-control focus.
   - Action: `CREATE_CHECKPOINT { checkpointId: "before-l12-arrangement", reason: "decision" }`.
   - Mutates: checkpoints only.

4. **Configure the SessionStart packet**
   - Reorder:
     - `REORDER_PREFIX_BLOCK { contextId: "l12-main", blockId: "l12-status", toIndex }`
     - Mutates block order and derived prefix-resolution evidence.
   - Make static:
     - `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-static", tokenCount: 20 }`
     - The scenario stops changing this hash between starts.
   - Drop:
     - `SET_PREFIX_BLOCK_ENABLED { contextId: "l12-main", blockId: "l12-status", enabled: false }`
     - Records missing capability `fresh-session-status`.
   - No request is sent and no price is revealed.

5. **Lock arrangement and request a cost estimate**
   - Event ID: `l12-open-start2-prediction`.
   - Event: player clicks **“Lock arrangement.”**
   - Actions:
     1. `CREATE_CHECKPOINT { checkpointId: "before-l12-run", reason: "prediction" }`
     2. `OPEN_PREDICTION { promptId: "l12-start2-cost" }`
   - Mutates: checkpoint and prediction state only.

6. **Commit the estimate**
   - Event ID: `l12-commit-start2-prediction`.
   - Event: player selects a dollar band and clicks **“Lock estimate.”**
   - Actions:
     1. `SELECT_PREDICTION { promptId: "l12-start2-cost", optionId }`
     2. `COMMIT_PREDICTION { promptId: "l12-start2-cost" }`
   - Mutates: committed prediction state only.
   - Prediction correctness changes no score, star, wallet, failure, or gate result.

7. **Start 1 establishes the cache entry**
   - Event ID: `l12-start-1-resolved`.
   - Event: player clicks **“Run seven starts.”**
   - Action: `SEND_REQUEST { request: l12-start-1 }`.
   - Mutates: `CacheEntry`, one `LedgerRow`, `Wallet`, `lastRequests`, tape payload, and `UI_MAIN_CACHE_PANEL`.
   - Both dynamic placements resolve to `readTok=0`, `inputTok=20`, `writeTok=24,300`, `outTok=0`; cost `$0.14586`.

8. **Start 2 changes the status and reveals the estimate**
   - Event ID: `l12-start-2-reveal`.
   - Event: clock reaches minute `5`; status becomes **“09:05 · 1 file changed”** `[FICTION]`.
   - Actions:
     1. `ADVANCE { min: 5 }`
     2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-02", tokenCount: 20 }`
     3. `SEND_REQUEST { request: l12-start-2 }`
     4. `REVEAL_PREDICTION { promptId: "l12-start2-cost", correctOptionId: resolvedStart2Band }`
   - Mutates: `Clock`, `PREFIX_STACK.firstMismatchBlockId`, `matchedPrefixTok`, `invalidatedSuffixTok`, `CacheEntry`, ledger, wallet, tape, and prediction reveal state.
   - Dynamic status after the stable boundary: `readTok=24,300`, `inputTok=20`, `writeTok=0`, `outTok=0`; `$0.00735`; correct band `band-under-one-cent`.
   - Dynamic status before the stable suffix: `readTok=0`, `inputTok=20`, `writeTok=24,300`, `outTok=0`; `$0.14586`; correct band `band-ten-to-twenty-cents`; `invalidatedSuffixTok=24,300` (`C9`, `C23`).
   - The revealed band is descriptive only; an incorrect estimate has no punitive effect.

9. **Starts 3–7 propagate the observed result**
   - Event IDs: `l12-start-3-resolved` through `l12-start-7-resolved`.
   - Event: each next tab opens after another five simulated minutes `[FICTION]`.
   - For each `n ∈ 3…7`:
     1. `ADVANCE { min: 5 }`
     2. `SET_PREFIX_BLOCK_CONTENT { contextId: "l12-main", blockId: "l12-status", identityHash: "l12-status-0n", tokenCount: 20 }`
     3. `SEND_REQUEST { request: l12-start-n }`
   - Mutates: clock, prefix resolution, cache state, one ledger row, wallet, and tape per start.
   - Dynamic status after the boundary, each: `readTok=24,300`, `inputTok=20`, `writeTok=0`, `outTok=0`; `$0.00735`.
   - Dynamic status before the suffix, each: `readTok=0`, `inputTok=20`, `writeTok=24,300`, `outTok=0`; `$0.14586`.
   - Harmful animation: the mismatch begins at the 20-token status and sweeps over the 24,300-token suffix. Starts 2–7 retain aligned propagation trails.

10. **Freeze the completed harmful run**
    - Event ID: `l12-harmful-freeze`.
    - Event: Start 7 completes with six repeated invalidations.
    - Action:
      `FREEZE_FAILURE { failure: { id: "l12-early-volatile", causeCode: "VOLATILE_BEFORE_STABLE", message: "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.", checkpointId: "before-l12-run" } }`.
    - Mutates: `clock.frozen` and `frozenFailure`; further economic input stops.
    - Visible economic evidence:
      - player route: `$1.02102`;
      - valid dynamic-status alternative: `$0.18996`;
      - visible delta: `$0.83106`;
      - the harmful route is about `5.38×` the valid route.
    - Six avoidable rewrites total `145,800` tokens: `6 × 24,300` (`C23`).
    - Start 2 remains pinned as the first causal mismatch; Start 7 is the decisive failure event because it completes the promised six-repeat economic result.

11. **Open the post-evidence transfer**
    - Event ID: `l12-transfer-open`.
    - Preconditions: all seven request rows are visible and the active attempt is not frozen.
    - Actions:
      1. `BEGIN_TRANSFER { challengeId: "l12-changing-report" }`
      2. `SET_PREFIX_BLOCKS { contextId: "l12-transfer", blocks: l12TransferBlocks }`
    - Mutates: transfer state and an unpriced `UI_PREFIX_STACK_VISUALIZER`.
    - Copy: **“A 2,000-token report changes every start. Place it in this new packet.”**
    - The transfer uses the same `24,300`-token stable context (`C23`) and a `2,000`-token changing report `[FICTION]`. It sends no `Request` and changes no wallet value.

12. **Demonstrate the rule after evidence**
    - Event ID: `l12-transfer-placed`.
    - Event: player moves `l12-report` after the stable breakpoint.
    - Action: `REORDER_PREFIX_BLOCK { contextId: "l12-transfer", blockId: "l12-report", toIndex: 4 }`.
    - Mutates: transfer stack order and post-evidence behavioral evidence.
    - This action, not the pre-reveal estimate, satisfies the gate’s post-evidence requirement.

13. **Acknowledge and complete**
    - Event ID: `l12-complete-attempt`.
    - Event: after the correct transfer placement, the player selects the causal explanation **“The first changed bytes cut off reuse for everything after them.”**
    - Actions:
      1. `ACK_EXPLANATION { explanationId: "l12-position-rule" }`
      2. `COMPLETE_ATTEMPT`
    - Mutates: explanation evidence, gate result, stars, and result summary.
    - A passing economic run totals at most `$0.18996` and preserves current status.

14. **Reveal the post-attempt comparison**
    - Event ID: `l12-reveal-comparison`.
    - Event: player clicks **“Compare placements.”**
    - Actions:
      1. `REQUEST_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail" }`
      2. `REVEAL_COUNTERFACTUAL { comparisonId: "l12-front-vs-tail" }`
    - Mutates: comparison visibility only.
    - Reveals `$1.02102` for the early dynamic status and `$0.18996` for the after-boundary dynamic status: an `$0.83106`, or `81.4%`, reduction.
    - The comparison is unavailable until a seven-start attempt has completed or frozen.

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
    tokenCount: 20, // [FICTION]
    identityHash: "l12-status-01",
    order: 1,
    cacheable: false,
    breakpointAfter: false,
    stability: "volatile",
    requiredCapability: "fresh-session-status",
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
    tokenCount: 3_000, // [FICTION]
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
    tokenCount: 2_255, // [FICTION]
    identityHash: "l12-history-v1",
    order: 4,
    cacheable: true,
    breakpointAfter: true,
    stability: "stable",
  },
];
```

The stable block counts satisfy `2,750 + 16,295 + 3,000 + 2,255 = 24,300` (`C6`, `C23`, `C24`). The reference action moves `l12-status` to index `4`, after the breakpoint-bearing stable block, without changing its 20-token size or dynamic behavior.

```ts
const level12: LevelDef = {
  id: "12-stable-at-the-front",
  tier: 3,
  title: "Stable at the Front",
  objective:
    "Seven session starts. One tiny block keeps changing. Arrange the start packet, then estimate the next bill.",
  concept: {
    id: "volatile-prefix-position",
    privateDesignerSummary:
      "A changing 20-token status before 24,300 stable tokens rewrites that suffix on every start.",
    postRevealRule:
      "The first mismatch sets the reuse boundary. Put changing payload after stable cached context.",
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
      hook: ["dynamic", "static", "none"],
    },
    estimates: [
      { label: "session-start request count", value: 7, tag: "[FICTION]" },
      { label: "volatile status tokens", value: 20, tag: "[FICTION]" },
      { label: "stable instruction tokens", value: 3000, tag: "[FICTION]" },
      { label: "stable history tokens", value: 2255, tag: "[FICTION]" },
      { label: "minutes between starts", value: 5, tag: "[FICTION]" },
      { label: "seven-start run span", value: 30, tag: "[FICTION]" },
      { label: "transfer report tokens", value: 2000, tag: "[FICTION]" },
      { label: "deterministic seed", value: 122430, tag: "[FICTION]" },
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
      revealId: "l12-start-2-reveal",
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
        id: "l12-seven-poisoned-starts",
        kind: "all",
        predicates: [
          {
            id: "l12-hook-is-dynamic",
            kind: "compare",
            path: "cfg.hook",
            op: "eq",
            value: "dynamic",
          },
          {
            id: "l12-status-before-boundary",
            kind: "compare",
            path: "evidence.l12.statusBeforeStableBoundary",
            op: "eq",
            value: true,
          },
          {
            id: "l12-six-invalidated-suffixes",
            kind: "compare",
            path: "evidence.l12.invalidatedRepeatCount",
            op: "eq",
            value: 6,
          },
        ],
      },
      decisiveEventId: "l12-start-7-resolved",
      causeCode: "VOLATILE_BEFORE_STABLE",
      message:
        "The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.",
      checkpointId: "before-l12-run",
      highlightObjectIds: ["l12-status", "l12-history", "l12-start-2"],
      actualUsd: 1.02102,
      validAlternativeUsd: 0.18996,
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
      "l12-start-2-reveal",
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
  pass: passLevel12,

  star2: {
    label: "No poisoned replay",
    predicate: {
      id: "l12-at-most-one-harmful-attempt",
      kind: "compare",
      path: "attemptEvidence.l12.harmfulCompletedRuns",
      op: "lte",
      value: 1,
    },
    reason: "Found the causal boundary with no more than one poisoned run.",
  },
  star3: {
    label: "Fresh and reusable",
    predicate: {
      id: "l12-three-star",
      kind: "all",
      predicates: [
        {
          id: "l12-first-run-valid",
          kind: "compare",
          path: "attemptEvidence.l12.harmfulCompletedRuns",
          op: "eq",
          value: 0,
        },
        {
          id: "l12-three-star-spend",
          kind: "compare",
          path: "wallet.spentUsd",
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
      "Kept current status while reusing all 24,300 stable tokens on Starts 2–7.",
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
      id: "l12-front-vs-tail",
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
        "What changed when the same status block moved?",
      revealCopy:
        "The status stayed 20 tokens. Moving it behind the boundary prevented six rewrites of the 24,300-token stable suffix.",
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
    headlineFail: "A tiny change poisoned the stable suffix.",
    evidenceLines: [
      "Starts 2–7 reused all 24,300 stable tokens.",
      "Current status remained enabled.",
      "The transfer report was placed after its stable context.",
    ],
    comparisonIds: ["l12-front-vs-tail"],
    continueLabel: "Open fleet audit",
    retryLabel: "Rewind to arrangement",
  },
  vocabulary: [
    {
      term: "volatile",
      definition: "Content whose exact bytes may change between starts.",
      firstNeededEventId: "l12-start-2-reveal",
      toastId: "l12-toast-volatile",
    },
  ],
  qa: level12Qa,
};
```

`seed: 122430` is `[FICTION]`. `budgetUsd: 30` is the week budget from `C31`. `referenceCfg` and `antiCfg` intentionally share configuration values: their economic difference comes solely from the ordered `REORDER_PREFIX_BLOCK` action. The anti-pattern retains `l12-status` at index `1`; the reference moves it to index `4`, after `l12-history` and its stable breakpoint.

## 6. Pricing walkthrough

All seven requests use Sonnet with `CACHE_TIER_1H`. Sonnet input is `$3/M`, cache read is `$0.30/M`, 1-hour write is `$6/M`, and output is `$15/M` (`C1`, `C3`). This SessionStart fixture generates `outTok=0`; that is the authoritative output quantity for every request.

There is one authoritative price table:

| Route | Request group | Count | Read/request | Input/request | Write/request | Output/request | Cost/request | Route total |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Dynamic status after boundary | Start 1 | `1` | `0` | `20` | `24,300` | `0` | `20×$3/M + 24,300×$6/M = $0.14586` | |
| Dynamic status after boundary | Starts 2–7 | `6` | `24,300` | `20` | `0` | `0` | `24,300×$0.30/M + 20×$3/M = $0.00735` | **`$0.18996`** |
| Dynamic status before suffix | Start 1 | `1` | `0` | `20` | `24,300` | `0` | `20×$3/M + 24,300×$6/M = $0.14586` | |
| Dynamic status before suffix | Starts 2–7 | `6` | `0` | `20` | `24,300` | `0` | `20×$3/M + 24,300×$6/M = $0.14586` | **`$1.02102`** |

Reference totals:

- `readTok = 6 × 24,300 = 145,800`
- `inputTok = 7 × 20 = 140`
- `writeTok = 24,300`
- `outTok = 0`
- total `= $0.14586 + 6 × $0.00735 = $0.18996`

Anti-pattern totals:

- `readTok = 0`
- `inputTok = 7 × 20 = 140`
- `writeTok = 7 × 24,300 = 170,100`
- `outTok = 0`
- total `= 7 × $0.14586 = $1.02102`

The early placement creates `145,800` avoidable rewritten tokens (`6 × 24,300`, `C23`) and costs `$0.83106` more. Exact state retains unrounded values. Static or dropped-status attempts remain priced by `PRICE_REQUEST` from their resolved buckets, but they cannot pass because they do not preserve `fresh-session-status`.

## 7. Tape sequence

`TapeRenderer` reads the seven `LedgerRow` objects in ledger order:

1. `l12-start-1` — **START 1 · 09:00**
2. `l12-start-2` — **START 2 · 09:05**
3. `l12-start-3` — **START 3 · 09:10**
4. `l12-start-4` — **START 4 · 09:15**
5. `l12-start-5` — **START 5 · 09:20**
6. `l12-start-6` — **START 6 · 09:25**
7. `l12-start-7` — **START 7 · 09:30**

Reveal groups:

- `l12-cold`: Start 1, revealed when the run begins.
- `l12-boundary`: Start 2, gated by committed prediction `l12-start2-cost`.
- `l12-propagation`: Starts 3–7, revealed sequentially after Start 2’s estimate is revealed.

Harmful arrangement animation:

`20-token input spark → first-mismatch marker → red sweep over 24,300-token write segment`

Reference arrangement animation:

`24,300-token blue read segment → 20-token red input tick at the tail`

Aha frame: `ahaRequestId: "l12-start-2"`.

Hover copy:

- Harmful: **“20 changed here · 24,300 after it could not be reused.”**
- Reference: **“24,300 matched first · 20 fresh tokens arrived after the boundary.”**

Every segment uses the canonical `TapeRenderer` cost-share geometry:

`segment.widthRatio = segment.usd / row.usd`

That geometry includes read, fresh input, write, and `outTok` output cost. Here `outTok=0`, so no violet output segment appears; the output bucket is still present in `PRICE_REQUEST` and the tape model (`C1`, `C3`). Hiding a zero output label does not change the canonical geometry rule.

## 8. Prediction prompts

### Required pre-reveal estimate

Question:

**“What will Start 2 cost?”**

Options:

- `band-under-one-cent`: **“$0.005–$0.010”**
- `band-ten-to-twenty-cents`: **“$0.10–$0.20”**
- `band-fifty-cents-to-one-dollar`: **“$0.50–$1.00”**

The options disclose neither a preferred position nor the prefix-invalidation mechanism. No band is styled, announced, or ordered as recommended.

`REVEAL_PREDICTION` cannot dispatch before `COMMIT_PREDICTION`. The correct option is derived from the actual Start 2 `LedgerRow`:

- `$0.00735` maps to `band-under-one-cent`;
- `$0.14586` maps to `band-ten-to-twenty-cents`.

Prediction correctness is recorded for reflection only. It never affects wallet, failure, pass, stars, or score.

### Required post-evidence transfer

After all seven rows are visible:

**“A 2,000-token report changes every start. Place it in this new packet.”**

The player reorders the report with `UI_PREFIX_STACK_VISUALIZER`. Moving it after the stable breakpoint dispatches the post-evidence `REORDER_PREFIX_BLOCK` action required by the gate. This transfer is unpriced and is not a second prediction.

## 9. Fail-state

Failure becomes decisive when Start 7 completes a harmful dynamic-status run:

- `l12-status` changed before the stable suffix;
- Starts 2–7 each recorded `invalidatedSuffixTok=24,300`;
- the seven visible rows total `$1.02102`;
- the valid dynamic-status route totals `$0.18996`.

Exact message:

**“The 20-token status changed before the boundary, so 24,300 later tokens had to be rewritten.”**

Secondary line:

**“Your seven starts cost $1.02102. The same live status after the boundary costs $0.18996.”**

The freeze is economically true: `$1.02102 > $0.18996`, a visible `$0.83106` difference. The completed harmful route is about `5.38×` the valid route.

`UI_REWIND_CONTROL` label: **“Rewind to arrangement”**.

It dispatches:

`REWIND_TO_CHECKPOINT { checkpointId: "before-l12-run" }`

Deterministic replay restores the pre-run wallet, cache, clock, ledger, and prediction state while preserving the chosen arrangement for editing and retaining completed-attempt history. Focus returns to `l12-status`; the cold-open is not replayed.

Static or dropped-status runs do not freeze because their central problem is missing capability rather than contradicted economics. They finish with:

**“Cheap is not enough: the session still needs current status.”**

They expose the same rewind control and cannot satisfy the behavioral gate.

## 10. Gate & stars

Pass requires:

- `l12-status` remains dynamic and enabled;
- it is ordered after the stable breakpoint;
- Starts 2–7 each record `readTok=24,300`, `inputTok=20`, `writeTok=0`, and `outTok=0`;
- after the seven-start evidence, the player moves the new 2,000-token changing report after its stable breakpoint;
- after that transfer, the player acknowledges `l12-position-rule`.

The committed pre-reveal estimate is required only to unlock the reveal. Its selected band and correctness are absent from `gate`, `passLevel12`, failure predicates, and star predicates. Budget alone cannot pass.

Stars:

- **1 star — Boundary found:** satisfy the behavioral gate, including the post-evidence transfer.
- **2 stars — No poisoned replay:** pass after no more than one completed harmful early-status run.
- **3 stars — Fresh and reusable:** pass on the first economic run, retain dynamic current status, record six complete 24,300-token reads, and spend at most `$0.18996`.

The three-star cost check uses `lte`, never exact floating-point equality. Static and dropped-status routes may spend less in a particular arrangement but cannot pass because they remove required functionality.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First drag of `l12-status` | **“Blocks are sent left to right.”** |
| Prediction committed | **“Estimate locked. Opening Start 1…”** |
| Start 1 completes | **“START 1 · 24,300 stable tokens saved · WRITE $0.14580”** |
| Harmful Start 2 mismatch appears | **“First mismatch: STATUS changed here.”** |
| Harmful sweep reaches suffix end | **“Everything after it missed · 24,300 rewritten.”** |
| Reference Start 2 completes | **“Stable prefix matched · 24,300 reused · READ $0.00729”** |
| `l12-start-2-reveal` | **“Volatile: its exact bytes can change between starts.”** |
| Static attempt completes | **“Reusable, but stale: every start still says 09:00.”** |
| Dropped attempt completes | **“Smaller, but blind: current project status is missing.”** |
| Successful Start 7 completes | **“Seven starts. One cold write.”** |
| Transfer opens | **“New packet. Same rule. Place the changing report.”** |
| Transfer succeeds | **“The changing report can stay fresh without poisoning the stable prefix.”** |
| Explanation acknowledged | **“Position beats size when an early change controls the suffix.”** |

`$0.14580` and `$0.00729` are the isolated 24,300-token write and read segment costs from `PRICE_REQUEST` (`C1`, `C3`, `C23`). The ledger, wallet, and full-row labels include the separate 20-token fresh-input cost.

## 12. QA gate

Real-browser click-through must assert:

1. The first draggable control is usable by `2s` `[ESTIMATE]`.
2. The route and `LevelDef.id` use `"12-stable-at-the-front"`.
3. `concept.id` is `"volatile-prefix-position"` and prerequisites are exactly `["prefix-reuse", "byte-identical-prefix", "prefix-loadout-sizing"]`.
4. No pre-play copy, color, animation, option styling, DOM label, or accessibility description says that status belongs after the boundary.
5. The pre-run prompt asks **“What will Start 2 cost?”** and shows only the three specified dollar bands.
6. The seven-start run remains disabled until `l12-start2-cost` is committed.
7. A wrong band changes no score, star, wallet, failure, gate, or `passLevel12` result.
8. Drag, keyboard reorder, static, and drop controls dispatch only their specified reducer actions.
9. The harmful dynamic layout resolves Starts 2–7 to `readTok=0`, `inputTok=20`, `writeTok=24,300`, `outTok=0`.
10. The reference dynamic layout resolves Starts 2–7 to `readTok=24,300`, `inputTok=20`, `writeTok=0`, `outTok=0`.
11. Reference total is `$0.18996`; anti-pattern total is `$1.02102`; no alternative value for either quantity appears.
12. Every request produces exactly one `LedgerRow` and one tape row; the tape contains exactly seven priced rows.
13. Every real request cost is positive, and no positive request or segment displays as `$0.0000`.
14. `UI_HOVER_PRICE_CALCULATOR` values equal `PRICE_REQUEST`.
15. Tape segment widths use each bucket’s USD share and include `outTok` in the denominator even though this fixture’s authoritative `outTok` is zero.
16. Harmful propagation originates at the 20-token status and crosses the 24,300-token suffix on all six repeated starts.
17. Failure cannot fire before `l12-start-7-resolved`.
18. The failure frame displays `$1.02102 > $0.18996` and the `$0.83106` economic difference.
19. The failure predicate inspects no prediction selection or correctness.
20. Rewind restores the exact pre-run wallet, cache, clock, ledger, and prediction state while retaining completed-attempt history.
21. Static and dropped-status branches are reachable, do not freeze, and cannot satisfy the required capability evidence.
22. The counterfactual remains unavailable until a meaningful seven-start attempt completes or freezes.
23. The transfer cannot open before all seven causal rows are visible.
24. The gate observes `REORDER_PREFIX_BLOCK` on `l12-report` after `l12-transfer-open`.
25. Merely committing or correctly answering the pre-reveal estimate cannot pass the level.
26. Cache liveness remains valid throughout the 30-minute fixture under the 60-minute main TTL (`C1`).
27. The reference action script is winnable and receives three stars.
28. The anti-pattern action script reaches the intended economically true failure.
29. Static final tape bars render without hover; interactive bars expose exact bucket values.
30. Reduced motion replaces each suffix sweep with an instantaneous mismatch marker and six aligned invalidation highlights while preserving evidence order.
31. Keyboard and pointer reorder paths produce equivalent actions.
32. Screen-reader output announces block order, committed estimate, actual band, first mismatch, invalidated token count, transfer state, and rewind focus.
33. Every authoritative request count, token count, cost, threshold, and total has one implementable value.
34. The player can win without an undocumented control.

## 13. Reference-bar justification

The screen begins with a tactile object: seven closed starts and one suspiciously small status card. The player arranges the packet, commits a neutral cost estimate, and watches the answer emerge from the ledger instead of seeing the position rule embedded in a multiple-choice option.

The seven-row propagation remains the screen’s signature reveal. The first mismatch appears on Start 2, then repeats until the economic difference is unmistakable. The harmful route freezes only after its completed ledger visibly costs `$1.02102`, versus `$0.18996` for the valid dynamic-status route.

Passing requires a fresh post-evidence action: the player applies the discovered rule to a differently sized changing report. The pre-reveal estimate remains psychologically useful but non-punitive. The successful route preserves current status, while static and dropped alternatives expose a genuine capability tradeoff.

Implementation tradeoff: the level keeps the praised seven-start accumulation instead of freezing at the first mismatch; Start 2 remains the pinned causal origin, while Start 7 is the declared decisive failure event because it completes the six-repeat economic evidence.
