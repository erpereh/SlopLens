import { useCallback, useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import { LOCALE_STORAGE_KEY, resolveLocale, translate, type Locale } from "../../lib/i18n";
import {
  readThemePreference,
  type ThemePreference,
  writeThemePreference,
} from "../../lib/theme";

type HealthState = "checking" | "ok" | "down";

export function PopupApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemePreference>("system");
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    void chrome.storage.local.get([LOCALE_STORAGE_KEY]).then((stored) => {
      setLocale(resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined));
    });
    void readThemePreference().then(setTheme);
  }, []);

  const checkHealth = useCallback(async () => {
    setHealth("checking");
    try {
      const client = createExtensionApiClient();
      await client.health();
      setHealth("ok");
    } catch {
      setHealth("down");
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const onThemeChange = async (next: ThemePreference) => {
    setTheme(next);
    await writeThemePreference(next);
  };

  const onLocaleChange = async (next: Locale) => {
    setLocale(next);
    await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: next });
  };

  const healthLabel =
    health === "checking"
      ? translate(locale, "popupHealthChecking")
      : health === "ok"
        ? translate(locale, "popupHealthOk")
        : translate(locale, "popupHealthDown");

  return (
    <main className="popup">
      <h1 className="popup__title">{translate(locale, "popupTitle")}</h1>

      <section className="popup__section">
        <div className="popup__row">
          <span>{translate(locale, "popupHealth")}</span>
          <strong data-health={health}>{healthLabel}</strong>
        </div>
        <button type="button" className="popup__button" onClick={() => void checkHealth()}>
          {translate(locale, "popupHealthRefresh")}
        </button>
      </section>

      <section className="popup__section">
        <label className="popup__label" htmlFor="theme-select">
          {translate(locale, "popupTheme")}
        </label>
        <select
          id="theme-select"
          className="popup__select"
          value={theme}
          onChange={(event) => void onThemeChange(event.target.value as ThemePreference)}
        >
          <option value="light">{translate(locale, "themeLight")}</option>
          <option value="dark">{translate(locale, "themeDark")}</option>
          <option value="system">{translate(locale, "themeSystem")}</option>
        </select>
      </section>

      <section className="popup__section">
        <label className="popup__label" htmlFor="locale-select">
          {translate(locale, "language")}
        </label>
        <select
          id="locale-select"
          className="popup__select"
          value={locale}
          onChange={(event) => void onLocaleChange(event.target.value as Locale)}
        >
          <option value="en">{translate(locale, "langEn")}</option>
          <option value="es">{translate(locale, "langEs")}</option>
        </select>
      </section>

      <button
        type="button"
        className="popup__button popup__button--primary"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        {translate(locale, "popupOpenOptions")}
      </button>
    </main>
  );
}
