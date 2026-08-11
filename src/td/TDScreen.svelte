<script lang="ts">
  import type { Model } from "../engine/types.js";
  import { MACRO_ROUTES, type Effort, type RouteVerdict } from "../article/macroPricing.js";
  import { MODELS, EFFORTS, dispatchTask, gradeFor, newDispatchState, routeFor, type DispatchTask, type DispatchState } from "./dispatchEngine.js";

  interface Props { onback: () => void }
  let { onback }: Props = $props();
  type Phase = "intro" | "playing" | "won" | "lost";
  type Spark = { id: number; verdict: RouteVerdict; text: string };
  const icons = ["🗺️", "🩹", "🔎", "🧪", "👀", "✅", "✍️"];
  const personalities: Record<Model, string> = { haiku: "tiny & quick", sonnet: "steady hand", opus: "the professor", fable: "moonshot brain" };
  const WAVE_COUNTS = [4, 5, 6, 7, 8];
  const KEEP_WARM_PRICE = 0.35;

  let phase = $state<Phase>("intro");
  let sandbox = $state(false);
  let tasks = $state<DispatchTask[]>([]);
  let selectedId = $state<string | null>(null);
  let effort = $state<Effort>("medium");
  let score = $state<DispatchState>(newDispatchState());
  let wave = $state(0);
  let serial = $state(0);
  let cacheWarmth = $state(100);
  let keepWarm = $state(false);
  let cacheEvent = $state("");
  let feedback = $state("Pick a ticket, set effort, then hire a brain.");
  let shake = $state(false);
  let sparks = $state<Spark[]>([]);
  let timer: ReturnType<typeof setInterval> | undefined;
  let sparkSerial = 0;

  let selected = $derived(tasks.find((task) => task.id === selectedId));
  let budget = $derived(1.8 + wave * 0.65);
  let savedVsPanic = $derived(score.baseline - score.spent);
  let progress = $derived(tasks.length ? Math.max(0, (WAVE_COUNTS[wave] - tasks.length) / WAVE_COUNTS[wave] * 100) : 100);

  function money(value: number) { return `$${Math.max(0, value).toFixed(2)}`; }
  function makeTask(routeIndex = (serial * 3 + wave) % MACRO_ROUTES.length, rework = false): DispatchTask {
    serial += 1;
    return { id: `dispatch-${serial}`, routeIndex, rework, urgent: rework || (serial + wave) % 4 === 0 };
  }
  function seedWave() {
    tasks = Array.from({ length: WAVE_COUNTS[wave] }, (_, index) => makeTask((index * 2 + wave) % MACRO_ROUTES.length));
    selectedId = tasks[0]?.id ?? null;
    feedback = `Wave ${wave + 1}: ${tasks.length} tickets just hit the belt.`;
  }
  function start() {
    phase = "playing"; wave = 0; serial = 0; score = newDispatchState(); cacheWarmth = 100;
    keepWarm = false; cacheEvent = ""; sparks = []; seedWave(); startClock();
  }
  function startClock() {
    if (timer) clearInterval(timer);
    if (typeof window === "undefined" || import.meta.env.MODE === "test") return;
    timer = setInterval(() => {
      cacheWarmth = Math.max(15, cacheWarmth - (keepWarm ? 0.25 : 0.7));
      if (Math.random() < 0.045) triggerCacheMiss();
    }, 1000);
  }
  function triggerCacheMiss() {
    const events = ["CLAUDE.md edited!", "Context reshuffled!", "Prefix changed lanes!"];
    cacheEvent = events[Math.floor(Math.random() * events.length)];
    cacheWarmth = Math.max(8, cacheWarmth - (keepWarm ? 12 : 42));
    setTimeout(() => { cacheEvent = ""; }, 2200);
  }
  function buyKeepWarm() {
    if (keepWarm || score.banked < KEEP_WARM_PRICE) return;
    keepWarm = true; score = { ...score, banked: score.banked - KEEP_WARM_PRICE };
    feedback = "🔥 Prefix tending enabled. Cache shocks now land softly.";
  }
  function selectTask(task: DispatchTask) { selectedId = task.id; }
  function chooseBrain(model: Model) {
    if (!selected) { feedback = "Choose a ticket first — brains dislike mystery paperwork."; return; }
    const task = selected;
    const route = routeFor(task);
    const multiplier = 1 + (100 - cacheWarmth) / 100 * 0.75;
    const result = dispatchTask(score, task, model, effort, multiplier);
    score = result.state;
    tasks = tasks.filter((item) => item.id !== task.id);
    if (result.rework) tasks = [...tasks, { ...result.rework, id: `${result.rework.id}-${serial++}` }];
    const copy = result.verdict === "good" ? `Perfect fit! +${money(result.reward)} into the jar.`
      : result.verdict === "expensive" ? `Delivered, but ${model} was more brain than this needed.`
      : `Uh-oh. Bad output → fit-route rework charged and bounced back.`;
    feedback = `${route.task} · ${copy}`;
    sparks = [...sparks, { id: ++sparkSerial, verdict: result.verdict, text: result.verdict === "good" ? "+$" : result.verdict === "bad" ? "REWORK" : "OVERKILL" }];
    setTimeout(() => { sparks = sparks.filter((spark) => spark.id !== sparkSerial); }, 900);
    if (result.verdict === "bad") { shake = true; setTimeout(() => { shake = false; }, 380); }
    selectedId = tasks[0]?.id ?? null;
    if (!sandbox && score.spent > budget) finish("lost");
    else if (tasks.length === 0) nextWave();
  }
  function nextWave() {
    if (wave >= WAVE_COUNTS.length - 1) { finish("won"); return; }
    wave += 1; cacheWarmth = Math.max(30, cacheWarmth - 8); seedWave();
  }
  function finish(next: "won" | "lost") { phase = next; if (timer) clearInterval(timer); }
  function keyTask(event: KeyboardEvent, task: DispatchTask) {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectTask(task); }
  }
  $effect(() => () => { if (timer) clearInterval(timer); });
