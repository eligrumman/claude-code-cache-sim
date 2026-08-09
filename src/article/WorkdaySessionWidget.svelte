<script lang="ts">
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import { SCENARIO_BY_ID, priceScenario, type ScenarioId } from "../sim/scenarios.js";

  const options: { id: ScenarioId; label: string }[] = [
    { id: "ship-feature", label: "Ship feature" },
    { id: "refactor-moar", label: "Big refactor" },
    { id: "debug-prod", label: "Prod incident" },
  ];
  let scenarioId = $state<ScenarioId>("ship-feature");
  const scenario = $derived(SCENARIO_BY_ID[scenarioId]);
  const giant = $derived(priceScenario(scenario, {
    model: "opus",
    ttl: "1h",
    prefixTok: 1_000_000,
    keepWarm: false,
  }));
  const scoped = $derived(priceScenario(scenario, {
    ...scenario.defaults,
    ttl: "1h",
    keepWarm: false,
  }));
  const rows = $derived(giant.messages.map((message, index) => {
    const giantUsd = giant.messages.slice(0, index + 1).reduce((sum, entry) => sum + entry.usd, 0);
    const scopedUsd = scoped.messages.slice(0, index + 1).reduce((sum, entry) => sum + entry.usd, 0);
    return { id: message.id, atMin: message.atMin, giantUsd, scopedUsd };
  }));
  const maximum = $derived(Math.max(giant.totalUsd, 0.0001));
  const saving = $derived(giant.totalUsd - scoped.totalUsd);

  function money(value: number) {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }
</script>

<div class="workday" data-testid="workday-session-widget">
  <header>
    <div><small>THE BILL, TURN BY TURN</small><strong>How fast does the backpack compound?</strong></div>
    <label>Workday
      <select bind:value={scenarioId} aria-label="Workday scenario">
        {#each options as option}<option value={option.id}>{option.label}</option>{/each}
      </select>
    </label>
  </header>

  <div class="legend">
    <span class="giant">One 1M Opus session</span>
    <span class="scoped">Scenario-sized agent</span>
  </div>
  <div class="chart" aria-label={`Cumulative cost for ${scenario.title}`}>
    {#each rows as row, index}
      <div class="turn">
        <small>{index + 1}</small>
        <div class="bars">
          <i class="giant-bar" style={`width:${(row.giantUsd / maximum) * 100}%`}></i>
          <i class="scoped-bar" style={`width:${(row.scopedUsd / maximum) * 100}%`}></i>
        </div>
        <span>{row.atMin}m</span>
      </div>
    {/each}
  </div>
  <footer>
    <div><span>Giant default</span><strong data-testid="workday-giant-total" data-value={giant.totalUsd}>{money(giant.totalUsd)}</strong></div>
    <b>→</b>
    <div class="after"><span>Scoped route</span><strong data-testid="workday-scoped-total" data-value={scoped.totalUsd}>{money(scoped.totalUsd)}</strong></div>
    <div class="saving"><span>saved</span><strong>{money(saving)}</strong></div>
  </footer>
  <p>The first giant turn alone writes 1,000,000 tokens × {RATE.w1h} × ${MODEL_IN.opus}/M. Later turns still read that full prefix; the green line runs the same script with the scenario's {scenario.defaults.prefixTok.toLocaleString()}-token, {scenario.defaults.model} backpack.</p>
</div>

<style>
  .workday{border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d}.workday>header{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:15px 18px;background:#e7f8ee;border-bottom:2px solid #20201d}.workday>header div{display:grid;gap:3px}.workday header small{font-size:.65rem;font-weight:950;letter-spacing:.11em}.workday header strong{font-size:1.08rem}.workday label{display:grid;gap:2px;font-size:.6rem;font-weight:850;text-transform:uppercase}.workday select{max-width:150px;border:1.5px solid #20201d;border-radius:7px;background:#fff;padding:5px 7px;font:750 .78rem system-ui}.legend{display:flex;flex-wrap:wrap;gap:16px;padding:12px 18px 5px;font:.7rem/1.2 system-ui}.legend span::before{content:"";display:inline-block;width:12px;height:7px;margin-right:5px;border:1px solid #20201d;border-radius:3px}.legend .giant::before{background:#e57970}.legend .scoped::before{background:#62d39a}.chart{display:grid;gap:7px;padding:12px 18px 17px}.turn{display:grid;grid-template-columns:20px minmax(0,1fr) 30px;align-items:center;gap:8px}.turn>small,.turn>span{font:700 .62rem system-ui;color:#716c62}.turn>span{text-align:right}.bars{display:grid;gap:2px;min-width:0}.bars i{display:block;min-width:2px;height:5px;border:1px solid #20201d;border-radius:4px;transition:width .2s}.giant-bar{background:#e57970}.scoped-bar{background:#62d39a}.workday footer{display:grid;grid-template-columns:1fr auto 1fr auto;align-items:center;gap:12px;padding:13px 18px;border-top:2px solid #20201d;background:#fff9db}.workday footer div{display:grid;gap:2px}.workday footer span{font-size:.67rem;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.workday footer strong{font-size:1.15rem;color:#9a2d24}.workday footer .after strong,.workday footer .saving{color:#126536}.workday footer .saving{padding:6px 9px;border:2px solid #126536;border-radius:9px;background:#c8f5d9}.workday>p{margin:0;padding:11px 18px;border-top:1px dashed #aaa398;font:.76rem/1.45 system-ui}
  @media(max-width:620px){.workday>header{align-items:center}.workday header strong{font-size:.94rem}.workday footer{grid-template-columns:1fr auto 1fr}.workday footer .saving{grid-column:1/-1;text-align:center}.legend{gap:9px}.chart{padding-inline:12px}.workday>p{font-size:.7rem}}
</style>
