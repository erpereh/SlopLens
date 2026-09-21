import { describe, expect, it, vi } from "vitest";

import { createTypeSafeDecisionProvider } from "./typesafe-decision-provider";

describe("createTypeSafeDecisionProvider", () => {
  it("maps evaluate answers into a ContentDecision via the official TypeSafe client", async () => {
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
      response: { timestamp: new Date(), modelId: "jev-latest" },
    }));

    const evaluationModel = { specificationVersion: "v4" };
    const evaluationModelFn = vi.fn(() => evaluationModel);
    const createClient = vi.fn(() => ({
      evaluationModel: evaluationModelFn,
    }));

    const provider = createTypeSafeDecisionProvider({
      apiKey: "test-typesafe-key",
      modelId: "jev-latest",
      baseUrl: "https://api.typesafe.ai/v1",
      evaluate: evaluate as never,
      createClient: createClient as never,
    });

    expect(provider.providerId).toBe("typesafe");

    const decision = await provider.analyze({
      content: {
        platform: "x",
        url: "https://x.com/example/status/1",
        text: "Example post",
        metadata: {},
      },
    });

    expect(createClient).toHaveBeenCalledWith({
      apiKey: "test-typesafe-key",
      baseURL: "https://api.typesafe.ai/v1",
    });
    expect(evaluationModelFn).toHaveBeenCalledWith("jev-latest");
    expect(evaluate).toHaveBeenCalledOnce();
    const payload = evaluate.mock.calls.at(0)?.at(0) as Record<string, unknown> | undefined;
    expect(payload?.model).toBe(evaluationModel);
    expect(payload).not.toHaveProperty("providerOptions");
    expect(decision.contentType).toBe("opinion");
    expect(decision.containsClaim).toBe(true);
    expect(decision.aiSlop).toBe(0.2);
  });
});
