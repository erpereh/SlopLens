import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { OverlayHostRegistry } from "./overlay-registry";

describe("OverlayHostRegistry", () => {
  it("deduplicates overlay hosts with a WeakMap", () => {
    const window = new Window();
    const host = window.document.createElement("article") as unknown as HTMLElement;
    const registry = new OverlayHostRegistry();

    expect(registry.has(host)).toBe(false);
    registry.register(host, "key-1");
    expect(registry.has(host)).toBe(true);
    expect(registry.get(host)?.contentKey).toBe("key-1");

    registry.forget(host);
    expect(registry.has(host)).toBe(false);
  });
});
