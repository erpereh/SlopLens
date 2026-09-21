import type { ErrorBody } from "../errors";
import { errorEnvelopeSchema } from "../errors";
import type { ApiOperation } from "./operations";
import {
  type AnalyzeRequest,
  type AnalyzeResponse,
  analyzeRequestSchema,
  analyzeResponseSchema,
  type ContentListQuery,
  type ContentListResponse,
  contentListQuerySchema,
  contentListResponseSchema,
  type HealthResponse,
  healthResponseSchema,
  type MetricsResponse,
  metricsResponseSchema,
  type ProvidersResponse,
  type PutProviderSelectionsRequest,
  providersResponseSchema,
  putProviderSelectionsRequestSchema,
  type RelatedRequest,
  type RelatedResponse,
  relatedRequestSchema,
  relatedResponseSchema,
  type SettingsResponse,
  settingsResponseSchema,
  type TraceRequest,
  type TraceResponse,
  traceRequestSchema,
  traceResponseSchema,
  type VerifyRequest,
  type VerifyResponse,
  verifyRequestSchema,
  verifyResponseSchema,
} from "./schemas";
import {
  type ApiTransport,
  createHttpApiTransport,
  type HttpApiTransportOptions,
} from "./transport";

export { SLOPLENS_LOCAL_API_TOKEN_HEADER } from "./client-headers";

export class SlopLensApiError extends Error {
  readonly code: ErrorBody["code"];
  readonly retryable: boolean;
  readonly capability: ErrorBody["capability"];
  readonly status: number;

  constructor(error: ErrorBody, status: number) {
    super(error.message);
    this.name = "SlopLensApiError";
    this.code = error.code;
    this.retryable = error.retryable;
    this.capability = error.capability;
    this.status = status;
  }
}

export interface SlopLensApiClient {
  health(): Promise<HealthResponse>;
  metrics(): Promise<MetricsResponse>;
  listContent(query?: ContentListQuery): Promise<ContentListResponse>;
  getProviders(): Promise<ProvidersResponse>;
  getSettings(): Promise<SettingsResponse>;
  putProviderSelections(input: PutProviderSelectionsRequest): Promise<SettingsResponse>;
  analyze(input: AnalyzeRequest): Promise<AnalyzeResponse>;
  verify(input: VerifyRequest): Promise<VerifyResponse>;
  trace(input: TraceRequest): Promise<TraceResponse>;
  related(input: RelatedRequest): Promise<RelatedResponse>;
}

export type SlopLensApiClientOptions =
  | { transport: ApiTransport }
  | (HttpApiTransportOptions & { transport?: never });

type ZodLike<T> = {
  parse(data: unknown): T;
};

export function createSlopLensApiClient(options: SlopLensApiClientOptions): SlopLensApiClient {
  const transport =
    "transport" in options && options.transport
      ? options.transport
      : createHttpApiTransport(options);

  async function call<T>(operation: ApiOperation, schema: ZodLike<T>, body?: unknown): Promise<T> {
    const result = await transport.request(
      body === undefined ? { operation } : { operation, body },
    );
    if (result.status < 200 || result.status >= 300) {
      throw toApiError(result.body, result.status);
    }
    return schema.parse(result.body);
  }

  return {
    health: () => call("health", healthResponseSchema),
    metrics: () => call("metrics", metricsResponseSchema),
    listContent: (query) =>
      call("listContent", contentListResponseSchema, contentListQuerySchema.parse(query ?? {})),
    getProviders: () => call("providers", providersResponseSchema),
    getSettings: () => call("getSettings", settingsResponseSchema),
    putProviderSelections: (input) =>
      call(
        "putSettingsProviders",
        settingsResponseSchema,
        putProviderSelectionsRequestSchema.parse(input),
      ),
    analyze: (input) => call("analyze", analyzeResponseSchema, analyzeRequestSchema.parse(input)),
    verify: (input) => call("verify", verifyResponseSchema, verifyRequestSchema.parse(input)),
    trace: (input) => call("trace", traceResponseSchema, traceRequestSchema.parse(input)),
    related: (input) => call("related", relatedResponseSchema, relatedRequestSchema.parse(input)),
  };
}

function toApiError(json: unknown, status: number): SlopLensApiError {
  const parsed = errorEnvelopeSchema.safeParse(json);
  if (parsed.success) {
    return new SlopLensApiError(parsed.data.error, status);
  }
  return new SlopLensApiError(
    {
      code: "backend_unavailable",
      message: "Unexpected error response from the SlopLens API",
      retryable: true,
    },
    status,
  );
}
