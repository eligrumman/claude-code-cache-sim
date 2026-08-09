# Level 3 — The Reminder

## 1. Identity

- **id:** `03-build-the-prefix`
- **title:** The Reminder
- **tier:** `1`
- **objective:** “Handle a reminder now and in one scheduled handoff.”
- **concept.id:** `prefix-reuse`
- **concept.privateDesignerSummary:** Cache reuse follows the longest byte-identical ordered prefix; the first changed block invalidates the cacheable suffix.
- **concept.postRevealRule:** “The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again.”
- **concept.solutionVocabulary:** `prefix`, `reuse`, `rebuild`, `rewrite`, `first mismatch`, `cached suffix`, `change late`
- **conceptScope:** `{ kind: "single", reusedConceptIds: [] }`
- **prerequisiteConceptIds:** `write-vs-read`, `cache-expiry`

The title and objective frame the situation without using registered solution vocabulary. Identity and prerequisites use the canonical `LevelId`, `ConceptId`, and `ConceptScope` registries from `OBJECT_MODEL.md`.

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
- `Clock`
- `Checkpoint`
- `PredictionState`
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
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `just-in-time-toast`
- `counterfactual-after-attempt`

`SET_PREFIX_BLOCK_CONTENT` is the level’s only newly introduced player control. Sending, prediction, explanation, and completion use previously established shared controls.

## 3. Cold-open / narrative

No instruction card and no player-controlled assembly exercise.

| Time | Beat |
|---:|---|
| `0.0s` `[ESTIMATE]` | Five labeled blocks land with temporary presentation offsets that visually read `SYSTEM │ TOOLS │ INSTRUCTIONS │ CURRENT │ HISTORY`. Header: **“Five blocks. One request.”** Token counts, cache colors, prices, and boundaries are hidden. |
| `0.5s` `[ESTIMATE]` | `HISTORY` and `CURRENT` cross into settled display order `SYSTEM │ TOOLS │ INSTRUCTIONS │ HISTORY │ CURRENT`. This is cosmetic only: reducer state was canonical from entry, no hit target is exposed, and no `REORDER_PREFIX_BLOCK` action is dispatched. |
| `1.0s` `[ESTIMATE]` | The settled stack gives one quiet pulse. Copy: **“Nothing has been sent yet.”** |
| `≤2.0s` `[ESTIMATE]` | `UI_PREDICTION_PROMPT` becomes the first interactive surface. |

`firstInteractiveBySec: 2`.

During the animation, `UI_PREFIX_STACK_VISUALIZER` uses `mode: "inspect"`, `showTokenCounts: false`, and `revealBoundary: false`. Screen-reader order remains canonical throughout.

The player later receives this visible work order after the identical resend:

> **REMINDER HANDOFF**  
> Use the reminder in this session. A verification opens in another managed session at minute 50 and needs the same instruction.

The two placements expose a real reducer-visible tradeoff:

- **BOOT PATCH:** changes `SYSTEM`, costs more on the changed request, and is automatically present in the handoff.
- **FOLLOW-UP:** changes `HISTORY`, costs less, and requires an eight-minute reapplication during the handoff.

Both profiles complete before the `60 min` cap. FOLLOW-UP minimizes `attemptResult.spentUsd`; BOOT PATCH minimizes `clockMin`.

## 4. Exact event sequence

### 1. Enter and seed both managed sessions

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

**Objects mutated:** `ReducerState`, two `MAIN_SESSION_CONTEXT` instances, `PREFIX_STACK`, `Wallet`, `Clock`, level-start `Checkpoint`.

**Primary-session values:**

- `PB_SYSTEM_L3`: `2,750 tok` (`SYSTEM_BASE`, `C6`)
- `PB_TOOLS_L3`: `16,295 tok` (`TOOLS_BASE`, `C24`)
- `PB_INSTRUCTIONS_L3`: `2,610 tok` (`CATALOG_RESIDUE`, derived from `C6` and `C7`)
- `PB_HISTORY_L3`: `13,083 tok` (`L3_HISTORY_FIXTURE`, `C35`, fixture `l3-history-tok`)
- `PB_CURRENT_L3`: `6,000 tok` (`WORK_IN`, `C28`, fixture `l3-primary-current-tok`)
- Expected output: `44,000 tok` (`WORK_OUT`, `C28`, fixture `l3-primary-output-tok`)
- Cacheable front: `34,738 tok`
- Whole input side: `40,738 tok`
- Breakpoint after `PB_HISTORY_L3`; `34,738 ≥ 1,024` (`C26`)
- Clock: `0 min`
- Budget: `$2.50` (fixture `l3-budget-usd`)
- Clock cap: `60 min` (fixture `l3-clock-cap-min`)
- Replay seed: `34738` (fixture `l3-replay-seed`, semantically unrelated to `C34`)

The handoff context `l3-handoff` has a distinct `sessionId` but deliberately shares `cacheNamespace: "l3-managed-policy-handoff"` with `l3-main`. This is the scenario’s explicit exception to the default new-session namespace rule. It models a managed policy handoff and does not permit main/subagent sharing.

`L3_HANDOFF_PREFIX_SEED` contains the same four front block sizes and a `100-token` verification `CURRENT` block. Its branch-specific identities are installed only when the handoff begins.

### 2. Play the cosmetic settle and checkpoint the first send

**Event:** Cold-open presentation completes.

No reducer action represents the visual crossing.

```ts
CREATE_CHECKPOINT {
  checkpointId: "cp-l3-first-send",
  reason: "unit-start"
}
```

**Objects mutated:** `Checkpoint`.

**Numbers:** Five blocks, one breakpoint, zero ledger rows, zero wallet change. Token counts remain hidden.

### 3. Predict the cold send

```ts
OPEN_PREDICTION { promptId: "l3-cold-result" }
SELECT_PREDICTION { promptId: "l3-cold-result", optionId }
COMMIT_PREDICTION { promptId: "l3-cold-result" }
```

