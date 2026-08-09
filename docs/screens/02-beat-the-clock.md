# Level 2 — One More Check

## 1. Identity

- `id`: `"02-beat-the-clock"`
- `title`: **One More Check**
- `tier`: `1`
- `objective`: **“Fit Bob’s next two checks around the interruptions.”**
- ONE concept: an idle `CacheEntry` eventually expires, causing the next byte-identical `Request` to write its prefix again.
- `concept.id`: `"cache-expiry"`
- `concept.privateDesignerSummary`: “Idle TTL determines whether an identical request reads or rewrites.”
- `concept.postRevealRule`: **“Saved context expires after 60 idle minutes. After that, the next identical request writes it again.”**
- `concept.solutionVocabulary`: `["cache", "cached", "expiry", "expire", "expired", "TTL", "idle lifetime", "60 minutes", "read", "rewrite"]`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["write-vs-read"]`
- New control: `"advanceTime"`
- Vocabulary first needed during play: **TTL**, introduced only after the opening request creates a `CacheEntry`.

The first interruption is a reducer-owned time-versus-cost tradeoff:

- Coffee advances `clockMin` by `20 min` `[FICTION]` and preserves Bob’s focus window, but leaves `u2-blocker-standup` ready and unresolved. The downstream release check remains blocked until that unit runs.
- Standup runs the free `u2-blocker-standup` unit for `1.5 h = 90 min` `[FICTION]`, changing its `UnitInstance.status` from `"ready"` to `"done"` and clearing the downstream blocker immediately, but consuming the longer idle gap.

Thus Coffee is not a strictly dominant answer: it produces the cheaper immediate request while carrying a real unresolved unit forward. Standup provides real schedule progress before its request cost is revealed. Neither card exposes the cache result before the player acts.

## 2. Objects used

- `Request`
- `PricedRequest`
- `CacheEntry`
- `MAIN_SESSION_CONTEXT`
- `PREFIX_STACK`
- `Clock`
- `Wallet`
- `Budget`
- `UnitInstance`
- `AttemptMetrics`
- `AttemptResult`
- `LedgerRow`
- `WireSegment`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `ReducerState`
- `StatePredicate`
- `UI_TAPE_RENDERER`
- `UI_TTL_DRAIN_BAR`
- `UI_MAIN_CACHE_PANEL`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_TOAST_SYSTEM`
- `UI_PREDICTION_PROMPT`
- `UI_REWIND_CONTROL`
- `UI_COUNTERFACTUAL_OVERLAY`
- `UI_RESULT_SCREEN`
- `"predict-before-reveal"`
- `"fail-freeze-rewind"`
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

No Learn screen, comparison, TTL rule, answer key, or reference schedule appears before play.

| Time | Beat |
|---:|---|
| `0.0s` | Enter directly into the task desk. Header: **“ONE MORE CHECK”**. Task card: **“Bob’s login fix needs one more check.”** |
| `0.5s` | Wallet shows **$0.65** `[FICTION]`. Primary control appears under the pointer: **“Run check.”** |
| `≤2.0s` | Player can click **“Run check.”** This is the first interaction `[ESTIMATE]`. |
| click | A red row crosses `UI_TAPE_RENDERER`; `UI_MAIN_CACHE_PANEL` gains one live entry. |
| immediately after | `UI_TTL_DRAIN_BAR` appears at `60:00`, then `toast-ttl-intro` introduces TTL. |
| `+0.5s` | Copy changes to **“Bob needs the same check again. What happens before you send it?”** |
| same beat | Two equally weighted cards appear: **“Coffee · 20 min · blocker waits”** and **“Standup · 90 min · blocker clears.”** |

A compact blocker badge is bound to `u2-blocker-standup.status`:

- Coffee leaves it at **“Blocker open.”**
- Standup changes it to **“Blocker cleared.”**

The cards do not say “safe,” “expires,” “read,” “write,” red, blue, cheaper, correct, or which choice preserves the cache.

`coldOpen.maxInstructionCards = 0`; `coldOpen.firstInteractiveBySec = 2` `[ESTIMATE]`.

## 4. Exact event sequence

All requests use the same `MAIN_SESSION_CONTEXT`, byte-identical `PREFIX_STACK`, Sonnet, the `1h` write tier, and `MAIN_PREFIX_HEY = 34,738` cacheable tokens (`C34`). Each request has `freshInputTok=0` and `expectedOutputTok=0` `[FICTION]`. No content, model, namespace, or prefix ordering changes between requests.

1. **Enter level — `evt-enter`**
   - Event: route opens.
   - Action: `{ type: "ENTER_LEVEL", levelId: "02-beat-the-clock" }`
   - Mutates:
     - `clockMin=0`;
     - `budget=0.65`;
     - `wallet=0.65`;
     - `attemptMetrics.spentUsd=0`;
     - `attemptMetrics.requestCount=0`;
     - `u2-blocker-standup.status="ready"`;
     - ledger, tape, and cache are empty.
   - The level-start checkpoint is created by `ENTER_LEVEL`.

