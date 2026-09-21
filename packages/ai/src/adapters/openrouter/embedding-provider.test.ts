import { describe, expect, it, vi } from "vitest";

import { assertEmbeddingDimensions } from "../../providers/embedding";
import { createOpenRouterEmbeddingProvider } from "./embedding-provider";

describe("createOpenRouterEmbeddingProvider", () => {
  it("derives dimensions from the returned float vector length", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        data: [{ embedding: [0.1, 0.2, 0.3, 0.4] }],
      }),
    );

    const provider = createOpenRouterEmbeddingProvider({
      apiKey: "or-key",
      modelId: "test-embed-model",
      fetchImpl,
    });

    const vector = await provider.embed("hello");
    expect(vector.dimensions).toBe(4);
    expect(vector.values).toHaveLength(4);
    expect(vector.modelId).toBe("test-embed-model");
    expect(() => assertEmbeddingDimensions(vector, 4)).not.toThrow();

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"encoding_format":"float"'),
      }),
    );
  });

  it("embedMany returns one vector per input", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        data: [{ embedding: [1, 2] }, { embedding: [3, 4, 5] }],
      }),
    );

    const provider = createOpenRouterEmbeddingProvider({
      apiKey: "or-key",
      fetchImpl,
    });

    const vectors = await provider.embedMany(["a", "b"]);
    expect(vectors).toHaveLength(2);
    expect(vectors[0]?.dimensions).toBe(2);
    expect(vectors[1]?.dimensions).toBe(3);
  });
});
