/**
 * Returns an href safe for user-facing links (http/https only).
 */
export function safeExternalHttpUrl(url: string | undefined): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.href;
  } catch {
    return undefined;
  }
}
