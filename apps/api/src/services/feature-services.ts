import type {
  AnalyzeRequest,
  AnalyzeResponse,
  RelatedRequest,
  RelatedResponse,
  TraceRequest,
  TraceResponse,
  VerifyRequest,
  VerifyResponse,
} from "@sloplens/shared";
import type postgres from "postgres";
import { createAnalyzeService } from "./analyze-service";
import type { ProviderRuntime } from "./provider-runtime";
import { createRelatedService } from "./related-service";
import { createTraceService } from "./trace-service";
import { createVerifyService } from "./verify-service";

export interface FeatureServices {
  analyze(request: AnalyzeRequest): Promise<AnalyzeResponse>;
  related(request: RelatedRequest): Promise<RelatedResponse>;
  verify(request: VerifyRequest): Promise<VerifyResponse>;
  trace(request: TraceRequest): Promise<TraceResponse>;
}

export function createFeatureServices(input: {
  sql: postgres.Sql | null;
  runtime: ProviderRuntime;
}): FeatureServices {
  const analyze = createAnalyzeService(input);
  const related = createRelatedService(input);
  const verify = createVerifyService(input);
  const trace = createTraceService(input);
  return {
    analyze: (request) => analyze.analyze(request),
    related: (request) => related.related(request),
    verify: (request) => verify.verify(request),
    trace: (request) => trace.trace(request),
  };
}
