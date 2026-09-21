import { healthResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { healthStatusFromChecks, runDbHealthChecks } from "../db/health";
import type { ApiDependencies } from "../services/types";

export function getHealthHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    const checks = await runDbHealthChecks(deps.sql);
    const payload = healthResponseSchema.parse({
      status: healthStatusFromChecks(checks),
      checks,
      ...(deps.localAuth.isLoopbackHost(c.req.header("host"))
        ? { localToken: await deps.localAuth.getToken() }
        : {}),
    });
    return c.json(payload, payload.status === "unavailable" ? 503 : 200);
  };
}
