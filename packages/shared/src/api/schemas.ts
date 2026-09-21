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

export const analyzeResponseSchema = z
  .object({
    decision: contentDecisionSchema,
    cached: z.boolean(),
    contentHash: z.string().min(1).optional(),
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
export type ProvidersResponse = z.infer<typeof providersResponseSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type PutProviderSelectionsRequest = z.infer<typeof putProviderSelectionsRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
export type VerifySource = z.infer<typeof verifySourceSchema>;
export type VerifyEvidence = z.infer<typeof verifyEvidenceSchema>;
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;
export type TraceRequest = z.infer<typeof traceRequestSchema>;
export type TraceResponse = z.infer<typeof traceResponseSchema>;
export type RelatedRequest = z.infer<typeof relatedRequestSchema>;
export type RelatedResponse = z.infer<typeof relatedResponseSchema>;
