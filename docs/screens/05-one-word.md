# Level 5 — One Word

## 1. Identity

- **id:** `05-one-word`
- **title:** One Word
- **tier:** `1`
- **Objective:** “Eight agents get eight nearly identical jobs. Make their shared context travel farther.”
- **ONE concept:** `byte-identical-prefix` — reuse requires byte-identical ordered prefix content (`C8`); the first mismatch invalidates the cacheable suffix (`C9`).
- **Prerequisite concept IDs:** `["prefix-reuse", "shared-subagent-window"]`
- **Post-reveal rule:** “Keep shared prompt bytes identical at the front; put each task’s variation at the tail.”

## 2. Objects used

- `SUBAGENT_CONTEXT`
- `Request`
- `PricedRequest`
- `CacheEntry`
- `PREFIX_STACK`
- `PB_INSTRUCTIONS`
- `PB_CURRENT`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
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
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction by `1.5s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Eight face-down job cards snap into an empty queue. Header: **“Eight tiny fixes. One agent template.”** |
| `0.4s` | Two uncolored template cards appear. **Greeting first:** “HEY/HELLO — review the repository, follow project instructions, and complete TASK.” **Ticket last:** “Review the repository, follow project instructions, and complete TASK: …” |
| `0.8s` | Copy: **“Pick the template the dispatcher should use.”** Neither card shows cache color, token counts, prices, or correctness. Greeting-first offers a conspicuous per-job cue for human scanning; ticket-last keeps the opener visually uniform. |
| `1.5s` | Both template cards become selectable. The job queue remains disabled until the player explicitly chooses one. |

The player—not the script—chooses the layout that can produce the front-mismatch failure. The visible wording is puzzle input; its cache consequence, reusable boundary, and cheaper layout remain hidden until the chosen run resolves.

## 4. Exact event sequence

1. **Enter with no committed template**  
   Event: level mount → `ENTER_LEVEL { levelId: "05-one-word" }` → initializes `ReducerState`, `Wallet`, `Clock`, and eight `SUBAGENT_CONTEXT` instances sharing `sharedPrefixPoolId:"l5-pool"`. Candidate prefix stacks exist, but neither is runnable until selected.  
   Numbers: `8` jobs `[FICTION]`; `clock.min=0`; `budgetUsd=0.55` `[FICTION]`; model `sonnet`; tier `5m`; width `8`. The authored dispatch keeps all eight requests within the `5m` lifetime (`C1`, `C27`).

2. **Player chooses a template before jobs queue**  
   Event: player selects a template card → one of:
   - `NORMALIZE_PROMPTS { templateId:"l5-greeting-front", taskPointerPosition:"front" }`
   - `NORMALIZE_PROMPTS { templateId:"l5-ticket-tail", taskPointerPosition:"tail" }`

   The action commits the selected `PREFIX_STACK` identities and enables prediction. Front selection sets `cfg.prompts="varied"`; tail selection sets `cfg.prompts="identical"`. No request, ledger row, cache mutation, or price occurs.

3. **Commit the route-specific prediction**  
   Event: the selected layout determines which unresolved prompt opens:
   - front → `OPEN_PREDICTION { promptId:"l5-front-result" }`
   - tail → `OPEN_PREDICTION { promptId:"l5-tail-result" }`

   Player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION` for that prompt. Selection styling stays neutral; correctness changes no score, stars, wallet, failure, or gate state.

4. **Checkpoint the chosen, predicted layout**  
   Event: prediction commitment → `CREATE_CHECKPOINT { checkpointId:"l5-before-run", reason:"decision" }` → records the boundary after the player’s template choice and prediction. This lets a failed front route rewind without replaying the cold-open or prediction.

5. **Send chosen-layout job 1**  
   Event: player clicks **Run 8** → `SEND_REQUEST` for `req-front-1` or `req-tail-1` → `RESOLVE_PREFIX` creates the shared `CacheEntry`; one `LedgerRow` is appended; `Wallet`, `lastRequests`, and the first `PREFIX_STACK` mutate.  
   Numbers: `readTok=0`, `inputTok=0`, `writeTok=26,237`, `outTok=0`; cost `$0.09838875` (`C10`, `C1`, `C3`). Wallet becomes `$0.45161125`. Tape row 1 is red.

