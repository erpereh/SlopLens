import {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
  type SecretStore,
  secretStoreKey,
} from "@sloplens/config";
import type { PutProviderSelectionsRequest, SettingsResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { listProviderSelections, replaceProviderSelections } from "../db/provider-selections";
import { isProviderSecretConfigured, resolveEffectiveSelections } from "./secrets-resolver";

export interface SettingsService {
  listUserSelections(): Promise<ProviderSelection[]>;
  getSettings(): Promise<SettingsResponse>;
  putProviderSettings(body: PutProviderSelectionsRequest): Promise<SettingsResponse>;
}

export function createSettingsService(input: {
  sql: postgres.Sql | null;
  secretStore: SecretStore;
  env: NodeJS.ProcessEnv;
}): SettingsService {
  return {
    async listUserSelections() {
      return listProviderSelections(input.sql);
    },

    async getSettings() {
      const userSelections = await listProviderSelections(input.sql);
      const resolved = resolveEffectiveSelections({
        userSelections,
        env: input.env,
      });

      const selections = PROVIDER_CAPABILITIES.flatMap((capability) => {
        const config = resolved[capability];
        if (!config.selection?.providerId.trim()) {
          return [];
        }
        return [config.selection];
      });

      const secrets = await Promise.all(
        selections.map(async (selection) => ({
          capability: selection.capability,
          providerId: selection.providerId,
          configured: await isProviderSecretConfigured({
            capability: selection.capability,
            providerId: selection.providerId,
            secretStore: input.secretStore,
            env: input.env,
          }),
        })),
      );

      return { selections, secrets };
    },

    async putProviderSettings(body) {
      if (!input.sql) {
        throw new Error("Database unavailable");
      }

      const existing = await listProviderSelections(input.sql);
      const merged = mergeByCapability(existing, body.selections);
      await replaceProviderSelections(input.sql, merged);

      if (body.secrets) {
        for (const secretUpdate of body.secrets) {
          const key = secretStoreKey(secretUpdate.capability, secretUpdate.providerId);
          if (secretUpdate.delete) {
            await input.secretStore.delete(key);
            continue;
          }
          if (secretUpdate.apiKey) {
            await input.secretStore.set(key, secretUpdate.apiKey);
          }
        }
      }

      return this.getSettings();
    },
  };
}

function mergeByCapability(
  existing: ReadonlyArray<ProviderSelection>,
  incoming: ReadonlyArray<ProviderSelection>,
): ProviderSelection[] {
  const map = new Map<ProviderCapability, ProviderSelection>();
  for (const selection of existing) {
    map.set(selection.capability, selection);
  }
  for (const selection of incoming) {
    map.set(selection.capability, selection);
  }
  return [...map.values()];
}