**Objects mutated:** `PredictionState`.

No request, cache, ledger, wallet, clock, score, gate, or star mutation occurs.

### 4. Send the cold request

**Event:** Player activates **SEND** after commitment.

```ts
SEND_REQUEST { request: R1_COLD }

REVEAL_PREDICTION {
  promptId: "l3-cold-result",
  correctOptionId: "write-front-four"
}
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `lastRequests`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`.

**Resolution:**

- `readTok: 0`
- `writeTok: 34,738`
- `inputTok: 6,000`
- `outTok: 44,000`
- `writeTier: "1h"`
- `cold: true`
- Cost: `$0.886428`
- Wallet: `$2.5000000 → $1.6135720`
- `attemptMetrics.spentUsd: $0.886428`
- Live entry: `34,738 tok`
- Idle TTL: `60 min` (`C1`)

Only after resolution does `showTokenCounts` become `true`. Toast `l3-first-written` fires.

### 5. Predict the identical resend

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

### 6. Reveal the identical resend

```ts
SEND_REQUEST { request: R2_IDENTICAL }

REVEAL_PREDICTION {
  promptId: "l3-repeat-boundary",
  correctOptionId: "through-history"
}
```

**Objects mutated:** `CacheEntry.lastTouchMin`, `CacheEntry.expiresAtMin`, `LedgerRow`, `Wallet`, `lastRequests`, `attemptMetrics`, `PredictionState`, `PREFIX_STACK`, `completedEventIds`.

**Resolution:**

- `readTok: 34,738`
- `writeTok: 0`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.6884214`
- Wallet: `$1.6135720 → $0.9251506`
- `attemptMetrics.spentUsd: $1.5748494`
- Matched blocks: `SYSTEM`, `TOOLS`, `INSTRUCTIONS`, `HISTORY`
- Fresh block: `CURRENT`
- The read refreshes the entry to expire at minute `60` (`C1`, `C12`)

This completes `reveal-r2-identical`. Toasts `l3-prefix-name` and `l3-current-fresh` fire.

### 7. Offer the placement tradeoff

The handoff work order becomes visible. The control presents:

- **BOOT PATCH** — “Put it in global SYSTEM policy. The handoff receives it automatically.”
- **FOLLOW-UP** — “Put it in this session’s HISTORY. Reapply it during the handoff: 8 min.”

The `8 min` reapplication duration is fixture `l3-history-reapply-min`. No cache price or first-mismatch answer is shown.

```ts
BEGIN_TRANSFER { challengeId: "l3-change-one-block" }

CREATE_CHECKPOINT {
  checkpointId: "cp-l3-change-choice",
  reason: "decision"
}
```

**Objects mutated:** `LevelPhase`, `Checkpoint`.

### 8. Apply the placement and predict the changed request

**BOOT PATCH:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_SYSTEM_L3",
  identityHash: "system-v2-reminder",
  tokenCount: 2750
}
```

This action atomically appends:

- `l3-edit-system`
- `l3-first-edit-system` if neither first-choice marker exists

**FOLLOW-UP:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_HISTORY_L3",
  identityHash: "history-v2-reminder",
  tokenCount: 13083
}
```

This action atomically appends:

- `l3-edit-history`
- `l3-first-edit-history` if neither first-choice marker exists

**Objects mutated:** selected `PrefixBlock`, `PREFIX_STACK.firstMismatchBlockId`, `PREFIX_STACK.matchedPrefixTok`, `PREFIX_STACK.invalidatedSuffixTok`, `completedTransferIds`.

**Hidden resolution:**

- BOOT PATCH: matched `0 tok`; rewrite `34,738 tok`
- FOLLOW-UP: matched `21,655 tok`; rewrite `13,083 tok`

Then:

```ts
OPEN_PREDICTION { promptId: "l3-change-boundary" }
SELECT_PREDICTION { promptId: "l3-change-boundary", optionId }
COMMIT_PREDICTION { promptId: "l3-change-boundary" }
```

### 9A. Resolve FOLLOW-UP

**Precondition:** `completedTransferIds` includes `l3-edit-history`.

```ts
SEND_REQUEST { request: R3_LATE_CHANGE }

REVEAL_PREDICTION {
  promptId: "l3-change-boundary",
  correctOptionId: "read-three-write-history"
}
```

**Resolution:**

- `readTok: 21,655`
- `writeTok: 13,083`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.7629945`
- Wallet: `$0.9251506 → $0.1621561`
- `attemptMetrics.spentUsd: $2.3378439`
- `firstMismatchBlockId: "PB_HISTORY_L3"`
- `invalidatedSuffixTok: 13,083`

The reducer completes `reveal-r3-placement`. The visualizer identifies the first mismatch, marks three blocks reread, marks `HISTORY` rewritten, and leaves `CURRENT` fresh. Toast `l3-late-boundary` fires.

### 9B. Resolve BOOT PATCH

**Precondition:** `completedTransferIds` includes `l3-edit-system`.

```ts
SEND_REQUEST { request: R3_EARLY_CHANGE }

REVEAL_PREDICTION {
  promptId: "l3-change-boundary",
  correctOptionId: "rewrite-all-cached"
}
```

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

The reducer completes `reveal-r3-placement`. The visualizer marks `SYSTEM` changed and all four cacheable blocks rewritten. Toast `l3-early-boundary` fires.

No `FREEZE_FAILURE` occurs. BOOT PATCH is locally more expensive but remains a valid completion profile because its persisted instruction removes the handoff reapplication delay.

### 10. Offer the causal explanation

After either R3 branch:

```text
What determined the rewritten portion?

A. The first changed block ended reuse; its cached tail was rewritten.
B. Every unchanged block was reusable regardless of earlier changes.
C. The smallest changed block determined the result.
```

