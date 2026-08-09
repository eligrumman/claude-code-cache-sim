# OBJECT_MODEL.md

> Canonical shared vocabulary for all `claude-code-cache-sim` level specifications. A level specification references the stable names defined here and supplies only level-specific values, ordering, copy, and gates.
>
> Numbers are measured constants when a `C` citation is present. Calibrated simulation values are marked `[FICTION]`; proposed presentation timings and dimensions are marked `[ESTIMATE]`.

## 1. Core invariants

1. **Determinism.** Given a `seed`, initial `LevelDef`, and ordered `Action[]`, replay produces byte-identical `ReducerState`, ledger, wallet, and result.
2. **One ledger row per request.** Every priced request produces exactly one `LedgerRow`; every tape row corresponds to exactly one ledger row.
3. **No hidden economics.** UI components display prices but never calculate authoritative cost. Pricing belongs to `PricingFunction`.
4. **Exact engine, rounded display.** State stores unrounded USD values. UI rounds only for display.
5. **No false zero.** Any positive cost that would render as `$0.0000` uses a more precise representation such as `$0.00003` or `<$0.0001`.
6. **Prefix ordering matters.** Cache reuse is based on the longest byte-identical prefix, not semantic similarity.
7. **TTL is idle time.** A live cache expires when `clock.min - lastTouchMin >= ttlMin`. A cache read refreshes `lastTouchMin`.
8. **Context isolation.** Main sessions and subagents never share cache entries unless a scenario explicitly models a shared subagent prefix pool.
9. **Prediction precedes revelation.** A reveal requiring prediction cannot execute until a prediction has been committed.
10. **Failure is local.** Teaching failures freeze at the decisive event and rewind to the nearest checkpoint without replaying mastered setup.
11. **Gates measure behavior.** Passing cannot depend on budget alone where the level teaches a specific causal decision.
12. **Post-attempt comparisons only.** Reference and anti-pattern runs remain hidden until the player has completed an attempt.

---

## 2. Primitive objects

### 2.1 `Token`

The smallest priced text unit.

```ts
type TokenId = string;

interface Token {
  id: TokenId;
  ordinal: number;
  text?: string;
  byteHash: string;
  sourceBlockId: PrefixBlockId;
}
```

`byteHash` represents exact serialized identity. Cache matching uses ordered token hashes, never displayed wording or semantic equivalence. UI may aggregate tokens; the engine may represent them as counts plus deterministic hashes rather than allocate individual objects.

### 2.2 `TokenCount`

```ts
type TokenCount = number; // non-negative safe integer
```

All token buckets must be non-negative integers:

- `readTok`: cached prefix read at `0.1x`.
- `inputTok`: uncached input not written to a cache breakpoint, at `1x`.
- `writeTok`: prefix written at the selected cache tier.
- `outTok`: generated output, at `5x`.

A token may belong to exactly one input-side bucket in a single request: `readTok`, `inputTok`, or `writeTok`.

### 2.3 `PrefixBlockKind`

The complete reusable prefix vocabulary:

```ts
type PrefixBlockKind =
  | "system"
  | "tools"
  | "instructions"
  | "skills"
  | "memory"
  | "mcp"
  | "history"
  | "current";
```

Stable display order:

1. `system`
2. `tools`
3. `instructions`
4. `skills`
5. `memory`
6. `mcp`
7. `history`
8. `current`

Meanings:

| Kind | Stable name | Meaning | Typical stability |
|---|---|---|---|
| `system` | `PB_SYSTEM` | Model/system bootstrap text | Stable |
| `tools` | `PB_TOOLS` | Built-in tool definitions | Stable until tool configuration changes |
| `instructions` | `PB_INSTRUCTIONS` | Project and session instructions | Usually stable |
| `skills` | `PB_SKILLS` | Skill catalog or invoked skill bodies | Configuration-dependent |
| `memory` | `PB_MEMORY` | Always-loaded memory files | Stable until files change |
| `mcp` | `PB_MCP` | Enabled MCP tool schemas | Stable until server selection/schema changes |
| `history` | `PB_HISTORY` | Prior conversation and tool traffic | Grows during a main session |
| `current` | `PB_CURRENT` | Current user/task payload | Normally fresh and should be late |

### 2.4 `PrefixBlock`

```ts
type PrefixBlockId = string;

interface PrefixBlock {
  id: PrefixBlockId;
  kind: PrefixBlockKind;
  label: string;
  tokenCount: TokenCount;
  identityHash: string;
  order: number;
  cacheable: boolean;
  breakpointAfter: boolean;
  stability: "stable" | "session" | "volatile";
  requiredCapability?: string;
  source?: string;
}
```

Contracts:

- Blocks are serialized in ascending `order`.
- `identityHash` changes if any byte in the serialized block changes.
- A mismatch in block `i` prevents reuse of block `i` and every later block until a valid later breakpoint is modeled.
- `current` is present exactly once and last unless a level intentionally teaches harmful ordering.
- A cache breakpoint requires at least `MIN_CACHEABLE_PREFIX = 1,024` tokens (`C26`).
- At most `MAX_BREAKPOINTS = 4` breakpoints may be active (`C26`).
- Missing required capabilities may fail work; therefore minimizing prefix size is constrained by task sufficiency.

### 2.5 `PrefixStack`

```ts
interface PrefixStack {
  blocks: PrefixBlock[];
  totalTok: TokenCount;
  firstMismatchBlockId: PrefixBlockId | null;
  matchedPrefixTok: TokenCount;
  invalidatedSuffixTok: TokenCount;
}
```

Derived invariants:

```ts
totalTok = sum(block.tokenCount)
matchedPrefixTok = sum(blocks before first mismatch that belong to a live entry)
invalidatedSuffixTok = cacheable suffix after first mismatch
```

Stable name: `PREFIX_STACK`.

### 2.6 `Request`

One model invocation and the sole source of one priced ledger row.

```ts
type RequestId = string;
type Model = "sonnet" | "opus" | "fable";
type WriteTier = "5m" | "1h";

interface Request {
  id: RequestId;
  unitId: string;
  sequence: number;
  context: ExecutionContext;
  model: Model;
  prefix: PrefixStack;
  freshInputTok: TokenCount;
  expectedOutputTok: TokenCount;
  writeTier: WriteTier;
  sentAtMin: number;
  cachePolicy: "read-write" | "bypass";
}
```

Resolution yields:

```ts
interface PricedRequest {
  request: Request;
  readTok: TokenCount;
  inputTok: TokenCount;
  writeTok: TokenCount;
  outTok: TokenCount;
  cold: boolean;
  cacheEntryId: CacheEntryId | null;
  usd: number;
}
```

