export const YOUTUBE_SELECTORS = {
  watchTitle:
    "h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, h1.ytd-video-primary-info-renderer",
  channelName:
    "#owner #channel-name a, ytd-channel-name#channel-name a, #upload-info #channel-name a",
  description:
    "#description-inline-expander yt-formatted-string, ytd-text-inline-expander#description-inline-expander, #description yt-formatted-string",
  transcriptSegment: "ytd-transcript-segment-renderer",
  transcriptText: ".segment-text, yt-formatted-string.segment-text",
} as const;
