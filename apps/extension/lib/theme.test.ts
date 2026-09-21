import { describe, expect, it } from "vitest";

import { parseThemePreference, resolveTheme } from "./theme";

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
});
