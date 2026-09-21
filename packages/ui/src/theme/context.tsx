import { MotionConfig } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type MotionPreference,
  type ResolvedTheme,
  resolveReducedMotion,
  resolveTheme,
  type ThemePreference,
} from "./types";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
  cyclePreference: () => void;
  motionPreference: MotionPreference;
  reducedMotion: boolean;
  setMotionPreference: (next: MotionPreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function SlopLensThemeProvider({
  preference,
  onPreferenceChange,
  motionPreference = "system",
  onMotionPreferenceChange,
  reducedMotion: reducedMotionOverride,
  children,
}: {
  preference: ThemePreference;
  onPreferenceChange: (next: ThemePreference) => void;
  motionPreference?: MotionPreference;
  onMotionPreferenceChange?: (next: MotionPreference) => void;
  reducedMotion?: boolean;
  children: ReactNode;
}) {
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );
  const [systemReduce, setSystemReduce] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const color = window.matchMedia("(prefers-color-scheme: dark)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onColor = () => setSystemDark(color.matches);
    const onMotion = () => setSystemReduce(motion.matches);
    color.addEventListener("change", onColor);
    motion.addEventListener("change", onMotion);
    return () => {
      color.removeEventListener("change", onColor);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  const resolved = useMemo(() => resolveTheme(preference, systemDark), [preference, systemDark]);
  const reducedMotion =
    reducedMotionOverride ?? resolveReducedMotion(motionPreference, systemReduce);

  const cyclePreference = useCallback(() => {
    const order: ThemePreference[] = ["light", "dark", "system"];
    const index = order.indexOf(preference);
    const next = order[(index + 1) % order.length] ?? "system";
    onPreferenceChange(next);
  }, [onPreferenceChange, preference]);

  const setMotionPreference = useCallback(
    (next: MotionPreference) => {
      onMotionPreferenceChange?.(next);
    },
    [onMotionPreferenceChange],
  );

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference: onPreferenceChange,
      cyclePreference,
      motionPreference,
      reducedMotion,
      setMotionPreference,
    }),
    [
      cyclePreference,
      motionPreference,
      onPreferenceChange,
      preference,
      reducedMotion,
      resolved,
      setMotionPreference,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>{children}</MotionConfig>
    </ThemeContext.Provider>
  );
}

export function useSlopLensTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useSlopLensTheme must be used within SlopLensThemeProvider");
  }
  return ctx;
}
