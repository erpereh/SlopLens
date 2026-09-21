import { PROVIDER_CAPABILITIES } from "@sloplens/config/browser";
import {
  type PopupFeedPreferences,
  type PopupHealth,
  type PopupProviderRow,
  SlopLensPopupControl,
  SlopLensUiRoot,
} from "@sloplens/ui";
import { useCallback, useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import {
  DEFAULT_FEED_PREFERENCES,
  type FeedPreferences,
  readFeedPreferences,
  writeFeedPreferences,
} from "../../lib/feed-preferences";
import { LOCALE_STORAGE_KEY, type Locale, resolveLocale } from "../../lib/i18n";
import { readThemePreference, type ThemePreference, writeThemePreference } from "../../lib/theme";

export function PopupApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [health, setHealth] = useState<PopupHealth>("checking");
  const [feed, setFeed] = useState<FeedPreferences>(DEFAULT_FEED_PREFERENCES);
  const [providers, setProviders] = useState<PopupProviderRow[]>(
    PROVIDER_CAPABILITIES.map((capability) => ({ capability, configured: false })),
  );

  useEffect(() => {
    void chrome.storage.local.get([LOCALE_STORAGE_KEY]).then((stored) => {
      setLocale(resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined));
    });
    void readThemePreference().then(setThemePreference);
    void readFeedPreferences().then(setFeed);
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

  const loadProviders = useCallback(async () => {
    try {
      const client = createExtensionApiClient();
      const [settings, catalog] = await Promise.all([client.getSettings(), client.getProviders()]);
      const configured = new Set(
        settings.secrets.filter((secret) => secret.configured).map((secret) => secret.capability),
      );
      const fromCatalog = catalog.capabilities.map((entry) => ({
        capability: entry.capability,
        configured:
          configured.has(entry.capability) ||
          entry.providers.some((provider) => provider.configured),
      }));
      setProviders(
        fromCatalog.length > 0
          ? fromCatalog
          : PROVIDER_CAPABILITIES.map((capability) => ({
              capability,
              configured: configured.has(capability),
            })),
      );
    } catch {
      setProviders(PROVIDER_CAPABILITIES.map((capability) => ({ capability, configured: false })));
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    void loadProviders();
  }, [checkHealth, loadProviders]);

  const onFeedChange = async (next: PopupFeedPreferences) => {
    const parsed = {
      autoAnalyze: next.autoAnalyze,
      dimHighSlop: next.dimHighSlop,
      showSlopStamp: next.showSlopStamp,
      slopThreshold: next.slopThreshold,
    };
    setFeed(parsed);
    await writeFeedPreferences(parsed);
  };

  return (
    <SlopLensUiRoot
      locale={locale}
      themePreference={themePreference}
      onThemePreferenceChange={async (next) => {
        setThemePreference(next);
        await writeThemePreference(next);
      }}
    >
      <SlopLensPopupControl
        health={health}
        onRefreshHealth={() => void checkHealth()}
        feed={feed}
        onFeedChange={(next) => void onFeedChange(next)}
        locale={locale}
        onLocaleChange={async (next) => {
          setLocale(next);
          await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: next });
        }}
        providers={providers}
        onManageProviders={() => chrome.runtime.openOptionsPage()}
      />
    </SlopLensUiRoot>
  );
}
