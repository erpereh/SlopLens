import type { BrowserContext, Route } from "@playwright/test";

import { MOCK_ANALYZE, MOCK_RELATED, MOCK_TRACE, MOCK_VERIFY } from "./payloads";

export type ApiMockMode = "ok" | "offline" | "delayed-analyze" | "metrics-unavailable";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
};

function json(status: number, body: unknown) {
  return {
    status,
    contentType: "application/json",
    headers: CORS,
    body: JSON.stringify(body),
  };
}

function payloadFor(requestUrl: string): unknown {
  const url = new URL(requestUrl);
  const { pathname } = url;
  if (pathname.endsWith("/analyze")) return MOCK_ANALYZE;
  if (pathname.endsWith("/verify")) return MOCK_VERIFY;
  if (pathname.endsWith("/trace")) return MOCK_TRACE;
  if (pathname.endsWith("/related")) return MOCK_RELATED;
  if (pathname.endsWith("/health")) {
    return { status: "ok", checks: { database: true, pgvector: true } };
  }
  if (pathname.endsWith("/metrics")) {
    return {
      status: "ok",
      checks: { database: true, pgvector: true },
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
    };
  }
  if (pathname.endsWith("/settings")) {
    return {
      selections: [{ capability: "decision", providerId: "typesafe", modelId: "jev-latest" }],
      secrets: [{ capability: "decision", providerId: "typesafe", configured: true }],
    };
  }
  if (pathname.endsWith("/content")) {
    const platform = url.searchParams.get("platform");
    const q = url.searchParams.get("q")?.toLowerCase() ?? "";
    const signal = url.searchParams.get("signal");
    const items = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        platform: "x",
        url: "https://x.com/jane/status/123",
        author: "Jane Doe",
        handle: "@jane",
        title: null,
        text: "Stored post from the mock history.",
        publishedAt: "2026-09-21T11:00:00.000Z",
        capturedAt: "2026-09-21T12:00:00.000Z",
        slop: 0.82,
        clickbait: 0.2,
        engagementBait: 0.66,
        containsClaim: true,
        needsVerification: true,
        claimText: "The launch happened on Monday.",
        thumbnailUrl: null,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=abcdefghijk",
        author: "Creator Channel",
        handle: null,
        title: "Stored video",
        text: "Description captured with the analysis.",
        publishedAt: null,
        capturedAt: "2026-09-21T12:05:00.000Z",
        slop: 0.4,
        clickbait: 0.71,
        engagementBait: 0.1,
        containsClaim: false,
        needsVerification: false,
        claimText: null,
        thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
      },
    ].filter((item) => {
      if (platform && item.platform !== platform) return false;
      if (signal === "claim" && !item.containsClaim && !item.claimText) return false;
      if (signal === "highSlop" && (item.slop ?? 0) < 0.7) return false;
      if (!q) return true;
      return `${item.author ?? ""} ${item.text ?? ""} ${item.title ?? ""}`
        .toLowerCase()
        .includes(q);
    });
    return { items, nextCursor: null };
  }
  if (pathname.endsWith("/providers")) {
    return {
      capabilities: [
        {
          capability: "decision",
          providers: [{ providerId: "typesafe", configured: true, models: ["jev-latest"] }],
        },
      ],
    };
  }
  return null;
}

export async function installApiMock(
  context: BrowserContext,
  mode: ApiMockMode = "ok",
): Promise<void> {
  await context.route("http://127.0.0.1:3001/**", async (route: Route) => {
    if (mode === "offline") {
      await route.abort("connectionrefused");
      return;
    }

    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    const { pathname } = new URL(request.url());
    if (mode === "delayed-analyze" && pathname.endsWith("/analyze")) {
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    if (mode === "metrics-unavailable" && pathname.endsWith("/metrics")) {
      await route.fulfill(
        json(200, {
          status: "unavailable",
          checks: { database: false, pgvector: false },
          counts: {
            contentItems: null,
            cachedAnalyses: null,
            clusters: null,
            relations: null,
            byPlatform: { x: null, youtube: null },
            claims: null,
            averageSlop: null,
          },
          lastActivityAt: null,
        }),
      );
      return;
    }

    const payload = payloadFor(request.url());
    if (!payload) {
      await route.fulfill(
        json(404, {
          error: {
            code: "validation_error",
            message: "Unknown mock route",
            retryable: false,
          },
        }),
      );
      return;
    }

    await route.fulfill(json(200, payload));
  });
}

export type CapturedRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: string | null;
  fromServiceWorker: boolean;
};

function isServiceWorkerRequest(request: { serviceWorker?: () => unknown }): boolean {
  return typeof request.serviceWorker === "function" && request.serviceWorker() != null;
}

export function attachRequestAudit(context: BrowserContext): CapturedRequest[] {
  const captured: CapturedRequest[] = [];
  context.on("request", (request) => {
    captured.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
      fromServiceWorker: isServiceWorkerRequest(request),
    });
  });
  return captured;
}

export function localhostApiRequests(requests: CapturedRequest[]) {
  return requests.filter((item) => item.url.startsWith("http://127.0.0.1:3001/"));
}
