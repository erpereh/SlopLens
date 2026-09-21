export const MOCK_DECISION = {
  aiSlop: 0.82,
  engagementBait: 0.4,
  clickbait: 0.91,
  spam: 0.1,
  advertisement: 0.05,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news" as const,
};

export const MOCK_ANALYZE = {
  decision: MOCK_DECISION,
  cached: false,
  contentHash: "fixture-hash",
};

export const MOCK_VERIFY = {
  status: "ok" as const,
  claim: "Hello from SlopLens",
  sources: [
    {
      url: "https://example.com/source",
      title: "Primary research note",
    },
  ],
  evidence: [
    {
      stance: "supports" as const,
      summary: "The claim is backed by the cited note.",
      sourceUrl: "https://example.com/source",
    },
  ],
};

export const MOCK_TRACE = {
  status: "ok" as const,
  graph: {
    origin: { url: "https://example.com/origin", title: "Origin article" },
    similar: [
      {
        url: "https://x.com/other/status/1",
        title: "Similar post",
        platform: "x" as const,
        score: 0.7,
      },
    ],
    derivations: [],
  },
  evidence: [
    {
      summary: "Candidate origin found via similar embeddings.",
      sourceUrl: "https://example.com/origin",
    },
  ],
};

export const MOCK_RELATED = {
  items: [
    {
      url: "https://x.com/other/status/99",
      platform: "x" as const,
      score: 0.81,
      title: "Related post",
    },
  ],
};
