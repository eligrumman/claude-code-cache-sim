<script lang="ts">
  import CopyButton from "./CopyButton.svelte";
  import {
    diagnoseQuestions,
    diagnoseScore,
    gradeCopy,
    gradeForScore,
    recipeById,
    type DiagnoseAnswer,
  } from "./recipes.js";

  let answers = $state<Record<string, string>>({});
  const complete = $derived(diagnoseQuestions.every((question) => Boolean(answers[question.id])));
  const score = $derived(diagnoseScore(answers));
  const grade = $derived(gradeForScore(score));
  const weakAnswers = $derived.by(() => diagnoseQuestions.flatMap((question) => {
    const answer = question.answers.find((candidate) => candidate.id === answers[question.id]);
    return answer?.recommendation && answer.recipeId ? [answer] : [];
  }));

  function selectAnswer(questionId: string, answerId: string) {
    answers[questionId] = answerId;
  }

  function reset() {
    answers = {};
  }

  function answerKey(questionId: string, answer: DiagnoseAnswer) {
    return `${questionId}-${answer.id}`;
  }
</script>

<section class="diagnose" aria-labelledby="diagnose-title">
  <div class="intro">
    <div>
      <span class="kicker">9 quick checks · about 2 minutes</span>
      <h3 id="diagnose-title">How cache-efficient is your setup?</h3>
      <p>Pick the closest answer. You’ll get a grade and copy-ready fixes for the weak spots.</p>
    </div>
    {#if Object.keys(answers).length > 0}
      <button class="reset" type="button" onclick={reset}>Reset</button>
    {/if}
  </div>

  <ol>
    {#each diagnoseQuestions as question, index (question.id)}
      <li>
        <fieldset>
          <legend><span>{index + 1}</span>{question.prompt}</legend>
          <div class="answers">
            {#each question.answers as answer (answer.id)}
              <label class:chosen={answers[question.id] === answer.id}>
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={answers[question.id] === answer.id}
                  onchange={() => selectAnswer(question.id, answer.id)}
                />
                {answer.label}
              </label>
            {/each}
          </div>
        </fieldset>
      </li>
    {/each}
  </ol>

  {#if complete}
    <div class="result" aria-live="polite" data-testid="diagnose-result">
      <div class="grade" class:grade-a={grade === "A"}>
        <strong>{grade}</strong>
        <span>{score}/100 · {gradeCopy[grade]}</span>
      </div>
      {#if weakAnswers.length > 0}
        <h4>Your targeted fixes</h4>
        <div class="fixes">
          {#each weakAnswers as answer (answerKey(answer.recipeId ?? "fix", answer))}
            {#if answer.recipeId}
              <article>
                <p>{answer.recommendation}</p>
                <CopyButton recipe={recipeById[answer.recipeId]} compact />
              </article>
            {/if}
          {/each}
        </div>
      {:else}
        <p class="clean">Everything here is already tuned. Keep your stable setup stable.</p>
      {/if}
    </div>
  {:else}
    <p class="progress">Answered {Object.keys(answers).length} of {diagnoseQuestions.length}</p>
  {/if}
</section>

<style>
  .diagnose { max-width: 900px; margin: 1rem auto 0; padding: clamp(1rem, 3vw, 1.6rem); border: 2px solid var(--ink, #20201e); border-radius: 19px 22px 17px 23px; background: var(--panel, #fffef9); box-shadow: 6px 7px 0 #c9ebd1; color: var(--ink, #20201e); }
  .intro { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .kicker { color: var(--good, #2f8f5b); font: 800 .68rem/1.2 system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  h3 { margin: .35rem 0 .2rem; font: 800 clamp(1.3rem, 4vw, 1.8rem)/1.15 "Comic Sans MS", "Bradley Hand", system-ui, sans-serif; }
  .intro p { margin: 0; color: var(--ink-soft, #67645c); font: 500 .86rem/1.5 system-ui, sans-serif; }
  .reset { border: 0; background: transparent; color: var(--ink-soft, #67645c); text-decoration: underline; cursor: pointer; }
  ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 1.15rem 0 0; padding: 0; list-style: none; }
  fieldset { height: 100%; min-width: 0; margin: 0; padding: .75rem; border: 1px solid var(--line, #d9d6ca); border-radius: 11px; }
  legend { padding: 0 .3rem; font: 750 .82rem/1.35 system-ui, sans-serif; }
  legend span { display: inline-grid; place-items: center; width: 1.3rem; height: 1.3rem; margin-right: .4rem; border-radius: 50%; background: #fff2b8; font-size: .68rem; }
  .answers { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .35rem; }
  label { display: inline-flex; align-items: center; gap: .3rem; padding: .32rem .48rem; border: 1px solid transparent; border-radius: 999px; background: var(--panel-2, #f6f5ef); cursor: pointer; color: var(--ink-soft, #67645c); font: 600 .7rem/1.2 system-ui, sans-serif; }
  label.chosen { border-color: var(--ink, #20201e); background: #fff2b8; color: var(--ink, #20201e); }
  input { margin: 0; accent-color: var(--good, #2f8f5b); }
  .progress { margin: 1rem 0 0; color: var(--ink-soft, #67645c); text-align: right; font: 650 .72rem/1 system-ui, sans-serif; }
  .result { margin-top: 1.25rem; padding-top: 1.1rem; border-top: 2px dashed var(--line, #d9d6ca); }
  .grade { display: flex; align-items: center; gap: .8rem; }
  .grade strong { display: grid; place-items: center; width: 4rem; height: 4rem; border: 2px solid currentColor; border-radius: 50%; color: var(--warn, #c98a1e); font: 900 2.2rem/1 system-ui, sans-serif; transform: rotate(-5deg); }
  .grade.grade-a strong { color: var(--good, #2f8f5b); }
  .grade span { font: 800 1rem/1.3 system-ui, sans-serif; }
  h4 { margin: 1.2rem 0 .5rem; font: 800 .85rem/1.2 system-ui, sans-serif; }
  .fixes { display: grid; gap: .7rem; }
  .fixes article { min-width: 0; padding: .65rem .75rem; border-left: 4px solid #ffd75e; background: var(--panel-2, #f6f5ef); }
  .fixes p, .clean { margin: 0; font: 650 .78rem/1.4 system-ui, sans-serif; }
  @media (max-width: 680px) { ol { grid-template-columns: 1fr; } .diagnose { box-shadow: 4px 5px 0 #c9ebd1; } }
</style>