### 2.7 `CacheEntry`

```ts
type CacheEntryId = string;

interface CacheEntry {
  id: CacheEntryId;
  ownerContextId: string;
  prefixHash: string;
  tokenCount: TokenCount;
  tier: WriteTier;
  ttlMin: 5 | 60;
  createdAtMin: number;
  lastTouchMin: number;
  expiresAtMin: number;
  breakpointOrdinal: number;
}
```

Tier contracts:

| Tier | Stable name | Write multiplier | TTL |
|---|---|---:|---:|
| `5m` | `CACHE_TIER_5M` | `1.25x` | 5 minutes |
| `1h` | `CACHE_TIER_1H` | `2x` | 60 minutes |

```ts
expiresAtMin = lastTouchMin + ttlMin
isLive(entry, clock) = clock.min < entry.expiresAtMin
remainingMin = max(0, expiresAtMin - clock.min)
remainingRatio = remainingMin / ttlMin
```

A successful read updates `lastTouchMin` and `expiresAtMin`. Expiry does not delete historical ledger evidence.

### 2.8 `ExecutionContext`

```ts
type ExecutionContext =
  | MainSessionContext
  | SubagentContext;

interface MainSessionContext {
  kind: "main";
  id: string;
  sessionId: string;
  cacheNamespace: string;
  ttlTier: "1h";
  historyMode: "growing";
}

interface SubagentContext {
  kind: "subagent";
  id: string;
  parentSessionId: string;
  subagentId: string;
  sharedPrefixPoolId?: string;
  cacheNamespace: string;
  ttlTier: "5m";
  historyMode: "bounded";
}
```

#### `MAIN_SESSION_CONTEXT`

- Carries growing history.
- Uses the 60-minute main-cache lifetime (`C1`).
- Repeated work may reread an increasingly large history prefix.
- New sessions use new cache namespaces unless a scenario explicitly says otherwise.

#### `SUBAGENT_CONTEXT`

- Has an isolated, bounded context.
- Uses the 5-minute cache lifetime (`C1`, `C27`).
- May reuse an identical shared spawn prefix through `sharedPrefixPoolId`.
- Does not inherit the main session’s cache entry.
- The measured identical spawn prefix is `26,237` tokens (`C10`).

### 2.9 `WireSegment`

A visual subdivision of a request; it is not independently priced.

```ts
type WireSegmentKind = "read" | "input" | "write" | "output";

interface WireSegment {
  id: string;
  requestId: RequestId;
  kind: WireSegmentKind;
  tokenCount: TokenCount;
  multiplier: 0.1 | 1 | 1.25 | 2 | 5;
  usd: number;
  colorRole: "read-blue" | "write-red" | "output-violet";
  startRatio: number;
  widthRatio: number;
}
```

`input` and `write` use the red family because both represent newly paid input-side work. `read` uses blue. Output may be omitted from bar width before output pricing is introduced, but it remains present in the hover calculation and ledger.

### 2.10 `LedgerRow`

```ts
interface LedgerRow {
  requestId: string;
  unitId: string;
  tMin: number;
  agent: "main" | string;
  model: Model;
  readTok: number;
  inputTok: number;
  writeTok: number;
  outTok: number;
  writeTier: WriteTier;
  cold: boolean;
  usd: number;
}
```

Contracts:

- `usd > 0` for every real request.
- Token buckets and `usd` match `PricingFunction`.
- `cold === true` when no reusable live prefix exists for the request’s required base.
- The tape renders rows in ledger order.
- `lastRequests` is the exact contiguous subset produced by the latest unit action.

### 2.11 `Wallet` and `Budget`

```ts
interface Wallet {
  initialUsd: number;
  remainingUsd: number;
  spentUsd: number;
}

interface Budget {
  capUsd: number;
  targetUsd?: number;
  currency: "USD";
}
```

Invariants:

```ts
spentUsd = initialUsd - remainingUsd
remainingUsdAfter = remainingUsdBefore - pricedRequest.usd
```

`remainingUsd` may become negative to make overspend causal and visible. Budget failure alone must not substitute for a behavioral gate.

### 2.12 `Clock`

```ts
interface Clock {
  min: number;
  startMin: number;
  endMin: number;
  dayLengthMin: number;
  frozen: boolean;
}
```

- Unit: simulated minutes.
- Default work block: `DAY_LEN_MIN = 300` (`[FICTION]`).
- `ADVANCE` changes only `clock.min`; liveness is derived.
- Wall-clock animation never mutates simulation time directly.
- A UI drain animation batches committed whole simulated minutes into an `ADVANCE` action.

### 2.13 `Checkpoint`

```ts
interface Checkpoint {
  id: string;
  actionIndex: number;
  stateHash: string;
  reason: "prediction" | "decision" | "unit-start" | "level-start";
}
```

A checkpoint identifies a deterministic replay boundary. Rewind reconstructs state from the initial seed and actions before `actionIndex`; it does not mutate a past state snapshot in place.

---

## 3. Pricing engine

### 3.1 `RateTier`

The four input-side rate tiers requested by the curriculum are:

| Stable name | Bucket | Multiplier | Sonnet $/M | Opus $/M | Fable $/M |
|---|---|---:|---:|---:|---:|
| `RATE_INPUT` | Fresh input | `1x` | 3.00 | 5.00 | 10.00 |
| `RATE_CACHE_READ` | Cache read | `0.1x` | 0.30 | 0.50 | 1.00 |
| `RATE_CACHE_WRITE_5M` | 5-minute write | `1.25x` | 3.75 | 6.25 | 12.50 |
| `RATE_CACHE_WRITE_1H` | 1-hour write | `2x` | 6.00 | 10.00 | 20.00 |

Output is a separate generated-token rate:

| Stable name | Bucket | Multiplier | Sonnet $/M | Opus $/M | Fable $/M |
|---|---|---:|---:|---:|---:|
| `RATE_OUTPUT` | Output | `5x` | 15.00 | 25.00 | 50.00 |

Rate multipliers are `C1`; model bases are Sonnet `3`, Opus `5`, Fable `10` USD/M (`C2–C4`). The 1-hour-write-to-read ratio is `2 / 0.1 = 20x` (`C5`).

### 3.2 `PriceTable`

```ts
interface PriceRow {
  input: number;
  read: number;
  w5m: number;
  w1h: number;
  out: number;
}

function priceTable(model: Model): PriceRow;
```

```ts
priceTable(model) = {
  input: base,
  read: base * 0.1,
  w5m: base * 1.25,
  w1h: base * 2,
  out: base * 5
}
```

### 3.3 `PricingFunction`

Stable name: `PRICE_REQUEST`.

