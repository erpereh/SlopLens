import type { NormalizedContent, Platform } from "@sloplens/core";

export interface PlatformAdapter {
  readonly platform: Platform;
  extract(node: unknown): NormalizedContent | null;
  findDimmableRegions(host: HTMLElement): HTMLElement[];
}
