# Level 11 — Pack the Context

## 1. Identity

- `id`: `11-pack-the-context`
- `title`: **Pack the Context**
- `tier`: `3`
- `objective`: “Three tickets, three fresh workspaces. Pack one loadout.”
- `concept.id`: `prefix-loadout-sizing`
- `concept.privateDesignerSummary`: Every always-loaded token is rewritten across independent cold bases; optimize prefix size subject to capability sufficiency.
- `concept.postRevealRule`: “Pack every required capability—and nothing the tickets do not use.”
- `prerequisiteConceptIds`: `["prefix-reuse", "workload-cost-mix"]`

The IDs and prerequisite order are the canonical L11 row of the `LevelId` and `ConceptId` registries.

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `Action`
- `LoadoutState`
- `CapabilitySeed`
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
- `TapeRenderer`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `predict-before-reveal`
- `just-in-time-toast`
- `counterfactual-after-attempt`

L11 has no `FREEZE_FAILURE`: an omitted capability creates no priced request, so freezing that cheaper branch would violate the economically-true-freeze contract.

## 3. Cold-open / narrative

`ColdOpenDef.maxInstructionCards = 0`.

- **0.0s:** Three sealed ticket cards land on separate workspace docks:
  - **Checkout fix:** “Find where checkout rejects expired cards and patch it.”
  - **Policy update:** “Change the policy without breaking this repository’s house style.”
  - **Customer sync:** “Map the new account field into the CRM sync.”
- **0.5s:** The cards show prose only. No capability badge, provider icon, connecting line, recommended item, or correctness color is visible.
- **1.0s:** `UI_PREFIX_STACK_VISUALIZER` opens beside a packed-token meter. Optional cards scatter onto the desk.
- **1.5s:** Copy: **“Each workspace starts cold. Pack one loadout for all three.”**
- **2.0s:** The compound loadout packer becomes interactive; **Run tickets** is the primary control. `firstInteractiveBySec = 2` `[ESTIMATE]`.

Available cards:

| Item | Prefix object | Size source | Pre-play card copy |
|---|---|---|---|
| Repo Navigator | `PB_SKILLS` invoked body | `SKILL_BODY_TOK` (`C32`) | “Search and trace this repository.” |
| Release Notes | `PB_SKILLS` invoked body | `SKILL_BODY_TOK` (`C32`) | “Draft public release summaries.” |
| Team Conventions | `PB_MEMORY` file | `MEMORY_PER_FILE` `[FICTION]` | “This team’s local style and release rules.” |
| Personal Scratchpad | `PB_MEMORY` file | `MEMORY_PER_FILE` `[FICTION]` | “Personal notes from unrelated work.” |
| CRM MCP | `PB_MCP` server | `MCP_SIZES[1]` (`C24`, split `[FICTION]`) | “CRM objects and field schemas.” |
| Browser MCP | `PB_MCP` server | `MCP_SIZES[0]` (`C24`, split `[FICTION]`) | “Operate browser pages.” |
| Issues MCP | `PB_MCP` server | `MCP_SIZES[2]` (`C24`, split `[FICTION]`) | “Read and update issue records.” |
| Deploy MCP | `PB_MCP` server | `MCP_SIZES[3]` (`C24`, split `[FICTION]`) | “Inspect and trigger deployments.” |

The prose supplies inferable evidence without presenting the exact three-star combination as a badge-matching exercise. Capability badges are confirmed only by the first run’s ticket outcomes.

No pre-play element states the reference loadout, the smallest-sufficient rule, a dollar comparison, or which cards will be used.

## 4. Exact event sequence

1. **Enter level** → `ENTER_LEVEL { levelId: "11-pack-the-context" }`.
   - Initializes `ReducerState`, the session `Wallet`, three distinct cold `MAIN_SESSION_CONTEXT` namespaces, empty optional `LoadoutState`, and the three `PREFIX_STACK` seeds.
   - Each fixed stack begins with `L11_FIXED_BASE`, whose canonical derivation is `SYSTEM_BASE + CATALOG_RESIDUE`; L11 cites `C33`. The `2,610`-token residue is the engine constant `CATALOG_RESIDUE`, not a standalone use of `C6`.
   - Capability mappings exist in `CapabilitySeed` but remain private to the reducer.

