import {
  analyzeRequestSchema,
  analyzeResponseSchema,
  relatedRequestSchema,
  relatedResponseSchema,
  traceRequestSchema,
  traceResponseSchema,
  verifyRequestSchema,
  verifyResponseSchema,
} from "@sloplens/shared";
import type { Context } from "hono";

import { parseJsonBody, readJsonBody } from "../middleware/error-handler";
import type { FeatureServices } from "../services/feature-services";

export function postAnalyzeHandler(features: FeatureServices) {
  return async (c: Context) => {
    const body = parseJsonBody(analyzeRequestSchema, await readJsonBody(c));
    return c.json(analyzeResponseSchema.parse(await features.analyze(body)));
  };
}

export function postRelatedHandler(features: FeatureServices) {
  return async (c: Context) => {
    const body = parseJsonBody(relatedRequestSchema, await readJsonBody(c));
    return c.json(relatedResponseSchema.parse(await features.related(body)));
  };
}

export function postVerifyHandler(features: FeatureServices) {
  return async (c: Context) => {
    const body = parseJsonBody(verifyRequestSchema, await readJsonBody(c));
    return c.json(verifyResponseSchema.parse(await features.verify(body)));
  };
}

export function postTraceHandler(features: FeatureServices) {
  return async (c: Context) => {
    const body = parseJsonBody(traceRequestSchema, await readJsonBody(c));
    return c.json(traceResponseSchema.parse(await features.trace(body)));
  };
}
