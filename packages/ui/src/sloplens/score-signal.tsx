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
        className="max-w-[11rem] shrink-0 truncate tabular-nums font-medium"
      >
        <NumberTicker value={percent} suffix="%" duration={0.5} startOnView={false} />
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
        className="max-w-[11rem] min-w-0 truncate font-medium"
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </AnimatedBadge>
    </div>
  );
}
