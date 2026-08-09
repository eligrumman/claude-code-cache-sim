<script lang="ts">
  // L1PlayScreen.svelte - L1_REDESIGN.md end to end: goal banner, intro cards,
  // ClockTtlBar, ChoiceBar (task/coffee/standup), the tape, and the 6 in-play
  // toasts. Dedicated screen (not the generic PlayScreen/LearnScreen) because
  // L1's mechanic - an out-of-order standup unit + a live clock/TTL drain -
  // doesn't fit the config-strip/unit-board shape the other 12 levels share
  // (L1_REDESIGN Section 7).
  import { onMount, tick } from "svelte";
  import { initGame, step, totalSpent } from "../game/step.js";
  import { L1_CFG } from "../game/step.js";
  import { LEVEL_BY_ID } from "../game/levels.js";
  import { TapeRenderer, type TapeHover } from "../render/tape.js";
  import IntroCards from "./IntroCards.svelte";
  import ClockTtlBar from "./ClockTtlBar.svelte";
  import ChoiceBar from "./ChoiceBar.svelte";
  import Toast from "./Toast.svelte";
  import type { GameState, LedgerRow } from "../game/types.js";

  let {
    attempted,
    onfinish,
    onabandon,
  }: {
    attempted: boolean;
    onfinish: (st: GameState, handCoded: number) => void;
    onabandon: () => void;
  } = $props();

  const def = LEVEL_BY_ID.L1;

  let phase = $state<"intro" | "play">("intro");
  let st = $state<GameState>(initGame(def.seed, "session", L1_CFG, def.clockCapMin, "l1-onboarding"));
  let msg = $state("Take the standup whenever you like - but the cache dies 60 minutes after you last use it.");
  let sweeping = $state(false);
  let toastText = $state<string | null>(null);
  const shown = new Set<string>();
  let dawdleTicks = 0;

  let canvas: HTMLCanvasElement | undefined = $state();
  let tapeHolder: HTMLDivElement | undefined = $state();
  let tape: TapeRenderer | null = null;
  // Hover payload from TapeRenderer (fix #1: tooltip clipping). The canvas
  // draws bars only (domTooltip:true); this component renders the tooltip as
  // an absolutely-positioned DOM overlay so it can be measured and clamped
  // to the viewport after render, instead of being clamped to canvas bounds
  // (which clips when the canvas sits inside a narrower/scrolled panel).
  let hoverTip = $state<TapeHover | null>(null);
  let tipEl: HTMLDivElement | undefined = $state();
  let tipStyle = $state("left:0px; top:0px; visibility:hidden;");

  function unitLabel(unitId: string): string | null {
    const u = st.units.find((x) => x.id === unitId);
    if (u?.label) return u.label;
    if (st.standup?.id === unitId) return st.standup.label ?? "Standup";
    return null;
  }

  onMount(() => {
    return () => tape?.destroy();
  });
  // The canvas only exists in the DOM once phase flips to "play" (it's
  // inside the {#if phase === "play"} branch below), so it isn't available
  // yet when onMount fires at "intro". Build the renderer reactively once
  // the bound element shows up, mirroring IntroCards.svelte's tape effect.
  $effect(() => {
    if (canvas && !tape) {
      tape = new TapeRenderer(canvas, {
        domTooltip: true,
        onHover: (h) => (hoverTip = h),
        labelFor: (row) => unitLabel(row.unitId),
      });
    }
  });

  // Reposition the DOM tooltip once its content is rendered and its real
  // size is known, clamping so it never spills past the panel/viewport
  // (flips to the left of the bar, or clamps top/left, as needed).
  $effect(() => {
    const h = hoverTip;
    if (!h || !tapeHolder) {
      tipStyle = "left:0px; top:0px; visibility:hidden;";
      return;
    }
    tick().then(() => {
      if (!tipEl || !tapeHolder || hoverTip !== h) return;
      const holderRect = tapeHolder.getBoundingClientRect();
      const tw = tipEl.offsetWidth;
      const th = tipEl.offsetHeight;
      let left = h.x + h.w + 8;
      if (holderRect.left + left + tw > window.innerWidth - 4) {
        left = Math.max(0, h.x - tw - 8);
      }
      let top = h.y;
      if (holderRect.top + top + th > window.innerHeight - 4) {
        top = Math.max(0, holderRect.height - th);
      }
      left = Math.min(Math.max(0, left), Math.max(0, holderRect.width - tw));
      tipStyle = `left:${left}px; top:${top}px; visibility:visible;`;
    });
  });

  const tasksLeft = $derived(st.units.filter((u) => u.status === "queued").length);
  const nextTaskLabel = $derived(st.units.find((u) => u.status === "queued")?.label ?? null);
  const standupDone = $derived(st.standup?.status === "done");
  const doneCount = $derived(st.units.filter((u) => u.status === "done").length + (standupDone ? 1 : 0));
  const spent = $derived(totalSpent(st));
  const mainEntry = $derived(st.cache.entries["main"]);
  const ttlLeft = $derived(mainEntry ? mainEntry.lastTouchMin + 60 - st.clockMin : null);
  const running = $derived(phase === "play" && !st.ended && !sweeping);
  // Fix #2: each completed request is its own persistent row that
  // accumulates down the panel as the session progresses, instead of
  // replaying only st.lastRequests (the most recent action), which is why
  // the wire previously showed just one request at a time.
  const wireRows = $derived(st.ledger.filter((r) => r.agent === "main") as LedgerRow[]);

  function pushToast(id: string, text: string) {
    if (shown.has(id)) return;
    shown.add(id);
    toastText = text;
  }

  function afterAction() {
    tape?.play(wireRows);
    sweeping = true;
    setTimeout(() => (sweeping = false), 700);

    const coldMainWrites = st.ledger.filter((r) => r.agent === "main" && r.cold);
    if (coldMainWrites.length >= 1 && st.ledger.some((r) => r.unitId === "task0")) {
      pushToast(
        "t1",
        "That red bar: 22,527 tokens written to cache at 2x - $0.14 of your $0.186. You only pay this once. Unless it expires.",
      );
    }
    if (st.ledger.some((r) => r.unitId === "task1")) {
      pushToast("t2", "Blue: the same 22,527 tokens read back at 0.1x - $0.007 instead of $0.14.");
    }
    if (coldMainWrites.length >= 2) {
      pushToast(
        "t5",
        "That rebuild cost $0.11 more than a warm read - the 20x-per-token penalty (file 05).",
      );
    }
    if (ttlLeft !== null && ttlLeft <= 0) {
      pushToast("t4", "EXPIRED. Next request rewrites the whole context at 2x.");
    }

    if (st.ended) {
      const gate = def.pass(st);
      msg = gate.reason;
      onfinish(st, 0);
    }
  }

  function runTask() {
    if (st.ended || tasksLeft === 0) return;
    const u = st.units.find((x) => x.status === "queued");
    if (!u) return;
    st = step(st, { type: "RUN_UNIT", unitId: u.id });
    afterAction();
  }
  function coffee() {
    if (st.ended) return;
    st = step(st, { type: "ADVANCE", min: 20 });
    afterAction();
  }
  function standup() {
    if (st.ended || !st.standup || st.standup.status !== "queued") return;
    st = step(st, { type: "RUN_UNIT", unitId: st.standup.id });
    afterAction();
  }

  function ondawdle(min: number) {
    if (st.ended) return;
    st = step(st, { type: "ADVANCE", min });
    dawdleTicks++;
    if (dawdleTicks >= 30) {
      pushToast("t6", "Time runs while Bob decides. The cache doesn't wait for you.");
    }
    const left = mainEntry ? mainEntry.lastTouchMin + 60 - st.clockMin : null;
    if (left !== null && left < 15 && left > 0) {
      pushToast("t3", "Cache dies in 14:59. Anything you run before then stays cheap.");
    }
    if (left !== null && left <= 0) {
      pushToast("t4", "EXPIRED. Next request rewrites the whole context at 2x.");
    }
    // Clock-cap guard (L1_REDESIGN Section 6.6): remaining items auto-complete
    // rather than let extreme dawdling clock-loss an onboarding level.
    if (st.clockMin >= st.endMin && !st.ended) {
      for (const u of st.units) if (u.status === "queued") u.status = "handcoded";
      if (st.standup && st.standup.status === "queued") st.standup.status = "done";
      st.ended = { result: "loss", lossId: "L1-late" };
      msg = "Cheap But Late - you ran out of the 5-hour morning while dawdling.";
      onfinish(st, st.units.filter((u) => u.status === "handcoded").length);
    }
  }

  function onIntroStart() {
    phase = "play";
  }
