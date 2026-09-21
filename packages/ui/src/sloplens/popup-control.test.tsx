import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { SlopLensThemeProvider } from "@/theme/context";
import { SlopLensPopupControl } from "./popup-control";

function wrap(ui: ReactNode) {
  return (
    <SlopLensI18nProvider locale="en">
      <SlopLensThemeProvider preference="light" onPreferenceChange={() => undefined}>
        {ui}
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

describe("SlopLensPopupControl", () => {
  afterEach(() => cleanup());

  it("keeps the popup compact and sends advanced provider editing elsewhere", () => {
    const onManageProviders = vi.fn();
    render(
      wrap(
        <SlopLensPopupControl
          health="ok"
          onRefreshHealth={() => undefined}
          feed={{
            autoAnalyze: true,
            dimHighSlop: true,
            showSlopStamp: true,
            slopThreshold: 0.7,
          }}
          onFeedChange={() => undefined}
          locale="en"
          onLocaleChange={() => undefined}
          providers={[
            { capability: "decision", configured: true },
            { capability: "search", configured: false },
          ]}
          onManageProviders={onManageProviders}
        />,
      ),
    );

    expect(screen.getByRole("switch", { name: /auto analyze/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /dim high-slop/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /show slop stamp/i })).toBeInTheDocument();
    expect(screen.getByText(/slop threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/language/i)).toBeInTheDocument();
    expect(screen.getByText(/decision/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/enter a new key/i)).not.toBeInTheDocument();
    screen.getByRole("button", { name: /manage providers/i }).click();
    expect(onManageProviders).toHaveBeenCalledOnce();
  });
});
