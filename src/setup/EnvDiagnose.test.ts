import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/svelte";
import EnvDiagnose from "./EnvDiagnose.svelte";
import { diagnoseQuestions } from "./recipes.js";

afterEach(cleanup);

async function answerByPoints(kind: "best" | "worst") {
  const fieldsets = screen.getAllByRole("group");
  for (let index = 0; index < diagnoseQuestions.length; index += 1) {
    const question = diagnoseQuestions[index];
    const target = question.answers.reduce((choice, answer) => {
      if (kind === "best") return answer.points > choice.points ? answer : choice;
      return answer.points < choice.points ? answer : choice;
    });
    await fireEvent.click(within(fieldsets[index]).getByRole("radio", { name: target.label }));
  }
}

describe("EnvDiagnose", () => {
  it("grades an all-best setup A", async () => {
    render(EnvDiagnose);
    await answerByPoints("best");
    expect(screen.getByTestId("diagnose-result")).toHaveTextContent("A");
    expect(screen.getByTestId("diagnose-result")).toHaveTextContent("100/100 · cache-efficient");
  });

  it("grades an all-worst setup F and offers targeted fixes", async () => {
    render(EnvDiagnose);
    await answerByPoints("worst");
    expect(screen.getByTestId("diagnose-result")).toHaveTextContent("F");
    expect(screen.getByRole("heading", { name: "Your targeted fixes" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Copy .* setup snippet/ }).length).toBeGreaterThan(0);
  });
});
