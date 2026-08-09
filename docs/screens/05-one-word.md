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
- `Checkpoint`
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
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `UI_COUNTERFACTUAL_OVERLAY`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`

## 3. Cold-open / narrative

`maxInstructionCards: 0`; first interaction by `1.5s` `[ESTIMATE]`.

| Time | Beat |
|---:|---|
| `0.0s` | Eight face-down job cards snap into an empty queue. Header: **“Eight tiny fixes. One agent template.”** |
| `0.4s` | Two uncolored template cards appear. **Greeting first:** “HEY/HELLO — review the repository, follow project instructions, and complete TASK.” **Ticket last:** “Review the repository, follow project instructions, and complete TASK: …” |
| `0.8s` | Copy: **“Pick the template the dispatcher should use.”** Neither card shows cache color, token counts, prices, or correctness. Greeting-first provides a conspicuous changing cue for human scanning; ticket-last keeps the opener visually uniform. |
| `1.5s` | Both template cards become selectable. The job queue remains disabled until the player explicitly chooses one. |

The visible wording is puzzle input; its cache consequence, reusable boundary, and cheaper run remain hidden until the chosen requests resolve. The later post-evidence transfer changes the operational constraint before completion: a first-line-only human triage pass requires the ticket cue first. Both contextual applications are reducer-visible gate evidence, so neither placement is presented as universally correct.

## 4. Exact event sequence

1. **Enter with no committed template**  
   Event: level mount → `ENTER_LEVEL { levelId:"05-one-word" }` → initializes `ReducerState`, scalar `wallet` and `budget`, `clockMin`, `attemptMetrics`, and eight `SUBAGENT_CONTEXT` instances sharing `sharedPrefixPoolId:"l5-pool"`. Candidate `PREFIX_STACK` objects exist, but neither card is committed or runnable.  
   Numbers: `8` jobs `[FICTION]`; `clockMin=0`; `budget=0.55` and `wallet=0.55` `[FICTION]`; model `sonnet`; tier `5m`; width `8` `[FICTION]`. The authored dispatch keeps all eight requests within the `5m` lifetime (`C1`, `C27`).

2. **Player chooses a template before jobs queue**  
   Event: player selects a template card → one of:

   - `NORMALIZE_PROMPTS { templateId:"l5-greeting-front", taskPointerPosition:"front" }`
   - `NORMALIZE_PROMPTS { templateId:"l5-ticket-tail", taskPointerPosition:"tail" }`

   The action commits the selected `PREFIX_STACK` identities and enables prediction. Front selection sets `cfg.prompts="varied"`; tail selection sets `cfg.prompts="pointer"`. The engine treats `pointer` as a non-varied shared spawn prompt, so it follows the measured identical-prefix branch. No request, ledger row, cache mutation, or price occurs.

   When the tail action is accepted in the unattended-dispatch context, its authored event mutation appends `"ev-l5-unattended-tail-placement"` to `completedEventIds`. This reducer-owned marker records the contextual placement at the action that makes the choice. It is preserved for the gate even if the later triage action sets `cfg.prompts` back to `"varied"`.

3. **Commit the route-specific prediction**  
   Event: the selected layout determines which unresolved prompt opens:

   - front → `OPEN_PREDICTION { promptId:"l5-front-result" }`
   - tail → `OPEN_PREDICTION { promptId:"l5-tail-result" }`

   The player dispatches `SELECT_PREDICTION`, then `COMMIT_PREDICTION` for that prompt. Selection styling stays neutral; correctness changes no score, stars, wallet, failure, or gate state.

4. **Checkpoint the chosen, predicted layout**  
   Event: prediction commitment → `CREATE_CHECKPOINT { checkpointId:"l5-before-run", reason:"decision" }` → records the boundary after the template choice and prediction. A failed front route can rewind here without replaying the cold-open or prediction.

5. **Start the chosen route**  
   Event: player clicks **Run 8**. The selected route determines the ordered `SEND_REQUEST` actions. A direct tail choice skips the front-only steps 6–9 and begins the passing tail branch at step 10. No reference or counterfactual request participates in the actual run.

6. **Front route: send job 1**  
   Preconditions: `cfg.prompts=="varied"`.  
   Event: `SEND_REQUEST { request:req-front-1 }` → `RESOLVE_PREFIX` creates the shared `CacheEntry`; one `LedgerRow` is appended; scalar `wallet`, `attemptMetrics`, `lastRequests`, and the first `PREFIX_STACK` mutate.  
   Numbers: `readTok=0`, `inputTok=0`, `writeTok=26,237`, `outTok=0`; cost `$0.09838875` (`C10`, `C1`, `C3`). `wallet` becomes `$0.45161125`. Tape row 1 is red.

7. **Front route: resolve the decisive harmful request and freeze locally**  
   Event ID: `ev-l5-reveal-front`.  
   Event: the player’s queued `SEND_REQUEST { request:req-front-2 }` resolves. `RESOLVE_PREFIX` finds the first mismatching `Token` at the greeting in `PB_INSTRUCTIONS`; `readTok=11,602`, `writeTok=14,623`, `inputTok=0`, `outTok=0`; cost `$0.05831685` (`C11`, `C1`, `C3`). `wallet` becomes `$0.39329440`. `UI_PREFIX_STACK_VISUALIZER` enters `mode:"diff"` only after resolution.

   The same request-resolved event reveals `l5-front-result` and renders the local uncharged alternative quote `$0.00787110`, the price of a full warm read of `26,237` tokens. Once both prices are visible, the attached `l5-early-mismatch` rule immediately dispatches:

   ```ts
   FREEZE_FAILURE {
     failure: {
       failureId: "l5-early-mismatch",
       causeCode: "early-prompt-mismatch",
       message:
         "'HELLO' mismatched near the front. Job 2 rewrote 14,623 tokens and cost 7.41× a full warm read.",
       checkpointId: "l5-before-run"
     }
   }
   ```

   The selected request costs `$0.05044575` more, or `7.41×` the valid request-local alternative (`C1`, `C3`, `C10`, `C11`). Jobs 3–8 are not dispatched, priced, or rendered. The freeze originates only from the actual harmful `req-front-2` event, never from a full-attempt total, reference run, or counterfactual reveal.

8. **Rewind the failed front choice**  
   Event: player clicks **Move the word** → `REWIND_TO_CHECKPOINT { checkpointId:"l5-before-run" }` → deterministically restores the pre-run cache, empty ledger, `clockMin`, `attemptMetrics`, and `$0.55` wallet while retaining the committed front prediction because it precedes the checkpoint. The selected layout remains editable.

9. **Apply the post-evidence remediation and predict again**  
   Event: player moves **TASK** to the trailing slot → `NORMALIZE_PROMPTS { templateId:"l5-ticket-tail", taskPointerPosition:"tail" }` → sets `cfg.prompts="pointer"`, makes the shared `26,237`-token prefix byte-identical, increments `attemptMetrics.tailNormalizationActions`, and appends `"ev-l5-unattended-tail-placement"` to `completedEventIds`. No pricing occurs.

   Exact tail task pointers:

   - **“TASK: fix login redirect”**
   - **“TASK: fix logout redirect”**
   - **“TASK: add reset-password route”**
   - **“TASK: repair session refresh”**
   - **“TASK: add auth error test”**
   - **“TASK: fix callback state check”**
   - **“TASK: update access guard”**
   - **“TASK: verify sign-out cleanup.”**

   Task labels and count are `[FICTION]`.

   Event: player clicks **Test layout** → `OPEN_PREDICTION`, `SELECT_PREDICTION`, and `COMMIT_PREDICTION { promptId:"l5-tail-result" }`, followed by `CREATE_CHECKPOINT { checkpointId:"l5-before-tail-run", reason:"prediction" }`. The tail run cannot execute before commitment.

10. **Tail route: send job 1**  
    Preconditions: `cfg.prompts=="pointer"` and `completedEventIds` includes `"ev-l5-unattended-tail-placement"`. This branch is reached either directly from the initial tail choice or after step 9 remediation.  
    Event: player clicks **Run 8** → `SEND_REQUEST { request:req-tail-1 }` → creates the shared `CacheEntry`, appends one `LedgerRow`, debits scalar `wallet`, and updates `attemptMetrics`.  
    Numbers: `writeTok=26,237`; other buckets `0`; cost `$0.09838875` (`C10`, `C1`, `C3`).

11. **Tail route: send jobs 2–8**  
    Event: the queue dispatches seven ordered `SEND_REQUEST` actions → each `RESOLVE_PREFIX` reads the same live entry, refreshes `CacheEntry.lastTouchMin`, appends one `LedgerRow`, debits `wallet`, and updates `attemptMetrics.requestCount` and `attemptMetrics.spentUsd`.  
    Per request: `readTok=26,237`; other buckets `0`; cost `$0.00787110` (`C10`, `C12`, `C1`, `C3`). Seven reads cost `$0.05509770`; the passing run costs `$0.15348645` and leaves `$0.39651355`.

    When request 8 resolves, the reducer sets `attemptMetrics.passingLedgerUsd=0.15348645` and `attemptMetrics.passingRequestCount=8`. A player who selected the tail layout initially reaches this authoritative run without a failure.

12. **Reveal the tail evidence**  
    Event ID: `ev-l5-reveal-tail`.  
    Event: request 8 settles → `REVEAL_PREDICTION { promptId:"l5-tail-result", correctOptionId:"seven-full-reads" }` → records `ev-l5-reveal-tail` in `completedEventIds` and reveals the complete one-red/seven-blue tape.  
    Aha copy: **“Same work, different position. With the variation at the tail, all seven later agents reused the 26,237-token prefix.”** (`C8`, `C10`).

13. **Choose the causal explanation after evidence**  
    Event: the player selects an explanation. The correct selection dispatches `ACK_EXPLANATION { explanationId:"l5-byte-identity" }`. Incorrect selections are neutral and retryable; they cause no economic mutation or score loss.  
    Rule revealed only now: **“The bytes before TASK stayed identical, so every later request could read the saved prefix.”**

14. **Begin the required transfer before completion**  
    Event: after `ev-l5-reveal-tail` and `ACK_EXPLANATION("l5-byte-identity")` → `BEGIN_TRANSFER { challengeId:"l5-first-line-triage" }`. `phase` becomes `"transfer"` while `attemptResult` remains `null`.

    Copy: **“Pager duty. The on-call lead sees only each first line and must identify the ticket before assigning it.”**

    This changes the operational constraint before gate evaluation. The unattended dispatch has already demonstrated the tail benefit through lower `spentUsd`; the transfer now requires the opposing first-line scanning benefit to become reducer-visible.

15. **Apply ticket-first placement to the human-triage context**  
    The same two layout controls appear without cache colors or prices. The player chooses:

    - `NORMALIZE_PROMPTS { templateId:"l5-triage-ticket-front", taskPointerPosition:"front" }`
    - `NORMALIZE_PROMPTS { templateId:"l5-triage-ticket-tail", taskPointerPosition:"tail" }`

    Both actions complete their preview rendering. Ticket-tail produces eight indistinguishable first-line strips and permits an immediate retry without sending a request. Ticket-first produces eight visibly distinct first-line strips and, in the transfer-phase event handler, atomically:

    - appends `"l5-triage-ticket-first"` to `completedTransferIds`;
    - appends `"ev-l5-triage-transfer"` to `completedEventIds`;
    - completes event `ev-l5-triage-transfer`.

    The transfer sends no request, so it changes no wallet, ledger row, price, request count, passing subtotal, or cache entry. Its consequence is nevertheless real: both `"ev-l5-unattended-tail-placement"` and `"l5-triage-ticket-first"`, plus completion of `ev-l5-triage-transfer`, are required by `pass(st)`.

16. **Complete the attempt only after both contextual applications**  
    Event ID: `ev-l5-complete-attempt`.  
    Preconditions: the causal explanation is acknowledged, `ev-l5-unattended-tail-placement` and `ev-l5-triage-transfer` are completed, and `completedTransferIds` includes `"l5-triage-ticket-first"`.  
    Event: `COMPLETE_ATTEMPT`. The canonical gate and star predicates evaluate against `attemptMetrics`, `completedEventIds`, `acknowledgedExplanationIds`, and `completedTransferIds`. Completion copies all declared aggregates into immutable `attemptResult`, including:

    - `attemptResult.spentUsd=0.15348645`
    - `attemptResult.requestCount=8`
    - `attemptResult.passingLedgerUsd=0.15348645`
    - `attemptResult.passingRequestCount=8`
    - the branch’s `attemptResult.tailNormalizationActions`

    `UI_RESULT_SCREEN` reads the completed snapshot.

17. **Unlock the informational comparison after completion**  
    Event: after `ev-l5-complete-attempt` → `REQUEST_COUNTERFACTUAL { comparisonId:"l5-front-v-tail" }`, then `REVEAL_COUNTERFACTUAL { comparisonId:"l5-front-v-tail" }`. The same-seed eight-job anti-pattern is projected off-screen only after the meaningful attempt.  
    Numbers: projected front-varied total `$0.50660670`; pointer-tail total `$0.15348645`; savings `$0.35312025` (`C1`, `C3`, `C10`, `C11`). This comparison is informational: it cannot dispatch `FREEZE_FAILURE` or mutate actual-attempt wallet, ledger, failure state, completed markers, or `attemptResult`.

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
    cite: "C9",
    line:
      "A mismatch near the start preserves the earlier read but forces the cacheable suffix to be rewritten."
  },
  failureRules: [
    {
      id: "l5-early-mismatch",
      predicate: {
        id: "l5-front-second-request",
        kind: "all",
        predicates: [
          {
            id: "l5-front-mode-active",
            kind: "compare",
            path: "cfg.prompts",
            op: "eq",
            value: "varied"
          },
          {
            id: "l5-two-front-requests-priced",
            kind: "compare",
            path: "attemptMetrics.requestCount",
            op: "eq",
            value: 2
          }
        ]
      },
      decisiveEventId: "ev-l5-reveal-front",
      causeCode: "early-prompt-mismatch",
      message:
        "'HELLO' mismatched near the front. Job 2 rewrote 14,623 tokens and cost 7.41× a full warm read.",
      checkpointId: "l5-before-run",
      highlightObjectIds: [
        "req-front-2",
        "l5-front-mismatch-marker",
        "l5-front-comparison-chip"
      ],
      actualUsd: 0.05831685,
      validAlternativeUsd: 0.00787110
    }
  ],
  checkpoints: [
    {
      id: "l5-before-run",
      createBeforeEventId: "ev-l5-reveal-front",
      reason: "decision",
      resumeLabel: "Move the word"
    },
    {
      id: "l5-before-tail-run",
      createBeforeEventId: "ev-l5-reveal-tail",
      reason: "prediction",
      resumeLabel: "Test the layout again"
    }
  ],

  gate: {
    predicateId: "l5-demonstrated-contextual-placement",
    evidenceRevealEventIds: ["ev-l5-reveal-tail"],
    postEvidenceActionRequirements: [
      {
        id: "l5-post-evidence-explanation",
        kind: "action-observed",
        actionType: "ACK_EXPLANATION",
        afterEventId: "ev-l5-reveal-tail",
        match: { explanationId: "l5-byte-identity" }
      },
      {
        id: "l5-post-evidence-triage-placement",
        kind: "action-observed",
        actionType: "NORMALIZE_PROMPTS",
        afterEventId: "ev-l5-reveal-tail",
        match: {
          templateId: "l5-triage-ticket-front",
          taskPointerPosition: "front"
        }
      }
    ],
    behavioralRequirements: [
      {
        id: "l5-unattended-tail-applied",
        kind: "event-completed",
        eventId: "ev-l5-unattended-tail-placement"
      },
      {
        id: "l5-eight-passing-rows",
        kind: "compare",
        path: "attemptMetrics.passingRequestCount",
        op: "eq",
        value: 8,
        observedAfterEventId: "ev-l5-reveal-tail"
      },
      {
        id: "l5-reference-passing-subtotal",
        kind: "compare",
        path: "attemptMetrics.passingLedgerUsd",
        op: "lte",
        value: 0.15348645,
        observedAfterEventId: "ev-l5-reveal-tail"
      },
      {
        id: "l5-one-write-seven-reads",
        kind: "event-completed",
        eventId: "ev-l5-reveal-tail"
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
      value: "l5-byte-identity",
      observedAfterEventId: "ev-l5-reveal-tail"
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
    const unattendedTailPlaced =
      st.completedEventIds.includes("ev-l5-unattended-tail-placement");
    const passingRowsResolved =
      st.attemptMetrics.passingRequestCount === 8;
    const passingSubtotalAtReference =
      st.attemptMetrics.passingLedgerUsd !== null &&
      st.attemptMetrics.passingLedgerUsd <= 0.15348645;
    const tailEvidenceRevealed =
      st.completedEventIds.includes("ev-l5-reveal-tail");
    const ruleAcknowledged =
      st.acknowledgedExplanationIds.includes("l5-byte-identity");
    const triageTransferCompleted =
      st.completedEventIds.includes("ev-l5-triage-transfer");
    const ticketFirstApplied =
      st.completedTransferIds.includes("l5-triage-ticket-first");

    const pass =
      unattendedTailPlaced &&
      passingRowsResolved &&
      passingSubtotalAtReference &&
      tailEvidenceRevealed &&
      ruleAcknowledged &&
      triageTransferCompleted &&
      ticketFirstApplied;

    return {
      pass,
      reason: pass
        ? "The player used tail placement for repeated dispatch and ticket-first placement for first-line triage."
        : "Complete the efficient repeated run, identify its cause, then apply ticket-first placement to the first-line triage transfer.",
      evidence: [
        `unattendedTailPlaced=${String(unattendedTailPlaced)}`,
        `passingRequestCount=${String(st.attemptMetrics.passingRequestCount)}`,
        `passingLedgerUsd=${String(st.attemptMetrics.passingLedgerUsd)}`,
        `tailEvidence=${String(tailEvidenceRevealed)}`,
        `byteRuleAcknowledged=${String(ruleAcknowledged)}`,
        `triageTransfer=${String(triageTransferCompleted)}`,
        `ticketFirstApplied=${String(ticketFirstApplied)}`
      ]
    };
  },

  star2: {
    label: "Clean template",
    predicate: {
      id: "l5-single-tail-normalization",
      kind: "compare",
      path: "attemptMetrics.tailNormalizationActions",
      op: "lte",
      value: 1,
      observedAfterEventId: "ev-l5-triage-transfer"
    },
    reason:
      "Reached the reusable unattended layout with at most one accepted tail-normalization action."
  },
  star3: {
    label: "Byte perfect",
    predicate: {
      id: "l5-byte-perfect",
      kind: "all",
      predicates: [
        {
          id: "l5-star3-clean-template",
          kind: "compare",
          path: "attemptMetrics.tailNormalizationActions",
          op: "lte",
          value: 1,
          observedAfterEventId: "ev-l5-triage-transfer"
        },
        {
          id: "l5-cost-at-reference",
          kind: "compare",
          path: "attemptMetrics.passingLedgerUsd",
          op: "lte",
          value: 0.15348645,
          observedAfterEventId: "ev-l5-reveal-tail"
        },
        {
          id: "l5-no-extra-request",
          kind: "compare",
          path: "attemptMetrics.passingRequestCount",
          op: "eq",
          value: 8,
          observedAfterEventId: "ev-l5-reveal-tail"
        },
        {
          id: "l5-star3-triage-complete",
          kind: "event-completed",
          eventId: "ev-l5-triage-transfer"
        }
      ]
    },
    reason:
      "Used one write and seven full reads, spent no more than the reference subtotal, sent no extra request, and completed the triage transfer."
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
      kind: "anti-pattern",
      cfg: {
        devModel: "sonnet",
        who: "subagent",
        prompts: "varied",
        width: 8,
        oneHourFlag: false
      },
      comparisonQuestion:
        "What would the earlier variation make seven later agents rewrite?",
      revealCopy:
        "Projected across the same eight jobs, the early mismatch would force a 14,623-token rewrite on each later request."
    }
  ],

  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt"
  ],

  learn: undefined
};
```

