import { randomBytes } from "node:crypto";

import type { SecretStore } from "@sloplens/config";

export const LOCAL_API_TOKEN_SECRET_KEY = "sloplens:local-api-token";
export const LOCAL_API_TOKEN_HEADER = "x-sloplens-local-token";

export interface LocalAuthService {
  getToken(): Promise<string>;
  isLoopbackHost(hostHeader: string | undefined): boolean;
  assertMutatingRequest(
    hostHeader: string | undefined,
    tokenHeader: string | undefined,
  ): Promise<void>;
}

export function createLocalAuthService(secretStore: SecretStore): LocalAuthService {
  let cachedToken: string | undefined;

  async function getToken(): Promise<string> {
    if (cachedToken) {
      return cachedToken;
    }
    const existing = await secretStore.get(LOCAL_API_TOKEN_SECRET_KEY);
    if (existing?.trim()) {
      cachedToken = existing;
      return cachedToken;
    }
    cachedToken = randomBytes(32).toString("hex");
    await secretStore.set(LOCAL_API_TOKEN_SECRET_KEY, cachedToken);
    return cachedToken;
  }

  return {
    getToken,
    isLoopbackHost(hostHeader) {
      const host = (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
      return host === "127.0.0.1" || host === "localhost" || host === "::1";
    },
    async assertMutatingRequest(hostHeader, tokenHeader) {
      if (!this.isLoopbackHost(hostHeader)) {
        throw new Error("Settings mutations are only allowed from loopback");
      }
      const expected = await getToken();
      if (!tokenHeader || tokenHeader !== expected) {
        throw new Error("Missing or invalid local API token");
      }
    },
  };
}
