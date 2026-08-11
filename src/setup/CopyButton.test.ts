import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import CopyButton from "./CopyButton.svelte";
import { recipeById } from "./recipes.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("CopyButton", () => {
  it("renders the verified snippet and caveat, then copies it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(CopyButton, { recipe: recipeById.ttl });

    expect(screen.getByText(/ENABLE_PROMPT_CACHING_1H=1/)).toBeInTheDocument();
    expect(screen.getByText(recipeById.ttl.caveat)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /Copy Cache TTL setup snippet/ }));
    expect(writeText).toHaveBeenCalledWith(recipeById.ttl.snippet);
    expect(screen.getByRole("button", { name: /Copy Cache TTL setup snippet/ })).toHaveTextContent("Copied ✓");
  });
});
