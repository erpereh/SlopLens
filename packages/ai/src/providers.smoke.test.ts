import { describe, expect, it } from "vitest";
import { AiProviderError } from "./errors";
import { createDefaultProviderRegistryFromEnv } from "./registry-defaults";
import { loadApiBootstrapEnv } from "./smoke/load-env";

const smokeEnabled = process.env.SLOPLENS_SMOKE === "1";

function ignoreSmokeProviderFailure(error: unknown): boolean {
  if (!(error instanceof AiProviderError)) {
    return false;
  }
  if (error.code === "rate_limited") {
    return true;
  }
  if (error.code === "backend_unavailable" && error.capability === "decision") {
    return true;
  }
  if (error.code === "validation_error" && error.capability === "vision") {
    return true;
  }
  return false;
}

describe.skipIf(!smokeEnabled)("provider smoke", () => {
  loadApiBootstrapEnv();

  const registry = createDefaultProviderRegistryFromEnv();

  it("decision: one Jev evaluation when AI_GATEWAY_API_KEY is configured", async () => {
    const provider = registry.getDecision("jev");
    if (!provider) {
      return;
    }

    try {
      const decision = await provider.analyze({
        content: {
          platform: "x",
          url: "https://x.com/example/status/smoke",
          text: "Smoke test: short neutral statement about weather.",
          metadata: { smoke: true },
        },
      });
      expect(decision.contentType).toBeTruthy();
    } catch (error) {
      if (ignoreSmokeProviderFailure(error)) {
        return;
      }
      throw error;
    }
  });

  it("embedding: records observed vector length only", async () => {
    const provider = registry.getEmbedding("openrouter");
    if (!provider) {
      return;
    }

    try {
      const vector = await provider.embed("SlopLens embedding dimension probe.");
      expect(vector.dimensions).toBe(vector.values.length);
      console.info(`[smoke] observed embedding dimensions: ${vector.dimensions}`);
    } catch (error) {
      if (ignoreSmokeProviderFailure(error)) {
        return;
      }
      throw error;
    }
  });

  it("search: one Tavily query when configured", async () => {
    const provider = registry.getSearch("tavily");
    if (!provider) {
      return;
    }

    try {
      const results = await provider.search("SlopLens smoke test query", { maxResults: 2 });
      expect(Array.isArray(results)).toBe(true);
    } catch (error) {
      if (ignoreSmokeProviderFailure(error)) {
        return;
      }
      throw error;
    }
  });

  it("vision: one multimodal call when configured", async () => {
    const provider = registry.getVision("openrouter");
    if (!provider) {
      return;
    }

    try {
      const result = await provider.analyze({
        imageUrl: "https://picsum.photos/seed/sloplens-smoke/200.jpg",
        prompt: "Describe this image in one sentence.",
      });
      expect(result.description.length).toBeGreaterThan(0);
    } catch (error) {
      if (ignoreSmokeProviderFailure(error)) {
        return;
      }
      throw error;
    }
  });

  it("reasoning: one chat completion when configured", async () => {
    const provider = registry.getReasoning("openrouter");
    if (!provider) {
      return;
    }

    try {
      const result = await provider.complete({
        prompt: "Reply with the single word: ok",
      });
      expect(result.text.length).toBeGreaterThan(0);
    } catch (error) {
      if (ignoreSmokeProviderFailure(error)) {
        return;
      }
      throw error;
    }
  });
});
