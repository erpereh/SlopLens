import type { Platform } from "@sloplens/core";
import type { PlatformAdapter } from "./types";
import { xPlatformAdapter } from "./x/adapter";
import { youtubePlatformAdapter } from "./youtube/adapter";

const adapters: Record<Platform, PlatformAdapter> = {
  x: xPlatformAdapter,
  youtube: youtubePlatformAdapter,
};

export function getPlatformAdapter(platform: Platform): PlatformAdapter {
  return adapters[platform];
}

export function detectPlatform(hostname: string): Platform | null {
  const host = hostname.toLowerCase();
  if (
    host === "x.com" ||
    host === "twitter.com" ||
    host.endsWith(".x.com") ||
    host.endsWith(".twitter.com")
  ) {
    return "x";
  }
  if (host === "youtube.com" || host === "www.youtube.com" || host.endsWith(".youtube.com")) {
    return "youtube";
  }
  return null;
}
