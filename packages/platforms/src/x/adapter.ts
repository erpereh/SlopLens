import type { NormalizedContent } from "@sloplens/core";

import type { PlatformAdapter } from "../types";
import { X_SELECTORS } from "./selectors";

const STATUS_ID_PATTERN = /\/status\/(\d+)/;

export function findTweetArticles(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(X_SELECTORS.tweetArticle));
}

function readText(element: Element | null): string | undefined {
  const value = element?.textContent?.trim();
  return value && value.length > 0 ? value : undefined;
}

function resolveStatusUrl(article: HTMLElement): string | null {
  const timeLink = article.querySelector<HTMLAnchorElement>(`${X_SELECTORS.tweetTime} a`);
  if (timeLink?.href) {
    try {
      return new URL(timeLink.href).toString();
    } catch {
      return null;
    }
  }
  const anyStatus = article.querySelector<HTMLAnchorElement>('a[href*="/status/"]');
  if (anyStatus?.href) {
    try {
      return new URL(anyStatus.href).toString();
    } catch {
      return null;
    }
  }
  return null;
}

function resolveExternalId(url: string): string | undefined {
  const match = STATUS_ID_PATTERN.exec(url);
  return match?.[1];
}

export const xPlatformAdapter: PlatformAdapter = {
  platform: "x",
  extract(node: unknown): NormalizedContent | null {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    if (!node.matches(X_SELECTORS.tweetArticle)) {
      return null;
    }

    const url = resolveStatusUrl(node);
    if (!url) {
      return null;
    }

    const text = readText(node.querySelector(X_SELECTORS.tweetText));
    const author = readText(node.querySelector(X_SELECTORS.userName));
    const timeElement = node.querySelector("time");
    const publishedAt = timeElement?.getAttribute("datetime") ?? undefined;

    const externalId = resolveExternalId(url);

    return {
      platform: "x",
      url,
      ...(externalId ? { externalId } : {}),
      ...(author ? { author } : {}),
      ...(text ? { text } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      metadata: {
        source: "dom",
      },
    };
  },
};
