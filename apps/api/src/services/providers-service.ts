import { BOOTSTRAP_PROVIDER_IDS } from "@sloplens/ai";
import {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
} from "@sloplens/config";
import type { ProvidersResponse } from "@sloplens/shared";

import { isProviderSecretConfigured, resolveEffectiveSelections } from "./secrets-resolver";
import type { ApiDependencies } from "./types";

export async function buildProvidersResponse(deps: ApiDependencies): Promise<ProvidersResponse> {
  const userSelections = await deps.settings.listUserSelections();
  const resolved = resolveEffectiveSelections({
    userSelections,
    env: deps.env.raw,
  });

  const capabilities = await Promise.all(
    PROVIDER_CAPABILITIES.map(async (capability) => {
      const effective = resolved[capability].selection;
      const providerIds = new Set<string>(BOOTSTRAP_PROVIDER_IDS[capability]);
      if (effective?.providerId) {
        providerIds.add(effective.providerId);
      }

      const providers = await Promise.all(
        [...providerIds].map(async (providerId) => {
          const matchesSelection = effective?.providerId === providerId;
          const configured =
            matchesSelection &&
            (await isProviderSecretConfigured({
              capability,
              providerId,
              secretStore: deps.secretStore,
              env: deps.env.raw,
            }));

          return {
            providerId,
            configured,
            ...(matchesSelection && effective?.modelId ? { models: [effective.modelId] } : {}),
          };
        }),
      );

      return { capability, providers };
    }),
  );

  return { capabilities };
}

export function mergeSelectionsForPut(
  existing: ReadonlyArray<ProviderSelection>,
  incoming: ReadonlyArray<ProviderSelection>,
): ProviderSelection[] {
  const byCapability = new Map<ProviderCapability, ProviderSelection>();
  for (const selection of existing) {
    byCapability.set(selection.capability, selection);
  }
  for (const selection of incoming) {
    byCapability.set(selection.capability, selection);
  }
  return [...byCapability.values()];
}
