<script lang="ts">
  import LeverWidget from "./LeverWidget.svelte";
  import type { MessageLedgerOptions, ScriptedMessage } from "../sandbox/model.js";

  interface Props { onback: () => void; onsandbox: () => void; }
  let { onback, onsandbox }: Props = $props();

  const chat: ScriptedMessage[] = [
    { id:"brief", role:"user", text:"Refactor the auth module", atMin:0 },
    { id:"scan", role:"assistant", text:"I found the session boundary. Editing it now…", atMin:2 },
    { id:"tests", role:"user", text:"Run the focused tests", atMin:10 },
    { id:"done", role:"assistant", text:"All 18 auth tests pass ✓", atMin:12 },
  ];
  const fast = chat.map((m, i) => ({ ...m, atMin:[0,2,4,6][i] }));
  const slow = chat.map((m, i) => ({ ...m, atMin:[0,8,16,24][i] }));
  const noReuse = chat.map((m, i) => ({ ...m, prefixKey:`turn-${i}` }));
  const subSame: ScriptedMessage[] = [
    { id:"a1", role:"user", text:"Agent 1: review this diff", atMin:0, prefixKey:"review" },
    { id:"a2", role:"assistant", text:"Agent 1: two edge cases found", atMin:1, prefixKey:"review" },
    { id:"a3", role:"user", text:"Agent 2: review this diff", atMin:2, prefixKey:"review" },
    { id:"a4", role:"assistant", text:"Agent 2: types look clean", atMin:3, prefixKey:"review" },
  ];
  const subDifferent = subSame.map((m, i) => ({ ...m, prefixKey:`review-${i}` }));
  const base: MessageLedgerOptions = { ttl:"5m", model:"sonnet", prefixTok:260_000, workInTok:600, outputTok:900 };

  const sections: Array<{eyebrow:string;title:string;copy:string;script:ScriptedMessage[];offScript?:ScriptedMessage[];onScript?:ScriptedMessage[];offLabel:string;onLabel:string;off:MessageLedgerOptions;on:MessageLedgerOptions;startOn?:boolean}> = [
    { eyebrow:"1 · THE GATEWAY", title:"The second message remembers.", copy:"A big context is expensive to write once—and wonderfully cheap to read again. Flip reuse off and watch every turn forget.", script:chat, offScript:noReuse, onScript:chat, offLabel:"Rebuild every turn", onLabel:"Reuse context", off:{...base, ttl:"1h"}, on:{...base, ttl:"1h"}, startOn:true },
    { eyebrow:"2 · WALL CLOCK", title:"Approval speed is a money lever.", copy:"The work is identical. Auto approval answers before five minutes; a human-sized pause lets the cache evaporate.", script:fast, offScript:slow, onScript:fast, offLabel:"Manual (slow)", onLabel:"Auto (fast)", off:{...base}, on:{...base}, startOn:true },
    { eyebrow:"3 · THE AHA", title:"$1, then pennies, then $1 again.", copy:"A 5-minute cache dies during the gap before message three. One hour keeps it alive—flip it and watch #3 turn green.", script:chat, offLabel:"5-minute TTL", onLabel:"1-hour TTL", off:{...base,ttl:"5m"}, on:{...base,ttl:"1h"} },
    { eyebrow:"4 · FAN-OUT", title:"One word can split the cache.", copy:"Helpers with the same prompt share a prefix. Make each prompt unique and every spawn buys its own copy.", script:subSame, offScript:subDifferent, onScript:subSame, offLabel:"Different prompts", onLabel:"Same prompt", off:{...base,ttl:"1h"}, on:{...base,ttl:"1h"}, startOn:true },
    { eyebrow:"5 · THE NERDY ONE", title:"Pay a little to stay warm.", copy:"A tiny cache read before expiry can bridge a medium gap. Across very long breaks, those pings can cost more than one rebuild.", script:chat.map((m,i)=>({...m,atMin:[0,2,17,19][i]})), offLabel:"No pings", onLabel:"Keep warm", off:{...base}, on:{...base,keepWarm:true} },
  ];
</script>

<svelte:head><title>The surprisingly expensive pause</title></svelte:head>