Selecting dispatches `ACK_EXPLANATION` with:

- A: `l3-prefix-rule`
- B: `l3-order-does-not-matter`
- C: `l3-smallest-rewrites`

The answer affects only stars. Prediction and explanation correctness never affect wallet, failure, or pass.

### 11. Advance to the scheduled handoff

```ts
ADVANCE { min: 50 }
```

**Objects mutated:** `clockMin` only.

**Resolution:**

- `clockMin: 0 → 50`
- The R3 cache entry remains live because `50 < 60`
- Handoff opens at fixture `l3-handoff-open-min`

### 12A. Install the persisted BOOT PATCH in the handoff

**Precondition:** `completedTransferIds` includes `l3-edit-system`.

The system initializes the second session from global policy:

```ts
SET_PREFIX_BLOCKS {
  contextId: "l3-handoff",
  blocks: [
    PB_SYSTEM_L3_HANDOFF_SYSTEM_V2,
    PB_TOOLS_L3_HANDOFF,
    PB_INSTRUCTIONS_L3_HANDOFF,
    PB_HISTORY_L3_HANDOFF_HISTORY_V1,
    PB_CURRENT_L3_VERIFY
  ]
}
```

The first four identities exactly match `R3_EARLY_CHANGE`. No player edit or simulated minute is consumed.

### 12B. Reapply FOLLOW-UP in the handoff

**Precondition:** `completedTransferIds` includes `l3-edit-history`.

The second session initially contains the original `HISTORY`. The player uses the same visible control:

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-handoff",
  blockId: "PB_HISTORY_L3_HANDOFF",
  identityHash: "history-v2-reminder",
  tokenCount: 13083
}
```

This action appends `l3-reapplied-history`. The system then dispatches:

```ts
ADVANCE { min: 8 }
```

**Objects mutated:** handoff `PrefixBlock`, handoff `PREFIX_STACK`, `completedTransferIds`, `clockMin`.

**Resolution:**

- `clockMin: 50 → 58`
- The restored front exactly matches `R3_LATE_CHANGE`
- The entry remains live because `58 < 60`

### 13. Predict and send the handoff verification

After the branch-specific setup:

```ts
OPEN_PREDICTION { promptId: "l3-handoff-boundary" }
SELECT_PREDICTION { promptId: "l3-handoff-boundary", optionId }
COMMIT_PREDICTION { promptId: "l3-handoff-boundary" }
```

BOOT PATCH dispatches:

```ts
SEND_REQUEST { request: R4_BOOT_PERSISTED }
```

and atomically appends `l3-persisted-policy-read`.

FOLLOW-UP dispatches:

```ts
SEND_REQUEST { request: R4_HISTORY_REAPPLIED }
```

Both are followed by:

```ts
REVEAL_PREDICTION {
  promptId: "l3-handoff-boundary",
  correctOptionId: "read-front-four-current-fresh"
}
```

**Resolution for either request:**

- `readTok: 34,738`
- `writeTok: 0`
- `inputTok: 100`
- `outTok: 100`
- Cost: `$0.0122214`
- BOOT PATCH wallet: `$0.0387226 → $0.0265012`
- FOLLOW-UP wallet: `$0.1621561 → $0.1499347`
- BOOT PATCH total spend: `$2.4734988`
- FOLLOW-UP total spend: `$2.3500653`

The reducer completes `reveal-r4-policy-check`. The request itself supplies the in-attempt evidence that the BOOT PATCH was present in the later session.

### 14. Complete the attempt

```ts
COMPLETE_ATTEMPT
```

**Objects mutated:** `attemptResult`, `LevelPhase`.

Completion snapshots the selected profile:

| Profile | Request count | `attemptResult.spentUsd` | Final `clockMin` | Benefit |
|---|---:|---:|---:|---|
| FOLLOW-UP | `4` | `$2.3500653` | `58` | Lowest spend |
| BOOT PATCH | `4` | `$2.4734988` | `50` | Fastest handoff |

Both pass and remain under the `$2.50` budget and `60 min` cap.

## 5. Level data

```ts
const L3_FIXTURES: ScenarioFixtureDef[] = [
  {
    id: "l3-replay-seed",
    label: "Level 3 deterministic replay seed",
    semanticRole:
      "PRNG seed only; its numerical resemblance to a token constant has no provenance meaning",
    value: 34738,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l3-budget-usd",
    label: "Level 3 attempt budget",
    semanticRole: "Maximum fake API spend available to either completion profile",
    value: 2.50,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l3-clock-cap-min",
    label: "Level 3 handoff clock cap",
    semanticRole: "Latest simulated minute at which the handoff may complete",
    value: 60,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l3-history-tok",
    label: "Primary conversation-history block",
    semanticRole:
      "Conversation history used to expose a late cache mismatch; semantically the C35 fixture",
    value: 13083,
    unit: "tok",
    tag: "[FICTION]"
  },
  {
    id: "l3-primary-current-tok",
    label: "Primary request current payload",
    semanticRole: "Fresh input on each of the first three requests; sourced from C28",
    value: 6000,
    unit: "tok",
    tag: "[FICTION]"
  },
  {
    id: "l3-primary-output-tok",
    label: "Primary request output",
    semanticRole: "Generated output on each of the first three requests; sourced from C28",
    value: 44000,
    unit: "tok",
    tag: "[FICTION]"
  },
  {
    id: "l3-handoff-current-tok",
    label: "Handoff verification payload",
    semanticRole: "Fresh input for the small later-session verification request",
    value: 100,
    unit: "tok",
    tag: "[FICTION]"
  },
  {
    id: "l3-handoff-output-tok",
    label: "Handoff verification output",
    semanticRole: "Generated acknowledgement for the later-session verification request",
    value: 100,
    unit: "tok",
    tag: "[FICTION]"
  },
  {
    id: "l3-handoff-open-min",
    label: "Scheduled handoff opening",
    semanticRole: "Simulation minute at which the second managed session becomes actionable",
    value: 50,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l3-history-reapply-min",
    label: "Session-history reapplication time",
    semanticRole:
      "Simulated delay required to restore a session-only reminder in the handoff",
    value: 8,
    unit: "min",
    tag: "[FICTION]"
  }
];

