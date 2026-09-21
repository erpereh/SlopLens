import {
  createJevDecisionProvider,
  createOpenRouterEmbeddingProvider,
  createOpenRouterReasoningProvider,
  createOpenRouterVisionProvider,
  createTavilySearchProvider,
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
  requireDecision(): Promise<DecisionProvider>;
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

  return {
    async requireDecision() {
      const selection = await resolveSelection("decision");
      const apiKey = await requireSecret("decision", selection.providerId);
      if (selection.providerId !== "jev") {
        throw providerNotConfigured(
          "decision",
          `Unsupported decision provider: ${selection.providerId}`,
        );
      }
      return createJevDecisionProvider({
        apiKey,
        modelId: selection.modelId,
      });
    },

    async requireEmbedding() {
      const selection = await resolveSelection("embedding");
      const apiKey = await requireSecret("embedding", selection.providerId);
      if (selection.providerId !== "openrouter") {
        throw providerNotConfigured(
          "embedding",
          `Unsupported embedding provider: ${selection.providerId}`,
        );
      }
      return {
        provider: createOpenRouterEmbeddingProvider({
          apiKey,
          modelId: selection.modelId,
          ...(selection.baseUrl ? { baseUrl: selection.baseUrl } : {}),
        }),
        selection,
      };
    },

    async requireSearch() {
      const selection = await resolveSelection("search");
      const apiKey = await requireSecret("search", selection.providerId);
      if (selection.providerId !== "tavily") {
        throw providerNotConfigured(
          "search",
          `Unsupported search provider: ${selection.providerId}`,
        );
      }
      return createTavilySearchProvider({
        apiKey,
        baseUrl: selection.baseUrl,
      });
    },

    async optionalVision() {
      try {
        const selection = await resolveSelection("vision");
        const apiKey = await requireSecret("vision", selection.providerId);
        if (selection.providerId !== "openrouter") {
          return null;
        }
        return createOpenRouterVisionProvider({
          apiKey,
          modelId: selection.modelId,
          ...(selection.baseUrl ? { baseUrl: selection.baseUrl } : {}),
        });
      } catch {
        return null;
      }
    },

    async optionalReasoning() {
      try {
        const selection = await resolveSelection("reasoning");
        const apiKey = await requireSecret("reasoning", selection.providerId);
        if (selection.providerId !== "openrouter") {
          return null;
        }
        return createOpenRouterReasoningProvider({
          apiKey,
          modelId: selection.modelId,
          ...(selection.baseUrl ? { baseUrl: selection.baseUrl } : {}),
        });
      } catch {
        return null;
      }
    },
  };
}
