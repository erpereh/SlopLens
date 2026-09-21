import type { ReasoningProvider, SearchResult } from "@sloplens/ai";
import type { VerifyEvidence, VerifyRequest, VerifyResponse, VerifySource } from "@sloplens/shared";
import type postgres from "postgres";

import { hashNormalizedContent } from "../content-hash";
import { findCachedAnalysisByHash } from "../db/content-cache";
import { toPostgresJson } from "../db/json";
import { classifySourceKind, rankSearchResults } from "./primary-sources";
import type { ProviderRuntime } from "./provider-runtime";

const SUPPORT_RE = /\b(confirm|confirmed|true|according to|official|announced)\b/i;
const CONTRADICT_RE = /\b(false|not true|debunked|denied|hoax|no evidence|unfounded)\b/i;

export function createVerifyService(input: { sql: postgres.Sql | null; runtime: ProviderRuntime }) {
  return {
    async verify(request: VerifyRequest): Promise<VerifyResponse> {
      const search = await input.runtime.requireSearch();
      const results = await search.search(request.claim, {
        maxResults: 8,
        topic: "general",
      });
      const ranked = rankSearchResults(results);

      if (ranked.length === 0) {
        return {
          status: "insufficient_evidence",
          claim: request.claim,
          sources: [],
          evidence: [],
        };
      }

      const heuristic = heuristicEvidence(request.claim, ranked);
      const needsReasoning = await shouldUseReasoning(input, request, heuristic);
      const evidence = needsReasoning
        ? await reasonAboutEvidence(input.runtime, request.claim, ranked, heuristic)
        : heuristic;

      const sources: VerifySource[] = ranked.map((result) => ({
        url: result.url,
        title: result.title,
        kind: classifySourceKind(result.url),
      }));

      if (input.sql && request.content) {
        await persistClaim(input.sql, request, sources);
      }

      const hasSignal = evidence.some((item) => item.stance !== "neutral");
      return {
        status: hasSignal ? "ok" : "insufficient_evidence",
        claim: request.claim,
        sources,
        evidence,
      };
    },
  };
}

async function shouldUseReasoning(
  input: { sql: postgres.Sql | null; runtime: ProviderRuntime },
  request: VerifyRequest,
  heuristic: VerifyEvidence[],
): Promise<boolean> {
  const stances = new Set(heuristic.map((item) => item.stance));
  const ambiguous =
    (stances.has("supports") && stances.has("contradicts")) ||
    heuristic.every((item) => item.stance === "neutral");

  if (ambiguous) {
    return true;
  }

  if (!request.content || !input.sql) {
    return false;
  }

  const cached = await findCachedAnalysisByHash(input.sql, hashNormalizedContent(request.content));
  return cached?.decision.needsPowerfulModel === true;
}

function heuristicEvidence(claim: string, results: ReadonlyArray<SearchResult>): VerifyEvidence[] {
  return results.map((result) => {
    const blob = `${result.title} ${result.snippet ?? ""}`;
    let stance: VerifyEvidence["stance"] = "neutral";
    if (CONTRADICT_RE.test(blob)) {
      stance = "contradicts";
    } else if (
      SUPPORT_RE.test(blob) ||
      blob.toLowerCase().includes(claim.slice(0, 40).toLowerCase())
    ) {
      stance = "supports";
    }
    return {
      stance,
      summary: result.snippet?.trim() || result.title,
      sourceUrl: result.url,
    };
  });
}

async function reasonAboutEvidence(
  runtime: ProviderRuntime,
  claim: string,
  results: ReadonlyArray<SearchResult>,
  fallback: VerifyEvidence[],
): Promise<VerifyEvidence[]> {
  const reasoning = await runtime.optionalReasoning();
  if (!reasoning) {
    return fallback;
  }

  try {
    const parsed = await parseReasoningEvidence(reasoning, claim, results);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

async function parseReasoningEvidence(
  reasoning: ReasoningProvider,
  claim: string,
  results: ReadonlyArray<SearchResult>,
): Promise<VerifyEvidence[]> {
  const result = await reasoning.complete({
    prompt: `Assess the search results as evidence for the claim. Do not invent URLs. Never treat a search-engine answer field as a verdict. Return JSON only: {"evidence":[{"stance":"supports"|"contradicts"|"neutral","summary":"...","sourceUrl":"..."}]}.
Claim: ${claim}
Results: ${JSON.stringify(results.map((row) => ({ url: row.url, title: row.title, snippet: row.snippet })))}`,
  });

  const jsonText = extractJsonObject(result.text);
  if (!jsonText) {
    return [];
  }
  const parsed = JSON.parse(jsonText) as { evidence?: VerifyEvidence[] };
  if (!Array.isArray(parsed.evidence)) {
    return [];
  }
  return parsed.evidence.filter(
    (item) =>
      item &&
      (item.stance === "supports" || item.stance === "contradicts" || item.stance === "neutral") &&
      typeof item.summary === "string" &&
      item.summary.length > 0,
  );
}

function extractJsonObject(text: string): string | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }
  return raw.slice(start, end + 1);
}

async function persistClaim(
  sql: postgres.Sql,
  request: VerifyRequest,
  sources: readonly VerifySource[],
): Promise<void> {
  const contentHash = request.content ? hashNormalizedContent(request.content) : null;
  const contentRows = contentHash
    ? await sql<{ id: string }[]>`
        select id from public.content_items where content_hash = ${contentHash} limit 1
      `
    : [];
  const contentItemId = contentRows[0]?.id ?? null;

  await sql`
    insert into public.claims (content_item_id, claim_text)
    values (${contentItemId}, ${request.claim})
  `;

  for (const source of sources) {
    await sql`
      insert into public.sources (url, title, kind, metadata)
      values (
        ${source.url},
        ${source.title ?? null},
        ${source.kind ?? null},
        ${sql.json(toPostgresJson({}))}
      )
      on conflict (url) do update
        set title = coalesce(excluded.title, public.sources.title),
            kind = coalesce(excluded.kind, public.sources.kind)
    `;
  }
}

export { heuristicEvidence };
