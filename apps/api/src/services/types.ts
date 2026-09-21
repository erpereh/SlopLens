import type { SecretStore } from "@sloplens/config";
import type postgres from "postgres";
import type { ApiEnv } from "../env";
import type { createSettingsService } from "./settings-service";

export interface ApiDependencies {
  env: ApiEnv;
  sql: postgres.Sql | null;
  secretStore: SecretStore;
  settings: ReturnType<typeof createSettingsService>;
}
