import { describe, expect, it } from "vitest";

import { contentDecisionSchema, normalizedContentSchema } from "./index";

const validContent = {
  platform: "x" as const,
  url: "https://x.com/user/status/1",
  metadata: {},
};

const validDecision = {
  aiSlop: 0.2,
  engagementBait: 0,
  clickbait: 1,
  spam: 0.4,
  advertisement: 0,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news" as const,
};

describe("normalizedContentSchema", () => {
  it("accepts required fields for a supported platform", () => {
    const parsed = normalizedContentSchema.parse(validContent);
    expect(parsed.platform).toBe("x");
    expect(parsed.url).toBe(validContent.url);
  });

  it("rejects an unsupported platform", () => {
    const result = normalizedContentSchema.safeParse({
      ...validContent,
      platform: "tiktok",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing url", () => {
    const { url: _url, ...withoutUrl } = validContent;
    const result = normalizedContentSchema.safeParse(withoutUrl);
    expect(result.success).toBe(false);
  });
});

describe("contentDecisionSchema", () => {
  it("accepts scores in the closed 0–1 interval", () => {
    expect(contentDecisionSchema.parse(validDecision).clickbait).toBe(1);
  });

  it("rejects a score above 1", () => {
    const result = contentDecisionSchema.safeParse({
      ...validDecision,
      aiSlop: 1.2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a score below 0", () => {
    const result = contentDecisionSchema.safeParse({
      ...validDecision,
      spam: -0.01,
    });
    expect(result.success).toBe(false);
  });
});
