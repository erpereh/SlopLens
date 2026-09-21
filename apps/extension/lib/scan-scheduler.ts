export function createScanScheduler(scan: () => Promise<void>): () => void {
  let running = false;
  let queued = false;

  const run = async () => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      do {
        queued = false;
        await scan();
      } while (queued);
    } finally {
      running = false;
    }
  };

  return () => {
    void run();
  };
}
