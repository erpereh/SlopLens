import { contentListResponseSchema } from "@sloplens/shared";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";
import { loadApiEnv } from "../env";
import { sampleDecision } from "../services/test-providers";
import { listContentHistory, mapContentHistoryRow, xHandleFromUrl } from "./content-history";

const itemId = "11111111-1111-4111-8111-111111111111";

const xRow = {
  id: itemId,
  platform: "x",
  url: "https://x.com/jane/status/123",
  author: "Jane Doe",
  title: null,
  body: "A claim about the launch.",
  published_at: "2026-09-21T11:00:00.000Z",
  captured_at: "2026-09-21T12:00:00.000Z",
  external_id: "123",
  metadata: { source: "dom" },
  decision: sampleDecision({ aiSlop: 0.82, clickbait: 0.2, engagementBait: 0.66 }),
  claim_text: "The launch happened on Monday.",
  slop_value: 0.82,
  content_hash: "should-not-leak",
};

describe("mapContentHistoryRow", () => {
  it("maps a stored X post without hashes or secrets", () => {
    const item = mapContentHistoryRow(xRow);
    expect(item).toMatchObject({
      id: itemId,
      platform: "x",
      author: "Jane Doe",
      handle: "@jane",
      text: "A claim about the launch.",
      slop: 0.82,
      clickbait: 0.2,
      engagementBait: 0.66,
      containsClaim: true,
      needsVerification: true,
      claimText: "The launch happened on Monday.",
      thumbnailUrl: null,
    });
    expect(JSON.stringify(item)).not.toMatch(/content_hash|apiKey|localToken|should-not-leak/);
  });

  it("builds a YouTube thumbnail from the stored video id and truncates long text", () => {
    const item = mapContentHistoryRow({
      ...xRow,
      platform: "youtube",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      author: "Creator Channel",
      title: "A long video",
      external_id: "abcdefghijk",
      body: "x".repeat(400),
      claim_text: null,
      decision: sampleDecision({ containsClaim: false, needsVerification: false, aiSlop: 0.4 }),
      slop_value: 0.4,
    });
    expect(item?.handle).toBeNull();
    expect(item?.thumbnailUrl).toBe("https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg");
    expect(item?.text?.endsWith("…")).toBe(true);
    expect(item?.text?.length).toBeLessThanOrEqual(280);
    expect(item?.claimText).toBeNull();
  });

  it("drops rows whose url is not http(s)", () => {
    expect(mapContentHistoryRow({ ...xRow, url: "not-a-url" })).toBeNull();
  });

  it("reads an X handle only from a status path", () => {
    expect(xHandleFromUrl(new URL("https://x.com/jane/status/1"))).toBe("@jane");
    expect(xHandleFromUrl(new URL("https://x.com/i/status/1"))).toBeNull();
  });
});

describe("GET /content", () => {
  it("returns an empty page when the database is not configured", async () => {
    const app = createApp(loadApiEnv({ NODE_ENV: "test", PORT: "3001" }), { sql: null });
    const response = await app.request("http://127.0.0.1/content");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [], nextCursor: null });
  });

  it("returns stored rows and rejects an unknown platform filter", async () => {
    const sql = Object.assign(
      async (strings: TemplateStringsArray) => {
        const query = strings.join(" ");
        if (query.includes("from public.content_items")) {
          return [xRow];
        }
        return [];
      },
      { json: (value: unknown) => value },
    );
    const app = createApp(loadApiEnv({ NODE_ENV: "test", PORT: "3001" }), {
      sql: sql as never,
    });

    const response = await app.request("http://127.0.0.1/content?platform=x&sort=recent");
    expect(response.status).toBe(200);
    const body = contentListResponseSchema.parse(await response.json());
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.handle).toBe("@jane");
    expect(JSON.stringify(body)).not.toMatch(/content_hash|apiKey|should-not-leak/);

    const invalid = await app.request("http://127.0.0.1/content?platform=facebook");
    expect(invalid.status).toBe(400);
  });
});

describe("listContentHistory", () => {
  it("returns no invented rows without a database", async () => {
    await expect(listContentHistory(null, {})).resolves.toEqual({ items: [], nextCursor: null });
  });
});
