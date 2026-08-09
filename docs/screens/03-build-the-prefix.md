# Level 3 — The Reminder

## 1. Identity

- **id:** `03-build-the-prefix`
- **title:** The Reminder
- **tier:** `1`
- **objective:** “Add a reminder needed only for the current session.”
- **concept.id:** `prefix-reuse`
- **concept.privateDesignerSummary:** Cache reuse follows the longest byte-identical ordered prefix; the first changed block invalidates the cacheable suffix.
- **concept.postRevealRule:** “The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again.”
- **concept.solutionVocabulary:** `prefix`, `reuse`, `rebuild`, `rewrite`, `first mismatch`, `cached suffix`, `change late`
- **conceptScope:** `{ kind: "single", reusedConceptIds: [] }`
- **prerequisiteConceptIds:** `write-vs-read`, `cache-expiry`

The title and objective frame the situation without using the registered solution vocabulary. Identity and prerequisites use the canonical `LevelId`, `ConceptId`, and `ConceptScope` registries from `OBJECT_MODEL.md`.

## 2. Objects used

- `MAIN_SESSION_CONTEXT`
- `PB_SYSTEM`
- `PB_TOOLS`
- `PB_INSTRUCTIONS`
- `PB_HISTORY`
- `PB_CURRENT`
- `PREFIX_STACK`
- `Request`
- `CacheEntry`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Checkpoint`
- `PredictionState`
- `FrozenFailure`
- `StatePredicate`
- `AttemptMetrics`
- `AttemptResult`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_TAPE_RENDERER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`

`SET_PREFIX_BLOCK_CONTENT` is the level’s only newly introduced player control. Sending, prediction, explanation, and rewind use previously established shared controls.

## 3. Cold-open / narrative

No instruction card and no player-controlled assembly exercise.

| Time | Beat |
|---:|---|
| `0.0s` `[ESTIMATE]` | Five labeled blocks land with temporary presentation offsets that visually read `SYSTEM │ TOOLS │ INSTRUCTIONS │ CURRENT │ HISTORY`. Header: **“Five blocks. One request.”** Token counts, cache colors, prices, and boundaries are hidden. |
| `0.5s` `[ESTIMATE]` | `HISTORY` and `CURRENT` cross into the settled display order `SYSTEM │ TOOLS │ INSTRUCTIONS │ HISTORY │ CURRENT`. This is a cosmetic layout animation only: reducer state was canonical from entry, no hit target is exposed, and no `REORDER_PREFIX_BLOCK` action is dispatched. |
| `1.0s` `[ESTIMATE]` | The settled stack gives one quiet pulse. Copy: **“Nothing has been sent yet.”** |
| `≤2.0s` `[ESTIMATE]` | `UI_PREDICTION_PROMPT` becomes the first interactive surface. |

`firstInteractiveBySec: 2`.

During the animation, `UI_PREFIX_STACK_VISUALIZER` uses `mode: "inspect"`, `showTokenCounts: false`, and `revealBoundary: false`. Screen-reader order remains canonical throughout; presentation offsets do not alter accessible order or reducer state.

## 4. Exact event sequence

### 1. Enter and seed the canonical request

**Event:** Screen opens.

**Actions:**

```ts
ENTER_LEVEL { levelId: "03-build-the-prefix" }

SET_PREFIX_BLOCKS {
  contextId: "l3-main",
  blocks: [
    PB_SYSTEM_L3,
    PB_TOOLS_L3,
    PB_INSTRUCTIONS_L3,
    PB_HISTORY_L3,
    PB_CURRENT_L3
  ]
}
```

**Objects mutated:** `ReducerState`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, `Wallet`, level-start `Checkpoint`.

**Level-specific numbers:**

- `PB_SYSTEM_L3`: `2,750 tok` (`SYSTEM_BASE`, `C6`)
- `PB_TOOLS_L3`: `16,295 tok` (`TOOLS_BASE`, `C24`)
- `PB_INSTRUCTIONS_L3`: `2,610 tok` (`CATALOG_RESIDUE`, derived from `C6`, `C7`)
- `PB_HISTORY_L3`: `13,083 tok` (`L3_HISTORY_FIXTURE`, `C35`, `[FICTION]`)
- `PB_CURRENT_L3`: `6,000 tok` (`WORK_IN`, `C28`, `[FICTION]`)
- Cacheable front portion: `2,750 + 16,295 + 2,610 + 13,083 = 34,738 tok`
- Whole request input side: `40,738 tok`
- Expected output: `44,000 tok` (`WORK_OUT`, `C28`, `[FICTION]`)
- Breakpoint: after `PB_HISTORY_L3`; `34,738 ≥ 1,024` (`C26`)
- Clock: `0 min`
- Wallet: `$2.50` `[FICTION]`

`L3_HISTORY_FIXTURE` is the canonical, semantically specific conversation-history fixture registered as `C35`. Numerical equality with `CATALOG_FULL` does not establish provenance, and `C7` is not cited for `PB_HISTORY_L3`.

The visualizer begins with `showTokenCounts: false` and `revealBoundary: false`.

### 2. Play the cosmetic settle and checkpoint the first send

**Event:** The cold-open layout animation completes.

No reducer action represents the visual crossing of `HISTORY` and `CURRENT`; the canonical `PREFIX_STACK.blocks` array does not change.

The system then dispatches:

```ts
CREATE_CHECKPOINT {
  checkpointId: "cp-l3-first-send",
  reason: "unit-start"
}
```

**Objects mutated:** `Checkpoint` only.

