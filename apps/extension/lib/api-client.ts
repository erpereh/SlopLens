import { createSlopLensApiClient, type SlopLensApiClient } from "@sloplens/shared";

import { createRuntimeMessagingTransport } from "./messaging-transport";

export function createExtensionApiClient(): SlopLensApiClient {
  return createSlopLensApiClient({
    transport: createRuntimeMessagingTransport(),
  });
}
