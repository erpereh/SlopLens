export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type MotionPreference = "system" | "reduce";

export function resolveTheme(
  preference: ThemePreference,
  systemDark = typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches,
): ResolvedTheme {
  if (preference === "system") {
    return systemDark ? "dark" : "light";
  }
  return preference;
}

export function resolveReducedMotion(
  preference: MotionPreference,
  systemReduce = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
): boolean {
  return preference === "reduce" || systemReduce;
}