**Numbers:** Five blocks, one active breakpoint, zero ledger rows, and zero wallet change. Token counts remain hidden.

### 3. Predict the cold send

**Event:** Before the first tape row may reveal, `UI_PREDICTION_PROMPT` opens.

**Actions:**

```ts
OPEN_PREDICTION { promptId: "l3-cold-result" }
SELECT_PREDICTION { promptId: "l3-cold-result", optionId }
COMMIT_PREDICTION { promptId: "l3-cold-result" }
```

**Objects mutated:** `PredictionState`.

**Numbers:** No request, ledger, cache, wallet, or prefix mutation.

Prediction correctness is evidence only. It cannot affect score, stars, failure, wallet, or the pass gate.

### 4. Send the cold request, then reveal token counts

**Event:** Player activates **SEND** after committing the prediction.

**Action:**

```ts
SEND_REQUEST { request: R1_COLD }
```

followed by:

```ts
REVEAL_PREDICTION {
  promptId: "l3-cold-result",
  correctOptionId: "write-front-four"
}
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `lastRequests`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`, `UI_MAIN_CACHE_PANEL` evidence.

**Resolution:**

- `readTok: 0`
- `writeTok: 34,738`
- `inputTok: 6,000`
- `outTok: 44,000`
- `writeTier: "1h"`
- `cold: true`
- Cost: `$0.886428`
- Wallet: `$2.500000 → $1.613572`
- `attemptMetrics.spentUsd: $0.886428`
- Live entry: `34,738 tok`
- TTL: `60 min` (`C1`)

Only after `SEND_REQUEST` has resolved does `UI_PREFIX_STACK_VISUALIZER.showTokenCounts` change from `false` to `true`. The row then animates, and toast `l3-first-written` fires. No token count is shown during the cold open or first prediction.

### 5. Predict the identical resend

**Event:** The ordered stack remains unchanged. **SEND AGAIN** is disabled until commitment.

**Actions:**

```ts
OPEN_PREDICTION { promptId: "l3-repeat-boundary" }
SELECT_PREDICTION { promptId: "l3-repeat-boundary", optionId }
COMMIT_PREDICTION { promptId: "l3-repeat-boundary" }

CREATE_CHECKPOINT {
  checkpointId: "cp-l3-repeat",
  reason: "prediction"
}
```

**Objects mutated:** `PredictionState`, `Checkpoint`.

**Numbers:** No ledger row or wallet change.

### 6. Reveal the identical resend

**Event:** Player activates **SEND AGAIN**.

**Action:**

```ts
SEND_REQUEST { request: R2_IDENTICAL }
```

followed by:

```ts
REVEAL_PREDICTION {
  promptId: "l3-repeat-boundary",
  correctOptionId: "through-history"
}
```

**Objects mutated:** `CacheEntry.lastTouchMin`, `CacheEntry.expiresAtMin`, `LedgerRow`, `Wallet`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`.

**Resolution:**

- `readTok: 34,738`
- `writeTok: 0`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.6884214`
- Wallet: `$1.613572 → $0.9251506`
- `attemptMetrics.spentUsd: $1.5748494`
- Matched blocks: `SYSTEM`, `TOOLS`, `INSTRUCTIONS`, `HISTORY`
- Fresh block: `CURRENT`
- The read refreshes the entry’s idle TTL to `60 min` from this request (`C1`, `C12`)

This event is `reveal-r2-identical`, the first evidence boundary used by the pass gate. The visualizer reveals the blue matched run only after prediction commitment. Toasts `l3-prefix-name` and `l3-current-fresh` fire.

### 7. Offer the scoped transfer decision

**Event:** A ticket appears:

> **REMINDER SCOPE: THIS SESSION ONLY**  
> Add one reminder without changing the task’s behavior.

The level’s new `prefixBlocks` control presents two editable destinations without cache labels or prices:

- **BOOT PATCH** — “Put it in global SYSTEM policy. It persists beyond this session.”
- **FOLLOW-UP** — “Add it to this session’s HISTORY. It disappears with the session.”

The choice has live counter-pressure:

- BOOT PATCH pays more now but preserves the reminder for future sessions.
- FOLLOW-UP is cheaper for this request but deliberately gives up that persistence.

The ticket needs the reminder only for the current session, so either placement supplies the immediate behavior while buying different scope.

**Actions:**

```ts
BEGIN_TRANSFER { challengeId: "l3-change-one-block" }

CREATE_CHECKPOINT {
  checkpointId: "cp-l3-change-choice",
  reason: "decision"
}
```

**Objects mutated:** `LevelPhase`, `Checkpoint`.

**Numbers:** Either edit changes one block’s `identityHash` while preserving its token count. Byte identity and first-mismatch position are the only cache variables (`C8`, `C9`).

### 8. Apply the selected edit and predict its result

**BOOT PATCH action:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_SYSTEM_L3",
  identityHash: "system-v2",
  tokenCount: 2750
}
```

The completed transfer record appends `l3-edit-system`.

**FOLLOW-UP action:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_HISTORY_L3",
  identityHash: "history-v2",
  tokenCount: 13083
}
```

The completed transfer record appends `l3-edit-history`.

The first selected placement also records one immutable attempt-local marker:

- BOOT PATCH first: `l3-first-edit-system`
- FOLLOW-UP first: `l3-first-edit-history`

A local rewind removes the completed edit ID for the rewound branch but retains the first-choice marker, preventing a corrected route from earning the first-choice star.

**Objects mutated:** selected `PrefixBlock`, `PREFIX_STACK.firstMismatchBlockId`, `PREFIX_STACK.matchedPrefixTok`, `PREFIX_STACK.invalidatedSuffixTok`, `completedTransferIds`.

