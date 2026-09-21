import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScorePercentSignal } from "./score-signal";

describe("ScorePercentSignal", () => {
  it("shows em dash when score is missing", () => {
    render(<ScorePercentSignal label="AI / slop signal" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
