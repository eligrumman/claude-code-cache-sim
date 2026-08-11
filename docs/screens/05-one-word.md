# Level 5 — Eight Tiny Fixes

## 1. Identity

- **id:** `05-one-word`
- **title:** Eight Tiny Fixes
- **tier:** `1`
- **Objective:** “Eight agents get eight small jobs. Make the run fit the budget.”
- **ONE concept:** `byte-identical-prefix` — reuse requires byte-identical ordered prefix content (`C8`); the first mismatch invalidates the cacheable suffix (`C9`).
- **Concept scope:** `{ kind:"single", reusedConceptIds:[] }`
- **Prerequisite concept IDs:** `["prefix-reuse", "shared-subagent-window"]`
- **Post-reveal rule:** “Keep shared prompt bytes identical at the front; put each task’s variation at the tail.”
- **Solution vocabulary forbidden from `title` and `objective`:** `["one word", "byte-identical", "prefix", "normalize", "normalization", "front", "tail", "pointer", "same bytes"]`

## 2. Objects used

- `SUBAGENT_CONTEXT`
- `Request`
- `PricedRequest`
- `CacheEntry`
- `PREFIX_STACK`
- `PB_INSTRUCTIONS`
- `PB_CURRENT`
- `WireSegment`
- `LedgerRow`
- `Wallet`
- `Budget`
- `Clock`
- `AttemptMetrics`
- `AttemptResult`
- `StatePredicate`
- `GateDef`
- `StarDef`
- `PRICE_REQUEST`
- `RESOLVE_PREFIX`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_TAPE_RENDERER`
- `UI_HOVER_PRICE_CALCULATOR`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_RESULT_SCREEN`
- `UI_COUNTERFACTUAL_OVERLAY`
- `predict-before-reveal`
- `just-in-time-toast`
- `counterfactual-after-attempt`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction by `1.5s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Eight face-down job cards snap into an empty queue. Header: **“Eight tiny fixes. One agent template.”** |
| `0.4s` | Two uncolored template cards appear. **Greeting first:** “HEY/HELLO — review the repository, follow project instructions, and complete TASK.” **Ticket last:** “Review the repository, follow project instructions, and complete TASK: …” |
| `0.8s` | Copy: **“Pick the template the dispatcher should use.”** Greeting-first is already prepared and needs no normalization work; its direct dispatch setup takes `1` simulated minute. Ticket-last requires normalizing the shared template and takes `4` simulated minutes. Neither card reveals cache color, token counts, request prices, or correctness. |
| `1.5s` | Both template cards become selectable. The job queue remains disabled until the player explicitly chooses one. |

The designer-visible economy is a live setup-time versus request-cost tradeoff. Greeting-first completes setup in `1` minute but its eight requests cost `$0.50660670`; pointer-tail spends `4` minutes normalizing the shared template but its eight requests cost `$0.15348645`. The setup durations are committed through `ADVANCE`, and the request totals come only from eight actual `SEND_REQUEST` actions on the selected route.

The request-cost consequence, reusable boundary, and cheaper repeated run remain hidden until the chosen requests resolve. The later post-evidence transfer changes the operational constraint before completion: a first-line-only human triage pass requires the ticket cue first. That transfer is reducer-visible gate evidence, so the level teaches a contextual choice rather than presenting either placement as universally dominant.

## 4. Exact event sequence

1. **Enter with no committed template**  
   Event: level mount → `ENTER_LEVEL { levelId:"05-one-word" }` → initializes `ReducerState`, scalar `wallet` and `budget`, `clockMin`, `attemptMetrics`, and eight `SUBAGENT_CONTEXT` instances sharing `sharedPrefixPoolId:"l5-pool"`. Candidate `PREFIX_STACK` objects exist, but neither card is committed or runnable.  
   Numbers: `8` jobs `[FICTION]`; `clockMin=0`; `budget=0.55` and `wallet=0.55` `[FICTION]`; model `sonnet`; tier `5m`; width `8` `[FICTION]`. The authored dispatch sends all eight requests without advancing the clock between requests, so the selected run remains within the `5m` cache lifetime (`C1`, `C27`).

2. **Player chooses the setup-time route**  
   Event: player selects a template card → one of:

   - `NORMALIZE_PROMPTS { templateId:"l5-greeting-front", taskPointerPosition:"front" }`
   - `NORMALIZE_PROMPTS { templateId:"l5-ticket-tail", taskPointerPosition:"tail" }`

   Front selection accepts the already-prepared greeting-first template without text-normalization work and sets `cfg.prompts="varied"`. The reducer then dispatches `ADVANCE { min:1 }`, completing `ev-l5-front-direct-setup` with `clockMin=1`.

   Tail selection performs the normalization needed to move each changing task pointer behind the shared instructions and sets `cfg.prompts="pointer"`. The reducer dispatches `ADVANCE { min:4 }`, increments `attemptMetrics.tailNormalizationActions`, and completes `ev-l5-unattended-tail-placement` and `ev-l5-tail-normalization-setup` with `clockMin=4`.

   The engine treats `pointer` as a non-varied shared spawn prompt, so it follows the measured identical-prefix branch. Setup changes no wallet, ledger, cache entry, request count, or passing subtotal. Its only gameplay cost is the route’s authored simulated duration.

3. **Commit the route-specific prediction**  
   Event: the selected layout determines which unresolved prompt opens:

   - front → `OPEN_PREDICTION { promptId:"l5-front-result" }`
   - tail → `OPEN_PREDICTION { promptId:"l5-tail-result" }`

   The player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION` for that prompt. Selection styling stays neutral; correctness changes no score, stars, wallet, failure, route qualification, or gate state.

4. **Start the chosen route**  
   Event: player clicks **Run 8**. The selected route determines the ordered `SEND_REQUEST` actions. A front choice executes steps 5–8; a tail choice executes steps 9–11. No reference or counterfactual request participates in the actual run.

5. **Front route: send job 1**  
   Preconditions: `cfg.prompts=="varied"` and `clockMin==1`.  
   Event: `SEND_REQUEST { request:req-front-1 }` → `RESOLVE_PREFIX` creates the shared `CacheEntry`; one `LedgerRow` is appended; scalar `wallet`, `attemptMetrics`, `lastRequests`, and the first `PREFIX_STACK` mutate.  
   Numbers: `readTok=0`, `inputTok=0`, `writeTok=26,237`, `outTok=0`; cost `$0.09838875` (`C10`, `C1`, `C3`). `wallet` becomes `$0.45161125`. Tape row 1 is red.

