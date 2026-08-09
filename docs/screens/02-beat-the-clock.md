# Level 2 — One More Check

## 1. Identity

- `id`: `"02-beat-the-clock"`
- `title`: **One More Check**
- `tier`: `1`
- `objective`: **“Finish Bob’s next check and clear his blocker before release.”**
- ONE concept: an idle `CacheEntry` eventually expires, causing the next byte-identical `Request` to write its prefix again.
- `concept.id`: `"cache-expiry"`
- `concept.privateDesignerSummary`: “Idle TTL determines whether an identical request reads or rewrites.”
- `concept.postRevealRule`: **“Saved context expires after 60 idle minutes. After that, the next identical request writes it again.”**
- `concept.solutionVocabulary`: `["cache", "cached", "expiry", "expire", "expired", "TTL", "idle lifetime", "60 minutes", "read", "rewrite"]`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["write-vs-read"]`
- New control: `"advanceTime"`
- Vocabulary first needed during play: **TTL**, introduced only after the opening request creates a `CacheEntry`.

The interruption is a reducer-visible choice between two completable profiles:

- **Coffee-first:** advance `20 min`, send the check while the saved entry is live, then run the `90 min` Standup. The attempt finishes at minute `110`, exactly at the release deadline, with lower spend.
- **Standup-first:** run the `90 min` Standup immediately, clearing the blocker before sending the check. The attempt finishes at minute `90`, twenty minutes before the release deadline, with higher spend because the saved entry expired.

Both profiles complete the same authored check and the same `UnitInstance`. Coffee’s benefit is lower `attemptMetrics.spentUsd`; Standup’s benefit is the earlier reducer-owned completion time. `pass(st)` accepts either profile, and the three-star predicate rewards the benefit appropriate to the selected profile.

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
- `Checkpoint`
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
- `"just-in-time-toast"`
- `"counterfactual-after-attempt"`

## 3. Cold-open / narrative

No Learn screen, comparison, lifetime rule, answer key, or reference schedule appears before play.

| Time | Beat |
|---:|---|
| `0.0s` | Enter directly into the task desk. Header: **“ONE MORE CHECK”**. Task card: **“Bob’s login fix needs one more check.”** |
| `0.5s` | Wallet shows **$0.65**. Primary control appears under the pointer: **“Run check.”** |
| `≤2.0s` | Player can click **“Run check.”** |
| click | A red row crosses `UI_TAPE_RENDERER`; `UI_MAIN_CACHE_PANEL` gains one live entry. |
| immediately after | `UI_TTL_DRAIN_BAR` appears at `60:00`, then `toast-ttl-intro` introduces TTL. |
| `+0.5s` | Copy changes to **“The check and Bob’s blocker both need attention. Which goes first?”** |
| same beat | Two equally weighted cards appear: **“Coffee · 20 min · check first”** and **“Standup · 90 min · blocker first.”** |
| same beat | A release marker appears at minute `110`; neither card is labeled correct, safe, cheap, or expensive. |

The blocker badge is bound to the sole unit in `ReducerState.units`:

- before Standup: **“Blocker open”**;
- after `RUN_UNIT`: **“Blocker cleared.”**

The cards expose real scheduling stakes without stating the cache outcome:

- Coffee reaches the check sooner but postpones the blocker work.
- Standup clears the blocker first and visibly consumes more simulated time.

They do not say “expires,” “read,” “write,” red, blue, cheaper, or which choice preserves the saved entry.

`coldOpen.maxInstructionCards = 0`; `coldOpen.firstInteractiveBySec = 2`. Both values are presentation-only estimates registered in `scenarioData.estimates`.

## 4. Exact event sequence

All authored requests use the same `MAIN_SESSION_CONTEXT`, byte-identical `PREFIX_STACK`, Sonnet, the `1h` write tier, and `MAIN_PREFIX_HEY = 34,738` cacheable tokens (`C34`). Each request has `freshInputTok=0` and `expectedOutputTok=0` from the registered fiction fixtures. No content, model, namespace, breakpoint, or prefix ordering changes between `R2_1` and `R2_2`.

### Shared opening

1. **Enter level — `evt-enter`**
   - Event: route opens.
   - Action: `{ type: "ENTER_LEVEL", levelId: "02-beat-the-clock" }`
   - Mutates:
     - `clockMin=0`;
     - `budget=0.65`;
     - `wallet=0.65`;
     - `attemptMetrics.spentUsd=0`;
     - `attemptMetrics.requestCount=0`;
     - `attemptMetrics.completedUnitCount=0`;
     - `units[0].id="u2-blocker-standup"`;
     - `units[0].status="ready"`;
     - ledger, tape, cache, and `completedTransferIds` are empty.
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
     `{ type: "CREATE_CHECKPOINT", checkpointId: "cp-before-profile", reason: "decision" }`.

### Coffee-first profile

3. **Choose Coffee — `evt-choose-coffee`**
   - Event: player selects **“Coffee · 20 min · check first.”**
   - Action:
     `{ type: "BEGIN_TRANSFER", challengeId: "l2-profile-coffee" }`
   - The authored transfer contract appends `"l2-profile-coffee"` to `completedTransferIds`.
   - The choice locks; `"l2-profile-standup"` cannot be appended in the same branch.

4. **Coffee gap — `evt-coffee-gap`**
   - System action after the accepted profile:
     `{ type: "ADVANCE", min: 20 }`
   - Mutates:
     - `clockMin: 0 → 20`;
     - displayed remaining TTL: `60 → 40`;
     - `units[0].status` remains `"ready"`;
     - blocker badge remains **“Blocker open.”**
   - No request, wallet deduction, ledger row, or tape row is created.

5. **Predict the follow-up — `evt-followup-prediction`**
   - Actions:
     ```ts
     {
       type: "CREATE_CHECKPOINT",
       checkpointId: "cp-before-followup",
       reason: "prediction"
     }
     { type: "OPEN_PREDICTION", promptId: "p2-next-color" }
     ```
   - The player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION`.
   - Prediction choice and correctness affect no economics, failure, gate, score, or star.

