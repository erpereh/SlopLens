import { providerCapabilitySchema } from "@sloplens/config";
import { z } from "zod";

export const ERROR_CODES = [
  "validation_error",
  "provider_not_configured",
  "rate_limited",
  "backend_unavailable",
  "insufficient_evidence",
  "transcript_unavailable",
  "source_unreachable",
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorBodySchema = z
  .object({
    code: errorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean(),
    capability: providerCapabilitySchema.optional(),
  })
  .strict();

export const errorEnvelopeSchema = z
  .object({
    error: errorBodySchema,
  })
  .strict();

export type ErrorBody = z.infer<typeof errorBodySchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return errorEnvelopeSchema.safeParse(value).success;
}

export function createErrorEnvelope(error: ErrorBody): ErrorEnvelope {
  return { error };
}
