import { detectPlatform } from "@sloplens/platforms";

import { createAnalyzeScheduler } from "../lib/analyze-scheduler";
import { createExtensionApiClient } from "../lib/api-client";
import { FEED_PREFS_STORAGE_KEY, readFeedPreferences } from "../lib/feed-preferences";
import { LOCALE_STORAGE_KEY, resolveLocale } from "../lib/i18n";
import { OverlayMountManager, type OverlayRuntimeState } from "../lib/mount-overlay";
import { createScanScheduler } from "../lib/scan-scheduler";
import { collectScanTargets } from "../lib/scan-targets";
import { mutationsAreOnlySlopLens } from "../lib/slop-marker";
import {
  MOTION_STORAGE_KEY,
  readMotionPreference,
  readThemePreference,
  resolveReducedMotion,
  THEME_STORAGE_KEY,
} from "../lib/theme";

import "@sloplens/ui/styles.css";

export default defineContentScript({
  matches: ["*://x.com/*", "*://twitter.com/*", "*://*.youtube.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const platform = detectPlatform(window.location.hostname);
    if (!platform) {
      return;
    }

    const manager = new OverlayMountManager(ctx);
    const scheduler = createAnalyzeScheduler({
      analyze: (content) => createExtensionApiClient().analyze({ content }),
      concurrency: 2,
    });
    let runtime = await loadRuntimeState(scheduler);

    const scheduleScan = createScanScheduler(() => scanPage(manager, platform, runtime));

    const observer = new MutationObserver((mutations) => {
      if (mutationsAreOnlySlopLens(mutations)) {
        return;
      }
      scheduleScan();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    ctx.addEventListener(window, "wxt:locationchange", () => {
      scheduleScan();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") {
        return;
      }
      if (
        changes[THEME_STORAGE_KEY] ||
        changes[LOCALE_STORAGE_KEY] ||
        changes[FEED_PREFS_STORAGE_KEY] ||
        changes[MOTION_STORAGE_KEY]
      ) {
        void reloadRuntime().then((next) => {
          runtime = next;
          scheduleScan();
        });
      }
    });

    async function reloadRuntime() {
      runtime = await loadRuntimeState(scheduler);
      return runtime;
    }

    scheduleScan();
  },
});

async function loadRuntimeState(
  scheduler: OverlayRuntimeState["scheduler"],
): Promise<OverlayRuntimeState> {
  const [themePreference, motionPreference, stored, feedPreferences] = await Promise.all([
    readThemePreference(),
    readMotionPreference(),
    chrome.storage.local.get(LOCALE_STORAGE_KEY),
    readFeedPreferences(),
  ]);
  const locale = resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined);
  return {
    locale,
    themePreference,
    motionPreference,
    reducedMotion: resolveReducedMotion(motionPreference),
    feedPreferences,
    scheduler,
  };
}

async function scanPage(
  manager: OverlayMountManager,
  platform: ReturnType<typeof detectPlatform>,
  runtime: OverlayRuntimeState,
): Promise<void> {
  if (!platform) {
    return;
  }
  const targets = collectScanTargets(platform, document);
  for (const target of targets) {
    await manager.syncTarget(target, runtime);
  }
}
