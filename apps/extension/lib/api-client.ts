import { createSlopLensApiClient, type SlopLensApiClient } from "@sloplens/shared";

import { getApiBaseUrl } from "../utils/api-base-url";

let cachedLocalToken: string | undefined;

async function ensureLocalToken(client: SlopLensApiClient): Promise<void> {
  if (cachedLocalToken) {
    return;
  }
  const health = await client.health();
  if (health.localToken) {
    cachedLocalToken = health.localToken;
  }
}

export function createExtensionApiClient(): SlopLensApiClient {
  const client = createSlopLensApiClient({
    baseUrl: getApiBaseUrl(),
    localToken: () => cachedLocalToken,
  });

  return {
    ...client,
    async putProviderSelections(input) {
      await ensureLocalToken(client);
      return client.putProviderSelections(input);
    },
  };
}
