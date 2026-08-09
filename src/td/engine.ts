import type { Model } from "../engine/types.js";
import { priceTokens } from "../sim/cost.js";
import { simulateMessageLedger, type MessageLedgerEntry, type MessageLedgerOptions, type ScriptedMessage } from "../sim/ledger.js";
import type { Scenario } from "../sim/scenarios.js";

export type Effort = "low" | "med" | "high";
export type TaskType = "dev" | "plan" | "browser-test" | "code-review" | "docs" | "bug" | "production-issue";
export type FitOutcome = "bad-output" | "good-fit" | "overkill";

export interface Monkey { model: Model; effort: Effort }
export interface DispatchToggles {
  keepWarm: boolean;
  ttl: "5m" | "1h";
  approval: "auto" | "manual";
  docsSkill: boolean;
  alwaysLoadedMcp: boolean;
}

export interface FitRule {
  label: string;
  min: number;
  max: number;
  rework: readonly TaskType[];
}

/** Capability bands are intentionally visible: routing quality must never be hidden magic. */
export const FIT_TABLE: Record<TaskType, FitRule> = {
  docs: { label: "Haiku or Sonnet-low", min: 1, max: 3, rework: ["bug"] },
  "browser-test": { label: "Sonnet low/med", min: 3, max: 4, rework: ["bug"] },
  "code-review": { label: "Sonnet-med", min: 4, max: 4, rework: ["bug"] },
  dev: { label: "Sonnet-high or Opus-med", min: 5, max: 5, rework: ["bug", "bug"] },
  plan: { label: "Sonnet-high or Opus-high", min: 5, max: 6, rework: ["bug", "production-issue"] },
  bug: { label: "Sonnet-high or Opus-med", min: 5, max: 5, rework: ["production-issue"] },
  "production-issue": { label: "Opus-high", min: 6, max: 6, rework: ["production-issue"] },
};

export const DEFAULT_MONKEY: Monkey = { model: "opus", effort: "high" };
export const DEFAULT_TOGGLES: DispatchToggles = {
  keepWarm: false, ttl: "5m", approval: "manual", docsSkill: false, alwaysLoadedMcp: false,
};

export const ROSTER: readonly Monkey[] = [
  { model: "haiku", effort: "low" },
  { model: "sonnet", effort: "low" },
  { model: "sonnet", effort: "med" },
  { model: "sonnet", effort: "high" },
  { model: "opus", effort: "med" },
  DEFAULT_MONKEY,
  { model: "fable", effort: "high" },
] as const;

export interface DispatchTask {
  id: string;
  type: TaskType;
  title: string;
  atMin: number;
  contextTok: number;
  workInTok: number;
  outputTok: number;
  prefixKey: string;
  origin: "scenario" | "rework";
}

export interface DispatchWave {
  scenario: Scenario;
  name: string;
  lesson: string;
  tasks: DispatchTask[];
}

// Retained as a narrow parity adapter for the shared Sandbox/TD contract.
export interface LedgerEconomy { currentCost: number; fullCost: number; readCost: number }
export interface LegacyTDWave {
  scenario: Scenario;
  options: MessageLedgerOptions;
  name: string;
  lesson: string;
  totalUsd: number;
  balloons: Array<{ entry: MessageLedgerEntry; delay: number }>;
}

export interface RouteResult {
  task: DispatchTask;
  monkey: Monkey;
  outcome: FitOutcome;
  usd: number;
  baselineUsd: number;
  wastedUsd: number;
  rework: DispatchTask[];
  ledgerOptions: MessageLedgerOptions;
}

const MODEL_POWER: Record<Model, number> = { haiku: 1, sonnet: 3, opus: 4, fable: 5 };
const EFFORT_POWER: Record<Effort, number> = { low: 0, med: 1, high: 2 };
const EFFORT_TOKENS: Record<Effort, { work: number; output: number }> = {
  low: { work: 0.75, output: 0.65 }, med: { work: 1, output: 1 }, high: { work: 1.2, output: 1.3 },
};

