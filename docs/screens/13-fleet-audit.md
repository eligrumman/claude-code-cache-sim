# Level 13 — The Fleet Audit

## 1. Identity

- `id`: `"13-fleet-audit"`
- `title`: **The Fleet Audit**
- `tier`: `3`
- `objective`: **“Five reports landed. Decide what the fleet does before next month closes.”**
- `concept.id`: `"fleet-leak-triage"`
- One new concept: at fleet scale, diagnose heterogeneous losses from operational evidence, then compare recoverable value with implementation burden before allocating limited interventions.
- `conceptScope.kind`: `"capstone-integration"`
- `conceptScope.reusedConceptIds`: all twelve declared prerequisite concepts below.
- `prerequisiteConceptIds`, in campaign order:

  1. `"write-vs-read"`
  2. `"cache-expiry"`
  3. `"prefix-reuse"`
  4. `"shared-subagent-window"`
  5. `"byte-identical-prefix"`
  6. `"ttl-tier-tradeoff"`
  7. `"keep-warm-breakeven"`
  8. `"inline-vs-subagent-routing"`
  9. `"workload-cost-mix"`
  10. `"plan-depth-downstream-cost"`
  11. `"prefix-loadout-sizing"`
  12. `"volatile-prefix-position"`

- Private designer ranking answer: `idle > delegate > 5m-band > MCP`.
- Post-reveal rule: **“Compare recovered loss with implementation cost, risk reserve, and delivery time; choose a plan no alternative beats on both net value and time.”**
- Both `PredictionPromptDef` answers remain non-punitive.
- The submitted pre-reveal ranking never affects passage, wallet, or failure, but an exact evidence-based ranking is required for the second star.
- The remediation inventory contains exactly two reducer-owned markers.
- Fleet-wide scope is not offered. Each remedy targets its evidenced developer; this removes the previously dominated developer-versus-fleet selector.
- Every remedy has positive net value and appears in at least one passing efficient-frontier pair.
- L13 uses the formal `ConceptScope` capstone exemption. Its value matching, limited intervention, implementation-risk comparison, and developer targeting integrate declared prerequisite concepts rather than introducing undeclared concepts.

## 2. Objects used

