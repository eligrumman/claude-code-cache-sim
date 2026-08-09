# Level 4 — The Five-Minute Race

## 1. Identity

- **id:** `L4`
- **title:** The Five-Minute Race
- **tier:** `1`
- **objective:** “Eight jobs are queued. Choose how many launch together, then beat the clock.”
- **one concept:** Short-lived shared subagent prefixes reward completing fan-out in fewer serial waves.
- **prerequisites:** TTL expiry and unchanged-prefix reuse.
- **designer-only threshold:** at most `WARM_WAVES = 3` serial waves (`C27`). Never expose this number before the first completed attempt.
- **post-reveal rule:** “More jobs at once can cost less when it keeps the shared prefix inside its five-minute window.”

## 2. Objects used

- `SUBAGENT_CONTEXT`
- `Request`
- `PricedRequest`
- `PREFIX_STACK`
- `CacheEntry`
- `CACHE_TIER_5M`
- `Clock`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Budget`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`
- `PATTERN_EXPLAIN_THEN_TRANSFER`

## 3. Cold-open / narrative

No instruction card.

| Time | Beat |
|---:|---|
| `0.0s` | Eight face-down job cards snap into a queue beneath the copy: **“Eight jobs. One shared setup. The clock starts when the first job leaves.”** |
| `0.4s` | `UI_TTL_DRAIN_BAR` appears undrained and unlabeled with a `5:00` clock. Do not show a safe wave count or a recommended width. |
| `0.8s` | A single width control appears: **“Launch together: 1 2 3 4 5 6 7 8”**. Default is `1`; focus lands on the control. |
| `1.2s` | Secondary copy: **“Pick a width. The rest wait for the next wave.”** |
| `≤2.0s` | Player can change width. Each change groups the eight cards visually but does not run or price anything. |
| first width change | Button copy becomes **“Lock prediction”**; no tape colors or dollar comparison are visible. |

The title, queue layout, clock, and control must not reveal that three waves is the boundary.

## 4. Exact event sequence

Wave starts are `0:00`, `2:00`, `4:00`, and `6:00` for the first four serial waves (`[FICTION]`, chosen to expose the measured five-minute behavior in `C27`). Jobs in one wave share its start time.

1. **Enter level**
   - Event: route opens `L4`.
   - Action: `ENTER_LEVEL { levelId: "L4" }`.
   - Mutates: `ReducerState`, `Clock`, `Wallet`, `Budget`, eight queued units, eight `SUBAGENT_CONTEXT` instances, and the shared `PREFIX_STACK`.
   - Numbers: `clockMin=0`, `budgetUsd=6.00` `[FICTION]`, `BASE_IDENTICAL=26,237 tok` (`C10`), subagent TTL `5m` (`C1`, `C27`).

2. **Create the launch checkpoint**
   - Event: first width interaction.
   - Action: `CREATE_CHECKPOINT { checkpointId: "L4-before-width", reason: "decision" }`.
   - Mutates: `checkpoints`.
   - Numbers: one checkpoint; zero requests and `$0` spent.

3. **Group the queue**
   - Event: player selects width `w`.
   - Action: `SET_FANOUT_WIDTH { width: w }`.
   - Mutates: `cfg.width` and deterministic wave grouping only.
   - Numbers: `w ∈ {1…8}`; `waveCount=ceil(8/w)` (`8` jobs, `[FICTION]` scenario count). Do not display the pass boundary.

4. **Open prediction**
   - Event: player presses **“Lock prediction”**.
   - Action: `OPEN_PREDICTION { promptId: "L4-last-jobs-color" }`.
   - Mutates: `phase`, `prediction`.
   - Numbers: zero clock or economic change.

5. **Commit prediction**
   - Event: player selects an option and presses **“Commit & launch”**.
   - Actions:
     1. `SELECT_PREDICTION { promptId: "L4-last-jobs-color", optionId }`
     2. `COMMIT_PREDICTION { promptId: "L4-last-jobs-color" }`
   - Mutates: `prediction`.
   - Numbers: zero clock or economic change; launch remains impossible before commitment.

