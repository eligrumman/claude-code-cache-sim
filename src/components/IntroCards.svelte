<script lang="ts">
  // IntroCards.svelte - L1_REDESIGN Section 4 Beat 0: the 3 token-basics
  // intro cards + the goal card, replacing LearnScreen's A/B replay for L1
  // only (LearnBeat stays a plain object elsewhere; L1PlayScreen renders this
  // component directly instead of LearnScreen - Section 7 gap #7).
  import { onMount } from "svelte";
  import { TapeRenderer } from "../render/tape.js";
  import type { LedgerRow } from "../game/types.js";
  import { priceTable } from "../engine/pricing.js";

  let { attempted, onstart }: { attempted: boolean; onstart: () => void } = $props();

  let idx = $state(0); // 0..3 (3 = goal card)
  const P = priceTable("sonnet");

  const frames: LedgerRow[] = [
    { tMin: 0, unitId: "demo1", unit: "TASK", agent: "main", model: "sonnet", cold: true, readTok: 0, inputTok: 0, writeTok: 22527, writeTier: "1h", outTok: 0, usd: 0 },
    { tMin: 30, unitId: "demo2", unit: "TASK", agent: "main", model: "sonnet", cold: false, readTok: 22527, inputTok: 0, writeTok: 0, writeTier: "1h", outTok: 0, usd: 0 },
    { tMin: 91, unitId: "demo3", unit: "TASK", agent: "main", model: "sonnet", cold: true, readTok: 0, inputTok: 0, writeTok: 22527, writeTier: "1h", outTok: 0, usd: 0 },
  ];

  let canvas: HTMLCanvasElement | undefined = $state();
  let tape: TapeRenderer | null = null;
  onMount(() => {
    return () => tape?.destroy();
  });
  $effect(() => {
    if (idx === 2 && canvas && !tape) {
      tape = new TapeRenderer(canvas);
      tape.play(frames);
    }
  });

  function next() {
    idx = Math.min(3, idx + 1);
  }
</script>

<div class="card intro">
  {#if idx === 0}
    <p class="sub" style="margin-top:0">L1 - WHAT'S A TOKEN?</p>
    <h2>What's a token?</h2>
    <p class="lead">
      Claude reads and writes text in <b>tokens</b> - about three-quarters of a word each. Every
      token costs money. This sentence is ~12 tokens.
    </p>
    <div class="chips">
      {#each "Claude reads and writes text in tokens".split(" ") as w}
        <span class="chip">{w}</span>
      {/each}
    </div>
    <button class="btn" onclick={next}>Next</button>
  {:else if idx === 1}
    <p class="sub" style="margin-top:0">L1 - THE FOUR THINGS YOU PAY FOR</p>
    <h2>The four things you pay for.</h2>
    <ul class="paylist">
      <li><b>Input</b> - text you send fresh. Base price. <span class="mult">1x</span> (${P.input}/M)</li>
      <li><b>Output</b> - text Claude writes back. The most expensive tokens in the game. <span class="mult">5x</span> (${P.output}/M)</li>
      <li><b>Cache write</b> - the first time your context is sent, it gets saved for reuse. Double the base price, once. <span class="mult">2x</span> (${P.write1h}/M, 1-hour cache)</li>
      <li><b>Cache read</b> - every time after that, the saved context is read back at a tenth of the base price. <span class="mult">0.1x</span> (${P.read.toFixed(2)}/M) - reading is <b>20x cheaper than rewriting</b>.</li>
    </ul>
    <div class="bars">
      <div class="barrow"><span>input 1x</span><i style="width:{(1/5)*100}%"></i></div>
      <div class="barrow"><span>output 5x</span><i style="width:100%"></i></div>
      <div class="barrow"><span>write 2x</span><i style="width:{(2/5)*100}%"></i></div>
      <div class="barrow"><span>read 0.1x</span><i style="width:{(0.1/5)*100}%"></i></div>
    </div>
    <p class="sub">there's also a cheaper 5-minute cache (1.25x writes) - you'll meet it in level 6.</p>
    <button class="btn" onclick={next}>Next</button>
  {:else if idx === 2}
    <p class="sub" style="margin-top:0">L1 - WHEN DOES IT CACHE?</p>
    <h2>When does it cache? And when does it die?</h2>
    <p class="lead">
      Request 1: your whole context - tools, instructions, history - gets <b>WRITTEN</b> to the
      cache. Expensive, once. Request 2, 3, 4: the same context gets <b>READ</b> back. Cheap.
      But the cache only lives <b>60 minutes past its last use</b>. Walk away longer than that and
      it's gone - your next request <b>rewrites everything at 2x</b>, as if it were request 1
      again.
    </p>
    <div class="tape-holder"><canvas bind:this={canvas}></canvas></div>
    <p class="sub">measured: 215 real idle-rebuild events in 30 days, most in the 2-6h "stepped away" band (file 05).</p>
    <button class="btn" onclick={next}>Next</button>
  {:else}
    <p class="sub" style="margin-top:0">L1 - THE GOAL</p>
    <h2>Finish Bob's morning under $0.55.</h2>
    <p class="lead">
      Finish Bob's 4 tasks and his 90-minute standup for under <b>$0.55</b> - the cache makes
      repeat work 10x cheaper, but it dies <b>60 minutes</b> after you last use it.
    </p>
    <p class="sub">Standup is 90 minutes. The cache lives 60. You do the math.</p>
    <div class="row-btns">
      {#if attempted}
        <button class="btn ghost" onclick={onstart}>Skip intro</button>
      {/if}
      <button class="btn" onclick={onstart}>Start</button>
    </div>
  {/if}
</div>

<style>
  .intro h2 { margin: 0 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 16px; }
  .chip { border: 1px solid var(--line); border-radius: 6px; padding: 3px 7px; font: 11px ui-monospace, monospace; color: var(--ink-soft); }
  .paylist { list-style: none; padding: 0; margin: 10px 0 16px; display: flex; flex-direction: column; gap: 8px; }
  .paylist li { font-size: 13px; color: var(--ink); }
  .mult { font-weight: 700; color: var(--accent); margin-left: 4px; }
  .bars { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .barrow { display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 8px; font-size: 11px; color: var(--ink-soft); }
  .barrow i { display: block; height: 8px; border-radius: 4px; background: var(--accent); }
</style>
