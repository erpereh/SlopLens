import { PGVECTOR_EMBEDDING_DIMENSIONS } from "@sloplens/config";
import { describe, expect, it, vi } from "vitest";

import { HttpError } from "../lib/http-errors";
import { createRelatedService } from "./related-service";
import { mockEmbeddingProvider, mockRuntime, sampleContent } from "./test-providers";

describe("related service", () => {
  it("requires the database for pgvector neighbors", async () => {
    const service = createRelatedService({
      sql: null,
      runtime: mockRuntime(),
    });
    await expect(service.related({ content: sampleContent })).rejects.toBeInstanceOf(HttpError);
    await expect(service.related({ content: sampleContent })).rejects.toMatchObject({
      body: { code: "backend_unavailable" },
    });
  });

  it("persists embeddings using modelId returned from embed() when selection has no modelId", async () => {
    const embedModelId = "observed-embed-model";
    const values = Array.from({ length: PGVECTOR_EMBEDDING_DIMENSIONS }, () => 0.01);
    const provider = mockEmbeddingProvider(values, embedModelId);
    const embedSpy = vi.spyOn(provider, "embed");

    const contentItemId = "11111111-1111-1111-1111-111111111111";
    let persistedModelId: string | undefined;

    const sql = Object.assign(
      async (strings: TemplateStringsArray, ..._values: unknown[]) => {
        const query = strings.join(" ");
        if (query.includes("from public.content_items") && query.includes("content_hash")) {
          return [];
        }
        if (query.includes("insert into public.content_items")) {
          return [{ id: contentItemId }];
        }
        if (query.includes("from public.content_embeddings") && query.includes("model_id")) {
          return [];
        }
        if (query.includes("insert into public.content_embeddings")) {
          persistedModelId = _values.find((value) => value === embedModelId) as string | undefined;
          return [];
        }
        if (query.includes("content_embeddings ce")) {
          return [];
        }
        if (query.includes("content_relations")) {
          return [];
        }
        if (query.includes("insert into public.clusters")) {
          return [];
        }
        return [];
      },
      {
        json: (value: unknown) => value,
        unsafe: (text: string) => text,
      },
    );

    const service = createRelatedService({
      sql: sql as never,
      runtime: mockRuntime({
        requireEmbedding: async () => ({
          provider,
          selection: { capability: "embedding", providerId: "openrouter" },
        }),
      }),
    });

    const result = await service.related({ content: sampleContent });
    expect(embedSpy).toHaveBeenCalledOnce();
    expect(persistedModelId).toBe(embedModelId);
    expect(result.items).toEqual([]);
  });

  it("skips neighbor rows whose url cannot be parsed", async () => {
    const values = Array.from({ length: PGVECTOR_EMBEDDING_DIMENSIONS }, () => 0.01);
    const provider = mockEmbeddingProvider(values, "observed-embed-model");
    const sql = Object.assign(
      async (strings: TemplateStringsArray) => {
        const query = strings.join(" ");
        if (query.includes("from public.content_items")) {
          return [{ id: "11111111-1111-1111-1111-111111111111" }];
        }
        if (query.includes("content_embeddings ce")) {
          return [
            {
              contentItemId: "22222222-2222-2222-2222-222222222222",
              url: "not a url",
              platform: "x",
              title: "Bad",
              score: 0.9,
            },
            {
              contentItemId: "33333333-3333-3333-3333-333333333333",
              url: "https://x.com/ok/status/1",
              platform: "x",
              title: "Good",
              score: 0.8,
            },
          ];
        }
        return [];
      },
      { json: (value: unknown) => value, unsafe: (text: string) => text },
    );

    const service = createRelatedService({
      sql: sql as never,
      runtime: mockRuntime({
        requireEmbedding: async () => ({
          provider,
          selection: {
            capability: "embedding",
            providerId: "openrouter",
            modelId: "observed-embed-model",
          },
        }),
      }),
    });

    const result = await service.related({ content: sampleContent });
    expect(result.items).toEqual([
      { url: "https://x.com/ok/status/1", platform: "x", score: 0.8, title: "Good" },
    ]);
  });
});