6. **Resolve job 2**  
   Event: queued job 2 dispatches `SEND_REQUEST`.

   - **Front choice:** `RESOLVE_PREFIX` finds the first mismatching `Token` at the greeting in `PB_INSTRUCTIONS`; `readTok=11,602`, `writeTok=14,623`, `inputTok=0`, `outTok=0`; cost `$0.05831685` (`C11`, `C1`, `C3`). Wallet becomes `$0.39329440`. `UI_PREFIX_STACK_VISUALIZER` enters `mode:"diff"` only after resolution.
   - **Tail choice:** `RESOLVE_PREFIX` reads the complete live shared prefix; `readTok=26,237`, all other buckets `0`; cost `$0.00787110` (`C10`, `C12`, `C1`, `C3`).

7. **Reveal and freeze the player-chosen front route**  
   Event ID: `ev-l5-reveal-front`.  
   Preconditions: front layout selected and `req-front-2` resolved.  
   Actions: `REVEAL_PREDICTION { promptId:"l5-front-result", correctOptionId:"partial-rewrite" }`, then `FREEZE_FAILURE { failureRuleId:"l5-early-mismatch" }`.

   The decisive frame shows the actual second-row price `$0.05831685` beside the valid warm full-read price `$0.00787110`: the chosen front route costs `$0.05044575` more for job 2, or `7.41×` the valid alternative (`C1`, `C3`, `C10`, `C11`). The freeze therefore follows visible, economically true evidence. Jobs 3–8 are neither sent nor priced.

8. **Rewind the failed front choice**  
   Event: player clicks **Move the word** → `REWIND_TO_CHECKPOINT { checkpointId:"l5-before-run" }` → restores the pre-run cache, empty ledger, clock, and `$0.55` wallet while retaining the already committed front prediction because it precedes the checkpoint. The selected front layout remains editable.

9. **Apply the post-evidence remediation**  
   Event: player moves **TASK** to the trailing slot → `NORMALIZE_PROMPTS { templateId:"l5-ticket-tail", taskPointerPosition:"tail" }` → makes the shared `26,237`-token prefix byte-identical and sets `cfg.prompts="identical"`. This is a post-evidence remediation action; no pricing occurs.

   Exact tail task pointers:

   - **“TASK: fix login redirect”**
   - **“TASK: fix logout redirect”**
   - **“TASK: add reset-password route”**
   - **“TASK: repair session refresh”**
   - **“TASK: add auth error test”**
   - **“TASK: fix callback state check”**
   - **“TASK: update access guard”**
   - **“TASK: verify sign-out cleanup.”**

   Task labels and count are `[FICTION]`.

10. **Predict the remediated run**  
    Event: player clicks **Test layout** → `OPEN_PREDICTION`, `SELECT_PREDICTION`, and `COMMIT_PREDICTION { promptId:"l5-tail-result" }`, followed by `CREATE_CHECKPOINT { checkpointId:"l5-before-tail-run", reason:"prediction" }`. The tail run cannot execute before commitment.

11. **Send tail-layout job 1**  
    Event: player clicks **Run 8** → `SEND_REQUEST { request:req-tail-1 }` → creates the shared `CacheEntry`, appends one `LedgerRow`, and debits `Wallet`.  
    Numbers: `writeTok=26,237`; other buckets `0`; cost `$0.09838875` (`C10`, `C1`, `C3`).

12. **Send tail-layout jobs 2–8**  
    Event: the queue dispatches seven ordered `SEND_REQUEST` actions → each `RESOLVE_PREFIX` reads the same live entry, refreshes `CacheEntry.lastTouchMin`, appends one `LedgerRow`, and debits `Wallet`.  
    Per request: `readTok=26,237`; other buckets `0`; cost `$0.00787110` (`C10`, `C12`, `C1`, `C3`). Seven reads cost `$0.05509770`; the passing run costs `$0.15348645` and leaves `$0.39651355`.

    A player who selected the tail layout initially reaches this same authoritative run directly after step 5; no failure is scripted or required.

13. **Reveal the tail evidence**  
    Event ID: `ev-l5-reveal-tail`.  
    Event: request 8 settles → `REVEAL_PREDICTION { promptId:"l5-tail-result", correctOptionId:"seven-full-reads" }` → reveals the complete one-red/seven-blue tape.  
    Aha copy: **“Same work, different position. With the variation at the tail, all seven later agents reused the 26,237-token prefix.”** (`C8`, `C10`).

14. **Choose the causal explanation after evidence**  
    Event: the player selects an explanation. The correct selection dispatches `ACK_EXPLANATION { explanationId:"l5-byte-identity" }`. Incorrect explanation selections are neutral and retryable; they cause no economic mutation or score loss.  
    Rule revealed only now: **“The bytes before TASK stayed identical, so every later request could read the saved prefix.”**

