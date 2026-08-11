<script lang="ts">
  import { onMount } from "svelte";
  import { CONFIG_HELP, impactPct as computedImpact, type ConfigHelpId } from "./configHelp.js";

  let { configId, impactPct }: { configId: ConfigHelpId; impactPct?: number } = $props();
  let open = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let dialog = $state<HTMLElement>();
  const instance = {};
  const content = $derived(CONFIG_HELP[configId]);
  const impact = $derived(impactPct ?? computedImpact(configId));

  onMount(() => {
    const closeOther = (event: Event) => {
      if ((event as CustomEvent).detail !== instance) open = false;
    };
    window.addEventListener("config-help-open", closeOther);
    return () => window.removeEventListener("config-help-open", closeOther);
  });

  function show(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    window.dispatchEvent(new CustomEvent("config-help-open", { detail: instance }));
    open = true;
    queueMicrotask(() => dialog?.querySelector<HTMLButtonElement>(".close")?.focus());
  }

  function close(restoreFocus = true) {
    open = false;
    if (restoreFocus) queueMicrotask(() => trigger?.focus());
  }

  function handleKeys(event: KeyboardEvent) {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab" || !dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
</script>

<button bind:this={trigger} class="help-trigger" type="button" aria-label={`Help: ${content.title}`} onclick={show}>?</button>

{#if open}
  <div class="overlay">
    <button class="backdrop" type="button" aria-label="Close help" onclick={() => close()}></button>
    <div bind:this={dialog} class="dialog" role="dialog" aria-modal="true" aria-label={content.title} tabindex="-1" onkeydown={handleKeys}>
      <button class="close" type="button" aria-label="Close help" onclick={() => close()}>×</button>
      <h2>{content.title}</h2>
      <h3>What it does</h3>
      <p>{content.what}</p>
      <h3>How it affects your cache</h3>
      <p>{content.how}</p>
      {#if impact !== undefined}
        <p class="impact">Typical impact: ~{impact}% cheaper conversations</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .help-trigger{display:inline-grid;place-items:center;width:18px;height:18px;margin-left:4px;padding:0;border:1.5px solid currentColor;border-radius:50%;background:transparent;color:inherit;font:800 11px/1 var(--font-body);vertical-align:middle;cursor:pointer}.help-trigger:hover,.help-trigger:focus-visible{background:#fff2bd;outline:2px solid #2f7750;outline-offset:2px}.overlay{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:16px}.backdrop{position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:rgba(23,20,17,.72);cursor:default}.dialog{position:relative;width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:26px;background:var(--paper,#fffdf7);color:var(--ink,#292722);border:2px solid currentColor;border-radius:16px;box-shadow:7px 8px 0 rgba(0,0,0,.3);font-family:var(--font-body)}.close{position:absolute;top:10px;right:11px;width:30px;height:30px;padding:0;border:1.5px solid currentColor;border-radius:50%;background:#fff;font-size:22px;line-height:1;cursor:pointer}.dialog h2{margin:0 38px 18px 0;font-size:24px}.dialog h3{margin:14px 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase}.dialog p{margin:0;line-height:1.55}.impact{margin-top:20px!important;padding:12px 14px;border:2px solid #2f7750;border-radius:10px;background:#edf8ee;color:#205f40;font-weight:850}@media(max-width:560px){.overlay{padding:10px}.dialog{max-height:calc(100vh - 20px);padding:22px 18px}.dialog h2{font-size:21px}}
</style>
