import { z } from "zod";

export const embeddingVectorSchema = z
  .object({
    modelId: z.string().min(1),
    dimensions: z.number().int().positive(),
    values: z.array(z.number()).min(1),
  })
  .strict();

export type EmbeddingVector = z.infer<typeof embeddingVectorSchema>;

export interface EmbeddingProvider {
  readonly providerId: string;
  embed(text: string): Promise<EmbeddingVector>;
  embedMany(texts: ReadonlyArray<string>): Promise<EmbeddingVector[]>;
}

export class EmbeddingDimensionMismatchError extends Error {
  readonly modelId: string;
  readonly expectedDimensions: number;
  readonly actualDimensions: number;

  constructor(modelId: string, expectedDimensions: number, actualDimensions: number) {
    super(
      `Embedding dimension mismatch for model "${modelId}": expected ${expectedDimensions}, got ${actualDimensions}`,
    );
    this.name = "EmbeddingDimensionMismatchError";
    this.modelId = modelId;
    this.expectedDimensions = expectedDimensions;
    this.actualDimensions = actualDimensions;
  }
}

/**
 * Rejects embeddings whose declared or observed length does not match the verified
 * dimension of the active model. The expected dimension is supplied by the caller
 * after verification; this helper never assumes a magic size.
 */
export function assertEmbeddingDimensions(
  embedding: EmbeddingVector,
  expectedDimensions: number,
): void {
  const actualDimensions = embedding.values.length;
  if (
    expectedDimensions <= 0 ||
    embedding.dimensions !== expectedDimensions ||
    actualDimensions !== expectedDimensions
  ) {
    throw new EmbeddingDimensionMismatchError(
      embedding.modelId,
      expectedDimensions,
      actualDimensions,
    );
  }
}
