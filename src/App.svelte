<script lang="ts">
  import { onMount } from "svelte";
  import Hud from "./components/Hud.svelte";
  import ConfigStrip from "./components/ConfigStrip.svelte";
  import UnitBoard from "./components/UnitBoard.svelte";
  import ReportModal from "./components/ReportModal.svelte";
  import SessionStream from "./components/SessionStream.svelte";
  import { TapeRenderer } from "./render/tape.js";
  import { fmt } from "./game/report.js";
  import { initGame, step, canAfford, runScript, totalSpent } from "./game/step.js";
  import { DEFAULT_CFG, N_DEV } from "./engine/constants.js";
  import { LEVELS, newCampaign, isLevelUnlocked, completeLevel } from "./game/levels.js";
  import type { LevelId } from "./game/levels.js";
  import type { Config } from "./engine/types.js";
  import type { GameState, Scope, UnitInstance } from "./game/types.js";

  let showSessionView = $state(false);
  let showLevels = $state(false);
  let campaign = $state(newCampaign());
  let levelResult = $state<string | null>(null);

  function playLevel(id: LevelId) {
    const level = LEVELS.find((l) => l.id === id)!;
    const runSt = runScript(level.seed, level.scope, { ...cfg, ...level.cfgOverride }, false);
    const gate = level.pass(runSt);
    campaign = completeLevel(campaign, id, runSt, runSt.counts.handCoded);
    levelResult =
      level.id + " " + level.title + ": " + (gate.pass ? "PASS" : "FAIL") + " - " + gate.reason +
      " (spent $" + totalSpent(runSt).toFixed(2) + ")";
  }

  let seed = $state(42);
  let scope = $state<Scope>("month");
  let cfg = $state<Config>({ ...DEFAULT_CFG });
  let st = $state<GameState>(initGame(42, "month", { ...DEFAULT_CFG }));
  let msg = $state("Set Bob's config, then run the first unit: the plan.");
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
    return () => tape?.destroy();
  });

  function reinit() {
    st = initGame(seed, scope, { ...cfg });
    affordUnit = null;
    tape?.play([]);
    msg = "Fresh start. Config locked in. Run the plan.";
  }

  function patch(p: Partial<Config>) {
    cfg = { ...cfg, ...p };
    if (st.idx === 0) reinit();
    else st = step(st, { type: "SET_CFG", patch: p });
  }
  function setScope(s: Scope) {
    scope = s;
    reinit();
  }
  function setSeed(s: number) {
    seed = s;
    reinit();
  }
  function reroll() {
    seed = Math.floor(1 + ((typeof performance !== "undefined" ? performance.now() : Date.now()) * 997) % 9999);
    reinit();
  }

  function describe(u: UnitInstance): string {
    let w = 0,
      rd = 0,
      spent = 0;
    for (const r of st.lastRequests) {
      w += r.writeTok;
      rd += r.readTok;
      spent += r.usd;
    }
    if (!st.lastRequests.length) return "CI ran on the machines. No tokens.";
    return (
      (u.label || u.kind) +
      ": " +
      st.lastRequests.length +
      " request" +
      (st.lastRequests.length > 1 ? "s" : "") +
      ", " +
      fmt(rd) +
      " read / " +
      fmt(w) +
      " written. -$" +
      spent.toFixed(4)
    );
  }

  function afterAction(ranUnit: UnitInstance, handCoded: boolean) {
    tape?.play(st.lastRequests);
    if (handCoded) {
      msg = "Bob hand-coded " + (ranUnit.label || ranUnit.kind) + ". +" +
        (ranUnit.hours * 6).toFixed(1) + "h, tedium +" + (8 * ranUnit.hours).toFixed(0) + ".";
    } else {
      msg = describe(ranUnit);
    }
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

  function playAgain() {
    reinit();
  }
  function tryWeek() {
    scope = "week";
    reinit();
  }
</script>

<div class="app">
  <h1>The Claude Code Simulator</h1>
  <p class="sub">
    Help <b>Bob</b> ship the auth feature on his org's <b>$90/month</b> Claude budget. Every knob you
    set is a real one. The wallet just drains. It never tells you why.
  </p>

  <Hud {st} />

  <div class="card">
    <button class="btn ghost" onclick={() => (showSessionView = !showSessionView)}>
      {showSessionView ? "Hide" : "Show"} session message-stream view
    </button>
    <button class="btn ghost" onclick={() => (showLevels = !showLevels)}>
      {showLevels ? "Hide" : "Show"} campaign levels ({campaign.unlocked.length}/{LEVELS.length} unlocked)
    </button>
  </div>

  {#if showSessionView}
    <div class="card">
      <h2>Session message stream (real-shape simulation)</h2>
      <SessionStream {cfg} />
    </div>
  {/if}

  {#if showLevels}
    <div class="card">
      <h2>Campaign (13 levels, Section 11)</h2>
      <table class="ledtab">
        <thead>
          <tr><th>#</th><th>title</th><th>tier</th><th>unlocks</th><th>budget</th><th>stars</th><th>attempts</th><th></th></tr>
        </thead>
        <tbody>
          {#each LEVELS as l}
            <tr>
              <td>{l.id}</td>
              <td>{l.title}</td>
              <td>{l.tier}</td>
              <td>{l.unlocks}</td>
              <td>{l.budgetUsd === Infinity ? "-" : "$" + l.budgetUsd.toFixed(2)}</td>
              <td>{"*".repeat(campaign.levels[l.id].stars)}</td>
              <td>{campaign.levels[l.id].attempts}</td>
              <td>
                <button class="btn" disabled={!isLevelUnlocked(campaign, l.id)} onclick={() => playLevel(l.id)}>
                  Play (reference solution)
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if levelResult}<div class="msg">{levelResult}</div>{/if}
    </div>
  {/if}

  <div class="main">
    <ConfigStrip {cfg} {scope} {seed} locked={st.idx > 0}
      onpatch={patch} onscope={setScope} onseed={setSeed} onreroll={reroll} />

    <div>
      <div class="card">
        <h2>The pipeline</h2>
        <UnitBoard units={st.units} idx={st.idx} />
        <div class="runbar">
          <button class="btn" disabled={!!st.ended || !nextUnit} onclick={runNext}>Run next unit</button>
          <button class="btn ghost" disabled={!!st.ended || !nextUnit}
            onclick={() => nextUnit && handNext(nextUnit)}>Bob codes it by hand</button>
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

  <p class="footnote">
    A playable slice of the full S6 experience. Economics use the canonical cost function and the real
    calibration table. Boot-time invariants run in the console. No numbers are faked.
  </p>
</div>

{#if affordUnit}
  <div class="scrim on" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) affordUnit = null; }}>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Can't afford it">
      <h3>Can't afford it</h3>
      <p class="lead">
        The wallet is down to <b>${st.wallet.toFixed(2)}</b>. Claude can't run
        <b>{affordUnit.label || affordUnit.kind}</b>. Bob has to hand-code it: no tokens, but
        <b>{(affordUnit.hours * 6).toFixed(1)} hours</b> of his own time and a jump in tedium.
      </p>
      <div class="row-btns">
        <button class="btn" onclick={() => affordUnit && handNext(affordUnit)}>Bob hand-codes it</button>
      </div>
    </div>
  </div>
{/if}

{#if st.ended}
  <ReportModal {st} onagain={playAgain} onweek={tryWeek} />
{/if}
