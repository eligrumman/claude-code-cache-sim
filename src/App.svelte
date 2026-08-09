<script lang="ts">
  import ArticleScreen from "./article/ArticleScreen.svelte";
  import SandboxScreen from "./sandbox/SandboxScreen.svelte";
  import TDScreen from "./td/TDScreen.svelte";

  type Experience = "home" | "article" | "sandbox" | "td";

  let experience = $state<Experience>("home");

  function goHome() {
    experience = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

{#if experience === "article"}
  <ArticleScreen onback={goHome} onsandbox={() => (experience = "sandbox")} />
{:else if experience === "sandbox"}
  <SandboxScreen onback={goHome} />
{:else if experience === "td"}
  <TDScreen onback={goHome} />
{:else}
  <main class="home">
    <header class="hero">
      <div class="eyebrow"><span aria-hidden="true">✦</span> A tiny field guide to a very hungry cache</div>
      <h1>Claude Code Cache</h1>
      <p class="tagline">Where your tokens go <span aria-hidden="true">(and why they keep asking for snacks)</span></p>
      <div class="scribble" aria-hidden="true">
        <span>understand it</span><i>→</i><span>play with it</span><i>→</i><span>survive it</span>
      </div>
    </header>

    <section class="experiences" aria-label="Choose an experience">
      <button class="experience article" onclick={() => (experience = "article")}>
        <span class="number">01</span>
        <span class="icon" aria-hidden="true">📖</span>
        <span class="card-copy">
          <strong>The Article</strong>
          <span class="hook">Understand the invisible tab.</span>
          <small>Read, poke the diagrams, and see why cache costs grow.</small>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>

      <button class="experience sandbox" onclick={() => (experience = "sandbox")}>
        <span class="number">02</span>
        <span class="icon" aria-hidden="true">🧪</span>
        <span class="card-copy">
          <strong>The Sandbox</strong>
          <span class="hook">Play with every dangerous knob.</span>
          <small>Shape a conversation and watch the token bill react live.</small>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>

      <button class="experience td" onclick={() => (experience = "td")}>
        <span class="number">03</span>
        <span class="icon" aria-hidden="true">🎈</span>
        <span class="card-copy">
          <strong>Tokenloons TD</strong>
          <span class="hook">Survive the context swarm.</span>
          <small>Defend your budget before the tokenloons reach the cache.</small>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </button>
    </section>

    <footer>
      <span aria-hidden="true">↳</span> Pick a door. You can always come back.
    </footer>
  </main>
{/if}

<style>
  :global(body) {
    background-color: #fbfaf5;
    background-image: radial-gradient(#d9d6ca 0.75px, transparent 0.75px);
    background-size: 18px 18px;
  }

  .home {
    width: min(1040px, calc(100% - 32px));
    min-height: 100vh;
    margin: 0 auto;
    padding: clamp(56px, 8vw, 96px) 0 36px;
    color: #20201e;
  }

  .hero { text-align: center; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px; padding: 7px 13px;
    border: 1.5px solid #20201e; border-radius: 999px; background: #fffef9;
    font: 700 0.72rem/1.2 system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase;
    transform: rotate(-1deg); box-shadow: 2px 2px 0 #20201e;
  }
  h1 {
    margin: 24px 0 5px; font-family: "Comic Sans MS", "Bradley Hand", cursive;
    font-size: clamp(2.8rem, 8vw, 6rem); line-height: .95; letter-spacing: -.045em;
  }
  .tagline { margin: 13px auto 0; color: #57564f; font: 500 clamp(1rem, 2vw, 1.2rem)/1.5 system-ui, sans-serif; }
  .tagline span { color: #89867b; }
  .scribble {
    display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 9px;
    margin: 26px auto 44px; color: #68665e; font: 700 .83rem/1.2 "Comic Sans MS", cursive;
  }
  .scribble span { border-bottom: 2px wavy #bbb7aa; padding-bottom: 3px; }
  .scribble i { color: #aaa69a; font-style: normal; }

  .experiences { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: stretch; }
  .experience {
    --accent: #ffd75e; position: relative; isolation: isolate; min-height: 300px;
    display: flex; flex-direction: column; align-items: flex-start; padding: 23px;
    border: 2px solid #20201e; border-radius: 23px 18px 25px 19px; background: #fffef9;
    color: inherit; text-align: left; cursor: pointer; box-shadow: 7px 8px 0 var(--accent), 9px 10px 0 #20201e;
    transition: transform .18s ease, box-shadow .18s ease;
  }
  .experience:nth-child(2) { transform: rotate(.55deg) translateY(6px); }
  .experience:nth-child(3) { transform: rotate(-.45deg); }
  .experience:hover, .experience:focus-visible {
    transform: translate(-2px, -6px) rotate(-.4deg); box-shadow: 10px 13px 0 var(--accent), 12px 15px 0 #20201e;
  }
  .experience:focus-visible { outline: 3px dashed #20201e; outline-offset: 6px; }
  .article { --accent: #82d5f5; }
  .sandbox { --accent: #ffd75e; }
  .td { --accent: #8cdda0; }
  .number { align-self: flex-end; color: #969287; font: 700 .72rem/1 system-ui, sans-serif; letter-spacing: .1em; }
  .icon { display: block; margin: 5px 0 17px; font-size: 3.35rem; filter: drop-shadow(2px 3px 0 rgba(0,0,0,.12)); }
  .card-copy { display: flex; flex-direction: column; gap: 8px; }
  .card-copy strong { font: 700 1.55rem/1.05 "Comic Sans MS", "Bradley Hand", cursive; }
  .hook { font: 750 1rem/1.3 system-ui, sans-serif; }
  .card-copy small { color: #67645c; font: 500 .88rem/1.5 system-ui, sans-serif; }
  .arrow {
    display: grid; place-items: center; width: 38px; height: 38px; margin-top: auto;
    border: 2px solid #20201e; border-radius: 50%; background: var(--accent);
    font: 800 1.25rem/1 system-ui, sans-serif; transition: transform .18s ease;
  }
  .experience:hover .arrow { transform: translateX(5px) rotate(-8deg); }
  footer { margin-top: 44px; text-align: center; color: #77746b; font: 600 .78rem/1.4 system-ui, sans-serif; }

  @media (max-width: 760px) {
    .home { padding-top: 40px; }
    .experiences { grid-template-columns: 1fr; gap: 19px; }
    .experience, .experience:nth-child(2), .experience:nth-child(3) {
      min-height: 0; display: grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto 1fr;
      column-gap: 17px; transform: none; padding: 19px;
    }
    .experience:hover, .experience:focus-visible { transform: translateY(-3px); }
    .number { grid-column: 3; grid-row: 1; }
    .icon { grid-column: 1; grid-row: 1 / 3; margin: 6px 0 0; font-size: 2.5rem; }
    .card-copy { grid-column: 2 / 4; grid-row: 2; padding-right: 42px; }
    .arrow { position: absolute; right: 18px; bottom: 18px; width: 32px; height: 32px; }
    .scribble { margin-bottom: 33px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .experience, .arrow { transition: none; }
  }
</style>
