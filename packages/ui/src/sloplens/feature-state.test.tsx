import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { FeatureErrorPanel, FeatureStatePanel } from "./feature-state";

function wrap(ui: ReactNode, locale: "en" | "es" = "en") {
  return <SlopLensI18nProvider locale={locale}>{ui}</SlopLensI18nProvider>;
}

describe("FeatureStatePanel", () => {
  afterEach(() => cleanup());

  it("renders loading state with agent progress label", () => {
    render(
      wrap(
        <FeatureStatePanel
          state={{ phase: "loading" }}
          emptyMessage="Empty"
          loadingLabel="Analyzing content…"
        />,
      ),
    );
    expect(screen.getByText("Analyzing content…")).toBeInTheDocument();
  });

  it("maps provider_not_configured to settings action", () => {
    render(
      wrap(
        <FeatureErrorPanel
          code="provider_not_configured"
          retryable={false}
          onOpenSettings={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/not configured/i);
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders Spanish error copy", () => {
    render(
      wrap(
        <FeatureErrorPanel code="backend_unavailable" retryable onRetry={() => undefined} />,
        "es",
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/backend local no responde/i);
  });
});