const L3_MAIN_CONTEXT_SEED: ContextSeed = {
  kind: "main",
  id: "l3-main",
  sessionId: "l3-session-a",
  cacheNamespace: "l3-managed-policy-handoff",
  initialPrefixStackId: "l3-primary-prefix"
};

const L3_HANDOFF_CONTEXT_SEED: ContextSeed = {
  kind: "main",
  id: "l3-handoff",
  sessionId: "l3-session-b",
  cacheNamespace: "l3-managed-policy-handoff",
  initialPrefixStackId: "l3-handoff-prefix"
};

const L3: LevelDef = {
  id: "03-build-the-prefix",
  tier: 1,
  title: "The Reminder",
  objective:
    "Handle a reminder now and in one scheduled handoff.",

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
    contexts: [
      L3_MAIN_CONTEXT_SEED,
      L3_HANDOFF_CONTEXT_SEED
    ],
    prefixStacks: [
      L3_PRIMARY_PREFIX_SEED,
      L3_HANDOFF_PREFIX_SEED
    ],
    fixtures: L3_FIXTURES,
    estimates: [
      {
        label: "coldOpenStartSec",
        value: 0,
        tag: "[ESTIMATE]"
      },
      {
        label: "cosmeticCrossSec",
        value: 0.5,
        tag: "[ESTIMATE]"
      },
      {
        label: "settledPulseSec",
        value: 1,
        tag: "[ESTIMATE]"
      },
      {
        label: "firstInteractiveBySec",
        value: 2,
        tag: "[ESTIMATE]"
      }
    ]
  },

  coldOpen: L3_COLD_OPEN,
  sequence: L3_SEQUENCE,

  predictions: [
    L3_PRED_COLD,
    L3_PRED_REPEAT,
    L3_PRED_CHANGE,
    L3_PRED_HANDOFF
  ],

  toasts: L3_TOASTS,

  interactionPatterns: [
    "predict-before-reveal",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "none",
    cite: "C8/C9",
    line:
      "Both placements are valid: one spends less, while the other carries the instruction into the handoff without delay."
  },

  failureRules: [],

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
      resumeLabel: "Return to the placement choice."
    }
  ],

  gate: {
    predicateId: "l3-completed-placement-handoff",

    evidenceRevealEventIds: [
      "reveal-r2-identical",
      "reveal-r3-placement",
      "reveal-r4-policy-check"
    ],

    postEvidenceActionRequirements: [
      {
        id: "l3-placement-after-repeat-evidence",
        kind: "any",
        predicates: [
          {
            id: "l3-system-edit-after-repeat",
            kind: "action-observed",
            actionType: "SET_PREFIX_BLOCK_CONTENT",
            afterEventId: "reveal-r2-identical",
            match: {
              contextId: "l3-main",
              blockId: "PB_SYSTEM_L3",
              identityHash: "system-v2-reminder",
              tokenCount: 2750
            }
          },
          {
            id: "l3-history-edit-after-repeat",
            kind: "action-observed",
            actionType: "SET_PREFIX_BLOCK_CONTENT",
            afterEventId: "reveal-r2-identical",
            match: {
              contextId: "l3-main",
              blockId: "PB_HISTORY_L3",
              identityHash: "history-v2-reminder",
              tokenCount: 13083
            }
          }
        ]
      }
    ],

    behavioralRequirements: [
      {
        id: "l3-r3-revealed",
        kind: "event-completed",
        eventId: "reveal-r3-placement"
      },
      {
        id: "l3-r4-revealed",
        kind: "event-completed",
        eventId: "reveal-r4-policy-check"
      },
      {
        id: "l3-consistent-completion-profile",
        kind: "any",
        predicates: [
          {
            id: "l3-boot-profile",
            kind: "all",
            predicates: [
              {
                id: "l3-system-edit-recorded",
                kind: "includes",
                path: "completedTransferIds",
                value: "l3-edit-system"
              },
              {
                id: "l3-persisted-read-recorded",
                kind: "includes",
                path: "completedTransferIds",
                value: "l3-persisted-policy-read"
              },
              {
                id: "l3-boot-r3-request",
                kind: "compare",
                path: "ledger.2.requestId",
                op: "eq",
                value: "R3_EARLY_CHANGE"
              },
              {
                id: "l3-boot-r3-write",
                kind: "compare",
                path: "ledger.2.writeTok",
                op: "eq",
                value: 34738
              }
            ]
          },
          {
            id: "l3-follow-profile",
            kind: "all",
            predicates: [
              {
                id: "l3-history-edit-recorded",
                kind: "includes",
                path: "completedTransferIds",
                value: "l3-edit-history"
              },
              {
                id: "l3-history-reapply-recorded",
                kind: "includes",
                path: "completedTransferIds",
                value: "l3-reapplied-history"
              },
              {
                id: "l3-follow-r3-request",
                kind: "compare",
                path: "ledger.2.requestId",
                op: "eq",
                value: "R3_LATE_CHANGE"
              },
              {
                id: "l3-follow-r3-read",
                kind: "compare",
                path: "ledger.2.readTok",
                op: "eq",
                value: 21655
              },
              {
                id: "l3-follow-r3-write",
                kind: "compare",
                path: "ledger.2.writeTok",
                op: "eq",
                value: 13083
              }
            ]
          }
        ]
      },
      {
        id: "l3-r4-request-id",
        kind: "any",
        predicates: [
          {
            id: "l3-r4-boot-id",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "R4_BOOT_PERSISTED",
            observedAfterEventId: "reveal-r4-policy-check"
          },
          {
            id: "l3-r4-follow-id",
            kind: "compare",
            path: "lastRequests.0.requestId",
            op: "eq",
            value: "R4_HISTORY_REAPPLIED",
            observedAfterEventId: "reveal-r4-policy-check"
          }
        ]
      },
      {
        id: "l3-r4-read-exact",
        kind: "compare",
        path: "lastRequests.0.readTok",
        op: "eq",
        value: 34738,
        observedAfterEventId: "reveal-r4-policy-check"
      },
      {
        id: "l3-r4-input-exact",
        kind: "compare",
        path: "lastRequests.0.inputTok",
        op: "eq",
        value: 100,
        observedAfterEventId: "reveal-r4-policy-check"
      },
      {
        id: "l3-r4-output-exact",
        kind: "compare",
        path: "lastRequests.0.outTok",
        op: "eq",
        value: 100,
        observedAfterEventId: "reveal-r4-policy-check"
      }
    ],

    transferRequirement: {
      id: "l3-handoff-benefit-observed",
      kind: "any",
      predicates: [
        {
          id: "l3-boot-benefit",
          kind: "includes",
          path: "completedTransferIds",
          value: "l3-persisted-policy-read"
        },
        {
          id: "l3-follow-cost",
          kind: "includes",
          path: "completedTransferIds",
          value: "l3-reapplied-history"
        }
      ]
    }
  },

  pass(st: ReducerState): GateResult {
    const r3Boot = st.ledger.find(
      (row) => row.requestId === "R3_EARLY_CHANGE"
    );
    const r3Follow = st.ledger.find(
      (row) => row.requestId === "R3_LATE_CHANGE"
    );
    const r4 = st.ledger.find(
      (row) =>
        row.requestId === "R4_BOOT_PERSISTED" ||
        row.requestId === "R4_HISTORY_REAPPLIED"
    );

    const bootProfile =
      st.completedTransferIds.includes("l3-edit-system") &&
      st.completedTransferIds.includes("l3-persisted-policy-read") &&
      r3Boot !== undefined &&
      r3Boot.readTok === 0 &&
      r3Boot.writeTok === 34738 &&
      r3Boot.inputTok === 6000 &&
      r3Boot.outTok === 44000 &&
      r4?.requestId === "R4_BOOT_PERSISTED";

    const followProfile =
      st.completedTransferIds.includes("l3-edit-history") &&
      st.completedTransferIds.includes("l3-reapplied-history") &&
      r3Follow !== undefined &&
      r3Follow.readTok === 21655 &&
      r3Follow.writeTok === 13083 &&
      r3Follow.inputTok === 6000 &&
      r3Follow.outTok === 44000 &&
      r4?.requestId === "R4_HISTORY_REAPPLIED";

    const handoffExact =
      r4 !== undefined &&
      r4.readTok === 34738 &&
      r4.writeTok === 0 &&
      r4.inputTok === 100 &&
      r4.outTok === 100;

    const passed =
      st.completedEventIds.includes("reveal-r2-identical") &&
      st.completedEventIds.includes("reveal-r3-placement") &&
      st.completedEventIds.includes("reveal-r4-policy-check") &&
      handoffExact &&
      (bootProfile || followProfile);

    return {
      pass: passed,
      reason: passed
        ? "The selected placement produced its request boundary and completed the later-session handoff."
        : "Complete one consistent placement profile and its handoff verification.",
      evidence: [
        ...(st.completedEventIds.includes("reveal-r2-identical")
          ? ["reveal-r2-identical"]
          : []),
        ...(r3Boot !== undefined
          ? ["R3_EARLY_CHANGE"]
          : []),
        ...(r3Follow !== undefined
          ? ["R3_LATE_CHANGE"]
          : []),
        ...(r4 !== undefined
          ? [r4.requestId]
          : [])
      ]
    };
  },

  star2: {
    label: "Named the boundary",
    predicate: {
      id: "l3-explained-after-r3",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l3-prefix-rule",
      observedAfterEventId: "reveal-r3-placement"
    },
    reason:
      "Selected the first-mismatch explanation after seeing the chosen placement resolve."
  },

  star3: {
    label: "Honored the priority",
    predicate: {
      id: "l3-efficient-valid-profile",
      kind: "any",
      predicates: [
        {
          id: "l3-lean-session-profile",
          kind: "all",
          predicates: [
            {
              id: "l3-lean-explanation",
              kind: "includes",
              path: "acknowledgedExplanationIds",
              value: "l3-prefix-rule"
            },
            {
              id: "l3-history-first-choice",
              kind: "includes",
              path: "completedTransferIds",
              value: "l3-first-edit-history"
            },
            {
              id: "l3-history-reapplied",
              kind: "includes",
              path: "completedTransferIds",
              value: "l3-reapplied-history"
            },
            {
              id: "l3-lean-spend-threshold",
              kind: "compare",
              path: "attemptMetrics.spentUsd",
              op: "lte",
              value: 2.3500653
            },
            {
              id: "l3-lean-deadline",
              kind: "compare",
              path: "clockMin",
              op: "lte",
              value: 58
            }
          ]
        },
        {
          id: "l3-fast-persistent-profile",
          kind: "all",
          predicates: [
            {
              id: "l3-fast-explanation",
              kind: "includes",
              path: "acknowledgedExplanationIds",
              value: "l3-prefix-rule"
            },
            {
              id: "l3-system-first-choice",
              kind: "includes",
              path: "completedTransferIds",
              value: "l3-first-edit-system"
            },
            {
              id: "l3-persisted-policy-observed",
              kind: "includes",
              path: "completedTransferIds",
              value: "l3-persisted-policy-read"
            },
            {
              id: "l3-persistent-spend-threshold",
              kind: "compare",
              path: "attemptMetrics.spentUsd",
              op: "lte",
              value: 2.4734988
            },
            {
              id: "l3-fast-deadline",
              kind: "compare",
              path: "clockMin",
              op: "lte",
              value: 50
            }
          ]
        }
      ]
    },
    reason:
      "Completed either the minimum-spend FOLLOW-UP profile or the minimum-time BOOT PATCH profile on the first placement."
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
      id: "l3-placement-tradeoff",
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
        "What changed when the same reminder moved between SYSTEM and HISTORY?",
      revealCopy:
        "FOLLOW-UP spent $0.1234335 less; BOOT PATCH completed the handoff 8 minutes earlier."
    }
  ],

  tape: L3_TAPE,
  result: L3_RESULT,
  vocabulary: L3_VOCABULARY,
  qa: L3_QA
};
```

`referenceCfg` and `antiCfg` hold configuration constant. The post-attempt comparison replays only the alternate `SET_PREFIX_BLOCK_CONTENT` action and its authored handoff consequence. Neither configuration is treated as a failure route.

All gameplay fiction resides in `scenarioData.fixtures`. `scenarioData.estimates` contains presentation timing only.

## 6. Pricing walkthrough

All requests use Sonnet: fresh input `$3/M`, cache read `$0.30/M`, 1-hour write `$6/M`, and output `$15/M` (`C1`, `C3`). `PRICE_REQUEST` stores unrounded totals.

### `R1_COLD`

```text
write:  34,738 × $6/M     = $0.2084280
input:   6,000 × $3/M     = $0.0180000
output: 44,000 × $15/M    = $0.6600000
total                       $0.8864280
```

### `R2_IDENTICAL`

```text
read:    34,738 × $0.30/M = $0.0104214
input:    6,000 × $3/M    = $0.0180000
output:  44,000 × $15/M   = $0.6600000
total                        $0.6884214
```

### `R3_LATE_CHANGE` — FOLLOW-UP

```text
read:    21,655 × $0.30/M = $0.0064965
write:   13,083 × $6/M    = $0.0784980
input:    6,000 × $3/M    = $0.0180000
output:  44,000 × $15/M   = $0.6600000
total                        $0.7629945
```

### `R3_EARLY_CHANGE` — BOOT PATCH

```text
write:  34,738 × $6/M     = $0.2084280
input:   6,000 × $3/M     = $0.0180000
output: 44,000 × $15/M    = $0.6600000
total                       $0.8864280
```

Current-session placement delta:

```text
$0.8864280 − $0.7629945 = $0.1234335
```

### `R4_BOOT_PERSISTED` or `R4_HISTORY_REAPPLIED`

The front is byte-identical to the selected branch’s R3 entry and remains live at minute `50` or `58`.

```text
read:   34,738 × $0.30/M = $0.0104214
input:     100 × $3/M    = $0.0003000
output:    100 × $15/M   = $0.0015000
total                       $0.0122214
```

### Three-star reference profile — FOLLOW-UP

```text
$0.8864280
+ $0.6884214
+ $0.7629945
+ $0.0122214
= $2.3500653
```

Final wallet:

```text
$2.5000000 − $2.3500653 = $0.1499347
```

Final clock: `58 min`.

### Alternate three-star profile — BOOT PATCH

```text
$0.8864280
+ $0.6884214
+ $0.8864280
+ $0.0122214
= $2.4734988
```

Final wallet:

```text
$2.5000000 − $2.4734988 = $0.0265012
```

Final clock: `50 min`.

There is no punitive anti-pattern total. The alternate profile is intentionally more expensive but completes the scheduled handoff eight minutes earlier. These are the sole authoritative result totals.

## 7. Tape sequence

`TapeSpec.rowSource: "ledger"`.

| Order | Request | Label | Ordered `WireSegment`s |
|---:|---|---|---|
| 1 | `R1_COLD` | `FIRST SEND` | `write 34,738` → `input 6,000` → `output 44,000` |
| 2 | `R2_IDENTICAL` | `SAME BLOCKS` | `read 34,738` → `input 6,000` → `output 44,000` |
| 3a | `R3_LATE_CHANGE` | `HISTORY CHANGED` | `read 21,655` → `write 13,083` → `input 6,000` → `output 44,000` |
| 3b | `R3_EARLY_CHANGE` | `SYSTEM CHANGED` | `write 34,738` → `input 6,000` → `output 44,000` |
| 4a | `R4_HISTORY_REAPPLIED` | `HANDOFF · REAPPLIED` | `read 34,738` → `input 100` → `output 100` |
| 4b | `R4_BOOT_PERSISTED` | `HANDOFF · ALREADY THERE` | `read 34,738` → `input 100` → `output 100` |

Exactly one row from each branch pair appears in an attempt.

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
  },
  {
    id: "l3-handoff-history",
    requestIds: ["R4_HISTORY_REAPPLIED"],
    gatedByPredictionId: "l3-handoff-boundary"
  },
  {
    id: "l3-handoff-system",
    requestIds: ["R4_BOOT_PERSISTED"],
    gatedByPredictionId: "l3-handoff-boundary"
  }
]
```

