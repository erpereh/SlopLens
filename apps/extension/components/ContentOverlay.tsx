import type { NormalizedContent } from "@sloplens/core";
import type { Locale } from "../lib/i18n";
import { translate } from "../lib/i18n";
import type { ResolvedTheme } from "../lib/theme";

export interface ContentOverlayProps {
  content: NormalizedContent;
  locale: Locale;
  theme: ResolvedTheme;
  reducedMotion: boolean;
}

export function ContentOverlay({ content, locale, theme, reducedMotion }: ContentOverlayProps) {
  const label = content.title ?? content.author ?? translate(locale, "overlayBadge");
  const hint = translate(locale, "overlayHint");

  return (
    <div
      className="sloplens-overlay"
      data-theme={theme}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-platform={content.platform}
    >
      <div className="sloplens-overlay__badge" aria-label={translate(locale, "overlayBadge")}>
        <span className="sloplens-overlay__dot" />
        <span className="sloplens-overlay__label">{label}</span>
      </div>
      <p className="sloplens-overlay__hint">{hint}</p>
    </div>
  );
}
