<script lang="ts">
  import { priceMacroRoutes } from "./macroPricing.js";

  let routed = $state(true);
  const priced = $derived(priceMacroRoutes(routed));
  const total = $derived(priced.reduce((sum, route) => sum + route.usd, 0));

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
  </div>

  <div class="routes">
    {#each priced as route}
      <div class="route">
        <span>{route.task}</span>
        <b>{route.activeModel}</b>
        <small>{routed ? route.effort : "high"} effort</small>
        <strong>{money(route.usd)}</strong>
      </div>
    {/each}
  </div>

  <footer>
    <span>{routed ? "Scoped context per task" : "Opus-high · shared 1M context"}</span>
    <strong data-testid="macro-total" data-value={total}>{money(total)}</strong>
  </footer>
</div>

<style>
  .router{border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d}
  .toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 18px;background:#eaf5ff;border-bottom:2px solid #20201d}.toolbar div{display:grid;gap:3px}.toolbar small{font-size:.66rem;font-weight:900;letter-spacing:.12em}.toolbar strong{font-size:1.1rem}.toolbar button{width:50px;height:29px;padding:3px;border:2px solid #20201d;border-radius:99px;background:#f08080;cursor:pointer}.toolbar button.on{background:#62d39a}.toolbar i{display:block;width:18px;height:18px;border:1px solid #20201d;border-radius:50%;background:white;transition:transform .2s}.toolbar button.on i{transform:translateX(19px)}
  .routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px}.route{display:grid;grid-template-columns:minmax(90px,1fr) 70px 82px 58px;align-items:center;gap:8px;padding:11px 5px;border-bottom:1px dashed #bbb7ac}.route:nth-last-child(-n+2){border-bottom:0}.route>b{text-transform:capitalize}.route small{color:#716c62}.route>strong{text-align:right}
  footer{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-top:2px solid #20201d;background:#fff9db}footer span{font-size:.8rem;font-weight:800}footer strong{font-size:1.35rem}
  @media(max-width:720px){.routes{grid-template-columns:1fr}.route:nth-last-child(2){border-bottom:1px dashed #bbb7ac}.route{grid-template-columns:minmax(78px,1fr) 60px 72px 50px;font-size:.82rem}.route small{font-size:.7rem}}
</style>
