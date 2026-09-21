import { describe, expect, it } from "vitest";

import { HttpError } from "../lib/http-errors";
import { createRelatedService } from "./related-service";
import { mockRuntime, sampleContent } from "./test-providers";

describe("related service", () => {
  it("requires the database for pgvector neighbors", async () => {
    const service = createRelatedService({
      sql: null,
      runtime: mockRuntime(),
    });
    await expect(service.related({ content: sampleContent })).rejects.toBeInstanceOf(HttpError);
    await expect(service.related({ content: sampleContent })).rejects.toMatchObject({
      body: { code: "backend_unavailable" },
    });
  });
});
