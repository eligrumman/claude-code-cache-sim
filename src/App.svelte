<script lang="ts">
  // App.svelte - the screen router (GAME_PLAN.md Section B.1/B.3). Owns only
  // `screen` + `campaign`; all game logic still lives in step.ts/levels.ts.
  import MapScreen from "./components/MapScreen.svelte";
  import LearnScreen from "./components/LearnScreen.svelte";
  import PlayScreen from "./components/PlayScreen.svelte";
  import L1PlayScreen from "./components/L1PlayScreen.svelte";
  import L2PlayScreen from "./components/L2PlayScreen.svelte";
  import L3PlayScreen from "./components/L3PlayScreen.svelte";
  import ResultScreen from "./components/ResultScreen.svelte";
  import SessionStream from "./components/SessionStream.svelte";
  import SandboxScreen from "./sandbox/SandboxScreen.svelte";
  import ArticleScreen from "./article/ArticleScreen.svelte";
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
  let showStream = $state(false);
  let sandboxOpen = $state(false);
  let articleOpen = $state(false);

  function goMap() {
    showStream = false;
    sandboxOpen = false;
    articleOpen = false;
    screen = toMap();
  }
  function goEnter(id: LevelId) {
    // Redesigned L1-L3 teach through live requests, so they bypass the generic
    // A/B learn screen and open on their first playable action.
    screen = id === "L1" || id === "L2" || id === "L3" ? toPlay(id) : enterLevel(id);
  }
  function goPlay(id: LevelId) {
    screen = toPlay(id);
  }
  function goRetry(id: LevelId) {
    // Mirror goEnter: retrying either redesign restarts its dedicated flow.
    screen = id === "L1" || id === "L2" || id === "L3" ? toPlay(id) : retryLevel(id);
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
  {#if sandboxOpen}
    <SandboxScreen onback={goMap} />
  {:else if articleOpen}
    <ArticleScreen onback={goMap} onsandbox={() => { articleOpen = false; sandboxOpen = true; }} />
  {:else if screen.id === "map"}
    <div class="special-entries">
      <button class="sandbox-entry" onclick={() => (sandboxOpen = true)}>
        <span>🧪</span><b>Sandbox</b><small>All the knobs →</small>
      </button>
      <button class="sandbox-entry article-entry" onclick={() => (articleOpen = true)}>
        <span>📖</span><b>The Article</b><small>Learn by playing →</small>
      </button>
    </div>
    <MapScreen {campaign} onenter={goEnter} onfreeplay={goFreeplay} />
  {:else if screen.id === "learn"}
    {@const level = screen.level}
    <LearnScreen {level} onplay={() => goPlay(level)} onback={goMap} />
  {:else if screen.id === "play"}
    {@const level = screen.level}
    {@const def = LEVEL_BY_ID[level]}
    <h1 style="margin:0 0 4px">{def.id} - {def.title}</h1>
    {#if level !== "L1" && level !== "L2" && level !== "L3"}
      <p class="sub" style="margin-top:0">{def.objective}</p>
    {/if}
    {#if level === "L1"}
      <L1PlayScreen
        onfinish={(st, handCoded) => finishLevel(level, st, handCoded)}
        onabandon={goMap}
      />
    {:else if level === "L2"}
      <L2PlayScreen
        onfinish={(st, handCoded) => finishLevel("L2", st, handCoded)}
        onabandon={goMap}
      />
    {:else if level === "L3"}
      <L3PlayScreen
        onfinish={(st, handCoded) => finishLevel("L3", st, handCoded)}
        onabandon={goMap}
      />
    {:else}
      <PlayScreen
        {level}
        seed={def.seed}
        scope={def.scope}
        cfgOverride={def.cfgOverride}
        cfgLocked={def.cfgLocked || []}
        clockCapMin={def.clockCapMin}
        onfinish={(st, handCoded) => finishLevel(level, st, handCoded)}
        onabandon={goMap}
      />
    {/if}
  {:else if screen.id === "result"}
    {@const level = screen.level}
    <ResultScreen
      {level}
      outcome={screen.outcome}
      onnext={goMap}
      onretry={() => goRetry(level)}
      onmap={goMap}
    />
  {:else if screen.id === "freeplay"}
    <h1 style="margin:0 0 4px">Free Play</h1>
    <p class="sub" style="margin-top:0">
      Everything you've unlocked so far, with scope/seed controls. The wallet just drains -
      it never tells you why.
    </p>
    <div class="card">
      <button class="btn ghost" onclick={() => (showStream = !showStream)}>
        {showStream ? "Hide" : "Show"} raw session message-stream view
      </button>
      <button class="btn ghost" onclick={goMap}>Back to map</button>
    </div>
    {#if showStream}
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

  {#if !sandboxOpen && !articleOpen}
    <p class="footnote">
      Economics use the canonical cost function and the real calibration table. Boot-time
      invariants run in the console. No numbers are faked.
    </p>
  {/if}
</div>

<style>
  .special-entries { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .sandbox-entry {
    width: 100%; margin: 0; padding: 13px 18px; display: flex; align-items: center;
    gap: 10px; border: 2px solid #24231f; border-radius: 15px 12px 16px 13px;
    background: #fffdf4; color: #24231f; cursor: pointer; text-align: left;
    box-shadow: 5px 5px 0 #f2c94c; transition: transform .18s, box-shadow .18s;
  }
  .sandbox-entry:hover { transform: translateY(-2px); box-shadow: 7px 7px 0 #f2c94c; }
  .sandbox-entry span { font-size: 1.55rem; }
  .sandbox-entry b { font-size: 1rem; }
  .sandbox-entry small { margin-left: auto; color: #6d685c; font-weight: 700; }
  .article-entry { background:#eef9ff; box-shadow:5px 5px 0 #79c9ed; }
  .article-entry:hover { box-shadow:7px 7px 0 #79c9ed; }
  @media(max-width:650px) { .special-entries { grid-template-columns:1fr; }.sandbox-entry small{font-size:.68rem} }
</style>