2. **Opening check — `evt-opening-write`**
   - Event: player clicks **“Run check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_1 }`
   - `RESOLVE_PREFIX`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `34,738 × $6/M = $0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - one `CacheEntry` with `createdAtMin=0`, `lastTouchMin=0`, `expiresAtMin=60`, `ttlMin=60`;
     - one `LedgerRow`;
     - one red write `WireSegment`;
     - `wallet: 0.6500000 → 0.4415720`;
     - `attemptMetrics.spentUsd: 0 → 0.2084280`;
     - `attemptMetrics.requestCount: 0 → 1`.
   - Fires `toast-first-write`, followed by `toast-ttl-intro`.
   - Then dispatches:
     `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-interruption", reason: "decision" }`.

3. **Choose an interruption — `evt-first-gap`**
   - Event: player chooses Coffee or Standup.
   - Coffee action:
     `{ type: "ADVANCE", min: 20 }`
   - Coffee mutations:
     - `clockMin: 0 → 20`;
     - displayed remaining TTL: `60 → 40`;
     - `u2-blocker-standup.status` remains `"ready"`;
     - blocker badge remains **“Blocker open.”**
   - Standup action:
     `{ type: "RUN_UNIT", unitId: "u2-blocker-standup" }`
   - Standup mutations:
     - `clockMin: 0 → 90`;
     - `u2-blocker-standup.status: "ready" → "done"`;
     - `attemptMetrics.completedUnitCount: 0 → 1`;
     - displayed remaining TTL reaches `0` at minute `60`;
     - blocker badge changes to **“Blocker cleared.”**
   - `u2-blocker-standup` is `free:true`, `workIn=0`, and `outTok=0`; running it creates no `Request`, `LedgerRow`, wallet deduction, or tape row.
   - The request control remains locked until `p2-next-color` is committed.

4. **Predict the second row — `evt-first-prediction`**
   - Event: the interruption animation settles.
   - Action: `{ type: "OPEN_PREDICTION", promptId: "p2-next-color" }`
   - The player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION`.
   - Mutates only `PredictionState`; prediction choice and correctness have no economic, failure, gate, score, or star effect.

5. **Coffee reveal — `evt-coffee-reveal`**
   - Preconditions:
     - Coffee was chosen;
     - `p2-next-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_COFFEE }`
   - `RESOLVE_PREFIX` at minute `20`: `readTok=34,738`, `inputTok=0`, `writeTok=0`, `outTok=0`, `cold=false`.
   - `PRICE_REQUEST`: `34,738 × $0.30/M = $0.0104214` (`C1`, `C3`, `C34`).
   - Mutates:
     - `CacheEntry.lastTouchMin: 0 → 20`;
     - `CacheEntry.expiresAtMin: 60 → 80` under the cache-touch rule (`C12`);
     - ledger/tape append one blue read row;
     - `wallet: 0.4415720 → 0.4311506`;
     - `attemptMetrics.spentUsd: 0.2084280 → 0.2188494`;
     - `attemptMetrics.requestCount: 1 → 2`.
   - `u2-blocker-standup.status` remains `"ready"`; the next release-stage check remains visibly blocked.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "blue-read" }`.
   - Fires `toast-coffee-read`.
   - This is the required short-gap evidence.

