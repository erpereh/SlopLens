import { describe, expect, it } from "vitest";

import { createErrorEnvelope, errorEnvelopeSchema, isErrorEnvelope } from "./errors";

describe("errorEnvelopeSchema", () => {
  it("accepts a complete envelope", () => {
    const envelope = createErrorEnvelope({
      code: "provider_not_configured",
      message: "Embedding provider is not configured",
      retryable: false,
      capability: "embedding",
    });
    expect(errorEnvelopeSchema.parse(envelope)).toEqual(envelope);
    expect(isErrorEnvelope(envelope)).toBe(true);
  });

  it("rejects an unknown error code", () => {
    const result = errorEnvelopeSchema.safeParse({
      error: {
        code: "not_a_real_code",
        message: "nope",
        retryable: false,
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing retryable flag", () => {
    const result = errorEnvelopeSchema.safeParse({
      error: {
        code: "validation_error",
        message: "bad payload",
      },
    });
    expect(result.success).toBe(false);
  });
});
