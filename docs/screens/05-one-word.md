# Level 5 — One Word

## 1. Identity

- **id:** `L5`
- **title:** One Word
- **tier:** `1`
- **Objective:** “Eight agents get eight nearly identical jobs. Make their shared context travel farther.”
- **ONE concept:** `C8` byte-identical ordered prefix content is required for reuse; under `C9`, the first mismatch invalidates the cacheable suffix.
- **Prerequisites:** prefix identity; shared `SUBAGENT_CONTEXT` reuse within `CACHE_TIER_5M`.
- **Post-reveal rule:** “Keep shared prompt bytes identical at the front; put each task’s variation at the tail.”

## 2. Objects used

- `SUBAGENT_CONTEXT`
- `Request`
- `CacheEntry`
- `PREFIX_STACK`
- `PB_INSTRUCTIONS`
- `PB_CURRENT`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Clock`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_TAPE_RENDERER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `CounterfactualOverlay`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`
- `PATTERN_EXPLAIN_THEN_TRANSFER`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction by `1.5s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Eight face-down job cards snap into one queue. Header: **“Eight tiny fixes. One agent template.”** |
| `0.4s` | The first two prompt strips appear with no cache coloring and no revealed diff boundary: **“HEY — fix the login redirect”** and **“HELLO — fix the logout redirect.”** |
| `0.8s` | Copy: **“They look almost the same. Will Claude treat their saved context the same?”** |
| `1.5s` | `UI_PREDICTION_PROMPT` opens. No tape, token count, dollar comparison, or correct arrangement is visible. |

The one-word variation is visible because it is the puzzle input; its economic consequence and the reusable arrangement remain hidden until play.

## 4. Exact event sequence

1. **Enter the level**  
   Event: level mount → `ENTER_LEVEL { levelId: "L5" }` → initializes `ReducerState`, `Wallet`, `Clock`, eight `SUBAGENT_CONTEXT` instances sharing `sharedPrefixPoolId: "l5-pool"`, and eight front-varied `PREFIX_STACK` values.  
   Numbers: `8` jobs `[FICTION]`; `clockMin=0`; `budgetUsd=0.55` `[FICTION]`; model `sonnet`; tier `5m`; width `8`, keeping all requests inside the `5m` lifetime (`C1`, `C27`).

2. **Checkpoint the untouched prompt layout**  
   Event: cold-open settles → `CREATE_CHECKPOINT { checkpointId: "l5-before-layout", reason: "decision" }` → appends `Checkpoint`; no economic mutation.

3. **Commit the first prediction**  
   Event: player answers whether the second prompt will reuse all saved context → `OPEN_PREDICTION`, `SELECT_PREDICTION`, then `COMMIT_PREDICTION { promptId: "l5-front-result" }` → mutates `prediction`; unlocks **Run 8**. No result is revealed.

4. **Send job 1**  
   Event: player clicks **Run 8** → `SEND_REQUEST { request: req-front-1 }` → `RESOLVE_PREFIX` creates the shared `CacheEntry`; appends one `LedgerRow`; mutates `Wallet`, `lastRequests`, and the first `PREFIX_STACK`.  
   Numbers: `writeTok=26,237`, `readTok=0`, `inputTok=0`, `outTok=0`; cost `$0.09838875` (`C10`, `C1`, `C3`); wallet `$0.55000000 → $0.45161125`. Tape row 1 is red.

5. **Send job 2: decisive front mismatch**  
   Event: queued request `req-front-2` sends → `SEND_REQUEST` → `RESOLVE_PREFIX` finds the first mismatching `Token` at the greeting in `PB_INSTRUCTIONS`; appends `LedgerRow`; updates the shared `CacheEntry`, `Wallet`, `lastRequests`, and `PREFIX_STACK.firstMismatchBlockId`, `matchedPrefixTok`, and `invalidatedSuffixTok`.  
   Numbers: `readTok=11,602`, `writeTok=14,623`, cost `$0.05831685` (`C11`, `C1`, `C3`); wallet `$0.45161125 → $0.39329440`. `UI_PREFIX_STACK_VISUALIZER` changes to `mode:"diff"` only now: `11,602` blue tokens, the first mismatch marker, then `14,623` red tokens.

6. **Reveal prediction and freeze the local failure**  
   Event: row 2 reaches the mismatch → `REVEAL_PREDICTION { promptId: "l5-front-result", correctOptionId: "partial-rewrite" }`, then `FREEZE_FAILURE` with `causeCode:"EARLY_PROMPT_MISMATCH"` → reveals prediction evidence, freezes `Clock` and economic controls, preserves the two ledger rows, and highlights the first mismatching `Token` plus invalidated suffix.  
   Message: **“‘HELLO’ mismatched near the front. It invalidated the 14,623-token suffix, so job 2 rewrote it.”** (`C9`, `C11`).

7. **Rewind locally**  
   Event: player clicks **Move the word** → `REWIND_TO_CHECKPOINT { checkpointId: "l5-before-layout" }` → deterministically restores the pre-run `Wallet`, ledger, cache, and prompt layout while retaining the completed prediction as mastered setup.

8. **Normalize prompts**  
   Event: player activates **Shared template**, then moves **TASK** to the trailing slot → `NORMALIZE_PROMPTS { templateId: "l5-shared-v1", taskPointerPosition: "tail" }` → replaces the eight prompt `PREFIX_STACK` identities so the shared `26,237`-token prefix is byte-identical and each job-specific pointer is late; sets `cfg.prompts="identical"`.  
   Exact editor copy:  
   Shared template: **“Review the repository, follow project instructions, and complete TASK.”**  
   Tail pointers: **“TASK: fix login redirect”**, **“TASK: fix logout redirect”**, **“TASK: add reset-password route”**, **“TASK: repair session refresh”**, **“TASK: add auth error test”**, **“TASK: fix callback state check”**, **“TASK: update access guard”**, **“TASK: verify sign-out cleanup.”**  
   The task labels and count are `[FICTION]`; no pricing occurs.

9. **Commit the transfer prediction**  
   Event: player clicks **Test layout** → `CREATE_CHECKPOINT { checkpointId: "l5-before-normalized-run", reason: "prediction" }`, `OPEN_PREDICTION`, `SELECT_PREDICTION`, `COMMIT_PREDICTION { promptId: "l5-tail-result" }` → mutates `checkpoints` and `prediction`; normalized run remains gated until commitment.

10. **Run normalized job 1**  
    Event: player clicks **Run 8** → `SEND_REQUEST { request: req-tail-1 }` → creates shared `CacheEntry`, appends `LedgerRow`, and debits `Wallet`.  
    Numbers: `writeTok=26,237`; cost `$0.09838875` (`C10`, `C1`, `C3`). Row 1 is red.

11. **Run normalized jobs 2–8**  
    Event: queue dispatches seven `SEND_REQUEST` actions in order → each `RESOLVE_PREFIX` reads the same live shared entry, refreshes `lastTouchMin`, appends one `LedgerRow`, and mutates `Wallet`.  
    Per request: `readTok=26,237`, other buckets `0`; `$0.00787110` (`C10`, `C12`, `C1`, `C3`). Seven reads cost `$0.05509770`; normalized total is `$0.15348645`. Rows 2–8 are blue.

12. **Reveal the aha frame**  
    Event: `req-tail-2` finishes, followed by the remaining rows → `REVEAL_PREDICTION { promptId: "l5-tail-result", correctOptionId: "seven-full-reads" }`, then `ACK_EXPLANATION { explanationId: "l5-byte-identity" }` → reveals the full blue run and records causal understanding.  
    Aha copy: **“Same work, different position. With the variation at the tail, all seven later agents reused the 26,237-token prefix.”** (`C8`, `C10`).

13. **Complete attempt and unlock comparison**  
    Event: eighth normalized row settles → `COMPLETE_ATTEMPT`, then `REQUEST_COUNTERFACTUAL { comparisonId: "l5-front-v-tail" }` and `REVEAL_COUNTERFACTUAL` → computes the same-seed anti-pattern off-screen and opens `CounterfactualOverlay`.  
    Numbers: front-varied total `$0.50660670`; normalized total `$0.15348645`; delta `$0.35312025` (`C10`, `C11`, `C1`, `C3`). `UI_RESULT_SCREEN` evaluates the behavioral gate and stars.

## 5. Level data

```ts
const level05: LevelDef = {
  id: "L5",
  tier: 1,
  title: "One Word",
  objective: "Eight agents get eight nearly identical jobs. Make their shared context travel farther.",
  concept: {
    id: "byte-identical-prompt-reuse",
    privateDesignerSummary:
      "Byte-identical prompts reuse; early variation forces suffix rewrites.",
    postRevealRule:
      "Keep shared prompt bytes identical at the front; put each task’s variation at the tail."
  },
  prerequisiteConceptIds: ["prefix-identity", "subagent-reuse"],

  unlocks: "prompts",
  introducedControls: ["prompts"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "width",
    "oneHourFlag", "keepWarm", "hook", "skills", "skillsMode",
    "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 5005,
  budgetUsd: 0.55,
  clockCapMin: 5,
  cfgOverride: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "varied",
    width: 8,
    oneHourFlag: false,
    keepWarm: false
  },
  scenario: "prompt-normalizer",

  gate: {
    predicateId: "l5-demonstrated-tail-normalization",
    behavioralRequirements: [
      "cfg.prompts == 'identical'",
      "normalized taskPointerPosition == 'tail'",
      "normalized run has exactly one 26,237-token write",
      "normalized run has exactly seven 26,237-token reads"
    ],
    explanationRequirement:
      "ACK_EXPLANATION('l5-byte-identity') completed after reveal"
  },

  star2: {
    label: "Clean template",
    predicate:
      "pass && exactly one NORMALIZE_PROMPTS action in the passing run",
    reason: "Solved without another failed layout."
  },
  star3: {
    label: "Byte perfect",
    predicate:
      "star2 && normalized ledger total == 0.15348645",
    reason: "One write followed by seven full-prefix reads."
  },

  referenceCfg: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "identical",
    width: 8,
    oneHourFlag: false
  },
  antiCfg: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "varied",
    width: 8,
    oneHourFlag: false
  },

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT",
    "PATTERN_EXPLAIN_THEN_TRANSFER"
  ],

  learn: undefined
};
```

`scenarioData.estimates`:

```ts
[
  { label: "job count", value: 8, tag: "[FICTION]" },
  { label: "budgetUsd", value: 0.55, tag: "[FICTION]" },
  { label: "cold-open first interaction seconds", value: 1.5, tag: "[ESTIMATE]" }
]
```

## 6. Pricing walkthrough

All requests use Sonnet, `CACHE_TIER_5M`, no fresh input bucket, and no output bucket. Sonnet’s measured rates are `$3/M` input, `$0.30/M` read, and `$3.75/M` 5-minute write (`C1`, `C3`).

### Reference: normalized shared template + late task pointer

| Requests | `readTok` | `writeTok` | Calculation | USD |
|---|---:|---:|---|---:|
| `req-tail-1` | `0` | `26,237` | `26,237 × 1.25 × $3/M` | `$0.09838875` |
| `req-tail-2…8` each | `26,237` | `0` | `26,237 × 0.1 × $3/M` | `$0.00787110` |
| Seven reads | `183,659` | `0` | `7 × $0.00787110` | `$0.05509770` |
| **3-star total** | `183,659` | `26,237` | write + seven reads | **`$0.15348645`** |

Token counts come from identical subagent reuse (`C10`); multipliers and model price come from `C1` and `C3`.

### Anti-pattern: variation near the front

| Requests | `readTok` | `writeTok` | Calculation | USD |
|---|---:|---:|---|---:|
| `req-front-1` | `0` | `26,237` | `26,237 × 1.25 × $3/M` | `$0.09838875` |
| `req-front-2…8` each | `11,602` | `14,623` | `(11,602 × 0.1 × $3/M) + (14,623 × 1.25 × $3/M)` | `$0.05831685` |
| Seven varied requests | `81,214` | `102,361` | `7 × $0.05831685` | `$0.40821795` |
| **Anti-pattern total** | `81,214` | `128,598` | first write + seven partial rewrites | **`$0.50660670`** |

The split is measured `C11`; the first-mismatch behavior is `C9`. Reference savings are exactly `$0.35312025`, or `69.70%` of the anti-pattern total.

## 7. Tape sequence

`TapeSpec.rowSource: "lastRequests"`; output segments remain hidden because output pricing is not this level’s concept.

### Failed front-varied reveal group

1. `req-front-1`: red `write`, `26,237` tokens.
2. `req-front-2`: blue `read`, `11,602` tokens; mismatch notch; red `write`, `14,623` tokens.
3. Freeze before jobs 3–8; they are neither priced nor rendered.

The failure frame synchronizes `UI_TAPE_RENDERER` row 2 with `UI_PREFIX_STACK_VISUALIZER` in diff mode: a bright caret under the first mismatching greeting token, followed by a red sweep labeled **“14,623 tokens invalidated.”**

### Passing reveal group

1. `req-tail-1`: red `write`, `26,237`.
2. `req-tail-2`: blue `read`, `26,237`; this is `ahaRequestId`.
3. `req-tail-3`: blue `read`, `26,237`.
4. `req-tail-4`: blue `read`, `26,237`.
5. `req-tail-5`: blue `read`, `26,237`.
6. `req-tail-6`: blue `read`, `26,237`.
7. `req-tail-7`: blue `read`, `26,237`.
8. `req-tail-8`: blue `read`, `26,237`.

The aha frame begins only after `l5-tail-result` is committed. The first blue row pulls a blue ripple through rows 3–8; reduced-motion mode draws the identical final state immediately.

## 8. Prediction prompts

### `l5-front-result`

**Question:** “When prompt 2 changes only ‘HEY’ to ‘HELLO,’ what will happen to its saved context?”

- `full-read` — “All of it is reused.”
- `partial-rewrite` — “Part is reused; the rest turns red.”
- `full-write` — “All of it is rewritten.”

Correctness remains visually neutral until request 2 resolves. Correct option: `partial-rewrite`.

Post-reveal explanation: **“The first mismatch preserved 11,602 earlier tokens but invalidated the 14,623-token suffix.”** (`C11`)

### `l5-tail-result`

**Question:** “You moved each job’s changing words to the tail. After the first red write, what will jobs 2–8 show?”

- `seven-full-reads` — “Seven full blue reads.”
- `seven-partial` — “Seven blue-and-red splits.”
- `seven-writes` — “Seven red rewrites.”

Correct option: `seven-full-reads`.

Post-reveal explanation: **“The shared 26,237-token prefix stayed byte-identical, so every later warm spawn read it.”** (`C8`, `C10`)

## 9. Fail-state

- **Decisive event:** resolution of `req-front-2`.
- **Failure predicate:** first mismatch is in the early greeting token and `invalidatedSuffixTok == 14,623`.
- **Freeze target:** request 2’s mismatch marker, its red suffix, `Wallet`, and `Clock`.
- **One-line causal message:** **“‘HELLO’ mismatched near the front. It invalidated the 14,623-token suffix, so job 2 rewrote it.”**
- **Rewind control label:** **“Move the word”**
- **Rewind behavior:** `REWIND_TO_CHECKPOINT("l5-before-layout")`; remove the two failed-run ledger rows and cache mutation, restore `$0.55`, preserve the completed first prediction, and focus the prompt normalizer. The cold-open does not replay.

## 10. Gate & stars

`pass(st)` returns true only when all are demonstrated:

- `NORMALIZE_PROMPTS` used `taskPointerPosition:"tail"`.
- The passing attempt produced exactly eight `LedgerRow` objects.
- Row 1 has `writeTok=26,237`.
- Rows 2–8 each have `readTok=26,237` and `writeTok=0`.
- `ACK_EXPLANATION("l5-byte-identity")` occurred after the gated reveal.
- No requirement depends on budget alone.

Stars:

- **1 star:** behavioral gate passes.
- **2 stars — Clean template:** pass with exactly one normalization action during the passing run.
- **3 stars — Byte perfect:** 2 stars plus exact passing total `$0.15348645`, one write, seven full reads, and no extra request.

Result copy:

- Pass headline: **“Eight jobs. One reusable front.”**
- Fail headline: **“The changing word is still breaking the prefix.”**
- Evidence: **“1 write · 7 reads · $0.15348645”**
- Continue: **“Next level”**
- Retry: **“Try another layout”**

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `l5-first-write` | `req-front-1` or `req-tail-1` creates the shared entry | **“First agent saved 26,237 tokens. WRITE · $0.0984.”** |
| `l5-first-mismatch` | `req-front-2` resolves with `invalidatedSuffixTok=14,623` | **“First mismatch found. Everything after it must be rewritten.”** |
| `l5-byte-identical` | First post-normalization full read | **“Byte-identical: every saved byte before the task pointer matched.”** |
| `l5-seven-reads` | Passing request 8 settles | **“Seven warm agents reused the full 26,237-token prefix.”** |
| `l5-savings` | Counterfactual reveal opens | **“Moving the variation saved $0.35312025 across eight jobs.”** |

`l5-first-mismatch` is the assertive, persistent cause toast during freeze. All others use polite announcements and dedupe per attempt.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. No correct layout, blue reference tape, token suffix count, or savings delta appears before the relevant committed prediction.
2. **Run 8** is disabled until `l5-front-result` is committed.
3. The failed path renders exactly two priced requests, two ledger rows, and two tape rows before freezing.
4. `req-front-2` identifies the first greeting mismatch and exactly `14,623` invalidated tokens (`C11`).
5. Failure freezes before request 3 and exposes **Move the word** immediately.
6. Rewind restores the same checkpoint hash, `$0.55` wallet, empty ledger, and editable front-varied layout.
7. Keyboard and pointer normalization dispatch equivalent `NORMALIZE_PROMPTS` actions.
8. **Test layout** opens `l5-tail-result`; the passing reveal cannot run before commitment.
9. Passing produces exactly eight requests, eight ledger rows, and eight tape rows in the specified order.
10. Every request cost is positive; no positive price displays as `$0.0000`.
11. Every ledger cost matches `PRICE_REQUEST` without internal rounding.
12. The reference run totals exactly `$0.15348645`; the anti-pattern totals exactly `$0.50660670`.
13. The passing tape visibly contains one red row followed by seven blue rows without hover.
14. Hover and keyboard focus expose the correct non-zero bucket equations through `UI_HOVER_PRICE_CALCULATOR`.
15. `CacheEntry.lastTouchMin` refreshes on each of the seven reads (`C12`); all requests remain within `5m` (`C1`, `C27`).
16. The fixed seed and `referenceCfg` pass; `antiCfg` fails the behavioral gate.
17. Reduced-motion mode shows the same mismatch evidence, final colors, prices, and gate result.
18. The level is winnable using only the documented shared-template and task-pointer controls.
19. The post-attempt `CounterfactualOverlay` remains absent until a meaningful attempt completes.
20. Replay from the same seed and action list yields byte-identical state, ledger, wallet, and result.

## 13. Reference-bar justification

The screen puts a concrete puzzle under the cursor within `1.5s`, asks for a commitment before exposing the cache boundary, and lets the surprising red suffix emerge from the player’s own run. Failure stops on the exact mismatching word instead of presenting a generic budget loss, then rewinds directly into one tactile repair: moving the task variation. The second committed prediction turns that repair into a visible one-red/seven-blue payoff; only afterward does the dollar counterfactual name and quantify the rule. This is one mechanic, one causal surprise, and one transferable behavior.

Assumption: the eight task labels and `$0.55` wallet are level fixture values marked `[FICTION]`; all token counts, rate multipliers, TTL behavior, and computed request totals trace to `C1`, `C3`, and `C8–C12`.
