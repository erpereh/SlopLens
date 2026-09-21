import { API_ROUTES } from "@sloplens/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createSqlClient } from "./db/client";
import type { ApiEnv } from "./env";
import { registerErrorHandler } from "./middleware/error-handler";
import {
  postAnalyzeHandler,
  postRelatedHandler,
  postTraceHandler,
  postVerifyHandler,
} from "./routes/feature-stubs";
import { getHealthHandler } from "./routes/health";
import { getProvidersHandler } from "./routes/providers";
import { getSettingsHandler, putSettingsProvidersHandler } from "./routes/settings";
import { createSecretStore } from "./secret-store/create-secret-store";
import { createSettingsService } from "./services/settings-service";
import type { ApiDependencies } from "./services/types";

export function createApp(env: ApiEnv): Hono {
  const sql = createSqlClient(env.databaseUrl);
  const { store: secretStore } = createSecretStore();
  const settings = createSettingsService({
    sql,
    secretStore,
    env: env.raw,
  });

  const deps: ApiDependencies = {
    env,
    sql,
    secretStore,
    settings,
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
        return null;
      },
    }),
  );

  registerErrorHandler(app);

  app.get(API_ROUTES.health, getHealthHandler(deps));
  app.get(API_ROUTES.providers, getProvidersHandler(deps));
  app.get(API_ROUTES.settings, getSettingsHandler(deps));
  app.put(API_ROUTES.settingsProviders, putSettingsProvidersHandler(deps));
  app.post(API_ROUTES.analyze, postAnalyzeHandler);
  app.post(API_ROUTES.verify, postVerifyHandler);
  app.post(API_ROUTES.trace, postTraceHandler);
  app.post(API_ROUTES.related, postRelatedHandler);

  return app;
}

export type SlopLensApp = ReturnType<typeof createApp>;
