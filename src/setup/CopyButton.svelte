<script lang="ts">
  import { onDestroy } from "svelte";
  import type { SetupRecipe } from "./recipes.js";

  interface Props {
    recipe?: SetupRecipe;
    compact?: boolean;
    snippet?: string;
    title?: string;
    caveat?: string;
    id?: string;
  }
  let {
    recipe,
    compact = false,
    snippet = "",
    title = "command",
    caveat = "",
    id = "command",
  }: Props = $props();
  const resolvedSnippet = $derived(recipe?.snippet ?? snippet);
  const resolvedTitle = $derived(recipe?.title ?? title);
  const resolvedCaveat = $derived(recipe?.caveat ?? caveat);
  const resolvedId = $derived(recipe?.id ?? id);
  let copied = $state(false);
  let unavailable = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copySnippet() {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      unavailable = true;
      return;
    }
    try {
      await navigator.clipboard.writeText(resolvedSnippet);
      copied = true;
      unavailable = false;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => (copied = false), 1500);
    } catch {
      unavailable = true;
    }
  }

  onDestroy(() => {
    if (resetTimer) clearTimeout(resetTimer);
  });
</script>

<div class:compact class="copy-recipe" data-recipe-id={resolvedId}>
  <div class="snippet-row">
    <pre><code>{resolvedSnippet}</code></pre>
    <button type="button" onclick={copySnippet} aria-label={`Copy ${resolvedTitle} setup snippet`}>
      {copied ? "Copied ✓" : unavailable ? "Copy unavailable" : "Copy"}
    </button>
  </div>
  {#if resolvedCaveat}<small>{resolvedCaveat}</small>{/if}
</div>

<style>
  .copy-recipe { min-width: 0; margin: .7rem 0; color: var(--ink, #20201e); }
  .snippet-row { display: flex; align-items: stretch; min-width: 0; border: 1px solid var(--line, #d9d6ca); border-radius: 9px; background: var(--panel-2, #f7f6f0); overflow: hidden; }
  pre { flex: 1 1 auto; min-width: 0; max-height: 9rem; margin: 0; padding: .55rem .65rem; overflow: auto; white-space: pre; }
  code { font: 500 .7rem/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  button { flex: 0 0 auto; align-self: stretch; border: 0; border-left: 1px solid var(--line, #d9d6ca); padding: .45rem .65rem; background: var(--panel, #fffef9); color: inherit; cursor: pointer; font: 700 .7rem/1 var(--font-body); }
  button:hover, button:focus-visible { background: #fff2b8; }
  small { display: block; margin-top: .35rem; color: var(--ink-soft, #67645c); font: 500 .68rem/1.4 var(--font-body); }
  .compact { margin: .45rem 0 .7rem; }
  .compact pre { max-height: 5.5rem; padding-block: .4rem; }
  @media (max-width: 520px) {
    .snippet-row { flex-direction: column; }
    button { align-self: auto; border-left: 0; border-top: 1px solid var(--line, #d9d6ca); min-height: 2rem; }
  }
</style>
