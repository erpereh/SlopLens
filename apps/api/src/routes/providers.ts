import { providersResponseSchema } from "@sloplens/shared";
import type { Context } from "hono";

import { buildProvidersResponse } from "../services/providers-service";
import type { ApiDependencies } from "../services/types";

export function getProvidersHandler(deps: ApiDependencies) {
  return async (c: Context) => {
    const payload = providersResponseSchema.parse(await buildProvidersResponse(deps));
    return c.json(payload);
  };
}
