# Level 6 — Buy More Time?

## 1. Identity

- `id`: `"06-buy-more-time"`
- `title`: **Buy More Time?**
- `tier`: `1`
- `objective`: **Choose a write for each workday. Exact gaps stay covered until you commit.**
- ONE concept: a higher-premium write tier is worthwhile only when its longer TTL prevents enough rewrites.
- `concept.id`: `"ttl-tier-tradeoff"`
- `concept.privateDesignerSummary`: Compare the 5-minute and 1-hour tiers against inferable but unrevealed workday rhythms.
- `concept.postRevealRule`: **Pay for longer life only when the schedule prevents enough rewrites.**
- `concept.solutionVocabulary`: `["5-minute write tier", "1-hour write tier", "longer TTL", "TTL premium", "rebuild break-even"]`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["write-vs-read", "cache-expiry"]`
- Unlock and introduced control: `oneHourFlag`
- Previously introduced controls remain locked except `run`.

Prediction correctness is evidence only. It never changes the wallet, score, stars, failure state, or pass predicate.

## 2. Objects used

- `Request`
- `PricedRequest`
- `PrefixStack`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `Checkpoint`
- `ScenarioFixtureDef`
- `CACHE_TIER_5M`
- `CACHE_TIER_1H`
- `RATE_CACHE_READ`
- `RATE_CACHE_WRITE_5M`
- `RATE_CACHE_WRITE_1H`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- Interaction pattern `predict-before-reveal`
- Interaction pattern `fail-freeze-rewind`
- Interaction pattern `just-in-time-toast`
- Interaction pattern `counterfactual-after-attempt`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; the first tier control is interactive by `1.0s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | A **MONDAY** calendar strip lands on the desk. Four covered work blocks are visibly packed into one narrow portion of the same hour. Generic hour ticks establish scale, while the exact gap labels remain masked. |
| `0.3s` `[ESTIMATE]` | System copy: **“Four blocks today. The exact gaps are under the tape.”** |
| `0.6s` `[ESTIMATE]` | Accessible evidence says: **“Four evenly spaced blocks are tightly clustered within a small part of one hour.”** This is the same evidence conveyed by the silhouette, not hidden metadata. |
| `0.8s` `[ESTIMATE]` | Two equal-weight controls appear: **“Write · 5 min”** and **“Write · 1 hour.”** Neither has a price, recommendation, correctness color, or rebuild count. |
| `1.0s` | Player may select Monday’s tier. `CREATE_CHECKPOINT { checkpointId: "cp-monday", reason: "decision" }` has already completed. |
| After tier selection | Copy: **“Lock your prediction before the tape comes off.”** Open `pred-monday`. |
| After Monday resolves | Both Monday totals become visible. Monday is an observed comparison, never a failure freeze. |
| Before Tuesday selection | A **TUESDAY** strip appears on the same scale. Four covered blocks are spread evenly across roughly an hour and a half. Exact gap labels remain masked. Copy: **“Same work. Different rhythm.”** |
| After Tuesday tier selection | Open `pred-tuesday`; running remains disabled until commitment. |

The spatial density is deliberate inferable evidence. Before commitment, the UI exposes no exact gap value, price, total, avoided-rebuild count, break-even ratio, correctness label, or answer-shaped color.

## 4. Exact event sequence

All requests use Sonnet, a byte-identical cacheable prefix of `26,237` tokens (`C10`), `freshInputTok=0`, and `expectedOutputTok=0`. Prices use unrounded `PRICE_REQUEST` results. Gameplay calibration is registered in `scenarioData.fixtures`; `[ESTIMATE]` is reserved for presentation timing.

1. **Enter level — `ev-enter`**
   - Event: the screen opens.
   - Action: `ENTER_LEVEL { levelId: "06-buy-more-time" }`.
   - Mutates: `ReducerState`, `Wallet`, `Budget`, `Clock`, two `MAIN_SESSION_CONTEXT` seeds, empty cache, empty ledger, prediction state, and attempt state.
   - Numbers: budget and wallet `$0.60000000` `[FICTION]` from fixture `l6-attempt-budget`; clock `0m`; ledger rows `0`.

2. **Create Monday checkpoint — `ev-cp-monday`**
   - Event: Monday’s tier controls become active.
   - Action: `CREATE_CHECKPOINT { checkpointId: "cp-monday", reason: "decision" }`.
   - Mutates: `Checkpoint[]`.
   - Economic effect: none.

3. **Choose Monday tier — `ev-select-monday-tier`**
   - Event: the player selects one tier for Monday’s cache entry.
   - Action: `SELECT_WRITE_TIER { blockId: "monday", tier }`.
   - Mutates: Monday tier selection and `cfg.oneHourFlag`.
   - Economic effect: none.
   - The silhouette is already visible, so this is reasoning from calendar density rather than a blind guess.
   - The selected tier locks for this Monday branch.

4. **Commit Monday prediction — `ev-commit-pred-monday`**
   - Ordered actions:
     1. `OPEN_PREDICTION { promptId: "pred-monday" }`
     2. `SELECT_PREDICTION { promptId: "pred-monday", optionId }`
     3. `COMMIT_PREDICTION { promptId: "pred-monday" }`
   - Mutates: `PredictionState` and phase.
   - Monday execution remains disabled until commitment. The chosen option has no economic or scoring effect.

5. **Monday block 1 — `ev-monday-b1`**
   - Event: the player presses **Run Monday**.
   - Action: `SEND_REQUEST { request: r1-b1 }`.
   - Mutates: Monday `CacheEntry`, ledger, `lastRequests`, wallet, attempt metrics, and tape.
   - With `5m`: `writeTok=26,237`; `$0.09838875` (`C1`, `C3`, `C10`).
   - With `1h`: `writeTok=26,237`; `$0.15742200` (`C1`, `C3`, `C10`).

