import type { ReactNode } from "react";
import { SlopLensI18nProvider } from "@/i18n/context";
import type { Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import { SlopLensThemeProvider, useSlopLensTheme } from "@/theme/context";
import type { ThemePreference } from "@/theme/types";

export function SlopLensUiRoot({
  locale,
  themePreference,
  onThemePreferenceChange,
  className,
  children,
}: {
  locale: Locale;
  themePreference: ThemePreference;
  onThemePreferenceChange: (next: ThemePreference) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SlopLensI18nProvider locale={locale}>
      <SlopLensThemeProvider
        preference={themePreference}
        onPreferenceChange={onThemePreferenceChange}
      >
        <SlopLensUiSurface className={className}>{children}</SlopLensUiSurface>
      </SlopLensThemeProvider>
    </SlopLensI18nProvider>
  );
}

function SlopLensUiSurface({ className, children }: { className?: string; children: ReactNode }) {
  const { resolved } = useSlopLensTheme();

  return (
    <div
      className={cn(
        "sloplens-ui-root text-foreground antialiased",
        resolved === "dark" && "dark",
        className,
      )}
      data-theme={resolved}
      data-sloplens-root="true"
    >
      {children}
    </div>
  );
}