- `LevelDef`
- `ConceptId`
- `ConceptScope`
- `ReducerState`
- `Action`
- `StatePredicate`
- `GateDef`
- `StarDef`
- `ScenarioFixtureDef`
- `ScenarioEstimateDef`
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
- `HiddenCosts`
- `Counts`
- `AuditCauseSeed`
- `AuditValueMatchingState`
- `LimitedMarkerInventoryState`
- `CounterfactualDef`
- `AttemptMetrics`
- `AttemptResult`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `"predict-before-reveal"`
- `"limited-marker-inventory"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

No tutorial card, recoverable-dollar value, canonical ordering, value-to-cause answer, implementation burden, efficient-frontier answer, or intervention answer appears before play.

| Time | Beat and exact copy |
|---:|---|
| `0.0s` | A pager lands on the audit desk: **“FINOPS: Claude spend is up again. Five developer reports attached.”** |
| `0.2s–0.7s` | Five scripted report-ingest units resolve behind sealed folders. They create the nine priced rows specified in §6; no causal-bucket dollar label is visible. |
| `0.8s` | Folders marked **Ari · Bea · Cy · Dev · Eli** slide into view. Header: **“Five reports. Two decisions before next month closes.”** |
| `1.5s` | Ari’s folder pulses. Copy: **“Open any report.”** All five folders are immediately clickable. |
| First click | The folder expands into its timeline, `UI_TAPE_RENDERER`, token headline, and symptoms. Its aggregate loss remains masked as **“Recoverable: ?”**. |
| After all five open | Four cause cards unlock: **Idle rebuilds**, **Prompt drift**, **Short-cache misses**, and **Tool-schema load**. Copy: **“Put the reports in the order you would investigate.”** |
| First drag | Dispatch `CREATE_CHECKPOINT({ checkpointId: "audit-ranking", reason: "decision" })`, then `SET_AUDIT_RANKING`. No correctness feedback appears. |
| Submit | Button copy: **“Lock report order.”** Submission opens `fleet-biggest-lever`; the loss values remain sealed until that prediction is committed. |

Only the animation timings are presentation `[ESTIMATE]` values. The intervention capacity is gameplay state defined by fixture `l13-remediation-slot-capacity` and instantiated as `LimitedMarkerInventoryState`.

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
  **“8,800,000 generated tokens. Delivery volume is high; cache warnings are quiet.”**  
  The headline is `L13_FX.eliMonthlyRequestCount × WORK_OUT`; `WORK_OUT = 44,000` comes from `C28`, while the monthly request count comes from fixture `l13-eli-monthly-request-count`.

The reports expose causal evidence without dollar labels: Ari exposes frequency and idle timing, Bea exposes an early identity mismatch, Cy exposes cache-window timing, Dev exposes unused schema load, and Eli exposes legitimate output volume.

Eli’s `8,800,000` is the largest token headline. The UI neither labels it waste nor reveals its `$0.00` recoverable cache loss until the player has submitted a complete value-to-cause match.

## 4. Exact event sequence

1. **Enter the level**

   Event: route opens.

   ```ts
   ENTER_LEVEL({ levelId: "13-fleet-audit" })
   ```

   Mutations:

   - Initializes `seed = L13_FX.seed`.
   - Initializes `clockMin = 0`, `endMin = L13_FX.clockCapMin`, and `dayLen = 300` (`C31`).
   - Initializes scalar `budget = L13_FX.budgetUsd` and scalar `wallet = L13_FX.budgetUsd`.
   - Initializes `attemptMetrics.spentUsd = 0`.
   - Initializes every `HiddenCosts` field to zero.
   - Initializes `auditRanking = []`.
   - Initializes `auditValueMatching.assignmentsByValueId = {}` and `auditValueMatching.locked = false`.
   - Initializes `markerInventories["l13-remediation-slots"]` with two unplaced markers and `locked = false`.
   - Initializes no remedies, completed audit events, completed transfer markers, or prediction result.
   - The `$692.00` hidden-loss ledger is never assigned to `wallet` or `budget`.

2. **Ingest the historical request sample**

   System event: the sealed audit fixture dispatches, in order:

   ```ts
   RUN_UNIT({ unitId: "ari-report" })
   RUN_UNIT({ unitId: "bea-report" })
   RUN_UNIT({ unitId: "cy-report" })
   RUN_UNIT({ unitId: "dev-report" })
   RUN_UNIT({ unitId: "eli-report" })
   ```

   Each unit resolves its `Request`s through `RESOLVE_PREFIX` and `PRICE_REQUEST`, appends its contiguous `LedgerRow`s, and supplies the corresponding sealed tape rows.

   Exact mutation after all five units:

   ```text
   ledger.length += 9
   attemptMetrics.requestCount = 9
   attemptMetrics.spentUsd = $6.69987735
   wallet = $83.30012265
   ```

   These are billed sample-request costs, not the hidden-loss rollup or remediation implementation burden.

3. **Inspect reports**

   Event: player opens each folder.

   This is presentation-only. It exposes that report’s already-priced rows, timeline, token counts, and symptoms without changing the reducer or charging the wallet again. Reopening a report creates no request.

4. **Draft the pre-reveal ranking**

   On the first cause-card move:

   ```ts
   CREATE_CHECKPOINT({
     checkpointId: "audit-ranking",
     reason: "decision"
   })
   ```

   Every reorder then dispatches:

   ```ts
   SET_AUDIT_RANKING({ causeIds })
   ```

   `causeIds` must be a permutation of:

   ```ts
   ["idle", "delegate", "5m-band", "MCP"]
   ```

   The draft remains editable and receives no correctness signal.

5. **Commit the pre-reveal forecast**

   Pressing **“Lock report order”** dispatches:

   ```ts
   SUBMIT_AUDIT_RANKING
   OPEN_PREDICTION({ promptId: "fleet-biggest-lever" })
   SELECT_PREDICTION({
     promptId: "fleet-biggest-lever",
     optionId
   })
   COMMIT_PREDICTION({ promptId: "fleet-biggest-lever" })
   ```

   The ranking and prediction become immutable.

   Prediction correctness changes no score, star, wallet, failure, or gate result. The submitted ranking is retained as evidence for `star2`; it cannot block passage or cause a freeze.

6. **Reveal four unlabeled values**

   Event: player clicks the now-enabled sealed audit meter.

   ```ts
   REVEAL_PREDICTION({
     promptId: "fleet-biggest-lever",
     correctOptionId: "different-report"
   })
   ```

   Event `loss-values-revealed` completes.

   Four visually identical value tiles appear in deterministic shuffled order:

   | Reveal position | Opaque `valueId` | Visible tile |
   |---:|---|---:|
   | `1` | `loss-v30` | `$30.00` |
   | `2` | `loss-v575` | `$575.00` |
   | `3` | `loss-v15` | `$15.00` |
   | `4` | `loss-v72` | `$72.00` |

   The three calibrated values resolve from fixtures `l13-loss-five-minute-usd`, `l13-loss-mcp-usd`, and `l13-loss-delegate-usd`. Ari’s `$575.00` is `C14`.

   The tiles have no cause name, developer name, bucket name, icon, color association, or spatial alignment with a report. The four cause cards still show **“Recoverable: ?”**.

   The values sum to `$692.00` and obey `idle > delegate > 5m-band > MCP` (`C17`), but neither the mapping nor the canonical order is displayed.

   A wrong prediction reveals the same four tiles and unlocks the same controls.

7. **Match each value to report evidence**

   Immediately before the first value placement:

   ```ts
   CREATE_CHECKPOINT({
     checkpointId: "audit-value-matching",
     reason: "decision"
   })
   ```

   Each tile placement dispatches:

   ```ts
   SET_AUDIT_VALUE_MATCH({
     valueId,
     causeId
   })
   ```

   The reducer writes:

   ```text
   auditValueMatching.assignmentsByValueId[valueId] = causeId
   ```

   Each value and cause may be used exactly once. Reassignment before submission moves the tile rather than duplicating it.

   Submission is disabled until the assignment is a complete bijection. Button copy:

   **“Submit diagnosis.”**

   Pressing it dispatches:

   ```ts
   SUBMIT_AUDIT_VALUE_MATCHES
   ```

   Exact mutations:

   ```text
   auditValueMatching.locked = true
   completedEventIds includes "audit-value-matches-submitted"
   ```

   The correct authored mapping is:

   ```text
   loss-v575 → idle
   loss-v72  → delegate
   loss-v30  → 5m-band
   loss-v15  → MCP
   ```

   After submission, solid lines animate from each value to its authored cause. If a submitted line was wrong, it remains briefly as a dotted line while the solid correction appears. This correction is informational: it does not mutate `wallet`, trigger failure, or prevent continuation.

   Event `loss-ledger-revealed` completes only after all four correct cause-dollar joins are visible. It sets reducer-visible causal buckets:

   | Cause ID | `HiddenCosts` path | Reducer value |
   |---|---|---:|
   | `idle` | `hidden.idleRebuildUsd` | `$575.00` (`C14`) |
   | `delegate` | `hidden.delegateUsd` | `L13_FX.lossDelegateUsd` |
   | `5m-band` | `hidden.fiveMinuteBandUsd` | `L13_FX.lossFiveMinuteUsd` |
   | `MCP` | `hidden.mcpUsd` | `L13_FX.lossMcpUsd` |

   Eli then receives the annotation **“Recoverable by these cache interventions: $0.00.”** It is not a request price.

8. **Create the remediation checkpoint and reveal implementation evidence**

   After the labeled loss-ledger animation completes:

   ```ts
   CREATE_CHECKPOINT({
     checkpointId: "audit-remediation",
     reason: "decision"
   })
   BEGIN_TRANSFER({
     challengeId: "fleet-remediation-transfer"
   })
   ```

   The two markers in `markerInventories["l13-remediation-slots"]` unlock.

   Each remedy card now exposes recovery, setup cost, deterministic risk reserve, delivery time, and net benefit. These values were hidden until the causal ledger was labeled.

   | Remedy | Evidenced developer | Gross recovery | Setup cost | Risk reserve | Net benefit | Delivery |
   |---|---|---:|---:|---:|---:|---:|
   | `keep-warm-policy` | Ari | `$575` | `$260` | `$80` | `$235` | `180m` |
   | `normalize-delegation` | Bea | `$72` | `$10` | `$40` | `$22` | `30m` |
   | `fanout-width` | Cy | `$30` | `$8` | `$2` | `$20` | `90m` |
   | `trim-mcp` | Dev | `$15` | `$2` | `$1` | `$12` | `15m` |

   All setup, risk, and delivery values resolve symbolically from the named fixtures in §5. Risk is a deterministic expected rework reserve, never an RNG roll.

   Every remedy has positive net benefit. Ari offers high return with high burden; Bea offers stronger net than the two small fixes but carries material rollout risk; Cy offers low risk but takes longer; Dev is fastest and cheapest.

   Fleet scope is absent. `APPLY_REMEDIATION({ target: "fleet", ... })` is rejected by the scenario before any marker, state mutation, or result.

9. **Apply each remedy**

   For each of the two slots, confirmation dispatches the legal reducer actions in this order:

   ```ts
   PLACE_LIMITED_MARKER({
     inventoryId: "l13-remediation-slots",
     markerId,
     targetId
   })

   APPLY_REMEDIATION({
     target: "developer",
     targetId,
     remediationId
   })

   ADVANCE({ min: deliveryMin })
   ```

   The remedy and target must be one of the four evidenced matches. A mismatch is rejected before the marker is consumed and creates no fake `Request` or `LedgerRow`.

   Each accepted `APPLY_REMEDIATION` atomically:

   - sets the matching causal `HiddenCosts` bucket to `0`;
   - increments `hidden.reworkUsd` by that remedy’s setup cost plus risk reserve;
   - appends `"audit-remedy-" + remediationId` to `completedTransferIds`;
   - leaves `wallet`, `ledger`, `lastRequests`, and `attemptMetrics.spentUsd` unchanged.

   The following `ADVANCE` action increments only `clockMin` by the named delivery fixture.

   Duplicate remedies and duplicate developer targets are invalid. After the second accepted remedy:

   ```ts
   LOCK_LIMITED_MARKERS({
     inventoryId: "l13-remediation-slots"
   })
   ```

10. **Resolve the two-remedy efficient frontier**

    The second accepted `APPLY_REMEDIATION` derives the unordered pair from the two reducer-owned placements and appends its plan marker to `completedTransferIds`.

    | Pair | Gross recovery | Setup + risk | Net benefit | Delivery time | Reducer marker | Status |
    |---|---:|---:|---:|---:|---|---|
    | Ari + Bea | `$647` | `$390` | `$257` | `210m` | `audit-plan-frontier-high-return` | Frontier |
    | Ari + Cy | `$605` | `$350` | `$255` | `270m` | `audit-plan-dominated-ari-cy` | Dominated by Ari + Bea |
    | Ari + Dev | `$590` | `$343` | `$247` | `195m` | `audit-plan-frontier-balanced` | Frontier |
    | Bea + Cy | `$102` | `$60` | `$42` | `120m` | `audit-plan-frontier-lower-burden` | Frontier |
    | Bea + Dev | `$87` | `$53` | `$34` | `45m` | `audit-plan-frontier-fast` | Frontier |
    | Cy + Dev | `$45` | `$13` | `$32` | `105m` | `audit-plan-dominated-cy-dev` | Dominated by Bea + Dev |

    A pair is on the evidence-backed frontier if no other pair has both:

    ```text
    netBenefit >= chosen.netBenefit
    AND
    deliveryMin <= chosen.deliveryMin
    ```

    with at least one strict inequality.

    For any of the four frontier pairs, the second `APPLY_REMEDIATION` also appends:

    ```text
    completedTransferIds includes "audit-efficient-frontier"
    ```

    For Ari then Bea without replacement or rewind after `loss-ledger-revealed`, it additionally appends:

    ```text
    completedTransferIds includes "audit-plan-high-return-clean"
    ```

    The two dominated pairs remain fully completable. Their result card immediately shows the reducer-derived dominating pair and enables **“Revise remedies”**; neither route dispatches `FREEZE_FAILURE`.

11. **Commit the result prediction**

    Pressing **“Simulate next month”** dispatches:

    ```ts
    OPEN_PREDICTION({ promptId: "fleet-next-month" })
    SELECT_PREDICTION({
      promptId: "fleet-next-month",
      optionId
    })
    COMMIT_PREDICTION({ promptId: "fleet-next-month" })
    ```

    No aggregate recovery, remaining-loss total, net-benefit total, or frontier status animates before commitment.

12. **Reveal the chosen remediation outcome**

    The simulation folds resolved causal brackets and leaves untouched brackets visible. It adds no historical `Request`, `LedgerRow`, or wallet charge. It is a projection over the already-priced report evidence, the `AuditCauseSeed` loss ledger, the named implementation fixtures, and the reducer-owned remedy markers.

    The result displays:

    ```text
    gross recovery
    remaining causal hidden loss
    setup + risk recorded in hidden.reworkUsd
    net benefit
    delivery minutes added to clockMin
    frontier status
    ```

    For Ari + Bea:

    ```text
    gross recovery = $647.00
    remaining causal hidden loss = $45.00
    setup + risk = $390.00
    net benefit = $257.00
    delivery = 210m
    status = frontier-high-return
    ```

    For Cy + Dev:

    ```text
    gross recovery = $45.00
    remaining causal hidden loss = $647.00
    setup + risk = $13.00
    net benefit = $32.00
    delivery = 105m
    status = dominated by Bea + Dev
    ```

    Event `next-month-result-revealed` completes for every plan.

13. **Rewind**

    - **“Revise remedies”**

      ```ts
      REWIND_TO_CHECKPOINT({
        checkpointId: "audit-remediation"
      })
      ```

      Restores state immediately before the first remedy while preserving report inspection, the submitted ranking, the submitted value matching, and the revealed labeled ledger. It removes remediation placements, remediation transfer markers, implementation burden, and remediation delivery minutes.

    - **“Rematch values”**

      ```ts
      REWIND_TO_CHECKPOINT({
        checkpointId: "audit-value-matching"
      })
      ```

      Restores state immediately before the first value placement while preserving the ingested reports and four unlabeled values. Correct join lines revealed after submission are removed.

    - **“Reorder reports”**

      ```ts
      REWIND_TO_CHECKPOINT({
        checkpointId: "audit-ranking"
      })
      ```

      Restores state before ranking submission while preserving the ingested ledger and opened reports.

14. **Complete and unlock comparisons**

    On any revealed outcome:

    ```ts
    REVEAL_PREDICTION({
      promptId: "fleet-next-month",
      correctOptionId: derivedFromAppliedRemedies
    })
    ```

    Then:

    ```ts
    COMPLETE_ATTEMPT
    ```

    `attemptResult.spentUsd` snapshots the authoritative `budget - wallet` derivation. A frontier plan passes; a dominated plan completes with `attemptResult.outcome = "gate-failed"`.

    Reference and anti-pattern comparisons remain unavailable until `COMPLETE_ATTEMPT`.

    After completion:

    ```ts
    REQUEST_COUNTERFACTUAL({
      comparisonId: "fleet-reference"
    })
    REVEAL_COUNTERFACTUAL({
      comparisonId: "fleet-reference"
    })

    REQUEST_COUNTERFACTUAL({
      comparisonId: "fleet-anti-pattern"
    })
    REVEAL_COUNTERFACTUAL({
      comparisonId: "fleet-anti-pattern"
    })
    ```

    These informational actions cannot mutate the actual attempt, dispatch `FREEZE_FAILURE`, change plan markers, or alter the ledger.

## 5. Level data

All gameplay fiction is declared once in `scenarioData.fixtures`. `scenarioData.estimates` contains presentation timing only.

```ts
const L13_FIXTURES: ScenarioFixtureDef[] = [
  {
    id: "l13-seed",
    label: "Fleet audit deterministic seed",
    semanticRole: "Deterministic shuffle and replay seed for the fleet audit",
    value: 13017,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l13-budget-usd",
    label: "Fleet audit month API budget",
    semanticRole: "Initial scalar budget and wallet for the month scope",
    value: 90,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-clock-cap-min",
    label: "Fleet audit month clock cap",
    semanticRole: "Twenty-two 300-minute workdays available in the scenario",
    value: 6600,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l13-loss-delegate-usd",
    label: "Delegation drift hidden loss",
    semanticRole: "Monthly recoverable loss assigned to the delegate cause",
    value: 72,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-loss-five-minute-usd",
    label: "Short-cache hidden loss",
    semanticRole: "Monthly recoverable loss assigned to the five-minute-band cause",
    value: 30,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-loss-mcp-usd",
    label: "MCP schema hidden loss",
    semanticRole: "Monthly recoverable loss assigned to the MCP cause",
    value: 15,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-eli-monthly-request-count",
    label: "Eli monthly output request count",
    semanticRole: "Monthly request count used only to derive Eli's legitimate output headline",
    value: 200,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l13-remediation-slot-capacity",
    label: "Remediation inventory capacity",
    semanticRole: "Number of reducer-owned remedies the player may commit",
    value: 2,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l13-ari-setup-usd",
    label: "Ari remedy setup cost",
    semanticRole: "Implementation cost of deploying the keep-warm policy",
    value: 260,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-ari-risk-usd",
    label: "Ari remedy risk reserve",
    semanticRole: "Deterministic expected rework reserve for the keep-warm policy",
    value: 80,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-ari-delivery-min",
    label: "Ari remedy delivery time",
    semanticRole: "Simulation time required to deploy the keep-warm policy",
    value: 180,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l13-bea-setup-usd",
    label: "Bea remedy setup cost",
    semanticRole: "Implementation cost of normalizing delegation prompts",
    value: 10,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-bea-risk-usd",
    label: "Bea remedy risk reserve",
    semanticRole: "Deterministic expected rework reserve for delegation normalization",
    value: 40,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-bea-delivery-min",
    label: "Bea remedy delivery time",
    semanticRole: "Simulation time required to normalize delegation prompts",
    value: 30,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l13-cy-setup-usd",
    label: "Cy remedy setup cost",
    semanticRole: "Implementation cost of changing fan-out width",
    value: 8,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-cy-risk-usd",
    label: "Cy remedy risk reserve",
    semanticRole: "Deterministic expected rework reserve for the fan-out-width change",
    value: 2,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-cy-delivery-min",
    label: "Cy remedy delivery time",
    semanticRole: "Simulation time required to deploy the fan-out-width change",
    value: 90,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l13-dev-setup-usd",
    label: "Dev remedy setup cost",
    semanticRole: "Implementation cost of trimming the MCP loadout",
    value: 2,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-dev-risk-usd",
    label: "Dev remedy risk reserve",
    semanticRole: "Deterministic expected rework reserve for MCP trimming",
    value: 1,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l13-dev-delivery-min",
    label: "Dev remedy delivery time",
    semanticRole: "Simulation time required to deploy MCP trimming",
    value: 15,
    unit: "min",
    tag: "[FICTION]"
  }
];

