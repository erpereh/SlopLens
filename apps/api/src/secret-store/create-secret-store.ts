import path from "node:path";

import { FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH, type SecretStore } from "@sloplens/config";
import { FileSecretStore } from "@sloplens/config/secrets/file";

import { isKeyringAvailable, KeyringSecretStore } from "./keyring-secret-store";

export interface CreateSecretStoreResult {
  store: SecretStore;
  primary: "os" | "file_fallback";
}

class OsFirstSecretStore implements SecretStore {
  readonly kind: "os" | "file";
  readonly #os: KeyringSecretStore | null;
  readonly #file: FileSecretStore;

  constructor(os: KeyringSecretStore | null, file: FileSecretStore) {
    this.#os = os;
    this.#file = file;
    this.kind = os ? "os" : "file";
  }

  async get(key: string): Promise<string | null> {
    if (this.#os) {
      const fromOs = await this.#os.get(key);
      if (fromOs) {
        return fromOs;
      }
    }
    return this.#file.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.#os) {
      try {
        await this.#os.set(key, value);
        try {
          await this.#file.delete(key);
        } catch {
          // Best-effort purge of stale file fallback copies.
        }
        return;
      } catch {
        // Fall through to explicit file fallback.
      }
    }
    await this.#file.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (this.#os) {
      try {
        await this.#os.delete(key);
      } catch {
        // Continue to delete fallback copy if present.
      }
    }
    await this.#file.delete(key);
  }
}

export function createSecretStore(cwd: string = process.cwd()): CreateSecretStoreResult {
  const file = new FileSecretStore(path.join(cwd, FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH));
  const osAvailable = isKeyringAvailable();
  const os = osAvailable ? new KeyringSecretStore() : null;
  return {
    store: new OsFirstSecretStore(os, file),
    primary: osAvailable ? "os" : "file_fallback",
  };
}
