import { describe, expect, it } from "vitest";

import { detectPlatform } from "./registry";

describe("detectPlatform", () => {
  it("detects X and YouTube hosts", () => {
    expect(detectPlatform("x.com")).toBe("x");
    expect(detectPlatform("twitter.com")).toBe("x");
    expect(detectPlatform("www.youtube.com")).toBe("youtube");
    expect(detectPlatform("example.com")).toBeNull();
  });
});