`L5_JOB_SEEDS`, `L5_SUBAGENT_CONTEXT_SEEDS`, and `L5_PREFIX_STACK_SEEDS` are level-local `ScenarioData` values containing the eight named `UnitSeed` jobs, eight isolated `ContextSeed` subagent contexts sharing `l5-pool`, and the two selectable `PrefixStackSeed` layouts described above. They introduce no additional economic constants.

The authored event mutations are authoritative:

- An accepted unattended-context tail `NORMALIZE_PROMPTS` action appends `"ev-l5-unattended-tail-placement"` to `completedEventIds`.
- An accepted transfer-context `NORMALIZE_PROMPTS` action with `templateId:"l5-triage-ticket-front"` appends `"l5-triage-ticket-first"` to `completedTransferIds` and `"ev-l5-triage-transfer"` to `completedEventIds`.
- The similarly shaped cold-open front action occurs before `ev-l5-reveal-tail` and cannot satisfy the transfer requirement.

## 6. Pricing walkthrough

All requests use Sonnet and `CACHE_TIER_5M`. Every authored row has `inputTok=0` and `outTok=0`. `PRICE_REQUEST` uses Sonnet’s `$0.30/M` cache-read rate and `$3.75/M` five-minute-write rate (`C1`, `C3`).

There is one authoritative pricing table:

