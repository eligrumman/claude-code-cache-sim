# Level 13 — The Fleet Audit

## 1. Identity

- `id`: `fleet-audit`
- `title`: **The Fleet Audit**
- `tier`: `3`
- `objective`: **“Five reports. Two remediation slots. Rank what is costing the fleet, then spend them.”**
- One concept: at fleet scale, remediation must follow recoverable dollars, not visually prominent token volume.
- Prerequisite concepts: every prior concept: cache read/write, TTL, prefix identity and order, subagent isolation, write-tier choice, keep-warm economics, routing, workload/model mix, downstream rework, sufficient loadouts, and volatile-prefix poisoning.
- Private designer answer: `idle > delegate > 5m-band > MCP`; never expose this before `SUBMIT_AUDIT_RANKING`.
- Post-reveal rule: **“Rank recoverable dollars, then target the people who exhibit the cause.”**

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `Action`
- `TokenCount`
- `Request`
- `PricedRequest`
- `LedgerRow`
- `PrefixBlock`
- `PREFIX_STACK`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `SUBAGENT_CONTEXT`
- `Clock`
- `Wallet`
- `Budget`
- `Checkpoint`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `TapeRenderer`
- `UI_PREFIX_STACK`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_JUST_IN_TIME_TOAST`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

No tutorial card and no aggregate dollar answer appear before play.

| Time | Beat and exact copy |
|---:|---|
| `0.0s` | A pager lands on the audit desk: **“FINOPS: Claude spend is up again. Five developer reports attached.”** |
| `0.8s` | Five sealed report folders slide into view: **Ari · Bea · Cy · Dev · Eli**. Header: **“Find the leaks. You get two remediation slots before next month closes.”** |
| `1.5s` | Ari’s folder pulses. Copy: **“Open any report.”** All five are immediately clickable. |
| First click | The selected report expands into its timeline, `TapeRenderer`, token headline, and symptoms. Dollar loss remains masked as **“Recoverable: ?”**. |
| After all five open | Four draggable cause cards unlock: **Idle rebuilds**, **Prompt drift**, **Short-cache misses**, **Tool-schema load**. Copy: **“Rank these by dollars recoverable next month.”** |
| First drag | Dispatch `CREATE_CHECKPOINT("audit-ranking", "decision")`; no correctness feedback appears. |
| Submit | Button copy: **“Lock ranking”**. Only after `SUBMIT_AUDIT_RANKING` may remedies and recoverable dollars be revealed. |

Report copy:

- **Ari — “Calendar confetti”**  
  **“272 red restarts. Long gaps scatter the month.”** (`C13`)
- **Bea — “Almost the same”**  
  **“The task label changes near the front of every delegated prompt.”**
- **Cy — “Wave four”**  
  **“Eight delegated jobs arrive in narrow serial waves.”**
- **Dev — “Everything enabled”**  
  **“Four tool servers load for tickets that use one.”**
- **Eli — “The token mountain”**  
  **“8,800,000 generated tokens. Delivery volume is high; cache warnings are quiet.”** (`200 × 44,000`, workload count `[FICTION]`, output size `C28`)

Eli’s `8,800,000` is the largest token headline. The UI does not label it waste or disclose that its recoverable cache loss is `$0.00` until the ranking is locked.

## 4. Exact event sequence

1. **Level enters**  
   Event: route opens → `ENTER_LEVEL({ levelId: "fleet-audit" })` → initializes `Clock`, `Wallet`, five report states, masked causal buckets, and empty ranking → `clock.min=0`, `Wallet.initialUsd=$692.00`, `Wallet.remainingUsd=$692.00` (`C17`).

2. **Reports are inspected**  
   Event: player opens each folder → presentation-only expansion; no reducer mutation and no pricing → each report exposes its timeline and request evidence, but not its recoverable-dollar bucket.

3. **Ranking checkpoint is made**  
   Event: first cause card moves → `CREATE_CHECKPOINT({ checkpointId:"audit-ranking", reason:"decision" })`, then `SET_AUDIT_RANKING({ causeIds })` → mutates `Checkpoint[]` and draft audit ranking → ranking is always a four-item permutation.

4. **Ranking prediction is committed**  
   Event: player presses **“Lock ranking”** → `OPEN_PREDICTION("fleet-biggest-lever")` if not already open; option selection dispatches `SELECT_PREDICTION`; confirmation dispatches `COMMIT_PREDICTION`, then `SUBMIT_AUDIT_RANKING` → prediction and ranking become immutable → no dollars revealed yet.

5. **Loss ledger is revealed**  
   Event: sealed audit meter is clicked → `REVEAL_PREDICTION({ promptId:"fleet-biggest-lever", correctOptionId:"idle" })` → mutates prediction result and reveal phase; causal buckets become visible:
   - `idle`: `$575.00` (`C14`)
   - `delegate`: `$72.00` `[FICTION]`
   - `5m-band`: `$30.00` `[FICTION]`
   - `MCP`: `$15.00` `[FICTION]`
   - total: `$692.00` (`C17`)
   
   Required order is `idle > delegate > 5m-band > MCP` (`C17`). Eli’s delivery volume receives **“Recoverable by these cache remedies: $0.00”**; this is not a priced request and is allowed to display zero.

6. **Remediation checkpoint is made**  
   Event: remedies unlock → `CREATE_CHECKPOINT({ checkpointId:"audit-remediation", reason:"decision" })` → appends the checkpoint → exactly two remediation slots become available.

7. **First remedy is applied**  
   Event: player drops a remedy on a developer or the fleet → `APPLY_REMEDIATION({ target, targetId?, remediationId })` → mutates remediation plan and projected causal buckets; simulation does not start yet.
   - `keep-warm-policy` targeted to Ari: recovers `$575.00`.
   - `normalize-delegation` targeted to Bea: recovers `$72.00`.
   - `fanout-width` targeted to Cy: recovers `$30.00`.
   - `trim-mcp` targeted to Dev: recovers `$15.00`.
   - Any targeted remedy on the wrong developer recovers `$0.00`.
   - Any fleet-wide remedy recovers its matching bucket but adds `$40.00` collateral per unaffected developer `[FICTION]`.

8. **Second remedy is applied**  
   Event: second drop → `APPLY_REMEDIATION(...)` → mutates the second slot, projected recovery, and projected collateral → reference choice is targeted `keep-warm-policy → Ari`, then targeted `normalize-delegation → Bea`, in that order.

9. **Next-month prediction is committed**  
   Event: player presses **“Simulate next month”** → `OPEN_PREDICTION("fleet-next-month")`; select and commit via `SELECT_PREDICTION` and `COMMIT_PREDICTION` → prediction locks before any next-month tape row appears.

10. **Next month runs**  
    Event: confirmed simulation → `RUN_UNIT({ unitId:"fleet-next-month" })` → resolves all scenario `Request`s through `RESOLVE_PREFIX` and `PRICE_REQUEST`; appends `LedgerRow`s, refreshes or creates `CacheEntry`s, advances `Clock` to `22 × 300 = 6,600m`, mutates `Wallet`, causal buckets, and `lastRequests` (`C31`).

11. **Ranking-error failure freezes locally**  
    Event: simulation reaches the first omitted higher-ranked recoverable bucket while a lower bucket was remediated → `FREEZE_FAILURE(...)` → freezes `Clock` and tape on that bucket’s decisive row.  
    Example: Cy was fixed while Ari was omitted:
    **“You recovered $30.00 here, but ranked a $575.00 idle leak below it. $545.00 was left on the table.”**

12. **Over-broad failure freezes locally**  
    Event: first unaffected developer receives a fleet-wide policy → `FREEZE_FAILURE(...)` → freezes on that developer’s collateral marker.  
    Exact copy: **“This fleet policy reached four people without this leak: $160.00 collateral.”** (`4 × $40.00`, `[FICTION]`)

13. **Rewind**  
    Event: player clicks **“Revise remedies”** → `REWIND_TO_CHECKPOINT({ checkpointId:"audit-remediation" })` → reconstructs state immediately before the first remedy; locked ranking and its revealed evidence remain.  
    Event: player clicks **“Rerank causes”** → `REWIND_TO_CHECKPOINT({ checkpointId:"audit-ranking" })` → reconstructs state before ranking submission; reports remain opened.

14. **Successful completion**  
    Event: month finishes unfrozen → `REVEAL_PREDICTION({ promptId:"fleet-next-month", correctOptionId:"targeted-top-two" })`, then `COMPLETE_ATTEMPT` → result receives actual, reference, left-on-table, and collateral values. Reference and anti-pattern comparisons remain hidden until this point.

## 5. Level data

```ts
{
  id: "fleet-audit",
  tier: 3,
  title: "The Fleet Audit",
  objective: "Five reports. Two remediation slots. Rank what is costing the fleet, then spend them.",
  concept: {
    id: "fleet-recoverable-dollar-priority",
    privateDesignerSummary:
      "At fleet scale, diagnose heterogeneous leaks and remediate in descending recoverable dollars.",
    postRevealRule:
      "Rank recoverable dollars, then target the people who exhibit the cause."
  },
  prerequisiteConceptIds: [
    "cache-reuse",
    "ttl-expiry",
    "prefix-identity",
    "subagent-short-ttl",
    "prompt-normalization",
    "write-tier-break-even",
    "keep-warm-break-even",
    "inline-vs-subagent",
    "workload-model-mix",
    "pipeline-rework",
    "smallest-sufficient-loadout",
    "volatile-prefix-position"
  ],
  unlocks: "fleet-audit-v2",
  introducedControls: ["audit-ranking", "remediation-target"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "oneHourFlag", "keepWarm", "keepWarmMin", "hook",
    "skills", "skillsMode", "memoryFiles", "mcp"
  ],
  scope: "month",
  seed: 13017,
  budgetUsd: 692,
  clockCapMin: 6600,
  cfgOverride: {
    orchestratorModel: "sonnet",
    planModel: "opus",
    devModel: "sonnet"
  },
  scenario: "fleet-audit-v2",
  scenarioData: {
    developers: ["ari", "bea", "cy", "dev", "eli"],
    remediationSlots: 2,
    causalBucketsUsd: {
      idle: 575,
      delegate: 72,
      "5m-band": 30,
      MCP: 15
    },
    fleetCollateralUsdPerUnaffectedDeveloper: 40
  },
  gate: {
    kind: "behavior",
    predicateId: "fleet-ranking-and-recovery-order"
  },
  star2: {
    predicateId: "fleet-top-two-targeted",
    label: "Recover at least $647 with no collateral"
  },
  star3: {
    predicateId: "fleet-perfect-audit",
    label: "Exact ranking; recover idle then delegate; no collateral"
  },
  referenceCfg: {
    keepWarm: true,
    prompts: "identical"
  },
  antiCfg: {
    keepWarm: false,
    prompts: "identical",
    width: 8,
    mcp: [false, false, false, false]
  },
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ]
}
```

`referenceCfg` is interpreted with scenario targets Ari and Bea. `antiCfg` represents remedies spent on Cy and Dev while Ari and Bea remain unfixed; these target bindings live in `scenarioData`, not `Config`.

## 6. Pricing walkthrough

All authoritative request prices use `PRICE_REQUEST`; bucket rollups follow `C15–C17`.

Representative rows proving the reports:

| Developer / request | Model | Read | Input | Write | Output | Tier | Exact cost |
|---|---|---:|---:|---:|---:|---|---:|
| Ari warm request | sonnet | `34,738` | `6,000` | `0` | `44,000` | `1h` | `34,738×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.6884214` |
| Ari expired request | sonnet | `0` | `6,000` | `34,738` | `44,000` | `1h` | `6,000×$3/M + 34,738×$6/M + 44,000×$15/M = $0.8864280` |
| Bea normalized warm spawn | sonnet | `26,237` | `6,000` | `0` | `44,000` | `5m` | `26,237×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.6858711` |
| Bea drifting spawn | sonnet | `11,602` | `6,000` | `14,623` | `44,000` | `5m` | `11,602×$0.30/M + 6,000×$3/M + 14,623×$3.75/M + 44,000×$15/M = $0.73631685` |
| Cy late cold spawn | sonnet | `0` | `6,000` | `26,237` | `44,000` | `5m` | `6,000×$3/M + 26,237×$3.75/M + 44,000×$15/M = $0.77638875` |
| Dev needless MCP rewrite | sonnet | `0` | `6,000` | `16,295` | `44,000` | `1h` | `6,000×$3/M + 16,295×$6/M + 44,000×$15/M = $0.7757700` |

Traceability:

- `34,738` main prefix: `C6`.
- `26,237` identical subagent prefix: `C10`.
- `11,602` read plus `14,623` rewrite under early prompt variation: `C11`.
- `5m`, `60m`, and all rate multipliers: `C1`.
- Sonnet rates: `C3`.
- `16,295` main tool definitions: `C24`.
- `6,000` fresh work input and `44,000` output per task: `C28`.
- Cy’s warm cutoff after approximately three serial waves: `C27`.
- Ari’s `272` idle rebuilds and `$575/month` recoverable rollup: `C13–C14`.
- Fleet hidden total `$692` and causal ordering: `C17`.

Post-attempt totals:

- Baseline hidden-loss total: `$692.00`.
- Three-star reference: recover `$575 + $72 = $647.00`; hidden loss remaining `$45.00`; collateral `$0.00`.
- Anti-pattern: recover `$30 + $15 = $45.00`; hidden loss remaining `$647.00`; dollars left on the table versus reference `$602.00`.
- Fleet-wide top-two: recover `$647.00`, but adds `8 × $40 = $320.00` collateral because each of two policies reaches four unaffected developers `[FICTION]`; adjusted organizational loss `$365.00`.
- No positive request may render as `$0.0000`; exact values above remain stored unrounded.

## 7. Tape sequence

Before ranking lock, each report shows symptoms but masks aggregate recoverable dollars.

Ordered aha reveal after `SUBMIT_AUDIT_RANKING`:

1. Ari: one blue warm row.
2. Ari: idle gap drains `UI_TTL_DRAIN_BAR`.
3. Ari: one red expired-prefix row; monthly bracket expands to **“272 rebuilds”** (`C13`).
4. Bea: normalized blue reference remains hidden.
5. Bea: repeated mixed `11,602 read │ 14,623 write` rows (`C11`).
6. Cy: three blue warm waves.
7. Cy: wave four arrives after the `5m` entry expires and turns red (`C27`).
8. Dev: `PB_MCP` segments total `16,295` and repeat across cold starts (`C24`).
9. Eli: output-violet rows stack into the visually tallest report.
10. Only after the prediction commits, dollar labels animate onto the four causal brackets: `$575`, `$72`, `$30`, `$15`.
11. Aha frame: Eli’s `8,800,000`-token mountain stays tallest while Ari’s much smaller red bracket receives the largest dollar lever, `$575`.
12. During next-month simulation, resolved remedies fold their causal brackets to `$0`; untouched brackets remain.
13. A fleet-wide remedy paints collateral markers over unaffected reports before the next priced row.

Every priced tape row maps one-to-one to a `LedgerRow`; monthly brackets are annotations, never extra requests.

## 8. Prediction prompts

### `fleet-biggest-lever`

Question:

**“Which cause will return the most dollars if fixed next month?”**

Options:

- `idle` — **“Ari’s idle rebuilds”**
- `delegate` — **“Bea’s changing prompts”**
- `5m-band` — **“Cy’s late waves”**
- `MCP` — **“Dev’s tool schemas”**
- `tokens` — **“Eli’s token mountain”**

Correct option: `idle`. Commit copy: **“Lock my call”**.

### `fleet-next-month`

Question:

**“What will your two remedies do next month?”**

Options:

- `targeted-top-two` — **“Remove the two largest recoverable losses”**
- `some-savings` — **“Save money, but leave a larger cause untouched”**
- `collateral` — **“Recover leaks but create broad-policy collateral”**

The correct option is derived from the submitted ranking and remedies; reference-run answer: `targeted-top-two`. No result tape may start before commitment.

## 9. Fail-state

### Ranking error

Decisive event: the first simulated bucket where a lower-ranked chosen cause resolves while a higher-ranked omitted cause remains.

Freeze copy template:

**“You recovered ${chosen}. The cause ranked below it still costs ${omitted}. ${omitted − chosen} was left on the table.”**

Reference concrete failure:

**“You recovered $30.00. Ari’s idle rebuilds still cost $575.00. $545.00 was left on the table.”**

`UI_REWIND_CONTROL` options:

- **“Revise remedies”** → `audit-remediation`
- **“Rerank causes”** → `audit-ranking`

### Over-broad policy

Decisive event: the first unaffected developer receives a fleet-wide remedy.

Freeze copy:

**“One leak, five rollouts. Four unaffected developers add $160.00 collateral.”** `[FICTION]`

Rewind copy: **“Target this fix”** → `audit-remediation`.

The freeze preserves the causal tape frame and does not replay report inspection.

## 10. Gate & stars

Pass requires all of:

```text
ranking submitted before remedies
AND ranking index(idle) < ranking index(delegate)
AND ranking index(delegate) < ranking index(5m-band)
AND ranking index(5m-band) < ranking index(MCP)
AND first applied remediation addresses idle
AND second applied remediation addresses delegate
AND recoveredUsd >= 647
AND simulation completed
```

Budget alone can never pass the level.

- **1 star:** behavioral pass predicate above; targeted or fleet-wide application allowed.
- **2 stars:** exact ranking, both top causes targeted to the matching developers, recovered `$647.00`, collateral `$0.00`.
- **3 stars:** 2-star conditions plus remediation order `idle → delegate`, no freeze, no remedy replacement, and correct commitment on both prediction prompts.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First report opens | **“Reports show activity. Your ranking must predict recoverable dollars.”** |
| Eli opens | **“Big token totals can be real work. Diagnose before calling them waste.”** |
| Ranking submit attempted with fewer than four causes | **“Rank every cause before opening the loss ledger.”** |
| Ranking locks | **“Ranking locked. Now open the dollars.”** |
| Loss ledger reveals | **“$575 of $692 hides in one cause.”** (`C14`, `C17`) |
| Targeted remedy matches its developer | **“Target matched: this remedy touches one causal bucket.”** |
| Targeted remedy mismatches | **“No matching evidence in this report.”** |
| Fleet-wide remedy selected | **“Fleet-wide reaches four unaffected developers too.”** |
| Reference simulation removes idle bucket | **“272 rebuilds removed from next month.”** (`C13`) |
| Second reference remedy lands | **“Top two recovered: $647.00. Remaining hidden loss: $45.00.”** |
| Anti-pattern result | **“You fixed $45.00 and left $647.00 recoverable.”** |

## 12. QA gate

Real-browser click-through must assert:

1. The first actionable report is clickable within two seconds; no Learn screen precedes it.
2. No recoverable dollar amount, correct order, remedy answer, or Eli `$0.00` appears before `SUBMIT_AUDIT_RANKING`.
3. Dragging causes dispatches `SET_AUDIT_RANKING`; submission is impossible unless all four cause IDs form a permutation.
4. Remedies remain disabled until ranking and `fleet-biggest-lever` prediction are committed.
5. `REVEAL_PREDICTION` is rejected before its matching `COMMIT_PREDICTION`.
6. Two and only two remediation slots may be committed.
7. Each target/remedy pair deterministically produces the specified recovery; mismatches recover zero without generating a fake `LedgerRow`.
8. Every real request has `usd > 0`; no positive value renders as `$0.0000`.
9. `TapeRenderer` priced rows equal ledger rows in count, order, request ID, token buckets, and USD.
10. Representative request totals exactly match `PRICE_REQUEST`.
11. Ari’s monthly bracket contains `272` rebuilds and rolls up to `$575`; all hidden buckets sum to `$692`.
12. The canonical causal order is exactly `idle > delegate > 5m-band > MCP`.
13. Eli’s `8,800,000` output-token headline is visually largest, yet no cache remedy is falsely credited with recovering delivery output.
14. A ranking error freezes on the first lower-value recovery that leaves a higher-value bucket and displays the correct dollar difference.
15. A fleet-wide top-two run shows `$320.00` collateral; a targeted top-two run shows `$0.00`.
16. `REWIND_TO_CHECKPOINT("audit-remediation")` preserves the locked ranking; `audit-ranking` unlocks it.
17. The reference run is winnable and yields `$647.00` recovery, `$45.00` remaining hidden loss, and `$0.00` collateral.
18. The anti-pattern run yields `$45.00` recovery, `$647.00` remaining hidden loss, and `$602.00` left on the table versus reference.
19. Pass fails for a wrong ranking even if recovery or displayed spend otherwise meets a numeric threshold.
20. 3 stars require exact ranking, targeted recovery order, both correct predictions, and no rewind.

## 13. Reference-bar justification

The screen opens as an unexplained, tactile audit desk; inspection precedes terminology, ranking forces a committed causal model, and only then do dollars animate onto the evidence. The reveal overturns the most visually tempting heuristic without having announced that reversal. Two remedy drops immediately test transfer from diagnosis to policy, while local freezes quantify either the missed lever or the collateral at the exact decision that caused it. The result compares actual, reference, and anti-pattern runs only after the player has owned an attempt, preserving the discovery rhythm while making the capstone gate depend on ranking and recovery order rather than spend.

Design assumptions: the three non-`C17` bucket amounts and `$40` per-unaffected-developer collateral are calibrated `[FICTION]`; they preserve the canonical `$692` total and required ordering while making the targeted-versus-fleet decision independently visible.
