import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "SlopLens",
    description: "See beyond the slop.",
    permissions: [],
    host_permissions: [],
  },
});
