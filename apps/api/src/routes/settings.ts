import { putProviderSelectionsRequestSchema, settingsResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { backendUnavailable, validationError } from "../lib/http-errors";
import { LOCAL_API_TOKEN_HEADER } from "../services/local-auth";
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
    try {
      await deps.localAuth.assertMutatingRequest(
        c.req.header("host"),
        c.req.header(LOCAL_API_TOKEN_HEADER),
      );
    } catch (error) {
      throw validationError(error instanceof Error ? error.message : "Unauthorized");
    }
    if (!deps.sql) {
      throw backendUnavailable("Database is unavailable");
    }
    const body = parseJsonBody(putProviderSelectionsRequestSchema, await readJsonBody(c));
    const payload = settingsResponseSchema.parse(await deps.settings.putProviderSettings(body));
    return c.json(payload);
  };
}
