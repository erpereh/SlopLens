import { describe, expect, it } from "vitest";

import { resolveAllProviderConfigs, resolveProviderConfig } from "./resolve";
import type { ProviderSelection } from "./selection";

const embeddingUser: ProviderSelection = {
  capability: "embedding",
  providerId: "user-provider",
  modelId: "user-model",
};

const embeddingEnv: ProviderSelection = {
  capability: "embedding",
  providerId: "env-provider",
  modelId: "env-model",
};

describe("resolveProviderConfig", () => {
  it("prefers the user selection over env", () => {
    const resolved = resolveProviderConfig({
      capability: "embedding",
      userSelection: embeddingUser,
      envSelection: embeddingEnv,
    });
    expect(resolved.source).toBe("user");
    expect(resolved.selection?.providerId).toBe("user-provider");
  });

  it("falls back to env when the user has no selection", () => {
    const resolved = resolveProviderConfig({
      capability: "embedding",
      userSelection: null,
      envSelection: embeddingEnv,
    });
    expect(resolved.source).toBe("env");
    expect(resolved.selection?.providerId).toBe("env-provider");
  });

  it("returns unconfigured when neither user nor env is usable", () => {
    const resolved = resolveProviderConfig({
      capability: "embedding",
    });
    expect(resolved.source).toBe("unconfigured");
    expect(resolved.selection).toBeNull();
  });

  it("ignores a user selection for a different capability", () => {
    const resolved = resolveProviderConfig({
      capability: "search",
      userSelection: embeddingUser,
      envSelection: null,
    });
    expect(resolved.source).toBe("unconfigured");
  });
});

describe("resolveAllProviderConfigs", () => {
  it("reads bootstrap env keys without hardcoding model ids in domain", () => {
    const resolved = resolveAllProviderConfigs({
      env: {
        EMBEDDING_PROVIDER: "openrouter",
        EMBEDDING_MODEL: "any-configured-model",
        SEARCH_PROVIDER: "tavily",
      },
    });
    expect(resolved.embedding.source).toBe("env");
    expect(resolved.embedding.selection?.modelId).toBe("any-configured-model");
    expect(resolved.search.source).toBe("env");
    expect(resolved.decision.source).toBe("unconfigured");
    expect(resolved.vision.source).toBe("unconfigured");
    expect(resolved.reasoning.source).toBe("unconfigured");
  });
});