6. **Coffee follow-up request — `evt-coffee-request`**
   - Precondition: `"l2-profile-coffee"` is in `completedTransferIds` and `p2-next-color` is committed.
   - Event: player clicks **“Send identical check.”**
   - Action: `{ type: "SEND_REQUEST", request: R2_2 }`
   - `RESOLVE_PREFIX` at minute `20`:
     - `readTok=34,738`;
     - `inputTok=0`;
     - `writeTok=0`;
     - `outTok=0`;
     - `cold=false`.
   - `PRICE_REQUEST`: `34,738 × $0.30/M = $0.0104214` (`C1`, `C3`, `C34`).
   - Mutates:
     - `CacheEntry.lastTouchMin: 0 → 20`;
     - `CacheEntry.expiresAtMin: 60 → 80` under the cache-touch rule (`C12`);
     - ledger/tape append one blue read row;
     - `wallet: 0.4415720 → 0.4311506`;
     - `attemptMetrics.spentUsd: 0.2084280 → 0.2188494`;
     - `attemptMetrics.requestCount: 1 → 2`.

7. **Coffee evidence reveal — `evt-coffee-reveal`**
   - Action:
     `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "blue-read" }`
   - Fires `toast-coffee-read`.
   - This is the Coffee profile’s causal evidence event.

8. **Coffee explanation — `evt-explain-coffee`**
   - Event: player answers **“What determined this row?”**
   - Each card dispatches:
     `{ type: "ACK_EXPLANATION", explanationId: <selected-id> }`
   - Options:
     - `expiry-idle-gap`: **“Only the idle gap changed whether the saved entry was still live.”**
     - `request-text-changed`: **“The request text changed.”**
     - `model-price-changed`: **“The model switched prices.”**
   - Incorrect explanations change no wallet, cache, metrics, gate evidence, or prediction and leave the choices available.
   - Selecting `expiry-idle-gap` after `evt-coffee-reveal` reveals `concept.postRevealRule`.

9. **Clear the carried blocker — `evt-coffee-blocker-clear`**
   - Preconditions:
     - `evt-coffee-reveal` completed;
     - `units[0].status === "ready"`.
   - Event copy: **“The check is done. Clear Bob’s blocker before release.”**
   - Action: `{ type: "RUN_UNIT", unitId: "u2-blocker-standup" }`
   - Mutates:
     - `clockMin: 20 → 110`;
     - `units[0].status: "ready" → "done"`;
     - `attemptMetrics.completedUnitCount: 0 → 1`;
     - the entry last touched at minute `20` reaches expiry at minute `80`;
     - blocker badge changes to **“Blocker cleared.”**
   - Because the unit is `free:true`, `workIn=0`, and `outTok=0`, it creates no request, wallet deduction, ledger row, or tape row.
   - Coffee finishes at the minute-`110` release deadline with `spentUsd=0.2188494`.

### Standup-first profile

10. **Choose Standup — `evt-choose-standup`**
    - Event: player selects **“Standup · 90 min · blocker first.”**
    - Action:
      `{ type: "BEGIN_TRANSFER", challengeId: "l2-profile-standup" }`
    - The authored transfer contract appends `"l2-profile-standup"` to `completedTransferIds`.
    - The choice locks; `"l2-profile-coffee"` cannot be appended in the same branch.

11. **Run Standup first — `evt-standup-work`**
    - Action: `{ type: "RUN_UNIT", unitId: "u2-blocker-standup" }`
    - Mutates:
      - `clockMin: 0 → 90`;
      - `units[0].status: "ready" → "done"`;
      - `attemptMetrics.completedUnitCount: 0 → 1`;
      - displayed remaining TTL reaches `0` at minute `60`;
      - blocker badge changes to **“Blocker cleared.”**
    - The free unit creates no request, wallet deduction, ledger row, or tape row.
    - Fires `toast-blocker-cleared`.

12. **Predict the follow-up — `evt-followup-prediction`**
    - Actions:
      ```ts
      {
        type: "CREATE_CHECKPOINT",
        checkpointId: "cp-before-followup",
        reason: "prediction"
      }
      { type: "OPEN_PREDICTION", promptId: "p2-next-color" }
      ```
    - The player selects and commits a prediction.
    - No request or price is revealed during the Standup.

13. **Standup follow-up request — `evt-standup-request`**
    - Precondition: `"l2-profile-standup"` is in `completedTransferIds` and `p2-next-color` is committed.
    - Event: player clicks **“Send identical check.”**
    - Action: `{ type: "SEND_REQUEST", request: R2_2 }`
    - `RESOLVE_PREFIX` at minute `90`:
      - `readTok=0`;
      - `inputTok=0`;
      - `writeTok=34,738`;
      - `outTok=0`;
      - `cold=true`.
    - `PRICE_REQUEST`: `34,738 × $6/M = $0.2084280` (`C1`, `C3`, `C34`).
    - Mutates:
      - replacement `CacheEntry` with `createdAtMin=90`, `lastTouchMin=90`, and `expiresAtMin=150`;
      - ledger/tape append one red write row;
      - `wallet: 0.4415720 → 0.2331440`;
      - `attemptMetrics.spentUsd: 0.2084280 → 0.4168560`;
      - `attemptMetrics.requestCount: 1 → 2`.
    - The completed blocker remains visible beside the request cost. The request does not dispatch `FREEZE_FAILURE`.