6. **Standup failure reveal — `evt-standup-failure-reveal`**
   - Preconditions:
     - Standup was chosen;
     - `p2-next-color` is committed.
   - `u2-blocker-standup.status` is already `"done"` and the blocker-clearing benefit remains visible.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2_STANDUP }`
   - `RESOLVE_PREFIX` at minute `90`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `34,738 × $6/M = $0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - replacement `CacheEntry` at minute `90`, expiring at minute `150`;
     - ledger/tape append one red write row;
     - `wallet: 0.4415720 → 0.2331440`;
     - `attemptMetrics.spentUsd: 0.2084280 → 0.4168560`;
     - `attemptMetrics.requestCount: 1 → 2`.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "red-write" }`.
   - The decisive actual-attempt frame shows:
     - the completed blocker unit;
     - actual expired rewrite: `$0.2084280`;
     - valid live-read alternative: `$0.0104214`;
     - visible economic difference: `$0.1980066`;
     - visible input-side ratio: `20×` (`C5`).
   - Only after that row and comparison are visible, dispatch:
     ```ts
     {
       type: "FREEZE_FAILURE",
       failure: {
         failureId: "f2-expired-rewrite",
         causeCode: "CACHE_EXPIRED_IDLE",
         message:
           "Same request, different timing: expiry turned a $0.0104 read into a $0.2084 write.",
         checkpointId: "cp-before-interruption"
       }
     }
     ```
   - This freeze occurs inside the player’s actual economic action, never in a reference or counterfactual reveal.

7. **Local rewind — `evt-rewind-interruption`**
   - Event: player clicks **“Try the interruption again.”**
   - Action:
     `{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-before-interruption" }`
   - Deterministic replay restores:
     - `clockMin=0`;
     - the opening ledger/tape row;
     - the opening live cache entry expiring at minute `60`;
     - `wallet=0.4415720`;
     - `attemptMetrics.spentUsd=0.2084280`;
     - `attemptMetrics.requestCount=1`;
     - `attemptMetrics.completedUnitCount=0`;
     - `u2-blocker-standup.status="ready"`;
     - `frozenFailure=null`;
     - `clockFrozen=false`.
   - The reducer-owned `attempt` count is retained under the canonical rewind contract.
   - The cold-open and opening request do not replay.
   - The player now demonstrates Coffee → prediction → blue read.

8. **Clear the carried blocker — `evt-transfer-start`**
   - Preconditions:
     - `evt-coffee-reveal` completed;
     - `u2-blocker-standup.status="ready"`.
   - Event: task card says **“The release check is blocked. Bob’s standup runs long.”**
   - Actions:
     ```ts
     { type: "BEGIN_TRANSFER", challengeId: "l2-long-gap-transfer" }
     { type: "CREATE_CHECKPOINT", checkpointId: "cp-before-transfer", reason: "prediction" }
     { type: "RUN_UNIT", unitId: "u2-blocker-standup" }
     { type: "OPEN_PREDICTION", promptId: "p2-standup-color" }
     ```
   - Mutates:
     - `u2-blocker-standup.status: "ready" → "done"`;
     - `attemptMetrics.completedUnitCount: 0 → 1`;
     - `clockMin: 20 → 110`;
     - the refreshed entry, which expired at minute `80`, remains historical evidence.
   - Running the free standup creates no request, wallet deduction, ledger row, or tape row.
   - The downstream blocker is now cleared and **“Send identical check”** becomes eligible after prediction commitment.
   - The player selects and commits the prediction.
   - No request or price is revealed during the standup.

9. **Long-gap transfer reveal — `evt-transfer-reveal`**
   - Preconditions:
     - `u2-blocker-standup.status="done"`;
     - `p2-standup-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_3_STANDUP }`
   - `RESOLVE_PREFIX` at minute `110`: `readTok=0`, `inputTok=0`, `writeTok=34,738`, `outTok=0`, `cold=true`.
   - `PRICE_REQUEST`: `$0.2084280` (`C1`, `C3`, `C34`).
   - Mutates:
     - new `CacheEntry` at minute `110`, expiring at minute `170`;
     - ledger/tape append one red write row;
     - `wallet: 0.4311506 → 0.2227226`;
     - `attemptMetrics.spentUsd: 0.2188494 → 0.4272774`;
     - `attemptMetrics.requestCount: 2 → 3`.
   - Then dispatches:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-standup-color", correctOptionId: "red-write" }`.
   - Fires `toast-expiry-cause`.
   - A wrong prediction is revealed neutrally and remains non-punitive.
   - The post-reveal rule remains withheld pending the explanation choice.

10. **Post-evidence explanation — `evt-explain-expiry`**
    - Preconditions: both `evt-coffee-reveal` and `evt-transfer-reveal` are visible.
    - Event: player answers **“What changed the bill?”**
    - Each selected card dispatches:
      `{ type: "ACK_EXPLANATION", explanationId: <selected-id> }`
    - Options:
      - `expiry-idle-gap`: **“The saved entry sat idle past its lifetime.”**
      - `request-text-changed`: **“The request text changed.”**
      - `model-price-changed`: **“The model switched prices.”**
    - An incorrect explanation changes no wallet, cache, failure, prediction, completed event, or attempt metric and leaves the choices available.
    - Selecting `expiry-idle-gap` after `evt-transfer-reveal` satisfies the gate action and reveals `concept.postRevealRule`.
    - Fires `toast-transfer-rule`.

11. **Complete — `evt-complete`**
    - Preconditions:
      - the behavioral gate passes;
      - `expiry-idle-gap` was acknowledged after `evt-transfer-reveal`.
    - Action: `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates:
      - `attemptResult` receives the immutable snapshot of `attemptMetrics`;
      - gate result and stars are recorded;
      - result screen and campaign progress appear.
    - For the reference branch:
      - `attemptResult.outcome="passed"`;
      - `attemptResult.spentUsd=0.4272774`;
      - `attemptResult.requestCount=3`;
      - `attemptResult.completedUnitCount=1`.
    - Only now may `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` expose the authored reference and anti-pattern schedules.
    - Counterfactual processing cannot mutate the actual wallet, ledger, `attemptResult`, `clockFrozen`, or `frozenFailure`, and cannot dispatch `FREEZE_FAILURE`.

## 5. Level data

```ts
const L2_LOCKED_CFG = {
  orchestratorModel: "sonnet",
  who: "inline",
  prompts: "identical",
  oneHourFlag: true,
  keepWarm: false
} satisfies Partial<Config>;

const L2_MAIN_PREFIX_BLOCKS: PrefixBlock[] = [
  {
    id: "l2-system",
    kind: "system",
    label: "System",
    tokenCount: 2750,
    identityHash: "l2-system-v1",
    order: 0,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable"
  },
  {
    id: "l2-tools",
    kind: "tools",
    label: "Tools",
    tokenCount: 16295,
    identityHash: "l2-tools-v1",
    order: 1,
    cacheable: true,
    breakpointAfter: false,
    stability: "stable"
  },
  {
    id: "l2-history",
    kind: "history",
    label: "Messages",
    tokenCount: 15693,
    identityHash: "l2-messages-v1",
    order: 2,
    cacheable: true,
    breakpointAfter: true,
    stability: "session"
  },
  {
    id: "l2-current",
    kind: "current",
    label: "Current check",
    tokenCount: 0,
    identityHash: "l2-current-v1",
    order: 3,
    cacheable: false,
    breakpointAfter: false,
    stability: "volatile"
  }
];
// 2,750 + 16,295 + 15,693 = 34,738 tokens (C6, C24, C34).

const L2_SCENARIO_DATA = {
  units: [
    {
      id: "u2-blocker-standup",
      kind: "STANDUP",
      ticket: 1,
      deps: [],
      hours: 1.5,
      outTok: 0,
      workIn: 0,
      free: true,
      scripted: true,
      label: "Clear Bob’s blocker"
    }
  ],
  contexts: [
    {
      kind: "main",
      id: "ctx-main-l2",
      sessionId: "session-l2",
      cacheNamespace: "cache-l2",
      initialPrefixStackId: "ps-main-l2"
    }
  ],
  prefixStacks: [
    {
      id: "ps-main-l2",
      contextId: "ctx-main-l2",
      blocks: L2_MAIN_PREFIX_BLOCKS
    }
  ],
  gaps: [
    {
      id: "g-coffee-first",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 20,
      permitsKeepWarm: false
    },
    {
      id: "g-standup-first",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 90,
      permitsKeepWarm: false
    },
    {
      id: "g-transfer-standup",
      contextId: "ctx-main-l2",
      startMin: 20,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ],
  fixtures: [
    {
      id: "l2-coffee-gap",
      label: "Coffee interruption",
      value: 20,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-blocker-standup",
      label: "Blocker-clearing standup",
      value: 90,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-zero-output",
      label: "Output tokens per authored check",
      value: 0,
      unit: "tok",
      tag: "[FICTION]"
    }
  ]
} satisfies ScenarioData;

const L2_FAIL_LESSON: FailLesson = {
  bucket: "idleRebuildUsd",
  cite: "C5",
  line:
    "A byte-identical request sent after the 1-hour entry expires rewrites the prefix at 20× its live-read input-side rate."
};

const L2_FAILURE_RULES: FailureRuleDef[] = [
  {
    id: "f2-expired-rewrite",
    predicate: {
      id: "l2-first-standup-produced-expired-write",
      kind: "all",
      predicates: [
        {
          id: "l2-standup-reveal-completed",
          kind: "event-completed",
          eventId: "evt-standup-failure-reveal"
        },
        {
          id: "l2-decisive-row-count",
          kind: "compare",
          path: "lastRequests.length",
          op: "eq",
          value: 1
        },
        {
          id: "l2-decisive-row-was-cold",
          kind: "compare",
          path: "lastRequests.0.cold",
          op: "eq",
          value: true
        },
        {
          id: "l2-decisive-row-rewrote-prefix",
          kind: "compare",
          path: "lastRequests.0.writeTok",
          op: "eq",
          value: 34738
        }
      ]
    },
    decisiveEventId: "evt-standup-failure-reveal",
    causeCode: "CACHE_EXPIRED_IDLE",
    message:
      "Same request, different timing: expiry turned a $0.0104 read into a $0.2084 write.",
    checkpointId: "cp-before-interruption",
    highlightObjectIds: [
      "UI_TTL_DRAIN_BAR",
      "UI_MAIN_CACHE_PANEL",
      "R2_2_STANDUP",
      "l2-wallet-delta",
      "l2-expiry-comparison"
    ],
    actualUsd: 0.2084280,
    validAlternativeUsd: 0.0104214
  }
];

const L2_CHECKPOINTS: CheckpointDef[] = [
  {
    id: "cp-before-interruption",
    createBeforeEventId: "evt-first-gap",
    reason: "decision",
    resumeLabel: "Try the interruption again"
  },
  {
    id: "cp-before-transfer",
    createBeforeEventId: "evt-transfer-start",
    reason: "prediction",
    resumeLabel: "Try the long interruption again"
  }
];

const LEVEL_02: LevelDef = {
  id: "02-beat-the-clock",
  tier: 1,
  title: "One More Check",
  objective: "Fit Bob’s next two checks around the interruptions.",
  concept: {
    id: "cache-expiry",
    privateDesignerSummary:
      "Idle TTL determines whether an identical request reads or rewrites.",
    postRevealRule:
      "Saved context expires after 60 idle minutes. After that, the next identical request writes it again.",
    solutionVocabulary: [
      "cache",
      "cached",
      "expiry",
      "expire",
      "expired",
      "TTL",
      "idle lifetime",
      "60 minutes",
      "read",
      "rewrite"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: ["write-vs-read"],

  unlocks: "run",
  introducedControls: ["advanceTime"],
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
  seed: 2002,
  budgetUsd: 0.65,
  clockCapMin: 180,
  cfgOverride: L2_LOCKED_CFG,
  scenario: "l1-onboarding",
  scenarioData: L2_SCENARIO_DATA,

  coldOpen: L2_COLD_OPEN,
  sequence: L2_SEQUENCE,
  predictions: L2_PREDICTIONS,
  toasts: L2_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  failLesson: L2_FAIL_LESSON,
  failureRules: L2_FAILURE_RULES,
  checkpoints: L2_CHECKPOINTS,

  gate: L2_GATE,
  pass: passLevel02,
  star2: L2_STAR_2,
  star3: L2_STAR_3,

  referenceCfg: L2_LOCKED_CFG,
  antiCfg: L2_LOCKED_CFG,
  counterfactuals: L2_COUNTERFACTUALS,

  tape: L2_TAPE,
  result: L2_RESULT,
  vocabulary: L2_VOCABULARY,
  qa: L2_QA
};
```

Level-specific values:

- `seed=2002` `[FICTION]`
- `budgetUsd=0.65` `[FICTION]`
- `clockCapMin=180` `[FICTION]`, allowing the off-screen anti-pattern to finish
- Coffee gap `20 min` `[FICTION]`
- Blocker-clearing Standup `90 min` `[FICTION]`
- `freshInputTok=0` and `expectedOutputTok=0` per request `[FICTION]`
- Cold-open and animation timings `[ESTIMATE]`

The Standup fixture is a real `UnitSeed`, not view-local narrative state. Its runtime `UnitInstance.status` is reducer-owned, and `RUN_UNIT` produces the modeled blocker-clearing benefit without fabricating a model request.

`referenceCfg` and `antiCfg` are intentionally identical because configuration is not the causal variable. Their exact scenario ordering is authoritative in these counterfactual patches:

```ts
const REFERENCE_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-ref-coffee",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 20,
      permitsKeepWarm: false
    },
    {
      id: "g-ref-standup",
      contextId: "ctx-main-l2",
      startMin: 20,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Requests resolve at minutes 0, 20, and 110.

const ANTI_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-anti-standup",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 90,
      permitsKeepWarm: false
    },
    {
      id: "g-anti-release-review",
      contextId: "ctx-main-l2",
      startMin: 90,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Requests resolve at minutes 0, 90, and 180.
```

```ts
const L2_COUNTERFACTUALS: CounterfactualDef[] = [
  {
    id: "cf-l2-reference",
    unlockAfterEventId: "evt-complete",
    kind: "reference",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: REFERENCE_SCENARIO_PATCH,
    comparisonQuestion:
      "What changed when the short interruption came before the long one?",
    revealCopy:
      "One live read replaced one expired rewrite."
  },
  {
    id: "cf-l2-anti",
    unlockAfterEventId: "evt-complete",
    kind: "anti-pattern",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: ANTI_SCENARIO_PATCH,
    comparisonQuestion:
      "What did two long idle gaps do to the identical prefix?",
    revealCopy:
      "Both follow-ups arrived after expiry and rewrote the prefix."
  }
];
```

## 6. Pricing walkthrough

Sonnet prices a 1-hour cache write at `$6/M`, a cache read at `$0.30/M`, and output at `$15/M` (`C1`, `C3`). The complete repeated prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`).

This is the only authoritative price table for the level:

| Request outcome | Resolution minute | `readTok` | `inputTok` | `writeTok` | `outTok` | Calculation | Cost |
|---|---:|---:|---:|---:|---:|---|---:|
| `R2_1` opening write | `0` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |
| `R2_2_COFFEE` live read | `20` | `34,738` | `0` | `0` | `0` | `34,738 × $0.30 / 1,000,000` | `$0.0104214` |
| `R2_2_STANDUP` or `R2_3_STANDUP` expired write | `90` or `110` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |

Three-star reference total:

```text
$0.2084280 + $0.0104214 + $0.2084280 = $0.4272774
```

Anti-pattern total at minutes `0`, `90`, and `180`:

```text
3 × $0.2084280 = $0.6252840
```

Avoidable anti-pattern delta:

```text
$0.6252840 - $0.4272774 = $0.1980066
```

The anti-pattern costs approximately `46.3%` more than the reference, and an individual expired 1-hour rewrite costs `20×` its live read (`C5`). Exact values remain unrounded in reducer state; display values may be `$0.2084`, `$0.0104`, `$0.4273`, and `$0.6253`.

The free Standup unit changes schedule and dependency state but creates no request, so it has no price and no ledger/tape row.

Although this scenario intentionally has `outTok=0`, `UI_TAPE_RENDERER` still uses the canonical cost-share geometry for every row: output would contribute at Sonnet’s `$15/M` rate (`5×`, `C1`, `C3`). Hiding an output label never removes output’s visual weight.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`. Rows appear only after their request resolves.

Reference branch:

1. `R2_1` — red write segment, `34,738 tok`, `$0.2084280`.
2. `R2_2_COFFEE` — blue read segment, `34,738 tok`, `$0.0104214`; reveal gated by `p2-next-color`.
3. `R2_3_STANDUP` — red write segment, `34,738 tok`, `$0.2084280`; reveal gated by `p2-standup-color`.

Failure branch replaces row 2 with `R2_2_STANDUP`, a red `34,738`-token write costing `$0.2084280`. Rewind removes that branch row by deterministic replay before the reference branch continues.

Coffee and Standup passage creates no row. The blocker badge may change during either interruption, but it never occupies tape space.

`ahaRequestId = "R2_3_STANDUP"`.

Aha frame:

- Hold `UI_TTL_DRAIN_BAR` at `0:00`.
- Keep `R2_2_COFFEE` immediately above `R2_3_STANDUP`.
- Keep the cleared blocker badge visible so the schedule benefit is not erased from the comparison.
- Pulse the expired `CacheEntry`, the zero point on the TTL bar, and the new red row.
- After revelation, caption: **“The request stayed identical. The live cache did not.”**
- Do not add an unpriced expiry or Standup row.
- Segment geometry is `segment.usd / row.usd` across read, input, write, and output buckets. Because each authored request row has one non-zero bucket, its sole segment has `widthRatio=1`.

## 8. Prediction prompts

### `p2-next-color`

Question:

> **After this interruption, what color will the identical request be?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

The correct option is supplied only after commitment and request resolution:

- Coffee branch → `blue-read`
- Standup branch → `red-write`

### `p2-standup-color`

Question:

> **The request is still identical after the long standup. What reaches the wire?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

Correct option: `red-write`, withheld until commitment and `R2_3_STANDUP` resolution.

No prompt option includes the rule, the `60`-minute threshold, evaluative styling, or a dollar clue before commitment. Prediction correctness never affects gate passage, stars, score, wallet, failure, or rewind.

## 9. Fail-state

- Failure rule id: `f2-expired-rewrite`
- Decisive event: `evt-standup-failure-reveal`
- Actual-attempt predicate:
  - `evt-standup-failure-reveal` completed;
  - `lastRequests.length === 1`;
  - `lastRequests[0].cold === true`;
  - `lastRequests[0].writeTok === 34,738`.
- The predicate uses declared `ReducerState.lastRequests` and `LedgerRow` fields and legal `StatePredicate` kinds/ops.
- The predicate does not inspect prediction choice or correctness.
- `actualUsd`: `$0.2084280`
- `validAlternativeUsd`: `$0.0104214`
- Visible economic difference: `$0.1980066`, or `20×` for rewrite versus read (`C5`).
- Visible counter-pressure evidence: `u2-blocker-standup.status="done"` and **“Blocker cleared.”**
- Freeze highlights:
  - `UI_TTL_DRAIN_BAR` at `0:00`;
  - the expired opening `CacheEntry`;
  - the red `R2_2_STANDUP` row;
  - its `$0.2084` wallet deduction;
  - the completed blocker unit;
  - the post-reveal comparison chip **“Expired write $0.2084 · Live read $0.0104 · 20×.”**
- Exact causal message:

> **Same request, different timing: expiry turned a $0.0104 read into a $0.2084 write.**

- Rewind label: **“Try the interruption again”**
- Destination: `cp-before-interruption`
- Rewind preserves the mastered opening request.
- Economic actions remain blocked while frozen.
- Failure is triggered by the visible expensive request, never by budget alone.
- A wrong prediction never triggers or changes this failure.
- No `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, reference event, or anti-pattern event may dispatch this failure.

## 10. Gate & stars

The post-evidence explanation in `evt-explain-expiry` is the understanding check. Prediction commitment is required structurally to unlock each reveal, but prediction identity and correctness are absent from the gate, `pass(st)`, and star predicates.

Behavioral pass predicate:

```text
pass iff
  R2_2_COFFEE exists in ledger with
    readTok = 34,738 and writeTok = 0 and cold = false
  AND R2_3_STANDUP exists later in ledger with
    readTok = 0 and writeTok = 34,738 and cold = true
  AND evt-coffee-reveal and evt-transfer-reveal completed
  AND, after evt-transfer-reveal,
    ACK_EXPLANATION was observed with explanationId = "expiry-idle-gap"
```

`L2_GATE`:

```ts
const L2_GATE: GateDef = {
  predicateId: "gate-l2-cache-expiry",
  evidenceRevealEventIds: [
    "evt-coffee-reveal",
    "evt-transfer-reveal"
  ],
  postEvidenceActionRequirements: [
    {
      id: "l2-post-evidence-explanation",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "evt-transfer-reveal",
      match: {
        explanationId: "expiry-idle-gap"
      }
    }
  ],
  behavioralRequirements: [
    {
      id: "l2-live-read-event-completed",
      kind: "event-completed",
      eventId: "evt-coffee-reveal"
    },
    {
      id: "l2-expired-write-event-completed",
      kind: "event-completed",
      eventId: "evt-transfer-reveal"
    }
  ],
  explanationRequirement: {
    id: "l2-explained-idle-expiry",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "expiry-idle-gap",
    observedAfterEventId: "evt-transfer-reveal"
  }
};
```

Pure, schema-valid pass evaluator:

```ts
function passLevel02(st: ReducerState): GateResult {
  const liveRead = st.ledger.find(
    row => row.requestId === "R2_2_COFFEE"
  );
  const expiredWrite = st.ledger.find(
    row => row.requestId === "R2_3_STANDUP"
  );

  const pass =
    liveRead?.readTok === 34738 &&
    liveRead.writeTok === 0 &&
    liveRead.cold === false &&
    expiredWrite?.readTok === 0 &&
    expiredWrite.writeTok === 34738 &&
    expiredWrite.cold === true &&
    st.completedEventIds.includes("evt-coffee-reveal") &&
    st.completedEventIds.includes("evt-transfer-reveal") &&
    st.acknowledgedExplanationIds.includes("expiry-idle-gap") &&
    st.frozenFailure === null;

  return {
    pass,
    reason: pass
      ? "Compared the live and expired rows and identified the idle gap as the cause."
      : "Compare the live and expired rows, then identify what changed the bill.",
    evidence: pass
      ? [
          "20-minute gap: 34,738 tokens read.",
          "90-minute gap: 34,738 tokens rewritten.",
          "Cause identified after both rows were visible: idle expiry."
        ]
      : []
  };
}
```

Canonical stars:

```ts
const L2_STAR_2: StarDef = {
  label: "Three-request schedule",
  predicate: {
    id: "l2-star2-three-requests",
    kind: "all",
    predicates: [
      {
        id: "l2-star2-live-read-visible",
        kind: "event-completed",
        eventId: "evt-coffee-reveal"
      },
      {
        id: "l2-star2-expired-write-visible",
        kind: "event-completed",
        eventId: "evt-transfer-reveal"
      },
      {
        id: "l2-star2-request-count",
        kind: "compare",
        path: "attemptMetrics.requestCount",
        op: "eq",
        value: 3
      }
    ]
  },
  reason:
    "Completed the demonstrated schedule with exactly the opening check and two follow-ups."
};

const L2_STAR_3: StarDef = {
  label: "Reference spend",
  predicate: {
    id: "l2-star3-reference-spend",
    kind: "all",
    predicates: [
      {
        id: "l2-star3-live-read-visible",
        kind: "event-completed",
        eventId: "evt-coffee-reveal"
      },
      {
        id: "l2-star3-expired-write-visible",
        kind: "event-completed",
        eventId: "evt-transfer-reveal"
      },
      {
        id: "l2-star3-explanation",
        kind: "includes",
        path: "acknowledgedExplanationIds",
        value: "expiry-idle-gap",
        observedAfterEventId: "evt-transfer-reveal"
      },
      {
        id: "l2-star3-request-count",
        kind: "compare",
        path: "attemptMetrics.requestCount",
        op: "eq",
        value: 3
      },
      {
        id: "l2-star3-spend",
        kind: "compare",
        path: "attemptMetrics.spentUsd",
        op: "lte",
        value: 0.4272774
      }
    ]
  },
  reason:
    "Matched the three-request reference total without adding another priced request."
};
```

Star summary:

- **1 star — Demonstrated expiry:** `passLevel02(st).pass === true`.
- **2 stars — Three-request schedule:** the pass evidence is present and `attemptMetrics.requestCount === 3`.
- **3 stars — Reference spend:** the 2-star behavior is present, the post-evidence cause is acknowledged, and `attemptMetrics.spentUsd <= 0.4272774`.

The cost predicate uses `lte`, not floating-point equality. It reads canonical `attemptMetrics.spentUsd`, not an invalid wallet object path. No predicate reads either prediction.

## 11. Toasts

| ID | Trigger | Priority | Exact copy |
|---|---|---|---|
| `toast-first-write` | `R2_1` appends | status | **“WRITE · 34,738 tokens · $0.2084”** |
| `toast-ttl-intro` | opening `CacheEntry` appears | teaching | **“Saved for now. TTL is the idle-time countdown.”** |
| `toast-blocker-waits` | Coffee resolves | status | **“Blocker still open · standup remains.”** |
| `toast-blocker-cleared` | `u2-blocker-standup.status` becomes `"done"` | status | **“Bob’s blocker is cleared.”** |
| `toast-coffee-read` | `R2_2_COFFEE` resolves | teaching | **“Still live. READ · 34,738 tokens · $0.0104”** |
| `toast-expired` | TTL first reaches zero | status | **“TTL · 0:00”** |
| `toast-expiry-cause` | `R2_3_STANDUP` resolves | cause | **“Expired while idle. WRITE again · $0.2084”** |
| `toast-transfer-rule` | `expiry-idle-gap` is acknowledged | teaching | **“Saved context expires after 60 idle minutes.”** |

Only one teaching toast is visible at once. The blocker toasts state the schedule consequence but do not predict cache behavior. `toast-expired` reports status only; it does not reveal the next request’s row or correct prediction.

## 12. QA gate

Real-browser click-through assertions:

1. The level opens with no Learn screen; **“Run check”** is clickable by `2s` `[ESTIMATE]`.
2. No pre-play copy states the cache lifetime, surviving interruption, next row color, or cheaper schedule.
3. `ENTER_LEVEL` uses `"02-beat-the-clock"`.
4. `concept.id` is `"cache-expiry"` and its only prerequisite is `"write-vs-read"`.
5. `conceptScope` is `{ kind:"single", reusedConceptIds:[] }`.
6. `interactionPatterns` contains only canonical kebab-case IDs.
7. The opening click creates exactly one `LedgerRow`, one tape row, and one live `CacheEntry`.
8. Opening price is exactly `$0.2084280` (`C1`, `C3`, `C34`).
9. Coffee dispatches exactly one `ADVANCE { min:20 }` and produces no request during time passage.
10. Coffee leaves `u2-blocker-standup.status="ready"` and visibly marks the downstream blocker unresolved.
11. Coffee leaves `40 min` on the original TTL; its read refreshes `lastTouchMin` to `20` and `expiresAtMin` to `80` (`C12`).
12. Coffee’s request costs exactly `$0.0104214` (`C1`, `C3`, `C34`).
13. Standup dispatches `RUN_UNIT { unitId:"u2-blocker-standup" }`, advances `clockMin` by `90`, completes the blocker unit, and creates no request or tape row.
14. The Standup path visibly clears the blocker before the expensive request is revealed, so Coffee is not strictly dominant.
15. Neither request reveal can execute before its applicable prediction is committed.
16. Wrong predictions change no wallet, score, star, failure, rewind, or gate result.
17. The post-Standup request resolves with `readTok=0`, `writeTok=34,738`, costs `$0.2084280`, and renders red.
18. Failure freezes only after the decisive actual-attempt red row, blocker-clearing benefit, and `$0.2084280` versus `$0.0104214` comparison are visible.
19. The failure rule satisfies `actualUsd > validAlternativeUsd` and exposes the `20×` difference (`C5`).
20. No counterfactual, reference, or anti-pattern request or reveal can dispatch `FREEZE_FAILURE`.
21. Rewind returns to `cp-before-interruption` without replaying or repricing `R2_1`.
22. Rewind restores `u2-blocker-standup.status="ready"`, `wallet=0.4415720`, `attemptMetrics.spentUsd=0.2084280`, and `attemptMetrics.requestCount=1`.
23. A complete reference click-through is winnable: opening → Coffee → predict → send → clear blocker in Standup → predict → send → choose `expiry-idle-gap` → complete.
24. The gate observes `ACK_EXPLANATION` after `evt-transfer-reveal`; it does not inspect prediction state.
25. An incorrect post-evidence explanation is retryable and changes no economics or attempt metrics.
26. `passLevel02` reads only declared `ReducerState`, `LedgerRow`, and array fields.
27. Every gate, star, and failure predicate uses a declared state path and only legal `StatePredicate` kinds and comparison ops.
28. Reference requests resolve at minutes `0`, `20`, and `110`; their total is `$0.4272774`.
29. Anti-pattern requests resolve at minutes `0`, `90`, and `180`; their total is `$0.6252840`.
30. `referenceCfg` and `antiCfg` are identical; their respective `scenarioPatch.gaps` arrays are the sole authored ordering difference.
31. Counterfactual configuration, schedule, totals, and labels remain hidden until `evt-complete`.
32. Counterfactual processing mutates no actual wallet, ledger, `attemptResult`, failure, or clock-freeze state.
33. Every real request has `usd > 0`; no positive amount renders as `$0.0000`.
34. Tape-row count equals ledger-row count at every action boundary.
35. Coffee, Standup, and expiry animations create no tape or ledger rows.
36. Every request’s input-side buckets total `34,738`; no token appears in both read and write buckets.
37. Every authored request has `outTok=0`, but tape geometry still includes the canonical output-cost bucket and Sonnet’s `$15/M` output rate (`C1`, `C3`).
38. Static final tape bars remain visible without hover.
39. `R2_1`, `R2_2_COFFEE`, `R2_2_STANDUP`, and `R2_3_STANDUP` use byte-identical prefix content; only `sentAtMin` and cache liveness differ.
40. Prediction options have no correctness styling before commitment.
41. Keyboard and pointer flows can choose interruptions, select and commit predictions, send requests, inspect prices, answer the explanation, and rewind.
42. Screen readers announce blocker status, the frozen causal message, and both compared prices.
43. Reduced-motion mode replaces drain and pulse animation with immediate state transitions while preserving action order and final evidence.
44. Restarting with seed `2002` reproduces byte-identical state, ledger, wallet, cache, unit status, checkpoints, attempt metrics, and tape.
45. `UI_RESULT_SCREEN` displays behavioral evidence and star reasons; budget alone never indicates mastery.
46. The document contains one authoritative pricing table and no superseded request total, threshold, or unreachable branch.
47. Both interruption cards expose a real tradeoff—immediate blocker progress versus elapsed idle time—without revealing the cache outcome.
48. The reference configuration passes; the anti-pattern fails the intended scheduling behavior.
49. `attemptResult.spentUsd` equals `budget - wallet` after completion.
50. `title` and `objective` contain none of `concept.solutionVocabulary`; the mandatory `identity-no-solution-vocabulary` assertion is:

```ts
{
  kind: "identity-no-solution-vocabulary",
  forbiddenTerms: [
    "cache",
    "cached",
    "expiry",
    "expire",
    "expired",
    "TTL",
    "idle lifetime",
    "60 minutes",
    "read",
    "rewrite"
  ],
  assertion: "title and objective contain no solution vocabulary"
}
```

## 13. Reference-bar justification

The screen opens on a tactile request rather than an explanation. Its first red write creates something visible to protect, and the two interruption cards turn an invisible idle-time mechanism into a moving object. The cards expose a genuine calendar tradeoff without naming the cache answer: Coffee preserves the immediate request but carries a reducer-owned blocker forward, while Standup completes that unit immediately but consumes the long interval. Their durations, blocker badge, and live bar provide enough evidence for prediction instead of forcing a coin flip.

Coffee produces the cheap blue read while visibly leaving work unresolved. The required later Standup clears that blocker and lets the same saved entry die, making the byte-identical request snap red. On the early-Standup branch, the completed blocker remains visible when the expensive row appears, so the level acknowledges the route’s genuine benefit even as it freezes on the avoidable request cost. The freeze occurs only after the actual `$0.2084` request can be compared with the `$0.0104` live-read alternative. Rewind returns directly to the consequential choice.

The final gate does not reward the pre-reveal guess. It inspects the actual ledger for one live read and one later expired write, then requires a post-evidence explanation action. Only after that action does the level state the rule and unlock the exact reference/anti-pattern schedules. Those comparisons remain informational and cannot retroactively punish the attempt.

Assumption/tradeoff: the level deliberately assigns `expectedOutputTok=0` `[FICTION]` to isolate TTL-driven read-versus-rewrite economics. The Standup is a free scripted `UnitInstance` whose `90 min` duration and blocker consequence are modeled in reducer state without inventing another priced request. `UI_TAPE_RENDERER` nevertheless retains canonical output-inclusive cost geometry.
