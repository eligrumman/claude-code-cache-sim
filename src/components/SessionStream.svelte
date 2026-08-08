<script lang="ts">
  // SessionStream.svelte - session message-stream view (function over form;
  // visual polish is a later phase). Plays a generated session turn-by-turn,
  // shows the request-layer composition, and on hover spells out the exact
  // multiplier math per SIMULATOR_SPEC.md / SESSION_PROFILE.md.
  import { onDestroy } from "svelte";
  import type { Config } from "../engine/types.js";
  import {
    generateSession,
    priceTurn,
    priceLayers,
    type SessionStream as Stream,
    type SessionTurn,
    type TurnPriceBreakdown,
  } from "../engine/session.js";

  let { cfg }: { cfg: Config } = $props();

  let kind = $state<"main" | "subagent">("main");
  let seed = $state(1);
  let model = $derived(kind === "main" ? cfg.devModel : cfg.devModel);
  // Seeded once; the $effect below regenerates it on every kind/seed/cfg change.
  let stream = $state<Stream>(generateSession("main", 1, cfg));

  let shown = $state(1); // how many turns are "played" so far
  let speed = $state<0.5 | 1 | 2 | 4>(1);
  let playing = $state(false);
  let hovered = $state<SessionTurn | null>(null);
  let hoverBd = $state<TurnPriceBreakdown | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  function regen() {
    stream = generateSession(kind, seed, cfg);
    shown = 1;
    stopPlay();
  }
  $effect(() => {
    // re-derive when kind/seed/cfg identity changes
    void kind;
    void seed;
    void cfg;
    regen();
  });

  function stepOnce() {
    if (shown < stream.turns.length) shown++;
    else stopPlay();
  }
  function startPlay() {
    stopPlay();
    playing = true;
    const ms = Math.round(500 / speed);
    timer = setInterval(stepOnce, ms);
  }
  function stopPlay() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = null;
  }
  function runAll() {
    stopPlay();
    shown = stream.turns.length;
  }
  function reset() {
    stopPlay();
    shown = 1;
  }
  onDestroy(stopPlay);

  const visible = $derived(stream.turns.slice(0, shown));
  const cum = $derived(
    visible.reduce(
      (a, t) => ({
        input: a.input + t.input,
        output: a.output + t.output,
        cacheRead: t.cacheRead, // last value: cache_read is a running total, not additive
        cacheWrite: a.cacheWrite + t.cacheWrite,
        pingPongs: a.pingPongs + t.pingPongs,
      }),
      { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, pingPongs: 0 },
    ),
  );
  const layerBd = $derived(priceLayers(stream.layers, model, stream.turns[0]?.writeTier ?? "1h"));
  const maxCtx = $derived(Math.max(1, ...stream.turns.map((t) => t.cacheRead + t.cacheWrite)));

  function hover(t: SessionTurn) {
    hovered = t;
    hoverBd = priceTurn(t, model);
  }
  function unhover() {
    hovered = null;
    hoverBd = null;
  }
</script>

