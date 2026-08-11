<script lang="ts">
  import { LEVELS, isLevelUnlocked, type LevelId } from "../game/levels.js";
  import type { CampaignState } from "../game/levels.js";

  let {
    campaign,
    onenter,
    onfreeplay,
  }: {
    campaign: CampaignState;
    onenter: (id: LevelId) => void;
    onfreeplay: () => void;
  } = $props();

  const tiers = [1, 2, 3] as const;
  const tierName: Record<1 | 2 | 3, string> = {
    1: "Tier 1 - Personal (Bob, one session)",
    2: "Tier 2 - Team Lead (a week)",
    3: "Tier 3 - Budget Manager (a month)",
  };
  const anyCleared = $derived(Object.values(campaign.levels).some((p) => p.stars > 0));

  function tileState(id: LevelId): "completed" | "unlocked" | "locked" {
    const unlocked = isLevelUnlocked(campaign, id);
    if (!unlocked) return "locked";
    return campaign.levels[id].stars > 0 ? "completed" : "unlocked";
  }
</script>

<div class="card">
  <h1 style="margin-top:0">The Claude Code Simulator - Campaign</h1>
  <p class="sub">
    13 levels. Each one unlocks the next config knob. Click an unlocked tile to play.
  </p>

  {#each tiers as t}
    <div class="tier-row">
      <p class="grp-h">{tierName[t]}</p>
      <div class="map-row">
        {#each LEVELS.filter((l) => l.tier === t) as l}
          {@const state = tileState(l.id)}
          <button
            class="maptile {state}"
            disabled={state === "locked"}
            onclick={() => onenter(l.id)}
            title={l.objective}
          >
            <span class="maptile-id">{l.id}</span>
            <span class="maptile-title">{l.title}</span>
            {#if state === "completed"}
              <span class="maptile-stars">{"★".repeat(campaign.levels[l.id].stars)}{"☆".repeat(3 - campaign.levels[l.id].stars)}</span>
            {:else if state === "unlocked"}
              <span class="maptile-stars new">new</span>
            {:else}
              <span class="maptile-lock" aria-hidden="true">&#128274;</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/each}

  <div class="tier-row">
    <p class="grp-h">Sandbox</p>
    <div class="map-row">
      <button class="maptile {anyCleared ? 'unlocked' : 'locked'}" disabled={!anyCleared} onclick={onfreeplay}>
        <span class="maptile-id">FP</span>
        <span class="maptile-title">Free Play</span>
        <span class="maptile-stars new">{anyCleared ? "open" : "clear L1 first"}</span>
      </button>
    </div>
  </div>
</div>

<style>
  .tier-row { margin: 18px 0; }
  .map-row { display: flex; flex-wrap: wrap; gap: 10px; }
  .maptile {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
    width: 148px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line);
    background: var(--panel-2); cursor: pointer; text-align: left; font: inherit;
  }
  .maptile.locked { opacity: 0.45; cursor: not-allowed; }
  .maptile.unlocked { border-color: var(--accent); box-shadow: var(--shadow); }
  .maptile.completed { border-color: var(--good); }
  .maptile-id { font-size: 11px; color: var(--ink-faint); letter-spacing: 0.06em; }
  .maptile-title { font-weight: 600; }
  .maptile-stars { color: var(--warn); font-size: 13px; }
  .maptile-stars.new { color: var(--good); font-size: 11px; text-transform: uppercase; }
  .maptile-lock { font-size: 14px; }
</style>