| Route contribution | Requests | `readTok` | `writeTok` | Calculation | USD |
|---|---|---:|---:|---|---:|
| First request, either layout | `req-*-1` | `0` | `26,237` | `26,237 × 1.25 × $3/M` | `$0.09838875` |
| Tail layout, each warm request | `req-tail-2…8` | `26,237` | `0` | `26,237 × 0.1 × $3/M` | `$0.00787110` |
| Tail layout, seven-read subtotal | `7` requests | `183,659` | `0` | `7 × $0.00787110` | `$0.05509770` |
| **Tail-layout reference total** | `8` requests | `183,659` | `26,237` | first write + seven reads | **`$0.15348645`** |
| Front layout, each varied request | `req-front-2…8` | `11,602` | `14,623` | `(11,602 × 0.1 × $3/M) + (14,623 × 1.25 × $3/M)` | `$0.05831685` |
| Front layout, seven-varied projection | `7` projected requests | `81,214` | `102,361` | `7 × $0.05831685` | `$0.40821795` |
| **Front-layout anti-pattern projection** | `8` projected requests | `81,214` | `128,598` | first write + seven varied requests | **`$0.50660670`** |
| **Reference savings** | same seed and jobs | — | — | `$0.50660670 − $0.15348645` | **`$0.35312025`** |

