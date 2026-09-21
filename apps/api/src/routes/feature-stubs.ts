import {
  analyzeRequestSchema,
  relatedRequestSchema,
  traceRequestSchema,
  verifyRequestSchema,
} from "@sloplens/shared";
import type { Context } from "hono";

import { notImplemented } from "../lib/http-errors";
import { parseJsonBody, readJsonBody } from "../middleware/error-handler";

function validatedNotImplemented(schema: Parameters<typeof parseJsonBody>[0], feature: string) {
  return async (c: Context) => {
    parseJsonBody(schema, await readJsonBody(c));
    throw notImplemented(`${feature} is not implemented yet`);
  };
}

export const postAnalyzeHandler = validatedNotImplemented(analyzeRequestSchema, "Analyze");
export const postVerifyHandler = validatedNotImplemented(verifyRequestSchema, "Verify");
export const postTraceHandler = validatedNotImplemented(traceRequestSchema, "Trace");
export const postRelatedHandler = validatedNotImplemented(relatedRequestSchema, "Related");
