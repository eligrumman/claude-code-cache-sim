<script lang="ts">
  import type { Config } from "../engine/types.js";
  import type { Scope } from "../game/types.js";
  import type { ControlId } from "../game/levels.js";

  let {
    cfg,
    scope,
    seed,
    locked = false,
    controls,
    showRunGroup,
    onpatch,
    onscope,
    onseed,
    onreroll,
  }: {
    cfg: Config;
    scope: Scope;
    seed: number;
    locked?: boolean;
    // GAME_PLAN.md Section C.2: when provided, only these ControlIds render -
    // progressive disclosure. Undefined = show everything (freeplay/sandbox).
    controls?: ControlId[];
    showRunGroup?: boolean;
    onpatch: (patch: Partial<Config>) => void;
    onscope: (s: Scope) => void;
    onseed: (s: number) => void;
    onreroll: () => void;
  } = $props();

  const runGroupVisible = $derived(showRunGroup ?? controls === undefined);
  function shown(id: ControlId): boolean {
    return controls === undefined || controls.includes(id);
  }
  const anyModels = $derived(shown("planModel") || shown("devModel") || shown("orchestratorModel"));
  const anyExec = $derived(shown("who") || shown("prompts") || shown("width"));
  const anyCache = $derived(shown("oneHourFlag") || shown("keepWarm") || shown("keepWarmMin"));
  const anySession = $derived(shown("hook") || shown("skills") || shown("skillsMode") || shown("memoryFiles") || shown("mcp"));

  const models = ["sonnet", "opus", "fable"] as const;
  function toggleMcp(i: number) {
    const mcp = [...cfg.mcp] as [boolean, boolean, boolean, boolean];
    mcp[i] = !mcp[i];
    onpatch({ mcp });
  }
</script>

