/**
 * Allowed remote base URLs per known provider (MVP allowlist).
 * Custom remote URLs are rejected to prevent API key exfiltration via PUT /settings/providers.
 */

export const OFFICIAL_PROVIDER_BASE_URLS: Readonly<Record<string, readonly string[]>> = {
  openrouter: ["https://openrouter.ai/api/v1"],
  tavily: ["https://api.tavily.com"],
};

export function normalizeProviderBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function isLoopbackOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "::1" || host.endsWith(".localhost")) {
    return true;
  }
  if (host.startsWith("127.")) {
    return true;
  }
  const parts = host.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) {
    const a = parts[0];
    const b = parts[1];
    if (a === 10) {
      return true;
    }
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
      return true;
    }
    if (a === 192 && b === 168) {
      return true;
    }
    if (a === 169 && b === 254) {
      return true;
    }
    if (a === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Returns a human-readable validation error, or null when the base URL is allowed.
 */
export function validateProviderBaseUrl(providerId: string, baseUrl?: string): string | null {
  if (!baseUrl?.trim()) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(baseUrl.trim());
  } catch {
    return "Provider base URL must be a valid URL";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Provider base URL must use http or https";
  }

  if (parsed.username || parsed.password) {
    return "Provider base URL must not include credentials";
  }

  const normalized = normalizeProviderBaseUrl(parsed.href);
  const official = OFFICIAL_PROVIDER_BASE_URLS[providerId.toLowerCase()];
  if (official?.some((entry) => normalizeProviderBaseUrl(entry) === normalized)) {
    return null;
  }

  if (isLoopbackOrPrivateHost(parsed.hostname)) {
    return null;
  }

  return `Provider base URL is not allowed for ${providerId}`;
}