14. **Standup evidence reveal — `evt-standup-reveal`**
    - Action:
      `{ type: "REVEAL_PREDICTION", promptId: "p2-next-color", correctOptionId: "red-write" }`
    - Fires `toast-standup-write`.
    - This is the Standup profile’s causal evidence event.
    - The result rail displays:
      - blocker cleared at minute `90`;
      - release deadline at minute `110`;
      - `20 min` of schedule slack;
      - actual request cost `$0.2084280`.
    - It does not display the Coffee comparison before attempt completion.

15. **Standup explanation — `evt-explain-standup`**
    - Uses the same `ACK_EXPLANATION` options as the Coffee profile.
    - Selecting `expiry-idle-gap` after `evt-standup-reveal` reveals `concept.postRevealRule`.
    - Standup finishes at minute `90`, twenty minutes before the release deadline, with `spentUsd=0.4168560`.

### Shared completion

16. **Complete — `evt-complete`**
    - Preconditions:
      - exactly one profile marker exists;
      - `R2_2` has resolved with the bucket outcome appropriate to that marker;
      - `units[0].status === "done"`;
      - `attemptMetrics.requestCount === 2`;
      - `expiry-idle-gap` was acknowledged after the applicable reveal;
      - the selected profile meets its deadline.
    - Action: `{ type: "COMPLETE_ATTEMPT" }`
    - Mutates:
      - `attemptResult` receives the immutable snapshot of `attemptMetrics`;
      - gate result and stars are recorded;
      - result screen and campaign progress appear.
    - Coffee result:
      - `attemptResult.outcome="passed"`;
      - `attemptResult.spentUsd=0.2188494`;
      - `attemptResult.requestCount=2`;
      - `attemptResult.completedUnitCount=1`;
      - completion minute `110`.
    - Standup result:
      - `attemptResult.outcome="passed"`;
      - `attemptResult.spentUsd=0.4168560`;
      - `attemptResult.requestCount=2`;
      - `attemptResult.completedUnitCount=1`;
      - completion minute `90`.
    - Only now may `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` expose the other viable profile and the drift anti-pattern.
    - Counterfactual processing cannot mutate the actual wallet, ledger, `attemptResult`, `clockFrozen`, or `frozenFailure`.

17. **Try the other profile — `evt-rewind-profile`**
    - Available from `UI_RESULT_SCREEN`.
    - Action:
      `{ type: "REWIND_TO_CHECKPOINT", checkpointId: "cp-before-profile" }`
    - Deterministic replay restores:
      - `clockMin=0`;
      - the opening ledger/tape row;
      - the opening live cache entry expiring at minute `60`;
      - `wallet=0.4415720`;
      - `attemptMetrics.spentUsd=0.2084280`;
      - `attemptMetrics.requestCount=1`;
      - `attemptMetrics.completedUnitCount=0`;
      - `units[0].status="ready"`;
      - no profile marker;
      - `attemptResult=null`;
      - `frozenFailure=null`;
      - `clockFrozen=false`.
    - The opening request is neither replayed nor repriced.

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
      hours: 1.5, // 90 min / 60
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
      id: "g-coffee-then-standup",
      contextId: "ctx-main-l2",
      startMin: 20,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ],
  fixtures: [
    {
      id: "l2-seed",
      label: "Deterministic level seed",
      semanticRole: "Initial PRNG seed for replaying both schedule profiles",
      value: 2002,
      unit: "count",
      tag: "[FICTION]"
    },
    {
      id: "l2-attempt-budget",
      label: "Attempt budget",
      semanticRole: "Initial wallet and maximum available spend for the level",
      value: 0.65,
      unit: "usd",
      tag: "[FICTION]"
    },
    {
      id: "l2-clock-cap",
      label: "Level clock cap",
      semanticRole: "Maximum modeled time retained for the drift anti-pattern",
      value: 180,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-release-deadline",
      label: "Release deadline",
      semanticRole: "Latest completion minute accepted by the behavioral gate",
      value: 110,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-coffee-gap",
      label: "Coffee interruption",
      semanticRole: "Short profile gap before the follow-up request",
      value: 20,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-blocker-standup-duration",
      label: "Blocker-clearing Standup",
      semanticRole: "Duration consumed by the free blocker-clearing unit",
      value: 90,
      unit: "min",
      tag: "[FICTION]"
    },
    {
      id: "l2-check-fresh-input",
      label: "Fresh input per authored check",
      semanticRole: "Non-cacheable fresh input tokens on R2_1 and R2_2",
      value: 0,
      unit: "tok",
      tag: "[FICTION]"
    },
    {
      id: "l2-check-output",
      label: "Output tokens per authored check",
      semanticRole: "Generated output tokens on R2_1 and R2_2",
      value: 0,
      unit: "tok",
      tag: "[FICTION]"
    },
    {
      id: "l2-standup-work-input",
      label: "Standup work input",
      semanticRole: "Model input tokens generated by the free scripted Standup unit",
      value: 0,
      unit: "tok",
      tag: "[FICTION]"
    },
    {
      id: "l2-standup-output",
      label: "Standup output",
      semanticRole: "Model output tokens generated by the free scripted Standup unit",
      value: 0,
      unit: "tok",
      tag: "[FICTION]"
    },
    {
      id: "l2-required-request-count",
      label: "Required request count",
      semanticRole: "Opening check plus one follow-up required for completion",
      value: 2,
      unit: "count",
      tag: "[FICTION]"
    },
    {
      id: "l2-required-completed-units",
      label: "Required completed blocker units",
      semanticRole: "Blocker-clearing units required for completion",
      value: 1,
      unit: "count",
      tag: "[FICTION]"
    }
  ],
  estimates: [
    {
      label: "Initial control reveal delay in seconds",
      value: 0.5,
      tag: "[ESTIMATE]"
    },
    {
      label: "Maximum seconds to first interaction",
      value: 2,
      tag: "[ESTIMATE]"
    }
  ]
} satisfies ScenarioData;
```

All gameplay fiction is in `fixtures`, each with `id`, `semanticRole`, `unit`, and `[FICTION]`. `estimates` contains presentation timing only. Prefix size, TTL, touch behavior, and prices use their semantically matching measured constants instead of fiction fixtures.

The two profile markers are reducer-owned:

```ts
type L2ProfileMarker =
  | "l2-profile-coffee"
  | "l2-profile-standup";
