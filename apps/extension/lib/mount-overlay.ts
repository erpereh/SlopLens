import type { NormalizedContent } from "@sloplens/core";
import { getPlatformAdapter } from "@sloplens/platforms";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";

import { ContentOverlay } from "../components/ContentOverlay";
import { hashContentKey } from "./content-key";
import type { Locale } from "./i18n";
import { OverlayHostRegistry } from "./overlay-registry";
import type { ScanTarget } from "./scan-targets";
import type { ResolvedTheme } from "./theme";

export type OverlayUiHandle = {
  remove: () => Promise<void>;
};

type MountedRecord = {
  ui: OverlayUiHandle;
  root: Root;
  contentKey: string;
};

export interface OverlayRuntimeState {
  locale: Locale;
  theme: ResolvedTheme;
  reducedMotion: boolean;
}

export class OverlayMountManager {
  private readonly registry = new OverlayHostRegistry();
  private readonly mounted = new WeakMap<HTMLElement, MountedRecord>();

  constructor(private readonly ctx: ContentScriptContext) {}

  async syncTarget(target: ScanTarget, runtime: OverlayRuntimeState): Promise<void> {
    const content = this.extractContent(target);
    if (!content) {
      return;
    }

    const contentKey = hashContentKey([
      content.platform,
      content.url,
      content.externalId ?? "",
      content.text ?? "",
    ]);

    const existing = this.mounted.get(target.host);
    if (existing?.contentKey === contentKey) {
      return;
    }

    if (existing) {
      await this.unmountHost(target.host);
    }

    const record = await this.mount(target.host, content, contentKey, runtime);
    this.registry.register(target.host, contentKey);
    this.mounted.set(target.host, record);
  }

  async unmountHost(host: HTMLElement): Promise<void> {
    const record = this.mounted.get(host);
    if (record) {
      await record.ui.remove();
      this.mounted.delete(host);
    }
    this.registry.forget(host);
  }

  hasHost(host: HTMLElement): boolean {
    return this.registry.has(host);
  }

  private extractContent(target: ScanTarget): NormalizedContent | null {
    const adapter = getPlatformAdapter(target.platform);
    if (target.platform === "youtube") {
      return adapter.extract(target.host.ownerDocument);
    }
    return adapter.extract(target.host);
  }

  private async mount(
    host: HTMLElement,
    content: NormalizedContent,
    contentKey: string,
    runtime: OverlayRuntimeState,
  ): Promise<MountedRecord> {
    let reactRoot: Root | null = null;

    const ui = await createShadowRootUi(this.ctx, {
      name: "sloplens-root",
      position: "inline",
      anchor: host,
      append: "after",
      onMount: (container) => {
        reactRoot = createRoot(container);
        reactRoot.render(
          React.createElement(ContentOverlay, {
            content,
            locale: runtime.locale,
            theme: runtime.theme,
            reducedMotion: runtime.reducedMotion,
          }),
        );
        return { root: reactRoot };
      },
      onRemove: (mounted) => {
        mounted?.root.unmount();
      },
    });

    await ui.mount();

    if (!reactRoot) {
      throw new Error("SlopLens overlay failed to mount React root");
    }

    return {
      ui: {
        remove: async () => {
          await ui.remove();
        },
      },
      root: reactRoot,
      contentKey,
    };
  }
}
