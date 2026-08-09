import type { Model } from "../engine/types.js";
import { priceTokens, type Ttl } from "../sim/cost.js";
import { simulateMessageLedger, type MessageLedgerEntry, type MessageLedgerOptions } from "../sim/ledger.js";
import type { Scenario } from "../sim/scenarios.js";

export type CostTier = "write" | "read";

export interface BalloonEconomy {
  tokens: number;
  model: Model;
  ttl: Ttl;
  fullCost: number;
  currentCost: number;
  readCost: number;
}

export interface TDMessageSpec {
  entry: MessageLedgerEntry;
  prefix: string;
  prompt: string;
  subagent: boolean;
  delay: number;
}

export interface TDWave {
  scenario: Scenario;
  options: MessageLedgerOptions;
  name: string;
  lesson: string;
  balloons: TDMessageSpec[];
  totalUsd: number;
}

/** Compatibility helper: TD pricing delegates to the shared bucket pricer. */
export function balloonCost(tokens: number, model: Model = "sonnet", tier: CostTier = "write", ttl: Ttl = "1h"): number {
  return priceTokens(tokens, tier === "write" ? "cacheWrite" : "cacheRead", { model, ttl });
}

export function makeBalloonEconomy(tokens: number, model: Model = "sonnet", ttl: Ttl = "1h"): BalloonEconomy {
  const fullCost = balloonCost(tokens, model, "write", ttl);
  return { tokens, model, ttl, fullCost, currentCost: fullCost, readCost: balloonCost(tokens, model, "read", ttl) };
}

/** Turns the canonical ledger row into the exact economy rendered by one balloon. */
export function economyFromLedger(entry: MessageLedgerEntry, options: MessageLedgerOptions): BalloonEconomy {
  const tokens = entry.buckets.prefix.tokens;
  const fixedCost = entry.usd - entry.buckets.prefix.usd;
  return {
    tokens,
    model: options.model,
    ttl: options.ttl,
    fullCost: entry.usd,
    currentCost: entry.usd,
    readCost: fixedCost + priceTokens(tokens, "cacheRead", options),
  };
}

/** Applies a warm read exactly once and returns the newly earned savings. */
export function shrinkToRead(balloon: BalloonEconomy): number {
  const before = balloon.currentCost;
  balloon.currentCost = Math.min(before, balloon.readCost);
  return Math.max(0, before - balloon.currentCost);
}

/** TD's evaluation path intentionally returns the shared ledger, which parity tests lock down. */
export function priceTDScenario(scenario: Scenario, options: Partial<MessageLedgerOptions> = {}) {
  return simulateMessageLedger(scenario.script, { ...scenario.defaults, ...options });
}

export function scenarioToTDWave(scenario: Scenario, overrides: Partial<MessageLedgerOptions> = {}): TDWave {
  const options = { ...scenario.defaults, ...overrides };
  const ledger = priceTDScenario(scenario, options);
  return {
    scenario,
    options,
    name: scenario.title,
    lesson: `${scenario.blurb} Stresses: ${scenario.stresses.join(", ")}.`,
    totalUsd: ledger.totalUsd,
    balloons: ledger.messages.map((entry, index) => ({
      entry,
      prefix: entry.prefixKey ?? "main",
      prompt: entry.prefixKey ?? "main",
      subagent: Boolean(entry.subagent),
      delay: index * (scenario.id === "subagent-swarm" ? .28 : .62),
    })),
  };
}

export function isGameOver(spend: number, budget: number, overdraftAllowance: number): boolean {
  return spend >= budget + overdraftAllowance;
}

export function overdraftLeft(spend: number, budget: number, allowance: number): number {
  return Math.max(0, allowance - Math.max(0, spend - budget));
}
