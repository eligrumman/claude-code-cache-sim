<script lang="ts">
  import { onMount } from "svelte";
  import { balloonCost, isGameOver, overdraftLeft, shrinkToRead, type BalloonEconomy } from "./engine.js";

  interface Props { onback: () => void }
  let { onback }: Props = $props();

  type TowerKind = "prefix" | "warm" | "subagent";
  interface Tower { id: number; kind: TowerKind; x: number; y: number; range: number; upgraded: boolean; memory: Record<string, number> }
  interface Balloon extends BalloonEconomy { id: number; prefix: string; prompt: string; subagent: boolean; progress: number; speed: number; processed: Set<number>; reinflateAt?: number; reinflated?: boolean }
  interface FloatText { x: number; y: number; text: string; life: number }
  interface Wave { name: string; lesson: string; balloons: Array<{ tokens: number; prefix: string; prompt?: string; subagent?: boolean; delay: number; gap?: boolean }> }

  const W = 800, H = 440;
  const path = [{x:34,y:72},{x:250,y:72},{x:250,y:202},{x:548,y:202},{x:548,y:354},{x:758,y:354}];
  const shop: Record<TowerKind, { name: string; icon: string; price: number; range: number; blurb: string }> = {
    prefix: { name: "Prefix Cacher", icon: "📚", price: .08, range: 92, blurb: "First writes; matching prefixes read at 0.1×" },
    warm: { name: "Keep-Warm", icon: "☕", price: .06, range: 105, blurb: "Stops TTL re-inflation; tiny upkeep" },
    subagent: { name: "Same-Prompt", icon: "🧬", price: .10, range: 96, blurb: "Collapses identical subagent swarms" },
  };
  const waves: Wave[] = [
    { name: "Morning repeats", lesson: "Repeated project-A requests — teach a Prefix Cacher their shared prefix.", balloons: [0,1,2,3,4].map(i => ({tokens: 38_000, prefix:"project-A", delay:i*.72})) },
    { name: "BIG context lands", lesson: "A huge red context repeats. One remembered prefix saves a fortune.", balloons: [0,1,2].map(i => ({tokens: 105_000, prefix:"big-repo", delay:i*1.05})) },
    { name: "Identical subagent swarm", lesson: "Same prompt, many workers. The Same-Prompt tower loves this.", balloons: [0,1,2,3,4,5,6,7].map(i => ({tokens: 24_000, prefix:"agents", prompt:"review-one-file", subagent:true, delay:i*.34})) },
    { name: "The lunch-break gap", lesson: "The cache sat idle. Stop green requests re-inflating at the ⏳ gate.", balloons: [0,1,2,3,4].map(i => ({tokens: 58_000, prefix:"project-A", delay:i*.7, gap:true})) },
    { name: "4:59 PM mixed rush", lesson: "Repeats, varied prompts, and expensive context all arrive at once.", balloons: [
      {tokens:72_000,prefix:"project-A",delay:0},{tokens:30_000,prefix:"agents",prompt:"same",subagent:true,delay:.3},
      {tokens:91_000,prefix:"final",delay:.65},{tokens:30_000,prefix:"agents",prompt:"different-1",subagent:true,delay:.9},
      {tokens:72_000,prefix:"project-A",delay:1.15},{tokens:30_000,prefix:"agents",prompt:"different-2",subagent:true,delay:1.35},
      {tokens:91_000,prefix:"final",delay:1.7},{tokens:30_000,prefix:"agents",prompt:"same",subagent:true,delay:2.0},
    ] },
  ];

  let canvas = $state<HTMLCanvasElement>();
  let ctx: CanvasRenderingContext2D | null = null;
  let phase = $state<"title"|"playing"|"dead"|"won">("title");
  let dailyBudget = $state(2.0);
  let budget = $state(2.0);
  let allowance = $state(.7);
  let spend = $state(0);
  let credits = $state(.24);
  let totalSaved = $state(0);
  let waveIndex = $state(0);
  let running = $state(false);
  let speed = $state(1);
  let selected = $state<TowerKind | null>("prefix");
  let selectedTowerId = $state<number | null>(null);
  let status = $state("Pick a tower, then tap a grass tile beside the path.");
  let balloons = $state<Balloon[]>([]);
  let towers = $state<Tower[]>([]);
  let floats = $state<FloatText[]>([]);
  let spawnQueue = $state<Array<Wave["balloons"][number] & { at: number }>>([]);
  let waveElapsed = 0;
  let simMinutes = 0;
  let nextId = 1;
  let lastFrame = 0;
  let raf = 0;
  let challengeCode = $state(`function cacheReadCost(tokens, dollarPerMTok) {\n  // TODO: warm reads use the 0.1× rate\n  return 0;\n}`);
  let testOutput = $state<string[]>([]);
  let challengePassed = $state(false);
  let spentPct = $derived(Math.min(100, spend / budget * 100));
  let overdraft = $derived(overdraftLeft(spend, budget, allowance));
  let activeWave = $derived(waves[waveIndex]);

  function money(n: number) { return `$${n.toFixed(n < .1 ? 3 : 2)}`; }
  function startGame() {
    budget = dailyBudget; allowance = dailyBudget * .35; spend = 0; credits = .24;
    totalSaved = 0; waveIndex = 0; balloons = []; towers = []; floats = [];
    spawnQueue = []; running = false; speed = 1; phase = "playing"; simMinutes = 0;
    status = "Place a Prefix Cacher near the first bend, then start the wave.";
  }
  function restart() { phase = "title"; running = false; balloons = []; towers = []; spawnQueue = []; }

  function startWave() {
    if (running || balloons.length || spawnQueue.length || phase !== "playing") return;
    const wave = waves[waveIndex];
    if (!wave) return;
    if (waveIndex === 3) simMinutes += 8; // a visible workday gap: default 5m memories expire
    waveElapsed = 0;
    spawnQueue = wave.balloons.map(b => ({...b, at:b.delay}));
    running = true;
    status = `Incoming: ${wave.name}!`;
  }

  function spawn(spec: Wave["balloons"][number]) {
    const fullCost = balloonCost(spec.tokens, "sonnet", "write");
    const startsWarm = Boolean(spec.gap);
    balloons = [...balloons, {
      id: nextId++, tokens: spec.tokens, model:"sonnet", fullCost,
      currentCost: startsWarm ? balloonCost(spec.tokens, "sonnet", "read") : fullCost,
      prefix:spec.prefix, prompt:spec.prompt ?? spec.prefix, subagent:Boolean(spec.subagent),
      progress:0, speed:.092 + Math.min(.025, 28_000/spec.tokens*.012), processed:new Set(),
      reinflateAt: spec.gap ? .48 : undefined,
    }];
  }

  function pointAt(progress: number) {
    const lengths = path.slice(1).map((p,i) => Math.hypot(p.x-path[i].x,p.y-path[i].y));
    const total = lengths.reduce((a,b)=>a+b,0); let left = progress*total;
    for (let i=0;i<lengths.length;i++) {
      if (left <= lengths[i]) { const t=left/lengths[i]; return {x:path[i].x+(path[i+1].x-path[i].x)*t,y:path[i].y+(path[i+1].y-path[i].y)*t}; }
      left -= lengths[i];
    }
    return path[path.length-1];
  }
  function dist(a:{x:number;y:number}, b:{x:number;y:number}) { return Math.hypot(a.x-b.x,a.y-b.y); }
  function addSaving(b: Balloon, amount: number, p:{x:number;y:number}) {
    if (amount <= .000001) return;
    credits += amount; totalSaved += amount;
    floats = [...floats, {x:p.x,y:p.y,text:`+${money(amount)} saved`,life:1.15}];
  }
  function tick(rawDt: number) {
    if (!running || phase !== "playing") return;
    const dt = Math.min(.035, rawDt) * speed;
    waveElapsed += dt; simMinutes += dt * 1.4;
    const due = spawnQueue.filter(s => s.at <= waveElapsed);
    spawnQueue = spawnQueue.filter(s => s.at > waveElapsed);
    due.forEach(spawn);
    for (const tower of towers) if (tower.kind === "warm") credits = Math.max(0, credits - .00035*dt);

    for (const b of balloons) {
      b.progress += b.speed * dt;
      const p = pointAt(b.progress);
      if (b.reinflateAt && !b.reinflated && b.progress >= b.reinflateAt) {
        const warmCover = towers.some(t => t.kind === "warm" && dist(t,p) <= t.range);
        const longMemory = towers.some(t => t.kind === "prefix" && t.upgraded && t.memory[b.prefix] !== undefined);
        if (!warmCover && !longMemory) {
          b.currentCost = b.fullCost; b.reinflated = true;
          floats = [...floats,{x:p.x,y:p.y,text:"TTL expired! ↗",life:1.25}];
        } else {
          b.reinflated = true;
          floats = [...floats,{x:p.x,y:p.y,text:warmCover?"☕ kept warm":"1h TTL held",life:1.1}];
        }
      }
      for (const tower of towers) {
        if (b.processed.has(tower.id) || dist(tower,p) > tower.range) continue;
        b.processed.add(tower.id);
        if (tower.kind === "prefix") {
          const last = tower.memory[b.prefix];
          const ttl = tower.upgraded ? 60 : 5;
          if (last !== undefined && simMinutes-last <= ttl) addSaving(b, shrinkToRead(b), p);
          else floats = [...floats,{x:p.x,y:p.y,text:"prefix learned",life:.9}];
          tower.memory[b.prefix] = simMinutes;
        } else if (tower.kind === "subagent" && b.subagent) {
          const twins = balloons.filter(o => o.subagent && o.prompt === b.prompt && Math.abs(o.progress-b.progress)<.18).length;
          if (twins >= 2) addSaving(b, shrinkToRead(b), p);
          else floats = [...floats,{x:p.x,y:p.y,text:"varied ≠ cached",life:.8}];
        }
      }
    }
    const arrived = balloons.filter(b => b.progress >= 1);
    if (arrived.length) {
      spend += arrived.reduce((sum,b)=>sum+b.currentCost,0);
      balloons = balloons.filter(b => b.progress < 1);
      if (isGameOver(spend,budget,allowance)) { phase="dead"; running=false; challengePassed=false; testOutput=[]; }
    } else balloons = [...balloons];
    floats = floats.map(f=>({...f,life:f.life-dt})).filter(f=>f.life>0);
    if (running && !spawnQueue.length && !balloons.length) {
      running=false;
      if (waveIndex >= waves.length-1) { phase="won"; }
      else { waveIndex += 1; status=`Wave cleared. Incoming next: ${waves[waveIndex].name}`; }
    }
  }

  function canPlace(x:number,y:number) {
    if (x<28||x>772||y<30||y>415) return false;
    for(let i=0;i<path.length-1;i++) {
      const a=path[i], b=path[i+1], l2=(b.x-a.x)**2+(b.y-a.y)**2;
      const t=Math.max(0,Math.min(1,((x-a.x)*(b.x-a.x)+(y-a.y)*(b.y-a.y))/l2));
      if (Math.hypot(x-(a.x+t*(b.x-a.x)),y-(a.y+t*(b.y-a.y)))<40) return false;
    }
    return !towers.some(t=>Math.hypot(x-t.x,y-t.y)<48);
  }
  function boardClick(e: MouseEvent) {
    if (phase!=="playing") return;
    if (!canvas) return;
    const rect=canvas.getBoundingClientRect(), x=(e.clientX-rect.left)*W/rect.width, y=(e.clientY-rect.top)*H/rect.height;
    const hit=towers.find(t=>dist(t,{x,y})<23);
    if(hit){selectedTowerId=hit.id;selected=null;status=hit.kind==="prefix"?"Selected Prefix Cacher — upgrade its memory to 1 hour below.":"Tower selected.";return;}
    if(!selected) return;
    const item=shop[selected];
    if(credits<item.price){status=`Need ${money(item.price-credits)} more credits.`;return;}
    if(!canPlace(x,y)){status="That tile blocks the path (or another tower). Try the grass.";return;}
    towers=[...towers,{id:nextId++,kind:selected,x,y,range:item.range,upgraded:false,memory:{}}];
    credits-=item.price; selectedTowerId=null; status=`${item.name} placed. Efficiency must fund the next one!`;
  }
  function upgradeSelected() {
    const tower=towers.find(t=>t.id===selectedTowerId);
    if(!tower||tower.kind!=="prefix"||tower.upgraded) return;
    if(credits<.08){status="The 1h TTL upgrade costs $0.08 credits.";return;}
    credits-=.08;tower.upgraded=true;towers=[...towers];status="Memory upgraded: 5m → 60m. Lunch breaks no longer scare it.";
  }
  function runChallenge() {
    testOutput=[];
    try {
      // The exercise receives no browser/network capabilities; only its numeric return values matter.
      const factory = new Function(
        "globalThis", "self", "window", "document", "fetch", "XMLHttpRequest", "WebSocket",
        "navigator", "location", "localStorage", "sessionStorage",
        `"use strict";\n${challengeCode}\nreturn typeof cacheReadCost === "function" ? cacheReadCost : null;`,
      );
      const fn = factory(
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined,
      ) as null | ((a:number,b:number)=>unknown);
      if(!fn) throw new Error("cacheReadCost was not defined");
      const cases:[[number,number,number],[number,number,number],[number,number,number]]=[[20_000,3,.006],[100_000,5,.05],[1_000_000,10,1]];
      let ok=true; const lines:string[]=[];
      cases.forEach(([tok,rate,expected],i)=>{const got=fn(tok,rate);const pass=typeof got==="number"&&Number.isFinite(got)&&Math.abs(got-expected)<1e-9;ok&&=pass;lines.push(pass?`✓ test ${i+1} passed`:`✗ test ${i+1}: expected ${expected}, got ${String(got)}`);});
      testOutput=lines; challengePassed=ok;
    } catch(e) { testOutput=[`✗ Build failed: ${e instanceof Error?e.message:String(e)}`];challengePassed=false; }
  }
  function revive() {
    spend=Math.min(spend,budget+allowance*.5);phase="playing";running=true;challengePassed=false;
    status="Rehired! ☕ Claude's awake again. Half your overdraft was restored.";
  }

  function draw() {
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);ctx.fillStyle="#f8f4df";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="rgba(49,83,47,.10)";ctx.lineWidth=1;
    for(let x=20;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=20;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#d8c597";ctx.lineWidth=48;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);path.slice(1).forEach(p=>ctx!.lineTo(p.x,p.y));ctx.stroke();
    ctx.strokeStyle="#7b6b4b";ctx.lineWidth=2;ctx.setLineDash([7,8]);ctx.stroke();ctx.setLineDash([]);
    ctx.font="bold 16px system-ui";ctx.fillStyle="#27251f";ctx.fillText("Prompt",10,35);ctx.fillText("Wallet 💸",700,404);
    ctx.font="13px system-ui";ctx.fillStyle="#8b6734";ctx.fillText("⏳ TTL gate",505,285);
    for(const t of towers){
      if(t.id===selectedTowerId||selected===t.kind){ctx.beginPath();ctx.arc(t.x,t.y,t.range,0,Math.PI*2);ctx.fillStyle="rgba(54,133,85,.07)";ctx.fill();ctx.strokeStyle="rgba(54,133,85,.28)";ctx.lineWidth=1;ctx.stroke();}
      ctx.beginPath();ctx.arc(t.x,t.y,22,0,Math.PI*2);ctx.fillStyle=t.kind==="prefix"?"#6e8fbe":t.kind==="warm"?"#d69d55":"#8c70b4";ctx.fill();ctx.strokeStyle="#282621";ctx.lineWidth=2;ctx.stroke();ctx.font="23px system-ui";ctx.textAlign="center";ctx.fillText(shop[t.kind].icon,t.x,t.y+8);ctx.textAlign="left";
      if(t.upgraded){ctx.fillStyle="#282621";ctx.font="bold 10px system-ui";ctx.fillText("1h",t.x+14,t.y-17);}
    }
    for(const b of balloons){
      const p=pointAt(b.progress), ratio=Math.max(0,Math.min(1,b.currentCost/b.fullCost));
      const radius=10+Math.sqrt(b.currentCost/.006)*4;
      const red=Math.round(52+205*ratio), green=Math.round(174-95*ratio);
      ctx.beginPath();ctx.ellipse(p.x,p.y,radius*.86,radius,0,0,Math.PI*2);ctx.fillStyle=`rgb(${red},${green},75)`;ctx.fill();ctx.strokeStyle="#342d25";ctx.lineWidth=1.5;ctx.stroke();
      ctx.beginPath();ctx.moveTo(p.x,p.y+radius);ctx.lineTo(p.x-3,p.y+radius+8);ctx.stroke();
      ctx.fillStyle="#1f201d";ctx.font=`bold ${radius>17?10:8}px ui-monospace`;ctx.textAlign="center";ctx.fillText(money(b.currentCost),p.x,p.y+3);ctx.textAlign="left";
    }
    for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.text.includes("saved")?"#167a48":"#a04431";ctx.font="bold 13px system-ui";ctx.fillText(f.text,f.x-28,f.y-(1.2-f.life)*18);ctx.globalAlpha=1;}
  }
  onMount(()=>{
    if (!canvas) return;
    ctx=canvas.getContext("2d");
    const frame=(now:number)=>{const dt=lastFrame?(now-lastFrame)/1000:0;lastFrame=now;tick(dt);draw();raf=requestAnimationFrame(frame);};
    raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
  });