6. **Launch wave 1**
   - Event: committed launch.
   - For each job in wave 1: `SEND_REQUEST { request: jobNRequest }`.
   - Mutates: corresponding `Request`, shared `CacheEntry`, `LedgerRow`, `lastRequests`, `Wallet`, and tape payload.
   - Numbers:
     - First resolver: `writeTok=26,237` (`C10`), `inputTok=6,000`, `outTok=44,000` (`C28`), `sentAtMin=0`, `writeTier="5m"`.
     - Remaining simultaneous jobs resolve the live shared prefix as `readTok=26,237` (`C10`).
     - First-job cost: `$0.76438875`; warm-job cost: `$0.67387110` (`C1`, `C3`, `C10`, `C28`).

7. **Advance to each later wave**
   - Event: queued jobs remain after a wave.
   - Action: `ADVANCE { min: 2 }`.
   - Mutates: `Clock` and `UI_TTL_DRAIN_BAR`; no ledger row.
   - Numbers: wave starts advance `0→2→4→6` minutes (`[FICTION]`); shared-prefix expiry evidence remains anchored at `5:00` for the race scenario (`C1`, `C27`).

8. **Launch a wave at `2:00` or `4:00`**
   - Event: next wave arrives before expiry.
   - Action: one `SEND_REQUEST` per job in that wave.
   - Mutates: `Request`, `CacheEntry`, `LedgerRow`, `Wallet`, and tape.
   - Numbers per job: `readTok=26,237`, `inputTok=6,000`, `outTok=44,000`; `$0.67387110` (`C1`, `C3`, `C10`, `C28`).

9. **First late-wave failure**
   - Event: with `width=1`, Job 4 reaches the wire at `6:00`.
   - Actions:
     1. `ADVANCE { min: 2 }`
     2. `SEND_REQUEST { request: job4Request }`
     3. `FREEZE_FAILURE { failure: { failureId: "L4-late-wave", causeCode: "SHARED_PREFIX_EXPIRED", message: "Job 4 arrived at 6:00; shared prefix expired at 5:00.", checkpointId: "L4-before-width" } }`
   - Mutates: expired `CacheEntry` evidence, Job 4 `LedgerRow`, `Wallet`, `Clock.frozen`, and `frozenFailure`.
   - Numbers: Job 4 becomes `writeTok=26,237`, `inputTok=6,000`, `outTok=44,000`, costing `$0.76438875` (`C1`, `C3`, `C10`, `C28`).
   - Freeze after the red rewrite is visible, before Job 5 can launch.

10. **Rewind**
    - Event: player presses **“Regroup the jobs”**.
    - Action: `REWIND_TO_CHECKPOINT { checkpointId: "L4-before-width" }`.
    - Mutates: deterministic attempt branch, queue, clock, cache, ledger, wallet, and failure state.
    - Numbers: restored to `0:00`, eight queued jobs, zero spend; the cold-open and committed first prediction remain mastered.

11. **Successful run**
    - Event: player selects a width producing no more than three waves, commits any newly required prediction, and launches.
    - Actions: `SET_FANOUT_WIDTH`, then the same `ADVANCE`/`SEND_REQUEST` sequence.
    - Mutates: all eight jobs complete; ledger contains eight rows; no `frozenFailure`.
    - Numbers: exactly one cold write and seven reads; total `$5.48148645` (`C1`, `C3`, `C10`, `C28`).

12. **Reveal the prediction**
    - Event: eighth job completes.
    - Action: `REVEAL_PREDICTION { promptId: "L4-last-jobs-color", correctOptionId: "mostly-blue" }`.
    - Mutates: `prediction.revealed`, `phase`.
    - Numbers: one red shared-prefix write and seven blue shared-prefix reads.

13. **Commit the causal explanation**
    - Event: player answers **“What changed the price?”**
    - Action: `ACK_EXPLANATION { explanationId: "L4-fewer-waves-fit-window" }`.
    - Mutates: explanation evidence.
    - Correct copy: **“The wider launch used fewer serial waves, so the later jobs reached the shared prefix before it expired.”**

14. **Predict the counterfactual**
    - Event: after the successful attempt, player requests comparison.
    - Actions: `OPEN_PREDICTION`, `SELECT_PREDICTION`, and `COMMIT_PREDICTION` for `"L4-narrower-cost"`.
    - Mutates: second `prediction`.
    - Numbers: no economic mutation.

