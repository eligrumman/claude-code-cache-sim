# Level 3 — Build the Prefix

## 1. Identity

- **id:** `L3`
- **title:** Build the Prefix
- **tier:** `1`
- **objective:** “Assemble the request, then make one safe change without rebuilding more than necessary.”
- **concept.id:** `prefix-boundary`
- **concept.privateDesignerSummary:** Cache reuse follows the longest byte-identical ordered prefix; the first changed block invalidates the cacheable suffix.
- **concept.postRevealRule:** “The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again.”
- **prerequisiteConceptIds:** `cache-write-read`, `cache-expiry`

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
- `LedgerRow`
- `Wallet`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_TAPE_RENDERER`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

No instruction card.

| Time | Beat |
|---:|---|
| `0.0s` `[ESTIMATE]` | Five loose blocks land beside an empty `UI_PREFIX_STACK_VISUALIZER`: `SYSTEM`, `TOOLS`, `INSTRUCTIONS`, `HISTORY`, `CURRENT`. Header: **“Build Claude’s request.”** |
| `0.5s` `[ESTIMATE]` | Empty slots pulse in canonical order. Copy: **“Put every block on the wire.”** No reuse boundary or answer is shown. |
| `1.0s` `[ESTIMATE]` | Pointer and keyboard focus enter the block tray; assembly is immediately interactive. |
| `≤2.0s` `[ESTIMATE]` | The player places the first block. |
| After all five blocks are placed | **SEND** activates. Subcopy: **“Same session. Cache warm.”** |

`firstInteractiveBySec: 1`.

## 4. Exact event sequence

### 1. Enter and seed the puzzle

**Event:** Screen opens.

**Action:** `ENTER_LEVEL { levelId: "L3" }`, then scenario initialization dispatches:

```ts
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

**Numbers:**

- `PB_SYSTEM_L3`: `2,750 tok` (`SYSTEM_BASE`, `C6`)
- `PB_TOOLS_L3`: `16,295 tok` (`TOOLS_BASE`, `C24`)
- `PB_INSTRUCTIONS_L3`: `2,610 tok` (`MESSAGES_BASE − CATALOG_FULL`, derived from `C6`, `C7`)
- `PB_HISTORY_L3`: `13,083 tok` (`CATALOG_FULL`, reused strictly as a measured token-count fixture, `C7`)
- `PB_CURRENT_L3`: `6,000 tok` (`WORK_IN`, `C28`, `[FICTION]`)
- Cacheable prefix through `PB_HISTORY_L3`: `34,738 tok` (`MAIN_PREFIX_HEY`, `C6`)
- Whole request input side: `40,738 tok`
- Expected output: `44,000 tok` (`WORK_OUT`, `C28`, `[FICTION]`)
- Active breakpoint: after `PB_HISTORY_L3`; `34,738 ≥ 1,024` (`C26`)
- Clock: `0 min`
- Wallet: `$2.50` `[FICTION]`

The visualizer begins in `mode: "assemble"`, `showTokenCounts: true`, `revealBoundary: false`.

### 2. Assemble the ordered stack

**Event:** Player places each visible block into its matching slot using drag/drop or keyboard controls.

**Action:** One `REORDER_PREFIX_BLOCK` per move.

**Objects mutated:** `PREFIX_STACK.blocks`.

**Numbers:** Five blocks, one breakpoint (`C26`); total token counts remain unchanged.

When the order is exactly `system│tools│instructions│history│current`, create:

```ts
CREATE_CHECKPOINT {
  checkpointId: "cp-l3-first-send",
  reason: "unit-start"
}
```

Copy changes to **“Request ready.”**

### 3. Send the cold request

**Event:** Player clicks **SEND**.

**Action:**

