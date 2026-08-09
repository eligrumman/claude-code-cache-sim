# Level 13 — The Fleet Audit

## 1. Identity

- `id`: `"13-fleet-audit"`
- `title`: **The Fleet Audit**
- `tier`: `3`
- `objective`: **“Five reports landed. Decide what the fleet does before next month closes.”**
- `concept.id`: `"fleet-leak-triage"`
- One new concept: at fleet scale, diagnose heterogeneous losses from operational evidence before choosing where limited interventions go.
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
- Private designer answer: `idle > delegate > 5m-band > MCP`.
- Post-reveal rule: **“Match dollars to their evidence, then intervene where the recoverable loss is largest.”**
- The two `PredictionPromptDef` answers remain non-punitive.
- The submitted pre-reveal ranking never affects passage, wallet, or failure, but an exact evidence-based ranking is required for the second star.
- L13 uses the formal `ConceptScope` capstone exemption. Its value-matching, limited intervention, and collateral-targeting beats integrate declared prerequisite concepts rather than introducing undeclared concepts.

## 2. Objects used

- `LevelDef`
- `ConceptId`
- `ConceptScope`
- `ReducerState`
- `Action`
- `StatePredicate`
- `GateDef`
- `StarDef`
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
- `CounterfactualDef`
- `FailureRuleDef`
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
- `"fail-freeze-rewind"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

No tutorial card, recoverable-dollar value, canonical ordering, value-to-cause answer, or intervention answer appears before play.

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

Presentation timings and the two-intervention inventory are `[ESTIMATE]`.

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
  The headline is `200 × 44,000`; the monthly request count is `[FICTION]` and output per task is `C28`.

The reports expose causal evidence without dollar labels: Ari exposes frequency and idle timing, Bea exposes an early identity mismatch, Cy exposes cache-window timing, Dev exposes unused schema load, and Eli exposes legitimate output volume.

Eli’s `8,800,000` is the largest token headline. The UI neither labels it waste nor reveals its `$0.00` recoverable cache loss until the player has submitted a complete value-to-cause match.

## 4. Exact event sequence

1. **Enter the level**

   Event: route opens.

   ```ts
   ENTER_LEVEL({ levelId: "13-fleet-audit" })
   ```

   Mutations:

   - Initializes `clockMin = 0`, `endMin = 6_600`, and `dayLen = 300`: `22 × 300m` (`C31`).
   - Initializes scalar `budget = 90` and scalar `wallet = 90` (`C31`).
   - Initializes `attemptMetrics.spentUsd = 0`.
   - Initializes every `HiddenCosts` field to zero.
   - Initializes `auditRanking = []`.
   - Initializes `auditValueMatching.assignmentsByValueId = {}` and `auditValueMatching.locked = false`.
   - Initializes no remedies, completed audit events, or prediction result.
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

   These are billed sample-request costs, not the hidden-loss rollup.

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

   Prediction correctness changes no score, star, wallet, failure, or gate result. The submitted ranking is retained as the evidence for `star2`; it still cannot block passage or cause a freeze.

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

   The tiles have no cause name, developer name, bucket name, icon, color association, or spatial alignment with a report. The four cause cards still show **“Recoverable: ?”**.

   The values sum to `$692.00` and ultimately obey `idle > delegate > 5m-band > MCP` (`C17`), but neither the mapping nor the canonical order is displayed.

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

   Event `loss-ledger-revealed` completes only after all four correct cause-dollar joins are visible:

   | Cause ID | `HiddenCosts` bucket | Recoverable next month |
   |---|---|---:|
   | `idle` | `idleRebuildUsd` | `$575.00` (`C14`) |
   | `delegate` | `delegateUsd` | `$72.00` `[FICTION]` |
   | `5m-band` | `fiveMinuteBandUsd` | `$30.00` `[FICTION]` |
   | `MCP` | `mcpUsd` | `$15.00` `[FICTION]` |

   Eli then receives the annotation **“Recoverable by these cache interventions: $0.00.”** It is not a request price.

8. **Create the remediation checkpoint**

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

   Exactly two post-evidence remediation slots unlock.

   The developer-versus-fleet target selector is presented as a distinct sub-beat inside each slot:

   1. choose a remedy;
   2. choose one evidenced developer or the fleet;
   3. confirm the scope.

   This targeting beat is permitted by L13’s formal `capstone-integration` scope and reuses previously mastered cost-scope reasoning.

9. **Apply the first remedy**

   Player confirms one remedy and scope:

   ```ts
   APPLY_REMEDIATION({
     target,
     targetId,
     remediationId
   })
   ```

   Exact matching recoveries:

   | Remedy | Matching targeted developer | Causal bucket recovered |
   |---|---|---:|
   | `keep-warm-policy` | `ari` | `$575.00` |
   | `normalize-delegation` | `bea` | `$72.00` |
   | `fanout-width` | `cy` | `$30.00` |
   | `trim-mcp` | `dev` | `$15.00` |

   A mismatched targeted remedy recovers `$0.00` and produces no fake `LedgerRow`.

   A fleet-wide remedy recovers its matching bucket but atomically adds:

   ```text
   4 × $40.00 = $160.00 collateral [FICTION]
   ```

   across the four unaffected developers.

10. **Resolve an over-broad policy locally**

    If the first confirmed remedy targets the fleet, its four collateral markers animate with the same actual-attempt action. At event `fleet-collateral-rendered`, dispatch:

    ```ts
    FREEZE_FAILURE({
      failure: {
        failureId: "fleet-collateral",
        causeCode: "BROAD_POLICY_COLLATERAL",
        message:
          "One leak, five rollouts. Four unaffected developers add $160.00 collateral.",
        checkpointId: "audit-remediation"
      }
    })
    ```

    Visible comparison:

    ```text
    actual collateral = $160.00
    targeted alternative collateral = $0.00
    ```

    The actual route is visibly `$160.00` more expensive. `UI_REWIND_CONTROL` resumes immediately before the first remedy. No reference or counterfactual event dispatches this freeze.

11. **Apply the second remedy**

    If unfrozen, the second confirmed selection dispatches `APPLY_REMEDIATION` again and fills the final slot.

    The reference post-evidence order is:

    ```text
    keep-warm-policy → ari
    normalize-delegation → bea
    ```

    No correctness is inferred from either `PredictionPromptDef`.

12. **Commit the result prediction**

    Pressing **“Simulate next month”** dispatches:

    ```ts
    OPEN_PREDICTION({ promptId: "fleet-next-month" })
    SELECT_PREDICTION({
      promptId: "fleet-next-month",
      optionId
    })
    COMMIT_PREDICTION({ promptId: "fleet-next-month" })
    ```

    No recovery bracket, remaining-loss total, or result comparison animates before commitment.

13. **Reveal the chosen remediation outcome**

    The simulation folds resolved causal brackets and leaves untouched brackets visible. It adds no historical `Request`, `LedgerRow`, or wallet charge. It is a projection over the already-priced report evidence and the `AuditCauseSeed` loss ledger.

    For targeted `idle + delegate`:

    ```text
    recovered = $647.00
    remaining hidden loss = $45.00
    collateral = $0.00
    ```

    Event `top-two-targeted-result` completes.

    If the remedies were applied in `idle → delegate` order without replacement or rewind after `loss-ledger-revealed`, event `top-two-targeted-in-order-clean` also completes.

    For targeted `5m-band + MCP`:

    ```text
    recovered = $45.00
    remaining hidden loss = $647.00
    collateral = $0.00
    ```

14. **Freeze the economically decisive low-value pair**

    If the player used both slots on targeted `5m-band + MCP`, the first actual-attempt result frame is event `low-pair-result` and dispatches:

    ```ts
    FREEZE_FAILURE({
      failure: {
        failureId: "low-value-remediation-pair",
        causeCode: "HIGHER_RECOVERY_OMITTED",
        message:
          "You recovered $45.00. The top two causes could recover $647.00; $602.00 was left on the table.",
        checkpointId: "audit-remediation"
      }
    })
    ```

    Visible route comparison:

    ```text
    actual remaining hidden loss = $647.00
    valid top-two remaining hidden loss = $45.00
    excess loss = $602.00
    ```

    Therefore:

    ```text
    actualUsd = $647.00
    validAlternativeUsd = $45.00
    actualUsd > validAlternativeUsd
    ```

    Other suboptimal pairs reach the result screen without a freeze but fail the behavioral gate.

15. **Rewind**

    - **“Revise remedies”**

      ```ts
      REWIND_TO_CHECKPOINT({
        checkpointId: "audit-remediation"
      })
      ```

      Restores state immediately before the first remedy while preserving report inspection, the submitted ranking, the submitted value matching, and the revealed labeled ledger.

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

16. **Complete and unlock comparisons**

    On an unfrozen outcome:

    ```ts
    REVEAL_PREDICTION({
      promptId: "fleet-next-month",
      correctOptionId: derivedFromAppliedRemedies
    })
    ```

    Event `next-month-result-revealed` completes, then:

    ```ts
    COMPLETE_ATTEMPT
    ```

    `attemptResult.spentUsd` snapshots the authoritative `budget - wallet` derivation. Reference and anti-pattern comparisons remain unavailable until `COMPLETE_ATTEMPT`.

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

    These informational actions cannot mutate the actual attempt or dispatch `FREEZE_FAILURE`.

## 5. Level data

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
      "At fleet scale, diagnose heterogeneous losses from evidence before assigning limited interventions.",
    postRevealRule:
      "Match dollars to their evidence, then intervene where the recoverable loss is largest.",
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
      "top two"
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
  seed: 13017,
  budgetUsd: 90,
  clockCapMin: 6600,

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
        lossUsd: 72,
        evidenceRequestIds: ["bea-drifting"],
        remediationIds: ["normalize-delegation"],
        cite: "[FICTION], constrained by C17"
      },
      {
        id: "5m-band",
        valueId: "loss-v30",
        label: "Short-cache misses",
        developerId: "cy",
        bucket: "fiveMinuteBandUsd",
        lossUsd: 30,
        evidenceRequestIds: [
          "cy-wave-1",
          "cy-wave-2",
          "cy-wave-3",
          "cy-wave-4"
        ],
        remediationIds: ["fanout-width"],
        cite: "[FICTION], constrained by C17"
      },
      {
        id: "MCP",
        valueId: "loss-v15",
        label: "Tool-schema load",
        developerId: "dev",
        bucket: "mcpUsd",
        lossUsd: 15,
        evidenceRequestIds: ["dev-mcp-rewrite"],
        remediationIds: ["trim-mcp"],
        cite: "[FICTION], constrained by C17"
      }
    ],

    estimates: [
      {
        label: "delegate hidden-loss bucket USD",
        value: 72,
        tag: "[FICTION]"
      },
      {
        label: "5m-band hidden-loss bucket USD",
        value: 30,
        tag: "[FICTION]"
      },
      {
        label: "MCP hidden-loss bucket USD",
        value: 15,
        tag: "[FICTION]"
      },
      {
        label: "collateral USD per unaffected developer",
        value: 40,
        tag: "[FICTION]"
      },
      {
        label: "Eli monthly output request count",
        value: 200,
        tag: "[FICTION]"
      },
      {
        label: "remediation slot count",
        value: 2,
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
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "idleRebuildUsd",
    cite: "C17",
    line:
      "A low-value fix is expensive when it consumes a slot while a larger recoverable loss remains."
  },

  failureRules: [
    {
      id: "low-value-remediation-pair",
      predicate: {
        id: "low-value-pair-after-ledger",
        kind: "all",
        predicates: [
          {
            id: "l13-ledger-visible-for-low-pair",
            kind: "event-completed",
            eventId: "loss-ledger-revealed"
          },
          {
            id: "l13-cy-remedy-observed",
            kind: "action-observed",
            actionType: "APPLY_REMEDIATION",
            afterEventId: "loss-ledger-revealed",
            match: {
              target: "developer",
              targetId: "cy",
              remediationId: "fanout-width"
            }
          },
          {
            id: "l13-dev-remedy-observed",
            kind: "action-observed",
            actionType: "APPLY_REMEDIATION",
            afterEventId: "loss-ledger-revealed",
            match: {
              target: "developer",
              targetId: "dev",
              remediationId: "trim-mcp"
            }
          }
        ]
      },
      decisiveEventId: "low-pair-result",
      causeCode: "HIGHER_RECOVERY_OMITTED",
      message:
        "You recovered $45.00. The top two causes could recover $647.00; $602.00 was left on the table.",
      checkpointId: "audit-remediation",
      highlightObjectIds: ["cause-idle", "cause-delegate"],
      actualUsd: 647,
      validAlternativeUsd: 45
    },
    {
      id: "fleet-collateral",
      predicate: {
        id: "fleet-remediation-after-ledger",
        kind: "action-observed",
        actionType: "APPLY_REMEDIATION",
        afterEventId: "loss-ledger-revealed",
        match: {
          target: "fleet"
        }
      },
      decisiveEventId: "fleet-collateral-rendered",
      causeCode: "BROAD_POLICY_COLLATERAL",
      message:
        "One leak, five rollouts. Four unaffected developers add $160.00 collateral.",
      checkpointId: "audit-remediation",
      highlightObjectIds: ["fleet-collateral-markers"],
      actualUsd: 160,
      validAlternativeUsd: 0
    }
  ],

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
    predicateId: "fleet-top-two-post-evidence-remediation",
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
        id: "idle-remedy-after-ledger",
        kind: "action-observed",
        actionType: "APPLY_REMEDIATION",
        afterEventId: "loss-ledger-revealed",
        match: {
          target: "developer",
          targetId: "ari",
          remediationId: "keep-warm-policy"
        }
      },
      {
        id: "delegate-remedy-after-ledger",
        kind: "action-observed",
        actionType: "APPLY_REMEDIATION",
        afterEventId: "loss-ledger-revealed",
        match: {
          target: "developer",
          targetId: "bea",
          remediationId: "normalize-delegation"
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
        id: "top-two-recovered",
        kind: "event-completed",
        eventId: "top-two-targeted-result"
      },
      {
        id: "simulation-completed",
        kind: "event-completed",
        eventId: "next-month-result-revealed"
      }
    ]
  },

  pass: st => ({
    pass:
      st.completedEventIds.includes("audit-value-matches-submitted") &&
      st.completedEventIds.includes("top-two-targeted-result") &&
      st.completedEventIds.includes("next-month-result-revealed"),
    reason:
      "The player completed the value diagnosis, then applied both largest remedies to their evidenced developers.",
    evidence: [
      "value-matching-submitted-after-values",
      "idle-remedy-after-ledger",
      "delegate-remedy-after-ledger",
      "top-two-recovered",
      "simulation-completed"
    ]
  }),

  star2: {
    label: "Forecast all four causes in the correct order before values appear",
    predicate: {
      id: "exact-pre-reveal-ranking",
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
          id: "l13-star2-pass-result",
          kind: "event-completed",
          eventId: "top-two-targeted-result"
        }
      ]
    },
    reason:
      "The initial report evidence was sufficient to forecast the complete loss order."
  },

  star3: {
    label: "Match every value and transfer the top two cleanly",
    predicate: {
      id: "exact-diagnosis-and-clean-transfer",
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
          path:
            "auditValueMatching.assignmentsByValueId.loss-v575",
          op: "eq",
          value: "idle"
        },
        {
          id: "l13-match-v72-delegate",
          kind: "compare",
          path:
            "auditValueMatching.assignmentsByValueId.loss-v72",
          op: "eq",
          value: "delegate"
        },
        {
          id: "l13-match-v30-five-minute",
          kind: "compare",
          path:
            "auditValueMatching.assignmentsByValueId.loss-v30",
          op: "eq",
          value: "5m-band"
        },
        {
          id: "l13-match-v15-mcp",
          kind: "compare",
          path:
            "auditValueMatching.assignmentsByValueId.loss-v15",
          op: "eq",
          value: "MCP"
        },
        {
          id: "l13-clean-targeted-order",
          kind: "event-completed",
          eventId: "top-two-targeted-in-order-clean"
        }
      ]
    },
    reason:
      "The player diagnosed every unlabeled value and transferred that evidence into the clean targeted plan without replacement or rewind."
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
        "What if both slots targeted the two largest evidenced causes?",
      revealCopy:
        "Targeted idle and delegation remedies recover $647.00 and leave $45.00 hidden loss."
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
        "What if both slots went to the two smallest causes?",
      revealCopy:
        "Fan-out and MCP remedies recover $45.00 and leave $647.00 hidden loss."
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

`referenceCfg` maps through `AuditCauseSeed.remediationIds` to targeted Ari and Bea remedies. `antiCfg` maps to targeted Cy and Dev remedies. Target bindings are scenario evidence, not extra `Config` keys.

The scalar `$90.00` `budget` is the month spend budget from `C31`. The `$692.00` amount exists only as the hidden-loss decomposition from `C17`; it is never assigned to `budget` or `wallet`.

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

The sampled request spend and hidden-loss ledger are different quantities:

- Scalar month `budget`: `$90.00` (`C31`).
- Sampled API spend and `attemptMetrics.spentUsd`: `$6.69987735`.
- Scalar `wallet` after ingest: `$83.30012265`.
- Baseline hidden loss: `$692.00` (`C17`).
- Three-star reference: recover `$647.00`; remaining hidden loss `$45.00`; collateral `$0.00`.
- Anti-pattern: recover `$45.00`; remaining hidden loss `$647.00`; excess hidden loss versus reference `$602.00`.

No hidden-loss recovery mutates `wallet`. No positive request renders as `$0.0000`; exact values remain unrounded in state.

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
12. During result reveal, chosen causal brackets fold to `$0.00`; untouched brackets remain.
13. A fleet-wide remedy paints four collateral markers before the actual-attempt `FREEZE_FAILURE`.
14. Reference and anti-pattern overlays remain locked until `COMPLETE_ATTEMPT`.

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

Every priced tape row maps one-to-one to a `LedgerRow`. Monthly brackets, value tiles, token headlines, recoverable-dollar annotations, matching lines, and collateral markers are annotations, never extra requests.

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

**“What will your two remedies do next month?”**

Options:

- `targeted-top-two` — **“Remove the two largest recoverable losses.”**
- `some-savings` — **“Save money, but leave a larger cause untouched.”**
- `collateral` — **“Recover a leak but spread policy cost across the fleet.”**

The correct option derives from the submitted remediation plan. For the reference plan it is `targeted-top-two`.

No outcome bracket or result tape animates before commitment. Correctness never affects score, stars, wallet, failure, recovery, or gate passage.

## 9. Fail-state

### Low-value remediation pair

Reachable route: after `loss-ledger-revealed`, the player uses both targeted slots on Cy and Dev.

Decisive actual-attempt event: `low-pair-result`, the first result frame for the submitted two-slot plan.

Visible economics:

```text
chosen recovery = $45.00
chosen remaining hidden loss = $647.00
valid top-two remaining hidden loss = $45.00
excess loss = $602.00
```

Freeze copy:

**“You recovered $45.00. The top two causes could recover $647.00; $602.00 was left on the table.”**

`FailureRuleDef` comparison:

```text
actualUsd = $647.00
validAlternativeUsd = $45.00
actualUsd > validAlternativeUsd
```

Rewind copy: **“Revise remedies.”**

Destination: `audit-remediation`.

### Over-broad policy

Reachable route: after `loss-ledger-revealed`, the player confirms any matching remedy with `target: "fleet"` instead of its evidenced developer.

Decisive actual-attempt event: `fleet-collateral-rendered`, produced by the same atomic `APPLY_REMEDIATION` action that paints the first unaffected report and all four collateral markers.

Visible economics:

```text
fleet-wide collateral = 4 × $40.00 = $160.00 [FICTION]
targeted collateral = $0.00
```

Freeze copy:

**“One leak, five rollouts. Four unaffected developers add $160.00 collateral.”**

`FailureRuleDef` comparison:

```text
actualUsd = $160.00
validAlternativeUsd = $0.00
actualUsd > validAlternativeUsd
```

Rewind copy: **“Target this fix.”**

Destination: `audit-remediation`.

Both freezes preserve report inspection, the submitted ranking, the submitted value matching, and revealed dollar evidence. Neither predicate inspects either prediction’s selection or correctness.

No `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, reference event, or anti-pattern event may dispatch either freeze.

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
  targeted keep-warm-policy applied to Ari
