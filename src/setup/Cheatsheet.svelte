<script lang="ts">
  import CopyButton from "./CopyButton.svelte";
  import { recipes, type RecipeId, type SetupRecipe } from "./recipes.js";

  const microIds: readonly RecipeId[] = ["ttl", "keep-warm", "same-prompt", "large-context", "auto-approve"];
  const micro = recipes.filter((recipe) => microIds.includes(recipe.id));
  const macro = recipes.filter((recipe) => !microIds.includes(recipe.id));
  const groups: readonly { title: string; items: readonly SetupRecipe[] }[] = [
    { title: "Micro · keep the prefix warm", items: micro },
    { title: "Macro · carry less, route smarter", items: macro },
  ];
</script>

<section class="cheatsheet" aria-labelledby="cheatsheet-title">
  <header>
    <span>Keep this bit handy</span>
    <h2 id="cheatsheet-title">The cache setup cheatsheet</h2>
    <p>Every lever from the article and game, translated into something you can actually apply in Claude Code.</p>
  </header>

  {#each groups as group (group.title)}
    <section class="recipe-group">
      <h3>{group.title}</h3>
      <div class="recipe-grid">
        {#each group.items as recipe (recipe.id)}
          <article id={`recipe-${recipe.id}`}>
            <div class="recipe-heading">
              <strong>{recipe.title}</strong>
              <span>{recipe.mechanism}</span>
            </div>
            <p>{recipe.what}</p>
            <CopyButton {recipe} compact />
          </article>
        {/each}
      </div>
    </section>
  {/each}

  <div class="recipe-group toycard">
    <div class="toycard__head toycard__head--green">
      <div>
        <strong class="toy-title">Measure your actual setup</strong>
        <span>Run the local report against your Claude Code logs. Nothing leaves your machine.</span>
      </div>
    </div>
    <div class="toycard__note">
      <CopyButton
        id="cache-report-npx"
        title="cache report command"
        snippet="npx github:eligrumman/claude-code-cache-sim cc-cache-report"
        caveat="Opens a self-contained HTML report with your real cache-hit rate and estimated spend."
        compact
      />
    </div>
  </div>
</section>

<style>
  .cheatsheet { width: min(1040px, calc(100% - 32px)); margin: clamp(4rem, 9vw, 7rem) auto 3rem; color: var(--ink, #20201e); }
  header { max-width: 690px; margin-bottom: 2rem; }
  header > span { display: inline-block; padding: .32rem .65rem; border: 1.5px solid currentColor; border-radius: 999px; background: #fff2b8; font: 800 .65rem/1.2 var(--font-body); letter-spacing: .07em; text-transform: uppercase; transform: rotate(-1deg); }
  h2 { margin: .8rem 0 .4rem; font: 800 clamp(1.8rem, 5vw, 3rem)/1 var(--font-display); letter-spacing: -.025em; }
  header p { margin: 0; color: var(--ink-soft, #67645c); font: 500 .95rem/1.5 var(--font-body); }
  .recipe-group { margin-top: 2rem; }
  .recipe-group > h3 { margin: 0 0 .75rem; padding-bottom: .45rem; border-bottom: 2px dashed #bbb7aa; font: 800 .85rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: .06em; }
  .recipe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
  article { min-width: 0; padding: .9rem; border: 1.5px solid var(--ink, #20201e); border-radius: 13px 16px 12px 15px; background: var(--panel, #fffef9); box-shadow: 3px 4px 0 #d9d6ca; }
  .recipe-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
  .recipe-heading strong { font: 800 1rem/1.2 var(--font-display); }
  .recipe-heading span { flex: 0 0 auto; color: var(--ink-soft, #67645c); font: 750 .58rem/1 var(--font-body); text-transform: uppercase; letter-spacing: .05em; }
  article > p { margin: .4rem 0; color: var(--ink-soft, #67645c); font: 500 .76rem/1.45 var(--font-body); }
  @media (max-width: 700px) { .recipe-grid { grid-template-columns: 1fr; } }
</style>
