<script lang="ts">
  import type { Model } from "../engine/types.js";
  import {
    MACRO_ROUTES,
    priceTaskChoice,
    verdictForChoice,
    type Effort,
  } from "./macroPricing.js";

  const models: Model[] = ["haiku", "sonnet", "opus", "fable"];
  const efforts: Effort[] = ["low", "medium", "high"];
  let choices = $state(MACRO_ROUTES.map((route) => ({ model: route.model, effort: route.effort })));

  function money(value: number) {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }
</script>

<div class="picker" data-testid="macro-task-picker">
  <header><small>TRY THE ROUTES</small><strong>Seven jobs. Four brains. Your call.</strong></header>
  <div class="rows">
    {#each MACRO_ROUTES as route, index}
      {@const choice = choices[index]}
      {@const usd = priceTaskChoice(route, choice.model, choice.effort)}
      {@const verdict = verdictForChoice(route, choice.model, choice.effort)}
      <div class="task" data-task={route.task.toLowerCase().replace(" ", "-")}>
        <b>{route.task}</b>
        <label>Model
          <select bind:value={choice.model} aria-label={`${route.task} model`}>
            {#each models as model}<option value={model}>{model}</option>{/each}
          </select>
        </label>
        <label>Effort
          <select bind:value={choice.effort} aria-label={`${route.task} effort`}>
            {#each efforts as effort}<option value={effort}>{effort}</option>{/each}
          </select>
        </label>
        <strong class="money" data-value={usd}>{money(usd)}</strong>
        <span class:good={verdict === "good"} class:bad={verdict === "bad"} class:expensive={verdict === "expensive"} data-testid="route-verdict">
          {verdict === "good" ? "good · right-sized" : verdict === "bad" ? "bad · likely underpowered" : "expensive · more than this needs"}
        </span>
        <p><em>{route.judgment}.</em> {verdict === "good" ? route.fit : verdict === "bad" ? route.underpowered : route.overkill}</p>
      </div>
    {/each}
  </div>
  <p>These are teaching-sized jobs, not a promise about quality. The verdict compares your choice with the route each job actually needs.</p>
</div>

<style>
  .picker{border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d}.picker>header{display:grid;gap:4px;padding:16px 18px;background:#eaf5ff;border-bottom:2px solid #20201d}.picker>header small{font-size:.66rem;font-weight:950;letter-spacing:.12em}.picker>header strong{font-size:1.1rem}.rows{padding:8px 14px}.task{display:grid;grid-template-columns:minmax(92px,1fr) 105px 105px 70px minmax(165px,1fr);gap:8px 10px;align-items:end;padding:11px 4px;border-bottom:1px dashed #bbb7ac}.task:last-child{border-bottom:0}.task label{display:grid;gap:2px;font-size:.6rem;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.task select{min-width:0;border:1.5px solid #20201d;border-radius:7px;background:#fff;padding:5px;font:750 .78rem system-ui;text-transform:capitalize}.money{text-align:right;font-variant-numeric:tabular-nums}.task span{border-radius:99px;padding:5px 8px;font:800 .69rem/1.1 system-ui;text-align:center}.task p{grid-column:1/-1;margin:0;color:#625e55;font: .72rem/1.4 system-ui}.task p em{color:#20201d;font-style:normal;font-weight:800}.good{background:#c8f5d9;color:#126536}.bad{background:#ffd0cc;color:#8c251d}.expensive{background:#fff0b3;color:#7a5600}.picker>p{margin:0;padding:12px 18px;border-top:2px solid #20201d;background:#fff9db;font: .76rem/1.4 system-ui}
  @media(max-width:720px){.task{grid-template-columns:1fr 1fr 1fr}.task>b{grid-column:1/-1}.money{text-align:left;align-self:center}.task span{grid-column:2/-1}.picker>p{font-size:.7rem}}
</style>
