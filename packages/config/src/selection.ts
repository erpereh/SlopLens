import { z } from "zod";

export const PROVIDER_CAPABILITIES = [
  "decision",
  "embedding",
  "search",
  "vision",
  "reasoning",
] as const;

export const providerCapabilitySchema = z.enum(PROVIDER_CAPABILITIES);

export type ProviderCapability = z.infer<typeof providerCapabilitySchema>;

export const providerSelectionSchema = z
  .object({
    capability: providerCapabilitySchema,
    providerId: z.string().min(1),
    modelId: z.string().min(1).optional(),
    baseUrl: z.string().url().optional(),
    options: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type ProviderSelection = z.infer<typeof providerSelectionSchema>;
