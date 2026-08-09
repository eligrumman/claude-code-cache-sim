<script lang="ts">
  import { onMount } from "svelte";
  import { initL3, step } from "../game/step.js";
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

  const def = LEVEL_BY_ID.L3;
  let st = $state<GameState>(initL3(def.seed));
  let prediction = $state<string | null>(null);
  let explanation = $state<string | null>(null);
  let canvas: HTMLCanvasElement | undefined = $state();
  let tape: TapeRenderer | null = null;

  const requestNo = $derived(st.ledger.length + 1);
  const r3 = $derived(st.ledger[2]);
  const showTokens = $derived(st.ledger.length > 0);
  const readyForPrediction = $derived(
    (st.ledger.length === 0 && !st.l3PredictionCommitted) ||
    (st.ledger.length === 1 && !st.l3PredictionCommitted) ||
    (st.ledger.length === 2 && !!st.l3Placement && !st.l3PredictionCommitted) ||
    (st.ledger.length === 3 && st.clockMin >= 50 &&
      (st.l3Placement === "boot" || st.completedTransferIds?.includes("l3-reapplied-history")) &&
      !st.l3PredictionCommitted),
  );

  onMount(() => () => tape?.destroy());

  $effect(() => {
    if (canvas && !tape) {
      tape = new TapeRenderer(canvas, { labelFor: (row) => row.unitId });
      tape.play(st.ledger);
    }
  });

  function refreshTape() {
    tape?.play(st.ledger);
  }

  function currentStage(): "cold" | "repeat" | "change" | "handoff" {
    if (st.ledger.length === 0) return "cold";
    if (st.ledger.length === 1) return "repeat";
    if (st.ledger.length === 2) return "change";
    return "handoff";
  }

  function lockPrediction() {
    if (!prediction) return;
    st = step(st, { type: "COMMIT_L3_PREDICTION", stage: currentStage() });
  }

  function sendRequest() {
    st = step(st, { type: "SEND_L3_REQUEST" });
    prediction = null;
    refreshTape();
    if (st.ended) onfinish(st, 0);
  }

  function choosePlacement(placement: "boot" | "followup") {
    st = step(st, placement === "boot"
      ? {
          type: "SET_PREFIX_BLOCK_CONTENT", contextId: "l3-main", blockId: "PB_SYSTEM_L3",
          identityHash: "system-v2-reminder", tokenCount: 2_750,
        }
      : {
          type: "SET_PREFIX_BLOCK_CONTENT", contextId: "l3-main", blockId: "PB_HISTORY_L3",
          identityHash: "history-v2-reminder", tokenCount: 13_083,
        });
  }

  function explain(id: string) {
    explanation = id;
    st = step(st, { type: "ACK_L3_EXPLANATION", correct: id === "first-mismatch" });
  }

  function openHandoff() {
    st = step(st, { type: "ADVANCE", min: 50 });
  }

  function reapplyHistory() {
    st = step(st, {
      type: "SET_PREFIX_BLOCK_CONTENT", contextId: "l3-handoff", blockId: "PB_HISTORY_L3_HANDOFF",
      identityHash: "history-v2-reminder", tokenCount: 13_083,
    });
    st = step(st, { type: "ADVANCE", min: 8 });
  }

  function question(): string {
    if (st.ledger.length === 0) return "Nothing has been saved yet. What will the first send do with the four front blocks?";
    if (st.ledger.length === 1) return "Nothing in the stack changed. How far will the saved part reach?";
    if (st.ledger.length === 2) return "This one block changed. What will the next request do?";
    return "The saved entry is still live. What will verification do?";
  }
</script>

<div class="card goalbar">
  <div><span class="eyebrow">REMINDER HANDOFF</span><b>{def.objective}</b></div>
  <span class="wallet">Minute {st.clockMin} / 60 · ${st.wallet.toFixed(7)} left</span>
</div>

