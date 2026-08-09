<script lang="ts">
  import {
    BUCKET_META,
    simulateMessageLedger,
    type BucketId,
    type MessageLedgerOptions,
    type ScriptedMessage,
  } from "./model.js";

  type BucketTotal = { tokens: number; usd: number };

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
    bucketTotals?: Record<BucketId, BucketTotal>;
    projectedTotal?: number;
    compact?: boolean;
  }

  let {
    script, options, offScript, onScript, offLabel, onLabel, off, on,
    startOn = false, bucketTotals, projectedTotal, compact = false,
  }: Props = $props();
  let leverOn = $state(false);
  let paused = $state(false);
  let tab = $state<"chat" | "cost">("chat");
  let shown = $state(1);
  let selectedId = $state<string | null>(null);
  let previousCosts = $state<Record<string, number>>({});

  const hasToggle = $derived(Boolean(off && on && offLabel && onLabel));
  const activeScript = $derived(hasToggle ? ((leverOn ? onScript : offScript) ?? script) : script);
  const activeOptions = $derived(hasToggle ? (leverOn ? on! : off!) : options);
  const ledger = $derived(simulateMessageLedger(activeScript, activeOptions));
  const messages = $derived(ledger.messages);
  const selected = $derived(messages.find((message) => message.id === selectedId) ?? null);
  const visible = $derived(messages.slice(Math.max(0, compact ? shown - 6 : 0), shown));
  const runningTotal = $derived(visible.reduce((sum, message) => sum + message.usd, 0));
  const dayTotal = $derived(projectedTotal ?? ledger.totalUsd);
  const bucketOrder: BucketId[] = ["input", "cacheWrite", "cacheRead", "output", "keepWarm"];
  const bucketColors: Record<BucketId, string> = {
    input: "#aaa9a2", cacheWrite: "#e9573f", cacheRead: "#3cab6d",
    output: "#3e83d5", keepWarm: "#8bd8aa",
  };

  $effect(() => { leverOn = startOn; });

  $effect(() => {
    // A changed script/config is a new run. Keep it visible immediately after the
    // first render so tuning a lever feels live rather than restarting from zero.
    activeScript;
    activeOptions;
    if (shown > messages.length) shown = messages.length;
    selectedId = null;
  });

  $effect(() => {
    if (paused || shown >= messages.length) return;
    const here = messages[Math.max(0, shown - 1)];
    const next = messages[shown];
    const gap = Math.max(1, next.atMin - here.atMin);
    const timer = setTimeout(() => shown += 1, Math.min(1500, 460 + gap * 20));
    return () => clearTimeout(timer);
  });

  function replay() { selectedId = null; shown = 1; paused = false; }
  function flip() {
    previousCosts = Object.fromEntries(messages.map((message) => [message.id, message.usd]));
    leverOn = !leverOn;
    shown = messages.length;
    paused = true;
  }
  function inspect(id: string) {
    paused = true;
    tab = "cost";
    selectedId = id;
  }
  function money(value: number) { return value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`; }
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
  function bucketTip(bucket: BucketId) {
    if (!bucketTotals) return "";
    const item = bucketTotals[bucket];
    const pct = dayTotal ? item.usd / dayTotal * 100 : 0;
    return `${BUCKET_META[bucket].label}: ${item.tokens.toLocaleString()} tokens · ${money(item.usd)} · ${pct.toFixed(1)}% — ${BUCKET_META[bucket].why}`;
  }
</script>

<div class="widget" class:compact>
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
    <button class="pause" onclick={() => paused = !paused}>{paused ? "▶ Play" : "⏸ Pause"}</button>
  </div>

  <div class="timeline" aria-label="Day timeline">
    <span class="rail"></span>
    {#each messages as message, index (message.id)}
      <button class="tick" class:arrived={index < shown} class:warm={message.warm} class:cold={!message.warm}
        style={`left:${messages.length === 1 ? 50 : 5 + (index / (messages.length - 1)) * 90}%`}
        onclick={() => inspect(message.id)} aria-label={`${clock(message.atMin)} ${money(message.usd)}`}>
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
          <button class="bubble" class:user={message.role === "user"} onclick={() => inspect(message.id)} title="Inspect this message's cost">
            <small>{message.role === "user" ? "You" : "Claude"} · {clock(message.atMin)}</small>{message.text}
          </button>
        {/each}
      </div>
    {:else}
      <div class="ledger" aria-live="polite">
        {#each visible as message, index (message.id)}
          <button class="ledger-row {changeClass(message.id, message.usd)}" class:selected={selectedId === message.id}
            onclick={() => inspect(message.id)} title="Inspect this message">
            <span class="num">#{Math.max(0, shown - visible.length) + index + 1}</span>
            <span class="summary"><b>{message.text}</b><small>{message.warm ? "warm read" : "cold write"} · {message.gapMin ? `after ${message.gapMin}m` : "first touch"}</small></span>
            <span class="mini" aria-hidden="true"><i class="prefix" style={`flex:${message.buckets.prefix.usd}`}></i><i class="input" style={`flex:${message.buckets.workIn.usd}`}></i><i class="output" style={`flex:${message.buckets.output.usd}`}></i>{#if message.buckets.keepWarm.usd}<i class="ping" style={`flex:${message.buckets.keepWarm.usd}`}></i>{/if}</span>
            <strong>{money(message.usd)}</strong>
          </button>
        {/each}
      </div>
    {/if}

    {#if selected && tab === "cost"}
      <aside class="inspector">
        <div><span>Message receipt</span><button onclick={() => selectedId = null} aria-label="Close receipt">×</button></div>
        <p>{selected.reason}</p>
        <dl>
          <dt>Prefix</dt><dd>{selected.buckets.prefix.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.prefix.usd)}</dd>
          <dt>Fresh input</dt><dd>{selected.buckets.workIn.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.workIn.usd)}</dd>
          <dt>Output</dt><dd>{selected.buckets.output.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.output.usd)}</dd>
          {#if selected.buckets.keepWarm.tokens}<dt>Keep-warm</dt><dd>{selected.buckets.keepWarm.tokens.toLocaleString()} tok</dd><dd>{money(selected.buckets.keepWarm.usd)}</dd>{/if}
        </dl>
      </aside>
    {/if}
  </div>

  {#if bucketTotals}
    <div class="bottom-line" aria-label="Where the money goes">
      <strong><span>Run total</span>{money(dayTotal)}</strong>
      <div class="bucket-split">
        {#each bucketOrder as bucket}
          <button style={`--bucket:${bucketColors[bucket]}`} title={bucketTip(bucket)} aria-label={bucketTip(bucket)}>
            <i></i><span>{BUCKET_META[bucket].label.replace("Fresh ", "").replace("Cache ", "").replace("Warm cache ", "")}</span><b>{money(bucketTotals[bucket].usd)}</b>
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <footer><span>running <b>{money(runningTotal)}</b></span><span class="day-total">projected day <b>{money(dayTotal)}</b></span>{#if shown >= messages.length}<button onclick={replay}>↻ Replay</button>{/if}</footer>
  {/if}
</div>

<style>
  .widget{height:100%;display:flex;flex-direction:column;border:2px solid #20201d;border-radius:20px 17px 22px 16px;overflow:hidden;background:#fff;box-shadow:7px 8px 0 #dedbd0;color:#20201d;min-height:0}button{font:inherit;color:inherit}.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 16px;background:#fff9db;border-bottom:2px solid #20201d;flex:none}.switch-wrap{display:flex;align-items:center;gap:9px;font-size:.84rem;font-weight:800}.switch-wrap>span{opacity:.42;transition:opacity .2s,transform .2s}.switch-wrap>span.active{opacity:1;transform:translateY(-1px)}.switch{width:48px;height:27px;padding:3px;border:2px solid #20201d;border-radius:99px;background:#f08080;cursor:pointer}.switch.on{background:#62d39a}.switch i{display:block;width:17px;height:17px;border-radius:50%;background:white;border:1px solid #20201d;transition:transform .22s cubic-bezier(.2,.8,.2,1.2)}.switch.on i{transform:translateX(19px)}.live{font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.live i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#2db871;margin-right:7px;box-shadow:0 0 0 4px #2db87122}.pause,footer button{border:1.5px solid #20201d;background:white;border-radius:9px;padding:6px 10px;font-weight:750;cursor:pointer;box-shadow:2px 2px 0 #20201d}.timeline{height:76px;margin:0 20px;position:relative;overflow:hidden;flex:none}.rail{position:absolute;left:5%;right:5%;top:32px;height:3px;background:#d8d5cc}.tick{position:absolute;top:18px;transform:translateX(-50%) scale(.2);border:2px solid #20201d;width:30px;height:30px;border-radius:50%;background:#ddd;opacity:0;cursor:pointer;transition:.35s cubic-bezier(.2,.9,.25,1.3);padding:0}.tick.arrived{opacity:1;transform:translateX(-50%) scale(1)}.tick.warm{background:#79dea9}.tick.cold{background:#ff8b82}.tick b{font-size:.75rem}.tick small{position:absolute;top:32px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:.62rem;font-weight:700}.tabs{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid #20201d;border-bottom:2px solid #20201d;flex:none}.tabs button{border:0;background:#f1efe9;padding:9px;cursor:pointer;font-weight:800}.tabs button:first-child{border-right:2px solid #20201d}.tabs button.active{background:white;box-shadow:inset 0 -4px #f2c94c}.stage{min-height:190px;flex:1;position:relative;padding:14px;background:#fff;overflow:hidden}.chat{height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:8px}.bubble{display:block;max-width:78%;align-self:flex-start;border:1.5px solid #20201d;border-radius:6px 15px 15px;padding:8px 11px;background:#f4f2ec;text-align:left;cursor:pointer;animation:pop .25s ease-out}.bubble.user{align-self:flex-end;background:#e8f3ff;border-radius:15px 6px 15px 15px}.bubble small{display:block;color:#6c685f;font-size:.66rem;font-weight:700;margin-bottom:2px}@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.96)}}.ledger{display:grid;gap:6px;align-content:end;height:100%}.ledger-row{display:grid;grid-template-columns:28px minmax(110px,1fr) minmax(50px,100px) 64px;gap:8px;align-items:center;width:100%;border:1.5px solid #d2cfc6;border-radius:10px;background:#fff;padding:7px 8px;text-align:left;cursor:pointer}.ledger-row.selected{outline:3px solid #f2c94c}.ledger-row.cheaper{animation:greenflash .8s}.ledger-row.pricier{animation:redflash .8s}@keyframes greenflash{40%{background:#c8f5d9;transform:translateX(4px)}}@keyframes redflash{40%{background:#ffd0cc;transform:translateX(-4px)}}.num{font-weight:900}.summary{overflow:hidden}.summary b,.summary small{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.summary b{font-size:.78rem}.summary small{font-size:.66rem;color:#6c685f}.mini{display:flex;height:9px;overflow:hidden;border-radius:9px;background:#eee}.mini i{min-width:2px}.prefix{background:#ee7b72}.input{background:#67a9ef}.output{background:#9b7ae8}.ping{background:#f2c94c}.ledger-row strong{text-align:right;font-variant-numeric:tabular-nums}.inspector{position:absolute;inset:10px;background:#fffdf4;border:2px solid #20201d;border-radius:13px;padding:14px;box-shadow:5px 6px 0 #f2c94c;overflow:auto}.inspector>div{display:flex;justify-content:space-between;font-weight:900}.inspector button{border:0;background:none;font-size:1.4rem;cursor:pointer}.inspector p{font-size:.84rem;line-height:1.4}.inspector dl{display:grid;grid-template-columns:1fr auto auto;gap:5px 12px;margin:0;font-size:.76rem}.inspector dd{margin:0;font-variant-numeric:tabular-nums}.inspector dd:last-child{text-align:right;font-weight:800}.bottom-line{display:flex;align-items:stretch;gap:12px;padding:10px 12px;background:#20201d;color:#fff;flex:none}.bottom-line>strong{display:flex;flex-direction:column;justify-content:center;min-width:78px;font-size:1.08rem;font-variant-numeric:tabular-nums}.bottom-line>strong span{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:#ccc}.bucket-split{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;flex:1}.bucket-split button{min-width:0;border:0;border-radius:7px;background:#ffffff12;color:white;padding:5px 6px;display:grid;grid-template-columns:6px 1fr;column-gap:5px;text-align:left;cursor:help}.bucket-split i{width:6px;height:100%;grid-row:1/3;background:var(--bucket);border-radius:5px}.bucket-split span{font-size:.56rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ddd}.bucket-split b{font-size:.72rem;font-variant-numeric:tabular-nums}footer{display:flex;gap:18px;align-items:center;padding:11px 16px;background:#20201d;color:#fff;font-size:.78rem;flex:none}footer b{font-size:1rem;font-variant-numeric:tabular-nums}.day-total{margin-left:auto}.day-total b{color:#f2c94c}footer button{color:#20201d;font-size:.72rem}
  .widget:not(.compact) .stage{min-height:250px}
  @media(max-width:600px){.toolbar{padding:8px 10px}.switch-wrap{gap:5px;font-size:.7rem}.switch-wrap>span{max-width:70px}.timeline{height:61px;margin:0 8px}.rail{top:25px}.tick{top:11px}.tick small{font-size:.55rem}.tabs button{font-size:.75rem;padding:8px 4px}.stage,.widget:not(.compact) .stage{padding:8px;min-height:150px}.bubble{max-width:88%;font-size:.75rem;padding:6px 8px}.ledger-row{grid-template-columns:22px 1fr 58px;padding:5px 6px}.mini{display:none}.bottom-line{display:block;padding:7px 8px}.bottom-line>strong{display:block;margin-bottom:5px;font-size:.9rem}.bottom-line>strong span{margin-right:7px}.bucket-split button{padding:3px}.bucket-split span{display:none}.bucket-split b{font-size:.62rem}.inspector{inset:6px;padding:10px}.inspector p{margin:7px 0}.inspector dl{font-size:.68rem;gap:3px 7px}footer{gap:7px;padding:8px;font-size:.66rem}.day-total{margin-left:0}footer button{margin-left:auto}}
  @media(max-height:700px){.compact .timeline{height:58px}.compact .rail{top:24px}.compact .tick{top:10px}.compact .stage{min-height:130px}.compact .bubble{padding:5px 8px;font-size:.72rem}.compact .ledger-row{padding:4px 7px}.compact .toolbar{padding-block:8px}.compact .tabs button{padding-block:7px}}
  @media(max-height:520px){.compact .toolbar{padding-block:4px}.compact .timeline{height:44px}.compact .rail{top:17px}.compact .tick{top:3px}.compact .tick small{display:none}.compact .tabs button{padding-block:4px}.compact .stage{min-height:76px;padding:5px}.compact .chat{gap:3px}.compact .bubble{padding:3px 6px;font-size:.65rem}.compact .bubble small{display:none}.compact .bottom-line{padding-block:4px}.compact .bottom-line>strong{margin-bottom:2px}}
  @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
