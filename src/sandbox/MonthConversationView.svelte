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
  let underHood = $state(false);
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
    underHood = false;
    snapshot();
    playing = !reducedMotion;
  }
  function inspect(id: string) { selectedId = id; underHood = true; playing = false; }
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

<div class="month-shell">
  <div class="toolbar">
    <div class="live"><i></i> Modeled work month · Day {day} / 21</div>
    <div class="speed">
      <span>slow</span><input aria-label="Simulation speed" type="range" min="0.5" max="8" step="0.5" bind:value={speed} /><span>fast</span><b>{speed.toFixed(1)}×</b>
      <button onclick={() => playing = !playing} disabled={day >= 21 && dayComplete}>{playing ? "⏸ Pause" : "▶ Play"}</button>
      <button onclick={reset}>↺ Reset</button>
      {#if reducedMotion}<button onclick={advance}>Step →</button>{/if}
      <RawDataModal title="Modeled multi-conversation day" provenance={{ real: false, source: "src/sim/ledger.ts · simulateDayConvos" }} rows={rawRows} />
    </div>
  </div>
  <div class="status"><span><b>Day {day}</b> running {money(runningUsd)} / {money(ledger.totalUsd)}</span><span>{pending ? day < 21 ? `Configuration queued → applies Day ${day + 1}` : "Configuration queued for the next reset" : "Current configuration locked for this day"}</span></div>
  <div class="tabs"><button class:active={!underHood} onclick={() => underHood = false}>💬 Parallel conversations</button><button class:active={underHood} onclick={() => underHood = true}>🔧 Under the hood</button></div>
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
          <p>{underHood ? latest(lane)?.warm ? "shared prefix → cheap cache read" : "prefix written for this conversation" : latest(lane)?.text ?? "Waiting to start…"}</p>
        </section>
      {/each}
    </div>
    {#if selected && underHood}
      <aside class="inspector">
        <div class="inspector-title"><b>Message receipt · {laneName(selected.id)}</b><button onclick={() => selectedId = null} aria-label="Close receipt">×</button></div>
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
  .month-shell{height:100%;min-height:0;display:flex;flex-direction:column;color:#20201d;background:#fff}button,input{font:inherit}.toolbar{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 12px;background:#fff9db;border-bottom:2px solid #20201d}.live{font-size:.68rem;font-weight:950;text-transform:uppercase;white-space:nowrap}.live i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#2db871;margin-right:6px}.speed{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0}.speed>span{font-size:.5rem;text-transform:uppercase;font-weight:850}.speed>b{font-size:.62rem}.speed input{width:82px;accent-color:#df5c39}.speed button{border:1.5px solid #20201d;background:#fff;border-radius:8px;padding:4px 7px;font-size:.62rem;font-weight:850;cursor:pointer}.status{display:flex;justify-content:space-between;gap:8px;padding:5px 12px;background:#f5f1e7;border-bottom:1px solid #cbc6b9;font-size:.61rem;font-weight:750}.tabs{display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid #20201d}.tabs button{border:0;background:#f1efe9;padding:7px;cursor:pointer;font-size:.7rem;font-weight:850}.tabs button+button{border-left:2px solid #20201d}.tabs button.active{background:#fff;box-shadow:inset 0 -4px #f2c94c}.stage{position:relative;display:flex;min-height:145px;flex:1;padding:8px;overflow:hidden}.lanes{display:flex;flex-direction:column;gap:5px;width:100%;overflow:auto}.lane{border:1.5px solid #20201d;border-radius:8px;padding:5px 8px;background:#fff}.lane.subagent{margin-left:16px;background:#f4fbf7;border-color:#47845f}.lane header{display:flex;justify-content:space-between;font-size:.63rem;font-weight:900}.track{display:flex;gap:3px;align-items:center;margin:5px 0 2px;background:linear-gradient(#cbc8bf,#cbc8bf) center/100% 2px no-repeat}.track button{width:16px;height:16px;flex:1 1 16px;max-width:21px;border:1px solid #777;border-radius:50%;padding:0;background:#ddd;opacity:.25}.track button.arrived{opacity:1;background:#f0785e;cursor:pointer}.track button.arrived.warm{background:#62d39a}.track span{display:block;font-size:.43rem;font-weight:900}.lane p{margin:0;font-size:.55rem;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inspector{position:absolute;inset:7px;padding:10px;background:#fffdf4;border:2px solid #20201d;border-radius:11px;box-shadow:4px 5px 0 #f2c94c;overflow:auto}.inspector-title{display:flex;justify-content:space-between;font-size:.75rem}.inspector-title button{border:0;background:none;font-size:1.2rem;cursor:pointer}.inspector>p{margin:5px 0;font-size:.65rem}.prompt-stack{display:flex;flex-direction:column;gap:3px;margin:6px 0}.segment{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;padding:4px 6px;border:1px solid;border-radius:6px;font-size:.59rem}.segment.read{background:#d8f4e3;border-color:#378d5b}.segment.write{background:#ffd2c4;border-color:#ca4f31}.segment.input{background:#ffe8bf;border-color:#d17819}.segment span{font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cache-break{border-top:3px solid #d94c31;color:#a62f1d;padding-top:2px;font-size:.55rem;font-weight:950;text-transform:uppercase}.receipt{font-size:.6rem;font-variant-numeric:tabular-nums}.receipt>div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed #d5d1c5;padding:2px}.receipt .total{border-top:2px solid #20201d;border-bottom:0;margin-top:2px}.saving{text-align:right;color:#177142;font-weight:850}.daily{flex:none;border-top:2px solid #20201d;background:#fff9db;padding:5px 10px 3px}.strip-head{display:flex;justify-content:space-between;font-size:.58rem}.bars{display:grid;grid-template-columns:repeat(21,minmax(3px,1fr));height:48px;gap:2px;align-items:end}.bar{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end}.bar>span{min-height:2px;background:#d4d0c5;border-radius:3px 3px 0 0}.bar>span.done{background:#4cab73}.bar>span.current{background:#f2c94c;outline:1px solid #20201d}.bar small{text-align:center;font-size:.4rem}.bar i{position:absolute;left:-2px;top:0;height:40px;border-left:2px dashed #cf5438;color:#a63220;font-size:.38rem;font-style:normal;font-weight:900;white-space:nowrap;writing-mode:vertical-rl;transform:rotate(180deg)}footer{display:flex;justify-content:space-between;padding:6px 12px;background:#20201d;color:#ddd;font-size:.61rem}footer b{color:#f2c94c}
  @media(max-width:600px){.toolbar{align-items:flex-start;flex-direction:column;padding:6px 8px}.speed{width:100%;justify-content:flex-start;flex-wrap:wrap}.speed input{flex:1}.status{display:block;padding:3px 7px}.status span{display:block}.stage{padding:5px}.lane.subagent{margin-left:6px}.segment{grid-template-columns:minmax(0,1fr) auto}.segment small{grid-column:1/-1}.daily{padding-inline:5px}.bars{gap:1px}footer{display:block;padding:4px 7px}footer span{display:block}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
