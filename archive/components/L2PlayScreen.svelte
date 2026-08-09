<script lang="ts">
  import { onMount } from "svelte";
  import { initL2, step } from "../game/step.js";
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

  const def = LEVEL_BY_ID.L2;
  let st = $state<GameState>(initL2(def.seed));
  let prediction = $state<"blue-read" | "red-write" | null>(null);
  let explanation = $state<"expiry-idle-gap" | "request-text-changed" | "model-price-changed" | null>(null);
  let canvas: HTMLCanvasElement | undefined = $state();
  let tape: TapeRenderer | null = null;

  const opening = $derived(st.ledger[0]);
  const followup = $derived(st.ledger[1]);
  const blocker = $derived(st.units[0]);
  const ttlLeft = $derived(Math.max(0, 60 - st.clockMin));
  const awaitingProfile = $derived(st.ledger.length === 1 && !st.l2Profile);
  const awaitingPrediction = $derived(st.ledger.length === 1 && !!st.l2Profile && !st.l2PredictionCommitted);
  const readyForFollowup = $derived(st.ledger.length === 1 && st.l2PredictionCommitted);

  onMount(() => () => tape?.destroy());

  $effect(() => {
    if (canvas && !tape) {
      tape = new TapeRenderer(canvas, {
        labelFor: (row) => row.unitId === "R2_1" ? "Opening check" : "Identical follow-up",
      });
      tape.play(st.ledger);
    }
  });

  function refreshTape() {
    tape?.play(st.ledger);
  }

  function runOpening() {
    st = step(st, { type: "SEND_L2_CHECK" });
    refreshTape();
  }

  function chooseProfile(profile: "coffee" | "standup") {
    st = step(st, { type: "CHOOSE_L2_PROFILE", profile });
    st = profile === "coffee"
      ? step(st, { type: "ADVANCE", min: 20 })
      : step(st, { type: "RUN_UNIT", unitId: "u2-blocker-standup" });
  }

  function lockPrediction() {
    if (!prediction) return;
    st = step(st, { type: "COMMIT_L2_PREDICTION" });
  }

  function sendFollowup() {
    st = step(st, { type: "SEND_L2_CHECK" });
    st = step(st, { type: "REVEAL_L2_FOLLOWUP" });
    refreshTape();
  }

  function explain(id: "expiry-idle-gap" | "request-text-changed" | "model-price-changed") {
    explanation = id;
    st = step(st, { type: "ACK_L2_EXPLANATION", correct: id === "expiry-idle-gap" });
    if (st.ended) onfinish(st, 0);
  }

  function clearBlocker() {
    st = step(st, { type: "RUN_UNIT", unitId: "u2-blocker-standup" });
    if (st.ended) onfinish(st, 0);
  }
</script>

<div class="card goalbar">
  <div>
    <span class="eyebrow">ONE MORE CHECK</span>
    <b>{def.objective}</b>
  </div>
  <span class="wallet">${st.wallet.toFixed(7)} left of $0.65</span>
</div>