6. **Reveal Monday gap 1 — `ev-monday-gap1`**
   - Event: only the first exact gap label uncovers.
   - Action: `ADVANCE { min: 2 }`.
   - Mutates: `clockMin`; the selected entry remains live.
   - Number: `2m` `[FICTION]` from fixture `l6-monday-gap-duration`.

7. **Monday block 2 — `ev-monday-b2`**
   - Action: `SEND_REQUEST { request: r1-b2 }`.
   - Mutates: ledger, wallet, attempt metrics, tape, `CacheEntry.lastTouchMin`, and expiry.
   - Both tiers resolve with `readTok=26,237` for `$0.00787110` (`C1`, `C3`, `C10`).
   - The successful read refreshes idle TTL (`C12`).

8. **Monday blocks 3 and 4 — `ev-monday-b3` / `ev-monday-b4`**
   - Ordered actions:
     1. `ADVANCE { min: 2 }`
     2. `SEND_REQUEST { request: r1-b3 }`
     3. `ADVANCE { min: 2 }`
     4. `SEND_REQUEST { request: r1-b4 }`
   - Mutates: clock, ledger, wallet, attempt metrics, tape, and cache expiry.
   - Each gap is `2m` `[FICTION]` from fixture `l6-monday-gap-duration`; each request reads `26,237` tokens for `$0.00787110` (`C1`, `C3`, `C10`, `C12`).

9. **Reveal Monday evidence — `ev-monday-result`**
   - Ordered actions:
     1. `REVEAL_PREDICTION { promptId: "pred-monday", correctOptionId: "five-minute" }`
     2. `REQUEST_COUNTERFACTUAL { comparisonId: "cf-monday-reference" }`
     3. `REVEAL_COUNTERFACTUAL { comparisonId: "cf-monday-reference" }`
     4. `REQUEST_COUNTERFACTUAL { comparisonId: "cf-monday-anti" }`
     5. `REVEAL_COUNTERFACTUAL { comparisonId: "cf-monday-anti" }`
   - Mutates: prediction reveal, completed-event evidence, and `UI_COUNTERFACTUAL_OVERLAY`.
   - Visible comparison:
     - 5m total: `$0.12200205`.
     - 1h total: `$0.18103530`.
     - Longer-tier premium: `$0.05903325`.
     - Rebuilds avoided: `0`.
   - Evidence copy: **“Every next block arrived while the short entry was still alive.”**
   - This is deliberately non-freezing. The player has completed a meaningful Monday run and receives truthful evidence without punishment.

10. **Offer explanation and transfer — `ev-begin-tuesday-transfer`**
    - Optional action: `ACK_EXPLANATION { explanationId: "monday-premium-no-rebuild" }`.
    - Required transition action: `BEGIN_TRANSFER { challengeId: "tuesday-spaced-work" }`.
    - Mutates: `acknowledgedExplanationIds`, phase, and transfer state.
    - Prediction correctness is not inspected.

11. **Initialize Tuesday — `ev-cp-tuesday`**
    - Ordered actions:
      1. `DISCARD_CONTEXT { contextId: "main-l6-monday" }`
      2. `ADVANCE { min: 24 }`
      3. `CREATE_CHECKPOINT { checkpointId: "cp-tuesday", reason: "decision" }`
    - Mutates: Monday cache namespace, `clockMin`, Tuesday cold context, and `Checkpoint[]`.
    - Clock advances from `6m` to `30m`; the `24m` separation is `[FICTION]` from fixture `l6-day-separation`.
    - Monday’s completed evidence remains visible and is not replayed after a Tuesday rewind.

12. **Choose Tuesday tier — `ev-select-tuesday-tier`**
    - Event: the player applies the revealed evidence to Tuesday’s sparse silhouette.
    - Action: `SELECT_WRITE_TIER { blockId: "tuesday", tier }`.
    - Mutates: Tuesday tier selection and `cfg.oneHourFlag`.
    - If `tier === "1h"`, this authored post-evidence choice also appends `"l6-tuesday-1h-after-monday"` to `completedTransferIds`.
    - Economic effect: none until the requests execute.
    - This selection locks for the current Tuesday branch. Rewinding to `cp-tuesday` removes the branch-local marker and restores the tier control.
    - This is the authoritative post-evidence transfer action used by the gate and pure `pass(st)`.

13. **Commit Tuesday prediction — `ev-commit-pred-tuesday`**
    - Ordered actions:
      1. `OPEN_PREDICTION { promptId: "pred-tuesday" }`
      2. `SELECT_PREDICTION { promptId: "pred-tuesday", optionId }`
      3. `COMMIT_PREDICTION { promptId: "pred-tuesday" }`
    - Mutates: `PredictionState` and phase.
    - Tuesday execution remains disabled until commitment. Correctness remains non-punitive.

14. **Tuesday block 1 — `ev-tuesday-b1`**
    - Action: `SEND_REQUEST { request: r2-b1 }`.
    - Mutates: Tuesday `CacheEntry`, ledger, wallet, `lastRequests`, attempt metrics, and tape.
    - With `5m`: `$0.09838875`.
    - With `1h`: `$0.15742200`.
    - Citations: `C1`, `C3`, `C10`.

15. **Reveal Tuesday gap 1 — `ev-tuesday-gap1`**
    - Action: `ADVANCE { min: 30 }`.
    - Mutates: `clockMin` and derived cache liveness.
    - Number: `30m` `[FICTION]` from fixture `l6-tuesday-gap-duration`.
    - A 5m entry is expired; a 1h entry has `30m` remaining (`C1`).

16. **Tuesday block 2 and local failure evaluation — `ev-tuesday-b2`**
    - Actual economic action: `SEND_REQUEST { request: r2-b2 }`.
    - Mutates in all branches: ledger, wallet, `lastRequests`, attempt metrics, tape, and cache.
    - With `5m`: the expired prefix rewrites, `writeTok=26,237`, `$0.09838875`.
    - With `1h`: the live prefix reads, `readTok=26,237`, `$0.00787110`.
    - `ahaFrame=true`: the `30 MIN` label, `UI_TTL_DRAIN_BAR`, actual ledger row, and causal bucket are visible together.
    - On the harmful 5m branch only, the engine immediately:
      1. reads the actual buckets from `lastRequests[0]`;
      2. computes an uncharged request-local quote using the same request’s model, prefix, and zero output, with `readTok=26,237`, `writeTok=0`, and `PRICE_REQUEST`, yielding `$0.00787110`;
      3. places that quote beside the actual `$0.09838875` ledger row;
      4. dispatches the following action from `ev-tuesday-b2`, before any later event or player input:

