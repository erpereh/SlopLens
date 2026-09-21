import { createHash } from "node:crypto";

import type { NormalizedContent } from "@sloplens/core";

/**
 * Stable hash for cache lookups. Only includes normalized fields that affect analysis input.
 */
export function hashNormalizedContent(content: NormalizedContent): string {
  const payload = {
    platform: content.platform,
    externalId: content.externalId ?? null,
    url: content.url,
    author: content.author ?? null,
    title: content.title ?? null,
    text: content.text ?? null,
    publishedAt: content.publishedAt ?? null,
    media: content.media ?? [],
    metadata: content.metadata,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