```ts
function priceRequest(args: {
  model: Model;
  readTok: number;
  inputTok: number;
  writeTok: number;
  outTok: number;
  writeTier: WriteTier;
}): number;
```

Canonical equation:

```text
base = MODEL_IN[model]

readUsd   = readTok  × 0.1                          × base / 1,000,000
inputUsd  = inputTok × 1                            × base / 1,000,000
writeUsd  = writeTok × (writeTier=="1h" ? 2 : 1.25) × base / 1,000,000
outputUsd = outTok   × 5                            × base / 1,000,000

totalUsd = readUsd + inputUsd + writeUsd + outputUsd
```

No rounding occurs inside `PRICE_REQUEST`.

### 3.4 `PrefixResolution`

Stable name: `RESOLVE_PREFIX`.

```ts
interface PrefixResolution {
  cacheEntryId: string | null;
  firstMismatchBlockId: string | null;
  readTok: number;
  inputTok: number;
  writeTok: number;
  invalidatedSuffixTok: number;
  cold: boolean;
}
```

Resolution order:

1. Select only live entries in the request’s cache namespace.
2. Find the longest byte-identical cacheable prefix.
3. Allocate matched tokens to `readTok`.
4. Allocate the cacheable unmatched prefix/suffix to `writeTok`.
5. Allocate non-cacheable fresh material to `inputTok`.
6. Create or refresh the appropriate `CacheEntry`.
7. Price the resolved buckets with `PRICE_REQUEST`.

---

## 4. Constants registry

This registry is the canonical meaning of every numbered citation used by the game. A level may cite a `C` number but must not redefine it.

| ID | Stable constant or fact | Canonical value | Provenance |
|---|---|---:|---|
| `C1` | `CACHE_RATE_AND_TTL` | Input `1x`; read `0.1x`; 5m write `1.25x`; 1h write `2x`; output `5x`; TTLs `5m`/`60m` | Measured pricing rules |
| `C2` | `OPUS_BASE_PRICE` | `$5/M` input; `$0.50/M` read; `$6.25/M` 5m write; `$10/M` 1h write; `$25/M` output | Derived from `C1` |
| `C3` | `SONNET_BASE_PRICE` | `$3/M` input; `$0.30/M` read; `$3.75/M` 5m write; `$6/M` 1h write; `$15/M` output | Derived from `C1` |
| `C4` | `FABLE_BASE_PRICE` | `$10/M` input; `$1/M` read; `$12.50/M` 5m write; `$20/M` 1h write; `$50/M` output | Derived from `C1` |
| `C5` | `REBUILD_TO_READ_RATIO_1H` | `20x` (`2 / 0.1`) | Derived |
| `C6` | `MAIN_PREFIX_MEASUREMENT` | System `2,750`; messages `15,693`; main “hey” prefix `34,738` tokens | Measured |
| `C7` | `FULL_SKILLS_CATALOG` | `13,083` tokens for 150 entries | Measured |
| `C8` | `CACHE_IDENTITY_RULE` | Reuse requires byte-identical ordered prefix content | Measured behavior; no scalar |
| `C9` | `PREFIX_INVALIDATION_RULE` | First mismatch invalidates the cacheable suffix after it | Measured behavior; no scalar |
| `C10` | `IDENTICAL_SUBAGENT_PREFIX` | First spawn writes `26,237`; later warm identical spawns read `26,237` | Measured |
| `C11` | `ONE_WORD_VARIATION` | `11,602` read + `14,623` rewrite per varied spawn | Measured |
| `C12` | `CACHE_TOUCH_RULE` | A cache hit refreshes idle TTL | Measured behavior; no scalar |
| `C13` | `IDLE_REBUILD_COUNT` | `272` rebuilds/month in the reference audit workload | Measured audit fixture |
| `C14` | `IDLE_REBUILD_COST` | `$575/month` in the reference audit workload | Derived from audit fixture |
| `C15` | `FLEET_ROLLUP_RULE` | Per-developer ledgers sum into fleet totals | Scenario rule; no scalar |
| `C16` | `HIDDEN_COST_DECOMPOSITION` | Hidden losses are stored by named causal bucket | Scenario rule; no scalar |
| `C17` | `AUDIT_REFERENCE_TOTALS` | `$692` hidden total; `$575` idle is the dominant bucket; ordering `idle > delegate > 5m-band > MCP` | Reference audit fixture |
| `C18` | `FLEET_ARCHETYPE_SET` | Five developer loss archetypes in the fleet scenario | `[FICTION]` calibrated fixture |
| `C19` | `KEEP_WARM_BREAK_EVEN` | 1h tier `20h`; 5m tier `(1.25×5)/6 ≈ 1.04h` | Derived |
| `C20` | `KEEP_WARM_DECISION_RULE` | Ping only when ping total is below avoided rewrite cost | Derived behavior; no scalar |
| `C21` | `ONE_HOUR_BREAK_EVEN` | `(2−1.25)/(1.25−0.1) = 0.652173…` | Derived; supersedes obsolete `0.40` |
| `C22` | `SESSIONSTART_PREFIX_POSITION` | Volatile early hook content invalidates later stable content | Measured behavior; no scalar |
| `C23` | `HOOK_POISON` | `24,300` rewritten tokens per poisoned session start | Measured |
| `C24` | `TOOLS_BASE` | Main tool definitions `16,295` tokens; MCP fixture `[6,295, 4,000, 3,000, 3,000]` | Measured total; fixture split `[FICTION]` |
| `C25` | `SUBAGENT_TOOLSET_RULE` | Subagents use a reduced toolset already represented in the `26,237` base | Measured/model rule; no additive scalar |
| `C26` | `CACHE_BREAKPOINT_LIMITS` | Minimum cacheable prefix `1,024`; maximum breakpoints `4` | Platform limit |
| `C27` | `SUBAGENT_WARM_WAVES` | About `90s` per spawn; `5m` TTL; `3` serial waves stay warm | Measured/calibrated |
| `C28` | `DEV_WORKLOAD` | `WORK_IN=6,000`; `WORK_OUT=44,000` tokens/task | `[FICTION]` calibrated |
| `C29` | `INLINE_HISTORY_GROWTH` | `INLINE_B0=34,000`; growth `22,000` tokens/task | `[FICTION]` anchored to `C6` |
| `C30` | `SCOPE_SCALE` | Session `1`; week `3.9`; month `14.2` | `[FICTION]` calibrated |
| `C31` | `SCOPE_ECONOMY` | Budgets `$12/$30/$90`; days `1/5/22`; day length `300m`; manual multiplier `6`; tedium `8×unitHours` | `[FICTION]` |
| `C32` | `CATALOG_PER_ENTRY` | `13,083 / 150 = 87.22` tokens/entry; invoked body approximately `1,744` tokens | Derived from `C7` |