```

Accepting a profile’s `BEGIN_TRANSFER` action appends its marker to `completedTransferIds`. The UI prevents both markers from being accepted in one branch; `passLevel02` independently verifies exclusivity.

```ts
const L2_FAIL_LESSON: FailLesson = {
  bucket: "none",
  cite: "C5",
  line:
    "An expired 1-hour prefix costs 20× its live-read input-side rate; this level reports that cost as a profile tradeoff because Standup buys earlier completed work."
};

const L2_FAILURE_RULES: FailureRuleDef[] = [];

const L2_CHECKPOINTS: CheckpointDef[] = [
  {
    id: "cp-before-profile",
    createBeforeEventId: "evt-choose-coffee",
    reason: "decision",
    resumeLabel: "Try the other schedule"
  },
  {
    id: "cp-before-followup",
    createBeforeEventId: "evt-followup-prediction",
    reason: "prediction",
    resumeLabel: "Return to the prediction"
  }
];
```

Reference, alternate, and anti-pattern schedules use identical configuration. Ordering and reducer-visible work are the only causal differences:

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
// Requests resolve at minutes 0 and 20; blocker completes at minute 110.

const STANDUP_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-alt-standup",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Blocker and follow-up resolve by minute 90.

const ANTI_SCENARIO_PATCH: Partial<ScenarioData> = {
  gaps: [
    {
      id: "g-anti-inbox-drift",
      contextId: "ctx-main-l2",
      startMin: 0,
      durationMin: 90,
      permitsKeepWarm: false
    },
    {
      id: "g-anti-late-standup",
      contextId: "ctx-main-l2",
      startMin: 90,
      durationMin: 90,
      permitsKeepWarm: false
    }
  ]
};
// Request resolves at minute 90 without blocker progress; blocker completes at minute 180.
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
      "What did the short interruption preserve before the blocker work?",
    revealCopy:
      "Coffee finished at the release deadline and spent $0.2188494."
  },
  {
    id: "cf-l2-standup",
    unlockAfterEventId: "evt-complete",
    kind: "alternate-choice",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: STANDUP_SCENARIO_PATCH,
    comparisonQuestion:
      "What did clearing the blocker first buy?",
    revealCopy:
      "Standup finished 20 minutes early and spent $0.4168560."
  },
  {
    id: "cf-l2-drift",
    unlockAfterEventId: "evt-complete",
    kind: "anti-pattern",
    cfg: L2_LOCKED_CFG,
    scenarioPatch: ANTI_SCENARIO_PATCH,
    comparisonQuestion:
      "What happened when the same 90 minutes cleared no work?",
    revealCopy:
      "The request rewrote, and the blocker still pushed completion to minute 180."
  }
];
```

```ts
const LEVEL_02: LevelDef = {
  id: "02-beat-the-clock",
  tier: 1,
  title: "One More Check",
  objective: "Finish Bob’s next check and clear his blocker before release.",
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

## 6. Pricing walkthrough

Sonnet prices a 1-hour cache write at `$6/M`, a cache read at `$0.30/M`, and output at `$15/M` (`C1`, `C3`). The complete repeated prefix is `MAIN_PREFIX_HEY = 34,738` tokens (`C34`).

This is the only authoritative price table for the level:

| Request outcome | Resolution minute | `readTok` | `inputTok` | `writeTok` | `outTok` | Calculation | Cost |
|---|---:|---:|---:|---:|---:|---|---:|
| `R2_1` opening write | `0` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |
| `R2_2` Coffee live read | `20` | `34,738` | `0` | `0` | `0` | `34,738 × $0.30 / 1,000,000` | `$0.0104214` |
| `R2_2` Standup or drift expired write | `90` | `0` | `0` | `34,738` | `0` | `34,738 × $6 / 1,000,000` | `$0.2084280` |

Coffee reference total:

```text
$0.2084280 + $0.0104214 = $0.2188494
```

Standup alternate-profile total:

```text
$0.2084280 + $0.2084280 = $0.4168560
```

Drift anti-pattern total:

```text
$0.2084280 + $0.2084280 = $0.4168560
```

Request-cost difference between Coffee and Standup:

```text
$0.4168560 - $0.2188494 = $0.1980066
```

The individual expired 1-hour rewrite costs `20×` its live read (`C5`). Standup exchanges that `$0.1980066` difference for reducer-visible schedule progress:

- Coffee completes at minute `110`.
- Standup completes at minute `90`.
- Standup therefore retains `20 min` of release-deadline slack.

The drift anti-pattern pays the same request cost as Standup but does not clear the blocker during the long gap; it completes at minute `180` and fails the deadline behavior. This distinguishes useful schedule progress from consequence-free waiting.

Exact values remain unrounded in reducer state. Display values may be `$0.2084`, `$0.0104`, `$0.2188`, and `$0.4169`.

The free Standup changes `clockMin`, `UnitInstance.status`, and `attemptMetrics.completedUnitCount` but creates no request, price, ledger row, or tape row.

Although this scenario has `outTok=0`, `UI_TAPE_RENDERER` still uses canonical output-inclusive geometry. Any non-zero output would contribute at Sonnet’s `$15/M` rate (`5×`, `C1`, `C3`).

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`. Rows appear only after their requests resolve.

Shared row:

