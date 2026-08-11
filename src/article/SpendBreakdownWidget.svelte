<script lang="ts">
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";
  import { spendBreakdown, type SpendClass, type SpendUnit } from "./spendModel.js";

  interface Props { unit: SpendUnit }
  let { unit }: Props = $props();
  let length = $state(12);
  $effect(() => { length = unit === "message" ? 12 : 7; });
  const maximum = $derived(unit === "message" ? 40 : 21);
  const result = $derived(spendBreakdown(unit, length));
  const classes: Array<{ key: SpendClass; label: string; css: string }> = [
    { key: "input", label: "Fresh input", css: "input" },
    { key: "cacheRead", label: "Cache-read", css: "read" },
    { key: "cacheWrite", label: "Cache-write", css: "write" },
    { key: "output", label: "Output", css: "output" },
  ];
  const rawRows = $derived(result.rows.map((row): RawTurn => ({
    label: row.label,
    messagesTok: row.buckets.cacheRead + row.buckets.cacheWrite,
    cacheWrite: row.buckets.cacheWrite,
    cacheRead: row.buckets.cacheRead,
    freshInput: row.buckets.input,
    output: row.buckets.output,
  })));
  const percent = (key: SpendClass) => result.totalUsd ? result.usd[key] / result.totalUsd * 100 : 0;
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
</script>

<article class="spend toycard" data-testid={`spend-breakdown-${unit}`}>
  <header class="toycard__head toycard__head--green">
    <div>
      <small class="toy-eyebrow">{unit === "message" ? "MICRO · MESSAGES" : "MACRO · TASK BALLOONS"}</small>
      <strong class="toy-title">Where your money actually goes</strong>
    </div>
    <RawDataModal title={`Modeled ${unit} spend breakdown`} provenance={{ real: false, source: "src/article/spendModel.ts engine model" }} rows={rawRows} />
  </header>

  <div class="controls">
    <label for={`spend-length-${unit}`}>{unit === "message" ? "Session length" : "Tasks / day"}</label>
    <input id={`spend-length-${unit}`} class="toy-range" type="range" min="1" max={maximum} bind:value={length} />
    <strong class="toy-num">{length} {length === 1 ? unit : `${unit}s`}</strong>
  </div>

  <div class="breakdown">
    <div class="toy-bar" aria-label="Spend by billing class">
      {#each classes as item}
        {@const share = percent(item.key)}
        <span class={`toy-bar__seg ${item.css}`} style={`width:${share}%`} title={`${item.label}: ${money(result.usd[item.key])}`}>
          {#if share >= 9}<b>{money(result.usd[item.key])} · {share.toFixed(0)}%</b>{/if}
        </span>
      {/each}
    </div>
    <div class="toy-legend">
      {#each classes as item}
        <span><i class={`toy-swatch ${item.css}`}></i>{item.label} <b class="toy-num" data-testid={`spend-${unit}-${item.key}`} data-value={result.usd[item.key]}>{money(result.usd[item.key])} · {percent(item.key).toFixed(0)}%</b></span>
      {/each}
    </div>
  </div>

  <footer class="toycard__foot">
    <div><span>Modeled total</span><strong class="toy-num" data-testid={`spend-${unit}-total`} data-value={result.totalUsd}>{money(result.totalUsd)}</strong></div>
    <b>→</b>
    <div><span>Cache-read share</span><strong class="big toy-num" data-testid="spend-cacheread-pct" data-value={result.cacheReadPercent}>{result.cacheReadPercent.toFixed(1)}%</strong></div>
    <div class="toy-delta"><span>Published framing</span><strong>80%+ volume · ~74% hits</strong></div>
  </footer>
  <p class="toycard__note">Token Optimizer reports cache-reads as 80%+ of observed token volume and about a 74% cache-hit rate. That is framing, not this receipt: every dollar here is repriced by our engine at Opus + 5m as the repeated prefix grows.</p>
</article>

<style>
  .controls{display:grid;grid-template-columns:auto minmax(120px,1fr) auto;align-items:center;gap:var(--sp-3);padding:16px 18px 7px;font-size:var(--fs-body);font-weight:850}.controls input{width:100%}.breakdown{display:grid;gap:var(--sp-3);padding:13px 18px 18px}.breakdown>.toy-bar{height:56px;border:var(--toy-border-w) solid var(--toy-border);background:var(--toy-cream)}.toy-bar__seg{display:grid;place-items:center}.toy-bar__seg b{font-size:11px;color:var(--toy-ink-2)}.toy-legend b{font-weight:850}.spend footer .big{font-size:1.45rem;color:var(--toy-green-ink)}.spend footer>.toy-delta{max-width:220px}.spend footer>.toy-delta strong{font-size:.72rem}
  @media(max-width:640px){.controls{grid-template-columns:1fr auto;padding-inline:12px}.controls input{grid-column:1 / -1}.breakdown{padding-inline:12px}.breakdown>.toy-bar{height:45px}.spend footer>.toy-delta{max-width:none}.toy-legend>span{width:calc(50% - var(--sp-2));display:grid;grid-template-columns:auto 1fr}.toy-legend b{grid-column:2}}
</style>
