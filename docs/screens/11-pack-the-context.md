# Level 11 — Monday’s Three Tickets

## 1. Identity

- `id`: `11-pack-the-context`
- `title`: **Monday’s Three Tickets**
- `tier`: `3`
- `objective`: “Ship the checkout, policy, and customer-sync tickets in three new workspaces.”
- `concept.id`: `prefix-loadout-sizing`
- `concept.privateDesignerSummary`: Every always-loaded token is rewritten across independent cold bases; optimize prefix size subject to capability sufficiency.
- `concept.postRevealRule`: “Pack every required capability—and nothing the tickets do not use.”
- `concept.solutionVocabulary`: `["pack", "loadout", "prefix", "context", "smallest sufficient", "capability", "unused", "passenger", "skills", "memory", "MCP"]`
- `conceptScope`: `{ kind: "single", reusedConceptIds: [] }`
- `prerequisiteConceptIds`: `["prefix-reuse", "workload-cost-mix"]`

The title and objective frame the situation without using the registered mechanic or answer vocabulary. The IDs and prerequisite order are the canonical L11 row of the `LevelId` and `ConceptId` registries.

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `AttemptMetrics`
- `AttemptResult`
- `Action`
- `StatePredicate`
- `LoadoutState`
- `CapabilitySeed`
- `Counts`
- `PREFIX_STACK`
- `PrefixBlock`
- `PB_SYSTEM`
- `PB_INSTRUCTIONS`
- `PB_SKILLS`
- `PB_MEMORY`
- `PB_MCP`
- `PB_CURRENT`
- `MAIN_SESSION_CONTEXT`
- `Request`
- `CacheEntry`
- `CACHE_TIER_1H`
- `PRICE_REQUEST`
- `LedgerRow`
- `WireSegment`
- `Wallet`
- `LocalAttemptFailure`
- `FailureRuleDef`
- `TapeRenderer`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `UI_RESULT_SCREEN`
- `predict-before-reveal`
- `fail-freeze-rewind`
- `just-in-time-toast`
- `counterfactual-after-attempt`

Skills, memory files, and MCP servers appear inside one compound loadout-packer surface. Their three canonical setter actions remain separate reducer adapters because they mutate different `LoadoutState` arrays and `PrefixBlock`s; they are not rendered as three panels, tabs, setup stages, or independent mechanics.

L11 has two economically distinct unsuccessful outcomes:

- Missing capability dispatches `STOP_LOCAL_ATTEMPT` and stores `LocalAttemptFailure`; it does not freeze.
- Reusing the exact all-loaded setup after its cost has been exposed may satisfy one narrow `FailureRuleDef` and exercise `fail-freeze-rewind`.

## 3. Cold-open / narrative

`ColdOpenDef.maxInstructionCards = 0`.

- **0.0s:** Three sealed ticket cards land on separate workspace docks:
  - **Checkout fix:** “Find where checkout rejects expired cards and patch it.”
  - **Policy update:** “Change the policy without breaking this repository’s house style.”
  - **Customer sync:** “Map the new account field into the CRM sync.”
- **0.5s [ESTIMATE]:** The cards show prose only. No capability badge, provider icon, connecting line, recommended item, correctness color, or price comparison is visible.
- **1.0s [ESTIMATE]:** `UI_PREFIX_STACK_VISUALIZER` opens beside one desk-sized card tray and a token meter. The tray is a single focus region labeled **Batch setup**.
- **1.5s [ESTIMATE]:** Copy: **“Three unopened workspaces. Choose one desk setup to take through the batch.”**
- **2.0s:** The compound loadout packer becomes interactive; **Run tickets** is the primary control. `firstInteractiveBySec = 2` `[ESTIMATE]`.

The single card tray may group cards visually by source using small metadata chips, but selection, removal, keyboard navigation, and token feedback use one shared interaction model.

Available cards:

| Item | Item ID | Prefix object | Size source | Pre-play card copy |
|---|---|---|---|---|
| Repo Navigator | `repo-navigator` | `PB_SKILLS` invoked body | `SKILL_BODY_TOK` (`C32`) | “Search and trace this repository.” |
| Release Notes | `release-notes` | `PB_SKILLS` invoked body | `SKILL_BODY_TOK` (`C32`) | “Draft public release summaries.” |
| Team Conventions | `team-conventions` | `PB_MEMORY` file | canonical `MEMORY_PER_FILE` `[FICTION]` | “This team’s local style and release rules.” |
| Personal Scratchpad | `personal-scratchpad` | `PB_MEMORY` file | canonical `MEMORY_PER_FILE` `[FICTION]` | “Personal notes from unrelated work.” |
| CRM Field Notes | `crm-field-notes` | `PB_MEMORY` file | canonical `MEMORY_PER_FILE` `[FICTION]` | “Saved CRM field names and mapping examples from last quarter.” |
| Archived Notes 1–7 | `archived-notes-01`…`07` | seven `PB_MEMORY` files | `7 × MEMORY_PER_FILE` `[FICTION]`; count derived from the ten-card memory fixture | “Archived notes from a different project.” |
| CRM MCP | `crm-mcp` | `PB_MCP` server | canonical `MCP_SIZES[1]` (`C24`, split `[FICTION]`) | “Inspect current CRM objects and field schemas.” |
| Browser MCP | `browser-mcp` | `PB_MCP` server | canonical `MCP_SIZES[0]` (`C24`, split `[FICTION]`) | “Operate browser pages.” |
| Issues MCP | `issues-mcp` | `PB_MCP` server | canonical `MCP_SIZES[2]` (`C24`, split `[FICTION]`) | “Read and update issue records.” |
| Deploy MCP | `deploy-mcp` | `PB_MCP` server | canonical `MCP_SIZES[3]` (`C24`, split `[FICTION]`) | “Inspect and trigger deployments.” |

`CRM Field Notes` occupies one of the ten authored memory fixture slots; adding the decoy does not change `L11_MEMORY_FILE_COUNT`, `MEMORY_PER_FILE`, the anti-pattern prefix, or any price.

The decoy makes the first attempt inferential rather than elimination-by-category:

- The customer ticket asks for a **new** account field.
- `CRM Field Notes` plausibly advertises related field knowledge but explicitly says it is from last quarter.
- `CRM MCP` advertises the current schema.
- Only `crm-mcp` appears in `CapabilitySeed.providedBy` for `crm-schema`; `crm-field-notes` receives no hidden exception and cannot satisfy that capability.

A defensive all-loaded choice remains functionally useful because it avoids reducer-visible missing-capability stops. A smaller sufficient choice lowers repeated writes and improves stars but requires reasoning from ticket and card prose. Both routes can complete the work and reach the post-evidence transfer; their benefits are recorded respectively in completed `UnitInstance.status` values and in `attemptMetrics.spentUsd` plus minimal-run evidence.

No pre-play element states the reference combination, the exact capability mapping, the smallest-sufficient rule, a dollar comparison, or which cards will be used.

## 4. Exact event sequence