const l13Fixture = (id: string): number =>
  L13_FIXTURES.find(fixture => fixture.id === id)!.value;

const L13_FX = {
  seed: l13Fixture("l13-seed"),
  budgetUsd: l13Fixture("l13-budget-usd"),
  clockCapMin: l13Fixture("l13-clock-cap-min"),
  lossDelegateUsd: l13Fixture("l13-loss-delegate-usd"),
  lossFiveMinuteUsd: l13Fixture("l13-loss-five-minute-usd"),
  lossMcpUsd: l13Fixture("l13-loss-mcp-usd"),
  eliMonthlyRequestCount: l13Fixture("l13-eli-monthly-request-count"),
  remediationSlotCapacity: l13Fixture("l13-remediation-slot-capacity")
} as const;
```

`AuditCauseSeed.lossUsd` references these symbols rather than duplicating calibrated fiction.

```ts
const LEVEL_13: LevelDef = {
  id: "13-fleet-audit",
  tier: 3,
  title: "The Fleet Audit",
  objective:
    "Five reports landed. Decide what the fleet does before next month closes.",

  concept: {
    id: "fleet-leak-triage",
    privateDesignerSummary:
      "At fleet scale, diagnose heterogeneous losses from evidence and allocate limited interventions on an efficient net-value and delivery-time frontier.",
    postRevealRule:
      "Compare recovered loss with implementation cost, risk reserve, and delivery time; choose a plan no alternative beats on both net value and time.",
    solutionVocabulary: [
      "rank",
      "ranking",
      "sort",
      "match",
      "matching",
      "recoverable dollar",
      "remediation",
      "remedy",
      "target",
      "largest cause",
      "top two",
      "efficient frontier",
      "net benefit",
      "implementation burden",
      "risk reserve"
    ]
  },

  conceptScope: {
    kind: "capstone-integration",
    reusedConceptIds: [
      "write-vs-read",
      "cache-expiry",
      "prefix-reuse",
      "shared-subagent-window",
      "byte-identical-prefix",
      "ttl-tier-tradeoff",
      "keep-warm-breakeven",
      "inline-vs-subagent-routing",
      "workload-cost-mix",
      "plan-depth-downstream-cost",
      "prefix-loadout-sizing",
      "volatile-prefix-position"
    ]
  },

  prerequisiteConceptIds: [
    "write-vs-read",
    "cache-expiry",
    "prefix-reuse",
    "shared-subagent-window",
    "byte-identical-prefix",
    "ttl-tier-tradeoff",
    "keep-warm-breakeven",
    "inline-vs-subagent-routing",
    "workload-cost-mix",
    "plan-depth-downstream-cost",
    "prefix-loadout-sizing",
    "volatile-prefix-position"
  ],

  unlocks: "audit",
  introducedControls: ["audit"],

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

  scope: "month",
  seed: L13_FX.seed,
  budgetUsd: L13_FX.budgetUsd,
  clockCapMin: L13_FX.clockCapMin,

  cfgOverride: {
    orchestratorModel: "sonnet",
    planModel: "opus",
    devModel: "sonnet"
  },

  scenario: "fleet-audit-v2",

  scenarioData: {
    units: AUDIT_REPORT_UNITS,
    contexts: AUDIT_CONTEXTS,
    prefixStacks: AUDIT_PREFIX_STACKS,

    auditCauses: [
      {
        id: "idle",
        valueId: "loss-v575",
        label: "Idle rebuilds",
        developerId: "ari",
        bucket: "idleRebuildUsd",
        lossUsd: 575,
        evidenceRequestIds: ["ari-warm", "ari-expired"],
        remediationIds: ["keep-warm-policy"],
        cite: "C13–C14"
      },
      {
        id: "delegate",
        valueId: "loss-v72",
        label: "Prompt drift",
        developerId: "bea",
        bucket: "delegateUsd",
        lossUsd: L13_FX.lossDelegateUsd,
        evidenceRequestIds: ["bea-drifting"],
        remediationIds: ["normalize-delegation"],
        cite: "fixture:l13-loss-delegate-usd"
      },
      {
        id: "5m-band",
        valueId: "loss-v30",
        label: "Short-cache misses",
        developerId: "cy",
        bucket: "fiveMinuteBandUsd",
        lossUsd: L13_FX.lossFiveMinuteUsd,
        evidenceRequestIds: [
          "cy-wave-1",
          "cy-wave-2",
          "cy-wave-3",
          "cy-wave-4"
        ],
        remediationIds: ["fanout-width"],
        cite: "fixture:l13-loss-five-minute-usd"
      },
      {
        id: "MCP",
        valueId: "loss-v15",
        label: "Tool-schema load",
        developerId: "dev",
        bucket: "mcpUsd",
        lossUsd: L13_FX.lossMcpUsd,
        evidenceRequestIds: ["dev-mcp-rewrite"],
        remediationIds: ["trim-mcp"],
        cite: "fixture:l13-loss-mcp-usd"
      }
    ],

    markerInventories: [
      {
        id: "l13-remediation-slots",
        capacity: L13_FX.remediationSlotCapacity,
        markerIds: ["l13-remedy-slot-a", "l13-remedy-slot-b"],
        targetIds: ["ari", "bea", "cy", "dev"]
      }
    ],

    fixtures: L13_FIXTURES,

    estimates: [
      {
        label: "Report-ingest animation start in seconds",
        value: 0.2,
        tag: "[ESTIMATE]"
      },
      {
        label: "Report-ingest animation end in seconds",
        value: 0.7,
        tag: "[ESTIMATE]"
      },
      {
        label: "Folder arrival animation in seconds",
        value: 0.8,
        tag: "[ESTIMATE]"
      },
      {
        label: "First-interaction presentation target in seconds",
        value: 1.5,
        tag: "[ESTIMATE]"
      }
    ]
  },

  coldOpen: LEVEL_13_COLD_OPEN,
  sequence: LEVEL_13_SEQUENCE,
  predictions: LEVEL_13_PREDICTIONS,
  toasts: LEVEL_13_TOASTS,

  interactionPatterns: [
    "predict-before-reveal",
    "limited-marker-inventory",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "reworkUsd",
    cite: "C15–C17 plus named implementation fixtures",
    line:
      "A plan is efficient only when no evidenced alternative provides at least as much net benefit in no more delivery time."
  },

  failureRules: [],

  checkpoints: [
    {
      id: "audit-ranking",
      createBeforeEventId: "ranking-first-change",
      reason: "decision",
      resumeLabel: "Reorder reports"
    },
    {
      id: "audit-value-matching",
      createBeforeEventId: "value-match-first-change",
      reason: "decision",
      resumeLabel: "Rematch values"
    },
    {
      id: "audit-remediation",
      createBeforeEventId: "first-remediation",
      reason: "decision",
      resumeLabel: "Revise remedies"
    }
  ],

  gate: {
    predicateId: "fleet-efficient-frontier-post-evidence-remediation",
    evidenceRevealEventIds: [
      "loss-values-revealed",
      "loss-ledger-revealed"
    ],
    postEvidenceActionRequirements: [
      {
        id: "value-matching-submitted-after-values",
        kind: "action-observed",
        actionType: "SUBMIT_AUDIT_VALUE_MATCHES",
        afterEventId: "loss-values-revealed"
      },
      {
        id: "remediation-applied-after-ledger",
        kind: "action-observed",
        actionType: "APPLY_REMEDIATION",
        afterEventId: "loss-ledger-revealed",
        match: {
          target: "developer"
        }
      }
    ],
    behavioralRequirements: [
      {
        id: "audit-value-matches-submitted",
        kind: "event-completed",
        eventId: "audit-value-matches-submitted"
      },
      {
        id: "efficient-frontier-plan-recorded",
        kind: "includes",
        path: "completedTransferIds",
        value: "audit-efficient-frontier"
      },
      {
        id: "simulation-completed",
        kind: "event-completed",
        eventId: "next-month-result-revealed"
      }
    ],
    transferRequirement: {
      id: "efficient-frontier-transfer",
      kind: "includes",
      path: "completedTransferIds",
      value: "audit-efficient-frontier"
    }
  },

  pass: (st: ReducerState): GateResult => {
    const diagnosisSubmitted =
      st.completedEventIds.includes("audit-value-matches-submitted");
    const frontierPlan =
      st.completedTransferIds.includes("audit-efficient-frontier");
    const resultRevealed =
      st.completedEventIds.includes("next-month-result-revealed");

    return {
      pass: diagnosisSubmitted && frontierPlan && resultRevealed,
      reason:
        "The player completed the diagnosis and committed a reducer-recorded plan on the evidence-backed net-benefit and delivery-time frontier.",
      evidence: [
        "value-matching-submitted-after-values",
        "remediation-applied-after-ledger",
        "efficient-frontier-plan-recorded",
        "simulation-completed"
      ]
    };
  },

  star2: {
    label: "Forecast all four causes in the correct order before values appear",
    predicate: {
      id: "exact-pre-reveal-ranking-and-frontier-pass",
      kind: "all",
      predicates: [
        {
          id: "l13-rank-0-idle",
          kind: "compare",
          path: "auditRanking.0",
          op: "eq",
          value: "idle"
        },
        {
          id: "l13-rank-1-delegate",
          kind: "compare",
          path: "auditRanking.1",
          op: "eq",
          value: "delegate"
        },
        {
          id: "l13-rank-2-five-minute",
          kind: "compare",
          path: "auditRanking.2",
          op: "eq",
          value: "5m-band"
        },
        {
          id: "l13-rank-3-mcp",
          kind: "compare",
          path: "auditRanking.3",
          op: "eq",
          value: "MCP"
        },
        {
          id: "l13-star2-frontier",
          kind: "includes",
          path: "completedTransferIds",
          value: "audit-efficient-frontier"
        }
      ]
    },
    reason:
      "The initial report evidence was sufficient to forecast the complete loss order before dollar labels appeared."
  },

  star3: {
    label: "Diagnose every value and execute the clean high-return frontier plan",
    predicate: {
      id: "exact-diagnosis-and-clean-high-return-transfer",
      kind: "all",
      predicates: [
        {
          id: "l13-star3-rank-0-idle",
          kind: "compare",
          path: "auditRanking.0",
          op: "eq",
          value: "idle"
        },
        {
          id: "l13-star3-rank-1-delegate",
          kind: "compare",
          path: "auditRanking.1",
          op: "eq",
          value: "delegate"
        },
        {
          id: "l13-star3-rank-2-five-minute",
          kind: "compare",
          path: "auditRanking.2",
          op: "eq",
          value: "5m-band"
        },
        {
          id: "l13-star3-rank-3-mcp",
          kind: "compare",
          path: "auditRanking.3",
          op: "eq",
          value: "MCP"
        },
        {
          id: "l13-match-v575-idle",
          kind: "compare",
          path: "auditValueMatching.assignmentsByValueId.loss-v575",
          op: "eq",
          value: "idle"
        },
        {
          id: "l13-match-v72-delegate",
          kind: "compare",
          path: "auditValueMatching.assignmentsByValueId.loss-v72",
          op: "eq",
          value: "delegate"
        },
        {
          id: "l13-match-v30-five-minute",
          kind: "compare",
          path: "auditValueMatching.assignmentsByValueId.loss-v30",
          op: "eq",
          value: "5m-band"
        },
        {
          id: "l13-match-v15-mcp",
          kind: "compare",
          path: "auditValueMatching.assignmentsByValueId.loss-v15",
          op: "eq",
          value: "MCP"
        },
        {
          id: "l13-clean-high-return-plan",
          kind: "includes",
          path: "completedTransferIds",
          value: "audit-plan-high-return-clean"
        }
      ]
    },
    reason:
      "The player diagnosed every unlabeled value and executed the highest-net frontier plan without replacement or rewind."
  },

  referenceCfg: {
    keepWarm: true,
    prompts: "identical"
  },

  antiCfg: {
    keepWarm: false,
    prompts: "varied",
    width: 8,
    mcp: [false, false, false, false]
  },

  counterfactuals: [
    {
      id: "fleet-reference",
      unlockAfterEventId: "attempt-completed",
      kind: "reference",
      cfg: {
        keepWarm: true,
        prompts: "identical"
      },
      comparisonQuestion:
        "What does the highest-net frontier pair produce?",
      revealCopy:
        "Ari and Bea recover $647.00 gross, reserve $390.00 for implementation and risk, and net $257.00 in 210 minutes."
    },
    {
      id: "fleet-anti-pattern",
      unlockAfterEventId: "attempt-completed",
      kind: "anti-pattern",
      cfg: {
        keepWarm: false,
        prompts: "varied",
        width: 8,
        mcp: [false, false, false, false]
      },
      comparisonQuestion:
        "Why is the Cy-and-Dev pair off the frontier?",
      revealCopy:
        "Cy and Dev net $32.00 in 105 minutes; Bea and Dev net $34.00 in only 45 minutes."
    }
  ],

  tape: LEVEL_13_TAPE,
  result: LEVEL_13_RESULT,
  vocabulary: LEVEL_13_VOCABULARY,
  qa: LEVEL_13_QA
};
```

`AUDIT_REPORT_UNITS`, `AUDIT_CONTEXTS`, and `AUDIT_PREFIX_STACKS` instantiate only the nine request IDs and token buckets in §6. They introduce no additional priced requests.

Each `AuditCauseSeed.valueId` is opaque. Presentation looks up its display amount only after `loss-values-revealed`; `AuditValueMatchingState` stores IDs rather than comparing floating-point dollar values.

The scenario resolver maps each accepted `remediationId` to the named setup, risk, and delivery fixtures. No gameplay fiction is stored in `estimates`.

`referenceCfg` maps through `AuditCauseSeed.remediationIds` to targeted Ari and Bea remedies. `antiCfg` maps to targeted Cy and Dev remedies. Target bindings are scenario evidence, not extra `Config` keys.

The scalar `$90.00` `budget` is the month spend budget from fixture `l13-budget-usd`, calibrated to `C31`. The `$692.00` amount exists only as the hidden-loss decomposition from `C17`; it is never assigned to `budget` or `wallet`.

## 6. Pricing walkthrough

All request prices use `PRICE_REQUEST`. Input-side multipliers and output `5x` come from `C1`; all requests use Sonnet rates from `C3`.

This is the single authoritative request-price table for the level:

| Request ID | Report role | Count | Read | Input | Write | Output | Tier | Exact per-request cost |
|---|---|---:|---:|---:|---:|---:|---|---:|
| `ari-warm` | warm main request | `1` | `34,738` | `6,000` | `0` | `44,000` | `1h` | `34,738×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.68842140` |
| `ari-expired` | expired main-prefix rebuild | `1` | `0` | `6,000` | `34,738` | `44,000` | `1h` | `6,000×$3/M + 34,738×$6/M + 44,000×$15/M = $0.88642800` |
| `bea-drifting` | front-varied delegated spawn | `1` | `11,602` | `6,000` | `14,623` | `44,000` | `5m` | `11,602×$0.30/M + 6,000×$3/M + 14,623×$3.75/M + 44,000×$15/M = $0.73631685` |
| `cy-wave-1`, `cy-wave-4` | cold delegated spawn | `2` | `0` | `6,000` | `26,237` | `44,000` | `5m` | `6,000×$3/M + 26,237×$3.75/M + 44,000×$15/M = $0.77638875` |
| `cy-wave-2`, `cy-wave-3` | warm delegated spawn | `2` | `26,237` | `6,000` | `0` | `44,000` | `5m` | `26,237×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.68587110` |
| `dev-mcp-rewrite` | needless full tool-definition rewrite | `1` | `0` | `6,000` | `16,295` | `44,000` | `1h` | `6,000×$3/M + 16,295×$6/M + 44,000×$15/M = $0.77577000` |
| `eli-warm` | legitimate output-heavy delivery sample | `1` | `34,738` | `6,000` | `0` | `44,000` | `1h` | `34,738×$0.30/M + 6,000×$3/M + 44,000×$15/M = $0.68842140` |

Request and unit totals:

```text
Ari:  $0.68842140 + $0.88642800 = $1.57484940
Bea:  $0.73631685
Cy:   2×$0.77638875 + 2×$0.68587110 = $2.92451970
Dev:  $0.77577000
Eli:  $0.68842140

