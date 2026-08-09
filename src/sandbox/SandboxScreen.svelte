<script lang="ts">
  import MoneyCounter from "./MoneyCounter.svelte";
  import {
    BUCKET_META, PERSONAS, configForLever, simulateDay,
    type BucketId, type LeverId, type PersonaId, type SandboxConfig,
  } from "./model.js";
  import type { Model } from "../engine/types.js";

  let { onback }: { onback: () => void } = $props();
  let personaId = $state<PersonaId>("developer");
  let spotlight = $state<LeverId>("keepWarm");
  let showAfter = $state(false);
  let customAfter = $state<SandboxConfig>(configForLever(PERSONAS.developer.defaults, "keepWarm", true));

  const persona = $derived(PERSONAS[personaId]);
  const baselineConfig = $derived(persona.defaults);
  const baseline = $derived(simulateDay(persona, baselineConfig));
  const activeConfig = $derived(showAfter ? customAfter : baselineConfig);
  const result = $derived(simulateDay(persona, activeConfig));
  const delta = $derived(result.totalUsd - baseline.totalUsd);
  const deltaPct = $derived(baseline.totalUsd ? delta / baseline.totalUsd * 100 : 0);
  const tone = $derived(!showAfter || Math.abs(delta) < .00001 ? "neutral" : delta < 0 ? "good" : "bad");
  const bucketOrder: BucketId[] = ["input", "cacheWrite", "cacheRead", "output", "keepWarm"];
  const leverOrder: LeverId[] = ["subagents", "ttl", "context", "approval", "keepWarm", "model"];
  const leverNames: Record<LeverId, string> = {
    subagents: "Subagents prompt", ttl: "Cache TTL", context: "Context size",
    approval: "Approval mode", keepWarm: "Keep-warm ping", model: "Model",
  };
  const leverStories: Record<LeverId, Record<PersonaId, string>> = {
    subagents: {
      developer: "repeated coding helpers can share one stable brief",
      pm: "even rare research helpers benefit from a reusable brief",
      teamLead: "review helpers stop rewriting that unusually large code context",
      oneManCompany: "three helpers per session amplify every prompt mismatch",
    },
    ttl: {
      developer: "the longer tier carries context across normal coding breaks",
      pm: "meeting-shaped pauses are exactly where short-lived cache entries disappear",
      teamLead: "review pauses turn a large prefix into the important part of the bill",
      oneManCompany: "a scattered workday repeatedly tests whether context survives",
    },
    context: {
      developer: "a larger repository context magnifies both cheap reuse and cold rebuilds",
      pm: "the smaller planning context keeps this lever comparatively gentle",
      teamLead: "big code-review context makes every red rebuild physically loom larger",
      oneManCompany: "one broad company brain makes cold context especially costly",
    },
    approval: {
      developer: "six idle minutes per approval crosses the five-minute expiry line",
      pm: "human review compounds an already meeting-heavy rhythm",
      teamLead: "approval pauses can strand a forty-thousand-token review prefix",
      oneManCompany: "manual stops multiply across sixty requests in a long day",
    },
    keepWarm: {
      developer: "the pings trade session rebuilds for tiny green reads",
      pm: "long meetings reveal whether repeated pings beat accepting one rebuild",
      teamLead: "protecting a large review prefix can repay a few tiny touches quickly",
      oneManCompany: "a very long day exposes both the savings and the ping overhead",
    },
    model: {
      developer: "the same token behavior simply gets a steeper per-token price tag",
      pm: "model choice outweighs some cache tweaks when the prefix is already small",
      teamLead: "premium pricing multiplies every large review-context rebuild",
      oneManCompany: "high volume makes a model swap echo through the whole business day",
    },
  };

  const bucketColors: Record<BucketId, string> = {
    input: "#aaa9a2", cacheWrite: "#e9573f", cacheRead: "#3cab6d",
    output: "#3e83d5", keepWarm: "#8bd8aa",
  };

  function choosePersona(id: PersonaId) {
    personaId = id;
    spotlight = "keepWarm";
    showAfter = false;
    customAfter = configForLever(PERSONAS[id].defaults, spotlight, true);
  }

  function chooseLever(lever: LeverId) {
    spotlight = lever;
    customAfter = configForLever(baselineConfig, lever, true);
    showAfter = false;
  }

  function changeLever(lever: LeverId, patch: Partial<SandboxConfig>) {
    spotlight = lever;
    customAfter = { ...baselineConfig, ...patch };
    showAfter = true;
  }

  function toggleAfter() {
    if (!showAfter) showAfter = true;
  }

  function alternativeDelta(lever: LeverId) {
    return simulateDay(persona, configForLever(baselineConfig, lever, true)).totalUsd - baseline.totalUsd;
  }

  function money(value: number) {
    if (value === 0) return "$0.00";
    return `${value > 0 ? "+" : "−"}$${Math.abs(value).toFixed(2)}/day`;
  }

  function tokenLabel(tokens: number) {
    return tokens >= 1_000 ? `${(tokens / 1_000).toFixed(tokens >= 10_000 ? 0 : 1)}k` : `${tokens}`;
  }

  function clockLabel(min: number) {
    const h = Math.floor(min / 60) % 24;
    const m = Math.floor(min % 60);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")}${h >= 12 ? "p" : "a"}`;
  }

  function segmentTip(segment: (typeof result.segments)[number]) {
    return `${segment.label} · ${segment.tokens.toLocaleString()} tokens · $${segment.usd.toFixed(4)} — ${segment.why}`;
  }

  function segmentHeight(segment: (typeof result.segments)[number]) {
    if (segment.bucket === "cacheWrite") return Math.min(72, 19 + segment.tokens / 800);
    if (segment.bucket === "cacheRead") return Math.min(10, 4 + segment.tokens / 8_000);
    if (segment.bucket === "output") return Math.min(22, 10 + segment.usd * 500);
    return segment.bucket === "input" ? 9 : 15;
  }

  function bucketTip(bucket: BucketId) {
    const item = result.buckets[bucket];
    const pct = result.totalUsd ? item.usd / result.totalUsd * 100 : 0;
    return `${BUCKET_META[bucket].label} · ${item.tokens.toLocaleString()} tokens · $${item.usd.toFixed(3)} (${pct.toFixed(1)}%) — ${BUCKET_META[bucket].why}`;
  }

  function leverValue(config: SandboxConfig) {
    if (spotlight === "subagents") return config.subagents === "same" ? "SAME PROMPT" : "DIFFERENT PROMPT";
    if (spotlight === "ttl") return config.ttl === "5m" ? "5 MIN" : "1 HOUR";
    if (spotlight === "context") return `${Math.round(config.context * persona.basePrefixTok).toLocaleString()} TOKENS`;
    if (spotlight === "approval") return config.approval.toUpperCase();
    if (spotlight === "keepWarm") return config.keepWarm ? "ON" : "OFF";
    return config.model.toUpperCase();
  }

  const currentValue = $derived(leverValue(activeConfig));
  const afterValue = $derived(leverValue(customAfter));

  const takeaway = $derived(`${showAfter ? "Changing" : "Baseline for"} ${leverNames[spotlight].toLowerCase()} to ${currentValue}: ${delta < 0 ? "−" : delta > 0 ? "+" : ""}$${Math.abs(delta).toFixed(2)}/day (${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(1)}%) for the ${persona.name} — ${leverStories[spotlight][personaId]}.`);