15. **Complete and unlock the full comparison**  
    Event: correct post-evidence explanation → `COMPLETE_ATTEMPT`, then `REQUEST_COUNTERFACTUAL { comparisonId:"l5-front-v-tail" }` and `REVEAL_COUNTERFACTUAL`. The same-seed eight-job anti-pattern is computed off-screen only after the meaningful attempt.  
    Numbers: front-varied total `$0.50660670`; normalized total `$0.15348645`; savings `$0.35312025` (`C1`, `C3`, `C10`, `C11`). `UI_RESULT_SCREEN` evaluates the behavioral gate and stars.

## 5. Level data

```ts
const level05: LevelDef = {
  id: "05-one-word",
  tier: 1,
  title: "One Word",
  objective:
    "Eight agents get eight nearly identical jobs. Make their shared context travel farther.",
  concept: {
    id: "byte-identical-prefix",
    privateDesignerSummary:
      "Byte-identical ordered prefixes reuse; an early mismatch forces a suffix rewrite.",
    postRevealRule:
      "Keep shared prompt bytes identical at the front; put each task’s variation at the tail."
  },
  prerequisiteConceptIds: [
    "prefix-reuse",
    "shared-subagent-window"
  ],

  unlocks: "prompts",
  introducedControls: ["prompts"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "width",
    "oneHourFlag",
    "keepWarm",
    "hook",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp"
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
  scenarioData: {
    units: L5_JOB_SEEDS,
    contexts: L5_SUBAGENT_CONTEXT_SEEDS,
    prefixStacks: L5_PREFIX_STACK_SEEDS,
    allowedCfg: {
      prompts: ["varied", "identical"]
    },
    estimates: [
      { label: "job count", value: 8, tag: "[FICTION]" },
      { label: "template choice count", value: 2, tag: "[FICTION]" },
      { label: "budgetUsd", value: 0.55, tag: "[FICTION]" },
      {
        label: "cold-open first interaction seconds",
        value: 1.5,
        tag: "[ESTIMATE]"
      }
    ]
  },

  gate: {
    predicateId: "l5-demonstrated-byte-identity",
    evidenceRevealEventIds: ["ev-l5-reveal-tail"],
    postEvidenceActionRequirements: [
      {
        id: "l5-post-evidence-explanation",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "ev-l5-reveal-tail",
        match: { explanationId: "l5-byte-identity" }
      }
    ],
    behavioralRequirements: [
      {
        id: "l5-tail-layout-active",
        kind: "compare",
        path: "cfg.prompts",
        op: "eq",
        value: "identical"
      },
      {
        id: "l5-tail-pointer-active",
        kind: "compare",
        path: "scenario.promptLayout.taskPointerPosition",
        op: "eq",
        value: "tail"
      },
      {
        id: "l5-eight-passing-rows",
        kind: "compare",
        path: "lastRequests.length",
        op: "eq",
        value: 8
      },
      {
        id: "l5-one-write-seven-reads",
        kind: "event-completed",
        eventId: "ev-l5-reveal-tail"
      }
    ],
    explanationRequirement: {
      id: "l5-byte-rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l5-byte-identity",
      observedAfterEventId: "ev-l5-reveal-tail"
    }
  },

  star2: {
    label: "Clean template",
    predicate: {
      id: "l5-single-tail-normalization",
      kind: "compare",
      path: "attemptMetrics.tailNormalizationActions",
      op: "lte",
      value: 1,
      observedAfterEventId: "ev-l5-reveal-tail"
    },
    reason: "Reached the reusable layout with at most one tail-normalization action."
  },
  star3: {
    label: "Byte perfect",
    predicate: {
      id: "l5-byte-perfect",
      kind: "all",
      predicates: [
        {
          id: "l5-cost-at-reference",
          kind: "compare",
          path: "attemptMetrics.passingLedgerUsd",
          op: "lte",
          value: 0.15348645,
          observedAfterEventId: "ev-l5-reveal-tail"
        },
        {
          id: "l5-no-extra-request",
          kind: "compare",
          path: "attemptMetrics.passingRequestCount",
          op: "eq",
          value: 8,
          observedAfterEventId: "ev-l5-reveal-tail"
        }
      ]
    },
    reason: "One write, seven full reads, and no extra request."
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
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  learn: undefined
};
```

