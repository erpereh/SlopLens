import { describe, expect, it, vi } from "vitest";

import type { AiProviderError } from "../../errors";
import { createTavilySearchProvider } from "./search-provider";

describe("createTavilySearchProvider", () => {
  it("maps Tavily results and ignores include_answer", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        answer: "ignored synthesized answer",
        results: [
          {
            url: "https://example.com/a",
            title: "Example A",
            content: "Snippet A",
            published_date: "2024-01-01",
            score: 0.9,
          },
        ],
      }),
    );

    const provider = createTavilySearchProvider({ apiKey: "tvly-key", fetchImpl });
    const results = await provider.search("query", { maxResults: 3, topic: "news" });

    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe("https://example.com/a");
    expect(results[0]?.snippet).toBe("Snippet A");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"include_answer":false'),
      }),
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        body: expect.stringContaining('"topic":"news"'),
      }),
    );
  });

  it("throws provider_not_configured without an API key", async () => {
    const provider = createTavilySearchProvider({ apiKey: "  " });
    await expect(provider.search("q")).rejects.toMatchObject({
      code: "provider_not_configured",
    } satisfies Partial<AiProviderError>);
  });
});
