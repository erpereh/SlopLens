import type { NormalizedContent } from "./content";

const MAX_CLAIM_CHARS = 220;
const URL_RE = /https?:\/\/\S+/gi;
const MENTION_RE = /[@#]\w+/g;

export function extractCanonicalClaim(content: NormalizedContent): string {
  const raw = [content.title, content.text]
    .filter((part): part is string => Boolean(part?.trim()))
    .join("\n")
    .trim();
  return canonicalizeClaimText(raw.length > 0 ? raw : content.url);
}

export function canonicalizeClaimText(raw: string): string {
  const cleaned = raw.replace(URL_RE, " ").replace(MENTION_RE, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return raw.slice(0, MAX_CLAIM_CHARS).trim();
  }
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  if (sentence.length <= MAX_CLAIM_CHARS) {
    return sentence;
  }
  return `${sentence.slice(0, MAX_CLAIM_CHARS - 1).trimEnd()}…`;
}
