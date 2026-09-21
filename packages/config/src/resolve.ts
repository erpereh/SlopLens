import {
  PROVIDER_CAPABILITIES,
  type ProviderCapability,
  type ProviderSelection,
} from "./selection";

export const CONFIG_SOURCES = ["user", "env", "unconfigured"] as const;

export type ConfigSource = (typeof CONFIG_SOURCES)[number];

export interface ResolvedProviderConfig {
  capability: ProviderCapability;
  source: ConfigSource;
  selection: ProviderSelection | null;
}

export interface EnvLookup {
  [key: string]: string | undefined;
}

const ENV_KEYS: Record<
  ProviderCapability,
  {
    providerId: readonly string[];
    modelId: readonly string[];
    baseUrl: readonly string[];
  }
> = {
  decision: {
    providerId: ["DECISION_PROVIDER"],
    modelId: ["DECISION_MODEL"],
    baseUrl: ["TYPESAFE_AI_BASE_URL", "DECISION_BASE_URL"],
  },
  embedding: {
    providerId: ["EMBEDDING_PROVIDER"],
    modelId: ["EMBEDDING_MODEL"],
    baseUrl: ["EMBEDDING_BASE_URL", "OPENROUTER_BASE_URL"],
  },
  search: {
    providerId: ["SEARCH_PROVIDER"],
    modelId: ["SEARCH_MODEL"],
    baseUrl: ["SEARCH_BASE_URL"],
  },
  vision: {
    providerId: ["VISION_PROVIDER"],
    modelId: ["VISION_MODEL"],
    baseUrl: ["VISION_BASE_URL", "OPENROUTER_BASE_URL"],
  },
  reasoning: {
    providerId: ["REASONING_PROVIDER"],
    modelId: ["REASONING_MODEL"],
    baseUrl: ["REASONING_BASE_URL", "OPENROUTER_BASE_URL"],
  },
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

export function isUsableSelection(
  selection: ProviderSelection | null | undefined,
  capability: ProviderCapability,
): selection is ProviderSelection {
  return Boolean(selection && selection.capability === capability && selection.providerId.trim());
}

export function resolveProviderConfig(input: {
  capability: ProviderCapability;
  userSelection?: ProviderSelection | null;
  envSelection?: ProviderSelection | null;
}): ResolvedProviderConfig {
  const { capability } = input;

  if (isUsableSelection(input.userSelection, capability)) {
    return { capability, source: "user", selection: input.userSelection };
  }

  if (isUsableSelection(input.envSelection, capability)) {
    return { capability, source: "env", selection: input.envSelection };
  }

  return { capability, source: "unconfigured", selection: null };
}

export function readEnvProviderSelection(
  capability: ProviderCapability,
  env: EnvLookup,
): ProviderSelection | null {
  const keys = ENV_KEYS[capability];
  const providerId = firstEnvValue(env, keys.providerId);
  if (!providerId) {
    return null;
  }

  const modelId = firstEnvValue(env, keys.modelId);
  const baseUrl = firstEnvValue(env, keys.baseUrl);

  return {
    capability,
    providerId,
    ...(modelId ? { modelId } : {}),
    ...(baseUrl ? { baseUrl } : {}),
  };
}

export function resolveAllProviderConfigs(input: {
  userSelections?: ReadonlyArray<ProviderSelection>;
  env: EnvLookup;
}): Record<ProviderCapability, ResolvedProviderConfig> {
  const userByCapability = new Map<ProviderCapability, ProviderSelection>();
  for (const selection of input.userSelections ?? []) {
    if (!userByCapability.has(selection.capability) && selection.providerId.trim()) {
      userByCapability.set(selection.capability, selection);
    }
  }

  const resolved = {} as Record<ProviderCapability, ResolvedProviderConfig>;
  for (const capability of PROVIDER_CAPABILITIES) {
    resolved[capability] = resolveProviderConfig({
      capability,
      userSelection: userByCapability.get(capability) ?? null,
      envSelection: readEnvProviderSelection(capability, input.env),
    });
  }
  return resolved;
}