</script>

<section class="td-shell">
  <header class="topline"><button class="back" onclick={onback}>← Back to map</button><div><h1>🎈 Tokenloons TD</h1><p>Defend your budget.</p></div><button class="restart" onclick={restart}>↻ Restart</button></header>

  {#if phase === "title"}
    <div class="title-card">
      <div class="hero-balloons"><i></i><i></i><i></i></div>
      <h2>Tokenloons TD</h2><p class="tag">Defend your budget.</p>
      <p>Requests are drifting toward your Wallet. Cache towers shrink expensive red writes into tiny green reads. The dollars you save become your building credits.</p>
      <label class="budget-pick">Daily budget: <strong>{money(dailyBudget)}</strong><input type="range" min="1" max="3" step=".25" bind:value={dailyBudget}/></label>
      <div class="difficulty"><span>🔥 $1.00 lean</span><span>☁️ $3.00 roomy</span></div>
      <p class="overdraft-note">Overdraft allowance: <b>{money(dailyBudget*.35)}</b> beyond budget. At zero, Claude clocks out.</p>
      <button class="primary big" onclick={startGame}>Start the workday →</button>
    </div>
  {:else}
    <div class="hud-grid">
      <div class="meter-card"><div class="metric"><small>SPEND / BUDGET</small><b>{money(spend)} <em>/ {money(budget)}</em></b></div><div class="bar"><i style={`width:${spentPct}%`}></i></div></div>
      <div class="metric"><small>OVERDRAFT</small><b class:danger={overdraft<allowance*.25}>🫀 {money(overdraft)}</b></div>
      <div class="metric"><small>BUILD CREDITS</small><b class="green">✦ {money(credits)}</b></div>
      <div class="metric"><small>WAVE</small><b>{Math.min(waveIndex+1,5)} / 5</b></div>
    </div>
    <div class="incoming"><b>Incoming: {activeWave?.name ?? "Day complete"}</b><span>{activeWave?.lesson}</span></div>
    <div class="game-grid">
      <aside class="shop-panel">
        <h3>Tower shop</h3>
        {#each Object.entries(shop) as [key,item]}
          <button class:selected={selected===key} class="shop-item" onclick={()=>{selected=key as TowerKind;selectedTowerId=null;}} disabled={phase!=="playing"}>
            <span class="tower-icon">{item.icon}</span><span><b>{item.name}</b><small>{item.blurb}</small></span><strong>{money(item.price)}</strong>
          </button>
        {/each}
        <div class="upgrade-box">
          <b>📌 Prefix upgrade</b><small>1h TTL: memory survives the idle wave.</small>
          <button onclick={upgradeSelected} disabled={!selectedTowerId || towers.find(t=>t.id===selectedTowerId)?.kind!=="prefix" || towers.find(t=>t.id===selectedTowerId)?.upgraded}>Upgrade selected · $0.08</button>
        </div>
        <p class="tip">Tip: tap a placed tower to select it. Savings are real build income.</p>
      </aside>
      <main class="board-wrap">
        <canvas bind:this={canvas} width={W} height={H} onclick={boardClick} aria-label="Tokenloons tower defense field"></canvas>
        <div class="status">✎ {status}</div>
        <div class="controls">
          <button class="primary" onclick={startWave} disabled={running||balloons.length>0||spawnQueue.length>0||phase!=="playing"}>▶ Start wave {Math.min(waveIndex+1,5)}</button>
          <button onclick={()=>running=!running} disabled={phase!=="playing"||(!running&&!balloons.length&&!spawnQueue.length)}>{running?"Ⅱ Pause":"▶ Resume"}</button>
          <button onclick={()=>speed=speed===1?2:1}>{speed}× speed</button>
          <span>Saved today: <b>{money(totalSaved)}</b></span>
        </div>
      </main>
    </div>
  {/if}
</section>

{#if phase === "dead"}
  <div class="death-scrim">
    <div class="ide">
      <div class="ide-top"><span class="dots">● ● ●</span><b>cache-rescue.ts — 1 problem</b><span>BUILD FAILED</span></div>
      <div class="death-copy"><h2>💸 Out of tokens.</h2><p><b>Your boss is NOT happy.</b> Claude's asleep — write the function yourself to earn your job back. Or start over.</p></div>
      <div class="editor"><div class="lines">1<br>2<br>3<br>4</div><textarea bind:value={challengeCode} spellcheck="false" aria-label="Cache cost coding challenge"></textarea></div>
      <p class="spec">Return the warm cache-read cost: <code>tokens × 0.1 × dollarPerMTok ÷ 1,000,000</code></p>
      {#if testOutput.length}<pre class:passing={challengePassed}>{testOutput.join("\n")}{challengePassed?"\n\n✓ 3 passed. Rehire paperwork suspiciously fast.":"\n\nTests failed. The red balloon remains employed."}</pre>{/if}
      {#if challengePassed}<div class="rehired">Rehired! ☕ Claude's awake again.</div>{/if}
      <div class="ide-actions"><button class="run" onclick={runChallenge}>▷ Run tests</button>{#if challengePassed}<button class="revive" onclick={revive}>Resume workday →</button>{/if}<button onclick={restart}>Give up & start over</button></div>
    </div>
  </div>
{/if}

{#if phase === "won"}
  <div class="death-scrim"><div class="win-card"><div class="confetti">🎈 ✨ 🎈</div><h2>Budget defended!</h2><p>You survived the workday with <b>{money(spend)}</b> spent against a {money(budget)} budget.</p><div class="saved-total">You saved {money(totalSaved)} by caching</div><p>The Wallet would like to formally recognize your aggressive reuse of prefixes.</p><button class="primary" onclick={restart}>Play another day</button><button onclick={onback}>Back to map</button></div></div>
{/if}

<style>
  .td-shell{font-family:ui-rounded,"Comic Sans MS",system-ui,sans-serif;color:#292722}.topline{display:flex;align-items:center;gap:14px;margin-bottom:12px}.topline div{flex:1;text-align:center}.topline h1{font-size:27px;font-weight:900}.topline p{margin:0;color:#6f685c}.back,.restart,.controls button,.win-card button{border:2px solid #34312a;background:white;border-radius:10px;padding:8px 12px;font-weight:750;cursor:pointer;box-shadow:2px 2px 0 #34312a}.title-card{max-width:620px;margin:34px auto;background:#fffdf4;border:3px solid #302d27;border-radius:22px 17px 25px 18px;padding:32px;text-align:center;box-shadow:9px 10px 0 #f0c84c}.title-card h2{font-size:38px;margin:4px 0 0}.tag{font-size:20px;margin:0 0 20px;color:#6b655b}.title-card>p:not(.tag){max-width:480px;margin:12px auto}.hero-balloons{height:56px}.hero-balloons i{display:inline-block;width:40px;height:51px;margin:0 5px;border:2px solid #302d27;border-radius:50% 50% 45% 45%;background:#df5948;transform:rotate(-7deg)}.hero-balloons i:nth-child(2){width:28px;height:38px;background:#eab947;transform:translateY(10px)}.hero-balloons i:nth-child(3){width:19px;height:27px;background:#55ad70;transform:translateY(16px) rotate(8deg)}.budget-pick{display:flex;gap:14px;align-items:center;justify-content:center;font-size:17px;margin-top:22px}.budget-pick input{width:240px;accent-color:#df5948}.difficulty{display:flex;justify-content:space-between;max-width:375px;margin:2px auto;color:#786f62;font-size:11px}.overdraft-note{font-size:13px;color:#765b32}.primary{border:2px solid #292722!important;background:#f2c94c!important;color:#292722!important;box-shadow:3px 3px 0 #292722!important}.primary.big{font-size:17px;padding:12px 22px;border-radius:12px;font-weight:850;cursor:pointer}.hud-grid{display:grid;grid-template-columns:2fr 1fr 1fr .65fr;gap:8px;margin-bottom:9px}.hud-grid>div,.metric{background:#fff;border:2px solid #34312a;border-radius:11px;padding:8px 11px;box-shadow:2px 2px 0 #d9d0ba}.metric small{display:block;font-size:9px;font-weight:850;letter-spacing:.08em;color:#787064}.metric b{font:800 17px ui-monospace,monospace}.metric em{font-size:11px;color:#6f685c}.metric .green,.green{color:#258454}.danger{color:#c63e39}.meter-card .metric{border:0;box-shadow:none;padding:0}.bar{height:7px;background:#eee6d5;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#4fa86b 0 68%,#e2ad3e 78%,#dc5445);transition:width .25s}.incoming{display:flex;gap:10px;align-items:center;padding:8px 13px;margin-bottom:9px;border:2px dashed #a76a31;background:#fff7df;border-radius:10px}.incoming b{white-space:nowrap}.incoming span{font-size:12px;color:#6c6256}.game-grid{display:grid;grid-template-columns:235px 1fr;gap:10px}.shop-panel{background:#fff;border:2px solid #34312a;border-radius:13px;padding:10px;box-shadow:4px 4px 0 #9bc9a2}.shop-panel h3{margin:0 0 8px}.shop-item{width:100%;display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:5px;text-align:left;border:2px solid #d9d1be;background:#fffdf5;border-radius:9px;padding:8px 6px;margin-bottom:7px;cursor:pointer;color:#292722}.shop-item.selected{border-color:#317b52;background:#e8f6ea;transform:translateX(3px)}.shop-item:disabled{opacity:.6}.tower-icon{font-size:23px}.shop-item b,.shop-item small{display:block}.shop-item b{font-size:12px}.shop-item small{font-size:9px;line-height:1.3;color:#6e675d}.shop-item>strong{font-size:11px}.upgrade-box{border-top:2px dashed #d9d1be;padding-top:9px;margin-top:11px}.upgrade-box b,.upgrade-box small{display:block}.upgrade-box small{font-size:10px;color:#6e675d}.upgrade-box button{width:100%;font-size:10px;margin-top:6px;padding:6px;background:#ece5ff;border:1px solid #776597;border-radius:7px;font-weight:700;cursor:pointer}.tip{font-size:9px;color:#787064;margin:10px 2px 0}.board-wrap{min-width:0}canvas{width:100%;border:3px solid #34312a;border-radius:14px;background:#f8f4df;box-shadow:4px 4px 0 #d8c597;touch-action:manipulation;cursor:crosshair}.status{font:12px/1.4 ui-monospace,monospace;min-height:26px;padding:7px 9px;margin-top:8px;background:#fff;border-left:4px solid #e1b944}.controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.controls button{font-size:11px;padding:6px 9px}.controls button:disabled{opacity:.42}.controls span{margin-left:auto;font-size:12px}.death-scrim{position:fixed;z-index:80;inset:0;background:rgba(23,20,17,.8);display:flex;align-items:center;justify-content:center;padding:14px}.ide{width:min(720px,100%);max-height:95vh;overflow:auto;background:#17191e;color:#e4e5e7;border:2px solid #08090b;border-radius:10px;box-shadow:12px 14px 0 rgba(0,0,0,.35);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.ide-top{display:flex;justify-content:space-between;background:#292c33;padding:9px 12px;font-size:11px;color:#adb0b7}.dots{color:#dc5a55;letter-spacing:3px}.death-copy{padding:16px 22px 6px}.death-copy h2{font-size:27px;margin:0;color:#ff7168}.death-copy p{font-family:system-ui;margin:5px 0}.editor{display:flex;margin:6px 20px;background:#111318;border:1px solid #454955}.lines{width:34px;padding:12px 8px;text-align:right;color:#626771;line-height:1.5;user-select:none}.editor textarea{flex:1;min-height:118px;resize:vertical;border:0;outline:0;padding:12px;background:#111318;color:#c9f7cc;font:13px/1.5 ui-monospace,monospace}.spec{margin:10px 22px;font-size:11px}.spec code{color:#ffc66d}.ide pre{margin:10px 22px;padding:10px;background:#211416;border-left:3px solid #ed5b56;color:#ff938e}.ide pre.passing{background:#102018;border-color:#55c67c;color:#8be9a7}.rehired{margin:10px 22px;color:#7fda9d;font:bold 18px system-ui}.ide-actions{display:flex;gap:8px;padding:12px 22px 20px}.ide-actions button{border:1px solid #666b76;background:#292d35;color:#eee;border-radius:5px;padding:8px 12px;font-weight:700;cursor:pointer}.ide-actions .run{background:#287f4d}.ide-actions .revive{background:#e6b944;color:#181818}.win-card{width:min(520px,100%);text-align:center;background:#fffdf4;border:3px solid #292722;border-radius:22px;padding:30px;box-shadow:9px 9px 0 #55a971}.win-card h2{font-size:35px;margin:4px}.confetti{font-size:35px}.saved-total{font-size:23px;font-weight:900;color:#23804f;margin:20px}.win-card button{margin:5px}
  @media(max-width:760px){.game-grid{grid-template-columns:1fr}.shop-panel{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.shop-panel h3,.upgrade-box,.tip{grid-column:1/-1}.shop-item{grid-template-columns:1fr;text-align:center}.shop-item small{display:none}.hud-grid{grid-template-columns:1fr 1fr}.incoming{align-items:flex-start;flex-direction:column;gap:1px}.topline h1{font-size:20px}.back,.restart{font-size:10px;padding:6px}.title-card{margin-top:10px;padding:22px 15px}.budget-pick{flex-direction:column}.controls span{margin-left:0}.ide-actions{flex-wrap:wrap}}
</style>
