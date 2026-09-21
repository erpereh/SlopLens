import type { NormalizedContent } from "@sloplens/core";
import type { AnalyzeResponse } from "@sloplens/shared";
import { describe, expect, it, vi } from "vitest";

import { createAnalyzeScheduler } from "./analyze-scheduler";

const content: NormalizedContent = {
  platform: "x",
  url: "https://x.com/u/status/1",
  metadata: {},
};

function host(connected = true): HTMLElement {
  const element = document.createElement("article");
  Object.defineProperty(element, "isConnected", { value: connected });
  return element;
}

describe("createAnalyzeScheduler", () => {
  it("limits concurrency and reuses in-flight work by content key", async () => {
    let inflight = 0;
    let max = 0;
    const analyze = vi.fn(async () => {
      inflight += 1;
      max = Math.max(max, inflight);
      await Promise.resolve();
      inflight -= 1;
      return {
        decision: {
          aiSlop: 0.2,
          engagementBait: 0,
          clickbait: 0,
          spam: 0,
          advertisement: 0,
          containsClaim: false,
          needsVerification: false,
          needsWebSearch: false,
          needsImageAnalysis: false,
          needsPowerfulModel: false,
          likelyDuplicate: false,
          contentType: "unknown" as const,
        },
        cached: false,
      };
    });

    const scheduler = createAnalyzeScheduler({
      analyze,
      concurrency: 2,
      isVisible: () => true,
    });

    const jobs = Array.from({ length: 6 }, (_, index) => {
      const callbacks = {
        onLoading: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
      };
      scheduler.observe({
        host: host(),
        content: { ...content, url: `https://x.com/u/status/${index}` },
        contentKey: `key-${index}`,
        callbacks,
        autoAnalyze: true,
      });
      return callbacks;
    });

    await vi.waitFor(() => {
      expect(jobs.every((job) => job.onSuccess.mock.calls.length === 1)).toBe(true);
    });
    expect(max).toBeLessThanOrEqual(2);
    expect(analyze).toHaveBeenCalledTimes(6);
  });

  it("does not enqueue disconnected or offscreen hosts, and reuses cache", async () => {
    const analyze = vi.fn(async () => ({
      decision: {
        aiSlop: 0.4,
        engagementBait: 0,
        clickbait: 0,
        spam: 0,
        advertisement: 0,
        containsClaim: false,
        needsVerification: false,
        needsWebSearch: false,
        needsImageAnalysis: false,
        needsPowerfulModel: false,
        likelyDuplicate: false,
        contentType: "unknown" as const,
      },
      cached: false,
    }));
    const visibility = new Map<Element, boolean>();
    const scheduler = createAnalyzeScheduler({
      analyze,
      isVisible: (node) => visibility.get(node) === true,
    });

    const gone = host(false);
    visibility.set(gone, true);
    scheduler.observe({
      host: gone,
      content,
      contentKey: "gone",
      callbacks: { onLoading: vi.fn(), onSuccess: vi.fn(), onError: vi.fn() },
      autoAnalyze: true,
    });

    const hidden = host();
    visibility.set(hidden, false);
    scheduler.observe({
      host: hidden,
      content,
      contentKey: "hidden",
      callbacks: { onLoading: vi.fn(), onSuccess: vi.fn(), onError: vi.fn() },
      autoAnalyze: true,
    });

    const visible = host();
    visibility.set(visible, true);
    const success = vi.fn();
    scheduler.observe({
      host: visible,
      content,
      contentKey: "same",
      callbacks: { onLoading: vi.fn(), onSuccess: success, onError: vi.fn() },
      autoAnalyze: true,
    });
    scheduler.request({
      host: visible,
      content,
      contentKey: "same",
      callbacks: { onLoading: vi.fn(), onSuccess: vi.fn(), onError: vi.fn() },
    });

    await vi.waitFor(() => {
      expect(success).toHaveBeenCalled();
    });
    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it("does not deliver results after the overlay is cancelled", async () => {
    let release!: (value: AnalyzeResponse) => void;
    const analyze = vi.fn(
      () =>
        new Promise<AnalyzeResponse>((resolve) => {
          release = resolve;
        }),
    );
    const scheduler = createAnalyzeScheduler({
      analyze,
      isVisible: () => true,
    });
    const callbacks = {
      onLoading: vi.fn(),
      onSuccess: vi.fn(),
      onError: vi.fn(),
    };
    const stop = scheduler.observe({
      host: host(),
      content,
      contentKey: "cancelled",
      callbacks,
      autoAnalyze: true,
    });
    await vi.waitFor(() => {
      expect(analyze).toHaveBeenCalledTimes(1);
    });
    stop();
    release({
      decision: {
        aiSlop: 0.9,
        engagementBait: 0,
        clickbait: 0,
        spam: 0,
        advertisement: 0,
        containsClaim: false,
        needsVerification: false,
        needsWebSearch: false,
        needsImageAnalysis: false,
        needsPowerfulModel: false,
        likelyDuplicate: false,
        contentType: "unknown",
      },
      cached: false,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onError).not.toHaveBeenCalled();
  });
});
