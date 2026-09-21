import { describe, expect, it } from "vitest";

import { applySlopMarker, clearSlopMarker, SLOP_DIMMED_ATTR, SLOP_STAMP_ATTR } from "./slop-marker";

describe("slop marker", () => {
  it("dims content regions, keeps the stamp non-interactive, and can be cleared", () => {
    const host = document.createElement("article");
    const text = document.createElement("div");
    text.setAttribute("data-testid", "tweetText");
    host.append(text);
    document.body.append(host);

    applySlopMarker({ host, regions: [text], dim: true, showStamp: true });
    expect(text.getAttribute(SLOP_DIMMED_ATTR)).toBe("true");
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(stamp?.textContent).toBe("SLOP");
    expect(getComputedStyle(stamp as Element).pointerEvents).toBe("none");

    clearSlopMarker(host);
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBeNull();
    expect(text.getAttribute(SLOP_DIMMED_ATTR)).toBeNull();
    host.remove();
  });
});
