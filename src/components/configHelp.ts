import { recipeById, type RecipeId } from "../setup/recipes.js";
import { PERSONAS, simulateDay, type SandboxConfig } from "../sandbox/model.js";
import { SCENARIO_BY_ID } from "../sim/scenarios.js";
import {
  DEFAULT_TOGGLES, FIT_TABLE, ROUTABLE_TASK_TYPES, defaultRoutingControl,
  resolveRoute, routeTaskWithControl, scenarioToDispatchWave,
  type DispatchTask, type DispatchToggles, type RoutingControl,
} from "../td/engine.js";

export type ConfigHelpId = RecipeId | "effort" | "docs-skill" | "extra-mcp";

export interface ConfigHelpContent {
  title: string;
  what: string;
  how: string;
}

const recipeHow: Record<RecipeId, string> = {
  ttl: "A longer TTL lets a warm prefix survive longer pauses, avoiding another cache write when work resumes.",
  "keep-warm": "Requests inside the TTL keep the prefix readable from cache; silence beyond it makes the next request rebuild that prefix.",
  "same-prompt": "Byte-identical stable prefixes can hit the same cache entry; changing each subagent prompt creates separate cache writes.",
  "large-context": "Stable content first preserves a reusable prefix. Changing or oversized context increases the tokens rewritten on a miss.",
  "auto-approve": "Fewer approval pauses keep consecutive requests inside the TTL, reducing cold prefix rebuilds.",
  route: "Model and effort are part of the cache key. Choosing them up front avoids invalidation, while right-sizing work lowers token rates.",
  delegate: "A scoped subagent starts with a smaller context instead of repeatedly carrying the main agent's full prefix.",
  compact: "Compaction replaces long conversation history with a smaller working set; that summary costs once, then reduces later input.",
  lazy: "Deferred skill bodies and MCP schemas stay out of the stable prefix until invoked, shrinking cache writes and reads on ordinary turns.",
};

export const CONFIG_HELP: Readonly<Record<ConfigHelpId, ConfigHelpContent>> = {
  ...Object.fromEntries(Object.keys(recipeHow).map((id) => {
    const recipeId = id as RecipeId;
    const recipe = recipeById[recipeId];
    return [recipeId, { title: recipe.title, what: recipe.what, how: recipeHow[recipeId] }];
  })) as Record<RecipeId, ConfigHelpContent>,
  effort: {
    title: "Reasoning effort",
    what: "Match reasoning depth to the task instead of paying for maximum deliberation everywhere.",
    how: "Effort does not improve prefix reuse by itself; it changes fresh work and output tokens. Right-sizing it cuts non-cached cost without changing the stable context.",
  },
  "docs-skill": {
    title: "Documentation skill",
    what: "Load focused documentation guidance only for tasks that need it.",
    how: "A focused docs route replaces broader general context on documentation tasks, shrinking the prefix while preserving task-specific guidance.",
  },
  "extra-mcp": {
    title: "Extra MCP server",
    what: "Attach another tool server and its capabilities to the agent.",
    how: "Always-loaded tool schemas add tokens to every prompt prefix, increasing cache writes and reads even when no tool is used.",
  },
};

function improvement(good: number, bad: number): number | undefined {
  if (!Number.isFinite(good) || !Number.isFinite(bad) || bad <= 0 || good >= bad) return undefined;
  const rounded = Math.round((1 - good / bad) * 100);
  return rounded > 0 ? rounded : undefined;
}

const SANDBOX_REFERENCE = PERSONAS.oneManCompany;
const SANDBOX_BASE: SandboxConfig = {
  ...SANDBOX_REFERENCE.defaults,
  subagents: "same", ttl: "1h", context: 1, approval: "auto", keepWarm: false,
  model: "sonnet", autoCompact: true, lazyLoadTools: true,
};

