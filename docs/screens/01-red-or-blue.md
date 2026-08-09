# Level 1 — Red or Blue?

## 1. Identity

- `id`: `L1`
- `title`: `Red or Blue?`
- `tier`: `1`
- `objective`: “Send three small coding requests without draining Bob’s $0.30 wallet.”
- ONE concept: Reusing an unchanged context converts a costly first `RATE_CACHE_WRITE_1H` into a cheaper `RATE_CACHE_READ`.
- Prerequisite concept: none. `Token` is introduced in context after the first send.
- `concept.id`: `cache-write-becomes-read`
- `concept.privateDesignerSummary`: Reusing the same `MAIN_SESSION_CONTEXT` makes its saved prefix a read on later requests.
- `concept.postRevealRule`: “The expensive part was the saved context, not the new sentence.”

## 2. Objects used

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
- `RESOLVE_PREFIX`
- `PRICE_REQUEST`
- `ReducerState`
- `TapeRenderer`
- `MainCachePanel`
- `HoverPriceCalculator`
- `ToastSystem`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `ResultScreen`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction appears by `1s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Show Bob’s task card, an empty `TapeRenderer`, `MainCachePanel`, and `Wallet` at **$0.30** `[FICTION]`. |
| `0.3s` | Bob: “Login is broken. Ask Claude to fix it?” |
| `0.8s` | Primary control appears: **Send**. No rate table, explanation, comparison, or color legend is visible. |
| Player click | Request `l1-r1` launches. Its final red bar renders immediately, and the wallet counts down to **$0.089736**. |
| After settle | Toast: “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `+1.2s` `[ESTIMATE]` | Bob replaces the task text with: “Add the matching logout route.” |
| Second click | Request `l1-r2` renders blue; wallet moves only to **$0.077473**. |
| After settle | Toast: “Same saved context. **READ · $0.012263**.” |
| `+0.8s` `[ESTIMATE]` | Third card appears: “Add a test for both routes.” The **Send** control becomes **Predict, then send**. |

The words “write” and “token” first appear after `l1-r1`; “read” first appears after `l1-r2`.

## 4. Exact event sequence

All `PrefixBlock` hashes except `PB_CURRENT` remain byte-identical across the reference sequence. The cacheable prefix totals `34,738` tokens (`C6`); each request’s tiny current sentence and output fixture are `[FICTION]`.

1. **Enter level**
   - Event: route opens `L1`.
   - Action: `ENTER_LEVEL { levelId: "L1" }`.
   - Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, empty ledger and tape.
   - Numbers: wallet `$0.30` `[FICTION]`; clock `0m`; prefix `34,738 tok` (`C6`).
   - Copy: “Login is broken. Ask Claude to fix it?”

2. **Establish the failure rewind point**
   - Event: first **Send** gains focus.
   - Action: `CREATE_CHECKPOINT { checkpointId: "l1-before-first-send", reason: "unit-start" }`.
   - Mutates: `Checkpoint[]` only.
   - Numbers: no economic mutation.

3. **First send**
   - Event: player clicks **Send** for “Fix the login route.”
   - Action: `SEND_REQUEST { request: l1-r1 }`.
   - Mutates: `CacheEntry`, `MainCachePanel`, `LedgerRow[]`, `lastRequests`, `Wallet`, and the `TapeRenderer` payload.
   - Resolution: `readTok=0`, `inputTok=12`, `writeTok=34,738`, `outTok=120`, `cold=true`.
   - Numbers: write `$0.208428`; input `$0.000036`; output `$0.001800`; total `$0.210264`; wallet `$0.300000 → $0.089736` (`C1`, `C3`, `C6`; `12/120 tok` `[FICTION]`).
   - Render: large red write segment plus output evidence; no answer about later sends is shown.

4. **Second send**
   - Event: player clicks **Send** for “Add the matching logout route.”
   - Action: `SEND_REQUEST { request: l1-r2 }`.
   - Mutates: existing `CacheEntry.lastTouchMin`, `CacheEntry.expiresAtMin`, `LedgerRow[]`, `lastRequests`, `Wallet`, and tape.
   - Resolution: `readTok=34,738`, `inputTok=14`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Numbers: read `$0.0104214`; input `$0.000042`; output `$0.001800`; total `$0.0122634`; wallet `$0.089736 → $0.0774726` (`C1`, `C3`, `C6`, `C12`; `14/120 tok` `[FICTION]`).
   - Render: a narrow blue read row. Only now may the UI say that the same context was reused.

5. **Checkpoint before the transferable prediction**
   - Event: third task becomes visible.
   - Action: `CREATE_CHECKPOINT { checkpointId: "l1-before-third-prediction", reason: "prediction" }`.
   - Mutates: `Checkpoint[]` only.
   - Numbers: ledger remains at two rows; wallet remains `$0.0774726`.

6. **Open prediction**
   - Event: player clicks **Predict, then send**.
   - Action: `OPEN_PREDICTION { promptId: "l1-third-color-cost" }`.
   - Mutates: `phase="predict"` and `prediction`.
   - Numbers: no request, ledger row, cache touch, or wallet change.

7. **Commit prediction**
   - Event: player selects an option and clicks **Lock prediction**.
   - Actions, in order:
     - `SELECT_PREDICTION { promptId: "l1-third-color-cost", optionId }`
     - `COMMIT_PREDICTION { promptId: "l1-third-color-cost" }`
   - Mutates: `prediction.optionId`, then `prediction.committed=true`.
   - Numbers: third send remains impossible until commitment.

8. **Reference third send — aha frame**
   - Event: committed player clicks **Send** for “Add a test for both routes.”
   - Action: `SEND_REQUEST { request: l1-r3 }`.
   - Mutates: existing `CacheEntry`, `LedgerRow[]`, `lastRequests`, `Wallet`, tape.
   - Resolution: `readTok=34,738`, `inputTok=13`, `writeTok=0`, `outTok=120`, `cold=false`.
   - Numbers: read `$0.0104214`; input `$0.000039`; output `$0.001800`; total `$0.0122604`; wallet `$0.0774726 → $0.0652122` (`C1`, `C3`, `C6`, `C12`; `13/120 tok` `[FICTION]`).
   - Render: third row settles blue beside the differently worded sentence. This is the aha frame.

9. **Reveal prediction**
   - Event: third tape row finishes settling.
   - Action: `REVEAL_PREDICTION { promptId: "l1-third-color-cost", correctOptionId: "blue-about-1-cent" }`.
   - Mutates: `prediction.correctOptionId`, `prediction.revealed=true`, `phase="reveal"`.
   - Copy: “The sentence was new. The **34,738-token context** was already saved.”

10. **Acknowledge the discovered rule**
    - Event: player clicks **Got it**.
    - Action: `ACK_EXPLANATION { explanationId: "l1-context-not-sentence" }`.
    - Mutates: explanation evidence and `phase`.
    - Copy: “The expensive part was the saved context, not the new sentence.”

11. **Complete reference attempt**
    - Event: post-reveal evidence is visible.
    - Action: `COMPLETE_ATTEMPT`.
    - Mutates: gate result, stars, `phase="result"`, and `ResultScreen`.
    - Numbers: three rows; total `$0.2347878`; wallet `$0.0652122`.

12. **Anti-pattern branch: discard before the third request**
    - Event: on retry/counterfactual branch, player clicks **Discard session** after `l1-r2`.
    - Action: `DISCARD_CONTEXT { contextId: "l1-main" }`.
    - Mutates: invalidates the named `MAIN_SESSION_CONTEXT` cache namespace; `MainCachePanel` becomes cleared.
    - Numbers: no ledger row and no immediate wallet change.

13. **Anti-pattern third send**
    - Event: after committing the same prediction prompt, player sends `l1-r3`.
    - Action: `SEND_REQUEST { request: l1-r3-discarded }`.
    - Mutates: new `CacheEntry`, `LedgerRow[]`, `lastRequests`, `Wallet`, tape.
    - Resolution: `readTok=0`, `inputTok=13`, `writeTok=34,738`, `outTok=120`, `cold=true`.
    - Numbers: total `$0.210267`; wallet `$0.0774726 → -$0.1327944`; anti-pattern three-request total `$0.4327944` (`C1`, `C3`, `C6`; `13/120 tok` `[FICTION]`).
    - Render: third row turns red and the wallet crosses zero.

14. **Freeze failure**
    - Event: the red row and negative wallet become visible.
    - Action: `FREEZE_FAILURE { failure: { failureId: "l1-discard-rewrite", causeCode: "CONTEXT_DISCARDED", message: "You discarded the saved context, so 34,738 tokens had to be written again.", checkpointId: "l1-before-third-prediction" } }`.
    - Mutates: `clock.frozen=true`, `frozenFailure`; blocks further economic actions.
    - Highlight: cleared `MainCachePanel`, red `l1-r3-discarded`, and wallet `-$0.1327944`.

15. **Rewind**
    - Event: player clicks **Undo discard**.
    - Action: `REWIND_TO_CHECKPOINT { checkpointId: "l1-before-third-prediction" }`.
    - Mutates: deterministic branch replay; restores the live `CacheEntry`, two-row ledger, wallet `$0.0774726`, and unopened prediction.
    - Numbers: no replayed intro and no duplicate ledger rows.

## 5. Level data

```ts
const L1: LevelDef = {
  id: "L1",
  tier: 1,
  title: "Red or Blue?",
  objective: "Send three small coding requests without draining Bob’s $0.30 wallet.",
  concept: {
    id: "cache-write-becomes-read",
    privateDesignerSummary:
      "Reusing the same main-session context converts the saved prefix from a 1h write to a read.",
    postRevealRule:
      "The expensive part was the saved context, not the new sentence."
  },
  prerequisiteConceptIds: [],

  unlocks: "run",
  introducedControls: ["run"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "oneHourFlag", "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
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
      { label: "r1 fresh input", value: 12, tag: "[FICTION]" },
      { label: "r2 fresh input", value: 14, tag: "[FICTION]" },
      { label: "r3 fresh input", value: 13, tag: "[FICTION]" },
      { label: "output tokens per request", value: 120, tag: "[FICTION]" },
      { label: "cold-open first interaction", value: 1, tag: "[ESTIMATE]" }
    ]
  },

  coldOpen: "as specified in §3",
  sequence: "as specified in §4",
  predictions: ["l1-third-color-cost"],
  toasts: [
    "l1-first-write", "l1-first-read", "l1-third-reveal",
    "l1-discarded", "l1-frozen"
  ],
  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_JUST_IN_TIME_TOAST",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT"
  ],

  failLesson: {
    bucket: "none",
    cite: "C6",
    line: "Discarding the session removed the reusable context, so the next request rewrote 34,738 tokens."
  },
  failureRules: ["l1-discard-rewrite"],
  checkpoints: [
    "l1-before-first-send",
    "l1-before-third-prediction"
  ],

  gate: {
    predicateId: "l1-demonstrated-reuse",
    behavioralRequirements: [
      "prediction l1-third-color-cost committed before l1-r3",
      "committed option is blue-about-1-cent",
      "l1-r3 resolves with readTok=34738 and writeTok=0",
      "three requests complete in one MAIN_SESSION_CONTEXT"
    ],
    explanationRequirement:
      "l1-context-not-sentence acknowledged after reveal"
  },
  pass: "pure predicate specified in §10",
  star2: {
    label: "Called the color",
    predicate: "prediction correct and no DISCARD_CONTEXT action",
    reason: "Predicted the third request would reuse saved context."
  },
  star3: {
    label: "Three in a row",
    predicate:
      "exactly one cold write, two reads, total spend <= 0.2347878, and no rewind",
    reason: "Kept one session alive for all three requests."
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
  counterfactuals: ["l1-discard-before-third"],

  tape: "as specified in §7",
  result: "as specified in §10",
  vocabulary: ["token", "write", "read"],
  qa: "as specified in §12"
};
```

`seed: 1001`, the three current-sentence sizes, output sizes, budget, timings, and fixture IDs are deterministic level fixtures `[FICTION]`; the shared prefix and pricing rates are grounded in `C1`, `C3`, and `C6`.

## 6. Pricing walkthrough

Model: Sonnet. `RATE_CACHE_WRITE_1H=$6/M`, `RATE_CACHE_READ=$0.30/M`, fresh input `$3/M`, and output `$15/M` (`C1`, `C3`). The reusable main prefix is `34,738 tok` (`C6`).

| Request | Wire buckets | Calculation | Cost |
|---|---|---:|---:|
| `l1-r1` | `0 read + 12 input + 34,738 write + 120 output` | `0 + 12×3/M + 34,738×6/M + 120×15/M` | `$0.210264` |
| `l1-r2` | `34,738 read + 14 input + 0 write + 120 output` | `34,738×0.30/M + 14×3/M + 120×15/M` | `$0.0122634` |
| `l1-r3` | `34,738 read + 13 input + 0 write + 120 output` | `34,738×0.30/M + 13×3/M + 120×15/M` | `$0.0122604` |

Three-star reference total:

```text
$0.210264 + $0.0122634 + $0.0122604 = $0.2347878
wallet remaining = $0.3000000 - $0.2347878 = $0.0652122
```

Anti-pattern total when the session is discarded before request three:

```text
l1-r3-discarded
= 13×$3/M + 34,738×$6/M + 120×$15/M
= $0.210267