15. **Reveal the counterfactual**
    - Event: second prediction is committed.
    - Actions:
      1. `REQUEST_COUNTERFACTUAL { comparisonId: "L4-width8-vs-width1" }`
      2. `REVEAL_COUNTERFACTUAL { comparisonId: "L4-width8-vs-width1" }`
      3. `REVEAL_PREDICTION { promptId: "L4-narrower-cost", correctOptionId: "costs-more" }`
    - Mutates: comparison evidence only; actual ledger and wallet remain unchanged.
    - Numbers: reference `$5.48148645`; anti-pattern eight-job completion `$5.57200410`; delta `$0.09051765` (`C1`, `C3`, `C10`, `C28`).

16. **Complete**
    - Event: player continues from the explanation.
    - Action: `COMPLETE_ATTEMPT`.
    - Mutates: result and campaign progression.
    - Numbers: gate and stars are evaluated from behavior, not budget alone.

## 5. Level data

```ts
const L4: LevelDef = {
  id: "L4",
  tier: 1,
  title: "The Five-Minute Race",
  objective: "Eight jobs are queued. Choose how many launch together, then beat the clock.",
  concept: {
    id: "subagent-short-ttl-fanout",
    privateDesignerSummary:
      "Short-lived shared subagent prefixes force fan-out into at most three serial waves.",
    postRevealRule:
      "More jobs at once can cost less when it keeps the shared prefix inside its five-minute window."
  },
  prerequisiteConceptIds: ["ttl-expiry", "prefix-reuse"],

  unlocks: "width",
  introducedControls: ["width"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "oneHourFlag", "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 405,
  budgetUsd: 6.00,
  clockCapMin: 16,
  cfgOverride: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "identical",
    width: 1,
    oneHourFlag: false
  },
  scenario: "fanout8",
  scenarioData: {
    units: ["job1", "job2", "job3", "job4", "job5", "job6", "job7", "job8"],
    contexts: ["sub1", "sub2", "sub3", "sub4", "sub5", "sub6", "sub7", "sub8"],
    estimates: [
      { label: "job count", value: 8, tag: "[FICTION]" },
      { label: "wave spacing minutes", value: 2, tag: "[FICTION]" },
      { label: "budget USD", value: 6, tag: "[FICTION]" }
    ],
    allowedCfg: { width: [1, 2, 3, 4, 5, 6, 7, 8] }
  },

  gate: {
    predicateId: "L4-complete-within-three-waves",
    behavioralRequirements: [
      "all eight jobs completed",
      "waveCount <= WARM_WAVES",
      "cold shared-prefix writes === 1"
    ],
    explanationRequirement:
      "explanation L4-fewer-waves-fit-window acknowledged"
  },

  star2: {
    label: "Two-wave finish",
    predicate: "waveCount <= 2 && cold shared-prefix writes === 1",
    reason: "All eight jobs arrived in no more than two waves."
  },
  star3: {
    label: "One-wave finish",
    predicate: "waveCount === 1 && cold shared-prefix writes === 1",
    reason: "All eight jobs launched together."
  },

  referenceCfg: { width: 8 },
  antiCfg: { width: 1 },

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

`seed=405`, the eight-job scenario, two-minute wave cadence, and `$6.00` budget are `[FICTION]`. `referenceCfg.width=8` is used for the three-star reference; `antiCfg.width=1` must reach the specified local failure before its post-attempt full-run counterfactual is calculated.

## 6. Pricing walkthrough

All requests use Sonnet (`$3/M` base, `C3`), `CACHE_TIER_5M` (`1.25x`, `C1`), the identical shared spawn prefix `26,237 tok` (`C10`), and the calibrated per-job workload `6,000` input plus `44,000` output tokens (`C28`).

### Cold request

```text
write = 26,237 × 1.25 × $3 / 1,000,000 = $0.09838875
input =  6,000 × 1    × $3 / 1,000,000 = $0.01800000
output = 44,000 × 5   × $3 / 1,000,000 = $0.66000000
total                                      $0.77638875
```

Authoritative cold-row buckets are therefore:

- `readTok=0`
- `writeTok=26,237`
- `inputTok=6,000`
- `outTok=44,000`
- `usd=$0.77638875`

### Warm request

```text
read   = 26,237 × 0.1 × $3 / 1,000,000 = $0.00787110
input  =  6,000 × 1   × $3 / 1,000,000 = $0.01800000
output = 44,000 × 5   × $3 / 1,000,000 = $0.66000000
total                                     $0.68587110
```

Authoritative warm-row buckets are:

- `readTok=26,237`
- `writeTok=0`
- `inputTok=6,000`
- `outTok=44,000`
- `usd=$0.68587110`

### Reference and anti-pattern totals

- **Three-star reference, width `8`:** one cold + seven warm  
  `1 × $0.77638875 + 7 × $0.68587110 = $5.57748645`.
- **Passing three-wave boundary, width `3`:** the same one cold + seven warm  
  total `$5.57748645`.
- **Anti-pattern full-run counterfactual, width `1`:** two cold + six warm  
  `2 × $0.77638875 + 6 × $0.68587110 = $5.66800410`.
- **Difference:** `$5.66800410 − $5.57748645 = $0.09051765`.

`PRICE_REQUEST` owns these values; UI copy must use its returned amounts. The event-sequence shorthand values `$0.76438875`, `$0.67387110`, `$5.48148645`, and `$5.57200410` are superseded by this complete `C28` calculation and must not be implemented.

## 7. Tape sequence

`UI_TAPE_RENDERER` uses `ledger` rows in request order. Every row contains its input, shared-prefix read/write, and output `WireSegment`s; output remains visible in hover pricing.

### Three-star reference (`width=8`)

1. `L4-J1`: **Job 1 · 0:00** — `write 26,237 | input 6,000 | output 44,000` — `$0.77638875`
2. `L4-J2`: **Job 2 · 0:00** — `read 26,237 | input 6,000 | output 44,000` — `$0.68587110`
3. `L4-J3`: **Job 3 · 0:00** — same warm buckets and cost
4. `L4-J4`: **Job 4 · 0:00** — same warm buckets and cost
5. `L4-J5`: **Job 5 · 0:00** — same warm buckets and cost
6. `L4-J6`: **Job 6 · 0:00** — same warm buckets and cost
7. `L4-J7`: **Job 7 · 0:00** — same warm buckets and cost
8. `L4-J8`: **Job 8 · 0:00** — same warm buckets and cost

### Anti-pattern fail tape (`width=1`)

1. `L4-J1`: **Job 1 · 0:00** — cold write
2. `L4-J2`: **Job 2 · 2:00** — warm read
3. `L4-J3`: **Job 3 · 4:00** — warm read
4. `L4-J4`: **Job 4 · 6:00** — red rewrite; freeze frame

### Aha frame

After rewind, the first job that previously arrived late now appears before the `5:00` boundary and renders a blue `read` segment. Hold the old red Job 4 outline as a faint post-attempt ghost for `700ms` `[ESTIMATE]`, then show:

**“Same job. Earlier wave. Shared prefix still alive.”**

No reference or anti-pattern labels appear until the attempt is complete.

## 8. Prediction prompts

### `L4-last-jobs-color`

**Question:** “When the last jobs reach the wire, what will their shared setup look like?”

- `mostly-blue` — “Mostly blue reads”
- `mixed` — “A mix of blue reads and red rewrites”
- `mostly-red` — “Mostly red rewrites”

The run button remains gated until commitment. No option receives correctness styling before `REVEAL_PREDICTION`.

### `L4-narrower-cost`

Shown only after a completed attempt and before the counterfactual reveal.

**Question:** “If the same eight jobs launch one at a time, what happens to the total?”

- `costs-less` — “It costs less”
- `same` — “It costs the same”
- `costs-more` — “It costs more”

Reveal copy:

**“The jobs did not change. The narrower launch added a late wave, forcing another 26,237-token write.”**

## 9. Fail-state

Failure rule `L4-late-wave` triggers on the first request whose wave reaches the shared prefix after the race window.

- **Decisive event:** Job 4’s request resolves at `6:00`.
- **Freeze frame:** the TTL bar is empty, the expired shared prefix is cracked, and Job 4’s `26,237`-token segment has turned red.
- **Exact causal message:** **“Job 4 arrived at 6:00; shared prefix expired at 5:00.”**
- **Supporting line:** **“It had to write the same setup again.”**
- **Frozen controls:** clock, width, launch, and all economic actions.
- **Available control:** `UI_REWIND_CONTROL`, labeled **“Regroup the jobs”**.
- **Rewind target:** `L4-before-width`; restore `0:00`, the original wallet, empty ledger, live queue, and no failure. Do not replay the cold-open.
- **Highlight targets:** Job 4, the expired shared `CacheEntry`, the red write segment, and the `5:00→6:00` portion of `UI_TTL_DRAIN_BAR`.

## 10. Gate & stars

Passing requires all of the following:

- All eight jobs complete.
- `waveCount <= WARM_WAVES` (`C27`).
- Exactly one shared-prefix cold write appears in the ledger.
- The player committed `L4-last-jobs-color` before its reveal.
- The player acknowledged `L4-fewer-waves-fit-window`.

Budget alone cannot pass the level.

- **1 star:** behavioral gate passes; widths `3–8`.
- **2 stars:** complete in at most two waves; widths `4–8`.
- **3 stars:** complete in one wave; width `8`.

Result copy:

- **Pass headline:** “All eight made the window.”
- **Fail headline:** “A late wave rebuilt the setup.”
- **Evidence:** “Waves: {waveCount} · Shared-prefix writes: {coldWriteCount} · Reads: {readCount}”
- **Continue:** “Next race”
- **Retry:** “Try another grouping”

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `L4-shared-prefix` | First Job 1 write completes | **“Shared prefix saved · 26,237 tokens · expires at 5:00.”** |
| `L4-first-read` | First later job reads the shared entry | **“Same setup, still alive · READ.”** |
| `L4-wave-wait` | First `ADVANCE { min: 2 }` | **“Waiting jobs move to the next wave.”** |
| `L4-expired` | Job 4 late rewrite becomes visible | **“Expired · the same 26,237 tokens must be written again.”** |
| `L4-aha` | Previously late job reads successfully after rewind | **“Earlier arrival · same shared prefix · cheaper read.”** |

`L4-expired` is a persistent cause toast during freeze. All others deduplicate per attempt and follow `PATTERN_JUST_IN_TIME_TOAST`.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. The width control is interactive by `2s` `[ESTIMATE]`.
2. Pre-play UI contains neither `WARM_WAVES`, “three waves,” the correct width, reference pricing, nor “wider is cheaper.”
3. Changing width dispatches only `SET_FANOUT_WIDTH`; it creates no ledger row and changes no wallet value.
4. Launch cannot execute before `L4-last-jobs-color` is committed.
5. Width `1` deterministically freezes on Job 4 at `6:00` with the exact required message.
6. No Job 5 request or cost is produced after that freeze.
7. **“Regroup the jobs”** deterministically restores `L4-before-width`.
8. Width `3` passes with three waves, one cold shared-prefix write, seven reads, and eight total ledger rows.
9. Width `8` earns three stars with one wave.
10. `referenceCfg={width:8}` passes; `antiCfg={width:1}` triggers `L4-late-wave`.
11. Every request creates exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row.
12. Each rendered row’s `WireSegment`s equal its priced token buckets.
13. Every request cost is positive and matches `PRICE_REQUEST`.
14. No positive cost displays as `$0.0000`.
15. Reference total is exactly `$5.57748645`; anti-pattern full-run counterfactual is `$5.66800410`.
16. The counterfactual remains unavailable until a meaningful attempt completes and its prediction is committed.
17. Static final tape bars render without hover.
18. Pointer and keyboard width selection dispatch equivalent actions.
19. Reduced-motion mode reaches identical final state and evidence.
20. The level is winnable without undocumented controls.

## 13. Reference-bar justification

The screen opens directly on one tactile choice: reshape eight cards into waves. The player sees a clock but receives no answer key, commits a prediction, and watches their own schedule become priced evidence. A narrow choice fails at the first causal request, freezes the exact red rewrite, and rewinds in one action. The successful retry transforms the same job from red to blue before naming the rule. Only after discovery does the game reveal the reference comparison and dollar delta. That rhythm—touch, predict, consequence, local rewind, discovery, transfer—protects the surprise while keeping the mechanic legible and playful.
