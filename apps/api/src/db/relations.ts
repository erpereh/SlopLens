import type { ContentRelationType } from "@sloplens/core";
import type postgres from "postgres";

import { toPostgresJson } from "./json";

export interface ContentRelationRow {
  toUrl: string;
  relationType: ContentRelationType;
  evidenceSummary?: string;
}

export async function listRelationsFromContent(
  sql: postgres.Sql,
  fromContentId: string,
): Promise<ContentRelationRow[]> {
  const rows = await sql<
    { to_url: string | null; relation_type: string; evidence: { summary?: string } }[]
  >`
    select
      coalesce(cr.to_url, target.url) as to_url,
      cr.relation_type,
      cr.evidence
    from public.content_relations cr
    left join public.content_items target on target.id = cr.to_content_id
    where cr.from_content_id = ${fromContentId}
  `;

  return rows.flatMap((row) => {
    if (!row.to_url) {
      return [];
    }
    return [
      {
        toUrl: row.to_url,
        relationType: row.relation_type as ContentRelationType,
        ...(typeof row.evidence?.summary === "string"
          ? { evidenceSummary: row.evidence.summary }
          : {}),
      },
    ];
  });
}

export async function hasRelation(input: {
  sql: postgres.Sql;
  fromContentId: string;
  toUrl: string;
  relationType: ContentRelationType;
}): Promise<boolean> {
  const rows = await input.sql<{ exists: boolean }[]>`
    select exists(
      select 1
      from public.content_relations
      where from_content_id = ${input.fromContentId}
        and coalesce(to_url, '') = ${input.toUrl}
        and relation_type = ${input.relationType}
    ) as exists
  `;
  return rows[0]?.exists === true;
}

export async function insertContentRelation(input: {
  sql: postgres.Sql;
  fromContentId: string;
  toContentId?: string;
  toUrl: string;
  relationType: ContentRelationType;
  summary?: string;
}): Promise<void> {
  await input.sql`
    insert into public.content_relations (
      from_content_id,
      to_content_id,
      to_url,
      relation_type,
      evidence
    )
    values (
      ${input.fromContentId},
      ${input.toContentId ?? null},
      ${input.toUrl},
      ${input.relationType},
      ${input.sql.json(toPostgresJson(input.summary ? { summary: input.summary } : {}))}
    )
  `;
}