<div class="card cfg">
  <h2>Config</h2>

  {#if anyModels}
  <div class="grp">
    <p class="grp-h">Models</p>
    {#if shown("planModel")}
    <div class="ctl">
      <label for="planModel">Plan</label>
      <select id="planModel" class="mini" value={cfg.planModel}
        onchange={(e) => onpatch({ planModel: e.currentTarget.value as Config["planModel"] })}>
        {#each models as m}<option>{m}</option>{/each}
      </select>
    </div>
    {/if}
    {#if shown("devModel")}
    <div class="ctl">
      <label for="devModel">Dev</label>
      <select id="devModel" class="mini" value={cfg.devModel}
        onchange={(e) => onpatch({ devModel: e.currentTarget.value as Config["devModel"] })}>
        {#each models as m}<option>{m}</option>{/each}
      </select>
    </div>
    {/if}
    {#if shown("orchestratorModel")}
    <div class="ctl">
      <label for="orch">Orchestrator</label>
      <select id="orch" class="mini" value={cfg.orchestratorModel}
        onchange={(e) => onpatch({ orchestratorModel: e.currentTarget.value as Config["orchestratorModel"] })}>
        {#each models as m}<option>{m}</option>{/each}
      </select>
    </div>
    {/if}
  </div>
  {/if}

  {#if anyExec}
  <div class="grp">
    <p class="grp-h">Execution</p>
    {#if shown("who")}
    <div class="ctl">
      <span class="lbl">Subagents</span>
      <span class="seg">
        <button class={cfg.who === "inline" ? "on" : ""} onclick={() => onpatch({ who: "inline" })}>inline</button>
        <button class={cfg.who === "subagent" ? "on" : ""} onclick={() => onpatch({ who: "subagent" })}>subagent</button>
      </span>
    </div>
    {/if}
    {#if shown("prompts")}
    <div class="ctl {cfg.who !== 'subagent' ? 'dis' : ''}">
      <label for="prompts">Prompts</label>
      <select id="prompts" class="mini" value={cfg.prompts}
        onchange={(e) => onpatch({ prompts: e.currentTarget.value as Config["prompts"] })}>
        <option>identical</option><option>pointer</option><option>varied</option>
      </select>
    </div>
    {/if}
    {#if shown("width")}
    <div class="ctl {cfg.who !== 'subagent' ? 'dis' : ''}">
      <label for="width">Fan-out</label>
      <span class="rngrow">
        <input id="width" type="range" class="mini" min="1" max="8" step="1" value={cfg.width}
          oninput={(e) => onpatch({ width: +e.currentTarget.value as Config["width"] })} />
        <span class="rngval">{cfg.width}</span>
      </span>
    </div>
    {/if}
  </div>
  {/if}

  {#if anyCache}
  <div class="grp">
    <p class="grp-h">Cache</p>
    {#if shown("oneHourFlag")}
    <div class="ctl">
      <label for="flag">1h flag</label>
      <input id="flag" type="checkbox" class="mini" checked={cfg.oneHourFlag}
        onchange={(e) => onpatch({ oneHourFlag: e.currentTarget.checked })} />
    </div>
    {/if}
    {#if shown("keepWarm")}
    <div class="ctl">
      <label for="kw">Keep-warm ping</label>
      <input id="kw" type="checkbox" class="mini" checked={cfg.keepWarm}
        onchange={(e) => onpatch({ keepWarm: e.currentTarget.checked })} />
    </div>
    {/if}
    {#if shown("keepWarmMin")}
    <div class="ctl {!cfg.keepWarm ? 'dis' : ''}">
      <label for="kwm">Interval</label>
      <span class="rngrow">
        <input id="kwm" type="range" class="mini" min="10" max="55" step="5" value={cfg.keepWarmMin}
          oninput={(e) => onpatch({ keepWarmMin: +e.currentTarget.value })} />
        <span class="rngval">{cfg.keepWarmMin}m</span>
      </span>
    </div>
    {/if}
  </div>
  {/if}

  {#if anySession}
  <div class="grp">
    <p class="grp-h">Session base</p>
    {#if shown("hook")}
    <div class="ctl">
      <label for="hook">SessionStart hook</label>
      <select id="hook" class="mini" value={cfg.hook}
        onchange={(e) => onpatch({ hook: e.currentTarget.value as Config["hook"] })}>
        <option>none</option><option>static</option><option>dynamic</option>
      </select>
    </div>
    {/if}
    {#if shown("skills")}
    <div class="ctl">
      <label for="skills">Skills</label>
      <span class="rngrow">
        <input id="skills" type="range" class="mini" min="10" max="150" step="10" value={cfg.skills}
          oninput={(e) => onpatch({ skills: +e.currentTarget.value })} />
        <span class="rngval">{cfg.skills}</span>
      </span>
    </div>
    {/if}
    {#if shown("skillsMode")}
    <div class="ctl">
      <span class="lbl">Skills mode</span>
      <span class="seg">
        <button class={cfg.skillsMode === "eager" ? "on" : ""} onclick={() => onpatch({ skillsMode: "eager" })}>eager</button>
        <button class={cfg.skillsMode === "invoke" ? "on" : ""} onclick={() => onpatch({ skillsMode: "invoke" })}>invoke</button>
      </span>
    </div>
    {/if}
    {#if shown("memoryFiles")}
    <div class="ctl">
      <label for="mem">Memory files</label>
      <span class="rngrow">
        <input id="mem" type="range" class="mini" min="0" max="10" step="1" value={cfg.memoryFiles}
          oninput={(e) => onpatch({ memoryFiles: +e.currentTarget.value })} />
        <span class="rngval">{cfg.memoryFiles}</span>
      </span>
    </div>
    {/if}
    {#if shown("mcp")}
    <div class="ctl" style="align-items:flex-start">
      <span class="lbl">MCP servers</span>
      <div style="flex:1;max-width:130px">
        {#each [["db", "6k"], ["github", "4k"], ["slack", "3k"], ["fs", "3k"]] as [name, size], i}
          <label class="mcp-row">
            <input type="checkbox" class="mini" checked={cfg.mcp[i]} onchange={() => toggleMcp(i)} />
            <span>{name}</span><span class="fact">{size}</span>
          </label>
        {/each}
      </div>
    </div>
    {/if}
  </div>
  {/if}

  {#if runGroupVisible}
  <div class="grp">
    <p class="grp-h">Run</p>
    <div class="ctl {locked ? 'dis' : ''}">
      <label for="scope">Scope</label>
      <select id="scope" class="mini" value={scope} onchange={(e) => onscope(e.currentTarget.value as Scope)}>
        <option>session</option><option>week</option><option>month</option>
      </select>
    </div>
    <div class="ctl">
      <label for="seed">Seed</label>
      <span class="seedrow">
        <input id="seed" type="text" value={seed} onchange={(e) => onseed(+e.currentTarget.value || 42)} />
        <button class="icobtn" title="reroll" onclick={onreroll}>&#8635;</button>
      </span>
    </div>
  </div>
  {/if}
</div>