2. **Create the retry boundary** → `CREATE_CHECKPOINT { checkpointId: "cp-loadout", reason: "decision" }`.
   - The checkpoint is after the cold-open and before any loadout mutation or prediction.
   - No request, cache, ledger, tape, or wallet mutation occurs.

3. **Pack skills** → `SET_SKILL_LOADOUT { skillIds, mode }`.
   - Mutates `selectedLoadout.skillIds`, `selectedLoadout.skillsMode`, and `PB_SKILLS`.
   - Invoked mode loads selected bodies; eager mode loads `CATALOG_FULL`.
   - The packed-token meter updates; no work runs.

4. **Pack memory** → `SET_MEMORY_LOADOUT { memoryIds }`.
   - Mutates `selectedLoadout.memoryIds` and `PB_MEMORY`.
   - Each selected file contributes `MEMORY_PER_FILE`.
   - No work runs.

5. **Pack MCP servers** → `SET_MCP_LOADOUT { serverIds }`.
   - Mutates `selectedLoadout.mcpServerIds` and `PB_MCP`.
   - Selected sizes come from `MCP_SIZES`.
   - No work runs.

6. **Predict the selected loadout’s outcome** → `OPEN_PREDICTION`, `SELECT_PREDICTION`, then `COMMIT_PREDICTION` for `pack-outcome`.
   - The committed option is immutable for this run.
   - **Run tickets** remains disabled until commitment.
   - Selection and correctness affect no wallet, score, stars, failure, or gate value.

7. **Submit Checkout fix** → `SUBMIT_LOADOUT { ticketId: "checkout" }`.
   - If Repo Navigator is absent, no `Request` is created. Event `ev-loadout-insufficient` confirms badge `repo-navigation`, stops the remaining submissions, and proceeds to the non-economic failed-attempt result in §9.
   - Otherwise `RESOLVE_PREFIX` and `PRICE_REQUEST` resolve `pack-checkout`; one `CacheEntry` and one `LedgerRow` are created, the `Wallet` is debited, and the ticket becomes complete.
   - Only after resolution does its `repo-navigation` badge appear and connect to the provider that satisfied it.

8. **Submit Policy update** → `SUBMIT_LOADOUT { ticketId: "policy" }`.
   - If Team Conventions is absent, no `pack-policy` request exists; `team-conventions` is confirmed and the run stops locally.
   - Otherwise the second cold namespace produces one independently priced row.
   - After resolution, the ticket confirms `team-conventions`. The first workspace’s cache cannot cross namespaces.

9. **Submit Customer sync** → `SUBMIT_LOADOUT { ticketId: "crm" }`.
   - If CRM MCP is absent, no `pack-crm` request exists; `crm-schema` is confirmed and the run stops locally.
   - Otherwise the third cold namespace produces one independently priced row.
   - After resolution, the ticket confirms `crm-schema`.
   - Event `ev-third-cold-write` is the aha frame: ghost outlines align the three copies of the selected packed prefix.

10. **Reveal the committed outcome** → `REVEAL_PREDICTION { promptId: "pack-outcome", correctOptionId }`.
    - Requires the corresponding committed prediction.
    - Shows correctness styling without changing score or gate state.
    - A blocked run reveals only requirements reached by that run; future ticket requirements remain unconfirmed.
    - A completed run fires `ev-reveal-usage`: every selected card is labeled **used by {ticket}** or **unused in this batch**, and the repeated-prefix evidence becomes available.

11. **Apply the evidence to the next batch** → `BEGIN_TRANSFER { challengeId: "repack-confirmed" }`.
    - Copy: **“Three more cold workspaces have the same needs. What stays packed?”**
    - The player may change the same loadout controls. These mutations define the next-batch plan and never rewrite past `LedgerRow`s.
    - The player selects an explanation:
      - `keep-required-remove-unused`: **“Keep every confirmed requirement; remove every confirmed passenger.”**
      - `keep-everything`: **“Keep every optional card, just in case.”**
      - `strip-everything`: **“Cold starts make packed context useless.”**
    - Selecting the first option dispatches `ACK_EXPLANATION { explanationId: "keep-required-remove-unused" }`.
    - The transfer is accepted only when the planned next loadout is Repo Navigator + Team Conventions + CRM MCP in invoked mode.