The identical-prefix count comes from `C10`; the varied read/rewrite split comes from `C11`; identity and invalidation behavior come from `C8` and `C9`. The reference saves `69.70%` of the projected anti-pattern total.

On the actual harmful front branch, only `req-front-1` and `req-front-2` are dispatched. The request-local `$0.00787110` alternative is an uncharged quote rendered beside `req-front-2`; it is not a ledger row. The seven-request front subtotal and eight-request front total exist only in the post-completion informational projection. The pre-completion triage transfer sends no request and adds no pricing branch or competing total.

## 7. Tape sequence

`TapeSpec.rowSource:"ledger"`.

`UI_TAPE_RENDERER` uses the canonical `tapeWeight` model, including `outTok × 5` and every other priced bucket. This level’s authoritative requests have `outTok=0`, so no violet segment appears, but output remains part of the renderer contract.

### Player-chosen front failure group

1. `req-front-1`: red `write`, `26,237` tokens.
2. `req-front-2`: blue `read`, `11,602` tokens; mismatch notch; red `write`, `14,623` tokens.
3. Freeze immediately; jobs 3–8 are neither priced nor rendered.

The decisive request frame synchronizes row 2 with `UI_PREFIX_STACK_VISUALIZER` in diff mode: a caret under the first mismatching greeting token, a red sweep labeled **“14,623 tokens invalidated,”** and the economically true request-local comparison `$0.05831685` versus `$0.00787110`.

