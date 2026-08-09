# Level 11 — Pack the Context

## 1. Identity

- `id`: `l11-pack-the-context`
- `title`: **Pack the Context**
- `tier`: `3`
- `objective`: “Three tickets, three fresh workspaces. Pack what the team needs.”
- `concept.id`: `smallest-sufficient-prefix`
- `concept.privateDesignerSummary`: Every always-loaded token is rewritten across independent cold bases; the optimum is the smallest capability-complete loadout.
- `concept.postRevealRule`: “Pack every required capability—and nothing the tickets do not use.”
- `prerequisiteConceptIds`: `prefix-size`, `cold-base`, `workload-needs`

## 2. Objects used

- `LevelDef`
- `ReducerState`
- `Action`
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
- `Wallet`
- `TapeRenderer`
- `UI_PREFIX_STACK_VISUALIZER`
- `UI_PREDICTION_PROMPT`
- `UI_TOAST_SYSTEM`
- `UI_REWIND_CONTROL`
- `PATTERN_PREDICT_BEFORE_REVEAL`
- `PATTERN_FAIL_FREEZE_REWIND`
- `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

## 3. Cold-open / narrative

`ColdOpenDef.maxInstructionCards = 0`; `firstInteractiveBySec = 2` `[ESTIMATE]`.

- **0.0s:** Three sealed ticket cards slap onto three workspace docks: **“Checkout fix”**, **“Policy update”**, **“Customer sync.”**
- **0.5s:** Each card exposes capability badges only:
  - Checkout fix: `repo-navigation`
  - Policy update: `repo-navigation`, `team-conventions`
  - Customer sync: `repo-navigation`, `team-conventions`, `crm-schema`
- **1.0s:** The `UI_PREFIX_STACK_VISUALIZER` opens beside a size meter. Optional items sit loose on the desk.
- **1.5s:** Copy: **“Each workspace starts cold. Pack one loadout for all three.”**
- **2.0s:** Skill, memory, and MCP items become draggable/toggleable. Primary control: **Run tickets**.
- No price comparison, recommended loadout, or “smallest sufficient” language appears before submission.

Available loadout cards:

| Item | Object | Tokens | Capability |
|---|---|---:|---|
| Repo Navigator | `PB_SKILLS` entry | `1,744` | `repo-navigation` |
| Release Notes | `PB_SKILLS` entry | `1,744` | `release-notes` |
| Team Conventions | `PB_MEMORY` file | `400` `[FICTION]` | `team-conventions` |
| Personal Scratchpad | `PB_MEMORY` file | `400` `[FICTION]` | `personal-notes` |
| CRM MCP | `PB_MCP` server | `4,000` `[FICTION]` | `crm-schema` |
| Browser MCP | `PB_MCP` server | `6,295` `[FICTION]` | `browser-control` |
| Issues MCP | `PB_MCP` server | `3,000` `[FICTION]` | `issue-tracking` |
| Deploy MCP | `PB_MCP` server | `3,000` `[FICTION]` | `deployment` |

Skill body size is derived from `C32`; memory size is the named `MEMORY_PER_FILE`; MCP fixture sizes trace to `C24`.

## 4. Exact event sequence

1. **Enter level** → `ENTER_LEVEL { levelId: "l11-pack-the-context" }` → initializes `ReducerState`, `Wallet($12)`, three `MAIN_SESSION_CONTEXT` namespaces, ticket capability badges, empty optional `selectedLoadout`, and `PREFIX_STACK` → fixed base is `PB_SYSTEM 2,750 + PB_INSTRUCTIONS 2,610 = 5,360` tokens (`C6`, `CATALOG_RESIDUE`).

2. **Create decision boundary** → `CREATE_CHECKPOINT { checkpointId: "cp-loadout", reason: "decision" }` → appends `Checkpoint`; no economic mutation.

3. **Select skills** → `SET_SKILL_LOADOUT { skillIds, mode: "invoke" | "eager" }` → mutates `selectedLoadout` and `PB_SKILLS`; size meter updates:
   - invoked selected body: approximately `1,744` tokens each (`C32`);
   - eager full catalog: `13,083` tokens (`C7`);
   - no request or wallet mutation.

4. **Select memory** → `SET_MEMORY_LOADOUT { memoryIds }` → mutates `selectedLoadout` and `PB_MEMORY` by `400` tokens per selected file `[FICTION]`; no request or wallet mutation.

5. **Select MCP servers** → `SET_MCP_LOADOUT { serverIds }` → mutates `selectedLoadout` and `PB_MCP`; server sizes are `6,295/4,000/3,000/3,000` tokens (`C24`, fixture split `[FICTION]`); no request or wallet mutation.

6. **Commit the consequence prediction** → `OPEN_PREDICTION { promptId: "pack-outcome" }`, `SELECT_PREDICTION`, then `COMMIT_PREDICTION` → locks the player’s forecast; tickets remain unrun and prices remain hidden.

7. **Run Checkout fix** → `SUBMIT_LOADOUT { ticketId: "checkout" }`:
   - If `repo-navigation` is absent, dispatch the failure described in §9 before any request.
   - Otherwise resolve request `pack-checkout`; mutate its `PREFIX_STACK`, create its `CacheEntry`, append one `LedgerRow`, deduct its price from `Wallet`, and mark the ticket complete.
   - Reference loadout prefix: `5,360 + 1,744 + 400 + 4,000 = 11,504` write tokens.
   - Request buckets: `writeTok=11,504`, `inputTok=6,000`, `outTok=44,000`, `readTok=0` (`C28`).

8. **Run Policy update** → `SUBMIT_LOADOUT { ticketId: "policy" }`:
   - If `team-conventions` is absent, freeze before request `pack-policy`.
   - Otherwise create the second cold `CacheEntry`, append its identically bucketed row, deduct cost, mark complete.
   - The first workspace’s cache does not cross namespaces.

9. **Run Customer sync** → `SUBMIT_LOADOUT { ticketId: "crm" }`:
   - If `crm-schema` is absent, freeze before request `pack-crm`.
   - Otherwise create the third cold `CacheEntry`, append its identically bucketed row, deduct cost, mark complete.
   - This is the decisive multiplication frame: the selected prefix appears as a third red write.

10. **Reveal prediction** → `REVEAL_PREDICTION { promptId: "pack-outcome", correctOptionId }` → mutates `prediction`, enters `"reveal"`, and exposes the loss split:
    - **Missing-capability cost:** blocked ticket count and unexecuted work; API spend before the blocked request is `$0`.
    - **Prefix-bloat cost:** actual spend minus the same successful requests using the reference loadout.
    - Neither bucket is shown before the attempt.

11. **Complete attempt** → `COMPLETE_ATTEMPT` → evaluates behavioral gate and stars. On pass, unlock the named rule and counterfactual controls.

12. **Post-attempt comparison** → `REQUEST_COUNTERFACTUAL { comparisonId: "all-loaded" }`, then `REVEAL_COUNTERFACTUAL` → renders reference and anti-pattern ledgers using the same three tickets and seed; it does not replace actual state.

## 5. Level data

```ts
const level11: LevelDef = {
  id: "l11-pack-the-context",
  tier: 3,
  title: "Pack the Context",
  objective: "Three tickets, three fresh workspaces. Pack what the team needs.",
  concept: {
    id: "smallest-sufficient-prefix",
    privateDesignerSummary:
      "Every always-loaded token multiplies across cold bases; optimize subject to capability sufficiency.",
    postRevealRule:
      "Pack every required capability—and nothing the tickets do not use.",
  },
  prerequisiteConceptIds: ["prefix-size", "cold-base", "workload-needs"],

  unlocks: "loadout-packer",
  introducedControls: ["loadout-packer"],
  cfgLocked: [
    "orchestratorModel",
    "planModel",
    "devModel",
    "who",
    "prompts",
    "width",
    "oneHourFlag",
    "keepWarm",
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
      { id: "checkout", label: "Checkout fix" },
      { id: "policy", label: "Policy update" },
      { id: "crm", label: "Customer sync" },
    ],
    contexts: [
      { id: "ws-checkout", kind: "main" },
      { id: "ws-policy", kind: "main" },
      { id: "ws-crm", kind: "main" },
    ],
    capabilities: [
      { id: "repo-navigation", requiredBy: ["checkout", "policy", "crm"] },
      { id: "team-conventions", requiredBy: ["policy", "crm"] },
      { id: "crm-schema", requiredBy: ["crm"] },
    ],
    estimates: [
      { label: "seed", value: 11011, tag: "[FICTION]" },
      { label: "memory file tokens", value: 400, tag: "[FICTION]" },
      { label: "CRM MCP tokens", value: 4000, tag: "[FICTION]" },
    ],
  },

  interactionPatterns: [
    "PATTERN_PREDICT_BEFORE_REVEAL",
    "PATTERN_FAIL_FREEZE_REWIND",
    "PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT",
  ],

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
};
```

Reference loadout: Repo Navigator + Team Conventions + CRM MCP.  
Anti-pattern loadout: eager full skill catalog + ten memory files + all four MCP servers.

## 6. Pricing walkthrough

All three workspaces are independent cold `MAIN_SESSION_CONTEXT` namespaces and use Sonnet with `CACHE_TIER_1H`. Sonnet prices are write `$6/M`, input `$3/M`, and output `$15/M` (`C1`, `C3`). Each ticket adds `6,000` fresh-input and `44,000` output tokens (`C28`).

### Three-star reference

Reference prefix:

```text
5,360 fixed
+ 1,744 Repo Navigator
+   400 Team Conventions
+ 4,000 CRM MCP
= 11,504 writeTok
```

Per request:

```text
write:  11,504 × $6/M  = $0.069024
input:   6,000 × $3/M  = $0.018000
output: 44,000 × $15/M = $0.660000
total                    $0.747024
```

Three cold requests:

```text
3 × $0.747024 = $2.241072
```

`referenceTotalUsd = 2.241072`.

### Anti-pattern

Anti-pattern prefix:

```text
5,360 fixed
+ 13,083 eager skill catalog (C7)
+  4,000 ten memory files [FICTION]
+ 16,295 all MCP schemas (C24)
= 38,738 writeTok
```

Per request:

```text
write:  38,738 × $6/M  = $0.232428
input:   6,000 × $3/M  = $0.018000
output: 44,000 × $15/M = $0.660000
total                    $0.910428
```

Three cold requests:

```text
3 × $0.910428 = $2.731284
```

`antiPatternTotalUsd = 2.731284`.

Post-attempt bloat reveal:

```text
$2.731284 − $2.241072 = $0.490212
```

The excess `27,234` prefix tokens are written three times; the comparison labels the MCP split and memory sizes `[FICTION]`.

### Deficient loadout

A missing capability produces no hidden model request. The decisive ticket remains unexecuted, so its API cost is `$0`; the loss panel reports:

```text
Missing-capability loss: 1 blocked ticket
Prefix-bloat loss: actual successful-request spend − reference spend for those same requests
```

This preserves causal accounting without inventing a dollar value for unfinished work.

## 7. Tape sequence

`TapeSpec.rowSource = "ledger"`; hover is enabled.

Ordered request rows:

1. `pack-checkout`
   - `write 11,504` red
   - `input 6,000` red
   - `output 44,000` violet
2. `pack-policy`
   - same ordered segments
3. `pack-crm`
   - same ordered segments

The tape is initially empty. Rows animate only after the committed prediction and successful `SUBMIT_LOADOUT`.

`ahaRequestId = "pack-crm"`: the third cold-write segment lands while ghost outlines align all three copies of the packed prefix. Only then does the size meter relabel from **“11,504 packed”** to **“11,504 × 3 cold starts.”**

Post-attempt `all-loaded` reveal overlays the anti-pattern’s three wider red write segments beneath the player tape; it never appears pre-play.

## 8. Prediction prompts

### `pack-outcome`

Question:

> **What will this exact loadout do across the three tickets?**

Options are generated from the committed loadout:

- `complete-tight`: **“Complete all three; little unused context.”**
- `complete-bloated`: **“Complete all three; unused context repeats.”**
- `blocked`: **“Stop when a required capability is missing.”**

The widget shows no correct-state styling until all runnable tickets resolve or a capability failure freezes.

### `cold-repeat`

Shown after a capability-complete first attempt and before the counterfactual:

> **If every optional item is packed too, which part grows on all three requests?**

- `writes`: **“The cold prefix writes.”**
- `outputs`: **“The generated answers.”**
- `requirements`: **“The tickets’ capability needs.”**

Correct option: `writes`. The anti-pattern tape remains locked until commitment.

## 9. Fail-state

Decisive event: the first `SUBMIT_LOADOUT` whose ticket requires an absent capability.

Reducer action:

```ts
FREEZE_FAILURE {
  failure: {
    failureId: "missing-capability",
    causeCode: "LOADOUT_INSUFFICIENT",
    message: "Customer sync stopped: CRM schema was not packed.",
    checkpointId: "cp-loadout"
  }
}
```

Use the concrete ticket and missing badge in `message`; never list future ticket requirements beyond those already printed on the cards.

Freeze behavior:

- `Clock.frozen = true`.
- The blocked ticket shakes once; its missing badge drops into the empty slot in `PREFIX_STACK`.
- No `Request`, `LedgerRow`, tape segment, cache mutation, or wallet deduction is created for that ticket.
- Completed earlier tickets and spend remain visible as causal evidence.
- Loss split reads: **“Missing capability: 1 blocked ticket · Prefix bloat: not scored until all three complete.”**
- `UI_REWIND_CONTROL` copy: **“Repack from before the run.”**
- `REWIND_TO_CHECKPOINT { checkpointId: "cp-loadout" }` restores the loadout decision boundary, retains attempt count, and leaves the missing capability badge pulsing. The opening animation and mastered ticket reading are not replayed.

If all requirements are present but unused items remain, do not freeze; complete the run and expose bloat after the prediction reveal.

## 10. Gate & stars

Behavioral pass predicate:

```text
all three tickets completed
AND selected loadout provides repo-navigation
AND selected loadout provides team-conventions
AND selected loadout provides crm-schema
AND prediction pack-outcome was committed before the first submission
AND prediction cold-repeat was committed before the anti-pattern reveal
```

Budget alone cannot pass the level.

- **1 star — Sufficient:** behavioral pass predicate holds.
- **2 stars — Purposeful:** pass, and no selected item provides a capability required by zero tickets.
- **3 stars — Smallest sufficient:** pass, selected loadout is exactly Repo Navigator + Team Conventions + CRM MCP, `skillsMode="invoke"`, total packed prefix `11,504`, and spend is at most `$2.241072`.

Result copy:

- Pass headline: **“Every ticket shipped.”**
- Three-star evidence: **“Three capabilities packed. Three cold starts. No passengers.”**
- Non-minimal pass evidence: **“The work shipped; unused context added {bloatUsd} across the three cold writes.”**
- Fail headline: **“The suitcase closed too soon.”**

## 11. Toasts

- `toast-requirements`
  - Trigger: first hover/focus on a ticket badge.
  - Copy: **“Badges are requirements, not hints.”**

- `toast-prefix-size`
  - Trigger: first loadout mutation.
  - Copy: **“Packed prefix: {totalTok} tokens.”**

- `toast-cold-one`
  - Trigger: ledger append for `pack-checkout`.
  - Copy: **“Workspace 1 started cold · WRITE {writeTok}.”**

- `toast-cold-two`
  - Trigger: ledger append for `pack-policy`.
  - Copy: **“New workspace, same packed prefix · WRITE again.”**

- `toast-multiplied`
  - Trigger: ledger append for `pack-crm`.
  - Copy: **“{writeTok} packed tokens × 3 cold starts.”**

- `toast-missing`
  - Trigger: `LOADOUT_INSUFFICIENT`.
  - Copy: **“Missing capability: {capabilityLabel}. No request was sent.”**

- `toast-bloat`
  - Trigger: successful reveal with unused selected items.
  - Copy: **“Unused here still means loaded everywhere.”**

- `toast-reference`
  - Trigger: post-attempt `all-loaded` reveal.
  - Copy: **“Extra loadout cost: +${bloatUsd} across identical work.”**

## 12. QA gate

Real-browser click-through must assert:

1. First interactive loadout control is enabled by `2s` `[ESTIMATE]`.
2. No pre-play text names the reference loadout, total, bloat delta, or smallest-sufficient rule.
3. Ticket requirements are visible before selection and do not change with the seed.
4. Every loadout setter changes only `selectedLoadout` and the corresponding `PrefixBlock`; it creates no ledger row.
5. **Run tickets** is prediction-gated.
6. A missing first, second, or third capability freezes on that exact ticket and creates no priced request for it.
7. Rewind returns to `cp-loadout` without replaying the cold-open.
8. A capability-complete bloated loadout passes the behavioral gate but cannot earn stars 2 or 3.
9. The reference loadout completes all three tickets and earns three stars.
10. Reference ledger has exactly three rows; `TapeRenderer` has exactly three rows.
11. Each tape row’s segments equal its priced buckets and sum to its `LedgerRow.usd`.
12. Every real request has `usd > 0`; no positive price displays as `$0.0000`.
13. Reference request price is exactly `$0.747024`; reference total is `$2.241072`.
14. Anti-pattern request price is exactly `$0.910428`; anti-pattern total is `$2.731284`.
15. Revealed bloat delta is exactly `$0.490212`.
16. The three contexts have distinct cache namespaces; no row incorrectly receives `readTok`.
17. Missing-capability loss and prefix-bloat loss are rendered as separate named buckets.
18. Counterfactual controls and answers remain hidden until a completed attempt and committed `cold-repeat` prediction.
19. Narrow viewport preserves ticket badges, size meter, and primary action without horizontal page scrolling.
20. Keyboard-only play can inspect requirements, alter all three loadout classes, commit predictions, submit, and rewind.

## 13. Reference-bar justification

The screen opens on a tactile packing problem, exposes every functional constraint, and withholds the economic answer. The player first risks insufficiency, then watches the same chosen prefix land on independent cold starts. A deficient choice fails locally at the missing badge; a bloated choice succeeds and only afterward reveals its repeated red width. The two loss buckets prevent the false lesson that disabling everything is optimal, while the transfer prediction makes the player name which priced bucket grows before the all-loaded comparison appears. One compact control, immediate motion, rewindable causality, and a post-attempt counterfactual create the discovery rhythm without a pre-solved tutorial.
