import { describe, expect, it } from "vitest";
import { mockRuntime, mockSearchProvider, sampleContent } from "./test-providers";
import { createTraceService } from "./trace-service";

describe("trace service", () => {
  it("returns insufficient_evidence when search and related both find nothing", async () => {
    const service = createTraceService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () => mockSearchProvider([]),
        requireEmbedding: async () => {
          throw new Error("no db embeddings");
        },
      }),
    });

    const result = await service.trace({ content: sampleContent });
    expect(result.status).toBe("insufficient_evidence");
    expect(result.graph.similar).toEqual([]);
    expect(result.graph.origin).toBeUndefined();
  });

  it("continues when search is not configured but web evidence exists from a later retry", async () => {
    const service = createTraceService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () => {
          throw new Error("search not configured");
        },
        requireEmbedding: async () => {
          throw new Error("skip related");
        },
      }),
    });

    const result = await service.trace({ content: sampleContent });
    expect(result.status).toBe("insufficient_evidence");
  });

  it("returns ok with search evidence when related is unavailable", async () => {
    const service = createTraceService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () =>
          mockSearchProvider([
            {
              url: "https://blog.example.com/story",
              title: "Public report background",
              snippet: "A verifiable claim about a public report.",
            },
          ]),
        requireEmbedding: async () => {
          throw new Error("skip related");
        },
      }),
    });

    const result = await service.trace({ content: sampleContent });
    expect(result.status).toBe("ok");
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.graph.similar).toEqual([]);
  });

  it("uses a primary-source search hit as the origin candidate", async () => {
    const service = createTraceService({
      sql: null,
      runtime: mockRuntime({
        requireSearch: async () =>
          mockSearchProvider([
            {
              url: "https://blog.example.com/copy",
              title: "Blog copy of the public report",
              snippet: "A later write-up of the public report.",
              publishedAt: "2024-06-01",
            },
            {
              url: "https://www.who.int/news",
              title: "WHO public report",
              snippet: "The public report was issued by the agency.",
              publishedAt: "2023-01-01",
            },
          ]),
        requireEmbedding: async () => {
          throw new Error("skip related");
        },
      }),
    });

    const result = await service.trace({ content: sampleContent });
    expect(result.status).toBe("ok");
    expect(result.graph.origin?.url).toBe("https://www.who.int/news");
    expect(result.possibleOrigin?.url).toBe("https://www.who.int/news");
    expect(result.possibleOrigin?.confidence).toBe("medium");
    expect(result.possibleOrigin?.whyThisMayBeTheOrigin).toMatch(/heuristic|not proof/i);
    expect(result.uncertainty).toMatch(/not a confirmed origin/i);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence[0]?.summary.length).toBeLessThanOrEqual(240);
  });
});
