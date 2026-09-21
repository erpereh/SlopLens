import type { Context } from "hono";
import type { ZodSchema } from "zod";

import { HttpError, mapUnknownError, validationError } from "../lib/http-errors";

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
    const mapped = mapUnknownError(error);
    if (!(error instanceof HttpError) && mapped.status === 500) {
      console.error(
        "[@sloplens/api] Unhandled error",
        error instanceof Error ? error.message : error,
      );
    }
    return c.json(mapped.toEnvelope(), mapped.status);
  });
}
