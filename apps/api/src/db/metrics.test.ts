import { EMPTY_METRICS_COUNTS } from "@sloplens/shared";
import { describe, expect, it } from "vitest";

import { readLocalMetrics } from "./metrics";

describe("readLocalMetrics", () => {
  it("returns null counts without throwing when the database is unavailable", async () => {
    const payload = await readLocalMetrics(null);
    expect(payload.status).toBe("unavailable");
    expect(payload.checks).toEqual({ database: false, pgvector: false });
    expect(payload.counts).toEqual(EMPTY_METRICS_COUNTS);
    expect(payload.lastActivityAt).toBeNull();
    expect(JSON.stringify(payload)).not.toMatch(/localToken|apiKey|select |http/i);
  });

  it("aggregates platform counts, claims and mean slop without returning text", async () => {
    const sql = async (strings: TemplateStringsArray) => {
      const query = strings.join(" ");
      if (query.includes("group by platform")) {
        return [
          { platform: "x", n: 2 },
          { platform: "youtube", n: 1 },
        ];
      }
      if (query.includes("max(captured_at)")) {
        return [{ last: "2026-09-21T12:00:00.000Z" }];
      }
      if (query.includes("from public.content_items")) {
        return [{ n: 3 }];
      }
      if (query.includes("avg(")) {
        return [{ avg: 0.4 }];
      }
      if (query.includes("from public.content_analysis")) {
        return [{ n: 2 }];
      }
      if (query.includes("from public.clusters")) {
        return [{ n: 0 }];
      }
      if (query.includes("from public.content_relations")) {
        return [{ n: 1 }];
      }
      if (query.includes("from public.claims")) {
        return [{ n: 4 }];
      }
      if (query.includes("pg_extension")) {
        return [{ exists: true }];
      }
      if (query.includes("select 1")) {
        return [{ ok: 1 }];
      }
      return [];
    };

    const payload = await readLocalMetrics(sql as never);
    expect(payload.counts).toEqual({
      contentItems: 3,
      cachedAnalyses: 2,
      clusters: 0,
      relations: 1,
      byPlatform: { x: 2, youtube: 1 },
      claims: 4,
      averageSlop: 0.4,
    });
    expect(JSON.stringify(payload)).not.toMatch(/apiKey|localToken|tweet body/);
  });
});
