
# Level 7 — The Long Day

## 1. Identity

- **id:** `07-keep-it-alive`
- **title:** The Long Day
- **tier:** `2`
- **Objective copy:** “Five gaps. Three chances. Get tomorrow’s release through the day.”
- **One concept:** `keep-warm-breakeven` — a keep-warm request is worthwhile only while its accumulated cost remains below the rewrite delta it prevents.
- **Prerequisites:** `cache-expiry` and `ttl-tier-tradeoff`.
- **Post-reveal rule:** “Ping only while the pings cost less than rebuilding.”
- **Unlocks:** `keepWarm`
- **Introduced surface:** `limitedMarkers`

The finite marker planner is the only new player surface. The `50m` cadence is fixed by authored targets; there is no separate interval or keep-warm toggle during this level. Any placed marker expresses keep-warm intent and resolves into its authored real request.

`concept.solutionVocabulary` is `["keep warm", "keep-warm", "ping", "marker", "break-even", "rebuild", "expire", "expiry", "alive"]`. Neither `title` nor `objective` contains those mechanic or answer terms.

## 2. Objects used

- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `PB_SYSTEM`
- `PB_TOOLS`
- `PB_INSTRUCTIONS`
- `PB_HISTORY`
- `PB_CURRENT`
- `Request`
- `CacheEntry`
- `CACHE_TIER_1H`
- `Clock`
- `Wallet`
- `Budget`
- `LedgerRow`
- `WireSegment`
- `LimitedMarkerInventoryState`
- `Counts`
- `AttemptMetrics`
- `AttemptResult`
- `StatePredicate`
- `GateDef`
- `StarDef`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`
- `limited-marker-inventory`

Each of the three limited markers authors exactly one real `PLACE_KEEP_WARM_PING` effect. No configuration shortcut, policy comparison, or counterfactual creates more than three actual-attempt ping requests.

## 3. Cold-open / narrative

No instruction card, policy selector, or pre-play price comparison appears.

| Time | Beat |
|---:|---|
| `0.0s` | A workday timeline slides under the cursor. Five closed gap cards read **Coffee**, **Lunch**, **Meeting**, **Commute**, and **Overnight**. Their durations are visible; their outcomes are not. |
| `0.4s` | `UI_MAIN_CACHE_PANEL` shows a live 60-minute entry. Three draggable tokens land beside the timeline with the neutral label **“3 choices left.”** |
| `0.8s` | Copy: **“Tomorrow’s release is already cached. Plan the gaps.”** |
| `1.2s` | Lunch’s two available target slots pulse without success coloring. Copy: **“Spend now, save for later, or leave the timeline alone.”** |
| `1.6s` | Pointer and keyboard users can place the first token. |
| `2.0s` | **Run to Lunch** becomes available. No configuration chip or automatic-policy control appears. |

`firstInteractiveBySec = 1.6` `[ESTIMATE]`.

Before Lunch resolves, only its two slots accept placement. Later targets remain visible but inactive, preventing the opening from becoming a five-gap answer-entry form. Lunch evidence unlocks placement of the remaining marker on Meeting, Commute, or Overnight.

The first placement introduces the term **keep-warm ping** through `toast-first-marker`. Before that action, player-facing copy does not name the mechanic.

## 4. Exact event sequence

The scenario uses `MAIN_PREFIX_HEY = 34,738` tokens (`C34`), Sonnet rates (`C1`, `C3`), and `CACHE_TIER_1H` with a 60-minute idle TTL (`C1`). Every work request adds `100` fresh input tokens and `100` output tokens `[FICTION]`. Every ping adds `1` fresh input token and `1` output token `[FICTION]`. Marker targets use a fixed `50m` cadence `[FICTION]`.

1. **`ev-enter` — Enter the planner**
   - Event: screen mounts.
   - Action: `{ type: "ENTER_LEVEL", levelId: "07-keep-it-alive" }`
   - Mutates: `ReducerState`, `Clock`, scalar `wallet`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, `LimitedMarkerInventoryState`, and initialized `Counts.pingsByGap`.
   - Numbers: clock `0m`; budget and wallet `$0.70` `[FICTION]`; marker capacity `3` `[FICTION]`; TTL `60m` (`C1`).
   - `counts.pingsByGap` initializes `{ coffee: 0, lunch: 0, meeting: 0, commute: 0, overnight: 0 }`.

2. **`ev-open-request` — Prime the workday**
   - Event: the opening request runs automatically.
   - Action: `{ type: "SEND_REQUEST", request: REQ_OPEN }`
   - Mutates: `CacheEntry`, `LedgerRow[]`, scalar `wallet`, `lastRequests`, `attemptMetrics.spentUsd`, and `attemptMetrics.requestCount`.
   - Numbers: `writeTok=34,738`, `inputTok=100`, `outTok=100`; cost `$0.210228` (`C1`, `C3`, `C34`).
   - Toast: `toast-first-write`.

3. **`ev-plan-checkpoint` — Create the placement checkpoint**
   - Event: the opening tape settles.
   - Action: `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-plan", reason: "decision" }`
   - Mutates: `Checkpoint[]`.
   - Numbers: no request and no cost.