`ahaRequestId` is the actual branch’s R3 request.

FOLLOW-UP aha frame:

```text
SYSTEM 2,750   TOOLS 16,295   INSTRUCTIONS 2,610   HISTORY 13,083   CURRENT 6,000
└────────────────── REREAD 21,655 ─────────────────┘│CHANGED+WRITE││ FRESH │
                                                     ↑ first mismatch
```

BOOT PATCH aha frame:

```text
SYSTEM 2,750   TOOLS 16,295   INSTRUCTIONS 2,610   HISTORY 13,083   CURRENT 6,000
│CHANGED+WRITE││────────────── AFTER CHANGE · WRITTEN 31,988 ──────────────││ FRESH │
↑ first mismatch
```

`UI_TAPE_RENDERER` uses authoritative USD weight, including output. The complete spend/time comparison remains inaccessible until `COMPLETE_ATTEMPT`.

## 8. Prediction prompts

Wrong answers change no score, star, wallet, failure, gate, request resolution, or clock.

### `l3-cold-result`

**Question:** “Nothing has been saved yet. What will the first send do with the four front blocks?”

- `read-front-four` — “Read a saved copy”
- `write-front-four` — “Write them for later”
- `fresh-all-five` — “Treat all five as fresh only”

Correct: `write-front-four`.

