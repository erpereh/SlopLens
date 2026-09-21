import type { NormalizedContent } from "@sloplens/core";
import { z } from "zod";

export const visionInputSchema = z
  .object({
    imageUrl: z.string().url(),
    prompt: z.string().optional(),
  })
  .strict();

export const visionResultSchema = z
  .object({
    description: z.string().min(1),
    claims: z.array(z.string().min(1)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type VisionInput = z.infer<typeof visionInputSchema> & {
  content?: NormalizedContent;
};

export type VisionResult = z.infer<typeof visionResultSchema>;

export interface VisionProvider {
  readonly providerId: string;
  analyze(input: VisionInput): Promise<VisionResult>;
}