4. **`ev-place-lunch` — Place the two Lunch markers**
   - Events and actions:
     1. `{ type: "PLACE_LIMITED_MARKER", inventoryId: "l7-pings", markerId: "ping-a", targetId: "lunch-50", atMin: 50 }`
     2. `{ type: "PLACE_LIMITED_MARKER", inventoryId: "l7-pings", markerId: "ping-b", targetId: "lunch-100", atMin: 100 }`
   - Mutates: `markerInventories["l7-pings"].placements`.
   - Numbers: available markers `3→2→1`; placement itself creates no ledger row.
   - The first nonempty placement implies keep-warm intent for the authored targets. `cfg.keepWarm` and `cfg.keepWarmMin` remain locked and unchanged.
   - Each marker occupies one unique target. The two Lunch positions are distinct target IDs, not stacked effects on one target.
   - Toast on the first action: `toast-first-marker`.

5. **`ev-pred-lunch-commit` — Commit the Lunch prediction**
   - Event: player presses **Run to Lunch**.
   - Actions:
     1. `{ type: "OPEN_PREDICTION", promptId: "pred-lunch" }`
     2. `{ type: "SELECT_PREDICTION", promptId: "pred-lunch", optionId }`
     3. `{ type: "COMMIT_PREDICTION", promptId: "pred-lunch" }`
   - Mutates: `phase`, `prediction`.
   - Numbers: no request and no cost. Option identity has no economic, failure, gate, or scoring effect.

6. **`ev-coffee-request` — Cross Coffee**
   - Event: the `20m` Coffee gap completes.
   - Actions:
     1. `{ type: "ADVANCE", min: 20 }`
     2. `{ type: "SEND_REQUEST", request: REQ_AFTER_COFFEE }`
   - Mutates: `Clock`, `CacheEntry.lastTouchMin`, `LedgerRow[]`, scalar `wallet`, and `AttemptMetrics`.
   - Numbers: `readTok=34,738`, `inputTok=100`, `outTok=100`; cost `$0.0122214` (`C1`, `C3`, `C12`, `C34`).

7. **`ev-lunch-request` — Resolve Lunch**
   - Event: placed targets resolve at `50m` and `100m`; work resumes `20m` later.
   - Reference actions, in order:
     1. `{ type: "ADVANCE", min: 50 }`
     2. `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 50 }`
     3. `{ type: "SEND_REQUEST", request: PING_LUNCH_1 }`
     4. `{ type: "ADVANCE", min: 50 }`
     5. `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 100 }`
     6. `{ type: "SEND_REQUEST", request: PING_LUNCH_2 }`
     7. `{ type: "ADVANCE", min: 20 }`
     8. `{ type: "SEND_REQUEST", request: REQ_AFTER_LUNCH }`
   - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, scalar `wallet`, resolved placements, `attemptMetrics`, `counts.keepWarmPings`, and `counts.pingsByGap.lunch`.
   - Numbers:
     - Each ping: `readTok=34,738`, `inputTok=1`, `outTok=1`; `$0.0104394`.
     - Two pings: `$0.0208788`.
     - Warm resumed work: `$0.0122214`.
     - Protected route: `$0.0331002`.
     - Cold resumed work without pings: `$0.210228`.
     - Saving: `$0.1771278`.
     - Values derive from `C1`, `C3`, `C12`, `C20`, and `C34`.
   - Toast: `toast-lunch-paid`.
   - If zero markers were placed on Lunch, `REQ_AFTER_LUNCH` resolves cold. Its `$0.210228` row becomes visible before the local failure in §9 freezes the attempt.

8. **`ev-lunch-reveal` — Reveal Lunch evidence**
   - Event: `REQ_AFTER_LUNCH` settles on a non-frozen route.
   - Action: `{ type: "REVEAL_PREDICTION", promptId: "pred-lunch", correctOptionId: "two-pings-win" }`
   - Mutates: `prediction`, `phase`, `completedEventIds`.
   - Numbers: displays `$0.0331002 < $0.210228`.
   - Prediction correctness changes no wallet, score, star, failure, or gate state.

9. **`ev-transfer-open` — Open the post-evidence transfer**
   - Event: Lunch evidence settles; Meeting, Commute, and Overnight targets unlock.
   - Action: `{ type: "BEGIN_TRANSFER", challengeId: "bridge-next-gap" }`
   - Mutates: `phase` and transfer visibility.
   - Numbers: one unused marker remains on the reference route.

10. **`ev-transfer-commute` — Apply the Lunch evidence**
    - Event: player places the remaining marker `50m` into Commute.
    - Action:
      ```ts
      {
        type: "PLACE_LIMITED_MARKER",
        inventoryId: "l7-pings",
        markerId: "ping-c",
        targetId: "commute-50",
        atMin: 50
      }
      ```
    - Mutates: `markerInventories["l7-pings"].placements`; the qualifying post-evidence placement appends `"bridge-next-gap"` to `completedTransferIds`.
    - Numbers: available markers `1→0`; no ledger row until the target resolves.
    - This is the gate’s required post-evidence action. Prediction correctness is not inspected.

11. **`ev-meeting-request` — Cross Meeting**
    - Event: `50m` passes without a ping.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: REQ_AFTER_MEETING }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, scalar `wallet`, and `AttemptMetrics`.
    - Numbers: `50<60`, so the request remains warm and costs `$0.0122214` (`C1`, `C3`, `C34`).
    - Toast: `toast-no-ping-needed`.

