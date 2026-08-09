# Level 7 — Keep It Alive

## 1. Identity

- **id:** `07-keep-it-alive`
- **title:** Keep It Alive
- **tier:** `2`
- **Objective copy:** “Three pings. Five gaps. Keep the day moving without babysitting it.”
- **One concept:** `keep-warm-breakeven` — a keep-warm request is worthwhile only while its accumulated cost remains below the rewrite delta it prevents.
- **Prerequisites:** `cache-expiry` and `ttl-tier-tradeoff`.
- **Post-reveal rule:** “Ping only while the pings cost less than rebuilding.”
- **Unlocks:** `keepWarm`
- **Introduced control:** `keepWarmMin`

The title, objective, opening timeline, and policy controls do not identify the correct gaps.

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

Each of the three limited markers authors exactly one real `PLACE_KEEP_WARM_PING` effect. No policy, counterfactual, or shortcut creates more than three pings.

## 3. Cold-open / narrative

No instruction card and no pre-play price comparison.

| Time | Beat |
|---:|---|
| `0.0s` | A workday timeline slides under the cursor. Five closed gap cards read **Coffee**, **Lunch**, **Meeting**, **Commute**, and **Overnight**. Their durations are visible; their outcomes are not. |
| `0.4s` | `UI_MAIN_CACHE_PANEL` shows a live 60-minute entry. Three draggable markers land beside the timeline with the label **“3 pings left.”** |
| `0.8s` | Copy: **“Tomorrow’s release is already cached. Plan the gaps.”** |
| `1.2s` | Lunch’s two available marker slots pulse without success coloring. Copy: **“Spend now, save for later, or leave the cache alone.”** |
| `1.6s` | Pointer and keyboard users can place the first marker. |
| `2.0s` | Three policy chips appear: **Always ping — 3 max**, **Never ping**, and **Choose each ping**. No chip is styled or described as correct. |

`firstInteractiveBySec = 1.6` `[ESTIMATE]`.

Policy semantics are finite:

- **Always ping — 3 max** assigns the three markers to the earliest eligible slots: Lunch `50m`, Lunch `100m`, and Meeting `50m`.
- **Never ping** leaves all markers unplaced.
- **Choose each ping** leaves placement under player control.

Before Lunch resolves, only its two slots accept manual placement. Later slots remain visible but unresolved, preventing the opening from becoming a five-gap answer-entry form. Lunch evidence unlocks placement of the remaining marker on Meeting, Commute, or Overnight slots.

## 4. Exact event sequence

The scenario uses `MAIN_PREFIX_HEY = 34,738` tokens (`C34`), Sonnet rates (`C1`, `C3`), and `CACHE_TIER_1H` with a 60-minute idle TTL (`C1`). Every work request adds `100` fresh input tokens and `100` output tokens `[FICTION]`. Every ping adds `1` fresh input token and `1` output token `[FICTION]`. The selected cadence is `50m` `[FICTION]`.

1. **Enter the planner**
   - Event: screen mounts.
   - Action: `{ type: "ENTER_LEVEL", levelId: "07-keep-it-alive" }`
   - Mutates: `ReducerState`, `Clock`, `Wallet`, `MAIN_SESSION_CONTEXT`, `PREFIX_STACK`, `LimitedMarkerInventoryState`.
   - Numbers: clock `0m`; wallet `$0.70` `[FICTION]`; marker capacity `3` `[FICTION]`; TTL `60m` (`C1`).

2. **Prime the workday**
   - Event: the opening request runs automatically.
   - Action: `{ type: "SEND_REQUEST", request: REQ_OPEN }`
   - Mutates: `CacheEntry`, `LedgerRow[]`, `Wallet`, `lastRequests`.
   - Numbers: `writeTok=34,738`, `inputTok=100`, `outTok=100`; cost `$0.210228` (`C1`, `C3`, `C34`).
   - Toast: `toast-first-write`.

3. **Create the placement checkpoint**
   - Event: the opening tape settles.
   - Action: `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-plan", reason: "decision" }`
   - Mutates: `Checkpoint[]`.
   - Numbers: no request and no cost.

4. **Choose manual placement**
   - Event: the reference player chooses **Choose each ping**.
   - Action: `{ type: "SET_CFG", patch: { keepWarm: true, keepWarmMin: 50 } }`
   - Mutates: `cfg.keepWarm`, `cfg.keepWarmMin`.
   - Numbers: interval `50m` `[FICTION]`.