1. `R2_1` — red write segment, `34,738 tok`, `$0.2084280`.

Coffee profile row:

2. `R2_2` — blue read segment, `34,738 tok`, `$0.0104214`; reveal gated by `p2-next-color`.

Standup profile row:

2. `R2_2` — red write segment, `34,738 tok`, `$0.2084280`; reveal gated by `p2-next-color`.

Coffee, Standup, expiry animation, and blocker changes create no tape rows. The blocker badge and deadline rail remain outside tape geometry.

```ts
const L2_TAPE: TapeSpec = {
  rowSource: "ledger",
  labels: {
    R2_1: "Opening check",
    R2_2: "Identical follow-up"
  },
  revealGroups: [
    {
      id: "l2-opening",
      requestIds: ["R2_1"]
    },
    {
      id: "l2-followup",
      requestIds: ["R2_2"],
      gatedByPredictionId: "p2-next-color"
    }
  ],
  ahaRequestId: "R2_2",
  hoverEnabled: true
};
```

Aha frame:

- Keep the minute-`110` release marker visible.
- Coffee profile:
  - hold `UI_TTL_DRAIN_BAR` at `40:00` when the blue row resolves;
  - show the open blocker beside the row;
  - after Standup, show completion exactly at minute `110`.
- Standup profile:
  - hold `UI_TTL_DRAIN_BAR` at `0:00`;
  - keep the cleared blocker visible;
  - pulse the expired `CacheEntry`, the zero point, and the red row;
  - show completion at minute `90` with `20 min` of deadline slack.
- After explanation, caption: **“The request stayed identical. Idle time changed what was still available.”**
- Do not add an unpriced expiry, Coffee, or Standup row.
- Each authored row has one non-zero priced bucket, so its sole segment has `widthRatio=1`.
- Static final bars remain visible without hover.

## 8. Prediction prompts

### `p2-next-color`

Question:

> **After this interruption, what color will the identical request be?**

Options:

- `blue-read`: **“Blue — read”**
- `red-write`: **“Red — write”**

The correct option is supplied only after commitment and request resolution:

- Coffee profile → `blue-read`
- Standup profile → `red-write`

No prompt option includes the rule, the `60`-minute threshold, evaluative styling, or a dollar clue before commitment. The two cards’ schedule labels remain visible, but neither is styled as correct.

Prediction correctness never affects gate passage, stars, score, wallet, failure, rewind, profile markers, completed work, or deadline state.

## 9. Fail-state

This level has no punitive `FailureRuleDef`:

```ts
const L2_FAILURE_RULES: FailureRuleDef[] = [];
```

No event dispatches `FREEZE_FAILURE`.

The Standup request is more expensive than Coffee’s request, but it is not an economically equivalent mistake: Standup has already changed `units[0].status` to `"done"` and finishes the complete attempt twenty minutes earlier. Punishing it would erase real counter-pressure and violate the requirement that a freeze compare against a genuinely valid request-local alternative.

The Coffee and Standup profiles therefore both proceed through explanation and `COMPLETE_ATTEMPT`.

The drift schedule is an informational post-attempt anti-pattern. It pays the expired-write cost without clearing the blocker during the gap and misses the minute-`110` deadline. Because it is processed through `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL`, it cannot freeze or mutate the actual attempt.

`UI_REWIND_CONTROL` is available from the result screen solely to try the other viable profile. It rewinds to `cp-before-profile`; it is not presented as recovery from failure.

## 10. Gate & stars

The post-evidence `ACK_EXPLANATION` action is the understanding check. Prediction commitment unlocks the reveal structurally, but prediction identity and correctness are absent from the gate, `pass(st)`, and star predicates.

Behavioral pass:

```text
pass iff exactly one profile marker exists
  AND R2_2 exists in ledger
  AND:
    Coffee marker implies
      R2_2 readTok = 34,738
      R2_2 writeTok = 0
      R2_2 cold = false
      clockMin <= 110
    OR
    Standup marker implies
      R2_2 readTok = 0
      R2_2 writeTok = 34,738
      R2_2 cold = true
      clockMin <= 90
  AND units.find(id="u2-blocker-standup").status = "done"
  AND attemptMetrics.completedUnitCount = 1
  AND attemptMetrics.requestCount = 2
  AND the applicable reveal event completed
  AND, after that reveal,
      ACK_EXPLANATION("expiry-idle-gap") was observed
```

