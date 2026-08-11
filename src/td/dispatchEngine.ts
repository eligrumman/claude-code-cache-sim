import type { Model } from "../engine/types.js";
import {
  MACRO_ROUTES,
  priceTaskChoice,
  verdictForChoice,
  type Effort,
  type RouteVerdict,
  type WorkRoute,
} from "../article/macroPricing.js";

export interface DispatchTask {
  id: string;
  routeIndex: number;
  urgent: boolean;
  rework: boolean;
}

export interface DispatchState {
  spent: number;
  baseline: number;
  banked: number;
  combo: number;
  reworks: number;
  completed: number;
}

export interface DispatchResult {
  state: DispatchState;
  verdict: RouteVerdict;
  cost: number;
  baseline: number;
  reward: number;
  rework?: DispatchTask;
}

export const MODELS: readonly Model[] = ["haiku", "sonnet", "opus", "fable"];
export const EFFORTS: readonly Effort[] = ["low", "medium", "high"];

export function newDispatchState(): DispatchState {
  return { spent: 0, baseline: 0, banked: 0, combo: 0, reworks: 0, completed: 0 };
}

export function routeFor(task: DispatchTask): WorkRoute {
  return MACRO_ROUTES[task.routeIndex % MACRO_ROUTES.length];
}

/** Pure scoring path used by both the arcade UI and behavioral tests. */
export function dispatchTask(state: DispatchState, task: DispatchTask, model: Model, effort: Effort, cacheMultiplier = 1): DispatchResult {
  const route = routeFor(task);
  const verdict = verdictForChoice(route, model, effort);
  const rawCost = priceTaskChoice(route, model, effort);
  const cost = rawCost * cacheMultiplier;
  const baseline = task.rework ? 0 : priceTaskChoice(route, "opus", "high");
  const fitCost = priceTaskChoice(route, route.model, route.effort) * cacheMultiplier;
  const nextCombo = verdict === "good" ? state.combo + 1 : 0;
  const reward = verdict === "good" ? Math.max(0, baseline - cost) * (1 + Math.min(5, nextCombo - 1) * 0.12) : 0;
  const rework = verdict === "bad" && !task.rework
    ? { ...task, id: `${task.id}-rework`, rework: true, urgent: true }
    : undefined;
  return {
    verdict, cost, baseline, reward, rework,
    state: {
      spent: state.spent + cost + (verdict === "bad" ? fitCost : 0),
      baseline: state.baseline + baseline,
      banked: state.banked + reward,
      combo: nextCombo,
      reworks: state.reworks + (verdict === "bad" ? 1 : 0),
      completed: state.completed + (verdict === "bad" ? 0 : 1),
    },
  };
}

export function gradeFor(state: DispatchState): string {
  if (state.reworks === 0 && state.banked > 0) return "S";
  if (state.reworks <= 1 && state.banked > 0) return "A";
  if (state.banked > 0) return "B";
  return "C";
}
