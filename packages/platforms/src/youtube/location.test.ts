import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { getYouTubeVideoIdFromLocation } from "./adapter";
import { getLocationFromDocument } from "./location";

describe("getLocationFromDocument", () => {
  it("resolves watch URL from a Happy DOM document", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123XYZ" });
    const location = getLocationFromDocument(window.document as unknown as Document);
    expect(getYouTubeVideoIdFromLocation(location)).toBe("abc123XYZ");
  });
});