**Hidden resolution before reveal:**

- BOOT PATCH: matched `0 tok`; cacheable suffix requiring rewrite `34,738 tok`
- FOLLOW-UP: matched `21,655 tok`; cacheable suffix requiring rewrite `13,083 tok`

`UI_PREFIX_STACK_VISUALIZER.revealBoundary` remains `false`.

Then:

```ts
OPEN_PREDICTION { promptId: "l3-change-boundary" }
SELECT_PREDICTION { promptId: "l3-change-boundary", optionId }
COMMIT_PREDICTION { promptId: "l3-change-boundary" }
```

**SEND CHANGED REQUEST** remains disabled until commitment.

### 9A. Successful late-change reveal

**Precondition:** FOLLOW-UP was selected.

**Event:** Player activates **SEND CHANGED REQUEST**.

**Action:**

```ts
SEND_REQUEST { request: R3_LATE_CHANGE }
```

followed by:

```ts
REVEAL_PREDICTION {
  promptId: "l3-change-boundary",
  correctOptionId: "read-three-write-history"
}
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`, `completedEventIds`.

**Resolution:**

- Reread: `SYSTEM + TOOLS + INSTRUCTIONS = 21,655 tok`
- Rewritten: `HISTORY = 13,083 tok`
- Fresh: `CURRENT = 6,000 tok`
- Output: `44,000 tok`
- `readTok: 21,655`
- `writeTok: 13,083`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.7629945`
- Wallet: `$0.9251506 → $0.1621561`
- `attemptMetrics.spentUsd: $2.3378439`
- `firstMismatchBlockId: "PB_HISTORY_L3"`
- `invalidatedSuffixTok: 13,083`

This is `reveal-r3-late` and the aha frame. The visualizer enters `mode: "diff"`, identifies the first mismatch, colors three blocks as reread, marks `HISTORY` rewritten, and leaves `CURRENT` fresh. Toast `l3-late-boundary` fires.

The post-reveal explanation check appears:

```text
What made the cheaper route work?

A. The first changed block ended reuse; only its cached tail was rewritten.
B. Each unchanged block can be reused regardless of order.
C. The smallest block is always the one rewritten.
```

Selecting an option dispatches `ACK_EXPLANATION` with one of:

- `l3-prefix-rule` for A
- `l3-order-does-not-matter` for B
- `l3-smallest-rewrites` for C

The player may continue after any answer or skip the optional check. It affects only the two-star predicate, never the pass gate.

Finally:

```ts
COMPLETE_ATTEMPT
```

On completion, `attemptResult.spentUsd` snapshots `attemptMetrics.spentUsd` as `$2.3378439`.

### 9B. Early-change fail-freeze

**Precondition:** BOOT PATCH was selected.

**Event:** Player activates **SEND CHANGED REQUEST**.

**Action:**

```ts
SEND_REQUEST { request: R3_EARLY_CHANGE }
```

followed by:

```ts
REVEAL_PREDICTION {
  promptId: "l3-change-boundary",
  correctOptionId: "rewrite-all-cached"
}
```

After the request row has fully rendered, the actual-attempt failure rule dispatches:

```ts
FREEZE_FAILURE {
  failure: {
    failureId: "l3-early-change",
    causeCode: "EARLY_PREFIX_MISMATCH",
    message:
      "SYSTEM changed first. The entire 34,738-token cached tail had to be written again.",
    checkpointId: "cp-l3-change-choice"
  }
}
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`, `FrozenFailure`, `clockFrozen`, `completedEventIds`.

**Resolution:**

- `readTok: 0`
- `writeTok: 34,738`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.886428`
- Wallet: `$0.9251506 → $0.0387226`
- `attemptMetrics.spentUsd: $2.4612774`
- `firstMismatchBlockId: "PB_SYSTEM_L3"`
- `invalidatedSuffixTok: 34,738`

The decisive frame shows:

```text
ACTUAL — SYSTEM placement
$0.886428 total · $0.208428 cached-prefix write

VALID SESSION-ONLY PLACEMENT — HISTORY
$0.7629945 total · $0.0849945 cached-prefix read/write

VISIBLE MISTAKE COST
+$0.1234335 total · cached-prefix portion 2.45×
```

The equal `$0.018000` fresh-input and `$0.660000` output portions remain visible in both rows. The actual full request is more expensive than the valid route: `$0.886428 > $0.7629945`.

Block evidence:

- `SYSTEM`: **CHANGED · REWRITTEN · 2,750**
- `TOOLS`: **AFTER CHANGE · REWRITTEN · 16,295**
- `INSTRUCTIONS`: **AFTER CHANGE · REWRITTEN · 2,610**
- `HISTORY`: **AFTER CHANGE · REWRITTEN · 13,083**
- `CURRENT`: **FRESH · 6,000**