anti total
= $0.210264 + $0.0122634 + $0.210267
= $0.4327944

wallet remaining
= $0.3000000 - $0.4327944
= -$0.1327944
```

The post-attempt comparison may show the `20x` 1-hour-write-to-read input-side rate ratio (`C5`); it must not appear before the third prediction.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"` and `hoverEnabled = true`.

1. Reveal group `l1-first`:
   - `l1-r1`
   - ordered segments: `write(34,738)`, `input(12)`, `output(120)`
   - label: `Fix login`
2. Reveal group `l1-second`:
   - `l1-r2`
   - ordered segments: `read(34,738)`, `input(14)`, `output(120)`
   - label: `Add logout`
3. Reveal group `l1-third`:
   - `l1-r3`
   - `gatedByPredictionId: "l1-third-color-cost"`
   - ordered segments: `read(34,738)`, `input(13)`, `output(120)`
   - label: `Test both`
4. Anti-pattern branch replaces only the third request:
   - `l1-r3-discarded`
   - ordered segments: `write(34,738)`, `input(13)`, `output(120)`

`ahaRequestId: "l1-r3"`.

Aha frame: three settled rows remain visible together; row one is dominated by red, rows two and three by blue, while the three current-sentence labels visibly differ. The caption appears only after `REVEAL_PREDICTION`: “Three different requests. One saved context.”

