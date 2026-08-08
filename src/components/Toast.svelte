<script lang="ts">
  // Toast.svelte - L1_REDESIGN Section 4's one-line in-play callouts. Function
  // over form per the implementer notes: a fixed-position div, one at a time,
  // dismissible, auto-clears after a few seconds.
  let { text, onclose }: { text: string | null; onclose: () => void } = $props();

  let timer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    if (timer) clearTimeout(timer);
    if (text) timer = setTimeout(onclose, 7000);
    return () => {
      if (timer) clearTimeout(timer);
    };
  });
</script>

{#if text}
  <button type="button" class="toast" onclick={onclose}>
    <span class="arrow">^</span>
    {text}
  </button>
{/if}

<style>
  .toast {
    appearance: none; font-family: inherit; text-align: left;
    position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
    max-width: min(560px, 92vw); background: var(--panel); color: var(--ink);
    border: 1px solid var(--accent); border-radius: 10px; padding: 10px 14px;
    font-size: 12.5px; box-shadow: 0 8px 24px rgba(0,0,0,.28); cursor: pointer;
    z-index: 40;
  }
  .arrow { color: var(--ink-soft); margin-right: 4px; }
</style>
