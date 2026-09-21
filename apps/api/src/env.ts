import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface ApiEnv {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  nodeEnv: string;
  raw: NodeJS.ProcessEnv;
}

/**
 * Apply bootstrap `.env` key/value pairs without overwriting existing process env.
 * Values are never logged.
 */
export function applyBootstrapEnv(raw: string, env: NodeJS.ProcessEnv = process.env): void {
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!env[key]) {
      env[key] = value;
    }
  }
}

export function loadBootstrapEnvFromApiPackage(): void {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  try {
    applyBootstrapEnv(readFileSync(envPath, "utf8"));
  } catch {
    // Missing bootstrap file is fine; callers may export variables themselves.
  }
}

export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const port = Number.parseInt(env.PORT ?? "3001", 10);
  return {
    port: Number.isFinite(port) ? port : 3001,
    host: "127.0.0.1",
    databaseUrl: env.DATABASE_URL?.trim() || undefined,
    nodeEnv: env.NODE_ENV ?? "development",
    raw: env,
  };
}