<div class="card workspace">
  <div class="opening">
    <h2>Five blocks. One request.</h2>
    <p>{showTokens ? "The first send revealed the cache boundary." : "Nothing has been sent yet."}</p>
  </div>

  <div class="prefix" aria-label="prefix stack">
    {#each st.l3MainPrefix ?? [] as block}
      <div
        class:changed={st.ledger.length >= 3 && block.id === st.l3FirstMismatchBlockId}
        class:invalidated={st.ledger.length >= 3 && block.cacheable &&
          (st.l3Placement === "boot" || block.kind === "history")}
        class:fresh={!block.cacheable}
      >
        <b>{block.label}</b>
        {#if showTokens}<span>{block.tokenCount.toLocaleString()} tok</span>{/if}
      </div>
    {/each}
  </div>

  {#if st.ledger.length === 2 && !st.l3Placement}
    <div class="work-order">
      <b>REMINDER HANDOFF</b>
      <p>Use the reminder in this session. A verification opens in another managed session at minute 50 and needs the same instruction.</p>
    </div>
    <div class="placements">
      <button onclick={() => choosePlacement("boot")}>
        <b>BOOT PATCH</b><span>Put it in global SYSTEM policy. The handoff receives it automatically.</span>
      </button>
      <button onclick={() => choosePlacement("followup")}>
        <b>FOLLOW-UP</b><span>Put it in this session's HISTORY. Reapply it during the handoff: 8 min.</span>
      </button>
    </div>
  {/if}

  {#if readyForPrediction}
    <div class="prediction">
      <h2>{question()}</h2>
      {#if st.ledger.length === 0}
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="read" /> Read a saved copy</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="write" /> Write them for later</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="fresh" /> Treat all five as fresh only</label>
      {:else if st.ledger.length === 1}
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="system" /> SYSTEM only</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="instructions" /> Through INSTRUCTIONS</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="history" /> Through HISTORY; CURRENT stays fresh</label>
      {:else if st.ledger.length === 2 && st.l3Placement === "followup"}
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="late" /> Reread the first three; rewrite HISTORY</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="all" /> Rewrite all four cached blocks</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="read" /> Reread all four cached blocks</label>
      {:else if st.ledger.length === 2}
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="later" /> Reread the later blocks anyway</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="system" /> Rewrite SYSTEM only</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="all" /> Rewrite SYSTEM and every cached block after it</label>
      {:else}
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="read" /> Reread the four front blocks; keep CURRENT fresh</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="rewrite" /> Rewrite the reminder block</label>
        <label><input type="radio" name="l3-prediction" bind:group={prediction} value="cold" /> Start cold because the session ID changed</label>
      {/if}
      <button class="btn" disabled={!prediction} onclick={lockPrediction}>Lock prediction</button>
    </div>
  {/if}

  {#if st.l3PredictionCommitted}
    <button class="btn primary" onclick={sendRequest}>
      {requestNo === 4 ? "Verify handoff" : requestNo === 2 ? "Send identical request" : "Send request"}
    </button>
  {/if}

  {#if r3 && !st.l3ExplanationAnswered}
    <div class="boundary">
      <b>First mismatch · {st.l3FirstMismatchBlockId === "PB_SYSTEM_L3" ? "SYSTEM" : "HISTORY"}</b>
      <span>{r3.readTok.toLocaleString()} reread · {r3.writeTok.toLocaleString()} rewritten · ${r3.usd.toFixed(7)}</span>
    </div>
    <div class="explain">
      <h2>What determined the rewritten portion?</h2>
      <button onclick={() => explain("first-mismatch")}>The first changed block ended reuse; its cached tail was rewritten.</button>
      <button onclick={() => explain("order")}>Every unchanged block was reusable regardless of earlier changes.</button>
      <button onclick={() => explain("smallest")}>The smallest changed block determined the result.</button>
    </div>
  {/if}

  {#if st.ledger.length === 3 && st.l3ExplanationAnswered && st.clockMin === 0}
    <div class="rule" class:wrong={explanation !== "first-mismatch"}>
      {explanation === "first-mismatch"
        ? "The cache reuses the unchanged prefix. Once a block changes, every later cached block must be written again."
        : "That answer does not match the request boundary, but the handoff can still continue."}
    </div>
    <button class="btn primary" onclick={openHandoff}>Open scheduled handoff · minute 50</button>
  {/if}

  {#if st.ledger.length === 3 && st.clockMin === 50 && st.l3Placement === "followup" && !st.completedTransferIds?.includes("l3-reapplied-history")}
    <div class="handoff"><b>Handoff opened.</b><span>Session HISTORY does not carry over automatically.</span></div>
    <button class="btn primary" onclick={reapplyHistory}>Reapply FOLLOW-UP · 8 min</button>
  {:else if st.ledger.length === 3 && st.clockMin >= 50}
    <div class="handoff">
      <b>Handoff ready · minute {st.clockMin}</b>
      <span>{st.l3Placement === "boot" ? "The global reminder is already present." : "The exact HISTORY reminder was restored."}</span>
    </div>
  {/if}
</div>

{#if st.ledger.length}
  <div class="card">
    <h2>Requests on the wire</h2>
    <div class="tape-holder"><canvas bind:this={canvas}></canvas></div>
    <div class="ledger" aria-label="L3 request ledger">
      {#each st.ledger as row}
        <div>
          <b>{row.unitId}</b><span>{row.readTok.toLocaleString()} read</span>
          <span>{row.writeTok.toLocaleString()} written</span><span>{row.inputTok.toLocaleString()} fresh</span>
          <span>{row.outTok.toLocaleString()} output</span><strong>${row.usd.toFixed(7)}</strong>
        </div>
      {/each}
    </div>
  </div>
{/if}

<div class="row-btns"><button class="btn ghost" onclick={onabandon}>Abandon</button></div>

<style>
  .goalbar, .goalbar > div, .workspace, .opening, .prediction, .explain, .handoff { display: grid; gap: 8px; }
  .goalbar { grid-template-columns: 1fr auto; align-items: center; gap: 16px; }
  .eyebrow { color: var(--accent); font: 700 11px ui-monospace, monospace; letter-spacing: .12em; }
  .wallet { color: var(--ink-soft); font: 12px ui-monospace, monospace; white-space: nowrap; }
  .opening h2, .opening p { margin: 0; }
  .prefix { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .prefix > div { min-height: 58px; display: grid; place-content: center; gap: 5px; padding: 8px; text-align: center; border: 1px solid var(--line); border-radius: 7px; background: var(--panel-2); font: 10px ui-monospace, monospace; }
  .prefix span { color: var(--ink-soft); }
  .prefix .changed { border-color: var(--write, #d9544d); box-shadow: inset 0 0 0 1px var(--write, #d9544d); }
  .prefix .invalidated { background: color-mix(in srgb, var(--write, #d9544d) 12%, var(--panel-2)); }
  .prefix .fresh { border-style: dashed; }
  .work-order, .boundary, .rule, .handoff { border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
  .work-order { border-left: 4px solid var(--accent); }
  .work-order p { margin-bottom: 0; }
  .placements { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .placements button, .explain button { text-align: left; padding: 13px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel-2); color: var(--ink); cursor: pointer; }
  .placements button:hover, .explain button:hover { border-color: var(--accent); }
  .placements span { display: block; margin-top: 6px; color: var(--ink-soft); }
  .prediction label { display: flex; gap: 8px; align-items: center; }
  .primary { justify-self: start; }
  .boundary { display: flex; justify-content: space-between; gap: 12px; border-left: 4px solid var(--write, #d9544d); font: 12px ui-monospace, monospace; }
  .rule { border-left: 4px solid var(--good, #2f8f5b); font-weight: 700; }
  .rule.wrong { border-left-color: var(--write, #d9544d); }
  .handoff span { color: var(--ink-soft); }
  .ledger { display: grid; gap: 5px; margin-top: 8px; font: 10px ui-monospace, monospace; }
  .ledger > div { display: grid; grid-template-columns: 1.4fr repeat(5, 1fr); gap: 8px; padding: 7px 8px; border-bottom: 1px solid var(--line); }
  canvas { width: 100%; }
  @media (max-width: 720px) {
    .goalbar { grid-template-columns: 1fr; }
    .placements { grid-template-columns: 1fr; }
    .prefix { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .boundary { flex-direction: column; }
    .ledger > div { grid-template-columns: 1fr 1fr; }
  }
</style>
