import type { ContentDecision } from "@sloplens/core";
import type postgres from "postgres";

import { toPostgresJson } from "./json";

export interface CachedContentAnalysis {
  contentHash: string;
  decision: ContentDecision;
}

export async function findCachedAnalysisByHash(
  sql: postgres.Sql,
  contentHash: string,
): Promise<CachedContentAnalysis | null> {
  const rows = await sql<{ content_hash: string; decision: ContentDecision }[]>`
    select ci.content_hash, ca.decision
    from public.content_items ci
    inner join public.content_analysis ca on ca.content_item_id = ci.id
    where ci.content_hash = ${contentHash}
    limit 1
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    contentHash: row.content_hash,
    decision: row.decision,
  };
}

export async function upsertContentAnalysisCache(input: {
  sql: postgres.Sql;
  contentHash: string;
  platform: string;
  url: string;
  externalId?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  metadata: Record<string, unknown>;
  decision: ContentDecision;
}): Promise<void> {
  const itemRows = await input.sql<{ id: string }[]>`
    insert into public.content_items (
      platform,
      external_id,
      url,
      title,
      body,
      metadata,
      content_hash
    )
    values (
      ${input.platform},
      ${input.externalId ?? null},
      ${input.url},
      ${input.title ?? null},
      ${input.body ?? null},
      ${input.sql.json(toPostgresJson(input.metadata))},
      ${input.contentHash}
    )
    on conflict (content_hash) do update
      set url = excluded.url,
          title = coalesce(excluded.title, public.content_items.title),
          body = coalesce(excluded.body, public.content_items.body),
          metadata = excluded.metadata
    returning id
  `;

  const contentItemId = itemRows[0]?.id;
  if (!contentItemId) {
    throw new Error("Failed to upsert content_items row");
  }

  await input.sql`
    insert into public.content_analysis (content_item_id, decision)
    values (${contentItemId}, ${input.sql.json(toPostgresJson(input.decision))})
    on conflict (content_item_id) do update
      set decision = excluded.decision,
          analyzed_at = now()
  `;
}
