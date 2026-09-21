import { describe, expect, it } from "vitest";

import { safeExternalHttpUrl } from "./safe-http-url";

describe("safeExternalHttpUrl", () => {
  it("allows http and https URLs", () => {
    expect(safeExternalHttpUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(safeExternalHttpUrl("http://localhost:3000")).toBe("http://localhost:3000/");
  });

  it("rejects dangerous schemes", () => {
    expect(safeExternalHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeExternalHttpUrl("data:text/html,hi")).toBeUndefined();
  });

  it("rejects invalid URLs", () => {
    expect(safeExternalHttpUrl("not a url")).toBeUndefined();
    expect(safeExternalHttpUrl(undefined)).toBeUndefined();
  });
});
