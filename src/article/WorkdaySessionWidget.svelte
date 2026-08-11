<script lang="ts">
  import { MODEL_IN, RATE } from "../engine/pricing.js";
  import { SCENARIO_BY_ID, priceScenario, type ScenarioId } from "../sim/scenarios.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import type { RawTurn } from "../sim/captures/realSegments.js";

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
  const rawRows = $derived(giant.messages.flatMap((message, index): RawTurn[] => {
    const scopedMessage = scoped.messages[index];
    const turn = index + 1;
    return [
      { label: `Turn ${turn} · giant`, messagesTok: message.buckets.prefix.tokens, cacheWrite: message.warm ? 0 : message.buckets.prefix.tokens, cacheRead: message.warm ? message.buckets.prefix.tokens : 0, freshInput: message.buckets.workIn.tokens, output: message.buckets.output.tokens },
      { label: `Turn ${turn} · scoped`, messagesTok: scopedMessage.buckets.prefix.tokens, cacheWrite: scopedMessage.warm ? 0 : scopedMessage.buckets.prefix.tokens, cacheRead: scopedMessage.warm ? scopedMessage.buckets.prefix.tokens : 0, freshInput: scopedMessage.buckets.workIn.tokens, output: scopedMessage.buckets.output.tokens },
    ];
  }));

  function money(value: number) {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }
</script>

<div class="workday toycard" data-testid="workday-session-widget">
  <header class="toycard__head toycard__head--green">
    <div><small class="toy-eyebrow">THE BILL, TURN BY TURN</small><strong class="toy-title">How fast does the backpack compound?</strong></div>
    <label>Workday
      <select class="toy-select" bind:value={scenarioId} aria-label="Workday scenario">
        {#each options as option}<option value={option.id}>{option.label}</option>{/each}
      </select>
    </label>
    <RawDataModal title={`Modeled workday · ${scenario.title}`} provenance={{ real: false }} rows={rawRows} />
  </header>

  <div class="legend toy-legend">
    <span><i class="toy-swatch write"></i>One 1M Opus session</span>
    <span><i class="toy-swatch read"></i>Scenario-sized agent</span>
  </div>
  <div class="chart" aria-label={`Cumulative cost for ${scenario.title}`}>
    {#each rows as row, index}
      <div class="turn">
        <small>{index + 1}</small>
        <div class="bars">
          <i class="giant-bar toy-bar__seg write" style={`width:${(row.giantUsd / maximum) * 100}%`}></i>
          <i class="scoped-bar toy-bar__seg read" style={`width:${(row.scopedUsd / maximum) * 100}%`}></i>
        </div>
        <span>{row.atMin}m</span>
      </div>
    {/each}
  </div>
  <footer class="toycard__foot">
    <div><span>Giant default</span><strong data-testid="workday-giant-total" data-value={giant.totalUsd}>{money(giant.totalUsd)}</strong></div>
    <b>→</b>
    <div class="after"><span>Scoped route</span><strong data-testid="workday-scoped-total" data-value={scoped.totalUsd}>{money(scoped.totalUsd)}</strong></div>
    <div class="saving toy-delta"><span>saved</span><strong>{money(saving)}</strong></div>
  </footer>
  <p class="toycard__note">The first giant turn alone writes 1,000,000 tokens × {RATE.w1h} × ${MODEL_IN.opus}/M. Later turns still read that full prefix; the green line runs the same script with the scenario's {scenario.defaults.prefixTok.toLocaleString()}-token, {scenario.defaults.model} backpack.</p>
</div>

<style>
  .workday label{display:grid;gap:2px;font-size:.6rem;font-weight:850;text-transform:uppercase}.workday select{max-width:150px}.legend{padding:12px 18px 5px}.chart{display:grid;gap:7px;padding:12px 18px 17px}.turn{display:grid;grid-template-columns:20px minmax(0,1fr) 30px;align-items:center;gap:8px}.turn>small,.turn>span{font:700 .62rem var(--font-body);color:var(--toy-muted)}.turn>span{text-align:right}.bars{display:grid;gap:2px;min-width:0}.bars i{height:5px;border:1px solid var(--toy-border);border-radius:4px}.bars .giant-bar{background:var(--toy-red-2)}.bars .scoped-bar{background:var(--toy-green)}.workday footer strong{font-size:1.15rem;color:var(--toy-red-deep)}.workday footer .after strong{color:var(--toy-green-ink)}
  @media(max-width:620px){.workday header strong{font-size:.94rem}.chart{padding-inline:12px}.workday>p{font-size:.7rem}}
</style>