```ts
FREEZE_FAILURE {
  failure: {
    failureId: "fail-tuesday-expiry",
    causeCode: "SHORT_TTL_REBUILD",
    message:
      "Block 2 arrived 30 minutes later. The 5-minute entry expired, so 26,237 tokens rewrote for $0.09838875 instead of reading for $0.00787110.",
    checkpointId: "cp-tuesday"
  }
}
```

   - The local quote is computed by `PRICE_REQUEST`, but it is not a `Request`, `LedgerRow`, counterfactual action, wallet mutation, or tape row.
   - On the harmful branch, the same event cycle also mutates `frozenFailure`, `clockFrozen`, and phase.
   - The frozen frame shows `$0.09838875 > $0.00787110` and `12.5×`.
   - No `REQUEST_COUNTERFACTUAL` or `REVEAL_COUNTERFACTUAL` occurs before this freeze.
   - Rewind action: `REWIND_TO_CHECKPOINT { checkpointId: "cp-tuesday" }`.
   - Rewind label: **“Choose Tuesday again.”**

17. **Complete Tuesday under 1h — `ev-tuesday-b3` / `ev-tuesday-b4`**
    - Preconditions: Tuesday’s selected tier is `1h`; no frozen failure exists.
    - Ordered actions:
      1. `ADVANCE { min: 30 }`
      2. `SEND_REQUEST { request: r2-b3 }`
      3. `ADVANCE { min: 30 }`
      4. `SEND_REQUEST { request: r2-b4 }`
    - Mutates: clock, ledger, wallet, attempt metrics, tape, and refreshed cache expiry.
    - Each request reads `26,237` tokens for `$0.00787110` (`C1`, `C3`, `C10`, `C12`).
    - The two `30m` gaps are `[FICTION]` from fixture `l6-tuesday-gap-duration`.

18. **Reveal Tuesday result — `ev-tuesday-result`**
    - Action: `REVEAL_PREDICTION { promptId: "pred-tuesday", correctOptionId: "one-hour" }`.
    - Mutates: prediction reveal, `completedEventIds`, and transfer completion.
    - Visible result:
      - 1h total: `$0.18103530`.
      - 5m informational projection: `$0.39355500`.
      - 1h saving: `$0.21251970`.
      - Rebuilds avoided: `3`.
    - Causal copy: **“Each 30-minute read refreshed the hour; the 5-minute entry would have rebuilt every time.”**

19. **Complete attempt and reveal the rule — `ev-complete-attempt`**
    - Ordered actions:
      1. `COMPLETE_ATTEMPT`
      2. `REQUEST_COUNTERFACTUAL { comparisonId: "cf-tuesday-reference" }`
      3. `REVEAL_COUNTERFACTUAL { comparisonId: "cf-tuesday-reference" }`
      4. `REQUEST_COUNTERFACTUAL { comparisonId: "cf-tuesday-anti" }`
      5. `REVEAL_COUNTERFACTUAL { comparisonId: "cf-tuesday-anti" }`
    - Mutates: `attemptResult`, gate result, stars, `UI_RESULT_SCREEN`, and final `UI_COUNTERFACTUAL_OVERLAY`.
    - Counterfactual actions occur only after `COMPLETE_ATTEMPT` and cannot mutate the actual ledger, wallet, result, or failure state.
    - Reference total: `$0.30303735`.
    - Anti-pattern total: `$0.57459030`.
    - Anti-pattern delta: `$0.27155295`.
    - Only now reveal `(2−1.25)/(1.25−0.1)=0.652173…` (`C21`).
    - Final rule: **“Pay for longer life only when the schedule prevents enough rewrites.”**

## 5. Level data

