import { describe, expect, it } from "vitest";

import { healthStatusFromChecks, runDbHealthChecks } from "./health";

describe("runDbHealthChecks", () => {
  it("maps unavailable database to unavailable status", async () => {
    const checks = await runDbHealthChecks(null);
    expect(checks).toEqual({ database: false, pgvector: false });
    expect(healthStatusFromChecks(checks)).toBe("unavailable");
  });

  it("maps missing pgvector extension to degraded", () => {
    expect(
      healthStatusFromChecks({
        database: true,
        pgvector: false,
      }),
    ).toBe("degraded");
  });

  it("maps healthy database and pgvector to ok", () => {
    expect(
      healthStatusFromChecks({
        database: true,
        pgvector: true,
      }),
    ).toBe("ok");
  });
});
