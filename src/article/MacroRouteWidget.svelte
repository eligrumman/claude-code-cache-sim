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

<div class="router" data-testid="macro-route-widget">
  <div class="toolbar">
    <div>
      <small>7 TASK WORKDAY</small>
      <strong>{routed ? "Route by job" : "All-default baseline"}</strong>
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
        <strong>{money(route.usd)}</strong>
      </div>
    {/each}
  </div>

  <footer>
    <div class="comparison"><span>Before · all default</span><strong>{money(defaultTotal)}</strong></div>
    <div class="arrow">→</div>
    <div class="comparison after"><span>After · right-sized</span><strong>{money(routedTotal)}</strong></div>
    <div class="saving"><span>saved</span><strong>{money(saved)}</strong></div>
    <strong class="test-total" data-testid="macro-total" data-value={total}>{money(total)}</strong>
  </footer>
</div>

<style>
  .router{border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d}
  .toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 18px;background:#eaf5ff;border-bottom:2px solid #20201d}.toolbar div{display:grid;gap:3px}.toolbar small{font-size:.66rem;font-weight:900;letter-spacing:.12em}.toolbar strong{font-size:1.1rem}.toolbar button{width:50px;height:29px;padding:3px;border:2px solid #20201d;border-radius:99px;background:#f08080;cursor:pointer}.toolbar button.on{background:#62d39a}.toolbar i{display:block;width:18px;height:18px;border:1px solid #20201d;border-radius:50%;background:white;transition:transform .2s}.toolbar button.on i{transform:translateX(19px)}
  .routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px}.route{display:grid;grid-template-columns:minmax(90px,1fr) 70px 82px 58px;align-items:center;gap:8px;padding:11px 5px;border-bottom:1px dashed #bbb7ac}.route:nth-last-child(-n+2){border-bottom:0}.route>b{text-transform:capitalize}.route small{color:#716c62}.route>strong{text-align:right}
  footer{display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:12px;padding:14px 18px;border-top:2px solid #20201d;background:#fff9db}.comparison{display:grid;gap:2px}.comparison span,.saving span{font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.comparison strong{font-size:1.2rem;color:#9a2d24}.comparison.after strong{color:#126536}.arrow{font-weight:950}.saving{display:grid;padding:7px 10px;border:2px solid #126536;border-radius:10px;background:#c8f5d9;color:#126536}.saving strong{font-size:1.05rem}.test-total{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  @media(max-width:720px){.routes{grid-template-columns:1fr}.route:nth-last-child(2){border-bottom:1px dashed #bbb7ac}.route{grid-template-columns:minmax(78px,1fr) 60px 72px 50px;font-size:.82rem}.route small{font-size:.7rem}footer{grid-template-columns:1fr auto 1fr}.saving{grid-column:1/-1;text-align:center}.comparison strong{font-size:1rem}}
</style>