1. **Enter level** → `ENTER_LEVEL { levelId: "11-pack-the-context" }`.
   - Initializes `ReducerState`, scalar `wallet` and `budget`, three ordinary cold `MAIN_SESSION_CONTEXT` namespaces, one scripted transfer namespace, empty optional `LoadoutState`, and `Counts.loadoutSubmissionsByFingerprint`.
   - Each stack begins with `L11_FIXED_BASE`, whose canonical derivation is `SYSTEM_BASE + CATALOG_RESIDUE`; L11 cites `C33`.
   - The `2,610`-token residue is the engine constant `CATALOG_RESIDUE`, not a standalone use of `C6`.
   - Capability mappings exist in `CapabilitySeed` but remain private to the reducer.

2. **Create the initial retry boundary** → `CREATE_CHECKPOINT { checkpointId: "cp-loadout", reason: "decision" }`.
   - The checkpoint is after the cold-open and before any card selection or prediction.
   - No request, cache, ledger, tape, or wallet mutation occurs.

3. **Edit the Batch setup tray** → one or more canonical loadout setter actions:
   - Selecting or removing a skill card dispatches `SET_SKILL_LOADOUT { skillIds, mode }`.
   - Selecting or removing a memory card dispatches `SET_MEMORY_LOADOUT { memoryIds }`.
   - Selecting or removing a connection card dispatches `SET_MCP_LOADOUT { serverIds }`.
   - These are adapter actions behind one visible control. The tray never asks the player to complete separate “skills,” “memory,” or “MCP” stages.
   - The actions mutate `selectedLoadout` and the corresponding `PB_SKILLS`, `PB_MEMORY`, or `PB_MCP`.
   - Invoked mode loads selected skill bodies; eager mode loads `CATALOG_FULL`.
   - The packed-token meter updates. No work runs.

4. **Predict the selected setup’s outcome** → `OPEN_PREDICTION`, `SELECT_PREDICTION`, then `COMMIT_PREDICTION` for `pack-outcome`.
   - The committed option is immutable for this run.
   - **Run tickets** remains disabled until commitment.
   - Selection and correctness affect no wallet, score, stars, failure, or gate value.

5. **Submit Checkout fix** → `SUBMIT_LOADOUT { ticketId: "checkout" }`.
   - The action increments `counts.loadoutSubmissionsByFingerprint` for the exact canonical sorted setup.
   - If Repo Navigator is absent, no `Request` is created. Event `ev-loadout-insufficient-checkout` confirms `repo-navigation`, dispatches the `STOP_LOCAL_ATTEMPT` outcome in §9, and stops remaining tickets.
   - Otherwise `RESOLVE_PREFIX` and `PRICE_REQUEST` resolve `pack-checkout`; one `CacheEntry` and one `LedgerRow` are created, `wallet` is debited, `attemptMetrics.spentUsd` and `attemptMetrics.requestCount` update, and `units[0].status` becomes `"done"`.
   - Only after resolution does its `repo-navigation` badge appear and connect to the provider that satisfied it.

6. **Submit Policy update** → `SUBMIT_LOADOUT { ticketId: "policy" }`.
   - If Team Conventions is absent, no `pack-policy` request exists; event `ev-loadout-insufficient-policy` confirms `team-conventions` and dispatches the local outcome.
   - Otherwise the second cold namespace produces one independently priced row and `units[1].status` becomes `"done"`.
   - After resolution, the ticket confirms `team-conventions`. The first workspace’s cache cannot cross namespaces.

7. **Submit Customer sync** → `SUBMIT_LOADOUT { ticketId: "crm" }`.
   - If CRM MCP is absent, no `pack-crm` request exists; event `ev-loadout-insufficient-crm` confirms `crm-schema` and dispatches the local outcome.
   - Selecting `crm-field-notes` does not satisfy `crm-schema`. After this stop, the decoy may be labeled **“Related notes; new field absent.”**
   - Otherwise the third cold namespace produces one independently priced row and `units[2].status` becomes `"done"`.
   - After resolution, the ticket confirms `crm-schema`.
   - Event `ev-third-cold-write` is the aha frame: ghost outlines align the three copies of the selected prefix.

8. **Reveal the committed outcome** → `REVEAL_PREDICTION { promptId: "pack-outcome", correctOptionId }`.
   - Requires the corresponding committed prediction.
   - Shows correctness styling without changing score or gate state.
   - A blocked run reveals only requirements reached by that run; future ticket requirements remain unconfirmed.
   - A completed run fires `ev-reveal-usage`: every selected card is labeled **used by {ticket}** or **unused in this batch**.
   - For a completed all-loaded run, the post-evidence panel may now display its already-incurred `L11_ANTI_REQUEST_USD` beside the derived confirmed-use preview `L11_REFERENCE_REQUEST_USD`. This is evidence from the actual setup and confirmed card use, not a counterfactual event.

9. **Create the post-evidence retry boundary** → `CREATE_CHECKPOINT { checkpointId: "cp-transfer", reason: "decision" }`.
   - Created after `ev-reveal-usage` and before any transfer explanation or loadout edit.
   - Rewinding here preserves the completed first-batch rows, spend, revealed requirements, and usage evidence.

10. **Apply the evidence to the next batch** → `BEGIN_TRANSFER { challengeId: "repack-confirmed" }`.
    - Copy: **“Three more unopened workspaces have the same tickets. What stays on the desk?”**
    - The player edits the same compound tray. These mutations define a next-batch plan and never rewrite past `LedgerRow`s.
    - The player selects one explanation; every option dispatches `ACK_EXPLANATION` with its own ID:
      - `keep-required-remove-unused`: **“Keep every confirmed requirement; remove every confirmed passenger.”**
      - `keep-everything`: **“Keep every optional card, just in case.”**
      - `strip-everything`: **“New workspaces make the desk setup useless.”**
    - The transfer is accepted only when the plan is Repo Navigator + Team Conventions + CRM MCP in invoked mode and `keep-required-remove-unused` has been acknowledged.

11. **Complete a corrected transfer** → `COMPLETE_ATTEMPT`.
    - Evaluates `L11_GATE` and the star predicates.
    - No additional priced request is required to accept the corrected plan; the post-evidence setter and explanation actions are the transfer demonstration.
    - A completed but bloated first batch can earn one star after the player corrects the next-batch plan. Its historical tape and spend remain unchanged.
    - A completed smallest-sufficient first batch can earn two or three stars according to §10.

12. **Reach the narrow repeated-bloat failure** → `SUBMIT_LOADOUT { ticketId: "checkout-transfer" }`.
    - This action is available only when the first batch completed with the exact all-loaded fingerprint and the player leaves that setup unchanged after `ev-reveal-usage`.
    - The button copy is **“Run unchanged again.”**
    - The scripted `checkout-transfer` unit uses a fourth cold `MAIN_SESSION_CONTEXT` and request ID `pack-repeat-checkout`.
    - The request resolves economically before failure evaluation: one `LedgerRow` appends, `wallet` and `attemptMetrics` update, and its wider write segment is visible beside the pinned confirmed-use preview.
    - The all-loaded fingerprint count advances from `3` ordinary ticket submissions to `4`.
    - `L11_REPEAT_BLOAT_FAILURE` then dispatches `FREEZE_FAILURE` immediately at `ev-repeat-all-loaded-checkout`.
    - No downstream request is dispatched on the frozen branch.
    - This event belongs to the player’s actual attempt. It is not a reference or counterfactual event.

