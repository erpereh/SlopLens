import { type ReactNode, useLayoutEffect, useRef } from "react";
import { SlopLensI18nProvider } from "@/i18n/context";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { applyResolvedTheme, findThemeCascadeRoot } from "@/theme/apply";
import { SlopLensThemeProvider, useSlopLensTheme } from "@/theme/context";
import type { MotionPreference, ThemePreference } from "@/theme/types";

export function SlopLensUiRoot({
  locale,
  themePreference,
  onThemePreferenceChange,
  motionPreference = "system",
  onMotionPreferenceChange,
  reducedMotion,
  className,
  children,
}: {
  locale: Locale;
  themePreference: ThemePreference;
  onThemePreferenceChange: (next: ThemePreference) => void;
  motionPreference?: MotionPreference;
  onMotionPreferenceChange?: (next: MotionPreference) => void;
  reducedMotion?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SlopLensI18nProvider locale={locale}>
      <SlopLensThemeProvider
        preference={themePreference}
        onPreferenceChange={onThemePreferenceChange}
        motionPreference={motionPreference}
        onMotionPreferenceChange={onMotionPreferenceChange}
        reducedMotion={reducedMotion}
      >
        <SlopLensUiSurface className={className}>{children}</SlopLensUiSurface>
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

function SlopLensUiSurface({ className, children }: { className?: string; children: ReactNode }) {
  const { resolved, reducedMotion } = useSlopLensTheme();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const surface = ref.current;
    if (!surface) {
      return;
    }
    applyResolvedTheme(surface, resolved, reducedMotion);
    const cascade = findThemeCascadeRoot(surface);
    if (cascade && cascade !== surface) {
      applyResolvedTheme(cascade, resolved, reducedMotion);
    }
  }, [reducedMotion, resolved]);

  return (
    <div
      ref={ref}
      className={cn(
        "sloplens-ui-root bg-background text-foreground antialiased",
        resolved === "dark" && "dark",
        className,
      )}
      data-theme={resolved}
      data-sloplens-root="true"
      {...(reducedMotion ? { "data-reduce-motion": "true" } : {})}
    >
      {children}
    </div>
  );
}