12. **Complete the scored attempt** → `COMPLETE_ATTEMPT`.
    - Evaluates the post-evidence gate and stars.
    - No prediction option or prediction correctness participates.
    - A completed but bloated priced run can earn one star after the player corrects the next-batch plan; its historical tape and spend remain unchanged.

13. **Predict the all-loaded counterfactual** → commit `cold-repeat`.
    - Available only after a capability-complete attempt.
    - The commitment unlocks the comparison request but never satisfies the behavioral gate.

14. **Reveal the counterfactual** → `REQUEST_COUNTERFACTUAL { comparisonId: "all-loaded" }`, then `REVEAL_COUNTERFACTUAL { comparisonId: "all-loaded" }`.
    - Uses the same seed, tickets, workload, models, and cold namespace topology.
    - Overlays the reference and all-loaded ledgers without replacing actual state.
    - It cannot appear before the attempt and `cold-repeat` commitment.

## 5. Level data

```ts
const level11: LevelDef = {
  id: "11-pack-the-context",
  tier: 3,
  title: "Pack the Context",
  objective: "Three tickets, three fresh workspaces. Pack one loadout.",
  concept: {
    id: "prefix-loadout-sizing",
    privateDesignerSummary:
      "Every always-loaded token is rewritten across independent cold bases; optimize prefix size subject to capability sufficiency.",
    postRevealRule:
      "Pack every required capability—and nothing the tickets do not use.",
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
  seed: 11011,
  budgetUsd: 12,
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
        hours: 1,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Checkout fix",
      },
      {
        id: "policy",
        kind: "TASK",
        ticket: 2,
        deps: ["checkout"],
        hours: 1,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Policy update",
      },
      {
        id: "crm",
        kind: "TASK",
        ticket: 3,
        deps: ["policy"],
        hours: 1,
        outTok: WORK_OUT,
        workIn: WORK_IN,
        label: "Customer sync",
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
    ],
    capabilities: [
      {
        id: "repo-navigation",
        label: "Repository navigation",
        providedBy: [{ kind: "skill", itemId: "repo-navigator" }],
        requiredByWorkloadIds: ["checkout", "policy", "crm"],
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
    estimates: [
      { label: "scenario seed", value: 11011, tag: "[FICTION]" },
      { label: "task hours per ticket", value: 1, tag: "[FICTION]" },
      { label: "memory file tokens", value: 400, tag: "[FICTION]" },
      { label: "CRM MCP tokens", value: 4000, tag: "[FICTION]" },
    ],
  },

  coldOpen: L11_COLD_OPEN,
  sequence: L11_SEQUENCE,
  predictions: L11_PREDICTIONS,
  toasts: L11_TOASTS,
  interactionPatterns: [
    "predict-before-reveal",
    "just-in-time-toast",
    "counterfactual-after-attempt",
  ],

  failLesson: {
    bucket: "none",
    cite: "CapabilitySeed",
    line:
      "Removing required context blocks work; unused context completes work but repeats its write cost.",
  },
  failureRules: [],
  checkpoints: [
    {
      id: "cp-loadout",
      createBeforeEventId: "ev-select-loadout",
      reason: "decision",
      resumeLabel: "Repack before the run",
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
    label: "Packed from the prose",
    predicate: {
      id: "first-attempt-minimal-under-reference",
      kind: "all",
      predicates: [
        {
          id: "first-attempt-minimal",
          kind: "event-completed",
          eventId: "ev-first-attempt-priced-run-minimal",
        },
        {
          id: "reference-threshold",
          kind: "compare",
          path: "wallet.spentUsd",
          op: "lte",
          value: L11_REFERENCE_TOTAL_USD,
        },
      ],
    },
    reason:
      "The first submitted loadout was smallest-sufficient and met the reference threshold.",
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
    memoryFiles: 10,
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
        memoryFiles: 10,
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

The `mcp-required` scenario adapter maps `referenceCfg` deterministically to Repo Navigator, Team Conventions, and CRM MCP. Its all-loaded mapping selects the eager catalog, all ten memory files, and all four MCP servers. The compound packer is one screen mechanic even though it dispatches the canonical skill, memory, and MCP control actions.

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
          path: "units.checkout.status",
          op: "eq",
          value: "done",
        },
        {
          id: "policy-completed",
          kind: "compare",
          path: "units.policy.status",
          op: "eq",
          value: "done",
        },
        {
          id: "crm-completed",
          kind: "compare",
          path: "units.crm.status",
          op: "eq",
          value: "done",
        },
      ],
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

`passLevel11` is pure and evaluates only `L11_GATE`; it never reads a prediction option or correctness flag.

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

Every successful workspace is an independent cold namespace:

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

`SKILL_BODY_TOK = 1,744` derives from `C32`; `MEMORY_PER_FILE` is `[FICTION]`; the CRM entry is the `[FICTION]` split in `C24`.

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

The eager catalog is `C7`; memory files are `[FICTION]`; the MCP total and fixture split are `C24`.

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

The core choice therefore has a visible economic tradeoff: all-loaded succeeds functionally but costs about `21.87%` more than the smallest-sufficient loadout.

### Deficient loadout accounting

An absent capability produces no `Request`, `LedgerRow`, tape segment, cache mutation, or wallet deduction for the blocked ticket. The UI says **“No request sent”** rather than displaying a zero-dollar request.

For completed rows on a deficient branch, prefix bloat is compared only against the same number of reference requests. Unexecuted work is reported as a blocked-ticket count, never converted into invented API dollars.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"` and `hoverEnabled = true`.

