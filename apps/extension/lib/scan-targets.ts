import type { Platform } from "@sloplens/core";
import {
  findTweetArticles,
  getLocationFromDocument,
  getYouTubeVideoIdFromLocation,
} from "@sloplens/platforms";

export interface ScanTarget {
  host: HTMLElement;
  platform: Platform;
}

function resolveDocumentFromRoot(root: ParentNode): Document | null {
  if (typeof Document !== "undefined" && root instanceof Document) {
    return root;
  }
  if ("nodeType" in root && root.nodeType === 9) {
    return root as Document;
  }
  return root.ownerDocument;
}

export function collectScanTargets(platform: Platform, root: ParentNode): ScanTarget[] {
  if (platform === "x") {
    return findTweetArticles(root).map((host) => ({ host, platform }));
  }
  if (platform === "youtube") {
    const doc = resolveDocumentFromRoot(root);
    if (!doc || !getYouTubeVideoIdFromLocation(getLocationFromDocument(doc))) {
      return [];
    }
    const host = doc.querySelector<HTMLElement>("#primary-inner") ?? doc.documentElement;
    return [{ host, platform }];
  }
  return [];
}
