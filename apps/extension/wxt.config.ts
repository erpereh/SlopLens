import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
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
