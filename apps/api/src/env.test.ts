import { describe, expect, it } from "vitest";

import { applyBootstrapEnv } from "./env";

describe("applyBootstrapEnv", () => {
  it("fills missing keys and never overwrites existing env", () => {
    const env: NodeJS.ProcessEnv = { EXISTING: "keep-me" };
    applyBootstrapEnv("EXISTING=new-value\nDATABASE_URL=postgresql://local/db\n# comment\n", env);
    expect(env.EXISTING).toBe("keep-me");
    expect(env.DATABASE_URL).toBe("postgresql://local/db");
  });
});
