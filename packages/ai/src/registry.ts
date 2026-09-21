import type { ProviderCapability } from "@sloplens/config";

import type { DecisionProvider } from "./providers/decision";
import type { EmbeddingProvider } from "./providers/embedding";
import type { ReasoningProvider } from "./providers/reasoning";
import type { SearchProvider } from "./providers/search";
import type { VisionProvider } from "./providers/vision";

export interface ProviderDescriptor {
  readonly capability: ProviderCapability;
  readonly providerId: string;
}

export interface ProviderRegistryEntries {
  decision?: Record<string, DecisionProvider>;
  embedding?: Record<string, EmbeddingProvider>;
  search?: Record<string, SearchProvider>;
  vision?: Record<string, VisionProvider>;
  reasoning?: Record<string, ReasoningProvider>;
}

export interface ProviderRegistry {
  getDecision(providerId: string): DecisionProvider | undefined;
  getEmbedding(providerId: string): EmbeddingProvider | undefined;
  getSearch(providerId: string): SearchProvider | undefined;
  getVision(providerId: string): VisionProvider | undefined;
  getReasoning(providerId: string): ReasoningProvider | undefined;
  list(capability: ProviderCapability): readonly ProviderDescriptor[];
  has(capability: ProviderCapability, providerId: string): boolean;
}

export function createProviderRegistry(entries: ProviderRegistryEntries): ProviderRegistry {
  const decision = entries.decision ?? {};
  const embedding = entries.embedding ?? {};
  const search = entries.search ?? {};
  const vision = entries.vision ?? {};
  const reasoning = entries.reasoning ?? {};

  const byCapability: Record<ProviderCapability, Record<string, { providerId: string }>> = {
    decision,
    embedding,
    search,
    vision,
    reasoning,
  };

  return {
    getDecision: (providerId) => decision[providerId],
    getEmbedding: (providerId) => embedding[providerId],
    getSearch: (providerId) => search[providerId],
    getVision: (providerId) => vision[providerId],
    getReasoning: (providerId) => reasoning[providerId],
    list: (capability) =>
      Object.keys(byCapability[capability]).map((providerId) => ({ capability, providerId })),
    has: (capability, providerId) => Boolean(byCapability[capability][providerId]),
  };
}
