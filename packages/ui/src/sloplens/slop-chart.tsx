import type { SlopSeriesPoint } from "@sloplens/shared";
import { useSlopLensI18n } from "@/i18n/context";

export function SlopTimeChart({ series }: { series: SlopSeriesPoint[] | null }) {
  const { t } = useSlopLensI18n();
  if (series == null) {
    return <p className="text-sm text-muted-foreground">{t("dashboard.unavailable")}</p>;
  }
  const points = series.filter((point) => point.slop != null);
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("dashboard.noSeries")}</p>;
  }

  const width = 320;
  const height = 120;
  const pad = 8;
  const xAt = (index: number) =>
    pad +
    (points.length === 1
      ? (width - pad * 2) / 2
      : (index / (points.length - 1)) * (width - pad * 2));
  const yAt = (value: number) => pad + (1 - value) * (height - pad * 2);

  return (
    <figure className="space-y-2" data-sloplens-slop-chart="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full"
        role="img"
        aria-label={t("dashboard.slopOverTime")}
      >
        <path
          d={linePath(points, xAt, yAt, "slop")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground"
        />
        <path
          d={linePath(points, xAt, yAt, "x")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-muted-foreground"
          strokeDasharray="4 3"
        />
        <path
          d={linePath(points, xAt, yAt, "youtube")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
      <figcaption className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{t("dashboard.averageSlop")}</span>
        <span>X</span>
        <span>YouTube</span>
        <span>
          {points[0]?.day} – {points.at(-1)?.day}
        </span>
      </figcaption>
    </figure>
  );
}

function linePath(
  points: SlopSeriesPoint[],
  xAt: (index: number) => number,
  yAt: (value: number) => number,
  key: "slop" | "x" | "youtube",
): string {
  let path = "";
  let open = false;
  points.forEach((point, index) => {
    const value = point[key];
    if (value == null) {
      open = false;
      return;
    }
    path += `${open ? "L" : "M"}${xAt(index).toFixed(1)},${yAt(value).toFixed(1)} `;
    open = true;
  });
  return path.trim();
}
