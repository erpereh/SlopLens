import { z } from "zod";

export const reasoningInputSchema = z
  .object({
    prompt: z.string().min(1),
    context: z.string().optional(),
  })
  .strict();

export const reasoningResultSchema = z
  .object({
    text: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type ReasoningInput = z.infer<typeof reasoningInputSchema>;
export type ReasoningResult = z.infer<typeof reasoningResultSchema>;

export interface ReasoningProvider {
  readonly providerId: string;
  complete(input: ReasoningInput): Promise<ReasoningResult>;
}
