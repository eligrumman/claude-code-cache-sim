import { RATE, tokCost } from "../engine/pricing.js";
import type { Model } from "../engine/types.js";

export type CostTier = "write" | "read";

export interface BalloonEconomy {
  tokens: number;
  model: Model;
  fullCost: number;
  currentCost: number;
}

/** Tokenloons treats an uncached request as a 1h cache write: the large red baseline. */
export function balloonCost(tokens: number, model: Model = "sonnet", tier: CostTier = "write"): number {
  return tokCost(tokens, tier === "write" ? RATE.w1h : RATE.read, model);
}

export function makeBalloonEconomy(tokens: number, model: Model = "sonnet"): BalloonEconomy {
  const fullCost = balloonCost(tokens, model, "write");
  return { tokens, model, fullCost, currentCost: fullCost };
}

/** Applies a warm read exactly once and returns the newly earned savings. */
export function shrinkToRead(balloon: BalloonEconomy): number {
  const before = balloon.currentCost;
  balloon.currentCost = Math.min(before, balloonCost(balloon.tokens, balloon.model, "read"));
  return Math.max(0, before - balloon.currentCost);
}

export function isGameOver(spend: number, budget: number, overdraftAllowance: number): boolean {
  return spend >= budget + overdraftAllowance;
}

export function overdraftLeft(spend: number, budget: number, allowance: number): number {
  return Math.max(0, allowance - Math.max(0, spend - budget));
}

