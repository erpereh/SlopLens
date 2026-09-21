import { EmbeddingDimensionMismatchError } from "@sloplens/ai";
import { describe, expect, it } from "vitest";

import { PGVECTOR_EMBEDDING_DIMENSIONS } from "./embedding-dimensions";
import { assertPersistableEmbedding, toVectorLiteral } from "./embeddings";

describe("assertPersistableEmbedding", () => {
  it("accepts a vector whose length matches the verified column dimension", () => {
    const values = Array.from({ length: PGVECTOR_EMBEDDING_DIMENSIONS }, () => 0.1);
    expect(() =>
      assertPersistableEmbedding({
        modelId: "test-embed",
        dimensions: PGVECTOR_EMBEDDING_DIMENSIONS,
        values,
      }),
    ).not.toThrow();
  });

  it("rejects persist when values.length does not match the column dim", () => {
    expect(() =>
      assertPersistableEmbedding({
        modelId: "test-embed",
        dimensions: 8,
        values: [0.1, 0.2, 0.3],
      }),
    ).toThrow(EmbeddingDimensionMismatchError);
  });
});

describe("toVectorLiteral", () => {
  it("serializes finite numbers", () => {
    expect(toVectorLiteral([1, 2.5, -0.1])).toBe("[1,2.5,-0.1]");
  });
});
