import type { Model } from "../engine/types.js";
import { applyContextLevers, priceCompaction, priceTokens } from "../sim/cost.js";
import { simulateMessageLedger, type MessageLedgerEntry, type MessageLedgerOptions, type ScriptedMessage } from "../sim/ledger.js";
import type { Scenario } from "../sim/scenarios.js";

export type Effort = "low" | "med" | "high";
export const ROUTABLE_TASK_TYPES = ["plan", "hotfix", "debugging", "rca", "code-review", "testing", "docs"] as const;
export type RoutableTaskType = typeof ROUTABLE_TASK_TYPES[number];
export type TaskType = RoutableTaskType | "bug" | "production-issue";
export type FitOutcome = "bad-output" | "good-fit" | "overkill";
export type RouteContext = "main-1m" | "scoped";

export interface Worker { model: Model; effort: Effort }
/** Kept as an alias because the game still calls its workers monkeys. */
export type Monkey = Worker;
export interface DispatchToggles {
  keepWarm: boolean;
  ttl: "5m" | "1h";
  approval: "auto" | "manual";
  docsSkill: boolean;
  alwaysLoadedMcp: boolean;
  autoCompact: boolean;
  lazyLoadTools: boolean;
}

export interface FitRule {
  label: string;
  good: readonly string[];
  min: number;
  max: number;
  rework: readonly TaskType[];
  ideal: Worker;
}

/** One readable source of truth for task difficulty, good fits, and failure cascades. */
export const FIT_TABLE: Record<TaskType, FitRule> = {
  plan: { label: "Opus-high / Sonnet-high", good: ["opus-high", "sonnet-high"], min: 5, max: 6, rework: ["bug", "bug", "production-issue"], ideal: { model: "sonnet", effort: "high" } },
  hotfix: { label: "Sonnet-high / Opus-med", good: ["sonnet-high", "opus-med"], min: 5, max: 5, rework: ["production-issue"], ideal: { model: "sonnet", effort: "high" } },
  debugging: { label: "Opus-med / Sonnet-high", good: ["opus-med", "sonnet-high"], min: 5, max: 5, rework: ["bug"], ideal: { model: "sonnet", effort: "high" } },
  rca: { label: "Opus-high", good: ["opus-high"], min: 6, max: 6, rework: ["bug", "production-issue"], ideal: { model: "opus", effort: "high" } },
  "code-review": { label: "Sonnet-med", good: ["sonnet-med"], min: 4, max: 4, rework: ["bug"], ideal: { model: "sonnet", effort: "med" } },
  testing: { label: "Haiku-high / Sonnet-low-med", good: ["haiku-high", "sonnet-low", "sonnet-med"], min: 3, max: 4, rework: ["production-issue"], ideal: { model: "haiku", effort: "high" } },
  docs: { label: "Haiku / Sonnet-low", good: ["haiku-low", "haiku-med", "haiku-high", "sonnet-low"], min: 1, max: 3, rework: ["bug"], ideal: { model: "haiku", effort: "low" } },
  bug: { label: "Sonnet-high / Opus-med", good: ["sonnet-high", "opus-med"], min: 5, max: 5, rework: ["production-issue"], ideal: { model: "sonnet", effort: "high" } },
  "production-issue": { label: "Opus-high", good: ["opus-high"], min: 6, max: 6, rework: ["production-issue"], ideal: { model: "opus", effort: "high" } },
};

export const DEFAULT_MAIN: Worker = { model: "opus", effort: "high" };
export const DEFAULT_MONKEY = DEFAULT_MAIN;
export const MAIN_CONTEXT_TOKENS = 1_000_000;
export const SCOPED_CONTEXT_CAP = 45_000;
export const DEFAULT_TOGGLES: DispatchToggles = {
  keepWarm: false, ttl: "5m", approval: "manual", docsSkill: false, alwaysLoadedMcp: false,
  autoCompact: true, lazyLoadTools: true,
};
export const MODELS: readonly Model[] = ["haiku", "sonnet", "opus", "fable"];
export const EFFORTS: readonly Effort[] = ["low", "med", "high"];

