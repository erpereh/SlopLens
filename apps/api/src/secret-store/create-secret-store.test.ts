import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("./keyring-secret-store", () => ({
  isKeyringAvailable: () => false,
  KeyringSecretStore: class {},
}));

describe("createSecretStore", () => {
  it("uses explicit file fallback when OS keyring is unavailable", {
    timeout: 15_000,
  }, async () => {
    const { createSecretStore } = await import("./create-secret-store");
    const dir = await mkdtemp(path.join(tmpdir(), "sloplens-api-secrets-"));
    const { store, primary } = createSecretStore(dir);

    expect(primary).toBe("file_fallback");
    expect(store.kind).toBe("file");

    await store.set("search:tavily", "secret-value");
    await expect(store.get("search:tavily")).resolves.toBe("secret-value");
  });
});
