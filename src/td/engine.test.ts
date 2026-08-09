import { describe, expect, it } from "vitest";
import { balloonCost, isGameOver, makeBalloonEconomy, shrinkToRead } from "./engine.js";

describe("Tokenloons economy", () => {
  it("uses canonical sonnet rates and credits the exact savings", () => {
    const balloon = makeBalloonEconomy(20_000, "sonnet");
    expect(balloonCost(20_000, "sonnet", "write")).toBeCloseTo(0.12);
    expect(shrinkToRead(balloon)).toBeCloseTo(0.114);
    expect(balloon.currentCost).toBeCloseTo(0.006);
  });

  it("ends the day only when budget plus overdraft is exhausted", () => {
    expect(isGameOver(1.49, 1, 0.5)).toBe(false);
    expect(isGameOver(1.5, 1, 0.5)).toBe(true);
  });
});
