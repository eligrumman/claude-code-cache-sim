<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import MacroRouteWidget from "./MacroRouteWidget.svelte";
  import MacroTaskPicker from "./MacroTaskPicker.svelte";
  import ContextCostWidget from "./ContextCostWidget.svelte";
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import { priceTokens } from "../sim/cost.js";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";

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
      copy: "A small timed read can keep a useful prefix alive across a medium pause.",
      deep: [
        `Keep-warm sends a small request before expiry so the cached prefix is read and its lifetime is refreshed. The request is not free: this simulator bills the full cached prefix at the ${RATE.read}× cache-read rate. For the 260,000-token Sonnet prefix below, each warm read is ${money(sonnetPrefixRead)}; rebuilding it with a one-hour write is ${money(sonnetPrefixRebuild)}.`,
        `The decision is a break-even question, not a ritual. Add up the pings needed to bridge the pause and compare them with the rebuild they avoid. Use keep-warm for a known medium wait, then stop it when the session is truly idle; endless reads can eventually cost more than letting the prefix go cold once.`,
      ],
      script: chat.map((message, index) => ({ ...message, atMin: [0, 2, 17, 19][index] })),
      offLabel: "No pings", onLabel: "Keep-warm", off: { ...base }, on: { ...base, keepWarm: true },
    },
    {
      id: "same-prompt", eyebrow: "3 · SAME PROMPT", title: "Give helpers one shared prefix.",
      copy: "Identical helper instructions can reuse a cached prefix.",
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
      copy: "Fast approvals keep related messages close together.",
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
      copy: "Planning and RCA need judgment; hotfixes, tests, and docs often need less.",
      deep: [
        `Model choice changes the base price of every token: Haiku is ${money(MODEL_IN.haiku)}, Sonnet ${money(MODEL_IN.sonnet)}, Opus ${money(MODEL_IN.opus)}, and Fable ${money(MODEL_IN.fable)} per million input tokens before bucket multipliers. Effort changes how much reasoning input and output the teaching workload consumes; output is billed at ${RATE.out}×, so asking a premium model to think harder compounds both choices.`,
        `Route for the consequence of being wrong. A plan, difficult debug, or RCA deserves more judgment; a small hotfix, routine tests, or docs usually does not. The picker labels an underpowered choice “bad,” an oversized one “expensive,” and the intended pairing “good,” while every displayed dollar amount still runs through the simulator's token buckets.`,
      ],
    },
    {
      id: "main-context", eyebrow: "2 · MAIN AGENT", title: "The default agent carries the whole backpack.",
      copy: "A 1M-context main agent is powerful—and expensive when every request drags that prefix through the meter.",
      deep: [
        `The main agent's million-token context may contain useful history, but the meter sees input carried into this request—not how much of it the task actually needs. A cold one-hour prefix is billed at ${RATE.w1h}× the selected model's input price; every warm message still reads the whole prefix at ${RATE.read}×. Output remains separate at ${RATE.out}×.`,
        `That makes context an every-message design decision. Keep broad synthesis in the main agent when its accumulated knowledge matters. For a bounded review, test run, or documentation pass, hand a helper a smaller brief and only the relevant files; the worked comparison uses the same review output on both sides so the cost difference is purely the backpack.`,
      ],
    },
    {
      id: "delegate", eyebrow: "3 · DELEGATE", title: "Give subagents smaller backpacks.",
      copy: "A scoped helper sees only the brief and files it needs.",
      deep: [
        `Delegation creates a new context boundary. The helper pays ${RATE.w1h}× the chosen model's input rate for a one-hour cold write of its scoped prefix, then only ${RATE.read}× for later reads that reuse that exact prefix. The alternative is not free: one long main session repeatedly reads its much larger accumulated history, even when the next job needs only a narrow slice.`,
        `Delegate work that can return a compact result—independent searches, reviews, focused tests, and docs. Keep cross-cutting decisions and final synthesis in the main agent. A stable shared helper prompt also lets parallel jobs reuse the front of their briefs instead of turning every helper into another cold cache identity.`,
      ],
    },
    {
      id: "compact", eyebrow: "4 · AUTO-COMPACT", title: "Compress history before it owns you.",
      copy: "Compaction trades some detail for a smaller reusable prefix.",
      deep: [
        `Auto-compact replaces older conversation detail with a shorter summary. It does not change the rates: the new summary is a new prefix, so its first one-hour use is a ${RATE.w1h}× cold write and later identical uses are ${RATE.read}× warm reads. The saving comes from putting fewer tokens into those buckets on every subsequent message.`,
        `Compact before accumulated history becomes the dominant input. Preserve exact logs, quotations, or code outside the chat when later work truly needs them verbatim; otherwise a concise record of decisions and open questions is usually the better repeated prefix.`,
      ],
    },
    {
      id: "lazy", eyebrow: "5 · LAZY-LOAD", title: "Load skills and MCPs when called.",
      copy: "Unused tool descriptions are still context.",
      deep: [
        `Skill instructions and MCP tool schemas are input tokens even when the current task never calls them. Loading every capability up front enlarges the prefix, which enlarges a one-hour cold write billed at ${RATE.w1h}× and every warm read billed at ${RATE.read}× the model's input rate. Lazy loading keeps unrelated turns from paying for descriptions they cannot use.`,
        `Load a capability when the task actually crosses that boundary. Once loaded, keep its stable definition in the reusable front of the prompt and put changing arguments later. This combines a lean starting context with the same-prefix cache benefit on repeated tool work.`,
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
      <h2>Which agents and efforts fit each task?</h2>
      <p>Route a mixed workday instead of sending every job through one giant default session.</p>
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
      </section>
    {/each}

    <button class="crosslink" onclick={() => show("micro")}>Why did THAT message cost $1? Zoom in →</button>
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
  section.lesson{margin:80px 0 125px}.section-copy{max-width:680px;margin:0 0 24px 18px}.section-copy>small{color:#a85e13}.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy>p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:650px}.expand{display:flex;align-items:center;gap:8px;margin-top:14px;padding:5px 0;border:0;border-bottom:2px solid #20201d;background:transparent;font-size:.82rem;font-weight:900;cursor:pointer}.expand b{font:950 1rem/1 ui-monospace,monospace;color:#a85e13;transition:transform .15s}.expand[aria-expanded="true"] b{transform:rotate(90deg)}
  .macro-widget{margin:28px 0 70px}
  .macro-lesson{margin:65px 0!important;border-bottom:2px dashed #d4d0c6}.macro-lesson .section-copy{margin-bottom:48px}.crosslink{display:block;margin:40px auto 90px;border:0;background:none;color:#8c4a0a;font-weight:950;font-size:1rem;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .cta{margin:70px 0 100px;border:3px solid #20201d;border-radius:25px 19px 28px 18px;padding:34px;display:flex;align-items:center;gap:30px;background:#fff6c7;box-shadow:10px 11px 0 #f2c94c}.cta div{flex:1}.cta>button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta>button:hover{transform:translate(-2px,-2px)}.cta>button span{font-size:1.4rem;margin-left:8px}.macro-cta{background:#eaf5ff;box-shadow:10px 11px 0 #9dccee}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:450px}header>div:not(.article-switch){font-size:.95rem}.doodle{right:2%;top:15%;width:40px;height:40px;font-size:1.4rem}.article-switch button{min-width:90px}.reading-mode{top:12px;right:0}.article-intro{margin:20px auto 55px}section.lesson{margin:60px 0 90px}.section-copy{margin-left:6px}.section-copy>p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta>button{width:100%;margin-top:22px}}
</style>
