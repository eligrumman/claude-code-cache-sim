<script lang="ts">
  // ChoiceBar.svelte - L1_REDESIGN Section 6: replaces the config strip for
  // L1. The level's one mechanic - WHEN to take the standup - lives here as
  // three buttons. Coffee is a pseudo-unit (ADVANCE 20), not a queue item
  // (Section 7 gap #3).
  let {
    tasksLeft,
    standupDone,
    disabled,
    ontask,
    oncoffee,
    onstandup,
  }: {
    tasksLeft: number;
    standupDone: boolean;
    disabled: boolean;
    ontask: () => void;
    oncoffee: () => void;
    onstandup: () => void;
  } = $props();
</script>

<div class="choicebar">
  <button class="btn" disabled={disabled || tasksLeft === 0} onclick={ontask}>
    Do next task {tasksLeft > 0 ? `(${tasksLeft} left)` : ""}
  </button>
  <button class="btn ghost" disabled={disabled} onclick={oncoffee}>Coffee - 20 min</button>
  <button class="btn ghost" disabled={disabled || standupDone} onclick={onstandup}>
    Standup - 90 min{standupDone ? " (done)" : ""}
  </button>
</div>

<style>
  .choicebar { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
</style>
