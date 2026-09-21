import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { SlopLensThemeProvider } from "@/theme/context";
import { SlopLensDetailPanel } from "./detail-panel";

const idle = { phase: "idle" as const };
const success = { phase: "success" as const };

function wrap(ui: ReactNode) {
  return (
    <SlopLensI18nProvider locale="en">
      <SlopLensThemeProvider preference="light" onPreferenceChange={() => undefined}>
        {ui}
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

describe("SlopLensDetailPanel", () => {
  afterEach(() => cleanup());

  it("renders verify stance as an uncertainty signal, not a verdict", () => {
    render(
      wrap(
        <SlopLensDetailPanel
          open
          onOpenChange={() => undefined}
          asDrawer={false}
          activeTab="verify"
          analyzeState={success}
          verifyState={success}
          traceState={idle}
          sourcesState={idle}
          relatedState={idle}
          verify={{
            summary: "The claim is backed by the cited note.",
            stance: "supported",
          }}
        />,
      ),
    );
    expect(screen.getByText("Backed by sources")).toBeInTheDocument();
    expect(screen.queryByText(/100%|fake|false/i)).not.toBeInTheDocument();
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("false");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
