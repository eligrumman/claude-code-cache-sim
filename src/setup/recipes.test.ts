import { describe, expect, it } from "vitest";
import {
  diagnoseQuestions,
  diagnoseScore,
  gradeForScore,
  recipeById,
  recipes,
  type RecipeId,
} from "./recipes.js";

describe("setup recipes", () => {
  it("contains every article and game lever with a snippet and caveat", () => {
    const expected: RecipeId[] = [
      "ttl", "keep-warm", "same-prompt", "large-context", "auto-approve",
      "route", "delegate", "compact", "lazy",
    ];
    expect(recipes.map((recipe) => recipe.id)).toEqual(expected);
    for (const id of expected) {
      expect(recipeById[id].snippet.trim().length).toBeGreaterThan(0);
      expect(recipeById[id].caveat.trim().length).toBeGreaterThan(0);
    }
  });

  it("scores best and weakest answer sets at the expected grade extremes", () => {
    const best = Object.fromEntries(diagnoseQuestions.map((question) => [
      question.id,
      question.answers.reduce((winner, answer) => answer.points > winner.points ? answer : winner).id,
    ]));
    const weakest = Object.fromEntries(diagnoseQuestions.map((question) => [
      question.id,
      question.answers.reduce((loser, answer) => answer.points < loser.points ? answer : loser).id,
    ]));
    expect(diagnoseScore(best)).toBe(100);
    expect(gradeForScore(diagnoseScore(best))).toBe("A");
    expect(gradeForScore(diagnoseScore(weakest))).toBe("F");
  });
});