6. **Front route: resolve job 2 and reveal the early mismatch**  
   Event ID: `ev-l5-reveal-front`.  
   Event: `SEND_REQUEST { request:req-front-2 }` resolves. `RESOLVE_PREFIX` finds the first mismatching `Token` at the greeting in `PB_INSTRUCTIONS`; `readTok=11,602`, `writeTok=14,623`, `inputTok=0`, `outTok=0`; cost `$0.05831685` (`C11`, `C1`, `C3`). `wallet` becomes `$0.39329440`. `UI_PREFIX_STACK_VISUALIZER` enters `mode:"diff"` only after resolution.

   The request-resolved event dispatches `REVEAL_PREDICTION { promptId:"l5-front-result", correctOptionId:"partial-rewrite" }` and renders the local uncharged comparison quote `$0.00787110`, the price of a full warm read of `26,237` tokens. The selected request costs `$0.05044575` more, or `7.41×` the request-local warm-read alternative (`C1`, `C3`, `C10`, `C11`).

   This evidence is non-punitive. No `FREEZE_FAILURE` is dispatched, and the remaining six actual requests continue.

7. **Front route: send jobs 3–8**  
   Event: the queue dispatches six ordered `SEND_REQUEST` actions, `req-front-3` through `req-front-8`. Each resolves with `readTok=11,602`, `writeTok=14,623`, `inputTok=0`, and `outTok=0`; each costs `$0.05831685`. Each request appends one `LedgerRow`, refreshes the applicable cache entry, debits scalar `wallet`, and updates `attemptMetrics.requestCount` and `attemptMetrics.spentUsd`.

   Seven varied requests cost `$0.40821795`; the complete front run costs `$0.50660670` and leaves `$0.04339330`.

8. **Complete the front run boundary**  
   Event ID: `l5-front-run-complete`.  
   Event: after `req-front-8` resolves, append `"l5-front-run-complete"` to `completedEventIds` and set:

   - `attemptMetrics.passingLedgerUsd=0.50660670`
   - `attemptMetrics.passingRequestCount=8`

   The final tape contains one full red write followed by seven blue-read/red-rewrite rows. `clockMin` remains `1`, preserving the front route’s setup-time benefit.

9. **Tail route: send job 1**  
   Preconditions: `cfg.prompts=="pointer"`, `clockMin==4`, and `completedEventIds` includes `"ev-l5-unattended-tail-placement"`.  
   Event: player clicks **Run 8** → `SEND_REQUEST { request:req-tail-1 }` → creates the shared `CacheEntry`, appends one `LedgerRow`, debits scalar `wallet`, and updates `attemptMetrics`.  
   Numbers: `writeTok=26,237`; other buckets `0`; cost `$0.09838875` (`C10`, `C1`, `C3`). `wallet` becomes `$0.45161125`.

10. **Tail route: send jobs 2–8**  
    Event: the queue dispatches seven ordered `SEND_REQUEST` actions → each `RESOLVE_PREFIX` reads the same live entry, refreshes `CacheEntry.lastTouchMin`, appends one `LedgerRow`, debits `wallet`, and updates `attemptMetrics.requestCount` and `attemptMetrics.spentUsd`.  
    Per request: `readTok=26,237`; other buckets `0`; cost `$0.00787110` (`C10`, `C12`, `C1`, `C3`). Seven reads cost `$0.05509770`; the complete tail run costs `$0.15348645` and leaves `$0.39651355`.

11. **Complete the tail run and reveal its evidence**  
    Event IDs: `l5-tail-run-complete`, then `ev-l5-reveal-tail`.  
    Event: after `req-tail-8` resolves, append `"l5-tail-run-complete"` to `completedEventIds` and set:

    - `attemptMetrics.passingLedgerUsd=0.15348645`
    - `attemptMetrics.passingRequestCount=8`

    Then dispatch `REVEAL_PREDICTION { promptId:"l5-tail-result", correctOptionId:"seven-full-reads" }`, append `"ev-l5-reveal-tail"` to `completedEventIds`, and reveal the complete one-red/seven-blue tape. `clockMin` remains `4`.

    Aha copy: **“Same work, different position. With the variation at the tail, all seven later agents reused the 26,237-token prefix.”** (`C8`, `C10`).

12. **Choose the causal explanation after route evidence**  
    Event: after `l5-front-run-complete` or `l5-tail-run-complete`, the player selects an explanation. The correct selection dispatches `ACK_EXPLANATION { explanationId:"l5-byte-identity" }`. Incorrect selections are neutral and retryable; they cause no economic mutation or score loss.

    Rule revealed only now: **“Cache reuse followed the identical bytes before the first change: an early change rewrote the suffix, while a trailing change preserved the shared prefix.”**

13. **Begin the required transfer before completion**  
    Event: after either completed run and `ACK_EXPLANATION("l5-byte-identity")` → `BEGIN_TRANSFER { challengeId:"l5-first-line-triage" }`. `phase` becomes `"transfer"` while `attemptResult` remains `null`.

    Copy: **“Pager duty. The on-call lead sees only each first line and must identify the ticket before assigning it.”**

    This changes the operational constraint before gate evaluation. The actual run has demonstrated either the direct setup-time benefit or the normalized request-cost benefit; the transfer now requires the first-line scanning benefit to become reducer-visible.

14. **Apply ticket-first placement to the human-triage context**  
    The same two layout controls appear without cache colors or prices. The player chooses:

    - `NORMALIZE_PROMPTS { templateId:"l5-triage-ticket-front", taskPointerPosition:"front" }`
    - `NORMALIZE_PROMPTS { templateId:"l5-triage-ticket-tail", taskPointerPosition:"tail" }`

    Both actions complete their preview rendering. Ticket-tail produces eight indistinguishable first-line strips and permits an immediate retry without sending a request. Ticket-first produces eight visibly distinct first-line strips and, in the transfer-phase event handler, atomically:

    - appends `"l5-triage-ticket-first"` to `completedTransferIds`;
    - appends `"ev-l5-triage-transfer"` to `completedEventIds`;
    - completes event `ev-l5-triage-transfer`.

    The transfer sends no request, so it changes no clock, wallet, ledger row, price, request count, passing subtotal, or cache entry.

