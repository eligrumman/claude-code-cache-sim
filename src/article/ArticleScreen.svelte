<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import MacroRouteWidget from "./MacroRouteWidget.svelte";
  import MacroTaskPicker from "./MacroTaskPicker.svelte";
  import ContextCostWidget from "./ContextCostWidget.svelte";
  import WorkdaySessionWidget from "./WorkdaySessionWidget.svelte";
  import SpendBreakdownWidget from "./SpendBreakdownWidget.svelte";
  import CacheLifecycleWidget from "./CacheLifecycleWidget.svelte";
  import OutputCostWidget from "./OutputCostWidget.svelte";
  import RouteRateCardWidget from "./RouteRateCardWidget.svelte";
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import {
    COMPACTION,
    TOTAL_TOOL_CONTEXT_TOKENS,
    priceCompaction,
    priceTokens,
  } from "../sim/cost.js";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";
  import {
    MACRO_ROUTES,
    priceContextComparison,
    priceTaskChoice,
    type Effort,
  } from "./macroPricing.js";
  import type { Model } from "../engine/types.js";
  import CopyButton from "../setup/CopyButton.svelte";
  import { recipeById, type RecipeId } from "../setup/recipes.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import { REAL_SEGMENT_PROVENANCE, REAL_SEGMENT_ROWS } from "../sim/captures/realSegments.js";

  interface Props {
    onback: () => void;
    onsandbox: () => void;
    /** Optional direct route for hosts that expose it; the current hub is the fallback. */
    ontd?: () => void;
  }

  let { onback, onsandbox, ontd = onback }: Props = $props();
  let article = $state<"micro" | "macro">("micro");
  let tldr = $state(true);
  let expanded = $state<Record<string, boolean>>({});

  const ahaCold = priceTokens(1_000_000, "cacheWrite", { model: "haiku", ttl: "5m" });
  const ahaWarm = priceTokens(1_000_000, "cacheRead", { model: "haiku", ttl: "5m" });
  const sonnetPrefixRead = priceTokens(260_000, "cacheRead", { model: "sonnet", ttl: "1h" });
  const sonnetPrefixRebuild = priceTokens(260_000, "cacheWrite", { model: "sonnet", ttl: "1h" });
  const keepWarmPrefixRead = priceTokens(68_000, "cacheRead", { model: "sonnet", ttl: "5m" });
  const keepWarmPrefixRebuild = priceTokens(68_000, "cacheWrite", { model: "sonnet", ttl: "5m" });
  const largePrefixRead = priceTokens(420_000, "cacheRead", { model: "sonnet", ttl: "1h" });
  const largePrefixRebuild = priceTokens(420_000, "cacheWrite", { model: "sonnet", ttl: "1h" });
  const money = (value: number) => value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  const exactMoney = (value: number) => `$${value.toFixed(3)}`;
  const routeCost = (task: string, model: Model, effort: Effort) => {
    const route = MACRO_ROUTES.find((candidate) => candidate.task === task);
    if (!route) throw new Error(`Unknown macro route: ${task}`);
    return priceTaskChoice(route, model, effort);
  };
  const contextExample = priceContextComparison("sonnet");
  const compactionHistory = COMPACTION.thresholdTok + COMPACTION.workingSetTok;
  const compactedAway = compactionHistory - COMPACTION.workingSetTok;
  const compactionUsd = priceCompaction(compactionHistory, COMPACTION.summaryTok);
  const compactWarmSaving = priceTokens(compactedAway, "cacheRead", { model: "sonnet", ttl: "1h" });
  const compactionBreakEvenTurns = Math.ceil(compactionUsd / compactWarmSaving);
  const lazyColdSaving = priceTokens(TOTAL_TOOL_CONTEXT_TOKENS, "cacheWrite", { model: "sonnet", ttl: "1h" });
  const lazyWarmSaving = priceTokens(TOTAL_TOOL_CONTEXT_TOKENS, "cacheRead", { model: "sonnet", ttl: "1h" });

  const ttlSession: ScriptedMessage[] = [
    { id: "ttl-brief", role: "user", text: "Trace the intermittent checkout timeout and propose the smallest safe fix.", atMin: 0 },
    { id: "ttl-scan", role: "assistant", text: "I mapped the request path. The retry wrapper and idempotency key disagree on timeout ownership.", atMin: 2 },
    { id: "ttl-logs", role: "user", text: "Compare that with this morning's production logs before editing.", atMin: 5 },
    { id: "ttl-hypothesis", role: "assistant", text: "The logs confirm duplicate retries after the gateway deadline. I have a focused patch plan.", atMin: 12 },
    { id: "ttl-edit", role: "user", text: "Implement it, preserving the existing payment-provider fallback.", atMin: 14 },
    { id: "ttl-edited", role: "assistant", text: "Patched timeout propagation and added a regression case for the late gateway response.", atMin: 19 },
    { id: "ttl-suite", role: "user", text: "Run checkout tests plus the provider contract suite.", atMin: 22 },
    { id: "ttl-failure", role: "assistant", text: "The contract suite exposed one stale mock; the production path is clean. Updating the fixture now.", atMin: 36 },
    { id: "ttl-rerun", role: "user", text: "Update only that fixture and rerun the failed shard.", atMin: 39 },
    { id: "ttl-review", role: "assistant", text: "Shard is green. I also checked the diff for retry-count or API-shape changes.", atMin: 48 },
    { id: "ttl-summary", role: "user", text: "Give me the risk summary and rollout checks for the PR.", atMin: 52 },
    { id: "ttl-done", role: "assistant", text: "Ready: bounded timeout fix, regression coverage, and three dashboard checks for rollout.", atMin: 58 },
  ];

  const keepWarmSession: ScriptedMessage[] = [
    { id: "kw-alert", role: "user", text: "Triage the elevated 502s after the catalog deploy.", atMin: 0 },
    { id: "kw-trace", role: "assistant", text: "The errors start at the search adapter, not the API edge. I'm checking the deploy diff.", atMin: 1 },
    { id: "kw-diff", role: "user", text: "Correlate it with the new connection-pool setting.", atMin: 3 },
    { id: "kw-plan", role: "assistant", text: "That setting is the likely trigger. A canary rollback is running; we need its metrics.", atMin: 5 },
    { id: "kw-metrics", role: "user", text: "Canary metrics are in: error rate recovered and latency is flat.", atMin: 20 },
    { id: "kw-verify", role: "assistant", text: "Confirmed across all three regions. The pool was exhausting under burst traffic.", atMin: 22 },
    { id: "kw-test", role: "user", text: "Add a configuration regression test before the full rollback.", atMin: 24 },
    { id: "kw-patch", role: "assistant", text: "Test added and failing on the deployed value; the safe default passes.", atMin: 27 },
    { id: "kw-close", role: "user", text: "Finish the rollback and draft the incident handoff.", atMin: 29 },
    { id: "kw-done", role: "assistant", text: "Rollback is complete. Handoff includes impact, cause, validation, and the follow-up owner.", atMin: 32 },
  ];

  const sharedHelperSession: ScriptedMessage[] = [
    { id: "helper-api", role: "user", text: "Subagent API: inspect the pagination diff for contract regressions.", atMin: 0, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-api-result", role: "assistant", text: "API review: cursor encoding is stable; the empty-page response needs one assertion.", atMin: 1, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-db", role: "user", text: "Subagent DB: inspect query plans and migration compatibility.", atMin: 2, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-db-result", role: "assistant", text: "DB review: the composite index is used, but the down migration drops it in the wrong order.", atMin: 3, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-ui", role: "user", text: "Subagent UI: trace loading, empty, and retry states.", atMin: 4, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-ui-result", role: "assistant", text: "UI review: loading and retry are covered; keyboard focus is lost after appending a page.", atMin: 5, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-tests", role: "user", text: "Subagent tests: find missing boundary cases without duplicating existing coverage.", atMin: 6, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-tests-result", role: "assistant", text: "Test review: add empty cursor, deleted-row, and final-page cases; the rest is redundant.", atMin: 7, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-security", role: "user", text: "Subagent security: check cursor tampering and tenant isolation.", atMin: 8, subagent: true, prefixKey: "pagination-review" },
    { id: "helper-security-result", role: "assistant", text: "Security review: tenant scope is preserved; malformed signed cursors correctly fail closed.", atMin: 9, subagent: true, prefixKey: "pagination-review" },
  ];
  const uniqueHelperSession = sharedHelperSession.map((message, index) => ({
    ...message, prefixKey: `pagination-review-${index}`,
  }));

  const largeContextSession: ScriptedMessage[] = [
    { id: "ctx-map", role: "user", text: "Map the billing state machine and plan the invoice-ledger migration.", atMin: 0 },
    { id: "ctx-plan", role: "assistant", text: "I traced six packages and two workers. The safe seam is the posting interface.", atMin: 3 },
    { id: "ctx-contract", role: "user", text: "Define that interface without changing external invoice behavior.", atMin: 6 },
    { id: "ctx-contract-done", role: "assistant", text: "Interface and compatibility adapter are in; typecheck catches direct legacy writes.", atMin: 10 },
    { id: "ctx-core", role: "user", text: "Migrate the core posting path and its unit tests.", atMin: 14 },
    { id: "ctx-core-done", role: "assistant", text: "Core path is migrated. Existing rounding and reversal fixtures remain green.", atMin: 19 },
    { id: "ctx-workers", role: "user", text: "Move the retry and reconciliation workers onto the adapter.", atMin: 23 },
    { id: "ctx-workers-done", role: "assistant", text: "Both workers now use idempotent postings; I found one retry test with a stale clock.", atMin: 28 },
    { id: "ctx-integration", role: "user", text: "Fix the test, then run the cross-package integration suite.", atMin: 32 },
    { id: "ctx-suite", role: "assistant", text: "Integration suite passes. No schema, event, or public API snapshots changed.", atMin: 39 },
    { id: "ctx-review", role: "user", text: "Review the full diff for migration ordering and rollback risk.", atMin: 43 },
    { id: "ctx-done", role: "assistant", text: "Review complete: migration is additive, rollback keeps the adapter, and the PR is ready.", atMin: 48 },
  ];
  const rebuiltLargeContextSession = largeContextSession.map((message, index) => ({
    ...message, prefixKey: `billing-turn-${index}`,
  }));

  const approvalSession: ScriptedMessage[] = [
    { id: "approve-brief", role: "user", text: "Fix the flaky notification test and verify the change locally.", atMin: 0 },
    { id: "approve-read", role: "assistant", text: "Reading the test, implementation, and recent failure logs.", atMin: 1 },
    { id: "approve-scope", role: "user", text: "Keep the fix scoped; don't change the production retry policy.", atMin: 2 },
    { id: "approve-search", role: "assistant", text: "Searching call sites confirms only the test clock races the queued callback.", atMin: 3 },
    { id: "approve-edit", role: "user", text: "Make the deterministic clock change in the test utility.", atMin: 4 },
    { id: "approve-edited", role: "assistant", text: "Test utility updated. The focused test now waits on the queued callback explicitly.", atMin: 5 },
    { id: "approve-focused", role: "user", text: "Run the focused test repeatedly to check the flake.", atMin: 6 },
    { id: "approve-focused-done", role: "assistant", text: "Fifty focused runs passed with no timing variance.", atMin: 7 },
    { id: "approve-suite", role: "user", text: "Run the notification package suite and typecheck.", atMin: 8 },
    { id: "approve-suite-done", role: "assistant", text: "Package suite and typecheck are green. Reviewing the final diff now.", atMin: 9 },
    { id: "approve-status", role: "user", text: "Summarize the root cause and exactly what changed.", atMin: 10 },
    { id: "approve-done", role: "assistant", text: "The test raced a queued callback; it now advances the fake clock and awaits that callback. Production is untouched.", atMin: 11 },
  ];
  const automaticApprovalSession = approvalSession.map((message, index) => ({
    ...message, atMin: [0, 1, 2, 3, 4, 5, 7, 9, 10, 12, 13, 15][index],
  }));
  const manualApprovalSession = approvalSession.map((message, index) => ({
    ...message, atMin: [0, 7, 9, 16, 18, 25, 27, 34, 36, 44, 46, 53][index],
  }));

  type MicroSection = {
    id: string;
    eyebrow: string;
    title: string;
    copy: string;
    deep: readonly string[];
    script: ScriptedMessage[];
    offScript?: ScriptedMessage[];
    onScript?: ScriptedMessage[];
    offLabel: string;
    onLabel: string;
    off: MessageLedgerOptions;
    on: MessageLedgerOptions;
    startOn?: boolean;
  };

  const microSections: MicroSection[] = [
    {
      id: "ttl", eyebrow: "1 · CACHE TTL", title: "Five minutes or one hour?",
      copy: "A longer cache costs more to write, but survives the coffee-sized gaps that force a rebuild.",
      deep: [
        `The TTL controls how long the provider can reuse an exact prompt prefix. The first request is a cache write: ${RATE.w5m}× the model's input rate for five minutes or ${RATE.w1h}× for one hour. A hit during that window is only ${RATE.read}×. That makes a one-hour cold rebuild ${RATE.w1h / RATE.read}× the price of reading the same warm tokens.`,
        `Here is the useful gut check: a one-million-token Haiku prefix is ${money(ahaCold)} on its first five-minute write, ${money(ahaWarm)} while warm, and ${money(ahaCold)} again after it expires. Choose one hour when the likely reuse crosses a coffee break; choose five minutes for tight bursts where the cheaper initial write is likely to stay warm.`,
      ],
      script: ttlSession, offLabel: "5-minute TTL", onLabel: "1-hour TTL",
      off: { ttl: "5m", model: "sonnet", prefixTok: 92_000, workInTok: 720, outputTok: 820 },
      on: { ttl: "1h", model: "sonnet", prefixTok: 92_000, workInTok: 720, outputTok: 820 },
    },
    {
      id: "keep-warm", eyebrow: "2 · KEEP-WARM", title: "Pay a little before expiry.",
      copy: "A timed read can preserve a valuable prefix across a known medium pause.",
      deep: [
        `Keep-warm sends a small request before expiry so the cached prefix is read and its lifetime is refreshed. The request is not free: this simulator bills the full cached prefix at the ${RATE.read}× cache-read rate. For the 68,000-token Sonnet prefix below, each warm read is ${money(keepWarmPrefixRead)}; rebuilding it with a five-minute write is ${money(keepWarmPrefixRebuild)}.`,
        `The decision is a break-even question, not a ritual. Add up the pings needed to bridge the pause and compare them with the rebuild they avoid. Use keep-warm for a known medium wait, then stop it when the session is truly idle; endless reads can eventually cost more than letting the prefix go cold once.`,
      ],
      script: keepWarmSession,
      offLabel: "No pings", onLabel: "Keep-warm",
      off: { ttl: "5m", model: "sonnet", prefixTok: 68_000, workInTok: 520, outputTok: 680 },
      on: { ttl: "5m", model: "sonnet", prefixTok: 68_000, workInTok: 520, outputTok: 680, keepWarm: true },
    },
    {
      id: "same-prompt", eyebrow: "3 · SAME PROMPT", title: "Give subagents one shared prefix.",
      copy: "Subagents must share the same boilerplate prefix—system prompt, tools, skills, and project context—so it stays cached and is read cheaply instead of rebuilt.",
      deep: [
        `Prompt caches match a prefix, not the intent behind it. The first subagent below writes the shared instructions at ${RATE.w1h}×; each later subagent with the same prefix reads those tokens at ${RATE.read}×. A different leading message invalidates the cache from the first byte of divergence, and the miss cascades: the skills block, tools block, and everything downstream must be written again at full price.`,
        `That is a ${RATE.w1h / RATE.read}× cold-versus-warm gap before fresh task input and output are added. Keep the prefix byte-identical through the last shared breakpoint. Put the specific task last, after shared skills and tools, so a different tail never poisons the reusable head.`,
      ],
      script: sharedHelperSession, offScript: uniqueHelperSession, onScript: sharedHelperSession,
      offLabel: "Unique prompts", onLabel: "Same prompt",
      off: { ttl: "1h", model: "sonnet", prefixTok: 44_000, workInTok: 380, outputTok: 520 },
      on: { ttl: "1h", model: "sonnet", prefixTok: 44_000, workInTok: 380, outputTok: 520 }, startOn: true,
    },
    {
      id: "large-context", eyebrow: "4 · LARGE CONTEXT", title: "Reuse the big prefix—or pay again.",
      copy: "A large context magnifies both the first cold write and every saving after it.",
      deep: [
        `Context is input on every request; caching only changes which input bucket receives it. Sonnet's base input price is ${money(MODEL_IN.sonnet)} per million tokens, so the 420,000-token prefix below costs ${money(largePrefixRebuild)} as a one-hour cold write and ${money(largePrefixRead)} as a warm read. A larger prefix makes both numbers larger in direct proportion.`,
        `Put stable system instructions, tool definitions, and repository context first, then append the changing task. That layout preserves a reusable prefix across turns. Cache eligibility thresholds are provider and model rules; because this pricing source declares no numeric minimum, the article does not fabricate one.`,
      ],
      script: largeContextSession, offScript: rebuiltLargeContextSession, onScript: largeContextSession,
      offLabel: "Rebuild each turn", onLabel: "Reuse prefix",
      off: { ttl: "1h", model: "sonnet", prefixTok: 420_000, workInTok: 1_100, outputTok: 1_450 },
      on: { ttl: "1h", model: "sonnet", prefixTok: 420_000, workInTok: 1_100, outputTok: 1_450 }, startOn: true,
    },
    {
      id: "auto-approve", eyebrow: "5 · AUTO-APPROVE", title: "Fewer round-trips, fewer expiry chances.",
      copy: "Pre-approving safe, routine commands keeps related work inside the cache window.",
      deep: [
        `Auto-approve has no special discount. It changes the timeline: fewer approval turns and shorter pauses make the next real request more likely to arrive before the TTL. The ledger treats a gap shorter than the TTL as warm; a request at or beyond expiry writes the prefix again at ${RATE.w5m}× or ${RATE.w1h}× instead of reading it at ${RATE.read}×.`,
        `Approve only commands the workflow already trusts, such as a focused test or a read-only inspection. Keep destructive or surprising operations gated. The saving comes from removing safe, repetitive friction—not from weakening the boundary around risky actions.`,
      ],
      script: automaticApprovalSession, offScript: manualApprovalSession, onScript: automaticApprovalSession,
      offLabel: "Manual", onLabel: "Auto-approve",
      off: { ttl: "5m", model: "sonnet", prefixTok: 36_000, workInTok: 320, outputTok: 480 },
      on: { ttl: "5m", model: "sonnet", prefixTok: 36_000, workInTok: 320, outputTok: 480 }, startOn: true,
    },
  ];

  const macroSections = [
    {
      id: "route", eyebrow: "1 · MODEL + EFFORT", title: "Match the brain to the job.",
      copy: "Route by the cost of being wrong: buy judgment where a mistake fans out, and buy throughput where the answer is easy to verify.",
      deep: [
        `Model choice changes the base price of every token: Haiku is ${money(MODEL_IN.haiku)}, Sonnet ${money(MODEL_IN.sonnet)}, Opus ${money(MODEL_IN.opus)}, and Fable ${money(MODEL_IN.fable)} per million input tokens before bucket multipliers. Effort changes the teaching workload's reasoning input and output, and output is billed at ${RATE.out}×, so premium model plus high effort compounds both axes.`,
        `For the plan, Sonnet-high costs ${money(routeCost("Plan", "sonnet", "high"))}: architecture and sequencing justify judgment, while Haiku-high at ${money(routeCost("Plan", "haiku", "high"))} is a false economy if a weak dependency map spawns seven bad implementation tasks, and Fable-high at ${money(routeCost("Plan", "fable", "high"))} is usually unused headroom. A local, reversible hotfix is the opposite: Haiku-low is ${money(routeCost("Hotfix", "haiku", "low"))}, while Opus-high is ${money(routeCost("Hotfix", "opus", "high"))}; escalate only when the blast radius stops being local.`,
        `Debugging needs a wide hypothesis search, so the worked route spends ${money(routeCost("Debug", "opus", "high"))} on Opus-high instead of ${money(routeCost("Debug", "sonnet", "high"))} on a cheaper but underpowered pass whose missed hypothesis buys another edit-and-test loop. RCA also lands on Opus-high at ${money(routeCost("RCA", "opus", "high"))}, because reproducing the failure and separating cause from symptom demands a defensible chain, not a plausible narrative. Code review is bounded but cross-file: Sonnet-medium costs ${money(routeCost("Code review", "sonnet", "medium"))}, enough to trace contracts without pricing every diff as research.`,
        `Tests and docs are cheaper because their answers are externally checkable. Haiku-medium prices the testing job at ${money(routeCost("Tests", "haiku", "medium"))}; the spec supplies the judgment and the runner supplies the verdict. Haiku-low prices docs at ${money(routeCost("Docs", "haiku", "low"))}, while Fable-low costs ${money(routeCost("Docs", "fable", "low"))} and cannot recover facts absent from the brief. “Bad” in the picker therefore means likely to create rework, “expensive” means capacity the task cannot use, and “good” means the least costly route whose failure mode you can tolerate.`,
      ],
    },
    {
      id: "main-context", eyebrow: "2 · MAIN AGENT", title: "The default agent carries the whole backpack.",
      copy: "A 1M-context main agent is powerful—and expensive when every request drags that prefix through the meter.",
      deep: [
        `The main agent's million-token context may contain useful history, but the meter sees input carried into this request—not how much of it the task actually needs. On Sonnet, a one-hour cold write of 1,000,000 tokens plus the review output is ${money(contextExample.mainCold)}; the next warm message is still ${money(contextExample.mainWarm)} because the whole prefix is read at ${RATE.read}× and output remains ${RATE.out}×. The scoped 14,000-token version with identical output is ${money(contextExample.scopedCold)} cold and ${money(contextExample.scopedWarm)} warm.`,
        `The backpack is worth carrying when the next request genuinely depends on decisions, failed attempts, and repository relationships already accumulated in it. Architecture synthesis, an incident command thread, and a cross-cutting refactor often do. A bounded review, test run, or documentation pass usually does not; give that work the relevant files and a short brief, then return a compact result. Context is not a trophy for session longevity—it is recurring input rent.`,
      ],
    },
    {
      id: "delegate", eyebrow: "3 · DELEGATE", title: "Give subagents smaller backpacks.",
      copy: "A scoped subagent sees only the brief and files it needs.",
      deep: [
        `Delegation creates a new context boundary. A 260,000-token Sonnet subagent prefix costs 260,000 × ${RATE.w1h} × $${MODEL_IN.sonnet}/M = ${money(sonnetPrefixRebuild)} for its first one-hour write, then 260,000 × ${RATE.read} × $${MODEL_IN.sonnet}/M = ${exactMoney(sonnetPrefixRead)} per warm read—a ${RATE.w1h / RATE.read}× swing on the prefix. The alternative is not free: a long main session repeatedly reads its larger accumulated history even when the next job needs one directory.`,
        `Delegate work that can be specified narrowly, checked independently, and returned compactly: searches, bounded reviews, focused tests, and factual docs. Do not delegate a two-minute edit whose brief and result need more tokens than the work, a decision that depends on tacit conversation history, or parallel tasks that will collide in the same files. Keep cross-cutting decisions and final synthesis in the main agent. When several subagents share a stable instruction prefix, preserve it exactly and append the task-specific target afterward so later subagents can read rather than rewrite it.`,
      ],
    },
    {
      id: "compact", eyebrow: "4 · AUTO-COMPACT", title: "Compress history before it owns you.",
      copy: "Compaction trades some detail for a smaller reusable prefix.",
      deep: [
        `Auto-compact replaces older conversation detail with a shorter working set. The engine compacts after ${COMPACTION.thresholdTok.toLocaleString()} history tokens and retains ${COMPACTION.workingSetTok.toLocaleString()}; at ${compactionHistory.toLocaleString()} tokens it reads the history and emits a ${COMPACTION.summaryTok.toLocaleString()}-token Haiku summary for ${money(compactionUsd)}. Removing ${compactedAway.toLocaleString()} repeated tokens then saves ${money(compactWarmSaving)} on each warm Sonnet message, before any cold-write saving, so this worked case breaks even after ${compactionBreakEvenTurns} subsequent warm turns. Compaction is a purchase: pay once for the summary, then earn it back only if the smaller history will be reused.`,
        `Compact when a coherent summary can replace old exploration and the session still has meaningful work ahead. Do not compact just before stopping, and preserve exact logs, quotations, or code outside the chat when later reasoning needs them verbatim. The useful summary records decisions, rejected hypotheses, invariants, and open questions; a vague recap saves tokens by discarding the very state the agent needed.`,
      ],
    },
    {
      id: "lazy", eyebrow: "5 · LAZY-LOAD", title: "Load skills and MCPs when called.",
      copy: "Unused tool descriptions are still context.",
      deep: [
        `Skill instructions and MCP schemas are input tokens even when the task never calls them. The engine's eager tool bundle is ${TOTAL_TOOL_CONTEXT_TOKENS.toLocaleString()} tokens; omitting it from a non-tool Sonnet turn saves ${money(lazyColdSaving)} on a one-hour cold write or ${money(lazyWarmSaving)} on a warm read. One turn is small, but an all-day session pays the warm amount repeatedly, and a changed prefix can pay the cold amount again.`,
        `Lazy-load when most turns do not need the capability and discovery is cheap. Eager loading is rational when nearly every next turn will call the same tools or when the schema itself is essential planning context; repeatedly discovering and rewriting an immediately needed capability wins nothing. Once loaded, keep the definition stable at the reusable front and put changing arguments later. As with compaction, this is a reuse calculation, not a cleanliness ritual.`,
      ],
    },
  ];

  function show(kind: "micro" | "macro") {
    article = kind;
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(id: string) {
    expanded[id] = !expanded[id];
  }

  function toggleTldr() {
    tldr = !tldr;
    expanded = Object.fromEntries([
      ...["spend", "lifecycle", "output"].map((id) => [`micro-${id}`, !tldr]),
      ...microSections.map((section) => [`micro-${section.id}`, !tldr]),
      ...["spend", "rate-card"].map((id) => [`macro-${id}`, !tldr]),
      ...macroSections.map((section) => [`macro-${section.id}`, !tldr]),
    ]);
  }

  function articleRecipe(id: string) {
    return recipeById[(id === "main-context" ? "delegate" : id) as RecipeId];
  }
</script>

<svelte:head><title>Claude Code — Explained</title></svelte:head>

<main class="article">
  <nav><button onclick={onback}>← Back to map</button><span>CLAUDE CODE — EXPLAINED</span></nav>

  <header>
    <button
      class:on={tldr}
      class="reading-mode"
      role="switch"
      aria-checked={tldr}
      aria-label="TL;DR"
      onclick={toggleTldr}
    ><span>TL;DR</span><i></i></button>
    <span class="doodle" aria-hidden="true">$</span>
    <p>AN INTERACTIVE FIELD GUIDE</p>
    <h1>Claude Code<br/><em>— Explained</em></h1>
    <div>First inspect one message. Then zoom out and route the whole workday.</div>
    <div class="article-switch" aria-label="Choose article">
      <button class:active={article === "micro"} aria-pressed={article === "micro"} onclick={() => show("micro")}>Micro</button>
      <button class:active={article === "macro"} aria-pressed={article === "macro"} onclick={() => show("macro")}>Macro</button>
    </div>
  </header>

  {#if article === "micro"}
    <div class="article-intro">
      <small>MICRO · MESSAGE BY MESSAGE</small>
      <h2 class="micro-hook">The surprisingly expensive pause.</h2>
      <h2>Which caching configs spend the fewest tokens?</h2>
      <p>Flip each lever, then click a message to see exactly why it cost what it did.</p>
      <RawDataModal title="A real Claude Code session — timestamped tape" provenance={REAL_SEGMENT_PROVENANCE} rows={REAL_SEGMENT_ROWS} prominent />
    </div>

    <section class="lesson">
      <div class="section-copy">
        <small>0 · SPEND ANATOMY</small>
        <h2>The repeated prefix becomes the workload.</h2>
        <p class="section-prose">Token Optimizer reports that cache-reads make up 80%+ of real Claude Code token volume, with an average cache-hit rate around 74%. The source supplies that framing; the interactive dollars below are our engine’s deterministic model.{#if expanded["micro-spend"]}<span data-testid="deep-dive"> The first message writes its reusable prefix. Every later message reads the growing prefix at {RATE.read}× while still paying separately for fresh input and uncached output. Move the session-length control to watch repeated context overtake the one-time write.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["micro-spend"])} onclick={() => toggle("micro-spend")}><b>&gt;</b> {expanded["micro-spend"] ? "Close detail" : "Deep dive"}</button>
      </div>
      <SpendBreakdownWidget unit="message" />
      <div class="section-setup"><CopyButton recipe={recipeById["large-context"]} compact /></div>
    </section>

    <section class="lesson">
      <div class="section-copy">
        <small>0.1 · CACHE LIFECYCLE</small>
        <h2>Refresh the cheap read—or buy the write again.</h2>
        <p class="section-prose">A warm prefix is read at {RATE.read}×. Once its selected TTL lapses, the same prefix must be written again at {RATE.w5m}× or {RATE.w1h}×.{#if expanded["micro-lifecycle"]}<span data-testid="deep-dive"> The head-to-head holds prefix size, model, and TTL constant, then prices the next touch through the same engine. Keep-warm is useful only when the pings needed to bridge a known pause cost less than the rewrite they avoid.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["micro-lifecycle"])} onclick={() => toggle("micro-lifecycle")}><b>&gt;</b> {expanded["micro-lifecycle"] ? "Close detail" : "Deep dive"}</button>
      </div>
      <CacheLifecycleWidget />
      <div class="section-setup"><CopyButton recipe={recipeById["keep-warm"]} compact /></div>
    </section>

    <section class="lesson">
      <div class="section-copy">
        <small>0.2 · OUTPUT</small>
        <h2>Generation has no warm-cache discount.</h2>
        <p class="section-prose">Output is billed at {RATE.out}× the model’s input rate every time it is generated. Ask for a lean answer and the unchanged prefix still gets its read discount; only the output bucket shrinks.{#if expanded["micro-output"]}<span data-testid="deep-dive"> The toggle holds warm prefix and fresh input identical. Switching model reprices every bucket through MODEL_IN, while the verbose-to-lean saving comes entirely from fewer output tokens.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["micro-output"])} onclick={() => toggle("micro-output")}><b>&gt;</b> {expanded["micro-output"] ? "Close detail" : "Deep dive"}</button>
      </div>
      <OutputCostWidget />
      <div class="section-setup"><CopyButton recipe={recipeById.route} compact /></div>
    </section>

    {#each microSections as section}
      <section class="lesson">
        <div class="section-copy">
          <small>{section.eyebrow}</small>
          <h2>{section.title}</h2>
          <p class="section-prose">{section.copy}{#if expanded[`micro-${section.id}`]}<span data-testid="deep-dive"> {section.deep.join(" ")}</span>{/if}</p>
          <button class="expand" aria-expanded={Boolean(expanded[`micro-${section.id}`])} onclick={() => toggle(`micro-${section.id}`)}>
            <b>&gt;</b> {expanded[`micro-${section.id}`] ? "Close detail" : "Deep dive"}
          </button>
        </div>
        <LeverWidget
          script={section.script} offScript={section.offScript} onScript={section.onScript}
          offLabel={section.offLabel} onLabel={section.onLabel}
          off={section.off} on={section.on} startOn={section.startOn}
        />
        <div class="section-setup"><CopyButton recipe={articleRecipe(section.id)} compact /></div>
      </section>
    {/each}

    <button class="crosslink" onclick={() => show("macro")}>Zoom out to the whole workday →</button>
    <section class="cta">
      <div><small>TRY THE FULL LEDGER</small><h2>Now turn all the knobs.</h2><p>Mix context, TTL, approvals, subagents, models, and keep-warm in the full Sandbox.</p></div>
      <button onclick={onsandbox}>Open the Sandbox <span>→</span></button>
    </section>
  {:else}
    <div class="article-intro">
      <small>MACRO · THE WHOLE WORKLOAD</small>
      <h2>Stop making one giant agent do everything.</h2>
      <p>A 1M-context Opus-high main agent is the expensive default. The craft is routing each job by the cost of being wrong: keep expensive judgment where errors fan out, and shrink the model, effort, and backpack everywhere else.</p>
      <div class="intro-links">
        <button onclick={() => show("micro")}>See the per-message mechanics →</button>
        <button onclick={ontd}>Practice the routes in Tokenloons TD →</button>
      </div>
    </div>

    <section class="lesson macro-lesson">
      <div class="section-copy">
        <small>0 · TASK SPEND ANATOMY</small>
        <h2>The same meter, now at task granularity.</h2>
        <p class="section-prose">Plan, Hotfix, Debug, RCA, Code review, Tests, and Docs use the same task vocabulary as the route table and Tokenloons TD balloons. Token Optimizer’s 80%+ cache-read volume and ~74% hit-rate findings are sourced context; these task dollars are engine-modeled.{#if expanded["macro-spend"]}<span data-testid="deep-dive"> Increase tasks per day to cycle the seven routes. The shared working prefix is written on first touch, then re-read as the task history grows; fresh task input and generated output remain separate billed classes.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["macro-spend"])} onclick={() => toggle("macro-spend")}><b>&gt;</b> {expanded["macro-spend"] ? "Close detail" : "Deep dive"}</button>
      </div>
      <SpendBreakdownWidget unit="task" />
      <div class="section-setup"><CopyButton recipe={recipeById.route} compact /></div>
    </section>

    <MacroRouteWidget />
    <div class="macro-widget"><MacroTaskPicker /></div>

    <section class="lesson macro-lesson">
      <div class="section-copy">
        <small>0.1 · RATE CARDS</small>
        <h2>Inspect one balloon before dispatch.</h2>
        <p class="section-prose">Pick one of the seven tasks and hold its workload constant across every model rate card. The recommended fit buys enough judgment without paying for capacity the task cannot use.{#if expanded["macro-rate-card"]}<span data-testid="deep-dive"> Haiku is always the cheapest arithmetic rate and Fable the highest, but price alone is not routing. The verdict compares each card with the route’s required model and effort; the footer reconciles to the existing all-Opus and right-sized seven-task totals.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["macro-rate-card"])} onclick={() => toggle("macro-rate-card")}><b>&gt;</b> {expanded["macro-rate-card"] ? "Close detail" : "Deep dive"}</button>
      </div>
      <RouteRateCardWidget />
      <div class="section-setup"><CopyButton recipe={recipeById.route} compact /></div>
    </section>

    {#each macroSections as section}
      <section class="lesson macro-lesson">
        <div class="section-copy">
          <small>{section.eyebrow}</small>
          <h2>{section.title}</h2>
          <p class="section-prose">{section.copy}{#if expanded[`macro-${section.id}`]}<span data-testid="deep-dive"> {section.deep.join(" ")}</span>{/if}</p>
          <button class="expand" aria-expanded={Boolean(expanded[`macro-${section.id}`])} onclick={() => toggle(`macro-${section.id}`)}>
            <b>&gt;</b> {expanded[`macro-${section.id}`] ? "Close detail" : "Deep dive"}
          </button>
        </div>
        {#if section.id === "main-context"}<ContextCostWidget />{/if}
        {#if section.id === "delegate"}<WorkdaySessionWidget />{/if}
        <div class="section-setup"><CopyButton recipe={articleRecipe(section.id)} compact /></div>
      </section>
    {/each}

    <button class="crosslink" onclick={() => show("micro")}>Why did THAT message spike? Zoom in →</button>
    <section class="cta macro-cta">
      <div><small>ROUTE IT FOR REAL</small><h2>Ready for the balloons?</h2><p>Practice dispatching tasks by model and effort in Tokenloons TD.</p></div>
      <button onclick={ontd}>Open Tokenloons TD on the map <span>→</span></button>
    </section>
  {/if}

  <section class="article-diagnose">
    <small>YOUR TURN</small>
    <h2>How good is YOUR setup?</h2>
    <div class="section-copy">
      <p class="section-prose">Stop guessing. Run this against your own Claude Code logs and it opens a report of your real cache-hit rate and spend — nothing leaves your machine.</p>
      <CopyButton
        id="cache-report-npx"
        title="cache report command"
        snippet="npx github:eligrumman/claude-code-cache-sim cc-cache-report"
        caveat="Reads the last 30 days from ~/.claude/projects and opens one local HTML report."
      />
      <CopyButton
        id="cache-report-local"
        title="local cache report command"
        snippet="npm run report"
        caveat="Already cloned the repo? Run this from the project directory."
        compact
      />
    </div>

    <article class="toycard">
      <div class="toycard__head toycard__head--green">
        <div>
          <span class="toy-eyebrow">Example — yours will use your real numbers</span>
          <span class="toy-title">Your cache report</span>
        </div>
        <strong class="toy-num">84%</strong>
      </div>
      <div class="toycard__note">
        <div class="toy-bar" style="height: 28px;">
          <span class="toy-bar__seg input" style="width: 8%"></span>
          <span class="toy-bar__seg read" style="width: 58%"></span>
          <span class="toy-bar__seg write" style="width: 14%"></span>
          <span class="toy-bar__seg output" style="width: 20%"></span>
        </div>
        <div class="toy-legend">
          <span><i class="toy-swatch input"></i> Input</span>
          <span><i class="toy-swatch read"></i> Cache read</span>
          <span><i class="toy-swatch write"></i> Cache write</span>
          <span><i class="toy-swatch output"></i> Output</span>
        </div>
      </div>
      <div class="toycard__foot">
        <div><span>Example insight</span><b>Most prefix tokens were served from cache.</b></div>
        <strong class="toy-delta">Caching is working</strong>
      </div>
    </article>
  </section>
</main>

<style>
  .article{width:min(940px,calc(100% - 28px));margin:0 auto;padding-bottom:80px;color:var(--toy-ink);background:var(--toy-paper);box-shadow:0 0 0 100vmax var(--toy-paper);clip-path:inset(0 -100vmax);font-family:var(--font-body)}
  h1,h2,.article>header>p,.section-copy>small,.article-intro>small,.cta small{font-family:var(--font-display)}
  button{font:inherit;color:inherit}nav{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:2px solid #20201d;font-size:.72rem;font-weight:900;letter-spacing:.12em}nav button{border:0;background:none;cursor:pointer;letter-spacing:0}
  header{min-height:510px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative}header>p,.section-copy>small,.article-intro>small,.cta small{font-weight:950;letter-spacing:.13em;font-size:.72rem}h1{font-size:clamp(3rem,9vw,6.3rem);line-height:.86;letter-spacing:-.065em;margin:16px 0 26px}h1 em{font-style:normal;text-decoration:underline wavy #f2c94c 5px;text-underline-offset:8px}header>div:not(.article-switch){max-width:560px;font-size:1.12rem;line-height:1.5}.doodle{position:absolute;right:10%;top:15%;width:55px;height:55px;border:3px solid #20201d;border-radius:50% 45% 52% 46%;display:grid;place-items:center;font:900 2rem serif;transform:rotate(12deg);background:#9ce5bd;box-shadow:5px 5px 0 #20201d}
  .article-switch{display:grid;grid-template-columns:1fr 1fr;margin-top:32px;border:2px solid #20201d;border-radius:999px;background:#f1efe9;padding:4px;box-shadow:4px 4px 0 #20201d}.article-switch button{min-width:110px;border:0;border-radius:999px;background:transparent;padding:10px 20px;font-weight:950;cursor:pointer}.article-switch button.active{background:#20201d;color:#fff}
  .reading-mode{position:absolute;top:18px;right:0;z-index:5;display:flex;align-items:center;gap:7px;padding:5px 6px 5px 9px;border:2px solid #20201d;border-radius:999px;background:#fff;font-size:.72rem;font-weight:950;letter-spacing:.06em;cursor:pointer;box-shadow:3px 3px 0 #f2c94c}.reading-mode i{display:block;width:25px;height:15px;border:1.5px solid #20201d;border-radius:999px;background:#8ec5ef;position:relative}.reading-mode i::after{content:"";position:absolute;top:2px;left:2px;width:9px;height:9px;border:1px solid #20201d;border-radius:50%;background:#fff;transition:transform .18s}.reading-mode.on i{background:#62d39a}.reading-mode.on i::after{transform:translateX(10px)}
  .article-intro{max-width:720px;margin:35px auto 70px;text-align:center}.article-intro small{color:#a85e13}.article-intro h2{font-size:clamp(2.3rem,6vw,4.6rem);line-height:.95;letter-spacing:-.05em;margin:12px 0 18px}.article-intro p{font-size:1.08rem;line-height:1.5;margin:0 auto;max-width:590px}
  .article-intro .micro-hook{font-size:1rem;letter-spacing:0;margin:12px 0 24px;color:#716c62;font-weight:750}
  .intro-links{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:20px}.intro-links button{border:0;background:none;color:#8c4a0a;font-weight:900;font-size:.82rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  section.lesson{margin:80px 0 125px}.section-copy{max-width:680px;margin:0 0 24px 18px}.section-copy>small{color:#a85e13}.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy>p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:650px}.expand{display:flex;align-items:center;gap:8px;margin-top:14px;padding:5px 0;border:0;border-bottom:2px solid #20201d;background:transparent;font-size:.82rem;font-weight:900;cursor:pointer}.expand b{font:950 1rem/1 ui-monospace,monospace;color:#a85e13;transition:transform .15s}.expand[aria-expanded="true"] b{transform:rotate(90deg)}
  .macro-widget{margin:28px 0 70px}
  .section-setup{max-width:680px;margin:24px 0 0 18px}
  .macro-lesson{margin:65px 0!important;border-bottom:2px dashed #d4d0c6}.macro-lesson .section-copy{margin-bottom:48px}.crosslink{display:block;margin:40px auto 90px;border:0;background:none;color:#8c4a0a;font-weight:950;font-size:1rem;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .cta{margin:70px 0 100px;border:3px solid #20201d;border-radius:25px 19px 28px 18px;padding:34px;display:flex;align-items:center;gap:30px;background:#fff6c7;box-shadow:10px 11px 0 #f2c94c}.cta div{flex:1}.cta>button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta>button:hover{transform:translate(-2px,-2px)}.cta>button span{font-size:1.4rem;margin-left:8px}.macro-cta{background:#eaf5ff;box-shadow:10px 11px 0 #9dccee}
  .article-diagnose{margin:110px 0 40px;padding-top:55px;border-top:3px solid #20201d}.article-diagnose>small{display:block;text-align:center;color:#a85e13;font-weight:950;letter-spacing:.13em;font-size:.72rem}.article-diagnose>h2{text-align:center;font-size:clamp(2rem,5vw,3.6rem);line-height:1;margin:8px 0 24px;letter-spacing:-.045em}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:450px}header>div:not(.article-switch){font-size:.95rem}.doodle{right:2%;top:15%;width:40px;height:40px;font-size:1.4rem}.article-switch button{min-width:90px}.reading-mode{top:12px;right:0}.article-intro{margin:20px auto 55px}section.lesson{margin:60px 0 90px}.section-copy,.section-setup{margin-left:6px}.section-copy>p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta>button{width:100%;margin-top:22px}}
</style>