```ts
SEND_REQUEST { request: R1_COLD }
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `lastRequests`, `PREFIX_STACK`, `UI_MAIN_CACHE_PANEL` evidence.

**Resolution and numbers:**

- `readTok: 0`
- `writeTok: 34,738`
- `inputTok: 6,000`
- `outTok: 44,000`
- `writeTier: "1h"`
- `cold: true`
- Cost: `$0.886428`
- Wallet: `$2.500000 → $1.613572`
- Live entry: `34,738 tok`, TTL `60 min` (`C1`)

The tape reveals only after resolution. Toast `l3-first-written` fires.

### 4. Commit a prediction for the identical resend

**Event:** The assembled stack remains visible and unchanged; **SEND AGAIN** is prediction-gated.

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

**Numbers:** No ledger row and no wallet change.

### 5. Send the identical request

**Event:** Player clicks **SEND AGAIN** after committing.

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

**Objects mutated:** `CacheEntry.lastTouchMin`, `CacheEntry.expiresAtMin`, `LedgerRow`, `Wallet`, `PredictionState`, `PREFIX_STACK`.

**Resolution and numbers:**

- `readTok: 34,738`
- `writeTok: 0`
- `inputTok: 6,000`
- `outTok: 44,000`
- Cost: `$0.6884214`
- Wallet: `$1.613572 → $0.9251506`
- Matched blocks: `SYSTEM`, `TOOLS`, `INSTRUCTIONS`, `HISTORY`
- Fresh block: `CURRENT`
- TTL refreshes to `60 min` from this request (`C1`, `C12`)

The visualizer switches to `mode: "inspect"` and reveals the matched prefix in blue only after commitment. Toasts `l3-prefix-name` and `l3-current-fresh` fire.

### 6. Offer the transfer choice without exposing the answer

**Event:** Two edit tickets slide in:

- **BOOT PATCH** — “Change one line in SYSTEM.”
- **FOLLOW-UP** — “Add one line to HISTORY.”

Copy: **“Both edits are tiny. Choose where this request changes.”**

**Action:**

```ts
BEGIN_TRANSFER { challengeId: "l3-change-one-block" }
CREATE_CHECKPOINT {
  checkpointId: "cp-l3-change-choice",
  reason: "decision"
}
```

**Objects mutated:** `LevelPhase`, `Checkpoint`.

**Numbers:** Each edit preserves its block’s token count and changes only its `identityHash`; byte identity, not size, is the variable (`C8`).

### 7. Apply the selected edit

**Event:** Player selects one ticket.

**Action, BOOT PATCH:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_SYSTEM_L3",
  identityHash: "system-v2",
  tokenCount: 2750
}
```

**Action, FOLLOW-UP:**

```ts
SET_PREFIX_BLOCK_CONTENT {
  contextId: "l3-main",
  blockId: "PB_HISTORY_L3",
  identityHash: "history-v2",
  tokenCount: 13083
}
```

**Objects mutated:** selected `PrefixBlock`, `PREFIX_STACK.firstMismatchBlockId`, `matchedPrefixTok`, `invalidatedSuffixTok`.

**Numbers before reveal:**

- BOOT PATCH internal resolution: matched `0 tok`; cacheable suffix needing rewrite `34,738 tok`.
- FOLLOW-UP internal resolution: matched `21,655 tok` (`2,750 + 16,295 + 2,610`); cacheable suffix needing rewrite `13,083 tok`.

`UI_PREFIX_STACK_VISUALIZER.revealBoundary` remains `false`.

### 8. Commit the changed-request prediction

**Event:** **SEND CHANGED REQUEST** remains disabled until prediction commitment.

**Actions:**

```ts
OPEN_PREDICTION { promptId: "l3-change-boundary" }
SELECT_PREDICTION { promptId: "l3-change-boundary", optionId }
COMMIT_PREDICTION { promptId: "l3-change-boundary" }
```

**Objects mutated:** `PredictionState`.

**Numbers:** No economic mutation.

### 9A. Successful late-change reveal

**Precondition:** FOLLOW-UP was selected.

**Event:** Player clicks **SEND CHANGED REQUEST**.

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

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `PredictionState`, `PREFIX_STACK`.

**Resolution and numbers:**

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
- `firstMismatchBlockId: "PB_HISTORY_L3"`
- `invalidatedSuffixTok: 13,083`

This is the aha frame. The visualizer enters `mode: "diff"`, marks the first mismatch, colors the three reread blocks blue, `HISTORY` red, and `CURRENT` with the fresh hatch. Toast `l3-late-boundary` fires.

Then:

```ts
ACK_EXPLANATION { explanationId: "l3-prefix-rule" }
COMPLETE_ATTEMPT
```

### 9B. Early-change fail-freeze

**Precondition:** BOOT PATCH was selected.

**Event:** Player clicks **SEND CHANGED REQUEST**.

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

then:

