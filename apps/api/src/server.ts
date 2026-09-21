import { pathToFileURL } from "node:url";

import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadApiEnv } from "./env";
import { API_DEFAULT_ORIGIN, API_DEFAULT_PORT } from "./index";

export function startServer(env = loadApiEnv()) {
  const app = createApp(env);
  const port = env.port || API_DEFAULT_PORT;

  serve(
    {
      fetch: app.fetch,
      hostname: env.host,
      port,
    },
    (info) => {
      console.log(`[@sloplens/api] listening on http://${info.address}:${info.port}`);
      if (info.address === "127.0.0.1" && info.port === API_DEFAULT_PORT) {
        console.log(`[@sloplens/api] default origin ${API_DEFAULT_ORIGIN}`);
      }
    },
  );

  return app;
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  startServer();
}
