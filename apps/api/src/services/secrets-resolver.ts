import {
  isProviderSecretConfiguredInEnv,
  type ProviderCapability,
  type ProviderSelection,
  readEnvSecretForProvider,
  resolveAllProviderConfigs,
  type SecretStore,
  secretStoreKey,
} from "@sloplens/config";

export async function isProviderSecretConfigured(input: {
  capability: ProviderCapability;
  providerId: string;
  secretStore: SecretStore;
  env: NodeJS.ProcessEnv;
}): Promise<boolean> {
  const key = secretStoreKey(input.capability, input.providerId);
  const fromStore = await input.secretStore.get(key);
  if (fromStore) {
    return true;
  }
  return isProviderSecretConfiguredInEnv(input.capability, input.providerId, input.env);
}

export async function resolveProviderSecret(input: {
  capability: ProviderCapability;
  providerId: string;
  secretStore: SecretStore;
  env: NodeJS.ProcessEnv;
}): Promise<string | null> {
  const key = secretStoreKey(input.capability, input.providerId);
  const fromStore = await input.secretStore.get(key);
  if (fromStore) {
    return fromStore;
  }
  return readEnvSecretForProvider(input.providerId, input.env);
}

export function resolveEffectiveSelections(input: {
  userSelections: ReadonlyArray<ProviderSelection>;
  env: NodeJS.ProcessEnv;
}): ReturnType<typeof resolveAllProviderConfigs> {
  return resolveAllProviderConfigs({
    userSelections: input.userSelections,
    env: input.env,
  });
}