</script>

<svelte:head><title>Claude Cache Cost Sandbox</title></svelte:head>

<main class="sandbox">
  <nav>
    <button class="back" onclick={onback}>← Back home</button>
    <span class="scribble">prompt-cache field lab</span>
  </nav>

  <header>
    <span class="eyebrow">🧪 THE COST SANDBOX</span>
    <h1>Where did Claude's money go?</h1>
    <p>Pick a workday. Flip one thing. Watch cold red rebuilds turn into tiny green reads — or the other way around.</p>
  </header>

  <section aria-labelledby="persona-title">
    <h2 id="persona-title">Whose day are we looking at?</h2>
    <div class="personas">
      {#each Object.values(PERSONAS) as item}
        <button class:active={personaId === item.id} onclick={() => choosePersona(item.id)}>
          <span>{item.emoji}</span><b>{item.name}</b><small>{item.description}</small>
        </button>
      {/each}
    </div>
  </section>

  <section class="spotlight {tone}" aria-labelledby="spotlight-title">
    <div class="spotlight-head">
      <div>
        <span class="eyebrow">⭐ SPOTLIGHT MODE</span>
        <h2 id="spotlight-title">You're looking at: <em>{leverNames[spotlight]}</em></h2>
      </div>
      <div class="ab" aria-label="Before and after comparison">
        <button class:active={!showAfter} onclick={() => (showAfter = false)}><small>A</small> BASELINE</button>
        <span>→</span>
        <button class:active={showAfter} onclick={toggleAfter}><small>B</small> {afterValue}</button>
      </div>
    </div>
    <p class="takeaway">{takeaway}</p>
  </section>

  <section class="money-row" aria-label="Daily, weekly, and monthly cost">
    <MoneyCounter value={result.totalUsd} label="per day" {tone} />
    <MoneyCounter value={result.totalUsd * 5} label="per week" {tone} />
    <MoneyCounter value={result.totalUsd * 21} label="per month" {tone} />
  </section>
  <p class="assumption">A working week is 5 days; a working month is 21. Weekends are for touching grass.</p>

  <section class="paper timeline-section" aria-labelledby="timeline-title">
    <div class="section-head">
      <div><span class="step">01</span><h2 id="timeline-title">A day in their sessions</h2></div>
      <p>Height follows price: a cold prefix is a chunky red bill; a warm read is a slim green sliver.</p>
    </div>
    <div class="legend">
      {#each bucketOrder as bucket}<span><i style={`background:${bucketColors[bucket]}`}></i>{BUCKET_META[bucket].label}</span>{/each}
    </div>
    <div class="timeline-band" class:cost-up={tone === "bad"} class:cost-down={tone === "good"}>
      {#each result.sessions as session}
        <div class="session">
          <div class="session-label"><b>Session {session.index + 1}</b><span>{clockLabel(session.startMin)}</span></div>
          <div class="requests">
            {#each Array(persona.requestsPerSession) as _, request}
              <div class="request" aria-label={`Request ${request + 1}`}>
                {#each session.segments.filter((s) => s.request === request) as segment}
                  <button
                    class="segment {segment.bucket}"
                    class:cold={segment.cold}
                    class:subagent={segment.subagent}
                    style={`--seg-color:${bucketColors[segment.bucket]}; --seg-h:${segmentHeight(segment)}px`}
                    data-tip={segmentTip(segment)}
                    aria-label={segmentTip(segment)}
                  ><span>{segment.subagent ? "↗" : ""}</span></button>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/each}
      <div class="pings" aria-label="Keep-warm pings">
        {#each result.segments.filter((s) => s.bucket === "keepWarm") as ping}
          <button class="ping" style={`left:${Math.min(99, Math.max(1, (ping.atMin - 540) / result.dayLengthMin * 100))}%`} data-tip={segmentTip(ping)} aria-label={segmentTip(ping)}></button>
        {/each}
      </div>
    </div>
    <div class="timeline-axis"><span>9am</span><span>workday flows →</span><span>{clockLabel(540 + result.dayLengthMin)}</span></div>
  </section>

  <section class="paper breakdown-section" aria-labelledby="breakdown-title">
    <div class="section-head">
      <div><span class="step">02</span><h2 id="breakdown-title">Where the money goes</h2></div>
      <p>Hover every color. Every cent traces back to real token buckets and canonical rates.</p>
    </div>
    <div class="breakdown-grid">
      <div class="donut-wrap">
        <div class="donut" style={`background:conic-gradient(${bucketOrder.map((bucket, i) => {
          const before = bucketOrder.slice(0, i).reduce((sum, key) => sum + result.buckets[key].usd, 0);
          const start = result.totalUsd ? before / result.totalUsd * 100 : 0;
          const end = result.totalUsd ? (before + result.buckets[bucket].usd) / result.totalUsd * 100 : start;
          return `${bucketColors[bucket]} ${start}% ${end}%`;
        }).join(",")})`}><span><b>${result.totalUsd.toFixed(2)}</b>today</span></div>
        <div class="cache-health" data-tip={`${result.warmPrefixTok.toLocaleString()} warm prefix tokens vs ${result.rebuiltPrefixTok.toLocaleString()} rebuilt.`}>
          <strong>{result.cacheHealthPct.toFixed(0)}%</strong><span>cache health<br><small>prefix tokens served warm</small></span>
        </div>
      </div>
      <div class="bucket-list">
        <div class="stacked" aria-label="Cost share by bucket">
          {#each bucketOrder as bucket}
            {@const pct = result.totalUsd ? result.buckets[bucket].usd / result.totalUsd * 100 : 0}
            <button style={`width:${pct}%;background:${bucketColors[bucket]}`} data-tip={bucketTip(bucket)} aria-label={bucketTip(bucket)}></button>
          {/each}
        </div>
        {#each bucketOrder as bucket}
          {@const item = result.buckets[bucket]}
          {@const pct = result.totalUsd ? item.usd / result.totalUsd * 100 : 0}
          <button class="bucket-row" data-tip={bucketTip(bucket)} aria-label={bucketTip(bucket)}>
            <i style={`background:${bucketColors[bucket]}`}></i>
            <span><b>{BUCKET_META[bucket].label}</b><small>{tokenLabel(item.tokens)} tokens</small></span>
            <span class="bar"><i style={`width:${pct}%;background:${bucketColors[bucket]}`}></i></span>
            <strong>${item.usd.toFixed(2)}<small>{pct.toFixed(0)}%</small></strong>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <section class="paper config-section" aria-labelledby="config-title">
    <div class="section-head">
      <div><span class="step">03</span><h2 id="config-title">Pick one lever to spotlight</h2></div>
      <p>Choosing a lever restores this persona's defaults, so screenshots stay honest A/B pairs.</p>
    </div>
    <div class="lever-grid">
      {#each leverOrder as lever}
        <article class:active={spotlight === lever}>
          <button class="lever-title" onclick={() => chooseLever(lever)}><span>{spotlight === lever ? "⭐" : "☆"}</span>{leverNames[lever]}</button>
          <span class:positive={alternativeDelta(lever) > 0} class:negative={alternativeDelta(lever) < 0} class="delta">{money(alternativeDelta(lever))}</span>
          {#if lever === "subagents"}
            <div class="choice"><button class:chosen={activeConfig.subagents === "same"} onclick={() => changeLever(lever, { subagents: "same" })}>same prompt</button><button class:chosen={activeConfig.subagents === "different"} onclick={() => changeLever(lever, { subagents: "different" })}>different</button></div>
          {:else if lever === "ttl"}
            <div class="choice"><button class:chosen={activeConfig.ttl === "5m"} onclick={() => changeLever(lever, { ttl: "5m" })}>5 min</button><button class:chosen={activeConfig.ttl === "1h"} onclick={() => changeLever(lever, { ttl: "1h" })}>1 hour</button></div>
          {:else if lever === "context"}
            <label class="slider"><span>small</span><input aria-label="Context size" type="range" min="0.55" max="1.8" step="0.05" value={activeConfig.context} oninput={(e) => changeLever(lever, { context: Number(e.currentTarget.value) })}><span>large</span></label>
          {:else if lever === "approval"}
            <div class="choice"><button class:chosen={activeConfig.approval === "manual"} onclick={() => changeLever(lever, { approval: "manual" })}>manual</button><button class:chosen={activeConfig.approval === "auto"} onclick={() => changeLever(lever, { approval: "auto" })}>auto</button></div>
          {:else if lever === "keepWarm"}
            <div class="choice"><button class:chosen={!activeConfig.keepWarm} onclick={() => changeLever(lever, { keepWarm: false })}>off</button><button class:chosen={activeConfig.keepWarm} onclick={() => changeLever(lever, { keepWarm: true })}>on</button></div>
          {:else}
            <div class="choice three">{#each ["sonnet", "opus", "fable"] as model}<button class:chosen={activeConfig.model === model} onclick={() => changeLever(lever, { model: model as Model })}>{model}</button>{/each}</div>
          {/if}
        </article>
      {/each}
    </div>
    <p class="tiny-note">Delta badges compare each lever's suggested opposite against this persona's baseline. Model rates: Sonnet $3/M, Opus $5/M, Fable $10/M input; bucket multipliers come straight from the shared pricing engine.</p>
  </section>
</main>

<style>
  :global(body:has(.sandbox)) { background: #fffdf8 !important; color: #22221f !important; }
  .sandbox { --red:#d94835; --green:#178353; --ink:#24231f; --muted:#6b6960; max-width: 1180px; margin: auto; padding: 24px 24px 100px; font-family: ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif; }
  nav { display:flex; justify-content:space-between; align-items:center; }
  button { font:inherit; }
  .back { border:2px solid #24231f; background:white; border-radius:11px 14px 10px 13px; padding:9px 14px; font-weight:800; cursor:pointer; box-shadow:3px 3px 0 #24231f; }
  .back:hover { transform:translate(2px,2px); box-shadow:1px 1px 0 #24231f; }
  .scribble { color:#77736a; font-size:.76rem; transform:rotate(1.5deg); }
  header { text-align:center; padding:70px 12px 52px; }
  .eyebrow { font-size:.72rem; font-weight:900; letter-spacing:.15em; color:#6c6960; }
  header h1 { font-size:clamp(2.8rem,8vw,6.6rem); line-height:.93; max-width:850px; margin:14px auto 20px; letter-spacing:-.065em; font-weight:950; }
  header p { max-width:690px; margin:auto; color:var(--muted); font-size:clamp(1rem,2.2vw,1.3rem); }
  section>h2 { text-align:center; font-size:1.1rem; margin:0 0 20px; }
  .personas { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .personas button { background:white; border:2px solid #d9d5ca; border-radius:22px 18px 24px 19px; padding:22px 18px; color:var(--ink); cursor:pointer; transition:.25s cubic-bezier(.2,.8,.2,1); text-align:left; }
  .personas button:nth-child(even) { transform:rotate(.5deg); }
  .personas button:hover { transform:translateY(-5px) rotate(-.4deg); border-color:#222; box-shadow:5px 7px 0 #eee9dd; }
  .personas button.active { border-color:#24231f; box-shadow:5px 6px 0 #f4c94e; background:#fffef5; }
  .personas button>span { font-size:2.3rem; display:block; margin-bottom:9px; }
  .personas b { display:block; font-size:1.05rem; }
  .personas small { display:block; color:var(--muted); line-height:1.35; margin-top:5px; }
  .spotlight { margin:54px 0 30px; padding:26px 30px; border:3px solid #25241f; border-radius:24px 21px 26px 20px; box-shadow:7px 8px 0 #f3cc4f; transition:.3s ease; }
  .spotlight.good { box-shadow:7px 8px 0 #9fe0b8; border-color:var(--green); }
  .spotlight.bad { box-shadow:7px 8px 0 #f4a091; border-color:var(--red); }
  .spotlight-head { display:flex; align-items:center; justify-content:space-between; gap:20px; }
  .spotlight h2 { margin:4px 0 0; font-size:clamp(1.3rem,3vw,2.1rem); }
  .spotlight h2 em { color:#8a5e00; font-style:normal; text-decoration:underline 4px #f3cc4f; text-underline-offset:5px; }
  .ab { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .ab button { cursor:pointer; border:2px solid #ccc7ba; background:white; border-radius:14px; padding:9px 14px; font-weight:900; color:#77736b; }
  .ab button.active { border-color:#24231f; color:#24231f; box-shadow:3px 3px 0 #24231f; }
  .ab small { display:block; font-size:.58rem; letter-spacing:.12em; }
  .takeaway { margin:22px 0 0; padding-top:18px; border-top:2px dashed #ddd7c9; font:700 1.05rem/1.5 Georgia,serif; }
  .money-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:55px auto 16px; max-width:1000px; }
  .assumption { text-align:center; font-size:.78rem; color:#77736a; margin-bottom:68px; }
  .paper { border:2px solid #d9d4c7; border-radius:28px 24px 30px 22px; padding:34px; margin:0 0 34px; background:white; box-shadow:0 15px 50px #4437180a; }
  .section-head { display:flex; justify-content:space-between; gap:28px; align-items:flex-start; margin-bottom:26px; }
  .section-head>div { display:flex; gap:13px; align-items:center; }
  .section-head h2 { font-size:clamp(1.35rem,3vw,2rem); margin:0; }
  .section-head p { max-width:390px; margin:0; color:var(--muted); }
  .step { width:38px;height:38px;display:grid;place-items:center;border:2px solid #222;border-radius:50% 45% 53% 48%;font-weight:900; transform:rotate(-5deg); }
  .legend { display:flex; gap:16px; flex-wrap:wrap; color:#66645d; font-size:.73rem; margin-bottom:18px; }
  .legend span { display:flex;align-items:center;gap:6px; }.legend i { width:10px;height:10px;border-radius:3px; }
  .timeline-band { position:relative; display:flex; align-items:flex-end; gap:10px; min-height:150px; padding:35px 12px 22px; border-block:2px solid #e6e1d6; background:repeating-linear-gradient(90deg,#faf8f1 0,#faf8f1 1px,transparent 1px,transparent 6.25%); overflow:visible; }
  .session { flex:1; min-width:0; border:2px solid #ccc7bb; background:#fff; border-radius:14px 11px 15px 12px; padding:9px 7px; position:relative; z-index:2; }
  .session-label { display:flex;justify-content:space-between;gap:4px;font-size:.64rem;color:#77736b;margin-bottom:7px; }.session-label b{color:#292824;}
  .requests { display:flex; align-items:flex-end; justify-content:space-evenly; gap:2px; height:96px; }
  .request { flex:1; min-width:3px; display:flex; flex-direction:column-reverse; align-items:stretch; gap:1px; }
  .segment { position:relative; display:block; width:100%; height:var(--seg-h); min-height:3px; padding:0;border:0;border-radius:3px;background:var(--seg-color);cursor:help; transition:height .32s cubic-bezier(.2,.8,.2,1),background .3s,transform .3s; }
  .timeline-band.cost-up .segment { box-shadow:inset 0 0 0 1.5px #c83527; transform:translateY(-2px); }
  .timeline-band.cost-down .segment { box-shadow:inset 0 0 0 1.5px #178353; transform:translateY(2px); }
  .timeline-band .segment:hover { transform:scaleX(1.5);z-index:12;outline:2px solid white;box-shadow:0 0 0 3px #222; }
  .segment.subagent { border:1px dashed #4b2a24; }.segment span{font-size:8px;color:white;position:absolute;inset:0;}
  .pings { position:absolute;inset:0;pointer-events:none;z-index:3; }.ping{pointer-events:auto;position:absolute;bottom:1px;width:3px;height:18px;border:0;background:#76ce99;padding:0;cursor:help;transition:left .32s ease;}
  .timeline-axis{display:flex;justify-content:space-between;color:#817e75;font-size:.68rem;margin-top:7px;font-weight:700;}
  [data-tip]{position:relative}.segment[data-tip]::after,.ping[data-tip]::after,.bucket-row[data-tip]::after,.cache-health[data-tip]::after{content:attr(data-tip);position:absolute;z-index:50;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);width:230px;padding:9px 11px;border-radius:9px;background:#24231f;color:white;font:600 11px/1.4 system-ui,sans-serif;opacity:0;pointer-events:none;transition:.15s;box-shadow:3px 4px 0 #aaa;}
  [data-tip]:hover::after{opacity:1!important}.ping[data-tip]::after{left:auto;right:0;transform:none}.bucket-row[data-tip]::after{left:auto;right:0;transform:none}.cache-health[data-tip]::after{bottom:105%;}
  .breakdown-grid{display:grid;grid-template-columns:310px 1fr;gap:50px;align-items:center}.donut-wrap{text-align:center}.donut{width:230px;aspect-ratio:1;border-radius:50%;margin:auto;display:grid;place-items:center;transition:background .35s ease;position:relative}.donut::after{content:"";position:absolute;inset:48px;border-radius:50%;background:white}.donut>span{z-index:1;color:#747168;font-size:.7rem;text-transform:uppercase;font-weight:800}.donut b{display:block;color:#24231f;font-size:1.7rem;letter-spacing:-.04em}.cache-health{display:inline-flex;gap:10px;align-items:center;text-align:left;margin-top:20px;cursor:help}.cache-health strong{font-size:1.7rem;color:var(--green)}.cache-health span{font-weight:850;line-height:1.1}.cache-health small{color:#77736b;font-weight:500}.bucket-list{display:grid;gap:9px}.stacked{display:flex;height:22px;border:2px solid #24231f;border-radius:10px;overflow:visible;margin:0 8px 8px}.stacked button{position:relative;min-width:0;height:100%;padding:0;border:0;cursor:help;transition:width .35s cubic-bezier(.2,.8,.2,1)}.stacked button:first-child{border-radius:7px 0 0 7px}.stacked button:last-child{border-radius:0 7px 7px 0}.stacked button[data-tip]::after{content:attr(data-tip);position:absolute;z-index:50;right:0;bottom:calc(100% + 8px);width:230px;padding:9px 11px;border-radius:9px;background:#24231f;color:white;font:600 11px/1.4 system-ui,sans-serif;opacity:0;pointer-events:none;box-shadow:3px 4px 0 #aaa}.bucket-row{position:relative;display:grid;grid-template-columns:13px 135px 1fr 65px;gap:10px;align-items:center;width:100%;border:0;background:transparent;padding:8px;text-align:left;cursor:help;border-radius:10px}.bucket-row:hover{background:#faf7ee}.bucket-row>i{width:11px;height:31px;border-radius:6px}.bucket-row span b,.bucket-row span small,.bucket-row>strong small{display:block}.bucket-row span small,.bucket-row>strong small{color:#7a776e;font-size:.66rem;font-weight:600}.bucket-row>strong{text-align:right;font-variant-numeric:tabular-nums}.bar{height:9px;background:#eeeae0;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;border-radius:inherit;transition:width .35s ease}
  .lever-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}.lever-grid article{position:relative;border:2px solid #ded9cc;border-radius:17px 14px 19px 15px;padding:16px;min-height:126px;transition:.25s}.lever-grid article.active{border-color:#24231f;box-shadow:4px 5px 0 #f3cc4f;transform:translateY(-2px)}.lever-title{border:0;background:transparent;padding:0;font-weight:900;cursor:pointer;color:#24231f}.lever-title span{margin-right:6px}.delta{position:absolute;right:13px;top:14px;font-size:.65rem;font-weight:900;color:#777}.delta.positive{color:var(--red)}.delta.negative{color:var(--green)}.choice{display:flex;margin-top:26px}.choice button{flex:1;border:1px solid #cfc9bc;background:#faf8f2;padding:8px 5px;cursor:pointer;font-size:.72rem;font-weight:800}.choice button:first-child{border-radius:9px 0 0 9px}.choice button:last-child{border-radius:0 9px 9px 0}.choice button+button{border-left:0}.choice button.chosen{background:#24231f;color:white}.choice.three button:not(:first-child):not(:last-child){border-radius:0}.slider{display:flex;align-items:center;gap:8px;margin-top:28px;color:#77736a;font-size:.67rem;font-weight:800}.slider input{min-width:0;width:100%;accent-color:#e9573f}.tiny-note{color:#77736b;font-size:.72rem;margin:25px 0 0;border-top:1px dashed #ddd7cb;padding-top:15px}
  @media(max-width:800px){.personas{grid-template-columns:1fr 1fr}.spotlight-head,.section-head{flex-direction:column}.ab{width:100%}.ab button{flex:1}.breakdown-grid{grid-template-columns:1fr}.lever-grid{grid-template-columns:1fr 1fr}.timeline-band{overflow-x:auto}.session{min-width:150px}}
  @media(max-width:520px){.sandbox{padding:16px 14px 70px}header{padding:50px 0 36px}.personas{grid-template-columns:1fr}.money-row{gap:4px}.paper{padding:22px 16px}.lever-grid{grid-template-columns:1fr}.breakdown-grid{gap:25px}.bucket-row{grid-template-columns:12px 115px 1fr 55px}.scribble{display:none}.spotlight{padding:20px 16px}.takeaway{font-size:.95rem}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
