import type { Platform } from "@sloplens/core";
import { platformSchema } from "@sloplens/core";
import type { RelatedRequest, RelatedResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { contentToEmbeddingText } from "../content-text";
import { insertCheapCluster } from "../db/clusters";
import { findContentItemByHash, upsertContentItem } from "../db/content-cache";
import {
  findEmbeddingByContentAndModel,
  findNearestNeighbors,
  persistEmbedding,
} from "../db/embeddings";
import { hasRelation, insertContentRelation } from "../db/relations";
import { backendUnavailable } from "../lib/http-errors";
import type { ProviderRuntime } from "./provider-runtime";

const DEFAULT_LIMIT = 8;
const CLUSTER_SCORE_THRESHOLD = 0.75;

export function createRelatedService(input: {
  sql: postgres.Sql | null;
  runtime: ProviderRuntime;
}) {
  return {
    async related(request: RelatedRequest): Promise<RelatedResponse> {
      if (!input.sql) {
        throw backendUnavailable("Database is unavailable");
      }

      const sql = input.sql;
      const limit = request.limit ?? DEFAULT_LIMIT;
      const contentHash = hashNormalizedContent(request.content);
      const { provider, selection } = await input.runtime.requireEmbedding();

      let contentItemId = (await findContentItemByHash(sql, contentHash))?.id;
      if (!contentItemId) {
        contentItemId = await upsertContentItem({
          sql,
          contentHash,
          platform: request.content.platform,
          url: request.content.url,
          externalId: request.content.externalId,
          title: request.content.title,
          body: request.content.text,
          author: request.content.author,
          publishedAt: request.content.publishedAt,
          metadata: request.content.metadata,
        });
      }

      const selectionModelId = selection.modelId?.trim();
      let embedding =
        selectionModelId
          ? await findEmbeddingByContentAndModel(sql, contentItemId, selectionModelId)
          : null;
      if (!embedding) {
        embedding = await provider.embed(contentToEmbeddingText(request.content));
        await persistEmbedding({ sql, contentItemId, embedding });
      }

      const neighbors = await findNearestNeighbors({
        sql,
        embedding,
        excludeContentItemId: contentItemId,
        limit,
      });

      const clusterMembers = neighbors
        .filter((row) => row.score >= CLUSTER_SCORE_THRESHOLD)
        .map((row) => row.contentItemId);
      if (clusterMembers.length >= 2) {
        await insertCheapCluster({
          sql,
          memberIds: [contentItemId, ...clusterMembers],
        });
      }

      await persistRelatedRelations(sql, contentItemId, neighbors);

      return {
        items: neighbors.flatMap((row) => {
          const platform = platformSchema.safeParse(row.platform);
          if (!platform.success) {
            return [];
          }
          return [
            {
              url: row.url,
              platform: platform.data satisfies Platform,
              score: row.score,
              ...(row.title ? { title: row.title } : {}),
            },
          ];
        }),
      };
    },
  };
}

async function persistRelatedRelations(
  sql: postgres.Sql,
  fromContentId: string,
  neighbors: ReadonlyArray<{ contentItemId: string; url: string; score: number }>,
): Promise<void> {
  for (const neighbor of neighbors) {
    const exists = await hasRelation({
      sql,
      fromContentId,
      toUrl: neighbor.url,
      relationType: "related_to",
    });
    if (exists) {
      continue;
    }
    await insertContentRelation({
      sql,
      fromContentId,
      toContentId: neighbor.contentItemId,
      toUrl: neighbor.url,
      relationType: "related_to",
      summary: `Semantic neighbor score ${neighbor.score.toFixed(3)}`,
    });
  }
}
