import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SlopLensUiRoot } from "./sloplens-ui-root";

describe("SlopLensUiRoot", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.reduceMotion;
    delete document.documentElement.dataset.theme;
  });

  it("applies dark and reduced motion on the document cascade root", () => {
    render(
      <SlopLensUiRoot
        locale="en"
        themePreference="dark"
        motionPreference="reduce"
        onThemePreferenceChange={() => undefined}
      >
        <span>surface</span>
      </SlopLensUiRoot>,
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.reduceMotion).toBe("true");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