`L5_JOB_SEEDS`, `L5_SUBAGENT_CONTEXT_SEEDS`, and `L5_PREFIX_STACK_SEEDS` are level-local `ScenarioData` values containing the eight named jobs, eight isolated subagent contexts sharing `l5-pool`, and the two selectable layouts described above. They do not introduce additional economic constants.

## 6. Pricing walkthrough

All requests use Sonnet and `CACHE_TIER_5M`. Every authored row has `inputTok=0` and `outTok=0`. `PRICE_REQUEST` uses Sonnet’s `$0.30/M` cache-read rate and `$3.75/M` 5-minute-write rate (`C1`, `C3`).

There is one authoritative pricing table:

| Route contribution | Requests | `readTok` | `writeTok` | Calculation | USD |
|---|---|---:|---:|---|---:|
| First request, either layout | `req-*-1` | `0` | `26,237` | `26,237 × 1.25 × $3/M` | `$0.09838875` |
| Tail layout, each warm request | `req-tail-2…8` | `26,237` | `0` | `26,237 × 0.1 × $3/M` | `$0.00787110` |
| Tail layout, seven-read subtotal | `7` requests | `183,659` | `0` | `7 × $0.00787110` | `$0.05509770` |
| **Tail-layout reference total** | `8` requests | `183,659` | `26,237` | first write + seven reads | **`$0.15348645`** |
| Front layout, each varied request | `req-front-2…8` | `11,602` | `14,623` | `(11,602 × 0.1 × $3/M) + (14,623 × 1.25 × $3/M)` | `$0.05831685` |
| Front layout, seven-varied subtotal | `7` requests | `81,214` | `102,361` | `7 × $0.05831685` | `$0.40821795` |
| **Front-layout anti-pattern total** | `8` requests | `81,214` | `128,598` | first write + seven varied requests | **`$0.50660670`** |
| **Reference savings** | same seed and jobs | — | — | `$0.50660670 − $0.15348645` | **`$0.35312025`** |

The identical-prefix count comes from `C10`; the varied read/rewrite split comes from `C11`; identity and invalidation behavior come from `C8` and `C9`. The reference saves `69.70%` of the anti-pattern total.

## 7. Tape sequence

`TapeSpec.rowSource:"lastRequests"`.

`UI_TAPE_RENDERER` uses the canonical `tapeWeight` model, including `outTok × 5` and every other priced bucket. This level’s authoritative requests have `outTok=0`, so no violet segment appears, but output is not removed from the renderer’s geometry.

### Player-chosen front failure group

1. `req-front-1`: red `write`, `26,237` tokens.
2. `req-front-2`: blue `read`, `11,602` tokens; mismatch notch; red `write`, `14,623` tokens.
3. Freeze before jobs 3–8; they are neither priced nor rendered.

The decisive frame synchronizes row 2 with `UI_PREFIX_STACK_VISUALIZER` in diff mode: a caret under the first mismatching greeting token, a red sweep labeled **“14,623 tokens invalidated,”** and the economically true comparison `$0.05831685` versus `$0.00787110`.

### Passing tail group

1. `req-tail-1`: red `write`, `26,237`.
2. `req-tail-2`: blue `read`, `26,237`; this is `ahaRequestId`.
3. `req-tail-3`: blue `read`, `26,237`.
4. `req-tail-4`: blue `read`, `26,237`.
5. `req-tail-5`: blue `read`, `26,237`.
6. `req-tail-6`: blue `read`, `26,237`.
7. `req-tail-7`: blue `read`, `26,237`.
8. `req-tail-8`: blue `read`, `26,237`.

The complete blue run is gated by `l5-tail-result`. After commitment and resolution, the first blue row pulls a ripple through rows 3–8. Reduced-motion mode draws the same final one-red/seven-blue state immediately.

## 8. Prediction prompts

### `l5-front-result`

**Question:** “Your greeting changes from ‘HEY’ to ‘HELLO’ near the front. After job 1 saves context, what will job 2 show?”

- `full-read` — “One full blue read.”
- `partial-rewrite` — “A blue start, then a red rewrite.”
- `full-write` — “One full red rewrite.”

Correctness remains visually neutral until `req-front-2` resolves. Correct option: `partial-rewrite`.

Post-reveal explanation: **“The first mismatch preserved 11,602 earlier tokens but invalidated the 14,623-token suffix.”** (`C11`)

### `l5-tail-result`

**Question:** “The changing job words are at the tail. After the first red write, what will jobs 2–8 show?”

