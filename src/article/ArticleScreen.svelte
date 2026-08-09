<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import MacroRouteWidget from "./MacroRouteWidget.svelte";
  import MacroTaskPicker from "./MacroTaskPicker.svelte";
  import ContextCostWidget from "./ContextCostWidget.svelte";
  import WorkdaySessionWidget from "./WorkdaySessionWidget.svelte";
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

  const chat: ScriptedMessage[] = [
    { id: "brief", role: "user", text: "Refactor the auth module", atMin: 0 },
    { id: "scan", role: "assistant", text: "I found the session boundary. Editing it now…", atMin: 2 },
    { id: "tests", role: "user", text: "Run the focused tests", atMin: 10 },
    { id: "done", role: "assistant", text: "All 18 auth tests pass ✓", atMin: 12 },
  ];
  const fast = chat.map((message, index) => ({ ...message, atMin: [0, 2, 4, 6][index] }));
  const slow = chat.map((message, index) => ({ ...message, atMin: [0, 8, 16, 24][index] }));
  const noReuse = chat.map((message, index) => ({ ...message, prefixKey: `turn-${index}` }));
  const subSame: ScriptedMessage[] = [
    { id: "a1", role: "user", text: "Agent 1: review this diff", atMin: 0, prefixKey: "review" },
    { id: "a2", role: "assistant", text: "Agent 1: two edge cases found", atMin: 1, prefixKey: "review" },
    { id: "a3", role: "user", text: "Agent 2: review this diff", atMin: 2, prefixKey: "review" },
    { id: "a4", role: "assistant", text: "Agent 2: types look clean", atMin: 3, prefixKey: "review" },
  ];
  const subDifferent = subSame.map((message, index) => ({ ...message, prefixKey: `review-${index}` }));
  const base: MessageLedgerOptions = {
    ttl: "5m", model: "sonnet", prefixTok: 260_000, workInTok: 600, outputTok: 900,
  };

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
      script: chat, offLabel: "5-minute TTL", onLabel: "1-hour TTL",
      off: { ...base, ttl: "5m" }, on: { ...base, ttl: "1h" },
    },
    {
      id: "keep-warm", eyebrow: "2 · KEEP-WARM", title: "Pay a little before expiry.",
      copy: "A timed read can preserve a valuable prefix across a known medium pause.",
      deep: [
        `Keep-warm sends a small request before expiry so the cached prefix is read and its lifetime is refreshed. The request is not free: this simulator bills the full cached prefix at the ${RATE.read}× cache-read rate. For the 260,000-token Sonnet prefix below, each warm read is ${money(sonnetPrefixRead)}; rebuilding it with a one-hour write is ${money(sonnetPrefixRebuild)}.`,
        `The decision is a break-even question, not a ritual. Add up the pings needed to bridge the pause and compare them with the rebuild they avoid. Use keep-warm for a known medium wait, then stop it when the session is truly idle; endless reads can eventually cost more than letting the prefix go cold once.`,
      ],
      script: chat.map((message, index) => ({ ...message, atMin: [0, 2, 17, 19][index] })),
      offLabel: "No pings", onLabel: "Keep-warm", off: { ...base }, on: { ...base, keepWarm: true },
    },
    {
      id: "same-prompt", eyebrow: "3 · SAME PROMPT", title: "Give helpers one shared prefix.",
      copy: "Helpers share cache only when their stable instructions share an exact prefix.",
      deep: [
        `Prompt caches match a prefix, not the intent behind it. The first helper below writes the shared instructions at ${RATE.w1h}×; each later helper with the same prefix reads those tokens at ${RATE.read}×. Change wording, tool order, or stable context and the simulator gives it a new identity, so the prefix is written cold again.`,
        `That is a ${RATE.w1h / RATE.read}× cold-versus-warm gap before fresh task input and output are added. Keep the reusable subagent brief byte-for-byte stable, then append the file name, question, or test target after it. The helpers still get distinct work without making the expensive front half distinct too.`,
      ],
      script: subSame, offScript: subDifferent, onScript: subSame,
      offLabel: "Unique prompts", onLabel: "Same prompt", off: { ...base, ttl: "1h" }, on: { ...base, ttl: "1h" }, startOn: true,
    },
    {
      id: "large-context", eyebrow: "4 · LARGE CONTEXT", title: "Reuse the big prefix—or pay again.",
      copy: "A large context magnifies both the first cold write and every saving after it.",
      deep: [
        `Context is input on every request; caching only changes which input bucket receives it. Sonnet's base input price is ${money(MODEL_IN.sonnet)} per million tokens, so the 260,000-token prefix below costs ${money(sonnetPrefixRebuild)} as a one-hour cold write and ${money(sonnetPrefixRead)} as a warm read. A larger prefix makes both numbers larger in direct proportion.`,
        `Put stable system instructions, tool definitions, and repository context first, then append the changing task. That layout preserves a reusable prefix across turns. Cache eligibility thresholds are provider and model rules; because this pricing source declares no numeric minimum, the article does not fabricate one.`,
      ],
      script: chat, offScript: noReuse, onScript: chat,
      offLabel: "Rebuild each turn", onLabel: "Reuse prefix", off: { ...base, ttl: "1h" }, on: { ...base, ttl: "1h" }, startOn: true,
    },
    {
      id: "auto-approve", eyebrow: "5 · AUTO-APPROVE", title: "Fewer round-trips, fewer expiry chances.",
      copy: "Pre-approving safe, routine commands keeps related work inside the cache window.",
      deep: [
        `Auto-approve has no special discount. It changes the timeline: fewer approval turns and shorter pauses make the next real request more likely to arrive before the TTL. The ledger treats a gap shorter than the TTL as warm; a request at or beyond expiry writes the prefix again at ${RATE.w5m}× or ${RATE.w1h}× instead of reading it at ${RATE.read}×.`,
        `Approve only commands the workflow already trusts, such as a focused test or a read-only inspection. Keep destructive or surprising operations gated. The saving comes from removing safe, repetitive friction—not from weakening the boundary around risky actions.`,
      ],
      script: fast, offScript: slow, onScript: fast,
      offLabel: "Manual", onLabel: "Auto-approve", off: { ...base }, on: { ...base }, startOn: true,
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
      copy: "A scoped helper sees only the brief and files it needs.",
      deep: [
        `Delegation creates a new context boundary. A 260,000-token Sonnet helper prefix costs 260,000 × ${RATE.w1h} × $${MODEL_IN.sonnet}/M = ${money(sonnetPrefixRebuild)} for its first one-hour write, then 260,000 × ${RATE.read} × $${MODEL_IN.sonnet}/M = ${exactMoney(sonnetPrefixRead)} per warm read—a ${RATE.w1h / RATE.read}× swing on the prefix. The alternative is not free: a long main session repeatedly reads its larger accumulated history even when the next job needs one directory.`,
        `Delegate work that can be specified narrowly, checked independently, and returned compactly: searches, bounded reviews, focused tests, and factual docs. Do not delegate a two-minute edit whose brief and result need more tokens than the work, a decision that depends on tacit conversation history, or parallel tasks that will collide in the same files. Keep cross-cutting decisions and final synthesis in the main agent. When several helpers share a stable instruction prefix, preserve it exactly and append the task-specific target afterward so later helpers can read rather than rewrite it.`,
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
      ...microSections.map((section) => [`micro-${section.id}`, !tldr]),
      ...macroSections.map((section) => [`macro-${section.id}`, !tldr]),
    ]);
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

    <MacroRouteWidget />
    <div class="macro-widget"><MacroTaskPicker /></div>

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
      </section>
    {/each}

    <button class="crosslink" onclick={() => show("micro")}>Why did THAT message spike? Zoom in →</button>
    <section class="cta macro-cta">
      <div><small>ROUTE IT FOR REAL</small><h2>Ready for the balloons?</h2><p>Practice dispatching tasks by model and effort in Tokenloons TD.</p></div>
      <button onclick={ontd}>Open Tokenloons TD on the map <span>→</span></button>
    </section>
  {/if}
