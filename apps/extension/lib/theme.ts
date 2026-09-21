export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "sloplens.theme";

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false,
): ResolvedTheme {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }
  return preference;
}

export function parseThemePreference(value: unknown): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export async function readThemePreference(): Promise<ThemePreference> {
  const stored = await chrome.storage.local.get(THEME_STORAGE_KEY);
  return parseThemePreference(stored[THEME_STORAGE_KEY]);
}

export async function writeThemePreference(preference: ThemePreference): Promise<void> {
  await chrome.storage.local.set({ [THEME_STORAGE_KEY]: preference });
}

export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}