```ts
const L6_UNITS: UnitSeed[] = [
  "r1-b1", "r1-b2", "r1-b3", "r1-b4",
  "r2-b1", "r2-b2", "r2-b3", "r2-b4"
].map(id => ({
  id,
  kind: "TASK",
  ticket: 1,
  deps: [],
  hours: 0,
  outTok: 0,
  workIn: 0,
  scripted: true
}));

const L6_CONTEXTS: ContextSeed[] = [
  {
    kind: "main",
    id: "main-l6-monday",
    sessionId: "session-l6-monday",
    cacheNamespace: "cache-l6-monday",
    initialPrefixStackId: "prefix-l6-monday"
  },
  {
    kind: "main",
    id: "main-l6-tuesday",
    sessionId: "session-l6-tuesday",
    cacheNamespace: "cache-l6-tuesday",
    initialPrefixStackId: "prefix-l6-tuesday"
  }
];

const L6_PREFIX_STACKS: PrefixStackSeed[] = [
  {
    id: "prefix-l6-monday",
    contextId: "main-l6-monday",
    blocks: [{
      id: "pb-l6-monday",
      kind: "instructions",
      label: "Workday prefix",
      tokenCount: 26_237,
      identityHash: "l6-prefix-c10-v1",
      order: 0,
      cacheable: true,
      breakpointAfter: true,
      stability: "stable"
    }]
  },
  {
    id: "prefix-l6-tuesday",
    contextId: "main-l6-tuesday",
    blocks: [{
      id: "pb-l6-tuesday",
      kind: "instructions",
      label: "Workday prefix",
      tokenCount: 26_237,
      identityHash: "l6-prefix-c10-v1",
      order: 0,
      cacheable: true,
      breakpointAfter: true,
      stability: "stable"
    }]
  }
];

const L6_GAPS: GapSeed[] = [
  { id: "r1-g1", contextId: "main-l6-monday", startMin: 0,  durationMin: 2,  permitsKeepWarm: false },
  { id: "r1-g2", contextId: "main-l6-monday", startMin: 2,  durationMin: 2,  permitsKeepWarm: false },
  { id: "r1-g3", contextId: "main-l6-monday", startMin: 4,  durationMin: 2,  permitsKeepWarm: false },
  { id: "r2-g1", contextId: "main-l6-tuesday", startMin: 30, durationMin: 30, permitsKeepWarm: false },
  { id: "r2-g2", contextId: "main-l6-tuesday", startMin: 60, durationMin: 30, permitsKeepWarm: false },
  { id: "r2-g3", contextId: "main-l6-tuesday", startMin: 90, durationMin: 30, permitsKeepWarm: false }
];

const L6_FIXTURES: ScenarioFixtureDef[] = [
  {
    id: "l6-seed",
    label: "Deterministic level seed",
    semanticRole: "Seed selecting the authored Monday and Tuesday workday scenario",
    value: 60065,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l6-attempt-budget",
    label: "Level attempt budget",
    semanticRole: "Initial budget and wallet available for the two workday runs",
    value: 0.60,
    unit: "usd",
    tag: "[FICTION]"
  },
  {
    id: "l6-clock-cap",
    label: "Level clock cap",
    semanticRole: "Maximum simulated minute reached by the authored workday sequence",
    value: 120,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l6-monday-gap-duration",
    label: "Monday inter-block gap",
    semanticRole: "Idle duration between consecutive clustered Monday requests",
    value: 2,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l6-tuesday-gap-duration",
    label: "Tuesday inter-block gap",
    semanticRole: "Idle duration between consecutive spaced Tuesday requests",
    value: 30,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l6-day-separation",
    label: "Monday-to-Tuesday separation",
    semanticRole: "Simulation-time advance between the completed Monday run and Tuesday checkpoint",
    value: 24,
    unit: "min",
    tag: "[FICTION]"
  },
  {
    id: "l6-work-block-count",
    label: "Scripted work block count",
    semanticRole: "Total number of priced work-block requests across both days",
    value: 8,
    unit: "count",
    tag: "[FICTION]"
  },
  {
    id: "l6-scripted-unit-duration",
    label: "Scripted unit duration",
    semanticRole: "Unit-hours assigned to each request seed because time advances through explicit gaps",
    value: 0,
    unit: "min",
    tag: "[FICTION]"
  }
];

const L6_SCENARIO: ScenarioData = {
  units: L6_UNITS,
  contexts: L6_CONTEXTS,
  prefixStacks: L6_PREFIX_STACKS,
  gaps: L6_GAPS,
  allowedCfg: { oneHourFlag: [false, true] },
  fixtures: L6_FIXTURES,
  estimates: [
    {
      label: "Monday system-copy reveal time in seconds",
      value: 0.3,
      tag: "[ESTIMATE]"
    },
    {
      label: "Monday accessible-evidence reveal time in seconds",
      value: 0.6,
      tag: "[ESTIMATE]"
    },
    {
      label: "Monday tier-control reveal time in seconds",
      value: 0.8,
      tag: "[ESTIMATE]"
    },
    {
      label: "First interactive tier control time",
      value: 1,
      tag: "[ESTIMATE]"
    }
  ]
};

const MONDAY_ONLY_PATCH: Partial<ScenarioData> = {
  units: L6_UNITS.filter(unit => unit.id.startsWith("r1-")),
  contexts: L6_CONTEXTS.filter(context => context.id === "main-l6-monday"),
  prefixStacks: L6_PREFIX_STACKS.filter(stack => stack.id === "prefix-l6-monday"),
  gaps: L6_GAPS.filter(gap => gap.id.startsWith("r1-")),
  fixtures: L6_FIXTURES
};

const TUESDAY_ONLY_PATCH: Partial<ScenarioData> = {
  units: L6_UNITS.filter(unit => unit.id.startsWith("r2-")),
  contexts: L6_CONTEXTS.filter(context => context.id === "main-l6-tuesday"),
  prefixStacks: L6_PREFIX_STACKS.filter(stack => stack.id === "prefix-l6-tuesday"),
  gaps: L6_GAPS.filter(gap => gap.id.startsWith("r2-")),
  fixtures: L6_FIXTURES
};

const L6_COMMON_CFG: Partial<Config> = {
  orchestratorModel: "sonnet",
  planModel: "sonnet",
  devModel: "sonnet",
  who: "inline",
  prompts: "identical",
  keepWarm: false
};

const L6: LevelDef = {
  id: "06-buy-more-time",
  tier: 1,
  title: "Buy More Time?",
  objective:
    "Choose a write for each workday. Exact gaps stay covered until you commit.",
  concept: {
    id: "ttl-tier-tradeoff",
    privateDesignerSummary:
      "Compare the 5-minute and 1-hour write tiers against inferable workday rhythms.",
    postRevealRule:
      "Pay for longer life only when the schedule prevents enough rewrites.",
    solutionVocabulary: [
      "5-minute write tier",
      "1-hour write tier",
      "longer TTL",
      "TTL premium",
      "rebuild break-even"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: ["write-vs-read", "cache-expiry"],

  unlocks: "oneHourFlag",
  introducedControls: ["oneHourFlag"],
  cfgLocked: [
    "orchestratorModel", "planModel", "devModel", "who", "prompts",
    "width", "keepWarm", "keepWarmMin", "hook", "skills",
    "skillsMode", "memoryFiles", "mcp"
  ],

  scope: "session",
  seed: 60065,
  budgetUsd: 0.60,
  clockCapMin: 120,
  cfgOverride: { ...L6_COMMON_CFG, oneHourFlag: false },
  scenario: "gaps",
  scenarioData: L6_SCENARIO,

  coldOpen: L6_COLD_OPEN,
  sequence: L6_SEQUENCE,
  predictions: [PRED_MONDAY, PRED_TUESDAY],
  toasts: L6_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: {
    bucket: "flagDeltaUsd",
    cite: "C1, C3, C10",
    line:
      "A short tier is costly when an inferable idle gap expires it before the next request."
  },
  failureRules: [FAIL_TUESDAY_EXPIRY],
  checkpoints: [
    {
      id: "cp-monday",
      createBeforeEventId: "ev-select-monday-tier",
      reason: "decision",
      resumeLabel: "Choose Monday again"
    },
    {
      id: "cp-tuesday",
      createBeforeEventId: "ev-select-tuesday-tier",
      reason: "decision",
      resumeLabel: "Choose Tuesday again"
    }
  ],

  gate: {
    predicateId: "l6-post-evidence-tuesday-tier",
    evidenceRevealEventIds: ["ev-monday-result"],
    postEvidenceActionRequirements: [{
      id: "l6-selected-hour-after-monday",
      kind: "action-observed",
      actionType: "SELECT_WRITE_TIER",
      afterEventId: "ev-monday-result",
      match: { blockId: "tuesday", tier: "1h" }
    }],
    behavioralRequirements: [
      {
        id: "l6-transfer-marker-recorded",
        kind: "includes",
        path: "completedTransferIds",
        value: "l6-tuesday-1h-after-monday"
      },
      {
        id: "l6-tuesday-completed",
        kind: "event-completed",
        eventId: "ev-tuesday-result"
      }
    ],
    transferRequirement: {
      id: "l6-transfer-marker",
      kind: "includes",
      path: "completedTransferIds",
      value: "l6-tuesday-1h-after-monday"
    }
  },

  pass(st) {
    const appliedTuesdayTransfer =
      st.completedTransferIds.includes("l6-tuesday-1h-after-monday");
    const completedTuesday =
      st.completedEventIds.includes("ev-tuesday-result");

    return {
      pass:
        appliedTuesdayTransfer &&
        completedTuesday &&
        st.frozenFailure === null,
      reason:
        "Applied Monday's evidence by selecting the 1-hour tier for Tuesday's spaced work.",
      evidence: [
        "ev-monday-result",
        "ev-select-tuesday-tier",
        "ev-tuesday-result"
      ]
    };
  },

  star2: {
    label: "Named the tradeoff",
    predicate: {
      id: "l6-acknowledged-cause",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "monday-premium-no-rebuild"
    },
    reason:
      "Acknowledged that Monday's longer lifetime prevented no rebuild."
  },
  star3: {
    label: "No wasted premium",
    predicate: {
      id: "l6-reference-spend",
      kind: "compare",
      path: "wallet",
      op: "gte",
      value: 0.29696265
    },
    reason:
      "Completed both days at or below the $0.30303735 reference spend."
  },

  referenceCfg: { ...L6_COMMON_CFG, oneHourFlag: false },
  antiCfg: { ...L6_COMMON_CFG, oneHourFlag: true },

  counterfactuals: [
    {
      id: "cf-monday-reference",
      unlockAfterEventId: "ev-monday-result",
      kind: "reference",
      cfg: { ...L6_COMMON_CFG, oneHourFlag: false },
      scenarioPatch: MONDAY_ONLY_PATCH,
      comparisonQuestion: "What did the longer write buy on Monday?",
      revealCopy:
        "The 5-minute tier cost $0.12200205; the 1-hour tier cost $0.18103530 and prevented no rebuild."
    },
    {
      id: "cf-monday-anti",
      unlockAfterEventId: "ev-monday-result",
      kind: "anti-pattern",
      cfg: { ...L6_COMMON_CFG, oneHourFlag: true },
      scenarioPatch: MONDAY_ONLY_PATCH,
      comparisonQuestion: "How large was Monday's unused premium?",
      revealCopy:
        "The unused 1-hour premium was $0.05903325."
    },
    {
      id: "cf-tuesday-reference",
      unlockAfterEventId: "ev-complete-attempt",
      kind: "reference",
      cfg: { ...L6_COMMON_CFG, oneHourFlag: true },
      scenarioPatch: TUESDAY_ONLY_PATCH,
      comparisonQuestion: "What did the longer entry do at Tuesday's gaps?",
      revealCopy:
        "The 1-hour route read after each gap and cost $0.18103530."
    },
    {
      id: "cf-tuesday-anti",
      unlockAfterEventId: "ev-complete-attempt",
      kind: "anti-pattern",
      cfg: { ...L6_COMMON_CFG, oneHourFlag: false },
      scenarioPatch: TUESDAY_ONLY_PATCH,
      comparisonQuestion: "What would repeated expiry cost across Tuesday?",
      revealCopy:
        "Four 5-minute writes cost $0.39355500; the 1-hour route cost $0.18103530."
    }
  ],

  tape: L6_TAPE,
  result: L6_RESULT,
  vocabulary: L6_VOCABULARY,
  qa: L6_QA
};
```

