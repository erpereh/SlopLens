import type { ProviderCapability } from "./selection";

export type EnvLookup = Record<string, string | undefined>;

const PROVIDER_SECRET_ENV_KEYS: Record<string, readonly string[]> = {
  jev: ["AI_GATEWAY_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  tavily: ["TAVILY_API_KEY"],
};

function firstEnvValue(env: EnvLookup, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function envSecretKeysForProvider(providerId: string): readonly string[] {
  return PROVIDER_SECRET_ENV_KEYS[providerId.toLowerCase()] ?? [];
}

export function readEnvSecretForProvider(providerId: string, env: EnvLookup): string | null {
  const value = firstEnvValue(env, envSecretKeysForProvider(providerId));
  return value ?? null;
}

export function isProviderSecretConfiguredInEnv(
  _capability: ProviderCapability,
  providerId: string,
  env: EnvLookup,
): boolean {
  return readEnvSecretForProvider(providerId, env) !== null;
}
