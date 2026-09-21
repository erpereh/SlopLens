import type postgres from "postgres";

export async function insertCheapCluster(input: {
  sql: postgres.Sql;
  memberIds: readonly string[];
  label?: string;
}): Promise<string | null> {
  const unique = [...new Set(input.memberIds.filter(Boolean))];
  if (unique.length < 2) {
    return null;
  }

  const clusterRows = await input.sql<{ id: string }[]>`
    insert into public.clusters (label)
    values (${input.label ?? null})
    returning id
  `;
  const clusterId = clusterRows[0]?.id;
  if (!clusterId) {
    return null;
  }

  for (const contentItemId of unique) {
    await input.sql`
      insert into public.cluster_members (cluster_id, content_item_id)
      values (${clusterId}, ${contentItemId})
      on conflict do nothing
    `;
  }

  return clusterId;
}