Post-reveal: **“No saved copy existed, so the four cacheable front blocks were written once.”**

### `l3-repeat-boundary`

**Question:** “Nothing in the stack changed. How far will the saved part reach?”

- `system-only` — “SYSTEM only”
- `through-instructions` — “Through INSTRUCTIONS”
- `through-history` — “Through HISTORY; CURRENT stays fresh”

Correct: `through-history`.

Post-reveal: **“The four unchanged front blocks were reread; CURRENT was still new work.”**

### `l3-change-boundary`

**Question:** “This one block changed. What will the next request do?”

For BOOT PATCH:

- `read-later-blocks` — “Reread the later blocks anyway”
- `rewrite-system-only` — “Rewrite SYSTEM only”
- `rewrite-all-cached` — “Rewrite SYSTEM and every cached block after it”

Correct: `rewrite-all-cached`.

For FOLLOW-UP:

- `read-three-write-history` — “Reread the first three; rewrite HISTORY”
- `rewrite-all-cached` — “Rewrite all four cached blocks”
- `read-all-cached` — “Reread all four cached blocks”

Correct: `read-three-write-history`.

Post-reveal:

- BOOT PATCH: **“The first mismatch was SYSTEM, so the cached suffix started there.”**
- FOLLOW-UP: **“The first three blocks still matched; only the changed cached tail was rewritten.”**

