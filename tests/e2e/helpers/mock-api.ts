import type { BrowserContext, Route } from "@playwright/test";

import { MOCK_ANALYZE, MOCK_RELATED, MOCK_TRACE, MOCK_VERIFY } from "./payloads";

export type ApiMockMode = "ok" | "offline" | "delayed-analyze";

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

function payloadFor(pathname: string): unknown {
  if (pathname.endsWith("/analyze")) return MOCK_ANALYZE;
  if (pathname.endsWith("/verify")) return MOCK_VERIFY;
  if (pathname.endsWith("/trace")) return MOCK_TRACE;
  if (pathname.endsWith("/related")) return MOCK_RELATED;
  if (pathname.endsWith("/health")) {
    return { status: "ok", checks: { database: true, pgvector: true } };
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

    const payload = payloadFor(pathname);
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
};

export function attachRequestAudit(context: BrowserContext): CapturedRequest[] {
  const captured: CapturedRequest[] = [];
  context.on("request", (request) => {
    captured.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
    });
  });
  return captured;
}