Additional named, non-`C` constants:

```ts
CATALOG_RESIDUE = 15_693 - 13_083 = 2_610;
MEMORY_PER_FILE = 400;                    // [FICTION]
FANOUT_BUDGET = 15;                       // [FICTION]
MCP_SIZES = [6_295, 4_000, 3_000, 3_000];// [FICTION] split, C24 total
N_DEV = 3;                                // [FICTION]
BUDGET_MONTHLY = 90;                      // [FICTION], C31
```

If implementation evidence does not provide a scalar for a behavioral `C` entry, level copy must cite the behavior without inventing a number.

---

## 5. Reducer model

### 5.1 `ReducerState`

This supersedes the existing `GameState` name while retaining its fields for compatibility.

```ts
interface ReducerState {
  seed: number;
  scope: "session" | "week" | "month";

  clockMin: number;
  endMin: number;
  dayLen: number;

  wallet: number;
  budget: number;
  manualHours: number;
  tedium: number;

  cfg: Config;
  cache: CacheState;

  units: UnitInstance[];
  idx: number;
  standup?: UnitInstance;

  bugsOpen: number;
  ledger: LedgerRow[];
  lastRequests: LedgerRow[];

  prng: { s0: number; s1: number };

  idleLog: IdleLogEntry[];
  hidden: HiddenCosts;
  counts: Counts;
  sessionStarts: number;
  ratioNum: number;
  ratioDen: number;
  ended: GameEnd | null;

  phase: LevelPhase;
  prediction: PredictionState | null;
  checkpoints: Checkpoint[];
  frozenFailure: FrozenFailure | null;
  prefixStacks: Record<string, PrefixStack>;
  cacheEntries: Record<string, CacheEntry>;
  selectedLoadout: LoadoutState;
  auditRanking: string[];
  attempt: number;
  actionIndex: number;
}
```

```ts
type LevelPhase =
  | "cold-open"
  | "predict"
  | "act"
  | "reveal"
  | "explain"
  | "transfer"
  | "result";

interface PredictionState {
  promptId: string;
  optionId: string | null;
  committed: boolean;
  correctOptionId?: string;
  revealed: boolean;
}

interface FrozenFailure {
  failureId: string;
  decisiveActionIndex: number;
  causeCode: string;
  message: string;
  checkpointId: string;
}
```

New fields must be initialized explicitly; they may not be inferred from view-local component state.

### 5.2 Existing configuration

```ts
interface Config {
  orchestratorModel: Model;
  planModel: Model;
  devModel: Model;
  who: "inline" | "subagent";
  prompts: "identical" | "varied";
  width: number;
  oneHourFlag: boolean;
  keepWarm: boolean;
  keepWarmMin: number;
  hook: "dynamic" | "static";
  skills: number;
  skillsMode: "eager" | "invoke";
  memoryFiles: number;
  mcp: [boolean, boolean, boolean, boolean];
}
```

### 5.3 Complete `Action` union

```ts
type Action =
  // Existing engine actions
  | { type: "RUN_UNIT"; unitId: string }
  | { type: "HAND_CODE"; unitId: string }
  | { type: "IDLE_RESOLVE"; choice: "die" | "nothing" }
  | { type: "SET_CFG"; patch: Partial<Config> }
  | { type: "TICK_REPLAY" }
  | { type: "ADVANCE"; min: number }

  // Redesigned discovery loop
  | { type: "ENTER_LEVEL"; levelId: LevelId }
  | { type: "CREATE_CHECKPOINT"; checkpointId: string; reason: Checkpoint["reason"] }
  | { type: "OPEN_PREDICTION"; promptId: string }
  | { type: "SELECT_PREDICTION"; promptId: string; optionId: string }
  | { type: "COMMIT_PREDICTION"; promptId: string }
  | { type: "REVEAL_PREDICTION"; promptId: string; correctOptionId: string }
  | { type: "ACK_EXPLANATION"; explanationId: string }
  | { type: "BEGIN_TRANSFER"; challengeId: string }

  // Prefix/cache manipulation
  | { type: "SET_PREFIX_BLOCKS"; contextId: string; blocks: PrefixBlock[] }
  | { type: "REORDER_PREFIX_BLOCK"; contextId: string; blockId: string; toIndex: number }
  | { type: "SET_PREFIX_BLOCK_ENABLED"; contextId: string; blockId: string; enabled: boolean }
  | { type: "SET_PREFIX_BLOCK_CONTENT"; contextId: string; blockId: string; identityHash: string; tokenCount: number }
  | { type: "SET_BREAKPOINT"; contextId: string; blockId: string; enabled: boolean }
  | { type: "NORMALIZE_PROMPTS"; templateId: string; taskPointerPosition: "front" | "tail" }
  | { type: "DISCARD_CONTEXT"; contextId: string }
  | { type: "SEND_REQUEST"; request: Request }

  // Scheduling and routing
  | { type: "SCHEDULE_UNIT"; unitId: string; startMin: number }
  | { type: "SET_FANOUT_WIDTH"; width: number }
  | { type: "ROUTE_UNIT"; unitId: string; contextKind: "main" | "subagent" }
  | { type: "PLACE_KEEP_WARM_PING"; gapId: string; atMin: number }
  | { type: "SELECT_WRITE_TIER"; blockId: string; tier: WriteTier }
  | { type: "CHOOSE_MODEL"; workloadId: string; role: "orchestrator" | "plan" | "dev"; model: Model }
  | { type: "CHOOSE_PLAN_DEPTH"; depth: "shallow" | "balanced" | "deep" }

  // Loadout and audit
  | { type: "SET_SKILL_LOADOUT"; skillIds: string[]; mode: "eager" | "invoke" }
  | { type: "SET_MEMORY_LOADOUT"; memoryIds: string[] }
  | { type: "SET_MCP_LOADOUT"; serverIds: string[] }
  | { type: "SUBMIT_LOADOUT"; ticketId: string }
  | { type: "SET_AUDIT_RANKING"; causeIds: string[] }
  | { type: "SUBMIT_AUDIT_RANKING" }
  | { type: "APPLY_REMEDIATION"; target: "developer" | "fleet"; targetId?: string; remediationId: string }

  // Failure, rewind, comparison, completion
  | { type: "FREEZE_FAILURE"; failure: Omit<FrozenFailure, "decisiveActionIndex"> }
  | { type: "REWIND_TO_CHECKPOINT"; checkpointId: string }
  | { type: "REQUEST_COUNTERFACTUAL"; comparisonId: string }
  | { type: "REVEAL_COUNTERFACTUAL"; comparisonId: string }
  | { type: "COMPLETE_ATTEMPT" }
  | { type: "RESTART_LEVEL" };
```

