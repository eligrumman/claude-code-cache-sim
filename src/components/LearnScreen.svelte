<script lang="ts">
  import { onMount } from "svelte";
  import { LEVEL_BY_ID, type LevelId } from "../game/levels.js";
  import { runScript } from "../game/step.js";
  import { TapeRenderer } from "../render/tape.js";

  let { level, onplay, onback }: { level: LevelId; onplay: () => void; onback: () => void } = $props();

  const def = $derived(LEVEL_BY_ID[level]);
  const runA = $derived(runScript(def.learn.seed, def.learn.scope, def.learn.withoutCfg, true));
  const runB = $derived(runScript(def.learn.seed, def.learn.scope, def.learn.withCfg, true));
  const chip = $derived(def.learn.chip(runA, runB));

  let canvasA: HTMLCanvasElement;
  let canvasB: HTMLCanvasElement;
  let tapeA: TapeRenderer | null = null;
  let tapeB: TapeRenderer | null = null;

  onMount(() => {
    tapeA = new TapeRenderer(canvasA);
    tapeB = new TapeRenderer(canvasB);
    tapeA.play(runA.ledger);
    tapeB.play(runB.ledger);
    return () => {
      tapeA?.destroy();
      tapeB?.destroy();
    };
  });
</script>

<div class="card">
  <p class="sub" style="margin-top:0">{def.id} - LEARN</p>
  <h1 style="margin-top:0">{def.title}</h1>
  <p class="lead">{def.objective}</p>

  {#each def.learn.copy as line}
    <p class="sub">{line}</p>
  {/each}

  <div class="learn-pair">
    <div>
      <p class="grp-h">Without the tool</p>
      <div class="tape-holder"><canvas bind:this={canvasA}></canvas></div>
    </div>
    <div>
      <p class="grp-h">With it used right</p>
      <div class="tape-holder"><canvas bind:this={canvasB}></canvas></div>
    </div>
  </div>

  <div class="msg chip">{chip}</div>

  <div class="row-btns">
    <button class="btn ghost" onclick={onback}>Back to map</button>
    <button class="btn" onclick={onplay}>Play</button>
  </div>
</div>

<style>
  .learn-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0; }
  .chip { font-weight: 600; }
</style>
