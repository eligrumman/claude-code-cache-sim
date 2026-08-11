<script lang="ts">
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { Model } from "../engine/types.js";
  import type { RawTurn } from "../sim/captures/realSegments.js";
  import {
    MACRO_ROUTES,
    macroLabComparison,
    type Effort,
    type MacroLabStrategy,
    type MacroSpendClass,
  } from "./macroPricing.js";

  let strategy = $state<MacroLabStrategy>("uniform");
  let model = $state<Model>("opus");
  let effort = $state<Effort>("high");
  let taskCount = $state(7);
  let contextDropped = $state(0);

  const result = $derived(macroLabComparison({ strategy, model, effort, taskCount, contextDropped }));
  const classes: Array<{ key: MacroSpendClass; label: string; css: string }> = [
    { key: "input", label: "Fresh input", css: "input" },
    { key: "cacheRead", label: "Cache-read", css: "read" },
    { key: "cacheWrite", label: "Cache-write", css: "write" },
    { key: "output", label: "Output", css: "output" },
  ];
  const rawRows = $derived(result.selected.rows.map((row): RawTurn => ({
    label: row.label,
    messagesTok: row.buckets.cacheRead + row.buckets.cacheWrite,
    cacheWrite: row.buckets.cacheWrite,
    cacheRead: row.buckets.cacheRead,
    freshInput: row.buckets.input,
    output: row.buckets.output,
  })));
  const percent = (key: MacroSpendClass) => result.selected.totalUsd
    ? result.selected.usd[key] / result.selected.totalUsd * 100
    : 0;
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  const verdictLabel = { good: "good fit", bad: "underpowered", expensive: "expensive" } as const;
</script>