AND
  targeted normalize-delegation applied to Bea
AND
"top-two-targeted-result" completed
AND
"next-month-result-revealed" completed
```

The gate and `pass(st)` read only canonical reducer state and legal `StatePredicate` forms:

```ts
const pass = (st: ReducerState): GateResult => ({
  pass:
    st.completedEventIds.includes("audit-value-matches-submitted") &&
    st.completedEventIds.includes("top-two-targeted-result") &&
    st.completedEventIds.includes("next-month-result-revealed"),
  reason:
    "The player completed the value diagnosis, then applied both largest remedies to their evidenced developers.",
  evidence: [
    "value-matching-submitted-after-values",
    "idle-remedy-after-ledger",
    "delegate-remedy-after-ledger",
    "top-two-recovered",
    "simulation-completed"
  ]
});
```

No invented recovery or collateral state path appears in the gate. Exact recovery and collateral values are deterministic consequences of the observed `APPLY_REMEDIATION` actions and authored `AuditCauseSeed`s.

- **1 star:** pass the behavioral gate. Ranking or value-match accuracy may be imperfect; both predictions may be wrong.
- **2 stars:** pass and submit the exact pre-reveal ranking `idle → delegate → 5m-band → MCP`.
- **3 stars:** satisfy the two-star ranking, match all four unlabeled values exactly, and apply targeted Ari then Bea remedies without replacement or rewind after `loss-ledger-revealed`.

The pre-reveal ranking therefore has a truthful scoring consequence: its accuracy controls the second star. It never controls passage, wallet, or failure.

`COMMIT_PREDICTION`, selected prediction option IDs, and prediction correctness appear in no gate, star, failure predicate, wallet mutation, or `pass(st)` decision.

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
| Targeted remedy matches its developer | **“Target matched: one remedy touches one causal bucket.”** |
| Targeted remedy mismatches | **“No matching evidence in this report.”** |
| Fleet scope opens | **“Fleet-wide reaches four unaffected developers too.”** |
| Reference simulation removes the idle bucket | **“272 rebuilds removed from next month.”** (`C13`) |
| Second reference remedy lands | **“Top two recovered: $647.00. Remaining hidden loss: $45.00.”** |
| Anti-pattern result | **“You fixed $45.00 and left $647.00 recoverable.”** |
| Result screen opens | **“The $90 wallet tracked API spend; the $692 ledger tracked recoverable loss.”** (`C17`, `C31`) |

## 12. QA gate

Real-browser click-through must assert:

1. The first report is clickable within two seconds; no Learn screen precedes it.
2. `ENTER_LEVEL` uses `"13-fleet-audit"`, and `concept.id` plus all twelve prerequisites resolve through the canonical registries.
3. `conceptScope.kind === "capstone-integration"`.
4. `conceptScope.reusedConceptIds` exactly equals `prerequisiteConceptIds`; no undeclared concept is integrated.
5. Scalar `budget` and initial scalar `wallet` are `$90.00` (`C31`), never `$692.00`.
6. The four hidden-loss buckets sum to `$692.00` (`C17`) and never mutate `wallet`.
7. The scripted ingest creates exactly nine `LedgerRow`s and exactly nine priced tape rows.
8. The nine rows spend exactly `$6.69987735`, set `attemptMetrics.spentUsd` to `$6.69987735`, and leave scalar `wallet = $83.30012265`.
9. After completion, `attemptResult.spentUsd = $6.69987735`.
10. Every real request has `usd > 0`; no positive value renders as `$0.0000`.
11. Each request total exactly matches `PRICE_REQUEST` using `C1` and `C3`.
12. `UI_TAPE_RENDERER` rows equal ledger rows in count, order, request ID, token buckets, and USD.
13. Every tape segment uses `segment.usd / row.usd`; `outTok` contributes to every row’s geometry.
14. Static final bars still show output width without requiring hover.
15. No recoverable dollar, canonical ordering, correct value matching, remedy answer, or Eli `$0.00` appears before `SUBMIT_AUDIT_RANKING` and `COMMIT_PREDICTION("fleet-biggest-lever")`.
16. `SET_AUDIT_RANKING` accepts only a four-cause permutation.
17. `REVEAL_PREDICTION` is rejected before its matching `COMMIT_PREDICTION`.
18. `loss-values-revealed` displays exactly `$30.00`, `$575.00`, `$15.00`, and `$72.00` in that order.
19. Every revealed dollar uses its opaque `AuditCauseSeed.valueId`; none is visually labeled or aligned to a cause before `SUBMIT_AUDIT_VALUE_MATCHES`.
20. `SET_AUDIT_VALUE_MATCH` writes only `auditValueMatching.assignmentsByValueId[valueId]`.
21. Each value and cause can be used once; submission requires a complete bijection.
22. The exact authored mapping is `loss-v575 → idle`, `loss-v72 → delegate`, `loss-v30 → 5m-band`, and `loss-v15 → MCP`.
23. An inaccurate value matching reveals corrections but changes no wallet or failure state.
24. The pre-reveal ranking does not affect passage, wallet, or failure.
25. The exact pre-reveal ranking is required for two stars, so ranking accuracy has a truthful scoring consequence.
26. An incorrect `fleet-biggest-lever` or `fleet-next-month` prediction changes no score, star, wallet, failure, or gate result.
27. Remedies remain disabled until `loss-ledger-revealed`.
28. Two and only two remediation slots may be committed.
29. Remedy choice and scope confirmation are visually separate, keyboard-reachable sub-beats.
30. Each targeted remedy/developer pair deterministically produces the specified recovery; mismatches recover zero and create no fake `LedgerRow`.
31. Ari’s bracket contains `272` rebuilds and rolls up to `$575.00`.
32. The causal order is exactly `idle > delegate > 5m-band > MCP`.
33. Eli’s `8,800,000` output-token headline is visually largest, while no cache remedy is credited with recovering legitimate output.
34. Targeted Ari and Bea remedies applied after `loss-ledger-revealed` pass even if the earlier ranking, value matching, and both predictions were wrong.
35. Exact ranking alone followed by wrong remediations fails.
36. Exact value matching alone followed by wrong remediations fails.
37. Targeted `5m-band + MCP` freezes during the actual attempt with `actualUsd = $647.00`, `validAlternativeUsd = $45.00`, and a visible `$602.00` difference.
38. A fleet-wide remedy freezes during the actual attempt with `actualUsd = $160.00`, `validAlternativeUsd = $0.00`, and four visible `$40.00` collateral markers.
39. No harmless, equal-cost, or cheaper route dispatches `FREEZE_FAILURE`.
40. No counterfactual, reference, or anti-pattern request or reveal dispatches `FREEZE_FAILURE`.
41. `REWIND_TO_CHECKPOINT("audit-remediation")` preserves ranking, value matching, and labeled loss evidence.
42. `REWIND_TO_CHECKPOINT("audit-value-matching")` preserves the reports and unlabeled values but removes submitted assignments and corrected joins.
43. `REWIND_TO_CHECKPOINT("audit-ranking")` unlocks ranking while preserving the ingested request sample.
44. The reference run is winnable and yields `$647.00` recovery, `$45.00` remaining hidden loss, and `$0.00` collateral.
45. The anti-pattern yields `$45.00` recovery, `$647.00` remaining hidden loss, and `$602.00` excess loss versus reference.
46. Reference and anti-pattern overlays cannot reveal before `COMPLETE_ATTEMPT`.
47. Two stars require the exact pre-reveal ranking.
48. Three stars require the exact ranking, exact `AuditValueMatchingState` assignments, and `top-two-targeted-in-order-clean`.
49. Every gate, star, and failure predicate uses a declared `ReducerState` path and a legal `StatePredicate` kind or comparison op.
50. No predicate uses `op: "contains"` or an object-shaped wallet/budget path.
51. Keyboard and pointer paths produce equivalent ranking, value-matching, prediction, remediation, and rewind actions.
52. Reduced-motion mode produces the same final evidence and exact values.
53. Every authoritative quantity has one implementable value; no superseded price, alternate budget, or unreachable result branch appears.
54. The diagnosis remains evidence-based: all four reports expose causal frequency, identity, timing, or load evidence without their dollar answers.
55. `title` and `objective` contain none of `concept.solutionVocabulary`, satisfying mandatory QA assertion #21.
56. The cold-open does not disclose the matching, canonical ordering, winning targets, or collateral outcome.

## 13. Reference-bar justification

The screen opens as an unexplained, tactile audit desk: the player handles reports before receiving aggregate answers. Each report supplies enough causal evidence to support a reasoned forecast, while Eli’s legitimate output mountain creates a tempting but falsifiable visual heuristic.

The reveal shows four dollar values without labels, developer adjacency, colors, or cause icons. The player must connect each value to frequency, identity, timing, or load evidence. This makes the capstone decision a diagnosis rather than a mechanical sort of already-labeled numbers. The exact initial ranking also controls the second star, so the copy does not oversell a consequence-free interaction.

After the diagnosis is submitted, two scarce remedies transfer the revealed evidence into action. Targeting a lower-value pair produces a visible `$647.00` versus `$45.00` remaining-loss comparison. Confirming fleet scope exposes `$160.00` of collateral at the actual action that causes it. Both failures rewind locally without replaying mastered report inspection.

L13 explicitly uses the formal `ConceptScope` capstone exemption. The scope selector and collateral consequence are a legible sub-beat that integrates declared prerequisite reasoning; they do not silently add a second undeclared concept. The exemption does not relax surprise protection, economic truth, prediction non-punishment, causal failure, or post-evidence gating.

The request tape remains economically truthful in an output-heavy capstone because `outTok` contributes its `5x` price to every bar’s geometry. The scalar `$90.00` wallet separately tracks priced API requests, while the `$692.00` audit ledger tracks recoverable organizational loss. Reference and anti-pattern outcomes appear only after the player owns an attempt and remain informational.

Significant assumption: the `$72.00`, `$30.00`, and `$15.00` bucket split, the `$40.00` per-developer collateral, and Eli’s `200` monthly requests are calibrated `[FICTION]`. They preserve the `C17` total and ordering while keeping diagnosis and targeting consequences visibly distinct.
