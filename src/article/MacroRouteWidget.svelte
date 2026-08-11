<script lang="ts">
  import { priceMacroRoutes, totalMacroRoutes } from "./macroPricing.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";

  let routed = $state(true);
  const priced = $derived(priceMacroRoutes(routed));
  const total = $derived(priced.reduce((sum, route) => sum + route.usd, 0));
  const defaultTotal = totalMacroRoutes(false);
  const routedTotal = totalMacroRoutes(true);
  const saved = defaultTotal - routedTotal;
  const effortScale = { low: .7, medium: 1, high: 1.35 } as const;
  const outputScale = { low: .65, medium: 1, high: 1.45 } as const;
  const rawRows = $derived(priced.map((route, index): RawTurn => {
    const fresh = Math.round(route.input * effortScale[route.activeEffort]);
    return { label: route.task, messagesTok: routed ? undefined : 1_000_000, cacheWrite: routed ? fresh : index === 0 ? 1_000_000 : 0, cacheRead: routed || index === 0 ? 0 : 1_000_000, freshInput: routed ? 0 : fresh, output: Math.round(route.output * outputScale[route.activeEffort]) };
  }));

  function money(value: number) {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }
</script>

<div class="router toycard" data-testid="macro-route-widget">
  <div class="toolbar toycard__head toycard__head--blue">
    <div>
      <small class="toy-eyebrow">7 TASK WORKDAY</small>
      <strong class="toy-title">{routed ? "Route by job" : "All-default baseline"}</strong>
    </div>
    <button class:on={routed} onclick={() => routed = !routed} aria-label="Toggle routed workload">
      <i></i>
    </button>
    <RawDataModal title="Modeled seven-task routing" provenance={{ real: false }} rows={rawRows} />
  </div>

  <div class="routes">
    {#each priced as route}
      <div class="route">
        <span>{route.task}</span>
        <b>{route.activeModel}</b>
        <small>{route.activeEffort} effort</small>
        <strong class="toy-num">{money(route.usd)}</strong>
      </div>
    {/each}
  </div>

  <footer class="toycard__foot">
    <div class="comparison"><span>Before · all default</span><strong>{money(defaultTotal)}</strong></div>
    <div class="arrow">→</div>
    <div class="comparison after"><span>After · right-sized</span><strong>{money(routedTotal)}</strong></div>
    <div class="saving toy-delta"><span>saved</span><strong>{money(saved)}</strong></div>
    <strong class="test-total" data-testid="macro-total" data-value={total}>{money(total)}</strong>
  </footer>
</div>

<style>
  .toolbar{gap:20px;padding:16px 18px}.toolbar button{width:50px;height:29px;padding:3px;border:var(--toy-border-w) solid var(--toy-border);border-radius:99px;background:var(--toy-toggle-off);cursor:pointer}.toolbar button.on{background:var(--toy-green)}.toolbar i{display:block;width:18px;height:18px;border:1px solid var(--toy-border);border-radius:50%;background:var(--toy-paper);transition:transform .2s}.toolbar button.on i{transform:translateX(19px)}
  .routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px}.route{display:grid;grid-template-columns:minmax(90px,1fr) 70px 82px 58px;align-items:center;gap:8px;padding:11px 5px;border-bottom:1px dashed var(--toy-dash)}.route:nth-last-child(-n+2){border-bottom:0}.route>b{text-transform:capitalize}.route small{color:var(--toy-muted)}.route>strong{text-align:right;font-size:inherit}
  footer{padding:14px 18px}.comparison{display:grid;gap:2px}.comparison span,.saving span{font-size:.68rem;letter-spacing:.05em}.comparison strong{font-size:1.2rem;color:var(--toy-red-deep)}.comparison.after strong{color:var(--toy-green-ink)}.saving{padding:7px 10px;border-radius:10px}.saving strong{font-size:1.05rem}.test-total{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  @media(max-width:720px){.routes{grid-template-columns:1fr}.route:nth-last-child(2){border-bottom:1px dashed var(--toy-dash)}.route{grid-template-columns:minmax(78px,1fr) 60px 72px 50px;font-size:.82rem}.route small{font-size:.7rem}.comparison strong{font-size:1rem}}
</style>
