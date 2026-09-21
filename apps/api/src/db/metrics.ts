import type { MetricsResponse } from "@sloplens/shared";
import type postgres from "postgres";

import { healthStatusFromChecks, runDbHealthChecks } from "./health";

const emptyCounts: MetricsResponse["counts"] = {
  contentItems: null,
  cachedAnalyses: null,
  clusters: null,
  relations: null,
};

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
    const [items, analyses, clusters, relations, activity] = await Promise.all([
      sql<{ n: string | number }[]>`select count(*)::int as n from public.content_items`,
      sql<{ n: string | number }[]>`select count(*)::int as n from public.content_analysis`,
      sql<{ n: string | number }[]>`select count(*)::int as n from public.clusters`,
      sql<{ n: string | number }[]>`select count(*)::int as n from public.content_relations`,
      sql<{ last: Date | string | null }[]>`
        select max(captured_at) as last from public.content_items
      `,
    ]);
    return {
      status,
      checks,
      counts: {
        contentItems: toCount(items[0]?.n),
        cachedAnalyses: toCount(analyses[0]?.n),
        clusters: toCount(clusters[0]?.n),
        relations: toCount(relations[0]?.n),
      },
      lastActivityAt: toIso(activity[0]?.last),
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