### Passing tail group

1. `req-tail-1`: red `write`, `26,237`.
2. `req-tail-2`: blue `read`, `26,237`; this is `ahaRequestId`.
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

### `l5-tail-result`

**Question:** “The changing job words are at the tail. After the first red write, what will jobs 2–8 show?”

- `seven-full-reads` — “Seven full blue reads.”
- `seven-partial` — “Seven blue-and-red splits.”
- `seven-writes` — “Seven red rewrites.”

Correctness remains visually neutral until all eight requests resolve. Correct option: `seven-full-reads`.

Post-reveal explanation: **“The shared 26,237-token prefix stayed byte-identical, so every later warm spawn read it.”** (`C8`, `C10`)

Neither prediction option, prediction correctness, nor `COMMIT_PREDICTION` is gate or star evidence.

### Post-evidence explanation choice

Shown only after `ev-l5-reveal-tail`.

**Question:** “What made the seven blue reads possible?”

- `l5-byte-identity` — “The bytes before TASK stayed identical.”
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

- **Reachability:** only the player’s explicit greeting-first choice, represented by `cfg.prompts=="varied"`, can reach this failure.
- **Failure rule ID:** `l5-early-mismatch`
- **Decisive event:** resolution of `req-front-2` in the player’s actual attempt at `ev-l5-reveal-front`.
- **Legal failure predicate:**

  ```ts
  {
    id: "l5-front-second-request",
    kind: "all",
    predicates: [
      {
        id: "l5-front-mode-active",
        kind: "compare",
        path: "cfg.prompts",
        op: "eq",
        value: "varied"
      },
      {
        id: "l5-two-front-requests-priced",
        kind: "compare",
        path: "attemptMetrics.requestCount",
        op: "eq",
        value: 2
      }
    ]
  }
  ```

