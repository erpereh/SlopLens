import { z } from "zod";

import { mediaReferenceSchema } from "./media";
import { platformSchema } from "./platform";

export const normalizedContentSchema = z
  .object({
    platform: platformSchema,
    externalId: z.string().min(1).optional(),
    url: z.string().url(),
    author: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    text: z.string().optional(),
    publishedAt: z.string().min(1).optional(),
    media: z.array(mediaReferenceSchema).optional(),
    metadata: z.record(z.string(), z.unknown()),
  })
  .strict();

export type NormalizedContent = z.infer<typeof normalizedContentSchema>;
