<script lang="ts">
  import type { Model } from "../engine/types.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";
  import type { Ttl } from "../sim/cost.js";
  import { lifecycleComparison } from "./spendModel.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  let prefixTokens = $state(250_000);
  let model = $state<Model>("opus");
  let ttl = $state<Ttl>("5m");
  let keepWarm = $state(true);
  const comparison = $derived(lifecycleComparison(prefixTokens, model, ttl));
  const rawRows = $derived([
    { label: "Keep-warm ping", messagesTok: prefixTokens, cacheRead: prefixTokens, cacheWrite: 0, freshInput: 0, output: 0 },
    { label: `Lapsed · ${ttl} rewrite`, messagesTok: prefixTokens, cacheRead: 0, cacheWrite: prefixTokens, freshInput: 0, output: 0 },
  ] satisfies RawTurn[]);
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
</script>

<article class="lifecycle toycard" data-testid="cache-lifecycle-widget">
  <header class="toycard__head toycard__head--purple">
    <div><small class="toy-eyebrow">ONE CACHE ENTRY</small><strong class="toy-title">0.1× vs 1.25× vs 2×: the cache lifecycle</strong></div>
    <RawDataModal title="Modeled cache lifecycle" provenance={{ real: false, source: "src/article/spendModel.ts engine model" }} rows={rawRows} />
  </header>

  <div class="controls">
    <label>Prefix <input class="toy-range" aria-label="Prefix tokens" type="range" min="25000" max="1000000" step="25000" bind:value={prefixTokens} /><b class="toy-num">{prefixTokens.toLocaleString()} tok</b></label>
    <label>Model <select class="toy-select" aria-label="Lifecycle model" bind:value={model}>{#each models as item}<option value={item}>{item}</option>{/each}</select></label>
    <div><span>TTL</span><span class="toy-seg"><button class:active={ttl === "5m"} onclick={() => ttl = "5m"}>5m</button><button class:active={ttl === "1h"} onclick={() => ttl = "1h"}>1h</button></span></div>
    <div><span>Keep warm?</span><span class="toy-seg"><button class:active={keepWarm} onclick={() => keepWarm = true}>Yes</button><button class:active={!keepWarm} onclick={() => keepWarm = false}>No</button></span></div>
  </div>

  <div class="life">
    <div class="event read"><small>NOW · READ</small><strong>0.1×</strong><span>{money(comparison.keepWarmUsd)}</span></div>
    <div class="ttl"><small>{ttl === "5m" ? "5-minute" : "1-hour"} window drains</small><div class="toy-bar"><i class="toy-bar__seg read" style="width:72%"></i></div></div>
    <div class="fork" aria-label="Cache lifecycle fork">
      <article class:chosen={keepWarm}><small>PING BEFORE EXPIRY</small><strong>read · 0.1×</strong><b class="toy-num">{money(comparison.keepWarmUsd)}</b></article>
      <span>or</span>
      <article class:chosen={!keepWarm}><small>LET IT LAPSE</small><strong>rewrite · {ttl === "5m" ? "1.25×" : "2×"}</strong><b class="toy-num">{money(comparison.lapseUsd)}</b></article>
    </div>
  </div>

  <footer class="toycard__foot">
    <div><span>Lapse · rewrite</span><strong class="toy-num">{money(comparison.lapseUsd)}</strong></div><b>→</b>
    <div><span>Keep-warm · ping</span><strong class="toy-num">{money(comparison.keepWarmUsd)}</strong></div>
    <div class="toy-delta"><span>saved</span><strong class="toy-num" data-testid="lifecycle-saved" data-value={comparison.savedUsd}>{money(comparison.savedUsd)} · {comparison.savedPercent.toFixed(0)}%</strong></div>
  </footer>
</article>

<style>
  .controls{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--sp-3);align-items:end;padding:15px 18px;border-bottom:1px dashed var(--toy-dash)}.controls label,.controls>div{display:grid;gap:var(--sp-1);font-size:11px;font-weight:850;text-transform:uppercase}.controls label:first-child{grid-template-columns:auto 1fr auto;align-items:center}.controls label:first-child input{width:100%}.life{display:grid;grid-template-columns:110px 1fr;gap:var(--sp-4);padding:18px}.event{display:grid;align-content:center;text-align:center;border:var(--toy-border-w) solid var(--toy-border);border-radius:var(--toy-radius-sm);background:var(--toy-green-soft)}.event small,.ttl small,.fork small{font-size:10px;font-weight:900;letter-spacing:.06em}.event strong{font-size:1.5rem}.ttl{display:grid;align-content:center;gap:var(--sp-2)}.ttl>.toy-bar{height:12px;border:1px solid var(--toy-border);background:var(--toy-cream)}.fork{grid-column:1 / -1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:var(--sp-3)}.fork article{display:grid;gap:var(--sp-1);padding:12px;border:var(--toy-border-w) solid var(--toy-border);border-radius:var(--toy-radius-sm);background:var(--toy-cream);opacity:.55}.fork article.chosen{background:var(--toy-green-soft);opacity:1}.fork article:last-child.chosen{background:var(--toy-red-soft)}.fork article b{text-align:right}.lifecycle footer>div:first-child strong{color:var(--toy-red-deep)}
  @media(max-width:640px){.controls{grid-template-columns:1fr 1fr;padding-inline:12px}.controls label:first-child{grid-column:1 / -1}.life{grid-template-columns:85px 1fr;padding-inline:12px}.fork{grid-template-columns:1fr}.fork>span{text-align:center}}
</style>
