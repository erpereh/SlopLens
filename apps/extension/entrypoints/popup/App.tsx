import { type PopupHealth, SlopLensPopupControl, SlopLensUiRoot } from "@sloplens/ui";
import { useCallback, useEffect, useState } from "react";

import { createExtensionApiClient } from "../../lib/api-client";
import { writeDashboardSection } from "../../lib/dashboard";
import {
  DEFAULT_FEED_PREFERENCES,
  type FeedPreferences,
  readFeedPreferences,
  writeFeedPreferences,
} from "../../lib/feed-preferences";
import { LOCALE_STORAGE_KEY, type Locale, resolveLocale } from "../../lib/i18n";
import { openDashboardPage } from "../../lib/open-dashboard";
import {
  type MotionPreference,
  readMotionPreference,
  readThemePreference,
  type ThemePreference,
  writeThemePreference,
} from "../../lib/theme";

export function PopupApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [motionPreference, setMotionPreference] = useState<MotionPreference>("system");
  const [health, setHealth] = useState<PopupHealth>("checking");
  const [feed, setFeed] = useState<FeedPreferences>(DEFAULT_FEED_PREFERENCES);

  useEffect(() => {
    void chrome.storage.local.get([LOCALE_STORAGE_KEY]).then((stored) => {
      setLocale(resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined));
    });
    void readThemePreference().then(setThemePreference);
    void readMotionPreference().then(setMotionPreference);
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

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <SlopLensUiRoot
      locale={locale}
      themePreference={themePreference}
      motionPreference={motionPreference}
      onThemePreferenceChange={async (next) => {
        setThemePreference(next);
        await writeThemePreference(next);
      }}
    >
      <SlopLensPopupControl
        health={health}
        onRefreshHealth={() => void checkHealth()}
        feed={feed}
        onFeedChange={(next) => {
          setFeed(next);
          void writeFeedPreferences(next);
        }}
        onOpenDashboard={() => {
          void writeDashboardSection("overview").then(() => openDashboardPage());
        }}
      />
    </SlopLensUiRoot>
  );
}
