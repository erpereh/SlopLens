export {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
  providerCapabilitySchema,
  providerSelectionSchema,
} from "./browser";
export {
  DEFAULT_TYPESAFE_MODEL_ID,
  isLegacyDecisionSelection,
  LEGACY_DECISION_PROVIDER_ID,
  LEGACY_GATEWAY_DECISION_MODEL_ID,
  normalizeDecisionSelection,
  normalizeProviderSelections,
  providerSelectionsEqual,
  TYPESAFE_PROVIDER_ID,
} from "./decision-selection";
export {
  type EnvLookup as SecretEnvLookup,
  envSecretKeysForProvider,
  isProviderSecretConfiguredInEnv,
  readEnvSecretForProvider,
} from "./env-secrets";
export { PGVECTOR_EMBEDDING_DIMENSIONS } from "./pgvector-dimensions";
export {
  normalizeProviderBaseUrl,
  OFFICIAL_PROVIDER_BASE_URLS,
  validateProviderBaseUrl,
} from "./provider-base-url";
export {
  CONFIG_SOURCES,
  type ConfigSource,
  type EnvLookup,
  isUsableSelection,
  type ResolvedProviderConfig,
  readEnvProviderSelection,
  resolveAllProviderConfigs,
  resolveProviderConfig,
} from "./resolve";
export {
  FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH,
  MemorySecretStore,
  OS_SECRET_STORE_SERVICE_NAME,
  type OsSecretStore,
  type OsSecretStoreOptions,
  SECRET_STORE_KINDS,
  type SecretStore,
  type SecretStoreKind,
  secretStoreKey,
} from "./secrets";
// FileSecretStore is Node-only (fs/ACL). Import `@sloplens/config/secrets/file`.
