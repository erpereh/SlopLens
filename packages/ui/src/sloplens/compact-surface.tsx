import { LoaderCircle } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { compactSignalLabel } from "./analyze-summary";
import { FeatureErrorPanel } from "./feature-state";
import type { CompactSignals, FeatureViewState, SlopLensPanelTab } from "./types";

export function SlopLensCompactSurface({
  signals,
  analyzeState = { phase: "idle" },
  onOpenDetail,
  onOpenDetailTab,
  onRetryAnalyze,
  onOpenSettings,
  className,
}: {
  signals: CompactSignals;
  analyzeState?: FeatureViewState;
  onOpenDetail: () => void;
  onOpenDetailTab?: (tab: SlopLensPanelTab) => void;
  onRetryAnalyze?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}) {
  const { locale, t } = useSlopLensI18n();
  const decision = signals.decision;
  const analyzeReady = analyzeState.phase === "success" && Boolean(decision);

  if (analyzeState.phase === "error") {
    return (
      <div
        className={cn(
          "inline-flex max-w-[min(100%,20rem)] flex-col gap-1.5 rounded-2xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur-sm",
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

  const chipLabel =
    analyzeReady && decision
      ? compactSignalLabel(locale, decision)
      : analyzeState.phase === "loading"
        ? t("overlay.loading")
        : t("status.empty");

  const chipStatus =
    analyzeState.phase === "loading"
      ? "loading"
      : analyzeReady && decision?.containsClaim
        ? "info"
        : "neutral";

  return (
    <div
      className={cn(
        "inline-flex max-w-[min(100%,20rem)] flex-col items-stretch gap-0.5 rounded-2xl border border-border bg-card/95 p-1 shadow-md backdrop-blur-sm",
        className,
      )}
      data-sloplens-compact="true"
    >
      <div className="inline-flex min-w-0 items-center gap-1 pl-1.5">
        {analyzeState.phase === "loading" ? (
          <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden />
        ) : null}
        <AnimatedBadge
          status={chipStatus}
          size="sm"
          showIcon={analyzeState.phase !== "loading"}
          className="min-w-0 max-w-[14rem] border-0 bg-transparent px-1 shadow-none"
        >
          <span className="truncate" role="status" aria-live="polite">
            {chipLabel}
          </span>
        </AnimatedBadge>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 rounded-full px-2.5 text-xs"
          onClick={onOpenDetail}
        >
          {t("overlay.expand")}
        </Button>
      </div>

      {onOpenDetailTab ? (
        <div className="flex flex-wrap justify-end gap-0.5">
          {(["analyze", "verify", "trace"] as const).map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 rounded-full px-2 text-[11px] text-foreground"
              onClick={() => onOpenDetailTab(tab)}
            >
              {t(`tab.${tab}`)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
