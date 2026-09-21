import type {
  DecisionProvider,
  EmbeddingProvider,
  EmbeddingVector,
  ReasoningProvider,
  SearchProvider,
  SearchResult,
  VisionProvider,
} from "@sloplens/ai";
import type { ProviderSelection } from "@sloplens/config";
import type { ContentDecision } from "@sloplens/core";

import { providerNotConfigured } from "../lib/http-errors";
import type { ProviderRuntime } from "./provider-runtime";

export const sampleContent = {
  platform: "x" as const,
  url: "https://x.com/user/status/1",
  title: "Example post",
  text: "A verifiable claim about a public report.",
  metadata: {},
};

export const youtubeContent = {
  platform: "youtube" as const,
  url: "https://www.youtube.com/watch?v=abcdefghijk",
  title: "You will not believe this",
  text: "Description of the video.",
  metadata: { videoId: "abcdefghijk" },
  media: [
    {
      kind: "thumbnail" as const,
      url: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
    },
  ],
};

export function sampleDecision(overrides: Partial<ContentDecision> = {}): ContentDecision {
  return {
    aiSlop: 0.2,
    engagementBait: 0.1,
    clickbait: 0.3,
    spam: 0,
    advertisement: 0,
    containsClaim: true,
    needsVerification: true,
    needsWebSearch: false,
    needsImageAnalysis: false,
    needsPowerfulModel: false,
    likelyDuplicate: false,
    contentType: "news",
    ...overrides,
  };
}

export function mockDecisionProvider(
  analyze: DecisionProvider["analyze"] = async () => sampleDecision(),
): DecisionProvider {
  return { providerId: "mock-decision", analyze };
}

export function mockEmbeddingProvider(values: number[], modelId = "test-embed"): EmbeddingProvider {
  const vector: EmbeddingVector = { modelId, dimensions: values.length, values };
  return {
    providerId: "mock-embedding",
    embed: async () => vector,
    embedMany: async (texts) => texts.map(() => vector),
  };
}

export function mockSearchProvider(results: SearchResult[]): SearchProvider {
  return {
    providerId: "mock-search",
    search: async () => results,
  };
}

export function mockVisionProvider(description = "A sensational thumbnail."): VisionProvider {
  return {
    providerId: "mock-vision",
    analyze: async () => ({ description }),
  };
}

export function mockReasoningProvider(text: string): ReasoningProvider {
  return {
    providerId: "mock-reasoning",
    complete: async () => ({ text }),
  };
}

export function mockRuntime(overrides: Partial<ProviderRuntime> = {}): ProviderRuntime {
  const decisionSelection: ProviderSelection = {
    capability: "decision",
    providerId: "typesafe",
    modelId: "test-decision",
  };
  const embeddingSelection: ProviderSelection = {
    capability: "embedding",
    providerId: "openrouter",
    modelId: "test-embed",
  };
  return {
    requireDecision: async () => ({
      provider: mockDecisionProvider(),
      selection: decisionSelection,
    }),
    requireEmbedding: async () => ({
      provider: mockEmbeddingProvider(new Array(2048).fill(0.01)),
      selection: embeddingSelection,
    }),
    requireSearch: async () => mockSearchProvider([]),
    optionalVision: async () => null,
    optionalReasoning: async () => null,
    ...overrides,
  };
}

export function unconfiguredRuntime(): ProviderRuntime {
  return {
    requireDecision: async () => {
      throw providerNotConfigured("decision");
    },
    requireEmbedding: async () => {
      throw providerNotConfigured("embedding");
    },
    requireSearch: async () => {
      throw providerNotConfigured("search");
    },
    optionalVision: async () => null,
    optionalReasoning: async () => null,
  };
}
