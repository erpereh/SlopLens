export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type MotionPreference = "system" | "reduce";

export const THEME_STORAGE_KEY = "sloplens.theme";
export const MOTION_STORAGE_KEY = "sloplens.reducedMotion";

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

export function parseMotionPreference(value: unknown): MotionPreference {
  if (value === "reduce" || value === "system") {
    return value;
  }
  return "system";
}

export function resolveReducedMotion(
  preference: MotionPreference,
  systemReduce: boolean = prefersReducedMotion(),
): boolean {
  return preference === "reduce" || systemReduce;
}

export async function readMotionPreference(): Promise<MotionPreference> {
  const stored = await chrome.storage.local.get(MOTION_STORAGE_KEY);
  return parseMotionPreference(stored[MOTION_STORAGE_KEY]);
}

export async function writeMotionPreference(preference: MotionPreference): Promise<void> {
  await chrome.storage.local.set({ [MOTION_STORAGE_KEY]: preference });
}
