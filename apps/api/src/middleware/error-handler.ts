import type { Context } from "hono";
import type { ZodSchema } from "zod";

import { HttpError, validationError } from "../lib/http-errors";

export function parseJsonBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError(parsed.error.message);
  }
  return parsed.data;
}

export async function readJsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw validationError("Request body must be valid JSON");
  }
}

export function registerErrorHandler(app: {
  onError: (handler: (error: unknown, c: Context) => Response | Promise<Response>) => void;
}) {
  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.json(error.toEnvelope(), error.status);
    }

    console.error(
      "[@sloplens/api] Unhandled error",
      error instanceof Error ? error.message : error,
    );
    const fallback = new HttpError(500, {
      code: "backend_unavailable",
      message: "Unexpected server error",
      retryable: true,
    });
    return c.json(fallback.toEnvelope(), fallback.status);
  });
}
