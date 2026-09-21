import {
  type EmbeddingProvider,
  type EmbeddingVector,
  embeddingVectorSchema,
} from "../../providers/embedding";
import { DEFAULT_EMBEDDING_MODEL_ID, DEFAULT_OPENROUTER_BASE_URL, PROVIDER_IDS } from "../defaults";
import { type OpenRouterClientConfig, openRouterFetch } from "./client";

interface OpenRouterEmbeddingResponse {
  data?: Array<{ embedding?: unknown }>;
}

function parseEmbeddingVector(modelId: string, raw: unknown): EmbeddingVector {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("OpenRouter returned an empty embedding");
  }
  const values = raw.map((value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error("OpenRouter embedding contains non-numeric values");
    }
    return value;
  });
  const dimensions = values.length;
  return embeddingVectorSchema.parse({
    modelId,
    dimensions,
    values,
  });
}

export interface OpenRouterEmbeddingProviderConfig extends OpenRouterClientConfig {
  modelId?: string;
}

export function createOpenRouterEmbeddingProvider(
  config: OpenRouterEmbeddingProviderConfig,
): EmbeddingProvider {
  const modelId = config.modelId ?? DEFAULT_EMBEDDING_MODEL_ID;
  const baseUrl = config.baseUrl ?? DEFAULT_OPENROUTER_BASE_URL;

  return {
    providerId: PROVIDER_IDS.embedding,
    async embed(text: string): Promise<EmbeddingVector> {
      const vectors = await this.embedMany([text]);
      const vector = vectors[0];
      if (!vector) {
        throw new Error("OpenRouter returned no embedding");
      }
      return vector;
    },
    async embedMany(texts: ReadonlyArray<string>): Promise<EmbeddingVector[]> {
      if (texts.length === 0) {
        return [];
      }

      const response = await openRouterFetch<OpenRouterEmbeddingResponse>(
        { ...config, baseUrl },
        "/embeddings",
        {
          capability: "embedding",
          method: "POST",
          body: JSON.stringify({
            model: modelId,
            input: texts.length === 1 ? texts[0] : texts,
            encoding_format: "float",
          }),
        },
      );

      const rows = response.data ?? [];
      if (rows.length !== texts.length) {
        throw new Error(`OpenRouter returned ${rows.length} embeddings for ${texts.length} inputs`);
      }

      return rows.map((row) => parseEmbeddingVector(modelId, row.embedding));
    },
  };
}