function sandboxImpact(id: ConfigHelpId): number | undefined {
  const pair: Partial<Record<ConfigHelpId, [Partial<SandboxConfig>, Partial<SandboxConfig>]>> = {
    "same-prompt": [{ subagents: "same" }, { subagents: "different" }],
    ttl: [{ ttl: "1h" }, { ttl: "5m" }],
    "large-context": [{ context: 0.65 }, { context: 1.75 }],
    "auto-approve": [{ approval: "auto", ttl: "5m" }, { approval: "manual", ttl: "5m" }],
    "keep-warm": [{ keepWarm: true }, { keepWarm: false }],
    compact: [{ autoCompact: true }, { autoCompact: false }],
    lazy: [{ lazyLoadTools: true }, { lazyLoadTools: false }],
  };
  const settings = pair[id];
  if (!settings) return undefined;
  const [goodPatch, badPatch] = settings;
  const good = simulateDay(SANDBOX_REFERENCE, { ...SANDBOX_BASE, ...goodPatch }).totalUsd;
  const bad = simulateDay(SANDBOX_REFERENCE, { ...SANDBOX_BASE, ...badPatch }).totalUsd;
  return improvement(good, bad);
}

const GAME_TASKS = scenarioToDispatchWave(SCENARIO_BY_ID["refactor-moar"]).tasks;

function gameCost(tasks: readonly DispatchTask[], control: RoutingControl, toggles: DispatchToggles): number {
  const priorTouches = new Map<string, number>();
  const contexts = new Map<string, number>();
  let total = 0;
  for (const task of tasks) {
    const route = resolveRoute(task.type, control);
    const key = route.context === "main-1m"
      ? `main-1m:${route.worker.model}`
      : `scoped:${route.worker.model}:${task.type}`;
    const result = routeTaskWithControl(task, control, toggles, priorTouches.get(key), undefined, contexts.get(key) ?? 0);
    total += result.usd;
    priorTouches.set(key, task.atMin);
    contexts.set(key, result.nextConversationTok);
  }
  return total;
}

function routedControl(): RoutingControl {
  const control = defaultRoutingControl();
  control.useSubagents = true;
  for (const type of ROUTABLE_TASK_TYPES) control.routes[type] = { ...FIT_TABLE[type].ideal };
  return control;
}

function gameImpact(id: ConfigHelpId): number | undefined {
  if (id === "delegate") {
    const good = gameCost(GAME_TASKS, routedControl(), { ...DEFAULT_TOGGLES });
    const bad = gameCost(GAME_TASKS, defaultRoutingControl(), { ...DEFAULT_TOGGLES });
    return improvement(good, bad);
  }
  if (id === "route") {
    const goodControl = defaultRoutingControl();
    goodControl.main = { model: "sonnet", effort: "high" };
    const badControl = defaultRoutingControl();
    return improvement(
      gameCost(GAME_TASKS, goodControl, { ...DEFAULT_TOGGLES }),
      gameCost(GAME_TASKS, badControl, { ...DEFAULT_TOGGLES }),
    );
  }
  if (id === "effort") {
    const review = GAME_TASKS.find((task) => task.type === "code-review");
    if (!review) return undefined;
    const goodControl = routedControl();
    goodControl.routes["code-review"] = { model: "sonnet", effort: "med" };
    const badControl = routedControl();
    badControl.routes["code-review"] = { model: "sonnet", effort: "high" };
    return improvement(
      gameCost([review], goodControl, { ...DEFAULT_TOGGLES }),
      gameCost([review], badControl, { ...DEFAULT_TOGGLES }),
    );
  }
  if (id === "docs-skill") {
    const docs = GAME_TASKS.filter((task) => task.type === "docs");
    const control = routedControl();
    return improvement(
      gameCost(docs, control, { ...DEFAULT_TOGGLES, docsSkill: true }),
      gameCost(docs, control, { ...DEFAULT_TOGGLES, docsSkill: false }),
    );
  }
  if (id === "extra-mcp") {
    const control = routedControl();
    return improvement(
      gameCost(GAME_TASKS, control, { ...DEFAULT_TOGGLES, alwaysLoadedMcp: false }),
      gameCost(GAME_TASKS, control, { ...DEFAULT_TOGGLES, alwaysLoadedMcp: true }),
    );
  }
  return undefined;
}

/** Deterministic representative savings, computed entirely through the production engines. */
export function impactPct(configId: ConfigHelpId): number | undefined {
  return sandboxImpact(configId) ?? gameImpact(configId);
}
