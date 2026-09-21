export interface ApiEnv {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  nodeEnv: string;
  raw: NodeJS.ProcessEnv;
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
