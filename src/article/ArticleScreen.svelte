<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import MacroRouteWidget from "./MacroRouteWidget.svelte";
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sim/ledger.js";

  interface Props {
    onback: () => void;
    onsandbox: () => void;
    /** Optional direct route for hosts that expose it; the current hub is the fallback. */
    ontd?: () => void;
  }

  let { onback, onsandbox, ontd = onback }: Props = $props();
  let article = $state<"micro" | "macro">("micro");
  let expanded = $state<Record<string, boolean>>({});

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
    deep: string;
    apply: string;
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
      deep: `Bucket cost = tokens × rate × MODEL_IN[model] / 1e6. A 5m write uses ${RATE.w5m}×; a 1h write uses ${RATE.w1h}×. Both read at ${RATE.read}×. A 1h cold rebuild is therefore ${RATE.w1h / RATE.read}× its warm read.`,
      apply: "Set the cache TTL at the prompt-cache write boundary; choose 1h when reuse will outlive five minutes.",
      script: chat, offLabel: "5-minute TTL", onLabel: "1-hour TTL",
      off: { ...base, ttl: "5m" }, on: { ...base, ttl: "1h" },
    },
    {
      id: "keep-warm", eyebrow: "2 · KEEP-WARM", title: "Pay a little before expiry.",
      copy: "A small timed read can keep a useful prefix alive across a medium pause. Long idle periods can make the pings a bad trade.",
      deep: `The simulator pings just before expiry and prices every ping as cacheRead: tokens × ${RATE.read} × MODEL_IN[model] / 1e6. Compare the sum of reads with the avoided ${RATE.w5m}× or ${RATE.w1h}× rebuild.`,
      apply: "Schedule a tiny cache-reading request before TTL expiry, and stop it when the session is truly idle.",
      script: chat.map((message, index) => ({ ...message, atMin: [0, 2, 17, 19][index] })),
      offLabel: "No pings", onLabel: "Keep-warm", off: { ...base }, on: { ...base, keepWarm: true },
    },
    {
      id: "same-prompt", eyebrow: "3 · SAME PROMPT", title: "Give helpers one shared prefix.",
      copy: "Identical helper instructions can reuse a cached prefix. Unique wording creates a new cache identity and another cold write.",
      deep: `The first helper writes at ${RATE.w1h}× here; later helpers with the same prefix key read at ${RATE.read}×. That cold-versus-warm prefix ratio is ${RATE.w1h / RATE.read}× before fresh input and output are added.`,
      apply: "Keep the stable subagent brief byte-for-byte consistent; pass task-specific details after it.",
      script: subSame, offScript: subDifferent, onScript: subSame,
      offLabel: "Unique prompts", onLabel: "Same prompt", off: { ...base, ttl: "1h" }, on: { ...base, ttl: "1h" }, startOn: true,
    },
    {
      id: "large-context", eyebrow: "4 · LARGE CONTEXT", title: "Reuse the big prefix—or pay again.",
      copy: "A large context magnifies both the first cold write and every saving after it. Prefix identity matters more as context grows.",
      deep: `For Sonnet, MODEL_IN is $${MODEL_IN.sonnet}/M. This 260,000-token example prices a prefix through the same bucket formula. MIN_CACHEABLE_PREFIX is a provider/model eligibility gate; this simulator deliberately accepts an explicit prefix size and does not invent a threshold that is absent from its pricing source.`,
      apply: "Put stable tools, instructions, and repository context first; append changing task text after that reusable prefix.",
      script: chat, offScript: noReuse, onScript: chat,
      offLabel: "Rebuild each turn", onLabel: "Reuse prefix", off: { ...base, ttl: "1h" }, on: { ...base, ttl: "1h" }, startOn: true,
    },
    {
      id: "auto-approve", eyebrow: "5 · AUTO-APPROVE", title: "Fewer round-trips, fewer expiry chances.",
      copy: "Fast approvals keep related messages close together. Manual pauses can push the next message beyond its cache TTL.",
      deep: "Auto-approve does not change a token rate. It changes wall-clock gaps and often removes approval turns; the ledger uses a strict gap < TTL rule, so a message at or beyond expiry rebuilds the prefix.",
      apply: "Auto-approve only the safe commands your workflow already trusts; keep risky operations gated.",
      script: fast, offScript: slow, onScript: fast,
      offLabel: "Manual", onLabel: "Auto-approve", off: { ...base }, on: { ...base }, startOn: true,
    },
  ];

  const macroSections = [
    {
      id: "route", eyebrow: "1 · MODEL + EFFORT", title: "Match the brain to the job.",
      copy: "Planning and RCA need judgment; hotfixes, tests, and docs often need less. Haiku on a hard plan can underthink it. Fable on docs is overkill.",
      deep: `The widget routes plan, hotfix, debugging, RCA, code review, testing, and docs independently. Scoped prefixes and the 1M baseline flow through the real cache-write/read buckets; fresh input and output use ${RATE.input}× and ${RATE.out}×. No dollar amount is hand-written.`,
    },
    {
      id: "main-context", eyebrow: "2 · MAIN AGENT", title: "The default agent carries the whole backpack.",
      copy: "A 1M-context main agent is powerful—and expensive when every request drags that prefix through the meter.",
      deep: `At the pricing boundary, 1,000,000 tokens cost MODEL_IN[model] times the bucket multiplier: ${RATE.read}× for a warm read, ${RATE.w5m}× for a 5m write, or ${RATE.w1h}× for a 1h write. Output is separate at ${RATE.out}×.`,
    },
    {
      id: "delegate", eyebrow: "3 · DELEGATE", title: "Give subagents smaller backpacks.",
      copy: "A scoped helper sees only the brief and files it needs. One endless main session repeatedly carries accumulated history.",
      deep: "Delegate independent searches, reviews, tests, and docs with a stable shared prefix. Keep synthesis and decisions in the main agent; return compact findings instead of full transcripts.",
    },
    {
      id: "compact", eyebrow: "4 · AUTO-COMPACT", title: "Compress history before it owns you.",
      copy: "Compaction trades some detail for a smaller reusable prefix. Disable it only when exact old context matters more than repeated input cost.",
      deep: "Auto-compact changes token volume, not the pricing equation. After compaction, the smaller summary becomes the new prefix and gets its own cold write before later warm reads.",
    },
    {
      id: "lazy", eyebrow: "5 · LAZY-LOAD", title: "Load skills and MCPs when called.",
      copy: "Unused tool descriptions are still context. Keep the starting prefix lean and add capabilities only for tasks that need them.",
      deep: "Lazy-load skills and lazy-load MCPs reduce prefix tokens on unrelated turns. Once loaded, keep their stable definitions in the reusable prefix so the same-prompt and large-context levers still work.",
    },
  ];

  function show(kind: "micro" | "macro") {
    article = kind;
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggle(id: string) {
    expanded[id] = !expanded[id];
  }
</script>

<svelte:head><title>Claude Code — Explained</title></svelte:head>

<main class="article">
  <nav><button onclick={onback}>← Back to map</button><span>CLAUDE CODE — EXPLAINED</span></nav>

  <header>
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
          <p>{section.copy}</p>
          <button class="expand" aria-expanded={Boolean(expanded[`micro-${section.id}`])} onclick={() => toggle(`micro-${section.id}`)}>
            <b>|&gt;</b> {expanded[`micro-${section.id}`] ? "Close math" : "Deep dive"}
          </button>
          {#if expanded[`micro-${section.id}`]}
            <div class="deep" data-testid="deep-dive"><p>{section.deep}</p><p class="apply"><b>Apply it:</b> {section.apply}</p></div>
          {/if}
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

    {#each macroSections as section}
      <section class="lesson macro-lesson">
        <div class="section-copy">
          <small>{section.eyebrow}</small>
          <h2>{section.title}</h2>
          <p>{section.copy}</p>
          <button class="expand" aria-expanded={Boolean(expanded[`macro-${section.id}`])} onclick={() => toggle(`macro-${section.id}`)}>
            <b>|&gt;</b> {expanded[`macro-${section.id}`] ? "Close detail" : "Deep dive"}
          </button>
          {#if expanded[`macro-${section.id}`]}
            <div class="deep" data-testid="deep-dive"><p>{section.deep}</p></div>
          {/if}
        </div>
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
  .article-intro{max-width:720px;margin:35px auto 70px;text-align:center}.article-intro small{color:#a85e13}.article-intro h2{font-size:clamp(2.3rem,6vw,4.6rem);line-height:.95;letter-spacing:-.05em;margin:12px 0 18px}.article-intro p{font-size:1.08rem;line-height:1.5;margin:0 auto;max-width:590px}
  .article-intro .micro-hook{font-size:1rem;letter-spacing:0;margin:12px 0 24px;color:#716c62;font-weight:750}
  section.lesson{margin:80px 0 125px}.section-copy{max-width:680px;margin:0 0 24px 18px}.section-copy>small{color:#a85e13}.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy>p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:650px}.expand{display:flex;align-items:center;gap:8px;margin-top:14px;padding:5px 0;border:0;border-bottom:2px solid #20201d;background:transparent;font-size:.82rem;font-weight:900;cursor:pointer}.expand b{font:950 1rem/1 ui-monospace,monospace;color:#a85e13}.deep{margin-top:14px;padding:14px 16px;border-left:5px solid #f2c94c;background:#fff9db;font-family:system-ui,sans-serif;font-size:.88rem;line-height:1.55}.deep p{margin:0}.deep .apply{margin-top:10px;padding-top:10px;border-top:1px dashed #aaa398}
  .macro-lesson{margin:65px 0!important;border-bottom:2px dashed #d4d0c6}.macro-lesson .section-copy{margin-bottom:48px}.crosslink{display:block;margin:40px auto 90px;border:0;background:none;color:#8c4a0a;font-weight:950;font-size:1rem;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
  .cta{margin:70px 0 100px;border:3px solid #20201d;border-radius:25px 19px 28px 18px;padding:34px;display:flex;align-items:center;gap:30px;background:#fff6c7;box-shadow:10px 11px 0 #f2c94c}.cta div{flex:1}.cta>button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta>button:hover{transform:translate(-2px,-2px)}.cta>button span{font-size:1.4rem;margin-left:8px}.macro-cta{background:#eaf5ff;box-shadow:10px 11px 0 #9dccee}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:450px}header>div:not(.article-switch){font-size:.95rem}.doodle{right:2%;top:11%;width:40px;height:40px;font-size:1.4rem}.article-switch button{min-width:90px}.article-intro{margin:20px auto 55px}section.lesson{margin:60px 0 90px}.section-copy{margin-left:6px}.section-copy>p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta>button{width:100%;margin-top:22px}}
</style>