The failure belongs to the player’s actual economic action. It is not dispatched by `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, or any reference reveal. No economic control remains active except `UI_REWIND_CONTROL`.

### 10. Rewind locally

**Event:** Player activates **“Try the placement again.”**

**Action:**

```ts
REWIND_TO_CHECKPOINT {
  checkpointId: "cp-l3-change-choice"
}
```

**Objects mutated:** deterministic replay branch, `FrozenFailure`, `clockFrozen`, attempt-retained first-choice evidence.

**Restored state:**

- Wallet: `$0.9251506`
- `attemptMetrics.spentUsd: $1.5748494`
- Ledger: exactly two rows
- Live cache entry: `34,738 tok`
- Stack identities: pre-transfer values
- `l3-edit-system`: removed
- `l3-first-edit-system`: retained
- Cold open, cosmetic settle, cold send, and repeat send are not replayed

The player can choose the session-scoped FOLLOW-UP and complete the level.

## 5. Level data

```ts
const L3: LevelDef = {
  id: "03-build-the-prefix",
  tier: 1,
  title: "The Reminder",
  objective:
    "Add a reminder needed only for the current session.",

  concept: {
    id: "prefix-reuse",
    privateDesignerSummary:
      "Cache reuse follows the longest byte-identical ordered prefix; the first changed block invalidates the cacheable suffix.",
    postRevealRule:
      "The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again.",
    solutionVocabulary: [
      "prefix",
      "reuse",
      "rebuild",
      "rewrite",
      "first mismatch",
      "cached suffix",
      "change late"
    ]
  },

  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },

  prerequisiteConceptIds: ["write-vs-read", "cache-expiry"],

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
    "keepWarmMin",
    "hook",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp"
  ],

  scope: "session",
  seed: 34738,
  budgetUsd: 2.50,
  clockCapMin: 60,

  cfgOverride: {
    orchestratorModel: "sonnet",
    planModel: "sonnet",
    devModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    keepWarm: false,
    hook: "static"
  },

  scenario: "prefix-builder",

  scenarioData: {
    units: [],
    contexts: [L3_MAIN_CONTEXT_SEED],
    prefixStacks: [L3_PREFIX_SEED],
    estimates: [
      { label: "budgetUsd", value: 2.50, tag: "[FICTION]" },
      { label: "firstInteractiveBySec", value: 2, tag: "[ESTIMATE]" },
      { label: "cosmeticCrossSec", value: 0.5, tag: "[ESTIMATE]" }
    ]
  },

  coldOpen: L3_COLD_OPEN,
  sequence: L3_SEQUENCE,
  predictions: [
    L3_PRED_COLD,
    L3_PRED_REPEAT,
    L3_PRED_CHANGE
  ],
  toasts: L3_TOASTS,

  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "none",
    cite: "C8/C9",
    line:
      "SYSTEM changed first. The entire 34,738-token cached tail had to be written again."
  },

  failureRules: [
    {
      id: "l3-early-change",
      predicate: {
        id: "l3-early-change-predicate",
        kind: "all",
        predicates: [
          {
            id: "l3-system-edit-completed",
            kind: "includes",
            path: "completedTransferIds",
            value: "l3-edit-system"
          },
          {
            id: "l3-early-reveal-completed",
            kind: "event-completed",
            eventId: "reveal-r3-early"
          },
          {
            id: "l3-early-request-is-latest",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "R3_EARLY_CHANGE",
            observedAfterEventId: "reveal-r3-early"
          },
          {
            id: "l3-early-write-exact",
            kind: "compare",
            path: "lastRequests.0.writeTok",
            op: "eq",
            value: 34738,
            observedAfterEventId: "reveal-r3-early"
          }
        ]
      },
      decisiveEventId: "reveal-r3-early",
      causeCode: "EARLY_PREFIX_MISMATCH",
      message:
        "SYSTEM changed first. The entire 34,738-token cached tail had to be written again.",
      checkpointId: "cp-l3-change-choice",
      highlightObjectIds: [
        "PB_SYSTEM_L3",
        "PB_TOOLS_L3",
        "PB_INSTRUCTIONS_L3",
        "PB_HISTORY_L3",
        "R3_EARLY_CHANGE"
      ],
      actualUsd: 0.886428,
      validAlternativeUsd: 0.7629945
    }
  ],

  checkpoints: [
    {
      id: "cp-l3-first-send",
      createBeforeEventId: "predict-r1-cold",
      reason: "unit-start",
      resumeLabel: "Return to the first send."
    },
    {
      id: "cp-l3-repeat",
      createBeforeEventId: "send-r2-identical",
      reason: "prediction",
      resumeLabel: "Return to the identical resend."
    },
    {
      id: "cp-l3-change-choice",
      createBeforeEventId: "choose-l3-edit",
      reason: "decision",
      resumeLabel: "Try the placement again."
    }
  ],

  gate: {
    predicateId: "l3-demonstrated-late-reuse",

    evidenceRevealEventIds: [
      "reveal-r2-identical",
      "reveal-r3-late"
    ],

    postEvidenceActionRequirements: [
      {
        id: "l3-history-edit-after-repeat-evidence",
        kind: "action-observed",
        actionType: "SET_PREFIX_BLOCK_CONTENT",
        afterEventId: "reveal-r2-identical",
        match: {
          contextId: "l3-main",
          blockId: "PB_HISTORY_L3",
          identityHash: "history-v2",
          tokenCount: 13083
        }
      }
    ],

    behavioralRequirements: [
      {
        id: "l3-late-request-completed",
        kind: "event-completed",
        eventId: "reveal-r3-late"
      },
      {
        id: "l3-r3-request-is-latest",
        kind: "compare",
        path: "lastRequests.0.requestId",
        op: "eq",
        value: "R3_LATE_CHANGE",
        observedAfterEventId: "reveal-r3-late"
      },
      {
        id: "l3-r3-read-exact",
        kind: "compare",
        path: "lastRequests.0.readTok",
        op: "eq",
        value: 21655,
        observedAfterEventId: "reveal-r3-late"
      },
      {
        id: "l3-r3-write-exact",
        kind: "compare",
        path: "lastRequests.0.writeTok",
        op: "eq",
        value: 13083,
        observedAfterEventId: "reveal-r3-late"
      },
      {
        id: "l3-r3-fresh-exact",
        kind: "compare",
        path: "lastRequests.0.inputTok",
        op: "eq",
        value: 6000,
        observedAfterEventId: "reveal-r3-late"
      },
      {
        id: "l3-r3-output-exact",
        kind: "compare",
        path: "lastRequests.0.outTok",
        op: "eq",
        value: 44000,
        observedAfterEventId: "reveal-r3-late"
      }
    ],

    transferRequirement: {
      id: "l3-session-scoped-transfer",
      kind: "includes",
      path: "completedTransferIds",
      value: "l3-edit-history",
      observedAfterEventId: "reveal-r2-identical"
    }
  },

  pass(st: ReducerState): GateResult {
    const r3 = st.ledger.find(
      (row) => row.requestId === "R3_LATE_CHANGE"
    );

    const passed =
      st.completedEventIds.includes("reveal-r2-identical") &&
      st.completedEventIds.includes("reveal-r3-late") &&
      st.completedTransferIds.includes("l3-edit-history") &&
      r3 !== undefined &&
      r3.readTok === 21655 &&
      r3.writeTok === 13083 &&
      r3.inputTok === 6000 &&
      r3.outTok === 44000;

    return {
      pass: passed,
      reason: passed
        ? "The post-evidence HISTORY edit preserved the first three blocks and completed the scoped transfer."
        : "Complete the post-evidence scoped edit and resolve its request.",
      evidence: [
        ...(st.completedEventIds.includes("reveal-r2-identical")
          ? ["reveal-r2-identical"]
          : []),
        ...(st.completedTransferIds.includes("l3-edit-history")
          ? ["l3-edit-history"]
          : []),
        ...(r3 !== undefined
          ? ["R3_LATE_CHANGE"]
          : [])
      ]
    };
  },

  star2: {
    label: "Named the boundary",
    predicate: {
      id: "l3-explained-after-evidence",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l3-prefix-rule",
      observedAfterEventId: "reveal-r3-late"
    },
    reason:
      "Selected the causal first-mismatch explanation after seeing the late-change tape."
  },

  star3: {
    label: "Changed late",
    predicate: {
      id: "l3-first-try-reference",
      kind: "all",
      predicates: [
        {
          id: "l3-history-was-first-choice",
          kind: "includes",
          path: "completedTransferIds",
          value: "l3-first-edit-history"
        },
        {
          id: "l3-reference-spend-threshold",
          kind: "compare",
          path: "attemptResult.spentUsd",
          op: "lte",
          value: 2.3378439
        }
      ]
    },
    reason:
      "Used the sufficient session-scoped placement on the first transfer attempt and stayed at or below the reference spend."
  },

  referenceCfg: {
    devModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    hook: "static"
  },

  antiCfg: {
    devModel: "sonnet",
    who: "inline",
    prompts: "identical",
    oneHourFlag: true,
    hook: "static"
  },

  counterfactuals: [
    {
      id: "l3-edit-position",
      unlockAfterEventId: "complete-l3-attempt",
      kind: "alternate-choice",
      cfg: {
        devModel: "sonnet",
        who: "inline",
        prompts: "identical",
        oneHourFlag: true,
        hook: "static"
      },
      comparisonQuestion:
        "How much did moving the same session-only reminder earlier change the third request?",
      revealCopy:
        "Changing SYSTEM ended reuse at the first block; changing HISTORY preserved the first 21,655 tokens."
    }
  ],

  tape: L3_TAPE,
  result: L3_RESULT,
  vocabulary: L3_VOCABULARY,
  qa: L3_QA
};
```

Every `StatePredicate` uses a legal kind, a legal comparison operator, and a path declared by `ReducerState` or `LedgerRow`. `lastRequests.0` addresses the first row of the canonical latest-request slice. The pure `pass(st)` reads only `ledger`, `completedEventIds`, and `completedTransferIds`.

`referenceCfg` and `antiCfg` intentionally hold configuration constant. The comparison isolates the actual player action replayed from `cp-l3-change-choice`:

- Reference: `SET_PREFIX_BLOCK_CONTENT` on `PB_HISTORY_L3`
- Anti-pattern: `SET_PREFIX_BLOCK_CONTENT` on `PB_SYSTEM_L3`

No hook behavior or later-level prefix-position mechanic creates the difference.

## 6. Pricing walkthrough

All requests use Sonnet: fresh input `$3/M`, cache read `$0.30/M`, 1-hour write `$6/M`, and output `$15/M` (`C1`, `C3`). Every total is produced by `PRICE_REQUEST` without internal rounding.

### `R1_COLD`

```text
write:  34,738 × $6/M    = $0.208428
input:   6,000 × $3/M    = $0.018000
output: 44,000 × $15/M   = $0.660000
total                       $0.886428
```

### `R2_IDENTICAL`

```text
read:    34,738 × $0.30/M = $0.0104214
input:    6,000 × $3/M    = $0.0180000
output:  44,000 × $15/M   = $0.6600000
total                        $0.6884214
```

### `R3_LATE_CHANGE` — reference

```text
read:    21,655 × $0.30/M = $0.0064965
write:   13,083 × $6/M    = $0.0784980
input:    6,000 × $3/M    = $0.0180000
output:  44,000 × $15/M   = $0.6600000
total                        $0.7629945
```

Three-star reference total:

```text
$0.886428 + $0.6884214 + $0.7629945 = $2.3378439
```

### `R3_EARLY_CHANGE` — anti-pattern

```text
write:  34,738 × $6/M    = $0.208428
input:   6,000 × $3/M    = $0.018000
output: 44,000 × $15/M   = $0.660000
total                       $0.886428
```

Anti-pattern total:

```text
$0.886428 + $0.6884214 + $0.886428 = $2.4612774
```

Decisive early-change premium:

```text
$0.886428 − $0.7629945 = $0.1234335
```

The punished third request is `1.1618×` the valid request. Its cached-prefix portion is `2.45×` the valid route’s cached-prefix portion because the early mismatch replaces `21,655` tokens of cheap reads with writes (`C1`, `C3`, `C8`, `C9`).

These are the sole authoritative totals for the level.

## 7. Tape sequence

`TapeSpec.rowSource: "ledger"`.

| Order | Request | Label | Ordered `WireSegment`s |
|---:|---|---|---|
| 1 | `R1_COLD` | `FIRST SEND` | `write 34,738` → `input 6,000` → `output 44,000` |
| 2 | `R2_IDENTICAL` | `SAME BLOCKS` | `read 34,738` → `input 6,000` → `output 44,000` |
| 3a | `R3_LATE_CHANGE` | `HISTORY CHANGED` | `read 21,655` → `write 13,083` → `input 6,000` → `output 44,000` |
| 3b | `R3_EARLY_CHANGE` | `SYSTEM CHANGED` | `write 34,738` → `input 6,000` → `output 44,000` |

Reveal groups:

```ts
[
  {
    id: "l3-cold",
    requestIds: ["R1_COLD"],
    gatedByPredictionId: "l3-cold-result"
  },
  {
    id: "l3-repeat",
    requestIds: ["R2_IDENTICAL"],
    gatedByPredictionId: "l3-repeat-boundary"
  },
  {
    id: "l3-change-late",
    requestIds: ["R3_LATE_CHANGE"],
    gatedByPredictionId: "l3-change-boundary"
  },
  {
    id: "l3-change-early",
    requestIds: ["R3_EARLY_CHANGE"],
    gatedByPredictionId: "l3-change-boundary"
  }
]
```

`ahaRequestId: "R3_LATE_CHANGE"`.

Aha frame:

```text
SYSTEM 2,750      TOOLS 16,295      INSTRUCTIONS 2,610      HISTORY 13,083      CURRENT 6,000
└────────────────────── REREAD 21,655 ──────────────────────┘│CHANGED + WRITTEN││ FRESH │
                                                             ↑ first mismatch
