<script lang="ts">
  import { onMount } from "svelte";
  import RawDataModal from "../components/RawDataModal.svelte";
  import { RATE, tokCost } from "../engine/pricing.js";
  import {
    segmentPromptCascade,
    simulateDayConvos,
    type DayConversationLane,
    type MessageLedgerEntry,
    type MessageLedgerOptions,
    type PromptCascadeSegment,
    type ScriptedMessage,
  } from "../sim/ledger.js";
  import type { RawTurn } from "../sim/captures/realSegments.js";

  interface MonthSummary {
    completedDays: number;
    currentDay: number;
    currentDayUsd: number;
    averageDayUsd: number;
    monthTotalUsd: number;
  }
  interface Props {
    script: ScriptedMessage[];
    options: MessageLedgerOptions;
    subagentCount?: number;
    sharePrefix?: boolean;
    onmonthchange?: (summary: MonthSummary) => void;
  }
  interface CompletedDay {
    day: number;
    totalUsd: number;
    configKey: string;
    config: { options: MessageLedgerOptions; subagentCount: number; sharePrefix: boolean };
  }

  let { script, options, subagentCount = 2, sharePrefix = true, onmonthchange }: Props = $props();
  let speed = $state(2);
  let playing = $state(true);
  let reducedMotion = $state(false);
  let day = $state(1);
  let shown = $state(1);
  let completed = $state<CompletedDay[]>([]);
  let selectedId = $state<string | null>(null);
  let dayScript = $state<ScriptedMessage[]>([]);
  let dayOptions = $state<MessageLedgerOptions>({ ttl: "5m", model: "sonnet", prefixTok: 0, workInTok: 0, outputTok: 0 });
  let daySubagents = $state(0);
  let dayShared = $state(true);

  const ledger = $derived(simulateDayConvos(dayScript, dayOptions, daySubagents, dayShared));
  const liveLedger = $derived(simulateDayConvos(script, options, subagentCount, sharePrefix));
  const visible = $derived(ledger.messages.slice(0, shown));
  const runningUsd = $derived(visible.reduce((sum, message) => sum + message.usd, 0));
  const dayComplete = $derived(shown >= ledger.messages.length && ledger.messages.length > 0);
  const completedTotal = $derived(completed.reduce((sum, item) => sum + item.totalUsd, 0));
  const averageUsd = $derived(completed.length ? completedTotal / completed.length : ledger.totalUsd);
  const monthTotal = $derived(completed.length >= day
    ? completedTotal
    : completedTotal + ledger.totalUsd + Math.max(0, 21 - day) * liveLedger.totalUsd);
  const selected = $derived(ledger.messages.find((message) => message.id === selectedId) ?? null);
  const liveKey = $derived(identity(script, options, subagentCount, sharePrefix));
  const dayKey = $derived(identity(dayScript, dayOptions, daySubagents, dayShared));
  const pending = $derived(liveKey !== dayKey);
  const maxBar = $derived(Math.max(ledger.totalUsd, ...completed.map((item) => item.totalUsd), 0.000001));
  const rawRows = $derived(ledger.messages.map((message, index): RawTurn => ({
    label: `${laneName(message.id)} · turn ${index + 1}`,
    messagesTok: message.buckets.prefix.tokens,
    cacheWrite: message.warm ? 0 : message.buckets.prefix.tokens,
    cacheRead: message.warm ? message.buckets.prefix.tokens : 0,
    freshInput: message.buckets.workIn.tokens,
    output: message.buckets.output.tokens,
  })));
  const cascade = $derived.by((): PromptCascadeSegment[] => {
    if (!selected) return [];
    const prefix = selected.buckets.prefix.tokens;
    const system = Math.round(prefix * 0.34);
    const tools = Math.round(prefix * 0.46);
    return segmentPromptCascade([
      { label: "System prompt", tokens: system },
      { label: "Tool schemas", tokens: tools },
      { label: "Prior messages", tokens: prefix - system - tools },
      { label: "THE NEW / CHANGED MESSAGE", tokens: selected.buckets.workIn.tokens },
    ], {
      cacheRead: selected.warm ? prefix : 0,
      cacheWrite: selected.warm ? 0 : prefix,
      freshInput: selected.buckets.workIn.tokens,
    }, dayOptions.model, dayOptions.ttl);
  });

  $effect(() => {
    // Track `shown` (and `day`) so the timer re-arms after every advance — otherwise
    // the effect only re-runs when speed/playing change and the sim stalls after one step.
    void shown;
    void day;
    if (!playing || reducedMotion || day > 21 || ledger.messages.length === 0) return;
    const timer = setTimeout(advance, Math.max(70, Math.round(820 / speed)));
    return () => clearTimeout(timer);
  });
  $effect(() => {
    onmonthchange?.({ completedDays: completed.length, currentDay: day, currentDayUsd: runningUsd, averageDayUsd: averageUsd, monthTotalUsd: monthTotal });
  });
  onMount(() => {
    snapshot();
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedMotion = Boolean(query?.matches);
    if (reducedMotion) playing = false;
  });

  function identity(nextScript: readonly ScriptedMessage[], nextOptions: MessageLedgerOptions, agents: number, shared: boolean) {
    return JSON.stringify({ nextScript, nextOptions, agents, shared });
  }
  function snapshot() {
    dayScript = script.map((message) => ({ ...message }));
    dayOptions = { ...options, contextLevers: options.contextLevers ? { ...options.contextLevers } : undefined };
    daySubagents = subagentCount;
    dayShared = sharePrefix;
  }
  function advance() {
    if (!dayComplete) { shown = Math.min(ledger.messages.length, shown + 1); return; }
    if (completed.length < day) {
      completed = [...completed, {
        day,
        totalUsd: ledger.totalUsd,
        configKey: dayKey,
        config: { options: { ...dayOptions }, subagentCount: daySubagents, sharePrefix: dayShared },
      }];
    }
    if (day >= 21) { playing = false; return; }
    day += 1;
    shown = 1;
    selectedId = null;
    snapshot();
  }
  function reset() {
    completed = [];
    day = 1;
    shown = 1;
    selectedId = null;
    snapshot();
    playing = !reducedMotion;
  }
  function inspect(id: string) { selectedId = id; playing = false; }
  function visibleMessage(id: string) { return visible.some((message) => message.id === id); }
  function laneCost(lane: DayConversationLane) { return lane.messages.filter((message) => visibleMessage(message.id)).reduce((sum, message) => sum + message.usd, 0); }
  function latest(lane: DayConversationLane) { return lane.messages.filter((message) => visibleMessage(message.id)).slice(-1)[0]; }
  function laneName(id: string) { const lane = id.split(":")[0]; return lane === "main" ? "Main thread" : `Subagent ${lane.replace("sub", "")}`; }
  function changeover(nextDay: number) {
    const prior = completed[nextDay - 2];
    if (!prior) return false;
    const here = completed[nextDay - 1];
    return here ? here.configKey !== prior.configKey : nextDay === day && dayKey !== prior.configKey;
  }
  function money(value: number) { return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`; }
  function exact(value: number) { return `$${value.toFixed(6)}`; }
  function tokens(value: number) { return value.toLocaleString("en-US").split(",").join(" "); }
  function uncached(message: MessageLedgerEntry) { return tokCost(message.buckets.prefix.tokens + message.buckets.workIn.tokens, RATE.input, dayOptions.model) + message.buckets.output.usd; }
</script>

<div class="month-shell toycard">
  <div class="toolbar">
    <div class="live"><i></i> Modeled work month · Day {day} / 21</div>
    <div class="speed">
      <span>slow</span><input aria-label="Simulation speed" type="range" min="0.5" max="8" step="0.5" bind:value={speed} /><span>fast</span><b>{speed.toFixed(1)}×</b>
      <button onclick={() => playing = !playing} disabled={day >= 21 && dayComplete}>{playing ? "⏸ Pause" : "▶ Play"}</button>
      <button onclick={reset}>↺ Reset</button>
      {#if reducedMotion}<button onclick={advance}>Step →</button>{/if}
    </div>
  </div>
  <div class="status"><span><b>Day {day}</b> running {money(runningUsd)} / {money(ledger.totalUsd)}</span><span>{pending ? day < 21 ? `Configuration queued → applies Day ${day + 1}` : "Configuration queued for the next reset" : "Current configuration locked for this day"}</span></div>
  <div class="stage">
    <div class="lanes" aria-label="Concurrent conversation lanes">
      {#each ledger.lanes as lane (lane.id)}
        <section class="lane" class:subagent={lane.kind === "subagent"}>
          <header><span>{lane.kind === "main" ? "●" : "↳"} {lane.label}</span><strong>{money(laneCost(lane))}</strong></header>
          <div class="track">
            {#each lane.messages as message, index (message.id)}
              <button class:arrived={visibleMessage(message.id)} class:warm={message.warm} disabled={!visibleMessage(message.id)} onclick={() => inspect(message.id)} aria-label={`${lane.label} message ${index + 1}: ${money(message.usd)}`} title={`${message.text} · ${money(message.usd)}`}><span>{index + 1}</span></button>
            {/each}
          </div>
          <p>{latest(lane)?.text ?? "Waiting to start…"}</p>
        </section>
      {/each}
    </div>
    {#if selected}
      <aside class="inspector">
        <div class="inspector-title"><b>Message receipt · {laneName(selected.id)}</b><span class="inspector-actions"><span class="raw-corner" title="Raw logs"><span class="raw-label">raw logs</span><RawDataModal title="Modeled multi-conversation day" provenance={{ real: false, source: "src/sim/ledger.ts · simulateDayConvos" }} rows={rawRows} /></span><button onclick={() => selectedId = null} aria-label="Close receipt">×</button></span></div>
        <p class="prefix-note">{selected.warm ? "Shared prefix → cheap cache read" : "Prefix written for this conversation"}</p>
        <p>{selected.reason}</p>
        <div class="prompt-stack" aria-label="Ordered modeled prompt segments and cache invalidation cursor">
          {#each cascade as chunk (chunk.id)}
            {#if chunk.cursor}<div class="cache-break">⟵ cache breaks here — everything below is re-written</div>{/if}
            <div class="segment {chunk.tier}"><span>{chunk.label}</span><b>{tokens(chunk.tokens)} tok</b><small>{exact(chunk.usd)} · {chunk.rate}×</small></div>
          {/each}
        </div>
        <div class="receipt">
          <div><span>cache read</span><span>{tokens(selected.warm ? selected.buckets.prefix.tokens : 0)} tok = {exact(selected.warm ? selected.buckets.prefix.usd : 0)}</span></div>
          <div><span>cache write</span><span>{tokens(selected.warm ? 0 : selected.buckets.prefix.tokens)} tok = {exact(selected.warm ? 0 : selected.buckets.prefix.usd)}</span></div>
          <div><span>fresh input</span><span>{tokens(selected.buckets.workIn.tokens)} tok = {exact(selected.buckets.workIn.usd)}</span></div>
          <div><span>output</span><span>{tokens(selected.buckets.output.tokens)} tok = {exact(selected.buckets.output.usd)}</span></div>
          <div class="total"><b>───── TOTAL</b><b>{exact(selected.usd)}</b></div>
        </div>
        <p class="saving">With shared cache {exact(selected.usd)} vs {exact(uncached(selected))} uncached · {((1 - selected.usd / uncached(selected)) * 100).toFixed(1)}% saved</p>
      </aside>
    {/if}
  </div>
  <section class="daily" aria-label="Daily cost strip">
    <div class="strip-head"><b>Daily cost strip</b><span>average {money(averageUsd)} · month total {money(monthTotal)}</span></div>
    <div class="bars">
      {#each Array.from({ length: 21 }, (_unused, index) => index + 1) as itemDay}
        {@const record = completed[itemDay - 1]}
        <div class="bar" title={record ? `Day ${itemDay}: ${money(record.totalUsd)}` : `Day ${itemDay}: not simulated`}>
          {#if changeover(itemDay)}<i>config changed →</i>{/if}
          <span class:done={Boolean(record)} class:current={itemDay === day} style={`height:${record ? Math.max(9, (record.totalUsd / maxBar) * 76) : itemDay === day ? Math.max(7, (runningUsd / maxBar) * 76) : 3}%`}></span><small>{itemDay}</small>
        </div>
      {/each}
    </div>
  </section>
  <footer><span>running day <b>{money(runningUsd)}</b></span><span>completed {completed.length} / 21 · projected month <b>{money(monthTotal)}</b></span></footer>
</div>

<style>
  .month-shell{min-height:100%;display:flex;flex-direction:column;color:var(--toy-ink);background:var(--toy-paper)}button,input{font:inherit}.toolbar{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 12px;background:var(--toy-cream-2);border-bottom:2px solid var(--toy-ink)}.live{font-size:.68rem;font-weight:950;text-transform:uppercase;white-space:nowrap}.live i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--toy-green);margin-right:6px}.speed{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0}.speed>span{font-size:.5rem;text-transform:uppercase;font-weight:850}.speed>b{font-size:.62rem}.speed input{width:82px;accent-color:var(--toy-red)}.speed button{border:1.5px solid var(--toy-ink);background:var(--toy-paper);border-radius:8px;padding:4px 7px;font-size:.62rem;font-weight:850;cursor:pointer}.status{display:flex;justify-content:space-between;gap:8px;padding:5px 12px;background:var(--toy-cream);border-bottom:1px solid var(--toy-dash);font-size:.61rem;font-weight:750}.stage{position:relative;display:grid;min-height:145px;flex:none;padding:8px;overflow:visible}.lanes{display:flex;flex-direction:column;grid-area:1/1;gap:5px;width:100%;min-width:0;overflow:visible}.lane{border:1.5px solid var(--toy-ink);border-radius:8px;padding:5px 8px;background:var(--toy-paper)}.lane.subagent{margin-left:16px;background:var(--toy-green-soft);border-color:var(--toy-green-ink)}.lane header{display:flex;justify-content:space-between;font-size:.63rem;font-weight:900}.track{display:flex;gap:3px;align-items:center;margin:5px 0 2px;background:linear-gradient(var(--toy-dash),var(--toy-dash)) center/100% 2px no-repeat}.track button{width:16px;height:16px;flex:1 1 16px;max-width:21px;border:1px solid var(--toy-muted);border-radius:50%;padding:0;background:var(--toy-shadow);opacity:.25}.track button.arrived{opacity:1;background:var(--toy-red);cursor:pointer}.track button.arrived.warm{background:var(--toy-green)}.track span{display:block;font-size:.43rem;font-weight:900}.lane p{margin:0;font-size:.55rem;color:var(--toy-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inspector{position:relative;inset:auto;grid-area:1/1;z-index:1;box-sizing:border-box;padding:10px;background:var(--toy-cream);border:2px solid var(--toy-ink);border-radius:11px;box-shadow:4px 5px 0 var(--toy-gold);overflow:visible}.inspector-title{display:flex;justify-content:space-between;font-size:.75rem}.inspector-title button{border:0;background:none;font-size:1.2rem;cursor:pointer}.inspector>p{margin:5px 0;font-size:.65rem}.prompt-stack{display:flex;flex-direction:column;gap:3px;margin:6px 0}.segment{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;padding:4px 6px;border:1px solid;border-radius:6px;font-size:.59rem}.segment.read{background:var(--toy-green-soft);border-color:var(--toy-green-ink)}.segment.write{background:var(--toy-red-soft);border-color:var(--toy-red-ink)}.segment.input{background:var(--toy-gold-soft);border-color:var(--toy-gold-ink)}.segment span{font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cache-break{border-top:3px solid var(--toy-red-ink);color:var(--toy-red-ink);padding-top:2px;font-size:.55rem;font-weight:950;text-transform:uppercase}.receipt{font-size:.6rem;font-variant-numeric:tabular-nums}.receipt>div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--toy-dash);padding:2px}.receipt .total{border-top:2px solid var(--toy-ink);border-bottom:0;margin-top:2px}.saving{text-align:right;color:var(--toy-green-ink);font-weight:850}.daily{flex:none;border-top:2px solid var(--toy-ink);background:var(--toy-cream-2);padding:5px 10px 3px}.strip-head{display:flex;justify-content:space-between;font-size:.58rem}.bars{display:grid;grid-template-columns:repeat(21,minmax(3px,1fr));height:48px;gap:2px;align-items:end}.bar{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end}.bar>span{min-height:2px;background:var(--toy-dash);border-radius:3px 3px 0 0}.bar>span.done{background:var(--toy-green)}.bar>span.current{background:var(--toy-gold);outline:1px solid var(--toy-ink)}.bar small{text-align:center;font-size:.4rem}.bar i{position:absolute;left:-2px;top:0;height:40px;border-left:2px dashed var(--toy-red-ink);color:var(--toy-red-ink);font-size:.38rem;font-style:normal;font-weight:900;white-space:nowrap;writing-mode:vertical-rl;transform:rotate(180deg)}footer{display:flex;justify-content:space-between;padding:6px 12px;background:var(--toy-ink);color:var(--toy-paper);font-size:.61rem}footer b{color:var(--toy-gold)}
  .inspector-actions,.raw-corner{display:flex;align-items:center;gap:4px}.raw-label{font-size:.5rem;text-transform:uppercase;color:var(--toy-muted)}.inspector-title .raw-corner :global(.raw-trigger){padding:2px 4px;border:1.5px solid var(--toy-border);background:var(--toy-paper);color:var(--toy-ink);font-size:.58rem}.inspector-title .inspector-actions>button{border:0;background:none;font-size:1.2rem;cursor:pointer;padding:0 2px}.prefix-note{color:var(--toy-green-ink);font-weight:900;text-transform:uppercase}
  @media(max-width:600px){.toolbar{align-items:flex-start;flex-direction:column;padding:6px 8px}.speed{width:100%;justify-content:flex-start;flex-wrap:wrap}.speed input{flex:1}.status{display:block;padding:3px 7px}.status span{display:block}.stage{padding:5px}.lane.subagent{margin-left:6px}.segment{grid-template-columns:minmax(0,1fr) auto}.segment small{grid-column:1/-1}.daily{padding-inline:5px}.bars{gap:1px}footer{display:block;padding:4px 7px}footer span{display:block}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
