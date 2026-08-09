import type { Model } from "../engine/types.js";
import { simulateMessageLedger, type MessageLedgerOptions, type ScriptedMessage } from "./ledger.js";

export type ScenarioId = "refactor-moar" | "inbox-triage" | "ship-feature" | "debug-prod" | "subagent-swarm";
export type ScenarioLever = "subagents" | "ttl" | "context" | "approval" | "keepWarm";

export interface Scenario {
  id: ScenarioId;
  title: string;
  blurb: string;
  stresses: ScenarioLever[];
  script: ScriptedMessage[];
  defaults: MessageLedgerOptions;
}

const msg = (id: string, atMin: number, text: string, extras: Partial<ScriptedMessage> = {}): ScriptedMessage => ({
  id, atMin, text, role: id.endsWith("a") ? "assistant" : "user", ...extras,
});

const defaults = (prefixTok: number, workInTok: number, outputTok: number, model: Model = "sonnet"): MessageLedgerOptions => ({
  ttl: "5m", model, prefixTok, workInTok, outputTok, keepWarm: false,
});

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "refactor-moar", title: "Refactor MOAR", blurb: "Mother Of All Refactors: one enormous task that keeps a huge codebase context alive.",
    stresses: ["subagents", "context", "keepWarm"], defaults: defaults(120_000, 1_100, 1_800, "opus"),
    script: [
      msg("r1", 0, "Map the old architecture and plan the migration."), msg("r1a", 3, "I found four coupled seams. Starting with the data layer."),
      msg("r2", 7, "Refactor the core and keep compatibility."), msg("r2a", 12, "Core is migrated; validating callers now."),
      msg("r3", 18, "Delegate the UI and test migrations.", { subagent: true, prefixKey: "refactor-helper" }),
      msg("r3a", 22, "Helpers are working in parallel.", { subagent: true, prefixKey: "refactor-helper" }),
      msg("r4", 29, "Integrate everything and run the full suite."), msg("r4a", 36, "Integrated. The suite is green."),
    ],
  },
  {
    id: "inbox-triage", title: "Inbox Triage", blurb: "Many tiny decisions in rapid succession, where a warm cache and fewer approval pauses shine.",
    stresses: ["ttl", "approval"], defaults: defaults(8_000, 180, 220),
    script: Array.from({ length: 12 }, (_, i) => msg(`i${i}${i % 2 ? "a" : ""}`, i * 2, i % 2 ? "Done — next item?" : `Triage issue #${i / 2 + 1} and suggest the smallest action.`)),
  },
  {
    id: "ship-feature", title: "Ship a Feature", blurb: "A balanced build: discovery, implementation, a few helpers, review, and release.",
    stresses: ["subagents", "context", "approval"], defaults: defaults(32_000, 650, 900),
    script: [
      msg("s1", 0, "Trace the feature flow and propose an implementation."), msg("s1a", 4, "Plan ready; the API and UI can move together."),
      msg("s2", 9, "Build the API slice."), msg("s2a", 14, "API and tests are in place."),
      msg("s3", 17, "Have a helper review edge cases.", { subagent: true, prefixKey: "feature-review" }),
      msg("s3a", 20, "Review found two validation gaps.", { subagent: true, prefixKey: "feature-review" }),
      msg("s4", 25, "Finish the UI and ship it."), msg("s4a", 31, "Feature shipped with the gaps covered."),
    ],
  },
  {
    id: "debug-prod", title: "Debug Prod at 2am", blurb: "Short incident bursts separated by long waits for logs, deploys, and dashboards.",
    stresses: ["ttl", "keepWarm"], defaults: { ...defaults(70_000, 700, 850, "opus"), ttl: "1h" },
    script: [
      msg("d1", 0, "Production is failing. Correlate the first alert."), msg("d1a", 3, "Likely queue saturation; I need the next log batch."),
      msg("d2", 48, "Logs arrived. Test the queue hypothesis."), msg("d2a", 53, "Confirmed. Patch is deploying."),
      msg("d3", 122, "Deployment settled. Check the error rate."), msg("d3a", 126, "Recovered. Writing the incident note."),
    ],
  },
  {
    id: "subagent-swarm", title: "Subagent Swarm", blurb: "A wide fan-out where shared helper prompts can turn repeated writes into reads.",
    stresses: ["subagents", "context"], defaults: defaults(55_000, 420, 620),
    script: [
      msg("a0", 0, "Audit every package in parallel."),
      ...Array.from({ length: 10 }, (_, i) => msg(`a${i + 1}${i % 2 ? "a" : ""}`, i + 1, `Helper ${i + 1}: inspect package ${i + 1}.`, { subagent: true, prefixKey: "shared-audit" })),
      msg("a12a", 14, "Merged the swarm's findings into one report."),
    ],
  },
] as const;

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, scenario])) as Record<ScenarioId, Scenario>;

export function priceScenario(scenario: Scenario, options: Partial<MessageLedgerOptions> = {}) {
  return simulateMessageLedger(scenario.script, { ...scenario.defaults, ...options });
}
