import { describe, expect, it } from "vitest";

import {
  filterAndRerankSearchResults,
  isResultRelevant,
  truncateEvidenceSummary,
} from "./relevance";

describe("search relevance filter", () => {
  it("drops clearly off-topic Tavily-style hits for a GPT-6 Astra claim", () => {
    const claim = "OpenAI announced GPT-6 Astra";
    const filtered = filterAndRerankSearchResults(claim, [
      {
        url: "https://bank.example/loans",
        title: "Personal loans at 3%",
        snippet: "Apply today for a recommendation letter and a cheap loan.",
      },
      {
        url: "https://hr.example/letters",
        title: "How to write recommendation letters",
        snippet: "A strong letter of recommendation helps candidates.",
      },
      {
        url: "https://jobs.example/guards",
        title: "Security guards wanted",
        snippet: "Night shift security guards for office buildings.",
      },
      {
        url: "https://openai.com/blog/gpt-6-astra",
        title: "OpenAI introduces GPT-6 Astra",
        snippet: "OpenAI announced GPT-6 Astra, a new model family.",
      },
      {
        url: "https://www.cdc.gov/unrelated",
        title: "Seasonal flu guidance",
        snippet: "Vaccination remains the best protection.",
      },
    ]);

    expect(filtered.map((row) => row.url)).toEqual(["https://openai.com/blog/gpt-6-astra"]);
    const relevant = filtered[0];
    expect(relevant).toBeDefined();
    if (!relevant) {
      return;
    }
    expect(isResultRelevant(claim, relevant)).toBe(true);
  });

  it("keeps a primary source that actually overlaps the claim", () => {
    const claim = "The agency confirmed the figures.";
    const filtered = filterAndRerankSearchResults(claim, [
      { url: "https://x.com/a/status/1", title: "Hot take", snippet: "maybe" },
      {
        url: "https://www.cdc.gov/release",
        title: "Official statement",
        snippet: "The agency confirmed the figures.",
      },
    ]);
    expect(filtered[0]?.url).toContain("cdc.gov");
  });

  it("truncates raw search snippets used as evidence", () => {
    const long = `${"word ".repeat(80)}end`;
    const truncated = truncateEvidenceSummary(long);
    expect(truncated.length).toBeLessThanOrEqual(240);
    expect(truncated.endsWith("…")).toBe(true);
  });
});
