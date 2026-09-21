import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

const uiSrc = path.resolve(fileURLToPath(new URL("../../packages/ui/src", import.meta.url)));

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": uiSrc,
      },
    },
  }),
  manifest: {
    name: "SlopLens",
    description: "See beyond the slop.",
    permissions: ["storage"],
    host_permissions: [
      "http://127.0.0.1:3001/*",
      "*://x.com/*",
      "*://twitter.com/*",
      "*://*.youtube.com/*",
    ],
    action: {
      default_title: "SlopLens",
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true,
    },
  },
});
