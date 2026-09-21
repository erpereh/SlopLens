import type { ProviderCapability } from "./selection";

export const SECRET_STORE_KINDS = ["os", "file", "memory"] as const;

export type SecretStoreKind = (typeof SECRET_STORE_KINDS)[number];

export const OS_SECRET_STORE_SERVICE_NAME = "sloplens";

/**
 * Relative path of the encapsulated file fallback.
 * This is not the primary secret store. Gitignore this path.
 */
export const FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH = ".data/secret-store.json";

export interface SecretStore {
  readonly kind: SecretStoreKind;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Primary SecretStore: OS credential store (Windows Credential Manager / keychain).
 * Gate 0 freezes the interface only. Foundation implements the OS adapter.
 */
export interface OsSecretStore extends SecretStore {
  readonly kind: "os";
}

export interface OsSecretStoreOptions {
  serviceName?: string;
}

export function secretStoreKey(capability: ProviderCapability, providerId: string): string {
  return `${capability}:${providerId}`;
}

export class MemorySecretStore implements SecretStore {
  readonly kind = "memory" as const;
  readonly #values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.#values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.#values.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.#values.delete(key);
  }
}
