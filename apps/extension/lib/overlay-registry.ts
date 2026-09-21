export type OverlayHostRecord = {
  contentKey: string;
};

export class OverlayHostRegistry {
  private readonly hosts = new WeakMap<HTMLElement, OverlayHostRecord>();

  has(host: HTMLElement): boolean {
    return this.hosts.has(host);
  }

  get(host: HTMLElement): OverlayHostRecord | undefined {
    return this.hosts.get(host);
  }

  register(host: HTMLElement, contentKey: string): OverlayHostRecord {
    const record = { contentKey };
    this.hosts.set(host, record);
    return record;
  }

  forget(host: HTMLElement): void {
    this.hosts.delete(host);
  }
}