```ts
const L2_GATE: GateDef = {
  predicateId: "gate-l2-cache-expiry",
  evidenceRevealEventIds: [
    "evt-coffee-reveal",
    "evt-standup-reveal"
  ],
  postEvidenceActionRequirements: [
    {
      id: "l2-post-evidence-explanation",
      kind: "any",
      predicates: [
        {
          id: "l2-explanation-after-coffee",
          kind: "action-observed",
          actionType: "ACK_EXPLANATION",
          afterEventId: "evt-coffee-reveal",
          match: {
            explanationId: "expiry-idle-gap"
          }
        },
        {
          id: "l2-explanation-after-standup",
          kind: "action-observed",
          actionType: "ACK_EXPLANATION",
          afterEventId: "evt-standup-reveal",
          match: {
            explanationId: "expiry-idle-gap"
          }
        }
      ]
    }
  ],
  behavioralRequirements: [
    {
      id: "l2-one-profile-selected",
      kind: "any",
      predicates: [
        {
          id: "l2-coffee-profile-selected",
          kind: "includes",
          path: "completedTransferIds",
          value: "l2-profile-coffee"
        },
        {
          id: "l2-standup-profile-selected",
          kind: "includes",
          path: "completedTransferIds",
          value: "l2-profile-standup"
        }
      ]
    },
    {
      id: "l2-profile-request-evidence",
      kind: "any",
      predicates: [
        {
          id: "l2-coffee-request-evidence",
          kind: "all",
          predicates: [
            {
              id: "l2-coffee-marker",
              kind: "includes",
              path: "completedTransferIds",
              value: "l2-profile-coffee"
            },
            {
              id: "l2-coffee-read-tokens",
              kind: "compare",
              path: "ledger.1.readTok",
              op: "eq",
              value: 34738
            },
            {
              id: "l2-coffee-write-tokens",
              kind: "compare",
              path: "ledger.1.writeTok",
              op: "eq",
              value: 0
            },
            {
              id: "l2-coffee-live",
              kind: "compare",
              path: "ledger.1.cold",
              op: "eq",
              value: false
            },
            {
              id: "l2-coffee-deadline",
              kind: "compare",
              path: "clockMin",
              op: "lte",
              value: 110
            }
          ]
        },
        {
          id: "l2-standup-request-evidence",
          kind: "all",
          predicates: [
            {
              id: "l2-standup-marker",
              kind: "includes",
              path: "completedTransferIds",
              value: "l2-profile-standup"
            },
            {
              id: "l2-standup-read-tokens",
              kind: "compare",
              path: "ledger.1.readTok",
              op: "eq",
              value: 0
            },
            {
              id: "l2-standup-write-tokens",
              kind: "compare",
              path: "ledger.1.writeTok",
              op: "eq",
              value: 34738
            },
            {
              id: "l2-standup-cold",
              kind: "compare",
              path: "ledger.1.cold",
              op: "eq",
              value: true
            },
            {
              id: "l2-standup-deadline",
              kind: "compare",
              path: "clockMin",
              op: "lte",
              value: 90
            }
          ]
        }
      ]
    },
    {
      id: "l2-blocker-unit-done",
      kind: "compare",
      path: "units.0.status",
      op: "eq",
      value: "done"
    },
    {
      id: "l2-request-count",
      kind: "compare",
      path: "attemptMetrics.requestCount",
      op: "eq",
      value: 2
    },
    {
      id: "l2-completed-unit-count",
      kind: "compare",
      path: "attemptMetrics.completedUnitCount",
      op: "eq",
      value: 1
    }
  ],
  explanationRequirement: {
    id: "l2-explained-idle-expiry",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "expiry-idle-gap"
  }
};
```

Pure, schema-valid pass evaluator:

```ts
function passLevel02(st: ReducerState): GateResult {
  const followup = st.ledger.find(
    row => row.requestId === "R2_2"
  );
  const blocker = st.units.find(
    unit => unit.id === "u2-blocker-standup"
  );

  const choseCoffee =
    st.completedTransferIds.includes("l2-profile-coffee");
  const choseStandup =
    st.completedTransferIds.includes("l2-profile-standup");
  const choseExactlyOne = choseCoffee !== choseStandup;

  const coffeeProfile =
    choseCoffee &&
    !choseStandup &&
    followup?.readTok === 34738 &&
    followup.inputTok === 0 &&
    followup.writeTok === 0 &&
    followup.outTok === 0 &&
    followup.cold === false &&
    st.completedEventIds.includes("evt-coffee-reveal") &&
    st.clockMin <= 110;

  const standupProfile =
    choseStandup &&
    !choseCoffee &&
    followup?.readTok === 0 &&
    followup.inputTok === 0 &&
    followup.writeTok === 34738 &&
    followup.outTok === 0 &&
    followup.cold === true &&
    st.completedEventIds.includes("evt-standup-reveal") &&
    st.clockMin <= 90;

  const pass =
    choseExactlyOne &&
    (coffeeProfile || standupProfile) &&
    blocker?.status === "done" &&
    st.attemptMetrics.completedUnitCount === 1 &&
    st.attemptMetrics.requestCount === 2 &&
    st.acknowledgedExplanationIds.includes("expiry-idle-gap") &&
    st.frozenFailure === null;

  const profile = coffeeProfile
    ? "Coffee"
    : standupProfile
      ? "Standup"
      : null;

  return {
    pass,
    reason: pass
      ? `${profile} completed the check and blocker while demonstrating how the idle gap changed the identical request.`
      : "Complete one schedule profile, inspect its follow-up row, and explain what changed it.",
    evidence: pass
      ? coffeeProfile
        ? [
            "Coffee profile selected in reducer state.",
            "20-minute gap: 34,738 tokens read.",
            "Blocker completed by minute 110.",
            "Idle-gap explanation acknowledged after the reveal."
          ]
        : [
            "Standup profile selected in reducer state.",
            "90-minute gap: 34,738 tokens rewritten.",
            "Blocker and check completed by minute 90.",
            "Idle-gap explanation acknowledged after the reveal."
          ]
      : []
  };
}
```

Canonical stars:

