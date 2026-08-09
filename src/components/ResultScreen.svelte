<script lang="ts">
  import { LEVEL_BY_ID, LEVEL_ORDER, type LevelId } from "../game/levels.js";
  import { totalSpent } from "../game/step.js";
  import type { LevelOutcome } from "../game/shell.js";

  let {
    level,
    outcome,
    onnext,
    onretry,
    onmap,
  }: {
    level: LevelId;
    outcome: LevelOutcome;
    onnext: () => void;
    onretry: () => void;
    onmap: () => void;
  } = $props();

  const def = $derived(LEVEL_BY_ID[level]);
  const idx = $derived(LEVEL_ORDER.indexOf(level));
  const nextId = $derived(idx >= 0 && idx + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[idx + 1] : null);
  const spent = $derived(totalSpent(outcome.finalState));
</script>

<div class="card">
  {#if outcome.pass}
    <p class="sub" style="margin-top:0">{def.id} - RESULT</p>
    <h1 style="margin-top:0; color: var(--good)">Passed - {"★".repeat(outcome.stars)}{"☆".repeat(3 - outcome.stars)}</h1>
    <p class="lead">
      Spent <b>${spent.toFixed(2)}</b>{def.budgetUsd !== Infinity ? ` of a $${def.budgetUsd.toFixed(2)} budget` : ""}.
      {outcome.handCoded > 0 ? `${outcome.handCoded} unit(s) hand-coded.` : "Nothing hand-coded."}
    </p>
    <p class="msg">{outcome.reason}</p>
    {#if level === "L2"}
      <p class="msg chip">
        {outcome.finalState.l2Profile === "coffee"
          ? "Coffee finished at minute 110 and saved $0.1980066 versus Standup."
          : "Standup finished at minute 90 with 20 min of release-deadline slack."}
      </p>
    {/if}
    <p class="sub">{def.teaches}</p>

    <div class="row-btns">
      <button class="btn ghost" onclick={onmap}>Back to map</button>
      {#if nextId}
        <button class="btn" onclick={onnext}>Next: {nextId}</button>
      {:else}
        <button class="btn" onclick={onmap}>Campaign complete</button>
      {/if}
    </div>
  {:else}
    <p class="sub" style="margin-top:0">{def.id} - RESULT</p>
    <h1 style="margin-top:0; color: var(--bad)">Failed</h1>
    <p class="lead">{outcome.reason}</p>
    <div class="msg chip">
      <b>{def.failLesson.cite}</b> - {def.failLesson.line}
    </div>
    <p class="sub">Spent ${spent.toFixed(2)}{def.budgetUsd !== Infinity ? ` of $${def.budgetUsd.toFixed(2)}` : ""}.</p>

    <div class="row-btns">
      <button class="btn ghost" onclick={onmap}>Back to map</button>
      <button class="btn" onclick={onretry}>Retry</button>
    </div>
  {/if}
</div>
