import type { NormalizedContent } from "@sloplens/core";
import type { AnalyzeResponse } from "@sloplens/shared";

export const ANALYZE_CONCURRENCY = 2;
export const ANALYZE_VIEWPORT_ROOT_MARGIN = "320px 0px";

export type AnalyzeSchedulerCallbacks = {
  onLoading: () => void;
  onSuccess: (result: AnalyzeResponse) => void;
  onError: (error: unknown) => void;
};

type QueuedJob = {
  contentKey: string;
  content: NormalizedContent;
  host: Element;
  callbacks: AnalyzeSchedulerCallbacks;
  cancelled: boolean;
};

export function createAnalyzeScheduler(options: {
  analyze: (content: NormalizedContent) => Promise<AnalyzeResponse>;
  concurrency?: number;
  isVisible?: (host: Element) => boolean;
}) {
  const concurrency = options.concurrency ?? ANALYZE_CONCURRENCY;
  const isVisible = options.isVisible ?? defaultIsVisible;
  const cache = new Map<string, AnalyzeResponse>();
  const inflight = new Map<string, Promise<AnalyzeResponse>>();
  const tracked = new Map<string, Set<QueuedJob>>();
  const queue: QueuedJob[] = [];
  let active = 0;

  function track(job: QueuedJob): void {
    const jobs = tracked.get(job.contentKey) ?? new Set<QueuedJob>();
    jobs.add(job);
    tracked.set(job.contentKey, jobs);
  }

  function dropQueued(contentKey: string): void {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (queue[index]?.contentKey === contentKey) {
        queue.splice(index, 1);
      }
    }
  }

  function cancel(contentKey: string): void {
    dropQueued(contentKey);
    const jobs = tracked.get(contentKey);
    if (!jobs) {
      return;
    }
    for (const job of jobs) {
      job.cancelled = true;
    }
  }

  function pump(): void {
    while (active < concurrency && queue.length > 0) {
      const job = queue.shift();
      if (!job || job.cancelled) {
        continue;
      }
      if (!job.host.isConnected) {
        continue;
      }
      if (!isVisible(job.host)) {
        continue;
      }
      void run(job);
    }
  }

  async function run(job: QueuedJob): Promise<void> {
    active += 1;
    if (!cache.has(job.contentKey)) {
      job.callbacks.onLoading();
    }
    try {
      const result = await load(job);
      if (!job.cancelled && job.host.isConnected) {
        job.callbacks.onSuccess(result);
      }
    } catch (error) {
      if (!job.cancelled && job.host.isConnected) {
        job.callbacks.onError(error);
      }
    } finally {
      active -= 1;
      pump();
    }
  }

  async function load(job: QueuedJob): Promise<AnalyzeResponse> {
    const cached = cache.get(job.contentKey);
    if (cached) {
      return cached;
    }
    const pending = inflight.get(job.contentKey);
    if (pending) {
      return pending;
    }
    const request = options.analyze(job.content).then((result) => {
      cache.set(job.contentKey, result);
      inflight.delete(job.contentKey);
      return result;
    });
    inflight.set(job.contentKey, request);
    try {
      return await request;
    } catch (error) {
      inflight.delete(job.contentKey);
      throw error;
    }
  }

  function enqueue(job: Omit<QueuedJob, "cancelled">, force = false): void {
    dropQueued(job.contentKey);
    if (!force && !isVisible(job.host)) {
      return;
    }
    const next: QueuedJob = { ...job, cancelled: false };
    track(next);
    queue.push(next);
    pump();
  }

  return {
    peekQueueSize: () => queue.length,
    peekActive: () => active,
    cacheSize: () => cache.size,
    observe(input: {
      host: Element;
      content: NormalizedContent;
      contentKey: string;
      callbacks: AnalyzeSchedulerCallbacks;
      autoAnalyze: boolean;
    }): () => void {
      const job = {
        contentKey: input.contentKey,
        content: input.content,
        host: input.host,
        callbacks: input.callbacks,
      };
      if (input.autoAnalyze) {
        enqueue(job);
      }
      return () => {
        cancel(input.contentKey);
      };
    },
    scheduleVisible(input: {
      host: Element;
      content: NormalizedContent;
      contentKey: string;
      callbacks: AnalyzeSchedulerCallbacks;
    }): void {
      enqueue(input);
    },
    request(input: {
      host: Element;
      content: NormalizedContent;
      contentKey: string;
      callbacks: AnalyzeSchedulerCallbacks;
    }): void {
      enqueue(input, true);
    },
  };
}

function defaultIsVisible(host: Element): boolean {
  if (typeof IntersectionObserver === "undefined" || !host.isConnected) {
    return host.isConnected;
  }
  const rect = host.getBoundingClientRect();
  const margin = 320;
  return rect.bottom >= -margin && rect.top <= (globalThis.innerHeight ?? 0) + margin;
}
