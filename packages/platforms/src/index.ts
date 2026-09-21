export type { PlatformAdapter } from "./types";
export { detectPlatform, getPlatformAdapter } from "./registry";
export { findTweetArticles, xPlatformAdapter } from "./x/adapter";
export { X_SELECTORS } from "./x/selectors";
export {
  findYouTubeWatchRoot,
  getYouTubeVideoIdFromLocation,
  youtubePlatformAdapter,
} from "./youtube/adapter";
export { getLocationFromDocument } from "./youtube/location";
export { YOUTUBE_SELECTORS } from "./youtube/selectors";
