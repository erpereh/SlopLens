import {
  createHttpApiTransport,
  createSlopLensApiClient,
  type HealthResponse,
  SLOPLENS_API_MESSAGE_TYPE,
} from "@sloplens/shared";

import { handleExtensionApiMessage } from "../lib/api-background";
import { getApiBaseUrl } from "../utils/api-base-url";

export default defineBackground(() => {
  let cachedLocalToken: string | undefined;
  const httpTransport = createHttpApiTransport({
    baseUrl: getApiBaseUrl(),
    localToken: () => cachedLocalToken,
  });
  const client = createSlopLensApiClient({ transport: httpTransport });

  async function ensureLocalToken(): Promise<void> {
    if (cachedLocalToken) {
      return;
    }
    const health: HealthResponse = await client.health();
    if (health.localToken) {
      cachedLocalToken = health.localToken;
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (
      !message ||
      typeof message !== "object" ||
      (message as { type?: unknown }).type !== SLOPLENS_API_MESSAGE_TYPE
    ) {
      return false;
    }

    void (async () => {
      if ((message as { operation?: unknown }).operation === "putSettingsProviders") {
        try {
          await ensureLocalToken();
        } catch {
          // Transport failure is mapped in handleExtensionApiMessage.
        }
      }
      sendResponse(
        await handleExtensionApiMessage({
          message,
          sender,
          extensionId: chrome.runtime.id,
          transport: httpTransport,
        }),
      );
    })();
    return true;
  });
});