```ts
const L2_STAR_2: StarDef = {
  label: "Release-ready",
  predicate: {
    id: "l2-star2-release-ready",
    kind: "all",
    predicates: [
      {
        id: "l2-star2-blocker-done",
        kind: "compare",
        path: "units.0.status",
        op: "eq",
        value: "done"
      },
      {
        id: "l2-star2-request-count",
        kind: "compare",
        path: "attemptMetrics.requestCount",
        op: "eq",
        value: 2
      },
      {
        id: "l2-star2-deadline",
        kind: "compare",
        path: "clockMin",
        op: "lte",
        value: 110
      }
    ]
  },
  reason:
    "Finished the authored check and cleared the blocker by the minute-110 release deadline."
};

const L2_STAR_3: StarDef = {
  label: "Honor the chosen priority",
  predicate: {
    id: "l2-star3-profile-benefit",
    kind: "any",
    predicates: [
      {
        id: "l2-star3-coffee-economy",
        kind: "all",
        predicates: [
          {
            id: "l2-star3-coffee-marker",
            kind: "includes",
            path: "completedTransferIds",
            value: "l2-profile-coffee"
          },
          {
            id: "l2-star3-coffee-spend",
            kind: "compare",
            path: "attemptMetrics.spentUsd",
            op: "lte",
            value: 0.2188494
          },
          {
            id: "l2-star3-coffee-deadline",
            kind: "compare",
            path: "clockMin",
            op: "lte",
            value: 110
          }
        ]
      },
      {
        id: "l2-star3-standup-speed",
        kind: "all",
        predicates: [
          {
            id: "l2-star3-standup-marker",
            kind: "includes",
            path: "completedTransferIds",
            value: "l2-profile-standup"
          },
          {
            id: "l2-star3-standup-clock",
            kind: "compare",
            path: "clockMin",
            op: "lte",
            value: 90
          },
          {
            id: "l2-star3-standup-work",
            kind: "compare",
            path: "attemptMetrics.completedUnitCount",
            op: "eq",
            value: 1
          }
        ]
      }
    ]
  },
  reason:
    "Coffee earns the star by preserving spend; Standup earns it by completing the work twenty minutes early."
};
```

Star summary:

- **1 star — Demonstrated expiry behavior:** `passLevel02(st).pass === true`.
- **2 stars — Release-ready:** exactly two requests, one completed blocker unit, and completion by minute `110`.
- **3 stars — Honor the chosen priority:**
  - Coffee: `attemptMetrics.spentUsd <= 0.2188494` and completion by minute `110`;
  - Standup: `clockMin <= 90` with the blocker unit completed.

Both core options can earn three stars. Coffee’s star benefit is spend; Standup’s star benefit is deadline slack and completed work. No predicate reads prediction identity or correctness.

## 11. Toasts

| ID | Trigger | Priority | Exact copy |
|---|---|---|---|
| `toast-first-write` | `R2_1` appends | status | **“WRITE · 34,738 tokens · $0.2084”** |
| `toast-ttl-intro` | opening `CacheEntry` appears | teaching | **“Saved for now. TTL is the idle-time countdown.”** |
| `toast-blocker-waits` | Coffee profile accepted | status | **“Check first · blocker still open.”** |
| `toast-blocker-cleared` | `units[0].status` becomes `"done"` | status | **“Bob’s blocker is cleared.”** |
| `toast-coffee-read` | Coffee `R2_2` resolves | teaching | **“Still live. READ · 34,738 tokens · $0.0104”** |
| `toast-expired` | TTL first reaches zero | status | **“TTL · 0:00”** |
| `toast-standup-write` | Standup `R2_2` resolves | cause | **“Expired while idle. WRITE again · $0.2084”** |
| `toast-profile-rule` | `expiry-idle-gap` is acknowledged | teaching | **“Saved context expires after 60 idle minutes.”** |
| `toast-coffee-result` | Coffee completes | result | **“On time · $0.2188 spent.”** |
| `toast-standup-result` | Standup completes | result | **“20 min early · $0.4169 spent.”** |

Only one teaching toast is visible at once. `toast-expired` reports status only; it does not reveal the next row or the correct prediction. Result toasts fire only after the gate passes.

## 12. QA gate

Real-browser click-through assertions:

