import { createJevDecisionProvider } from "./adapters/jev/jev-decision-provider";
import { createOpenRouterEmbeddingProvider } from "./adapters/openrouter/embedding-provider";
import { createOpenRouterReasoningProvider } from "./adapters/openrouter/reasoning-provider";
import { createOpenRouterVisionProvider } from "./adapters/openrouter/vision-provider";
import { createTavilySearchProvider } from "./adapters/tavily/search-provider";
import {
  createProviderRegistry,
  type ProviderRegistry,
  type ProviderRegistryEntries,
} from "./registry";

export interface DefaultProviderRegistryConfig {
  decision?: {
    apiKey?: string;
    modelId?: string;
    threshold?: number;
  };
  embedding?: {
    apiKey?: string;
    modelId?: string;
    baseUrl?: string;
  };
  search?: {
    apiKey?: string;
    baseUrl?: string;
  };
  vision?: {
    apiKey?: string;
    modelId?: string;
    baseUrl?: string;
  };
  reasoning?: {
    apiKey?: string;
    modelId?: string;
    baseUrl?: string;
  };
}

export function createDefaultProviderRegistry(
  config: DefaultProviderRegistryConfig = {},
): ProviderRegistry {
  const entries: ProviderRegistryEntries = {};

  if (config.decision?.apiKey?.trim()) {
    entries.decision = {
      jev: createJevDecisionProvider({
        apiKey: config.decision.apiKey,
        modelId: config.decision.modelId,
        threshold: config.decision.threshold,
      }),
    };
  }

  if (config.embedding?.apiKey?.trim()) {
    entries.embedding = {
      openrouter: createOpenRouterEmbeddingProvider({
        apiKey: config.embedding.apiKey,
        modelId: config.embedding.modelId,
        ...(config.embedding.baseUrl ? { baseUrl: config.embedding.baseUrl } : {}),
      }),
    };
  }

  if (config.search?.apiKey?.trim()) {
    entries.search = {
      tavily: createTavilySearchProvider({
        apiKey: config.search.apiKey,
        baseUrl: config.search.baseUrl,
      }),
    };
  }

  if (config.vision?.apiKey?.trim()) {
    entries.vision = {
      openrouter: createOpenRouterVisionProvider({
        apiKey: config.vision.apiKey,
        modelId: config.vision.modelId,
        ...(config.vision.baseUrl ? { baseUrl: config.vision.baseUrl } : {}),
      }),
    };
  }

  if (config.reasoning?.apiKey?.trim()) {
    entries.reasoning = {
      openrouter: createOpenRouterReasoningProvider({
        apiKey: config.reasoning.apiKey,
        modelId: config.reasoning.modelId,
        ...(config.reasoning.baseUrl ? { baseUrl: config.reasoning.baseUrl } : {}),
      }),
    };
  }

  return createProviderRegistry(entries);
}

export function createDefaultProviderRegistryFromEnv(
  env: Record<string, string | undefined> = process.env,
): ProviderRegistry {
  return createDefaultProviderRegistry({
    decision: {
      apiKey: env.AI_GATEWAY_API_KEY,
      modelId: env.JEV_MODEL ?? env.DECISION_MODEL,
    },
    embedding: {
      apiKey: env.OPENROUTER_API_KEY,
      modelId: env.EMBEDDING_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL,
    },
    search: {
      apiKey: env.TAVILY_API_KEY,
      baseUrl: env.SEARCH_BASE_URL,
    },
    vision: {
      apiKey: env.OPENROUTER_API_KEY,
      modelId: env.VISION_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL,
    },
    reasoning: {
      apiKey: env.OPENROUTER_API_KEY,
      modelId: env.REASONING_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL,
    },
  });
}
