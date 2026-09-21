import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { SlopLensThemeProvider } from "@/theme/context";
import { SlopLensCompactSurface } from "./compact-surface";

function wrap(ui: ReactNode) {
  return (
    <SlopLensI18nProvider locale="en">
      <SlopLensThemeProvider preference="light" onPreferenceChange={() => undefined}>
        {ui}
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

describe("SlopLensCompactSurface", () => {
  afterEach(() => cleanup());

  it("shows analyzing state instead of a fake empty result", () => {
    render(
      wrap(
        <SlopLensCompactSurface
          signals={{}}
          analyzeState={{ phase: "loading" }}
          onOpenDetail={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeInTheDocument();
    expect(screen.queryByText("No data yet")).not.toBeInTheDocument();
  });

  it("surfaces backend errors with a retry action", () => {
    render(
      wrap(
        <SlopLensCompactSurface
          signals={{}}
          analyzeState={{
            phase: "error",
            error: { code: "backend_unavailable", retryable: true },
          }}
          onOpenDetail={() => undefined}
          onRetryAnalyze={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/local backend is unreachable/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("offers Analyze when idle instead of claiming missing sources", () => {
    render(
      wrap(
        <SlopLensCompactSurface
          signals={{}}
          analyzeState={{ phase: "idle" }}
          onOpenDetail={() => undefined}
          onAnalyze={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("button", { name: /^analyze$/i })).toBeInTheDocument();
    expect(screen.queryByText("Primary source")).not.toBeInTheDocument();
  });

  it("renders a compact slop signal, not Analyze/Verify/Trace shortcuts", () => {
    render(
      wrap(
        <SlopLensCompactSurface
          signals={{ slopSignal: { value: 0.82, label: "slop", source: "aiSlop" } }}
          analyzeState={{ phase: "success" }}
          onOpenDetail={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("button", { name: /slop signal · 82%/i })).toHaveAttribute(
      "data-state",
      "closed",
    );
    expect(screen.getByRole("button", { name: /slop signal · 82%/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("button", { name: /^verify$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^trace$/i })).not.toBeInTheDocument();
  });
});
