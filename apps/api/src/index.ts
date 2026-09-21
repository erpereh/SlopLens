/**
 * Local Hono API package.
 */
export const API_DEFAULT_PORT = 3001;
export const API_DEFAULT_ORIGIN = "http://127.0.0.1:3001";

export { createApp } from "./app";
export { hashNormalizedContent } from "./content-hash";
export { findCachedAnalysisByHash } from "./db/content-cache";
export { healthStatusFromChecks, runDbHealthChecks } from "./db/health";
export { startServer } from "./server";