### 5.4 Action contracts

#### Existing actions

- `RUN_UNIT`: Requires a ready, unfinished `unitId` and non-frozen state. Resolves every request generated by that unit, appends rows atomically, updates caches, wallet, counts, unit status, queue index, clock, hidden costs, and `lastRequests`.
- `HAND_CODE`: Completes an eligible unit without model requests; increments `manualHours` and `tedium` using `C31`. It may violate a star or behavioral gate.
- `IDLE_RESOLVE`: Resolves a pending idle decision. `"die"` records work loss/manual consequence; `"nothing"` accepts no extra consequence. It cannot advance time twice.
- `SET_CFG`: Applies only unlocked, non-locked keys. Invalid or hidden keys are rejected atomically.
- `TICK_REPLAY`: Advances one deterministic replay step; never reads wall-clock time.
- `ADVANCE`: Requires finite integer `min >= 0`; updates only simulation time and derived expiry visibility.

#### Discovery actions

- `ENTER_LEVEL`: Builds initial state from `LevelDef`, resets attempt-local fields, and creates the level-start checkpoint.
- `CREATE_CHECKPOINT`: Records the current action boundary; duplicate IDs are invalid.
- `OPEN_PREDICTION`: Enters `"predict"` and prevents the gated reveal.
- `SELECT_PREDICTION`: Changes an uncommitted selection.
- `COMMIT_PREDICTION`: Requires a selection and locks it.
- `REVEAL_PREDICTION`: Requires a committed prediction; records correctness and enters `"reveal"`.
- `ACK_EXPLANATION`: Marks the concise named rule as seen only after causal evidence is visible.
- `BEGIN_TRANSFER`: Requires the preceding explanation and starts a novel application.

#### Prefix/cache actions

- `SET_PREFIX_BLOCKS`: Scenario initialization or explicit puzzle setup only; validates the complete block set.
- `REORDER_PREFIX_BLOCK`: Moves one block without changing its identity or size.
- `SET_PREFIX_BLOCK_ENABLED`: Toggles optional content; required content cannot be disabled.
- `SET_PREFIX_BLOCK_CONTENT`: Models a byte-level change and recomputes the stack’s mismatch boundary.
- `SET_BREAKPOINT`: Enforces `C26`.
- `NORMALIZE_PROMPTS`: Moves task variation into a shared template’s tail or front; does not silently change task meaning.
- `DISCARD_CONTEXT`: Invalidates only the named context namespace and creates no ledger row.
- `SEND_REQUEST`: Runs `RESOLVE_PREFIX`, `PRICE_REQUEST`, cache mutation, ledger append, wallet deduction, and tape payload creation atomically.

#### Scheduling actions

- `SCHEDULE_UNIT`: Places a unit at a valid time without executing it.
- `SET_FANOUT_WIDTH`: Requires an integer in the level’s allowed range and recomputes deterministic waves.
- `ROUTE_UNIT`: Selects main or fresh subagent context; execution remains separate.
- `PLACE_KEEP_WARM_PING`: Requires a permitted gap and available ping; the eventual ping is a real priced request.
- `SELECT_WRITE_TIER`: Selects 5m or 1h before the applicable write.
- `CHOOSE_MODEL`: Changes only the stated workload role.
- `CHOOSE_PLAN_DEPTH`: Chooses the calibrated planning branch; downstream rework is labeled `[FICTION]`.

#### Loadout and audit actions

- Loadout setters validate available items and do not run work.
- `SUBMIT_LOADOUT` checks capability sufficiency, then executes or freezes at the first missing capability.
- `SET_AUDIT_RANKING` stores an ordered permutation.
- `SUBMIT_AUDIT_RANKING` locks it before remedies are exposed.
- `APPLY_REMEDIATION` applies only an unlocked remedy to an explicit target and records collateral cost.

#### Failure and completion actions

- `FREEZE_FAILURE`: Sets `clock.frozen`, records the decisive action index, and blocks economic actions.
- `REWIND_TO_CHECKPOINT`: Deterministically replays actions before the checkpoint and starts a new branch. Attempt count is retained.
- `REQUEST_COUNTERFACTUAL`: Valid only after an attempt-relevant action.
- `REVEAL_COUNTERFACTUAL`: Requires the corresponding request and shows reference/anti results without replacing actual state.
- `COMPLETE_ATTEMPT`: Evaluates behavioral gate, stars, and result summary.
- `RESTART_LEVEL`: Reinitializes from seed, increments attempt, and removes attempt-local predictions and checkpoints.

### 5.5 Save and replay

```ts
interface SaveFile {
  v: 1;
  seed: number;
  mode: "session" | "week" | "month";
  actions: Action[];
}
```

Ephemeral animation progress, hover state, and DOM focus are never persisted.

---

## 6. Reusable UI components

### 6.1 `TapeRenderer`

Stable name: `UI_TAPE_RENDERER`.

```ts
interface TapeRendererOpts {
  domTooltip?: boolean;
  onHover?: (hover: TapeHover | null) => void;
  labelFor?: (row: LedgerRow) => string | null | undefined;
}

interface TapeHover {
  lines: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}
```

Contract:

- Consumes `LedgerRow[]`; owns no economics.
- Draws via Canvas2D, DPR-aware.
- Rows are ordered by request time/ledger order.
- Bar width is proportional to `readTok + inputTok + writeTok` against the largest visible row.
- Read is blue; fresh input and writes are red.
- A scan head reveals rows left-to-right.
- Duration is `min(1600ms, 500ms + rows×260ms)` `[ESTIMATE inherited from renderer]`.
- Reduced motion draws the complete final frame immediately.
- Final colors and prices must be drawn at animation completion without requiring hover.
- Hover supplies time, each non-zero bucket equation, total, and write TTL.
- `destroy()` cancels animation, observer, and event listeners; later calls become no-ops.
- Empty state says that running a unit will produce requests; it must not resemble a zero-cost request.

### 6.2 `TTLDrainBar`

Stable name: `UI_TTL_DRAIN_BAR`.

```ts
interface TTLDrainBarProps {
  cacheEntry: CacheEntry | null;
  clock: Clock;
  label: string;
  dangerThresholdRatio?: number; // default 0.2 [ESTIMATE]
}
```

States:

- `absent`: no saved prefix.
- `warm`: remaining ratio above warning threshold.
- `danger`: nearing expiry; pulse disabled under reduced motion.
- `expired`: exactly zero, visually cracks/fades once.
- `frozen`: unchanged during a failure freeze.

