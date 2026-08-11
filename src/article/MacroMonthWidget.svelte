<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { Model } from "../engine/types.js";
  import { DEFAULT_MACRO_MONTH, simulateMacroMonth, type Effort, type MacroLabStrategy, type MacroLoad, type MacroMonthConfig } from "./macroPricing.js";

  interface Props { preset?: Partial<MacroMonthConfig>; focus?: "all" | "strategy" | "model" | "effort" | "load"; }
  let { preset = {}, focus = "all" }: Props = $props();
  const initial = untrack(() => ({ ...DEFAULT_MACRO_MONTH, ...preset }));

  let root: HTMLElement;
  let strategy = $state<MacroLabStrategy>(initial.strategy);
  let model = $state<Model>(initial.model);
  let effort = $state<Effort>(initial.effort);
  let load = $state<MacroLoad>(initial.load);
  let revealed = $state(0);
  let selectedIndex = $state<number | null>(null);
  let playing = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reducedMotion = false;
  let configReady = false;
  const month = $derived(simulateMacroMonth({ strategy, model, effort, load }));
  const selected = $derived(month.days[selectedIndex ?? month.peakDay]);
  const peak = $derived(Math.max(...month.days.map((day) => day.totalUsd)));
  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  const efforts: Effort[] = ["low", "medium", "high"];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  const percent = (value: number, total: number) => total ? value / total * 100 : 0;
  const dominantModel = (values: Record<Model, number>): Model => models.reduce((best, model) => values[model] > values[best] ? model : best, "haiku");
  const weekday = (day: number) => weekdays[day % 7];
  const isWeekend = (day: number) => day % 7 === 6 || day % 7 === 0;
  const enabled = (knob: "strategy" | "model" | "effort" | "load") => focus === "all" || focus === knob;
  const heldAt = $derived([focus !== "strategy" ? strategy : null, focus !== "model" ? model : null, focus !== "effort" ? effort : null, focus !== "load" ? load : null].filter(Boolean).join(" · "));

  function play() {
    clearTimeout(timer);
    revealed = 0;
    selectedIndex = null;
    playing = true;
  }

  $effect(() => {
    if (!playing) return;
    if (revealed >= 30) { playing = false; selectedIndex = month.peakDay; return; }
    timer = setTimeout(() => { revealed += 1; selectedIndex = revealed - 1; }, 70);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    strategy; model; effort; load;
    if (!configReady) { configReady = true; return; }
    if (reducedMotion) { clearTimeout(timer); playing = false; revealed = 30; selectedIndex = month.peakDay; }
    else play();
  });

  onMount(() => {
    reducedMotion = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) { revealed = 30; selectedIndex = month.peakDay; return; }
    if (typeof IntersectionObserver === "undefined" || !root) return;
    let autoplayStarted = false;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || autoplayStarted || !entry.isIntersecting || entry.intersectionRatio < 0.55) return;
      autoplayStarted = true;
      play();
      observer.disconnect();
    }, { threshold: 0.55 });
    observer.observe(root);
    return () => observer.disconnect();
  });
</script>