15. **Complete the attempt after one qualified route and the transfer**  
    Event ID: `ev-l5-complete-attempt`.  
    Preconditions: one authored eight-request route qualifies, its causal explanation is acknowledged, `ev-l5-triage-transfer` is completed, and `completedTransferIds` includes `"l5-triage-ticket-first"`.  
    Event: `COMPLETE_ATTEMPT`. The canonical gate and star predicates evaluate against `clockMin`, `attemptMetrics`, `completedEventIds`, `acknowledgedExplanationIds`, and `completedTransferIds`. Completion copies all declared aggregates into immutable `attemptResult`.

    Front snapshot:

    - `attemptResult.spentUsd=0.50660670`
    - `attemptResult.requestCount=8`
    - `attemptResult.passingLedgerUsd=0.50660670`
    - `attemptResult.passingRequestCount=8`
    - `attemptResult.tailNormalizationActions=0`

    Tail snapshot:

    - `attemptResult.spentUsd=0.15348645`
    - `attemptResult.requestCount=8`
    - `attemptResult.passingLedgerUsd=0.15348645`
    - `attemptResult.passingRequestCount=8`
    - `attemptResult.tailNormalizationActions=1`

    `UI_RESULT_SCREEN` reads the completed branch snapshot.

16. **Unlock the informational comparison after completion**  
    Event: after `ev-l5-complete-attempt` → `REQUEST_COUNTERFACTUAL { comparisonId:"l5-front-v-tail" }`, then `REVEAL_COUNTERFACTUAL { comparisonId:"l5-front-v-tail" }`. The same-seed pair is projected off-screen only after the meaningful attempt.  
    Numbers: front total `$0.50660670` with `1` setup minute; tail total `$0.15348645` with `4` setup minutes; request-cost difference `$0.35312025`; setup-time difference `3` minutes (`C1`, `C3`, `C10`, `C11`; setup durations `[FICTION]`). This comparison is informational: it cannot dispatch `FREEZE_FAILURE` or mutate actual-attempt clock, wallet, ledger, completed markers, route subtotal, or `attemptResult`.

## 5. Level data

