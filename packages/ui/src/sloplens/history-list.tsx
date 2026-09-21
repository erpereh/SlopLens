import type { ContentHistoryItem } from "@sloplens/shared";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/motion/button/base";
import { useSlopLensI18n } from "@/i18n/context";
import { safeExternalHttpUrl } from "@/lib/safe-http-url";
import { cn } from "@/lib/utils";
import { scoreToPercent, toneFromScore } from "./score-signal";

export function HistoryList({
  items,
  phase,
  unavailable,
  nextCursor,
  onLoadMore,
}: {
  items: ContentHistoryItem[];
  phase: "loading" | "ready" | "error";
  unavailable: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
}) {
  const { t } = useSlopLensI18n();
  const sentinel = useRef<HTMLDivElement>(null);
  const loading = phase === "loading";

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !nextCursor || loading) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, nextCursor, onLoadMore]);

  if (unavailable) {
    return <p className="text-sm text-muted-foreground">{t("dashboard.unavailable")}</p>;
  }
  if (phase === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("history.error")}
      </p>
    );
  }
  if (phase === "loading" && items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("status.loading")}</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("history.empty")}</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id}>
            <HistoryCard item={item} index={index} />
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <div ref={sentinel} className="h-8" data-sloplens-history-more="true">
          {loading ? <p className="text-xs text-muted-foreground">{t("status.loading")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function HistoryCard({ item, index }: { item: ContentHistoryItem; index: number }) {
  return item.platform === "youtube" ? (
    <YouTubeCard item={item} index={index} />
  ) : (
    <XCard item={item} index={index} />
  );
}

function XCard({ item, index }: { item: ContentHistoryItem; index: number }) {
  const { t } = useSlopLensI18n();
  const reduce = useReducedMotion() ?? false;
  const href = safeExternalHttpUrl(item.url);
  const when = item.publishedAt ?? item.capturedAt;

  return (
    <motion.article
      data-sloplens-history-item="x"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, delay: Math.min(index, 6) * 0.04 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {item.author ?? t("dashboard.none")}
            {item.handle ? (
              <span className="ml-2 font-normal text-muted-foreground">{item.handle}</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatWhen(when)}</p>
        </div>
        <SlopMark value={item.slop} />
      </div>
      {item.text ? <p className="mt-3 text-sm leading-6">{item.text}</p> : null}
      <SignalRow item={item} />
      {href ? <OriginalLink href={href} /> : null}
    </motion.article>
  );
}

function YouTubeCard({ item, index }: { item: ContentHistoryItem; index: number }) {
  const { t } = useSlopLensI18n();
  const reduce = useReducedMotion() ?? false;
  const href = safeExternalHttpUrl(item.url);
  const thumb = safeExternalHttpUrl(item.thumbnailUrl ?? undefined);
  const when = item.publishedAt ?? item.capturedAt;

  return (
    <motion.article
      data-sloplens-history-item="youtube"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, delay: Math.min(index, 6) * 0.04 }}
      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <div className="grid gap-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="aspect-video h-full w-full bg-muted object-cover sm:aspect-auto sm:min-h-28"
          />
        ) : (
          <div className="aspect-video bg-muted sm:aspect-auto sm:min-h-28" />
        )}
        <div className="min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-5">
                {item.title ?? t("dashboard.none")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.author ?? t("dashboard.none")} · {formatWhen(when)}
              </p>
            </div>
            <SlopMark value={item.slop} />
          </div>
          {item.text ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
          ) : null}
          <SignalRow item={item} />
          {href ? <OriginalLink href={href} /> : null}
        </div>
      </div>
    </motion.article>
  );
}

function SignalRow({ item }: { item: ContentHistoryItem }) {
  const { t } = useSlopLensI18n();
  const claim = item.claimText
    ? item.claimText
    : item.containsClaim || item.needsVerification
      ? t("history.needsVerification")
      : null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {item.clickbait != null ? (
        <SignalChip label={t("signal.clickbait")} value={item.clickbait} />
      ) : null}
      {item.engagementBait != null ? (
        <SignalChip label={t("signal.engagementBait")} value={item.engagementBait} />
      ) : null}
      {claim ? (
        <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{claim}</span>
      ) : (
        <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
          {t("history.noClaim")}
        </span>
      )}
    </div>
  );
}

function SignalChip({ label, value }: { label: string; value: number }) {
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1 text-xs",
        toneFromScore(value) === "warning"
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label} {scoreToPercent(value)}%
    </span>
  );
}

function SlopMark({ value }: { value: number | null }) {
  const { t } = useSlopLensI18n();
  if (value == null) {
    return <span className="text-xs text-muted-foreground">{t("dashboard.unavailable")}</span>;
  }
  return (
    <span className="shrink-0 rounded-lg bg-foreground px-2 py-1 text-xs font-semibold text-background tabular-nums">
      {t("signal.slop.label")} {scoreToPercent(value)}%
    </span>
  );
}

function OriginalLink({ href }: { href: string }) {
  const { t } = useSlopLensI18n();
  return (
    <ButtonLink
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      variant="ghost"
      size="sm"
      className="mt-3 h-8 px-2"
    >
      {t("history.openOriginal")}
    </ButtonLink>
  );
}

function formatWhen(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}
