import type { SearchResult } from "@sloplens/ai";
import type { TraceRequest, TraceResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { findContentItemByHash } from "../db/content-cache";
import { insertContentRelation, listRelationsFromContent } from "../db/relations";
import { classifySourceKind, rankSearchResults } from "./primary-sources";
import type { ProviderRuntime } from "./provider-runtime";
import { createRelatedService } from "./related-service";

export function createTraceService(input: { sql: postgres.Sql | null; runtime: ProviderRuntime }) {
  const related = createRelatedService(input);

  return {
    async trace(request: TraceRequest): Promise<TraceResponse> {
      const search = await input.runtime.requireSearch();
      const query = buildTraceQuery(request);
      const results = await search.search(query, { maxResults: 8, topic: "news" });
      const ranked = rankSearchResults(results);

      let similar: TraceResponse["graph"]["similar"] = [];
      try {
        const relatedResult = await related.related({ content: request.content, limit: 6 });
        similar = relatedResult.items.map((item) => ({
          url: item.url,
          ...(item.title ? { title: item.title } : {}),
          platform: item.platform,
          score: item.score,
          relation: "related_to" as const,
        }));
      } catch {
        similar = [];
      }

      const contentHash = hashNormalizedContent(request.content);
      const storedItem = input.sql ? await findContentItemByHash(input.sql, contentHash) : null;
      const storedRelations =
        input.sql && storedItem ? await listRelationsFromContent(input.sql, storedItem.id) : [];

      const derivations = storedRelations
        .filter((row) => row.relationType === "derived_from" || row.relationType === "copies")
        .map((row) => ({
          url: row.toUrl,
          relation: row.relationType,
        }));

      const originResult = pickOriginCandidate(ranked);
      const origin = originResult
        ? {
            url: originResult.url,
            title: originResult.title,
          }
        : undefined;

      if (input.sql && origin && storedItem) {
        await insertContentRelation({
          sql: input.sql,
          fromContentId: storedItem.id,
          toUrl: origin.url,
          relationType: "originates_from",
          summary: origin.title,
        });
      }

      const evidence = ranked.slice(0, 5).map((result) => ({
        summary: result.snippet?.trim() || result.title,
        sourceUrl: result.url,
      }));

      const hasGraph = Boolean(origin) || similar.length > 0 || derivations.length > 0;
      if (!hasGraph) {
        return {
          status: "insufficient_evidence",
          graph: { similar: [], derivations: [] },
          evidence: [],
        };
      }

      return {
        status: "ok",
        graph: {
          ...(origin ? { origin } : {}),
          similar,
          derivations,
        },
        evidence,
      };
    },
  };
}

function buildTraceQuery(request: TraceRequest): string {
  const parts = [request.content.title, request.content.text, request.content.author].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  return parts.join(" ").slice(0, 500) || request.content.url;
}

function pickOriginCandidate(results: ReadonlyArray<SearchResult>): SearchResult | undefined {
  const primary = results.find((result) => classifySourceKind(result.url) === "primary");
  if (primary) {
    return primary;
  }
  const dated = [...results].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : Number.POSITIVE_INFINITY;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
  return dated[0];
}