5. **Place the two Lunch markers**
   - Events and actions:
     1. `{ type: "PLACE_LIMITED_MARKER", inventoryId: "l7-pings", markerId: "ping-a", targetId: "lunch-50", atMin: 50 }`
     2. `{ type: "PLACE_LIMITED_MARKER", inventoryId: "l7-pings", markerId: "ping-b", targetId: "lunch-100", atMin: 100 }`
   - Mutates: `LimitedMarkerInventoryState.placements`.
   - Numbers: available markers `3→2→1`; placement itself creates no ledger row.
   - Each target permits stacking only through its distinct authored slot ID.

6. **Commit the Lunch prediction**
   - Event: player presses **Run to Lunch**.
   - Actions:
     1. `{ type: "OPEN_PREDICTION", promptId: "pred-lunch" }`
     2. player selects any option
     3. `{ type: "COMMIT_PREDICTION", promptId: "pred-lunch" }`
   - Mutates: `phase`, `prediction`.
   - Numbers: Lunch evidence remains locked until commitment. Option identity has no economic or scoring effect.

7. **Cross Coffee**
   - Event: the `20m` Coffee gap completes.
   - Actions:
     1. `{ type: "ADVANCE", min: 20 }`
     2. `{ type: "SEND_REQUEST", request: REQ_AFTER_COFFEE }`
   - Mutates: `Clock`, `CacheEntry.lastTouchMin`, `LedgerRow[]`, `Wallet`.
   - Numbers: `readTok=34,738`, `inputTok=100`, `outTok=100`; cost `$0.0122214` (`C1`, `C3`, `C34`).

8. **Resolve Lunch**
   - Event: the two placed targets resolve at `50m` and `100m`; work resumes `20m` later.
   - Actions, in order:
     1. `{ type: "ADVANCE", min: 50 }`
     2. `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 50 }`
     3. `{ type: "SEND_REQUEST", request: PING_LUNCH_1 }`
     4. `{ type: "ADVANCE", min: 50 }`
     5. `{ type: "PLACE_KEEP_WARM_PING", gapId: "lunch", atMin: 100 }`
     6. `{ type: "SEND_REQUEST", request: PING_LUNCH_2 }`
     7. `{ type: "ADVANCE", min: 20 }`
     8. `{ type: "SEND_REQUEST", request: REQ_AFTER_LUNCH }`
     9. `{ type: "REVEAL_PREDICTION", promptId: "pred-lunch", correctOptionId: "two-pings-win" }`
   - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`, resolved marker placements, `prediction`, `phase`.
   - Numbers:
     - Each ping: `readTok=34,738`, `inputTok=1`, `outTok=1`; `$0.0104394`.
     - Two pings: `$0.0208788`.
     - Warm resumed work: `$0.0122214`.
     - Protected route: `$0.0331002`.
     - Cold resumed work without pings: `$0.210228`.
     - Saving: `$0.1771278`.
     - All values derive from `C1`, `C3`, `C12`, `C20`, and `C34`.
   - Toast: `toast-lunch-paid`.

   If zero markers were placed on Lunch, `REQ_AFTER_LUNCH` instead resolves cold and immediately enters the failure in §9.

9. **Open the post-evidence transfer**
   - Event: Lunch evidence settles; Meeting, Commute, and Overnight targets unlock.
   - Action: `{ type: "BEGIN_TRANSFER", challengeId: "bridge-next-gap" }`
   - Mutates: `phase`, transfer visibility.
   - Numbers: one unused marker remains on the reference route.

10. **Apply the Lunch evidence**
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
    - Mutates: `LimitedMarkerInventoryState.placements`, transfer evidence.
    - Numbers: available markers `1→0`; no ledger row until the target resolves.
    - This is the gate’s required post-evidence action. Prediction correctness is not inspected.

11. **Cross Meeting**
    - Event: `50m` passes without a ping.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "SEND_REQUEST", request: REQ_AFTER_MEETING }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`.
    - Numbers: `50<60`, so the request remains warm and costs `$0.0122214` (`C1`, `C3`, `C34`).
    - Toast: `toast-no-ping-needed`.

