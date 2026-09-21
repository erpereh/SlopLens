import { describe, expect, it } from "vitest";

import { isProviderSecretConfiguredInEnv, readEnvSecretForProvider } from "./env-secrets";

describe("env-secrets", () => {
  it("reads bootstrap keys by provider id without logging values", () => {
    const env = { OPENROUTER_API_KEY: "  sk-test  " };
    expect(readEnvSecretForProvider("openrouter", env)).toBe("sk-test");
    expect(isProviderSecretConfiguredInEnv("embedding", "openrouter", env)).toBe(true);
    expect(
      isProviderSecretConfiguredInEnv("decision", "typesafe", { TYPESAFE_AI_API_KEY: "ts-key" }),
    ).toBe(true);
    expect(readEnvSecretForProvider("jev", { AI_GATEWAY_API_KEY: "gw-key" })).toBeNull();
  });

  it("returns null when no bootstrap key exists", () => {
    expect(readEnvSecretForProvider("tavily", {})).toBeNull();
  });
});