export interface RouteOverride { model: Model | "inherit"; effort: Effort | "inherit" }
export type RouteOverrides = Record<RoutableTaskType, RouteOverride>;
export interface RoutingControl { main: Worker; useSubagents: boolean; routes: RouteOverrides }

export function defaultRouteOverrides(): RouteOverrides {
  return Object.fromEntries(ROUTABLE_TASK_TYPES.map(type => [type, { model: "inherit", effort: "inherit" }])) as RouteOverrides;
}
export function defaultRoutingControl(): RoutingControl {
  return { main: { ...DEFAULT_MAIN }, useSubagents: false, routes: defaultRouteOverrides() };
}

export interface DispatchTask {
  id: string;
  type: TaskType;
  title: string;
  atMin: number;
  contextTok: number;
  workInTok: number;
  outputTok: number;
  prefixKey: string;
  origin: "scenario" | "rework" | "moab";
  urgent?: boolean;
  incidentId?: string;
  reworkDepth?: number;
  usesTools?: boolean;
}

export interface DispatchWave { scenario: Scenario; name: string; lesson: string; tasks: DispatchTask[] }
export interface LedgerEconomy { currentCost: number; fullCost: number; readCost: number }
export interface LegacyTDWave {
  scenario: Scenario; options: MessageLedgerOptions; name: string; lesson: string;
  totalUsd: number; balloons: Array<{ entry: MessageLedgerEntry; delay: number }>;
}
export interface ResolvedRoute { worker: Worker; context: RouteContext; inherited: boolean; label: string }
export interface RouteResult {
  task: DispatchTask; monkey: Worker; route: ResolvedRoute; outcome: FitOutcome;
  usd: number; baselineUsd: number; wastedUsd: number; savingsUsd: number;
  rework: DispatchTask[]; ledgerOptions: MessageLedgerOptions;
  nextConversationTok: number;
  baselineNextConversationTok: number;
  compactionUsd: number;
}
export interface MoabScore { actualUsd: number; panicDefaultUsd: number; deltaUsd: number; panicDefaulted: boolean; draggedStages: number; stagesResolved: number }

const MODEL_POWER: Record<Model, number> = { haiku: 1, sonnet: 3, opus: 4, fable: 5 };
const EFFORT_POWER: Record<Effort, number> = { low: 0, med: 1, high: 2 };
const EFFORT_TOKENS: Record<Effort, { work: number; output: number }> = {
  low: { work: 0.75, output: 0.65 }, med: { work: 1, output: 1 }, high: { work: 1.2, output: 1.3 },
};

function workerKey(worker: Worker): string { return `${worker.model}-${worker.effort}`; }
export function evaluateFit(type: TaskType, worker: Worker): FitOutcome {
  const rule = FIT_TABLE[type];
  const key = workerKey(worker);
  if (rule.good.includes(key)) return "good-fit";
  const score = MODEL_POWER[worker.model] + EFFORT_POWER[worker.effort];
  return score < rule.min ? "bad-output" : score > rule.max ? "overkill" : "good-fit";
}

function routableType(type: TaskType): RoutableTaskType {
  if (type === "bug") return "debugging";
  if (type === "production-issue") return "hotfix";
  return type;
}

export function resolveRoute(type: TaskType, control: RoutingControl): ResolvedRoute {
  if (!control.useSubagents) return { worker: { ...control.main }, context: "main-1m", inherited: false, label: "MAIN AGENT" };
  const override = control.routes[routableType(type)];
  const inherited = override.model === "inherit" && override.effort === "inherit";
  const worker = {
    model: override.model === "inherit" ? control.main.model : override.model,
    effort: override.effort === "inherit" ? control.main.effort : override.effort,
  };
  return { worker, context: "scoped", inherited, label: `${routableType(type)} subagent${inherited ? " · inherit" : ""}` };
}

