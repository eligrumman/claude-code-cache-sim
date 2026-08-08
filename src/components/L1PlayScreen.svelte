<script lang="ts">
  // L1PlayScreen.svelte - L1_REDESIGN.md end to end: goal banner, intro cards,
  // ClockTtlBar, ChoiceBar (task/coffee/standup), the tape, and the 6 in-play
  // toasts. Dedicated screen (not the generic PlayScreen/LearnScreen) because
  // L1's mechanic - an out-of-order standup unit + a live clock/TTL drain -
  // doesn't fit the config-strip/unit-board shape the other 12 levels share
  // (L1_REDESIGN Section 7).
  import { onMount } from "svelte";
  import { initGame, step, totalSpent } from "../game/step.js";
  import { L1_CFG } from "../game/step.js";
  import { LEVEL_BY_ID } from "../game/levels.js";
  import { TapeRenderer } from "../render/tape.js";
  import IntroCards from "./IntroCards.svelte";
  import ClockTtlBar from "./ClockTtlBar.svelte";
  import ChoiceBar from "./ChoiceBar.svelte";
  import Toast from "./Toast.svelte";
  import type { GameState } from "../game/types.js";

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
  let tape: TapeRenderer | null = null;
  onMount(() => {
    tape = new TapeRenderer(canvas);
    return () => tape?.destroy();
  });

  const tasksLeft = $derived(st.units.filter((u) => u.status === "queued").length);
  const standupDone = $derived(st.standup?.status === "done");
  const doneCount = $derived(st.units.filter((u) => u.status === "done").length + (standupDone ? 1 : 0));
  const spent = $derived(totalSpent(st));
  const mainEntry = $derived(st.cache.entries["main"]);
  const ttlLeft = $derived(mainEntry ? mainEntry.lastTouchMin + 60 - st.clockMin : null);
  const running = $derived(phase === "play" && !st.ended && !sweeping);

  function pushToast(id: string, text: string) {
    if (shown.has(id)) return;
    shown.add(id);
    toastText = text;
  }

  function afterAction() {
    tape?.play(st.lastRequests);
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
      {standupDone}
      disabled={!!st.ended}
      ontask={runTask}
      oncoffee={coffee}
      onstandup={standup}
    />
    <div class="msg">{msg}</div>
  </div>

  <div class="card">
    <h2>Requests on the wire</h2>
    <div class="tape-holder"><canvas bind:this={canvas}></canvas></div>
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
</style>
