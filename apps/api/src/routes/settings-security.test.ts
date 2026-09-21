import { MemorySecretStore } from "@sloplens/config";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";
import { loadApiEnv } from "../env";
import { LOCAL_API_TOKEN_HEADER } from "../services/local-auth";

describe("PUT /settings/providers security", () => {
  it("requires a loopback local token", async () => {
    const secretStore = new MemorySecretStore();
    const app = createApp(
      loadApiEnv({
        NODE_ENV: "test",
        PORT: "3001",
      }),
      { sql: null, secretStore },
    );

    const withoutToken = await app.request("http://127.0.0.1/settings/providers", {
      method: "PUT",
      headers: { "content-type": "application/json", host: "127.0.0.1:3001" },
      body: JSON.stringify({
        selections: [
          {
            capability: "embedding",
            providerId: "openrouter",
          },
        ],
      }),
    });
    expect(withoutToken.status).toBe(400);

    const health = await app.request("http://127.0.0.1/health", {
      headers: { host: "127.0.0.1:3001" },
    });
    const { localToken } = (await health.json()) as { localToken?: string };
    expect(localToken).toBeTruthy();

    const withWrongToken = await app.request("http://127.0.0.1/settings/providers", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        host: "127.0.0.1:3001",
        [LOCAL_API_TOKEN_HEADER]: "not-the-token",
      },
      body: JSON.stringify({
        selections: [
          {
            capability: "embedding",
            providerId: "openrouter",
          },
        ],
      }),
    });
    expect(withWrongToken.status).toBe(400);
  });
});
