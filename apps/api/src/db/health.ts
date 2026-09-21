import type postgres from "postgres";

export interface DbHealthChecks {
  database: boolean;
  pgvector: boolean;
}

export async function runDbHealthChecks(sql: postgres.Sql | null): Promise<DbHealthChecks> {
  if (!sql) {
    return { database: false, pgvector: false };
  }

  try {
    await sql`select 1 as ok`;
    const extensionRows = await sql<{ exists: boolean }[]>`
      select exists(
        select 1
        from pg_extension
        where extname = 'vector'
      ) as exists
    `;
    return {
      database: true,
      pgvector: extensionRows[0]?.exists === true,
    };
  } catch {
    return { database: false, pgvector: false };
  }
}

export function healthStatusFromChecks(checks: DbHealthChecks): "ok" | "degraded" | "unavailable" {
  if (!checks.database) {
    return "unavailable";
  }
  if (!checks.pgvector) {
    return "degraded";
  }
  return "ok";
}
