import type { ReactNode } from "react";
import { AnimatedBadge, type AnimatedBadgeStatus } from "@/components/motion/animated-badge";
import { NumberTicker } from "@/components/motion/number-ticker";
import { cn } from "@/lib/utils";

export type ScoreSignalTone = "neutral" | "info" | "warning" | "negative" | "positive" | "unknown";

const toneStatus: Record<ScoreSignalTone, AnimatedBadgeStatus> = {
  neutral: "neutral",
  info: "info",
  warning: "warning",
  negative: "danger",
  positive: "success",
  unknown: "neutral",
};

export function scoreToPercent(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function toneFromScore(score: number): ScoreSignalTone {
  if (Number.isNaN(score)) return "unknown";
  if (score >= 0.75) return "warning";
  if (score >= 0.5) return "info";
  return "neutral";
}

export function ScorePercentSignal({
  label,
  score,
  tone,
  className,
}: {
  label: string;
  score?: number;
  tone?: ScoreSignalTone;
  className?: string;
}) {
  if (score === undefined || score === null) {
    return <ScoreTextSignal label={label} value="—" tone="unknown" className={className} />;
  }

  const resolvedTone = tone ?? toneFromScore(score);
  const percent = scoreToPercent(score);

  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3 text-sm", className)}>
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <AnimatedBadge
        status={toneStatus[resolvedTone]}
        size="sm"
        className="shrink-0 tabular-nums font-medium"
      >
        <span className="inline-flex max-h-[1.1em] overflow-hidden leading-none">
          <NumberTicker value={percent} suffix="%" duration={0.5} startOnView={false} />
        </span>
      </AnimatedBadge>
    </div>
  );
}

export function ScoreTextSignal({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: ScoreSignalTone;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3 text-sm", className)}>
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <AnimatedBadge
        status={toneStatus[tone]}
        size="sm"
        className="max-w-none shrink-0 whitespace-normal font-medium"
        title={typeof value === "string" ? value : undefined}
      >
        <span className="text-left leading-snug">{value}</span>
      </AnimatedBadge>
    </div>
  );
}
