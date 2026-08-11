<script lang="ts">
  import type { Model } from "../engine/types.js";
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";
  import { outputComparison } from "./spendModel.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  const prefixTokens = 180_000;
  const inputTokens = 1_200;
  const verboseOutput = 2_400;
  const leanOutput = 600;
  let model = $state<Model>("opus");
  let lean = $state(false);
  const comparison = $derived(outputComparison(model, prefixTokens, inputTokens, verboseOutput, leanOutput));
  const activeTokens = $derived(lean ? leanOutput : verboseOutput);
  const activeUsd = $derived(lean ? comparison.leanUsd : comparison.verboseUsd);
  const rawRows = $derived([
    { label: "Verbose generation", messagesTok: prefixTokens, cacheRead: prefixTokens, freshInput: inputTokens, output: verboseOutput },
    { label: "Lean generation", messagesTok: prefixTokens, cacheRead: prefixTokens, freshInput: inputTokens, output: leanOutput },
  ] satisfies RawTurn[]);
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
</script>

<article class="output-cost toycard" data-testid="output-cost-widget">
  <header class="toycard__head toycard__head--blue">
    <div><small class="toy-eyebrow">EVERY GENERATION PAYS AGAIN</small><strong class="toy-title">Output tokens are 5× — and never cached</strong></div>
    <RawDataModal title="Modeled output comparison" provenance={{ real: false, source: "src/article/spendModel.ts engine model" }} rows={rawRows} />
  </header>
  <div class="controls">
    <span class="toy-seg" aria-label="Output verbosity"><button class:active={!lean} onclick={() => lean = false}>Verbose</button><button class:active={lean} onclick={() => lean = true}>Lean</button></span>
    <label>Model <select class="toy-select" aria-label="Output model" bind:value={model}>{#each models as item}<option value={item}>{item}</option>{/each}</select></label>
  </div>
  <div class="meter">
    <div><small>Identical warm prefix</small><strong class="toy-num">{prefixTokens.toLocaleString()} tokens · 0.1× read</strong></div>
    <div><small>{lean ? "Lean" : "Verbose"} output</small><strong class="toy-num">{activeTokens.toLocaleString()} tokens · {RATE.out}× × ${MODEL_IN[model]}/M</strong></div>
    <div class="toy-bar"><i class="toy-bar__seg output" style={`width:${activeTokens / verboseOutput * 100}%`}></i></div>
    <b class="counter toy-num">{money(activeUsd)}</b>
  </div>
  <p class="toycard__note">Only output changes. The prefix and fresh input are held constant, and generated output never enters a cache discount on the turn that creates it.</p>
  <footer class="toycard__foot">
    <div><span>Verbose</span><strong class="toy-num">{money(comparison.verboseUsd)}</strong></div><b>→</b>
    <div><span>Lean</span><strong class="toy-num">{money(comparison.leanUsd)}</strong></div>
    <div class="toy-delta"><span>saved</span><strong class="toy-num" data-testid="output-saved" data-value={comparison.savedUsd}>{money(comparison.savedUsd)}</strong></div>
  </footer>
</article>

<style>
  .controls{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);padding:14px 18px}.controls button{padding:7px 13px}.controls label{display:flex;align-items:center;gap:var(--sp-2);font-size:11px;font-weight:850;text-transform:uppercase}.meter{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);align-items:end;padding:8px 18px 18px}.meter>div:not(.toy-bar){display:grid;gap:var(--sp-1)}.meter small{font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.meter>.toy-bar{grid-column:1 / -1;height:30px;border:var(--toy-border-w) solid var(--toy-border);background:var(--toy-cream)}.counter{grid-column:1 / -1;text-align:right;font-size:1.8rem;color:var(--toy-blue)}
  @media(max-width:640px){.controls,.meter{padding-inline:12px}.meter{grid-template-columns:1fr}.meter>.toy-bar,.counter{grid-column:1}.counter{text-align:left}}
</style>
