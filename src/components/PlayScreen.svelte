<script lang="ts">
  import { onMount } from "svelte";
  import Hud from "./Hud.svelte";
  import ConfigStrip from "./ConfigStrip.svelte";
  import UnitBoard from "./UnitBoard.svelte";
  import { TapeRenderer } from "../render/tape.js";
  import { fmt } from "../game/report.js";
  import { initGame, step, canAfford } from "../game/step.js";
  import { N_DEV } from "../engine/constants.js";
  import { unlockedControls, type LevelId, type ControlId } from "../game/levels.js";
  import type { GameState, UnitInstance } from "../game/types.js";
  import type { Config } from "../engine/types.js";

  // level = a campaign LevelId (gated controls, fixed scenario, Finish->judge).
  // freeplayControls = sandbox mode (undefined = all controls visible).
  let {
    level,
    seed = 42,
    scope = "session",
    cfgOverride = {},
    cfgLocked = [],
    clockCapMin,
    freeplayControls,
    onfinish,
    onabandon,
  }: {
    level?: LevelId;
    seed?: number;
    scope?: GameState["scope"];
    cfgOverride?: Partial<Config>;
    cfgLocked?: (keyof Config)[];
    clockCapMin?: number;
    freeplayControls?: ControlId[];
    onfinish: (st: GameState, handCoded: number) => void;
    onabandon: () => void;
  } = $props();

  const controls: ControlId[] | undefined = level ? unlockedControls(level) : freeplayControls;

  let cfg = $state<Config>((() => {
    const base = initGame(seed, scope, cfgOverride, clockCapMin).cfg;
    return base;
  })());
  let st = $state<GameState>(initGame(seed, scope, cfgOverride, clockCapMin));
  let msg = $state(level ? "Set your loadout, then run the first unit." : "Free play: everything unlocked.");
  let showLedTab = $state(false);
  let affordUnit = $state<UnitInstance | null>(null);

  let canvas: HTMLCanvasElement;
  let tape: TapeRenderer | null = null;

  const nextUnit = $derived(st.units[st.idx] as UnitInstance | undefined);
  const nextLabel = $derived(nextUnit ? nextUnit.label || nextUnit.kind : "done");
  const waveDesc = $derived(
    cfg.who === "subagent"
      ? N_DEV + " " + cfg.devModel + " subagents, " + cfg.prompts + " prompts"
      : cfg.devModel + " inline, one growing session",
  );

  onMount(() => {
    tape = new TapeRenderer(canvas);
    tape.play(st.lastRequests);
    return () => tape?.destroy();
  });

  function patch(p: Partial<Config>) {
    const filtered = { ...p };
    for (const k of cfgLocked) delete (filtered as any)[k];
    cfg = { ...cfg, ...filtered };
    if (st.idx === 0) {
      st = initGame(seed, scope, { ...cfgOverride, ...cfg }, clockCapMin);
      tape?.play([]);
    } else {
      st = step(st, { type: "SET_CFG", patch: filtered });
    }
  }

  function describe(u: UnitInstance): string {
    let w = 0, rd = 0, spent = 0;
    for (const r of st.lastRequests) {
      w += r.writeTok;
      rd += r.readTok;
      spent += r.usd;
    }
    if (!st.lastRequests.length) return "CI ran on the machines. No tokens.";
    return (
      (u.label || u.kind) + ": " + st.lastRequests.length + " request" +
      (st.lastRequests.length > 1 ? "s" : "") + ", " + fmt(rd) + " read / " + fmt(w) +
      " written. -$" + spent.toFixed(4)
    );
  }

  function afterAction(ranUnit: UnitInstance, handCoded: boolean) {
    tape?.play(st.lastRequests);
    if (handCoded) {
      msg = "Hand-coded " + (ranUnit.label || ranUnit.kind) + ". +" +
        (ranUnit.hours * 6).toFixed(1) + "h, tedium +" + (8 * ranUnit.hours).toFixed(0) + ".";
    } else {
      msg = describe(ranUnit);
    }
    if (st.ended) onfinish(st, st.counts.handCoded);
  }

  function runNext() {
    if (st.ended) return;
    const u = st.units[st.idx];
    if (!u) return;
    if (!canAfford(st, u)) {
      affordUnit = u;
      return;
    }
    st = step(st, { type: "RUN_UNIT", unitId: u.id });
    afterAction(u, false);
  }
  function handNext(u: UnitInstance) {
    if (st.ended) return;
    st = step(st, { type: "HAND_CODE", unitId: u.id });
    affordUnit = null;
    afterAction(u, true);
  }
  // "Finish" / run-to-end (Section E.3): auto-runs the rest of the queue,
  // hand-coding anything unaffordable, then hands the final GameState to the
  // caller (which routes to ResultScreen and judges the real gate).
  function runToEnd() {
    let guard = 0;
    while (!st.ended && st.idx < st.units.length && guard++ < 500) {
      const u = st.units[st.idx];
      if (canAfford(st, u)) st = step(st, { type: "RUN_UNIT", unitId: u.id });
      else st = step(st, { type: "HAND_CODE", unitId: u.id });
    }
    tape?.play(st.lastRequests);
    onfinish(st, st.counts.handCoded);
  }
