import {
  normalizeProviderSelections,
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
  providerSelectionsEqual,
  type SecretStore,
  secretStoreKey,
  TYPESAFE_PROVIDER_ID,
  validateProviderBaseUrl,
} from "@sloplens/config";
import type { PutProviderSelectionsRequest, SettingsResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { listProviderSelections, replaceProviderSelections } from "../db/provider-selections";
import { validationError } from "../lib/http-errors";
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
  async function loadUserSelections(): Promise<ProviderSelection[]> {
    const stored = await listProviderSelections(input.sql);
    const normalized = normalizeProviderSelections(stored);
    if (providerSelectionsEqual(stored, normalized)) {
      return normalized;
    }
    if (!input.sql) {
      return normalized;
    }
    try {
      await replaceProviderSelections(input.sql, normalized);
      return normalized;
    } catch {
      return normalized;
    }
  }

  return {
    async listUserSelections() {
      return loadUserSelections();
    },

    async getSettings() {
      const userSelections = await loadUserSelections();
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
      const incoming = normalizeProviderSelections(body.selections);
      for (const selection of incoming) {
        const baseUrlError = validateProviderBaseUrl(selection.providerId, selection.baseUrl);
        if (baseUrlError) {
          throw validationError(baseUrlError);
        }
      }

      if (!input.sql) {
        throw new Error("Database unavailable");
      }

      const existing = await loadUserSelections();
      const merged = normalizeProviderSelections(mergeByCapability(existing, incoming));
      for (const selection of merged) {
        const baseUrlError = validateProviderBaseUrl(selection.providerId, selection.baseUrl);
        if (baseUrlError) {
          throw validationError(baseUrlError);
        }
      }
      await replaceProviderSelections(input.sql, merged);

      if (body.secrets) {
        for (const secretUpdate of body.secrets) {
          const providerId =
            secretUpdate.capability === "decision" && secretUpdate.providerId === "jev"
              ? TYPESAFE_PROVIDER_ID
              : secretUpdate.providerId;
          const key = secretStoreKey(secretUpdate.capability, providerId);
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