function typeFor(scenario: Scenario, index: number, message: ScriptedMessage): RoutableTaskType {
  const lower = message.text.toLowerCase();
  if (scenario.id === "refactor-moar") return (["plan", "code-review", "debugging", "code-review", "plan", "docs", "testing", "docs"] as RoutableTaskType[])[index] ?? "docs";
  if (scenario.id === "debug-prod") return (["hotfix", "debugging", "rca", "testing", "code-review", "docs"] as RoutableTaskType[])[index] ?? "debugging";
  if (lower.includes("plan") || lower.includes("propose") || lower.includes("architecture")) return "plan";
  if (lower.includes("review") || lower.includes("audit") || lower.includes("inspect")) return "code-review";
  if (lower.includes("test") || lower.includes("validat") || lower.includes("suite")) return "testing";
  if (lower.includes("report") || lower.includes("note") || lower.includes("triage")) return "docs";
  if (lower.includes("fail") || lower.includes("patch") || lower.includes("deploy")) return "hotfix";
  return index % 3 === 0 ? "plan" : "debugging";
}

export function scenarioToDispatchWave(scenario: Scenario): DispatchWave {
  return {
    scenario, name: scenario.title, lesson: `${scenario.blurb} ${scenario.stresses.join(" · ")}`,
    tasks: scenario.script.map((message, index) => {
      const type = typeFor(scenario, index, message);
      return {
      id: `${scenario.id}-${message.id}`, type, title: message.text,
      atMin: message.atMin, contextTok: message.contextTok ?? scenario.defaults.prefixTok,
      workInTok: message.workInTok ?? scenario.defaults.workInTok, outputTok: message.outputTok ?? scenario.defaults.outputTok,
      prefixKey: message.prefixKey ?? "main", origin: "scenario",
      usesTools: Boolean(message.subagent) || type === "debugging" || type === "testing" || type === "docs",
    };}),
  };
}

export function createMoab(atMin = 0, incidentId = `moab-${Math.round(atMin * 1000)}`): DispatchTask[] {
  const stages: Array<{ type: RoutableTaskType; title: string; work: number; output: number }> = [
    { type: "hotfix", title: "Stop the production bleed", work: 1_100, output: 850 },
    { type: "debugging", title: "Trace the live failure", work: 1_350, output: 900 },
    { type: "rca", title: "Reproduce and find the root cause", work: 1_700, output: 1_150 },
    { type: "code-review", title: "Review the emergency patch", work: 700, output: 650 },
    { type: "testing", title: "Regression-test the recovery", work: 850, output: 700 },
  ];
  return stages.map((stage, index) => ({
    id: `${incidentId}-${stage.type}`, type: stage.type, title: stage.title, atMin: atMin + index * 0.02,
    contextTok: 85_000, workInTok: stage.work, outputTok: stage.output,
    prefixKey: `${incidentId}:${stage.type}`, origin: "moab", urgent: true, incidentId,
    usesTools: stage.type === "debugging" || stage.type === "testing",
  }));
}

export function economyFromLedger(entry: MessageLedgerEntry, options: MessageLedgerOptions): LedgerEconomy {
  const fixed = entry.usd - entry.buckets.prefix.usd;
  return { currentCost: entry.usd, fullCost: entry.usd, readCost: fixed + priceTokens(entry.buckets.prefix.tokens, "cacheRead", options) };
}
export function scenarioToTDWave(scenario: Scenario, overrides: Partial<MessageLedgerOptions> = {}): LegacyTDWave {
  const options = { ...scenario.defaults, ...overrides };
  const ledger = priceTDScenario(scenario, options);
  return { scenario, options, name: scenario.title, lesson: `${scenario.blurb} ${scenario.stresses.join(" · ")}`, totalUsd: ledger.totalUsd, balloons: ledger.messages.map((entry, index) => ({ entry, delay: index * 0.5 })) };
}