`HoverPriceCalculator` shows all nonzero buckets and their exact unrounded contribution. Static final bars must render before hover.

## 8. Prediction prompt

### `l1-third-color-cost`

Question:

> “Before you send it: what color will most of the third request be, and about what will it cost?”

Options:

- `blue-about-1-cent`: “Blue — about 1¢”
- `red-about-21-cents`: “Red — about 21¢”
- `violet-about-2-cents`: “Violet — about 2¢”

Button copy before selection: **Choose one**  
Button copy after selection: **Lock prediction**  
Post-commit send copy: **Send and find out**

The widget displays no correctness treatment until `l1-r3` has been priced and rendered. Keyboard selection and pointer selection dispatch the same actions.

## 9. Fail-state

- Decisive event: `l1-r3-discarded` is priced after `DISCARD_CONTEXT`.
- Freeze frame: cleared `MainCachePanel`; third bar fully red; wallet at `-$0.1327944`; prior blue row remains visible.
- Causal message: **“You discarded the saved context, so 34,738 tokens had to be written again.”**
- Supporting line: “The new test sentence was only 13 tokens `[FICTION]`; the rewritten context caused the drop.”
- Rewind control: **Undo discard**
- Rewind target: `l1-before-third-prediction`
- Restored state: live cache, two ledger rows, `$0.0774726`, third task ready, prediction uncommitted.
- No introduction, first write, or second send is replayed.
- Freeze blocks **Send**, **Discard session**, and all other economic actions until rewind.

