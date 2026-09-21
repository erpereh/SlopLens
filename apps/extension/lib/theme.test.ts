import { describe, expect, it } from "vitest";

import {
  parseMotionPreference,
  parseThemePreference,
  resolveReducedMotion,
  resolveTheme,
} from "./theme";

describe("theme helpers", () => {
  it("resolves system theme from prefersDark flag", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("parses stored theme preference", () => {
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("invalid")).toBe("system");
  });

  it("forces reduced motion even when the OS does not prefer it", () => {
    expect(parseMotionPreference("reduce")).toBe("reduce");
    expect(resolveReducedMotion("reduce", false)).toBe(true);
    expect(resolveReducedMotion("system", false)).toBe(false);
    expect(resolveReducedMotion("system", true)).toBe(true);
  });
});
