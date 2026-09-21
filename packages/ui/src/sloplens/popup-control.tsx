import type { ProviderCapability } from "@sloplens/config/browser";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { RangeSlider } from "@/components/motion/range-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import { Switch } from "@/components/motion/switch";
import { useSlopLensI18n } from "@/i18n/context";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";

export type PopupHealth = "checking" | "ok" | "down";

export type PopupFeedPreferences = {
  autoAnalyze: boolean;
  dimHighSlop: boolean;
  showSlopStamp: boolean;
  slopThreshold: number;
};

export type PopupProviderRow = {
  capability: ProviderCapability;
  configured: boolean;
};

export function SlopLensPopupControl({
  health,
  onRefreshHealth,
  feed,
  onFeedChange,
  locale,
  onLocaleChange,
  providers,
  onManageProviders,
}: {
  health: PopupHealth;
  onRefreshHealth: () => void;
  feed: PopupFeedPreferences;
  onFeedChange: (next: PopupFeedPreferences) => void;
  locale: "en" | "es";
  onLocaleChange: (locale: "en" | "es") => void;
  providers: PopupProviderRow[];
  onManageProviders: () => void;
}) {
  const { t } = useSlopLensI18n();
  const thresholdPercent = Math.round(feed.slopThreshold * 100);
  const healthStatus = health === "ok" ? "success" : health === "down" ? "danger" : "loading";
  const healthLabel =
    health === "ok"
      ? t("popup.online")
      : health === "down"
        ? t("popup.offline")
        : t("popup.checking");

  return (
    <div className="flex w-[22rem] flex-col gap-4 p-4" data-sloplens-popup="true">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold">{t("app.name")}</h1>
          <button type="button" onClick={onRefreshHealth} aria-label={t("popup.backend")}>
            <AnimatedBadge status={healthStatus} size="sm" pulse={health === "checking"}>
              {healthLabel}
            </AnimatedBadge>
          </button>
        </div>
        <SlopLensThemeToggleButton />
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("popup.feed")}
        </h2>
        <Switch
          checked={feed.autoAnalyze}
          onCheckedChange={(checked) => onFeedChange({ ...feed, autoAnalyze: checked })}
          label={t("popup.autoAnalyze")}
        />
        <Switch
          checked={feed.dimHighSlop}
          onCheckedChange={(checked) => onFeedChange({ ...feed, dimHighSlop: checked })}
          label={t("popup.dimHighSlop")}
        />
        <Switch
          checked={feed.showSlopStamp}
          onCheckedChange={(checked) => onFeedChange({ ...feed, showSlopStamp: checked })}
          label={t("popup.showStamp")}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{t("popup.threshold")}</span>
            <span className="tabular-nums text-muted-foreground">{thresholdPercent}%</span>
          </div>
          <RangeSlider
            min={50}
            max={95}
            step={5}
            value={thresholdPercent}
            onValueChange={(value) => onFeedChange({ ...feed, slopThreshold: value / 100 })}
            aria-label={t("popup.threshold")}
            formatValueText={(value) => `${value}%`}
            showTicks
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("popup.appearance")}
        </h2>
        <div className="space-y-1">
          <p className="text-sm">{t("popup.language")}</p>
          <Select value={locale} onValueChange={(value) => onLocaleChange(value as "en" | "es")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("popup.langEn")}</SelectItem>
              <SelectItem value="es">{t("popup.langEs")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("popup.providers")}
        </h2>
        <ul className="space-y-1.5 text-sm">
          {providers.map((row) => (
            <li key={row.capability} className="flex items-center justify-between gap-2 capitalize">
              <span>{row.capability}</span>
              <AnimatedBadge
                status={row.configured ? "success" : "neutral"}
                size="sm"
                showIcon={false}
              >
                {row.configured ? t("popup.configured") : t("popup.notConfigured")}
              </AnimatedBadge>
            </li>
          ))}
        </ul>
        <Button type="button" className="w-full" onClick={onManageProviders}>
          {t("popup.manageProviders")}
        </Button>
      </section>
    </div>
  );
}
