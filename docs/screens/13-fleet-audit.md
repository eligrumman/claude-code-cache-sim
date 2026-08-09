# Level 13 — The Fleet Audit

## 1. Identity

- `id`: `"13-fleet-audit"`
- `title`: **The Fleet Audit**
- `tier`: `3`
- `objective`: **“Five reports. Two remediation slots. Rank what is costing the fleet, then spend them.”**
- `concept.id`: `"fleet-leak-triage"`
- One concept: at fleet scale, remediation must follow recoverable dollars rather than visually prominent token volume.
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
- Private designer answer: `idle > delegate > 5m-band > MCP`; never expose this before `SUBMIT_AUDIT_RANKING`.
- Post-reveal rule: **“Rank recoverable dollars, then target the people who exhibit the cause.”**
- The pre-reveal ranking and both `PredictionPromptDef` answers are non-punitive. Only remedies applied after the loss-ledger reveal affect the gate or stars.

## 2. Objects used

- `LevelDef`
- `ConceptId`
- `ReducerState`
- `Action`
- `StatePredicate`
- `GateDef`
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
- `CounterfactualDef`
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

No tutorial card, aggregate recoverable-dollar value, canonical ranking, or remediation answer appears before play.

| Time | Beat and exact copy |
|---:|---|
| `0.0s` | A pager lands on the audit desk: **“FINOPS: Claude spend is up again. Five developer reports attached.”** |
| `0.2s–0.7s` | Five scripted report-ingest units resolve behind sealed folders. They create the nine priced rows specified in §6; no causal-bucket dollar label is visible. |
| `0.8s` | Folders marked **Ari · Bea · Cy · Dev · Eli** slide into view. Header: **“Find the leaks. You get two remediation slots before next month closes.”** |
| `1.5s` | Ari’s folder pulses. Copy: **“Open any report.”** All five folders are immediately clickable. |
| First click | The folder expands into its timeline, `UI_TAPE_RENDERER`, token headline, and symptoms. Its aggregate loss remains masked as **“Recoverable: ?”**. |
| After all five open | Four cause cards unlock: **Idle rebuilds**, **Prompt drift**, **Short-cache misses**, and **Tool-schema load**. Copy: **“Rank these by dollars recoverable next month.”** |
| First drag | `CREATE_CHECKPOINT({ checkpointId: "audit-ranking", reason: "decision" })`, then `SET_AUDIT_RANKING`. No correctness feedback appears. |
| Submit | Button copy: **“Lock ranking.”** Submission opens `fleet-biggest-lever`; the loss ledger remains sealed until that prediction is committed. |

Presentation timings and the two-remediation-slot inventory are `[ESTIMATE]`.

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

The reports provide inferable evidence without dollar labels: Ari exposes frequency, Bea exposes the mismatch boundary, Cy exposes timing, Dev exposes loaded-but-unused schemas, and Eli exposes legitimate output volume. The ranking is therefore an evidence-based forecast, not a blind coin flip.

Eli’s `8,800,000` is the largest token headline. The UI neither labels it waste nor reveals its `$0.00` recoverable cache loss until the ranking and `fleet-biggest-lever` prediction are locked.

## 4. Exact event sequence

