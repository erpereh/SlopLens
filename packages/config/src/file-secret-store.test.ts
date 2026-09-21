import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FileSecretStore } from "./file-secret-store";
import { FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH } from "./secrets";

describe("FileSecretStore", () => {
  it("is an explicit fallback, not the primary store", () => {
    const store = new FileSecretStore("/tmp/unused.json");
    expect(store.kind).toBe("file");
    expect(store.isFallback).toBe(true);
    expect(FILE_SECRET_STORE_FALLBACK_RELATIVE_PATH).toBe(".data/secret-store.json");
  });

  it("round-trips values without exposing them in the instance", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sloplens-secrets-"));
    const filePath = path.join(dir, "secret-store.json");
    const store = new FileSecretStore(filePath);

    await store.set("embedding:test", "super-secret");
    await expect(store.get("embedding:test")).resolves.toBe("super-secret");
    const persisted = JSON.parse(await readFile(filePath, "utf8")) as Record<string, string>;
    expect(persisted["embedding:test"]).toBe("super-secret");

    await store.delete("embedding:test");
    await expect(store.get("embedding:test")).resolves.toBeNull();
  });
});
