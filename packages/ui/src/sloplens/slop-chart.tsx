import type { SlopSeriesPoint } from "@sloplens/shared";
import { useId } from "react";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

const Y_TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

type SeriesKey = "slop" | "x" | "youtube";
type PlotPoint = { x: number; y: number };

export function formatSeriesRange(series: SlopSeriesPoint[] | null, locale: string): string | null {
  const days = (series ?? [])
    .map((point) => point.day)
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
    .sort();
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return null;
  const start = formatDay(first, locale);
  const end = formatDay(last, locale);
  return start === end ? start : `${start} – ${end}`;
}

export function SlopSparkline({
  series,
  className,
}: {
  series: SlopSeriesPoint[] | null;
  className?: string;
}) {
  const gradientId = useGradientId();
  const samples = (series ?? []).filter((point) => point.slop != null);
  if (samples.length === 0) return null;

  const width = 168;
  const height = 64;
  const pad = 2;
  const coords = plotCoords(samples, "slop", {
    left: pad,
    right: width - pad,
    top: pad,
    bottom: height - pad,
  });
  const baseline = height - pad;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-16 w-40 text-foreground", className)}
      aria-hidden="true"
      data-sloplens-slop-sparkline="true"
    >
      <AreaFill gradientId={gradientId} coords={coords} baseline={baseline} />
    </svg>
  );
}

export function SlopTimeChart({ series }: { series: SlopSeriesPoint[] | null }) {
  const { t, locale } = useSlopLensI18n();
  const gradientId = useGradientId();

  if (series == null) {
    return <ChartFrame message={t("dashboard.unavailable")} />;
  }

  const points = series.filter(
    (point) => point.slop != null || point.x != null || point.youtube != null,
  );
  if (points.length === 0) {
    return <ChartFrame message={t("dashboard.noSeries")} />;
  }

  const width = 640;
  const height = 228;
  const padL = 44;
  const padR = 8;
  const padT = 12;
  const padB = 28;
  const box = { left: padL, right: width - padR, top: padT, bottom: height - padB };
  const baseline = box.bottom;
  const slop = plotCoords(points, "slop", box);
  const xSeries = plotCoords(points, "x", box);
  const youtube = plotCoords(points, "youtube", box);
  const labels = labelIndexes(points.length);

  return (
    <figure className="space-y-3" data-sloplens-slop-chart="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full text-foreground"
        role="img"
        aria-label={t("dashboard.slopOverTime")}
      >
        {Y_TICKS.map((tick) => {
          const y = yAt(tick, box);
          return (
            <g key={tick}>
              <line
                x1={box.left}
                x2={box.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
              />
              <text
                x={box.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize="11"
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          );
        })}
        <AreaFill gradientId={gradientId} coords={slop} baseline={baseline} />
        <SeriesLine coords={xSeries} className="text-muted-foreground" dashed />
        <SeriesLine coords={youtube} className="text-foreground/70" />
        {labels.map((index) => {
          const day = points[index]?.day;
          if (!day) return null;
          const x =
            points.length === 1 ? (box.left + box.right) / 2 : xAt(index, points.length, box);
          const anchor =
            points.length <= 1
              ? "middle"
              : index === 0
                ? "start"
                : index === points.length - 1
                  ? "end"
                  : "middle";
          return (
            <text
              key={day}
              x={x}
              y={height - 6}
              textAnchor={anchor}
              className="fill-muted-foreground"
              fontSize="11"
            >
              {formatDay(day, locale)}
            </text>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <LegendSwatch label={t("dashboard.averageSlop")} className="text-foreground" />
        <LegendSwatch label="X" className="text-muted-foreground" dashed />
        <LegendSwatch label="YouTube" className="text-foreground/70" />
      </figcaption>
    </figure>
  );
}

function ChartFrame({ message }: { message: string }) {
  return (
    <div
      className="flex h-52 items-center justify-center rounded-lg bg-muted/40"
      data-sloplens-slop-chart="true"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AreaFill({
  gradientId,
  coords,
  baseline,
}: {
  gradientId: string;
  coords: Array<PlotPoint | null>;
  baseline: number;
}) {
  const area = areaPath(coords, baseline);
  const line = linePath(coords);
  if (!area || !line) return null;
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function SeriesLine({
  coords,
  className,
  dashed = false,
}: {
  coords: Array<PlotPoint | null>;
  className?: string;
  dashed?: boolean;
}) {
  const d = linePath(coords);
  if (!d) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "4 3" : undefined}
      className={className}
    />
  );
}

function LegendSwatch({
  label,
  className,
  dashed = false,
}: {
  label: string;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <svg width="16" height="8" aria-hidden="true" className="text-current">
        <line
          x1="0"
          y1="4"
          x2="16"
          y2="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={dashed ? "3 2" : undefined}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function useGradientId(): string {
  return `slop-area-${useId().replace(/:/g, "")}`;
}

function plotCoords(
  points: SlopSeriesPoint[],
  key: SeriesKey,
  box: { left: number; right: number; top: number; bottom: number },
): Array<PlotPoint | null> {
  if (points.length === 1) {
    const value = points[0]?.[key];
    if (value == null) return [];
    const y = yAt(value, box);
    return [
      { x: box.left, y },
      { x: box.right, y },
    ];
  }
  return points.map((point, index) => {
    const value = point[key];
    if (value == null) return null;
    return { x: xAt(index, points.length, box), y: yAt(value, box) };
  });
}

function xAt(index: number, count: number, box: { left: number; right: number }): number {
  if (count <= 1) return (box.left + box.right) / 2;
  return box.left + (index / (count - 1)) * (box.right - box.left);
}

function yAt(value: number, box: { top: number; bottom: number }): number {
  const clamped = Math.min(1, Math.max(0, value));
  return box.top + (1 - clamped) * (box.bottom - box.top);
}

function linePath(coords: Array<PlotPoint | null>): string {
  let path = "";
  let open = false;
  for (const point of coords) {
    if (!point) {
      open = false;
      continue;
    }
    path += `${open ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)} `;
    open = true;
  }
  return path.trim();
}

function areaPath(coords: Array<PlotPoint | null>, baseline: number): string {
  let path = "";
  let run: PlotPoint[] = [];
  const flush = () => {
    const first = run[0];
    const last = run[run.length - 1];
    if (!first || !last) {
      run = [];
      return;
    }
    path += `${run
      .map(
        (point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
      )
      .join(
        " ",
      )} L${last.x.toFixed(1)},${baseline.toFixed(1)} L${first.x.toFixed(1)},${baseline.toFixed(1)} Z `;
    run = [];
  };
  for (const point of coords) {
    if (!point) flush();
    else run.push(point);
  }
  flush();
  return path.trim();
}

function labelIndexes(count: number): number[] {
  if (count <= 1) return [0];
  if (count <= 5) return Array.from({ length: count }, (_, index) => index);
  const marks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(ratio * (count - 1)));
  return [...new Set(marks)];
}

function formatDay(day: string, locale: string): string {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(year, month - 1, date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}
