import { describe, expect, it } from "vitest";

import { validateProviderBaseUrl } from "./provider-base-url";

describe("validateProviderBaseUrl", () => {
  it("allows official OpenRouter, Tavily, and TypeSafe URLs", () => {
    expect(validateProviderBaseUrl("openrouter", "https://openrouter.ai/api/v1")).toBeNull();
    expect(validateProviderBaseUrl("openrouter", "https://openrouter.ai/api/v1/")).toBeNull();
    expect(validateProviderBaseUrl("tavily", "https://api.tavily.com")).toBeNull();
    expect(validateProviderBaseUrl("typesafe", "https://api.typesafe.ai/v1")).toBeNull();
  });

  it("rejects remote custom URLs for known providers", () => {
    expect(validateProviderBaseUrl("openrouter", "https://evil.example/api/v1")).toMatch(
      /not allowed/,
    );
    expect(validateProviderBaseUrl("tavily", "https://attacker.com")).toMatch(/not allowed/);
    expect(validateProviderBaseUrl("typesafe", "https://evil.example/v1")).toMatch(/not allowed/);
  });

  it("allows loopback and private hosts for local mocks", () => {
    expect(validateProviderBaseUrl("custom", "http://127.0.0.1:8080/v1")).toBeNull();
    expect(validateProviderBaseUrl("custom", "http://localhost:3000")).toBeNull();
    expect(validateProviderBaseUrl("openrouter", "http://192.168.1.10/proxy")).toBeNull();
  });

  it("rejects non-http(s) schemes", () => {
    expect(validateProviderBaseUrl("openrouter", "javascript:alert(1)")).toMatch(/http or https/);
    expect(validateProviderBaseUrl("openrouter", "file:///etc/passwd")).toMatch(/http or https/);
  });
});