```ts
const level05: LevelDef = {
  id: "05-one-word",
  tier: 1,
  title: "Eight Tiny Fixes",
  objective:
    "Eight agents get eight small jobs. Make the run fit the budget.",
  concept: {
    id: "byte-identical-prefix",
    privateDesignerSummary:
      "Byte-identical ordered prefixes reuse; an early mismatch forces a suffix rewrite.",
    postRevealRule:
      "Keep shared prompt bytes identical at the front; put each task’s variation at the tail.",
    solutionVocabulary: [
      "one word",
      "byte-identical",
      "prefix",
      "normalize",
      "normalization",
      "front",
      "tail",
      "pointer",
      "same bytes"
    ]
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: []
  },
  prerequisiteConceptIds: [
    "prefix-reuse",
    "shared-subagent-window"
  ],

  unlocks: "prompts",
  introducedControls: ["prompts"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "width",
    "oneHourFlag",
    "keepWarm",
    "hook",
    "skills",
    "skillsMode",
    "memoryFiles",
    "mcp"
  ],

  scope: "session",
  seed: 5005,
  budgetUsd: 0.55,
  clockCapMin: 5,
  cfgOverride: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "varied",
    width: 8,
    oneHourFlag: false,
    keepWarm: false
  },
  scenario: "prompt-normalizer",
  scenarioData: {
    units: L5_JOB_SEEDS,
    contexts: L5_SUBAGENT_CONTEXT_SEEDS,
    prefixStacks: L5_PREFIX_STACK_SEEDS,
    allowedCfg: {
      prompts: ["varied", "pointer"]
    },
    fixtures: [
      {
        id: "l5-seed",
        label: "L5 deterministic seed",
        semanticRole: "PRNG seed for deterministic L5 replay",
        value: 5005,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l5-job-count",
        label: "job count",
        semanticRole: "number of jobs in the L5 dispatcher queue",
        value: 8,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l5-dispatch-width",
        label: "dispatch width",
        semanticRole: "maximum concurrently authored subagent jobs in L5",
        value: 8,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l5-template-choice-count",
        label: "template choice count",
        semanticRole: "number of selectable placement templates per L5 context",
        value: 2,
        unit: "count",
        tag: "[FICTION]"
      },
      {
        id: "l5-attempt-budget",
        label: "attempt budget",
        semanticRole: "initial L5 attempt wallet and cap",
        value: 0.55,
        unit: "usd",
        tag: "[FICTION]"
      },
      {
        id: "l5-clock-cap",
        label: "attempt clock cap",
        semanticRole: "maximum simulated minutes available to the L5 attempt",
        value: 5,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l5-front-direct-setup-min",
        label: "front direct setup duration",
        semanticRole: "elapsed simulated setup time for the direct greeting-first route",
        value: 1,
        unit: "min",
        tag: "[FICTION]"
      },
      {
        id: "l5-tail-normalization-setup-min",
        label: "tail normalization setup duration",
        semanticRole: "elapsed simulated normalization setup time for the pointer-tail route",
        value: 4,
        unit: "min",
        tag: "[FICTION]"
      }
    ],
    estimates: [
      {
        label: "template cards appear seconds",
        value: 0.4,
        tag: "[ESTIMATE]"
      },
      {
        label: "template prompt appears seconds",
        value: 0.8,
        tag: "[ESTIMATE]"
      },
      {
        label: "cold-open first interaction seconds",
        value: 1.5,
        tag: "[ESTIMATE]"
      }
    ]
  },

  failLesson: {
    bucket: "none",
    cite: "C8,C9",
    line:
      "Both routes finish; their different setup times and request ledgers expose the consequence of the first changed byte."
  },
  failureRules: [],
  checkpoints: [],

  gate: {
    predicateId: "l5-demonstrated-contextual-placement",
    evidenceRevealEventIds: [
      "ev-l5-reveal-front",
      "ev-l5-reveal-tail"
    ],
    postEvidenceActionRequirements: [
      {
        id: "l5-post-route-explanation",
        kind: "any",
        predicates: [
          {
            id: "l5-post-front-explanation",
            kind: "action-observed",
            actionType: "ACK_EXPLANATION",
            afterEventId: "ev-l5-reveal-front",
            match: { explanationId: "l5-byte-identity" }
          },
          {
            id: "l5-post-tail-explanation",
            kind: "action-observed",
            actionType: "ACK_EXPLANATION",
            afterEventId: "ev-l5-reveal-tail",
            match: { explanationId: "l5-byte-identity" }
          }
        ]
      },
      {
        id: "l5-post-route-triage-placement",
        kind: "any",
        predicates: [
          {
            id: "l5-post-front-triage-placement",
            kind: "action-observed",
            actionType: "NORMALIZE_PROMPTS",
            afterEventId: "ev-l5-reveal-front",
            match: {
              templateId: "l5-triage-ticket-front",
              taskPointerPosition: "front"
            }
          },
          {
            id: "l5-post-tail-triage-placement",
            kind: "action-observed",
            actionType: "NORMALIZE_PROMPTS",
            afterEventId: "ev-l5-reveal-tail",
            match: {
              templateId: "l5-triage-ticket-front",
              taskPointerPosition: "front"
            }
          }
        ]
      }
    ],
    behavioralRequirements: [
      {
        id: "l5-qualified-actual-route",
        kind: "any",
        predicates: [
          {
            id: "l5-qualified-tail-route",
            kind: "all",
            predicates: [
              {
                id: "l5-tail-run-finished",
                kind: "event-completed",
                eventId: "l5-tail-run-complete"
              },
              {
                id: "l5-tail-eight-requests",
                kind: "compare",
                path: "attemptMetrics.passingRequestCount",
                op: "eq",
                value: 8,
                observedAfterEventId: "l5-tail-run-complete"
              },
              {
                id: "l5-tail-spend-bound",
                kind: "compare",
                path: "attemptMetrics.passingLedgerUsd",
                op: "lte",
                value: 0.15348645,
                observedAfterEventId: "l5-tail-run-complete"
              }
            ]
          },
          {
            id: "l5-qualified-front-route",
            kind: "all",
            predicates: [
              {
                id: "l5-front-run-finished",
                kind: "event-completed",
                eventId: "l5-front-run-complete"
              },
              {
                id: "l5-front-eight-requests",
                kind: "compare",
                path: "attemptMetrics.passingRequestCount",
                op: "eq",
                value: 8,
                observedAfterEventId: "l5-front-run-complete"
              },
              {
                id: "l5-front-spend-bound",
                kind: "compare",
                path: "attemptMetrics.passingLedgerUsd",
                op: "lte",
                value: 0.50660670,
                observedAfterEventId: "l5-front-run-complete"
              }
            ]
          }
        ]
      },
      {
        id: "l5-route-evidence-revealed",
        kind: "any",
        predicates: [
          {
            id: "l5-front-evidence-visible",
            kind: "event-completed",
            eventId: "ev-l5-reveal-front"
          },
          {
            id: "l5-tail-evidence-visible",
            kind: "event-completed",
            eventId: "ev-l5-reveal-tail"
          }
        ]
      },
      {
        id: "l5-human-triage-completed",
        kind: "event-completed",
        eventId: "ev-l5-triage-transfer"
      }
    ],
    explanationRequirement: {
      id: "l5-byte-rule-acknowledged",
      kind: "includes",
      path: "acknowledgedExplanationIds",
      value: "l5-byte-identity"
    },
    transferRequirement: {
      id: "l5-ticket-first-transfer-recorded",
      kind: "includes",
      path: "completedTransferIds",
      value: "l5-triage-ticket-first",
      observedAfterEventId: "ev-l5-triage-transfer"
    }
  },

  pass(st: ReducerState): GateResult {
    const passingRowsResolved =
      st.attemptMetrics.passingRequestCount === 8;

    const tailRouteQualified =
      st.completedEventIds.includes("l5-tail-run-complete") &&
      passingRowsResolved &&
      st.attemptMetrics.passingLedgerUsd !== null &&
      st.attemptMetrics.passingLedgerUsd <= 0.15348645;

    const frontRouteQualified =
      st.completedEventIds.includes("l5-front-run-complete") &&
      passingRowsResolved &&
      st.attemptMetrics.passingLedgerUsd !== null &&
      st.attemptMetrics.passingLedgerUsd <= 0.50660670;

    const routeEvidenceRevealed =
      (tailRouteQualified &&
        st.completedEventIds.includes("ev-l5-reveal-tail")) ||
      (frontRouteQualified &&
        st.completedEventIds.includes("ev-l5-reveal-front"));

    const ruleAcknowledged =
      st.acknowledgedExplanationIds.includes("l5-byte-identity");
    const triageTransferCompleted =
      st.completedEventIds.includes("ev-l5-triage-transfer");
    const ticketFirstApplied =
      st.completedTransferIds.includes("l5-triage-ticket-first");

    const pass =
      (tailRouteQualified || frontRouteQualified) &&
      routeEvidenceRevealed &&
      ruleAcknowledged &&
      triageTransferCompleted &&
      ticketFirstApplied;

    return {
      pass,
      reason: pass
        ? "The player completed one eight-request route, identified the byte-boundary cause, and applied ticket-first placement to first-line triage."
        : "Complete either eight-request route, identify its cache consequence, then apply ticket-first placement to the first-line triage transfer.",
      evidence: [
        `frontRouteQualified=${String(frontRouteQualified)}`,
        `tailRouteQualified=${String(tailRouteQualified)}`,
        `passingRequestCount=${String(st.attemptMetrics.passingRequestCount)}`,
        `passingLedgerUsd=${String(st.attemptMetrics.passingLedgerUsd)}`,
        `clockMin=${String(st.clockMin)}`,
        `routeEvidence=${String(routeEvidenceRevealed)}`,
        `byteRuleAcknowledged=${String(ruleAcknowledged)}`,
        `triageTransfer=${String(triageTransferCompleted)}`,
        `ticketFirstApplied=${String(ticketFirstApplied)}`
      ]
    };
  },

  star2: {
    label: "Own the tradeoff",
    predicate: {
      id: "l5-route-benefit",
      kind: "any",
      predicates: [
        {
          id: "l5-tail-cost-benefit",
          kind: "all",
          predicates: [
            {
              id: "l5-star2-tail-complete",
              kind: "event-completed",
              eventId: "l5-tail-run-complete"
            },
            {
              id: "l5-star2-tail-spend",
              kind: "compare",
              path: "attemptMetrics.passingLedgerUsd",
              op: "lte",
              value: 0.15348645,
              observedAfterEventId: "l5-tail-run-complete"
            }
          ]
        },
        {
          id: "l5-front-time-benefit",
          kind: "all",
          predicates: [
            {
              id: "l5-star2-front-complete",
              kind: "event-completed",
              eventId: "l5-front-run-complete"
            },
            {
              id: "l5-star2-front-fast-setup",
              kind: "compare",
              path: "clockMin",
              op: "lte",
              value: 1,
              observedAfterEventId: "l5-front-run-complete"
            }
          ]
        }
      ]
    },
    reason:
      "Kept the tail route at its $0.15348645 spend bound or completed the front route after only one simulated setup minute."
  },

  star3: {
    label: "Context perfect",
    predicate: {
      id: "l5-context-perfect",
      kind: "all",
      predicates: [
        {
          id: "l5-star3-route-benefit",
          kind: "any",
          predicates: [
            {
              id: "l5-star3-tail-benefit",
              kind: "all",
              predicates: [
                {
                  id: "l5-star3-tail-complete",
                  kind: "event-completed",
                  eventId: "l5-tail-run-complete"
                },
                {
                  id: "l5-star3-tail-spend",
                  kind: "compare",
                  path: "attemptMetrics.passingLedgerUsd",
                  op: "lte",
                  value: 0.15348645,
                  observedAfterEventId: "l5-tail-run-complete"
                }
              ]
            },
            {
              id: "l5-star3-front-benefit",
              kind: "all",
              predicates: [
                {
                  id: "l5-star3-front-complete",
                  kind: "event-completed",
                  eventId: "l5-front-run-complete"
                },
                {
                  id: "l5-star3-front-fast-setup",
                  kind: "compare",
                  path: "clockMin",
                  op: "lte",
                  value: 1,
                  observedAfterEventId: "l5-front-run-complete"
                }
              ]
            }
          ]
        },
        {
          id: "l5-star3-exact-request-count",
          kind: "compare",
          path: "attemptMetrics.passingRequestCount",
          op: "eq",
          value: 8
        },
        {
          id: "l5-star3-triage-complete",
          kind: "event-completed",
          eventId: "ev-l5-triage-transfer"
        }
      ]
    },
    reason:
      "Captured the chosen route’s real benefit, sent exactly eight requests, and completed the first-line triage transfer."
  },

  referenceCfg: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "pointer",
    width: 8,
    oneHourFlag: false
  },
  antiCfg: {
    devModel: "sonnet",
    who: "subagent",
    prompts: "varied",
    width: 8,
    oneHourFlag: false
  },
  counterfactuals: [
    {
      id: "l5-front-v-tail",
      unlockAfterEventId: "ev-l5-complete-attempt",
      kind: "alternate-choice",
      cfg: {
        devModel: "sonnet",
        who: "subagent",
        prompts: "varied",
        width: 8,
        oneHourFlag: false
      },
      comparisonQuestion:
        "What did the other setup route trade for its request total?",
      revealCopy:
        "Greeting-first used three fewer setup minutes but cost $0.35312025 more across the same eight requests."
    }
  ],

  interactionPatterns: [
    "predict-before-reveal",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  learn: undefined
};
```

