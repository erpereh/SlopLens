import { metricsResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { readLocalMetrics } from "../db/metrics";
import type { ApiDependencies } from "../services/types";

export function getMetricsHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    const payload = metricsResponseSchema.parse(await readLocalMetrics(deps.sql));
    return c.json(payload, 200);
  };
}