```

`UI_TAPE_RENDERER` uses the canonical output-aware visual-weight model. Row length is proportional to `LedgerRow.usd`; every segment occupies its bucket’s USD share. The violet output segment contributes `outTok × 5 × MODEL_IN[sonnet]` to tape weight (`C1`, `C3`). Hiding introductory output vocabulary cannot remove output from row or segment geometry.

The complete reference/anti-pattern overlay remains inaccessible until `COMPLETE_ATTEMPT`. A frozen failure may show only the local alternative required to prove that the punished actual request is genuinely more expensive. Counterfactual processing cannot dispatch `FREEZE_FAILURE`.

## 8. Prediction prompts

All three prompts use `UI_PREDICTION_PROMPT`. Options have no correctness styling before commitment. Wrong answers reveal evidence but change no score, star, wallet, failure, or gate result.

### `l3-cold-result`

**Question:** “Nothing has been saved yet. What will the first send do with the four front blocks?”

Options:

- `read-front-four` — “Read a saved copy”
- `write-front-four` — “Write them for later reuse”
- `fresh-all-five` — “Treat all five blocks as fresh only”

Correct option: `write-front-four`.

Post-reveal sentence: **“No saved copy existed, so the four cacheable front blocks were written once.”**

### `l3-repeat-boundary`

**Question:** “Nothing in the stack changed. How far will the saved part reach?”

Options:

- `system-only` — “SYSTEM only”
- `through-instructions` — “Through INSTRUCTIONS”
- `through-history` — “Through HISTORY; CURRENT stays fresh”

Correct option: `through-history`.

Post-reveal sentence: **“The four unchanged front blocks were reread; CURRENT was still new work.”**

### `l3-change-boundary`

**Question:** “This one block changed. What will the next request do?”

Options depend on the selected placement but reveal no correctness styling.

For BOOT PATCH:

- `read-later-blocks` — “Reread the later blocks anyway”
- `rewrite-system-only` — “Rewrite SYSTEM only”
- `rewrite-all-cached` — “Rewrite SYSTEM and every cached block after it”

Correct option: `rewrite-all-cached`.

For FOLLOW-UP:

- `read-three-write-history` — “Reread the first three; rewrite HISTORY”
- `rewrite-all-cached` — “Rewrite all four cached blocks”
- `read-all-cached` — “Reread all four cached blocks”

Correct option: `read-three-write-history`.

Post-reveal sentences:

- BOOT PATCH: **“The first mismatch was SYSTEM, so the cached suffix started there.”**
- FOLLOW-UP: **“The first three blocks still matched; only the changed cached tail was rewritten.”**

## 9. Fail-state

**Failure rule:** `l3-early-change`

**Predicate:**

```ts
{
  id: "l3-early-change-predicate",
  kind: "all",
  predicates: [
    {
      id: "l3-system-edit-completed",
      kind: "includes",
      path: "completedTransferIds",
      value: "l3-edit-system"
    },
    {
      id: "l3-early-reveal-completed",
      kind: "event-completed",
      eventId: "reveal-r3-early"
    },
    {
      id: "l3-early-request-is-latest",
      kind: "compare",
      path: "lastRequests.0.requestId",
      op: "eq",
      value: "R3_EARLY_CHANGE",
      observedAfterEventId: "reveal-r3-early"
    },
    {
      id: "l3-early-write-exact",
      kind: "compare",
      path: "lastRequests.0.writeTok",
      op: "eq",
      value: 34738,
      observedAfterEventId: "reveal-r3-early"
    }
  ]
}
```

- **Decisive event:** `R3_EARLY_CHANGE` fully resolves and renders in the player’s actual attempt.
- **Cause code:** `EARLY_PREFIX_MISMATCH`
- **Frozen message:** **“SYSTEM changed first. The entire 34,738-token cached tail had to be written again.”**
- **Highlighted objects:** `PB_SYSTEM_L3`, `PB_TOOLS_L3`, `PB_INSTRUCTIONS_L3`, `PB_HISTORY_L3`, `R3_EARLY_CHANGE`
- **Actual request:** `$0.886428`
- **Valid session-only alternative:** `$0.7629945`
- **Visible premium:** `$0.1234335`
- **Freeze evidence:** `0 reread · 34,738 rewritten · 6,000 fresh`
- **Rewind control:** **“Try the placement again.”**
- **Destination:** `cp-l3-change-choice`

The freeze is economically true: `$0.886428 > $0.7629945`. Equal fresh-input and output buckets remain visible, while the cache-side segments show the causal difference. Prediction correctness is absent from the failure predicate.

The failed request remains visible while frozen. Rewind removes the selected mutation, third request, cache mutation, wallet effect, and completed edit ID while retaining the attempt-local first-choice marker.

`failLesson`:

```ts
{
  bucket: "none",
  cite: "C8/C9",
  line:
    "SYSTEM changed first. The entire 34,738-token cached tail had to be written again."
}
```

## 10. Gate & stars

### Pass gate

Pass only when all are true:

1. `reveal-r2-identical` completed.
2. After that evidence, the player dispatched `SET_PREFIX_BLOCK_CONTENT` on `PB_HISTORY_L3`.
3. `reveal-r3-late` completed.
4. `lastRequests[0]` is `R3_LATE_CHANGE` with exactly `21,655 reread`, `13,083 rewritten`, `6,000 fresh`, and `44,000 output`.
5. `completedTransferIds` contains `l3-edit-history`.

The corresponding pure `pass(st)` finds `R3_LATE_CHANGE` in the declared `ledger: LedgerRow[]` and checks declared reducer arrays. Budget alone cannot pass. Prediction selection, commitment, option identity, and correctness are excluded from every gate predicate.

### Stars

- **1 star — Built and proved:** the behavioral pass gate is satisfied.
- **2 stars — Named the boundary:** `acknowledgedExplanationIds` additionally includes `l3-prefix-rule` after `reveal-r3-late`.
- **3 stars — Changed late:** `completedTransferIds` additionally includes `l3-first-edit-history`, and completed `attemptResult.spentUsd` is at most `$2.3378439`.

A wrong prediction cannot remove a star. The two-star criterion is a distinct post-evidence explanation action. The three-star threshold equals the exact reference path and is paired with first-choice evidence, so rewinding a failed BOOT PATCH cannot earn it.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l3-request-settled` | Cosmetic cold-open animation completes | **“Ready to send.”** |
| `l3-first-written` | `R1_COLD.writeTok === 34738` | **“First send: 34,738 tokens saved for reuse. WRITE · $0.208428.”** |
| `l3-prefix-name` | R2 reveal shows `readTok === 34738` | **“That unchanged run at the front is the prefix.”** |
| `l3-current-fresh` | R2 reveal shows `inputTok === 6000` | **“CURRENT arrived after the saved part: FRESH · 6,000.”** |
| `l3-late-boundary` | `reveal-r3-late` completes | **“Boundary found: 21,655 reread · 13,083 rewritten · 6,000 fresh.”** |
| `l3-early-cause` | Actual-attempt `FREEZE_FAILURE` for `l3-early-change` | **“The first change happened at SYSTEM, so every cached block after it lost reuse.”** |