```ts
FREEZE_FAILURE {
  failure: {
    failureId: "l3-early-change",
    causeCode: "EARLY_PREFIX_MISMATCH",
    message: "SYSTEM changed first, so SYSTEM, TOOLS, INSTRUCTIONS, and HISTORY all had to be written again.",
    checkpointId: "cp-l3-change-choice"
  }
}
```

**Objects mutated:** `CacheEntry`, `LedgerRow`, `Wallet`, `PredictionState`, `PREFIX_STACK`, `FrozenFailure`, `Clock.frozen`.

**Resolution and numbers:**

- Reread: `0 tok`
- Rewritten: `34,738 tok`
- Fresh: `6,000 tok`
- Output: `44,000 tok`
- Cost: `$0.886428`
- Wallet: `$0.9251506 → $0.0387226`
- `firstMismatchBlockId: "PB_SYSTEM_L3"`
- `invalidatedSuffixTok: 34,738`

Freeze on the completed third tape row, with the visualizer in `mode: "diff"`:

- `SYSTEM`: **CHANGED · REWRITTEN · 2,750**
- `TOOLS`: **AFTER CHANGE · REWRITTEN · 16,295**
- `INSTRUCTIONS`: **AFTER CHANGE · REWRITTEN · 2,610**
- `HISTORY`: **AFTER CHANGE · REWRITTEN · 13,083**
- `CURRENT`: **FRESH · 6,000**

No future control remains active except `UI_REWIND_CONTROL`.

### 10. Rewind locally

**Event:** Player activates **“Try the block choice again.”**

**Action:**

```ts
REWIND_TO_CHECKPOINT {
  checkpointId: "cp-l3-change-choice"
}
```

**Objects mutated:** deterministic replay branch, `FrozenFailure`, `Clock.frozen`, attempt-retained evidence.

**Numbers:** State returns to immediately after R2:

- Wallet restored to `$0.9251506`
- Ledger restored to two rows
- Warm `34,738 tok` entry restored
- Cold-open, assembly, and repeat prediction are not replayed

The player can select FOLLOW-UP and finish.

## 5. Level data

```ts
const L3: LevelDef = {
  id: "L3",
  tier: 1,
  title: "Build the Prefix",
  objective:
    "Assemble the request, then make one safe change without rebuilding more than necessary.",
  concept: {
    id: "prefix-boundary",
    privateDesignerSummary:
      "Cache reuse follows the longest byte-identical ordered prefix; the first changed block invalidates the cacheable suffix.",
    postRevealRule:
      "The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again."
  },
  prerequisiteConceptIds: ["cache-write-read", "cache-expiry"],

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
    oneHourFlag: true,
    keepWarm: false,
    hook: "static"
  },
  scenario: "prefix-builder",

  gate: {
    predicateId: "l3-demonstrated-late-reuse",
    behavioralRequirements: [
      "completed R1_COLD and R2_IDENTICAL",
      "changed PB_HISTORY_L3 after the repeat",
      "R3_LATE_CHANGE resolved with readTok===21655",
      "R3_LATE_CHANGE resolved with writeTok===13083",
      "R3_LATE_CHANGE resolved with inputTok===6000"
    ],
    explanationRequirement:
      "ACK_EXPLANATION(l3-prefix-rule) occurred after R3_LATE_CHANGE"
  },

  star2: {
    label: "Found the boundary",
    predicate:
      "committed option through-history for l3-repeat-boundary before R2_IDENTICAL",
    reason: "Correctly predicted which blocks the identical request would reuse."
  },

  star3: {
    label: "Changed late",
    predicate:
      "passed without triggering l3-early-change and spentUsd<=2.3378439",
    reason: "Preserved the largest reusable prefix on the first transfer attempt."
  },

  referenceCfg: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true,
    hook: "static"
  },

  antiCfg: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true,
    hook: "dynamic"
  },

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ]
};
```

`scenarioData.estimates`:

```ts
[
  { label: "budgetUsd", value: 2.50, tag: "[FICTION]" },
  { label: "firstInteractiveBySec", value: 1, tag: "[ESTIMATE]" },
  { label: "blockLandingSec", value: 0.5, tag: "[ESTIMATE]" }
]
```

The measured `13,083` count is used only as a deterministic block-size fixture; this level does not claim that player-visible history semantically contains a skills catalog.

## 6. Pricing walkthrough

All requests use Sonnet: base input `$3/M`, cache read `$0.30/M`, 1-hour write `$6/M`, output `$15/M` (`C1`, `C3`). Output remains present in hover and ledger but is not introduced as new vocabulary in this level.

