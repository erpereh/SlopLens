import { Entry } from "@napi-rs/keyring";

import {
  OS_SECRET_STORE_SERVICE_NAME,
  type OsSecretStore,
  type OsSecretStoreOptions,
} from "@sloplens/config";

export class KeyringSecretStore implements OsSecretStore {
  readonly kind = "os" as const;
  readonly #serviceName: string;

  constructor(options: OsSecretStoreOptions = {}) {
    this.#serviceName = options.serviceName ?? OS_SECRET_STORE_SERVICE_NAME;
  }

  #entry(account: string): Entry {
    return new Entry(this.#serviceName, account);
  }

  async get(account: string): Promise<string | null> {
    try {
      return this.#entry(account).getPassword();
    } catch {
      return null;
    }
  }

  async set(account: string, value: string): Promise<void> {
    this.#entry(account).setPassword(value);
  }

  async delete(account: string): Promise<void> {
    try {
      this.#entry(account).deletePassword();
    } catch {
      // Missing entries are fine.
    }
  }
}

export function isKeyringAvailable(): boolean {
  try {
    const entry = new Entry("__sloplens_probe__", "__probe__");
    entry.setPassword("1");
    entry.deletePassword();
    return true;
  } catch {
    return false;
  }
}
