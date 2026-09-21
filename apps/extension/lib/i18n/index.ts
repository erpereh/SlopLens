import { en, type MessageKey } from "./en";
import { es } from "./es";

export type Locale = "en" | "es";

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, es };

export const LOCALE_STORAGE_KEY = "sloplens.locale";

export function translate(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? en[key];
}

export function resolveLocale(value: string | undefined): Locale {
  return value === "es" ? "es" : "en";
}
