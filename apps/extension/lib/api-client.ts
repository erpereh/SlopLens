import { createSlopLensApiClient } from "@sloplens/shared";

import { getApiBaseUrl } from "../utils/api-base-url";

export function createExtensionApiClient() {
  return createSlopLensApiClient({ baseUrl: getApiBaseUrl() });
}