The four explicit `cfg + scenarioPatch` pairs are authoritative:

| Run | Scenario patch | Tier |
|---|---|---|
| Reference Monday | `MONDAY_ONLY_PATCH` | `5m` |
| Reference Tuesday | `TUESDAY_ONLY_PATCH` | `1h` |
| Anti-pattern Monday | `MONDAY_ONLY_PATCH` | `1h` |
| Anti-pattern Tuesday | `TUESDAY_ONLY_PATCH` | `5m` |

The aggregate reference and anti-pattern totals combine those exact deterministic day runs. No global configuration is used as a substitute for a per-day tier.

## 6. Pricing walkthrough

Model: Sonnet, `$3/M` base (`C3`). Cacheable prefix: `26,237` tokens (`C10`). Every L6 request has `outTok=0`; nevertheless, `UI_TAPE_RENDERER` uses its canonical output-inclusive visual-weight model, where any non-zero `outTok` would contribute at `5x` (`C1`). L6 does not redefine or bypass that geometry.

| Request class | Authoritative buckets | Equation | Exact USD |
|---|---|---:|---:|
| 5m cold write | `writeTok=26,237`, `outTok=0` | `26,237×1.25×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.09838875` |
| 1h cold write | `writeTok=26,237`, `outTok=0` | `26,237×2×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.15742200` |
| Warm read | `readTok=26,237`, `outTok=0` | `26,237×0.1×3/1,000,000` (`C1`, `C3`, `C10`) | `$0.00787110` |

