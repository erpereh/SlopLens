import type { ContentDecision, ContentType } from "@sloplens/core";
import type { Locale, MessageKey } from "@/i18n/messages";
import { t } from "@/i18n/messages";

const CONTENT_TYPE_KEYS: Record<ContentType, MessageKey> = {
  news: "contentType.news",
  opinion: "contentType.opinion",
  meme: "contentType.meme",
  advertisement: "contentType.advertisement",
  personal: "contentType.personal",
  spam: "contentType.spam",
  unknown: "contentType.unknown",
};

export function formatAnalyzeSummary(locale: Locale, decision: ContentDecision): string {
  const typeLabel = t(locale, CONTENT_TYPE_KEYS[decision.contentType]);
  if (decision.containsClaim) {
    return t(locale, "analyze.look.withClaim", { type: typeLabel });
  }
  return t(locale, "analyze.look", { type: typeLabel });
}

export function compactSignalLabel(locale: Locale, decision: ContentDecision): string {
  if (decision.containsClaim && decision.needsVerification) {
    return t(locale, "signal.compact.verifiableClaim");
  }
  const scores: { key: MessageKey; value: number }[] = [
    { key: "signal.compact.highSlop", value: decision.aiSlop },
    { key: "signal.compact.highClickbait", value: decision.clickbait },
    { key: "signal.compact.highEngagement", value: decision.engagementBait },
  ];
  const top = scores.reduce((best, item) => (item.value > best.value ? item : best));
  if (top.value >= 0.55) {
    return t(locale, top.key);
  }
  return t(locale, CONTENT_TYPE_KEYS[decision.contentType]);
}