It displays absolute expiry (`expires 11:02`) and remaining duration. It does not mutate time.

### 6.3 `MainCachePanel`

Stable name: `UI_MAIN_CACHE_PANEL`.

```ts
interface MainCachePanelProps {
  context: MainSessionContext;
  entries: CacheEntry[];
  clock: Clock;
  highlightedEntryId?: string;
  visibility: "compact" | "expanded";
}
```

Shows:

- `MAIN CACHE` label.
- Saved token count.
- Write tier.
- Warm/expired status.
- `UI_TTL_DRAIN_BAR`.
- Last touch and expiry on hover/focus.
- A visible empty/cleared state after `DISCARD_CONTEXT`.

It must not imply that subagent entries live in the main cache.

### 6.4 `HoverPriceCalculator`

Stable name: `UI_HOVER_PRICE_CALCULATOR`.

```ts
interface HoverPriceCalculatorProps {
  row: LedgerRow;
  anchor: { x: number; y: number; w: number; h: number };
}
```

Line format:

```text
read: 26,237 tok × 0.1x × $3/M = $0.0079
write: 26,237 tok × 1.25x × $3/M = $0.0984
total: $0.0984
```

Rules:

- Omit zero buckets.
- Display the actual model base and multiplier.
- Clamp to viewport/panel bounds.
- Support pointer hover and keyboard focus.
- Do not recompute authoritative row total; component calculations are explanatory assertions against `row.usd`.

### 6.5 `ToastSystem`

Stable name: `UI_TOAST_SYSTEM`.

```ts
interface ToastDef {
  id: string;
  trigger: ToastTrigger;
  copy: string;
  vocabulary?: string;
  priority: "teaching" | "cause" | "status";
  durationMs?: number;
  dedupe: "attempt" | "level" | "never";
  actionLabel?: string;
}
```

Contracts:

- Maximum one teaching toast at once.
- Queue cause toasts ahead of status toasts.
- A toast fires from state/action evidence, never arbitrary elapsed wall time.
- Vocabulary appears only at first need.
- Default duration `3,500ms` `[ESTIMATE]`; cause toasts remain while frozen.
- Toasts never cover the decisive tape row or active control.
- Screen-reader announcements use `aria-live="polite"`, except decisive failure uses `"assertive"`.

### 6.6 `PredictionPromptWidget`

Stable name: `UI_PREDICTION_PROMPT`.

```ts
interface PredictionPromptDef {
  id: string;
  question: string;
  options: Array<{ id: string; label: string }>;
  revealId: string;
  explanationId: string;
}
```

State sequence:

```text
unanswered → selected → committed → revealed
```

Rules:

- Two or three mutually exclusive options.
- No option styling reveals correctness before commitment.
- Committing dispatches `COMMIT_PREDICTION`.
- The gated event/reveal remains disabled until commitment.
- After reveal, show the player’s choice, correct result, and one causal sentence.
- Predictions are not punitive; incorrect predictions produce evidence, not score loss.

### 6.7 `ResultScreen`

Stable name: `UI_RESULT_SCREEN`.

```ts
interface ResultSummary {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  spentUsd: number;
  budgetUsd: number;
  behavioralEvidence: string[];
  keyComparison?: CounterfactualResult;
  nextLevelId?: LevelId;
}
```

Must show:

- Clear pass/fail identity.
- Wallet delta and compact request composition.
- Explicit behavioral gate evidence.
- Stars and why each was or was not earned.
- Post-attempt counterfactual when unlocked.
- Retry/rewind and continue actions.
- Celebratory motion/color for passing, respecting reduced motion.

A 3-star result must not resemble an error dialog.

### 6.8 `RewindControl`

Stable name: `UI_REWIND_CONTROL`.

```ts
interface RewindControlProps {
  checkpoint: Checkpoint;
  label: string;
  enabled: boolean;
}
```

- Appears immediately on a frozen failure.
- Dispatches `REWIND_TO_CHECKPOINT`.
- Restores the moment before the decisive choice.
- Does not replay the cold-open, completed predictions, or mastered setup unless they occurred after the checkpoint.
- Describes the destination: “Try the standup again,” not merely “Undo.”

### 6.9 `PrefixStackVisualizer`

Stable name: `UI_PREFIX_STACK_VISUALIZER`.

```ts
interface PrefixStackVisualizerProps {
  stack: PrefixStack;
  mode: "assemble" | "inspect" | "reorder" | "diff";
  showTokenCounts: boolean;
  revealBoundary: boolean;
}
```

Visual grammar:

- One ordered block per `PrefixBlock`.
- Stable matched prefix: blue.
- First mismatch: high-contrast marker.
- Invalidated suffix: red propagation.
- Fresh `current`: neutral/red hatch distinct from invalidation.
- Breakpoints: vertical notch/flag.
- Block width represents token count with a minimum accessible width.
- Dragging is mirrored by keyboard move-left/move-right controls.
- `revealBoundary=false` before prediction commitment.
- Diff mode identifies the first mismatching token/block and concrete invalidated token count.

### 6.10 `CounterfactualOverlay`

Stable name: `UI_COUNTERFACTUAL_OVERLAY`.

```ts
interface CounterfactualResult {
  actualLabel: string;
  counterfactualLabel: string;
  actualUsd: number;
  counterfactualUsd: number;
  deltaUsd: number;
  requestPairs: Array<{
    actualRequestId?: string;
    counterfactualRequestId?: string;
    cause: string;
  }>;
}
```

It may appear only after an attempt. It pairs requests causally and must distinguish measured economics from `[FICTION]` pipeline outcomes.

---

## 7. Named reusable interaction patterns

### 7.1 `PATTERN_PREDICT_BEFORE_REVEAL`

Sequence:

1. Establish an unresolved situation.
2. Dispatch `CREATE_CHECKPOINT`.
3. Dispatch `OPEN_PREDICTION`.
4. Player selects and commits.
5. Execute the hidden event.
6. Dispatch `REVEAL_PREDICTION`.
7. Animate the actual state change.
8. Ask for or show one concise causal explanation.
9. Continue to a novel transfer.

Never reveal the correct option in title, objective, diagram, color, disabled control, or pre-play comparison.

### 7.2 `PATTERN_FAIL_FREEZE_REWIND`

Sequence:

1. Execute the decisive player action.
2. Render the resulting request/cache/clock mutation.
3. At the exact causal frame, dispatch `FREEZE_FAILURE`.
4. Freeze clock and economic controls.
5. Highlight the cause, not merely the budget symptom.
6. Present one-line causal copy.
7. Offer `UI_REWIND_CONTROL`.
8. Dispatch `REWIND_TO_CHECKPOINT`.
9. Resume directly before the decision.

