<script lang="ts">
  import ConversationView from "./ConversationView.svelte";
  import MoneyCounter from "./MoneyCounter.svelte";
  import {
    PERSONAS, configForLever, simulateDay,
    type BucketId, type LeverId, type PersonaId, type SandboxConfig,
  } from "./model.js";
  import type { Model } from "../engine/types.js";
  import { simulateMessageLedger, type MessageLedger, type ScriptedMessage } from "../sim/ledger.js";
  import { SCENARIOS, SCENARIO_BY_ID, type Scenario, type ScenarioId } from "../sim/scenarios.js";

  let { onback }: { onback: () => void } = $props();
  let personaId = $state<PersonaId>("developer");
  let scenarioId = $state<ScenarioId | null>(null);
  let configOpen = $state(false);
  let config = $state<SandboxConfig>({ ...PERSONAS.developer.defaults });

  const persona = $derived(PERSONAS[personaId]);
  const activeScenario = $derived(scenarioId ? SCENARIO_BY_ID[scenarioId] : null);
  const defaultConfig = $derived(activeScenario ? configForScenario(activeScenario) : persona.defaults);
  const baseline = $derived(simulateDay(persona, persona.defaults));
  const result = $derived(simulateDay(persona, config));
  const scenarioScript = $derived(activeScenario ? adaptScenarioScript(activeScenario, config) : []);
  const scenarioLedger = $derived(activeScenario ? simulateMessageLedger(scenarioScript, scenarioOptions(activeScenario, config)) : null);
  const scenarioBaseline = $derived(activeScenario ? simulateMessageLedger(adaptScenarioScript(activeScenario, defaultConfig), scenarioOptions(activeScenario, defaultConfig)) : null);
  const totalUsd = $derived(scenarioLedger?.totalUsd ?? result.totalUsd);
  const baselineUsd = $derived(scenarioBaseline?.totalUsd ?? baseline.totalUsd);
  const viewBuckets = $derived(scenarioLedger ? bucketsFromLedger(scenarioLedger) : result.buckets);
  const delta = $derived(totalUsd - baselineUsd);
  const tone = $derived(Math.abs(delta) < .00001 ? "neutral" : delta < 0 ? "good" : "bad");
  const isModified = $derived(Object.keys(defaultConfig).some((key) => config[key as keyof SandboxConfig] !== defaultConfig[key as keyof SandboxConfig]));
  const ledgerOptions = $derived({
    ttl: config.ttl, model: config.model,
    prefixTok: activeScenario ? Math.round(activeScenario.defaults.prefixTok * config.context) : result.prefixTok,
    workInTok: activeScenario?.defaults.workInTok ?? persona.workInTok,
    outputTok: activeScenario?.defaults.outputTok ?? persona.outputTok,
    keepWarm: config.keepWarm,
    contextLevers: { autoCompact: Boolean(config.autoCompact), lazyLoadTools: Boolean(config.lazyLoadTools) },
  });

  const leverOrder: LeverId[] = ["subagents", "ttl", "context", "approval", "keepWarm", "autoCompact", "lazyLoadTools", "model"];
  const leverNames: Record<LeverId, string> = {
    subagents: "Subagent prompt", ttl: "Cache TTL", context: "Context size",
    approval: "Approval mode", keepWarm: "Keep-warm", autoCompact: "Auto-compact",
    lazyLoadTools: "Skills + MCP schemas", model: "Model",
  };
  const prompts = [
    ["Find the flaky test and explain the failure.", "I traced it to shared timer state and isolated the fixture."],
    ["Now update the implementation safely.", "The patch is in; the focused tests are green."],
    ["Review the edge cases before we ship.", "One cache-expiry boundary needed an explicit guard."],
    ["Run the final checks and summarize.", "Everything passes. I left the risky path covered by a regression test."],
    ["Switch over to the next workstream.", "Context loaded. I found the smallest useful vertical slice."],
    ["Wrap this up for the team.", "I wrote the handoff with costs, tradeoffs, and next steps."],
  ];

  const personaConversation = $derived.by((): ScriptedMessage[] => {
    const items: ScriptedMessage[] = [];
    for (const session of result.sessions) {
      const turns = session.segments.filter((segment) => segment.bucket === "input" && segment.request >= 0);
      for (const [requestIndex, segment] of turns.entries()) {
        const pair = prompts[(session.index + requestIndex) % prompts.length];
        const assistant = requestIndex % 2 === 1;
        items.push({
          id: `s${session.index}-${requestIndex}`, role: assistant ? "assistant" : "user",
          text: pair[assistant ? 1 : 0], atMin: segment.atMin, prefixKey: "main",
          usesTools: requestIndex % 4 === 2,
        });
      }
    }
    return items;
  });
  const conversationScript = $derived(activeScenario ? scenarioScript : personaConversation);

  function configForScenario(scenario: Scenario): SandboxConfig {
    return {
      subagents: "same", ttl: scenario.defaults.ttl, context: 1, approval: "auto",
      keepWarm: Boolean(scenario.defaults.keepWarm), model: scenario.defaults.model,
      autoCompact: true, lazyLoadTools: true,
    };
  }
  function scenarioOptions(scenario: Scenario, next: SandboxConfig) {
    return {
      ...scenario.defaults, ttl: next.ttl, model: next.model, keepWarm: next.keepWarm,
      prefixTok: Math.round(scenario.defaults.prefixTok * next.context),
      contextLevers: { autoCompact: Boolean(next.autoCompact), lazyLoadTools: Boolean(next.lazyLoadTools) },
    };
  }
  function adaptScenarioScript(scenario: Scenario, next: SandboxConfig): ScriptedMessage[] {
    return scenario.script.map((message, index) => ({
      ...message,
      atMin: message.atMin + (next.approval === "manual" ? index * 6 : 0),
      prefixKey: message.subagent && next.subagents === "different" ? `${message.prefixKey ?? "helper"}-${index}` : message.prefixKey,
      usesTools: message.subagent || index % 4 === 2,
    }));
  }
  function bucketsFromLedger(ledger: MessageLedger): Record<BucketId, { tokens: number; usd: number }> {
    const buckets: Record<BucketId, { tokens: number; usd: number }> = {
      input:{tokens:0,usd:0}, cacheWrite:{tokens:0,usd:0}, cacheRead:{tokens:0,usd:0}, output:{tokens:0,usd:0}, keepWarm:{tokens:0,usd:0}, compaction:{tokens:0,usd:0},
    };
    for (const message of ledger.messages) {
      const prefix = message.warm ? buckets.cacheRead : buckets.cacheWrite;
      prefix.tokens += message.buckets.prefix.tokens; prefix.usd += message.buckets.prefix.usd;
      buckets.input.tokens += message.buckets.workIn.tokens; buckets.input.usd += message.buckets.workIn.usd;
      buckets.output.tokens += message.buckets.output.tokens; buckets.output.usd += message.buckets.output.usd;
      buckets.keepWarm.tokens += message.buckets.keepWarm.tokens; buckets.keepWarm.usd += message.buckets.keepWarm.usd;
      buckets.compaction.tokens += message.buckets.compaction.tokens; buckets.compaction.usd += message.buckets.compaction.usd;
    }
    return buckets;
  }

  function choosePersona(id: PersonaId) {
    personaId = id;
    scenarioId = null;
    config = { ...PERSONAS[id].defaults };
  }
  function chooseScenario(id: ScenarioId) {
    scenarioId = id;
    config = configForScenario(SCENARIO_BY_ID[id]);
  }
  function changeLever(lever: LeverId, patch: Partial<SandboxConfig>) {
    config = { ...config, ...patch };
  }
  function resetDefaults() { config = { ...defaultConfig }; }
  function alternativeDelta(lever: LeverId) {
    const alternative = configForLever(defaultConfig, lever, true);
    if (activeScenario) return simulateMessageLedger(adaptScenarioScript(activeScenario, alternative), scenarioOptions(activeScenario, alternative)).totalUsd - baselineUsd;
    return simulateDay(persona, alternative).totalUsd - baselineUsd;
  }
  function moneyDelta(value: number) {
    if (Math.abs(value) < .005) return "$0.00";
    return `${value > 0 ? "+" : "−"}$${Math.abs(value).toFixed(2)}`;
  }
