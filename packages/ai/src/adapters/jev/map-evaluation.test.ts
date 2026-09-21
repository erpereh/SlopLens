import { describe, expect, it } from "vitest";

import { mapJevAnswersToContentDecision } from "./map-evaluation";

describe("mapJevAnswersToContentDecision", () => {
  it("maps boolean probabilities to unit scores and applies the routing threshold", () => {
    const decision = mapJevAnswersToContentDecision(
      {
        aiSlop: { type: "boolean", probability: 0.72 },
        engagementBait: { type: "boolean", probability: 0.1 },
        clickbait: { type: "boolean", probability: 0.55 },
        spam: { type: "boolean", probability: 0.02 },
        advertisement: { type: "boolean", probability: 0.9 },
        containsClaim: { type: "boolean", probability: 0.61 },
        needsVerification: { type: "boolean", probability: 0.59 },
        needsWebSearch: { type: "boolean", probability: 0.8 },
        needsImageAnalysis: { type: "boolean", probability: 0.1 },
        needsPowerfulModel: { type: "boolean", probability: 0.65 },
        likelyDuplicate: { type: "boolean", probability: 0.4 },
        contentType: {
          type: "choice",
          choice: "news",
          probabilities: { news: 0.7, opinion: 0.2, unknown: 0.1 },
        },
        informationQuality: { type: "score", score: 3, probabilities: {} },
        originality: { type: "score", score: 1.5, probabilities: {} },
      },
      { threshold: 0.6 },
    );

    expect(decision.aiSlop).toBe(0.72);
    expect(decision.clickbait).toBe(0.55);
    expect(decision.containsClaim).toBe(true);
    expect(decision.needsVerification).toBe(false);
    expect(decision.needsWebSearch).toBe(true);
    expect(decision.contentType).toBe("news");
    expect(decision.informationQuality).toBeCloseTo(3 / 4);
    expect(decision.originality).toBeCloseTo(1.5 / 4);
  });

  it("falls back to unknown when the choice is not a supported content type", () => {
    const decision = mapJevAnswersToContentDecision({
      aiSlop: { type: "boolean", probability: 0 },
      engagementBait: { type: "boolean", probability: 0 },
      clickbait: { type: "boolean", probability: 0 },
      spam: { type: "boolean", probability: 0 },
      advertisement: { type: "boolean", probability: 0 },
      containsClaim: { type: "boolean", probability: 0 },
      needsVerification: { type: "boolean", probability: 0 },
      needsWebSearch: { type: "boolean", probability: 0 },
      needsImageAnalysis: { type: "boolean", probability: 0 },
      needsPowerfulModel: { type: "boolean", probability: 0 },
      likelyDuplicate: { type: "boolean", probability: 0 },
      contentType: {
        type: "choice",
        choice: "not-a-type",
        probabilities: { "not-a-type": 1 },
      },
    });

    expect(decision.contentType).toBe("unknown");
  });
});
