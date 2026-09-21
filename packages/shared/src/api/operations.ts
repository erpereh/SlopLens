import { z } from "zod";

import { API_ROUTES, type ApiRoute } from "./routes";

export const API_OPERATIONS = [
  "health",
  "metrics",
  "listContent",
  "providers",
  "getSettings",
  "putSettingsProviders",
  "analyze",
  "verify",
  "trace",
  "related",
] as const;

export type ApiOperation = (typeof API_OPERATIONS)[number];

export const apiOperationSchema = z.enum(API_OPERATIONS);

export const API_OPERATION_SPEC = {
  health: { method: "GET", route: API_ROUTES.health },
  metrics: { method: "GET", route: API_ROUTES.metrics },
  listContent: { method: "GET", route: API_ROUTES.content },
  providers: { method: "GET", route: API_ROUTES.providers },
  getSettings: { method: "GET", route: API_ROUTES.settings },
  putSettingsProviders: { method: "PUT", route: API_ROUTES.settingsProviders },
  analyze: { method: "POST", route: API_ROUTES.analyze },
  verify: { method: "POST", route: API_ROUTES.verify },
  trace: { method: "POST", route: API_ROUTES.trace },
  related: { method: "POST", route: API_ROUTES.related },
} as const satisfies Record<ApiOperation, { method: "GET" | "PUT" | "POST"; route: ApiRoute }>;

export const SLOPLENS_API_MESSAGE_TYPE = "sloplens.api";

export const sloplensApiMessageSchema = z
  .object({
    type: z.literal(SLOPLENS_API_MESSAGE_TYPE),
    operation: apiOperationSchema,
    body: z.unknown().optional(),
  })
  .strict();

export type SlopLensApiMessage = z.infer<typeof sloplensApiMessageSchema>;

export const sloplensApiBridgeResponseSchema = z
  .object({
    status: z.number().int(),
    body: z.unknown(),
  })
  .strict();

export type SlopLensApiBridgeResponse = z.infer<typeof sloplensApiBridgeResponseSchema>;
