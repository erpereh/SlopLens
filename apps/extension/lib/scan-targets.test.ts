import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { collectScanTargets } from "./scan-targets";

describe("collectScanTargets", () => {
  it("collects tweet articles on X", () => {
    const window = new Window({ url: "https://x.com/home" });
    window.document.body.innerHTML = `
      <article data-testid="tweet"><div>Tweet</div></article>
      <article data-testid="tweet"><div>Other</div></article>
    `;
    const targets = collectScanTargets("x", window.document as unknown as ParentNode);
    expect(targets).toHaveLength(2);
    expect(targets.every((target) => target.platform === "x")).toBe(true);
  });

  it("returns a single YouTube target when watch page has a video id", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123" });
    window.document.body.innerHTML = `<div id="primary-inner"></div>`;
    const targets = collectScanTargets("youtube", window.document as unknown as ParentNode);
    expect(targets).toHaveLength(1);
    expect(targets[0]?.platform).toBe("youtube");
  });
});
