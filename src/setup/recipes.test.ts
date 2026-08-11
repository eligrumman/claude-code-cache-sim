import { describe, expect, it } from "vitest";
import { recipeById, recipes, type RecipeId } from "./recipes.js";

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
});