export function evaluateFit(type: TaskType, monkey: Monkey): FitOutcome {
  const score = MODEL_POWER[monkey.model] + EFFORT_POWER[monkey.effort];
  const rule = FIT_TABLE[type];
  return score < rule.min ? "bad-output" : score > rule.max ? "overkill" : "good-fit";
}

function typeFor(scenario: Scenario, index: number, message: ScriptedMessage): TaskType {
  const lower = message.text.toLowerCase();
  // MOAR has one deliberately huge implementation handoff; the surrounding work is planning, review, QA, and notes.
  if (scenario.id === "refactor-moar") return (["plan", "code-review", "dev", "code-review", "plan", "docs", "browser-test", "docs"] as TaskType[])[index] ?? "docs";
  if (scenario.id === "debug-prod") return index % 2 === 0 ? "production-issue" : "docs";
  if (lower.includes("plan") || lower.includes("propose") || lower.includes("architecture")) return "plan";
  if (lower.includes("review") || lower.includes("audit") || lower.includes("inspect")) return "code-review";
  if (lower.includes("test") || lower.includes("validat")) return "browser-test";
  if (lower.includes("report") || lower.includes("note") || lower.includes("triage")) return "docs";
  if (scenario.id === "inbox-triage") return index % 2 ? "docs" : "code-review";
  return "dev";
}

export function scenarioToDispatchWave(scenario: Scenario): DispatchWave {
  return {
    scenario,
    name: scenario.title,
    lesson: `${scenario.blurb} ${scenario.stresses.join(" · ")}`,
    tasks: scenario.script.map((message, index) => ({
      id: `${scenario.id}-${message.id}`,
      type: typeFor(scenario, index, message),
      title: message.text,
      atMin: message.atMin,
      contextTok: message.contextTok ?? scenario.defaults.prefixTok,
      workInTok: message.workInTok ?? scenario.defaults.workInTok,
      outputTok: message.outputTok ?? scenario.defaults.outputTok,
      prefixKey: message.prefixKey ?? "main",
      origin: "scenario",
    })),
  };
}

export function economyFromLedger(entry: MessageLedgerEntry, _options: MessageLedgerOptions): LedgerEconomy {
  const fixed = entry.usd - entry.buckets.prefix.usd;
  return {
    currentCost: entry.usd,
    fullCost: entry.usd,
    readCost: fixed + priceTokens(entry.buckets.prefix.tokens, "cacheRead", _options),
  };
}

export function scenarioToTDWave(scenario: Scenario, overrides: Partial<MessageLedgerOptions> = {}): LegacyTDWave {
  const options = { ...scenario.defaults, ...overrides };
  const ledger = priceTDScenario(scenario, options);
  return {
    scenario, options, name: scenario.title,
    lesson: `${scenario.blurb} ${scenario.stresses.join(" · ")}`,
    totalUsd: ledger.totalUsd,
    balloons: ledger.messages.map((entry, index) => ({ entry, delay: index * 0.5 })),
  };
}

function adjustedMessage(task: DispatchTask, monkey: Monkey, toggles: DispatchToggles): ScriptedMessage {
  const effort = EFFORT_TOKENS[monkey.effort];
  // Config and skill modifiers alter token buckets; the shared ledger still performs every dollar calculation.
  const contextTok = Math.max(0, Math.round(
    task.contextTok
      * (toggles.docsSkill && task.type === "docs" ? 0.72 : 1)
      + (toggles.alwaysLoadedMcp ? 12_000 : 0),
  ));
  const approvalTok = toggles.approval === "manual" ? 320 : 0;
  return {
    id: task.id, role: "user", text: task.title, atMin: task.atMin, prefixKey: task.prefixKey,
    contextTok,
    workInTok: Math.round(task.workInTok * effort.work) + approvalTok,
    outputTok: Math.round(task.outputTok * effort.output),
  };
}

