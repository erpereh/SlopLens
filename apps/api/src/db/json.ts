import type { JSONValue } from "postgres";

export function toPostgresJson(value: unknown): JSONValue {
  return JSON.parse(JSON.stringify(value)) as JSONValue;
}
