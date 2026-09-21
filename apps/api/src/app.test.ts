import { analyzeRequestSchema, errorEnvelopeSchema } from "@sloplens/shared";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import { loadApiEnv } from "./env";

describe("feature route shells", () => {
  it("validates analyze payloads before returning not-implemented", async () => {
    const app = createApp(
      loadApiEnv({
        NODE_ENV: "test",
        PORT: "3001",
      }),
    );

    const invalid = await app.request("http://127.0.0.1/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: { platform: "x", url: "not-a-url", metadata: {} } }),
    });
    expect(invalid.status).toBe(400);
    const invalidBody = errorEnvelopeSchema.parse(await invalid.json());
    expect(invalidBody.error.code).toBe("validation_error");

    const payload = analyzeRequestSchema.parse({
      content: {
        platform: "x",
        url: "https://x.com/user/status/1",
        metadata: {},
      },
    });

    const response = await app.request("http://127.0.0.1/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(501);
    const body = errorEnvelopeSchema.parse(await response.json());
    expect(body.error.code).toBe("backend_unavailable");
    expect(body.error.message).toContain("not implemented");
  });
});
