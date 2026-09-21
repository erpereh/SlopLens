import { describe, expect, it } from "vitest";

import { createDefaultProviderRegistry } from "./registry-defaults";

describe("createDefaultProviderRegistry", () => {
  it("registers providers only when the corresponding API key is present", () => {
    const registry = createDefaultProviderRegistry({
      decision: { apiKey: "gw-key" },
      embedding: { apiKey: "or-key" },
    });

    expect(registry.has("decision", "typesafe")).toBe(true);
    expect(registry.has("embedding", "openrouter")).toBe(true);
    expect(registry.has("search", "tavily")).toBe(false);
    expect(registry.list("decision")).toEqual([{ capability: "decision", providerId: "typesafe" }]);
  });
});
