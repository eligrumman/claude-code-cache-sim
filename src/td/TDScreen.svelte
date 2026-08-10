<script lang="ts">
  import { MODEL_IN } from "../sim/cost.js";
  import { SCENARIOS } from "../sim/scenarios.js";
  import CopyButton from "../setup/CopyButton.svelte";
  import ConfigHelp from "../components/ConfigHelp.svelte";
  import { recipeById, type RecipeId } from "../setup/recipes.js";
  import {
    DEFAULT_MAIN, DEFAULT_TOGGLES, EFFORTS, FIT_TABLE, MODELS, ROUTABLE_TASK_TYPES,
    createMoab, defaultRoutingControl, isGameOver, liveSpendRate, overdraftLeft,
    resolveRoute, routeTaskWithControl, scenarioToDispatchWave, scoreMoab,
    type DispatchTask, type DispatchToggles, type FitOutcome, type RouteResult, type RoutingControl, type Worker,
  } from "./engine.js";

  interface Props { onback: () => void }
  let { onback }: Props = $props();
  interface LiveTask extends DispatchTask { progress: number; lane: number }
  interface Pop { x: number; y: number; text: string; tone: FitOutcome; life: number }

  const W = 900;
  const H = 330;
  const gameSetups: readonly { id: RecipeId; label: string }[] = [
    { id: "keep-warm", label: "Keep-warm" },
    { id: "ttl", label: "TTL" },
    { id: "auto-approve", label: "Approvals" },
    { id: "compact", label: "Compaction" },
    { id: "lazy", label: "Lazy skills + MCPs" },
    { id: "lazy", label: "Docs skill" },
    { id: "lazy", label: "Extra MCP" },
  ];
  const waves = SCENARIOS.map(scenarioToDispatchWave);
  const typeMeta = {
    plan: { icon: "📐", color: "#cbb3e5", short: "PLAN" },
    hotfix: { icon: "🚑", color: "#ff9b8f", short: "HOTFIX" },
    debugging: { icon: "🔍", color: "#8ec4ef", short: "DEBUG" },
    rca: { icon: "🧪", color: "#ba9cdb", short: "RCA" },
    "code-review": { icon: "👀", color: "#efc86d", short: "REVIEW" },
    testing: { icon: "✅", color: "#83d5bf", short: "TEST" },
    docs: { icon: "📄", color: "#b8d987", short: "DOCS" },
    bug: { icon: "🐞", color: "#f18c7e", short: "BUG" },
    "production-issue": { icon: "🔥", color: "#df5c54", short: "PROD" },
  } as const;

  let canvas = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D | null = null;
  let phase = $state<"title" | "playing" | "dead" | "won">("title");
  let sandboxMode = $state(false);
  let dailyBudget = $state(25);
  let budget = $state(25);
  let allowance = $state(8.75);
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
  let status = $state("One main agent receives everything. Retune it before the stream starts.");
  let toggles = $state<DispatchToggles>({ ...DEFAULT_TOGGLES });
  let control = $state<RoutingControl>(defaultRoutingControl());
  let moabResults = $state<RouteResult[]>([]);
  let moabSeen = $state(false);
  let waveElapsed = 0;
  let lastFrame = 0;
  let raf = 0;
  let actualTouches = new Map<string, number>();
  let baselineTouches = new Map<string, number>();
  let actualContexts = new Map<string, number>();
  let baselineContexts = new Map<string, number>();
  let challengeCode = $state(`function cacheReadCost(tokens, dollarPerMTok) {\n  // TODO: warm reads use the 0.1× rate\n  return 0;\n}`);
  let testOutput = $state<string[]>([]);
  let challengePassed = $state(false);

  let selectedTask = $derived(live.find(task => task.id === selectedId));
  let activeWave = $derived(waves[waveIndex]);
  let previewTask = $derived(selectedTask ?? queue[0]?.task ?? activeWave?.tasks[0]);
  let spendRate = $derived.by(() => {
    spend;
    if (!previewTask) return 0;
    const key = touchKey(previewTask);
    return routeTaskWithControl(
      previewTask, control, toggles, undefined, undefined,
      actualContexts.get(key) ?? 0, baselineContexts.get(`main-1m:${DEFAULT_MAIN.model}`) ?? 0,
    ).usd;
  });
  let delta = $derived(baseline - spend);
  let overdraft = $derived(overdraftLeft(spend, budget, allowance));
  let spentPct = $derived(sandboxMode ? 0 : Math.min(100, spend / budget * 100));
  let moabScore = $derived(scoreMoab(moabResults));

  function safeMoney(value: number) {
    const finite = Number.isFinite(value) && value >= 0 ? value : 0;
    return `$${finite.toFixed(finite < 0.1 ? 3 : 2)}`;
  }
  function rateMoney(value: number) {
    const finite = Number.isFinite(value) && value >= 0 ? value : 0;
    return `$${finite.toFixed(3)}`;
  }
  function workerName(worker: Worker) { return `${worker.model[0].toUpperCase()}${worker.model.slice(1)} · ${worker.effort}`; }
  function touchKey(task: DispatchTask, route = resolveRoute(task.type, control)) {
    return route.context === "main-1m" ? `main-1m:${route.worker.model}` : `scoped:${route.worker.model}:${task.type}`;
  }
  function priorFor(map: Map<string, number>, task: DispatchTask, key: string) {
    const prior = map.get(key);
    return prior !== undefined && prior <= task.atMin ? prior : undefined;
  }
  function remember(map: Map<string, number>, task: DispatchTask, key: string) { map.set(key, Math.max(map.get(key) ?? Number.NEGATIVE_INFINITY, task.atMin)); }

  function startGame() {
    budget = dailyBudget;
    allowance = sandboxMode ? 0 : dailyBudget * 0.35;
    spend = baseline = reworkSpend = wasted = 0;
    clean = bad = overkill = waveIndex = 0;
    live = []; queue = []; pops = []; moabResults = []; moabSeen = false; selectedId = null; running = false; speed = 1;
    toggles = { ...DEFAULT_TOGGLES };
    control = defaultRoutingControl();
    actualTouches = new Map(); baselineTouches = new Map(); actualContexts = new Map(); baselineContexts = new Map();
    phase = "playing";
    status = "MAIN AGENT is Opus · high with a real 1M-token prefix. Change model or effort live.";
  }
  function restart() { phase = "title"; running = false; live = []; queue = []; selectedId = null; }

  function startWave() {
    if (phase !== "playing" || running || live.length || queue.length || !activeWave) return;
    waveElapsed = 0;
    const isCrisis = activeWave.scenario.id === "debug-prod";
    const tasks = isCrisis ? [...createMoab(0.25, "moab-prod-down"), ...activeWave.tasks.map(task => ({ ...task, atMin: task.atMin + 8 }))] : activeWave.tasks;
    let at = 0;
    queue = tasks.map((task, index) => {
      if (isCrisis && task.origin === "moab") at = 0.25 + index * 0.035;
      else if (index === 0) at = 0.25;
      else at += Math.min(3.2, 0.7 + Math.max(0, task.atMin - tasks[index - 1].atMin) * 0.075);
      return { task, at };
    });
    if (isCrisis) { moabSeen = true; status = "🚨 MOAB: production DOWN — every incident stage just landed URGENT."; }
    else status = `LIVE: ${activeWave.name}. Routes are applied when each task reaches the agent.`;
    running = true;
  }

  function spawn(task: DispatchTask) {
    const lane = task.urgent ? live.length % 3 : task.type === "production-issue" ? 2 : task.type === "bug" ? 0 : live.length % 3;
    live = [...live, { ...task, progress: 0, lane }];
  }

  function dispatch(taskId: string, automatic = false) {
    const task = live.find(item => item.id === taskId);
    if (!task || phase !== "playing") return;
    const route = resolveRoute(task.type, control);
    const actualKey = touchKey(task, route);
    const baselineKey = `main-1m:${DEFAULT_MAIN.model}`;
    const result = routeTaskWithControl(
      task, control, toggles,
      priorFor(actualTouches, task, actualKey),
      task.origin === "scenario" || task.origin === "moab" ? priorFor(baselineTouches, task, baselineKey) : undefined,
      actualContexts.get(actualKey) ?? 0,
      baselineContexts.get(baselineKey) ?? 0,
    );
    spend += result.usd;
    remember(actualTouches, task, actualKey);
    actualContexts.set(actualKey, result.nextConversationTok);
    if (task.origin !== "rework") {
      baseline += result.baselineUsd;
      remember(baselineTouches, task, baselineKey);
      baselineContexts.set(baselineKey, result.baselineNextConversationTok);
    } else reworkSpend += result.usd;
    if (result.outcome === "good-fit") clean += 1;
    if (result.outcome === "bad-output") bad += 1;
    if (result.outcome === "overkill") { overkill += 1; wasted += result.wastedUsd; }
    if (task.incidentId) moabResults = [...moabResults, result];

    const laneY = 88 + task.lane * 76;
    const x = Math.min(650, 80 + task.progress * 700);
    const who = `${result.route.label} ${workerName(result.monkey)}`;
    const text = result.outcome === "bad-output" ? `BAD ❌ ${who} · +${result.rework.length} cascade`
      : result.outcome === "overkill" ? `EXPENSIVE 💸 ${who} · ${safeMoney(result.wastedUsd)} waste`
        : `GOOD ✅ ${who} · ${safeMoney(result.savingsUsd)} saved`;
    pops = [...pops, { x, y: laneY, text, tone: result.outcome, life: 2.6 }];
    live = live.filter(item => item.id !== task.id);
    selectedId = selectedId === task.id ? null : selectedId;
    result.rework.forEach((rework, index) => { queue = [...queue, { task: rework, at: waveElapsed + 1.1 + index * 0.8 }]; });
    status = result.compactionUsd > 0
      ? `${automatic ? "AUTO · " : "NOW · "}🗜️ compacted via Haiku (+${safeMoney(result.compactionUsd)}), then ${task.type} → ${who}.`
      : `${automatic ? "AUTO · " : "NOW · "}${task.type} → ${who}: ${text.split(" · ")[0]}.`;
    if (!sandboxMode && isGameOver(spend, budget, allowance)) { phase = "dead"; running = false; challengePassed = false; testOutput = []; }
  }

  function tick(rawDt: number) {
    if (!running || phase !== "playing") return;
    const dt = Math.min(0.04, rawDt) * speed;
    waveElapsed += dt;
    const due = queue.filter(item => item.at <= waveElapsed);
    queue = queue.filter(item => item.at > waveElapsed);
    due.forEach(item => spawn(item.task));
    live = live.map(task => ({ ...task, progress: task.progress + dt * (task.origin === "rework" ? 0.105 : task.urgent ? 0.12 : 0.09) }));
    live.filter(task => task.progress >= 1).map(task => task.id).forEach(id => dispatch(id, true));
    pops = pops.map(pop => ({ ...pop, life: pop.life - dt })).filter(pop => pop.life > 0);
    if (phase === "playing" && running && queue.length === 0 && live.length === 0) {
      running = false;
      if (waveIndex >= waves.length - 1) phase = "won";
      else { waveIndex += 1; status = `Workload cleared. Next: ${waves[waveIndex].name}. Retune routes before starting.`; }
    }
  }

  function cardAt(task: LiveTask) { return { x: 42 + task.progress * 700, y: 57 + task.lane * 76, w: 170, h: 58 }; }
  function boardClick(event: MouseEvent) {
    if (!canvas || phase !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    const hit = [...live].reverse().find(task => { const card = cardAt(task); return x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h; });
    if (hit) { selectedId = hit.id; const route = resolveRoute(hit.type, control); status = `${hit.type} selected · ${route.label} → ${workerName(route.worker)} · ideal ${FIT_TABLE[hit.type].label}.`; }
  }
  function drawRoundRect(x: number, y: number, w: number, h: number, radius: number) { ctx?.beginPath(); ctx?.roundRect(x, y, w, h, radius); }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ded9cb"; ctx.lineWidth = 1; ctx.setLineDash([3, 8]);
    for (let y = 86; y <= 238; y += 76) { ctx.beginPath(); ctx.moveTo(26, y); ctx.lineTo(862, y); ctx.stroke(); }
    ctx.setLineDash([]); ctx.fillStyle = "#726c61"; ctx.font = "700 12px ui-monospace"; ctx.fillText("INCOMING", 22, 28); ctx.fillText("ROUTE →", 796, 28);
    ctx.strokeStyle = "#37332d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(854, 42); ctx.lineTo(854, 291); ctx.stroke();
    for (const task of live) {
      const meta = typeMeta[task.type]; const card = cardAt(task); drawRoundRect(card.x, card.y, card.w, card.h, 12);
      ctx.fillStyle = selectedId === task.id ? "#fff4b8" : meta.color; ctx.fill();
      ctx.strokeStyle = task.urgent ? "#c72d27" : selectedId === task.id ? "#1e1d1a" : "#4b463f"; ctx.lineWidth = task.urgent || selectedId === task.id ? 3 : 1.5; ctx.stroke();
      ctx.fillStyle = "#24221e"; ctx.font = "900 11px ui-monospace"; ctx.fillText(`${meta.icon} ${meta.short}`, card.x + 9, card.y + 19);
      ctx.font = "10px system-ui"; const title = task.title.length > 27 ? `${task.title.slice(0, 27)}…` : task.title; ctx.fillText(title, card.x + 9, card.y + 41);
      if (task.urgent) { ctx.fillStyle = "#b51f1b"; ctx.font = "900 9px ui-monospace"; ctx.fillText("URGENT", card.x + 123, card.y + 17); }
      else if (task.origin === "rework") { ctx.fillStyle = "#a32d2d"; ctx.font = "900 9px ui-monospace"; ctx.fillText("REWORK", card.x + 121, card.y + 17); }
    }
    for (const pop of pops) {
      ctx.globalAlpha = Math.min(1, pop.life * 1.4); ctx.fillStyle = pop.tone === "good-fit" ? "#147848" : pop.tone === "overkill" ? "#996100" : "#bd332e";
      ctx.font = "900 12px system-ui"; ctx.fillText(pop.text, pop.x, pop.y - (2.6 - pop.life) * 20); ctx.globalAlpha = 1;
    }
  }

  function runChallenge() {
    testOutput = [];
    try {
      const factory = new Function("globalThis", "self", "window", "document", "fetch", "XMLHttpRequest", "WebSocket", "navigator", "location", "localStorage", "sessionStorage", `"use strict";\n${challengeCode}\nreturn typeof cacheReadCost === "function" ? cacheReadCost : null;`);
      const fn = factory(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined) as null | ((a:number,b:number)=>unknown);
      if (!fn) throw new Error("cacheReadCost was not defined");
      const cases: [number, number, number][] = [[20_000,3,.006],[100_000,5,.05],[1_000_000,10,1]];
      let ok = true;
      testOutput = cases.map(([tok, rate, expected], index) => { const got = fn(tok, rate); const pass = typeof got === "number" && Number.isFinite(got) && Math.abs(got - expected) < 1e-9; ok &&= pass; return pass ? `✓ test ${index + 1} passed` : `✗ test ${index + 1}: expected ${expected}, got ${String(got)}`; });
      challengePassed = ok;
    } catch (error) { testOutput = [`✗ Build failed: ${error instanceof Error ? error.message : String(error)}`]; challengePassed = false; }
  }
  function revive() { spend = Math.min(spend, budget + allowance * .5); phase = "playing"; running = true; challengePassed = false; status = "Rehired! ☕ Retune the route before the next expensive task lands."; }

  // Canvas is conditional. This effect owns exactly one RAF loop for exactly its mounted lifetime.
  $effect(() => {
    const activeCanvas = canvas;
    if (!activeCanvas) { ctx = null; return; }
    ctx = activeCanvas.getContext("2d"); lastFrame = 0;
    const frame = (now: number) => { const dt = lastFrame ? (now - lastFrame) / 1000 : 0; lastFrame = now; tick(dt); draw(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ctx = null; };
  });
</script>

<section class="td-shell">
  <header class="topline"><button class="sketch" onclick={onback}>← Map</button><div><h1>🎈 Tokenloons TD</h1><p>live task-routing economics</p></div><button class="sketch" onclick={restart}>↻ Restart</button></header>
  {#if phase === "title"}
    <div class="title-card">
      <div class="balloons" aria-hidden="true">🎈 🎈 🎈</div><h2>One very expensive default.</h2>
      <p>Every task starts on the <b>MAIN AGENT: Opus · high</b>, hauling a <b>1M-token context</b>. Turn on subagents to route fresh, scoped work by type—without underpowering the jobs that need deep reasoning.</p>
      <div class="lesson"><span>BAD ❌ → bug cascades</span><span>GOOD ✅ → clean savings</span><span>EXPENSIVE 💸 → wasted overpay</span></div>
      <label class="mode"><input type="checkbox" bind:checked={sandboxMode}><span><b>Sandbox mode</b><small>No budget, no death. Same economics.</small></span></label>
      {#if !sandboxMode}<label class="budget">Budget <b>{safeMoney(dailyBudget)}</b><input aria-label="Budget" type="range" min="10" max="100" step="5" bind:value={dailyBudget}></label><small class="overdraft-note">plus {safeMoney(dailyBudget * .35)} overdraft; revive in the mock IDE if it runs dry</small>{/if}
      <button class="primary big" onclick={startGame}>Clock in →</button>
    </div>
  {:else}
    <div class="hud">
      <div class="metric"><small>{sandboxMode ? "SPEND INCL. REWORK" : "SPEND / BUDGET"}</small><b>{safeMoney(spend)} {#if !sandboxMode}<em>/ {safeMoney(budget)}</em>{/if}</b>{#if !sandboxMode}<div class="bar"><i style={`width:${spentPct}%`}></i></div>{/if}</div>
      <div class="metric rate"><small>LIVE TASK RATE · REPRICES NOW</small><b>{rateMoney(spendRate)}</b><span>{previewTask?.type ?? "waiting"} at current route</span></div>
      <div class="metric"><small>DEFAULT WOULD COST</small><b>{safeMoney(baseline)}</b><span class:loss={delta < 0}>{delta >= 0 ? `${safeMoney(delta)} saved` : `${safeMoney(-delta)} worse`}</span></div>
      <div class="metric"><small>QUALITY / REWORK</small><b><span class="green">{clean}✓</span> · <span class="red">{bad} bad</span></b><span>{safeMoney(reworkSpend)} rework</span></div>
      <div class="metric"><small>OVERKILL</small><b>{overkill} tasks</b><span>{safeMoney(wasted)} avoidable</span></div>
      {#if !sandboxMode}<div class="metric"><small>OVERDRAFT LEFT</small><b class:red={overdraft < allowance * .25}>{safeMoney(overdraft)}</b><span>after budget</span></div>{/if}
    </div>
    <div class="wave-note"><b>{waveIndex + 1}/{waves.length} · {activeWave?.name}</b><span>{activeWave?.scenario.id === "debug-prod" ? "MOAB climax: hotfix + debugging + RCA + review + testing land together." : activeWave?.lesson}</span></div>
    {#if moabSeen}<div class="moab-score"><b>🐛 MOAB INCIDENT</b><span>{moabScore.stagesResolved}/5 stages · actual {safeMoney(moabScore.actualUsd)} vs panic-default {safeMoney(moabScore.panicDefaultUsd)} · {moabScore.draggedStages} dragged</span>{#if moabScore.stagesResolved === 5}<strong>{moabScore.panicDefaulted ? "You panic-defaulted every stage." : moabScore.deltaUsd >= 0 ? `${safeMoney(moabScore.deltaUsd)} survived` : `${safeMoney(-moabScore.deltaUsd)} over panic cost`}</strong>{/if}</div>{/if}
    <div class="config-rail" aria-label="Free global configuration"><strong>FREE GLOBAL CONFIG →</strong><span class="rail-check"><label><input type="checkbox" bind:checked={toggles.keepWarm}> ☕ keep-warm</label><ConfigHelp configId="keep-warm" /></span><div class="seg"><button class:active={toggles.ttl === "5m"} onclick={() => toggles.ttl = "5m"}>TTL 5m</button><button class:active={toggles.ttl === "1h"} onclick={() => toggles.ttl = "1h"}>TTL 1h</button></div><ConfigHelp configId="ttl" /><div class="seg"><button class:active={toggles.approval === "auto"} onclick={() => toggles.approval = "auto"}>auto-approve</button><button class:active={toggles.approval === "manual"} onclick={() => toggles.approval = "manual"}>manual</button></div><ConfigHelp configId="auto-approve" /><span class="rail-check"><label title="Compress history over 32k to an 8k working set; Haiku summary is charged"><input type="checkbox" bind:checked={toggles.autoCompact}> 🗜️ auto-compact</label><ConfigHelp configId="compact" /></span><span class="rail-check mcp"><label title="Load 14k tokens of skills and MCP schemas only on turns that invoke them"><input type="checkbox" bind:checked={toggles.lazyLoadTools}> 💤 lazy skills/MCPs</label><ConfigHelp configId="lazy" /></span><span class="rail-check"><label><input type="checkbox" bind:checked={toggles.docsSkill}> 📚 docs skill</label><ConfigHelp configId="docs-skill" /></span><span class="rail-check mcp"><label><input type="checkbox" bind:checked={toggles.alwaysLoadedMcp}> 🔌 extra MCP</label><ConfigHelp configId="extra-mcp" /></span></div>
    <div class="config-setups" aria-label="Copy setup for game configuration">
      {#each gameSetups as setup (`${setup.id}-${setup.label}`)}
        <details>
          <summary>⧉ Copy {setup.label} setup</summary>
          <CopyButton recipe={recipeById[setup.id]} compact />
        </details>
      {/each}
    </div>

    <div class="game-grid">
      <main class="board-wrap">
        <canvas bind:this={canvas} width={W} height={H} onclick={boardClick} aria-label="Live task routing lane; click a task to inspect it"></canvas>
        <div class="status">✎ {status}</div>
        <div class="controls"><button class="primary" onclick={startWave} disabled={running || live.length > 0 || queue.length > 0 || phase !== "playing"}>▶ Start {activeWave?.name}</button><button class="sketch" onclick={() => selectedTask && dispatch(selectedTask.id)} disabled={!selectedTask || phase !== "playing"}>Route selected now</button><button class="sketch" onclick={() => running = !running} disabled={phase !== "playing" || (!running && !live.length && !queue.length)}>{running ? "Ⅱ Pause" : "▶ Resume"}</button><button class="sketch" onclick={() => speed = speed === 1 ? 1.7 : 1}>{speed}×</button><span>{live.length} active · {queue.length} incoming</span></div>
      </main>
      <aside class="router">
        <h3>MAIN AGENT <mark>1M context</mark></h3><p>Everything lands here while subagents are off.</p>
        <div class="worker-selects"><div class="worker-field"><span>Model <ConfigHelp configId="route" /></span><select aria-label="Main agent model" bind:value={control.main.model}>{#each MODELS as model}<option value={model}>{model}</option>{/each}</select></div><div class="worker-field"><span>Effort <ConfigHelp configId="effort" /></span><select aria-label="Main agent effort" bind:value={control.main.effort}>{#each EFFORTS as effort}<option value={effort}>{effort}</option>{/each}</select></div></div>
        <small class="rate-note">${MODEL_IN[control.main.model]}/M input · HUD rate changes immediately</small>
        <details class="router-setup"><summary>⧉ Copy model + effort setup</summary><CopyButton recipe={recipeById.route} compact /></details>
        <div class="sub-toggle"><label><input type="checkbox" bind:checked={control.useSubagents}><span><b>Use subagents</b><small>Fresh scoped context, routed by type</small></span></label><ConfigHelp configId="delegate" /></div>
        <details class="router-setup"><summary>⧉ Copy subagent routing setup</summary><CopyButton recipe={recipeById.delegate} compact /></details>
        {#if control.useSubagents}
          <div class="routes"><div class="route-head"><b>TASK TYPE <ConfigHelp configId="route" /></b><b>MODEL</b><b>EFFORT</b></div>{#each ROUTABLE_TASK_TYPES as type}<div class="route-row"><span title={FIT_TABLE[type].label}>{typeMeta[type].icon} {type}</span><select aria-label={`${type} model`} bind:value={control.routes[type].model}><option value="inherit">inherit ({control.main.model})</option>{#each MODELS as model}<option value={model}>{model}</option>{/each}</select><select aria-label={`${type} effort`} bind:value={control.routes[type].effort}><option value="inherit">inherit ({control.main.effort})</option>{#each EFFORTS as effort}<option value={effort}>{effort}</option>{/each}</select></div><small class="fit">ideal: {FIT_TABLE[type].label}</small>{/each}</div>
        {:else}<div class="default-route">plan, hotfix, debugging, RCA, review, testing, docs<br><b>↓ all MAIN AGENT</b></div>{/if}
      </aside>
    </div>
  {/if}
</section>

{#if phase === "dead" && !sandboxMode}<div class="scrim"><div class="ide"><div class="ide-top"><span class="dots">● ● ●</span><b>cache-rescue.ts — 1 problem</b><span>BUILD FAILED</span></div><div class="death-copy"><h2>💸 Out of tokens.</h2><p><b>Your boss is NOT happy.</b> Claude is asleep—write the function yourself to revive dispatch.</p></div><div class="editor"><div class="lines">1<br>2<br>3<br>4</div><textarea bind:value={challengeCode} spellcheck="false" aria-label="Cache cost coding challenge"></textarea></div><p class="spec">Return: <code>tokens × 0.1 × dollarPerMTok ÷ 1,000,000</code></p>{#if testOutput.length}<pre class:passing={challengePassed}>{testOutput.join("\n")}{challengePassed ? "\n\n✓ 3 passed. Rehire paperwork suspiciously fast." : "\n\nTests failed. The production fire remains employed."}</pre>{/if}{#if challengePassed}<div class="rehired">Rehired! ☕ Claude is awake again.</div>{/if}<div class="ide-actions"><button class="run" onclick={runChallenge}>▷ Run tests</button>{#if challengePassed}<button class="revive" onclick={revive}>Resume dispatch →</button>{/if}<button onclick={restart}>Start over</button></div></div></div>{/if}
{#if phase === "won"}<div class="scrim"><div class="win-card"><div class="confetti">🎈 ✦ 🎈</div><h2>Workday routed.</h2><p>You spent <b>{safeMoney(spend)}</b>. Panic-defaulting the original work would cost <b>{safeMoney(baseline)}</b>.</p><div class:negative={delta < 0} class="saved-total">{delta >= 0 ? `You saved ${safeMoney(delta)}` : `You overspent by ${safeMoney(-delta)}`}</div><p>{bad ? `${bad} bad outputs created ${safeMoney(reworkSpend)} of rework.` : "No bad-output cascades. Nice judgment."}</p><button class="primary" onclick={restart}>Route another day</button><button class="sketch" onclick={onback}>Back to map</button></div></div>{/if}

<style>
  .td-shell{font-family:ui-rounded,"Comic Sans MS",system-ui,sans-serif;color:#292722}.topline{display:flex;align-items:center;gap:14px;margin-bottom:10px}.topline div{flex:1;text-align:center}.topline h1{margin:0;font-size:27px}.topline p{margin:1px;color:#756e63;font-size:12px}.sketch,.controls button,.win-card button{border:2px solid #34312a;background:#fff;border-radius:9px;padding:7px 11px;font-weight:800;cursor:pointer;box-shadow:2px 2px 0 #34312a}.sketch:disabled,.controls button:disabled{opacity:.4;cursor:not-allowed}.title-card{max-width:720px;margin:32px auto;padding:30px;text-align:center;background:#fffef9;border:3px solid #302d27;border-radius:24px 17px 27px 19px;box-shadow:9px 10px 0 #80cea0}.title-card h2{font-size:34px;margin:8px 0}.title-card>p{max-width:610px;margin:10px auto;line-height:1.55}.balloons{font-size:34px}.lesson{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:19px 0}.lesson span{padding:9px;border:1.5px dashed #716b60;border-radius:9px;background:#fff}.mode{display:flex;gap:10px;align-items:center;text-align:left;max-width:370px;margin:15px auto;padding:10px 13px;border:2px solid #302d27;border-radius:11px;background:#ecf8e9}.mode span,.mode small{display:block}.mode small{color:#6c665c}.budget{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:14px}.budget input{width:250px;accent-color:#d6584c}.overdraft-note{display:block;color:#756a58}.primary{border:2px solid #292722!important;background:#f2c94c!important;color:#292722!important;box-shadow:3px 3px 0 #292722!important;font-weight:900}.primary.big{margin-top:18px;padding:11px 20px;border-radius:11px;font-size:16px;cursor:pointer}.hud{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:7px}.metric{min-width:0;padding:7px 9px;background:#fff;border:2px solid #34312a;border-radius:10px;box-shadow:2px 2px 0 #ded5c2}.metric.rate{background:#fff2bd;border-color:#a8691e}.metric small{display:block;font:850 8px ui-monospace;letter-spacing:.04em;color:#777065}.metric b{display:block;font:850 15px ui-monospace;white-space:nowrap}.metric em{font-size:9px;color:#716a60}.metric>span{display:block;margin-top:2px;font-size:8px;color:#24784a}.metric>span.loss,.red{color:#bd3c36}.green{color:#1e7b4b}.bar{height:5px;margin-top:4px;background:#e8e2d6;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#55ad70,#edbd4e 70%,#db5148);transition:width .2s}.wave-note,.moab-score{display:flex;gap:10px;align-items:center;padding:6px 10px;border:2px dashed #aa713b;border-radius:9px;margin-bottom:7px;background:#fff7de}.wave-note b,.moab-score b{white-space:nowrap}.wave-note span,.moab-score span{font-size:10px;color:#6d645a}.moab-score{border-color:#b72f29;background:#fff0ec}.moab-score strong{margin-left:auto;font-size:10px;color:#a5231f}.config-rail{display:flex;gap:7px;align-items:center;flex-wrap:wrap;padding:6px 8px;margin-bottom:7px;border:2px solid #34312a;border-radius:10px;background:#f2f7ff;font-size:10px}.config-rail>strong{font:900 10px ui-monospace}.rail-check{display:flex;align-items:center;gap:1px;padding-right:3px;background:#fff;border:1px solid #a8a295;border-radius:7px}.config-rail label{display:flex;align-items:center;gap:3px;padding:5px 4px 5px 7px;cursor:pointer}.config-rail .mcp{background:#fff0ee}.seg{display:flex}.seg button{padding:5px 7px;border:1px solid #817a70;background:#fff;font-size:10px;font-weight:750;cursor:pointer}.seg button:first-child{border-radius:7px 0 0 7px}.seg button:last-child{border-radius:0 7px 7px 0;border-left:0}.seg button.active{background:#2f7750;color:#fff}.game-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:9px}.board-wrap{min-width:0}canvas{display:block;width:100%;border:3px solid #34312a;border-radius:13px;background:#fffdf7;box-shadow:4px 4px 0 #d9cfb7;cursor:pointer;touch-action:manipulation}.status{min-height:20px;margin-top:7px;padding:6px 8px;background:#fff;border-left:4px solid #e1b944;font:10px/1.35 ui-monospace}.controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:5px}.controls button{font-size:10px;padding:6px 8px}.controls span{margin-left:auto;font-size:9px;color:#736c62}.router{padding:10px;background:#fff;border:2px solid #34312a;border-radius:12px;box-shadow:4px 4px 0 #9bc9a2;max-height:430px;overflow:auto}.router h3{margin:0 0 3px;font-size:15px}.router mark{float:right;padding:2px 5px;border-radius:5px;background:#ffd8c8;font:800 9px ui-monospace}.router>p{margin:2px 0 8px;font-size:9px;color:#70685d}.worker-selects{display:grid;grid-template-columns:1fr 1fr;gap:6px}.worker-field{font:800 9px ui-monospace}.router select{width:100%;min-width:0;padding:4px;border:1px solid #8e877d;border-radius:5px;background:#fff;font-size:10px}.rate-note{display:block;margin:5px 0 8px;color:#7b5948}.sub-toggle{display:flex;gap:7px;align-items:center;padding:8px;border:2px solid #2c704e;border-radius:8px;background:#edf8ee}.sub-toggle label{display:flex;gap:7px;align-items:center;flex:1;cursor:pointer}.sub-toggle span,.sub-toggle small{display:block}.sub-toggle small{font-size:8px;color:#617066}.routes{margin-top:8px}.route-head,.route-row{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:4px;align-items:center}.route-head{padding:0 2px 3px;font:800 8px ui-monospace;color:#776f64}.route-row{padding-top:4px;border-top:1px dashed #d3cec5}.route-row span{font-size:9px;font-weight:800}.fit{display:block;text-align:right;margin:1px 2px 3px;color:#80796e;font-size:7px}.default-route{margin-top:10px;padding:13px;text-align:center;background:#fff4cf;border:1px dashed #a87632;border-radius:8px;font-size:10px;line-height:1.6}.scrim{position:fixed;z-index:80;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(23,20,17,.82)}.ide{width:min(720px,100%);max-height:95vh;overflow:auto;background:#17191e;color:#e4e5e7;border:2px solid #08090b;border-radius:10px;box-shadow:12px 14px 0 rgba(0,0,0,.35);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.ide-top{display:flex;justify-content:space-between;background:#292c33;padding:9px 12px;font-size:11px;color:#adb0b7}.dots{color:#dc5a55;letter-spacing:3px}.death-copy{padding:16px 22px 6px}.death-copy h2{font-size:27px;margin:0;color:#ff7168}.death-copy p{font-family:system-ui}.editor{display:flex;margin:6px 20px;background:#111318;border:1px solid #454955}.lines{width:34px;padding:12px 8px;text-align:right;color:#626771;line-height:1.5}.editor textarea{flex:1;min-height:118px;resize:vertical;border:0;outline:0;padding:12px;background:#111318;color:#c9f7cc;font:13px/1.5 ui-monospace}.spec{margin:10px 22px;font-size:11px}.spec code{color:#ffc66d}.ide pre{margin:10px 22px;padding:10px;background:#211416;border-left:3px solid #ed5b56;color:#ff938e}.ide pre.passing{background:#102018;border-color:#55c67c;color:#8be9a7}.rehired{margin:10px 22px;color:#7fda9d;font:bold 18px system-ui}.ide-actions{display:flex;gap:8px;padding:12px 22px 20px}.ide-actions button{border:1px solid #666b76;background:#292d35;color:#eee;border-radius:5px;padding:8px 12px;font-weight:700;cursor:pointer}.ide-actions .run{background:#287f4d}.ide-actions .revive{background:#e6b944;color:#181818}.win-card{width:min(540px,100%);padding:30px;text-align:center;background:#fffdf4;border:3px solid #292722;border-radius:22px;box-shadow:9px 9px 0 #55a971}.win-card h2{font-size:34px;margin:5px}.confetti{font-size:34px}.saved-total{margin:18px;font-size:24px;font-weight:900;color:#23804f}.saved-total.negative{color:#bd3c36}.win-card button{margin:5px}
  .config-setups{display:flex;flex-wrap:wrap;gap:5px;margin:-2px 0 8px;padding:0 4px}.config-setups details,.router-setup{min-width:0}.config-setups summary,.router-setup summary{cursor:pointer;color:#665f55;font:800 9px/1.2 ui-monospace;text-decoration:underline;text-underline-offset:2px}.config-setups details[open]{flex:1 1 100%;min-width:0;padding:5px 7px;border:1px dashed #aaa295;border-radius:8px;background:#fff}.router-setup{margin:5px 0 8px;padding-bottom:5px;border-bottom:1px dashed #d3cec5}
  @media(max-width:950px){.hud{grid-template-columns:repeat(3,1fr)}.game-grid{grid-template-columns:1fr}.router{max-height:none}.routes{display:grid;grid-template-columns:1fr 1fr;gap:0 8px}.route-head{display:none}.wave-note,.moab-score{align-items:flex-start;flex-direction:column;gap:2px}.moab-score strong{margin-left:0}.board-wrap{overflow-x:auto;padding-bottom:4px}.board-wrap canvas{width:max(100%,680px)}}
  @media(max-width:560px){.topline h1{font-size:20px}.topline .sketch{font-size:9px;padding:6px}.title-card{padding:22px 14px;margin-top:12px}.lesson{grid-template-columns:1fr}.hud{grid-template-columns:1fr 1fr}.metric b{font-size:13px}.routes{grid-template-columns:1fr}.budget{flex-direction:column}.controls span{margin-left:0}.ide-actions{flex-wrap:wrap}}
</style>
