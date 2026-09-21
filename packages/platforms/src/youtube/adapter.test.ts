import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { getYouTubeVideoIdFromLocation, youtubePlatformAdapter } from "./adapter";

describe("youtubePlatformAdapter", () => {
  it("reads video id from watch URL", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123XYZ" });
    expect(getYouTubeVideoIdFromLocation(window.location)).toBe("abc123XYZ");
  });

  it("extracts visible metadata and marks transcript unavailable", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123XYZ" });
    const document = window.document;
    document.body.innerHTML = `
      <h1 class="ytd-watch-metadata"><yt-formatted-string>Clickbait title</yt-formatted-string></h1>
      <div id="owner"><div id="channel-name"><a href="/channel/x">Creator Channel</a></div></div>
      <div id="description-inline-expander"><yt-formatted-string>Visible description</yt-formatted-string></div>
    `;

    const content = youtubePlatformAdapter.extract(document);
    expect(content).toMatchObject({
      platform: "youtube",
      externalId: "abc123XYZ",
      title: "Clickbait title",
      author: "Creator Channel",
      text: "Visible description",
      metadata: {
        transcriptStatus: "transcript_unavailable",
        videoId: "abc123XYZ",
      },
    });
    expect(content?.media?.[0]).toMatchObject({
      kind: "thumbnail",
      url: "https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg",
    });
  });

  it("includes transcript when segments exist in the DOM", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123XYZ" });
    const document = window.document;
    document.body.innerHTML = `
      <h1 class="ytd-watch-metadata"><yt-formatted-string>Title</yt-formatted-string></h1>
      <ytd-transcript-segment-renderer><yt-formatted-string class="segment-text">Line one</yt-formatted-string></ytd-transcript-segment-renderer>
      <ytd-transcript-segment-renderer><yt-formatted-string class="segment-text">Line two</yt-formatted-string></ytd-transcript-segment-renderer>
    `;

    const content = youtubePlatformAdapter.extract(document);
    expect(content?.text).toContain("Line one");
    expect(content?.text).toContain("Line two");
    expect(content?.metadata.transcriptStatus).toBeUndefined();
  });
});
