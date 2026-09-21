import {
  createDefaultProviderRegistry,
  type DecisionProvider,
  type EmbeddingProvider,
  type ReasoningProvider,
  type SearchProvider,
  type VisionProvider,
} from "@sloplens/ai";
import type { ProviderCapability, ProviderSelection, SecretStore } from "@sloplens/config";
import { providerNotConfigured } from "../lib/http-errors";
import { resolveProviderSecret } from "./secrets-resolver";
import type { SettingsService } from "./settings-service";

export interface ProviderRuntime {
  requireDecision(): Promise<{ provider: DecisionProvider; selection: ProviderSelection }>;
  requireEmbedding(): Promise<{ provider: EmbeddingProvider; selection: ProviderSelection }>;
  requireSearch(): Promise<SearchProvider>;
  optionalVision(): Promise<VisionProvider | null>;
  optionalReasoning(): Promise<ReasoningProvider | null>;
}

export function createProviderRuntime(input: {
  settings: SettingsService;
  secretStore: SecretStore;
  env: NodeJS.ProcessEnv;
}): ProviderRuntime {
  async function resolveSelection(capability: ProviderCapability): Promise<ProviderSelection> {
    const settings = await input.settings.getSettings();
    const selection = settings.selections.find((item) => item.capability === capability);
    if (!selection?.providerId.trim()) {
      throw providerNotConfigured(capability);
    }
    return selection;
  }

  async function requireSecret(
    capability: ProviderCapability,
    providerId: string,
  ): Promise<string> {
    const secret = await resolveProviderSecret({
      capability,
      providerId,
      secretStore: input.secretStore,
      env: input.env,
    });
    if (!secret?.trim()) {
      throw providerNotConfigured(capability, `${capability} provider is not configured`);
    }
    return secret;
  }

  async function registryForCapability(
    capability: ProviderCapability,
    selection: ProviderSelection,
    apiKey: string,
  ) {
    const baseUrl = selection.baseUrl;
    const modelId = selection.modelId;
    switch (capability) {
      case "decision":
        return createDefaultProviderRegistry({
          decision: { apiKey, modelId },
        });
      case "embedding":
        return createDefaultProviderRegistry({
          embedding: { apiKey, modelId, ...(baseUrl ? { baseUrl } : {}) },
        });
      case "search":
        return createDefaultProviderRegistry({
          search: { apiKey, ...(baseUrl ? { baseUrl } : {}) },
        });
      case "vision":
        return createDefaultProviderRegistry({
          vision: { apiKey, modelId, ...(baseUrl ? { baseUrl } : {}) },
        });
      case "reasoning":
        return createDefaultProviderRegistry({
          reasoning: { apiKey, modelId, ...(baseUrl ? { baseUrl } : {}) },
        });
      default:
        throw providerNotConfigured(capability);
    }
  }

  return {
    async requireDecision() {
      const selection = await resolveSelection("decision");
      const apiKey = await requireSecret("decision", selection.providerId);
      const registry = await registryForCapability("decision", selection, apiKey);
      const provider = registry.getDecision(selection.providerId);
      if (!provider) {
        throw providerNotConfigured(
          "decision",
          `Unsupported decision provider: ${selection.providerId}`,
        );
      }
      return { provider, selection };
    },

    async requireEmbedding() {
      const selection = await resolveSelection("embedding");
      const apiKey = await requireSecret("embedding", selection.providerId);
      const registry = await registryForCapability("embedding", selection, apiKey);
      const provider = registry.getEmbedding(selection.providerId);
      if (!provider) {
        throw providerNotConfigured(
          "embedding",
          `Unsupported embedding provider: ${selection.providerId}`,
        );
      }
      return { provider, selection };
    },

    async requireSearch() {
      const selection = await resolveSelection("search");
      const apiKey = await requireSecret("search", selection.providerId);
      const registry = await registryForCapability("search", selection, apiKey);
      const provider = registry.getSearch(selection.providerId);
      if (!provider) {
        throw providerNotConfigured(
          "search",
          `Unsupported search provider: ${selection.providerId}`,
        );
      }
      return provider;
    },

    async optionalVision() {
      try {
        const selection = await resolveSelection("vision");
        const apiKey = await requireSecret("vision", selection.providerId);
        const registry = await registryForCapability("vision", selection, apiKey);
        return registry.getVision(selection.providerId) ?? null;
      } catch {
        return null;
      }
    },

    async optionalReasoning() {
      try {
        const selection = await resolveSelection("reasoning");
        const apiKey = await requireSecret("reasoning", selection.providerId);
        const registry = await registryForCapability("reasoning", selection, apiKey);
        return registry.getReasoning(selection.providerId) ?? null;
      } catch {
        return null;
      }
    },
  };
}