</script>

<svelte:head><title>Claude Cache Cost Sandbox</title></svelte:head>

<main class="sandbox">
  {#if configOpen}<button class="scrim" aria-label="Close configuration" onclick={() => configOpen = false}></button>{/if}
  <aside class="config-panel" class:open={configOpen} aria-labelledby="config-title">
    <div class="config-head">
      <div><span class="eyebrow">LIVE CONTROLS</span><h2 id="config-title">Tune the workday</h2></div>
      <button class="drawer-close" aria-label="Close configuration" onclick={() => configOpen = false}>✕</button>
    </div>

    <section class="persona-control" aria-labelledby="persona-title">
      <h3 id="persona-title">Persona</h3>
      <div class="personas">
        {#each Object.values(PERSONAS) as item}
          <button class:active={personaId === item.id} onclick={() => choosePersona(item.id)} title={item.description}>
            <span>{item.emoji}</span><b>{item.name}</b>
          </button>
        {/each}
      </div>
    </section>

    <section class="scenario-control" aria-labelledby="scenario-title">
      <h3 id="scenario-title">Load a scenario</h3>
      <select value={scenarioId ?? ""} onchange={(event) => chooseScenario(event.currentTarget.value as ScenarioId)}>
        <option value="" disabled>Choose a shared workload…</option>
        {#each SCENARIOS as scenario}<option value={scenario.id}>{scenario.title}</option>{/each}
      </select>
      {#if activeScenario}<small>{activeScenario.blurb}</small>{/if}
    </section>

    <div class="config-status">
      <span class:modified={isModified}>{isModified ? "● Modified" : "Defaults"}</span>
      <button class="reset" onclick={resetDefaults} disabled={!isModified}>Reset to defaults</button>
    </div>

    <div class="lever-grid">
      {#each leverOrder as lever}
        <article>
          <div class="lever-head"><span>{leverNames[lever]}</span><small class:positive={alternativeDelta(lever) > 0} class:negative={alternativeDelta(lever) < 0}>{moneyDelta(alternativeDelta(lever))}/day</small></div>
          {#if lever === "subagents"}
            <div class="choice"><button class:chosen={config.subagents === "same"} onclick={() => changeLever(lever, { subagents: "same" })}>same prompt</button><button class:chosen={config.subagents === "different"} onclick={() => changeLever(lever, { subagents: "different" })}>different</button></div>
          {:else if lever === "ttl"}
            <div class="choice"><button class:chosen={config.ttl === "5m"} onclick={() => changeLever(lever, { ttl: "5m" })}>5 min</button><button class:chosen={config.ttl === "1h"} onclick={() => changeLever(lever, { ttl: "1h" })}>1 hour</button></div>
          {:else if lever === "context"}
            <label class="slider"><span>small</span><input aria-label="Context size" type="range" min="0.55" max="1.8" step="0.05" value={config.context} oninput={(e) => changeLever(lever, { context: Number(e.currentTarget.value) })}><span>large</span></label>
          {:else if lever === "approval"}
            <div class="choice"><button class:chosen={config.approval === "manual"} onclick={() => changeLever(lever, { approval: "manual" })}>manual</button><button class:chosen={config.approval === "auto"} onclick={() => changeLever(lever, { approval: "auto" })}>auto</button></div>
          {:else if lever === "keepWarm"}
            <div class="choice"><button class:chosen={!config.keepWarm} onclick={() => changeLever(lever, { keepWarm: false })}>off</button><button class:chosen={config.keepWarm} onclick={() => changeLever(lever, { keepWarm: true })}>on</button></div>
          {:else if lever === "autoCompact"}
            <div class="choice"><button class:chosen={!config.autoCompact} onclick={() => changeLever(lever, { autoCompact: false })}>disabled</button><button class:chosen={config.autoCompact} onclick={() => changeLever(lever, { autoCompact: true })}>enabled</button></div>
          {:else if lever === "lazyLoadTools"}
            <div class="choice"><button class:chosen={!config.lazyLoadTools} onclick={() => changeLever(lever, { lazyLoadTools: false })}>eager 14k</button><button class:chosen={config.lazyLoadTools} onclick={() => changeLever(lever, { lazyLoadTools: true })}>lazy</button></div>
          {:else}
            <div class="choice three">{#each ["sonnet", "opus", "fable"] as model}<button class:chosen={config.model === model} onclick={() => changeLever(lever, { model: model as Model })}>{model}</button>{/each}</div>
          {/if}
        </article>
      {/each}
    </div>
  </aside>

  <section class="playground">
    <nav>
      <button class="back" onclick={onback} aria-label="Back home">←</button>
      <div><span class="eyebrow">🧪 COST SANDBOX</span><h1>Conversation playground</h1></div>
      <span class="persona-pill">{activeScenario ? `🎬 ${activeScenario.title}` : `${persona.emoji} ${persona.name}`}</span>
      <button class="config-toggle" aria-label="Open configuration" aria-expanded={configOpen} onclick={() => configOpen = true}>☰ <span>Tune</span></button>
    </nav>

    <div class="canvas" class:good={tone === "good"} class:bad={tone === "bad"}>
      <ConversationView script={conversationScript} options={ledgerOptions} bucketTotals={viewBuckets} projectedTotal={totalUsd} compact />
    </div>

    <section class="totals" aria-label="Daily, weekly, and monthly totals">
      <div class="total-context"><span>{delta === 0 ? "At persona defaults" : `${moneyDelta(delta)} vs defaults`}</span><small>5 workdays/week · 21/month</small></div>
      <MoneyCounter value={totalUsd} label="per day" {tone} />
      <MoneyCounter value={totalUsd * 5} label="per week" {tone} />
      <MoneyCounter value={totalUsd * 21} label="per month" {tone} />
    </section>
  </section>
</main>

<style>
  :global(html:has(.sandbox)),:global(body:has(.sandbox)),:global(body:has(.sandbox) #app){height:100%;overflow:hidden}
  :global(body:has(.sandbox)){background:#fffdf8!important;color:#22221f!important}
  :global(.app:has(.sandbox)){max-width:none;width:100%;height:100%;margin:0;padding:0}
  .sandbox{--red:#d94835;--green:#178353;--ink:#24231f;--muted:#6b6960;height:100dvh;display:grid;grid-template-columns:306px minmax(0,1fr);background:#fffdf8;color:var(--ink);font-family:ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif;overflow:hidden}button{font:inherit;color:inherit}.eyebrow{font-size:.62rem;font-weight:900;letter-spacing:.14em;color:#77736a}.config-panel{grid-column:1;grid-row:1;height:100%;overflow:hidden;border-right:2px solid #24231f;padding:16px;background:#fff;box-shadow:7px 0 0 #f3cc4f;z-index:20}.config-head{display:flex;justify-content:space-between;align-items:flex-start}.config-head h2{margin:2px 0 0;font-size:1.25rem;letter-spacing:-.03em}.drawer-close{display:none;border:0;background:#f3efe5;width:38px;height:38px;border-radius:50%;cursor:pointer}.persona-control{padding:10px 0 7px}.persona-control h3,.scenario-control h3{margin:0 0 7px;font-size:.68rem;text-transform:uppercase;letter-spacing:.1em}.personas{display:grid;grid-template-columns:1fr 1fr;gap:6px}.personas button{display:flex;align-items:center;gap:5px;min-width:0;padding:7px;border:1.5px solid #d9d5ca;border-radius:10px;background:#fff;text-align:left;cursor:pointer}.personas button:hover{border-color:#24231f}.personas button.active{border-color:#24231f;background:#fffbea;box-shadow:2px 3px 0 #f4c94e}.personas b{font-size:.66rem;line-height:1.05}.scenario-control{padding:7px 0;border-bottom:1px dashed #d8d2c5}.scenario-control select{width:100%;border:1.5px solid #24231f;border-radius:8px;background:#fffbea;padding:6px;font:800 .68rem inherit}.scenario-control small{display:block;margin-top:4px;color:#77736b;font-size:.56rem;line-height:1.25}.config-status{display:flex;justify-content:space-between;align-items:center;padding:8px 0 6px}.config-status span{font-size:.65rem;font-weight:900;color:#77736b}.config-status span.modified{color:#9a6800}.reset{border:0;background:transparent;padding:3px;font-size:.65rem;font-weight:850;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.reset:disabled{opacity:.35;cursor:default}.lever-grid{display:grid;gap:5px}.lever-grid article{border:1.5px solid #ded9cc;border-radius:10px;padding:6px 8px;background:#fff}.lever-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:5px;font-size:.69rem;font-weight:900}.lever-head small{font-size:.55rem;color:#777}.lever-head small.positive{color:var(--red)}.lever-head small.negative{color:var(--green)}.choice{display:flex}.choice button{flex:1;border:1px solid #cfc9bc;background:#faf8f2;padding:4px 3px;cursor:pointer;font-size:.61rem;font-weight:800}.choice button:first-child{border-radius:7px 0 0 7px}.choice button:last-child{border-radius:0 7px 7px 0}.choice button+button{border-left:0}.choice button.chosen{background:#24231f;color:#fff}.choice.three button:not(:first-child):not(:last-child){border-radius:0}.slider{display:flex;align-items:center;gap:6px;color:#77736a;font-size:.59rem;font-weight:800}.slider input{min-width:0;width:100%;accent-color:#e9573f}.playground{grid-column:2;grid-row:1;min-width:0;height:100%;display:grid;grid-template-rows:64px minmax(0,1fr) 78px;gap:12px;padding:12px 18px 14px 24px;overflow:hidden}nav{display:flex;align-items:center;gap:12px;min-width:0}nav h1{font-size:1.42rem;line-height:1;margin:3px 0 0;letter-spacing:-.04em}.back{width:38px;height:38px;border:2px solid #24231f;border-radius:10px;background:white;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #24231f}.persona-pill{margin-left:auto;padding:6px 10px;border:1.5px solid #d9d4c7;border-radius:99px;background:#fff;font-size:.72rem;font-weight:850}.config-toggle{display:none;border:2px solid #24231f;background:#fff9df;border-radius:10px;padding:7px 10px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #24231f}.canvas{min-height:0;max-width:1040px;width:100%;margin:auto;transition:filter .25s}.canvas.good{filter:drop-shadow(0 0 12px #62d39a55)}.canvas.bad{filter:drop-shadow(0 0 12px #f0808055)}.totals{min-width:0;display:grid;grid-template-columns:minmax(150px,1.3fr) repeat(3,minmax(100px,1fr));align-items:center;gap:12px;padding:8px 16px;border:2px solid #24231f;border-radius:15px 12px 16px 13px;background:white;box-shadow:5px 5px 0 #dedbd0}.total-context{display:flex;flex-direction:column;font-size:.75rem;font-weight:900}.total-context span{color:var(--ink)}.total-context small{color:#77736a;font-size:.58rem;margin-top:2px}:global(.totals .money strong){font-size:clamp(1.35rem,3vw,2.15rem)}:global(.totals .money span){font-size:.6rem;margin-top:.15rem}.scrim{display:none}
  @media(max-height:720px) and (min-width:901px){.config-panel{padding:10px 14px}.persona-control{padding:7px 0}.personas button{padding:5px}.config-status{padding:6px 0 4px}.lever-grid{gap:4px}.lever-grid article{padding:5px 7px}.lever-head{margin-bottom:3px}.choice button{padding:3px}.playground{grid-template-rows:52px minmax(0,1fr) 66px;gap:8px;padding-block:8px}nav h1{font-size:1.2rem}.totals{padding-block:5px}}
  @media(max-width:900px){.sandbox{display:block}.playground{height:100%;grid-template-rows:58px minmax(0,1fr) 70px;padding:9px 12px 12px}.config-toggle{display:block}.config-toggle span{display:none}.persona-pill{display:none}.config-panel{position:fixed;top:0;left:0;bottom:0;width:min(88vw,330px);height:100%;border-right:2px solid #24231f;transform:translateX(calc(-100% - 12px));visibility:hidden;transition:transform .3s cubic-bezier(.2,.8,.2,1),visibility .3s;box-shadow:12px 0 45px #24231f26;overflow:auto;padding-bottom:max(20px,env(safe-area-inset-bottom))}.config-panel.open{transform:translateX(0);visibility:visible}.drawer-close{display:block}.scrim{display:block;position:fixed;z-index:15;inset:0;padding:0;border:0;background:#24231f73;backdrop-filter:blur(2px)}nav h1{font-size:1.15rem}.config-toggle{margin-left:auto}.canvas{max-width:760px}.totals{grid-template-columns:repeat(3,1fr);gap:4px;padding:6px 8px}.total-context{display:none}:global(.totals .money strong){font-size:clamp(1.05rem,5vw,1.65rem)}:global(.totals .money span){font-size:.5rem}}
  @media(max-width:480px){.playground{grid-template-rows:52px minmax(0,1fr) 58px;gap:7px;padding:7px 8px 9px}nav{gap:8px}.back{width:34px;height:34px}nav h1{font-size:1rem}.eyebrow{font-size:.52rem}.totals{border-radius:11px;box-shadow:3px 3px 0 #dedbd0}:global(.totals .money strong){font-size:1.02rem}}
  @media(max-width:900px) and (max-height:520px){.playground{grid-template-rows:40px minmax(0,1fr) 46px;gap:4px;padding:4px 8px 6px}nav h1{font-size:.9rem}.back,.config-toggle{height:30px;padding-block:3px}.totals{padding-block:3px}:global(.totals .money strong){font-size:.9rem}.config-panel{overflow:hidden;padding:7px 10px}.config-head h2{font-size:1rem}.persona-control{padding:5px 0}.personas{grid-template-columns:repeat(4,1fr)}.personas button{display:block;padding:3px;text-align:center}.personas button span{font-size:.8rem}.personas b{font-size:.5rem}.config-status{padding:4px 0}.lever-grid{grid-template-columns:1fr 1fr;gap:3px}.lever-grid article{padding:3px 5px}.lever-head{margin-bottom:2px}.choice button{padding:2px}.drawer-close{width:30px;height:30px}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