13. **Rewind the repeated-bloat failure** → `REWIND_TO_CHECKPOINT { checkpointId: "cp-transfer" }`.
    - Removes only `pack-repeat-checkout`, its cache entry, its wallet deduction, its fingerprint increment, and post-checkpoint transfer actions.
    - Preserves the three completed first-batch rows and all evidence revealed before `cp-transfer`.
    - Returns directly to the compound tray with copy **“Change the next batch.”**

14. **Predict the all-loaded counterfactual** → commit `cold-repeat`.
    - Available only after a capability-complete `AttemptResult`.
    - The commitment unlocks the comparison request but never satisfies the behavioral gate.

15. **Reveal the counterfactual** → `REQUEST_COUNTERFACTUAL { comparisonId: "all-loaded" }`, then `REVEAL_COUNTERFACTUAL { comparisonId: "all-loaded" }`.
    - Uses the same seed, three ordinary tickets, workload, models, and cold namespace topology.
    - Excludes the scripted `checkout-transfer` failure probe.
    - Overlays the reference and all-loaded three-row ledgers without replacing actual state.
    - It cannot appear before attempt completion and `cold-repeat` commitment.
    - Neither action may dispatch `FREEZE_FAILURE` or mutate `clockFrozen`, wallet, ledger, or `attemptResult`.

## 5. Level data

```ts
const L11_SEED = 11011;
const L11_TICKET_HOURS = 1;
const L11_ORDINARY_TICKET_COUNT = 3;
const L11_MEMORY_FILE_COUNT = 10;

const level11: LevelDef = {
  id: "11-pack-the-context",
  tier: 3,
  title: "Monday’s Three Tickets",
  objective:
    "Ship the checkout, policy, and customer-sync tickets in three new workspaces.",
  concept: {
    id: "prefix-loadout-sizing",
    privateDesignerSummary:
      "Every always-loaded token is rewritten across independent cold bases; optimize prefix size subject to capability sufficiency.",
    postRevealRule:
      "Pack every required capability—and nothing the tickets do not use.",
    solutionVocabulary: [
      "pack",
      "loadout",
      "prefix",
      "context",
      "smallest sufficient",
      "capability",
      "unused",
      "passenger",
      "skills",
      "memory",
      "MCP",
    ],
  },
  conceptScope: {
    kind: "single",
    reusedConceptIds: [],
  },
  prerequisiteConceptIds: ["prefix-reuse", "workload-cost-mix"],

  unlocks: "skills",
  introducedControls: ["skills", "skillsMode", "memoryFiles", "mcp"],
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
  ],

  scope: "session",
  seed: L11_SEED,
  budgetUsd: 12, // C31 session-scope budget
  cfgOverride: {
    devModel: "sonnet",
    who: "inline",
    skills: 0,
    skillsMode: "invoke",
    memoryFiles: 0,
    mcp: [false, false, false, false],
    oneHourFlag: true,
  },
  scenario: "mcp-required",
  scenarioData: {
    units: [
      {
        id: "checkout",
        kind: "TASK",
        ticket: 1,
        deps: [],
        hours: L11_TICKET_HOURS,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Checkout fix",
      },
      {
        id: "policy",
        kind: "TASK",
        ticket: 2,
        deps: ["checkout"],
        hours: L11_TICKET_HOURS,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Policy update",
      },
      {
        id: "crm",
        kind: "TASK",
        ticket: 3,
        deps: ["policy"],
        hours: L11_TICKET_HOURS,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Customer sync",
      },
      {
        id: "checkout-transfer",
        kind: "TASK",
        ticket: 1,
        deps: ["crm"],
        hours: L11_TICKET_HOURS,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        scripted: true,
        label: "Next-batch checkout",
      },
    ],
    contexts: [
      {
        id: "ws-checkout",
        kind: "main",
        sessionId: "checkout-session",
        cacheNamespace: "l11-checkout",
        initialPrefixStackId: "l11-prefix-checkout",
      },
      {
        id: "ws-policy",
        kind: "main",
        sessionId: "policy-session",
        cacheNamespace: "l11-policy",
        initialPrefixStackId: "l11-prefix-policy",
      },
      {
        id: "ws-crm",
        kind: "main",
        sessionId: "crm-session",
        cacheNamespace: "l11-crm",
        initialPrefixStackId: "l11-prefix-crm",
      },
      {
        id: "ws-checkout-transfer",
        kind: "main",
        sessionId: "checkout-transfer-session",
        cacheNamespace: "l11-checkout-transfer",
        initialPrefixStackId: "l11-prefix-checkout-transfer",
      },
    ],
    prefixStacks: L11_PREFIX_STACK_SEEDS,
    workloads: [
      {
        id: "checkout",
        label: "Checkout fix",
        role: "dev",
        unitIds: ["checkout"],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: ["repo-navigation"],
        allowedModels: ["sonnet"],
      },
      {
        id: "policy",
        label: "Policy update",
        role: "dev",
        unitIds: ["policy"],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: ["repo-navigation", "team-conventions"],
        allowedModels: ["sonnet"],
      },
      {
        id: "crm",
        label: "Customer sync",
        role: "dev",
        unitIds: ["crm"],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: [
          "repo-navigation",
          "team-conventions",
          "crm-schema",
        ],
        allowedModels: ["sonnet"],
      },
      {
        id: "checkout-transfer",
        label: "Next-batch checkout",
        role: "dev",
        unitIds: ["checkout-transfer"],
        inputTok: WORK_IN,
        outTok: WORK_OUT,
        requiredCapabilityIds: ["repo-navigation"],
        allowedModels: ["sonnet"],
      },
    ],
    capabilities: [
      {
        id: "repo-navigation",
        label: "Repository navigation",
        providedBy: [{ kind: "skill", itemId: "repo-navigator" }],
        requiredByWorkloadIds: [
          "checkout",
          "policy",
          "crm",
          "checkout-transfer",
        ],
      },
      {
        id: "team-conventions",
        label: "Team conventions",
        providedBy: [{ kind: "memory", itemId: "team-conventions" }],
        requiredByWorkloadIds: ["policy", "crm"],
      },
      {
        id: "crm-schema",
        label: "CRM schema",
        providedBy: [{ kind: "mcp", itemId: "crm-mcp" }],
        requiredByWorkloadIds: ["crm"],
      },
    ],
    fixtures: [
      {
        id: "l11-scenario-seed",
        label: "Scenario seed",
        semanticRole:
          "Deterministic replay seed for Monday’s Three Tickets",
        value: L11_SEED,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l11-ticket-unit-hours",
        label: "Ticket unit-hours",
        semanticRole:
          "UnitSeed hours assigned to each ordinary and scripted L11 ticket",
        value: L11_TICKET_HOURS,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l11-ordinary-ticket-count",
        label: "Ordinary ticket count",
        semanticRole:
          "Number of independently priced cold workspaces in the ordinary batch",
        value: L11_ORDINARY_TICKET_COUNT,
        unit: "count",
        tag: "[FICTION]",
      },
      {
        id: "l11-memory-card-count",
        label: "Memory-card inventory",
        semanticRole:
          "Number of memory-file cards included by the all-loaded L11 setup",
        value: L11_MEMORY_FILE_COUNT,
        unit: "count",
        tag: "[FICTION]",
      },
    ],
    estimates: [
      {
        label: "ticket prose-only state time in seconds",
        value: 0.5,
        tag: "[ESTIMATE]",
      },
      {
        label: "loadout visualizer opening time in seconds",
        value: 1,
        tag: "[ESTIMATE]",
      },
      {
        label: "batch-setup copy reveal time in seconds",
        value: 1.5,
        tag: "[ESTIMATE]",
      },
      {
        label: "first-interaction presentation target in seconds",
        value: 2,
        tag: "[ESTIMATE]",
      },
    ],
  },

  coldOpen: L11_COLD_OPEN,
  sequence: L11_SEQUENCE,
  predictions: L11_PREDICTIONS,
  toasts: L11_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "fail-freeze-rewind",
    "just-in-time-toast",
    "counterfactual-after-attempt",
  ],

  failLesson: {
    bucket: "none",
    cite: "CapabilitySeed, C33, MEMORY_PER_FILE, MCP_SIZES",
    line:
      "Missing required context stops work locally; repeating confirmed passengers incurs a visibly larger cold write.",
  },
  failureRules: [L11_REPEAT_BLOAT_FAILURE],
  checkpoints: [
    {
      id: "cp-loadout",
      createBeforeEventId: "ev-select-loadout",
      reason: "decision",
      resumeLabel: "Repack before the run",
    },
    {
      id: "cp-transfer",
      createBeforeEventId: "ev-transfer-choice",
      reason: "decision",
      resumeLabel: "Change the next batch",
    },
  ],

  gate: L11_GATE,
  pass: passLevel11,
  star2: {
    label: "Smallest sufficient",
    predicate: {
      id: "priced-run-was-minimal",
      kind: "event-completed",
      eventId: "ev-priced-run-minimal",
    },
    reason: "The completed priced run carried no unused item.",
  },
  star3: {
    label: "Inferred on the first attempt",
    predicate: {
      id: "first-attempt-minimal-under-reference",
      kind: "all",
      predicates: [
        {
          id: "priced-run-was-minimal-for-three-stars",
          kind: "event-completed",
          eventId: "ev-priced-run-minimal",
        },
        {
          id: "first-attempt-minimal",
          kind: "event-completed",
          eventId: "ev-first-attempt-priced-run-minimal",
        },
        {
          id: "reference-threshold",
          kind: "compare",
          path: "attemptMetrics.spentUsd",
          op: "lte",
          value: L11_REFERENCE_TOTAL_USD,
        },
      ],
    },
    reason:
      "The first submitted setup was smallest-sufficient and its completed three-row spend did not exceed the exact reference run.",
  },

  referenceCfg: {
    skills: 1,
    skillsMode: "invoke",
    memoryFiles: 1,
    mcp: [false, true, false, false],
  },
  antiCfg: {
    skills: 150,
    skillsMode: "eager",
    memoryFiles: L11_MEMORY_FILE_COUNT,
    mcp: [true, true, true, true],
  },
  counterfactuals: [
    {
      id: "all-loaded",
      unlockAfterEventId: "ev-complete-attempt",
      kind: "anti-pattern",
      cfg: {
        skills: 150,
        skillsMode: "eager",
        memoryFiles: L11_MEMORY_FILE_COUNT,
        mcp: [true, true, true, true],
      },
      comparisonQuestion:
        "Which priced bucket grew on every fresh workspace?",
      revealCopy:
        "Unused context still joined every cold prefix write.",
    },
  ],

  tape: L11_TAPE,
  result: L11_RESULT,
  vocabulary: L11_VOCABULARY,
  qa: L11_QA,
};
```