`L5_JOB_SEEDS`, `L5_SUBAGENT_CONTEXT_SEEDS`, and `L5_PREFIX_STACK_SEEDS` are level-local `ScenarioData` values containing the eight named `UnitSeed` jobs, eight isolated `ContextSeed` subagent contexts sharing `l5-pool`, and the two selectable `PrefixStackSeed` layouts described above. They introduce no additional economic constants.

The authored event mutations are authoritative:

- An accepted direct greeting-first action dispatches `ADVANCE { min:1 }` and completes `ev-l5-front-direct-setup`.
- An accepted unattended pointer-tail action dispatches `ADVANCE { min:4 }`, increments `attemptMetrics.tailNormalizationActions`, and completes `ev-l5-unattended-tail-placement` and `ev-l5-tail-normalization-setup`.
- Resolution of `req-front-8` appends `"l5-front-run-complete"` and snapshots `passingRequestCount=8` and `passingLedgerUsd=0.50660670`.
- Resolution of `req-tail-8` appends `"l5-tail-run-complete"` and snapshots `passingRequestCount=8` and `passingLedgerUsd=0.15348645`.
- An accepted transfer-context `NORMALIZE_PROMPTS` action with `templateId:"l5-triage-ticket-front"` appends `"l5-triage-ticket-first"` to `completedTransferIds` and `"ev-l5-triage-transfer"` to `completedEventIds`.
- The similarly shaped cold-open front action occurs before route evidence and uses a different `templateId`, so it cannot satisfy the transfer requirement.

## 6. Pricing walkthrough

All requests use Sonnet and `CACHE_TIER_5M`. Every authored row has `inputTok=0` and `outTok=0`. `PRICE_REQUEST` uses Sonnet’s `$0.30/M` cache-read rate and `$3.75/M` five-minute-write rate (`C1`, `C3`).

There is one authoritative pricing table:

| Route contribution | Requests | `readTok` | `writeTok` | Calculation | USD |
|---|---|---:|---:|---|---:|
| First request, either layout | `req-*-1` | `0` | `26,237` | `26,237 × 1.25 × $3/M` | `$0.09838875` |
| Tail layout, each warm request | `req-tail-2…8` | `26,237` | `0` | `26,237 × 0.1 × $3/M` | `$0.00787110` |
| Tail layout, seven-read subtotal | `7` requests | `183,659` | `0` | `7 × $0.00787110` | `$0.05509770` |
| **Tail-layout total** | `8` requests | `183,659` | `26,237` | first write + seven reads | **`$0.15348645`** |
| Front layout, each varied request | `req-front-2…8` | `11,602` | `14,623` | `(11,602 × 0.1 × $3/M) + (14,623 × 1.25 × $3/M)` | `$0.05831685` |
| Front layout, seven-varied subtotal | `7` requests | `81,214` | `102,361` | `7 × $0.05831685` | `$0.40821795` |
| **Front-layout total** | `8` requests | `81,214` | `128,598` | first write + seven varied requests | **`$0.50660670`** |
| **Request-cost difference** | same seed and jobs | — | — | `$0.50660670 − $0.15348645` | **`$0.35312025`** |

The identical-prefix count comes from `C10`; the varied read/rewrite split comes from `C11`; identity and invalidation behavior come from `C8` and `C9`. Tail placement saves `69.70%` of the front route’s request cost. Front placement instead saves `3` simulated setup minutes: `1` minute rather than `4`.

Both tables describe actual player routes. The front route dispatches all eight requests and records `$0.50660670`; the tail route dispatches all eight requests and records `$0.15348645`. The request-2 `$0.00787110` warm-read comparison on the front route is an uncharged local quote, not a ledger row. The pre-completion triage transfer sends no request and adds no pricing branch or competing total.