<div class="sstream">
  <div class="sstream-controls">
    <label>
      Kind
      <select bind:value={kind}>
        <option value="main">main session</option>
        <option value="subagent">subagent</option>
      </select>
    </label>
    <label>
      Seed
      <input type="number" bind:value={seed} min="0" max="9999" style="width:5em" />
    </label>
    <button class="btn" onclick={playing ? stopPlay : startPlay}>{playing ? "Pause" : "Play"}</button>
    <button class="btn" onclick={stepOnce} disabled={shown >= stream.turns.length}>Step</button>
    <button class="btn" onclick={runAll} disabled={shown >= stream.turns.length}>Run all</button>
    <button class="btn ghost" onclick={reset}>Reset</button>
    <label>
      Speed
      <select bind:value={speed} onchange={() => playing && startPlay()}>
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>
    </label>
    <span class="sstream-meta">
      {stream.kind} · {stream.turns.length} turns · {stream.totalPingPongs} ping-pongs ·
      {stream.rebuiltAt.length} rebuild(s) · {stream.compactedAt.length} compaction(s)
    </span>
  </div>

  <div class="sstream-layers">
    <h4>System-prompt composition (turn 0 cold base, {stream.layers.total.toLocaleString()} tok)</h4>
    <div class="layer-bars">
      {#each layerBd.lines as l}
        <div
          class="layer-bar"
          style="flex: {l.tok} 0 0"
          title={l.math}
        >
          <span class="layer-label">{l.label}: {l.tok.toLocaleString()} tok (${l.usd.toFixed(4)})</span>
        </div>
      {/each}
    </div>
    <p class="sstream-note">
      "SessionStart hook (catalog)" is this machine's token-optimizer hook output, not a universal
      skills catalog — labeled honestly per DESIGN_TOKENS.md.
    </p>
  </div>

  <div class="sstream-tape">
    {#each visible as t (t.idx)}
      <div
        class="turn-bar {t.event ? 'event-' + t.event : ''} {hovered === t ? 'hovered' : ''}"
        role="button"
        tabindex="0"
        onmouseenter={() => hover(t)}
        onmouseleave={unhover}
        onfocus={() => hover(t)}
        onblur={unhover}
      >
        <div class="turn-idx">#{t.idx}</div>
        <div class="turn-stack">
          <div class="seg read" style="height:{(t.cacheRead / maxCtx) * 100}%" title="cache_read"></div>
          <div class="seg write" style="height:{(t.cacheWrite / maxCtx) * 100}%" title="cache_write"></div>
        </div>
        {#if t.event}<div class="event-badge">{t.event}</div>{/if}
      </div>
    {/each}
  </div>

  {#if hovered && hoverBd}
    <div class="sstream-hover">
      <h4>Turn #{hovered.idx} price breakdown{hovered.event ? " (" + hovered.event + ")" : ""}</h4>
      <ul>
        {#each hoverBd.lines as l}
          <li><code>{l.math}</code></li>
        {/each}
      </ul>
      <div class="hover-total">total: ${hoverBd.totalUsd.toFixed(4)}</div>
    </div>
  {/if}

  <div class="sstream-totals">
    <span>input {cum.input.toLocaleString()}</span>
    <span>output {cum.output.toLocaleString()}</span>
    <span>cache_read (current) {cum.cacheRead.toLocaleString()}</span>
    <span>cache_write (sum) {cum.cacheWrite.toLocaleString()}</span>
    <span>ping-pongs {cum.pingPongs}</span>
  </div>
</div>

<style>
  .sstream { font-family: monospace; font-size: 0.85rem; }
  .sstream-controls { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.5rem; }
  .sstream-meta { opacity: 0.7; }
  .layer-bars { display: flex; height: 1.6rem; width: 100%; border: 1px solid #888; }
  .layer-bar { border-right: 1px solid #333; overflow: hidden; white-space: nowrap; font-size: 0.7rem; padding: 0 2px; background: #2a4; color: #fff; }
  .layer-bar:nth-child(2) { background: #46a; }
  .layer-bar:nth-child(3) { background: #a64; }
  .layer-bar:nth-child(4) { background: #888; }
  .layer-bar:nth-child(5) { background: #666; }
  .sstream-note { opacity: 0.65; font-size: 0.75rem; }
  .sstream-tape { display: flex; gap: 2px; height: 120px; align-items: flex-end; overflow-x: auto; border: 1px solid #888; padding: 4px; }
  .turn-bar { display: flex; flex-direction: column; align-items: center; width: 10px; height: 100%; cursor: pointer; position: relative; }
  .turn-idx { font-size: 0.55rem; opacity: 0.6; }
  .turn-stack { display: flex; flex-direction: column-reverse; width: 8px; height: 90px; }
  .seg.read { background: #46a; width: 100%; }
  .seg.write { background: #a64; width: 100%; }
  .turn-bar.hovered { outline: 2px solid #fff; }
  .turn-bar.event-rebuild .turn-stack { outline: 2px solid red; }
  .turn-bar.event-compaction .turn-stack { outline: 2px solid orange; }
  .event-badge { position: absolute; top: -14px; font-size: 0.55rem; }
  .sstream-hover { border: 1px solid #888; padding: 0.5rem; margin-top: 0.5rem; }
  .sstream-hover ul { margin: 0.25rem 0; padding-left: 1.2rem; }
  .hover-total { font-weight: bold; }
  .sstream-totals { display: flex; gap: 1rem; margin-top: 0.5rem; opacity: 0.85; }
</style>