</main>

<style>
  .article{width:min(940px,calc(100% - 28px));margin:0 auto;padding-bottom:80px;color:#20201d;background:#fff;box-shadow:0 0 0 100vmax #fff;clip-path:inset(0 -100vmax);font-family:ui-rounded,"Comic Sans MS",system-ui,sans-serif}
  button{font:inherit;color:inherit}nav{display:flex;justify-content:space-between;align-items:center;padding:18px 0;border-bottom:2px solid #20201d;font-size:.72rem;font-weight:900;letter-spacing:.12em}nav button{border:0;background:none;cursor:pointer;letter-spacing:0}
  header{min-height:510px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative}header>p,.section-copy>small,.article-intro>small,.cta small{font-weight:950;letter-spacing:.13em;font-size:.72rem}h1{font-size:clamp(3rem,9vw,6.3rem);line-height:.86;letter-spacing:-.065em;margin:16px 0 26px}h1 em{font-style:normal;text-decoration:underline wavy #f2c94c 5px;text-underline-offset:8px}header>div:not(.article-switch){max-width:560px;font-size:1.12rem;line-height:1.5}.doodle{position:absolute;right:10%;top:15%;width:55px;height:55px;border:3px solid #20201d;border-radius:50% 45% 52% 46%;display:grid;place-items:center;font:900 2rem serif;transform:rotate(12deg);background:#9ce5bd;box-shadow:5px 5px 0 #20201d}
  .article-switch{display:grid;grid-template-columns:1fr 1fr;margin-top:32px;border:2px solid #20201d;border-radius:999px;background:#f1efe9;padding:4px;box-shadow:4px 4px 0 #20201d}.article-switch button{min-width:110px;border:0;border-radius:999px;background:transparent;padding:10px 20px;font-weight:950;cursor:pointer}.article-switch button.active{background:#20201d;color:#fff}
  .reading-mode{position:absolute;top:18px;right:0;z-index:5;display:flex;align-items:center;gap:7px;padding:5px 6px 5px 9px;border:2px solid #20201d;border-radius:999px;background:#fff;font-size:.72rem;font-weight:950;letter-spacing:.06em;cursor:pointer;box-shadow:3px 3px 0 #f2c94c}.reading-mode i{display:block;width:25px;height:15px;border:1.5px solid #20201d;border-radius:999px;background:#8ec5ef;position:relative}.reading-mode i::after{content:"";position:absolute;top:2px;left:2px;width:9px;height:9px;border:1px solid #20201d;border-radius:50%;background:#fff;transition:transform .18s}.reading-mode.on i{background:#62d39a}.reading-mode.on i::after{transform:translateX(10px)}
  .article-intro{max-width:720px;margin:35px auto 70px;text-align:center}.article-intro small{color:#a85e13}.article-intro h2{font-size:clamp(2.3rem,6vw,4.6rem);line-height:.95;letter-spacing:-.05em;margin:12px 0 18px}.article-intro p{font-size:1.08rem;line-height:1.5;margin:0 auto;max-width:590px}
  .article-intro .micro-hook{font-size:1rem;letter-spacing:0;margin:12px 0 24px;color:#716c62;font-weight:750}
  .intro-links{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:20px}.intro-links button{border:0;background:none;color:#8c4a0a;font-weight:900;font-size:.82rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
  section.lesson{margin:80px 0 125px}.section-copy{max-width:680px;margin:0 0 24px 18px}.section-copy>small{color:#a85e13}.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy>p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:650px}.expand{display:flex;align-items:center;gap:8px;margin-top:14px;padding:5px 0;border:0;border-bottom:2px solid #20201d;background:transparent;font-size:.82rem;font-weight:900;cursor:pointer}.expand b{font:950 1rem/1 ui-monospace,monospace;color:#a85e13;transition:transform .15s}.expand[aria-expanded="true"] b{transform:rotate(90deg)}
  .macro-widget{margin:28px 0 70px}
  .macro-lesson{margin:65px 0!important;border-bottom:2px dashed #d4d0c6}.macro-lesson .section-copy{margin-bottom:48px}.crosslink{display:block;margin:40px auto 90px;border:0;background:none;color:#8c4a0a;font-weight:950;font-size:1rem;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .cta{margin:70px 0 100px;border:3px solid #20201d;border-radius:25px 19px 28px 18px;padding:34px;display:flex;align-items:center;gap:30px;background:#fff6c7;box-shadow:10px 11px 0 #f2c94c}.cta div{flex:1}.cta>button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta>button:hover{transform:translate(-2px,-2px)}.cta>button span{font-size:1.4rem;margin-left:8px}.macro-cta{background:#eaf5ff;box-shadow:10px 11px 0 #9dccee}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:450px}header>div:not(.article-switch){font-size:.95rem}.doodle{right:2%;top:15%;width:40px;height:40px;font-size:1.4rem}.article-switch button{min-width:90px}.reading-mode{top:12px;right:0}.article-intro{margin:20px auto 55px}section.lesson{margin:60px 0 90px}.section-copy{margin-left:6px}.section-copy>p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta>button{width:100%;margin-top:22px}}
</style>
