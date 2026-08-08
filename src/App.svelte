<script lang="ts">
  import { onMount } from "svelte";
  import { computeRun } from "./engine/simulate.js";

  let canvas: HTMLCanvasElement;
  // Prove the engine is wired in: the canonical winning run.
  const winning = computeRun({ model: "sonnet", who: "subagent", prompts: "identical", width: 8 });

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const w = (canvas.width = canvas.clientWidth * devicePixelRatio);
    const h = (canvas.height = 120 * devicePixelRatio);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = `${16 * devicePixelRatio}px system-ui, sans-serif`;
    ctx.fillText("canvas mounted", 16 * devicePixelRatio, 40 * devicePixelRatio);
  });
</script>

<main>
  <h1>The Claude Code Simulator</h1>
  <p>Engine online. Canonical winning run (identical sonnet subagents, 8-wide):
    <strong>${winning.total.toFixed(2)}</strong> — shipped: {winning.shipped}</p>
  <canvas bind:this={canvas} style="width:100%;height:120px;display:block;"></canvas>
</main>

<style>
  main {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  h1 { font-size: 1.4rem; }
</style>
