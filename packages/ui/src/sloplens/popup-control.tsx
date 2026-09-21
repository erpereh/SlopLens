import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button/base";
import { Switch } from "@/components/motion/switch";
import { useSlopLensI18n } from "@/i18n/context";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";

export type PopupHealth = "checking" | "ok" | "down";

export function SlopLensPopupControl({
  health,
  onRefreshHealth,
  autoAnalyze,
  onAutoAnalyzeChange,
  thresholdPercent,
  onOpenDashboard,
}: {
  health: PopupHealth;
  onRefreshHealth: () => void;
  autoAnalyze: boolean;
  onAutoAnalyzeChange: (next: boolean) => void;
  thresholdPercent: number;
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

  return (
    <div className="flex w-[18rem] flex-col gap-3 p-3" data-sloplens-popup="true">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{t("app.name")}</h1>
          <button type="button" onClick={onRefreshHealth} aria-label={t("popup.backend")}>
            <AnimatedBadge status={healthStatus} size="sm" pulse={health === "checking"}>
              {healthLabel}
            </AnimatedBadge>
          </button>
        </div>
        <SlopLensThemeToggleButton />
      </header>

      <Switch
        checked={autoAnalyze}
        onCheckedChange={onAutoAnalyzeChange}
        label={t("popup.autoAnalyze")}
      />

      <p className="text-xs text-muted-foreground">
        {t("popup.thresholdSummary", { percent: thresholdPercent })}
      </p>

      <Button type="button" size="sm" className="w-full" onClick={onOpenDashboard}>
        {t("popup.openDashboard")}
      </Button>
    </div>
  );
}