<div class="card desk">
  <div class="status-rail" aria-label="schedule status">
    <span>Minute <b>{st.clockMin}</b></span>
    <span class:cleared={blocker?.status === "done"} class="blocker">
      {blocker?.status === "done" ? "Blocker cleared" : "Blocker open"}
    </span>
    <span>Release <b>110</b></span>
  </div>

  {#if !opening}
    <h2>Bob's login fix needs one more check.</h2>
    <button class="btn primary" onclick={runOpening}>Run check</button>
  {:else}
    <div class="ttl" aria-label={`TTL ${ttlLeft}:00`}>
      <div class="ttl-copy"><b>TTL · {ttlLeft}:00</b><span>Saved for now. TTL is the idle-time countdown.</span></div>
      <div class="ttl-track"><i style={`width:${(ttlLeft / 60) * 100}%`}></i></div>
    </div>

    <div class="evidence write">
      <span>WRITE · {opening.writeTok.toLocaleString()} tokens</span>
      <b>${opening.usd.toFixed(7)}</b>
    </div>

    {#if awaitingProfile}
      <h2>The check and Bob's blocker both need attention. Which goes first?</h2>
      <div class="profiles">
        <button onclick={() => chooseProfile("coffee")}>
          <b>Coffee · 20 min · check first</b>
          <span>Reach the check sooner; postpone the blocker work.</span>
        </button>
        <button onclick={() => chooseProfile("standup")}>
          <b>Standup · 90 min · blocker first</b>
          <span>Clear the blocker first; consume more schedule time.</span>
        </button>
      </div>
    {/if}

    {#if awaitingPrediction}
      <div class="prediction">
        <h2>After this interruption, what color will the identical request be?</h2>
        <label><input type="radio" name="l2-prediction" bind:group={prediction} value="blue-read" /> Blue — read</label>
        <label><input type="radio" name="l2-prediction" bind:group={prediction} value="red-write" /> Red — write</label>
        <button class="btn" disabled={!prediction} onclick={lockPrediction}>Lock prediction</button>
      </div>
    {/if}

    {#if readyForFollowup}
      <div class="chosen">
        {st.l2Profile === "coffee"
          ? "Coffee finished. The check goes next; Bob's blocker is still open."
          : "Standup finished. Bob's blocker is cleared; the check goes next."}
      </div>
      <button class="btn primary" onclick={sendFollowup}>Send identical check</button>
    {/if}

    {#if followup && st.l2FollowupRevealed}
      <div class="evidence" class:read={!followup.cold} class:write={followup.cold}>
        <span>{followup.cold ? "WRITE again" : "READ"} · {(followup.cold ? followup.writeTok : followup.readTok).toLocaleString()} tokens</span>
        <b>${followup.usd.toFixed(7)}</b>
      </div>
      <p class="caption">The request stayed identical. Idle time changed what was still available.</p>

      {#if !st.l2ExplanationAcknowledged}
        <div class="explain">
          <h2>What determined this row?</h2>
          <button class:wrong={explanation === "expiry-idle-gap" ? false : explanation === "request-text-changed"} onclick={() => explain("request-text-changed")}>The request text changed.</button>
          <button class:wrong={explanation === "model-price-changed"} onclick={() => explain("model-price-changed")}>The model switched prices.</button>
          <button onclick={() => explain("expiry-idle-gap")}>Only the idle gap changed whether the saved entry was still live.</button>
          {#if explanation && explanation !== "expiry-idle-gap"}
            <p class="try-again">The request and model stayed identical. Compare the idle gap with the TTL, then try again.</p>
          {/if}
        </div>
      {:else if st.l2Profile === "coffee" && blocker?.status !== "done"}
        <div class="rule">Saved context expires after 60 idle minutes. After that, the next identical request writes it again.</div>
        <p>The check is done. Clear Bob's blocker before release.</p>
        <button class="btn primary" onclick={clearBlocker}>Clear blocker · 90 min</button>
      {/if}
    {/if}
  {/if}
</div>

{#if st.ledger.length}
  <div class="card">
    <h2>Requests on the wire</h2>
    <div class="tape-holder"><canvas bind:this={canvas}></canvas></div>
    <div class="ledger" aria-label="L2 request ledger">
      {#each st.ledger as row}
        <div><b>{row.unitId}</b><span>{row.readTok.toLocaleString()} read</span><span>{row.writeTok.toLocaleString()} written</span><span>${row.usd.toFixed(7)}</span></div>
      {/each}
    </div>
  </div>
{/if}

<div class="row-btns"><button class="btn ghost" onclick={onabandon}>Abandon</button></div>

<style>
  .goalbar, .status-rail { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .goalbar > div { display: grid; gap: 4px; }
  .eyebrow { color: var(--accent); font: 700 11px ui-monospace, monospace; letter-spacing: .12em; }
  .wallet { color: var(--ink-soft); font: 12px ui-monospace, monospace; white-space: nowrap; }
  .desk { display: grid; gap: 14px; }
  .status-rail { border-bottom: 1px solid var(--line); padding-bottom: 10px; color: var(--ink-soft); font: 12px ui-monospace, monospace; }
  .blocker { color: var(--write, #d9544d); }
  .blocker.cleared { color: var(--good, #2f8f5b); }
  .primary { justify-self: start; }
  .ttl { display: grid; gap: 7px; }
  .ttl-copy { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; }
  .ttl-copy span { color: var(--ink-soft); }
  .ttl-track { height: 7px; overflow: hidden; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--line); }
  .ttl-track i { display: block; height: 100%; background: var(--read, #477bd1); transition: width .25s ease; }
  .evidence, .chosen, .rule { border: 1px solid var(--line); border-radius: 8px; padding: 11px 12px; }
  .evidence { display: flex; justify-content: space-between; gap: 12px; font: 12px ui-monospace, monospace; }
  .evidence.write { border-left: 4px solid var(--write, #d9544d); }
  .evidence.read { border-left: 4px solid var(--read, #477bd1); }
  .profiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .profiles button, .explain button { text-align: left; padding: 13px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel-2); color: var(--ink); cursor: pointer; }
  .profiles button:hover, .explain button:hover { border-color: var(--accent); }
  .profiles span { display: block; margin-top: 6px; color: var(--ink-soft); }
  .prediction, .explain { display: grid; gap: 9px; }
  .prediction label { display: flex; gap: 8px; align-items: center; }
  .explain button.wrong { border-color: var(--write, #d9544d); }
  .try-again, .caption { color: var(--ink-soft); margin: 0; }
  .rule { border-left: 4px solid var(--accent); font-weight: 700; }
  .ledger { display: grid; gap: 5px; margin-top: 8px; font: 11px ui-monospace, monospace; }
  .ledger > div { display: grid; grid-template-columns: 56px repeat(3, 1fr); gap: 8px; padding: 6px 8px; border-bottom: 1px solid var(--line); }
  canvas { width: 100%; }
  @media (max-width: 680px) {
    .goalbar, .ttl-copy { align-items: flex-start; flex-direction: column; }
    .profiles { grid-template-columns: 1fr; }
    .ledger > div { grid-template-columns: 48px 1fr; }
  }
</style>
