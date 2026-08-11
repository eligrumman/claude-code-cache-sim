<script lang="ts">
  import { onMount } from "svelte";
  import { initL1, step } from "../game/step.js";
  import { LEVEL_BY_ID } from "../game/levels.js";
  import { TapeRenderer } from "../render/tape.js";
  import type { GameState } from "../game/types.js";

  let {
    onfinish,
    onabandon,
  }: {
    onfinish: (st: GameState, handCoded: number) => void;
    onabandon: () => void;
  } = $props();

  const def = LEVEL_BY_ID.L1;
  let st = $state<GameState>(initL1(def.seed));
  let prediction = $state<"blue-pennies" | "red-much-more" | null>(null);
  let explanation = $state<string | null>(null);
  let canvas: HTMLCanvasElement | undefined = $state();
  let tape: TapeRenderer | null = null;

  const first = $derived(st.ledger[0]);
  const second = $derived(st.ledger[1]);
  const third = $derived(st.ledger[2]);
  const atDecision = $derived(st.idx === 2 && !st.l1Route);
  const needsPrediction = $derived(st.idx === 2 && !!st.l1Route && !st.l1PredictionCommitted);
  const readyToSendThird = $derived(st.idx === 2 && st.l1PredictionCommitted);
  const revealed = $derived(st.idx === 3);

  onMount(() => {
    return () => tape?.destroy();
  });

  $effect(() => {
    if (canvas && !tape) {
      tape = new TapeRenderer(canvas, {
        labelFor: (row) => st.units.find((u) => u.id === row.unitId)?.label ?? row.unitId,
      });
      tape.play(st.ledger);
    }
  });

  function sendNext() {
    const u = st.units[st.idx];
    if (!u) return;
    st = step(st, { type: "RUN_UNIT", unitId: u.id });
    tape?.play(st.ledger);
  }

  function chooseRoute(route: "same-chat" | "isolated") {
    st = step(st, { type: "CHOOSE_L1_ROUTE", route });
  }

  function lockPrediction() {
    if (!prediction) return;
    st = step(st, { type: "COMMIT_L1_PREDICTION" });
  }

  function explain(id: string) {
    explanation = id;
    const correct = id === "context";
    st = step(st, { type: "ACK_L1_EXPLANATION", correct });
    if (correct && st.ended) onfinish(st, 0);
  }
</script>

<div class="card goalbar">
  <b>{def.objective}</b>
  <span>${st.wallet.toFixed(6)} left of $0.30</span>
</div>

