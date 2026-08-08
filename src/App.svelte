<script lang="ts">
  // App.svelte - the screen router (GAME_PLAN.md Section B.1/B.3). Owns only
  // `screen` + `campaign`; all game logic still lives in step.ts/levels.ts.
  import MapScreen from "./components/MapScreen.svelte";
  import LearnScreen from "./components/LearnScreen.svelte";
  import PlayScreen from "./components/PlayScreen.svelte";
  import L1PlayScreen from "./components/L1PlayScreen.svelte";
  import ResultScreen from "./components/ResultScreen.svelte";
  import SessionStream from "./components/SessionStream.svelte";
  import {
    toMap,
    enterLevel,
    toPlay,
    toResult,
    toFreeplay,
    retryLevel,
    loadCampaign,
    saveCampaign,
    type Screen,
    type LevelOutcome,
  } from "./game/shell.js";
  import { LEVEL_BY_ID, unlockedControls, starsFor, completeLevel, type LevelId } from "./game/levels.js";
  import { totalSpent } from "./game/step.js";
  import { DEFAULT_CFG } from "./engine/constants.js";
  import type { GameState } from "./game/types.js";

  let screen = $state<Screen>(toMap());
  let campaign = $state(loadCampaign());
  let showSandbox = $state(false);

  function goMap() {
    showSandbox = false;
    screen = toMap();
  }
  function goEnter(id: LevelId) {
    // L1's intro cards are rendered inline by L1PlayScreen (Section 4 Beat 0
    // + Section 7 gap #7 - LearnBeat's A/B replay doesn't fit token-basics
    // teaching), so entering L1 goes straight to play.
    screen = id === "L1" ? toPlay(id) : enterLevel(id);
  }
  function goPlay(id: LevelId) {
    screen = toPlay(id);
  }
  function goRetry(id: LevelId) {
    // Mirror goEnter: L1's intro/play is a single dedicated screen
    // (L1PlayScreen), it has no generic LearnScreen A/B replay to retry
    // into. Without this, retryLevel(id) always routes to {id:"learn"},
    // which for L1 rendered the generic LearnScreen instead of restarting
    // the actual L1 flow - a dead end back into L1 after a failed attempt.
    screen = id === "L1" ? toPlay(id) : retryLevel(id);
  }
  function goFreeplay() {
    // Section B.1: Free Play uses the current unlocked toolset. Use the
    // frontier (last unlocked) level's cumulative control set.
    const lastUnlocked = campaign.unlocked.length - 1;
    const frontierId = (Object.keys(LEVEL_BY_ID) as LevelId[])[Math.max(0, lastUnlocked)] as LevelId;
    screen = toFreeplay(unlockedControls(frontierId));
  }

  function finishLevel(id: LevelId, st: GameState, handCoded: number) {
    const level = LEVEL_BY_ID[id];
    const gate = level.pass(st);
    const stars = starsFor(level, st, handCoded);
    campaign = completeLevel(campaign, id, st, handCoded);
    saveCampaign(campaign);
    const outcome: LevelOutcome = {
      pass: gate.pass,
      stars,
      reason: gate.reason,
      spentUsd: totalSpent(st),
      handCoded,
      finalState: st,
    };
    screen = toResult(id, outcome);
  }
</script>

<div class="app">
  {#if screen.id === "map"}
    <MapScreen {campaign} onenter={goEnter} onfreeplay={goFreeplay} />
  {:else if screen.id === "learn"}
    <LearnScreen level={screen.level} onplay={() => goPlay(screen.level)} onback={goMap} />
  {:else if screen.id === "play"}
    {@const def = LEVEL_BY_ID[screen.level]}
    <h1 style="margin:0 0 4px">{def.id} - {def.title}</h1>
    {#if screen.level !== "L1"}
      <p class="sub" style="margin-top:0">{def.objective}</p>
    {/if}
    {#if screen.level === "L1"}
      <L1PlayScreen
        attempted={campaign.levels.L1.attempts > 0}
        onfinish={(st, handCoded) => finishLevel(screen.level, st, handCoded)}
        onabandon={goMap}
      />
    {:else}
      <PlayScreen
        level={screen.level}
        seed={def.seed}
        scope={def.scope}
        cfgOverride={def.cfgOverride}
        cfgLocked={def.cfgLocked || []}
        clockCapMin={def.clockCapMin}
        onfinish={(st, handCoded) => finishLevel(screen.level, st, handCoded)}
        onabandon={goMap}
      />
    {/if}
  {:else if screen.id === "result"}
    <ResultScreen
      level={screen.level}
      outcome={screen.outcome}
      onnext={goMap}
      onretry={() => goRetry(screen.level)}
      onmap={goMap}
    />
  {:else if screen.id === "freeplay"}
    <h1 style="margin:0 0 4px">Free Play</h1>
    <p class="sub" style="margin-top:0">
      Everything you've unlocked so far, with scope/seed controls. The wallet just drains -
      it never tells you why.
    </p>
    <div class="card">
      <button class="btn ghost" onclick={() => (showSandbox = !showSandbox)}>
        {showSandbox ? "Hide" : "Show"} raw session message-stream view
      </button>
      <button class="btn ghost" onclick={goMap}>Back to map</button>
    </div>
    {#if showSandbox}
      <div class="card">
        <h2>Session message stream (real-shape simulation)</h2>
        <SessionStream cfg={DEFAULT_CFG} />
      </div>
    {/if}
    <PlayScreen
      freeplayControls={screen.toolset}
      onfinish={() => {}}
      onabandon={goMap}
    />
  {/if}

  <p class="footnote">
    Economics use the canonical cost function and the real calibration table. Boot-time
    invariants run in the console. No numbers are faked.
  </p>
</div>
