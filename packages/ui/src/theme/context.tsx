import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type ResolvedTheme, resolveTheme, type ThemePreference } from "./types";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
  cyclePreference: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function SlopLensThemeProvider({
  preference,
  onPreferenceChange,
  children,
}: {
  preference: ThemePreference;
  onPreferenceChange: (next: ThemePreference) => void;
  children: ReactNode;
}) {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolved = useMemo(() => resolveTheme(preference, systemDark), [preference, systemDark]);

  const cyclePreference = useCallback(() => {
    const order: ThemePreference[] = ["light", "dark", "system"];
    const index = order.indexOf(preference);
    const next = order[(index + 1) % order.length] ?? "system";
    onPreferenceChange(next);
  }, [onPreferenceChange, preference]);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference: onPreferenceChange,
      cyclePreference,
    }),
    [cyclePreference, onPreferenceChange, preference, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSlopLensTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useSlopLensTheme must be used within SlopLensThemeProvider");
  }
  return ctx;
}