## 7. Tape sequence

`TapeSpec.rowSource:"ledger"`.

`UI_TAPE_RENDERER` uses the canonical `tapeWeight` model, including `outTok × 5` and every other priced bucket. This level’s authoritative requests have `outTok=0`, so no violet segment appears, but output remains part of the renderer contract.

### Player-chosen front group

1. `req-front-1`: red `write`, `26,237` tokens.
2. `req-front-2`: blue `read`, `11,602` tokens; mismatch notch; red `write`, `14,623` tokens. This is the front route’s aha request.
3. `req-front-3`: blue `read`, `11,602`; red `write`, `14,623`.
4. `req-front-4`: blue `read`, `11,602`; red `write`, `14,623`.
5. `req-front-5`: blue `read`, `11,602`; red `write`, `14,623`.
6. `req-front-6`: blue `read`, `11,602`; red `write`, `14,623`.
7. `req-front-7`: blue `read`, `11,602`; red `write`, `14,623`.
8. `req-front-8`: blue `read`, `11,602`; red `write`, `14,623`.

The request-2 frame synchronizes with `UI_PREFIX_STACK_VISUALIZER` in diff mode: a caret under the first mismatching greeting token, a red sweep labeled **“14,623 tokens invalidated,”** and the request-local comparison `$0.05831685` versus `$0.00787110`. The queue then completes rows 3–8 without freezing.

### Player-chosen tail group

1. `req-tail-1`: red `write`, `26,237`.
2. `req-tail-2`: blue `read`, `26,237`; this is the tail route’s aha request.
3. `req-tail-3`: blue `read`, `26,237`.
4. `req-tail-4`: blue `read`, `26,237`.
5. `req-tail-5`: blue `read`, `26,237`.
6. `req-tail-6`: blue `read`, `26,237`.
7. `req-tail-7`: blue `read`, `26,237`.
8. `req-tail-8`: blue `read`, `26,237`.

The complete blue run is gated by `l5-tail-result`. After commitment and resolution, the first blue row pulls a ripple through rows 3–8. Reduced-motion mode draws the same final one-red/seven-blue state immediately.

The pre-completion triage transfer renders template previews, not requests; it adds no ledger or tape row.

## 8. Prediction prompt(s)

### `l5-front-result`

**Question:** “Your greeting changes from ‘HEY’ to ‘HELLO’ near the front. After job 1 saves context, what will job 2 show?”

- `full-read` — “One full blue read.”
- `partial-rewrite` — “A blue start, then a red rewrite.”
- `full-write` — “One full red rewrite.”

Correctness remains visually neutral until `req-front-2` resolves. Correct option: `partial-rewrite`.

Post-reveal explanation: **“The first mismatch preserved 11,602 earlier tokens but invalidated the 14,623-token suffix.”** (`C11`)

Jobs 3–8 then resolve with the same split. The full front tape and `$0.50660670` subtotal are visible before the explanation control unlocks.

### `l5-tail-result`

**Question:** “The changing job words are at the tail. After the first red write, what will jobs 2–8 show?”

- `seven-full-reads` — “Seven full blue reads.”
- `seven-partial` — “Seven blue-and-red splits.”
- `seven-writes` — “Seven red rewrites.”

Correctness remains visually neutral until all eight requests resolve. Correct option: `seven-full-reads`.

Post-reveal explanation: **“The shared 26,237-token prefix stayed byte-identical, so every later warm spawn read it.”** (`C8`, `C10`)

Neither prediction option, prediction correctness, nor `COMMIT_PREDICTION` is gate or star evidence.

### Post-evidence explanation choice

Shown only after the selected route’s eight requests have resolved.

**Question:** “Why did the two layouts produce different request tapes?”

- `l5-byte-identity` — “Reuse stopped at the first changed bytes; moving the change later preserved more shared context.”
- `l5-tier-ignores-words` — “The five-minute tier ignores wording changes.”
- `l5-agents-share-everything` — “Subagents automatically share all context.”

The first option dispatches the gate-qualifying `ACK_EXPLANATION`. Wrong explanation choices remain retryable and never affect prediction scoring.

### Pre-completion transfer choice

Shown after the explanation and before `COMPLETE_ATTEMPT`.

**Situation:** “The on-call lead sees only each first line and must identify the ticket before assigning it.”

- `l5-triage-ticket-front` — “TICKET-LOGIN — review the repository…”
- `l5-triage-ticket-tail` — “Review the repository, follow project instructions…”

No correctness styling appears before selection. Both choices render their eight-strip preview. Ticket-first completes `ev-l5-triage-transfer` and records `"l5-triage-ticket-first"` in `completedTransferIds`; ticket-tail leaves eight indistinguishable previews and permits an immediate retry. This is an unpriced transfer action whose reducer marker affects gate passage.

## 9. Fail-state

This level has no punitive failure branch.

- `failureRules` is empty.
- Neither route dispatches `FREEZE_FAILURE`.
- Greeting-first resolves all eight actual requests and records `$0.50660670`.
- Pointer-tail resolves all eight actual requests and records `$0.15348645`.
- The front mismatch remains visible causal evidence, but it does not stop the queue.
- No `REWIND_TO_CHECKPOINT` action is required to complete either route.
- An incorrect post-evidence explanation or ticket-tail triage choice is neutral and immediately retryable without changing clock, wallet, ledger, cache, request count, or passing subtotal.
- The completion control remains disabled until one eight-request route qualifies, the explanation is acknowledged, and ticket-first triage is recorded.
- `REQUEST_COUNTERFACTUAL` and `REVEAL_COUNTERFACTUAL` remain informational and cannot dispatch `FREEZE_FAILURE`.

The live counter-pressure replaces local punishment: greeting-first preserves three simulated setup minutes but spends `$0.35312025` more on requests; pointer-tail spends three additional setup minutes to obtain the lower request total.

## 10. Gate & stars

`pass(st)` uses only canonical `ReducerState` paths and accepts either complete actual route:

- Tail arm:
  - `completedEventIds` includes `l5-tail-run-complete`.
  - `attemptMetrics.passingRequestCount==8`.
  - `attemptMetrics.passingLedgerUsd<=0.15348645`.
- Front arm:
  - `completedEventIds` includes `l5-front-run-complete`.
  - `attemptMetrics.passingRequestCount==8`.
  - `attemptMetrics.passingLedgerUsd<=0.50660670`.
