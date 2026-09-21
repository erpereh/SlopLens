import { putProviderSelectionsRequestSchema, settingsResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { backendUnavailable } from "../lib/http-errors";
import { parseJsonBody, readJsonBody } from "../middleware/error-handler";
import type { ApiDependencies } from "../services/types";

export function getSettingsHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    const payload = settingsResponseSchema.parse(await deps.settings.getSettings());
    return c.json(payload);
  };
}

export function putSettingsProvidersHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    if (!deps.sql) {
      throw backendUnavailable("Database is unavailable");
    }
    const body = parseJsonBody(putProviderSelectionsRequestSchema, await readJsonBody(c));
    const payload = settingsResponseSchema.parse(await deps.settings.putProviderSettings(body));
    return c.json(payload);
  };
}
