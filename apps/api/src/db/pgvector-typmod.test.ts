import { describe, expect, it } from "vitest";

import { PGVECTOR_EMBEDDING_DIMENSIONS } from "./embedding-dimensions";
import { pgvectorTypmod } from "./pgvector-typmod";

describe("pgvectorTypmod", () => {
  it("inlines the verified dimension as a SQL constant", () => {
    expect(pgvectorTypmod("vector")).toBe(`extensions.vector(${PGVECTOR_EMBEDDING_DIMENSIONS})`);
    expect(pgvectorTypmod("halfvec")).toBe(`extensions.halfvec(${PGVECTOR_EMBEDDING_DIMENSIONS})`);
    expect(pgvectorTypmod("vector")).toContain("2048");
  });
});
