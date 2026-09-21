import type { SecretStore } from "@sloplens/config";
import type postgres from "postgres";
import type { ApiEnv } from "../env";
import type { FeatureServices } from "./feature-services";
import type { LocalAuthService } from "./local-auth";
import type { ProviderRuntime } from "./provider-runtime";
import type { createSettingsService } from "./settings-service";

export interface ApiDependencies {
  env: ApiEnv;
  sql: postgres.Sql | null;
  secretStore: SecretStore;
  localAuth: LocalAuthService;
  settings: ReturnType<typeof createSettingsService>;
  features: FeatureServices;
  runtime: ProviderRuntime;
}
