<script lang="ts">
  import type { Model } from "../engine/types.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";
  import { MACRO_ROUTES, priceTaskChoice, taskChoiceBuckets, totalMacroRoutes, verdictForChoice } from "./macroPricing.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  let selected = $state(0);
  const route = $derived(MACRO_ROUTES[selected]);
  const cards = $derived(models.map((model) => ({ model, usd: priceTaskChoice(route, model, route.effort), verdict: verdictForChoice(route, model, route.effort) })));
  const baseline = totalMacroRoutes(false);
  const routed = totalMacroRoutes(true);
  const saved = baseline - routed;
  const rawRows = $derived(MACRO_ROUTES.map((item): RawTurn => {
    const buckets = taskChoiceBuckets(item, item.effort);
    return { label: `${item.task} · ${item.model}`, messagesTok: buckets.cacheWrite, cacheWrite: buckets.cacheWrite, output: buckets.output };
  }));
  const money = (value: number) => value < .01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  const verdictLabel = (verdict: "good" | "bad" | "expensive") => verdict === "good" ? "recommended fit" : verdict === "bad" ? "underpowered" : "expensive";
</script>

<article class="rate-card toycard" data-testid="route-rate-card-widget">
  <header class="toycard__head toycard__head--blue">
    <div><small class="toy-eyebrow">ONE TASK · FOUR RATE CARDS</small><strong class="toy-title">Route before you spend</strong></div>
    <RawDataModal title="Modeled seven-task route rate cards" provenance={{ real: false, source: "src/article/macroPricing.ts engine model" }} rows={rawRows} />
  </header>
  <div class="task-tabs" aria-label="Choose task">
    {#each MACRO_ROUTES as item, index}<button class="toy-btn" class:active={selected === index} onclick={() => selected = index}>{item.task}</button>{/each}
  </div>
  <div class="route-copy"><strong>{route.task}</strong><span>{route.judgment}</span><small>Recommended: {route.model} · {route.effort}</small></div>
  <div class="rates">
    {#each cards as card}
      <article class={card.verdict}>
        <small>{card.model}</small><strong class="toy-num">{money(card.usd)}</strong><span>{verdictLabel(card.verdict)}</span>
      </article>
    {/each}
  </div>
  <p class="toycard__note">Same {route.task.toLowerCase()} token workload and {route.effort} effort on every card. Only the model rate changes; the verdict also checks the route's recommended capability.</p>
  <footer class="toycard__foot">
    <div><span>All-Opus baseline</span><strong class="toy-num">{money(baseline)}</strong></div><b>→</b>
    <div><span>Right-sized route</span><strong class="toy-num" data-testid="ratecard-routed-total" data-value={routed}>{money(routed)}</strong></div>
    <div class="toy-delta"><span>saved</span><strong class="toy-num" data-testid="ratecard-saved" data-value={saved}>{money(saved)}</strong></div>
  </footer>
</article>

<style>
  .task-tabs{display:flex;flex-wrap:wrap;gap:var(--sp-2);padding:14px 18px}.task-tabs button{padding:6px 10px}.task-tabs button.active{background:var(--toy-ink-2);color:var(--toy-paper)}.route-copy{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:var(--sp-3);padding:0 18px 14px}.route-copy>strong{font-family:var(--font-display);font-size:1.25rem}.route-copy>span{font-size:var(--fs-body)}.route-copy>small{font-weight:850;text-transform:capitalize}.rates{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-2);padding:0 18px 18px}.rates article{display:grid;gap:var(--sp-1);padding:12px;border:var(--toy-border-w) solid var(--toy-border);border-radius:var(--toy-radius-sm);background:var(--toy-cream)}.rates article.good{background:var(--toy-green-soft)}.rates article.bad{background:var(--toy-red-soft)}.rates article.expensive{background:var(--toy-cream-2)}.rates small{font-weight:950;text-transform:capitalize}.rates strong{font-size:1.2rem}.rates span{font-size:10px;font-weight:850;text-transform:uppercase}
  @media(max-width:640px){.task-tabs,.rates{padding-inline:12px}.route-copy{grid-template-columns:1fr;padding-inline:12px}.rates{grid-template-columns:1fr 1fr}}
</style>
