<script lang="ts">
  import type { Model } from "../engine/types.js";
  import { DEFAULT_MAIN_CONTEXT_TOKENS, MACRO_ROUTES, priceContextComparison } from "./macroPricing.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  let model = $state<Model>("sonnet");
  const priced = $derived(priceContextComparison(model));
  const reviewOutput = MACRO_ROUTES[4].output;
  const rawRows = $derived([
    { label: "Main · first message", messagesTok: DEFAULT_MAIN_CONTEXT_TOKENS, cacheWrite: DEFAULT_MAIN_CONTEXT_TOKENS, cacheRead: 0, freshInput: 0, output: reviewOutput },
    { label: "Main · next message", messagesTok: DEFAULT_MAIN_CONTEXT_TOKENS, cacheWrite: 0, cacheRead: DEFAULT_MAIN_CONTEXT_TOKENS, freshInput: 0, output: reviewOutput },
    { label: "Scoped · first message", messagesTok: priced.scopedTokens, cacheWrite: priced.scopedTokens, cacheRead: 0, freshInput: 0, output: reviewOutput },
    { label: "Scoped · next message", messagesTok: priced.scopedTokens, cacheWrite: 0, cacheRead: priced.scopedTokens, freshInput: 0, output: reviewOutput },
  ] satisfies RawTurn[]);
  function money(value: number) { return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`; }
</script>

<div class="context toycard" data-testid="context-cost-widget">
  <header class="toycard__head toycard__head--purple">
    <div><small class="toy-eyebrow">ONE CODE REVIEW MESSAGE</small><strong class="toy-title">How heavy is the backpack?</strong></div>
    <label>Model <select class="toy-select" bind:value={model} aria-label="Context example model">{#each models as item}<option value={item}>{item}</option>{/each}</select></label>
    <RawDataModal title="Modeled context comparison" provenance={{ real: false }} rows={rawRows} />
  </header>
  <div class="cards">
    <article class="main">
      <small>MAIN AGENT</small><h3>{DEFAULT_MAIN_CONTEXT_TOKENS.toLocaleString()}-token prefix</h3>
      <dl><dt>First message · cold write</dt><dd class="toy-num" data-value={priced.mainCold}>{money(priced.mainCold)}</dd><dt>Next message · warm read</dt><dd class="toy-num">{money(priced.mainWarm)}</dd></dl>
    </article>
    <span class="versus">vs</span>
    <article class="scoped">
      <small>SCOPED SUBAGENT</small><h3>{priced.scopedTokens.toLocaleString()}-token prefix</h3>
      <dl><dt>First message · cold write</dt><dd class="toy-num" data-value={priced.scopedCold}>{money(priced.scopedCold)}</dd><dt>Next message · warm read</dt><dd class="toy-num">{money(priced.scopedWarm)}</dd></dl>
    </article>
  </div>
  <p class="toycard__note">Same review output. The difference is the prefix carried into the request; every figure above is repriced when you change model.</p>
</div>

<style>
  .context label{display:grid;gap:2px;font-size:.6rem;font-weight:850;text-transform:uppercase}.context select{padding-right:18px;text-transform:capitalize}.cards{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:13px;padding:16px}.cards article{padding:14px;border:var(--toy-border-w) solid var(--toy-border);border-radius:12px}.cards article.main{background:var(--toy-red-soft)}.cards article.scoped{background:var(--toy-green-soft)}.cards small{font-family:var(--font-display);font-size:.62rem;font-weight:950;letter-spacing:.09em}.cards h3{margin:4px 0 12px;font-size:1.05rem}.cards dl{display:grid;grid-template-columns:1fr auto;gap:7px 12px;margin:0;font:.76rem/1.25 var(--font-body)}.cards dd{margin:0;font-size:.76rem;font-weight:850}.versus{font-weight:950}.context>.toycard__note{line-height:1.4}
  @media(max-width:620px){.context>header{align-items:center}.cards{grid-template-columns:1fr}.versus{text-align:center}.cards h3{font-size:.92rem}}
</style>