### `l3-handoff-boundary`

**Question:** “The saved entry is still live. After this branch’s reminder setup, what will verification do?”

- `read-front-four-current-fresh` — “Reread the four front blocks; keep CURRENT fresh”
- `rewrite-reminder-block` — “Rewrite the reminder block”
- `cold-handoff` — “Start cold because the session ID changed”

Correct: `read-front-four-current-fresh`.

Post-reveal:

- BOOT PATCH: **“The later session received the global policy automatically and reread its unchanged front.”**
- FOLLOW-UP: **“Reapplying the exact HISTORY content restored the matching front before verification.”**

## 9. Fail-state

`failureRules: []`.

No punitive freeze is authored for this level:

- BOOT PATCH is more expensive on R3 but buys an eight-minute handoff advantage.
- FOLLOW-UP is cheaper but consumes that eight-minute reapplication.
- Both requests are economically valid and both branches complete.
- Therefore `R3_EARLY_CHANGE` must not dispatch `FREEZE_FAILURE`, even though its local request costs more.
- A FOLLOW-UP player cannot send R4 before reapplication; the unmet precondition disables **VERIFY** and exposes the required `SET_PREFIX_BLOCK_CONTENT` control. No request, wallet mutation, or fabricated failure occurs.
- No `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, post-attempt comparison, or `COMPLETE_ATTEMPT` event can freeze the level.

`cp-l3-change-choice` remains a deterministic replay boundary for retry and QA, not a punitive rewind destination.

## 10. Gate & stars

### Pass gate

Pass only when:

1. `reveal-r2-identical`, `reveal-r3-placement`, and `reveal-r4-policy-check` completed.
2. The player made a post-evidence `SET_PREFIX_BLOCK_CONTENT` choice on `PB_SYSTEM_L3` or `PB_HISTORY_L3`.
3. The R3 ledger row matches that recorded placement.
4. The handoff consequence matches the same branch:
   - BOOT PATCH records `l3-persisted-policy-read`; or
   - FOLLOW-UP records `l3-reapplied-history`.
5. The actual R4 row rereads `34,738`, writes `0`, receives `100` fresh input, and produces `100` output.

The pure `pass(st)` uses only `ledger`, `completedEventIds`, and `completedTransferIds`. It searches `ReducerState.ledger` as an array and never assumes object-keyed units or ledger rows.

### Stars

- **1 star — Completed the handoff:** behavioral pass gate satisfied.
- **2 stars — Named the boundary:** `acknowledgedExplanationIds` includes `l3-prefix-rule` after `reveal-r3-placement`.
- **3 stars — Honored the priority:** either:
  - FOLLOW-UP was the first placement, completed at or before minute `58`, and spent at most `$2.3500653`; or
  - BOOT PATCH was the first placement, completed at or before minute `50`, and spent at most `$2.4734988`.

Both three-star branches also require `l3-prefix-rule`. Prediction correctness is excluded from every predicate.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l3-request-settled` | Cosmetic cold-open animation completes | **“Ready to send.”** |
| `l3-first-written` | `R1_COLD.writeTok === 34738` | **“First send: 34,738 tokens saved for later. WRITE · $0.208428.”** |
| `l3-prefix-name` | R2 reveal shows `readTok === 34738` | **“That unchanged run at the front is the prefix.”** |
| `l3-current-fresh` | R2 reveal shows `inputTok === 6000` | **“CURRENT arrived after the saved part: FRESH · 6,000.”** |
| `l3-late-boundary` | FOLLOW-UP completes `reveal-r3-placement` | **“Boundary found: 21,655 reread · 13,083 rewritten.”** |
| `l3-early-boundary` | BOOT PATCH completes `reveal-r3-placement` | **“SYSTEM changed first: all 34,738 cached tokens were rewritten.”** |
| `l3-handoff-reapply` | `l3-reapplied-history` appended | **“Reminder restored · 8 simulated minutes.”** |
| `l3-handoff-persisted` | `l3-persisted-policy-read` appended | **“The handoff already had the global reminder.”** |

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

