import { describe, expect, it } from "vitest";

import { parseDashboardSection } from "./dashboard";

describe("dashboard section storage", () => {
  it("keeps the history sections and folds old settings pages", () => {
    expect(parseDashboardSection("x")).toBe("x");
    expect(parseDashboardSection("youtube")).toBe("youtube");
    expect(parseDashboardSection("settings")).toBe("settings");
    expect(parseDashboardSection("providers")).toBe("settings");
    expect(parseDashboardSection("appearance")).toBe("settings");
    expect(parseDashboardSection("feed")).toBe("overview");
    expect(parseDashboardSection("diagnostics")).toBe("overview");
    expect(parseDashboardSection("nope")).toBe("overview");
  });
});