Failure copy template:

```text
<Concrete event>. <Mechanism> caused <visible consequence>.
```

Example: “Job 4 arrived at 6:00. The shared prefix expired at 5:00, so it rewrote.”

### 7.3 `PATTERN_JUST_IN_TIME_TOAST`

Sequence:

1. Detect the first action whose interpretation requires a term.
2. Complete the visible event.
3. Fire a short toast anchored near the evidence.
4. Name only the required term.
5. Deduplicate for the configured scope.

Do not introduce output pricing before output affects a decision, subagent TTL before subagents appear, or prefix mismatch before the stack is visible.

### 7.4 `PATTERN_COUNTERFACTUAL_AFTER_ATTEMPT`

Sequence:

1. Player completes a meaningful attempt.
2. Persist actual ledger and choices.
3. Dispatch `REQUEST_COUNTERFACTUAL`.
4. Run reference or anti-pattern deterministically off-screen from the same seed.
5. Dispatch `REVEAL_COUNTERFACTUAL`.
6. Pair causal request differences.
7. Show delta and one transferable rule.

The counterfactual may confirm discovery; it may not serve as a pre-play answer key.

### 7.5 `PATTERN_BLIND_AB_REVEAL`

A specialized post-attempt comparison retained for levels that benefit from two unlabeled outcomes.

1. Obtain a committed prediction.
2. Execute A and B without “good/bad” labels.
3. Reveal both tapes.
4. Ask which mechanism caused the difference.
5. Only then attach configuration labels and dollar delta.

### 7.6 `PATTERN_EXPLAIN_THEN_TRANSFER`

1. After evidence, ask the player to select or construct the causal explanation.
2. Name the rule in one sentence.
3. Present a new configuration with different surface details.
4. Gate completion on applying the same rule.

---

## 8. Canonical `LevelDef` schema

The redesigned schema extends the repository’s existing `LevelDef`; deprecated pre-play `learn` data is retained only for migration and must not render before an attempt.

```ts
type LevelId =
  | "L1" | "L2" | "L3" | "L4" | "L5" | "L6"
  | "L7" | "L8" | "L9" | "L10" | "L11" | "L12" | "L13";

type ToolId =
  | "run" | "devModel" | "planModel" | "who" | "prompts" | "width"
  | "oneHourFlag" | "keepWarm" | "hook" | "skills" | "mcp"
  | "fleet" | "audit" | "prefix" | "route" | "planDepth";

type ControlId =
  | "run" | "handCode"
  | "devModel" | "planModel" | "orchestratorModel"
  | "who" | "prompts" | "width"
  | "keepWarm" | "keepWarmMin" | "stepAway"
  | "oneHourFlag"
  | "hook" | "skills" | "skillsMode" | "memoryFiles" | "mcp"
  | "fleet" | "audit" | "advanceTime"
  | "prefixBlocks" | "breakpoints" | "route" | "planDepth";

type ScenarioId =
  | "default" | "dev-only" | "dev-marathon"
  | "fanout8" | "fanout8-slow"
  | "gaps" | "two-halves" | "week7starts"
  | "spawn12" | "mcp-required" | "l1-onboarding"
  | "prefix-builder" | "prompt-normalizer"
  | "mixed-routing" | "fleet-audit-v2";
```

```ts
interface LevelDef {
  // Identity
  id: LevelId;
  tier: 1 | 2 | 3;
  title: string;
  objective: string;
  concept: ConceptDef;
  prerequisiteConceptIds: string[];

  // Progressive disclosure
  unlocks: ToolId;
  introducedControls: ControlId[];
  cfgLocked?: (keyof Config)[];

  // Deterministic scenario
  scope: "session" | "week" | "month";
  seed: number;
  budgetUsd: number;
  clockCapMin?: number;
  cfgOverride: Partial<Config>;
  scenario: ScenarioId;
  scenarioData: ScenarioData;

  // Discovery sequence
  coldOpen: ColdOpenDef;
  sequence: LevelEventDef[];
  predictions: PredictionPromptDef[];
  toasts: ToastDef[];
  interactionPatterns: InteractionPatternId[];

  // Failure and rewind
  failLesson: FailLesson;
  failureRules: FailureRuleDef[];
  checkpoints: CheckpointDef[];

  // Understanding gates and stars
  gate: GateDef;
  pass(st: ReducerState): GateResult;
  star2?: StarDef;
  star3?: StarDef;

  // Post-attempt comparison
  referenceCfg: Partial<Config>;
  antiCfg: Partial<Config>;
  counterfactuals: CounterfactualDef[];

  // Presentation and verification
  tape: TapeSpec;
  result: ResultSpec;
  vocabulary: VocabularyDef[];
  qa: QaAssertion[];

  // Migration only; never shown pre-attempt
  learn?: DeprecatedLearnBeat;
}
```

### 8.1 Identity fields

```ts
interface ConceptDef {
  id: string;
  privateDesignerSummary: string;
  postRevealRule: string;
}
```

- `title`: protects the surprise; it cannot state the answer.
- `objective`: states the problem, not its solution.
- `privateDesignerSummary`: exact single concept for authors/QA, not player-facing.
- `postRevealRule`: the concise rule shown only after evidence.
- `prerequisiteConceptIds`: previously demonstrated concepts only.

### 8.2 Scenario fields

```ts
interface ScenarioData {
  units: UnitSeed[];
  contexts: ContextSeed[];
  prefixStacks?: PrefixStackSeed[];
  gaps?: GapSeed[];
  workloads?: WorkloadSeed[];
  capabilities?: CapabilitySeed[];
  auditCauses?: AuditCauseSeed[];
  allowedCfg?: Partial<Record<keyof Config, readonly unknown[]>>;
  estimates?: Array<{ label: string; value: number; tag: "[ESTIMATE]" | "[FICTION]" }>;
}
```

Every number not present in the constants registry must appear in `estimates` with a tag.

### 8.3 Cold open

```ts
interface ColdOpenDef {
  maxInstructionCards: 0 | 1;
  beats: Array<{
    atSec: number;
    actor: "system" | "player" | "wire" | "cache";
    copy?: string;
    action?: Action;
    focusObject?: string;
  }>;
  firstInteractiveBySec: number;
}
```

`firstInteractiveBySec` should be at most `2` seconds `[ESTIMATE]`. Cold-open copy cannot use unrevealed vocabulary or disclose the solution.

### 8.4 Event sequence

