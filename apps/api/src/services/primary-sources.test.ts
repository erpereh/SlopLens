import { describe, expect, it } from "vitest";

import { classifySourceKind, rankSearchResults } from "./primary-sources";

describe("primary source ordering", () => {
  it("ranks government and academic hosts ahead of social posts", () => {
    const ranked = rankSearchResults([
      { url: "https://x.com/user/status/1", title: "A post", score: 0.99 },
      { url: "https://www.nih.gov/news", title: "NIH release", score: 0.2 },
      { url: "https://arxiv.org/abs/1", title: "Paper", score: 0.3 },
    ]);

    expect(ranked.map((row) => row.url)).toEqual([
      "https://www.nih.gov/news",
      "https://arxiv.org/abs/1",
      "https://x.com/user/status/1",
    ]);
  });

  it("classifies official domains as primary", () => {
    expect(classifySourceKind("https://www.cdc.gov/page")).toBe("primary");
    expect(classifySourceKind("https://example.com/blog")).toBe("other");
  });
});
