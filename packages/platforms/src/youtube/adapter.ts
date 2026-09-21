import type { NormalizedContent } from "@sloplens/core";

import type { PlatformAdapter } from "../types";
import { getLocationFromDocument } from "./location";
import { YOUTUBE_SELECTORS } from "./selectors";

export function getYouTubeVideoIdFromLocation(
  location: Pick<Location, "href" | "pathname">,
): string | null {
  try {
    const url = new URL(location.href);
    const fromQuery = url.searchParams.get("v");
    if (fromQuery && fromQuery.length > 0) {
      return fromQuery;
    }
  } catch {
    return null;
  }
  const shortsMatch = /^\/shorts\/([^/?#]+)/.exec(location.pathname);
  return shortsMatch?.[1] ?? null;
}

function readText(root: ParentNode, selector: string): string | undefined {
  const element = root.querySelector(selector);
  const value = element?.textContent?.trim();
  return value && value.length > 0 ? value : undefined;
}

function buildThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function extractTranscript(root: ParentNode): string | undefined {
  const segments = root.querySelectorAll(YOUTUBE_SELECTORS.transcriptSegment);
  if (segments.length === 0) {
    return undefined;
  }
  const lines: string[] = [];
  for (const segment of segments) {
    const text = segment.querySelector(YOUTUBE_SELECTORS.transcriptText)?.textContent?.trim();
    if (text) {
      lines.push(text);
    }
  }
  const joined = lines.join("\n").trim();
  return joined.length > 0 ? joined : undefined;
}

export function findYouTubeWatchRoot(root: ParentNode): HTMLElement | null {
  if (root instanceof Document) {
    return root.documentElement;
  }
  if (root instanceof HTMLElement) {
    return root;
  }
  return null;
}

function resolveDocument(node: unknown): Document | null {
  if (node instanceof HTMLElement) {
    return node.ownerDocument;
  }
  if (typeof Document !== "undefined" && node instanceof Document) {
    return node;
  }
  if (
    node &&
    typeof node === "object" &&
    "nodeType" in node &&
    (node as { nodeType: number }).nodeType === 9
  ) {
    return node as Document;
  }
  return null;
}

export const youtubePlatformAdapter: PlatformAdapter = {
  platform: "youtube",
  extract(node: unknown): NormalizedContent | null {
    const doc = resolveDocument(node);
    if (!doc) {
      return null;
    }

    const pageLocation = getLocationFromDocument(doc);
    const videoId = getYouTubeVideoIdFromLocation(pageLocation);
    if (!videoId) {
      return null;
    }

    const scanRoot = node instanceof HTMLElement ? node : doc;
    const title = readText(scanRoot, YOUTUBE_SELECTORS.watchTitle);
    const author = readText(scanRoot, YOUTUBE_SELECTORS.channelName);
    const description = readText(scanRoot, YOUTUBE_SELECTORS.description);
    const transcript = extractTranscript(scanRoot);

    const url = new URL(pageLocation.href);
    url.searchParams.set("v", videoId);
    url.pathname = "/watch";

    const metadata: Record<string, unknown> = {
      source: "dom",
      videoId,
    };
    if (!transcript) {
      metadata.transcriptStatus = "transcript_unavailable";
    }

    const textParts = [description, transcript].filter((part): part is string => Boolean(part));
    const text = textParts.length > 0 ? textParts.join("\n\n") : undefined;

    return {
      platform: "youtube",
      externalId: videoId,
      url: url.toString(),
      ...(title ? { title } : {}),
      ...(author ? { author } : {}),
      ...(text ? { text } : {}),
      media: [
        {
          kind: "thumbnail",
          url: buildThumbnailUrl(videoId),
          alt: title ?? `YouTube video ${videoId}`,
        },
      ],
      metadata,
    };
  },
};
