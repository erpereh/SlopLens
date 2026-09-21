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
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
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

  it("does not claim a missing primary source before Verify has run", () => {
    render(
      wrap(
        <SlopLensCompactSurface
          signals={{ decision: undefined }}
          analyzeState={{ phase: "idle" }}
          onOpenDetail={() => undefined}
        />,
      ),
    );
    expect(screen.queryByText("Primary source")).not.toBeInTheDocument();
    expect(screen.queryByText("None found")).not.toBeInTheDocument();
  });
});