The request-local failure comparison at `ev-tuesday-b2` uses the first and third rows only:

```text
actual expired 5m request = $0.09838875
valid live-read quote     = $0.00787110
request-local multiple    = 12.5×
```

The live-read quote is computed by `PRICE_REQUEST` and is never charged or appended to the ledger.

### Day totals

| Day and tier | Request sequence | Exact total |
|---|---|---:|
| Monday 5m | write5m, read, read, read | `$0.12200205` |
| Monday 1h | write1h, read, read, read | `$0.18103530` |
| Tuesday 5m | write5m, write5m, write5m, write5m | `$0.39355500` |
| Tuesday 1h | write1h, read, read, read | `$0.18103530` |

Derived economic evidence:

- Monday’s longer-tier premium is `$0.05903325` and avoids `0` rebuilds.
- Tuesday’s longer tier avoids `3` rebuilds and saves `$0.21251970`.
- Reference route, Monday 5m plus Tuesday 1h: **`$0.30303735`**.
- Anti-pattern route, Monday 1h plus Tuesday 5m: **`$0.57459030`**.
- Anti-pattern delta: **`$0.27155295`**.
- Reference wallet remaining: **`$0.29696265`**.
- One-hour premium per cold write: `$0.05903325`.
- One avoided 5m rebuild is worth `$0.09051765`.
- Premium divided by one avoided rebuild is `0.652173…` (`C21`), concealed until `ev-complete-attempt`.

The Tuesday 5m full-day total is an informational post-attempt projection. The frozen harmful branch dispatches no requests after `r2-b2`.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`; hover is enabled. Every tape row and segment is sourced from its authoritative `LedgerRow`.

Reference rows:

1. `r1-b1` — **MON · BLOCK 1** — red 5m `write`, `26,237`, `$0.09838875`.
2. `r1-b2` — **MON · BLOCK 2** — blue `read`, `26,237`, `$0.00787110`.
3. `r1-b3` — **MON · BLOCK 3** — blue `read`, `26,237`, `$0.00787110`.
4. `r1-b4` — **MON · BLOCK 4** — blue `read`, `26,237`, `$0.00787110`.
5. `r2-b1` — **TUE · BLOCK 1** — red 1h `write`, `26,237`, `$0.15742200`.
6. `r2-b2` — **TUE · BLOCK 2** — blue `read`, `26,237`, `$0.00787110`.
7. `r2-b3` — **TUE · BLOCK 3** — blue `read`, `26,237`, `$0.00787110`.
8. `r2-b4` — **TUE · BLOCK 4** — blue `read`, `26,237`, `$0.00787110`.

Failure frame substitution:

- Under Tuesday 5m, actual `r2-b2` is a red `write` row for `26,237` tokens and `$0.09838875`.
- The engine supplies a local uncharged `$0.00787110` live-read quote from the same request’s alternative buckets.
- The quote renders adjacent to `r2-b2`; it is not a tape row, ledger row, hidden request, or `UI_COUNTERFACTUAL_OVERLAY` result.
- No future Tuesday request is dispatched while frozen.

Reveal groups:

```ts
const L6_TAPE: TapeSpec = {
  rowSource: "ledger",
  labels: {
    "r1-b1": "MON · BLOCK 1",
    "r1-b2": "MON · BLOCK 2",
    "r1-b3": "MON · BLOCK 3",
    "r1-b4": "MON · BLOCK 4",
    "r2-b1": "TUE · BLOCK 1",
    "r2-b2": "TUE · BLOCK 2",
    "r2-b3": "TUE · BLOCK 3",
    "r2-b4": "TUE · BLOCK 4"
  },
  revealGroups: [
    {
      id: "monday-tape",
      requestIds: ["r1-b1", "r1-b2", "r1-b3", "r1-b4"],
      gatedByPredictionId: "pred-monday"
    },
    {
      id: "tuesday-first-gap",
      requestIds: ["r2-b1", "r2-b2"],
      gatedByPredictionId: "pred-tuesday"
    },
    {
      id: "tuesday-rest",
      requestIds: ["r2-b3", "r2-b4"]
    }
  ],
  ahaRequestId: "r2-b2",
  hoverEnabled: true
};
```

At `r2-b2`, the scan head stops with the `30 MIN` gap, TTL state, actual bucket, uncharged request-local alternative quote, and both exact costs visible. The `0.652173…` ratio is absent from this frame.

Every tape width and segment uses `UI_TAPE_RENDERER`’s canonical price-weighted geometry, including output cost. Here output contributes zero only because the authoritative requests have `outTok=0`.

## 8. Prediction prompts

### `pred-monday`

Question: **“From this tightly packed calendar silhouette, which write do you expect to cost less by block four?”**

Options:

- `five-minute`: **“5-minute write”**
- `one-hour`: **“1-hour write”**
- `same`: **“They’ll cost the same”**

The visible density makes the prediction inferable without exposing exact gaps or prices. Reveal remains blocked until `COMMIT_PREDICTION`. Correct option: `five-minute`.

Post-reveal sentence: **“All three gaps were two minutes, so both entries stayed live and the longer write bought no additional read.”**

### `pred-tuesday`

Question: **“These blocks are spread across a much wider calendar strip. Which write do you expect to cost less by block four?”**

Options:

- `five-minute`: **“5-minute write”**
- `one-hour`: **“1-hour write”**
- `same`: **“They’ll cost the same”**

Reveal remains blocked until `COMMIT_PREDICTION`. Correct option: `one-hour`.

Post-reveal sentence: **“Thirty-minute gaps expired the short entry, while every long-tier read refreshed its hour.”**

Neither selected option nor correctness appears in the gate, either star, the wallet mutation, failure predicate, or `pass(st)`.

## 9. Fail-state

Monday has no failure rule. Its fourth block is a decisive observation: after `r1-b4`, the screen proves that the longer tier avoided zero rebuilds and shows the complete 5m comparison. The player receives evidence and continues.

Tuesday has one failure rule:

```ts
const FAIL_TUESDAY_EXPIRY: FailureRuleDef = {
  id: "fail-tuesday-expiry",
  predicate: {
    id: "l6-r2-b2-rewrote",
    kind: "all",
    predicates: [
      {
        id: "l6-r2-b2-complete",
        kind: "event-completed",
        eventId: "ev-tuesday-b2"
      },
      {
        id: "l6-r2-b2-is-expired-write",
        kind: "compare",
        path: "lastRequests.0.writeTok",
        op: "eq",
        value: 26237
      },
      {
        id: "l6-r2-b2-is-not-read",
        kind: "compare",
        path: "lastRequests.0.readTok",
        op: "eq",
        value: 0
      }
    ]
  },
  decisiveEventId: "ev-tuesday-b2",
  causeCode: "SHORT_TTL_REBUILD",
  message:
    "Block 2 arrived 30 minutes later. The 5-minute entry expired, so 26,237 tokens rewrote for $0.09838875 instead of reading for $0.00787110.",
  checkpointId: "cp-tuesday",
  highlightObjectIds: [
    "r2-g1",
    "cache-l6-tuesday",
    "r2-b2",
    "quote-tuesday-live-read"
  ],
  actualUsd: 0.09838875,
  validAlternativeUsd: 0.00787110
};
```

Freeze order is strict and local to `ev-tuesday-b2`:

1. `SEND_REQUEST` resolves and appends actual `r2-b2`.
2. `PRICE_REQUEST` computes the uncharged live-read quote from the same request-local model, prefix, and output buckets.
3. The failure payload exposes the `$0.09838875` actual row and `$0.00787110` alternative quote.
4. `FREEZE_FAILURE` dispatches synchronously from `ev-tuesday-b2`, with no intervening reducer event.
5. No `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, future Tuesday request, or `COMPLETE_ATTEMPT` occurs on the frozen branch.
6. `REWIND_TO_CHECKPOINT { checkpointId: "cp-tuesday" }` restores the transfer decision.