12. **Commit the Commute prediction**
    - Event: Commute begins.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-commute" }`
      2. player selects any option
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-commute" }`
    - Mutates: `phase`, `prediction`.
    - Numbers: no request and no cost.

13. **Resolve Commute**
    - Event: the `90m` gap runs.
    - Actions:
      1. `{ type: "ADVANCE", min: 50 }`
      2. `{ type: "PLACE_KEEP_WARM_PING", gapId: "commute", atMin: 50 }`
      3. `{ type: "SEND_REQUEST", request: PING_COMMUTE }`
      4. `{ type: "ADVANCE", min: 40 }`
      5. `{ type: "SEND_REQUEST", request: REQ_AFTER_COMMUTE }`
      6. `{ type: "REVEAL_PREDICTION", promptId: "pred-commute", correctOptionId: "one-ping-win" }`
    - Mutates: `Clock`, `CacheEntry`, `LedgerRow[]`, `Wallet`, resolved marker placement, `prediction`.
    - Numbers: ping `$0.0104394`; warm resumed work `$0.0122214`; the ping avoids a `$0.1980066` cold-to-warm request delta (`C1`, `C3`, `C12`, `C20`, `C34`).
    - Toast: `toast-commute-paid`.

14. **Commit the Overnight prediction**
    - Event: the `1,260m` Overnight card expands.
    - Actions:
      1. `{ type: "OPEN_PREDICTION", promptId: "pred-overnight" }`
      2. player selects any option
      3. `{ type: "COMMIT_PREDICTION", promptId: "pred-overnight" }`
    - Mutates: `phase`, `prediction`.
    - Numbers: `1,260m = 21h` `[FICTION]`. No result or break-even label appears before commitment.

15. **Let Overnight expire — aha frame**
    - Event: no marker remains; next-day work resumes after `1,260m`.
    - Actions:
      1. `{ type: "ADVANCE", min: 1260 }`
      2. `{ type: "SEND_REQUEST", request: REQ_NEXT_DAY }`
      3. `{ type: "REVEAL_PREDICTION", promptId: "pred-overnight", correctOptionId: "let-expire" }`
    - Mutates: `Clock`, expired and replacement `CacheEntry`, `LedgerRow[]`, `Wallet`, `prediction`.
    - Numbers:
      - Actual rebuild request: `$0.210228`.
      - An uninterrupted `50m` rate projection would require `25` pings; this is explanatory arithmetic, not a runnable marker branch.
      - Projected pings: `25 × $0.0104394 = $0.260985`.
      - Projected pings plus warm next request: `$0.2732064`.
      - Rebuild wins by `$0.0629784`.
      - The gap also exceeds the canonical 1-hour-tier `20h` keep-warm break-even (`C19`, `C20`).
    - `ahaFrame=true`.
    - Copy revealed now: **“Lunch was worth tending. Overnight wasn’t.”**
    - Toast: `toast-overnight-line`.

