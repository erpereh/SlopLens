import { z } from "zod";

export const CONTENT_RELATION_TYPES = [
  "originates_from",
  "cites",
  "copies",
  "paraphrases",
  "supports",
  "contradicts",
  "exaggerates",
  "derived_from",
  "related_to",
] as const;

export const contentRelationTypeSchema = z.enum(CONTENT_RELATION_TYPES);

export type ContentRelationType = z.infer<typeof contentRelationTypeSchema>;