The freeze never depends on prediction correctness. Rewind restores Tuesday’s tier and prediction controls while retaining Monday’s mastered evidence.

## 10. Gate & stars

Pass requires the reducer-visible post-evidence Tuesday transfer marker, not either pre-reveal prediction:

```ts
pass =
  completedTransferIds.includes("l6-tuesday-1h-after-monday") &&
  completedEventIds.includes("ev-tuesday-result") &&
  frozenFailure === null;
```

The marker is appended by the authored `SELECT_WRITE_TIER { blockId: "tuesday", tier: "1h" }` event after `ev-monday-result`. Budget and prediction correctness cannot pass or fail the level.

- **1 star — Applied the rhythm:** the pure `pass(st)` predicate is true.
- **2 stars — Named the tradeoff:** pass is true and `acknowledgedExplanationIds` includes `"monday-premium-no-rebuild"`.
- **3 stars — No wasted premium:** 2-star criteria are satisfied and final spend is at most `$0.30303735`, implemented as scalar `wallet >= $0.29696265`, never floating-point equality.

A player may predict incorrectly twice and still earn all three stars by responding correctly to the revealed evidence.

The live counter-pressure is economic and reducer-visible: Monday’s 5m route preserves `$0.05903325` toward the spend star, while Tuesday’s 1h route prevents three rewrites, saves `$0.21251970`, records the required transfer marker, and completes the behavioral gate. Both tiers therefore confer a consequential benefit in the schedule where their lifetime fits.

## 11. Toasts

| ID | Trigger | Exact copy |
|---|---|---|
| `toast-tier-choice` | First `SELECT_WRITE_TIER` | **“You’re choosing how long this write can wait for its next read.”** |
| `toast-monday-live` | `ev-monday-b2` resolves as a read | **“Still alive. The read refreshes the idle timer.”** |
| `toast-monday-premium` | `ev-monday-result` shows the 1h comparison | **“Longer lifetime bought; zero rebuilds avoided.”** |
| `toast-tuesday-expired` | Actual `ev-tuesday-b2` rewrites under 5m | **“Expired before block 2. The prefix writes again.”** |
| `toast-tuesday-refresh` | Actual `ev-tuesday-b2` reads under 1h | **“Read at 30 minutes. The hour refreshes.”** |
| `toast-counterfactual` | `ev-complete-attempt` | **“The hour premium is about 0.65 of one avoided rebuild.”** |

