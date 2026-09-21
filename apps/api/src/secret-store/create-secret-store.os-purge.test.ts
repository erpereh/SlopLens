import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH } from "@sloplens/config";
import { FileSecretStore } from "@sloplens/config/secrets/file";
import { describe, expect, it, vi } from "vitest";

const osStore = new Map<string, string>();

vi.mock("./keyring-secret-store", () => ({
  isKeyringAvailable: () => true,
  KeyringSecretStore: class {
    readonly kind = "os" as const;
    async get(key: string) {
      return osStore.get(key) ?? null;
    }
    async set(key: string, value: string) {
      osStore.set(key, value);
    }
    async delete(key: string) {
      osStore.delete(key);
    }
  },
}));

describe("OsFirstSecretStore", () => {
  it("purges file fallback after a successful OS write", async () => {
    osStore.clear();
    const { createSecretStore } = await import("./create-secret-store");
    const dir = await mkdtemp(path.join(tmpdir(), "sloplens-api-secrets-os-"));
    const { store } = createSecretStore(dir);
    const filePath = path.join(dir, FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH);
    const file = new FileSecretStore(filePath);

    await file.set("search:tavily", "stale-file-copy");
    const beforeOs = JSON.parse(await readFile(filePath, "utf8")) as Record<string, string>;
    expect(beforeOs["search:tavily"]).toBe("stale-file-copy");

    await store.set("search:tavily", "from-os");
    const afterOs = JSON.parse(await readFile(filePath, "utf8")) as Record<string, string>;
    expect(afterOs["search:tavily"]).toBeUndefined();
    await expect(store.get("search:tavily")).resolves.toBe("from-os");
  });
});