### `R1_COLD`

```text
write: 34,738 × $6/M    = $0.208428
input:  6,000 × $3/M    = $0.018000
output: 44,000 × $15/M  = $0.660000
total                      $0.886428
```

### `R2_IDENTICAL`

```text
read:   34,738 × $0.30/M = $0.0104214
input:   6,000 × $3/M    = $0.0180000
output: 44,000 × $15/M   = $0.6600000
total                       $0.6884214
```

### `R3_LATE_CHANGE` — reference

```text
read:   21,655 × $0.30/M = $0.0064965
write:  13,083 × $6/M    = $0.0784980
input:   6,000 × $3/M    = $0.0180000
output: 44,000 × $15/M   = $0.6600000
total                       $0.7629945
```

Three-star reference total:

```text
$0.886428 + $0.6884214 + $0.7629945 = $2.3378439
```

### `R3_EARLY_CHANGE` — anti-pattern

```text
read:        0 × $0.30/M = $0.000000
write: 34,738 × $6/M     = $0.208428
input:  6,000 × $3/M     = $0.018000
output: 44,000 × $15/M   = $0.660000
total                       $0.886428
```

Anti-pattern total:

```text
$0.886428 + $0.6884214 + $0.886428 = $2.4612774
```

Early-change premium:

```text
$2.4612774 − $2.3378439 = $0.1234335
```

Every request is priced by `PRICE_REQUEST`; no display calculation is authoritative.

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
  { id: "l3-cold", requestIds: ["R1_COLD"] },
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

The reference/anti tape pair remains hidden until an attempt has produced its third request.

## 8. Prediction prompts

### `l3-repeat-boundary`

**Question:** “Nothing in the stack changed. How far will the saved part reach?”

Options:

- `system-only` — “SYSTEM only”
- `through-instructions` — “Through INSTRUCTIONS”
- `through-history` — “Through HISTORY; CURRENT stays fresh”

Correct option: `through-history`.

Post-reveal sentence: **“The four unchanged blocks were reread; CURRENT was still new work.”**

### `l3-change-boundary`

**Question:** “This one block changed. What will the next request do?”

Options are generated from the selected ticket without correctness styling.

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

Post-reveal sentence:

- BOOT PATCH: **“The first mismatch was SYSTEM, so the cached suffix started there.”**
- FOLLOW-UP: **“The first three blocks still matched; only the changed cached tail was rewritten.”**

## 9. Fail-state

**Failure rule:** `l3-early-change`

- **Decisive event:** `R3_EARLY_CHANGE` resolves.
- **Predicate:** selected block is `PB_SYSTEM_L3` and `R3_EARLY_CHANGE.writeTok === 34_738`.
- **Cause code:** `EARLY_PREFIX_MISMATCH`
- **Frozen message:** **“SYSTEM changed first, so SYSTEM, TOOLS, INSTRUCTIONS, and HISTORY all had to be written again.”**
- **Highlighted objects:** `PB_SYSTEM_L3`, `PB_TOOLS_L3`, `PB_INSTRUCTIONS_L3`, `PB_HISTORY_L3`, `R3_EARLY_CHANGE`
- **Freeze evidence:** `0 reread · 34,738 rewritten · 6,000 fresh`
- **Rewind control:** **“Try the block choice again.”**
- **Destination:** `cp-l3-change-choice`

The failed request remains visible while frozen. Rewind removes only the choice, mutation, third request, and its economic effects.

`failLesson`:

```ts
{
  bucket: "none",
  cite: "C8",
  line:
    "SYSTEM changed first, so SYSTEM, TOOLS, INSTRUCTIONS, and HISTORY all had to be written again."
}
```

## 10. Gate & stars

### Pass gate

Pass only when all are true:

1. The player assembled all five blocks in canonical order.
2. `R1_COLD` and `R2_IDENTICAL` were sent.
3. A prediction was committed before each gated reveal.
4. The transfer edit changed `PB_HISTORY_L3`.
5. `R3_LATE_CHANGE` resolved as exactly `21,655 reread`, `13,083 rewritten`, and `6,000 fresh`.
6. The player acknowledged `l3-prefix-rule` after seeing that evidence.

Budget alone cannot pass the level.

### Stars

