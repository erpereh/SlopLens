import type { ContentDecision } from "@sloplens/core";
import { describe, expect, it } from "vitest";
import { compactSignalLabel, formatAnalyzeSummary } from "./analyze-summary";

const base: ContentDecision = {
  aiSlop: 0.2,
  engagementBait: 0.1,
  clickbait: 0.15,
  spam: 0.05,
  advertisement: 0,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news",
};

describe("formatAnalyzeSummary", () => {
  it("never exposes raw content type tokens", () => {
    const summary = formatAnalyzeSummary("en", base);
    expect(summary).not.toMatch(/news\s*·\s*claim/i);
    expect(summary).toMatch(/verifiable claim/i);
  });
});

describe("compactSignalLabel", () => {
  it("prioritizes verifiable claim in the compact chip", () => {
    expect(compactSignalLabel("en", base)).toBe("Verifiable claim");
  });
});
