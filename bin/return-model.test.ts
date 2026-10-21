// @vitest-environment node
import { describe, expect, it } from "vitest";
import { activeElsewhere, activityIndex, explain, needsInput, parseSignals, predict, stopSignals, train } from "./return-model.mjs";

const T0 = Date.parse("2026-10-17T12:00:00Z");
const ev = (o: Record<string, unknown>, at: number) => JSON.stringify({ sessionId: "s1", cwd: "/p", timestamp: new Date(at).toISOString(), ...o });

describe("parseSignals", () => {
  it("keeps your prompts and Claude's text, skipping tool results and meta lines", () => {
    const s = parseSignals([
      ev({ type: "user", message: { content: "fix the login bug" } }, T0),
      ev({ type: "user", message: { content: [{ type: "tool_result", content: "ok" }] } }, T0 + 1),
      ev({ type: "user", isMeta: true, message: { content: [{ type: "text", text: "<system>" }] } }, T0 + 2),
      ev({ type: "assistant", message: { content: [{ type: "text", text: "Fixed. Want me to add a test?" }] } }, T0 + 3),
    ]);
    expect(s.prompts.map((p) => p.text)).toEqual(["fix the login bug"]);
    expect(s.replies).toHaveLength(1);
    expect(s.cwd).toBe("/p");
  });
});

describe("stopSignals", () => {
  it("reads how the session stopped, in English and Hebrew", () => {
    const asked = stopSignals({ prompts: [{ at: T0, text: "תתקן" }], replies: [{ at: T0 + 1, text: "תיקנתי. רוצה שאוסיף בדיקה?" }] }, T0 + 1, 100_000);
    const done = stopSignals({ prompts: [{ at: T0, text: "thanks!" }], replies: [{ at: T0 + 1, text: "Done, pushed to main." }] }, T0 + 1, 100_000);
    expect(asked).toMatchObject({ asked: true, done: false, thanks: false });
    expect(done).toMatchObject({ asked: false, done: true, thanks: true });
  });
});

describe("activeElsewhere", () => {
  it("sees typing in another session of the same project", () => {
    const index = activityIndex([{ sessionId: "a", cwd: "/p", prompts: [] }, { sessionId: "b", cwd: "/p", prompts: [{ at: T0 + 10 }] }, { sessionId: "c", cwd: "/q", prompts: [{ at: T0 + 20 }] }]);
    expect(activeElsewhere(index, "a", "/p", T0, T0 + 15, true)).toBe(true);
    expect(activeElsewhere(index, "b", "/p", T0, T0 + 15, true)).toBe(false);
    expect(activeElsewhere(index, "b", "/p", T0, T0 + 30, false)).toBe(true);
  });
});

describe("train", () => {
  it("learns a signal that separates the outcomes", () => {
    const rows = Array.from({ length: 200 }, (_, i) => {
      const asked = i % 2;
      const x = [0, asked, 1 - asked, 0, 0, 0, 1, 1, 0, 0, 1, 0];
      return { x, y: asked && i % 10 !== 1 ? 1 : 0 };
    });
    const model = train(rows);
    expect(predict(model, [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0])).toBeGreaterThan(0.7);
    expect(predict(model, [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0])).toBeLessThan(0.3);
    expect(explain(model).find((s) => s.key === "asked")!.odds).toBeGreaterThan(1);
  });
});

describe("needs input", () => {
  it("spots Claude stuck on a permission prompt: a tool call with no result when you left", () => {
    const s = parseSignals([
      ev({ type: "user", message: { content: "deploy it" } }, T0),
      ev({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Bash" }] } }, T0 + 1000),
      ev({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] } }, T0 + 90 * 60_000),
    ]);
    const sig = stopSignals(s, T0 + 1000, 100_000);
    expect(sig.waiting).toBe(true);
    expect(needsInput(sig)).toBe(true);
  });

  it("does not flag a finished turn whose tools all returned", () => {
    const s = parseSignals([
      ev({ type: "assistant", message: { content: [{ type: "tool_use", id: "t1", name: "Read" }] } }, T0),
      ev({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }] } }, T0 + 500),
      ev({ type: "assistant", message: { content: [{ type: "text", text: "Done, pushed." }] } }, T0 + 2000),
    ]);
    expect(needsInput(stopSignals(s, T0 + 2000, 100_000))).toBe(false);
  });
});
