<script lang="ts">
  import { onMount } from "svelte";
  import type { Model } from "../engine/types.js";
  import { MACRO_ROUTES, priceTaskChoice, verdictForChoice, type Effort } from "./macroPricing.js";

  type Choice = { model: Model; effort: Effort };
  let root: HTMLElement;
  let choices = $state<Choice[]>(MACRO_ROUTES.map((route) => ({ model: route.model, effort: route.effort })));
  let revealed = $state(MACRO_ROUTES.length);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  const efforts: Effort[] = ["low", "medium", "high"];
  const costs = $derived(MACRO_ROUTES.map((route, index) => priceTaskChoice(route, choices[index].model, choices[index].effort)));
  const total = $derived(costs.reduce((sum, cost) => sum + cost, 0));
  const baseline = MACRO_ROUTES.reduce((sum, route) => sum + priceTaskChoice(route, "opus", "high"), 0);
  const peak = $derived(Math.max(...costs, 0.0001));
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;

  function reset() {
    choices = MACRO_ROUTES.map((route) => ({ model: route.model, effort: route.effort }));
  }
  function animate() {
    clearTimeout(timer);
    revealed = 0;
    const step = () => {
      revealed += 1;
      if (revealed < MACRO_ROUTES.length) timer = setTimeout(step, 70);
    };
    timer = setTimeout(step, 70);
  }
  onMount(() => {
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;
    revealed = 0;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting || entry.intersectionRatio < .55) return;
      animate(); observer.disconnect();
    }, { threshold: .55 });
    observer.observe(root);
    return () => { clearTimeout(timer); observer.disconnect(); };
  });
</script>

<article bind:this={root} class="fleet toycard" data-testid="subagent-fleet-widget">
  <header class="toycard__head toycard__head--green">
    <div><small class="toy-eyebrow">MACRO · SUBAGENT FLEET</small><strong class="toy-title">Seven jobs, seven right-sized brains</strong></div>
    <button class="reset" onclick={reset}>↻ Reset to fit routes</button>
  </header>
  <div class="scroll"><div class="rows">
    <div class="labels" aria-hidden="true"><span>Subagent</span><span>Model</span><span>Effort</span><span>Fit</span><span>Cost</span></div>
    {#each MACRO_ROUTES as route, index}
      {@const choice = choices[index]}
      {@const verdict = verdictForChoice(route, choice.model, choice.effort)}
      <div class:waiting={index >= revealed} class={`agent ${choice.model}`} data-testid="subagent-row">
        <strong>{route.task}</strong>
        <label><span>Model</span><select aria-label={`${route.task} model`} bind:value={choice.model}>{#each models as model}<option value={model}>{model}</option>{/each}</select></label>
        <label><span>Effort</span><select aria-label={`${route.task} effort`} bind:value={choice.effort}>{#each efforts as effort}<option value={effort}>{effort}</option>{/each}</select></label>
        <b class={`badge ${verdict}`}>{verdict === "good" ? "good fit" : verdict === "bad" ? "underpowered" : "expensive"}</b>
        <div class="cost"><i style={`width:${costs[index] / peak * 100}%`}></i><strong class="toy-num">{money(costs[index])}</strong></div>
      </div>
    {/each}
  </div></div>
  <footer class="toycard__foot">
    <div><span>All on main Opus · high</span><strong class="toy-num">{money(baseline)}</strong></div>
    <div><span>Your fleet</span><strong class="total toy-num" data-testid="subagent-fleet-total" data-value={total}>{money(total)}</strong></div>
    <div><span>{baseline >= total ? "Savings" : "Extra spend"}</span><strong class="toy-num">{money(Math.abs(baseline - total))}</strong></div>
  </footer>
</article>

<style>
  .fleet{overflow:hidden}.reset{border:2px solid var(--toy-border);border-radius:9px;background:var(--toy-cream);padding:6px 9px;font-weight:900;box-shadow:2px 2px 0 var(--toy-border)}.scroll{max-width:100%;overflow-x:auto}.rows{min-width:720px;padding:12px 16px}.labels,.agent{display:grid;grid-template-columns:1.1fr 1fr 1fr 1.1fr 1.5fr;align-items:center;gap:10px}.labels{padding:0 10px 6px;font-size:.62rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase}.agent{margin:6px 0;padding:9px 10px;border:2px solid var(--toy-border);border-radius:10px;box-shadow:2px 2px 0 var(--toy-border);transition:opacity .2s,transform .2s}.agent.waiting{opacity:0;transform:translateY(8px)}.agent>strong{font-size:.9rem}.agent label{display:grid;gap:2px}.agent label span{display:none}.agent select{width:100%;min-height:31px;border:2px solid var(--toy-border);border-radius:8px;background:white;padding:3px 22px 3px 7px;font-weight:800;text-transform:capitalize}.haiku{--model:#f5c84c}.sonnet{--model:#65c5b4}.opus{--model:#ef766f}.fable{--model:#9e87dc}.agent{background:color-mix(in srgb,var(--model) 22%,white)}.badge{justify-self:start;border:1.5px solid var(--toy-border);border-radius:999px;padding:3px 7px;font-size:.63rem;text-transform:uppercase;background:white}.badge.good{background:#d9ef9f}.badge.bad{background:#ffd1a8}.badge.expensive{background:#efc2d7}.cost{position:relative;display:flex;justify-content:flex-end;align-items:center;min-height:27px;overflow:hidden;border:1.5px solid var(--toy-border);border-radius:6px;background:white}.cost i{position:absolute;inset:0 auto 0 0;background:var(--model);transition:width .25s}.cost strong{position:relative;padding:0 6px}.toycard__foot{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.toycard__foot div{display:grid}.toycard__foot span{font-size:.62rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.toycard__foot strong{font-size:1.15rem}.total{color:var(--toy-green-ink)}@media(max-width:650px){.toycard__head{align-items:flex-start;gap:8px}.reset{font-size:.7rem}.toycard__foot{grid-template-columns:1fr}}
</style>
