import { SLOPLENS_LOCAL_API_TOKEN_HEADER } from "./client-headers";
import { API_OPERATION_SPEC, type ApiOperation } from "./operations";
import { API_ROUTES } from "./routes";

export interface ApiTransportRequest {
  operation: ApiOperation;
  body?: unknown;
}

export interface ApiTransportResponse {
  status: number;
  body: unknown;
}

export interface ApiTransport {
  request(input: ApiTransportRequest): Promise<ApiTransportResponse>;
}

export interface HttpApiTransportOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  localToken?: string | (() => string | undefined);
}

export function createHttpApiTransport(options: HttpApiTransportOptions): ApiTransport {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? fetch;

  function resolveLocalToken(): string | undefined {
    const token = options.localToken;
    if (typeof token === "function") {
      return token();
    }
    return token;
  }

  return {
    async request(input) {
      const spec = API_OPERATION_SPEC[input.operation];
      const headers: Record<string, string> = {};
      if (input.body !== undefined) {
        headers["content-type"] = "application/json";
      }
      if (spec.method === "PUT" && spec.route === API_ROUTES.settingsProviders) {
        const localToken = resolveLocalToken();
        if (localToken) {
          headers[SLOPLENS_LOCAL_API_TOKEN_HEADER] = localToken;
        }
      }

      const url = new URL(spec.route, `${baseUrl}/`);
      const isGet = spec.method === "GET";
      if (isGet && input.body && typeof input.body === "object") {
        for (const [key, value] of Object.entries(input.body as Record<string, unknown>)) {
          if (value === undefined || value === null || value === "") {
            continue;
          }
          url.searchParams.set(key, String(value));
        }
      }

      const response = await fetchImpl(url.toString(), {
        method: spec.method,
        headers: !isGet && Object.keys(headers).length > 0 ? headers : undefined,
        body: isGet || input.body === undefined ? undefined : JSON.stringify(input.body),
      });

      return {
        status: response.status,
        body: await readJson(response),
      };
    },
  };
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
