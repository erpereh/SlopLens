import type { ErrorCode } from "@sloplens/shared";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type Locale, type MessageKey, t } from "./messages";

export type Translate = (
  key: MessageKey | `error.${ErrorCode}`,
  vars?: Record<string, string | number>,
) => string;

const I18nContext = createContext<{ locale: Locale; translate: Translate } | null>(null);

export function SlopLensI18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      translate: (key: MessageKey | `error.${ErrorCode}`, vars?: Record<string, string | number>) =>
        t(locale, key, vars),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useSlopLensI18n(): { locale: Locale; t: Translate } {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useSlopLensI18n must be used within SlopLensI18nProvider");
  }
  return { locale: ctx.locale, t: ctx.translate };
}