No pre-reveal copy states the first-mismatch rule.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. `UI_PREDICTION_PROMPT` is actionable by `2s` `[ESTIMATE]`.
2. Reducer state seeds the primary stack as `SYSTEM │ TOOLS │ INSTRUCTIONS │ HISTORY │ CURRENT`.
3. Cosmetic crossing never mutates `PREFIX_STACK.blocks`.
4. No `REORDER_PREFIX_BLOCK` action is dispatched.
5. `SET_PREFIX_BLOCK_CONTENT` is the only newly introduced player control.
6. Token counts remain hidden through the first prediction commitment.
7. R1, R2, R3, and R4 cannot reveal before their respective prediction commitments.
8. Wrong predictions affect no economic or scoring state.
9. R1 produces one ledger/tape row costing `$0.886428`.
10. R2 produces one ledger/tape row costing `$0.6884214`.
11. FOLLOW-UP R3 produces one ledger/tape row costing `$0.7629945`.
12. BOOT PATCH R3 produces one ledger/tape row costing `$0.886428`.
13. Either R4 produces one ledger/tape row costing `$0.0122214`.
14. Every real request has `usd > 0`.
15. No positive amount renders as `$0.0000`.
16. Every authoritative cost equals `PRICE_REQUEST` using `C1` and `C3`.
17. Every non-zero output bucket contributes to tape geometry.
18. R2 refreshes the live entry according to `C12`.
19. FOLLOW-UP R3 shows `21,655` reread and `13,083` rewritten.
20. BOOT PATCH R3 shows `0` reread and `34,738` rewritten.
21. BOOT PATCH does not freeze after R3.
22. FOLLOW-UP remains completable after R3.
23. At minute `50`, the BOOT PATCH handoff contains `system-v2-reminder` without a player edit.
24. BOOT PATCH R4 appends `l3-persisted-policy-read`.
25. FOLLOW-UP requires an actual `SET_PREFIX_BLOCK_CONTENT` on handoff `HISTORY`.
26. FOLLOW-UP reapplication appends `l3-reapplied-history` and advances `clockMin` by exactly `8`.
27. FOLLOW-UP R4 resolves at minute `58`, before the minute-`60` expiry boundary.
28. BOOT PATCH R4 resolves at minute `50`.
29. Both R4 rows read `34,738`, write `0`, input `100`, and output `100`.
30. BOOT PATCH completes with four ledger rows, `$2.4734988` spend, `$0.0265012` wallet, and `clockMin === 50`.
31. FOLLOW-UP completes with four ledger rows, `$2.3500653` spend, `$0.1499347` wallet, and `clockMin === 58`.
32. Both profiles satisfy `pass(st)`.
33. Each profile can earn three stars through its own threshold branch.
34. The gate’s placement decision is recorded by the corresponding authored `SET_PREFIX_BLOCK_CONTENT` event.
35. `pass(st)` performs array-safe `ledger.find(...)` lookups.
36. All predicate paths resolve to declared `ReducerState` or `LedgerRow` fields.
37. Every predicate kind and comparison operator belongs to the canonical registry.
38. No predicate uses `op: "contains"`.
39. No gate or star inspects prediction option identity or correctness.
40. `failureRules` is empty and no event dispatches `FREEZE_FAILURE`.
41. No counterfactual or result event mutates actual-attempt ledger, wallet, clock, or failure state.
42. The complete spend/time comparison is inaccessible until `COMPLETE_ATTEMPT`.
43. Pointer and keyboard placement controls dispatch equivalent actions.
44. Screen-reader announcements expose block, settled order, state, and revealed token count without relying on color.
45. Reduced-motion mode skips the cosmetic crossing but preserves canonical state and evidence.
46. The level is winnable using only documented visible controls.
47. `scenarioData.estimates` contains presentation timing only.
48. Every gameplay fiction value appears in `scenarioData.fixtures` with `id`, `semanticRole`, `unit`, and `[FICTION]`.
49. `l3-replay-seed` explicitly has no provenance relationship to `C34`.
50. `PB_HISTORY_L3` cites the semantically correct `L3_HISTORY_FIXTURE` (`C35`), never `CATALOG_FULL`.
51. `title` and `objective` contain none of `concept.solutionVocabulary`.
52. `03-build-the-prefix`, `prefix-reuse`, `write-vs-read`, and `cache-expiry` resolve in canonical registries.

## 13. Reference-bar justification

The cosmetic five-block settle creates an immediate tactile hook without introducing a reorder puzzle or exposing the answer. The first send reveals token counts only after prediction; the identical resend then establishes the reusable front through direct evidence.

The placement choice now has genuine counter-pressure inside the modeled attempt. FOLLOW-UP preserves more of the existing front and yields the lower spend. BOOT PATCH rewrites more immediately, but the later managed session receives the policy automatically and finishes eight minutes earlier. Both choices are completable, reducer-visible, budget-valid, deadline-valid, and eligible for three stars through distinct efficient profiles.

The second-session verification is a real priced request, not an epilogue badge or counterfactual claim. It reads the branch’s persisted or explicitly restored instruction before `COMPLETE_ATTEMPT`. The post-attempt overlay merely compares the already-realized spend/time profiles.

No punitive failure is attached to either placement because doing so would erase the live tradeoff. The level instead gates on a consistent post-evidence placement, its exact R3 cache behavior, and the later request that proves the handoff consequence.

**Assumptions and tradeoffs:** The scenario explicitly shares one managed cache namespace across two main-session IDs, as permitted by the canonical context rule. BOOT PATCH’s benefit is time, not lower spend; FOLLOW-UP’s benefit is lower spend, not faster completion. The replay seed, budget, clock cap, verification buckets, handoff minute, and reapplication duration are named `[FICTION]` fixtures. Cold-open values are presentation-only `[ESTIMATE]` entries.