- `seven-full-reads` — “Seven full blue reads.”
- `seven-partial` — “Seven blue-and-red splits.”
- `seven-writes` — “Seven red rewrites.”

Correctness remains visually neutral until all eight requests resolve. Correct option: `seven-full-reads`.

Post-reveal explanation: **“The shared 26,237-token prefix stayed byte-identical, so every later warm spawn read it.”** (`C8`, `C10`)

Neither prediction option, prediction correctness, nor `COMMIT_PREDICTION` is gate or star evidence.

### Post-evidence explanation choice

Shown only after `ev-l5-reveal-tail`:

**Question:** “What made the seven blue reads possible?”

- `l5-byte-identity` — “The bytes before TASK stayed identical.”
- `l5-tier-ignores-words` — “The five-minute tier ignores wording changes.”
- `l5-agents-share-everything` — “Subagents automatically share all context.”

The first option dispatches the gate-qualifying `ACK_EXPLANATION`. Wrong explanation choices remain retryable and never affect prediction scoring.

## 9. Fail-state

- **Reachability:** only the player’s explicit greeting-first selection can reach this failure.
- **Failure rule ID:** `l5-early-mismatch`
- **Decisive event:** resolution of `req-front-2` at `ev-l5-reveal-front`.
- **Failure predicate:** the selected layout is `front`, the first mismatch is the greeting token, and `invalidatedSuffixTok == 14,623`.
- **Actual decisive-request cost:** `$0.05831685`.
- **Valid tail-layout alternative:** `$0.00787110`.
- **Visible margin:** `$0.05044575`; the punished request is `7.41×` the valid alternative (`C1`, `C3`, `C10`, `C11`).
- **Freeze target:** request 2’s mismatch marker, red suffix, comparison chip, `Wallet`, and `Clock`.
- **One-line causal message:** **“‘HELLO’ mismatched near the front. Job 2 rewrote 14,623 tokens and cost 7.41× a full warm read.”**
- **Rewind control label:** **“Move the word”**
- **Rewind behavior:** `REWIND_TO_CHECKPOINT("l5-before-run")`; remove the two failed-run ledger rows and cache mutation, restore `$0.55`, preserve the completed prediction, and focus the selected template editor. The cold-open and template choice do not replay.

## 10. Gate & stars

`pass(st)` returns true only when all are demonstrated:

- The completed layout has `taskPointerPosition:"tail"` and `cfg.prompts=="identical"`.
- The passing attempt produced exactly eight `LedgerRow` objects.
- Passing row 1 has `writeTok=26,237`.
- Passing rows 2–8 each have `readTok=26,237` and `writeTok=0`.
- After `ev-l5-reveal-tail`, the player dispatched `ACK_EXPLANATION { explanationId:"l5-byte-identity" }`.
- No requirement inspects either prediction’s selected option or correctness.
- No requirement depends on budget alone.

The post-evidence explanation action is mandatory even when the player selected the tail layout initially. On the front route, `NORMALIZE_PROMPTS` after `ev-l5-reveal-front` supplies additional remediation evidence but does not replace the post-tail explanation requirement.

Stars:

- **1 star:** behavioral gate passes.
- **2 stars — Clean template:** pass with at most one tail-normalization action in the passing attempt.
- **3 stars — Byte perfect:** 2 stars, passing spend `≤ $0.15348645`, exactly one write, seven full reads, and no extra request.

Result copy:

- Pass headline: **“Eight jobs. One reusable front.”**
- Fail headline: **“The changing word is still breaking the prefix.”**
- Evidence: **“1 write · 7 reads · $0.15348645”**
- Continue: **“Next level”**
- Retry: **“Try another layout”**

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `l5-template-chosen` | Player dispatches the initial `NORMALIZE_PROMPTS` | **“Template locked. Now predict what job 2 will reuse.”** |
| `l5-first-write` | `req-front-1` or `req-tail-1` creates the shared entry | **“First agent saved 26,237 tokens. WRITE · $0.0984.”** |
| `l5-first-mismatch` | `req-front-2` resolves with `invalidatedSuffixTok=14,623` | **“First mismatch: job 2 cost 7.41× a full warm read.”** |
| `l5-byte-identical` | First tail-layout full read resolves | **“Byte-identical: every saved byte before TASK matched.”** |
| `l5-seven-reads` | Passing request 8 settles | **“Seven warm agents reused the full 26,237-token prefix.”** |
| `l5-savings` | Counterfactual reveal opens | **“Moving the variation saved $0.35312025 across eight jobs.”** |