<article bind:this={root} class="month toycard" data-testid="macro-month-widget" data-focus={focus}>
  <header class="toycard__head toycard__head--green">
    <div><small class="toy-eyebrow">MACRO · 30-DAY COST TIMELINE</small><strong class="toy-title">Where the month’s money went</strong></div>
    <button class="replay" onclick={play} aria-label="Replay month">↻ Replay</button>
  </header>
  <div class="toolbar">
    <div class:featured={focus === "strategy"} class:disabled={!enabled("strategy")} class="control"><span>Strategy</span><div class="toy-seg" aria-label="Month routing strategy">
      <button disabled={!enabled("strategy")} class:active={strategy === "routed"} aria-pressed={strategy === "routed"} onclick={() => strategy = "routed"}>Fit-routed</button>
      <button disabled={!enabled("strategy")} class:active={strategy === "uniform"} aria-pressed={strategy === "uniform"} onclick={() => strategy = "uniform"}>Uniform</button>
    </div></div>
    <label class:featured={focus === "model"} class:disabled={!enabled("model") || strategy === "routed"} class="control"><span>Model</span><select aria-label="Month model" disabled={!enabled("model") || strategy === "routed"} bind:value={model}>{#each models as choice}<option value={choice}>{choice}</option>{/each}</select></label>
    <label class:featured={focus === "effort"} class:disabled={!enabled("effort") || strategy === "routed"} class="control"><span>Effort</span><select aria-label="Month effort" disabled={!enabled("effort") || strategy === "routed"} bind:value={effort}>{#each efforts as choice}<option value={choice}>{choice}</option>{/each}</select></label>
    <div class:featured={focus === "load"} class:disabled={!enabled("load")} class="control"><span>Load</span><div class="toy-seg" aria-label="Month load">{#each ["light", "normal", "heavy"] as choice}<button disabled={!enabled("load")} class:active={load === choice} aria-pressed={load === choice} onclick={() => load = choice as MacroLoad}>{choice}</button>{/each}</div></div>
    {#if focus !== "all"}<small class="held">held at: {heldAt}</small>{/if}
    <div class="legend">{#each models as model}<span><i class={model}></i>{model}</span>{/each}</div>
  </div>
  <div class="chart-scroll">
    <div class="chart" aria-label="Daily cost bars">
      {#each month.days as day, index}
        {@const model = dominantModel(day.byModel)}
        <button data-testid="macro-month-day" class:weekend={isWeekend(day.day)} class:peak={index === month.peakDay} class:selected={selected.day === day.day} class:waiting={index >= revealed} onmouseenter={() => selectedIndex = index} onfocus={() => selectedIndex = index} onclick={() => selectedIndex = index} aria-label={`Day ${day.day}, ${money(day.totalUsd)}`}>
          {#if index === month.peakDay}<b>PEAK</b>{/if}
          <span class={`bar ${model}`} style={`height:${Math.max(7, day.totalUsd / peak * 100)}%`}></span><small>{day.day}</small>
        </button>
      {/each}
    </div>
  </div>
  <section class="detail">
    <div class="detail-head"><div><small>{weekday(selected.day)}{isWeekend(selected.day) ? " · weekend" : ""}</small><strong>Day {selected.day}</strong></div><strong class="toy-num">{money(selected.totalUsd)}</strong></div>
    <div class="splits">
      <div><h4>By model</h4>{#each models as model}<div class="row"><span>{model}</span><i class={`fill ${model}`} style={`width:${percent(selected.byModel[model], selected.totalUsd)}%`}></i><b class="toy-num">{money(selected.byModel[model])}</b></div>{/each}</div>
      <div><h4>By effort</h4>{#each efforts as effort}<div class="row"><span>{effort}</span><i class={`fill effort-${effort}`} style={`width:${percent(selected.byEffort[effort], selected.totalUsd)}%`}></i><b class="toy-num">{money(selected.byEffort[effort])}</b></div>{/each}</div>
    </div>
  </section>
  <footer class="toycard__foot">
    <div><span>30-day total</span><strong class="big toy-num" data-testid="macro-month-total" data-value={month.totalUsd}>{money(month.totalUsd)}</strong></div>
    <div class="mix"><span>Model mix</span><b>{models.filter((m) => month.byModel[m] > 0).map((m) => `${m} ${percent(month.byModel[m], month.totalUsd).toFixed(0)}%`).join(" · ")}</b></div>
    <div class="mix"><span>Effort mix</span><b>{efforts.map((e) => `${e} ${percent(month.byEffort[e], month.totalUsd).toFixed(0)}%`).join(" · ")}</b></div>
  </footer>
</article>

<style>
  .month{overflow:hidden}.toolbar{display:flex;align-items:end;flex-wrap:wrap;gap:12px;padding:12px 18px;border-bottom:1px dashed var(--toy-dash);background:var(--toy-cream)}.control{display:grid;gap:4px}.control>span{font-size:.62rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.control select{min-height:31px;border:2px solid var(--toy-border);border-radius:8px;background:white;padding:3px 24px 3px 8px;font-weight:800;text-transform:capitalize}.control.disabled{opacity:.4}.replay{border:2px solid var(--toy-border);border-radius:9px;background:var(--toy-cream);padding:6px 9px;font-weight:900;box-shadow:2px 2px 0 var(--toy-border)}.legend{display:flex;flex-wrap:wrap;gap:10px;margin-left:auto;font-size:.68rem;font-weight:850;text-transform:capitalize}.legend span{display:flex;align-items:center;gap:4px}.legend i{width:11px;height:11px;border:1px solid var(--toy-border);border-radius:3px}.chart-scroll{max-width:100%;overflow-x:auto;padding:18px 14px 8px}.chart{display:flex;align-items:end;gap:5px;min-width:720px;height:190px;border-bottom:3px solid var(--toy-border)}.chart button{position:relative;display:grid;grid-template-rows:1fr 18px;align-items:end;width:20px;height:100%;padding:0;border:0;background:transparent;cursor:pointer}.chart button>b{position:absolute;top:-11px;left:50%;translate:-50%;font-size:.48rem}.bar{display:block;width:100%;border:2px solid var(--toy-border);border-bottom:0;border-radius:5px 5px 0 0;transform-origin:bottom;transition:height .3s,transform .25s,opacity .25s}.waiting .bar{transform:scaleY(0);opacity:0}.weekend{opacity:.62}.selected .bar{outline:3px solid var(--toy-ink);outline-offset:2px}.chart small{font-size:.58rem;text-align:center}.haiku{background:#f5c84c}.sonnet{background:#65c5b4}.opus{background:#ef766f}.fable{background:#9e87dc}.detail{padding:14px 18px;border-top:1px dashed var(--toy-dash)}.detail-head{display:flex;justify-content:space-between;align-items:end}.detail-head div{display:grid}.detail-head small,.detail h4,.toycard__foot span{text-transform:uppercase;letter-spacing:.06em;font-size:.65rem}.detail-head>strong{font-size:1.35rem}.splits{display:grid;grid-template-columns:1fr 1fr;gap:22px}.splits h4{margin:12px 0 5px}.row{display:grid;grid-template-columns:58px minmax(30px,1fr) 65px;align-items:center;gap:7px;min-height:22px;font-size:.7rem;text-transform:capitalize}.row .fill{display:block;height:10px;min-width:0;border:1px solid var(--toy-border);border-radius:4px}.row b{text-align:right}.effort-low{background:#d9ef9f}.effort-medium{background:#82cbd0}.effort-high{background:#df75a5}.toycard__foot{display:grid;grid-template-columns:auto 1fr 1fr;gap:18px;align-items:center}.toycard__foot>div{display:grid}.toycard__foot .big{font-size:1.35rem;color:var(--toy-green-ink)}.mix b{font-size:.7rem;line-height:1.5;text-transform:capitalize}@media(max-width:650px){.toolbar{align-items:stretch;flex-direction:column}.legend{margin-left:0}.toy-seg{display:grid;grid-template-columns:1fr 1fr}.splits{grid-template-columns:1fr}.toycard__foot{grid-template-columns:1fr}.chart-scroll{padding-inline:8px}}
  .control.featured{outline:3px solid var(--toy-green);outline-offset:2px;padding:4px;border-radius:8px}.held{align-self:center;font-weight:800;text-transform:uppercase}
</style>
