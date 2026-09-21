import type { ProviderCapability } from "@sloplens/config";

/** Provider ids registered by `createDefaultProviderRegistry` when credentials are present. */
export const BOOTSTRAP_PROVIDER_IDS: Record<ProviderCapability, readonly string[]> = {
  decision: ["jev"],
  embedding: ["openrouter"],
  search: ["tavily"],
  vision: ["openrouter"],
  reasoning: ["openrouter"],
};
