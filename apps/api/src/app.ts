import type { SecretStore } from "@sloplens/config";
import { API_ROUTES } from "@sloplens/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type postgres from "postgres";

import { createSqlClient } from "./db/client";
import type { ApiEnv } from "./env";
import { registerErrorHandler } from "./middleware/error-handler";
import { getContentHandler } from "./routes/content";
import {
  postAnalyzeHandler,
  postRelatedHandler,
  postTraceHandler,
  postVerifyHandler,
} from "./routes/features";
import { getHealthHandler } from "./routes/health";
import { getMetricsHandler } from "./routes/metrics";
import { getProvidersHandler } from "./routes/providers";
import { getSettingsHandler, putSettingsProvidersHandler } from "./routes/settings";
import { createSecretStore } from "./secret-store/create-secret-store";
import { createFeatureServices, type FeatureServices } from "./services/feature-services";
import { createLocalAuthService } from "./services/local-auth";
import { createProviderRuntime, type ProviderRuntime } from "./services/provider-runtime";
import { createSettingsService } from "./services/settings-service";
import type { ApiDependencies } from "./services/types";

export interface CreateAppOptions {
  sql?: postgres.Sql | null;
  secretStore?: SecretStore;
  settings?: ReturnType<typeof createSettingsService>;
  runtime?: ProviderRuntime;
  features?: FeatureServices;
}

export function createApp(env: ApiEnv, options: CreateAppOptions = {}): Hono {
  const sql = options.sql !== undefined ? options.sql : createSqlClient(env.databaseUrl);
  const secretStore = options.secretStore ?? createSecretStore().store;
  const localAuth = createLocalAuthService(secretStore);
  const settings =
    options.settings ??
    createSettingsService({
      sql,
      secretStore,
      env: env.raw,
    });

  const runtime =
    options.runtime ??
    createProviderRuntime({
      settings,
      secretStore,
      env: env.raw,
    });

  const features = options.features ?? createFeatureServices({ sql, runtime });

  const deps: ApiDependencies = {
    env,
    sql,
    secretStore,
    localAuth,
    settings,
    features,
    runtime,
  };

  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) {
          return "*";
        }
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return origin;
        }
        if (/^chrome-extension:\/\//.test(origin)) {
          return origin;
        }
        return null;
      },
    }),
  );

  registerErrorHandler(app);

  app.get(API_ROUTES.health, getHealthHandler(deps));
  app.get(API_ROUTES.metrics, getMetricsHandler(deps));
  app.get(API_ROUTES.content, getContentHandler(deps));
  app.get(API_ROUTES.providers, getProvidersHandler(deps));
  app.get(API_ROUTES.settings, getSettingsHandler(deps));
  app.put(API_ROUTES.settingsProviders, putSettingsProvidersHandler(deps));
  app.post(API_ROUTES.analyze, postAnalyzeHandler(features));
  app.post(API_ROUTES.verify, postVerifyHandler(features));
  app.post(API_ROUTES.trace, postTraceHandler(features));
  app.post(API_ROUTES.related, postRelatedHandler(features));

  return app;
}

export type SlopLensApp = ReturnType<typeof createApp>;
