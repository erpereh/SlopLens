import { EMPTY_METRICS_COUNTS, type MetricsResponse, type SlopSeriesPoint } from "@sloplens/shared";
import type postgres from "postgres";

import { healthStatusFromChecks, runDbHealthChecks } from "./health";

const emptyCounts: MetricsResponse["counts"] = EMPTY_METRICS_COUNTS;

export async function readLocalMetrics(sql: postgres.Sql | null): Promise<MetricsResponse> {
  const checks = await runDbHealthChecks(sql);
  const status = healthStatusFromChecks(checks);
  if (!sql || !checks.database) {
    return {
      status,
      checks,
      counts: emptyCounts,
      lastActivityAt: null,
      slopSeries: null,
    };
  }

  try {
    const settled = await Promise.all([
      readCount(sql`select count(*)::int as n from public.content_items`),
      readCount(sql`select count(*)::int as n from public.content_analysis`),
      readCount(sql`select count(*)::int as n from public.clusters`),
      readCount(sql`select count(*)::int as n from public.content_relations`),
      readActivity(sql),
      readPlatforms(sql),
      readCount(sql`select count(*)::int as n from public.claims`),
      readAverageSlop(sql),
      readSlopSeries(sql),
    ]);
    const [
      contentItems,
      cachedAnalyses,
      clusters,
      relations,
      lastActivityAt,
      byPlatform,
      claims,
      averageSlop,
      slopSeries,
    ] = settled;
    const countsFailed = [contentItems, cachedAnalyses, clusters, relations, claims].some(
      (value) => value == null,
    );
    const platformMissing = byPlatform.x == null || byPlatform.youtube == null;
    const activityFailed = lastActivityAt === undefined;
    const seriesFailed = slopSeries === null;
    return {
      status:
        countsFailed || platformMissing || activityFailed || seriesFailed ? "degraded" : status,
      checks,
      counts: {
        contentItems,
        cachedAnalyses,
        clusters,
        relations,
        byPlatform,
        claims,
        averageSlop,
      },
      lastActivityAt: lastActivityAt ?? null,
      slopSeries,
    };
  } catch {
    return {
      status: checks.database ? "degraded" : "unavailable",
      checks,
      counts: emptyCounts,
      lastActivityAt: null,
      slopSeries: null,
    };
  }
}

function platformCount(
  rows: { platform: string; n: string | number }[],
  platform: "x" | "youtube",
): number {
  return toCount(rows.find((row) => row.platform === platform)?.n) ?? 0;
}

async function readCount(query: PromiseLike<{ n: string | number }[]>): Promise<number | null> {
  try {
    const rows = await query;
    return toCount(rows[0]?.n);
  } catch {
    return null;
  }
}

async function readActivity(sql: postgres.Sql): Promise<string | null | undefined> {
  try {
    const rows = await sql<{ last: Date | string | null }[]>`
      select max(captured_at) as last from public.content_items
    `;
    return toIso(rows[0]?.last);
  } catch {
    return undefined;
  }
}

async function readPlatforms(sql: postgres.Sql): Promise<MetricsResponse["counts"]["byPlatform"]> {
  try {
    const rows = await sql<{ platform: string; n: string | number }[]>`
      select platform, count(*)::int as n
      from public.content_items
      where platform in ('x', 'youtube')
      group by platform
    `;
    return {
      x: platformCount(rows, "x"),
      youtube: platformCount(rows, "youtube"),
    };
  } catch {
    return { x: null, youtube: null };
  }
}

async function readSlopSeries(sql: postgres.Sql): Promise<SlopSeriesPoint[] | null> {
  try {
    const rows = await sql<
      { day: string; platform: string; slop: number | string | null; n: string | number }[]
    >`
      select
        to_char(date_trunc('day', ci.captured_at), 'YYYY-MM-DD') as day,
        ci.platform,
        avg((ca.decision->>'aiSlop')::double precision) as slop,
        count(*)::int as n
      from public.content_items ci
      join lateral (
        select decision
        from public.content_analysis
        where content_item_id = ci.id
        order by analyzed_at desc
        limit 1
      ) ca on true
      where ci.captured_at >= now() - interval '14 days'
        and ci.platform in ('x', 'youtube')
        and jsonb_typeof(ca.decision->'aiSlop') = 'number'
      group by 1, 2
      order by 1
    `;
    return foldSlopSeries(rows);
  } catch {
    return null;
  }
}

export function foldSlopSeries(
  rows: { day: string; platform: string; slop: number | string | null; n: string | number }[],
): SlopSeriesPoint[] {
  const days = new Map<
    string,
    { x?: { slop: number; n: number }; youtube?: { slop: number; n: number } }
  >();
  for (const row of rows) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.day)) {
      continue;
    }
    const slop = toUnit(row.slop);
    const n = toCount(row.n) ?? 0;
    if (slop == null || n <= 0) {
      continue;
    }
    const bucket = days.get(row.day) ?? {};
    if (row.platform === "x" || row.platform === "youtube") {
      bucket[row.platform] = { slop, n };
    }
    days.set(row.day, bucket);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, bucket]) => {
      const weighted = [bucket.x, bucket.youtube].filter(
        (part): part is { slop: number; n: number } => Boolean(part),
      );
      const total = weighted.reduce((sum, part) => sum + part.n, 0);
      const slop =
        total === 0 ? null : weighted.reduce((sum, part) => sum + part.slop * part.n, 0) / total;
      return {
        day,
        slop: slop == null ? null : Math.min(1, Math.max(0, slop)),
        x: bucket.x?.slop ?? null,
        youtube: bucket.youtube?.slop ?? null,
      };
    });
}

async function readAverageSlop(sql: postgres.Sql): Promise<number | null> {
  try {
    const rows = await sql<{ avg: string | number | null }[]>`
      select avg((decision->>'aiSlop')::double precision) as avg
      from public.content_analysis
      where jsonb_typeof(decision->'aiSlop') = 'number'
    `;
    return toUnit(rows[0]?.avg);
  } catch {
    return null;
  }
}

function toUnit(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.min(1, Math.max(0, parsed));
}

function toCount(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