12. **`ev-pred-commute-commit` — Commit the Commute prediction**
    - Event: Commute begins.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-commute" }`
      2. `{ type: "SELECT_PREDICTION", promptId: "pred-commute", optionId }`
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-commute" }`
    - Mutates: `phase`, `prediction`.
    - Numbers: no request and no cost.

13. **`ev-commute-request` — Resolve Commute**
    - Event: the `90m` gap runs.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "PLACE_KEEP_WARM_PING", gapId: "commute", atMin: 50 }`
      3. `{ type: "SEND_REQUEST", request: PING_COMMUTE }`
      4. `{ type: "ADVANCE", min: 40 }`
      5. `{ type: "SEND_REQUEST", request: REQ_AFTER_COMMUTE }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, scalar `wallet`, resolved placement, `AttemptMetrics`, `counts.keepWarmPings`, and `counts.pingsByGap.commute`.
    - Numbers: ping `$0.0104394`; warm resumed work `$0.0122214`; the ping avoids a `$0.1980066` cold-to-warm work-request delta (`C1`, `C3`, `C12`, `C20`, `C34`).
    - Toast: `toast-commute-paid`.

14. **`ev-commute-reveal` — Reveal Commute evidence**
    - Event: `REQ_AFTER_COMMUTE` settles.
    - Action: `{ type: "REVEAL_PREDICTION", promptId: "pred-commute", correctOptionId: "one-ping-win" }`
    - Mutates: `prediction`, `phase`, `completedEventIds`.
    - Numbers: protected route `$0.0226608`; cold alternative `$0.210228`.

15. **`ev-pred-overnight-commit` — Commit the Overnight prediction**
    - Event: the `1,260m` Overnight card expands.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-overnight" }`
      2. `{ type: "SELECT_PREDICTION", promptId: "pred-overnight", optionId }`
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-overnight" }`
    - Mutates: `phase`, `prediction`.
    - Numbers: `1,260m = 21h` `[FICTION]`. No result or break-even label appears before commitment.

16. **`ev-next-day-request` — Let Overnight expire**
    - Event: next-day work resumes after `1,260m`.
    - Actions:
      1. `{ type: "ADVANCE", min: 1260 }`
      2. `{ type: "SEND_REQUEST", request: REQ_NEXT_DAY }`
    - Mutates: `Clock`, expired and replacement `CacheEntry`, `LedgerRow[]`, scalar `wallet`, `AttemptMetrics`, and `completedEventIds`.
    - Numbers:
      - Actual rebuild request: `$0.210228`.
      - An uninterrupted `50m` projection requires `25` pings; it is explanatory arithmetic, not a runnable marker route.
      - Projected pings: `25 × $0.0104394 = $0.260985`.
      - Projected pings plus warm next request: `$0.2732064`.
      - Rebuild wins by `$0.0629784`.
      - The gap exceeds the canonical 1-hour-tier `20h` break-even (`C19`, `C20`).

17. **`ev-overnight-reveal` — Aha frame**
    - Event: `REQ_NEXT_DAY` settles.
    - Action: `{ type: "REVEAL_PREDICTION", promptId: "pred-overnight", correctOptionId: "let-expire" }`
    - Mutates: `prediction`, `phase`, `completedEventIds`.
    - `ahaFrame=true`.
    - Copy revealed now: **“Lunch was worth tending. Overnight wasn’t.”**
    - Toast: `toast-overnight-line`.

18. **`ev-rule-ack` — Submit understanding**
    - Event: player selects the revealed causal rule.
    - Action: `{ type: "ACK_EXPLANATION", explanationId: "keep-warm-rule" }`
    - Mutates: `acknowledgedExplanationIds`.
    - Preconditions: `ev-overnight-reveal` completed.
    - Toast: `toast-rule`.

