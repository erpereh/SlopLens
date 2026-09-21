import { describe, expect, it, vi } from "vitest";

import { hashNormalizedContent } from "../content-hash";
import { HttpError } from "../lib/http-errors";
import { createAnalyzeService } from "./analyze-service";
import {
  mockDecisionProvider,
  mockRuntime,
  mockVisionProvider,
  sampleContent,
  sampleDecision,
  unconfiguredRuntime,
  youtubeContent,
} from "./test-providers";

describe("analyze service", () => {
  it("returns a decision and content hash without cache when sql is unavailable", async () => {
    const analyze = vi.fn(async () => sampleDecision({ aiSlop: 0.42 }));
    const service = createAnalyzeService({
      sql: null,
      runtime: mockRuntime({
        requireDecision: async () => ({
          provider: mockDecisionProvider(analyze),
          selection: { capability: "decision", providerId: "typesafe", modelId: "test-decision" },
        }),
      }),
    });

    const result = await service.analyze({ content: sampleContent });
    expect(result.cached).toBe(false);
    expect(result.decision.aiSlop).toBe(0.42);
    expect(result.contentHash).toBe(hashNormalizedContent(sampleContent));
    expect(analyze).toHaveBeenCalledOnce();
  });

  it("runs vision on YouTube thumbnails and re-analyzes with the description", async () => {
    const analyze = vi.fn(async ({ content }) =>
      sampleDecision({
        clickbait:
          typeof content.text === "string" && content.text.includes("Thumbnail description")
            ? 0.9
            : 0.2,
      }),
    );
    const vision = mockVisionProvider("exploding arrows overlay");
    const visionSpy = vi.spyOn(vision, "analyze");

    const service = createAnalyzeService({
      sql: null,
      runtime: mockRuntime({
        requireDecision: async () => ({
          provider: mockDecisionProvider(analyze),
          selection: { capability: "decision", providerId: "typesafe", modelId: "test-decision" },
        }),
        optionalVision: async () => vision,
      }),
    });

    const result = await service.analyze({ content: youtubeContent });
    expect(visionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: youtubeContent.media[0]?.url }),
    );
    expect(result.decision.clickbait).toBe(0.9);
    expect(analyze).toHaveBeenCalledTimes(2);
  });

  it("returns a vision warning when thumbnail analysis fails", async () => {
    const vision = mockVisionProvider("unused");
    vi.spyOn(vision, "analyze").mockRejectedValue(new Error("vision provider down"));

    const service = createAnalyzeService({
      sql: null,
      runtime: mockRuntime({
        requireDecision: async () => ({
          provider: mockDecisionProvider(),
          selection: { capability: "decision", providerId: "typesafe", modelId: "test-decision" },
        }),
        optionalVision: async () => vision,
      }),
    });

    const result = await service.analyze({ content: youtubeContent });
    expect(result.decision.contentType).toBeTruthy();
    expect(result.warnings).toEqual([{ capability: "vision", message: "vision provider down" }]);
  });

  it("maps missing decision provider to provider_not_configured", async () => {
    const service = createAnalyzeService({
      sql: null,
      runtime: unconfiguredRuntime(),
    });

    await expect(service.analyze({ content: sampleContent })).rejects.toBeInstanceOf(HttpError);
    await expect(service.analyze({ content: sampleContent })).rejects.toMatchObject({
      body: { code: "provider_not_configured" },
    });
  });
});
