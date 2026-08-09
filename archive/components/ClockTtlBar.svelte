<script lang="ts">
  // ClockTtlBar.svelte - L1_REDESIGN Section 5: the permanent-from-L1-on HUD
  // clock + TTL meter. Facts only (documented cache lifetimes are the spec's
  // real-world-visible carve-out, Section 8) - never advice. Pure display over
  // props; the real-time dawdle drain lives here as a local setInterval that
  // emits whole sim-minutes via `ondawdle`, batched by the caller into one
  // ADVANCE action - wall-clock time itself never touches the engine
  // (L1_REDESIGN Section 5 "Real-time drain at choice screens").
  import { onDestroy } from "svelte";
  import type { CacheEntry } from "../engine/types.js";

  let {
    clockMin,
    cacheEntry,
    running,
    ondawdle,
  }: {
    clockMin: number;
    cacheEntry: CacheEntry | undefined;
    running: boolean;
    ondawdle: (min: number) => void;
  } = $props();

  function fmtClock(min: number): string {
    const total = 9 * 60 + min; // day starts 09:00
    const h = Math.floor(total / 60) % 24;
    const m = Math.floor(total % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  const ttlLeft = $derived(cacheEntry ? cacheEntry.lastTouchMin + 60 - clockMin : null);
  const expired = $derived(ttlLeft !== null && ttlLeft <= 0);
  const pct = $derived(
    ttlLeft === null ? 0 : Math.max(0, Math.min(100, (ttlLeft / 60) * 100)),
  );
  const expiresAt = $derived(cacheEntry ? fmtClock(cacheEntry.lastTouchMin + 60) : "");
  const countdown = $derived.by(() => {
    if (ttlLeft === null) return "";
    const clamped = Math.max(0, ttlLeft);
    const m = Math.floor(clamped);
    const s = Math.round((clamped - m) * 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  });

  let interval: ReturnType<typeof setInterval> | null = null;

  // Real-time drain rate (L1_REDESIGN Section 5 "time runs while Bob
  // decides"). BUG HISTORY: this used to be 1 sim-minute per real second -
  // literally the entire 60-minute cache TTL evaporating in 60 real seconds
  // of a player just reading the screen. That's less time than it takes to
  // read the tutorial's own toasts ("That red bar: 22,527 tokens written...
  // You only pay this once. Unless it expires."), so any real, human-paced
  // playthrough silently expired the cache mid-level and blew the $0.55
  // budget - even doing the objectively correct click order - while an
  // instant scripted click-through never noticed. 1/8 keeps the lesson
  // (walk away for real minutes and the cache dies) without punishing a
  // normal few-seconds-to-a-minute pause between clicks.
  const DRAIN_SIM_MIN_PER_TICK = 1 / 8;

  function startDrain() {
    stopDrain();
    interval = setInterval(() => {
      // Drain stops 5 sim-min after expiry - nothing left to lose, and it
      // keeps the clock from running out while a player reads a toast.
      if (ttlLeft !== null && ttlLeft <= -5) {
        stopDrain();
        return;
      }
      ondawdle(DRAIN_SIM_MIN_PER_TICK);
    }, 1000);
  }
  function stopDrain() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  $effect(() => {
    if (running) startDrain();
    else stopDrain();
  });
  onDestroy(stopDrain);
</script>

<div class="clockttl">
  <div class="clk">
    <span class="k">Clock</span>
    <span class="v">{fmtClock(clockMin)}</span>
  </div>
  <div class="ttl">
    <span class="k">Main cache</span>
    {#if !cacheEntry}
      <span class="v ttl-none">no cache yet</span>
    {:else if expired}
      <span class="v ttl-expired">EXPIRED - cold - next request rewrites {"~22,527"} tok</span>
    {:else}
      <span class="v">warm - expires {expiresAt} ({countdown})</span>
    {/if}
    <div class="ttlbar" class:dying={ttlLeft !== null && ttlLeft < 15 && ttlLeft > 0}>
      <i style="width:{pct}%"></i>
    </div>
  </div>
</div>

<style>
  .clockttl { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; padding: 8px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel-2); margin-bottom: 10px; }
  .clk, .ttl { display: flex; flex-direction: column; gap: 2px; }
  .ttl { flex: 1; min-width: 220px; }
  .k { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-soft); font-weight: 650; }
  .v { font: 700 15px ui-monospace, monospace; color: var(--ink); }
  .ttl-none { color: var(--ink-soft); font-weight: 500; }
  .ttl-expired { color: var(--bad); }
  .ttlbar { position: relative; height: 6px; border-radius: 4px; background: var(--bg); overflow: hidden; margin-top: 2px; }
  .ttlbar i { display: block; height: 100%; background: var(--read); transition: width .3s linear; }
  .ttlbar.dying i { background: var(--warn, #e0b054); }
</style>