The `introducedControls` values enumerate canonical reducer/config adapters, not separate rendered surfaces. The renderer exposes exactly one Batch setup tray, one selection idiom, one token meter, and one primary action.

The `mcp-required` scenario adapter maps `referenceCfg` deterministically to Repo Navigator, Team Conventions, and CRM MCP. Its all-loaded mapping selects the eager catalog, all ten memory files—including `crm-field-notes`—and all four MCP servers.

`MEMORY_PER_FILE` and the indexed `MCP_SIZES` entries are read directly from `src/engine/constants.ts`. They are not shadowed by scenario estimates or semantically unrelated local fixtures. The all-loaded memory-card count is the distinct `l11-memory-card-count` scenario fixture.

The scripted `checkout-transfer` seed uses canonical `ticket: 1` because it is a second checkout request; its distinct unit ID and cache namespace preserve request identity while keeping `UnitSeed.ticket` within the legal `Ticket` union.

The adapter assigns the exact all-loaded canonical sorted fingerprint the stable record key `l11-all-loaded`. Each ordinary all-loaded ticket submission increments:

```text
counts.loadoutSubmissionsByFingerprint.l11-all-loaded
```

from `0` to `1`, `2`, then `3`. Sending `checkout-transfer` unchanged increments it to `4`.

`L11_GATE` is:

```ts
const L11_GATE: GateDef = {
  predicateId: "l11-smallest-sufficient-transfer",
  evidenceRevealEventIds: ["ev-reveal-usage"],
  postEvidenceActionRequirements: [
    {
      id: "acknowledged-smallest-sufficient-rule",
      kind: "action-observed",
      actionType: "ACK_EXPLANATION",
      afterEventId: "ev-reveal-usage",
      match: {
        explanationId: "keep-required-remove-unused",
      },
    },
  ],
  behavioralRequirements: [
    {
      id: "all-tickets-completed",
      kind: "all",
      predicates: [
        {
          id: "checkout-completed",
          kind: "compare",
          path: "units.0.status",
          op: "eq",
          value: "done",
        },
        {
          id: "policy-completed",
          kind: "compare",
          path: "units.1.status",
          op: "eq",
          value: "done",
        },
        {
          id: "crm-completed",
          kind: "compare",
          path: "units.2.status",
          op: "eq",
          value: "done",
        },
      ],
    },
    {
      id: "usage-evidence-revealed",
      kind: "event-completed",
      eventId: "ev-reveal-usage",
    },
    {
      id: "next-loadout-is-smallest-sufficient",
      kind: "all",
      predicates: [
        {
          id: "one-invoked-skill",
          kind: "compare",
          path: "selectedLoadout.skillIds.length",
          op: "eq",
          value: 1,
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "repo-navigator-selected",
          kind: "includes",
          path: "selectedLoadout.skillIds",
          value: "repo-navigator",
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "invoke-mode-selected",
          kind: "compare",
          path: "selectedLoadout.skillsMode",
          op: "eq",
          value: "invoke",
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "one-memory-file",
          kind: "compare",
          path: "selectedLoadout.memoryIds.length",
          op: "eq",
          value: 1,
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "team-conventions-selected",
          kind: "includes",
          path: "selectedLoadout.memoryIds",
          value: "team-conventions",
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "one-mcp-server",
          kind: "compare",
          path: "selectedLoadout.mcpServerIds.length",
          op: "eq",
          value: 1,
          observedAfterEventId: "ev-reveal-usage",
        },
        {
          id: "crm-mcp-selected",
          kind: "includes",
          path: "selectedLoadout.mcpServerIds",
          value: "crm-mcp",
          observedAfterEventId: "ev-reveal-usage",
        },
      ],
    },
  ],
  explanationRequirement: {
    id: "smallest-sufficient-explanation-recorded",
    kind: "includes",
    path: "acknowledgedExplanationIds",
    value: "keep-required-remove-unused",
    observedAfterEventId: "ev-reveal-usage",
  },
};
```

