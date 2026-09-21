import { EMPTY_METRICS_COUNTS, type MetricsResponse } from "@sloplens/shared";
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
    ] = settled;
    const countsFailed = [contentItems, cachedAnalyses, clusters, relations, claims].some(
      (value) => value == null,
    );
    const platformMissing = byPlatform.x == null || byPlatform.youtube == null;
    const activityFailed = lastActivityAt === undefined;
    return {
      status: countsFailed || platformMissing || activityFailed ? "degraded" : status,
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
    };
  } catch {
    return {
      status: checks.database ? "degraded" : "unavailable",
      checks,
      counts: emptyCounts,
      lastActivityAt: null,
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