Vocabulary:

```ts
[
  {
    term: "prefix",
    definition:
      "The unchanged ordered run of blocks at the front of a request.",
    firstNeededEventId: "reveal-r2-identical",
    toastId: "l3-prefix-name"
  },
  {
    term: "fresh",
    definition:
      "New request material outside the reusable cached prefix.",
    firstNeededEventId: "reveal-r2-identical",
    toastId: "l3-current-fresh"
  }
]
```

Pre-reveal copy does not define the boundary rule or use reuse colors. The cosmetic cold-open toast contains no solution vocabulary.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. `UI_PREDICTION_PROMPT` is actionable by `2s` `[ESTIMATE]`.
2. Reducer state seeds the stack exactly as `SYSTEM │ TOOLS │ INSTRUCTIONS │ HISTORY │ CURRENT`.
3. The cold-open may temporarily offset the last two rendered blocks but does not mutate `PREFIX_STACK.blocks`.
4. No `REORDER_PREFIX_BLOCK` action is dispatched anywhere in the level.
5. The cosmetic crossing exposes no hit target, drag handle, keyboard move action, or scoring consequence.
6. `SET_PREFIX_BLOCK_CONTENT` is the only newly introduced player control.
7. `UI_PREFIX_STACK_VISUALIZER.showTokenCounts === false` through cold open and first-prediction commitment.
8. Token counts become visible only after the first `SEND_REQUEST` resolves.
9. Pre-play UI does not state the first-mismatch rule or expose a reuse boundary.
10. `UI_PREFIX_STACK_VISUALIZER.revealBoundary === false` before each relevant prediction commitment.
11. R1, R2, and either R3 branch cannot reveal before their respective prediction commitment.
12. A wrong prediction changes no score, star, wallet, failure, gate, or request resolution.
13. R1 yields exactly one `LedgerRow` and one tape row costing `$0.886428`.
14. R2 yields exactly one `LedgerRow` and one tape row costing `$0.6884214`.
15. R3 late yields exactly one `LedgerRow` and one tape row costing `$0.7629945`.
16. R3 early yields exactly one `LedgerRow` and one tape row costing `$0.886428`.
17. Each tape row corresponds to exactly one priced request and exposes the same non-zero buckets as its `LedgerRow`.
18. Every real request has `usd > 0`.
19. No positive value renders as `$0.0000`.
20. Every authoritative cost equals `PRICE_REQUEST` using `C1` and `C3`.
21. Every visible row and segment width includes the `outTok × 5` contribution from the canonical `UI_TAPE_RENDERER` model.
22. Hover and keyboard focus expose every non-zero bucket equation, including output.
23. R2 refreshes the live `CacheEntry` TTL according to `C12`.
24. The late-change diff labels exactly three blocks reread, one rewritten, and `CURRENT` fresh.
25. The early-change diff labels zero blocks reread, four rewritten, and `CURRENT` fresh.
26. The early branch freezes only after its decisive actual-attempt tape row is completely visible.
27. No counterfactual, reference request, or comparison reveal dispatches `FREEZE_FAILURE`.
28. The frozen frame shows `$0.886428 actual > $0.7629945 valid alternative` and the `$0.1234335` premium.
29. While frozen, economic controls are disabled and `UI_REWIND_CONTROL` remains available.
30. Rewind to `cp-l3-change-choice` restores exactly two ledger rows, wallet `$0.9251506`, `attemptMetrics.spentUsd === 1.5748494`, and the live `34,738-token` entry.
31. Rewind retains the immutable first-choice marker while removing the rewound completed edit ID.
32. The pass gate observes `SET_PREFIX_BLOCK_CONTENT` on `PB_HISTORY_L3` after `reveal-r2-identical`.
33. Gate and star predicates use only declared paths: `lastRequests`, `completedEventIds`, `completedTransferIds`, `acknowledgedExplanationIds`, and `attemptResult.spentUsd`.
34. Every predicate kind and comparison operator belongs to the canonical legal registry; no predicate uses `op: "contains"`.
35. No gate, star, or failure predicate inspects a prediction option or prediction correctness.
36. The fixed-seed reference path passes and totals `$2.3378439`.
37. The fixed-seed early-change path fails the behavioral gate and totals `$2.4612774`.
38. Reference and anti-pattern configurations retain the same static hook; only the chosen `SET_PREFIX_BLOCK_CONTENT` action differs.
39. BOOT PATCH visibly offers future-session persistence, while FOLLOW-UP visibly offers lower current-request cost but expires with the session.
40. The complete post-attempt comparison is inaccessible until `COMPLETE_ATTEMPT`.
41. Static final tape colors, output weight, block states, and totals render without hover.
42. Pointer and keyboard placement controls dispatch equivalent `SET_PREFIX_BLOCK_CONTENT` actions.
43. Prediction options expose no correctness styling before commitment.
44. Screen-reader announcements name block, settled order, state, and—after R1 only—token count without relying on color.
45. Reduced-motion mode skips the cosmetic crossing but presents the same canonical stack, ledger rows, boundary, classifications, and prices.
46. The level is winnable using only documented visible controls.
47. Each authoritative request count, token count, cost, threshold, and result total has one implementable value.
48. `PB_HISTORY_L3` cites the semantically specific `L3_HISTORY_FIXTURE` (`C35`, `[FICTION]`) and never cites `CATALOG_FULL` (`C7`) as history provenance.
49. `title` and `objective` contain none of the terms registered in `concept.solutionVocabulary`.
50. `03-build-the-prefix`, `prefix-reuse`, `write-vs-read`, and `cache-expiry` all resolve in the canonical registries.

