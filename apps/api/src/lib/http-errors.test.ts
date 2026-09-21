import { describe, expect, it } from "vitest";

import { mapUnknownError } from "./http-errors";

describe("mapUnknownError", () => {
  it("maps pgvector type-modifier failures to a database message, not a generic 500", () => {
    const mapped = mapUnknownError(
      new Error("type modifiers must be simple constants or identifiers"),
    );
    expect(mapped.status).toBe(503);
    expect(mapped.body.message).toMatch(/database query failed/i);
    expect(mapped.body.message).not.toBe("Unexpected server error");
  });
});
