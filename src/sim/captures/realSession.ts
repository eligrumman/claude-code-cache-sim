import { MODEL_IN, RATE, tokCost } from "../../engine/pricing.js";

export const REAL_SESSION_MODEL = "opus" as const;

export interface RealSessionStep {
  readonly label: string;
  readonly cacheRead: number;
  readonly cacheWrite: number;
  readonly freshInput: number;
  readonly output: number;
}

export interface RealSessionCost extends RealSessionStep {
  readonly costWarm: number;
  readonly costCold: number;
  readonly savedPct: number;
}

export const REAL_SESSION = [
  { label: "Read inventory.py, analyze remove()", cacheRead: 47_005, cacheWrite: 2_581, freshInput: 2, output: 908 },
  { label: "Trace the underflow bug", cacheRead: 49_586, cacheWrite: 908, freshInput: 504, output: 18 },
  { label: "Report: remove() drops below zero", cacheRead: 50_494, cacheWrite: 38, freshInput: 2, output: 857 },
  { label: "Add ValueError guard to remove()", cacheRead: 50_532, cacheWrite: 1_250, freshInput: 2, output: 49 },
  { label: "Handle edge case qty == stock", cacheRead: 51_782, cacheWrite: 49, freshInput: 504, output: 9 },
  { label: "Write a test for the guard", cacheRead: 51_831, cacheWrite: 1_091, freshInput: 2, output: 434 },
  { label: "Run the test suite", cacheRead: 52_922, cacheWrite: 434, freshInput: 504, output: 12 },
  { label: "Summarize the change", cacheRead: 53_356, cacheWrite: 18, freshInput: 2, output: 530 },
  { label: "Explain why the guard matters", cacheRead: 53_374, cacheWrite: 530, freshInput: 504, output: 11 },
] as const satisfies readonly RealSessionStep[];

export const REAL_SESSION_RATES = {
  cacheRead: MODEL_IN[REAL_SESSION_MODEL] * RATE.read,
  cacheWrite: MODEL_IN[REAL_SESSION_MODEL] * RATE.w5m,
  freshInput: MODEL_IN[REAL_SESSION_MODEL] * RATE.input,
  output: MODEL_IN[REAL_SESSION_MODEL] * RATE.out,
} as const;

export function costRealSessionStep(step: RealSessionStep): RealSessionCost {
  const costWarm =
    tokCost(step.cacheRead, RATE.read, REAL_SESSION_MODEL) +
    tokCost(step.cacheWrite, RATE.w5m, REAL_SESSION_MODEL) +
    tokCost(step.freshInput, RATE.input, REAL_SESSION_MODEL) +
    tokCost(step.output, RATE.out, REAL_SESSION_MODEL);
  const costCold =
    tokCost(step.cacheRead + step.cacheWrite + step.freshInput, RATE.input, REAL_SESSION_MODEL) +
    tokCost(step.output, RATE.out, REAL_SESSION_MODEL);

  return { ...step, costWarm, costCold, savedPct: (1 - costWarm / costCold) * 100 };
}

export const REAL_SESSION_COSTS = REAL_SESSION.map(costRealSessionStep);

export function totalRealSessionCosts(steps: readonly RealSessionCost[] = REAL_SESSION_COSTS) {
  const costWarm = steps.reduce((total, step) => total + step.costWarm, 0);
  const costCold = steps.reduce((total, step) => total + step.costCold, 0);
  return { costWarm, costCold, savedPct: (1 - costWarm / costCold) * 100 };
}
