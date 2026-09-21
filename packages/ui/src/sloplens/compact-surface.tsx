import { Button } from "@/components/motion/button/base";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { ScorePercentSignal, ScoreTextSignal } from "./score-signal";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";
import type { CompactSignals } from "./types";

export function SlopLensCompactSurface({
  signals,
  onOpenDetail,
  className,
}: {
  signals: CompactSignals;
  onOpenDetail: () => void;
  className?: string;
}) {
  const { t } = useSlopLensI18n();
  const decision = signals.decision;

  return (
    <section
      className={cn(
        "w-[min(100%,20rem)] rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm",
        className,
      )}
      aria-label={t("app.name")}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tracking-tight">{t("app.name")}</span>
        <SlopLensThemeToggleButton />
      </header>

      <div className="space-y-1.5">
        {decision ? (
          <>
            <ScorePercentSignal label={t("signal.aiSlop")} score={decision.aiSlop} />
            <ScorePercentSignal label={t("signal.clickbait")} score={decision.clickbait} />
            <ScoreTextSignal
              label={t("signal.claim")}
              value={decision.containsClaim ? t("signal.claim.detected") : t("signal.claim.none")}
              tone={decision.containsClaim ? "info" : "neutral"}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("status.empty")}</p>
        )}

        <ScoreTextSignal
          label={t("signal.primarySource")}
          value={signals.primarySourceLabel ?? t("signal.primarySource.none")}
          tone={signals.primarySourceLabel ? "positive" : "unknown"}
        />
        <ScoreTextSignal
          label={t("signal.similar")}
          value={
            signals.similarCount != null && signals.similarCount > 0
              ? String(signals.similarCount)
              : t("signal.similar.none")
          }
          tone={signals.similarCount ? "info" : "neutral"}
        />
      </div>

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t("signal.scoreHint")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="primary" onClick={onOpenDetail}>
          {t("overlay.expand")}
        </Button>
      </div>
    </section>
  );
}