`passLevel11` is pure and reads only declared `ReducerState` fields. It performs ID-safe lookups on the canonical `units` array. `ACK_EXPLANATION` for this level is accepted only after `ev-reveal-usage`, so the stored explanation ID cannot be pre-seeded:

```ts
function passLevel11(st: ReducerState): GateResult {
  const checkoutDone =
    st.units.find((u) => u.id === "checkout")?.status === "done";
  const policyDone =
    st.units.find((u) => u.id === "policy")?.status === "done";
  const crmDone =
    st.units.find((u) => u.id === "crm")?.status === "done";

  const passed =
    checkoutDone &&
    policyDone &&
    crmDone &&
    st.completedEventIds.includes("ev-reveal-usage") &&
    st.acknowledgedExplanationIds.includes(
      "keep-required-remove-unused",
    ) &&
    st.selectedLoadout.skillIds.length === 1 &&
    st.selectedLoadout.skillIds.includes("repo-navigator") &&
    st.selectedLoadout.skillsMode === "invoke" &&
    st.selectedLoadout.memoryIds.length === 1 &&
    st.selectedLoadout.memoryIds.includes("team-conventions") &&
    st.selectedLoadout.mcpServerIds.length === 1 &&
    st.selectedLoadout.mcpServerIds.includes("crm-mcp");

  return {
    pass: passed,
    reason: passed
      ? "The next batch retains every confirmed need and no confirmed passenger."
      : "Use the revealed ticket evidence to revise the next batch.",
    evidence: passed
      ? [
          "ev-reveal-usage",
          "keep-required-remove-unused",
          "repo-navigator",
          "team-conventions",
          "crm-mcp",
        ]
      : [],
  };
}
```

The narrow punitive rule is:

```ts
const L11_REPEAT_BLOAT_FAILURE: FailureRuleDef = {
  id: "l11-repeat-all-loaded-after-evidence",
  predicate: {
    id: "all-loaded-sent-again-uncorrected",
    kind: "all",
    predicates: [
      {
        id: "usage-was-revealed",
        kind: "event-completed",
        eventId: "ev-reveal-usage",
      },
      {
        id: "eager-catalog-still-selected",
        kind: "compare",
        path: "selectedLoadout.skillsMode",
        op: "eq",
        value: "eager",
      },
      {
        id: "all-ten-memory-files-still-selected",
        kind: "compare",
        path: "selectedLoadout.memoryIds.length",
        op: "eq",
        value: L11_MEMORY_FILE_COUNT,
      },
      {
        id: "all-four-mcp-servers-still-selected",
        kind: "compare",
        path: "selectedLoadout.mcpServerIds.length",
        op: "eq",
        value: 4,
      },
      {
        id: "all-loaded-fingerprint-reached-transfer",
        kind: "compare",
        path:
          "counts.loadoutSubmissionsByFingerprint.l11-all-loaded",
        op: "gte",
        value: 4,
      },
    ],
  },
  decisiveEventId: "ev-repeat-all-loaded-checkout",
  causeCode: "REPEATED_CONFIRMED_BLOAT",
  message:
    "You sent the same all-loaded setup again. Its first cold request cost $0.910428 instead of the confirmed-use $0.747024.",
  checkpointId: "cp-transfer",
  highlightObjectIds: [
    "pack-repeat-checkout:write",
    "confirmed-use-request-preview",
  ],
  actualUsd: L11_ANTI_REQUEST_USD,
  validAlternativeUsd: L11_REFERENCE_REQUEST_USD,
};
```

Every predicate above uses a declared state path, a legal `StatePredicate.kind`, and a legal comparison op. No predicate reads prediction correctness or an object-shaped wallet path.

## 6. Pricing walkthrough

This section is the sole authoritative L11 price computation. Other sections reference the names defined here.

All requests use Sonnet and `CACHE_TIER_1H`. Sonnet 1-hour writes cost `$6/M`, fresh input costs `$3/M`, and output costs `$15/M` (`C1`, `C3`). Each ticket uses `WORK_IN = 6,000` fresh-input tokens and `WORK_OUT = 44,000` output tokens (`C28`).

For a selected loadout:

```text
selectedPrefixTok =
  L11_FIXED_BASE
  + selectedSkillTok
  + selectedMemoryTok
  + selectedMcpTok

selectedSkillTok =
  skillsMode == "eager"
    ? CATALOG_FULL
    : selectedSkillCount × SKILL_BODY_TOK

selectedMemoryTok = selectedMemoryCount × MEMORY_PER_FILE
selectedMcpTok    = sum(selected MCP entries from MCP_SIZES)
```

`L11_FIXED_BASE = SYSTEM_BASE + CATALOG_RESIDUE = 5,360` tokens (`C33`). The level uses the engine constant `CATALOG_RESIDUE`; it does not cite `C6` as the fixed-base quantity.

Every successful ordinary workspace is an independent cold namespace:

```text
readTok  = 0
writeTok = selectedPrefixTok
inputTok = 6,000
outTok   = 44,000
```

### Three-star reference

```text
L11_REFERENCE_PREFIX_TOK =
    5,360 fixed prefix
  + 1,744 Repo Navigator
  +   400 Team Conventions
  + 4,000 CRM MCP
  = 11,504 writeTok
```

`SKILL_BODY_TOK = 1,744` derives from `C32`. The `400` memory tokens are the canonical `[FICTION]` engine fixture `MEMORY_PER_FILE`. The CRM schema size is read directly from `MCP_SIZES[1] = 4,000`, the `[FICTION]` split whose measured total is registered by `C24`.

```text
L11_REFERENCE_WRITE_USD  = 11,504 × $6/M  = $0.069024
L11_REFERENCE_INPUT_USD  =  6,000 × $3/M  = $0.018000
L11_REFERENCE_OUTPUT_USD = 44,000 × $15/M = $0.660000

L11_REFERENCE_REQUEST_USD = $0.747024
L11_REFERENCE_TOTAL_USD   = 3 × $0.747024
                          = $2.241072
```

### All-loaded anti-pattern

```text
L11_ANTI_PREFIX_TOK =
    5,360 fixed prefix
  + 13,083 eager skill catalog
  +  4,000 ten memory files
  + 16,295 all MCP schemas
  = 38,738 writeTok
```

The eager catalog is `CATALOG_FULL` (`C7`). The memory term is `L11_MEMORY_FILE_COUNT × MEMORY_PER_FILE = 10 × 400 = 4,000`. The MCP term is read directly as `sum(MCP_SIZES) = 6,295 + 4,000 + 3,000 + 3,000 = 16,295` (`C24`).