- The selected route’s prediction evidence is revealed.
- `acknowledgedExplanationIds` includes `l5-byte-identity`.
- `completedEventIds` includes `ev-l5-triage-transfer`.
- `completedTransferIds` includes `l5-triage-ticket-first`.
- The qualifying explanation and triage `NORMALIZE_PROMPTS` action are observed after the selected route’s evidence reveal.
- No requirement inspects either prediction’s selected option or correctness.
- No requirement depends on budget alone.
- Final `cfg.prompts` is deliberately not gate evidence because the pre-completion triage action legitimately changes placement after the priced run.

`l5-front-run-complete` is emitted only after row 1 writes `26,237` and rows 2–8 each read `11,602` and rewrite `14,623`. `l5-tail-run-complete` is emitted only after row 1 writes `26,237` and rows 2–8 each read `26,237` and write `0`. `ev-l5-triage-transfer` and `l5-triage-ticket-first` are appended only by the accepted ticket-first action in the subsequent first-line-only transfer.

Stars:

- **1 star:** the behavioral gate passes through either qualified route.
- **2 stars — Own the tradeoff:** tail qualifies through `attemptMetrics.passingLedgerUsd<=0.15348645`; front qualifies through `clockMin<=1`.
- **3 stars — Context perfect:** the same route-specific benefit, `attemptMetrics.passingRequestCount==8`, and completed triage transfer.

Both routes can earn three stars. The front route earns its benefit through the one-minute setup bound even though it spends `$0.50660670`; the tail route earns its benefit through the `$0.15348645` spend bound even though setup advances the clock to minute `4`.

After `COMPLETE_ATTEMPT`, `UI_RESULT_SCREEN` reads the corresponding immutable `attemptResult` fields. The triage transfer occurs before that snapshot and affects passage through reducer-owned completion markers while remaining economically unpriced.

Result copy:

- Pass headline: **“Eight jobs. Two constraints handled.”**
- Fail headline: **“Finish the run, explain the tape, and fit the triage view.”**
- Front evidence: **“8 requests · 1 setup minute · $0.50660670 · triage complete”**
- Tail evidence: **“8 requests · 4 setup minutes · $0.15348645 · triage complete”**
- Continue: **“Next level”**
- Retry: **“Try another layout”**

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `l5-template-chosen` | Player dispatches the initial `NORMALIZE_PROMPTS` | **“Template locked. Now predict what the request tape will show.”** |
| `l5-front-setup` | `ADVANCE { min:1 }` completes | **“Direct setup complete · 1 minute.”** |
| `l5-tail-setup` | `ADVANCE { min:4 }` completes | **“Shared template normalized · 4 minutes.”** |
| `l5-first-write` | `req-front-1` or `req-tail-1` creates the shared entry | **“First agent saved 26,237 tokens. WRITE · $0.0984.”** |
| `l5-first-mismatch` | Actual `req-front-2` resolves with `PrefixResolution.invalidatedSuffixTok=14,623` | **“First mismatch: this request cost 7.41× a full warm read.”** |
| `l5-front-complete` | `l5-front-run-complete` | **“Eight requests complete · 1 setup minute · $0.50660670.”** |
| `l5-byte-identical` | First tail-layout full read resolves | **“Byte-identical: every saved byte before TASK matched.”** |
| `l5-seven-reads` | `l5-tail-run-complete` | **“Eight requests complete · 4 setup minutes · $0.15348645.”** |
| `l5-triage-fit` | `ev-l5-triage-transfer` completes before `COMPLETE_ATTEMPT` | **“Eight distinct first lines. This layout fits a human triage pass.”** |
| `l5-savings` | Post-completion counterfactual reveal opens | **“Tail normalization saved $0.35312025 in requests but used 3 more setup minutes.”** |