- **Deterministic resolved evidence:** `req-front-2` has `readTok=11,602`, `writeTok=14,623`, and `PrefixResolution.invalidatedSuffixTok=14,623` under `C11`.
- **Actual decisive-request cost:** `$0.05831685`.
- **Valid request-local tail-layout alternative:** `$0.00787110`.
- **Visible margin:** `$0.05044575`; the punished request is `7.41×` the valid alternative (`C1`, `C3`, `C10`, `C11`).
- **Freeze target:** request 2’s mismatch marker, red suffix, comparison chip, scalar `wallet`, and `clockMin`.
- **One-line causal message:** **“‘HELLO’ mismatched near the front. Job 2 rewrote 14,623 tokens and cost 7.41× a full warm read.”**
- **Rewind control label:** **“Move the word”**
- **Rewind behavior:** `REWIND_TO_CHECKPOINT { checkpointId:"l5-before-run" }`; remove the two failed-run ledger rows and cache mutation, restore `$0.55`, restore attempt aggregates, preserve the completed prediction, and focus the selected template editor. The cold-open and template choice do not replay.
- **Locality:** `FREEZE_FAILURE` is dispatched during processing of the actual `req-front-2` request event. Requests 3–8 are not dispatched on the frozen branch.
- **Counterfactual exclusion:** `l5-early-mismatch` cannot attach to `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, `l5-front-v-tail`, `ev-l5-triage-transfer`, or `ev-l5-complete-attempt`.

## 10. Gate & stars

`pass(st)` uses only canonical `ReducerState` paths and requires both contextual placements:

- `completedEventIds` includes `ev-l5-unattended-tail-placement`.
- `attemptMetrics.passingRequestCount==8`.
- `attemptMetrics.passingLedgerUsd<=0.15348645`.
- `completedEventIds` includes `ev-l5-reveal-tail`.
- `acknowledgedExplanationIds` includes `l5-byte-identity`.
- `completedEventIds` includes `ev-l5-triage-transfer`.
- `completedTransferIds` includes `l5-triage-ticket-first`.
- The triage `NORMALIZE_PROMPTS` action is observed after `ev-l5-reveal-tail`.
- No requirement inspects either prediction’s selected option or correctness.
- No requirement depends on budget alone.
- Final `cfg.prompts` is deliberately not gate evidence because the pre-completion triage action legitimately changes it after the passing unattended run.

`ev-l5-unattended-tail-placement` is appended by the accepted tail-placement action in the unattended dispatcher. `ev-l5-reveal-tail` is emitted only after the authored request shape resolves: row 1 writes `26,237`; rows 2–8 each read `26,237` and write `0`. `ev-l5-triage-transfer` and `l5-triage-ticket-first` are appended only by the accepted ticket-first action in the subsequent first-line-only transfer.

Stars:

- **1 star:** the behavioral gate passes, including both contextual applications.
- **2 stars — Clean template:** pass with `attemptMetrics.tailNormalizationActions<=1`.
- **3 stars — Byte perfect:** 2-star normalization discipline, `attemptMetrics.passingLedgerUsd<=$0.15348645`, `attemptMetrics.passingRequestCount==8`, and completed triage transfer.

After `COMPLETE_ATTEMPT`, `UI_RESULT_SCREEN` reads the corresponding immutable `attemptResult` fields. The triage transfer occurs before that snapshot and affects passage through reducer-owned completion markers, while remaining economically unpriced.

Result copy:

- Pass headline: **“Eight jobs. Two contexts handled.”**
- Fail headline: **“Apply the layout to both operating constraints.”**
- Evidence: **“1 write · 7 reads · $0.15348645 · triage complete”**
- Continue: **“Next level”**
- Retry: **“Try another layout”**

## 11. Toasts

| id | Trigger | Exact copy |
|---|---|---|
| `l5-template-chosen` | Player dispatches the initial `NORMALIZE_PROMPTS` | **“Template locked. Now predict what job 2 will reuse.”** |
| `l5-first-write` | `req-front-1` or `req-tail-1` creates the shared entry | **“First agent saved 26,237 tokens. WRITE · $0.0984.”** |
| `l5-first-mismatch` | Actual `req-front-2` resolves with `PrefixResolution.invalidatedSuffixTok=14,623` | **“First mismatch: job 2 cost 7.41× a full warm read.”** |
| `l5-byte-identical` | First tail-layout full read resolves | **“Byte-identical: every saved byte before TASK matched.”** |
| `l5-seven-reads` | Passing request 8 settles | **“Seven warm agents reused the full 26,237-token prefix.”** |
| `l5-triage-fit` | `ev-l5-triage-transfer` completes before `COMPLETE_ATTEMPT` | **“Eight distinct first lines. This layout fits a human triage pass.”** |
| `l5-savings` | Post-completion counterfactual reveal opens | **“Moving the variation saved $0.35312025 across eight jobs.”** |

`l5-first-mismatch` is assertive and persistent during freeze. All other toasts use polite announcements and dedupe per attempt. The transfer toast is gate-consequential but introduces no economic claim.

## 12. QA gate

Real-browser pointer and keyboard click-through must assert:

1. No layout card is visually preselected, and the job queue cannot run until the player explicitly dispatches `NORMALIZE_PROMPTS`.
2. Both front and tail template cards are operable through pointer and keyboard paths and dispatch equivalent action shapes.
3. Front selection sets `cfg.prompts="varied"`; tail selection sets `cfg.prompts="pointer"`.
4. An accepted unattended tail action appends `ev-l5-unattended-tail-placement` to `completedEventIds`; the initial front action does not.
5. No correct layout, cache color, reusable boundary, suffix count, price comparison, or savings delta appears before the relevant committed prediction and request resolution.
6. Choosing the front card is the action that makes `l5-early-mismatch` reachable; the failure is neither scripted nor unavoidable.
7. Choosing the tail card initially bypasses the failure and remains winnable.
8. A reveal cannot execute before its corresponding prediction is committed.
9. A wrong prediction changes no score, stars, wallet, failure predicate, gate result, completed event, or transfer marker.
10. The actual front path renders exactly two priced requests, two ledger rows, and two tape rows before freezing.
11. `req-front-2` reports `readTok=11,602`, `writeTok=14,623`, and exactly `$0.05831685` (`C11`, `C1`, `C3`).
12. The decisive request frame visibly compares `$0.05831685` with the uncharged `$0.00787110` full-read alternative; `actualUsd > validAlternativeUsd`.
13. `FREEZE_FAILURE` dispatches from the actual `req-front-2` request event, before any request 3 and before `COMPLETE_ATTEMPT`.
14. Failure exposes **Move the word** immediately.
15. Rewind restores the checkpoint hash, `$0.55` scalar wallet, empty ledger, pre-run `attemptMetrics`, editable layout, and already committed prediction.
16. The post-failure tail normalization occurs after `ev-l5-reveal-front` and appends `ev-l5-unattended-tail-placement`.
17. Passing produces exactly eight requests, eight ledger rows, and eight tape rows in the specified order.
18. Passing row 1 writes `26,237`; rows 2–8 each read `26,237` and write `0` (`C10`).
19. Every request yields exactly one ledger row and one tape row.
20. Every request cost is positive; no positive price displays as `$0.0000`.
21. Every ledger cost matches `PRICE_REQUEST` without internal rounding.
22. The reference run totals `$0.15348645`; the informational anti-pattern projection totals `$0.50660670`; no competing actual-attempt priced total exists.
23. The frozen front branch never dispatches projected requests 3–8.
24. `title` and `objective` contain none of `concept.solutionVocabulary`: `one word`, `byte-identical`, `prefix`, `normalize`, `normalization`, `front`, `tail`, `pointer`, or `same bytes`.
25. The passing tape visibly contains one red row followed by seven blue rows without hover.
26. `UI_TAPE_RENDERER` width and segment geometry use the canonical model containing `readTok`, `inputTok`, `writeTok`, and `outTok × 5`; this level’s zero output does not alter that contract.
27. Hover and keyboard focus expose every non-zero bucket equation through `UI_HOVER_PRICE_CALCULATOR`.
28. `CacheEntry.lastTouchMin` refreshes on each of the seven reads (`C12`); all eight requests remain within `5m` (`C1`, `C27`).
29. The gate observes `ACK_EXPLANATION("l5-byte-identity")` after `ev-l5-reveal-tail`; no pre-reveal prediction field appears in `pass(st)`, a star predicate, or a failure rule.
30. A wrong post-evidence explanation remains retryable without spending wallet or deducting score.
31. `BEGIN_TRANSFER("l5-first-line-triage")` occurs after tail evidence and before `COMPLETE_ATTEMPT`; `attemptResult` is still `null`.
32. Both triage controls are operable. Ticket-tail renders eight indistinguishable first-line previews and remains retryable.
33. Ticket-first renders eight distinct first-line previews, appends `l5-triage-ticket-first` to `completedTransferIds`, and completes `ev-l5-triage-transfer`.
34. The cold-open front action cannot satisfy the transfer marker because it occurs before `ev-l5-reveal-tail` and uses a different `templateId`.
35. The triage transfer sends no request and changes no wallet, ledger, cache entry, price, passing subtotal, or request count.
36. `COMPLETE_ATTEMPT` remains disabled until both `ev-l5-unattended-tail-placement` and `ev-l5-triage-transfer` are completed and `completedTransferIds` includes `l5-triage-ticket-first`.
37. Star 3 uses `attemptMetrics.passingLedgerUsd<=0.15348645`, not floating-point equality.
38. Before completion, the gate and stars read only declared `ReducerState`, `attemptMetrics`, `completedEventIds`, `acknowledgedExplanationIds`, and `completedTransferIds` fields; after completion, the result reads matching declared `attemptResult` snapshot fields.
39. Every `StatePredicate` uses a legal kind and, where present, one of `eq|neq|lt|lte|gt|gte`; no predicate uses `op:"contains"` or an undeclared `scenario.*` path.
40. `pass(st)` does not require final `cfg.prompts=="pointer"` because the gate-mandatory triage action changes the placement after the passing run; it instead checks the action-authored contextual markers.
41. The fixed seed and reference action sequence pass only after applying both unattended tail placement and triage ticket-first placement.
42. The anti configuration reaches the economically true request-2 front-mismatch failure and cannot pass without rewinding and demonstrating both contextual applications.
43. Reduced-motion mode shows the same mismatch evidence, comparison prices, final tape colors, triage previews, and gate result.
44. `UI_COUNTERFACTUAL_OVERLAY` remains absent until `ev-l5-complete-attempt`, and its request/reveal actions cannot dispatch `FREEZE_FAILURE`.
45. Across the unattended run and first-line-only triage scenario, neither placement is globally dominant in reducer state: the tail action is required for the priced run, while ticket-first is required for transfer completion.
46. All `[FICTION]` gameplay values—seed, job count, width, choice count, budget, and clock cap—are registered in `scenarioData.fixtures` with stable IDs, semantic roles, and units.
47. `scenarioData.estimates` contains presentation timing only.
48. Replay from the same seed and ordered actions yields byte-identical state, ledger, wallet, completed markers, and result.
49. The level is winnable using only the documented template cards, prediction controls, run control, explanation choice, rewind control, and pre-completion transfer card.

## 13. Reference-bar justification

The screen puts a plausible dispatch choice under the cursor within `1.5s` and makes the player own the layout before any jobs queue. The greeting-first route exposes its consequence only when the player’s actual second request resolves. Prediction locks curiosity in place; the chosen request exposes the mismatch at the exact red suffix and freezes immediately when the ledger proves that request costs `7.41×` the valid warm alternative.

Rewind returns directly to the chosen template, and one tactile remediation moves the changing material without replaying mastered setup. A player who chooses the tail initially reaches the same evidence without an artificial failure. Completion still requires a post-evidence causal explanation, so prediction correctness is never punitive and the gate measures demonstrated understanding.

Before completion, the first-line triage transfer changes the operational constraint and requires the opposing placement through real reducer evidence. The unattended tail action, the ticket-first triage action, and `ev-l5-triage-transfer` all participate in `pass(st)`. The player therefore demonstrates a conditional rule—placement follows the active operational constraint—rather than receiving a prose-only caveat after the result.

Only after `COMPLETE_ATTEMPT` does the informational `$0.35312025` projection quantify the repeated-run difference. It cannot cause failure or change the completed attempt.

Assumptions and tradeoffs: the deterministic seed, eight-job queue, dispatch width, two template controls, `$0.55` wallet, and `5m` attempt cap are distinct level fixtures marked `[FICTION]`; the cold-open timings are presentation-only `[ESTIMATE]` values. Token counts, pricing, identity, invalidation, TTL behavior, and all computed costs remain traced to `C1`, `C3`, and `C8–C12`.

