import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { RangeSlider } from "@/components/motion/range-slider";
import { Switch } from "@/components/motion/switch";
import { useSlopLensI18n } from "@/i18n/context";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";

export type PopupHealth = "checking" | "ok" | "down";

export type PopupFeedControls = {
  autoAnalyze: boolean;
  dimHighSlop: boolean;
  showSlopStamp: boolean;
  slopThreshold: number;
};

export function SlopLensPopupControl({
  health,
  onRefreshHealth,
  feed,
  onFeedChange,
  onOpenDashboard,
}: {
  health: PopupHealth;
  onRefreshHealth: () => void;
  feed: PopupFeedControls;
  onFeedChange: (next: PopupFeedControls) => void;
  onOpenDashboard: () => void;
}) {
  const { t } = useSlopLensI18n();
  const healthStatus = health === "ok" ? "success" : health === "down" ? "danger" : "loading";
  const healthLabel =
    health === "ok"
      ? t("popup.online")
      : health === "down"
        ? t("popup.offline")
        : t("popup.checking");
  const percent = Math.round(feed.slopThreshold * 100);

  return (
    <div className="flex w-80 flex-col gap-3 p-3" data-sloplens-popup="true">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-sm font-semibold">{t("app.name")}</h1>
          <button type="button" onClick={onRefreshHealth} aria-label={t("popup.backend")}>
            <AnimatedBadge status={healthStatus} size="sm" pulse={health === "checking"}>
              {healthLabel}
            </AnimatedBadge>
          </button>
        </div>
        <SlopLensThemeToggleButton />
      </header>

      <div className="space-y-2.5 rounded-lg border border-border bg-card p-3">
        <Switch
          checked={feed.autoAnalyze}
          onCheckedChange={(autoAnalyze) => onFeedChange({ ...feed, autoAnalyze })}
          label={t("popup.autoAnalyze")}
        />
        <Switch
          checked={feed.dimHighSlop}
          onCheckedChange={(dimHighSlop) => onFeedChange({ ...feed, dimHighSlop })}
          label={t("popup.dimHighSlop")}
        />
        <Switch
          checked={feed.showSlopStamp}
          onCheckedChange={(showSlopStamp) => onFeedChange({ ...feed, showSlopStamp })}
          label={t("popup.showStamp")}
        />
        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium">{t("popup.thresholdSummary", { percent })}</p>
          <RangeSlider
            value={feed.slopThreshold}
            min={0.5}
            max={0.95}
            step={0.05}
            aria-label={t("popup.threshold")}
            formatValueText={(value) => `${Math.round(value * 100)}%`}
            onValueChange={(slopThreshold) => onFeedChange({ ...feed, slopThreshold })}
          />
        </div>
      </div>

      <Button type="button" size="sm" className="w-full" onClick={onOpenDashboard}>
        {t("popup.openDashboard")}
      </Button>
    </div>
  );
}
