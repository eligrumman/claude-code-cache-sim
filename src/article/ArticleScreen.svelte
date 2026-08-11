<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import MacroMonthWidget from "./MacroMonthWidget.svelte";
  import SubagentFleetWidget from "./SubagentFleetWidget.svelte";
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import {
    COMPACTION,
    TOTAL_TOOL_CONTEXT_TOKENS,
    priceCompaction,
    priceTokens,
  } from "../sim/cost.js";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";
  import {
    DEFAULT_MACRO_MONTH,
    MACRO_ROUTES,
    priceContextComparison,
    priceTaskChoice,
    type Effort,
    type MacroMonthConfig,
  } from "./macroPricing.js";
  import type { Model } from "../engine/types.js";
  import CopyButton from "../setup/CopyButton.svelte";
  import { recipeById, type RecipeId } from "../setup/recipes.js";

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
    { id: "helper-hey-1", role: "user", text: "HEY — inspect the pagination diff for contract regressions.", atMin: 0, subagent: true, prefixKey: "hey-review", contextTok: 26_000 },
    { id: "helper-hey-1-result", role: "assistant", text: "Review complete: cursor encoding is stable; the empty-page response needs one assertion.", atMin: 1, subagent: true, prefixKey: "hey-review" },
    { id: "helper-hey-2", role: "user", text: "HEY — inspect the pagination diff for contract regressions.", atMin: 2, subagent: true, prefixKey: "hey-review", contextTok: 26_000 },
    { id: "helper-hey-2-result", role: "assistant", text: "Second review complete: the shared prefix was read from cache; the same boundary case remains.", atMin: 3, subagent: true, prefixKey: "hey-review" },
  ];
  const uniqueHelperSession: ScriptedMessage[] = [
    ...sharedHelperSession.slice(0, 2),
    { id: "helper-hello-2", role: "user", text: "HELLO — inspect the pagination diff for contract regressions.", atMin: 2, subagent: true, prefixKey: "hello-review", contextTok: 15_000 },
    { id: "helper-hello-2-result", role: "assistant", text: "Second review complete: one changed opening word forced the large stable tail to be rewritten.", atMin: 3, subagent: true, prefixKey: "hello-review" },
  ];

  const stableMemorySession: ScriptedMessage[] = [
    { id: "memory-session-1", role: "user", text: "Start from the stable CLAUDE.md and implement the first scoped change.", atMin: 0, prefixKey: "stable-memory", contextTok: 52_000 },
    { id: "memory-session-1-result", role: "assistant", text: "Change complete. I left a short handoff note at the conversation tail.", atMin: 2, prefixKey: "stable-memory" },
    { id: "memory-session-2", role: "user", text: "Continue from the tail handoff; keep CLAUDE.md byte-identical.", atMin: 12, prefixKey: "stable-memory", contextTok: 52_000 },
    { id: "memory-session-2-result", role: "assistant", text: "The cached head was read warm; only this session-specific note is fresh input.", atMin: 14, prefixKey: "stable-memory" },
    { id: "memory-session-3", role: "user", text: "Continue from the latest tail handoff without editing project memory.", atMin: 24, prefixKey: "stable-memory", contextTok: 52_000 },
    { id: "memory-session-3-result", role: "assistant", text: "Third session complete. The stable prefix stayed reusable again.", atMin: 26, prefixKey: "stable-memory" },
  ];
  const editedMemorySession: ScriptedMessage[] = stableMemorySession.map((message, index) => ({
    ...message,
    text: message.role === "user" ? "Edit CLAUDE.md with the last session note, then start today's work." : message.text,
    prefixKey: `edited-memory-${Math.floor(index / 2)}`,
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
      id: "same-prompt", eyebrow: "3 · SAME PROMPT", title: "One word can poison the shared prefix.",
      copy: "An identical opening lets the whole shared prefix read cheaply; change one word near the front and the big stable tools, skills, and MCP block after it is re-written at full price.",
      deep: [
        `In the real HEY-versus-HELLO experiment, two byte-identical subagent prompts made the second request a cheap cache read of the shared ~26K prefix. Changing only HEY to HELLO broke the prefix match at that word: only ~12K stayed reusable and about half the prefix—~15K tokens—had to be re-written, including the ~9–10K tools, skills, and MCP block after the message. A changed byte near the front poisons the otherwise stable tail.`,
        `Keep the opening bytes identical across subagents, then put the variable task last, after shared skills and tools, so a different tail never poisons the reusable head. The sting is largest for heavy skills and MCP users: divergent chats or subagents otherwise pay to rewrite that large stable block every time.`,
      ],
      script: sharedHelperSession, offScript: uniqueHelperSession, onScript: sharedHelperSession,
      offLabel: "Unique prompts", onLabel: "Same prompt",
      off: { ttl: "1h", model: "opus", prefixTok: 26_000, workInTok: 180, outputTok: 260 },
      on: { ttl: "1h", model: "opus", prefixTok: 26_000, workInTok: 180, outputTok: 260 }, startOn: true,
    },
    {
      id: "memory-cost", eyebrow: "4 · MEMORY & CLAUDE.MD", title: "Updating CLAUDE.md isn't free.",
      copy: "CLAUDE.md and memory files live in the stable cached prefix; editing them every session forces the whole prefix to be re-written at write price next run instead of read warm.",
      deep: [
        `Project memory and CLAUDE.md sit near the front of the prompt, inside the cached head. Edit them and, just like the same-prompt case, the cache breaks at the change: every stable token after it—tools, skills, and the rest of the context—is re-written at the write rate instead of read warm for roughly $0.10 on the dollar. A tiny daily “update your memory” ritual quietly re-pays the entire prefix every session.`,
        `If context must carry forward, hand it off in the conversation tail: put a short handoff note or message at the end instead of rewriting the cached head. Keep CLAUDE.md byte-identical across sessions, let volatile session-specific notes live at the back where they cannot poison the reusable prefix, and batch genuine CLAUDE.md changes rather than editing it every run.`,
      ],
      script: stableMemorySession, offScript: editedMemorySession, onScript: stableMemorySession,
      offLabel: "Edit memory each session", onLabel: "Stable memory + tail handoff",
      off: { ttl: "1h", model: "sonnet", prefixTok: 52_000, workInTok: 220, outputTok: 300 },
      on: { ttl: "1h", model: "sonnet", prefixTok: 52_000, workInTok: 220, outputTok: 300 }, startOn: true,
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


  type MacroFocus = "all" | "strategy" | "model" | "effort" | "load";
  const macroFocusSections: { id: string; eyebrow: string; title: string; copy: string; deep: string[]; preset: Partial<MacroMonthConfig>; focus: MacroFocus }[] = [
    { id: "strategy", eyebrow: "1 · ROUTE THE MONTH", title: "Route each task to the brain it needs.", copy: "Compare fit-routing with pinning every task to one expensive default, then watch that choice repeat across 30 days.", deep: ["The month is computed from the same Plan, Hotfix, Debug, RCA, Code review, Tests, and Docs routes. Right-sizing buys judgment where mistakes fan out and throughput where answers are easy to verify."], preset: { strategy: "routed" }, focus: "strategy" },
    { id: "model", eyebrow: "2 · MODEL", title: "Right-size the model.", copy: "A premium model on every task inflates every day, including routine work whose result is easy to check.", deep: ["This view holds uniform routing and high effort steady, isolating the model rate across the deterministic workload."], preset: { strategy: "uniform", model: "opus", effort: "high" }, focus: "model" },
    { id: "effort", eyebrow: "3 · EFFORT", title: "Reasoning effort recurs daily.", copy: "Effort changes the amount of reasoning input and output billed for every task in the month.", deep: ["High effort earns its keep when deeper search prevents rework; it is waste when tests or a narrow specification already supply the verdict."], preset: { strategy: "uniform", model: "sonnet", effort: "high" }, focus: "effort" },
    { id: "load", eyebrow: "4 · VOLUME", title: "Small mismatches multiply.", copy: "Heavier days repeat more tasks, magnifying every per-task routing choice across the month.", deep: ["The workload repeats the engine's documented route cycle rather than multiplying a hardcoded estimate, while weekends retain a muted skeleton workload."], preset: { strategy: "routed" }, focus: "load" },
    { id: "all", eyebrow: "5 · ALL KNOBS", title: "Read the whole month.", copy: "Turn every knob, inspect any day, and reconcile its model and effort mix with the 30-day total.", deep: ["Deterministic incident days create Debug and RCA peaks. Each bar exposes its own breakdown, while the footer reconciles the complete model and effort mix."], preset: DEFAULT_MACRO_MONTH, focus: "all" },
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
      ...microSections.map((section) => [`micro-${section.id}`, !tldr]),
      ...macroFocusSections.map((section) => [`macro-${section.id}`, !tldr]),
      ["macro-subagents", !tldr],
    ]);
  }

  function articleRecipe(id: string) {
    return recipeById[(id === "main-context" ? "delegate" : id) as RecipeId];
  }
</script>

<svelte:head><title>Claude Code Costs - Explained</title></svelte:head>

<main class="article">
  <nav><button onclick={onback}>← Back to map</button><span>CLAUDE CODE COSTS - EXPLAINED</span></nav>

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
    <p class="article-kicker">AN INTERACTIVE FIELD GUIDE</p>
    <h1 aria-label="Claude Code Costs - Explained">Claude Code Costs -<br/><em>Explained</em></h1>
    <div>First inspect one message. Then zoom out and route the whole workday.</div>
    <p class="article-overview">This article breaks down where the money goes when you run Claude Code. In MICRO, we go message by message through a single session and watch the prompt cache make each turn cheaper—or, when it expires, suddenly expensive. In MACRO, we zoom out to a month of work and see how your choice of model and reasoning effort per task adds up over 30 days.</p>
    <div class="article-switch" aria-label="Choose article">
      <button class:active={article === "micro"} aria-pressed={article === "micro"} onclick={() => show("micro")}>Micro</button>
      <button class:active={article === "macro"} aria-pressed={article === "macro"} onclick={() => show("macro")}>Macro</button>
    </div>
  </header>

  {#if article === "micro"}
    <div class="article-intro">
      <small>MICRO · MESSAGE BY MESSAGE</small>
    </div>

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

    {#each macroFocusSections as section}
      <section class="lesson">
        <div class="section-copy">
          <small>{section.eyebrow}</small>
          <h2>{section.title}</h2>
          <p class="section-prose">{section.copy}{#if expanded[`macro-${section.id}`]}<span data-testid="deep-dive"> {section.deep.join(" ")}</span>{/if}</p>
          <button class="expand" aria-expanded={Boolean(expanded[`macro-${section.id}`])} onclick={() => toggle(`macro-${section.id}`)}>
            <b>&gt;</b> {expanded[`macro-${section.id}`] ? "Close detail" : "Deep dive"}
          </button>
        </div>
        <MacroMonthWidget preset={section.preset} focus={section.focus} />
      </section>
    {/each}

    <section class="lesson">
      <div class="section-copy">
        <small>6 · SUBAGENTS</small>
        <h2>Give each subagent the brain it needs.</h2>
        <p class="section-prose">The main agent fans work out to subagents; tune each subagent’s model and effort to the cost of being wrong on its task, and the fleet gets cheaper without losing the judgment that matters.{#if expanded["macro-subagents"]}<span data-testid="deep-dive"> Each route keeps an independent model and effort choice, so cheap, verifiable work does not inherit the same premium settings as architecture, debugging, or root-cause analysis.</span>{/if}</p>
        <button class="expand" aria-expanded={Boolean(expanded["macro-subagents"])} onclick={() => toggle("macro-subagents")}>
          <b>&gt;</b> {expanded["macro-subagents"] ? "Close detail" : "Deep dive"}
        </button>
      </div>
      <SubagentFleetWidget />
    </section>

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
  h1,h2,.article-kicker,.section-copy>small,.article-intro>small,.cta small{font-family:var(--font-display)}
  button{font:inherit;color:inherit}nav{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:2px solid #20201d;font-size:.72rem;font-weight:900;letter-spacing:.12em}nav button{border:0;background:none;cursor:pointer;letter-spacing:0}
  header{min-height:510px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative}.article-kicker,.section-copy>small,.article-intro>small,.cta small{font-weight:950;letter-spacing:.13em;font-size:.72rem}h1{font-size:clamp(3rem,9vw,6.3rem);line-height:.86;letter-spacing:-.065em;margin:16px 0 26px}h1 em{font-style:normal}header>div:not(.article-switch){max-width:560px;font-size:1.12rem;line-height:1.5}.article-overview{max-width:720px;margin:24px auto 0;font-size:1rem;line-height:1.6;color:#4f4b43}.doodle{position:absolute;right:10%;top:15%;width:55px;height:55px;border:3px solid #20201d;border-radius:50% 45% 52% 46%;display:grid;place-items:center;font:900 2rem serif;transform:rotate(12deg);background:#9ce5bd;box-shadow:5px 5px 0 #20201d}
  .article-switch{display:grid;grid-template-columns:1fr 1fr;margin-top:32px;border:2px solid #20201d;border-radius:999px;background:#f1efe9;padding:4px;box-shadow:4px 4px 0 #20201d}.article-switch button{min-width:110px;border:0;border-radius:999px;background:transparent;padding:10px 20px;font-weight:950;cursor:pointer}.article-switch button.active{background:#20201d;color:#fff}
  .reading-mode{position:absolute;top:18px;right:0;z-index:5;display:flex;align-items:center;gap:7px;padding:5px 6px 5px 9px;border:2px solid #20201d;border-radius:999px;background:#fff;font-size:.72rem;font-weight:950;letter-spacing:.06em;cursor:pointer;box-shadow:3px 3px 0 #f2c94c}.reading-mode i{box-sizing:border-box;display:flex;align-items:center;width:25px;height:15px;padding:1.5px;border:1.5px solid #20201d;border-radius:999px;background:#8ec5ef}.reading-mode i::after{content:"";box-sizing:border-box;flex:0 0 9px;width:9px;height:9px;border:1px solid #20201d;border-radius:50%;background:#fff;transition:margin-left .18s}.reading-mode.on i{background:#62d39a}.reading-mode.on i::after{margin-left:auto}
  .article-intro{max-width:720px;margin:35px auto 70px;text-align:center}.article-intro small{color:#a85e13}.article-intro h2{font-size:clamp(2.3rem,6vw,4.6rem);line-height:.95;letter-spacing:-.05em;margin:12px 0 18px}.article-intro p{font-size:1.08rem;line-height:1.5;margin:0 auto;max-width:590px}
  .intro-links{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:20px}.intro-links button{border:0;background:none;color:#8c4a0a;font-weight:900;font-size:.82rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  section.lesson{margin:80px 0 125px}.section-copy{max-width:680px;margin:0 0 24px 18px}.section-copy>small{color:#a85e13}.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy>p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:650px}.expand{display:flex;align-items:center;gap:8px;margin-top:14px;padding:5px 0;border:0;border-bottom:2px solid #20201d;background:transparent;font-size:.82rem;font-weight:900;cursor:pointer}.expand b{font:950 1rem/1 ui-monospace,monospace;color:#a85e13;transition:transform .15s}.expand[aria-expanded="true"] b{transform:rotate(90deg)}
  .section-setup{max-width:680px;margin:24px 0 0 18px}
  .crosslink{display:block;margin:40px auto 90px;border:0;background:none;color:#8c4a0a;font-weight:950;font-size:1rem;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .cta{margin:70px 0 100px;border:3px solid #20201d;border-radius:25px 19px 28px 18px;padding:34px;display:flex;align-items:center;gap:30px;background:#fff6c7;box-shadow:10px 11px 0 #f2c94c}.cta div{flex:1}.cta>button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta>button:hover{transform:translate(-2px,-2px)}.cta>button span{font-size:1.4rem;margin-left:8px}.macro-cta{background:#eaf5ff;box-shadow:10px 11px 0 #9dccee}
  .article-diagnose{margin:110px 0 40px;padding-top:55px;border-top:3px solid #20201d}.article-diagnose>small{display:block;text-align:center;color:#a85e13;font-weight:950;letter-spacing:.13em;font-size:.72rem}.article-diagnose>h2{text-align:center;font-size:clamp(2rem,5vw,3.6rem);line-height:1;margin:8px 0 24px;letter-spacing:-.045em}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:450px}header>div:not(.article-switch){font-size:.95rem}.doodle{right:2%;top:15%;width:40px;height:40px;font-size:1.4rem}.article-switch button{min-width:90px}.reading-mode{top:12px;right:0}.article-intro{margin:20px auto 55px}section.lesson{margin:60px 0 90px}.section-copy,.section-setup{margin-left:6px}.section-copy>p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta>button{width:100%;margin-top:22px}}
</style>
