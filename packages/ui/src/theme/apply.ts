import type { ResolvedTheme } from "./types";

export type PortalRoot = Element | ShadowRoot;

export function applyResolvedTheme(
  root: HTMLElement,
  resolved: ResolvedTheme,
  reduceMotion: boolean,
): void {
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;
  if (reduceMotion) {
    root.dataset.reduceMotion = "true";
  } else {
    delete root.dataset.reduceMotion;
  }
}

export function findThemeCascadeRoot(from: Element | null): HTMLElement | null {
  if (typeof document === "undefined") {
    return from instanceof HTMLElement ? from : null;
  }
  if (!from) {
    return document.documentElement;
  }
  const rootNode = from.getRootNode();
  if (rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement) {
    return rootNode.host;
  }
  return document.documentElement;
}

export function findPortalRoot(from: Element | null): PortalRoot {
  if (typeof document === "undefined") {
    throw new Error("findPortalRoot requires a document");
  }
  if (!from) {
    return document.body;
  }
  const rootNode = from.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    return rootNode;
  }
  return document.body;
}