</script>

<section class:shake class="td-shell">
  <header class="topbar">
    <button class="back" onclick={onback} aria-label="Back to home">← map</button>
    <div class="brand"><span class="toy-eyebrow">THE ROUTING ARCADE</span><strong>DISPATCH</strong></div>
    {#if phase === "playing"}<div class="day">WAVE {wave + 1}/{WAVE_COUNTS.length}</div>{/if}
  </header>

  {#if phase === "intro"}
    <main class="intro toycard">
      <div class="stamp">INBOX<br>OPEN</div>
      <p class="toy-eyebrow">A TINY WORKDAY WITH EXPENSIVE CONSEQUENCES</p>
      <h1 class="toy-title">Right brain.<br><em>Right job.</em></h1>
      <p>Route each ticket to the smallest brain that can nail it. Keep the shared context warm. Bank the difference.</p>
      <label class="practice"><input type="checkbox" bind:checked={sandbox}> Practice mode <small>no budget, no fail</small></label>
      <button class="toy-btn launch" onclick={start}>Clock in →</button>
      <p class="hint">Keyboard friendly: Tab to a ticket, Enter to select, then Tab to a brain.</p>
    </main>
  {:else if phase === "playing"}
    <main class="game">
      <section class="hud toycard" aria-label="Workday dashboard">
        <div><span>SPENT</span><strong class="toy-num">{money(score.spent)}</strong><small>{sandbox ? "practice" : `budget ${money(budget)}`}</small></div>
        <div class:gain={savedVsPanic >= 0}><span>VS PANIC OPUS·HIGH</span><strong class="toy-num">{savedVsPanic >= 0 ? "+" : "−"}{money(Math.abs(savedVsPanic))}</strong><small>baseline {money(score.baseline)}</small></div>
        <div class="jar"><span>🫙 SAVINGS JAR</span><strong class="toy-num">{money(score.banked)}</strong><small class:combo={score.combo > 1}>{score.combo > 1 ? `×${score.combo} COMBO!` : "make a good fit"}</small>{#each sparks as spark (spark.id)}<i class={spark.verdict}>{spark.text}</i>{/each}</div>
      </section>

      <section class="cache toycard">
        <div class="cache-label"><strong>🔥 CACHE WARMTH</strong><span>{Math.round(cacheWarmth)}%</span></div>
        <div class="heat"><b style={`width:${cacheWarmth}%`}></b></div>
        <p class:event={cacheEvent}>{cacheEvent || (cacheWarmth < 55 ? "Cold prefix: input reads are spiking." : "Stable shared prefix = cheap reads.")}</p>
        <button class="toy-btn warm" disabled={keepWarm || score.banked < KEEP_WARM_PRICE} onclick={buyKeepWarm}>{keepWarm ? "✓ Tended" : `🔥 Keep-warm · ${money(KEEP_WARM_PRICE)}`}</button>
      </section>

      <section class="conveyor toycard" aria-label="Incoming tasks">
        <div class="belt-head"><span>INCOMING TICKETS</span><span>{tasks.length} LEFT</span></div>
        <div class="belt" style={`--progress:${progress}%`}>
          {#each tasks as task (task.id)}
            {@const route = routeFor(task)}
            <button class:selected={selectedId === task.id} class:rework={task.rework} class="ticket" onclick={() => selectTask(task)} onkeydown={(event) => keyTask(event, task)} aria-pressed={selectedId === task.id}>
              <b class="icon">{icons[task.routeIndex]}</b><span><strong>{route.task}</strong><small>{task.rework ? "↩ REWORK" : task.urgent ? "⚡ URGENT" : "READY"}</small></span>
              <span class="judgment"><small>JUDGMENT</small><i><b style={`width:${(task.routeIndex === 2 || task.routeIndex === 3 ? 96 : task.routeIndex === 0 ? 72 : task.routeIndex === 4 ? 55 : 28)}%`}></b></i></span>
            </button>
          {/each}
        </div>
      </section>

      <section class="dispatch-panel">
        <div class="effort toycard"><span class="toy-eyebrow">1. SET THINKING</span><div class="toy-seg">{#each EFFORTS as level}<button class:active={effort === level} onclick={() => effort = level}>{level}</button>{/each}</div></div>
        <div class="brains"><span class="toy-eyebrow">2. HIRE A BRAIN FOR {selected ? routeFor(selected).task.toUpperCase() : "..."}</span>
          <div class="brain-grid">{#each MODELS as model}<button class={`brain ${model}`} onclick={() => chooseBrain(model)} disabled={!selected}><span>{model === "haiku" ? "🫘" : model === "sonnet" ? "🧠" : model === "opus" ? "🧠✨" : "🔮"}</span><strong>{model}</strong><small>{personalities[model]}</small></button>{/each}</div>
        </div>
      </section>
      <p class="feedback" role="status">{feedback}</p>
    </main>
  {:else}
    <main class="result toycard">
      <div class="confetti">✦　●　★　✦　●</div>
      <p class="toy-eyebrow">{phase === "won" ? "SHIFT COMPLETE" : "BUDGET NEEDS A LITTLE NAP"}</p>
      <h1>{phase === "won" ? `Grade ${gradeFor(score)}` : "Merge conflict: wallet"}</h1>
      <p>{phase === "won" ? "The professor did not need to answer every email. Beautiful." : "You panic-hired a few too many professors. The tickets forgive you."}</p>
      <div class="receipt"><span>You banked</span><strong>{money(Math.max(0, savedVsPanic))}</strong><small>vs panic-defaulting {money(score.baseline)} · {score.reworks} reworks</small></div>
      <div class="result-actions"><button class="toy-btn" onclick={start}>↻ Try another shift</button><button class="toy-btn ghost" onclick={onback}>Back to map</button></div>
    </main>
  {/if}
</section>

<style>
  :global(body:has(.td-shell)){background:var(--toy-cream)!important;color:var(--toy-ink)!important}
  .td-shell{background:var(--toy-cream);min-height:100dvh;color:var(--toy-ink);font-family:var(--font-body);padding:clamp(12px,2vw,28px);box-sizing:border-box;overflow:hidden}
  button{font:inherit;color:inherit}.topbar{max-width:1120px;margin:auto;display:flex;align-items:center;justify-content:space-between}.back{border:0;background:none;font-weight:800;cursor:pointer}.brand{text-align:center;line-height:1}.brand strong{display:block;font:900 clamp(24px,4vw,42px)/.9 var(--font-display);letter-spacing:.08em}.day{font-weight:900;border:2px solid var(--toy-ink);padding:7px 12px;border-radius:99px;background:var(--toy-gold-soft)}
  .intro,.result{max-width:700px;margin:7vh auto 0;padding:clamp(28px,6vw,70px);text-align:center;position:relative;transform:rotate(-.5deg)}.intro h1{font-size:clamp(54px,10vw,104px);line-height:.78;margin:.25em 0}.intro em{color:var(--toy-green-ink);font-style:normal}.intro>p:not(.toy-eyebrow,.hint){font-size:clamp(17px,2vw,22px);max-width:530px;margin:25px auto}.stamp{position:absolute;right:30px;top:25px;border:3px solid var(--toy-red-ink);color:var(--toy-red-ink);padding:8px;transform:rotate(8deg);font-weight:900}.practice{display:block;margin:22px}.practice small{color:var(--toy-muted)}.launch{font-size:22px!important;padding:13px 30px!important;background:var(--toy-green)!important}.hint{font-size:12px;color:var(--toy-muted)}
  .game{max-width:1120px;margin:18px auto}.hud{display:grid;grid-template-columns:repeat(3,1fr);padding:15px;margin-bottom:12px;background:var(--toy-paper);border:var(--toy-border-w) solid var(--toy-border);box-shadow:var(--toy-card-shadow)}.hud>div{padding:5px 18px;border-right:1px dashed var(--toy-dash);position:relative}.hud>div:last-child{border:0}.hud span,.hud small{display:block;font-size:11px;font-weight:800;color:var(--toy-muted)}.hud strong{font-size:clamp(24px,4vw,42px);color:var(--toy-ink)}.hud>div:nth-child(2):not(.gain) strong{color:var(--toy-red-ink)}.hud .gain strong{color:var(--toy-green-ink)}.jar{background:var(--toy-gold-soft);border-radius:var(--toy-radius)}.jar i{position:absolute;right:15px;top:5px;font-style:normal;font-weight:900;animation:coin .8s ease-out forwards}.jar i.good{color:var(--toy-green-ink)}.jar i.bad{color:var(--toy-red-ink)}.combo{color:var(--toy-green-ink)!important;animation:wiggle .35s}
  .cache{padding:12px 150px 12px 16px;position:relative;margin-bottom:12px}.cache-label{display:flex;justify-content:space-between}.heat{height:12px;background:var(--toy-cream-2);border:2px solid var(--toy-ink);border-radius:99px;overflow:hidden}.heat b{display:block;height:100%;background:linear-gradient(90deg,var(--toy-red),var(--toy-gold),var(--toy-green));transition:width .5s}.cache p{margin:5px 0 0;font-size:12px}.cache p.event{color:var(--toy-red-ink);font-weight:900}.warm{position:absolute;right:12px;top:15px}.warm:disabled{opacity:.5}
  .conveyor{padding:0;overflow:hidden}.belt-head{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:2px solid var(--toy-ink);font-weight:900;font-size:12px}.belt{display:flex;gap:12px;padding:20px;overflow-x:auto;background:repeating-linear-gradient(100deg,var(--toy-cream-2) 0 24px,var(--toy-paper) 24px 48px)}.ticket{flex:0 0 205px;min-height:90px;border:2px solid var(--toy-ink);border-radius:10px;background:var(--toy-paper);box-shadow:3px 4px 0 var(--toy-ink);display:grid;grid-template-columns:42px 1fr;align-items:center;text-align:left;padding:10px;cursor:pointer;transition:.15s}.ticket:hover,.ticket.selected{transform:translateY(-5px) rotate(-1deg);background:var(--toy-blue-soft)}.ticket.selected{outline:4px solid var(--toy-gold)}.ticket.rework{background:var(--toy-red-soft);animation:bounce .5s}.ticket .icon{font-size:28px}.ticket small{display:block;font-size:9px;color:var(--toy-muted)}.judgment{grid-column:1/-1;display:flex;gap:7px;align-items:center}.judgment i{height:7px;flex:1;background:var(--toy-cream-2);border-radius:9px;overflow:hidden}.judgment i b{display:block;height:100%;background:var(--toy-blue)}
  .dispatch-panel{display:grid;grid-template-columns:210px 1fr;gap:12px;margin-top:12px}.effort{padding:16px}.toy-seg{margin-top:12px}.toy-seg button{text-transform:capitalize}.brains{padding:8px}.brain-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px}.brain{min-height:104px;border:2px solid var(--toy-ink);border-radius:14px;background:var(--toy-paper);box-shadow:var(--card-shadow);cursor:pointer;transition:transform .13s,box-shadow .13s}.brain:hover:not(:disabled){transform:translateY(-7px) scale(1.03) rotate(1deg);box-shadow:6px 8px 0 var(--toy-ink)}.brain:active:not(:disabled){transform:translateY(2px)}.brain:disabled{opacity:.45}.brain span,.brain small{display:block}.brain span{font-size:28px}.brain strong{text-transform:capitalize;font:900 20px var(--font-display)}.brain.haiku{background:var(--toy-green-soft)}.brain.sonnet{background:var(--toy-blue-soft)}.brain.opus{background:var(--toy-gold-soft)}.brain.fable{background:var(--toy-red-soft)}.feedback{text-align:center;font-weight:800;min-height:24px}.result h1{font:900 clamp(50px,10vw,100px) var(--font-display);margin:.15em}.receipt{background:var(--toy-gold-soft);border:2px dashed var(--toy-ink);padding:20px;margin:25px}.receipt span,.receipt small{display:block}.receipt strong{font:900 55px var(--font-display);color:var(--toy-green-ink)}.result-actions{display:flex;gap:12px;justify-content:center}.ghost{background:var(--toy-paper)!important}.confetti{font-size:30px;color:var(--toy-gold-ink)}
  @keyframes coin{to{transform:translate(-100px,65px) scale(.3);opacity:0}}@keyframes wiggle{50%{transform:scale(1.25) rotate(-4deg)}}@keyframes bounce{50%{transform:translateY(-8px)}}@keyframes shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.shake{animation:shake .12s 3}
  @media(max-width:700px){.hud{grid-template-columns:1fr}.hud>div{border-right:0;border-bottom:1px dashed var(--toy-dash)}.cache{padding:12px}.warm{position:static;margin-top:8px}.dispatch-panel{grid-template-columns:1fr}.brain-grid{grid-template-columns:repeat(2,1fr)}.stamp{display:none}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
