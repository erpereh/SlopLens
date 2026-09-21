import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { findTweetArticles, xPlatformAdapter } from "./adapter";

const TWEET_FIXTURE = `
<article data-testid="tweet">
  <div data-testid="User-Name">Jane Doe</div>
  <div data-testid="tweetText">Hello from SlopLens</div>
  <time datetime="2026-01-15T12:00:00.000Z"><a href="https://x.com/jane/status/1234567890">Jan 15</a></time>
</article>
`;

describe("xPlatformAdapter", () => {
  it("extracts normalized content from a tweet article", () => {
    const window = new Window();
    const document = window.document;
    document.body.innerHTML = TWEET_FIXTURE;
    const article = findTweetArticles(document)[0];
    expect(article).toBeDefined();

    const content = xPlatformAdapter.extract(article);
    expect(content).toMatchObject({
      platform: "x",
      externalId: "1234567890",
      url: "https://x.com/jane/status/1234567890",
      author: "Jane Doe",
      text: "Hello from SlopLens",
      publishedAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("returns null for non-tweet nodes", () => {
    const window = new Window();
    const div = window.document.createElement("div");
    expect(xPlatformAdapter.extract(div)).toBeNull();
  });
});