- **1 star — Built and proved:** behavioral pass gate satisfied.
- **2 stars — Found the boundary:** additionally predicted `through-history` before R2.
- **3 stars — Changed late:** additionally chose FOLLOW-UP on the first transfer attempt and spent no more than the reference `$2.3378439`.

Incorrect predictions never remove a star except where the explicit two-star predicate rewards the demonstrated prediction.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l3-first-written` | `R1_COLD.writeTok === 34738` | **“First send: 34,738 tokens saved for reuse. WRITE · $0.208428.”** |
| `l3-prefix-name` | R2 reveal shows `readTok === 34738` | **“That unchanged run at the front is the prefix.”** |
| `l3-current-fresh` | R2 reveal shows `inputTok === 6000` | **“CURRENT arrived after the saved part: FRESH · 6,000.”** |
| `l3-late-boundary` | R3 late reveal | **“Boundary found: 21,655 reread · 13,083 rewritten · 6,000 fresh.”** |
| `l3-early-cause` | `FREEZE_FAILURE` for `l3-early-change` | **“The change happened first. Everything cached after it lost reuse.”** |

Vocabulary:

```ts
[
  {
    term: "prefix",
    definition: "The unchanged ordered run of blocks at the front of a request.",
    firstNeededEventId: "reveal-r2-identical",
    toastId: "l3-prefix-name"
  },
  {
    term: "fresh",
    definition: "New request material outside the reusable cached prefix.",
    firstNeededEventId: "reveal-r2-identical",
    toastId: "l3-current-fresh"
  }
]
```

Neither term appears in player-facing pre-play copy.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. The first actionable block is available by `2s` `[ESTIMATE]`.
2. Pre-play UI never states that an early change invalidates later blocks.
3. `UI_PREFIX_STACK_VISUALIZER.revealBoundary === false` before each relevant prediction commitment.
4. **SEND AGAIN** and **SEND CHANGED REQUEST** cannot dispatch before their predictions are committed.
5. R1 yields exactly one `LedgerRow` and one tape row costing `$0.886428`.
6. R2 yields exactly one `LedgerRow` and one tape row costing `$0.6884214`.
7. R3 late yields exactly one `LedgerRow` and one tape row costing `$0.7629945`.
8. R3 early yields exactly one `LedgerRow` and one tape row costing `$0.886428`.
9. Each visible tape row corresponds to exactly one priced request; its segment buckets equal that row.
10. Every real request has `usd > 0`.
11. No positive value renders as `$0.0000`.
12. All authoritative costs equal `PRICE_REQUEST` using `C1` and `C3`.
13. R2 refreshes the live `CacheEntry` TTL according to `C12`.
14. The late-change diff labels exactly three blocks reread, one rewritten, and `CURRENT` fresh.
15. The early-change diff labels zero blocks reread, four rewritten, and `CURRENT` fresh.
16. The early branch freezes only after its decisive tape row is fully visible.
17. While frozen, economic controls are disabled and `UI_REWIND_CONTROL` remains available.
18. Rewind to `cp-l3-change-choice` deterministically restores two ledger rows and wallet `$0.9251506`.
19. The fixed-seed reference path passes and totals `$2.3378439`.
20. The fixed-seed early-change path fails the behavioral gate even though `$0.0387226` remains.
21. Static final tape colors, block states, and totals render without hover.
22. Hover/focus exposes every non-zero bucket equation, including output.
23. Pointer drag/drop and keyboard move controls dispatch equivalent `REORDER_PREFIX_BLOCK` actions.
24. Prediction options expose no correctness styling before commitment.
25. Screen-reader announcements name block, state, and token count without relying on color.
26. Reduced-motion mode presents identical final ledger, boundary, classifications, and prices.
27. The level is winnable using only documented visible controls.
28. Reference and anti-pattern comparison remains inaccessible until a completed third request.

## 13. Reference-bar justification

The screen puts a tactile object under the cursor immediately, lets the player build and send before naming the new idea, and turns the unchanged resend into evidence they must predict. The transfer then changes only one variable—where an equal-sized edit occurs—so the reuse boundary becomes visible as a consequence of play. An early choice fails at the exact request that caused the loss, names every affected block, and rewinds directly to the choice. The rule and reference comparison appear only after the player has produced the evidence.

**Assumption:** `C7` supplies the measured `13,083-token` size fixture for `PB_HISTORY_L3`; its original semantic provenance is not presented as history content. All invented timing and budget values are explicitly tagged.