</script>

<div class="main">
  <ConfigStrip {cfg} {scope} {seed} locked={st.idx > 0} {controls} showRunGroup={!level}
    onpatch={patch} onscope={() => {}} onseed={() => {}} onreroll={() => {}} />

  <div>
    <Hud {st} />

    <div class="card">
      <h2>The pipeline</h2>
      <UnitBoard units={st.units} idx={st.idx} />
      <div class="runbar">
        <button class="btn" disabled={!!st.ended || !nextUnit} onclick={runNext}>Run next unit</button>
        {#if controls === undefined || controls.includes("handCode")}
          <button class="btn ghost" disabled={!!st.ended || !nextUnit}
            onclick={() => nextUnit && handNext(nextUnit)}>Hand-code it</button>
        {/if}
        <button class="btn ghost" disabled={!!st.ended} onclick={runToEnd}>Finish (run to end)</button>
        <button class="btn ghost" onclick={onabandon}>Abandon</button>
        <span class="runhint">Next: <b>{nextLabel}</b>. Dev wave = {waveDesc}.</span>
      </div>
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
      <button class="a11y-toggle" onclick={() => (showLedTab = !showLedTab)}>Show/hide ledger table</button>
      {#if showLedTab}
        <table class="ledtab">
          <thead>
            <tr><th>unit</th><th>agent</th><th>model</th><th>read</th><th>in</th><th>write</th><th>out</th><th>$</th></tr>
          </thead>
          <tbody>
            {#each st.ledger.slice(-14) as r}
              <tr>
                <td>{r.unit}</td><td>{r.agent}</td><td>{r.model}</td>
                <td>{fmt(r.readTok)}</td><td>{fmt(r.inputTok)}</td><td>{fmt(r.writeTok)}</td>
                <td>{fmt(r.outTok)}</td><td>${r.usd.toFixed(3)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
</div>

{#if affordUnit}
  <div class="scrim on" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) affordUnit = null; }}>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Can't afford it">
      <h3>Can't afford it</h3>
      <p class="lead">
        The wallet is down to <b>${st.wallet.toFixed(2)}</b>. Can't run
        <b>{affordUnit.label || affordUnit.kind}</b>. Hand-code it instead: no tokens, but
        <b>{(affordUnit.hours * 6).toFixed(1)} hours</b> of manual time and a jump in tedium.
      </p>
      <div class="row-btns">
        <button class="btn" onclick={() => affordUnit && handNext(affordUnit)}>Hand-code it</button>
      </div>
    </div>
  </div>
{/if}