function adjustedMessage(task: DispatchTask, worker: Worker, toggles: DispatchToggles, context: RouteContext, conversationTok: number) {
  const effort = EFFORT_TOKENS[worker.effort];
  const baseContext = context === "main-1m" ? MAIN_CONTEXT_TOKENS : Math.min(SCOPED_CONTEXT_CAP, task.contextTok);
  const adjustedBase = Math.max(0, Math.round(baseContext * (toggles.docsSkill && task.type === "docs" ? 0.72 : 1) + (toggles.alwaysLoadedMcp ? 12_000 : 0)));
  const approvalTok = toggles.approval === "manual" ? 320 : 0;
  const workInTok = Math.round(task.workInTok * effort.work) + approvalTok;
  const outputTok = Math.round(task.outputTok * effort.output);
  const contextTurn = applyContextLevers({ conversationTok }, {
    basePrefixTok: adjustedBase,
    growthTok: workInTok + outputTok,
    usesTools: Boolean(task.usesTools),
  }, { autoCompact: toggles.autoCompact, lazyLoadTools: toggles.lazyLoadTools });
  const message: ScriptedMessage = {
    id: task.id, role: "user", text: task.title, atMin: task.atMin,
    prefixKey: context === "main-1m" ? "main-agent-1m" : `scoped:${routableType(task.type)}`,
    contextTok: contextTurn.prefixTok, workInTok, outputTok,
  };
  return { message, contextTurn };
}

export function priceRoutedTask(task: DispatchTask, worker: Worker, toggles: DispatchToggles, priorTouchMin?: number, context: RouteContext = "main-1m", conversationTok = 0) {
  const adjusted = adjustedMessage(task, worker, toggles, context, conversationTok);
  const current = adjusted.message;
  const options: MessageLedgerOptions = { model: worker.model, ttl: toggles.ttl, keepWarm: toggles.keepWarm, prefixTok: current.contextTok ?? 0, workInTok: current.workInTok ?? 0, outputTok: current.outputTok ?? 0 };
  const script: ScriptedMessage[] = priorTouchMin === undefined ? [current] : [
    { id: `${task.id}-prior`, role: "assistant", text: "prior cache touch", atMin: priorTouchMin, prefixKey: current.prefixKey, contextTok: 0, workInTok: 0, outputTok: 0 }, current,
  ];
  const ledger = simulateMessageLedger(script, options);
  const compactionUsd = priceCompaction(adjusted.contextTurn.compactionInputTok, adjusted.contextTurn.compactionOutputTok);
  return {
    usd: (ledger.messages[ledger.messages.length - 1]?.usd ?? 0) + compactionUsd,
    options,
    nextConversationTok: adjusted.contextTurn.nextState.conversationTok,
    compactionUsd,
  };
}

export function makeReworkTasks(task: DispatchTask): DispatchTask[] {
  if ((task.reworkDepth ?? 0) >= 2) return [];
  return FIT_TABLE[task.type].rework.map((type, index) => ({
    id: `${task.id}-rework-${index}`, type,
    title: type === "production-issue" ? `Production fallout from: ${task.title}` : `Fix bad output from: ${task.title}`,
    atMin: task.atMin + 7 + index * 4, contextTok: Math.round(task.contextTok * (type === "production-issue" ? 1.15 : 0.55)),
    workInTok: Math.round(task.workInTok * (type === "production-issue" ? 1.4 : 0.8)), outputTok: Math.round(task.outputTok * (type === "production-issue" ? 1.25 : 0.75)),
    prefixKey: `${task.prefixKey}:rework`, origin: "rework", urgent: type === "production-issue", incidentId: task.incidentId,
    reworkDepth: (task.reworkDepth ?? 0) + 1,
    usesTools: task.usesTools || type === "bug" || type === "production-issue",
  }));
}