For the player’s selected prefix `P`, successful rows appear in this order:

1. `pack-checkout`
   - `writeTok=P`, red
   - `inputTok=WORK_IN`, red
   - `outTok=WORK_OUT`, violet
2. `pack-policy`
   - the same ordered buckets in a distinct cold namespace
3. `pack-crm`
   - the same ordered buckets in a third cold namespace

A deficient run contains only rows for tickets that actually executed; no placeholder row represents the blocked ticket.

`ahaRequestId = "pack-crm"`. When its write segment lands, ghost outlines align the three selected-prefix writes and the meter changes from **“{P} packed”** to **“{P} × 3 cold starts.”**

Every `WireSegment`, including output, uses the canonical truthful geometry:

```text
segment.widthRatio = segment.usd / LedgerRow.usd
segment.startRatio = prior segment USD / LedgerRow.usd
```

Thus `outTok` contributes its full `RATE_OUTPUT` cost (`C1`, `C3`, `C28`) from the first rendered row. Hiding an output label never removes the violet segment’s visual weight.

After `cold-repeat` commitment, `all-loaded` overlays the wider anti-pattern write segments beneath the completed player tape. The overlay is unavailable pre-play.

## 8. Prediction prompts

### `pack-outcome`

Shown after the player packs a loadout and before any ticket runs.

> **What will this exact loadout do across the three tickets?**

- `complete-tight`: **“Complete all three with little unused context.”**
- `complete-bloated`: **“Complete all three while unused context repeats.”**
- `blocked`: **“Stop when a ticket needs something that was not packed.”**

The prompt does not display required badges or identify a correct provider. Correct-state styling appears only after the run stops or completes. Any option may be wrong without affecting score, stars, wallet, failure, or gate passage.

### `cold-repeat`

Shown after a capability-complete attempt and before `all-loaded` is revealed.

> **If every optional card is packed for the same three fresh workspaces, which priced bucket grows on all three requests?**

- `writes`: **“The cold prefix writes.”**
- `outputs`: **“The generated answers.”**
- `requirements`: **“The tickets’ capability needs.”**

Correct option: `writes`. Commitment is required for the reveal; correctness is not required for completion.

The post-evidence `keep-required-remove-unused` explanation in §4 is not a prediction. It is a retriable causal choice after the player has seen actual ticket and tape evidence, and it is the action observed by the behavioral gate.

## 9. Fail-state

### Missing capability

Decisive event: the first `SUBMIT_LOADOUT` whose ticket requires an absent capability.

One-line cause copy uses the concrete ticket:

- **“Checkout fix stopped: repository navigation was not packed.”**
- **“Policy update stopped: team conventions were not packed.”**
- **“Customer sync stopped: the CRM schema was not packed.”**

Behavior:

