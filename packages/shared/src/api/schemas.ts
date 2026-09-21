import { providerCapabilitySchema, providerSelectionSchema } from "@sloplens/config/browser";
import {
  contentDecisionSchema,
  contentRelationTypeSchema,
  normalizedContentSchema,
  platformSchema,
} from "@sloplens/core";
import { z } from "zod";

export const healthResponseSchema = z
  .object({
    status: z.enum(["ok", "degraded", "unavailable"]),
    checks: z
      .object({
        database: z.boolean().optional(),
        pgvector: z.boolean().optional(),
      })
      .strict()
      .optional(),
    /** Present only for loopback health requests; used to authorize settings mutations. */
    localToken: z.string().min(1).optional(),
  })
  .strict();

export const metricsResponseSchema = z
  .object({
    status: z.enum(["ok", "degraded", "unavailable"]),
    checks: z
      .object({
        database: z.boolean(),
        pgvector: z.boolean(),
      })
      .strict(),
    counts: z
      .object({
        contentItems: z.number().int().nonnegative().nullable(),
        cachedAnalyses: z.number().int().nonnegative().nullable(),
        clusters: z.number().int().nonnegative().nullable(),
        relations: z.number().int().nonnegative().nullable(),
        byPlatform: z
          .object({
            x: z.number().int().nonnegative().nullable(),
            youtube: z.number().int().nonnegative().nullable(),
          })
          .strict(),
        claims: z.number().int().nonnegative().nullable(),
        /** Mean `aiSlop` of stored analyses, 0–1. Null when unknown. */
        averageSlop: z.number().min(0).max(1).nullable(),
      })
      .strict(),
    lastActivityAt: z.string().min(1).nullable(),
  })
  .strict();

const contentHistoryScoreSchema = z.number().min(0).max(1).nullable();

export const contentListQuerySchema = z
  .object({
    platform: platformSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    sort: z.enum(["recent", "slop"]).optional(),
    signal: z.enum(["claim", "highSlop"]).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    cursor: z.string().min(1).max(500).optional(),
  })
  .strict();

export const contentHistoryItemSchema = z
  .object({
    id: z.string().uuid(),
    platform: platformSchema,
    url: z.string().url(),
    author: z.string().min(1).nullable(),
    handle: z.string().min(1).nullable(),
    title: z.string().min(1).nullable(),
    text: z.string().min(1).nullable(),
    publishedAt: z.string().min(1).nullable(),
    capturedAt: z.string().min(1),
    slop: contentHistoryScoreSchema,
    clickbait: contentHistoryScoreSchema,
    engagementBait: contentHistoryScoreSchema,
    containsClaim: z.boolean().nullable(),
    needsVerification: z.boolean().nullable(),
    claimText: z.string().min(1).nullable(),
    thumbnailUrl: z.string().url().nullable(),
  })
  .strict();

export const contentListResponseSchema = z
  .object({
    items: z.array(contentHistoryItemSchema),
    nextCursor: z.string().min(1).nullable(),
  })
  .strict();

