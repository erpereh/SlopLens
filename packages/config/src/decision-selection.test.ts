import { describe, expect, it } from "vitest";

import {
  isLegacyDecisionSelection,
  normalizeDecisionSelection,
  normalizeProviderSelections,
  providerSelectionsEqual,
} from "./decision-selection";
import type { ProviderSelection } from "./selection";

describe("normalizeDecisionSelection", () => {
  it("rewrites jev and typesafe-ai/jev to typesafe + jev-latest", () => {
    const fromProvider = normalizeDecisionSelection({
      capability: "decision",
      providerId: "jev",
      modelId: "typesafe-ai/jev",
    });
    expect(fromProvider).toEqual({
      capability: "decision",
      providerId: "typesafe",
      modelId: "jev-latest",
    });

    const fromModel = normalizeDecisionSelection({
      capability: "decision",
      providerId: "typesafe",
      modelId: "typesafe-ai/jev",
    });
    expect(fromModel.providerId).toBe("typesafe");
    expect(fromModel.modelId).toBe("jev-latest");
    expect(isLegacyDecisionSelection(fromProvider)).toBe(false);
  });

  it("drops a legacy decision base URL that is not allowlisted for TypeSafe", () => {
    const normalized = normalizeDecisionSelection({
      capability: "decision",
      providerId: "jev",
      modelId: "typesafe-ai/jev",
      baseUrl: "https://ai-gateway.vercel.sh/v1",
    });
    expect(normalized.baseUrl).toBeUndefined();
    expect(normalized.providerId).toBe("typesafe");
  });

  it("keeps an official TypeSafe base URL", () => {
    const normalized = normalizeDecisionSelection({
      capability: "decision",
      providerId: "jev",
      baseUrl: "https://api.typesafe.ai/v1",
    });
    expect(normalized.baseUrl).toBe("https://api.typesafe.ai/v1");
  });

  it("leaves other capabilities unchanged", () => {
    const embedding: ProviderSelection = {
      capability: "embedding",
      providerId: "openrouter",
    };
    expect(normalizeDecisionSelection(embedding)).toBe(embedding);
  });

  it("detects when a list still needs persistence", () => {
    const stored: ProviderSelection[] = [
      { capability: "decision", providerId: "jev", modelId: "typesafe-ai/jev" },
      { capability: "search", providerId: "tavily" },
    ];
    const normalized = normalizeProviderSelections(stored);
    expect(providerSelectionsEqual(stored, normalized)).toBe(false);
    expect(providerSelectionsEqual(normalized, normalized)).toBe(true);
  });
});
