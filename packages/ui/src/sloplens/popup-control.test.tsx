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

  it("stays compact and sends configuration to the dashboard", () => {
    const onOpenDashboard = vi.fn();
    render(
      wrap(
        <SlopLensPopupControl
          health="ok"
          onRefreshHealth={() => undefined}
          autoAnalyze
          onAutoAnalyzeChange={() => undefined}
          thresholdPercent={70}
          onOpenDashboard={onOpenDashboard}
        />,
      ),
    );

    expect(screen.getByRole("switch", { name: /auto analyze/i })).toBeInTheDocument();
    expect(screen.getByText(/slop threshold 70%/i)).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /dim high-slop/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/language/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    screen.getByRole("button", { name: /open dashboard/i }).click();
    expect(onOpenDashboard).toHaveBeenCalledOnce();
  });
});
