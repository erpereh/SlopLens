import { describe, expect, it } from "vitest";

import {
  assertEmbeddingDimensions,
  EmbeddingDimensionMismatchError,
  type EmbeddingVector,
} from "./providers/embedding";

function vector(values: number[], dimensions = values.length): EmbeddingVector {
  return {
    modelId: "test-model",
    dimensions,
    values,
  };
}

describe("assertEmbeddingDimensions", () => {
  it("accepts a vector whose length matches the caller-supplied expected dimension", () => {
    expect(() => assertEmbeddingDimensions(vector([0.1, 0.2, 0.3], 3), 3)).not.toThrow();
  });

  it("rejects when values.length does not match the expected dimension", () => {
    expect(() => assertEmbeddingDimensions(vector([0.1, 0.2], 2), 8)).toThrow(
      EmbeddingDimensionMismatchError,
    );
  });

  it("rejects when the declared dimensions field disagrees with values.length", () => {
    expect(() => assertEmbeddingDimensions(vector([0.1, 0.2, 0.3], 8), 8)).toThrow(
      EmbeddingDimensionMismatchError,
    );
  });

  it("does not assume a magic default dimension", () => {
    const error = (() => {
      try {
        assertEmbeddingDimensions(vector([1, 2, 3, 4], 4), 16);
        return null;
      } catch (caught) {
        return caught;
      }
    })();
    expect(error).toBeInstanceOf(EmbeddingDimensionMismatchError);
    if (error instanceof EmbeddingDimensionMismatchError) {
      expect(error.expectedDimensions).toBe(16);
      expect(error.actualDimensions).toBe(4);
    }
  });
});
