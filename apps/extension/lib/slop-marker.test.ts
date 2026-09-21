import { describe, expect, it } from "vitest";

import {
  applySlopMarker,
  clearSlopMarker,
  mutationsAreOnlySlopLens,
  SLOP_DIMMED_ATTR,
  SLOP_MARKER_SCORE_ATTR,
  SLOP_STAMP_ANIMATE_ATTR,
  SLOP_STAMP_ATTR,
} from "./slop-marker";

function makeHost() {
  const host = document.createElement("article");
  const text = document.createElement("div");
  text.setAttribute("data-testid", "tweetText");
  host.append(text);
  document.body.append(host);
  return { host, text };
}

const base = {
  contentKey: "tweet-1",
  slopScore: 0.82,
  threshold: 0.7,
  dim: true,
  showStamp: true,
};

describe("slop marker", () => {
  it("dims content regions, keeps the stamp non-interactive, and can be cleared", () => {
    const { host, text } = makeHost();

    applySlopMarker({ host, regions: [text], ...base });
    expect(text.getAttribute(SLOP_DIMMED_ATTR)).toBe("true");
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(stamp?.textContent).toBe("SLOP");
    expect(getComputedStyle(stamp as Element).pointerEvents).toBe("none");

    clearSlopMarker(host);
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBeNull();
    expect(text.getAttribute(SLOP_DIMMED_ATTR)).toBeNull();
    host.remove();
  });

  it("reuses the identical stamp node across 20 rescans with the same inputs", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    const first = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(first).toBeInstanceOf(HTMLElement);

    for (let i = 0; i < 20; i += 1) {
      applySlopMarker({ host, regions: [text], ...base });
    }

    const after = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(after).toBe(first);
    expect(host.querySelectorAll(`[${SLOP_STAMP_ATTR}]`)).toHaveLength(1);
    host.remove();
  });

  it("animates the stamp only on first insert", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(stamp?.getAttribute(SLOP_STAMP_ANIMATE_ATTR)).toBe("true");

    stamp?.dispatchEvent(new Event("animationend"));
    expect(stamp?.hasAttribute(SLOP_STAMP_ANIMATE_ATTR)).toBe(false);

    applySlopMarker({ host, regions: [text], ...base });
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBe(stamp);
    expect(stamp?.hasAttribute(SLOP_STAMP_ANIMATE_ATTR)).toBe(false);
    host.remove();
  });

  it("does not recreate or reanimate the stamp when only score metadata changes", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    stamp?.removeAttribute(SLOP_STAMP_ANIMATE_ATTR);

    applySlopMarker({ host, regions: [text], ...base, slopScore: 0.91 });
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBe(stamp);
    expect(stamp?.hasAttribute(SLOP_STAMP_ANIMATE_ATTR)).toBe(false);
    expect(host.getAttribute(SLOP_MARKER_SCORE_ATTR)).toBe("0.91");
    host.remove();
  });

  it("updates dim without recreating the stamp", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);

    applySlopMarker({ host, regions: [text], ...base, dim: false });
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBe(stamp);
    expect(text.getAttribute(SLOP_DIMMED_ATTR)).toBeNull();
    host.remove();
  });

  it("removes the stamp once when showStamp becomes false and later applies are no-ops", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    applySlopMarker({ host, regions: [text], ...base, showStamp: false });
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBeNull();

    applySlopMarker({ host, regions: [text], ...base, showStamp: false });
    expect(host.querySelector(`[${SLOP_STAMP_ATTR}]`)).toBeNull();
    host.remove();
  });

  it("treats SlopLens-owned mutations as ignorable", () => {
    const { host, text } = makeHost();
    applySlopMarker({ host, regions: [text], ...base });
    const stamp = host.querySelector(`[${SLOP_STAMP_ATTR}]`);
    expect(stamp).toBeTruthy();
    const record = {
      type: "childList",
      target: host,
      addedNodes: [stamp as Node],
      removedNodes: [] as Node[],
    } as unknown as MutationRecord;
    expect(mutationsAreOnlySlopLens([record])).toBe(true);

    const pageNode = document.createElement("div");
    const pageRecord = {
      type: "childList",
      target: document.body,
      addedNodes: [pageNode],
      removedNodes: [] as Node[],
    } as unknown as MutationRecord;
    expect(mutationsAreOnlySlopLens([pageRecord])).toBe(false);
    host.remove();
  });
});
