<script lang="ts">
  import {
    simulateMessageLedger,
    type MessageLedgerOptions,
    type ScriptedMessage,
  } from "../sim/ledger.js";
  import {
    REAL_SESSION,
    REAL_SESSION_COSTS,
    REAL_SESSION_MODEL,
    REAL_SESSION_RATES,
    totalRealSessionCosts,
    type RealSessionCost,
  } from "../sim/captures/realSession.js";
  import { RATE, tokCost } from "../engine/pricing.js";
  import RawDataModal from "../components/RawDataModal.svelte";
  import { REAL_SEGMENT_PROVENANCE, REAL_SEGMENT_ROWS, type RawTurn } from "../sim/captures/realSegments.js";

  interface Props {
    script: ScriptedMessage[];
    options: MessageLedgerOptions;
    offScript?: ScriptedMessage[];
    onScript?: ScriptedMessage[];
    offLabel?: string;
    onLabel?: string;
    off?: MessageLedgerOptions;
    on?: MessageLedgerOptions;
    startOn?: boolean;
    bucketTotals?: unknown;
    projectedTotal?: number;
    compact?: boolean;
  }

  interface PromptChunk {
    label: string;
    tokens: number;
    usd: number;
    hot: boolean;
  }

  let {
    script, options, offScript, onScript, offLabel, onLabel, off, on,
    startOn = false, bucketTotals, projectedTotal, compact = false,
  }: Props = $props();
  let leverOn = $state(false);
  let paused = $state(false);
  let tab = $state<"chat" | "cost">("chat");
  let shown = $state(1);
  let selectedIndex = $state<number | null>(null);
  let selectedId = $state<string | null>(null);
  let previousCosts = $state<Record<string, number>>({});

  const realMode = $derived(Boolean(bucketTotals));
  const realVisibleStart = $derived(Math.max(0, compact ? shown - 6 : 0));
  const realVisible = $derived(REAL_SESSION_COSTS.slice(realVisibleStart, shown));
  const realSelected = $derived(selectedIndex === null ? null : REAL_SESSION_COSTS[selectedIndex]);
  const realRunning = $derived(totalRealSessionCosts(REAL_SESSION_COSTS.slice(0, shown)));
  const realComplete = $derived(shown >= REAL_SESSION_COSTS.length);

  const hasToggle = $derived(Boolean(off && on && offLabel && onLabel));
  const activeScript = $derived(hasToggle ? ((leverOn ? onScript : offScript) ?? script) : script);
  const activeOptions = $derived(hasToggle ? (leverOn ? on! : off!) : options);
  const legacyLedger = $derived(simulateMessageLedger(activeScript, activeOptions));
  const legacyMessages = $derived(legacyLedger.messages);
  const legacySelected = $derived(legacyMessages.find((message) => message.id === selectedId) ?? null);
  const legacyVisible = $derived(legacyMessages.slice(Math.max(0, compact ? shown - 6 : 0), shown));
  const legacyRunningTotal = $derived(legacyVisible.reduce((sum, message) => sum + message.usd, 0));
  const legacyDayTotal = $derived(projectedTotal ?? legacyLedger.totalUsd);
  const modeledRawRows = $derived(legacyMessages.map((message, index): RawTurn => ({
    label: `Turn ${index + 1} · ${clock(message.atMin)}`,
    messagesTok: message.buckets.prefix.tokens,
    cacheWrite: message.warm ? 0 : message.buckets.prefix.tokens,
    cacheRead: message.warm ? message.buckets.prefix.tokens : message.buckets.keepWarm.tokens,
    freshInput: message.buckets.workIn.tokens,
    output: message.buckets.output.tokens,
  })));
  const legacyComplete = $derived(shown >= legacyMessages.length);
  const complete = $derived(realMode ? realComplete : legacyComplete);
  const transportLabel = $derived(complete ? "↻ Replay" : paused ? "▶ Play" : "⏸ Pause");
  const promptChunks = $derived.by((): PromptChunk[] => {
    if (selectedIndex === null) return [];
    const selectedStep = REAL_SESSION[selectedIndex];
    const priorWrites = REAL_SESSION.slice(0, selectedIndex);
    const priorWriteTokens = priorWrites.reduce((sum, step) => sum + step.cacheWrite, 0);
    const capturedPrefix = selectedStep.cacheRead - priorWriteTokens;
    const chunks: PromptChunk[] = [];

    if (capturedPrefix > 0) {
      chunks.push({
        label: "captured prefix",
        tokens: capturedPrefix,
        usd: tokCost(capturedPrefix, RATE.read, REAL_SESSION_MODEL),
        hot: false,
      });
    }
    priorWrites.forEach((step, index) => {
      chunks.push({
        label: `step ${index + 1}`,
        tokens: step.cacheWrite,
        usd: tokCost(step.cacheWrite, RATE.read, REAL_SESSION_MODEL),
        hot: false,
      });
    });
    chunks.push({
      label: "new chunk",
      tokens: selectedStep.cacheWrite + selectedStep.freshInput,
      usd:
        tokCost(selectedStep.cacheWrite, RATE.w5m, REAL_SESSION_MODEL) +
        tokCost(selectedStep.freshInput, RATE.input, REAL_SESSION_MODEL),
      hot: true,
    });
    return chunks;
  });

  $effect(() => { leverOn = startOn; });

  $effect(() => {
    activeScript;
    activeOptions;
    if (!realMode && shown > legacyMessages.length) shown = legacyMessages.length;
    if (!realMode) selectedId = null;
  });

  $effect(() => {
    if (paused || complete) return;
    let delay = 900;
    if (!realMode) {
      const here = legacyMessages[Math.max(0, shown - 1)];
      const next = legacyMessages[shown];
      const gap = Math.max(1, next.atMin - here.atMin);
      delay = Math.min(1500, 460 + gap * 20);
    }
    const timer = setTimeout(() => shown += 1, delay);
    return () => clearTimeout(timer);
  });

  function useTransport() {
    if (complete) {
      selectedIndex = null;
      selectedId = null;
      tab = "chat";
      shown = 1;
      paused = false;
      return;
    }
    paused = !paused;
  }

  function inspect(index: number) {
    if (index >= shown) return;
    paused = true;
    tab = "cost";
    selectedIndex = index;
  }

  function flip() {
    previousCosts = Object.fromEntries(legacyMessages.map((message) => [message.id, message.usd]));
    leverOn = !leverOn;
    shown = legacyMessages.length;
    paused = true;
  }

  function inspectLegacy(id: string) {
    paused = true;
    tab = "cost";
    selectedId = id;
  }

  function summaryMoney(value: number) { return `$${value.toFixed(3)}`; }
  function exactMoney(value: number) { return `$${value.toFixed(6)}`; }
  function tokens(value: number) { return value.toLocaleString("en-US").split(",").join(" "); }
  function rate(value: number) { return `$${value.toFixed(2)}/M`; }
  function stepNumber(step: RealSessionCost) { return REAL_SESSION_COSTS.indexOf(step) + 1; }
  function legacyMoney(value: number) { return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`; }
  function clock(minute: number) {
    const absoluteMinute = minute < 9 * 60 ? minute + 9 * 60 : minute;
    const hour24 = Math.floor(absoluteMinute / 60) % 24;
    const min = minute % 60;
    return `${hour24 % 12 || 12}:${String(min).padStart(2, "0")}${hour24 >= 12 ? "p" : "a"}`;
  }
  function changeClass(id: string, usd: number) {
    const before = previousCosts[id];
    if (before === undefined || Math.abs(before - usd) < 0.00001) return "";
    return usd < before ? "cheaper" : "pricier";
  }
</script>

<div class="widget" class:compact>
{#if realMode}
  <div class="toolbar">
    <div class="live"><i></i> Real Claude Code capture · Opus 4.8</div>
    <div class="toolbar-actions"><RawDataModal title="Claude Code Opus 4.8 session" provenance={REAL_SEGMENT_PROVENANCE} rows={REAL_SEGMENT_ROWS} /><button class="transport" onclick={useTransport}>{transportLabel}</button></div>
  </div>

  <div class="timeline" aria-label="Captured session timeline">
    <span class="rail"></span>
    {#each REAL_SESSION_COSTS as step, index (step.label)}
      <button
        class="tick"
        class:arrived={index < shown}
        class:warm={index > 0}
        class:cold={index === 0}
        disabled={index >= shown}
        style={`left:${5 + (index / (REAL_SESSION_COSTS.length - 1)) * 90}%`}
        onclick={() => inspect(index)}
        aria-label={`Step ${index + 1}: ${step.label}`}
      >
        <b>{index + 1}</b><small>{tokens(step.cacheRead)} read</small>
      </button>
    {/each}
  </div>

  <div class="tabs">
    <button class:active={tab === "chat"} onclick={() => tab = "chat"}>💬 Conversation</button>
    <button class:active={tab === "cost"} onclick={() => tab = "cost"}>🔧 Under the hood</button>
  </div>

  <div class="stage">
    {#if tab === "chat"}
      <div class="chat" aria-live="polite">
        {#each realVisible as step (step.label)}
          <button class="bubble round-trip" onclick={() => inspect(stepNumber(step) - 1)} title="Inspect this API round trip">
            <small>Claude Code · round trip {stepNumber(step)}</small>
            {step.label}
          </button>
        {/each}
      </div>
    {:else}
      <div class="ledger" aria-live="polite">
        {#each realVisible as step (step.label)}
          <button
            class="ledger-row"
            class:selected={realSelected === step}
            onclick={() => inspect(stepNumber(step) - 1)}
            title="Inspect this API round trip"
          >
            <span class="num">#{stepNumber(step)}</span>
            <span class="summary"><b>{step.label}</b><small>{tokens(step.cacheRead)} cached · {tokens(step.cacheWrite + step.freshInput)} new</small></span>
            <span class="mini" aria-hidden="true"><i class="read"></i><i class="write"></i><i class="output"></i></span>
            <strong>{exactMoney(step.costWarm)}</strong>
          </button>
        {/each}
      </div>
    {/if}

    {#if realSelected && selectedIndex !== null && tab === "cost"}
      <aside class="inspector" aria-label={`Receipt for step ${selectedIndex + 1}`}>
        <div class="inspector-title"><span>Message receipt · step {selectedIndex + 1}</span><button onclick={() => selectedIndex = null} aria-label="Close receipt">×</button></div>
        <p><b>{realSelected.label}</b></p>
        <p class="explanation">Everything before the latest chunk is a cheap cache re-read. Only the newest chunk pays full write/input price.</p>

        <div class="chunk-bar" aria-label="Prompt chunks">
          {#each promptChunks as chunk}
            <div class:hot={chunk.hot} title={`${chunk.label}: ${tokens(chunk.tokens)} tokens, ${exactMoney(chunk.usd)}`}>
              <span>{chunk.hot ? "fresh" : chunk.label}</span>
              <b>{tokens(chunk.tokens)} tok</b>
              <small>{exactMoney(chunk.usd)}</small>
            </div>
          {/each}
        </div>
        <div class="chunk-legend"><span><i></i> cheap cache reads ({rate(REAL_SESSION_RATES.cacheRead)})</span><span><i></i> newest, full price</span></div>

        <div class="receipt-lines">
          <div><span>cache read</span><span>{tokens(realSelected.cacheRead)} tok × {rate(REAL_SESSION_RATES.cacheRead)} = {exactMoney(tokCost(realSelected.cacheRead, RATE.read, REAL_SESSION_MODEL))}</span></div>
          <div><span>cache write</span><span>{tokens(realSelected.cacheWrite)} tok × {rate(REAL_SESSION_RATES.cacheWrite)} = {exactMoney(tokCost(realSelected.cacheWrite, RATE.w5m, REAL_SESSION_MODEL))}</span></div>
          <div><span>fresh input</span><span>{tokens(realSelected.freshInput)} tok × {rate(REAL_SESSION_RATES.freshInput)} = {exactMoney(tokCost(realSelected.freshInput, RATE.input, REAL_SESSION_MODEL))}</span></div>
          <div><span>output (incl. thinking)</span><span>{tokens(realSelected.output)} tok × {rate(REAL_SESSION_RATES.output)} = {exactMoney(tokCost(realSelected.output, RATE.out, REAL_SESSION_MODEL))}</span></div>
          <div class="receipt-total"><span>───── TOTAL</span><strong>{exactMoney(realSelected.costWarm)}</strong></div>
        </div>
        <p class="step-saving">With cache {exactMoney(realSelected.costWarm)} vs {exactMoney(realSelected.costCold)} uncached · {realSelected.savedPct.toFixed(1)}% saved</p>
      </aside>
    {/if}
  </div>

  <footer aria-label="Running cache savings">
    <span>running through step {shown}</span>
    <strong>{summaryMoney(realRunning.costWarm)} <small>with cache</small> <em>vs</em> {summaryMoney(realRunning.costCold)} <small>uncached</small> <em>·</em> {realRunning.savedPct.toFixed(0)}% saved</strong>
  </footer>
{:else}
  <div class="toolbar">
    {#if hasToggle}
      <div class="switch-wrap">
        <span class:active={!leverOn}>{offLabel}</span>
        <button class="switch" class:on={leverOn} onclick={flip} aria-label={`Switch to ${leverOn ? offLabel : onLabel}`}><i></i></button>
        <span class:active={leverOn}>{onLabel}</span>
      </div>
    {:else}
      <div class="live"><i></i> Live workday</div>
    {/if}
    <div class="toolbar-actions"><RawDataModal title="Modeled conversation ledger" provenance={{ real: false }} rows={modeledRawRows} /><button class="transport" onclick={useTransport}>{transportLabel}</button></div>
  </div>

  <div class="timeline" aria-label="Day timeline">
    <span class="rail"></span>
    {#each legacyMessages as message, index (message.id)}
      <button class="tick" class:arrived={index < shown} class:warm={message.warm} class:cold={!message.warm}
        style={`left:${legacyMessages.length === 1 ? 50 : 5 + (index / (legacyMessages.length - 1)) * 90}%`}
        onclick={() => inspectLegacy(message.id)} aria-label={`${clock(message.atMin)} ${legacyMoney(message.usd)}`}>
        <b>{index + 1}</b><small>{clock(message.atMin)}</small>
      </button>
    {/each}
  </div>

  <div class="tabs">
    <button class:active={tab === "chat"} onclick={() => tab = "chat"}>💬 Conversation</button>
    <button class:active={tab === "cost"} onclick={() => tab = "cost"}>🔧 Under the hood</button>
  </div>

  <div class="stage">
    {#if tab === "chat"}
      <div class="chat" aria-live="polite">
        {#each legacyVisible as message (message.id)}
          <button class="bubble" class:user={message.role === "user"} onclick={() => inspectLegacy(message.id)} title="Inspect this message's cost">
            <small>{message.role === "user" ? "You" : "Claude"} · {clock(message.atMin)}</small>{message.text}
          </button>
        {/each}
      </div>
    {:else}
      <div class="ledger" aria-live="polite">
        {#each legacyVisible as message, index (message.id)}
          <button class="ledger-row {changeClass(message.id, message.usd)}" class:selected={selectedId === message.id}
            onclick={() => inspectLegacy(message.id)} title="Inspect this message">
            <span class="num">#{Math.max(0, shown - legacyVisible.length) + index + 1}</span>
            <span class="summary"><b>{message.text}</b><small>{message.compactedTok ? `compacted ${message.compactedTok.toLocaleString()} tok` : message.warm ? "warm read" : "cold write"} · {message.gapMin ? `after ${message.gapMin}m` : "first touch"}</small></span>
            <span class="mini" aria-hidden="true"><i class="prefix" style={`flex:${message.buckets.prefix.usd}`}></i><i class="input" style={`flex:${message.buckets.workIn.usd}`}></i><i class="output" style={`flex:${message.buckets.output.usd}`}></i>{#if message.buckets.keepWarm.usd}<i class="ping" style={`flex:${message.buckets.keepWarm.usd}`}></i>{/if}{#if message.buckets.compaction.usd}<i class="compact-cost" style={`flex:${message.buckets.compaction.usd}`}></i>{/if}</span>
            <strong>{legacyMoney(message.usd)}</strong>
          </button>
        {/each}
      </div>
    {/if}

    {#if legacySelected && tab === "cost"}
      <aside class="inspector legacy-inspector">
        <div class="inspector-title"><span>Message receipt</span><button onclick={() => selectedId = null} aria-label="Close receipt">×</button></div>
        <p>{legacySelected.reason}</p>
        <dl>
          <dt>Prefix</dt><dd>{legacySelected.buckets.prefix.tokens.toLocaleString()} tok</dd><dd>{legacyMoney(legacySelected.buckets.prefix.usd)}</dd>
          <dt>Fresh input</dt><dd>{legacySelected.buckets.workIn.tokens.toLocaleString()} tok</dd><dd>{legacyMoney(legacySelected.buckets.workIn.usd)}</dd>
          <dt>Output</dt><dd>{legacySelected.buckets.output.tokens.toLocaleString()} tok</dd><dd>{legacyMoney(legacySelected.buckets.output.usd)}</dd>
          {#if legacySelected.buckets.keepWarm.tokens}<dt>Keep-warm</dt><dd>{legacySelected.buckets.keepWarm.tokens.toLocaleString()} tok</dd><dd>{legacyMoney(legacySelected.buckets.keepWarm.usd)}</dd>{/if}
          {#if legacySelected.buckets.compaction.tokens}<dt>Auto-compact (Haiku)</dt><dd>{legacySelected.buckets.compaction.tokens.toLocaleString()} tok</dd><dd>{legacyMoney(legacySelected.buckets.compaction.usd)}</dd>{/if}
        </dl>
      </aside>
    {/if}
  </div>

  <footer class="legacy-footer">
    <span>running <b>{legacyMoney(legacyRunningTotal)}</b></span>
    <span class="day-total">projected day <b>{legacyMoney(legacyDayTotal)}</b></span>
  </footer>
{/if}
</div>

<style>
  .toolbar-actions{display:flex;align-items:center;gap:7px}
  .widget{height:100%;display:flex;flex-direction:column;border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d;min-height:0}button{font:inherit;color:inherit}.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 16px;background:#fff9db;border-bottom:2px solid #20201d;flex:none}.live{font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.live i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#2db871;margin-right:7px;box-shadow:0 0 0 4px #2db87122}.switch-wrap{display:flex;align-items:center;gap:9px;font-size:.84rem;font-weight:800}.switch-wrap>span{opacity:.42}.switch-wrap>span.active{opacity:1}.switch{width:48px;height:27px;padding:3px;border:2px solid #20201d;border-radius:99px;background:#f08080;cursor:pointer}.switch.on{background:#62d39a}.switch i{display:block;width:17px;height:17px;border-radius:50%;background:white;border:1px solid #20201d;transition:transform .22s}.switch.on i{transform:translateX(19px)}.transport{border:1.5px solid #20201d;background:white;border-radius:9px;padding:6px 10px;font-weight:800;cursor:pointer;box-shadow:2px 2px 0 #20201d;white-space:nowrap}.timeline{height:76px;margin:0 20px;position:relative;overflow:hidden;flex:none}.rail{position:absolute;left:5%;right:5%;top:32px;height:3px;background:#d8d5cc}.tick{position:absolute;top:18px;transform:translateX(-50%) scale(.2);border:2px solid #20201d;width:30px;height:30px;border-radius:50%;background:#ddd;opacity:0;cursor:pointer;transition:.35s cubic-bezier(.2,.9,.25,1.3);padding:0}.tick:disabled{pointer-events:none}.tick.arrived{opacity:1;transform:translateX(-50%) scale(1)}.tick.warm{background:#79dea9}.tick.cold{background:#ff8b82}.tick b{font-size:.75rem}.tick small{position:absolute;top:32px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:.56rem;font-weight:700}.tabs{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #20201d;border-bottom:2px solid #20201d;flex:none}.tabs button{border:0;background:#f1efe9;padding:9px;cursor:pointer;font-weight:800}.tabs button:first-child{border-right:2px solid #20201d}.tabs button.active{background:white;box-shadow:inset 0 -4px #f2c94c}.stage{min-height:190px;min-width:0;flex:1;display:flex;position:relative;padding:14px;background:#fff;overflow:hidden}.chat,.ledger{flex:1;min-width:0;min-height:0;max-height:100%;overflow-x:hidden;overflow-y:auto}.chat{display:flex;flex-direction:column;gap:8px}.chat>.bubble:first-child,.ledger>.ledger-row:first-child{margin-top:auto}.bubble{display:block;max-width:82%;align-self:flex-start;border:1.5px solid #20201d;border-radius:6px 15px 15px;padding:8px 11px;background:#f4f2ec;text-align:left;cursor:pointer;animation:pop .25s ease-out}.bubble.round-trip:nth-child(even),.bubble.user{align-self:flex-end;background:#e8f3ff;border-radius:15px 6px 15px 15px}.bubble small{display:block;color:#6c685f;font-size:.66rem;font-weight:700;margin-bottom:2px}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.96)}}.ledger{display:flex;flex-direction:column;gap:6px}.ledger-row{display:grid;grid-template-columns:28px minmax(110px,1fr) minmax(50px,100px) 82px;gap:8px;align-items:center;width:100%;border:1.5px solid #d2cfc6;border-radius:10px;background:#fff;padding:7px 8px;text-align:left;cursor:pointer}.ledger-row.selected{outline:3px solid #f2c94c}.ledger-row.cheaper{animation:greenflash .8s}.ledger-row.pricier{animation:redflash .8s}@keyframes greenflash{40%{background:#c8f5d9}}@keyframes redflash{40%{background:#ffd0cc}}.num{font-weight:900}.summary{overflow:hidden}.summary b,.summary small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.summary b{font-size:.78rem}.summary small{font-size:.66rem;color:#6c685f}.mini{display:flex;height:9px;overflow:hidden;border-radius:9px;background:#eee}.mini i{min-width:2px}.mini .read{background:#55bd80;flex:10}.mini .write{background:#f0785e;flex:2}.mini .output{background:#6c8fd8;flex:1}.mini .prefix{background:#ee7b72}.mini .input{background:#67a9ef}.mini .ping{background:#f2c94c}.mini .compact-cost{background:#c47ee8}.ledger-row strong{text-align:right;font-size:.72rem;font-variant-numeric:tabular-nums}.inspector{position:absolute;inset:10px;background:#fffdf4;border:2px solid #20201d;border-radius:13px;padding:14px;box-shadow:5px 6px 0 #f2c94c;overflow-x:hidden;overflow-y:auto}.inspector-title{display:flex;justify-content:space-between;font-weight:900}.inspector-title button{border:0;background:none;font-size:1.4rem;cursor:pointer}.inspector p{font-size:.78rem;line-height:1.35;margin:8px 0}.legacy-inspector dl{display:grid;grid-template-columns:1fr auto auto;gap:5px 12px;margin:0;font-size:.76rem}.legacy-inspector dd{margin:0;font-variant-numeric:tabular-nums}.legacy-inspector dd:last-child{text-align:right;font-weight:800}.explanation{color:#5d5a53}.chunk-bar{display:flex;width:100%;min-height:64px;border:1.5px solid #20201d;border-radius:9px;overflow:hidden;background:#dff5e8}.chunk-bar>div{flex:1 1 0;min-width:0;padding:5px 2px;border-right:1px solid #20201d55;background:#79dea9;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-variant-numeric:tabular-nums;overflow:hidden}.chunk-bar>div:last-child{border-right:0}.chunk-bar>div.hot{flex:1.4 1 0;background:#ff8b72;box-shadow:inset 0 0 0 3px #e84f32}.chunk-bar span,.chunk-bar b,.chunk-bar small{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chunk-bar span{font-size:.5rem;text-transform:uppercase}.chunk-bar b{font-size:.58rem}.chunk-bar small{font-size:.52rem}.chunk-legend{display:flex;justify-content:space-between;gap:8px;margin:5px 0 10px;font-size:.58rem;font-weight:700}.chunk-legend span{display:flex;align-items:center}.chunk-legend i{width:8px;height:8px;border-radius:2px;background:#79dea9;margin-right:4px}.chunk-legend span:last-child i{background:#ff8b72}.receipt-lines{font-size:.69rem;font-variant-numeric:tabular-nums}.receipt-lines>div{display:grid;grid-template-columns:minmax(105px,.7fr) minmax(0,1.3fr);gap:8px;padding:3px 0;border-bottom:1px dashed #d5d1c5}.receipt-lines>div span:last-child{text-align:right}.receipt-total{border-bottom:0!important;border-top:2px solid #20201d;margin-top:3px;padding-top:6px!important;font-size:.77rem;font-weight:900}.receipt-total strong{text-align:right}.step-saving{text-align:right;font-weight:850;color:#177142}footer{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 16px;background:#20201d;color:#fff;font-size:.7rem;flex:none}footer>span{text-transform:uppercase;letter-spacing:.05em;color:#bbb}footer strong{font-size:.92rem;font-variant-numeric:tabular-nums;text-align:right}footer small{font-size:.63rem;color:#ccc}footer em{font-style:normal;color:#f2c94c;margin:0 3px}.legacy-footer b{font-size:1rem;font-variant-numeric:tabular-nums}.day-total{margin-left:auto}.day-total b{color:#f2c94c}
  .widget:not(.compact) .stage{min-height:250px}
  @media(max-width:600px){.toolbar{padding:8px 10px}.live{font-size:.64rem}.timeline{height:61px;margin:0 8px}.rail{top:25px}.tick{top:11px}.tick small{font-size:.5rem}.tabs button{font-size:.75rem;padding:8px 4px}.stage,.widget:not(.compact) .stage{padding:8px;min-height:150px}.bubble{max-width:90%;font-size:.75rem;padding:6px 8px}.ledger-row{grid-template-columns:22px 1fr 74px;padding:5px 6px}.mini{display:none}.inspector{inset:6px;padding:9px}.chunk-bar{min-height:54px}.chunk-bar span{display:none}.chunk-bar b{font-size:.5rem}.chunk-bar small{font-size:.45rem}.receipt-lines{font-size:.58rem}.receipt-lines>div{grid-template-columns:84px 1fr;gap:3px}footer{padding:8px;display:block}footer>span{display:block;margin-bottom:2px}footer strong{font-size:.8rem}}
  @media(max-height:700px){.compact .timeline{height:58px}.compact .rail{top:24px}.compact .tick{top:10px}.compact .stage{min-height:130px}.compact .bubble{padding:5px 8px;font-size:.72rem}.compact .ledger-row{padding:4px 7px}.compact .toolbar{padding-block:8px}.compact .tabs button{padding-block:7px}}
  @media(max-height:520px){.compact .toolbar{padding-block:4px}.compact .timeline{height:44px}.compact .rail{top:17px}.compact .tick{top:3px}.compact .tick small{display:none}.compact .tabs button{padding-block:4px}.compact .stage{min-height:76px;padding:5px}.compact .chat{gap:3px}.compact .bubble{padding:3px 6px;font-size:.65rem}.compact .bubble small{display:none}.compact footer{padding-block:4px}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
