import type { SearchResult } from "@sloplens/ai";

import { classifySourceKind } from "./primary-sources";

export const MAX_VERIFY_SOURCES = 5;
export const EVIDENCE_SUMMARY_MAX_CHARS = 240;
const MIN_TOKEN_OVERLAP = 0.18;
const MIN_SHARED_TOKENS = 1;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "are",
  "was",
  "were",
  "have",
  "has",
  "not",
  "but",
  "you",
  "your",
  "about",
  "into",
  "they",
  "their",
  "will",
  "can",
  "our",
  "out",
  "how",
  "why",
  "what",
  "when",
  "who",
  "its",
  "new",
]);

export function tokenizeForRelevance(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];
  return new Set(tokens.filter((token) => !STOP_WORDS.has(token) && token.length >= 3));
}

export function lexicalRelevance(claim: string, result: SearchResult): number {
  const claimTokens = tokenizeForRelevance(claim);
  if (claimTokens.size === 0) {
    return 0;
  }
  const blob = `${result.title} ${result.snippet ?? ""}`;
  const resultTokens = tokenizeForRelevance(blob);
  let shared = 0;
  for (const token of claimTokens) {
    if (resultTokens.has(token)) {
      shared += 1;
    }
  }
  return shared / claimTokens.size;
}

export function isResultRelevant(claim: string, result: SearchResult): boolean {
  const claimTokens = tokenizeForRelevance(claim);
  const blob = `${result.title} ${result.snippet ?? ""}`;
  const resultTokens = tokenizeForRelevance(blob);
  let shared = 0;
  for (const token of claimTokens) {
    if (resultTokens.has(token)) {
      shared += 1;
    }
  }
  if (shared < MIN_SHARED_TOKENS) {
    return false;
  }
  return lexicalRelevance(claim, result) >= MIN_TOKEN_OVERLAP || shared >= 2;
}

export function recencyBonus(result: SearchResult, now = Date.now()): number {
  if (!result.publishedAt) {
    return 0;
  }
  const published = Date.parse(result.publishedAt);
  if (!Number.isFinite(published)) {
    return 0;
  }
  const ageMs = now - published;
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;
  if (ageMs > twoYears && classifySourceKind(result.url) === "other") {
    return -0.15;
  }
  if (ageMs < 1000 * 60 * 60 * 24 * 365) {
    return 0.05;
  }
  return 0;
}

export function filterAndRerankSearchResults(
  claim: string,
  results: ReadonlyArray<SearchResult>,
  limit = MAX_VERIFY_SOURCES,
): SearchResult[] {
  const scored = results
    .map((result) => ({
      result,
      relevance: lexicalRelevance(claim, result) + recencyBonus(result),
      relevant: isResultRelevant(claim, result),
    }))
    .filter((row) => row.relevant)
    .sort((a, b) => b.relevance - a.relevance);

  return scored.slice(0, limit).map((row) => row.result);
}

export function truncateEvidenceSummary(text: string, max = EVIDENCE_SUMMARY_MAX_CHARS): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}