Total sampled API spend = $6.69987735
Month wallet remaining = $90.00 − $6.69987735 = $83.30012265
```

Traceability:

- `34,738` main prefix: `C34`, measured from `C6`.
- `26,237` identical delegated prefix: `C10`.
- `11,602` read plus `14,623` rewrite for early prompt variation: `C11`.
- `16,295` main tool definitions: `C24`.
- `6,000` fresh work input and `44,000` output per task: `C28`.
- `5m`, `60m`, input/read/write multipliers, and output `5x`: `C1`.
- Sonnet’s `$3/M` input, `$0.30/M` read, `$3.75/M` 5m write, `$6/M` 1h write, and `$15/M` output: `C3`.
- Cy’s three-wave warm boundary: `C27`.
- Ari’s `272` rebuilds and `$575.00` monthly loss: `C13–C14`.
- Fleet rollup and hidden-cost decomposition: `C15–C17`.

The sampled request spend and organizational audit values are different quantities:

- Scalar month `budget`: `$90.00`.
- Sampled API spend and `attemptMetrics.spentUsd`: `$6.69987735`.
- Scalar `wallet` after ingest: `$83.30012265`.
- Baseline causal hidden loss: `$692.00` (`C17`).
- Highest-net frontier reference: recover `$647.00` gross; reserve `$390.00`; net `$257.00`; leave `$45.00` causal loss.
- Dominated anti-pattern: recover `$45.00` gross; reserve `$13.00`; net `$32.00`; leave `$647.00` causal loss.
- The gross-recovery difference between those two informational plans remains `$602.00`.

Remediation implementation cost and risk reserve mutate `hidden.reworkUsd`; they are not model requests and never mutate `wallet`, `ledger`, or `attemptMetrics.spentUsd`.

No positive request renders as `$0.0000`; exact request values remain unrounded in state.

## 7. Tape sequence

Before ranking lock, reports expose request evidence while masking causal-bucket dollars.

Ledger and tape order is fixed by the report-ingest sequence:

1. `ari-warm`
2. `ari-expired`
3. `bea-drifting`
4. `cy-wave-1`
5. `cy-wave-2`
6. `cy-wave-3`
7. `cy-wave-4`
8. `dev-mcp-rewrite`
9. `eli-warm`

Per-report presentation:

1. Ari’s `ari-warm` row renders blue input-side reuse.
2. Ari’s idle gap drains `UI_TTL_DRAIN_BAR`.
3. `ari-expired` renders the expired `34,738`-token prefix in red; its bracket expands to **“272 rebuilds”** (`C13`).
4. Bea renders `11,602 read │ 14,623 write` (`C11`). Her normalized warm counterfactual remains hidden until attempt completion.
5. Cy renders wave one cold, waves two and three warm, and wave four cold after the shared `5m` entry expires (`C27`).
6. Dev renders the `16,295`-token `PB_MCP` rewrite (`C24`).
7. Eli renders one legitimate output-heavy request and the separate monthly `8,800,000`-output-token headline.
8. After `fleet-biggest-lever` commits, the four dollar tiles animate into a neutral tray in order `$30`, `$575`, `$15`, `$72`; no cause label appears.
9. During value matching, player-created lines connect tiles to cause cards without correctness color.
10. After `SUBMIT_AUDIT_VALUE_MATCHES`, the authored cause-dollar joins animate. Incorrect submitted joins remain briefly dotted so the correction is legible.
11. Aha frame: Eli’s monthly token headline remains visually largest while Ari’s quieter evidence receives the `$575.00` bracket.
12. Remedy cards then reveal separate gross, setup, risk, net, and delivery columns; none is encoded only in prose.
13. Each accepted remedy folds its matching causal bracket, raises the reducer-backed implementation-burden meter, consumes one visible marker, and advances the delivery clock.
14. After the second marker locks, the result plots the selected pair against all six points on the net-benefit-versus-delivery-time plane.
15. Frontier pairs receive a solid outline. Dominated pairs receive an arrow to the exact pair that has at least as much net benefit in no more time.
16. Reference and anti-pattern overlays remain locked until `COMPLETE_ATTEMPT`.

`UI_TAPE_RENDERER` uses the canonical USD-proportional `WireSegment` geometry:

```text
segment.widthRatio = segment.usd / LedgerRow.usd
```

The output segment is always included:

```text
outputUsd = outTok × 5 × MODEL_IN[model] / 1,000,000
```

For `ari-warm` and `eli-warm`, output contributes:

```text
$0.66000000 / $0.68842140 = 95.8715%
```

of the row’s visual width (`C1`, `C3`, `C28`). Output labels may be delayed, but `outTok` is never omitted from bar geometry.

Every priced tape row maps one-to-one to a `LedgerRow`. Monthly brackets, value tiles, token headlines, matching lines, remedy markers, implementation-burden meters, and frontier points are annotations, never extra requests.

## 8. Prediction prompts

### `fleet-biggest-lever`

Question:

**“Will the biggest token headline also hide the biggest recoverable loss?”**

Options:

- `same-report` — **“Yes—the largest token total will also lead the loss.”**
- `different-report` — **“No—a quieter report will hide more.”**
- `near-tie` — **“The top two will be nearly tied.”**

Correct option: `different-report`.

Commit copy: **“Lock my call.”**

The value reveal is disabled until commitment. The revealed answer distinguishes visible volume from recoverable loss without identifying which cause owns any of the four dollar values.

Correctness affects only the post-reveal comparison caption.

### `fleet-next-month`

Question:

**“Which result profile will your two remedies produce?”**

Options:

- `high-return` — **“High net benefit, with a longer rollout.”**
- `balanced` — **“Less net benefit, with a shorter rollout.”**
- `dominated` — **“Another pair will beat it on both net benefit and time.”**

The correct option derives from the submitted remediation pair. Ari + Bea maps to `high-return`; Ari + Dev, Bea + Cy, and Bea + Dev map to `balanced`; Ari + Cy and Cy + Dev map to `dominated`.

No aggregate bracket, net total, or frontier status animates before commitment. Correctness never affects score, stars, wallet, failure, recovery, or gate passage.

## 9. Fail-state

This level defines no `FailureRuleDef` and never dispatches `FREEZE_FAILURE`.

Remediation projections are not priced `Request` events. Freezing at a two-remedy result or after `COMPLETE_ATTEMPT` would violate request-local failure causality. The former fleet-collateral branch is removed rather than retained as a dominated trap.

A dominated pair remains a reachable, fully completable attempt:

- Ari + Cy records `audit-plan-dominated-ari-cy`.
- Cy + Dev records `audit-plan-dominated-cy-dev`.

The decisive evidence appears immediately when the second actual-attempt `APPLY_REMEDIATION` resolves:

```text
Ari + Cy: $255 net in 270m
Ari + Bea: $257 net in 210m