All toasts use polite announcements and dedupe per attempt. The transfer toast is gate-consequential but introduces no economic claim.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. No layout card is visually preselected, and the job queue cannot run until the player explicitly dispatches `NORMALIZE_PROMPTS`.
2. Both front and tail template cards are operable through pointer and keyboard paths and dispatch equivalent action shapes.
3. Front selection sets `cfg.prompts="varied"`; tail selection sets `cfg.prompts="pointer"`.
4. Front selection dispatches `ADVANCE { min:1 }` and completes `ev-l5-front-direct-setup`; tail selection dispatches `ADVANCE { min:4 }` and completes `ev-l5-tail-normalization-setup`.
5. The front route needs no text-normalization setup and reaches `clockMin=1`; the tail route performs one accepted normalization, increments `attemptMetrics.tailNormalizationActions`, and reaches `clockMin=4`.
6. The setup durations come from fixtures `l5-front-direct-setup-min` and `l5-tail-normalization-setup-min`; neither is stored in `scenarioData.estimates`.
7. No correct layout, cache color, reusable boundary, suffix count, price comparison, or savings delta appears before the relevant committed prediction and request resolution.
8. A reveal cannot execute before its corresponding prediction is committed.
9. A wrong prediction changes no score, stars, wallet, clock, gate result, completed event, or transfer marker.
10. The actual front path produces exactly eight priced requests, eight ledger rows, and eight tape rows.
11. `req-front-1` reports `writeTok=26,237` and costs exactly `$0.09838875` (`C10`, `C1`, `C3`).
12. Each of `req-front-2…8` reports `readTok=11,602`, `writeTok=14,623`, and exactly `$0.05831685` (`C11`, `C1`, `C3`).
13. The actual front route totals exactly `$0.50660670`, leaves `$0.04339330`, sets `passingRequestCount=8`, and sets `passingLedgerUsd=0.50660670`.
14. Resolution of `req-front-8` appends `l5-front-run-complete`.
15. The front request-2 frame visibly compares `$0.05831685` with the uncharged `$0.00787110` full-read quote.
16. No front request dispatches `FREEZE_FAILURE`; requests 3–8 always resolve after request 2.
17. The actual tail path produces exactly eight priced requests, eight ledger rows, and eight tape rows.
18. Tail row 1 writes `26,237`; rows 2–8 each read `26,237` and write `0` (`C10`).
19. The actual tail route totals exactly `$0.15348645`, leaves `$0.39651355`, sets `passingRequestCount=8`, and sets `passingLedgerUsd=0.15348645`.
20. Resolution of `req-tail-8` appends `l5-tail-run-complete`.
21. Every request yields exactly one ledger row and one tape row.
22. Every request cost is positive; no positive price displays as `$0.0000`.
23. Every ledger cost matches `PRICE_REQUEST` without internal rounding.
24. The live route counter-pressure is reducer-visible: front completes setup at minute `1` but spends `$0.50660670`; tail completes setup at minute `4` but spends `$0.15348645`.
25. The exact request-cost difference is `$0.35312025`; the exact setup-time difference is `3` minutes.
26. `title` and `objective` contain none of `concept.solutionVocabulary`: `one word`, `byte-identical`, `prefix`, `normalize`, `normalization`, `front`, `tail`, `pointer`, or `same bytes`.
27. The final front tape visibly contains one red row followed by seven blue/red split rows without hover.
28. The final tail tape visibly contains one red row followed by seven blue rows without hover.
29. `UI_TAPE_RENDERER` width and segment geometry use the canonical model containing `readTok`, `inputTok`, `writeTok`, and `outTok × 5`; this level’s zero output does not alter that contract.
30. Hover and keyboard focus expose every non-zero bucket equation through `UI_HOVER_PRICE_CALCULATOR`.
31. `CacheEntry.lastTouchMin` refreshes on each reused request (`C12`); all eight requests remain within `5m` (`C1`, `C27`).
32. The gate accepts the tail arm only with `l5-tail-run-complete`, eight requests, and `passingLedgerUsd<=0.15348645`.
33. The gate accepts the front arm only with `l5-front-run-complete`, eight requests, and `passingLedgerUsd<=0.50660670`.
34. The gate observes `ACK_EXPLANATION("l5-byte-identity")` after the selected route’s evidence; no prediction field appears in `pass(st)`, a star predicate, or a failure rule.
35. A wrong post-evidence explanation remains retryable without changing clock, wallet, ledger, cache, request count, passing subtotal, or score.
36. `BEGIN_TRANSFER("l5-first-line-triage")` occurs after selected-route evidence and before `COMPLETE_ATTEMPT`; `attemptResult` is still `null`.
37. Both triage controls are operable. Ticket-tail renders eight indistinguishable first-line previews and remains retryable.
38. Ticket-first renders eight distinct first-line previews, appends `l5-triage-ticket-first` to `completedTransferIds`, and completes `ev-l5-triage-transfer`.
39. The cold-open front action cannot satisfy the transfer marker because it occurs before route evidence and uses a different `templateId`.
40. The triage transfer sends no request and changes no clock, wallet, ledger, cache entry, price, passing subtotal, or request count.
41. `COMPLETE_ATTEMPT` remains disabled until either route arm qualifies, `l5-byte-identity` is acknowledged, `ev-l5-triage-transfer` is completed, and `completedTransferIds` includes `l5-triage-ticket-first`.
42. Star 2 and star 3 express explicit route alternatives: tail uses `attemptMetrics.passingLedgerUsd<=0.15348645`; front uses `clockMin<=1`.
43. Both the fixed-seed front action sequence and the fixed-seed tail action sequence can pass and earn three stars after the explanation and triage transfer.
44. Before completion, the gate and stars read only declared `ReducerState`, `clockMin`, `attemptMetrics`, `completedEventIds`, `acknowledgedExplanationIds`, and `completedTransferIds` fields; after completion, the result reads matching declared `attemptResult` snapshot fields.
45. Every `StatePredicate` uses a legal kind and, where present, one of `eq|neq|lt|lte|gt|gte`; no predicate uses `op:"contains"` or an undeclared `scenario.*` path.
46. `pass(st)` does not require final `cfg.prompts=="pointer"` because the gate-mandatory triage action legitimately changes placement after the priced run.
47. The non-qualifying anti action sequence—regardless of initial route—fails the behavioral gate if it omits the causal explanation or never records ticket-first triage; the front route itself is not a punitive failure.
48. Reduced-motion mode shows the same mismatch evidence, comparison prices, eight-row final tape, triage previews, route clock, and gate result.
49. `UI_COUNTERFACTUAL_OVERLAY` remains absent until `ev-l5-complete-attempt`, and its request/reveal actions cannot dispatch `FREEZE_FAILURE`.
50. Across unattended dispatch and first-line-only triage, neither placement is globally dominant: pointer-tail lowers request spend, greeting-first lowers setup time, and ticket-first satisfies the human scanning constraint.
51. All `[FICTION]` gameplay values—seed, job count, width, choice count, budget, clock cap, and both setup durations—are registered in `scenarioData.fixtures` with stable IDs, semantic roles, and units.
52. `scenarioData.estimates` contains presentation timing only.
53. Replay from the same seed and ordered actions yields byte-identical clock, state, ledger, wallet, completed markers, and result.
54. The level is winnable on either route using only the documented template cards, prediction controls, run control, explanation choice, and pre-completion transfer card.

## 13. Reference-bar justification

The screen puts a plausible dispatch choice under the cursor within `1.5s` and makes the player own a real tradeoff before any jobs queue. Greeting-first is operationally ready and commits only one simulated setup minute. Pointer-tail asks for four minutes of normalization. Neither card exposes its request-cost consequence before play.

Prediction locks curiosity in place, then all eight actual requests resolve on either route. Greeting-first produces one full write and seven partial rewrites for `$0.50660670`; pointer-tail produces one full write and seven full reads for `$0.15348645`. Nothing freezes or forces a rewind. The player sees the complete economic consequence of the route they deliberately chose while the clock preserves the opposing setup-time benefit.

Completion still requires a post-evidence causal explanation, so prediction correctness is never punitive and the gate measures demonstrated understanding. Before completion, the first-line triage transfer changes the operational constraint and requires ticket-first placement through real reducer evidence. The player therefore demonstrates that placement follows the active constraint rather than receiving a prose-only caveat after the result.

Both routes are valid and three-star completable: tail qualifies through its `$0.15348645` spend bound, while front qualifies through `clockMin<=1`. Only after `COMPLETE_ATTEMPT` does the informational comparison place the `$0.35312025` request-cost difference beside the three-minute setup difference. It cannot cause failure or change the completed attempt.

Assumptions and tradeoffs: the deterministic seed, eight-job queue, dispatch width, two template controls, `$0.55` wallet, `5m` attempt cap, one-minute direct setup, and four-minute normalization setup are distinct level fixtures marked `[FICTION]`; the cold-open timings are presentation-only `[ESTIMATE]` values. Token counts, pricing, identity, invalidation, TTL behavior, and all computed costs remain traced to `C1`, `C3`, and `C8–C12`.

