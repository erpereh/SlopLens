import { MemorySecretStore } from "@sloplens/config";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listProviderSelections, replaceProviderSelections } from "../db/provider-selections";
import { createSettingsService } from "./settings-service";

vi.mock("../db/provider-selections", () => ({
  listProviderSelections: vi.fn(),
  replaceProviderSelections: vi.fn(),
}));

describe("createSettingsService", () => {
  beforeEach(() => {
    vi.mocked(listProviderSelections).mockReset();
    vi.mocked(replaceProviderSelections).mockReset();
    vi.mocked(listProviderSelections).mockResolvedValue([]);
  });

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

  it("rejects provider selections with disallowed remote base URLs", async () => {
    const service = createSettingsService({
      sql: null,
      secretStore: new MemorySecretStore(),
      env: {},
    });

    await expect(
      service.putProviderSettings({
        selections: [
          {
            capability: "embedding",
            providerId: "openrouter",
            baseUrl: "https://evil.example/v1",
          },
        ],
      }),
    ).rejects.toMatchObject({
      body: { code: "validation_error" },
    });
  });

  it("persists legacy jev / typesafe-ai/jev as typesafe + jev-latest", async () => {
    vi.mocked(listProviderSelections).mockResolvedValue([
      { capability: "decision", providerId: "jev", modelId: "typesafe-ai/jev" },
    ]);
    vi.mocked(replaceProviderSelections).mockResolvedValue();

    const service = createSettingsService({
      sql: {} as never,
      secretStore: new MemorySecretStore(),
      env: {},
    });

    const settings = await service.getSettings();
    expect(replaceProviderSelections).toHaveBeenCalledWith({} as never, [
      { capability: "decision", providerId: "typesafe", modelId: "jev-latest" },
    ]);
    expect(settings.selections).toEqual([
      { capability: "decision", providerId: "typesafe", modelId: "jev-latest" },
    ]);
  });

  it("returns the normalized decision selection if persistence fails", async () => {
    vi.mocked(listProviderSelections).mockResolvedValue([
      { capability: "decision", providerId: "jev" },
    ]);
    vi.mocked(replaceProviderSelections).mockRejectedValue(new Error("db locked"));

    const service = createSettingsService({
      sql: {} as never,
      secretStore: new MemorySecretStore(),
      env: {},
    });

    const settings = await service.getSettings();
    expect(settings.selections[0]).toEqual({
      capability: "decision",
      providerId: "typesafe",
      modelId: "jev-latest",
    });
  });
});
