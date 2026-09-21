import { describe, expect, it, vi } from "vitest";

import {
  createSlopLensApiClient,
  SLOPLENS_LOCAL_API_TOKEN_HEADER,
  SlopLensApiError,
} from "./api/client";
import { API_ROUTES } from "./api/routes";
import { analyzeRequestSchema, healthResponseSchema } from "./api/schemas";

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
