import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlopLensI18nProvider } from "@/i18n/context";
import { SlopLensThemeProvider } from "@/theme/context";
import { SlopLensAnchoredPanel } from "./anchored-panel";

describe("SlopLensAnchoredPanel", () => {
  afterEach(() => cleanup());

  it("flips below the chip when there is no room above", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.getAttribute("data-sloplens-panel") === "true") {
        return DOMRect.fromRect({ x: 0, y: 8, width: 280, height: 280 });
      }
      return DOMRect.fromRect({ x: 20, y: 8, width: 80, height: 28 });
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return 280;
      },
    });

    render(
      <SlopLensI18nProvider locale="en">
        <SlopLensThemeProvider preference="light" onPreferenceChange={() => undefined}>
          <SlopLensAnchoredPanel
            open
            onOpenChange={() => undefined}
            trigger={<button type="button">Chip</button>}
          >
            <p>Panel body</p>
          </SlopLensAnchoredPanel>
        </SlopLensThemeProvider>
      </SlopLensI18nProvider>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("data-sloplens-panel-side", "bottom");
  });
});
