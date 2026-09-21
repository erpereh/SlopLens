import { SlopLensApiError } from "@sloplens/shared";
import type { FeatureError } from "@sloplens/ui";

export function toFeatureError(error: unknown): FeatureError {
  if (error instanceof SlopLensApiError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }
  return {
    code: "backend_unavailable",
    message: error instanceof Error ? error.message : undefined,
    retryable: true,
  };
}
