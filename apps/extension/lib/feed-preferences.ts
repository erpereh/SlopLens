export const FEED_PREFS_STORAGE_KEY = "sloplens.feed";

export type FeedPreferences = {
  autoAnalyze: boolean;
  dimHighSlop: boolean;
  showSlopStamp: boolean;
  slopThreshold: number;
};

export const DEFAULT_FEED_PREFERENCES: FeedPreferences = {
  autoAnalyze: true,
  dimHighSlop: true,
  showSlopStamp: true,
  slopThreshold: 0.7,
};

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FEED_PREFERENCES.slopThreshold;
  }
  const snapped = Math.round(value * 20) / 20;
  return Math.min(0.95, Math.max(0.5, snapped));
}

export function parseFeedPreferences(raw: unknown): FeedPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_FEED_PREFERENCES };
  }
  const value = raw as Partial<FeedPreferences>;
  return {
    autoAnalyze: value.autoAnalyze !== false,
    dimHighSlop: value.dimHighSlop !== false,
    showSlopStamp: value.showSlopStamp !== false,
    slopThreshold: clampThreshold(
      typeof value.slopThreshold === "number"
        ? value.slopThreshold
        : DEFAULT_FEED_PREFERENCES.slopThreshold,
    ),
  };
}

export async function readFeedPreferences(): Promise<FeedPreferences> {
  const stored = await chrome.storage.local.get(FEED_PREFS_STORAGE_KEY);
  return parseFeedPreferences(stored[FEED_PREFS_STORAGE_KEY]);
}

export async function writeFeedPreferences(next: FeedPreferences): Promise<void> {
  await chrome.storage.local.set({
    [FEED_PREFS_STORAGE_KEY]: parseFeedPreferences(next),
  });
}