## 10. Gate & stars

Behavioral pass predicate:

```ts
pass =
  prediction("l1-third-color-cost").committed &&
  prediction("l1-third-color-cost").optionId === "blue-about-1-cent" &&
  request("l1-r3").readTok === 34_738 &&
  request("l1-r3").writeTok === 0 &&
  completedRequestCount === 3 &&
  contextIdsUsed.deepEqual(["l1-main"]) &&
  explanationSeen("l1-context-not-sentence");
```

Failure reason when false:

> “Predict the third request, then prove it by reusing the same session.”

Evidence on pass:

- “Prediction locked before send: **Blue — about 1¢**.”
- “Third request: **34,738 read · 0 written**.”
- “Cold writes: **1 of 3 requests**.”

Stars:

- **1 star — Saw it happen:** behavioral pass predicate succeeds.
- **2 stars — Called the color:** pass, correct prediction, and no `DISCARD_CONTEXT`.
- **3 stars — Three in a row:** two-star predicate, exactly one cold write and two reads, no rewind, and spend `≤ $0.2347878`.

Reference configuration produces three stars from seed `1001`. The anti-pattern discards before request three, produces two cold writes, spends `$0.4327944`, and fails the behavioral predicate even if its budget were increased.

Result copy:

- Pass headline: **“You called it.”**
- Pass rule: **“The expensive part was the saved context, not the new sentence.”**
- Fail headline: **“The third request rebuilt the context.”**
- Continue: **Next level**
- Retry: **Try the third request again**

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `l1-first-write` | `l1-r1` settles | “First request: Claude saved **34,738 tokens** of context. **WRITE · $0.210264**.” |
| `l1-first-read` | `l1-r2` settles | “Same saved context. **READ · $0.012263**.” |
| `l1-third-reveal` | `REVEAL_PREDICTION` after `l1-r3` | “Three different requests. One saved context.” |
| `l1-discarded` | `DISCARD_CONTEXT` | “Session discarded. Saved context cleared.” |
| `l1-frozen` | `FREEZE_FAILURE` | “That cleared context had to be written again.” |

