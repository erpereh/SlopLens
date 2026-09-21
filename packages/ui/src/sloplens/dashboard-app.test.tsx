import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { SlopLensThemeProvider } from "@/theme/context";
import { SlopLensDashboardApp } from "./dashboard-app";
import { SlopLensShell } from "./sloplens-shell";

function wrap(ui: ReactNode) {
  return (
    <SlopLensI18nProvider locale="en">
      <SlopLensThemeProvider
        preference="light"
        motionPreference="reduce"
        reducedMotion
        onPreferenceChange={() => undefined}
      >
        {ui}
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

const emptyForm = {
  capabilities: [
    {
      capability: "decision" as const,
      selection: { capability: "decision" as const, providerId: "typesafe" },
      hasStoredKey: true,
    },
  ],
};

const emptyOptions = {
  decision: [{ id: "typesafe", label: "TypeSafe" }],
  embedding: [],
  search: [],
  vision: [],
  reasoning: [],
};

const unavailableMetrics = {
  status: "unavailable" as const,
  checks: { database: false, pgvector: false },
  counts: {
    contentItems: null,
    cachedAnalyses: null,
    clusters: null,
    relations: null,
  },
  lastActivityAt: null,
};

describe("SlopLensShell chip panel", () => {
  afterEach(() => cleanup());

  it("opens an anchored panel from the chip and closes with Escape without locking scroll", async () => {
    render(
      wrap(
        <SlopLensShell
          signals={{ slopSignal: { value: 0.82, label: "slop", source: "aiSlop" } }}
          analyzeState={{ phase: "success" }}
          verifyState={{ phase: "idle" }}
          traceState={{ phase: "idle" }}
        />,
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: /slop signal · 82%/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /analyze/i })).toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(document.documentElement.style.overflow).not.toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("tab", { name: /analyze/i })).not.toBeInTheDocument();
    });
  });

  it("toggles closed on a second chip click", async () => {
    render(
      wrap(
        <SlopLensShell
          signals={{ slopSignal: { value: 0.7, label: "slop", source: "aiSlop" } }}
          analyzeState={{ phase: "success" }}
          verifyState={{ phase: "idle" }}
          traceState={{ phase: "idle" }}
        />,
      ),
    );
    const chip = screen.getByRole("button", { name: /slop signal · 70%/i });
    fireEvent.click(chip);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(chip);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("SlopLensDashboardApp", () => {
  afterEach(() => cleanup());

  it("keeps Overview alive when metrics counts are null", () => {
    render(
      wrap(
        <SlopLensDashboardApp
          section="overview"
          onSectionChange={() => undefined}
          version="0.1.0"
          health="unavailable"
          metrics={unavailableMetrics}
          feed={{
            autoAnalyze: true,
            dimHighSlop: true,
            showSlopStamp: true,
            slopThreshold: 0.7,
          }}
          onFeedChange={() => undefined}
          locale="en"
          onLocaleChange={() => undefined}
          motionPreference="system"
          onMotionPreferenceChange={() => undefined}
          formValues={emptyForm}
          providerOptions={emptyOptions}
          onSubmitCapability={() => undefined}
          settingsLoading={false}
          settingsError={null}
          onTestHealth={() => undefined}
        />,
      ),
    );
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
  });

  it("navigates to Feed without exposing a full providers form in Overview", () => {
    const onSectionChange = vi.fn();
    render(
      wrap(
        <SlopLensDashboardApp
          section="overview"
          onSectionChange={onSectionChange}
          version="0.1.0"
          health="ok"
          metrics={{
            status: "ok",
            checks: { database: true, pgvector: true },
            counts: {
              contentItems: 3,
              cachedAnalyses: 2,
              clusters: 0,
              relations: 1,
            },
            lastActivityAt: "2026-09-21T12:00:00.000Z",
          }}
          feed={{
            autoAnalyze: true,
            dimHighSlop: true,
            showSlopStamp: true,
            slopThreshold: 0.7,
          }}
          onFeedChange={() => undefined}
          locale="en"
          onLocaleChange={() => undefined}
          motionPreference="reduce"
          onMotionPreferenceChange={() => undefined}
          formValues={emptyForm}
          providerOptions={emptyOptions}
          onSubmitCapability={() => undefined}
          settingsLoading={false}
          settingsError={null}
          onTestHealth={() => undefined}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /^feed$/i }));
    expect(onSectionChange).toHaveBeenCalledWith("feed");
  });
});
