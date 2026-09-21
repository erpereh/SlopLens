import { contentDecisionSchema, deriveSlopSignal, platformSchema } from "@sloplens/core";
import {
  type ContentHistoryItem,
  type ContentListQuery,
  type ContentListResponse,
  contentListResponseSchema,
} from "@sloplens/shared";
import type postgres from "postgres";
import { z } from "zod";

const TEXT_LIMIT = 280;
const CLAIM_LIMIT = 240;
export const HIGH_SLOP_FILTER = 0.7;
const DEFAULT_LIMIT = 20;

const recentCursorSchema = z
  .object({
    v: z.literal(1),
    sort: z.literal("recent"),
    capturedAt: z.string().min(1),
    id: z.string().uuid(),
  })
  .strict();

const slopCursorSchema = z
  .object({
    v: z.literal(1),
    sort: z.literal("slop"),
    slop: z.number().min(0).max(1).nullable(),
    id: z.string().uuid(),
  })
  .strict();

type ContentHistoryRow = {
  id: string;
  platform: string;
  url: string;
  author: string | null;
  title: string | null;
  body: string | null;
  published_at: Date | string | null;
  captured_at: Date | string;
  external_id: string | null;
  metadata: unknown;
  decision: unknown;
  claim_text: string | null;
  slop_value: number | string | null;
};

