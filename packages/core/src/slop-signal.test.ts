import { describe, expect, it } from "vitest";

import { deriveSlopSignal, slopSignalExceedsThreshold } from "./slop-signal";

const decision = {
  aiSlop: 0.82,
  engagementBait: 0.9,
  clickbait: 0.95,
  spam: 0.1,
  advertisement: 0.05,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news" as const,
};

describe("deriveSlopSignal", () => {
  it("derives the presentation signal from aiSlop, not other scores", () => {
    const signal = deriveSlopSignal(decision);
    expect(signal).toEqual({ value: 0.82, label: "slop", source: "aiSlop" });
    expect(signal.value).not.toBe(decision.clickbait);
  });

  it("compares against a configurable threshold", () => {
    const signal = deriveSlopSignal(decision);
    expect(slopSignalExceedsThreshold(signal, 0.7)).toBe(true);
    expect(slopSignalExceedsThreshold(signal, 0.9)).toBe(false);
  });
});