`l5-first-mismatch` is assertive and persistent during freeze. All other toasts use polite announcements and dedupe per attempt.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. No layout is preselected, and the job queue cannot run until the player explicitly dispatches `NORMALIZE_PROMPTS`.
2. Both front and tail template cards are operable through pointer and keyboard paths and dispatch equivalent actions.
3. No correct layout, cache color, reusable boundary, suffix count, price comparison, or savings delta appears before the relevant committed prediction and request resolution.
4. Choosing the front card is the action that makes `l5-early-mismatch` reachable; the failure is neither scripted nor unavoidable.
5. Choosing the tail card initially bypasses the failure and remains winnable.
6. A reveal cannot execute before its corresponding prediction is committed.
7. A wrong prediction changes no score, stars, wallet, failure predicate, or gate result.
8. The front path renders exactly two priced requests, two ledger rows, and two tape rows before freezing.
9. `req-front-2` reports `readTok=11,602`, `writeTok=14,623`, and exactly `$0.05831685` (`C11`, `C1`, `C3`).
10. The frozen frame visibly compares `$0.05831685` with the valid `$0.00787110` full-read alternative; `actualUsd > validAlternativeUsd`.
11. Failure freezes before request 3 and exposes **Move the word** immediately.
12. Rewind restores the checkpoint hash, `$0.55` wallet, empty ledger, editable front layout, and already committed front prediction.
13. The post-failure tail normalization occurs after `ev-l5-reveal-front`.
14. Passing produces exactly eight requests, eight ledger rows, and eight tape rows in the specified order.
15. Passing row 1 writes `26,237`; rows 2–8 each read `26,237` and write `0` (`C10`).
16. Every request yields exactly one ledger row and one tape row.
17. Every request cost is positive; no positive price displays as `$0.0000`.
18. Every ledger cost matches `PRICE_REQUEST` without internal rounding.
19. The reference run totals `$0.15348645`; the anti-pattern totals `$0.50660670`; no competing total or price table exists.
20. The passing tape visibly contains one red row followed by seven blue rows without hover.
21. `UI_TAPE_RENDERER` width and segment geometry use the canonical model containing `readTok`, `inputTok`, `writeTok`, and `outTok × 5`; this level’s zero output does not alter that contract.
22. Hover and keyboard focus expose every non-zero bucket equation through `UI_HOVER_PRICE_CALCULATOR`.
23. `CacheEntry.lastTouchMin` refreshes on each of the seven reads (`C12`); all eight requests remain within `5m` (`C1`, `C27`).
24. The gate observes `ACK_EXPLANATION("l5-byte-identity")` after `ev-l5-reveal-tail`; no pre-reveal prediction field appears in `pass(st)`, a star predicate, or a failure rule.
25. A wrong post-evidence explanation remains retryable without spending wallet or deducting score.
26. Star 3 uses `≤ $0.15348645`, not floating-point equality.
27. The fixed seed and `referenceCfg` pass; `antiCfg` reaches the economically true front-mismatch failure and fails the behavioral gate.
28. Reduced-motion mode shows the same mismatch evidence, comparison prices, final colors, and gate result.
29. The post-attempt `CounterfactualOverlay` remains absent until a meaningful attempt completes.
30. Replay from the same seed and ordered actions yields byte-identical state, ledger, wallet, and result.
31. The level is winnable using only the documented template cards, prediction controls, run control, explanation choice, and rewind control.

## 13. Reference-bar justification

The screen puts a plausible dispatch choice under the cursor within `1.5s` and makes the player own the layout before any jobs queue. The greeting-first option is not a disguised failure button: it is a natural human-readable template whose one-word variation has an unrevealed cache consequence. Prediction locks curiosity in place; the chosen request then exposes the mismatch at the exact red suffix and freezes only when the ledger proves the route costs `7.41×` the valid warm alternative.

Rewind returns directly to the chosen template, and one tactile remediation moves the changing words without replaying mastered setup. A player who chose the tail initially reaches the same evidence without an artificial failure. In both routes, completion still requires a post-evidence causal explanation, so prediction correctness is never punitive and the gate measures demonstrated understanding. Only after the attempt does the full `$0.35312025` counterfactual quantify the transferable rule.

Assumption: the eight task labels, two presentation choices, and `$0.55` wallet are level fixtures marked `[FICTION]`; the `1.5s` opening target is `[ESTIMATE]`. Token counts, pricing, identity, invalidation, TTL behavior, and all computed costs trace to `C1`, `C3`, and `C8–C12`.