/** Prices exactly one routed task through the canonical ledger, including warm/TTL state. */
export function priceRoutedTask(
  task: DispatchTask,
  monkey: Monkey,
  toggles: DispatchToggles,
  priorTouchMin?: number,
): { usd: number; options: MessageLedgerOptions } {
  const current = adjustedMessage(task, monkey, toggles);
  const options: MessageLedgerOptions = {
    model: monkey.model, ttl: toggles.ttl, keepWarm: toggles.keepWarm,
    prefixTok: current.contextTok ?? 0, workInTok: current.workInTok ?? 0, outputTok: current.outputTok ?? 0,
  };
  const script: ScriptedMessage[] = priorTouchMin === undefined ? [current] : [
    { id: `${task.id}-prior`, role: "assistant", text: "prior cache touch", atMin: priorTouchMin, prefixKey: task.prefixKey, contextTok: 0, workInTok: 0, outputTok: 0 },
    current,
  ];
  const ledger = simulateMessageLedger(script, options);
  return { usd: ledger.messages.at(-1)?.usd ?? 0, options };
}

export function makeReworkTasks(task: DispatchTask): DispatchTask[] {
  return FIT_TABLE[task.type].rework.map((type, index) => ({
    id: `${task.id}-rework-${index}`,
    type,
    title: type === "production-issue" ? `Production fallout from: ${task.title}` : `Fix bad output from: ${task.title}`,
    atMin: task.atMin + 7 + index * 4,
    contextTok: Math.round(task.contextTok * (type === "production-issue" ? 1.15 : 0.55)),
    workInTok: Math.round(task.workInTok * (type === "production-issue" ? 1.4 : 0.8)),
    outputTok: Math.round(task.outputTok * (type === "production-issue" ? 1.25 : 0.75)),
    prefixKey: `${task.prefixKey}:rework`,
    origin: "rework",
  }));
}

export function routeTask(
  task: DispatchTask,
  monkey: Monkey,
  toggles: DispatchToggles,
  priorTouchMin?: number,
  baselinePriorTouchMin?: number,
): RouteResult {
  const priced = priceRoutedTask(task, monkey, toggles, priorTouchMin);
  const baseline = priceRoutedTask(task, DEFAULT_MONKEY, DEFAULT_TOGGLES, baselinePriorTouchMin).usd;
  const outcome = evaluateFit(task.type, monkey);
  return {
    task, monkey, outcome, usd: priced.usd, baselineUsd: baseline,
    wastedUsd: outcome === "overkill" ? Math.max(0, priced.usd - baselineForIdeal(task, toggles)) : 0,
    rework: outcome === "bad-output" ? makeReworkTasks(task) : [],
    ledgerOptions: priced.options,
  };
}

function baselineForIdeal(task: DispatchTask, toggles: DispatchToggles): number {
  const ideal: Monkey = task.type === "docs" ? { model: "haiku", effort: "low" }
    : task.type === "browser-test" ? { model: "sonnet", effort: "low" }
      : task.type === "code-review" ? { model: "sonnet", effort: "med" }
        : task.type === "plan" || task.type === "production-issue" ? DEFAULT_MONKEY
          : { model: "sonnet", effort: "high" };
  return priceRoutedTask(task, ideal, toggles).usd;
}

/** Parity path used by the Sandbox/Article contract tests. */
export function priceTDScenario(scenario: Scenario, options: Partial<MessageLedgerOptions> = {}) {
  return simulateMessageLedger(scenario.script, { ...scenario.defaults, ...options });
}

export function isGameOver(spend: number, budget: number, overdraftAllowance: number): boolean {
  return spend >= budget + overdraftAllowance;
}

export function overdraftLeft(spend: number, budget: number, allowance: number): number {
  return Math.max(0, allowance - Math.max(0, spend - budget));
}