16. **Submit understanding**
    - Event: player selects the revealed causal rule and presses **Finish**.
    - Actions:
      1. `{ type: "ACK_EXPLANATION", explanationId: "keep-warm-rule" }`
      2. `{ type: "LOCK_LIMITED_MARKERS", inventoryId: "l7-pings" }`
      3. `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates: explanation evidence, locked marker state, result state.
    - Numbers: reference spend `$0.5006598`.

17. **Reveal post-attempt policies**
    - Event: `UI_RESULT_SCREEN` opens **Compare policies**.
    - Actions:
      1. `{ type: "REQUEST_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
      2. `{ type: "REVEAL_COUNTERFACTUAL", comparisonId: "policy-three-way" }`
    - Mutates: comparison visibility only.
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
  title: "Keep It Alive",
  objective: "Three pings. Five gaps. Keep the day moving without babysitting it.",

  concept: {
    id: "keep-warm-breakeven",
    privateDesignerSummary:
      "A keep-warm ping pays only while cumulative ping cost remains below the avoided rewrite delta.",
    postRevealRule:
      "Ping only while the pings cost less than rebuilding."
  },
  prerequisiteConceptIds: ["cache-expiry", "ttl-tier-tradeoff"],

  unlocks: "keepWarm",
  introducedControls: ["keepWarmMin"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "prompts",
    "width",
    "oneHourFlag",
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
    estimates: [
      { label: "budgetUsd", value: 0.70, tag: "[FICTION]" },
      { label: "clockCapMin", value: 1540, tag: "[FICTION]" },
      { label: "availablePings", value: 3, tag: "[FICTION]" },
      { label: "workFreshInputTok", value: 100, tag: "[FICTION]" },
      { label: "workOutputTok", value: 100, tag: "[FICTION]" },
      { label: "pingFreshInputTok", value: 1, tag: "[FICTION]" },
      { label: "pingOutputTok", value: 1, tag: "[FICTION]" },
      { label: "keepWarmMin", value: 50, tag: "[FICTION]" },
      { label: "coffeeMin", value: 20, tag: "[FICTION]" },
      { label: "lunchMin", value: 120, tag: "[FICTION]" },
      { label: "meetingMin", value: 50, tag: "[FICTION]" },
      { label: "commuteMin", value: 90, tag: "[FICTION]" },
      { label: "overnightMin", value: 1260, tag: "[FICTION]" }
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
        id: "no-wasted-pings",
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
          }
        ]
      }
    ],
    explanationRequirement: {
      id: "rule-acknowledged-after-evidence",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "ev-overnight-reveal",
      match: { explanationId: "keep-warm-rule" }
    },
    transferRequirement: {
      id: "bridge-next-gap-completed",
      kind: "includes",
      path: "completedTransferIds",
      value: "bridge-next-gap",
      observedAfterEventId: "ev-lunch-reveal"
    }
  },

  star2: {
    label: "Day planner",
    predicate: {
      id: "l7-star2",
      kind: "compare",
      path: "wallet.spentUsd",
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
          path: "wallet.spentUsd",
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
      "Use all three markers only where each remains cheaper than rebuilding."
  },

  referenceCfg: {
    oneHourFlag: true,
    keepWarm: true,
    keepWarmMin: 50
  },

  antiCfg: {
    oneHourFlag: true,
    keepWarm: false,
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

Reference actions place `ping-a` on `lunch-50`, `ping-b` on `lunch-100`, and—after `ev-lunch-reveal`—`ping-c` on `commute-50`.

The **Always ping — 3 max** counterfactual places the same three marker IDs on `lunch-50`, `lunch-100`, and `meeting-50`. The **Never ping** counterfactual leaves `placements=[]`. Neither branch can produce more than three ping requests.

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

The Overnight projection applies the same `PRICE_REQUEST` ping price but creates no ledger rows and consumes no fictional markers. It confirms `C19` and applies the decision rule in `C20`.

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

Every row renders all non-zero `WireSegment`s. In particular, `outTok` contributes its `$15/M` Sonnet output cost to the violet segment and to total bar geometry from the first row (`C1`, `C3`). Hiding a small output label may not remove its visual width.

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

- **Predicate:** zero Lunch markers resolve and `REQ_AFTER_LUNCH` is cold.
- **Decisive event:** `REQ_AFTER_LUNCH` appends its cold ledger row.
- **Visible actual route:** cold resumed work costs `$0.210228`.
- **Visible valid alternative:** two pings plus warm resumed work cost `$0.0331002`.
- **Margin:** the mistake costs `$0.1771278` more; `actualUsd > validAlternativeUsd`.

Action:

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

- Lunch’s empty marker slots.
- The expired `CacheEntry`.
- `REQ_AFTER_LUNCH`’s write and output segments.
- The `$0.210228` versus `$0.0331002` comparison.
- The wallet delta.

Rewind copy: **“Rewind to ping placement.”**

Action:

```ts
{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-plan" }
```

Rewind preserves `REQ_OPEN` and its ledger row, clears later economics, and restores all three marker IDs as unplaced. There is no overnight ping-count failure: a three-marker inventory cannot reach an uncapped nineteenth or twenty-fifth ping.

## 10. Gate & stars

### Pass predicate

`pass(st)` is pure and returns true only when:

- Exactly two real ping requests executed during Lunch.
- Exactly one real ping request executed during Commute.
- Zero pings executed during Coffee, Meeting, and Overnight.
- The Commute marker was placed through `PLACE_LIMITED_MARKER` after `ev-lunch-reveal`.
- `bridge-next-gap` completed from that post-evidence action.
- `keep-warm-rule` was acknowledged after `ev-overnight-reveal`.
- The attempt reached `REQ_NEXT_DAY`.

The pass predicate does not inspect:

- Which prediction option was selected.
- Prediction correctness.
- Whether a prediction matched its reveal key.
- Budget alone.

Prediction commitment remains a reveal precondition enforced by `predict-before-reveal`, not a scoring criterion.

### Stars

- **1 star:** behavioral pass.
- **2 stars:** pass and `spentUsd <= $0.55` `[FICTION]`.
- **3 stars:** pass, exactly three ping requests, and `spentUsd <= $0.5006598`.

The 3-star comparison is a `lte` predicate against the authoritative reference total; it never uses floating-point equality.

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
3. The inventory starts with exactly three unique marker IDs.
4. Pointer drag and keyboard placement dispatch equivalent `PLACE_LIMITED_MARKER` actions.
5. A marker occupies at most one target, and each authored slot accepts at most one marker.
6. Placement creates no priced request until its target resolves.
7. Exactly one `PLACE_KEEP_WARM_PING` and one priced ping request result from each resolved marker.
8. **Always ping — 3 max** creates exactly three pings at `lunch-50`, `lunch-100`, and `meeting-50`.
9. No policy or counterfactual creates more than three ping effects.
10. Lunch, Commute, and Overnight evidence cannot reveal before the corresponding prediction is committed.
11. A wrong prediction changes no wallet value, score, star, failure, or gate result.
12. The gate observes `PLACE_LIMITED_MARKER` on `commute-50` after `ev-lunch-reveal`.
13. Prediction option identity never appears in `pass(st)`, a star predicate, or a failure predicate.
14. Reference play yields exactly `9` `LedgerRow`s and `9` tape rows.
15. Every priced request produces exactly one ledger row and one tape row.
16. Every real request cost is positive.
17. No positive amount displays as `$0.0000`; ping input and output details retain sufficient precision.
18. Every request price matches `PRICE_REQUEST` using `C1`, `C3`, and `C34`.
19. Reference spend is exactly `$0.5006598` before display rounding.
20. **Always ping — 3 max** totals exactly `$0.6986664`.
21. **Never ping** totals exactly `$0.8653548` in the post-attempt counterfactual.
22. The Lunch failure freezes only after the `$0.210228` cold row is visible.
23. The failure comparison shows `$0.210228 > $0.0331002`.
24. No unreachable overnight ping-count failure exists.
25. Rewind to `cp-plan` preserves `REQ_OPEN`, removes later rows, and restores three unplaced markers deterministically.
26. `UI_TTL_DRAIN_BAR` refreshes on each successful cache read (`C12`).
27. Static tape bars render without hover.
28. Hover bucket calculations sum to the authoritative row cost.
29. Every tape row includes the visual weight of non-zero `outTok`.
30. Reduced-motion mode produces identical actions, rows, costs, marker consumption, and reveal order.
31. The three-policy comparison is absent before `COMPLETE_ATTEMPT`.
32. `referenceCfg` plus the reference marker actions passes the behavioral gate from seed `7007`.
33. `antiCfg` with no placements reaches the Lunch failure for the intended economic cause.
34. Wallet arithmetic uses unrounded values and may become negative on the full Never counterfactual.
35. The result screen reports behavioral understanding separately from budget.
36. The fixed seed is winnable without undocumented controls.
37. `concept.id`, both prerequisites, and the level slug match the canonical registries.
38. Each authoritative quantity has one implementable value; no uncapped Always total or superseded price appears.

## 13. Reference-bar justification

The screen opens on one tactile resource: three finite markers. The player cannot maximize a dial or schedule an unlimited background policy; spending a marker now necessarily removes it from a later gap. Lunch first establishes that intervention can be dramatically cheaper than a rewrite. The player must then apply that visible evidence by placing the final marker on a new gap, making the gate a real post-evidence decision rather than a scored guess.

Meeting rewards restraint, Commute rewards selective intervention, and Overnight overturns the urge to preserve everything only after a committed prediction. The sole freeze occurs where the ledger makes the punished route unambiguously more expensive, then rewinds directly to marker placement. The capped post-attempt comparison shows both failure extremes without violating the inventory: spend all three too early, spend none, or allocate them where their priced benefit is largest.

The discovery rhythm is therefore: touch a finite resource, predict, observe a causal bill, transfer the rule through a new placement, encounter the break-even reversal, then compare completed policies.
