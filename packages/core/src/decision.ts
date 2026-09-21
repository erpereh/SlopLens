import { z } from "zod";

export const CONTENT_TYPES = [
  "news",
  "opinion",
  "meme",
  "advertisement",
  "personal",
  "spam",
  "unknown",
] as const;

export const contentTypeSchema = z.enum(CONTENT_TYPES);

export const unitScoreSchema = z.number().min(0).max(1);

export const contentDecisionSchema = z
  .object({
    aiSlop: unitScoreSchema,
    engagementBait: unitScoreSchema,
    clickbait: unitScoreSchema,
    spam: unitScoreSchema,
    advertisement: unitScoreSchema,
    containsClaim: z.boolean(),
    needsVerification: z.boolean(),
    needsWebSearch: z.boolean(),
    needsImageAnalysis: z.boolean(),
    needsPowerfulModel: z.boolean(),
    likelyDuplicate: z.boolean(),
    informationQuality: unitScoreSchema.optional(),
    originality: unitScoreSchema.optional(),
    contentType: contentTypeSchema,
  })
  .strict();

export type ContentType = z.infer<typeof contentTypeSchema>;
export type ContentDecision = z.infer<typeof contentDecisionSchema>;