</script>

{#if phase === "intro"}
  <IntroCards {attempted} onstart={onIntroStart} />
{:else}
  <div class="card goalbar">
    <b>{def.objective}</b>
    <span class="progress"> - {doneCount}/5 done, ${spent.toFixed(2)} spent</span>
  </div>

  <ClockTtlBar clockMin={st.clockMin} cacheEntry={mainEntry} {running} {ondawdle} />

  <div class="card">
    <h2>Bob's morning</h2>
    <ChoiceBar
      {tasksLeft}
      {nextTaskLabel}
      {standupDone}
      disabled={!!st.ended}
      ontask={runTask}
      oncoffee={coffee}
      onstandup={standup}
    />
    <ol class="tasklist">
      {#each st.units as u (u.id)}
        <li class="tasklist-item {u.status}">
          <span class="tasklist-dot"></span>
          {u.label}
          {#if u.status === "done"}<span class="tag">done</span>{/if}
        </li>
      {/each}
      <li class="tasklist-item {st.standup?.status ?? 'queued'}">
        <span class="tasklist-dot"></span>
        <!-- lowercase "standup" here (vs. the button's "Standup") so this
             list item doesn't collide with tests that click the /Standup/
             button by matched text. -->
        the 90-min standup
        {#if standupDone}<span class="tag">done</span>{/if}
      </li>
    </ol>
    <div class="msg">{msg}</div>
  </div>

  <div class="card">
    <h2>Requests on the wire</h2>
    <div class="tape-holder" bind:this={tapeHolder}>
      <canvas bind:this={canvas}></canvas>
      {#if hoverTip}
        <div class="tape-tooltip" bind:this={tipEl} style={tipStyle}>
          {#each hoverTip.lines as l}
            <div class="tape-tooltip-line">{l}</div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="legend">
      <span><i class="sw read"></i> cache read (0.1x, cheap)</span>
      <span><i class="sw write"></i> written / rewrite (expensive)</span>
      <span><i class="sw grey"></i> not sent yet</span>
    </div>
  </div>

  <div class="row-btns">
    <button class="btn ghost" onclick={onabandon}>Abandon</button>
  </div>

  <Toast text={toastText} onclose={() => (toastText = null)} />
{/if}

<style>
  .goalbar { font-size: 13.5px; }
  .progress { color: var(--ink-soft); font-weight: 500; }
  .tasklist { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .tasklist-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-soft); }
  .tasklist-item.done { color: var(--ink); }
  .tasklist-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--grey-soft); flex: none; }
  .tasklist-item.done .tasklist-dot { background: var(--read, #46a); }
  .tag { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--ink-soft); }
  .tape-tooltip {
    position: absolute;
    z-index: 30;
    max-width: min(360px, 90vw);
    background: var(--panel-2, #111);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 6px 8px;
    font: 10px ui-monospace, monospace;
    color: var(--ink);
    box-shadow: var(--shadow);
    pointer-events: none;
  }
  .tape-tooltip-line + .tape-tooltip-line { margin-top: 2px; }
</style>
