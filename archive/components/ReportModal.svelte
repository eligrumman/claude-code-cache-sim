<script lang="ts">
  import type { GameState } from "../game/types.js";
  import { buildReport } from "../game/report.js";

  let {
    st,
    onagain,
    onweek,
  }: { st: GameState; onagain: () => void; onweek: () => void } = $props();

  const rep = $derived(buildReport(st));
</script>

<div class="scrim on" onclick={(e) => { if (e.target === e.currentTarget) onagain(); }}
  onkeydown={() => {}} role="presentation">
  <div class="modal" role="dialog" aria-modal="true" aria-label="Run report">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
      <span class="grade {rep.grade}">{rep.grade}</span>
      <div>
        <h3 style="margin:0">{rep.title}</h3>
        <p class="lead" style="margin:2px 0 0">{rep.lead}</p>
      </div>
    </div>

    <pre class="report">{rep.pre}</pre>

    <div class="hidden-block">
      <h4>What the UI never told you</h4>
      <div class="hl">
        {#each rep.hiddenRows as row}
          <div class="r">
            <span>
              <a href={row.href} target="_blank" rel="noopener">{row.label}</a>
              <span style="color:var(--ink-faint)">({row.note})</span>
            </span>
            <span class="amt">${row.amount.toFixed(2)}</span>
          </div>
        {/each}
        <div class="r tot">
          <span>hidden total = {rep.handCodedHrs} h Bob hand-coded because of this</span>
          <span class="amt">${rep.hiddenTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <p class="cta">
      This report format is real. Run it on your own machine:<br />
      <code>python3 cache_diagnose.py</code>
    </p>

    <div class="row-btns">
      <button class="btn" onclick={onagain}>Play again</button>
      {#if rep.offerWeek}
        <button class="btn ghost" onclick={onweek}>Try a full week (overnight expiry bites)</button>
      {/if}
    </div>
  </div>
</div>