## 13. Reference-bar justification

The screen opens with a tactile but cosmetic five-block settle. It creates motion and immediate curiosity without adding a reorder puzzle, mutating reducer state, or pre-answering the cache behavior. The first interaction is prediction; the only new player control arrives later as `SET_PREFIX_BLOCK_CONTENT`.

The first send reveals the previously hidden token counts along with a cold write. The identical resend then supplies causal evidence before the player is asked to place a novel reminder. This preserves the predict-before-reveal rhythm while avoiding a second new control.

BOOT PATCH and FOLLOW-UP are not cosmetic good/bad labels. BOOT PATCH buys cross-session persistence at a higher current-request cost; FOLLOW-UP buys the cheaper current-session request by surrendering that persistence. The ticket’s stated scope makes FOLLOW-UP sufficient without making BOOT PATCH benefit-free.

The successful route exposes the first mismatch through the player’s own third request. The early route freezes only after a visibly more expensive actual ledger row, preserves equal output weight, names the precise cause, and rewinds directly to the transfer choice. Prediction correctness remains non-punitive; demonstrated understanding comes from the post-evidence content edit and optional causal explanation.

**Assumptions:** The `13,083-token` conversation-history value is the distinct `[FICTION]` `L3_HISTORY_FIXTURE` registered as `C35`; it has no skills-catalog provenance. The `$2.50` budget is `[FICTION]`, and cold-open timings are `[ESTIMATE]`.