export async function listContentHistory(
  sql: postgres.Sql | null,
  query: ContentListQuery,
): Promise<ContentListResponse> {
  if (!sql) {
    return { items: [], nextCursor: null };
  }

  const limit = query.limit ?? DEFAULT_LIMIT;
  const sort = query.sort ?? "recent";
  const pattern = searchPattern(query.q);
  const cursor = decodeCursor(query.cursor, sort);

  const rows = await sql<ContentHistoryRow[]>`
    select *
    from (
      select
        ci.id,
        ci.platform,
        ci.url,
        ci.author,
        ci.title,
        ci.body,
        ci.published_at,
        ci.captured_at,
        ci.external_id,
        ci.metadata,
        ca.decision,
        cl.claim_text,
        case
          when jsonb_typeof(ca.decision->'aiSlop') = 'number'
            then (ca.decision->>'aiSlop')::double precision
          else null
        end as slop_value,
        case
          when jsonb_typeof(ca.decision->'containsClaim') = 'boolean'
            then (ca.decision->>'containsClaim')::boolean
          else false
        end as contains_claim
      from public.content_items ci
      left join lateral (
        select decision
        from public.content_analysis
        where content_item_id = ci.id
        order by analyzed_at desc
        limit 1
      ) ca on true
      left join lateral (
        select claim_text
        from public.claims
        where content_item_id = ci.id
        order by created_at desc
        limit 1
      ) cl on true
    ) listed
    where platform in ('x', 'youtube')
    ${query.platform ? sql`and platform = ${query.platform}` : sql``}
    ${
      pattern
        ? sql`and (
            author ilike ${pattern}
            or title ilike ${pattern}
            or body ilike ${pattern}
          )`
        : sql``
    }
    ${
      query.signal === "claim"
        ? sql`and (claim_text is not null or contains_claim = true)`
        : query.signal === "highSlop"
          ? sql`and slop_value >= ${HIGH_SLOP_FILTER}`
          : sql``
    }
    ${cursorSql(sql, cursor)}
    ${
      sort === "slop"
        ? sql`order by slop_value desc nulls last, id desc`
        : sql`order by captured_at desc, id desc`
    }
    limit ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.flatMap((row) => {
    const item = mapContentHistoryRow(row);
    return item ? [item] : [];
  });
  const last = page.at(-1);
  return contentListResponseSchema.parse({
    items,
    nextCursor: hasMore && last ? encodeCursor(last, sort) : null,
  });
}

export function mapContentHistoryRow(row: ContentHistoryRow): ContentHistoryItem | null {
  const platform = platformSchema.safeParse(row.platform);
  let url: URL;
  try {
    url = new URL(row.url);
  } catch {
    return null;
  }
  if (!platform.success || (url.protocol !== "http:" && url.protocol !== "https:")) {
    return null;
  }

  const capturedAt = toIso(row.captured_at);
  if (!capturedAt) {
    return null;
  }

  const decision = contentDecisionSchema.safeParse(row.decision);
  const slopValue = unitScore(row.slop_value);
  const slop = decision.success ? deriveSlopSignal(decision.data).value : slopValue;

  const item: ContentHistoryItem = {
    id: row.id,
    platform: platform.data,
    url: url.toString(),
    author: nonempty(row.author),
    handle: platform.data === "x" ? xHandleFromUrl(url) : null,
    title: nonempty(row.title),
    text: truncateText(row.body, TEXT_LIMIT),
    publishedAt: toIso(row.published_at),
    capturedAt,
    slop,
    clickbait: decision.success ? decision.data.clickbait : null,
    engagementBait: decision.success ? decision.data.engagementBait : null,
    containsClaim: decision.success ? decision.data.containsClaim : null,
    needsVerification: decision.success ? decision.data.needsVerification : null,
    claimText: truncateText(row.claim_text, CLAIM_LIMIT),
    thumbnailUrl:
      platform.data === "youtube" ? youtubeThumbnailUrl(row.external_id, row.metadata) : null,
  };
  return item;
}

export function xHandleFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "x.com" && host !== "twitter.com") {
    return null;
  }
  const [handle, kind] = url.pathname.split("/").filter(Boolean);
  if (!handle || kind !== "status" || handle === "i" || handle === "intent") {
    return null;
  }
  return `@${handle}`;
}

export function youtubeThumbnailUrl(externalId: string | null, metadata: unknown): string | null {
  const fromMetadata =
    metadata &&
    typeof metadata === "object" &&
    "videoId" in metadata &&
    typeof metadata.videoId === "string"
      ? metadata.videoId
      : null;
  const videoId = youtubeId(externalId) ?? youtubeId(fromMetadata);
  if (!videoId) {
    return null;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function youtubeId(value: string | null): string | null {
  if (!value || !/^[\w-]{11}$/.test(value)) {
    return null;
  }
  return value;
}

function searchPattern(query: string | undefined): string | null {
  if (!query) {
    return null;
  }
  const cleaned = query.replace(/[%_\\]/g, "").trim();
  if (!cleaned) {
    return null;
  }
  return `%${cleaned}%`;
}

function truncateText(value: string | null | undefined, limit: number): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
}

function nonempty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function unitScore(value: number | string | null | undefined): number | null {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return null;
  }
  return parsed;
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

function decodeCursor(cursor: string | undefined, sort: "recent" | "slop") {
  if (!cursor) {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    const parsed = (sort === "slop" ? slopCursorSchema : recentCursorSchema).safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function encodeCursor(row: ContentHistoryRow, sort: "recent" | "slop"): string | null {
  const capturedAt = toIso(row.captured_at);
  if (!capturedAt) {
    return null;
  }
  const payload =
    sort === "slop"
      ? { v: 1 as const, sort: "slop" as const, slop: unitScore(row.slop_value), id: row.id }
      : { v: 1 as const, sort: "recent" as const, capturedAt, id: row.id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function cursorSql(
  sql: postgres.Sql,
  cursor: z.infer<typeof recentCursorSchema> | z.infer<typeof slopCursorSchema> | null,
) {
  if (!cursor) {
    return sql``;
  }
  if (cursor.sort === "recent") {
    return sql`and (
      captured_at < ${cursor.capturedAt}::timestamptz
      or (captured_at = ${cursor.capturedAt}::timestamptz and id < ${cursor.id}::uuid)
    )`;
  }
  if (cursor.slop == null) {
    return sql`and slop_value is null and id < ${cursor.id}::uuid`;
  }
  return sql`and (
    slop_value < ${cursor.slop}
    or (slop_value = ${cursor.slop} and id < ${cursor.id}::uuid)
    or slop_value is null
  )`;
}
