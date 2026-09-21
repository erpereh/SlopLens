import type { ContentDecision } from "@sloplens/core";
import type postgres from "postgres";

import { toPostgresJson } from "./json";

export interface CachedContentAnalysis {
  contentItemId: string;
  contentHash: string;
  decision: ContentDecision;
}

export async function findContentItemByHash(
  sql: postgres.Sql,
  contentHash: string,
): Promise<{ id: string; contentHash: string } | null> {
  const rows = await sql<{ id: string; content_hash: string }[]>`
    select id, content_hash
    from public.content_items
    where content_hash = ${contentHash}
    limit 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { id: row.id, contentHash: row.content_hash };
}

export async function upsertContentItem(input: {
  sql: postgres.Sql;
  contentHash: string;
  platform: string;
  url: string;
  externalId?: string | undefined;
  title?: string | undefined;
  body?: string | undefined;
  author?: string | undefined;
  publishedAt?: string | undefined;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const itemRows = await input.sql<{ id: string }[]>`
    insert into public.content_items (
      platform,
      external_id,
      url,
      author,
      title,
      body,
      published_at,
      metadata,
      content_hash
    )
    values (
      ${input.platform},
      ${input.externalId ?? null},
      ${input.url},
      ${input.author ?? null},
      ${input.title ?? null},
      ${input.body ?? null},
      ${input.publishedAt ?? null},
      ${input.sql.json(toPostgresJson(input.metadata))},
      ${input.contentHash}
    )
    on conflict (content_hash) do update
      set url = excluded.url,
          author = coalesce(excluded.author, public.content_items.author),
          title = coalesce(excluded.title, public.content_items.title),
          body = coalesce(excluded.body, public.content_items.body),
          published_at = coalesce(excluded.published_at, public.content_items.published_at),
          metadata = excluded.metadata
    returning id
  `;

  const contentItemId = itemRows[0]?.id;
  if (!contentItemId) {
    throw new Error("Failed to upsert content_items row");
  }
  return contentItemId;
}

export async function findCachedAnalysisByHash(
  sql: postgres.Sql,
  contentHash: string,
): Promise<CachedContentAnalysis | null> {
  const rows = await sql<{ id: string; content_hash: string; decision: ContentDecision }[]>`
    select ci.id, ci.content_hash, ca.decision
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
    contentItemId: row.id,
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
  author?: string | undefined;
  publishedAt?: string | undefined;
  metadata: Record<string, unknown>;
  decision: ContentDecision;
}): Promise<string> {
  const contentItemId = await upsertContentItem(input);

  await input.sql`
    insert into public.content_analysis (content_item_id, decision)
    values (${contentItemId}, ${input.sql.json(toPostgresJson(input.decision))})
    on conflict (content_item_id) do update
      set decision = excluded.decision,
          analyzed_at = now()
  `;

  return contentItemId;
}
