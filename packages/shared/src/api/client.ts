import type { ErrorBody } from "../errors";
import { errorEnvelopeSchema } from "../errors";
import { API_ROUTES } from "./routes";
import {
  type AnalyzeRequest,
  type AnalyzeResponse,
  analyzeRequestSchema,
  analyzeResponseSchema,
  type HealthResponse,
  healthResponseSchema,
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
  getProviders(): Promise<ProvidersResponse>;
  getSettings(): Promise<SettingsResponse>;
  putProviderSelections(input: PutProviderSelectionsRequest): Promise<SettingsResponse>;
  analyze(input: AnalyzeRequest): Promise<AnalyzeResponse>;
  verify(input: VerifyRequest): Promise<VerifyResponse>;
  trace(input: TraceRequest): Promise<TraceResponse>;
  related(input: RelatedRequest): Promise<RelatedResponse>;
}

export interface SlopLensApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
}

type ZodLike<T> = {
  parse(data: unknown): T;
};

export function createSlopLensApiClient(options: SlopLensApiClientOptions): SlopLensApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetch ?? fetch;

  async function request<T>(
    method: string,
    route: string,
    schema: ZodLike<T>,
    body?: unknown,
  ): Promise<T> {
    const response = await fetchImpl(new URL(route, `${baseUrl}/`).toString(), {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const json: unknown = await readJson(response);
    if (!response.ok) {
      throw toApiError(json, response.status);
    }
    return schema.parse(json);
  }

  return {
    health: () => request("GET", API_ROUTES.health, healthResponseSchema),
    getProviders: () => request("GET", API_ROUTES.providers, providersResponseSchema),
    getSettings: () => request("GET", API_ROUTES.settings, settingsResponseSchema),
    putProviderSelections: (input) =>
      request(
        "PUT",
        API_ROUTES.settingsProviders,
        settingsResponseSchema,
        putProviderSelectionsRequestSchema.parse(input),
      ),
    analyze: (input) =>
      request("POST", API_ROUTES.analyze, analyzeResponseSchema, analyzeRequestSchema.parse(input)),
    verify: (input) =>
      request("POST", API_ROUTES.verify, verifyResponseSchema, verifyRequestSchema.parse(input)),
    trace: (input) =>
      request("POST", API_ROUTES.trace, traceResponseSchema, traceRequestSchema.parse(input)),
    related: (input) =>
      request("POST", API_ROUTES.related, relatedResponseSchema, relatedRequestSchema.parse(input)),
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
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
