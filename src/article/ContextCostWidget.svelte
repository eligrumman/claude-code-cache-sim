<script lang="ts">
  import type { Model } from "../engine/types.js";
  import { DEFAULT_MAIN_CONTEXT_TOKENS, priceContextComparison } from "./macroPricing.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  let model = $state<Model>("sonnet");
  const priced = $derived(priceContextComparison(model));
  function money(value: number) { return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`; }
</script>

<div class="context" data-testid="context-cost-widget">
  <header>
    <div><small>ONE CODE REVIEW MESSAGE</small><strong>How heavy is the backpack?</strong></div>
    <label>Model <select bind:value={model} aria-label="Context example model">{#each models as item}<option value={item}>{item}</option>{/each}</select></label>
  </header>
  <div class="cards">
    <article class="main">
      <small>MAIN AGENT</small><h3>{DEFAULT_MAIN_CONTEXT_TOKENS.toLocaleString()}-token prefix</h3>
      <dl><dt>First message · cold write</dt><dd data-value={priced.mainCold}>{money(priced.mainCold)}</dd><dt>Next message · warm read</dt><dd>{money(priced.mainWarm)}</dd></dl>
    </article>
    <span class="versus">vs</span>
    <article class="scoped">
      <small>SCOPED SUBAGENT</small><h3>{priced.scopedTokens.toLocaleString()}-token prefix</h3>
      <dl><dt>First message · cold write</dt><dd data-value={priced.scopedCold}>{money(priced.scopedCold)}</dd><dt>Next message · warm read</dt><dd>{money(priced.scopedWarm)}</dd></dl>
    </article>
  </div>
  <p>Same review output. The difference is the prefix carried into the request; every figure above is repriced when you change model.</p>
</div>

<style>
  .context{border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d}.context>header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:15px 18px;background:#f4edff;border-bottom:2px solid #20201d}.context>header div{display:grid;gap:3px}.context header small{font-size:.65rem;font-weight:950;letter-spacing:.11em}.context header strong{font-size:1.08rem}.context label{display:grid;gap:2px;font-size:.6rem;font-weight:850;text-transform:uppercase}.context select{border:1.5px solid #20201d;border-radius:7px;background:#fff;padding:5px 18px 5px 7px;font:750 .78rem system-ui;text-transform:capitalize}.cards{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:13px;padding:16px}.cards article{padding:14px;border:2px solid #20201d;border-radius:12px}.cards article.main{background:#fff0ed}.cards article.scoped{background:#e7f8ee}.cards small{font-size:.62rem;font-weight:950;letter-spacing:.09em}.cards h3{margin:4px 0 12px;font-size:1.05rem}.cards dl{display:grid;grid-template-columns:1fr auto;gap:7px 12px;margin:0;font: .76rem/1.25 system-ui}.cards dd{margin:0;font-weight:850;font-variant-numeric:tabular-nums}.versus{font-weight:950}.context>p{margin:0;padding:11px 18px;border-top:1px dashed #aaa398;font: .76rem/1.4 system-ui}
  @media(max-width:620px){.context>header{align-items:center}.cards{grid-template-columns:1fr}.versus{text-align:center}.cards h3{font-size:.92rem}}
</style>
