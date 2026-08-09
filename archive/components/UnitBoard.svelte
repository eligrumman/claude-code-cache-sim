<script lang="ts">
  import type { UnitInstance } from "../game/types.js";
  let { units, idx }: { units: UnitInstance[]; idx: number } = $props();

  function cls(u: UnitInstance, i: number): string {
    let c = "unit";
    if (u.status === "done") c += " done";
    else if (u.status === "handcoded") c += " hand";
    else if (i === idx) c += " active";
    if (u.cause) c += " rework";
    return c;
  }
</script>

<div class="board">
  {#each units as u, i}
    <span class={cls(u, i)}><i class="dot"></i>{u.label || u.kind}</span>
  {/each}
</div>