```text
L11_ANTI_WRITE_USD  = 38,738 × $6/M  = $0.232428
L11_ANTI_INPUT_USD  =  6,000 × $3/M  = $0.018000
L11_ANTI_OUTPUT_USD = 44,000 × $15/M = $0.660000

L11_ANTI_REQUEST_USD = $0.910428
L11_ANTI_TOTAL_USD   = 3 × $0.910428
                     = $2.731284
```

The post-attempt comparison is:

```text
L11_EXCESS_PREFIX_TOK = 38,738 − 11,504
                      = 27,234

L11_BLOAT_DELTA_USD = $2.731284 − $2.241072
                    = $0.490212

L11_BLOAT_RATIO = $0.490212 / $2.241072
                = 21.873996%
```

The core choice therefore has a visible economic tradeoff: all-loaded succeeds functionally and prevents any missing-capability stop, but costs about `21.87%` more than the smallest-sufficient setup. The smaller route earns lower spend and minimal-run star evidence but carries an inferable sufficiency risk on the first attempt.

### Repeated-bloat failure request

`pack-repeat-checkout` uses the same all-loaded prefix and the same `C28` workload as one ordinary all-loaded request:

```text
readTok  = 0
writeTok = 38,738
inputTok = 6,000
outTok   = 44,000

actualUsd           = L11_ANTI_REQUEST_USD
validAlternativeUsd = L11_REFERENCE_REQUEST_USD
```

Both values already have one authoritative computation above. The failure rule introduces no replacement price or alternate arithmetic.

### Deficient loadout accounting

An absent capability produces no `Request`, `LedgerRow`, tape segment, cache mutation, or wallet deduction for the blocked ticket. The UI says **“No request sent”** rather than displaying a zero-dollar request.

For completed rows on a deficient branch, prefix bloat is compared only against the same number of reference requests. Unexecuted work is reported as a blocked-ticket count, never converted into invented API dollars.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"` and `hoverEnabled = true`.

For the player’s selected prefix `P`, ordinary successful rows appear in this order:

1. `pack-checkout`
   - `writeTok=P`, red
   - `inputTok=WORK_IN`, red
   - `outTok=WORK_OUT`, violet
2. `pack-policy`
   - the same ordered buckets in a distinct cold namespace
3. `pack-crm`
   - the same ordered buckets in a third cold namespace

A deficient run contains only rows for tickets that actually executed; no placeholder row represents the blocked ticket.

`ahaRequestId = "pack-crm"`. When its write segment lands, ghost outlines align the three selected-prefix writes and the meter changes from **“{P} on the desk”** to **“{P} × 3 unopened workspaces.”**

Every `WireSegment`, including output, uses the canonical truthful geometry:

```text
segment.widthRatio = segment.usd / LedgerRow.usd
segment.startRatio = prior segment USD / LedgerRow.usd
```

Thus `outTok` contributes its full `RATE_OUTPUT` cost (`C1`, `C3`, `C28`) from the first rendered row. Hiding an output label never removes the violet segment’s visual weight.

The repeated-bloat branch appends one fourth actual row:

4. `pack-repeat-checkout`
   - `writeTok=L11_ANTI_PREFIX_TOK`, red
   - `inputTok=WORK_IN`, red
   - `outTok=WORK_OUT`, violet
   - rendered beside a non-ledger ghost outline for `L11_REFERENCE_PREFIX_TOK`
   - freezes immediately after the complete row and its two request-local price labels become visible

The ghost outline is comparison evidence, not a request or ledger row.

After `cold-repeat` commitment, `all-loaded` overlays the wider anti-pattern write segments beneath the completed three-row player tape. The overlay is unavailable pre-play and cannot trigger failure.

## 8. Prediction prompts

### `pack-outcome`

Shown after the player selects a setup and before any ticket runs.

> **What will this exact desk setup do across the three tickets?**

- `complete-tight`: **“Complete all three with little unused material.”**
- `complete-bloated`: **“Complete all three while unused material repeats.”**
- `blocked`: **“Stop when a ticket needs something that is missing.”**

The prompt does not display required badges or identify a correct provider. `CRM Field Notes` and `CRM MCP` retain neutral styling. Correct-state styling appears only after the run stops or completes. Any option may be wrong without affecting score, stars, wallet, failure, or gate passage.

### `cold-repeat`

Shown after a capability-complete attempt and before `all-loaded` is revealed.

> **If every optional card travels through the same three new workspaces, which priced bucket grows on all three requests?**

- `writes`: **“The cold prefix writes.”**
- `outputs`: **“The generated answers.”**
- `requirements`: **“The tickets’ capability needs.”**

Correct option: `writes`. Commitment is required for the reveal; correctness is not required for completion.

The post-evidence `keep-required-remove-unused` explanation is not a prediction. It is a retriable causal choice after actual ticket, usage, and tape evidence, and it is the action observed by the behavioral gate.

## 9. Fail-state

### Missing capability — non-freezing local failed attempt

Decisive event: the first `SUBMIT_LOADOUT` whose ticket requires an absent capability.

One-line cause copy uses the concrete ticket:

- **“Checkout fix stopped: repository navigation was missing.”**
- **“Policy update stopped: team conventions were missing.”**
- **“Customer sync stopped: current CRM schema access was missing.”**

The event dispatches:

```ts
{
  type: "STOP_LOCAL_ATTEMPT",
  failure: {
    outcomeId: "l11-missing-capability",
    causeCode: missingCapabilityId,
    message: concreteTicketMessage,
    stoppedAtEventId: decisiveEventId,
    checkpointId: "cp-loadout",
    missingCapabilityIds: [missingCapabilityId],
  },
}
```

Behavior:

- The blocked card shakes once and confirms only its missing capability badge.
- If `crm-field-notes` was selected without `crm-mcp`, the decoy is marked **“Related notes; new field absent.”**
- No request or priced placeholder is created for the blocked ticket.
- Previously completed rows and spend remain visible until retry.
- Remaining ticket requirements stay unconfirmed.
- `clockFrozen` remains `false`.
- `frozenFailure` remains `null`.
- `ended` remains `null`.
- `localAttemptFailure` stores the exact `LocalAttemptFailure`.
- `REVEAL_PREDICTION` may show what happened, but prediction correctness remains non-punitive.
- `COMPLETE_ATTEMPT` records `attemptResult.outcome = "local-failed"` and the matching `localFailureId`.
- `UI_REWIND_CONTROL` copy: **“Repack before the run.”**
- `REWIND_TO_CHECKPOINT { checkpointId: "cp-loadout" }` removes the abandoned branch’s rows, cache entries, and wallet deductions, retains the attempt count, and returns to the tray without replaying the cold-open.

No `FailureRuleDef` or `FREEZE_FAILURE` applies to missing capability because that branch has not produced an overpriced request.

### Repeated all-loaded setup — punitive freeze

Decisive event: `ev-repeat-all-loaded-checkout`, immediately after `pack-repeat-checkout` resolves in the player’s actual branch.

Required evidence:

