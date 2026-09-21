import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { getLocationFromDocument } from "./location";
import { getYouTubeVideoIdFromLocation } from "./adapter";

describe("getLocationFromDocument", () => {
  it("resolves watch URL from a Happy DOM document", () => {
    const window = new Window({ url: "https://www.youtube.com/watch?v=abc123XYZ" });
    const location = getLocationFromDocument(window.document);
    expect(getYouTubeVideoIdFromLocation(location)).toBe("abc123XYZ");
  });
});
