import type { SearchResult } from "@sloplens/ai";

export type SourceKind = "primary" | "official" | "academic" | "agency" | "news" | "other";

const PRIMARY_HOST_RE =
  /\.(gov|gob|gouv|mil)(\.|$)|(^|\.)(who\.int|un\.org|europa\.eu|nih\.gov|cdc\.gov|nasa\.gov)$/i;
const ACADEMIC_HOST_RE = /\.edu(\.|$)|(arxiv\.org|nature\.com|science\.org|acm\.org|ieee\.org)$/i;
const AGENCY_HOST_RE = /(reuters\.com|apnews\.com|afp\.com|bbc\.co\.uk|bbc\.com)$/i;
const NEWS_HOST_RE =
  /(nytimes\.com|washingtonpost\.com|theguardian\.com|wsj\.com|ft\.com|economist\.com)$/i;

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function classifySourceKind(url: string): SourceKind {
  const host = hostFromUrl(url);
  if (!host) {
    return "other";
  }
  if (PRIMARY_HOST_RE.test(host)) {
    return "primary";
  }
  if (ACADEMIC_HOST_RE.test(host)) {
    return "academic";
  }
  if (AGENCY_HOST_RE.test(host)) {
    return "agency";
  }
  if (NEWS_HOST_RE.test(host)) {
    return "news";
  }
  return "other";
}

const KIND_RANK: Record<SourceKind, number> = {
  primary: 0,
  official: 1,
  academic: 2,
  agency: 3,
  news: 4,
  other: 5,
};

export function rankSearchResults(results: ReadonlyArray<SearchResult>): SearchResult[] {
  return [...results].sort((a, b) => {
    const kindDelta = KIND_RANK[classifySourceKind(a.url)] - KIND_RANK[classifySourceKind(b.url)];
    if (kindDelta !== 0) {
      return kindDelta;
    }
    return (b.score ?? 0) - (a.score ?? 0);
  });
}