function idealCost(task: DispatchTask, toggles: DispatchToggles): number {
  return priceRoutedTask(task, FIT_TABLE[task.type].ideal, toggles, undefined, "scoped").usd;
}
export function routeTask(task: DispatchTask, worker: Worker, toggles: DispatchToggles, priorTouchMin?: number, baselinePriorTouchMin?: number, context: RouteContext = "main-1m"): RouteResult {
  const route: ResolvedRoute = { worker, context, inherited: false, label: context === "main-1m" ? "MAIN AGENT" : `${routableType(task.type)} subagent` };
  return priceResolvedRoute(task, route, toggles, priorTouchMin, baselinePriorTouchMin);
}
function priceResolvedRoute(task: DispatchTask, route: ResolvedRoute, toggles: DispatchToggles, priorTouchMin?: number, baselinePriorTouchMin?: number, conversationTok = 0, baselineConversationTok = 0): RouteResult {
  const priced = priceRoutedTask(task, route.worker, toggles, priorTouchMin, route.context, conversationTok);
  const baselinePrice = priceRoutedTask(task, DEFAULT_MAIN, DEFAULT_TOGGLES, baselinePriorTouchMin, "main-1m", baselineConversationTok);
  const baseline = baselinePrice.usd;
  const outcome = evaluateFit(task.type, route.worker);
  const fair = idealCost(task, toggles);
  return {
    task, monkey: route.worker, route, outcome, usd: priced.usd, baselineUsd: baseline,
    wastedUsd: outcome === "overkill" ? Math.max(0, priced.usd - fair) : 0,
    savingsUsd: outcome === "good-fit" ? Math.max(0, baseline - priced.usd) : 0,
    rework: outcome === "bad-output" ? makeReworkTasks(task) : [], ledgerOptions: priced.options,
    nextConversationTok: priced.nextConversationTok,
    baselineNextConversationTok: baselinePrice.nextConversationTok,
    compactionUsd: priced.compactionUsd,
  };
}
export function routeTaskWithControl(task: DispatchTask, control: RoutingControl, toggles: DispatchToggles, priorTouchMin?: number, baselinePriorTouchMin?: number, conversationTok = 0, baselineConversationTok = 0): RouteResult {
  return priceResolvedRoute(task, resolveRoute(task.type, control), toggles, priorTouchMin, baselinePriorTouchMin, conversationTok, baselineConversationTok);
}
export function liveSpendRate(task: DispatchTask, control: RoutingControl, toggles: DispatchToggles): number {
  return routeTaskWithControl(task, control, toggles).usd;
}
export function scoreMoab(results: readonly RouteResult[]): MoabScore {
  const incidentResults = results.filter(result => result.task.origin === "moab");
  const incidentIds = new Set(incidentResults.map(result => result.task.incidentId).filter((id): id is string => id !== undefined));
  const allIncidentWork = results.filter(result => result.task.origin === "moab" || (result.task.origin === "rework" && result.task.incidentId !== undefined && incidentIds.has(result.task.incidentId)));
  const actualUsd = allIncidentWork.reduce((sum, result) => sum + result.usd, 0);
  const panicDefaultUsd = incidentResults.reduce((sum, result) => sum + result.baselineUsd, 0);
  return {
    actualUsd, panicDefaultUsd, deltaUsd: panicDefaultUsd - actualUsd,
    panicDefaulted: incidentResults.length > 0 && incidentResults.every(result => result.route.context === "main-1m" && workerKey(result.monkey) === "opus-high"),
    draggedStages: incidentResults.filter(result => result.outcome === "bad-output").length,
    stagesResolved: incidentResults.length,
  };
}

export function priceTDScenario(scenario: Scenario, options: Partial<MessageLedgerOptions> = {}) { return simulateMessageLedger(scenario.script, { ...scenario.defaults, ...options }); }
export function isGameOver(spend: number, budget: number, overdraftAllowance: number): boolean { return spend >= budget + overdraftAllowance; }
export function overdraftLeft(spend: number, budget: number, allowance: number): number { return Math.max(0, allowance - Math.max(0, spend - budget)); }
