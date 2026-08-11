import type { Model } from "../engine/types.js";
import {
  MACRO_ROUTES, priceTaskChoice, verdictForChoice,
  type Effort, type RouteVerdict, type WorkRoute,
} from "../article/macroPricing.js";

export type Difficulty = "easy" | "medium" | "hard";
export type Persona = "developer" | "pm" | "lead" | "solo";
export type UpgradeId = "keepWarm" | "ttl" | "lazyTools" | "compact" | "stablePrefix";
export interface DispatchTask { id: string; routeIndex: number; urgent: boolean; rework: boolean; patience?: number }
export interface DispatchState { spent: number; baseline: number; banked: number; combo: number; reworks: number; completed: number }
export interface DispatchResult { state: DispatchState; verdict: RouteVerdict; cost: number; baseline: number; reward: number; rework?: DispatchTask }
export interface GameState { dispatch: DispatchState; security: number; day: number; phase: "playing"|"shop"|"won"|"lost"; upgrades: UpgradeId[] }

export const MODELS: readonly Model[] = ["haiku", "sonnet", "opus", "fable"];
export const EFFORTS: readonly Effort[] = ["low", "medium", "high"];
export const DIFFICULTY = {
  easy: { board: 8, patience: 34, arrivalMs: 6500, budget: 5.2, cacheChance: .025, preview: true, suggestion: true },
  medium: { board: 6, patience: 25, arrivalMs: 4800, budget: 4.1, cacheChance: .055, preview: true, suggestion: false },
  hard: { board: 4, patience: 18, arrivalMs: 3300, budget: 3.25, cacheChance: .1, preview: false, suggestion: false },
} as const;
export const PERSONAS = {
  developer: { label: "Developer", budget: 1, board: 0, quip: "Tests are your emotional support animal." },
  pm: { label: "PM", budget: 1.12, board: -1, quip: "Everything is P0, tastefully." },
  lead: { label: "Team Lead", budget: .95, board: 2, quip: "You own the shared prefix." },
  solo: { label: "One-Man Company", budget: 1.22, board: 0, quip: "The org chart is a mirror." },
} as const;
export const UPGRADES: Record<UpgradeId, { name: string; price: number; effect: string }> = {
  keepWarm: { name: "Keep-warm ping", price: .12, effect: "Cache shocks and decay −60%." },
  ttl: { name: "1-hour cache TTL", price: .2, effect: "Long-gap reads stay at 0.1×; writes cost 2× vs 1.25×." },
  lazyTools: { name: "Lazy-load skills + MCP", price: .18, effect: "Drops 14k prefix tokens: task input −14%." },
  compact: { name: "Auto-compact", price: .26, effect: "Caps long-day context growth: input −10%." },
  stablePrefix: { name: "Stable shared prefix", price: .32, effect: "More cache hits: input −18%." },
};

export function newDispatchState(): DispatchState { return { spent: 0, baseline: 0, banked: 0, combo: 0, reworks: 0, completed: 0 }; }
export function routeFor(task: DispatchTask): WorkRoute { return MACRO_ROUTES[task.routeIndex % MACRO_ROUTES.length]; }
export function costMultiplier(warmth: number, upgrades: readonly UpgradeId[]): number {
  const cold = (100 - Math.max(0, Math.min(100, warmth))) / 100;
  let multiplier = 1 + cold * (upgrades.includes("keepWarm") ? .3 : .75);
  if (upgrades.includes("lazyTools")) multiplier *= .86;
  if (upgrades.includes("compact")) multiplier *= .9;
  if (upgrades.includes("stablePrefix")) multiplier *= .82;
  if (upgrades.includes("ttl")) multiplier *= .93;
  return multiplier;
}
export function previewTask(task: DispatchTask, model: Model, effort: Effort, multiplier = 1) {
  const route = routeFor(task); const verdict = verdictForChoice(route, model, effort);
  const cost = priceTaskChoice(route, model, effort) * multiplier;
  const baseline = priceTaskChoice(route, "opus", "high");
  return { verdict, cost, delta: baseline - cost };
}
export function dispatchTask(state: DispatchState, task: DispatchTask, model: Model, effort: Effort, multiplier = 1): DispatchResult {
  const route = routeFor(task); const verdict = verdictForChoice(route, model, effort);
  const cost = priceTaskChoice(route, model, effort) * multiplier;
  const baseline = task.rework ? 0 : priceTaskChoice(route, "opus", "high");
  const fitCost = priceTaskChoice(route, route.model, route.effort) * multiplier;
  const combo = verdict === "good" ? state.combo + 1 : 0;
  const reward = verdict === "good" ? Math.max(0, baseline - cost) : 0;
  return { verdict, cost, baseline, reward,
    rework: verdict === "bad" && !task.rework ? { ...task, id: `${task.id}-rework`, rework: true, urgent: true, patience: 10 } : undefined,
    state: { spent: state.spent + cost + (verdict === "bad" ? fitCost : 0), baseline: state.baseline + baseline,
      banked: state.banked + reward, combo, reworks: state.reworks + (verdict === "bad" ? 1 : 0), completed: state.completed + (verdict === "bad" ? 0 : 1) },
  };
}
export function damageForQueue(count: number, capacity: number, expired = 0): number { return Math.max(0, count - capacity) * 12 + expired * 16; }
export function buyUpgrade(state: GameState, id: UpgradeId): GameState {
  const item = UPGRADES[id]; if (state.upgrades.includes(id) || state.dispatch.banked < item.price) return state;
  return { ...state, upgrades: [...state.upgrades, id], dispatch: { ...state.dispatch, banked: state.dispatch.banked - item.price } };
}
export function resolvePhase(state: GameState, budget: number, practice = false): GameState["phase"] {
  if (!practice && (state.security <= 0 || state.dispatch.spent > budget)) return "lost";
  if (state.day > 5) return "won";
  return state.phase;
}
export function gradeFor(state: DispatchState): string { return state.reworks === 0 && state.banked > 0 ? "S" : state.reworks <= 1 && state.banked > 0 ? "A" : state.banked > 0 ? "B" : "C"; }