- The blocked card shakes once and confirms only its missing capability badge.
- No request or priced placeholder is created for the blocked ticket.
- Previously completed rows and spend remain visible until the player chooses retry.
- Remaining ticket requirements stay unconfirmed.
- `Clock.frozen` remains `false`.
- No `FREEZE_FAILURE` or `FailureRuleDef` is emitted because the blocked branch has not incurred a higher API cost than successful completion.
- `REVEAL_PREDICTION` may now show what happened, but prediction correctness remains non-punitive.
- `COMPLETE_ATTEMPT` records a local unsuccessful attempt.
- `UI_REWIND_CONTROL` copy: **“Repack before the run.”**
- `REWIND_TO_CHECKPOINT { checkpointId: "cp-loadout" }` deterministically removes the abandoned branch’s rows, cache entries, and wallet deductions, retains the attempt count, and returns to the loadout decision without replaying the cold-open.

A capability-complete bloated loadout is not stopped: it must finish so its genuine repeated write cost can become evidence. It fails the behavioral gate only if the player refuses to correct the next-batch plan after that evidence.

This non-freezing stop is intentional: inventing a charged request or freezing a cheaper branch would violate causal accounting and the canonical economically-true-freeze rule.

## 10. Gate & stars

Behavioral pass predicate:

```text
all three tickets completed
AND ev-reveal-usage completed
AND after ev-reveal-usage the player acknowledged keep-required-remove-unused
AND the next-batch loadout contains exactly:
    Repo Navigator in invoke mode
    Team Conventions
    CRM MCP
AND the next-batch loadout contains no additional skill, memory, or MCP item
```

Neither `pack-outcome` nor `cold-repeat` commitment, selected option, or correctness appears in `L11_GATE`, `passLevel11`, a star predicate, a wallet mutation, or a failure decision. Predictions gate their reveals only.

Budget alone cannot pass.

- **1 star — Repacked:** the behavioral pass predicate holds.
- **2 stars — Smallest sufficient:** pass, and event `ev-priced-run-minimal` confirms that the completed priced run itself used the smallest-sufficient loadout.
- **3 stars — Packed from the prose:** two-star predicate holds, `ev-first-attempt-priced-run-minimal` confirms it happened on the first attempt, and `wallet.spentUsd <= L11_REFERENCE_TOTAL_USD`.

A bloated first run followed by a correct post-evidence repack earns one star. A corrected smallest-sufficient run after an insufficient attempt can earn two. The first-attempt reference route earns three.

Result copy:

- Pass headline: **“Every ticket shipped.”**
- One-star evidence: **“The next batch carries only confirmed needs.”**
- Two-star evidence: **“Three capabilities packed. Three cold starts. No passengers.”**
- Three-star evidence: **“You inferred the loadout before the badges appeared.”**
- Deficient-attempt headline: **“One card short.”**
- Uncorrected-bloat headline: **“The work shipped; the suitcase still has passengers.”**
- Bloat evidence: **“Unused context added {bloatUsd} across the completed cold writes.”**

## 11. Toasts

- `toast-prefix-size`
  - Trigger: first loadout mutation.
  - Copy: **“Packed prefix: {totalTok} tokens.”**
  - Priority: `status`
  - Dedupe: `attempt`

- `toast-cold-one`
  - Trigger: ledger append for `pack-checkout`.
  - Copy: **“Workspace 1 started cold · WRITE {writeTok}.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-requirement-confirmed`
  - Trigger: a ticket resolves or stops for a missing capability.
  - Copy: **“Confirmed need: {capabilityLabel}.”**
  - Priority: `cause`
  - Dedupe: `never`

- `toast-cold-two`
  - Trigger: ledger append for `pack-policy`.
  - Copy: **“New workspace, same packed prefix · WRITE again.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-multiplied`
  - Trigger: ledger append for `pack-crm`.
  - Copy: **“{writeTok} packed tokens × 3 cold starts.”**
  - Priority: `teaching`
  - Dedupe: `attempt`

- `toast-missing`
  - Trigger: `ev-loadout-insufficient`.
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
  - Copy: **“Unused here still meant loaded everywhere.”**
  - Priority: `cause`
  - Dedupe: `attempt`

- `toast-reference`
  - Trigger: `all-loaded` counterfactual reveal.
  - Copy: **“All-loaded added {bloatUsd} across identical work.”**
  - Priority: `teaching`
  - Dedupe: `level`

No toast identifies a required provider before that requirement is confirmed by play.

## 12. QA gate

Real-browser click-through must assert:

