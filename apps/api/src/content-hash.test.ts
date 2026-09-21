import type { NormalizedContent } from "@sloplens/core";
import { describe, expect, it } from "vitest";

import { hashNormalizedContent } from "./content-hash";

const baseContent: NormalizedContent = {
  platform: "x",
  url: "https://x.com/user/status/1",
  metadata: {},
};

describe("hashNormalizedContent", () => {
  it("is stable for the same normalized payload", () => {
    const first = hashNormalizedContent(baseContent);
    const second = hashNormalizedContent({ ...baseContent });
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when relevant content fields change", () => {
    const baseline = hashNormalizedContent(baseContent);
    const changed = hashNormalizedContent({
      ...baseContent,
      text: "different body",
    });
    expect(changed).not.toBe(baseline);
  });
});