export const providerDescriptorSchema = z
  .object({
    providerId: z.string().min(1),
    configured: z.boolean(),
    models: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const providersResponseSchema = z
  .object({
    capabilities: z.array(
      z
        .object({
          capability: providerCapabilitySchema,
          providers: z.array(providerDescriptorSchema),
        })
        .strict(),
    ),
  })
  .strict();

export const secretStatusSchema = z
  .object({
    capability: providerCapabilitySchema,
    providerId: z.string().min(1),
    configured: z.boolean(),
  })
  .strict();

export const settingsResponseSchema = z
  .object({
    selections: z.array(providerSelectionSchema),
    secrets: z.array(secretStatusSchema),
  })
  .strict();

export const putProviderSelectionsRequestSchema = z
  .object({
    selections: z.array(providerSelectionSchema),
    secrets: z
      .array(
        z
          .object({
            capability: providerCapabilitySchema,
            providerId: z.string().min(1),
            apiKey: z.string().min(1).optional(),
            delete: z.boolean().optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const analyzeRequestSchema = z
  .object({
    content: normalizedContentSchema,
    forceRefresh: z.boolean().optional(),
  })
  .strict();

export const analyzeWarningSchema = z
  .object({
    capability: z.enum(["vision"]),
    message: z.string().min(1),
  })
  .strict();

export const analyzeResponseSchema = z
  .object({
    decision: contentDecisionSchema,
    cached: z.boolean(),
    contentHash: z.string().min(1).optional(),
    warnings: z.array(analyzeWarningSchema).optional(),
  })
  .strict();

export const verifyRequestSchema = z
  .object({
    claim: z.string().min(1),
    content: normalizedContentSchema.optional(),
  })
  .strict();

export const verifySourceSchema = z
  .object({
    url: z.string().url(),
    title: z.string().optional(),
    publisher: z.string().optional(),
    kind: z.string().optional(),
  })
  .strict();

export const verifyEvidenceSchema = z
  .object({
    stance: z.enum(["supports", "contradicts", "neutral"]),
    summary: z.string().min(1),
    sourceUrl: z.string().url().optional(),
  })
  .strict();

export const verifyResponseSchema = z
  .object({
    status: z.enum(["ok", "insufficient_evidence"]),
    claim: z.string().min(1),
    sources: z.array(verifySourceSchema),
    evidence: z.array(verifyEvidenceSchema),
  })
  .strict();

export const traceRequestSchema = z
  .object({
    content: normalizedContentSchema,
  })
  .strict();

export const traceNodeSchema = z
  .object({
    url: z.string().url(),
    title: z.string().optional(),
    platform: platformSchema.optional(),
    score: z.number().optional(),
    relation: contentRelationTypeSchema.optional(),
  })
  .strict();

export const traceOriginCandidateSchema = z
  .object({
    url: z.string().url(),
    title: z.string().optional(),
    publishedAt: z.string().optional(),
    whyThisMayBeTheOrigin: z.string().min(1),
    confidence: z.enum(["low", "medium"]),
  })
  .strict();

export const traceResponseSchema = z
  .object({
    status: z.enum(["ok", "insufficient_evidence"]),
    graph: z
      .object({
        origin: traceNodeSchema.optional(),
        similar: z.array(traceNodeSchema),
        derivations: z.array(traceNodeSchema),
      })
      .strict(),
    possibleOrigin: traceOriginCandidateSchema.optional(),
    relatedVersions: z.array(traceNodeSchema).optional(),
    possibleDerivatives: z.array(traceNodeSchema).optional(),
    uncertainty: z.string().min(1).optional(),
    evidence: z.array(
      z
        .object({
          summary: z.string().min(1),
          sourceUrl: z.string().url().optional(),
        })
        .strict(),
    ),
  })
  .strict();

export const relatedRequestSchema = z
  .object({
    content: normalizedContentSchema,
    limit: z.number().int().positive().optional(),
  })
  .strict();

export const relatedItemSchema = z
  .object({
    url: z.string().url(),
    platform: platformSchema,
    score: z.number(),
    title: z.string().optional(),
  })
  .strict();

export const relatedResponseSchema = z
  .object({
    items: z.array(relatedItemSchema),
  })
  .strict();

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;
export type ContentListQuery = z.infer<typeof contentListQuerySchema>;

export const EMPTY_METRICS_COUNTS: MetricsResponse["counts"] = {
  contentItems: null,
  cachedAnalyses: null,
  clusters: null,
  relations: null,
  byPlatform: { x: null, youtube: null },
  claims: null,
  averageSlop: null,
};
export type ContentHistoryItem = z.infer<typeof contentHistoryItemSchema>;
export type ContentListResponse = z.infer<typeof contentListResponseSchema>;
export type ProvidersResponse = z.infer<typeof providersResponseSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type PutProviderSelectionsRequest = z.infer<typeof putProviderSelectionsRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalyzeWarning = z.infer<typeof analyzeWarningSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
export type VerifySource = z.infer<typeof verifySourceSchema>;
export type VerifyEvidence = z.infer<typeof verifyEvidenceSchema>;
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;
export type TraceRequest = z.infer<typeof traceRequestSchema>;
export type TraceResponse = z.infer<typeof traceResponseSchema>;
export type RelatedRequest = z.infer<typeof relatedRequestSchema>;
export type RelatedResponse = z.infer<typeof relatedResponseSchema>;
