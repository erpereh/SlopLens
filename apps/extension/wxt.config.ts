import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

const uiSrc = path.resolve(fileURLToPath(new URL("../../packages/ui/src", import.meta.url)));

function resolveUiAtImport(id: string): string | null {
  if (!id.startsWith("@/")) {
    return null;
  }
  const base = path.resolve(uiSrc, id.slice(2));
  const candidates = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"];
  for (const suffix of candidates) {
    const candidate = base + suffix;
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return base;
}

function stripWxtAtAlias(config: { resolve?: { alias?: unknown } }) {
  const current = config.resolve?.alias;
  if (!current) {
    return;
  }
  if (Array.isArray(current)) {
    if (config.resolve) {
      config.resolve.alias = current.filter((entry) => {
        const find =
          typeof entry === "object" && entry !== null ? (entry as { find?: unknown }).find : entry;
        return find !== "@";
      });
    }
    return;
  }
  if (typeof current === "object") {
    delete (current as Record<string, unknown>)["@"];
  }
}

function sloplensUiAtPlugin() {
  return {
    name: "sloplens-ui-at",
    enforce: "pre" as const,
    resolveId: {
      filter: { id: /^@\// },
      handler(id: string) {
        return resolveUiAtImport(id);
      },
    },
    transform: {
      filter: { id: /[\\/]packages[\\/]ui[\\/]src[\\/].*\.[cm]?[jt]sx?$/ },
      handler(code: string, id: string) {
        if (!code.includes("@/")) {
          return null;
        }
        const dir = path.dirname(id);
        const next = code.replaceAll(/["']@\/([^"']+)["']/g, (full, spec: string) => {
          const abs = resolveUiAtImport(`@/${spec}`) ?? path.resolve(uiSrc, spec);
          let rel = path.relative(dir, abs).replaceAll("\\", "/");
          if (!rel.startsWith(".")) {
            rel = `./${rel}`;
          }
          const quote = full.startsWith("'") ? "'" : '"';
          return `${quote}${rel}${quote}`;
        });
        return next === code ? null : next;
      },
    },
  };
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss(), sloplensUiAtPlugin()],
  }),
  hooks: {
    "vite:build:extendConfig": (_entries, config) => {
      stripWxtAtAlias(config);
      config.plugins?.push(sloplensUiAtPlugin());
    },
    "vite:devServer:extendConfig": (config) => {
      stripWxtAtAlias(config);
      config.plugins?.push(sloplensUiAtPlugin());
    },
  },
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
