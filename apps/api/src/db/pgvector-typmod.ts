import type postgres from "postgres";

import { PGVECTOR_EMBEDDING_DIMENSIONS } from "./embedding-dimensions";

/**
 * pgvector type modifiers must be SQL constants. postgres.js parameterizes
 * `${number}` interpolations, which yields `vector($2)` and fails with
 * "type modifiers must be simple constants or identifiers".
 */
export function pgvectorTypmod(kind: "vector" | "halfvec"): string {
  const dim = PGVECTOR_EMBEDDING_DIMENSIONS;
  if (!Number.isInteger(dim) || dim < 1 || dim > 16_000) {
    throw new Error("Invalid PGVECTOR_EMBEDDING_DIMENSIONS");
  }
  return `extensions.${kind}(${dim})`;
}

export function pgvectorTypmodSql(sql: postgres.Sql, kind: "vector" | "halfvec") {
  return sql.unsafe(pgvectorTypmod(kind));
}
