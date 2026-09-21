import { describe, expect, it } from "vitest";

import { parseDashboardSection } from "./dashboard";

describe("dashboard section storage", () => {
  it("defaults unknown values to overview", () => {
    expect(parseDashboardSection("providers")).toBe("providers");
    expect(parseDashboardSection("nope")).toBe("overview");
  });
});