1. The level opens with no Learn screen; **“Run check”** is clickable by the registered `2s` presentation estimate.
2. No pre-play copy states the lifetime, surviving option, next-row color, cheaper profile, or correct schedule.
3. `ENTER_LEVEL` uses `"02-beat-the-clock"`.
4. `concept.id` is `"cache-expiry"` and its only prerequisite is `"write-vs-read"`.
5. `concept.solutionVocabulary` is present and complete.
6. `conceptScope` is `{ kind:"single", reusedConceptIds:[] }`.
7. `interactionPatterns` contains only canonical kebab-case IDs and excludes `"fail-freeze-rewind"`.
8. The opening click creates exactly one `LedgerRow`, one tape row, and one live `CacheEntry`.
9. Opening price is exactly `$0.2084280` (`C1`, `C3`, `C34`).
10. The Coffee card dispatches `BEGIN_TRANSFER { challengeId:"l2-profile-coffee" }` and appends that exact marker to `completedTransferIds`.
11. The Standup card dispatches `BEGIN_TRANSFER { challengeId:"l2-profile-standup" }` and appends that exact marker to `completedTransferIds`.
12. The reducer prevents both profile markers from being accepted in one branch.
13. Coffee dispatches exactly one `ADVANCE { min:20 }` and creates no request during time passage.
14. Coffee leaves `units[0].status="ready"` until the follow-up resolves.
15. Coffee leaves `40 min` on the original TTL; the read refreshes `lastTouchMin` to `20` and `expiresAtMin` to `80` (`C12`).
16. Coffee’s `R2_2` costs exactly `$0.0104214` (`C1`, `C3`, `C34`).
17. Coffee later dispatches `RUN_UNIT { unitId:"u2-blocker-standup" }`, reaches minute `110`, and completes one unit without creating a request.
18. Coffee completes with `spentUsd=0.2188494`, `requestCount=2`, and `completedUnitCount=1`.
19. Standup dispatches `RUN_UNIT { unitId:"u2-blocker-standup" }`, advances `clockMin` by `90`, and completes the blocker before the follow-up.
20. The free Standup creates no request, wallet deduction, ledger row, or tape row.
21. Standup’s `R2_2` resolves with `readTok=0`, `writeTok=34,738`, `cold=true`, and cost `$0.2084280`.
22. Standup completes with `spentUsd=0.4168560`, `requestCount=2`, `completedUnitCount=1`, and `clockMin=90`.
23. Standup is never an automatic terminal failure and can earn all three stars.
24. Coffee can also earn all three stars.
25. The Coffee result visibly records its `$0.1980066` spend benefit relative to Standup only after completion.
26. The Standup result visibly records its `20 min` deadline benefit relative to Coffee only after completion.
27. Neither profile’s request reveal can execute before `p2-next-color` is committed.
28. Wrong predictions change no wallet, score, star, failure, rewind, profile marker, completed work, or gate result.
29. The gate observes `ACK_EXPLANATION` after the applicable evidence reveal.
30. An incorrect explanation is retryable and changes no economics or attempt metrics.
31. `passLevel02` reads only declared `ReducerState`, `LedgerRow`, `UnitInstance`, and array fields.
32. `passLevel02` accesses the unit through `st.units.find(...)`; no `units.<id>` object path exists.
33. Declarative predicates use `units.0.status`, never `units.u2-blocker-standup.status`.
34. Every gate and star predicate uses a declared state path, legal `StatePredicate` kind, and legal comparison op.
35. No predicate uses `op:"contains"`.
36. The cost predicates use `lte`, not floating-point equality.
37. The Coffee reference requests resolve at minutes `0` and `20`; total is `$0.2188494`.
38. The Standup alternate requests resolve at minutes `0` and `90`; total is `$0.4168560`.
39. The drift anti-pattern resolves its requests at minutes `0` and `90`, clears the blocker only at minute `180`, and fails the intended deadline behavior.
40. `referenceCfg` and `antiCfg` are identical; scenario ordering and completed work are the authored causal differences.
41. Counterfactual configuration, schedule, totals, and labels remain hidden until `evt-complete`.
42. Counterfactual processing mutates no actual wallet, ledger, `attemptResult`, `clockFrozen`, or `frozenFailure`.
43. No `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, reference event, alternate-choice event, or anti-pattern event dispatches `FREEZE_FAILURE`.
44. The level’s actual sequence contains no `FREEZE_FAILURE`.
45. Result-screen rewind returns to `cp-before-profile` without replaying or repricing `R2_1`.
46. Rewind restores `units[0].status="ready"`, `wallet=0.4415720`, `attemptMetrics.spentUsd=0.2084280`, and `attemptMetrics.requestCount=1`.
47. Every real request has `usd > 0`; no positive amount renders as `$0.0000`.
48. Tape-row count equals ledger-row count at every action boundary.
49. Coffee, Standup, TTL drainage, blocker changes, and deadline animation create no tape or ledger rows.
50. Every authored request’s input-side buckets total `34,738`; no token appears in both read and write buckets.
51. Every authored request has `outTok=0`, but tape geometry still includes the canonical output-cost bucket and Sonnet’s `$15/M` output rate (`C1`, `C3`).
52. Static final tape bars remain visible without hover.
53. `R2_1` and both resolutions of `R2_2` use byte-identical prefix content; only `sentAtMin` and cache liveness differ.
54. Prediction options have no correctness styling before commitment.
55. Keyboard and pointer flows can run the opening check, choose either profile, commit the prediction, send the follow-up, answer the explanation, clear the blocker, complete, and rewind.
56. Screen readers announce blocker status, TTL status, completion minute, spend, and the selected profile’s star reason.
57. Reduced-motion mode replaces drain and pulse animation with immediate state transitions while preserving action order and evidence.
58. Restarting with seed `2002` reproduces byte-identical state, ledger, wallet, cache, unit status, profile markers, checkpoints, metrics, and tape.
59. `UI_RESULT_SCREEN` displays behavioral evidence and profile-specific star reasons; budget alone never indicates mastery.
60. The document contains one authoritative pricing table and no superseded three-request totals or unreachable failure branches.
61. Every gameplay `[FICTION]` value is registered in `scenarioData.fixtures` with `id`, `semanticRole`, and `unit`.
62. `scenarioData.estimates` contains presentation timing only.
63. The seed, budget, clock cap, release deadline, Coffee duration, Standup duration, zero-token request buckets, and required counts all resolve to registered fixtures.
64. The reference configuration passes from seed `2002`.
65. The anti-pattern fails the minute-`110` behavioral deadline.
66. `attemptResult.spentUsd` equals `budget - wallet` for both viable profiles.
67. `title` and `objective` contain none of `concept.solutionVocabulary`; the mandatory assertion is:

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

The screen opens on a tactile request rather than an explanation. Its first red write creates something visible to protect, and the two interruption cards turn an invisible idle mechanism into a scheduling choice with concrete stakes. Coffee reaches the check after twenty minutes but carries a reducer-owned blocker forward. Standup clears the blocker immediately but consumes ninety minutes before the same request. Neither card reveals the wire outcome.

The choice is not replay-dominant. Coffee finishes at the release deadline with `$0.2188494` spent. Standup finishes twenty minutes early with `$0.4168560` spent. Both benefits survive into reducer state, affect stars, and are reported by `UI_RESULT_SCREEN`. The three-star predicate respects the selected priority instead of forcing every player toward a single maximum or minimum.

The follow-up reveal is immediate and legible: Coffee catches the live entry and turns the row blue; Standup reaches zero and turns the byte-identical row red. The explanation comes only after the actual row is visible. Prediction correctness remains non-punitive.

The level intentionally has no punitive freeze. Standup’s expensive request cannot be compared to Coffee as though the two actions were locally equivalent, because Standup has already completed real work and preserved twenty minutes of deadline slack. Treating that viable route as failure would make the apparent tradeoff fictitious. The post-attempt drift projection supplies the genuinely bad comparison—same expired-write cost, no blocker progress during the gap, completion at minute `180`—without mutating or punishing the completed attempt.

Assumption/tradeoff: authored checks use zero fresh-input and output tokens to isolate TTL-driven read-versus-write economics. Those values, together with the seed, budget, clock cap, deadline, durations, and required counts, are registered as gameplay fixtures rather than presentation estimates.