Vocabulary timing:

- `token`: first needed at `l1-r1`; definition: “A small chunk of text you’re billed for.”
- `write`: first needed at `l1-r1`; attached to `l1-first-write`.
- `read`: first needed at `l1-r2`; attached to `l1-first-read`.
- TTL copy is withheld; expiry is not this level’s concept.

## 12. QA gate

Real-browser click-through assertions:

1. Within `2s` `[ESTIMATE]`, **Send** is keyboard- and pointer-operable; no instruction card blocks it.
2. Before `l1-r1`, no copy reveals that later requests will be blue, cheaper, cached, or reused.
3. Clicking first **Send** dispatches one `SEND_REQUEST`, creates one `LedgerRow`, one tape row, and one `CacheEntry`.
4. `l1-r1` prices to exactly `$0.210264` from `C1`, `C3`, and `C6`.
5. Clicking second **Send** adds exactly one row; `l1-r2` prices to `$0.0122634`.
6. The third `SEND_REQUEST` cannot dispatch before `COMMIT_PREDICTION`.
7. Selection alone does not unlock sending; commitment does.
8. Reference `l1-r3` prices to `$0.0122604`, reads `34,738`, writes `0`, and refreshes the live `CacheEntry` (`C12`).
9. `REVEAL_PREDICTION` cannot dispatch before both commitment and the priced third row.
10. Each priced request maps to exactly one ledger row and one tape row; `DISCARD_CONTEXT` maps to neither.
11. Every real request cost is positive and equals `PRICE_REQUEST`.
12. No positive price displays as `$0.0000`; detailed hover values retain sufficient precision.
13. Static final tape bars render without hover and preserve ledger order.
14. `TapeRenderer` segments equal the priced request buckets; no decorative segment is counted as a request.
15. Output costs remain available in `HoverPriceCalculator` even if output width is visually deemphasized.
16. Discarding after `l1-r2` visibly clears `MainCachePanel` without changing the wallet.
17. Sending after discard produces the red `$0.210267` request, negative wallet, and immediate causal freeze.
18. Freeze occurs only after the decisive red row and wallet consequence are visible.
19. **Undo discard** restores the checkpoint byte-identically: two rows, `$0.0774726`, live cache, no committed prediction.
20. Rewind creates no duplicate ledger rows and does not replay either mastered send.
21. Reference seed/configuration is winnable and earns three stars.
22. Anti-pattern seed/configuration fails the behavioral gate independently of budget.
23. Pointer and keyboard paths produce equivalent `Action[]`.
24. Reduced-motion mode produces identical final state, tape, pricing, reveal order, and gate evidence.
25. Refresh/replay from seed `1001` and the saved `Action[]` reproduces byte-identical state.

## 13. Reference-bar justification

The screen puts one inviting control under the cursor immediately, lets the player feel a dramatic red wallet hit, then contrasts it with a surprisingly small blue hit without explaining the cause beforehand. The third request converts observation into a committed prediction; only the resulting tape reveals whether the player’s model is right. The discard branch makes the causal dependency tactile, freezes at the exact costly consequence, and rewinds to the last meaningful choice in one click. That sequence—act, notice, predict, reveal, perturb, recover—delivers one discovery with the immediacy and restraint expected of the reference bar.

Assumption: the level uses the measured `34,738`-token main prefix (`C6`) instead of the plan’s uncited `22,527`-token draft figure, so every economic claim traces to the canonical constants. Tiny request and output counts, wallet, seed, and presentation timings are explicitly tagged `[FICTION]` or `[ESTIMATE]`.