- The initial all-loaded batch completed.
- `ev-reveal-usage` exposed which cards were passengers.
- The screen visibly shows `L11_ANTI_REQUEST_USD` and `L11_REFERENCE_REQUEST_USD`.
- The player leaves the exact all-loaded setup unchanged and selects **Run unchanged again**.
- The all-loaded fingerprint count reaches `4`.

Cause copy:

> **“You sent the same all-loaded setup again. Its first cold request cost $0.910428 instead of the confirmed-use $0.747024.”**

Behavior:

- The real `pack-repeat-checkout` row lands before the freeze.
- `FREEZE_FAILURE` fires from that request-resolution event, sets `clockFrozen = true`, and records `L11_REPEAT_BLOAT_FAILURE`.
- The wider actual write and narrower valid-alternative outline remain visible.
- Economic controls disable; prediction controls and counterfactual controls do not appear.
- No later transfer request is dispatched on the frozen branch.
- `UI_REWIND_CONTROL` copy: **“Change the next batch.”**
- `REWIND_TO_CHECKPOINT { checkpointId: "cp-transfer" }` removes only the repeated request branch and returns directly to the post-evidence decision.
- The initial three rows, their spend, confirmed badges, and usage evidence remain intact.

A capability-complete bloated first attempt is never frozen merely for exploration. It must finish so its genuine cost becomes evidence. The punitive rule applies only when the exact all-loaded setup is sent again after that evidence.

No `COMPLETE_ATTEMPT`, reference, anti-pattern, `REQUEST_COUNTERFACTUAL`, or `REVEAL_COUNTERFACTUAL` event may dispatch this failure.

## 10. Gate & stars

Behavioral pass predicate:

```text
units.0.status, units.1.status, and units.2.status are "done"
AND ev-reveal-usage completed
AND after ev-reveal-usage the player acknowledged
    keep-required-remove-unused
AND selectedLoadout contains exactly:
    Repo Navigator in invoke mode
    Team Conventions
    CRM MCP
AND selectedLoadout contains no additional skill, memory, or MCP item
```

Neither `pack-outcome` nor `cold-repeat` commitment, selected option, or correctness appears in `L11_GATE`, `passLevel11`, a star predicate, a wallet mutation, or a failure decision. Predictions gate their reveals only.

Budget alone cannot pass.

- **1 star — Repacked:** the behavioral pass predicate holds.
- **2 stars — Smallest sufficient:** pass, and `ev-priced-run-minimal` confirms that the completed priced run itself used the smallest-sufficient setup.
- **3 stars — Inferred on the first attempt:** the two-star event holds, `ev-first-attempt-priced-run-minimal` holds, and `attemptMetrics.spentUsd <= L11_REFERENCE_TOTAL_USD` when `COMPLETE_ATTEMPT` evaluates stars.

`COMPLETE_ATTEMPT` then copies `attemptMetrics.spentUsd` into `attemptResult.spentUsd`; no predicate uses an invented `wallet.spentUsd` path.

A bloated first run followed by a correct post-evidence revision earns one star. A corrected smallest-sufficient run after an insufficient local attempt can earn two. The first-attempt reference route earns three.

Result copy:

- Pass headline: **“Every ticket shipped.”**
- One-star evidence: **“The next batch carries only confirmed needs.”**
- Two-star evidence: **“Three needs covered. Three cold starts. No passengers.”**
- Three-star evidence: **“You inferred the setup before the badges appeared.”**
- Local-failure headline: **“One need was missing.”**
- Repeated-bloat headline: **“The same passengers came back.”**
- Uncorrected-bloat headline: **“The work shipped; the desk is still crowded.”**
- Bloat evidence: **“Unused material added {bloatUsd} across the completed cold writes.”**

## 11. Toasts

- `toast-prefix-size`
  - Trigger: first compound-tray mutation.
  - Copy: **“Desk setup: {totalTok} tokens.”**
  - Priority: `status`
  - Dedupe: `attempt`

- `toast-cold-one`
  - Trigger: ledger append for `pack-checkout`.
  - Copy: **“Workspace 1 opened · WRITE {writeTok}.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-requirement-confirmed`
  - Trigger: a ticket resolves or stops for a missing capability.
  - Copy: **“Confirmed need: {capabilityLabel}.”**
  - Priority: `cause`
  - Dedupe: `never`

- `toast-decoy-insufficient`
  - Trigger: `ev-loadout-insufficient-crm` when `crm-field-notes` is selected and `crm-mcp` is absent.
  - Copy: **“Last quarter’s notes do not contain the new field.”**
  - Priority: `cause`
  - Dedupe: `attempt`

- `toast-cold-two`
  - Trigger: ledger append for `pack-policy`.
  - Copy: **“New workspace, same setup · WRITE again.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-multiplied`
  - Trigger: ledger append for `pack-crm`.
  - Copy: **“{writeTok} setup tokens × 3 workspaces.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-missing`
  - Trigger: any `ev-loadout-insufficient-*`.
  - Copy: **“Missing capability: {capabilityLabel}. No request was sent.”**
  - Priority: `cause`
  - Dedupe: `never`

- `toast-used`
  - Trigger: `ev-reveal-usage`.
  - Copy: **“Used cards and passengers are now marked.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-bloat`
  - Trigger: `ev-reveal-usage` when selected items were unused.
  - Copy: **“Unused here still traveled through every workspace.”**
  - Priority: `cause`
  - Dedupe: `attempt`

- `toast-repeat-bloat`
  - Trigger: ledger append for `pack-repeat-checkout`.
  - Copy: **“The confirmed passengers were written again.”**
  - Priority: `cause`
  - Dedupe: `attempt`

- `toast-reference`
  - Trigger: `all-loaded` counterfactual reveal.
  - Copy: **“All-loaded added {bloatUsd} across identical work.”**
  - Priority: `teaching`
  - Dedupe: `level`

No toast identifies a required provider before evidence. The decoy toast names only why the attempted stale provider failed after the CRM ticket stops.

## 12. QA gate

Real-browser click-through must assert:

