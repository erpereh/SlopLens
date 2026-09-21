import { describe, expect, it } from "vitest";

import { readLocalMetrics } from "./metrics";

describe("readLocalMetrics", () => {
  it("returns null counts without throwing when the database is unavailable", async () => {
    const payload = await readLocalMetrics(null);
    expect(payload.status).toBe("unavailable");
    expect(payload.checks).toEqual({ database: false, pgvector: false });
    expect(payload.counts).toEqual({
      contentItems: null,
      cachedAnalyses: null,
      clusters: null,
      relations: null,
    });
    expect(payload.lastActivityAt).toBeNull();
    expect(JSON.stringify(payload)).not.toMatch(/localToken|apiKey|select |http/i);
  });
});
