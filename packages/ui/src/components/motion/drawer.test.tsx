import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Drawer } from "./drawer";

describe("Drawer host scroll lock", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    cleanup();
  });

  it("does not lock the document body when lockBodyScroll is false", () => {
    document.body.style.overflow = "auto";
    render(
      <Drawer open onOpenChange={() => undefined} lockBodyScroll={false}>
        Overlay
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("auto");
  });

  it("locks document body scroll by default", () => {
    document.body.style.overflow = "auto";
    render(
      <Drawer open onOpenChange={() => undefined}>
        App drawer
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });
});
