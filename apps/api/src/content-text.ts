import type { NormalizedContent } from "@sloplens/core";

export function contentToEmbeddingText(content: NormalizedContent): string {
  const parts = [content.title, content.author, content.text].filter((part): part is string =>
    Boolean(part?.trim()),
  );
  const text = parts.join("\n").trim();
  return text.length > 0 ? text : content.url;
}

export function findImageUrl(content: NormalizedContent): string | undefined {
  const media = content.media ?? [];
  const thumbnail = media.find((item) => item.kind === "thumbnail");
  if (thumbnail) {
    return thumbnail.url;
  }
  return media.find((item) => item.kind === "image")?.url;
}
