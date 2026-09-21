import { assertEmbeddingDimensions, type EmbeddingVector } from "@sloplens/ai";
import type postgres from "postgres";

import { PGVECTOR_EMBEDDING_DIMENSIONS } from "./embedding-dimensions";
import { pgvectorTypmodSql } from "./pgvector-typmod";

export function toVectorLiteral(values: ReadonlyArray<number>): string {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding values must be a non-empty array of finite numbers");
  }
  return `[${values.join(",")}]`;
}

export function assertPersistableEmbedding(
  embedding: EmbeddingVector,
  columnDimensions: number = PGVECTOR_EMBEDDING_DIMENSIONS,
): void {
  assertEmbeddingDimensions(embedding, columnDimensions);
}

export interface NeighborRow {
  contentItemId: string;
  url: string;
  platform: string;
  title: string | null;
  score: number;
}

export async function findEmbeddingByContentAndModel(
  sql: postgres.Sql,
  contentItemId: string,
  modelId: string,
): Promise<EmbeddingVector | null> {
  const rows = await sql<{ model_id: string; dim: number; embedding: string }[]>`
    select model_id, dim, embedding::text as embedding
    from public.content_embeddings
    where content_item_id = ${contentItemId}
      and model_id = ${modelId}
    limit 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const values = parseVectorText(row.embedding);
  return {
    modelId: row.model_id,
    dimensions: row.dim,
    values,
  };
}

export async function persistEmbedding(input: {
  sql: postgres.Sql;
  contentItemId: string;
  embedding: EmbeddingVector;
}): Promise<void> {
  assertPersistableEmbedding(input.embedding);

  const literal = toVectorLiteral(input.embedding.values);
  const vectorType = pgvectorTypmodSql(input.sql, "vector");
  await input.sql`
    insert into public.content_embeddings (content_item_id, model_id, dim, embedding)
    values (
      ${input.contentItemId},
      ${input.embedding.modelId},
      ${input.embedding.dimensions},
      ${literal}::${vectorType}
    )
    on conflict (content_item_id, model_id) do update
      set dim = excluded.dim,
          embedding = excluded.embedding,
          created_at = now()
  `;
}

export async function findNearestNeighbors(input: {
  sql: postgres.Sql;
  embedding: EmbeddingVector;
  excludeContentItemId?: string;
  limit: number;
}): Promise<NeighborRow[]> {
  assertPersistableEmbedding(input.embedding);

  const literal = toVectorLiteral(input.embedding.values);
  const excludeId = input.excludeContentItemId ?? null;
  const vectorType = pgvectorTypmodSql(input.sql, "vector");
  const halfvecType = pgvectorTypmodSql(input.sql, "halfvec");

  const rows = await input.sql<NeighborRow[]>`
    select
      ci.id as "contentItemId",
      ci.url,
      ci.platform,
      ci.title,
      (1 - ((ce.embedding::${halfvecType}) <=>
        ((${literal}::${vectorType})::${halfvecType})))::float as score
    from public.content_embeddings ce
    inner join public.content_items ci on ci.id = ce.content_item_id
    where ce.model_id = ${input.embedding.modelId}
      and ce.dim = ${PGVECTOR_EMBEDDING_DIMENSIONS}
      and (${excludeId}::uuid is null or ce.content_item_id <> ${excludeId}::uuid)
    order by (ce.embedding::${halfvecType}) <=>
      ((${literal}::${vectorType})::${halfvecType})
    limit ${input.limit}
  `;

  return rows;
}

function parseVectorText(raw: string): number[] {
  const trimmed = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!trimmed) {
    return [];
  }
  return trimmed.split(",").map((part) => Number.parseFloat(part));
}
