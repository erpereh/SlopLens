import { LoaderCircle } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Tooltip } from "@/components/motion/tooltip";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { FeatureErrorPanel } from "./feature-state";
import { scoreToPercent, toneFromScore } from "./score-signal";
import type { CompactSignals, FeatureViewState } from "./types";

export function SlopLensCompactSurface({
  signals,
  analyzeState = { phase: "idle" },
  onOpenDetail,
  onRetryAnalyze,
  onOpenSettings,
  onAnalyze,
  className,
}: {
  signals: CompactSignals;
  analyzeState?: FeatureViewState;
  onOpenDetail: () => void;
  onRetryAnalyze?: () => void;
  onOpenSettings?: () => void;
  onAnalyze?: () => void;
  className?: string;
}) {
  const { t } = useSlopLensI18n();
  const slopSignal = signals.slopSignal;
  const analyzeReady = analyzeState.phase === "success" && Boolean(slopSignal);

  if (analyzeState.phase === "error") {
    return (
      <div
        className={cn(
          "inline-flex max-w-[min(100%,16rem)] flex-col gap-1.5 rounded-2xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur-sm",
          className,
        )}
        data-sloplens-compact="true"
      >
        <FeatureErrorPanel
          code={analyzeState.error.code}
          message={analyzeState.error.message}
          retryable={analyzeState.error.retryable ?? false}
          onRetry={onRetryAnalyze}
          onOpenSettings={onOpenSettings}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-end"
          onClick={onOpenDetail}
        >
          {t("overlay.expand")}
        </Button>
      </div>
    );
  }

  if (analyzeState.phase === "idle") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1 shadow-md",
          className,
        )}
        data-sloplens-compact="true"
      >
        <Button
          type="button"
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          onClick={onAnalyze}
        >
          {t("overlay.analyze")}
        </Button>
      </div>
    );
  }

  const percent = slopSignal ? scoreToPercent(slopSignal.value) : 0;
  const chipStatus =
    analyzeState.phase === "loading"
      ? "loading"
      : analyzeReady
        ? toneFromScore(slopSignal?.value ?? 0) === "warning"
          ? "warning"
          : "neutral"
        : "neutral";

  const accessibleLabel = analyzeReady
    ? t("signal.slop.accessible", { percent })
    : t("overlay.loading");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1 shadow-md backdrop-blur-sm",
        className,
      )}
      data-sloplens-compact="true"
    >
      <Tooltip content={t("signal.notVerdict")} side="top">
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1 rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onOpenDetail}
          aria-label={accessibleLabel}
          data-sloplens-slop-chip="true"
        >
          {analyzeState.phase === "loading" ? (
            <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden />
          ) : null}
          <AnimatedBadge
            status={chipStatus}
            size="sm"
            showIcon={analyzeState.phase !== "loading"}
            className="min-w-0 border-0 bg-transparent px-1 shadow-none"
          >
            <span className="inline-flex items-baseline gap-1" role="status" aria-live="polite">
              <span>{t("signal.slop.label")}</span>
              {analyzeReady ? (
                <>
                  <span aria-hidden>·</span>
                  <NumberTicker
                    value={percent}
                    suffix="%"
                    startOnView={false}
                    className="tabular-nums"
                  />
                </>
              ) : null}
            </span>
          </AnimatedBadge>
        </button>
      </Tooltip>
    </div>
  );
}
