import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.smoke.test.ts"],
        },
      },
      {
        test: {
          name: "smoke",
          environment: "node",
          include: ["src/**/*.smoke.test.ts"],
          testTimeout: 60_000,
        },
      },
    ],
  },
});
