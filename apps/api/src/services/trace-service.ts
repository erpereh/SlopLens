import type { SearchResult } from "@sloplens/ai";
import { extractCanonicalClaim } from "@sloplens/core";
import type { TraceRequest, TraceResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { findContentItemByHash } from "../db/content-cache";
import { hasRelation, insertContentRelation, listRelationsFromContent } from "../db/relations";
import { classifySourceKind, rankSearchResults } from "./primary-sources";
import type { ProviderRuntime } from "./provider-runtime";
import { createRelatedService } from "./related-service";
import { filterAndRerankSearchResults, truncateEvidenceSummary } from "./relevance";

const INSUFFICIENT_ORIGIN =
  "There is not enough independent evidence to identify an origin. Treat any candidate as a hypothesis.";

export function createTraceService(input: { sql: postgres.Sql | null; runtime: ProviderRuntime }) {
  const related = createRelatedService(input);

  return {
    async trace(request: TraceRequest): Promise<TraceResponse> {
      const ranked = await runOptionalSearch(input.runtime, request);
      const relatedOutcome = await loadRelated(related, request);

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
      const possibleOrigin = originResult ? toPossibleOrigin(originResult) : undefined;
      const origin = possibleOrigin
        ? {
            url: possibleOrigin.url,
            ...(possibleOrigin.title ? { title: possibleOrigin.title } : {}),
          }
        : undefined;

      if (input.sql && origin && storedItem) {
        const exists = await hasRelation({
          sql: input.sql,
          fromContentId: storedItem.id,
          toUrl: origin.url,
          relationType: "originates_from",
        });
        if (!exists) {
          await insertContentRelation({
            sql: input.sql,
            fromContentId: storedItem.id,
            toUrl: origin.url,
            relationType: "originates_from",
            summary: possibleOrigin?.whyThisMayBeTheOrigin ?? origin.title,
          });
        }
      }

      const evidence = ranked.slice(0, 5).map((result) => ({
        summary: truncateEvidenceSummary(result.snippet?.trim() || result.title),
        sourceUrl: result.url,
      }));

      const similar = relatedOutcome.items;
      const hasSearchEvidence = evidence.length > 0;
      const hasSimilar = similar.length > 0;
      const hasDerivations = derivations.length > 0;
      if (!hasSearchEvidence && !hasSimilar && !hasDerivations) {
        return {
          status: "insufficient_evidence",
          graph: { similar: [], derivations: [] },
          uncertainty: INSUFFICIENT_ORIGIN,
          evidence: [],
          relatedVersions: [],
          possibleDerivatives: [],
        };
      }

      return {
        status: "ok",
        graph: {
          ...(origin ? { origin } : {}),
          similar,
          derivations,
        },
        ...(possibleOrigin ? { possibleOrigin } : {}),
        relatedVersions: similar,
        possibleDerivatives: derivations,
        uncertainty: possibleOrigin
          ? "This is a possible earlier source, not a confirmed origin."
          : INSUFFICIENT_ORIGIN,
        evidence,
      };
    },
  };
}

async function loadRelated(
  related: ReturnType<typeof createRelatedService>,
  request: TraceRequest,
): Promise<{ items: TraceResponse["graph"]["similar"]; failed: boolean }> {
  try {
    const relatedResult = await related.related({ content: request.content, limit: 6 });
    return {
      failed: false,
      items: relatedResult.items.map((item) => ({
        url: item.url,
        ...(item.title ? { title: item.title } : {}),
        platform: item.platform,
        score: item.score,
        relation: "related_to" as const,
      })),
    };
  } catch {
    return { items: [], failed: true };
  }
}

async function runOptionalSearch(
  runtime: ProviderRuntime,
  request: TraceRequest,
): Promise<SearchResult[]> {
  try {
    const search = await runtime.requireSearch();
    const query = extractCanonicalClaim(request.content);
    const results = await search.search(query, { maxResults: 8, topic: "news" });
    return rankSearchResults(filterAndRerankSearchResults(query, results));
  } catch {
    return [];
  }
}

function pickOriginCandidate(results: ReadonlyArray<SearchResult>): SearchResult | undefined {
  if (results.length === 0) {
    return undefined;
  }
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

function toPossibleOrigin(result: SearchResult): NonNullable<TraceResponse["possibleOrigin"]> {
  const kind = classifySourceKind(result.url);
  const primary = kind === "primary" || kind === "academic" || kind === "agency";
  return {
    url: result.url,
    ...(result.title ? { title: result.title } : {}),
    ...(result.publishedAt ? { publishedAt: result.publishedAt } : {}),
    whyThisMayBeTheOrigin: originReason(result, primary),
    confidence: primary ? "medium" : "low",
  };
}

function originReason(result: SearchResult, primary: boolean): string {
  if (primary) {
    return "This domain looks like a primary, academic, or agency publisher. That is a heuristic, not proof of origin.";
  }
  if (result.publishedAt) {
    return "This is the earliest dated result among relevant matches. Earlier is not the same as origin.";
  }
  return "This was the strongest remaining match after relevance filtering. It is a candidate, not a confirmed origin.";
}

export { pickOriginCandidate, toPossibleOrigin };