<div class="card story">
  <div class="bob"><b>Bob</b><span>{st.idx === 0 ? "Login is broken. Ask Claude to fix it?" : st.idx === 1 ? "Now add the matching logout route." : "Add a test for both routes."}</span></div>

  {#if st.idx < 2}
    <button class="btn primary" onclick={sendNext}>Send</button>
  {/if}

  {#if first}
    <div class="evidence write-evidence">
      First request: Claude saved <b>{first.writeTok.toLocaleString()} tokens</b> of context.
      <strong>WRITE · ${first.usd.toFixed(6)}</strong>
    </div>
  {/if}
  {#if second}
    <div class="evidence read-evidence">
      Same saved context. <strong>READ · ${second.usd.toFixed(7)}</strong>
    </div>
  {/if}

  {#if atDecision}
    <h2>Where should the test run?</h2>
    <div class="routes">
      <button class="route" onclick={() => chooseRoute("same-chat")}>
        <b>Keep working here</b>
        <span>12 min · lower request cost</span>
      </button>
      <button class="route" onclick={() => chooseRoute("isolated")}>
        <b>Open an isolated parallel test thread</b>
        <span>4 min · cold-write cost</span>
      </button>
    </div>
  {/if}

  {#if needsPrediction}
    <div class="prediction">
      <h2>Predict the third bill</h2>
      <p>{st.l1Route === "same-chat" ? "This request stays in Bob's implementation chat." : "This request opens in an isolated parallel thread."}</p>
      <label><input type="radio" name="prediction" bind:group={prediction} value="blue-pennies" /> Mostly blue, a few cents</label>
      <label><input type="radio" name="prediction" bind:group={prediction} value="red-much-more" /> Mostly red, much more</label>
      <button class="btn" disabled={!prediction} onclick={lockPrediction}>Lock prediction</button>
    </div>
  {/if}

  {#if readyToSendThird}
    <div class="chosen">
      {st.l1Route === "same-chat" ? "Same chat: cheaper, finishes in 12 min." : "Isolated parallel thread: faster, finishes in 4 min."}
    </div>
    <button class="btn primary" onclick={sendNext}>Send and find out</button>
  {/if}

  {#if revealed && third}
    <div class="reveal">
      <h2>{st.l1Route === "same-chat" ? "The context stayed warm." : "The isolated thread needed its own context."}</h2>
      <p>
        {third.readTok.toLocaleString()} read · {third.writeTok.toLocaleString()} written ·
        <b>${third.usd.toFixed(st.l1Route === "same-chat" ? 7 : 6)}</b>
      </p>
      <p class="benefit">
        {st.l1Route === "same-chat"
          ? "Lower bill: this thread saved $0.1980066 on the third request. Total time: 12 min."
          : "Faster finish: the parallel test completed 8 minutes earlier. Total time: 4 min."}
      </p>
    </div>

    <div class="explain">
      <h2>Why did the two thread choices produce different bills?</h2>
      <button class:wrong={explanation === "sentence"} onclick={() => explain("sentence")}>The test sentence was longer.</button>
      <button class:wrong={explanation === "model"} onclick={() => explain("model")}>The model changed its price.</button>
      <button onclick={() => explain("context")}>One thread could read saved context; the isolated thread had to write its own.</button>
      {#if explanation && explanation !== "context"}<p class="try-again">Look at the red and blue token counts in the third row, then try again.</p>{/if}
    </div>
  {/if}
</div>

{#if st.ledger.length}
  <div class="card">
    <h2>Requests on the wire</h2>
    <div class="tape-holder"><canvas bind:this={canvas}></canvas></div>
    <div class="ledger" aria-label="L1 request ledger">
      {#each st.ledger as row, i}
        <div class="ledger-row">
          <b>{i + 1}</b>
          <span>{row.readTok.toLocaleString()} read</span>
          <span>{row.writeTok.toLocaleString()} written</span>
          <span>${row.usd.toFixed(i === 1 || (i === 2 && st.l1Route === "same-chat") ? 7 : 6)}</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<div class="row-btns"><button class="btn ghost" onclick={onabandon}>Abandon</button></div>

<style>
  .goalbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
  .goalbar span { color: var(--ink-soft); font: 12px ui-monospace, monospace; white-space: nowrap; }
  .story { display: grid; gap: 14px; }
  .bob { display: flex; gap: 10px; align-items: baseline; }
  .bob b { color: var(--accent); }
  .primary { justify-self: start; }
  .evidence, .chosen, .reveal { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  .evidence strong { display: block; margin-top: 5px; }
  .write-evidence { border-left: 4px solid var(--write, #d9544d); }
  .read-evidence { border-left: 4px solid var(--read, #477bd1); }
  .routes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .route { text-align: left; padding: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel-2); color: var(--ink); cursor: pointer; }
  .route:hover { border-color: var(--accent); }
  .route span { display: block; margin-top: 6px; color: var(--ink-soft); }
  .prediction, .explain { display: grid; gap: 9px; }
  .prediction label { display: flex; gap: 8px; align-items: center; }
  .explain button { text-align: left; padding: 10px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel-2); color: var(--ink); cursor: pointer; }
  .explain button.wrong { border-color: var(--write, #d9544d); }
  .try-again { color: var(--ink-soft); margin: 0; }
  .benefit { font-weight: 700; }
  .ledger { display: grid; gap: 5px; margin-top: 8px; font: 11px ui-monospace, monospace; }
  .ledger-row { display: grid; grid-template-columns: 24px repeat(3, 1fr); gap: 8px; padding: 6px 8px; background: var(--panel-2); border-radius: 5px; }
  @media (max-width: 640px) { .routes { grid-template-columns: 1fr; } .goalbar { align-items: flex-start; flex-direction: column; } }
</style>