```ts
interface LevelEventDef {
  id: string;
  ordinal: number;
  trigger: PlayerTrigger | SystemTrigger;
  action: Action;
  preconditions: StatePredicate[];
  mutations: StateMutationExpectation[];
  numbers: NumberCitation[];
  renderedBy: string[];
  predictionId?: string;
  toastIds?: string[];
  checkpointId?: string;
  failureRuleId?: string;
  ahaFrame?: boolean;
}
```

Each event identifies:

- What happens.
- Which reducer action represents it.
- Which objects change.
- Exact numeric effects and citations.
- Which component renders the evidence.
- Whether prediction, toast, checkpoint, failure, or aha behavior attaches.

```ts
interface NumberCitation {
  expression: string;
  expected: number;
  unit: "tok" | "usd" | "min" | "ratio" | "count";
  cites: string[];
  tag?: "[ESTIMATE]" | "[FICTION]";
}
```

### 8.5 Fail lesson and failure rules

```ts
interface FailLesson {
  bucket: keyof HiddenCosts | "none";
  cite: string;
  line: string;
}

interface FailureRuleDef {
  id: string;
  predicate: StatePredicate;
  decisiveEventId: string;
  causeCode: string;
  message: string;
  checkpointId: string;
  highlightObjectIds: string[];
}
```

`message` must name the concrete cause and consequence in one line.

### 8.6 Gate and stars

```ts
interface GateResult {
  pass: boolean;
  reason: string;
  evidence: string[];
}

interface GateDef {
  predicateId: string;
  behavioralRequirements: StatePredicate[];
  budgetRequirement?: StatePredicate;
  explanationRequirement?: StatePredicate;
  transferRequirement?: StatePredicate;
}

interface StarDef {
  label: string;
  predicate: StatePredicate;
  reason: string;
}
```

Rules:

- `gate.behavioralRequirements` cannot be empty.
- A budget predicate may supplement but not replace behavioral evidence.
- `pass(st)` is pure.
- Default legacy star behavior, if explicitly retained:
  - 2 stars: spend at most `85%` of budget.
  - 3 stars: spend at most `70%` and hand-code zero units.
- Redesigned levels should prefer concept-specific `StarDef`s.

### 8.7 Counterfactuals

```ts
interface CounterfactualDef {
  id: string;
  unlockAfterEventId: string;
  kind: "reference" | "anti-pattern" | "alternate-choice";
  cfg: Partial<Config>;
  scenarioPatch?: Partial<ScenarioData>;
  comparisonQuestion: string;
  revealCopy: string;
}
```

The same seed and unaffected scenario inputs must be used. Any calibrated-fiction delta is labeled.

### 8.8 Tape specification

```ts
interface TapeSpec {
  rowSource: "ledger" | "lastRequests";
  labels: Record<string, string>;
  revealGroups: Array<{
    id: string;
    requestIds: string[];
    gatedByPredictionId?: string;
  }>;
  ahaRequestId: string;
  hoverEnabled: true;
  showOutputSegmentsFromEventId?: string;
}
```

QA requires exact equality between selected source rows and rendered tape rows.

### 8.9 Result specification

```ts
interface ResultSpec {
  headlinePass: string;
  headlineFail: string;
  evidenceLines: string[];
  comparisonIds: string[];
  continueLabel: string;
  retryLabel: string;
}
```

Result copy may state the discovered rule because the attempt is complete.

### 8.10 Vocabulary

```ts
interface VocabularyDef {
  term: string;
  definition: string;
  firstNeededEventId: string;
  toastId: string;
}
```

A term cannot appear in player-facing copy before `firstNeededEventId`.

### 8.11 QA assertions

```ts
type QaAssertion =
  | { kind: "state"; afterEventId: string; predicate: StatePredicate }
  | { kind: "pricing"; requestId: string; expectedUsd: number; cites: string[] }
  | { kind: "render"; assertion: string }
  | { kind: "accessibility"; assertion: string }
  | { kind: "replay"; assertion: string }
  | { kind: "winnable"; referenceCfg: Partial<Config> }
  | { kind: "anti-fails"; antiCfg: Partial<Config> };
```

Mandatory assertions for every level:

1. Every request yields one ledger row and one tape row.
2. Every real request cost is positive.
3. No positive cost displays as `$0.0000`.
4. Pricing matches `PRICE_REQUEST`.
5. Reference configuration passes from the fixed seed.
6. Anti-pattern fails the intended behavioral gate.
7. A reveal cannot occur before prediction commitment.
8. Rewind restores the specified checkpoint deterministically.
9. Static final tape bars render without hover.
10. Keyboard and pointer paths produce equivalent actions.
11. Reduced-motion mode reveals the same final evidence.
12. The player can win without relying on undocumented controls.

### 8.12 Deprecated `LearnBeat`

```ts
interface DeprecatedLearnBeat {
  copy: string[];
  withoutCfg: Partial<Config>;
  withCfg: Partial<Config>;
  scope: "session" | "week" | "month";
  seed: number;
  chip(a: ReducerState, b: ReducerState): string;
}
```

`DeprecatedLearnBeat` exists only to keep current source compatible during migration. It must be converted into one or more `CounterfactualDef`s and must never render before the player’s first meaningful attempt.

---

## 9. Campaign progression

```ts
interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestUsd: number;
  bestManualHours: number;
  attempts: number;
}

interface CampaignState {
  unlocked: ToolId[];
  levels: Record<LevelId, LevelProgress>;
  currentTier: 1 | 2 | 3;
}
```

Contracts:

- Unlocks are permanent.
- Levels form a strict ordered chain unless a later campaign spec explicitly changes it.
- Completing the frontier level unlocks the next level’s one new tool.
- Best spend/manual values update only on passing attempts.
- Attempts increment on every completed result, including failures.
- Level controls are the union of `introducedControls` through the current level, filtered by the current `LevelDef`.

---

## 10. Authoring boundary

Thin level specifications may provide:

- `LevelDef` values.
- Ordered event instances.
- Exact level copy.
- Exact request counts, prices, and citations.
- Gate predicates and star thresholds.
- Level-specific failure and result text.

Thin level specifications must reference, not redefine:

- `Token`
- `Request`
- `CacheEntry`
- `PrefixBlock`
- `PrefixStack`
- `WireSegment`
- `Wallet`
- `Budget`
- `Clock`
- `ExecutionContext`
- `LedgerRow`
- `PricingFunction`
- `ReducerState`
- `Action`
- Any `UI_*` component
- Any `PATTERN_*` interaction
- The `LevelDef` field meanings

Significant tradeoff: the repository’s current reducer lacks prediction, prefix-puzzle, checkpoint, failure-freeze, loadout, and audit-ranking state. This model defines those additions explicitly while preserving every existing action and state field for incremental migration.
