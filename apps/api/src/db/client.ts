import postgres from "postgres";

export function createSqlClient(databaseUrl: string | undefined): postgres.Sql | null {
  if (!databaseUrl?.trim()) {
    return null;
  }

  return postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}
