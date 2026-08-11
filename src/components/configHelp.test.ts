import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ConfigHelp from "./ConfigHelp.svelte";
import { CONFIG_HELP, impactPct, type ConfigHelpId } from "./configHelp.js";

afterEach(cleanup);

describe("ConfigHelp modal", () => {
  it("opens with its specific content and closes with Escape", async () => {
    render(ConfigHelp, { configId: "ttl" });
    await fireEvent.click(screen.getByRole("button", { name: "Help: Cache TTL" }));

    const dialog = screen.getByRole("dialog", { name: "Cache TTL" });
    expect(dialog).toHaveTextContent("What it does");
    expect(dialog).toHaveTextContent("How it affects your cache");
    expect(dialog).toHaveTextContent(/Typical impact: ~\d+% cheaper conversations/);
    expect(screen.getAllByRole("button", { name: "Close help" })[1]).toHaveFocus();

    await fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Cache TTL" })).toHaveFocus();
  });
});

describe("config help impacts", () => {
  it("has complete prose for every config", () => {
    for (const content of Object.values(CONFIG_HELP)) {
      expect(content.title).toBeTruthy();
      expect(content.what).toBeTruthy();
      expect(content.how).toBeTruthy();
    }
  });

  it("computes finite, positive, reproducible percentages", () => {
    const ids = Object.keys(CONFIG_HELP) as ConfigHelpId[];
    const first = ids.map((id) => impactPct(id));
    const second = ids.map((id) => impactPct(id));
    expect(second).toEqual(first);
    for (const [index, value] of first.entries()) {
      expect(value, ids[index]).toBeDefined();
      if (value === undefined) continue;
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
