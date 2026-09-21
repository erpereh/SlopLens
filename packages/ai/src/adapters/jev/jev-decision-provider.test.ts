import { describe, expect, it, vi } from "vitest";

import { createJevDecisionProvider } from "./jev-decision-provider";

describe("createJevDecisionProvider", () => {
  it("maps evaluate answers into a ContentDecision", async () => {
    const evaluate = vi.fn(async () => ({
      answers: {
        aiSlop: { type: "boolean", probability: 0.2 },
        engagementBait: { type: "boolean", probability: 0.1 },
        clickbait: { type: "boolean", probability: 0.3 },
        spam: { type: "boolean", probability: 0.05 },
        advertisement: { type: "boolean", probability: 0.05 },
        containsClaim: { type: "boolean", probability: 0.7 },
        needsVerification: { type: "boolean", probability: 0.7 },
        needsWebSearch: { type: "boolean", probability: 0.2 },
        needsImageAnalysis: { type: "boolean", probability: 0.1 },
        needsPowerfulModel: { type: "boolean", probability: 0.1 },
        likelyDuplicate: { type: "boolean", probability: 0.1 },
        contentType: {
          type: "choice",
          choice: "opinion",
          probabilities: { opinion: 0.8 },
        },
        informationQuality: { type: "score", score: 2, probabilities: {} },
        originality: { type: "score", score: 2, probabilities: {} },
      },
      usage: {},
      warnings: [],
      rounding: {},
      providerMetadata: {},
      response: { timestamp: new Date(), modelId: "typesafe-ai/jev" },
    }));

    const evaluationModel = "typesafe-ai/jev-mock";
    const gatewayFactory = vi.fn(() => ({
      evaluationModel: vi.fn(() => evaluationModel),
    }));

    const provider = createJevDecisionProvider({
      apiKey: "test-gateway-key",
      evaluate: evaluate as never,
      gatewayFactory: gatewayFactory as never,
    });

    const decision = await provider.analyze({
      content: {
        platform: "x",
        url: "https://x.com/example/status/1",
        text: "Example post",
        metadata: {},
      },
    });

    expect(gatewayFactory).toHaveBeenCalledWith({ apiKey: "test-gateway-key" });
    expect(evaluate).toHaveBeenCalledOnce();
    expect(decision.contentType).toBe("opinion");
    expect(decision.containsClaim).toBe(true);
    expect(decision.aiSlop).toBe(0.2);
  });
});
