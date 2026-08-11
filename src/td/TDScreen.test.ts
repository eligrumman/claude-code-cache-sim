import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import TDScreen from "./TDScreen.svelte";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Dispatch screen", () => {
  it("mounts, starts practice, and routes a good first Plan", async () => {
    render(TDScreen, { onback: vi.fn() });
    expect(screen.getByText("DISPATCH")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("checkbox", { name: /Practice mode/ }));
    await fireEvent.click(screen.getByRole("button", { name: /Clock in/ }));
    expect(screen.getByLabelText("Incoming tasks")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /high/i }));
    await fireEvent.click(screen.getByRole("button", { name: /sonnet.*steady hand/i }));
    expect(screen.getByText(/Perfect fit/)).toBeInTheDocument();
    expect(screen.getByText(/into the jar/)).toBeInTheDocument();
  });

  it("bounces an underpowered Plan back as rework", async () => {
    render(TDScreen, { onback: vi.fn() });
    await fireEvent.click(screen.getByRole("button", { name: /Clock in/ }));
    await fireEvent.click(screen.getByRole("button", { name: /^low$/i }));
    await fireEvent.click(screen.getByRole("button", { name: /haiku.*tiny/i }));
    expect(screen.getByText(/Bad output/)).toBeInTheDocument();
    expect(screen.getAllByText(/REWORK/).length).toBeGreaterThan(0);
  });
});
