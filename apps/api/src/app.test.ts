import { errorEnvelopeSchema } from "@sloplens/shared";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import { loadApiEnv } from "./env";
import type { FeatureServices } from "./services/feature-services";
import { sampleContent, sampleDecision } from "./services/test-providers";

const mockFeatures: FeatureServices = {
  analyze: async () => ({
    decision: sampleDecision(),
    cached: false,
    contentHash: "abc",
  }),
  related: async () => ({ items: [] }),
  verify: async ({ claim }) => ({
    status: "insufficient_evidence",
    claim,
    sources: [],
    evidence: [],
  }),
  trace: async () => ({
    status: "insufficient_evidence",
    graph: { similar: [], derivations: [] },
    evidence: [],
  }),
};

describe("feature routes", () => {
  it("rejects invalid analyze payloads", async () => {
    const app = createApp(
      loadApiEnv({
        NODE_ENV: "test",
        PORT: "3001",
      }),
      { sql: null, features: mockFeatures },
    );

    const invalid = await app.request("http://127.0.0.1/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: { platform: "x", url: "not-a-url", metadata: {} } }),
    });
    expect(invalid.status).toBe(400);
    const invalidBody = errorEnvelopeSchema.parse(await invalid.json());
    expect(invalidBody.error.code).toBe("validation_error");
  });

  it("returns analyze results from the feature service instead of 501", async () => {
    const app = createApp(
      loadApiEnv({
        NODE_ENV: "test",
        PORT: "3001",
      }),
      { sql: null, features: mockFeatures },
    );

    const response = await app.request("http://127.0.0.1/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: sampleContent }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { cached: boolean; decision: { contentType: string } };
    expect(body.cached).toBe(false);
    expect(body.decision.contentType).toBe("news");
  });
});
