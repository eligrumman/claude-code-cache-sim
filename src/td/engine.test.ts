import { describe, expect, it } from "vitest";
import { MACRO_ROUTES, priceTaskChoice } from "../article/macroPricing.js";
import { dispatchTask, gradeFor, newDispatchState, type DispatchTask } from "./dispatchEngine.js";

const task = (routeIndex: number, rework = false): DispatchTask => ({ id: "t-1", routeIndex, urgent: false, rework });

describe("Dispatch economy", () => {
  it("banks real savings and grows a combo for an exact fit", () => {
    const route = MACRO_ROUTES[6];
    const result = dispatchTask(newDispatchState(), task(6), route.model, route.effort);
    expect(result.verdict).toBe("good");
    expect(result.reward).toBeGreaterThan(0);
    expect(result.state.combo).toBe(1);
    expect(result.state.baseline).toBeCloseTo(priceTaskChoice(route, "opus", "high"));
  });

  it("charges fit-route rework and returns an underpowered judgment task", () => {
    const result = dispatchTask(newDispatchState(), task(0), "haiku", "low");
    expect(result.verdict).toBe("bad");
    expect(result.rework?.rework).toBe(true);
    expect(result.state.reworks).toBe(1);
    expect(result.state.spent).toBeGreaterThan(result.cost);
  });

  it("marks overkill without awarding fake savings", () => {
    const result = dispatchTask(newDispatchState(), task(6), "fable", "high");
    expect(result.verdict).toBe("expensive");
    expect(result.reward).toBe(0);
    expect(result.state.combo).toBe(0);
  });

  it("models cold cache cost and exposes reachable grades", () => {
    const warm = dispatchTask(newDispatchState(), task(6), "haiku", "low", 1);
    const cold = dispatchTask(newDispatchState(), task(6), "haiku", "low", 1.7);
    expect(cold.cost).toBeGreaterThan(warm.cost);
    expect(gradeFor(warm.state)).toBe("S");
    expect(gradeFor(newDispatchState())).toBe("C");
  });
});
