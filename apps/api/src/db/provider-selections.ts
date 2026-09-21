import { type ProviderSelection, providerCapabilitySchema } from "@sloplens/config";
import type postgres from "postgres";

import { toPostgresJson } from "./json";

interface ProviderSelectionRow {
  capability: string;
  provider_id: string;
  model_id: string | null;
  base_url: string | null;
  options: Record<string, unknown> | null;
}

export async function listProviderSelections(
  sql: postgres.Sql | null,
): Promise<ProviderSelection[]> {
  if (!sql) {
    return [];
  }

  const rows = await sql<ProviderSelectionRow[]>`
    select capability, provider_id, model_id, base_url, options
    from public.provider_selections
    order by capability asc
  `;

  return rows.map(rowToSelection);
}

export async function replaceProviderSelections(
  sql: postgres.Sql | null,
  selections: ReadonlyArray<ProviderSelection>,
): Promise<void> {
  if (!sql) {
    throw new Error("Database unavailable");
  }

  await sql.begin(async (tx) => {
    await tx`delete from public.provider_selections`;
    for (const selection of selections) {
      await tx`
        insert into public.provider_selections (
          capability,
          provider_id,
          model_id,
          base_url,
          options,
          updated_at
        )
        values (
          ${selection.capability},
          ${selection.providerId},
          ${selection.modelId ?? null},
          ${selection.baseUrl ?? null},
          ${tx.json(toPostgresJson(selection.options ?? {}))},
          now()
        )
      `;
    }
  });
}

function rowToSelection(row: ProviderSelectionRow): ProviderSelection {
  const capability = providerCapabilitySchema.parse(row.capability);
  return {
    capability,
    providerId: row.provider_id,
    ...(row.model_id ? { modelId: row.model_id } : {}),
    ...(row.base_url ? { baseUrl: row.base_url } : {}),
    ...(row.options && Object.keys(row.options).length > 0 ? { options: row.options } : {}),
  };
}