19. **`ev-complete` — Finish the attempt**
    - Event: player presses **Finish**.
    - Actions:
      1. `{ type: "LOCK_LIMITED_MARKERS", inventoryId: "l7-pings" }`
      2. `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates: locked marker state and `attemptResult`.
    - Numbers: reference `attemptMetrics.spentUsd` is `$0.5006598`; `COMPLETE_ATTEMPT` copies it to `attemptResult.spentUsd`.

20. **`ev-policy-reveal` — Reveal post-attempt policies**
    - Event: `UI_RESULT_SCREEN` opens **Compare policies**.
    - Actions:
      1. `{ type: "REQUEST_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
      2. `{ type: "REVEAL_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
    - Mutates: comparison visibility only. It cannot mutate actual-attempt wallet, ledger, result, clock, or failure state.
    - Numbers:
      - Choose each ping: `$0.5006598`.
      - Always ping — 3 max: `$0.6986664`.
      - Never ping: `$0.8653548`.
    - Copy: **“Spending all three early left Commute unprotected. Spending none paid for avoidable rewrites.”**

## 5. Level data

```ts
const L7: LevelDef = {
  id: "07-keep-it-alive",
  tier: 2,
  title: "The Long Day",
  objective:
    "Five gaps. Three chances. Get tomorrow's release through the day.",

  concept: {
    id: "keep-warm-breakeven",
    privateDesignerSummary:
      "A keep-warm ping pays only while cumulative ping cost remains below the avoided rewrite delta.",
    postRevealRule:
      "Ping only while the pings cost less than rebuilding.",
    solutionVocabulary: [
      "keep warm",
      "keep-warm",
      "ping",
      "marker",
      "break-even",
      "rebuild",
      "expire",
      "expiry",
      "alive"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: ["cache-expiry", "ttl-tier-tradeoff"],

  unlocks: "keepWarm",
  introducedControls: ["limitedMarkers"],
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
  seed: 7007,
  budgetUsd: 0.70, // [FICTION]
  clockCapMin: 1540, // [FICTION]
  cfgOverride: {
    devModel: "sonnet",
    who: "inline",
    oneHourFlag: true,
    keepWarm: false,
    keepWarmMin: 50
  },
  scenario: "gaps",

  scenarioData: {
    units: [],
    contexts: [
      {
        kind: "main",
        id: "l7-main",
        sessionId: "l7-session",
        cacheNamespace: "l7-main-cache",
        initialPrefixStackId: "l7-main-prefix"
      }
    ],
    gaps: [
      {
        id: "coffee",
        contextId: "l7-main",
        startMin: 0,
        durationMin: 20,
        permitsKeepWarm: false
      },
      {
        id: "lunch",
        contextId: "l7-main",
        startMin: 20,
        durationMin: 120,
        permitsKeepWarm: true
      },
      {
        id: "meeting",
        contextId: "l7-main",
        startMin: 140,
        durationMin: 50,
        permitsKeepWarm: true
      },
      {
        id: "commute",
        contextId: "l7-main",
        startMin: 190,
        durationMin: 90,
        permitsKeepWarm: true
      },
      {
        id: "overnight",
        contextId: "l7-main",
        startMin: 280,
        durationMin: 1260,
        permitsKeepWarm: true
      }
    ],
    markerInventories: [
      {
        id: "l7-pings",
        capacity: 3,
        markerIds: ["ping-a", "ping-b", "ping-c"],
        targetIds: [
          "lunch-50",
          "lunch-100",
          "meeting-50",
          "commute-50",
          ...Array.from(
            { length: 25 },
            (_, i) => `overnight-${(i + 1) * 50}`
          )
        ]
      }
    ],
    fixtures: [
      {
        id: "l7-attempt-budget",
        label: "Attempt budget",
        semanticRole: "Initial scalar budget and wallet for the planner",
        value: 0.70,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "l7-clock-cap",
        label: "Timeline length",
        semanticRole: "Total simulated minutes across the five authored gaps",
        value: 1540,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-marker-capacity",
        label: "Available interventions",
        semanticRole: "Finite marker inventory capacity",
        value: 3,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l7-work-fresh-input",
        label: "Work fresh input",
        semanticRole: "Fresh input appended by each resumed-work request",
        value: 100,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l7-work-output",
        label: "Work output",
        semanticRole: "Output generated by each resumed-work request",
        value: 100,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l7-ping-fresh-input",
        label: "Ping fresh input",
        semanticRole: "Fresh input appended by one authored ping request",
        value: 1,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l7-ping-output",
        label: "Ping output",
        semanticRole: "Output generated by one authored ping request",
        value: 1,
        unit: "tok",
        tag: "[FICTION]"
      },
      {
        id: "l7-marker-cadence",
        label: "Marker cadence",
        semanticRole: "Spacing between authored keep-warm targets",
        value: 50,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-coffee-gap",
        label: "Coffee",
        semanticRole: "Coffee idle-gap duration",
        value: 20,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-lunch-gap",
        label: "Lunch",
        semanticRole: "Lunch idle-gap duration",
        value: 120,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-meeting-gap",
        label: "Meeting",
        semanticRole: "Meeting idle-gap duration",
        value: 50,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-commute-gap",
        label: "Commute",
        semanticRole: "Commute idle-gap duration",
        value: 90,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l7-overnight-gap",
        label: "Overnight",
        semanticRole: "Overnight idle-gap duration",
        value: 1260,
        unit: "min",
        tag: "[FICTION]"
      }
    ],
    estimates: [
      {
        label: "firstInteractiveBySec",
        value: 1.6,
        tag: "[ESTIMATE]"
      }
    ]
  },

  gate: {
    predicateId: "l7-selective-policy",
    evidenceRevealEventIds: [
      "ev-lunch-reveal",
      "ev-overnight-reveal"
    ],
    postEvidenceActionRequirements: [
      {
        id: "place-commute-after-lunch-evidence",
        kind: "action-observed",
        actionType: "PLACE_LIMITED_MARKER",
        afterEventId: "ev-lunch-reveal",
        match: {
          inventoryId: "l7-pings",
          targetId: "commute-50",
          atMin: 50
        }
      }
    ],
    behavioralRequirements: [
      {
        id: "lunch-has-two-pings",
        kind: "compare",
        path: "counts.pingsByGap.lunch",
        op: "eq",
        value: 2
      },
      {
        id: "commute-has-one-ping",
        kind: "compare",
        path: "counts.pingsByGap.commute",
        op: "eq",
        value: 1
      },
      {
        id: "other-gaps-have-zero-pings",
        kind: "all",
        predicates: [
          {
            id: "coffee-zero",
            kind: "compare",
            path: "counts.pingsByGap.coffee",
            op: "eq",
            value: 0
          },
          {
            id: "meeting-zero",
            kind: "compare",
            path: "counts.pingsByGap.meeting",
            op: "eq",
            value: 0
          },
          {
            id: "overnight-zero",
            kind: "compare",
            path: "counts.pingsByGap.overnight",
            op: "eq",
            value: 0
          },
          {
            id: "next-day-request-reached",
            kind: "event-completed",
            eventId: "ev-next-day-request"
          }
        ]
      }
    ],
    explanationRequirement: {
      id: "rule-acknowledged-after-evidence",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "ev-overnight-reveal",
      match: {
        explanationId: "keep-warm-rule"
      }
    },
    transferRequirement: {
      id: "bridge-next-gap-completed",
      kind: "includes",
      path: "completedTransferIds",
      value: "bridge-next-gap",
      observedAfterEventId: "ev-lunch-reveal"
    }
  },

  pass(st) {
    const pings = st.counts.pingsByGap;
    const passed =
      pings.lunch === 2 &&
      pings.commute === 1 &&
      pings.coffee === 0 &&
      pings.meeting === 0 &&
      pings.overnight === 0 &&
      st.counts.keepWarmPings === 3 &&
      st.completedTransferIds.includes("bridge-next-gap") &&
      st.acknowledgedExplanationIds.includes("keep-warm-rule") &&
      st.completedEventIds.includes("ev-next-day-request");

    return {
      pass: passed,
      reason: passed
        ? "Protected only the gaps where intervention remained cheaper."
        : "Use the visible gap evidence on the remaining placement.",
      evidence: passed
        ? [
            "ev-lunch-reveal",
            "bridge-next-gap",
            "ev-overnight-reveal"
          ]
        : ["ev-lunch-reveal"]
    };
  },

  star2: {
    label: "Day planner",
    predicate: {
      id: "l7-star2",
      kind: "compare",
      path: "attemptMetrics.spentUsd",
      op: "lte",
      value: 0.55
    },
    reason: "Bridge the useful gaps without costly extras."
  },

  star3: {
    label: "Exact caretaker",
    predicate: {
      id: "l7-star3",
      kind: "all",
      predicates: [
        {
          id: "reference-spend-or-better",
          kind: "compare",
          path: "attemptMetrics.spentUsd",
          op: "lte",
          value: 0.5006598
        },
        {
          id: "exact-marker-effects",
          kind: "compare",
          path: "counts.keepWarmPings",
          op: "eq",
          value: 3
        }
      ]
    },
    reason:
      "Use all three finite markers only where each remains cheaper than rebuilding."
  },

  referenceCfg: {
    oneHourFlag: true,
    keepWarmMin: 50
  },

  antiCfg: {
    oneHourFlag: true,
    keepWarmMin: 50
  },

  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt",
    "limited-marker-inventory"
  ]
};
```

The reference and anti-pattern use the same locked configuration because placement—not `cfg.keepWarm`—is the level’s authoritative player decision.

Reference actions place `ping-a` on `lunch-50`, `ping-b` on `lunch-100`, and, after `ev-lunch-reveal`, `ping-c` on `commute-50`.

The **Always ping — 3 max** counterfactual places those marker IDs on `lunch-50`, `lunch-100`, and `meeting-50`. The **Never ping** counterfactual leaves `placements=[]`. Neither branch can produce more than three ping requests.

## 6. Pricing walkthrough

`PRICE_REQUEST` uses Sonnet input `$3/M`, cache read `$0.30/M`, 1-hour write `$6/M`, and output `$15/M` (`C1`, `C3`). The reusable prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`). Output is priced at `5x` and remains present in every request total and tape row.

### Authoritative request prices

- **Cold work request**
  - `writeTok=34,738`: `34,738 × $6/M = $0.208428`
  - `inputTok=100`: `100 × $3/M = $0.000300`
  - `outTok=100`: `100 × $15/M = $0.001500`
  - **Total: `$0.210228`**

- **Warm work request**
  - `readTok=34,738`: `34,738 × $0.30/M = $0.0104214`
  - `inputTok=100`: `$0.000300`
  - `outTok=100`: `$0.001500`
  - **Total: `$0.0122214`**

- **Keep-warm ping**
  - `readTok=34,738`: `$0.0104214`
  - `inputTok=1`: `$0.000003`
  - `outTok=1`: `$0.000015`
  - **Total: `$0.0104394`**

- **Cold-to-warm work-request delta**
  - `$0.210228 − $0.0122214 = $0.1980066`

### Gap evidence

| Gap | Reference action | Complete route comparison | Result |
|---|---|---:|---|
| Coffee `20m` | No ping | Warm request `$0.0122214` | No expiry |
| Lunch `120m` | Two pings | Protected `$0.0331002` vs cold `$0.210228` | Pings win by `$0.1771278` |
| Meeting `50m` | No ping | Warm request `$0.0122214` | No expiry |
| Commute `90m` | One ping | Protected `$0.0226608` vs cold `$0.210228` | Ping wins by `$0.1875672` |
| Overnight `1,260m` | Let expire | Projected keep-warm route `$0.2732064` vs rebuild `$0.210228` | Rebuild wins by `$0.0629784` |

The Overnight projection applies the same `PRICE_REQUEST` ping price but creates no ledger rows and consumes no markers. It confirms `C19` and applies the decision rule in `C20`.

### Policy totals

- **Reference — Choose each ping**
  - Two cold work requests: `2 × $0.210228 = $0.420456`
  - Four warm work requests: `4 × $0.0122214 = $0.0488856`
  - Three pings: `3 × $0.0104394 = $0.0313182`
  - **Total: `$0.5006598`**

- **Always ping — 3 max**
  - Three cold work requests: `3 × $0.210228 = $0.630684`
  - Three warm work requests: `3 × $0.0122214 = $0.0366642`
  - Three pings: `3 × $0.0104394 = $0.0313182`
  - **Total: `$0.6986664`**

- **Never ping**
  - Four cold work requests: `4 × $0.210228 = $0.840912`
  - Two warm work requests: `2 × $0.0122214 = $0.0244428`
  - **Total: `$0.8653548`**

The capped Always policy spends its third marker on a Meeting that did not need one, then pays a cold Commute request. It costs `$0.1980066` more than the reference, a `39.55%` increase over `$0.5006598`. The three totals remain hidden until a meaningful attempt completes.

## 7. Tape sequence

`UI_TAPE_RENDERER.rowSource = "ledger"`.

Exact 3-star row order:

1. `REQ_OPEN` — write `34,738`; input `100`; output `100`
2. `REQ_AFTER_COFFEE` — read `34,738`; input `100`; output `100`
3. `PING_LUNCH_1` — read `34,738`; input `1`; output `1`
4. `PING_LUNCH_2` — read `34,738`; input `1`; output `1`
5. `REQ_AFTER_LUNCH` — read `34,738`; input `100`; output `100`
6. `REQ_AFTER_MEETING` — read `34,738`; input `100`; output `100`
7. `PING_COMMUTE` — read `34,738`; input `1`; output `1`
8. `REQ_AFTER_COMMUTE` — read `34,738`; input `100`; output `100`
9. `REQ_NEXT_DAY` — write `34,738`; input `100`; output `100`

Reveal groups:

- `opening`: `REQ_OPEN`
- `coffee`: `REQ_AFTER_COFFEE`
- `lunch`: `PING_LUNCH_1`, `PING_LUNCH_2`, `REQ_AFTER_LUNCH`; gated by `pred-lunch`
- `meeting`: `REQ_AFTER_MEETING`
- `commute`: `PING_COMMUTE`, `REQ_AFTER_COMMUTE`; gated by `pred-commute`
- `overnight`: `REQ_NEXT_DAY`; gated by `pred-overnight`

`ahaRequestId = "REQ_NEXT_DAY"`.

Every row renders all non-zero `WireSegment`s. In particular, `outTok` contributes its `$15/M` Sonnet output cost to the violet segment and total bar geometry from the first row (`C1`, `C3`). Hiding a small output label may not remove its visual width.

At the aha frame, the Overnight card shows the complete route totals:

- **Projected 25-ping route plus warm work: `$0.2732064`**
- **Let expire, then rebuild: `$0.210228`**

Only after this frame does the timeline annotate Lunch and Commute with **“worth it”**, Meeting with **“already safe”**, and Overnight with **“let go.”**

## 8. Prediction prompts

Prediction keys control reveal copy only. A wrong option changes no score, star, wallet, failure, or gate result.

### `pred-lunch`

**Question:** “Lunch is 120 minutes. What will the two placed markers do to the next request?”

Options:

- `two-pings-win`: **“Keep it warm for less than a rewrite.”**
- `two-pings-lose`: **“Cost more than letting it expire.”**
- `still-expires`: **“Expire before Lunch ends anyway.”**

Reveal key: `two-pings-win`.

### Post-evidence transfer — `bridge-next-gap`

This appears only after Lunch’s ledger is visible.

**Question:** “One marker remains. Meeting lasts 50 minutes; Commute lasts 90. Where do you spend it?”

Actions:

- Place it on `meeting-50`.
- Place it on `commute-50`.
- Save it for Overnight.

The reference action is `PLACE_LIMITED_MARKER` on `commute-50`. This post-evidence placement—not any prediction answer—is the demonstrated-understanding gate.

### `pred-commute`

**Question:** “One marker sits 50 minutes into a 90-minute commute. What reaches the other side?”

Options:

- `one-ping-win`: **“The saved context.”**
- `cache-expires`: **“A rewrite.”**
- `same-cost`: **“Exactly the same bill.”**

Reveal key: `one-ping-win`.

### `pred-overnight`

**Question:** “The overnight gap is 21 hours. Which complete route will cost less?”

Options:

- `let-expire`: **“Let it expire, then rebuild.”**
- `keep-pinging`: **“Project a ping every 50 minutes.”**
- `same-cost`: **“They meet at the same price.”**

Reveal key: `let-expire`.

The `20h` canonical break-even and both dollar totals remain hidden until this prediction is committed and `REQ_NEXT_DAY` resolves.

## 9. Fail-state

One reachable local failure uses `fail-freeze-rewind`.

### Failure — skip Lunch protection

The failure rule uses only canonical `StatePredicate` paths and legal operations:

```ts
const FAIL_LUNCH_REWRITE: FailureRuleDef = {
  id: "fail-lunch-rewrite",
  predicate: {
    id: "lunch-resolved-with-zero-pings",
    kind: "compare",
    path: "counts.pingsByGap.lunch",
    op: "eq",
    value: 0
  },
  decisiveEventId: "ev-lunch-request",
  causeCode: "PING_UNDERSPEND",
  message:
    "Lunch cost $0.210228. Two pings plus a warm resume would have cost $0.0331002.",
  checkpointId: "cp-plan",
  highlightObjectIds: [
    "lunch-50",
    "lunch-100",
    "REQ_AFTER_LUNCH",
    "wallet"
  ],
  actualUsd: 0.210228,
  validAlternativeUsd: 0.0331002
};
```

- **Decisive event:** `REQ_AFTER_LUNCH` appends its cold ledger row during the actual attempt.
- **Visible actual route:** cold resumed work costs `$0.210228`.
- **Visible valid alternative:** two pings plus warm resumed work cost `$0.0331002`.
- **Margin:** the actual route costs `$0.1771278` more, so `actualUsd > validAlternativeUsd`.

Only after the cold row and comparison are visible does the reducer dispatch:

```ts
{
  type: "FREEZE_FAILURE",
  failure: {
    failureId: "fail-lunch-rewrite",
    causeCode: "PING_UNDERSPEND",
    message:
      "Lunch cost $0.210228. Two pings plus a warm resume would have cost $0.0331002.",
    checkpointId: "cp-plan"
  }
}
```

Highlight:

- Lunch’s empty target slots.
- The expired `CacheEntry`.
- `REQ_AFTER_LUNCH`’s write and output segments.
- The `$0.210228` versus `$0.0331002` comparison.
- The scalar-wallet delta.

Rewind copy: **“Rewind to gap placement.”**

```ts
{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-plan" }
```

Rewind preserves `REQ_OPEN` and its ledger row, clears later economics, resets `attemptMetrics` to the checkpoint-derived values, and restores all three marker IDs as unplaced.

There is no overnight ping-count failure: a three-marker inventory cannot reach an uncapped nineteenth or twenty-fifth ping. No counterfactual or reference reveal may dispatch `FREEZE_FAILURE`.

## 10. Gate & stars

### Pass predicate

`pass(st)` reads only canonical `ReducerState` paths and returns true when:

- `counts.pingsByGap.lunch === 2`.
- `counts.pingsByGap.commute === 1`.
- `counts.pingsByGap.coffee === 0`.
- `counts.pingsByGap.meeting === 0`.
- `counts.pingsByGap.overnight === 0`.
- `counts.keepWarmPings === 3`.
- `completedTransferIds` includes `"bridge-next-gap"`, which is appended only by the qualifying Commute placement after `ev-lunch-reveal`.
- `acknowledgedExplanationIds` includes `"keep-warm-rule"` after `ev-overnight-reveal`.
- `completedEventIds` includes `"ev-next-day-request"`.

The pass predicate does not inspect prediction selection, prediction correctness, configuration budget alone, or any invented view-local state.

### Stars

- **1 star:** behavioral pass.
- **2 stars — Day planner:** pass and `attemptMetrics.spentUsd <= $0.55` `[FICTION]`.
- **3 stars — Exact caretaker:** pass, `counts.keepWarmPings === 3`, and `attemptMetrics.spentUsd <= $0.5006598`.

`COMPLETE_ATTEMPT` copies `attemptMetrics.spentUsd` into `attemptResult.spentUsd`. Result rendering reads the completed snapshot. Neither stars nor results use the invalid object path `wallet.spentUsd`; `wallet` remains the scalar remaining-USD value.

The 3-star spend comparison uses `lte`, never floating-point equality.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `toast-first-write` | `REQ_OPEN` resolves | **“Day started. Saved context is live for 60 idle minutes.”** |
| `toast-first-marker` | First `PLACE_LIMITED_MARKER` action | **“Keep-warm ping: one marker becomes one real request when its slot arrives.”** |
| `toast-lunch-ping-1` | `PING_LUNCH_1` resolves | **“Ping · `$0.0104394`. The idle clock restarts.”** |
| `toast-lunch-paid` | `REQ_AFTER_LUNCH` resolves warm | **“Lunch route: `$0.0331002` instead of `$0.210228`.”** |
| `toast-no-ping-needed` | `REQ_AFTER_MEETING` resolves | **“50 minutes. Still alive without spending a marker.”** |
| `toast-commute-paid` | `REQ_AFTER_COMMUTE` resolves warm | **“One ping bridged the commute.”** |
| `toast-overnight-line` | Overnight comparison reveals | **“This 21-hour route costs less if the cache expires.”** |
| `toast-rule` | `keep-warm-rule` acknowledged | **“Keep-warm is a price comparison, not a promise.”** |

The term **keep-warm ping** first appears after the player places a marker. The canonical `20h` break-even is not named before Overnight evidence reveals.

## 12. QA gate

Real-browser click-through must assert:

1. The first marker is usable by `1.6s` `[ESTIMATE]`.
2. No pre-play copy states which gaps should receive markers.
3. No pre-play policy chips, keep-warm toggle, or cadence input appear.
4. The marker planner is the level’s sole new interaction surface.
5. The inventory starts with exactly three unique marker IDs.
6. Pointer drag and keyboard placement dispatch equivalent `PLACE_LIMITED_MARKER` actions.
7. A marker occupies at most one target, and each authored slot accepts at most one marker.
8. Placement creates no priced request until its target resolves.
9. Any nonempty placement implies authored keep-warm intent without mutating `cfg.keepWarm`.
10. Exactly one `PLACE_KEEP_WARM_PING` and one priced ping request result from each resolved marker.
11. `counts.pingsByGap` initializes all five `GapSeed.id` keys to zero.
12. Reference play ends with `counts.pingsByGap` equal to `{ coffee:0, lunch:2, meeting:0, commute:1, overnight:0 }`.
13. `sum(Object.values(counts.pingsByGap)) === counts.keepWarmPings`.
14. **Always ping — 3 max** creates exactly three pings at `lunch-50`, `lunch-100`, and `meeting-50`.
15. No actual policy or counterfactual creates more than three ping effects.
16. Lunch, Commute, and Overnight evidence cannot reveal before the corresponding prediction is committed.
17. A wrong prediction changes no wallet value, score, star, failure, or gate result.
18. The gate observes `PLACE_LIMITED_MARKER` on `commute-50` after `ev-lunch-reveal`.
19. Prediction option identity never appears in `pass(st)`, a star predicate, or a failure predicate.
20. Reference play yields exactly `9` `LedgerRow`s and `9` tape rows.
21. Every priced request produces exactly one ledger row and one tape row.
22. Every real request cost is positive.
23. No positive amount displays as `$0.0000`; ping input and output details retain sufficient precision.
24. Every request price matches `PRICE_REQUEST` using `C1`, `C3`, and `C34`.
25. Reference spend is exactly `$0.5006598` before display rounding.
26. **Always ping — 3 max** totals exactly `$0.6986664`.
27. **Never ping** totals exactly `$0.8653548` in the post-attempt counterfactual.
28. The Lunch failure freezes only after the `$0.210228` cold row is visible.
29. The failure comparison shows `$0.210228 > $0.0331002`.
30. No unreachable overnight ping-count failure exists.
31. Rewind to `cp-plan` preserves `REQ_OPEN`, removes later rows, and restores three unplaced markers deterministically.
32. `UI_TTL_DRAIN_BAR` refreshes on each successful cache read (`C12`).
33. Static tape bars render without hover.
34. Hover bucket calculations sum to the authoritative row cost.
35. Every tape row includes the visual weight of non-zero `outTok`.
36. Reduced-motion mode produces identical actions, rows, costs, marker consumption, and reveal order.
37. The three-policy comparison is absent before `COMPLETE_ATTEMPT`.
38. Counterfactual requests and reveals cannot mutate actual-attempt wallet, ledger, `attemptResult`, `clockFrozen`, or `frozenFailure`.
39. `referenceCfg` plus the three reference placement actions passes the behavioral gate from seed `7007`.
40. `antiCfg` with no placements reaches the Lunch failure for the intended economic cause.
41. Scalar-wallet arithmetic uses unrounded values; the full Never comparison may report a negative projected remainder without mutating actual `ReducerState.wallet`.
42. `attemptMetrics.spentUsd === budget - wallet` during play.
43. `attemptResult.spentUsd === attemptMetrics.spentUsd` after `COMPLETE_ATTEMPT`.
44. No gate or star predicate references `wallet.spentUsd`.
45. The result screen reports behavioral understanding separately from budget.
46. The fixed seed is winnable without undocumented controls.
47. `concept.id`, both prerequisites, and the level slug match the canonical registries.
48. The `StatePredicate` objects use only `compare`, `includes`, `event-completed`, `action-observed`, and `all`, with only legal comparison operations.
49. Each authoritative quantity has one implementable value; no uncapped Always total or superseded price appears.
50. The identity assertion is:
    ```ts
    {
      kind: "identity-no-solution-vocabulary",
      forbiddenTerms: [
        "keep warm",
        "keep-warm",
        "ping",
        "marker",
        "break-even",
        "rebuild",
        "expire",
        "expiry",
        "alive"
      ],
      assertion: "title and objective contain no solution vocabulary"
    }
    ```

## 13. Reference-bar justification

The screen opens on one tactile resource: three finite markers. There is no configuration toggle or policy selector competing with that surface. Spending a marker now necessarily removes it from a later gap, so the central decision has live counter-pressure rather than a dial-to-maximum answer.

Lunch establishes that intervention can be dramatically cheaper than a rewrite. The player must then apply that visible evidence by placing the final marker on a new gap. Meeting rewards restraint, Commute rewards selective intervention, and Overnight reverses the urge to preserve everything only after a committed prediction.

The sole freeze occurs during the actual attempt, exactly when the ledger proves the punished Lunch route is more expensive, and rewinds directly to placement. The capped post-attempt comparison then shows both failure extremes without violating the inventory: spend all three too early, spend none, or allocate them where their priced benefit is largest.

The discovery rhythm is: touch a finite resource, predict, observe a causal bill, transfer the rule through a new placement, encounter the break-even reversal, then compare completed policies.

Significant tradeoff: `cfg.keepWarm` remains locked during the level because exposing it beside the finite marker planner would create a second surface and an ambiguous source of ping effects. Marker placements are authoritative; the campaign unlock still exposes `keepWarm` after completion.
