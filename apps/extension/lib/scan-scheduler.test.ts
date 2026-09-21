import { describe, expect, it, vi } from "vitest";

import { createScanScheduler } from "./scan-scheduler";

describe("createScanScheduler", () => {
  it("coalesces overlapping scans into a single follow-up pass", async () => {
    let inflight = 0;
    let maxInflight = 0;
    let completed = 0;

    const scan = vi.fn(async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await Promise.resolve();
      await Promise.resolve();
      inflight -= 1;
      completed += 1;
    });

    const schedule = createScanScheduler(scan);
    schedule();
    schedule();
    schedule();

    await vi.waitFor(() => {
      expect(completed).toBeGreaterThanOrEqual(2);
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(maxInflight).toBe(1);
    expect(completed).toBe(2);
    expect(scan).toHaveBeenCalledTimes(2);
  });
});
