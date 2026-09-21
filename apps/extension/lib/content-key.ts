/**
 * Stable, synchronous fingerprint for overlay dedup and future cache keys.
 */
export function hashContentKey(parts: string[]): string {
  let hash = 5381;
  const input = parts.join("\u001f");
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
