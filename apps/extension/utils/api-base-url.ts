/**
 * Public extension configuration. The only allowed runtime env var is WXT_API_BASE_URL.
 * Never read provider secrets from the extension bundle.
 */
export function getApiBaseUrl(): string {
  const value = import.meta.env.WXT_API_BASE_URL;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("WXT_API_BASE_URL is not configured");
  }
  return value.replace(/\/+$/, "");
}
