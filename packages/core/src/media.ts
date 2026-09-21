import { z } from "zod";

export const MEDIA_KINDS = ["image", "video", "audio", "thumbnail", "other"] as const;

export const mediaKindSchema = z.enum(MEDIA_KINDS);

export const mediaReferenceSchema = z
  .object({
    kind: mediaKindSchema,
    url: z.string().url(),
    alt: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    mimeType: z.string().optional(),
  })
  .strict();

export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaReference = z.infer<typeof mediaReferenceSchema>;
