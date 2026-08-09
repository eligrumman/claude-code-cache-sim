<script lang="ts">
  import { MODEL_IN } from "../sim/cost.js";
  import { SCENARIOS } from "../sim/scenarios.js";
  import {
    DEFAULT_MONKEY, DEFAULT_TOGGLES, FIT_TABLE, ROSTER, isGameOver, overdraftLeft, priceRoutedTask,
    routeTask, scenarioToDispatchWave, type DispatchTask, type DispatchToggles, type FitOutcome, type Monkey,
  } from "./engine.js";

  interface Props { onback: () => void }
  let { onback }: Props = $props();

  interface LiveTask extends DispatchTask { progress: number; lane: number }
  interface Pop { x: number; y: number; text: string; tone: FitOutcome; life: number }

  const W = 900;
  const H = 330;
  const waves = SCENARIOS.map(scenarioToDispatchWave);
  const typeMeta = {
    dev: { icon: "⌨", color: "#77b7ec", short: "DEV" },
    plan: { icon: "◇", color: "#b795d8", short: "PLAN" },
    "browser-test": { icon: "◎", color: "#7fd2c1", short: "BROWSER" },
    "code-review": { icon: "⌕", color: "#efbd61", short: "REVIEW" },
    docs: { icon: "≡", color: "#a9ce73", short: "DOCS" },
    bug: { icon: "⚠", color: "#ef806f", short: "BUG" },
    "production-issue": { icon: "🔥", color: "#db544d", short: "PROD" },
  } as const;

  let canvas = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D | null = null;
  let phase = $state<"title" | "playing" | "dead" | "won">("title");
  let sandboxMode = $state(false);
  let dailyBudget = $state(6);
  let budget = $state(6);
  let allowance = $state(2.1);
  let spend = $state(0);
  let baseline = $state(0);
  let reworkSpend = $state(0);
  let clean = $state(0);
  let bad = $state(0);
  let overkill = $state(0);
  let wasted = $state(0);
  let waveIndex = $state(0);
  let live = $state<LiveTask[]>([]);
  let queue = $state<Array<{ task: DispatchTask; at: number }>>([]);
  let pops = $state<Pop[]>([]);
  let selectedId = $state<string | null>(null);
  let running = $state(false);
  let speed = $state(1);
  let status = $state("Start the stream. Click a task, then dispatch a monkey.");
  let toggles = $state<DispatchToggles>({ ...DEFAULT_TOGGLES });
  let waveElapsed = 0;
  let lastFrame = 0;
  let raf = 0;
  let actualTouches = new Map<string, number>();
  let baselineTouches = new Map<string, number>();
  let challengeCode = $state(`function cacheReadCost(tokens, dollarPerMTok) {\n  // TODO: warm reads use the 0.1× rate\n  return 0;\n}`);
  let testOutput = $state<string[]>([]);
  let challengePassed = $state(false);

  let selectedTask = $derived(live.find(task => task.id === selectedId));
  let activeWave = $derived(waves[waveIndex]);
  let delta = $derived(baseline - spend);
  let overdraft = $derived(overdraftLeft(spend, budget, allowance));
  let spentPct = $derived(sandboxMode ? 0 : Math.min(100, spend / budget * 100));

  function money(value: number) { return `$${value.toFixed(value < 0.1 ? 3 : 2)}`; }
  function monkeyName(monkey: Monkey) { return `${monkey.model[0].toUpperCase()}${monkey.model.slice(1)} · ${monkey.effort}`; }
  function touchKey(task: DispatchTask, monkey: Monkey) { return `${monkey.model}:${task.prefixKey}`; }
  function priorFor(map: Map<string, number>, task: DispatchTask, monkey: Monkey) {
    const prior = map.get(touchKey(task, monkey));
    return prior !== undefined && prior <= task.atMin ? prior : undefined;
  }
  function remember(map: Map<string, number>, task: DispatchTask, monkey: Monkey) {
    const key = touchKey(task, monkey);
    map.set(key, Math.max(map.get(key) ?? Number.NEGATIVE_INFINITY, task.atMin));
  }

  function startGame() {
    budget = dailyBudget;
    allowance = sandboxMode ? 0 : dailyBudget * 0.35;
    spend = baseline = reworkSpend = wasted = 0;
    clean = bad = overkill = waveIndex = 0;
    live = []; queue = []; pops = []; selectedId = null; running = false; speed = 1;
    toggles = { ...DEFAULT_TOGGLES };
    actualTouches = new Map(); baselineTouches = new Map();
    phase = "playing";
    status = "Start the first live workload. Unrouted tasks fall back to Opus-high.";
  }

  function restart() {
    phase = "title"; running = false; live = []; queue = []; selectedId = null;
  }

  function startWave() {
    if (phase !== "playing" || running || live.length || queue.length || !activeWave) return;
    waveElapsed = 0;
    const gaps = activeWave.tasks.map((task, index) => index === 0 ? 0 : task.atMin - activeWave.tasks[index - 1].atMin);
    let at = 0;
    queue = activeWave.tasks.map((task, index) => {
      at += index === 0 ? 0.25 : Math.min(3.2, 0.7 + Math.max(0, gaps[index]) * 0.075);
      return { task, at };
    });
    running = true;
    status = `LIVE: ${activeWave.name}. Click a task before it reaches AUTO →`;
  }

  function spawn(task: DispatchTask) {
    const lane = task.type === "production-issue" ? 2 : task.type === "bug" ? 0 : live.length % 3;
    live = [...live, { ...task, progress: 0, lane }];
  }

  function quote(monkey: Monkey): number {
    if (!selectedTask) return 0;
    return priceRoutedTask(selectedTask, monkey, toggles, priorFor(actualTouches, selectedTask, monkey)).usd;
  }

  function dispatch(taskId: string, monkey: Monkey, automatic = false) {
    const task = live.find(item => item.id === taskId);
    if (!task || phase !== "playing") return;
    const actualPrior = priorFor(actualTouches, task, monkey);
    const baselinePrior = task.origin === "scenario" ? priorFor(baselineTouches, task, DEFAULT_MONKEY) : undefined;
    const result = routeTask(task, monkey, toggles, actualPrior, baselinePrior);
    spend += result.usd;
    remember(actualTouches, task, monkey);
    if (task.origin === "scenario") {
      baseline += result.baselineUsd;
      remember(baselineTouches, task, DEFAULT_MONKEY);
    } else {
      reworkSpend += result.usd;
    }
    if (result.outcome === "good-fit") clean += 1;
    if (result.outcome === "bad-output") bad += 1;
    if (result.outcome === "overkill") { overkill += 1; wasted += result.wastedUsd; }

    const laneY = 88 + task.lane * 76;
    const x = 80 + task.progress * 700;
    const text = result.outcome === "bad-output" ? `BAD OUTPUT → +${result.rework.length} rework`
      : result.outcome === "overkill" ? `OVERKILL · ${money(result.wastedUsd)} waste`
        : `CLEAN · ${money(result.usd)}`;
    pops = [...pops, { x, y: laneY, text, tone: result.outcome, life: 1.8 }];
    live = live.filter(item => item.id !== task.id);
    selectedId = selectedId === task.id ? null : selectedId;

    result.rework.forEach((rework, index) => {
      queue = [...queue, { task: rework, at: waveElapsed + 1.2 + index * 1.1 }];
    });
    status = automatic
      ? `AUTO routed ${task.type} to Opus-high: ${result.outcome}. Default is safe, not cheap.`
      : `${monkeyName(monkey)} → ${task.type}: ${result.outcome.replace("-", " ")}.`;

    if (!sandboxMode && isGameOver(spend, budget, allowance)) {
      phase = "dead"; running = false; challengePassed = false; testOutput = [];
    }
  }

  function tick(rawDt: number) {
    if (!running || phase !== "playing") return;
    const dt = Math.min(0.04, rawDt) * speed;
    waveElapsed += dt;
    const due = queue.filter(item => item.at <= waveElapsed);
    queue = queue.filter(item => item.at > waveElapsed);
    due.forEach(item => spawn(item.task));
    live = live.map(task => ({ ...task, progress: task.progress + dt * (task.origin === "rework" ? 0.105 : 0.09) }));
    const escaped = live.filter(task => task.progress >= 1).map(task => task.id);
    escaped.forEach(id => dispatch(id, DEFAULT_MONKEY, true));
    pops = pops.map(pop => ({ ...pop, life: pop.life - dt })).filter(pop => pop.life > 0);
    if (phase === "playing" && running && queue.length === 0 && live.length === 0) {
      running = false;
      if (waveIndex >= waves.length - 1) phase = "won";
      else {
        waveIndex += 1;
        status = `Workload cleared. Next: ${waves[waveIndex].name}. Reconfigure before starting.`;
      }
    }
  }

  function cardAt(task: LiveTask) { return { x: 62 + task.progress * 720, y: 57 + task.lane * 76, w: 154, h: 58 }; }

  function boardClick(event: MouseEvent) {
    if (!canvas || phase !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    const hit = [...live].reverse().find(task => {
      const card = cardAt(task);
      return x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h;
    });
    if (hit) {
      selectedId = hit.id;
      status = `Selected ${hit.type}. Ideal: ${FIT_TABLE[hit.type].label}. Pick a monkey now.`;
    }
  }

  function drawRoundRect(x: number, y: number, w: number, h: number, radius: number) {
    ctx?.beginPath(); ctx?.roundRect(x, y, w, h, radius);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ded9cb"; ctx.lineWidth = 1; ctx.setLineDash([3, 8]);
    for (let y = 86; y <= 238; y += 76) { ctx.beginPath(); ctx.moveTo(26, y); ctx.lineTo(862, y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = "#726c61"; ctx.font = "700 12px ui-monospace"; ctx.fillText("INCOMING", 22, 28);
    ctx.fillText("AUTO → OPUS·HIGH", 746, 28);
    ctx.strokeStyle = "#37332d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(854, 42); ctx.lineTo(854, 291); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(847, 51); ctx.lineTo(854, 42); ctx.lineTo(861, 51); ctx.stroke();

    for (const task of live) {
      const meta = typeMeta[task.type];
      const card = cardAt(task);
      drawRoundRect(card.x, card.y, card.w, card.h, 12);
      ctx.fillStyle = selectedId === task.id ? "#fff4b8" : meta.color; ctx.fill();
      ctx.strokeStyle = selectedId === task.id ? "#1e1d1a" : "#4b463f"; ctx.lineWidth = selectedId === task.id ? 3 : 1.5; ctx.stroke();
      ctx.fillStyle = "#24221e"; ctx.font = "900 12px ui-monospace"; ctx.fillText(`${meta.icon} ${meta.short}`, card.x + 10, card.y + 20);
      ctx.font = "11px system-ui";
      const title = task.title.length > 22 ? `${task.title.slice(0, 22)}…` : task.title;
      ctx.fillText(title, card.x + 10, card.y + 41);
      if (task.origin === "rework") { ctx.fillStyle = "#a32d2d"; ctx.font = "900 9px ui-monospace"; ctx.fillText("REWORK", card.x + 105, card.y + 18); }
      ctx.beginPath(); ctx.moveTo(card.x + 18, card.y + card.h); ctx.lineTo(card.x + 14, card.y + card.h + 9); ctx.stroke();
    }
    for (const pop of pops) {
      ctx.globalAlpha = Math.min(1, pop.life * 1.4);
      ctx.fillStyle = pop.tone === "good-fit" ? "#167a4a" : pop.tone === "overkill" ? "#996100" : "#bd332e";
      ctx.font = "900 13px system-ui"; ctx.fillText(pop.text, pop.x, pop.y - (1.8 - pop.life) * 24);
      ctx.globalAlpha = 1;
    }
  }

  function runChallenge() {
    testOutput = [];
    try {
      const factory = new Function(
        "globalThis", "self", "window", "document", "fetch", "XMLHttpRequest", "WebSocket",
        "navigator", "location", "localStorage", "sessionStorage",
        `"use strict";\n${challengeCode}\nreturn typeof cacheReadCost === "function" ? cacheReadCost : null;`,
      );
      const fn = factory(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined) as null | ((a:number,b:number)=>unknown);
      if (!fn) throw new Error("cacheReadCost was not defined");
      const cases: [number, number, number][] = [[20_000,3,.006],[100_000,5,.05],[1_000_000,10,1]];
      let ok = true;
      testOutput = cases.map(([tok, rate, expected], index) => {
        const got = fn(tok, rate);
        const pass = typeof got === "number" && Number.isFinite(got) && Math.abs(got - expected) < 1e-9;
        ok &&= pass;
        return pass ? `✓ test ${index + 1} passed` : `✗ test ${index + 1}: expected ${expected}, got ${String(got)}`;
      });
      challengePassed = ok;
    } catch (error) {
      testOutput = [`✗ Build failed: ${error instanceof Error ? error.message : String(error)}`]; challengePassed = false;
    }
  }

  function revive() {
    spend = Math.min(spend, budget + allowance * .5); phase = "playing"; running = true; challengePassed = false;
    status = "Rehired! ☕ Claude is awake. Route the remaining tasks before AUTO does.";
  }

  // The canvas is conditional: it does not exist while the title card is showing.
  // Follow its lifetime so starting/restarting the game also starts/stops exactly one loop.
  $effect(() => {
    const activeCanvas = canvas;
    if (!activeCanvas) {
      ctx = null;
      return;
    }
    ctx = activeCanvas.getContext("2d");
    lastFrame = 0;
    const frame = (now: number) => {
      const dt = lastFrame ? (now - lastFrame) / 1000 : 0; lastFrame = now;
      tick(dt); draw(); raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ctx = null;
    };
  });
</script>

<section class="td-shell">
  <header class="topline">
    <button class="sketch" onclick={onback}>← Map</button>
    <div><h1>🎈 Tokenloons TD</h1><p>live Claude Code dispatch</p></div>
    <button class="sketch" onclick={restart}>↻ Restart</button>
  </header>

  {#if phase === "title"}
    <div class="title-card">
      <div class="balloons" aria-hidden="true"><i></i><i></i><i></i></div>
      <h2>Your default monkey is expensive.</h2>
      <p>Tasks stream toward <b>Opus-high</b>. It gets the work right, but using it for docs, browser checks, and tiny reviews quietly eats your budget. Route each task to the cheapest worker that can do it well.</p>
      <div class="lesson"><span>too weak → bugs → production fires</span><span>good fit → clean savings</span><span>too strong → wasted spend</span></div>
      <label class="mode"><input type="checkbox" bind:checked={sandboxMode}><span><b>Sandbox mode</b><small>No budget, no death. Same tasks and economics.</small></span></label>
      {#if !sandboxMode}
        <label class="budget">Budget <b>{money(dailyBudget)}</b><input type="range" min="2" max="15" step=".5" bind:value={dailyBudget}></label>
        <small class="overdraft-note">plus {money(dailyBudget * .35)} overdraft; revive in the mock IDE if it runs dry</small>
      {/if}
      <button class="primary big" onclick={startGame}>Clock in →</button>
    </div>
  {:else}
    <div class="hud">
      <div class="metric budget-meter"><small>{sandboxMode ? "SCORE · SPEND INCL. REWORK" : "SCORE · SPEND / BUDGET"}</small><b>{money(spend)} {#if !sandboxMode}<em>/ {money(budget)}</em>{/if}</b>{#if !sandboxMode}<div class="bar"><i style={`width:${spentPct}%`}></i></div>{/if}</div>
      <div class="metric"><small>DEFAULT WOULD COST</small><b>{money(baseline)}</b><span class:loss={delta < 0}>{delta >= 0 ? `${money(delta)} saved` : `${money(-delta)} worse`}</span></div>
      <div class="metric"><small>QUALITY</small><b><span class="green">{clean}✓</span> · <span class="red">{bad} bad</span></b><span>{reworkSpend ? `${money(reworkSpend)} rework` : "no rework yet"}</span></div>
      <div class="metric"><small>OVERKILL</small><b>{overkill} tasks</b><span>{money(wasted)} avoidable</span></div>
      {#if !sandboxMode}<div class="metric"><small>OVERDRAFT LEFT</small><b class:red={overdraft < allowance * .25}>{money(overdraft)}</b><span>after budget</span></div>{/if}
    </div>

    <div class="wave-note"><b>{waveIndex + 1}/{waves.length} · {activeWave?.name}</b><span>{activeWave?.lesson}</span></div>

    <div class="config-rail" aria-label="Free global configuration">
      <strong>FREE CONFIG →</strong>
      <label><input type="checkbox" bind:checked={toggles.keepWarm}> ☕ keep-warm <small>pings across idle gaps</small></label>
      <div class="seg"><button class:active={toggles.ttl === "5m"} onclick={() => toggles.ttl = "5m"}>TTL 5m</button><button class:active={toggles.ttl === "1h"} onclick={() => toggles.ttl = "1h"}>TTL 1h</button></div>
      <div class="seg"><button class:active={toggles.approval === "auto"} onclick={() => toggles.approval = "auto"}>auto-approve</button><button class:active={toggles.approval === "manual"} onclick={() => toggles.approval = "manual"}>manual</button></div>
      <label title="Lazy-loaded only for docs; reduces the docs context token bucket."><input type="checkbox" bind:checked={toggles.docsSkill}> 📚 lazy docs skill</label>
      <label class="mcp" title="An honest anti-pattern: its 12k context tokens are priced on every task."><input type="checkbox" bind:checked={toggles.alwaysLoadedMcp}> 🔌 always-loaded MCP</label>
    </div>

    <div class="game-grid">
      <aside class="roster">
        <h3>Monkey roster</h3>
        <p class="selection">{#if selectedTask}<b>{typeMeta[selectedTask.type].icon} {selectedTask.type}</b><small>Ideal: {FIT_TABLE[selectedTask.type].label}</small>{:else}<b>Click a moving task</b><small>Otherwise AUTO uses Opus-high.</small>{/if}</p>
        {#each ROSTER as monkey}
          <button class:default={monkey.model === "opus" && monkey.effort === "high"} onclick={() => selectedTask && dispatch(selectedTask.id, monkey)} disabled={!selectedTask || phase !== "playing"}>
            <span><b>{monkeyName(monkey)}</b><small>${MODEL_IN[monkey.model]}/M input · {monkey.effort} thinking</small></span>
            <strong>{selectedTask ? money(quote(monkey)) : "—"}</strong>
          </button>
        {/each}
        <p class="fineprint">Quotes use the shared token ledger with your current config. “Fable” is powerful, fictional, and comically pricey.</p>
      </aside>

      <main class="board-wrap">
        <canvas bind:this={canvas} width={W} height={H} onclick={boardClick} aria-label="Live task dispatch lane; click a task to select it"></canvas>
        <div class="status">✎ {status}</div>
        <div class="controls">
          <button class="primary" onclick={startWave} disabled={running || live.length > 0 || queue.length > 0 || phase !== "playing"}>▶ Start {activeWave?.name}</button>
          <button class="sketch" onclick={() => running = !running} disabled={phase !== "playing" || (!running && !live.length && !queue.length)}>{running ? "Ⅱ Pause" : "▶ Resume"}</button>
          <button class="sketch" onclick={() => speed = speed === 1 ? 1.7 : 1}>{speed}×</button>
          <span>{live.length} active · {queue.length} incoming</span>
        </div>
      </main>
    </div>
  {/if}
</section>

{#if phase === "dead" && !sandboxMode}
  <div class="scrim">
    <div class="ide">
      <div class="ide-top"><span class="dots">● ● ●</span><b>cache-rescue.ts — 1 problem</b><span>BUILD FAILED</span></div>
      <div class="death-copy"><h2>💸 Out of tokens.</h2><p><b>Your boss is NOT happy.</b> Claude is asleep — write the function yourself to get the dispatch desk back.</p></div>
      <div class="editor"><div class="lines">1<br>2<br>3<br>4</div><textarea bind:value={challengeCode} spellcheck="false" aria-label="Cache cost coding challenge"></textarea></div>
      <p class="spec">Return the warm cache-read cost: <code>tokens × 0.1 × dollarPerMTok ÷ 1,000,000</code></p>
      {#if testOutput.length}<pre class:passing={challengePassed}>{testOutput.join("\n")}{challengePassed ? "\n\n✓ 3 passed. Rehire paperwork suspiciously fast." : "\n\nTests failed. The production fire remains employed."}</pre>{/if}
      {#if challengePassed}<div class="rehired">Rehired! ☕ Claude is awake again.</div>{/if}
      <div class="ide-actions"><button class="run" onclick={runChallenge}>▷ Run tests</button>{#if challengePassed}<button class="revive" onclick={revive}>Resume dispatch →</button>{/if}<button onclick={restart}>Start over</button></div>
    </div>
  </div>
{/if}

{#if phase === "won"}
  <div class="scrim"><div class="win-card"><div class="confetti">🎈 ✦ 🎈</div><h2>Workday routed.</h2><p>You spent <b>{money(spend)}</b>. Sending the original workload to Opus-high would have cost <b>{money(baseline)}</b>.</p><div class:negative={delta < 0} class="saved-total">{delta >= 0 ? `You saved ${money(delta)}` : `You overspent by ${money(-delta)}`}</div><p>{bad ? `${bad} bad outputs created ${money(reworkSpend)} of rework. Cheap is only cheap when it still works.` : "No bad-output cascades. Nice judgment."}</p><button class="primary" onclick={restart}>Route another day</button><button class="sketch" onclick={onback}>Back to map</button></div></div>
{/if}

<style>
  .td-shell{font-family:ui-rounded,"Comic Sans MS",system-ui,sans-serif;color:#292722}.topline{display:flex;align-items:center;gap:14px;margin-bottom:11px}.topline div{flex:1;text-align:center}.topline h1{margin:0;font-size:27px}.topline p{margin:1px;color:#756e63;font-size:12px}.sketch,.controls button,.win-card button{border:2px solid #34312a;background:#fff;border-radius:9px;padding:7px 11px;font-weight:800;cursor:pointer;box-shadow:2px 2px 0 #34312a}.sketch:disabled,.controls button:disabled{opacity:.4;cursor:not-allowed}.title-card{max-width:720px;margin:32px auto;padding:30px;text-align:center;background:#fffef9;border:3px solid #302d27;border-radius:24px 17px 27px 19px;box-shadow:9px 10px 0 #80cea0}.title-card h2{font-size:34px;margin:8px 0}.title-card>p{max-width:580px;margin:10px auto;line-height:1.55}.balloons{height:48px}.balloons i{display:inline-block;width:34px;height:44px;margin:0 4px;border:2px solid #302d27;border-radius:52% 48% 46% 45%;background:#e36a57;transform:rotate(-6deg)}.balloons i:nth-child(2){width:26px;height:34px;background:#f1c958;transform:translateY(8px)}.balloons i:nth-child(3){width:20px;height:27px;background:#76c98f;transform:translateY(12px) rotate(7deg)}.lesson{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:19px 0}.lesson span{padding:9px;border:1.5px dashed #716b60;border-radius:9px;background:#fff}.mode{display:flex;gap:10px;align-items:center;text-align:left;max-width:370px;margin:15px auto;padding:10px 13px;border:2px solid #302d27;border-radius:11px;background:#ecf8e9}.mode input,.config-rail input{accent-color:#258454}.mode span,.mode small{display:block}.mode small{color:#6c665c}.budget{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px}.budget input{width:250px;accent-color:#d6584c}.overdraft-note{display:block;color:#756a58}.primary{border:2px solid #292722!important;background:#f2c94c!important;color:#292722!important;box-shadow:3px 3px 0 #292722!important;font-weight:900}.primary.big{margin-top:18px;padding:11px 20px;border-radius:11px;font-size:16px;cursor:pointer}.hud{display:grid;grid-template-columns:1.25fr repeat(4,1fr);gap:7px;margin-bottom:8px}.metric{min-width:0;padding:8px 10px;background:#fff;border:2px solid #34312a;border-radius:10px;box-shadow:2px 2px 0 #ded5c2}.metric small{display:block;font:850 8px ui-monospace;letter-spacing:.05em;color:#777065}.metric b{display:block;font:850 16px ui-monospace;white-space:nowrap}.metric em{font-size:10px;color:#716a60}.metric>span{display:block;margin-top:2px;font-size:9px;color:#24784a}.metric>span.loss,.red{color:#bd3c36}.green{color:#1e7b4b}.bar{height:5px;margin-top:4px;background:#e8e2d6;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#55ad70,#edbd4e 70%,#db5148);transition:width .2s}.wave-note{display:flex;gap:10px;align-items:center;padding:7px 11px;background:#fff7de;border:2px dashed #aa713b;border-radius:9px;margin-bottom:8px}.wave-note b{white-space:nowrap}.wave-note span{font-size:10px;color:#6d645a}.config-rail{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:7px 9px;margin-bottom:8px;border:2px solid #34312a;border-radius:10px;background:#f2f7ff;font-size:10px}.config-rail>strong{font:900 10px ui-monospace}.config-rail label{display:flex;align-items:center;gap:3px;padding:5px 7px;background:#fff;border:1px solid #a8a295;border-radius:7px;cursor:pointer}.config-rail label small{color:#7d7569}.config-rail .mcp{background:#fff0ee}.seg{display:flex}.seg button{padding:5px 7px;border:1px solid #817a70;background:#fff;font-size:10px;font-weight:750;cursor:pointer}.seg button:first-child{border-radius:7px 0 0 7px}.seg button:last-child{border-radius:0 7px 7px 0;border-left:0}.seg button.active{background:#2f7750;color:#fff}.game-grid{display:grid;grid-template-columns:230px 1fr;gap:9px}.roster{padding:10px;background:#fff;border:2px solid #34312a;border-radius:12px;box-shadow:4px 4px 0 #9bc9a2}.roster h3{margin:0 0 7px}.selection{min-height:37px;margin:0 0 8px;padding:7px;background:#fff8d7;border-left:4px solid #e5b93e}.selection b,.selection small{display:block}.selection small{font-size:9px;color:#6c655a}.roster>button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:5px;padding:6px 7px;margin-bottom:5px;text-align:left;border:1.5px solid #bdb6a9;border-radius:8px;background:#fffdf7;cursor:pointer;color:#292722}.roster>button:hover:not(:disabled){transform:translateX(3px);background:#eff9f0}.roster>button.default{border-color:#a46d5c;background:#fff0eb}.roster>button:disabled{opacity:.5;cursor:not-allowed}.roster button b,.roster button small{display:block}.roster button b{font-size:11px}.roster button small{font-size:8px;color:#776f64}.roster button>strong{font:800 10px ui-monospace}.fineprint{margin:7px 2px 0;color:#776f64;font-size:8px;line-height:1.4}.board-wrap{min-width:0}canvas{display:block;width:100%;border:3px solid #34312a;border-radius:13px;background:#fffdf7;box-shadow:4px 4px 0 #d9cfb7;cursor:pointer;touch-action:manipulation}.status{min-height:20px;margin-top:7px;padding:6px 8px;background:#fff;border-left:4px solid #e1b944;font:10px/1.35 ui-monospace}.controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:5px}.controls button{font-size:10px;padding:6px 8px}.controls span{margin-left:auto;font-size:9px;color:#736c62}.scrim{position:fixed;z-index:80;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(23,20,17,.82)}.ide{width:min(720px,100%);max-height:95vh;overflow:auto;background:#17191e;color:#e4e5e7;border:2px solid #08090b;border-radius:10px;box-shadow:12px 14px 0 rgba(0,0,0,.35);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.ide-top{display:flex;justify-content:space-between;background:#292c33;padding:9px 12px;font-size:11px;color:#adb0b7}.dots{color:#dc5a55;letter-spacing:3px}.death-copy{padding:16px 22px 6px}.death-copy h2{font-size:27px;margin:0;color:#ff7168}.death-copy p{font-family:system-ui}.editor{display:flex;margin:6px 20px;background:#111318;border:1px solid #454955}.lines{width:34px;padding:12px 8px;text-align:right;color:#626771;line-height:1.5}.editor textarea{flex:1;min-height:118px;resize:vertical;border:0;outline:0;padding:12px;background:#111318;color:#c9f7cc;font:13px/1.5 ui-monospace}.spec{margin:10px 22px;font-size:11px}.spec code{color:#ffc66d}.ide pre{margin:10px 22px;padding:10px;background:#211416;border-left:3px solid #ed5b56;color:#ff938e}.ide pre.passing{background:#102018;border-color:#55c67c;color:#8be9a7}.rehired{margin:10px 22px;color:#7fda9d;font:bold 18px system-ui}.ide-actions{display:flex;gap:8px;padding:12px 22px 20px}.ide-actions button{border:1px solid #666b76;background:#292d35;color:#eee;border-radius:5px;padding:8px 12px;font-weight:700;cursor:pointer}.ide-actions .run{background:#287f4d}.ide-actions .revive{background:#e6b944;color:#181818}.win-card{width:min(540px,100%);padding:30px;text-align:center;background:#fffdf4;border:3px solid #292722;border-radius:22px;box-shadow:9px 9px 0 #55a971}.win-card h2{font-size:34px;margin:5px}.confetti{font-size:34px}.saved-total{margin:18px;font-size:24px;font-weight:900;color:#23804f}.saved-total.negative{color:#bd3c36}.win-card button{margin:5px}
  @media(max-width:850px){.hud{grid-template-columns:repeat(2,1fr)}.game-grid{grid-template-columns:1fr}.roster{display:grid;grid-template-columns:repeat(2,1fr);gap:4px}.roster h3,.selection,.fineprint{grid-column:1/-1}.roster>button{margin:0}.wave-note{align-items:flex-start;flex-direction:column;gap:2px}.config-rail label small{display:none}.board-wrap{overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}.board-wrap canvas{width:max(100%,680px)}}
  @media(max-width:560px){.topline h1{font-size:20px}.topline .sketch{font-size:9px;padding:6px}.title-card{padding:22px 14px;margin-top:12px}.lesson{grid-template-columns:1fr}.hud{grid-template-columns:1fr 1fr}.metric b{font-size:13px}.config-rail{align-items:stretch}.config-rail>strong{width:100%}.config-rail label{flex:1}.roster{grid-template-columns:1fr 1fr}.roster button small{display:none}.budget{flex-direction:column}.controls span{margin-left:0}.ide-actions{flex-wrap:wrap}}
</style>
