<script lang="ts">
  import {
    simulateMessageLedger,
    type MessageLedgerOptions,
    type ScriptedMessage,
  } from "../sandbox/model.js";

  interface Props {
    script: ScriptedMessage[];
    offScript?: ScriptedMessage[];
    onScript?: ScriptedMessage[];
    offLabel: string;
    onLabel: string;
    off: MessageLedgerOptions;
    on: MessageLedgerOptions;
    startOn?: boolean;
  }

  let { script, offScript, onScript, offLabel, onLabel, off, on, startOn = false }: Props = $props();
  let leverOn = $state(false);
  let paused = $state(false);
  let tab = $state<"chat" | "cost">("chat");
  let shown = $state(1);
  let selectedId = $state<string | null>(null);
  let previousCosts = $state<Record<string, number>>({});

  let activeScript = $derived((leverOn ? onScript : offScript) ?? script);
  let ledger = $derived(simulateMessageLedger(activeScript, leverOn ? on : off));
  let messages = $derived(ledger.messages);
  let selected = $derived(messages.find((message) => message.id === selectedId) ?? null);
  let visible = $derived(messages.slice(0, shown));
  let runningTotal = $derived(visible.reduce((sum, message) => sum + message.usd, 0));

  $effect(() => {
    leverOn = startOn;
  });

  $effect(() => {
    if (paused || shown >= messages.length) return;
    const here = messages[Math.max(0, shown - 1)];
    const next = messages[shown];
    const gap = Math.max(1, next.atMin - here.atMin);
    const timer = setTimeout(() => shown += 1, Math.min(1700, 520 + gap * 45));
    return () => clearTimeout(timer);
  });

  function replay() {
    selectedId = null;
    shown = 1;
    paused = false;
  }

  function flip() {
    previousCosts = Object.fromEntries(messages.map((message) => [message.id, message.usd]));
    leverOn = !leverOn;
    shown = messages.length;
    paused = true;
  }

  function inspect(id: string) {
    if (!paused || tab !== "cost") return;
    selectedId = id;
  }

  function money(value: number) {
    return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
  }

  function clock(minute: number) {
    const hour = 9 + Math.floor(minute / 60);
    const min = minute % 60;
    return `${hour}:${String(min).padStart(2, "0")}`;
  }

  function changeClass(id: string, usd: number) {
    const before = previousCosts[id];
    if (before === undefined || Math.abs(before - usd) < 0.00001) return "";
    return usd < before ? "cheaper" : "pricier";
  }
</script>