<main class="article">
  <nav><button onclick={onback}>← Back to map</button><span>THE CACHE FIELD GUIDE</span></nav>
  <header>
    <span class="doodle">$</span>
    <p>AN INTERACTIVE EXPLAINER</p>
    <h1>The surprisingly<br/><em>expensive</em> pause.</h1>
    <div>Claude Code can do the same work for wildly different prices. Touch each lever and watch the receipt.</div>
    <span class="arrow">↓</span>
  </header>

  {#each sections as section}
    <section>
      <div class="section-copy">
        <small>{section.eyebrow}</small>
        <h2>{section.title}</h2>
        <p>{section.copy}</p>
      </div>
      <LeverWidget
        script={section.script}
        offScript={section.offScript}
        onScript={section.onScript}
        offLabel={section.offLabel}
        onLabel={section.onLabel}
        off={section.off}
        on={section.on}
        startOn={section.startOn}
      />
      {#if section.eyebrow.startsWith("2")}
        <p class="note">Tip: switch modes to compare timing. The toggle swaps the wall-clock script.</p>
      {/if}
    </section>
  {/each}

  <section class="cta">
    <div><small>YOU KNOW THE TRICK NOW</small><h2>Want all the knobs at once?</h2><p>Mix model, context, TTL, approvals, sub-agents, and pings in the full simulator.</p></div>
    <button onclick={onsandbox}>Open the Sandbox <span>→</span></button>
  </section>
</main>

<style>
  .article { width:min(940px, calc(100% - 28px)); margin:0 auto; padding-bottom:80px; color:#20201d; background:#fff; box-shadow:0 0 0 100vmax #fff; clip-path:inset(0 -100vmax); font-family:ui-rounded,"Comic Sans MS",system-ui,sans-serif; }
  nav { display:flex; justify-content:space-between; align-items:center; padding:18px 0; border-bottom:2px solid #20201d; font-size:.72rem; font-weight:900; letter-spacing:.12em; }
  nav button { border:0; background:none; font:inherit; cursor:pointer; letter-spacing:0; }
  header { min-height:500px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; position:relative; }
  header p,.section-copy small,.cta small { font-weight:950; letter-spacing:.13em; font-size:.72rem; }
  h1 { font-size:clamp(3rem,9vw,6.6rem); line-height:.86; letter-spacing:-.065em; margin:16px 0 26px; }
  h1 em { font-style:normal; text-decoration:underline wavy #f2c94c 5px; text-underline-offset:8px; }
  header > div { max-width:560px; font-size:1.12rem; line-height:1.5; }
  .doodle { position:absolute; right:10%; top:18%; width:55px;height:55px;border:3px solid #20201d;border-radius:50% 45% 52% 46%;display:grid;place-items:center;font:900 2rem serif;transform:rotate(12deg);background:#9ce5bd;box-shadow:5px 5px 0 #20201d; }
  .arrow { font-size:2rem; margin-top:35px; animation:bob 1.4s infinite; } @keyframes bob{50%{transform:translateY(8px)}}
  section { margin:100px 0 140px; }
  .section-copy { max-width:650px; margin:0 0 24px 18px; }
  .section-copy small { color:#a85e13; }.section-copy h2,.cta h2{font-size:clamp(2rem,5vw,3.6rem);line-height:1;letter-spacing:-.045em;margin:8px 0 12px}.section-copy p,.cta p{font-size:1.05rem;line-height:1.5;margin:0;max-width:620px}
  .note{font-size:.72rem;color:#716c62;text-align:center}
  .cta { border:3px solid #20201d; border-radius:25px 19px 28px 18px; padding:34px; display:flex; align-items:center; gap:30px; background:#fff6c7; box-shadow:10px 11px 0 #f2c94c; }
  .cta div{flex:1}.cta button{border:2px solid #20201d;border-radius:14px;background:#20201d;color:white;padding:16px 20px;font:900 1rem inherit;cursor:pointer;white-space:nowrap;box-shadow:5px 5px 0 #e57970;transition:transform .2s}.cta button:hover{transform:translate(-2px,-2px)}.cta button span{font-size:1.4rem;margin-left:8px}
  @media(max-width:650px){.article{width:min(100% - 18px,940px)}nav span{display:none}header{min-height:430px}header>div{font-size:.95rem}.doodle{right:2%;top:14%;width:40px;height:40px;font-size:1.4rem}section{margin:75px 0 105px}.section-copy{margin-left:6px}.section-copy p{font-size:.94rem}.cta{padding:23px 18px;display:block}.cta button{width:100%;margin-top:22px}}
</style>
