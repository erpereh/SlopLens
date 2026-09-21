import { describe, expect, it } from "vitest";

import { applyResolvedTheme } from "./apply";

describe("applyResolvedTheme", () => {
  it("sets dark class, color-scheme, and reduce-motion on the cascade root", () => {
    const root = document.createElement("div");
    applyResolvedTheme(root, "dark", true);
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.style.colorScheme).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.reduceMotion).toBe("true");

    applyResolvedTheme(root, "light", false);
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.style.colorScheme).toBe("light");
    expect(root.dataset.reduceMotion).toBeUndefined();
  });
});
