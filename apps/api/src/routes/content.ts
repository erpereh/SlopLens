import { contentListQuerySchema, contentListResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { listContentHistory } from "../db/content-history";
import type { ApiDependencies } from "../services/types";

export function getContentHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    const limitRaw = c.req.query("limit");
    const query = contentListQuerySchema.parse({
      platform: emptyToUndefined(c.req.query("platform")),
      q: emptyToUndefined(c.req.query("q")),
      sort: emptyToUndefined(c.req.query("sort")),
      signal: emptyToUndefined(c.req.query("signal")),
      cursor: emptyToUndefined(c.req.query("cursor")),
      ...(limitRaw ? { limit: Number(limitRaw) } : {}),
    });
    const payload = contentListResponseSchema.parse(await listContentHistory(deps.sql, query));
    return c.json(payload, 200);
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
