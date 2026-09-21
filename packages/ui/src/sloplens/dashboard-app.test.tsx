import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
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
    byPlatform: { x: null, youtube: null },
    claims: null,
    averageSlop: null,
  },
  lastActivityAt: null,
};

const readyHistory = {
  phase: "ready" as const,
  nextCursor: null,
  items: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      platform: "x" as const,
      url: "https://x.com/jane/status/123",
      author: "Jane Doe",
      handle: "@jane",
      title: null,
      text: "Stored post from the local history.",
      publishedAt: "2026-09-21T11:00:00.000Z",
      capturedAt: "2026-09-21T12:00:00.000Z",
      slop: 0.82,
      clickbait: 0.2,
      engagementBait: 0.66,
      containsClaim: true,
      needsVerification: true,
      claimText: "The launch happened on Monday.",
      thumbnailUrl: null,
    },
  ],
};

function dashboardProps(
  overrides: Partial<ComponentProps<typeof SlopLensDashboardApp>> = {},
): ComponentProps<typeof SlopLensDashboardApp> {
  return {
    section: "overview",
    onSectionChange: () => undefined,
    version: "0.1.0",
    health: "ok",
    metrics: unavailableMetrics,
    history: { items: [], nextCursor: null, phase: "ready" },
    onHistoryQueryChange: () => undefined,
    onHistoryLoadMore: () => undefined,
    locale: "en",
    onLocaleChange: () => undefined,
    motionPreference: "reduce",
    onMotionPreferenceChange: () => undefined,
    formValues: emptyForm,
    providerOptions: emptyOptions,
    onSubmitCapability: () => undefined,
    settingsLoading: false,
    settingsError: null,
    onTestHealth: () => undefined,
    ...overrides,
  };
}

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
    expect(chip).toHaveAttribute("data-state", "closed");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("data-state", "open");
    expect(chip).toHaveAttribute("aria-expanded", "true");
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
    render(wrap(<SlopLensDashboardApp {...dashboardProps({ health: "unavailable" })} />));
    expect(screen.getAllByText(/unavailable/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^feed$/i })).not.toBeInTheDocument();
  });

  it("shows stored history and navigates to X, YouTube and Settings", () => {
    const onSectionChange = vi.fn();
    render(
      wrap(
        <SlopLensDashboardApp
          {...dashboardProps({
            onSectionChange,
            history: readyHistory,
            metrics: {
              status: "ok",
              checks: { database: true, pgvector: true },
              counts: {
                contentItems: 3,
                cachedAnalyses: 2,
                clusters: 1,
                relations: 1,
                byPlatform: { x: 2, youtube: 1 },
                claims: 1,
                averageSlop: 0.4,
              },
              lastActivityAt: "2026-09-21T12:00:00.000Z",
            },
          })}
        />,
      ),
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("@jane")).toBeInTheDocument();
    expect(screen.getByText("The launch happened on Monday.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^x$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^youtube$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
    expect(onSectionChange).toHaveBeenCalledWith("x");
    expect(onSectionChange).toHaveBeenCalledWith("youtube");
    expect(onSectionChange).toHaveBeenCalledWith("settings");
  });

  it("keeps the API key empty until a provider row is opened", () => {
    render(wrap(<SlopLensDashboardApp {...dashboardProps({ section: "settings" })} />));
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /decision/i }));
    const key = screen.getByLabelText(/api key/i);
    expect(key).toHaveValue("");
    expect(screen.getByText(/a key is stored/i)).toBeInTheDocument();
  });
});
