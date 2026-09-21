import { describe, expect, it } from "vitest";

import { hashContentKey } from "./content-key";

describe("hashContentKey", () => {
  it("returns a stable hash for the same input", () => {
    expect(hashContentKey(["x", "https://x.com/a/status/1"])).toBe(
      hashContentKey(["x", "https://x.com/a/status/1"]),
    );
  });

  it("changes when parts change", () => {
    const a = hashContentKey(["x", "https://x.com/a/status/1"]);
    const b = hashContentKey(["x", "https://x.com/a/status/2"]);
    expect(a).not.toBe(b);
  });
});