<div class="widget">
  <div class="toolbar">
    <div class="switch-wrap">
      <span class:active={!leverOn}>{offLabel}</span>
      <button class="switch" class:on={leverOn} onclick={flip} aria-label={`Switch to ${leverOn ? offLabel : onLabel}`}>
        <i></i>
      </button>
      <span class:active={leverOn}>{onLabel}</span>
    </div>
    <button class="pause" onclick={() => paused = !paused}>{paused ? "▶ Play" : "⏸ Pause"}</button>
  </div>

  <div class="timeline" aria-label="Day timeline">
    <span class="rail"></span>
    {#each messages as message, index (message.id)}
      <button
        class="tick"
        class:arrived={index < shown}
        class:warm={message.warm}
        class:cold={!message.warm}
        style={`left:${messages.length === 1 ? 50 : 5 + (index / (messages.length - 1)) * 90}%`}
        onclick={() => { paused = true; tab = "cost"; selectedId = message.id; }}
        aria-label={`${clock(message.atMin)} ${money(message.usd)}`}
      >
        <b>{index + 1}</b><small>{clock(message.atMin)}</small>
      </button>
    {/each}
  </div>

  <div class="tabs">
    <button class:active={tab === "chat"} onclick={() => tab = "chat"}>💬 Conversation</button>
    <button class:active={tab === "cost"} onclick={() => tab = "cost"}>💸 Behind the scenes</button>
  </div>

  <div class="stage">
    {#if tab === "chat"}
      <div class="chat" aria-live="polite">
        {#each visible as message (message.id)}
          <div class="bubble" class:user={message.role === "user"}>
            <small>{message.role === "user" ? "You" : "Claude"} · {clock(message.atMin)}</small>
            {message.text}
          </div>
        {/each}
      </div>
    {:else}
      <div class="ledger" aria-live="polite">
        {#each visible as message, index (message.id)}
          <button
            class="ledger-row {changeClass(message.id, message.usd)}"
            class:selected={selectedId === message.id}
            onclick={() => inspect(message.id)}
            title={paused ? "Inspect this message" : "Pause to inspect"}
          >
            <span class="num">#{index + 1}</span>
            <span class="summary"><b>{message.text}</b><small>{message.warm ? "warm read" : "cold write"} · {message.gapMin ? `after ${message.gapMin}m` : "first touch"}</small></span>
            <span class="mini" aria-hidden="true">
              <i class="prefix" style={`flex:${message.buckets.prefix.usd}`}></i>
              <i class="input" style={`flex:${message.buckets.workIn.usd}`}></i>
              <i class="output" style={`flex:${message.buckets.output.usd}`}></i>
              {#if message.buckets.keepWarm.usd}<i class="ping" style={`flex:${message.buckets.keepWarm.usd}`}></i>{/if}
            </span>
            <strong>{money(message.usd)}</strong>
          </button>
        {/each}
        {#if !paused}<p class="hint">Pause, then tap a message to see the receipt.</p>{/if}
      </div>
    {/if}

    {#if selected && tab === "cost"}
      <aside class="inspector">
        <div><span>Message receipt</span><button onclick={() => selectedId = null} aria-label="Close">×</button></div>
        <p>{selected.reason}</p>
        <dl>
          <dt>Prefix</dt><dd>{selected.buckets.prefix.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.prefix.usd)}</dd>
          <dt>Fresh input</dt><dd>{selected.buckets.workIn.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.workIn.usd)}</dd>
          <dt>Output</dt><dd>{selected.buckets.output.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.output.usd)}</dd>
          {#if selected.buckets.keepWarm.tokens}
            <dt>Keep-warm</dt><dd>{selected.buckets.keepWarm.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.keepWarm.usd)}</dd>
          {/if}
        </dl>
      </aside>
    {/if}
  </div>

  <footer>
    <span>running <b>{money(runningTotal)}</b></span>
    <span class="day-total">projected day <b>{money(ledger.totalUsd)}</b></span>
    {#if shown >= messages.length}<button onclick={replay}>↻ Replay</button>{/if}
  </footer>
</div>

<style>
  .widget { border: 2px solid #20201d; border-radius: 20px 17px 22px 16px; overflow: hidden; background: #fff; box-shadow: 7px 8px 0 #dedbd0; color: #20201d; }
  button { font: inherit; color: inherit; }
  .toolbar { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:14px 16px; background:#fff9db; border-bottom:2px solid #20201d; }
  .switch-wrap { display:flex; align-items:center; gap:9px; font-size:.84rem; font-weight:800; }
  .switch-wrap > span { opacity:.42; transition:opacity .2s, transform .2s; }
  .switch-wrap > span.active { opacity:1; transform:translateY(-1px); }
  .switch { width:48px; height:27px; padding:3px; border:2px solid #20201d; border-radius:99px; background:#f08080; cursor:pointer; }
  .switch.on { background:#62d39a; }
  .switch i { display:block; width:17px; height:17px; border-radius:50%; background:white; border:1px solid #20201d; transition:transform .22s cubic-bezier(.2,.8,.2,1.2); }
  .switch.on i { transform:translateX(19px); }
  .pause, footer button { border:1.5px solid #20201d; background:white; border-radius:9px; padding:6px 10px; font-weight:750; cursor:pointer; box-shadow:2px 2px 0 #20201d; }
  .timeline { height:80px; margin:0 20px; position:relative; overflow:hidden; }
  .rail { position:absolute; left:5%; right:5%; top:34px; height:3px; background:#d8d5cc; }
  .tick { position:absolute; top:20px; transform:translateX(-50%) scale(.2); border:2px solid #20201d; width:30px; height:30px; border-radius:50%; background:#ddd; opacity:0; cursor:pointer; transition:.35s cubic-bezier(.2,.9,.25,1.3); padding:0; }
  .tick.arrived { opacity:1; transform:translateX(-50%) scale(1); }
  .tick.warm { background:#79dea9; }.tick.cold { background:#ff8b82; }
  .tick b { font-size:.75rem; }.tick small { position:absolute; top:32px; left:50%; transform:translateX(-50%); white-space:nowrap; font-size:.65rem; font-weight:700; }
  .tabs { display:grid; grid-template-columns:1fr 1fr; border-top:2px solid #20201d; border-bottom:2px solid #20201d; }
  .tabs button { border:0; background:#f1efe9; padding:10px; cursor:pointer; font-weight:800; }
  .tabs button:first-child { border-right:2px solid #20201d; }.tabs button.active { background:white; box-shadow:inset 0 -4px #f2c94c; }
  .stage { min-height:250px; position:relative; padding:16px; background:#fff; }
  .chat { display:flex; flex-direction:column; gap:10px; }
  .bubble { max-width:78%; align-self:flex-start; border:1.5px solid #20201d; border-radius:6px 15px 15px 15px; padding:9px 12px; background:#f4f2ec; animation:pop .25s ease-out; }
  .bubble.user { align-self:flex-end; background:#e8f3ff; border-radius:15px 6px 15px 15px; }
  .bubble small { display:block; color:#6c685f; font-size:.68rem; font-weight:700; margin-bottom:3px; }
  @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.96); } }
  .ledger { display:grid; gap:7px; }
  .ledger-row { display:grid; grid-template-columns:30px minmax(110px,1fr) minmax(50px,100px) 64px; gap:8px; align-items:center; width:100%; border:1.5px solid #d2cfc6; border-radius:10px; background:#fff; padding:8px; text-align:left; }
  .ledger-row.selected { outline:3px solid #f2c94c; }.ledger-row.cheaper { animation:greenflash .8s; }.ledger-row.pricier { animation:redflash .8s; }
  @keyframes greenflash { 40% { background:#c8f5d9; transform:translateX(4px); } } @keyframes redflash { 40% { background:#ffd0cc; transform:translateX(-4px); } }
  .num { font-weight:900; }.summary { overflow:hidden; }.summary b,.summary small { display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }.summary b{font-size:.8rem}.summary small{font-size:.68rem;color:#6c685f}
  .mini { display:flex; height:9px; overflow:hidden; border-radius:9px; background:#eee; }.mini i{min-width:2px}.prefix{background:#ee7b72}.input{background:#67a9ef}.output{background:#9b7ae8}.ping{background:#f2c94c}
  .ledger-row strong { text-align:right; font-variant-numeric:tabular-nums; }.hint { margin:8px 0 0; color:#6c685f; text-align:center; font-size:.75rem; }
  .inspector { position:absolute; inset:12px; background:#fffdf4; border:2px solid #20201d; border-radius:13px; padding:14px; box-shadow:5px 6px 0 #f2c94c; overflow:auto; }
  .inspector > div { display:flex; justify-content:space-between; font-weight:900; }.inspector button{border:0;background:none;font-size:1.4rem;cursor:pointer}.inspector p{font-size:.86rem;line-height:1.4}.inspector dl{display:grid;grid-template-columns:1fr auto auto;gap:5px 12px;margin:0;font-size:.78rem}.inspector dd{margin:0;font-variant-numeric:tabular-nums}.inspector dd:last-child{text-align:right;font-weight:800}
  footer { display:flex; gap:18px; align-items:center; padding:11px 16px; background:#20201d; color:#fff; font-size:.78rem; }
  footer b { font-size:1rem; font-variant-numeric:tabular-nums; }.day-total{margin-left:auto}.day-total b{color:#f2c94c}footer button{color:#20201d;font-size:.72rem}
  @media (max-width: 600px) { .toolbar{align-items:flex-start}.switch-wrap{gap:5px;font-size:.72rem}.switch-wrap > span{max-width:72px}.timeline{margin:0 10px}.stage{padding:10px;min-height:270px}.ledger-row{grid-template-columns:25px 1fr 60px}.mini{display:none}.bubble{max-width:87%}footer{gap:8px;padding:10px;font-size:.68rem}.day-total{margin-left:0}footer button{margin-left:auto}.inspector{inset:7px}.tabs button{font-size:.78rem} }
</style>