<article class="macrolab toycard" data-testid="macro-lab-widget">
  <header class="toycard__head toycard__head--green">
    <div>
      <small class="toy-eyebrow">MACRO · TASK ROUTING LAB</small>
      <strong class="toy-title">Right-size the whole workday</strong>
    </div>
    <RawDataModal title="Modeled Macro Lab task spend" provenance={{ real: false, source: "src/article/MacroLabWidget engine model" }} rows={rawRows} />
  </header>

  <div class="toolbar">
    <div class="strategy toy-seg" aria-label="Routing strategy">
      <button class:active={strategy === "uniform"} aria-pressed={strategy === "uniform"} onclick={() => strategy = "uniform"}>All through one model+effort</button>
      <button class:active={strategy === "routed"} aria-pressed={strategy === "routed"} onclick={() => strategy = "routed"}>Right-sized</button>
    </div>
    <label>Model
      <select class="toy-select" bind:value={model} disabled={strategy === "routed"} aria-label="Uniform model">
        <option value="haiku">Haiku</option><option value="sonnet">Sonnet</option><option value="opus">Opus</option><option value="fable">Fable</option>
      </select>
    </label>
    <label>Effort
      <select class="toy-select" bind:value={effort} disabled={strategy === "routed"} aria-label="Uniform effort">
        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
      </select>
    </label>
  </div>

  <div class="sliders">
    <label for="macrolab-volume"><span>Tasks / day</span><strong class="toy-num">{taskCount}</strong></label>
    <input id="macrolab-volume" class="toy-range" type="range" min="1" max="21" bind:value={taskCount} />
    <label for="macrolab-compaction"><span>Context dropped by compaction</span><strong class="toy-num">{contextDropped}%</strong></label>
    <input id="macrolab-compaction" class="toy-range" type="range" min="0" max="80" step="10" bind:value={contextDropped} />
  </div>

  <div class="summary">
    <div><span>All through {model} · {effort}</span><strong class="toy-num" data-testid="macrolab-uniform-total" data-value={result.uniform.totalUsd}>{money(result.uniform.totalUsd)}</strong></div>
    <b>vs</b>
    <div><span>Right-sized</span><strong class="toy-num" data-testid="macrolab-routed-total" data-value={result.routed.totalUsd}>{money(result.routed.totalUsd)}</strong></div>
    <div class="toy-delta"><span>routing saves</span><strong class="toy-num" data-testid="macrolab-saved" data-value={result.savedUsd}>{money(result.savedUsd)} · {result.savedPercent.toFixed(0)}%</strong></div>
  </div>

  <div class="breakdown">
    <div class="toy-bar" aria-label="Macro Lab spend by billing class">
      {#each classes as item}
        {@const share = percent(item.key)}
        <span class={`toy-bar__seg ${item.css}`} style={`width:${share}%`} title={`${item.label}: ${money(result.selected.usd[item.key])}`}>
          {#if share >= 9}<b>{money(result.selected.usd[item.key])} · {share.toFixed(0)}%</b>{/if}
        </span>
      {/each}
    </div>
    <div class="toy-legend">
      {#each classes as item}
        <span><i class={`toy-swatch ${item.css}`}></i>{item.label} <b class="toy-num" data-testid={`macrolab-${item.key}`} data-value={result.selected.usd[item.key]} data-percent={percent(item.key)}>{money(result.selected.usd[item.key])} · {percent(item.key).toFixed(0)}%</b></span>
      {/each}
    </div>
  </div>

  <div class="tasks" aria-label="Task type breakdown">
    {#each result.selected.rows as row, index}
      {@const fit = MACRO_ROUTES[index % MACRO_ROUTES.length]}
      <div class="task">
        <div><strong>{row.label}</strong><small>{fit.judgment}</small></div>
        <span><b>fit</b> {fit.model} · {fit.effort}{#if strategy === "uniform"}<small>using {row.activeModel} · {row.activeEffort}</small>{/if}</span>
        <em class:good={row.verdict === "good"} class:bad={row.verdict === "bad"} class:expensive={row.verdict === "expensive"} data-testid="macrolab-verdict">{verdictLabel[row.verdict]}</em>
        <strong class="toy-num">{money(row.usd)}</strong>
      </div>
    {/each}
  </div>

  <footer class="toycard__foot">
    <div><span>Without compaction</span><strong class="toy-num" data-testid="macrolab-uncompacted-total" data-value={result.withoutCompactionUsd}>{money(result.withoutCompactionUsd)}</strong></div>
    <b>→</b>
    <div><span>Selected total</span><strong class="big toy-num" data-testid="macrolab-total" data-value={result.selected.totalUsd}>{money(result.selected.totalUsd)}</strong></div>
    <div class="toy-delta"><span>compaction saves</span><strong class="toy-num">{money(result.compactionSavedUsd)}</strong></div>
  </footer>
  <p class="toycard__note">Compaction is modeled here as shrinking the cached context prefix re-read by later tasks. It is not a measured capture; task tokens and every dollar are priced through the shared engine.</p>
</article>

<style>
  .toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:var(--sp-3);padding:16px 18px 8px}.toolbar label{display:grid;gap:4px;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.toolbar select{min-width:110px;text-transform:capitalize}.strategy{margin-right:auto}.strategy button{white-space:nowrap}
  .sliders{display:grid;grid-template-columns:auto minmax(120px,1fr);align-items:center;gap:8px var(--sp-3);padding:8px 18px 14px}.sliders label{display:flex;justify-content:space-between;gap:12px;font-size:var(--fs-body);font-weight:850}.sliders input{width:100%}
  .summary{display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:var(--sp-3);padding:12px 18px;border-block:1px dashed var(--toy-dash);background:var(--toy-cream)}.summary>div{display:grid;gap:2px}.summary span{font-size:.68rem;letter-spacing:.05em;text-transform:uppercase}.summary>div>strong{font-size:1.18rem}.summary .toy-delta{padding:7px 10px;border-radius:10px}.summary .toy-delta strong{font-size:.9rem}
  .breakdown{display:grid;gap:var(--sp-3);padding:16px 18px}.breakdown>.toy-bar{height:56px;border:var(--toy-border-w) solid var(--toy-border);background:var(--toy-cream)}.toy-bar__seg{display:grid;place-items:center}.toy-bar__seg b{font-size:11px;color:var(--toy-ink-2)}.toy-legend b{font-weight:850}
  .tasks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:0 14px 12px}.task{display:grid;grid-template-columns:minmax(100px,1fr) auto auto auto;align-items:center;gap:8px;padding:11px 5px;border-bottom:1px dashed var(--toy-dash);font-size:.8rem}.task>div,.task>span{display:grid}.task small{color:var(--toy-muted);font-size:.68rem}.task>span{text-transform:capitalize;color:var(--toy-muted)}.task>span>b{font-size:.6rem;text-transform:uppercase}.task>em{padding:3px 6px;border:1px solid currentColor;border-radius:99px;font-size:.62rem;font-style:normal;font-weight:900;text-transform:uppercase}.task>em.good{color:var(--toy-green-ink)}.task>em.bad{color:var(--toy-red-deep)}.task>em.expensive{color:var(--toy-gold-ink)}.task>.toy-num{text-align:right}
  .macrolab footer .big{font-size:1.45rem;color:var(--toy-green-ink)}
  @media(max-width:720px){.summary{grid-template-columns:1fr auto 1fr}.summary>.toy-delta{grid-column:1 / -1}.tasks{grid-template-columns:1fr}.task{grid-template-columns:minmax(92px,1fr) auto auto}.task>em{grid-column:2}.task>.toy-num{grid-column:3;grid-row:1}.task>span{grid-row:2}.toolbar{padding-inline:12px}.sliders,.breakdown{padding-inline:12px}.breakdown>.toy-bar{height:45px}}
  @media(max-width:480px){.toolbar label{flex:1}.toolbar select{width:100%;min-width:0}.strategy{width:100%;display:grid;grid-template-columns:1fr 1fr}.sliders{grid-template-columns:1fr}.summary{grid-template-columns:1fr auto 1fr}.summary>div>strong{font-size:.95rem}.toy-legend>span{width:calc(50% - var(--sp-2));display:grid;grid-template-columns:auto 1fr}.toy-legend b{grid-column:2}}
</style>