1. The first Batch setup card is enabled by `ColdOpenDef.firstInteractiveBySec`.
2. The title and objective contain none of `concept.solutionVocabulary`, including inflections or hyphenated variants.
3. Before the first run, ticket cards contain prose but no capability badges, provider links, correctness colors, reference setup, bloat delta, or smallest-sufficient rule.
4. `CRM Field Notes` and `CRM MCP` are both plausible from pre-play prose, while the words **new** and **last quarter** make the optimal first choice inferable rather than blind.
5. `crm-field-notes` is absent from every `CapabilitySeed.providedBy` entry and cannot satisfy `crm-schema`.
6. Skills, memory files, and MCP servers render inside one compound focus region with one selection idiom, one token meter, and one primary action; no separate configuration panel or staged sub-puzzle appears.
7. The underlying setters mutate only `LoadoutState` and their corresponding `PrefixBlock`; they create no request or wallet mutation.
8. **Run tickets** is disabled until `pack-outcome` is committed.
9. A wrong `pack-outcome` or `cold-repeat` prediction changes no score, star, wallet, failure, or gate result.
10. Missing the first, second, or third capability stops on that exact ticket and creates no `Request`, `LedgerRow`, tape row, cache mutation, or displayed zero-dollar row for the blocked ticket.
11. Selecting only `crm-field-notes` for the CRM need reaches the third-ticket local failure; selecting `crm-mcp` satisfies it.
12. Every missing-capability stop dispatches `STOP_LOCAL_ATTEMPT`, stores `localAttemptFailure`, and leaves `clockFrozen=false`, `frozenFailure=null`, and `ended=null`.
13. `COMPLETE_ATTEMPT` after a missing-capability stop produces `attemptResult.outcome="local-failed"` and the matching `localFailureId`.
14. A missing-capability stop never dispatches `FREEZE_FAILURE`.
15. The missing badge appears only after the corresponding ticket resolves or stops; unreached ticket badges remain hidden.
16. Retry returns deterministically to `cp-loadout`, restores wallet and cache state for the abandoned branch, retains attempt count, and does not replay the cold-open.
17. The gate observes `ACK_EXPLANATION` after `ev-reveal-usage`; pre-reveal prediction data is absent from `passLevel11`.
18. The all-loaded configuration completes the initial work but fails the behavioral gate until the player removes confirmed passengers from the next-batch plan.
19. A first all-loaded batch increments `counts.loadoutSubmissionsByFingerprint.l11-all-loaded` exactly three times.
20. Leaving the all-loaded setup unchanged exposes **Run unchanged again** only after `ev-reveal-usage`.
21. `pack-repeat-checkout` is a real fourth cold request in the player’s actual branch and increments the all-loaded fingerprint count from `3` to `4`.
22. `L11_REPEAT_BLOAT_FAILURE` fires immediately from resolution of that row, with `actualUsd=L11_ANTI_REQUEST_USD` and `validAlternativeUsd=L11_REFERENCE_REQUEST_USD`.
23. The repeated-bloat decisive frame visibly contains both request-local costs, and `actualUsd > validAlternativeUsd`.
24. The repeated-bloat rule is unreachable before `ev-reveal-usage` and does not punish the first exploratory all-loaded batch.
25. Rewind to `cp-transfer` removes the repeated request, its cache mutation, wallet deduction, and fourth fingerprint count while preserving all first-batch rows and evidence.
26. No `FREEZE_FAILURE` is dispatched from `COMPLETE_ATTEMPT`, `REQUEST_COUNTERFACTUAL`, `REVEAL_COUNTERFACTUAL`, or reference/anti-pattern processing.
27. The reference configuration completes all three ordinary tickets, passes the transfer gate, and earns three stars from the fixed seed.
28. A successful reference run yields exactly three ledger rows and three `TapeRenderer` rows.
29. Each rendered row corresponds to one priced request; ghost comparisons never create ledger rows.
30. Every row’s non-zero segments match the resolved buckets and sum exactly to `LedgerRow.usd`.
31. Tape bar and segment widths include output USD from the first row, including static non-hover rendering.
32. Every real request has `usd > 0`; no positive cost renders as `$0.0000`.
33. Reference pricing equals `L11_REFERENCE_REQUEST_USD` per row and `L11_REFERENCE_TOTAL_USD` for the ordinary run.
34. All-loaded pricing equals `L11_ANTI_REQUEST_USD` per row and `L11_ANTI_TOTAL_USD` for the ordinary run.
35. The revealed three-row comparison equals `L11_BLOAT_DELTA_USD`; no second price table or superseded value exists.
36. The three ordinary `MAIN_SESSION_CONTEXT` instances and scripted transfer context have distinct cache namespaces; every successful row has `readTok=0`.
37. Missing-capability count and prefix-bloat dollars remain distinct evidence types; unfinished work is never assigned an invented API price.
38. Reference and all-loaded counterfactuals remain hidden until a completed attempt and `cold-repeat` commitment.
39. Prediction correctness is absent from all gate, star, failure, and budget predicates.
40. `L11_GATE` reads `units.0.status`, `units.1.status`, and `units.2.status`; `passLevel11` uses ID-safe `.find(...)` lookups on `ReducerState.units`.
41. Every gate, star, and failure predicate uses a declared `ReducerState` path, legal predicate kind, and legal comparison op.
42. No predicate reads `wallet.spentUsd`; in-progress star evaluation reads `attemptMetrics.spentUsd`, and completion snapshots it to `attemptResult.spentUsd`.
43. Narrow viewport preserves ticket prose, all card metadata, the token meter, evidence labels, and the primary action without horizontal page scrolling.
44. Keyboard-only play can inspect every card, distinguish the decoy prose, alter every card class through the single tray, commit both predictions, run, acknowledge the post-evidence explanation, revise the next batch, trigger and rewind the narrow freeze, reveal the comparison, and retry.
45. Pointer and keyboard paths dispatch equivalent actions.
46. Reduced-motion mode produces identical final ledger, tape, badge, comparison, local-failure, frozen-failure, and gate evidence.
47. Every authoritative quantity resolves to the single computation in §6; no stale or alternative total is implementable.
48. `id`, `concept.id`, `concept.solutionVocabulary`, `conceptScope`, and both prerequisites compile against the canonical registries.
49. The all-loaded delta exceeds the visible-tradeoff target, while the cheaper route retains a genuine inference and capability-sufficiency risk.
50. Every `WireSegment.widthRatio` and `startRatio` is derived from USD, so output-heavy requests are not visually misrepresented.
51. `scenarioData.fixtures` contains the fiction seed, ticket unit-hours, ordinary-ticket count, and memory-card count with stable IDs, semantic roles, units, and `[FICTION]` tags.
52. `scenarioData.estimates` contains presentation timing only.
53. Memory-file token sizes resolve directly to `MEMORY_PER_FILE`; MCP schema sizes resolve directly to the indexed `MCP_SIZES` split and are not duplicated as estimates.
54. Every `UnitSeed.ticket` is within the canonical `1 | 2 | 3` union; `checkout-transfer` reuses ticket `1`.

## 13. Reference-bar justification

The opening presents a tactile desk-selection problem with enough prose to reason from but no badge-shaped answer key. The stale CRM notes are a credible decoy: choosing the current schema connection requires reading the ticket’s “new field” clue, while choosing everything remains a defensible way to prevent a missing-capability stop. The player therefore balances reducer-visible completion confidence against repeated input-side weight rather than maximizing or minimizing a dominant dial.

The interface remains one toy. Skills, memory files, and connections are cards in the same tray, governed by the same selection gesture and token feedback. Their separate reducer actions preserve canonical object boundaries without multiplying visible mechanics.

Causal accounting remains honest. Missing context produces no fictional charge and uses `LocalAttemptFailure`. A bloated first run completes because its defensive benefit is real and its ledger is the evidence. Only sending the exact all-loaded setup again after its passengers and valid request-local alternative are visible produces a punitive freeze. That freeze fires from the real harmful request, prevents downstream dispatch, and rewinds only the unmastered transfer decision.

After seeing used/passenger evidence, the player must state the causal rule and revise the next batch. That post-evidence action—not prediction correctness—passes the level. The output-inclusive tape preserves the true cost mix, while three aligned cold writes make the chosen setup’s multiplication legible. The decoy, local stop, narrow request-local freeze, fast checkpoint, and locked post-attempt counterfactual create the intended discovery rhythm without exposing the solution before play.
