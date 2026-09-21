import { describe, expect, it, vi } from "vitest";

import {
  createSlopLensApiClient,
  SLOPLENS_LOCAL_API_TOKEN_HEADER,
  SlopLensApiError,
} from "./api/client";
import {
  API_OPERATION_SPEC,
  SLOPLENS_API_MESSAGE_TYPE,
  sloplensApiMessageSchema,
} from "./api/operations";
import { API_ROUTES } from "./api/routes";
import { analyzeRequestSchema, healthResponseSchema, metricsResponseSchema } from "./api/schemas";
import { createHttpApiTransport } from "./api/transport";

const content = {
  platform: "youtube" as const,
  url: "https://www.youtube.com/watch?v=aaaaaaaaaaa",
  metadata: {},
};

describe("API schemas", () => {
  it("parses a health payload", () => {
    expect(
      healthResponseSchema.parse({
        status: "ok",
        checks: { database: true, pgvector: true },
      }).status,
    ).toBe("ok");
  });

  it("parses an analyze request wrapping NormalizedContent", () => {
    expect(analyzeRequestSchema.parse({ content }).content.platform).toBe("youtube");
  });

  it("parses aggregated metrics and rejects secrets or content", () => {
    const parsed = metricsResponseSchema.parse({
      status: "degraded",
      checks: { database: true, pgvector: false },
      counts: {
        contentItems: 3,
        cachedAnalyses: 2,
        clusters: 0,
        relations: 1,
        byPlatform: { x: 2, youtube: 1 },
        claims: 1,
        averageSlop: 0.4,
      },
      lastActivityAt: "2026-09-21T12:00:00.000Z",
    });
    expect(parsed.counts.contentItems).toBe(3);
    expect(() =>
      metricsResponseSchema.parse({
        ...parsed,
        localToken: "secret",
      }),
    ).toThrow();
    expect(() =>
      metricsResponseSchema.parse({
        ...parsed,
        text: "tweet body",
      }),
    ).toThrow();
    expect(() =>
      metricsResponseSchema.parse({
        ...parsed,
        baseUrl: "https://api.example/secret",
      }),
    ).toThrow();
  });
});

describe("sloplensApiMessageSchema", () => {
  it("accepts a closed operation without extra keys", () => {
    expect(
      sloplensApiMessageSchema.parse({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "analyze",
        body: { content },
      }).operation,
    ).toBe("analyze");
  });

  it("rejects arbitrary URLs, paths, and headers", () => {
    expect(() =>
      sloplensApiMessageSchema.parse({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "analyze",
        url: "https://evil.example/steal",
      }),
    ).toThrow();
    expect(() =>
      sloplensApiMessageSchema.parse({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "health",
        path: "/admin",
        headers: { authorization: "Bearer stolen" },
      }),
    ).toThrow();
    expect(() =>
      sloplensApiMessageSchema.parse({
        type: SLOPLENS_API_MESSAGE_TYPE,
        operation: "not-a-route",
      }),
    ).toThrow();
  });
});

describe("createHttpApiTransport", () => {
  it("maps operations to allowlisted routes only", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const transport = createHttpApiTransport({
      baseUrl: "http://127.0.0.1:3001/",
      fetch: fetchMock,
    });
    await transport.request({ operation: "health" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `http://127.0.0.1:3001${API_OPERATION_SPEC.health.route}`,
    );
  });

  it("sends content filters as a query string and never as a request body", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const transport = createHttpApiTransport({
      baseUrl: "http://127.0.0.1:3001/",
      fetch: fetchMock,
    });
    await transport.request({
      operation: "listContent",
      body: { platform: "x", sort: "slop", q: "launch", limit: 20 },
    });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/content?");
    expect(url).toContain("platform=x");
    expect(url).toContain("sort=slop");
    expect(url).toContain("q=launch");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });
});

describe("createSlopLensApiClient", () => {
  it("returns typed health data from a successful response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createSlopLensApiClient({
      baseUrl: "http://127.0.0.1:3001/",
      fetch: fetchMock,
    });
    await expect(client.health()).resolves.toEqual({ status: "ok" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://127.0.0.1:3001/health");
  });

  it("uses an injected transport instead of HTTP", async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      body: { status: "ok" },
    });
    const client = createSlopLensApiClient({
      transport: { request },
    });
    await expect(client.health()).resolves.toEqual({ status: "ok" });
    expect(request).toHaveBeenCalledWith({ operation: "health" });
  });

  it("maps an error envelope to SlopLensApiError", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "backend_unavailable",
            message: "API is down",
            retryable: true,
          },
        }),
        { status: 503, headers: { "content-type": "application/json" } },
      ),
    );
    const client = createSlopLensApiClient({
      baseUrl: "http://127.0.0.1:3001",
      fetch: fetchMock,
    });
    try {
      await client.health();
      expect.unreachable("expected the client to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(SlopLensApiError);
      expect(error).toMatchObject({
        code: "backend_unavailable",
        retryable: true,
        status: 503,
      });
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends the local token header on settings provider updates", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ selections: [], secrets: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = createSlopLensApiClient({
      baseUrl: "http://127.0.0.1:3001",
      fetch: fetchMock,
      localToken: "pairing-token",
    });
    await client.putProviderSelections({ selections: [] });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      [SLOPLENS_LOCAL_API_TOKEN_HEADER]: "pairing-token",
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(API_ROUTES.settingsProviders);
  });
});