1. The first loadout control is enabled by `ColdOpenDef.firstInteractiveBySec`.
2. Before the first run, ticket cards contain prose but no capability badges, provider links, correctness colors, reference loadout, bloat delta, or smallest-sufficient rule.
3. The prose and card descriptions provide inferable evidence; the decision is neither blind nor a dial-to-maximum.
4. Every loadout setter changes only `LoadoutState` and the corresponding `PrefixBlock`; it creates no request or wallet mutation.
5. **Run tickets** is disabled until `pack-outcome` is committed.
6. A wrong `pack-outcome` or `cold-repeat` prediction changes no score, star, wallet, failure, or gate result.
7. A missing first, second, or third capability stops on that exact ticket and creates no `Request`, `LedgerRow`, tape row, cache mutation, or displayed zero-dollar row.
8. A missing-capability stop does not dispatch `FREEZE_FAILURE`; L11 contains no economically false freeze.
9. The missing badge appears only after the corresponding ticket resolves or stops; unreached ticket badges remain hidden.
10. Retry returns deterministically to `cp-loadout`, restores wallet and cache state for the abandoned branch, retains attempt count, and does not replay the cold-open.
11. The gate observes `ACK_EXPLANATION` after `ev-reveal-usage`; pre-reveal prediction data is absent from `passLevel11`.
12. The all-loaded configuration completes the work but fails the behavioral gate until the player removes confirmed passengers from the next-batch plan.
13. The reference configuration completes all tickets, passes the transfer gate, and earns three stars from the fixed seed.
14. A successful reference run yields exactly three ledger rows and three `TapeRenderer` rows.
15. Each rendered row corresponds to one priced request; its non-zero segments match the resolved buckets and sum exactly to `LedgerRow.usd`.
16. Tape bar and segment widths include output USD from the first row, including in static non-hover rendering.
17. Every real request has `usd > 0`; no positive cost renders as `$0.0000`.
18. Reference pricing equals `L11_REFERENCE_REQUEST_USD` per row and `L11_REFERENCE_TOTAL_USD` for the run.
19. All-loaded pricing equals `L11_ANTI_REQUEST_USD` per row and `L11_ANTI_TOTAL_USD` for the run.
20. The revealed comparison equals `L11_BLOAT_DELTA_USD`; no second price table or superseded value exists.
21. All three `MAIN_SESSION_CONTEXT` instances have distinct cache namespaces; every successful row has `readTok=0`.
22. Missing-capability count and prefix-bloat dollars are distinct evidence types; unfinished work is never assigned an invented API price.
23. Reference and all-loaded counterfactuals remain hidden until a completed attempt and `cold-repeat` commitment.
24. Prediction correctness is absent from all gate, star, failure, and budget predicates.
25. Narrow viewport preserves ticket prose, loadout cards, packed-token meter, and primary action without horizontal page scrolling.
26. Keyboard-only play can inspect every card, alter each loadout class, commit both predictions, run, acknowledge the post-evidence explanation, repack, reveal the comparison, and retry.
27. Pointer and keyboard paths dispatch equivalent actions.
28. Reduced-motion mode produces identical final ledger, tape, badge, comparison, and gate evidence.
29. Every authoritative quantity resolves to the single computation in §6; no stale or alternative total is implementable.
30. `id`, `concept.id`, and both prerequisites compile against the canonical registries.
31. The all-loaded delta exceeds the visible-tradeoff target, while the underpacked route remains a genuine capability risk.
32. Every `WireSegment.widthRatio` and `startRatio` is derived from USD, so output-heavy requests are not visually misrepresented.

## 13. Reference-bar justification

The screen opens with a tactile packing problem and enough prose to reason from, but no badge-shaped answer key. The player must balance two live risks: omit something needed and stop a ticket, or pack passengers that repeat across three cold prefixes. Each ticket confirms its requirements only through play, and the third cold write turns the chosen prefix into a visible multiplier.

The design keeps causal accounting honest. Missing context creates no fictional charge and therefore no false economic freeze; bloated context is allowed to complete so its real ledger penalty can speak for itself. After seeing the used/passenger evidence, the player must act again by stating the rule and packing the next batch accordingly. That post-evidence remediation—not prediction correctness—passes the level.

The output-inclusive tape preserves the true cost mix while still making the growing write share visible. A rewindable insufficient attempt, a materially more expensive all-loaded route, and a locked post-attempt counterfactual produce the discovery rhythm without exposing the solution before play.
