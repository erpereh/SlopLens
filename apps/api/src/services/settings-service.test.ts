import { MemorySecretStore } from "@sloplens/config";
import { describe, expect, it } from "vitest";

import { createSettingsService } from "./settings-service";

describe("createSettingsService", () => {
  it("never returns secret values in settings responses", async () => {
    const secretStore = new MemorySecretStore();
    await secretStore.set("embedding:openrouter", "super-secret-key");

    const service = createSettingsService({
      sql: null,
      secretStore,
      env: {
        EMBEDDING_PROVIDER: "openrouter",
        EMBEDDING_MODEL: "test-model",
        OPENROUTER_API_KEY: "bootstrap-key",
      },
    });

    const settings = await service.getSettings();
    const serialized = JSON.stringify(settings);

    expect(settings.secrets.every((entry) => typeof entry.configured === "boolean")).toBe(true);
    expect(serialized.includes("super-secret-key")).toBe(false);
    expect(serialized.includes("bootstrap-key")).toBe(false);
    expect(serialized.includes("apiKey")).toBe(false);
  });
});
