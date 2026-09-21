import { detectPlatform } from "@sloplens/platforms";

import { LOCALE_STORAGE_KEY, resolveLocale } from "../lib/i18n";
import { OverlayMountManager, type OverlayRuntimeState } from "../lib/mount-overlay";
import { collectScanTargets } from "../lib/scan-targets";
import { prefersReducedMotion, readThemePreference, THEME_STORAGE_KEY } from "../lib/theme";

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
    let runtime = await loadRuntimeState();
    let scanScheduled = false;

    const scheduleScan = () => {
      if (scanScheduled) {
        return;
      }
      scanScheduled = true;
      queueMicrotask(async () => {
        scanScheduled = false;
        await scanPage(manager, platform, runtime);
      });
    };

    const observer = new MutationObserver(() => {
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
      if (changes[THEME_STORAGE_KEY] || changes[LOCALE_STORAGE_KEY]) {
        void reloadRuntime().then((next) => {
          runtime = next;
          scheduleScan();
        });
      }
    });

    async function reloadRuntime() {
      runtime = await loadRuntimeState();
      return runtime;
    }

    scheduleScan();
  },
});

async function loadRuntimeState(): Promise<OverlayRuntimeState> {
  const [themePreference, stored] = await Promise.all([
    readThemePreference(),
    chrome.storage.local.get(LOCALE_STORAGE_KEY),
  ]);
  const locale = resolveLocale(stored[LOCALE_STORAGE_KEY] as string | undefined);
  return {
    locale,
    themePreference,
    reducedMotion: prefersReducedMotion(),
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