1. **Enter the level**

   Event: route opens.

   ```ts
   ENTER_LEVEL({ levelId: "13-fleet-audit" })
   ```

   Mutations:

   - Initializes `Clock` at `0m`, with a `6,600m` month cap: `22 × 300m` (`C31`).
   - Initializes `Wallet.initialUsd = Wallet.remainingUsd = $90.00`, the canonical month budget (`C31`).
   - Initializes `Wallet.spentUsd = $0.00`.
   - Initializes all `HiddenCosts` fields to zero, the four masked `AuditCauseSeed` results, an empty audit ranking, no remedies, and no prediction result.
   - The `$692.00` hidden-loss ledger is not assigned to `Wallet` or `Budget`.

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
   Wallet.spentUsd = $6.69987735
   Wallet.remainingUsd = $83.30012265
   ```

   These are billed sample-request costs. They are not the hidden-loss rollup.

3. **Inspect reports**

   Event: player opens each folder.

   This is presentation-only: it exposes that report’s already-priced rows, timeline, token counts, and symptoms without changing the reducer or charging the wallet again. Reopening a report creates no request.

4. **Draft the audit ranking**

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

   `causeIds` must be a permutation of `["idle", "delegate", "5m-band", "MCP"]`. The draft remains editable and receives no correctness signal.

5. **Commit the pre-reveal forecast**

   Pressing **“Lock ranking”** dispatches:

   ```ts
   SUBMIT_AUDIT_RANKING
   OPEN_PREDICTION({ promptId: "fleet-biggest-lever" })
   SELECT_PREDICTION({ promptId: "fleet-biggest-lever", optionId })
   COMMIT_PREDICTION({ promptId: "fleet-biggest-lever" })
   ```

   The ranking and prediction become immutable. Neither correctness value affects score, stars, wallet, failure, or gate passage.

6. **Reveal the loss ledger**

   Event: player clicks the now-enabled sealed audit meter.

   ```ts
   REVEAL_PREDICTION({
     promptId: "fleet-biggest-lever",
     correctOptionId: "idle"
   })
   ```

   The event `loss-ledger-revealed` completes and exposes:

   | Cause ID | `HiddenCosts` bucket | Recoverable next month |
   |---|---|---:|
   | `idle` | `idleRebuildUsd` | `$575.00` (`C14`) |
   | `delegate` | `delegateUsd` | `$72.00` `[FICTION]` |
   | `5m-band` | `fiveMinuteBandUsd` | `$30.00` `[FICTION]` |
   | `MCP` | `mcpUsd` | `$15.00` `[FICTION]` |

   The buckets sum to the canonical `$692.00` hidden-loss total and obey `idle > delegate > 5m-band > MCP` (`C17`). Eli receives the annotation **“Recoverable by these cache remedies: $0.00.”** It is not a request price.

   A wrong forecast reveals exactly the same evidence and makes exactly the same controls available.

7. **Create the remediation checkpoint**

   After the ledger animation completes:

   ```ts
   CREATE_CHECKPOINT({
     checkpointId: "audit-remediation",
     reason: "decision"
   })
   BEGIN_TRANSFER({ challengeId: "fleet-remediation-transfer" })
   ```

   Exactly two post-evidence remediation slots unlock.

8. **Apply the first remedy**

   Player drops one remedy on a developer or the fleet:

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

   A mismatched targeted remedy recovers `$0.00` and produces no fake `LedgerRow`. A fleet-wide remedy recovers its matching bucket but atomically adds `4 × $40.00 = $160.00` collateral across the four unaffected developers `[FICTION]`.

9. **Resolve an over-broad policy locally**

   If the first remedy targets the fleet, its four collateral markers animate with the same atomic action, then:

   ```ts
   FREEZE_FAILURE({
     failureId: "fleet-collateral",
     causeCode: "BROAD_POLICY_COLLATERAL",
     message:
       "One leak, five rollouts. Four unaffected developers add $160.00 collateral.",
     checkpointId: "audit-remediation"
   })
   ```

   Visible comparison:

   ```text
   actual collateral = $160.00
   targeted alternative collateral = $0.00
   ```

   The punished route is therefore genuinely `$160.00` more expensive. `UI_REWIND_CONTROL` resumes immediately before the first remedy.

10. **Apply the second remedy**

    If unfrozen, the second drop dispatches `APPLY_REMEDIATION` again and fills the final slot.

    The reference post-evidence order is:

    ```text
    keep-warm-policy → ari
    normalize-delegation → bea
    ```

    No correctness is inferred from the earlier ranking or prediction.

11. **Commit the result prediction**

    Pressing **“Simulate next month”** dispatches:

    ```ts
    OPEN_PREDICTION({ promptId: "fleet-next-month" })
    SELECT_PREDICTION({ promptId: "fleet-next-month", optionId })
    COMMIT_PREDICTION({ promptId: "fleet-next-month" })
    ```

    No recovery bracket, remaining-loss total, or result comparison animates before commitment.

12. **Reveal the chosen remediation outcome**

    The simulation folds resolved causal brackets and leaves untouched brackets visible. It adds no historical `Request`, no `LedgerRow`, and no wallet charge: it is a projection over the already-priced audit evidence and the `AuditCauseSeed` loss ledger.

    For targeted `idle + delegate`:

    ```text
    recoveredUsd = $647.00
    remainingHiddenLossUsd = $45.00
    collateralUsd = $0.00
    ```

    For targeted `5m-band + MCP`:

    ```text
    recoveredUsd = $45.00
    remainingHiddenLossUsd = $647.00
    collateralUsd = $0.00
    ```

13. **Freeze the economically decisive low-value pair**

    If the player used both slots on targeted `5m-band + MCP`, the first result frame dispatches:

    ```ts
    FREEZE_FAILURE({
      failureId: "low-value-remediation-pair",
      causeCode: "HIGHER_RECOVERY_OMITTED",
      message:
        "You recovered $45.00. The top two causes could recover $647.00; $602.00 was left on the table.",
      checkpointId: "audit-remediation"
    })
    ```

    Visible route comparison:

    ```text
    actual remaining hidden loss = $647.00
    valid top-two remaining hidden loss = $45.00
    excess loss = $602.00
    ```

    Thus `actualUsd = $647.00 > validAlternativeUsd = $45.00`. Other suboptimal pairs reach the result screen without a freeze but fail the behavioral gate.

14. **Rewind**

    - **“Revise remedies”**

      ```ts
      REWIND_TO_CHECKPOINT({ checkpointId: "audit-remediation" })
      ```

      Restores the state immediately before the first remedy while preserving the submitted ranking and revealed evidence.

    - **“Rerank causes”**

      ```ts
      REWIND_TO_CHECKPOINT({ checkpointId: "audit-ranking" })
      ```

      Restores the state before ranking submission while preserving the ingested ledger and opened reports.

15. **Complete and unlock comparisons**

    On an unfrozen outcome:

    ```ts
    REVEAL_PREDICTION({
      promptId: "fleet-next-month",
      correctOptionId: derivedFromAppliedRemedies
    })
    COMPLETE_ATTEMPT
    ```

    `COMPLETE_ATTEMPT` evaluates only the post-evidence remediation actions. Reference and anti-pattern comparisons remain unavailable until this event completes.

    Afterward:

    ```ts
    REQUEST_COUNTERFACTUAL({ comparisonId: "fleet-reference" })
    REVEAL_COUNTERFACTUAL({ comparisonId: "fleet-reference" })

    REQUEST_COUNTERFACTUAL({ comparisonId: "fleet-anti-pattern" })
    REVEAL_COUNTERFACTUAL({ comparisonId: "fleet-anti-pattern" })
    ```

## 5. Level data

```ts
const LEVEL_13: LevelDef = {
  id: "13-fleet-audit",
  tier: 3,
  title: "The Fleet Audit",
  objective:
    "Five reports. Two remediation slots. Rank what is costing the fleet, then spend them.",

  concept: {
    id: "fleet-leak-triage",
    privateDesignerSummary:
      "At fleet scale, diagnose heterogeneous leaks and remediate in descending recoverable dollars.",
    postRevealRule:
      "Rank recoverable dollars, then target the people who exhibit the cause."
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
      predicate: LOW_VALUE_PAIR_AFTER_REVEAL,
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
      predicate: FLEET_REMEDIATION_AFTER_REVEAL,
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
      resumeLabel: "Rerank causes"
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
    evidenceRevealEventIds: ["loss-ledger-revealed"],
    postEvidenceActionRequirements: [
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
      st.completedEventIds.includes("top-two-targeted-result") &&
      st.completedEventIds.includes("next-month-result-revealed"),
    reason:
      "Both largest causes were remediated on their evidenced developers after the dollar reveal.",
    evidence: [
      "idle-remedy-after-ledger",
      "delegate-remedy-after-ledger",
      "top-two-targeted-result"
    ]
  }),

  star2: {
    label: "Apply the $575 remedy before the $72 remedy",
    predicate: {
      id: "descending-remediation-order",
      kind: "event-completed",
      eventId: "top-two-targeted-in-order"
    },
    reason:
      "The post-evidence remediation order follows descending recoverable dollars."
  },

  star3: {
    label: "Exact targeted order with no replacement or rewind",
    predicate: {
      id: "clean-fleet-audit",
      kind: "event-completed",
      eventId: "top-two-targeted-in-order-clean"
    },
    reason:
      "The player transferred the revealed evidence directly into a clean targeted plan."
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

`referenceCfg` maps, through the `AuditCauseSeed.remediationIds`, to targeted Ari and Bea remedies. `antiCfg` maps to targeted Cy and Dev remedies. Target bindings are scenario evidence, not extra `Config` keys.

The `$90.00` `budgetUsd` is the month spend budget from `C31`. The `$692.00` amount exists only as the hidden-loss decomposition from `C17`; it is never assigned to `budgetUsd`, `Wallet.initialUsd`, or `Wallet.remainingUsd`.

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

- Month `Budget.capUsd`: `$90.00` (`C31`).
- Sampled API spend: `$6.69987735`.
- Baseline hidden loss: `$692.00` (`C17`).
- Three-star reference: recover `$647.00`; remaining hidden loss `$45.00`; collateral `$0.00`.
- Anti-pattern: recover `$45.00`; remaining hidden loss `$647.00`; excess hidden loss versus reference `$602.00`.

No hidden-loss recovery mutates `Wallet`. No positive request renders as `$0.0000`; exact values remain unrounded in state.

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
8. After `fleet-biggest-lever` commits, causal labels animate onto the four brackets: `$575`, `$72`, `$30`, `$15`.
9. Aha frame: Eli’s monthly token headline remains largest while Ari’s smaller-looking request evidence receives the largest recoverable-dollar bracket.
10. During the result reveal, chosen causal brackets fold to `$0.00`; untouched brackets remain.
11. A fleet-wide remedy paints four collateral markers before `FREEZE_FAILURE`.
12. Reference and anti-pattern overlays remain locked until `COMPLETE_ATTEMPT`.

`UI_TAPE_RENDERER` uses the canonical USD-proportional `WireSegment` geometry:

```text
segment.widthRatio = segment.usd / LedgerRow.usd
```

The output segment is always included:

```text
outputUsd = outTok × 5 × MODEL_IN[model] / 1,000,000
```

For `ari-warm` and `eli-warm`, output contributes `$0.66000000 / $0.68842140 = 95.8715%` of the row’s visual width (`C1`, `C3`, `C28`). Output labels may be delayed, but `outTok` is never omitted from bar geometry. This prevents the output-heavy capstone from visually implying that cache input is most of the bill.

Every priced tape row maps one-to-one to a `LedgerRow`. Monthly brackets, token headlines, recoverable-dollar annotations, and collateral markers are annotations, never extra requests.

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

Correct option: `idle`.

Commit copy: **“Lock my call.”**

The loss-ledger reveal is disabled until commitment. Correctness affects only the post-reveal comparison caption.

### `fleet-next-month`

Question:

**“What will your two remedies do next month?”**

Options:

- `targeted-top-two` — **“Remove the two largest recoverable losses”**
- `some-savings` — **“Save money, but leave a larger cause untouched”**
- `collateral` — **“Recover a leak but spread policy cost across the fleet”**

The correct option derives from the submitted remediation plan. For the reference plan it is `targeted-top-two`.

No outcome bracket or result tape animates before commitment. Correctness never affects score, stars, wallet, failure, recovery, or gate passage.

## 9. Fail-state

### Low-value remediation pair

Reachable route: after the dollar reveal, the player uses both targeted slots on Cy and Dev.

Decisive event: the first result frame compares the submitted two-slot plan with the visible top-two alternative.

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

Reachable route: after the dollar reveal, the player applies any matching remedy to the fleet rather than its evidenced developer.

Decisive event: the atomic `APPLY_REMEDIATION` action paints its first unaffected report and shows all four collateral markers.

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

Both freezes preserve report inspection, the submitted ranking, and the revealed dollar evidence. Neither predicate may inspect prediction correctness or the correctness of the pre-reveal ranking.

## 10. Gate & stars

The behavioral pass predicate is:

```text
loss ledger revealed
AND, after that reveal:
  targeted keep-warm-policy applied to Ari
AND
  targeted normalize-delegation applied to Bea
AND
  next-month result revealed
AND
  recoveredUsd >= $647.00
AND
  collateralUsd <= $0.00
```

The exact pre-reveal ranking is not a pass condition. Either prediction may be wrong. Budget alone can never pass the level.

- **1 star:** the behavioral pass predicate above, in either targeted remediation order; remedy replacement or rewind is allowed.
- **2 stars:** 1-star conditions plus post-evidence remediation order `idle → delegate`.
- **3 stars:** 2-star conditions plus no remedy replacement and no rewind after `loss-ledger-revealed`.

All scoring evidence comes from `APPLY_REMEDIATION` or later post-evidence events. `COMMIT_PREDICTION`, prediction option identity, prediction correctness, and the submitted pre-reveal ranking do not appear in the gate, stars, failure predicates, wallet mutations, or `pass(st)`.

## 11. Toasts

| Trigger | Exact copy |
|---|---|
| First report opens | **“Reports show activity. Your ranking forecasts recoverable dollars.”** |
| Eli opens | **“Big token totals can be real work. Diagnose before calling them waste.”** |
| Ranking submit attempted with fewer than four causes | **“Rank every cause before opening the loss ledger.”** |
| Ranking locks | **“Forecast locked. Make one call before the dollars open.”** |
| Loss ledger reveals | **“$575 of $692 hides in one cause.”** (`C14`, `C17`) |
| Wrong pre-reveal forecast reveals | **“Forecast recorded. The remedies—not the guess—show what you learned.”** |
| Remediation controls unlock | **“Evidence is open. Spend two remedies.”** |
| Targeted remedy matches its developer | **“Target matched: one remedy touches one causal bucket.”** |
| Targeted remedy mismatches | **“No matching evidence in this report.”** |
| Fleet-wide remedy selected | **“Fleet-wide reaches four unaffected developers too.”** |
| Reference simulation removes the idle bucket | **“272 rebuilds removed from next month.”** (`C13`) |
| Second reference remedy lands | **“Top two recovered: $647.00. Remaining hidden loss: $45.00.”** |
| Anti-pattern result | **“You fixed $45.00 and left $647.00 recoverable.”** |
| Result screen opens | **“The $90 wallet tracked API spend; the $692 ledger tracked recoverable loss.”** (`C17`, `C31`) |

## 12. QA gate

Real-browser click-through must assert:

1. The first report is clickable within two seconds; no Learn screen precedes it.
2. `ENTER_LEVEL` uses `"13-fleet-audit"`, and `concept.id` plus all twelve prerequisites resolve through the canonical registries.
3. `budgetUsd`, `Wallet.initialUsd`, and `Budget.capUsd` are `$90.00` (`C31`), never `$692.00`.
4. The four hidden-loss buckets sum to `$692.00` (`C17`) and never mutate `Wallet`.
5. The scripted ingest creates exactly nine `LedgerRow`s and exactly nine priced tape rows.
6. The nine rows spend exactly `$6.69987735`, leaving `$83.30012265` in the month wallet.
7. Every real request has `usd > 0`; no positive value renders as `$0.0000`.
8. Each request total exactly matches `PRICE_REQUEST` using `C1` and `C3`.
9. `UI_TAPE_RENDERER` rows equal ledger rows in count, order, request ID, token buckets, and USD.
10. Every tape segment uses `segment.usd / row.usd`; `outTok` contributes to every row’s geometry.
11. Static final bars still show output width without requiring hover.
12. No recoverable dollar, canonical ordering, correct prediction, remedy answer, or Eli `$0.00` appears before `SUBMIT_AUDIT_RANKING` and `COMMIT_PREDICTION("fleet-biggest-lever")`.
13. `SET_AUDIT_RANKING` accepts only a four-cause permutation.
14. `REVEAL_PREDICTION` is rejected before its matching `COMMIT_PREDICTION`.
15. An incorrect pre-reveal ranking changes no score, star, wallet, failure, or gate result.
16. An incorrect `fleet-biggest-lever` or `fleet-next-month` answer changes no score, star, wallet, failure, or gate result.
17. Remedies remain disabled until `loss-ledger-revealed`.
18. Two and only two remediation slots may be committed.
19. Each targeted remedy/developer pair deterministically produces the specified recovery; mismatches recover zero and create no fake `LedgerRow`.
20. Ari’s bracket contains `272` rebuilds and rolls up to `$575.00`.
21. The causal order is exactly `idle > delegate > 5m-band > MCP`.
22. Eli’s `8,800,000` output-token headline is visually largest, while no cache remedy is credited with recovering legitimate output.
23. Targeted Ari and Bea remedies applied after the reveal pass even if the earlier ranking and both predictions were wrong.
24. A correct pre-reveal ranking followed by wrong remediations fails.
25. Targeted `5m-band + MCP` freezes with `actualUsd = $647.00`, `validAlternativeUsd = $45.00`, and a visible `$602.00` difference.
26. A fleet-wide remedy freezes with `actualUsd = $160.00`, `validAlternativeUsd = $0.00`, and four visible `$40.00` collateral markers.
27. No harmless, equal-cost, or cheaper route dispatches `FREEZE_FAILURE`.
28. `REWIND_TO_CHECKPOINT("audit-remediation")` preserves the locked ranking and revealed evidence.
29. `REWIND_TO_CHECKPOINT("audit-ranking")` unlocks ranking while preserving the ingested request sample.
30. The reference run is winnable and yields `$647.00` recovery, `$45.00` remaining hidden loss, and `$0.00` collateral.
31. The anti-pattern yields `$45.00` recovery, `$647.00` remaining hidden loss, and `$602.00` excess loss versus reference.
32. Reference and anti-pattern overlays cannot reveal before `COMPLETE_ATTEMPT`.
33. Two stars require the post-evidence order `idle → delegate`; three stars add no replacement or rewind.
34. Keyboard and pointer paths produce equivalent ranking, prediction, remediation, and rewind actions.
35. Reduced-motion mode produces the same final evidence and exact values.
36. Every authoritative quantity has one implementable value; no superseded price, alternate budget, or unreachable result branch appears.
37. The pre-reveal ranking remains a live evidence-based decision: all four reports expose causal frequency, identity, timing, or load evidence without dollar answers.

## 13. Reference-bar justification

The screen opens as an unexplained, tactile audit desk: the player handles reports before receiving terminology or aggregate answers. Each report supplies enough causal evidence to support a reasoned forecast, while Eli’s legitimate output mountain creates a tempting but falsifiable visual heuristic. The player must commit both a complete ranking and a largest-lever prediction before the dollars animate.

The reveal does not punish the forecast. It turns the newly visible loss ledger into a transfer challenge: two scarce remedies must be attached to concrete developers. That post-evidence action—not the pre-reveal guess—controls passage. Targeting a lower-value pair produces a visible `$647.00` versus `$45.00` remaining-loss comparison, while an over-broad policy exposes `$160.00` of real collateral at the exact action that causes it. Both failures rewind locally without replaying report inspection.

The request tape remains economically truthful in an output-heavy capstone because `outTok` contributes its `5x` price to every bar’s geometry. The `$90.00` wallet separately tracks priced API requests, while the `$692.00` audit ledger tracks recoverable organizational loss. Reference and anti-pattern outcomes appear only after the player owns an attempt.

Significant assumption: the `$72.00`, `$30.00`, and `$15.00` bucket split, the `$40.00` per-developer collateral, and Eli’s `200` monthly requests are calibrated `[FICTION]`. They preserve the `C17` total and ordering while keeping the remediation and targeting consequences visibly distinct.
