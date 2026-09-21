import { describe, expect, it } from "vitest";

import { canonicalizeClaimText, extractCanonicalClaim } from "./canonical-claim";

describe("extractCanonicalClaim", () => {
  it("prefers title plus first sentence over a long dump", () => {
    const claim = extractCanonicalClaim({
      platform: "x",
      url: "https://x.com/u/status/1",
      title: "OpenAI announced GPT-6 Astra.",
      text: "The model is named Astra. Apply for a personal loan today. Security guards wanted.",
      metadata: {},
    });
    expect(claim).toContain("GPT-6 Astra");
    expect(claim.length).toBeLessThan(220);
  });

  it("strips urls and mentions", () => {
    expect(canonicalizeClaimText("See https://t.co/abcd @user GPT-6 Astra launched.")).toBe(
      "See GPT-6 Astra launched.",
    );
  });
});
