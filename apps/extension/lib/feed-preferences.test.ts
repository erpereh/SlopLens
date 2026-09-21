import { describe, expect, it } from "vitest";

import { clampThreshold, parseFeedPreferences } from "./feed-preferences";

describe("feed preferences", () => {
  it("defaults auto analyze, dimming and stamp to on", () => {
    const parsed = parseFeedPreferences(undefined);
    expect(parsed.autoAnalyze).toBe(true);
    expect(parsed.dimHighSlop).toBe(true);
    expect(parsed.showSlopStamp).toBe(true);
    expect(parsed.slopThreshold).toBe(0.7);
  });

  it("clamps threshold into 50–95%", () => {
    expect(clampThreshold(0.1)).toBe(0.5);
    expect(clampThreshold(1)).toBe(0.95);
    expect(clampThreshold(0.73)).toBe(0.75);
  });
});