All teaching toasts dedupe per attempt. The Tuesday cause toast remains visible while frozen. The ratio toast cannot fire before both successful day results exist.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. The first tier control is interactive by `1.0s` `[ESTIMATE]`; no instruction card blocks it.
2. Monday’s visible calendar density and equivalent accessibility text appear before `pred-monday`.
3. Tuesday’s visibly wider density and equivalent accessibility text appear before `pred-tuesday`.
4. Pre-commit DOM, canvas labels, tooltips, and accessibility text contain no exact gap value, price, total, rebuild count, correctness label, or break-even ratio.
5. Generic calendar scale and relative silhouette width are visible evidence, not hidden answer metadata.
6. Monday and Tuesday execution remain disabled until their respective predictions commit.
7. A wrong prediction changes no score, star, wallet, failure, gate, transfer marker, or `pass(st)` result.
8. Prediction commitment and correctness are absent from all gate, star, failure, and `pass(st)` predicates.
9. `ENTER_LEVEL` uses `"06-buy-more-time"`; no `"L6"` identifier appears in persisted level data.
10. `concept.id` is `"ttl-tier-tradeoff"`, prerequisites are exactly `["write-vs-read", "cache-expiry"]`, `solutionVocabulary` is present, and `conceptScope` is `{ kind: "single", reusedConceptIds: [] }`.
11. Title and objective contain no registered solution-vocabulary phrase.
12. Monday resolves `2m,2m,2m`; Tuesday resolves `30m,30m,30m` from seed `60065`.
13. Each `SELECT_WRITE_TIER` applies to its named day only and locks for that branch.
14. Selecting Tuesday `1h` after `ev-monday-result` appends `"l6-tuesday-1h-after-monday"` to `completedTransferIds`; rewinding to `cp-tuesday` removes branch-local mutations.
15. The four `cfg + scenarioPatch` counterfactual pairs produce the declared per-day tiers.
16. Every `SEND_REQUEST` yields exactly one `LedgerRow` and one `UI_TAPE_RENDERER` row.
17. A reference completion yields exactly eight request rows.
18. Selection, prediction, checkpoint, advance, context discard, quote computation, freeze, rewind, explanation, transfer, counterfactual, and completion actions create no ledger row.
19. Every request price is positive and equals `PRICE_REQUEST`.
20. Exact row prices are `$0.09838875`, `$0.15742200`, or `$0.00787110`.
21. No positive price renders as `$0.0000`.
22. A 5m entry is live after `2m` and expired after `30m`; a 1h entry is live after `30m` (`C1`).
23. Every successful read refreshes `lastTouchMin` and expiry (`C12`).
24. Monday totals are `$0.12200205` for 5m and `$0.18103530` for 1h.
25. Tuesday totals are `$0.39355500` for 5m and `$0.18103530` for 1h.
26. Reference total is `$0.30303735`; anti-pattern total is `$0.57459030`; no competing total exists.
27. Monday never dispatches `FREEZE_FAILURE`.
28. Monday’s comparison cannot render until `r1-b4` proves zero rebuilds were avoided.
29. Tuesday 5m freezes from `ev-tuesday-b2` immediately after actual `r2-b2` is priced.
30. The frozen frame shows one actual `$0.09838875` ledger row and one uncharged `$0.00787110` local quote; the quote is not a request, ledger row, tape row, or counterfactual.
31. No `REQUEST_COUNTERFACTUAL` or `REVEAL_COUNTERFACTUAL` occurs before the Tuesday freeze.
32. The failure rule satisfies `actualUsd > validAlternativeUsd`.
33. The failure predicate reads only real paths: `completedEventIds` through `event-completed`, `lastRequests.0.writeTok`, and `lastRequests.0.readTok`.
34. Tuesday’s failure frame shows the `12.5×` decisive request-cost multiple without exposing future exact gaps or the final ratio.
35. No `r2-b3`, `r2-b4`, or `COMPLETE_ATTEMPT` action dispatches on the frozen branch.
36. Rewind returns byte-identically to `cp-tuesday`, retains Monday’s evidence, and does not replay the cold-open.
37. The declarative gate observes `SELECT_WRITE_TIER { blockId: "tuesday", tier: "1h" }` after `ev-monday-result`.
38. Pure `pass(st)` reads only `completedTransferIds`, `completedEventIds`, and `frozenFailure`.
39. Reference actions pass from seed `60065`; the Tuesday 5m action reaches the intended causal freeze and fails the behavioral gate.
40. The `0.652173…` ratio is absent from pre-play copy, hidden DOM, hover text, accessibility text, prediction options, and the Tuesday failure frame.
41. The ratio appears only after `COMPLETE_ATTEMPT`.
42. Tuesday reference and anti-pattern counterfactuals unlock and reveal only after `ev-complete-attempt`.
43. Every tape row uses the canonical `UI_TAPE_RENDERER` visual-weight model.
44. `outTok=0` is preserved in every L6 ledger row; a regression fixture with non-zero output confirms output contributes at `5x` to bar and segment geometry (`C1`).
45. Final tape colors, segment geometry, and exact prices render without hover.
46. `UI_HOVER_PRICE_CALCULATOR` reconciles every visible tape row with its authoritative ledger buckets.
47. Pointer and keyboard paths dispatch equivalent action sequences.
48. Reduced-motion mode exposes identical rows, local failure quote, comparison evidence, totals, and gate evidence.
49. `UI_RESULT_SCREEN` explains each earned or missed star and offers **“Try the days again”** and **“Continue.”**
50. `scenarioData.fixtures` contains every gameplay `[FICTION]` value with `id`, `semanticRole`, `unit`, and `[FICTION]`; `scenarioData.estimates` contains only the presentation-only first-interaction timing.
51. Every authoritative quantity has one implementable value.
52. The core choice has real reducer-visible counter-pressure: 5m is cheaper for the clustered day, while 1h is cheaper and gate-completing for the spaced day.
53. Monday’s 1h route completes without a punitive freeze, and Tuesday’s 5m failure branch is reachable and rewindable.
54. The level is winnable without undocumented controls.

## 13. Reference-bar justification

The screen opens on one tactile control and supplies just enough calendar geometry to support a reasoned prediction without exposing exact gaps or prices. Monday lets either tier complete and then reveals the real cost of unused lifetime. Its evidence feeds a genuinely new Tuesday transfer choice, where the opposite tier wins. The two-tier mechanic is not a dial-to-maximum: the short tier protects spend on the clustered schedule, while the long tier prevents three rewrites and completes the gate on the spaced schedule.

Tuesday freezes at the first decisive divergence. The harmful `r2-b2` request itself supplies the actual `$0.09838875` row; the engine computes the `$0.00787110` alternative from the same request-local buckets without creating a request or counterfactual. `FREEZE_FAILURE` dispatches from that event before any downstream request. This preserves one ledger row per request and keeps the punishment local.

The gate observes the post-Monday `SELECT_WRITE_TIER` and verifies its reducer-visible transfer marker through pure state. Only after successful completion do Tuesday’s full counterfactual and numerical `C21` rule appear. The discovery rhythm is therefore silhouette → choice → prediction → reveal → observed comparison → transfer → decisive local freeze or success → post-attempt rule.
