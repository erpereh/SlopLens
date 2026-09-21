import { describe, expect, it } from "vitest";

import { HttpError } from "../lib/http-errors";
import { mockRuntime, mockSearchProvider, unconfiguredRuntime } from "./test-providers";
import { createVerifyService, heuristicEvidence } from "./verify-service";

describe("verify service", () => {
  it("returns insufficient_evidence when search yields nothing", async () => {
    const service = createVerifyService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () => mockSearchProvider([]),
      }),
    });

    const result = await service.verify({ claim: "Something happened in 1999." });
    expect(result.status).toBe("insufficient_evidence");
    expect(result.sources).toEqual([]);
    expect(result.evidence).toEqual([]);
  });

  it("orders sources with primary hosts first and does not invent a verdict", async () => {
    const service = createVerifyService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () =>
          mockSearchProvider([
            { url: "https://x.com/a/status/1", title: "Hot take", snippet: "maybe" },
            {
              url: "https://www.cdc.gov/release",
              title: "Official statement",
              snippet: "The agency confirmed the figures.",
            },
          ]),
        optionalReasoning: async () => null,
      }),
    });

    const result = await service.verify({ claim: "The agency confirmed the figures." });
    expect(result.sources[0]?.url).toContain("cdc.gov");
    expect(result.sources[0]?.kind).toBe("primary");
    expect(result.evidence.some((item) => item.stance === "supports")).toBe(true);
  });

  it("treats contradictory language as contradicts without using a search answer field", async () => {
    const evidence = heuristicEvidence("The moon is cheese", [
      { url: "https://example.com/debunk", title: "Debunk", snippet: "This claim is false." },
    ]);
    expect(evidence[0]?.stance).toBe("contradicts");
  });

  it("fails closed when search is not configured", async () => {
    const service = createVerifyService({
      sql: null,
      runtime: unconfiguredRuntime(),
    });
    await expect(service.verify({ claim: "A claim" })).rejects.toBeInstanceOf(HttpError);
  });
});
