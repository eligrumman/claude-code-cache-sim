<script lang="ts">
  import CopyButton from "./CopyButton.svelte";
  import EnvDiagnose from "./EnvDiagnose.svelte";
  import { recipes, type RecipeId, type SetupRecipe } from "./recipes.js";

  const microIds: readonly RecipeId[] = ["ttl", "keep-warm", "same-prompt", "large-context", "auto-approve"];
  const micro = recipes.filter((recipe) => microIds.includes(recipe.id));
  const macro = recipes.filter((recipe) => !microIds.includes(recipe.id));
  const groups: readonly { title: string; items: readonly SetupRecipe[] }[] = [
    { title: "Micro · keep the prefix warm", items: micro },
    { title: "Macro · carry less, route smarter", items: macro },
  ];
  let showDiagnose = $state(false);
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

  <div class="diagnose-entry">
    <div>
      <strong>Okay, but how good is <em>my</em> setup?</strong>
      <span>Nine questions. A–F grade. Only the fixes you need.</span>
    </div>
    <button type="button" aria-expanded={showDiagnose} onclick={() => (showDiagnose = !showDiagnose)}>
      {showDiagnose ? "Hide setup check" : "Analyze my setup →"}
    </button>
  </div>
  {#if showDiagnose}
    <EnvDiagnose />
  {/if}
</section>

<style>
  .cheatsheet { width: min(1040px, calc(100% - 32px)); margin: clamp(4rem, 9vw, 7rem) auto 3rem; color: var(--ink, #20201e); }
  header { max-width: 690px; margin-bottom: 2rem; }
  header > span { display: inline-block; padding: .32rem .65rem; border: 1.5px solid currentColor; border-radius: 999px; background: #fff2b8; font: 800 .65rem/1.2 system-ui, sans-serif; letter-spacing: .07em; text-transform: uppercase; transform: rotate(-1deg); }
  h2 { margin: .8rem 0 .4rem; font: 800 clamp(1.8rem, 5vw, 3rem)/1 "Comic Sans MS", "Bradley Hand", cursive; letter-spacing: -.025em; }
  header p { margin: 0; color: var(--ink-soft, #67645c); font: 500 .95rem/1.5 system-ui, sans-serif; }
  .recipe-group { margin-top: 2rem; }
  .recipe-group > h3 { margin: 0 0 .75rem; padding-bottom: .45rem; border-bottom: 2px dashed #bbb7aa; font: 800 .85rem/1.2 system-ui, sans-serif; text-transform: uppercase; letter-spacing: .06em; }
  .recipe-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
  article { min-width: 0; padding: .9rem; border: 1.5px solid var(--ink, #20201e); border-radius: 13px 16px 12px 15px; background: var(--panel, #fffef9); box-shadow: 3px 4px 0 #d9d6ca; }
  .recipe-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
  .recipe-heading strong { font: 800 1rem/1.2 "Comic Sans MS", "Bradley Hand", system-ui, sans-serif; }
  .recipe-heading span { flex: 0 0 auto; color: var(--ink-soft, #67645c); font: 750 .58rem/1 system-ui, sans-serif; text-transform: uppercase; letter-spacing: .05em; }
  article > p { margin: .4rem 0; color: var(--ink-soft, #67645c); font: 500 .76rem/1.45 system-ui, sans-serif; }
  .diagnose-entry { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 2.5rem; padding: 1.1rem 1.25rem; border: 2px solid currentColor; border-radius: 16px; background: #c9ebd1; box-shadow: 5px 6px 0 currentColor; }
  .diagnose-entry div { display: flex; flex-direction: column; gap: .2rem; }
  .diagnose-entry strong { font: 800 1.05rem/1.25 "Comic Sans MS", "Bradley Hand", system-ui, sans-serif; }
  .diagnose-entry span { font: 600 .75rem/1.35 system-ui, sans-serif; }
  .diagnose-entry button { flex: 0 0 auto; border: 1.5px solid currentColor; border-radius: 999px; padding: .65rem .9rem; background: #fffef9; color: inherit; cursor: pointer; font: 800 .74rem/1 system-ui, sans-serif; }
  @media (max-width: 700px) { .recipe-grid { grid-template-columns: 1fr; } .diagnose-entry { align-items: stretch; flex-direction: column; } .diagnose-entry button { align-self: flex-start; } }
</style>