Cy + Dev: $32 net in 105m
Bea + Dev: $34 net in 45m
```

Exact copy:

- **“Ari + Bea nets $2.00 more and finishes 60 minutes sooner.”**
- **“Bea + Dev nets $2.00 more and finishes 60 minutes sooner.”**

`UI_REWIND_CONTROL` immediately offers **“Revise remedies”** at checkpoint `audit-remediation`. The player may instead continue, commit the result prediction, reveal the outcome, and complete a deterministic `gate-failed` attempt.

No comparison, prediction, reference event, anti-pattern event, or completed-attempt event can dispatch `FREEZE_FAILURE`.

## 10. Gate & stars

The behavioral pass condition is:

```text
"loss-values-revealed" completed
AND
SUBMIT_AUDIT_VALUE_MATCHES observed after "loss-values-revealed"
AND
"audit-value-matches-submitted" completed
AND
"loss-ledger-revealed" completed
AND, after "loss-ledger-revealed":
  two developer-targeted APPLY_REMEDIATION actions consume the two markers
AND
the second APPLY_REMEDIATION appends "audit-efficient-frontier"
AND
"next-month-result-revealed" completed
```

The accepted evidence-backed frontier consists of:

```text
Ari + Bea
Ari + Dev
Bea + Cy
Bea + Dev
```

The gate does not hard-code Ari + Bea. Every remedy appears in at least one passing pair:

```text
Ari → Ari + Bea or Ari + Dev
Bea → Ari + Bea, Bea + Cy, or Bea + Dev
Cy  → Bea + Cy
Dev → Ari + Dev or Bea + Dev
```

The gate and `pass(st)` read only canonical reducer paths:

```ts
const pass = (st: ReducerState): GateResult => {
  const diagnosisSubmitted =
    st.completedEventIds.includes("audit-value-matches-submitted");
  const frontierPlan =
    st.completedTransferIds.includes("audit-efficient-frontier");
  const resultRevealed =
    st.completedEventIds.includes("next-month-result-revealed");

  return {
    pass: diagnosisSubmitted && frontierPlan && resultRevealed,
    reason:
      "The player completed the diagnosis and committed a reducer-recorded plan on the evidence-backed net-benefit and delivery-time frontier.",
    evidence: [
      "value-matching-submitted-after-values",
      "remediation-applied-after-ledger",
      "efficient-frontier-plan-recorded",
      "simulation-completed"
    ]
  };
};
```

- **1 star:** pass with any of the four efficient-frontier pairs. Ranking or value-match accuracy may be imperfect; both predictions may be wrong.
- **2 stars:** pass and submit the exact pre-reveal ranking `idle → delegate → 5m-band → MCP`.
- **3 stars:** satisfy the two-star ranking, match all four unlabeled values exactly, and record `audit-plan-high-return-clean` by applying Ari then Bea without replacement or rewind after `loss-ledger-revealed`.

The central choice is a real reducer-visible tradeoff:

- Ari + Bea maximizes net benefit at `$257` but takes `210m`.
- Ari + Dev gives up `$10` net to finish `15m` sooner.
- Bea + Cy reduces implementation exposure while retaining `$42` net.
- Bea + Dev finishes in `45m` with `$34` net.
- Setup and risk mutate `hidden.reworkUsd`.
- Delivery mutates `clockMin`.
- The pair classification mutates `completedTransferIds` and determines passage or stars.

The pre-reveal ranking has a truthful scoring consequence through the second star. It never controls passage, wallet, or failure.

`COMMIT_PREDICTION`, selected prediction option IDs, and prediction correctness appear in no gate, star, wallet mutation, or `pass(st)` decision.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First report opens | **“Reports show activity. Look for frequency, identity, timing, and load.”** |
| Eli opens | **“Big token totals can be real work. Keep reading.”** |
| Ranking submit attempted with fewer than four causes | **“Place all four reports before locking the order.”** |
| Ranking locks | **“Report order locked. Make one call before the ledger opens.”** |
| Unlabeled values reveal | **“Four values. No labels. Match each one to its report evidence.”** |
| First value moves | **“Each value and cause can be used once.”** |
| Value submission attempted before a complete bijection | **“Every value needs one cause.”** |
| Exact value matching reveals | **“All four diagnoses hold.”** |
| Inexact value matching reveals | **“Compare the dotted calls with the evidence-backed joins.”** |
| Remediation controls unlock | **“Evidence is joined. You have two remedies.”** |
| Implementation columns reveal | **“Recovery is only one side: setup, risk, and delivery now count.”** |
| First remedy locks | **“One marker left. Compare what the second choice adds.”** |
| Ari + Bea resolves | **“Highest net: $257.00 in 210 minutes.”** |
| Ari + Dev resolves | **“Balanced frontier: $247.00 in 195 minutes.”** |
| Bea + Cy resolves | **“Lower-burden frontier: $42.00 in 120 minutes.”** |
| Bea + Dev resolves | **“Fast frontier: $34.00 in 45 minutes.”** |
| Ari + Cy resolves | **“Ari + Bea nets $2.00 more and finishes 60 minutes sooner.”** |
| Cy + Dev resolves | **“Bea + Dev nets $2.00 more and finishes 60 minutes sooner.”** |
| Reference simulation opens | **“$647.00 gross − $390.00 implementation reserve = $257.00 net.”** |
| Anti-pattern opens | **“$45.00 gross − $13.00 implementation reserve = $32.00 net.”** |
| Result screen opens | **“The $90 wallet tracked API spend; the $692 ledger tracked causal loss; implementation burden stayed in the audit.”** (`C17`, `C31`) |

## 12. QA gate

Real-browser click-through must assert:

1. The first report is clickable within two seconds; no Learn screen precedes it.
2. `ENTER_LEVEL` uses `"13-fleet-audit"`, and `concept.id` plus all twelve prerequisites resolve through the canonical registries.
3. `concept.solutionVocabulary` is present.
4. `conceptScope.kind === "capstone-integration"`.
5. `conceptScope.reusedConceptIds` exactly equals `prerequisiteConceptIds`; no undeclared concept is integrated.
6. Scalar `budget` and initial scalar `wallet` resolve from fixture `l13-budget-usd` to `$90.00`, never `$692.00`.
7. The clock cap resolves from fixture `l13-clock-cap-min`; the seed resolves from fixture `l13-seed`.
8. The four hidden-loss buckets sum to `$692.00` (`C17`) and never mutate `wallet`.
9. The scripted ingest creates exactly nine `LedgerRow`s and exactly nine priced tape rows.
10. The nine rows spend exactly `$6.69987735`, set `attemptMetrics.spentUsd` to `$6.69987735`, and leave scalar `wallet = $83.30012265`.
11. After completion, `attemptResult.spentUsd = $6.69987735` for every remediation pair.
12. Every real request has `usd > 0`; no positive value renders as `$0.0000`.
13. Each request total exactly matches `PRICE_REQUEST` using `C1` and `C3`.
14. `UI_TAPE_RENDERER` rows equal ledger rows in count, order, request ID, token buckets, and USD.
15. Every tape segment uses `segment.usd / row.usd`; `outTok` contributes to every row’s geometry.
16. Static final bars still show output width without requiring hover.
17. No recoverable dollar, canonical ordering, correct value matching, implementation burden, frontier answer, or Eli `$0.00` appears before `SUBMIT_AUDIT_RANKING` and `COMMIT_PREDICTION("fleet-biggest-lever")`.
18. `SET_AUDIT_RANKING` accepts only a four-cause permutation.
19. `REVEAL_PREDICTION` is rejected before its matching `COMMIT_PREDICTION`.
20. `loss-values-revealed` displays exactly `$30.00`, `$575.00`, `$15.00`, and `$72.00` in that order.
21. Every revealed dollar uses its opaque `AuditCauseSeed.valueId`; none is visually labeled or aligned to a cause before `SUBMIT_AUDIT_VALUE_MATCHES`.
22. `SET_AUDIT_VALUE_MATCH` writes only `auditValueMatching.assignmentsByValueId[valueId]`.
23. Each value and cause can be used once; submission requires a complete bijection.
24. The exact authored mapping is `loss-v575 → idle`, `loss-v72 → delegate`, `loss-v30 → 5m-band`, and `loss-v15 → MCP`.
25. The calibrated `$72`, `$30`, and `$15` values are defined once as named fixtures and referenced symbolically by `AuditCauseSeed.lossUsd`.
26. An inaccurate value matching reveals corrections but changes no wallet, failure, or gate eligibility.
27. The pre-reveal ranking does not affect passage, wallet, or failure.
28. The exact pre-reveal ranking is required for two stars, so ranking accuracy has a truthful scoring consequence.
29. An incorrect `fleet-biggest-lever` or `fleet-next-month` prediction changes no score, star, wallet, failure, or gate result.
30. Remedies remain disabled until `loss-ledger-revealed`.
31. `markerInventories["l13-remediation-slots"].capacity` resolves from fixture `l13-remediation-slot-capacity`.
32. Exactly two remediation markers exist, and every accepted remedy consumes exactly one available marker.
33. The inventory cannot lock before two placements and cannot accept a third placement.
34. Remedy choice and developer confirmation are visually distinct, keyboard-reachable sub-beats.
35. `target: "fleet"` is unavailable in the UI and rejected by the reducer adapter without mutation.
36. Each matching remedy/developer pair deterministically produces its specified recovery, setup cost, risk reserve, and delivery time.
37. A mismatched developer/remedy pair is rejected before marker consumption and creates no fake `LedgerRow`.
38. Each accepted remedy increments `hidden.reworkUsd` by setup plus risk, advances `clockMin` by its delivery fixture, and leaves `wallet` and `attemptMetrics.spentUsd` unchanged.
39. Ari’s bracket contains `272` rebuilds and rolls up to `$575.00`.
40. The causal order is exactly `idle > delegate > 5m-band > MCP`.
41. Eli’s `8,800,000` output-token headline is visually largest, while no cache remedy is credited with recovering legitimate output.
42. All six pair totals exactly match the fixture-backed arithmetic in §4.
43. Ari + Bea, Ari + Dev, Bea + Cy, and Bea + Dev append `audit-efficient-frontier` and pass after result reveal.
44. Ari + Cy does not append `audit-efficient-frontier` because Ari + Bea has greater net benefit and shorter delivery.
45. Cy + Dev does not append `audit-efficient-frontier` because Bea + Dev has greater net benefit and shorter delivery.
46. Every individual remedy appears in at least one passing efficient-frontier pair.
47. Exact ranking alone followed by a dominated pair fails.
48. Exact value matching alone followed by a dominated pair fails.
49. An inaccurate ranking, inaccurate value matching, and both wrong predictions still pass when the player later commits a frontier pair.
50. Dominated plans remain fully completable and produce deterministic `gate-failed` results rather than punitive freezes.
51. No actual-attempt, result, completion, counterfactual, reference, or anti-pattern event dispatches `FREEZE_FAILURE`.
52. `failureRules` is empty; there is no post-result or non-request freeze.
53. `REWIND_TO_CHECKPOINT("audit-remediation")` preserves ranking, value matching, and labeled loss evidence while removing remediation cost, time, markers, and transfer IDs.
54. `REWIND_TO_CHECKPOINT("audit-value-matching")` preserves the reports and unlabeled values but removes submitted assignments and corrected joins.
55. `REWIND_TO_CHECKPOINT("audit-ranking")` unlocks ranking while preserving the ingested request sample.
56. The reference run is winnable and yields `$647.00` gross recovery, `$390.00` implementation burden, `$257.00` net benefit, `$45.00` remaining causal loss, and `210m` delivery.
57. The anti-pattern yields `$45.00` gross recovery, `$13.00` implementation burden, `$32.00` net benefit, `$647.00` remaining causal loss, and `105m` delivery.
58. Reference and anti-pattern overlays cannot reveal before `COMPLETE_ATTEMPT`.
59. Two stars require the exact pre-reveal ranking plus a frontier pass.
60. Three stars require the exact ranking, exact `AuditValueMatchingState` assignments, and `completedTransferIds.includes("audit-plan-high-return-clean")`.
61. Every gate and star predicate uses a declared `ReducerState` path and a legal `StatePredicate` kind or comparison op.
62. No predicate uses `op: "contains"` or an object-shaped wallet/budget path.
63. `pass(st)` is pure and reads only `completedEventIds` and `completedTransferIds`.
64. Keyboard and pointer paths produce equivalent ranking, value-matching, prediction, remediation, and rewind actions.
65. Reduced-motion mode produces the same reducer evidence, frontier classification, and exact values.
66. Every gameplay `[FICTION]` value is in `scenarioData.fixtures` with `id`, `semanticRole`, `unit`, and tag.
67. `scenarioData.estimates` contains presentation timing only.
68. Every authoritative gameplay quantity has one implementable source; no superseded price, collateral branch, duplicate hidden-loss fixture, or unreachable result branch appears.
69. The diagnosis remains evidence-based: all four reports expose causal frequency, identity, timing, or load evidence without their dollar answers.
70. The remediation decision remains evidence-based: gross recovery, setup, risk, net, and delivery are visible before either marker locks.
71. `title` and `objective` contain none of `concept.solutionVocabulary`, satisfying mandatory QA assertion #21.
72. The cold-open does not disclose the matching, canonical ordering, implementation values, or frontier result.

## 13. Reference-bar justification

The screen opens as an unexplained, tactile audit desk: the player handles reports before receiving aggregate answers. Each report supplies enough causal evidence to support a reasoned forecast, while Eli’s legitimate output mountain creates a tempting but falsifiable visual heuristic.

The reveal shows four dollar values without labels, developer adjacency, colors, or cause icons. The player must connect each value to frequency, identity, timing, or load evidence. This makes the capstone diagnosis more than a mechanical sort of already-labeled numbers. The exact initial ranking controls the second star, so the forecast has a truthful scoring consequence without becoming punitive.

After diagnosis, recovery alone is no longer the answer. Every remedy exposes reducer-visible setup cost, deterministic risk reserve, and delivery time before commitment. Each accepted remedy consumes a finite marker, changes `hidden.reworkUsd`, advances `clockMin`, and records its identity in `completedTransferIds`.

The gate accepts four non-dominated plans rather than hard-coding Ari + Bea. Ari + Bea maximizes net benefit; Ari + Dev trades `$10` net for a `15m` faster rollout; Bea + Cy offers a lower-burden middle point; Bea + Dev is the fast frontier. Every remedy therefore supplies a real consequential benefit and belongs to at least one passing plan.

Fleet scope is removed. The previous fleet option offered the same recovery plus collateral and was therefore strictly dominated. Removing it preserves the developer-targeting evidence without retaining a prose-only benefit or a punitive trap.

The two dominated pairs remain playable and completable. Their disadvantage becomes visible at the second actual remediation action, and the local remediation checkpoint offers an immediate revision. Because remediation projections are not priced requests, the level defines no `FREEZE_FAILURE`; it never freezes after a full plan, `COMPLETE_ATTEMPT`, or a counterfactual reveal.

The request tape remains economically truthful in an output-heavy capstone because `outTok` contributes its `5x` price to every bar’s geometry. The scalar `$90.00` wallet separately tracks priced API requests, the `$692.00` causal ledger tracks recoverable organizational loss, and `hidden.reworkUsd` tracks implementation cost plus risk reserve. Reference and anti-pattern outcomes appear only after the player owns an attempt and remain informational.

Significant assumption: the `$72.00`, `$30.00`, and `$15.00` causal buckets, Eli’s `200` monthly requests, the two-remedy capacity, and all implementation setup, risk, and delivery values are calibrated `[FICTION]` fixtures. Risk is modeled as a deterministic expected rework reserve so replay remains byte-identical; no stochastic failure probability is introduced.
