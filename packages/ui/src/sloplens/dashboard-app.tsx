import type { ProviderCapability } from "@sloplens/config/browser";
import type { HealthResponse, MetricsResponse } from "@sloplens/shared";
import { Activity, LayoutDashboard, Menu, Palette, Rss, Server } from "lucide-react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
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
import { Tooltip } from "@/components/motion/tooltip";
import { useSlopLensI18n } from "@/i18n/context";
import type { Locale } from "@/i18n/messages";
import { useSlopLensTheme } from "@/theme/context";
import type { MotionPreference, ThemePreference } from "@/theme/types";
import { DashboardCard } from "./dashboard-card";
import { type SettingsFormSubmitPayload, SlopLensSettingsForm } from "./settings-form";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";
import type { SettingsFormValues } from "./types";

export type DashboardSection = "overview" | "feed" | "providers" | "appearance" | "diagnostics";

export type DashboardFeedPreferences = {
  autoAnalyze: boolean;
  dimHighSlop: boolean;
  showSlopStamp: boolean;
  slopThreshold: number;
};

export type DashboardHealth = HealthResponse["status"] | "checking";

const SECTIONS: DashboardSection[] = ["overview", "feed", "providers", "appearance", "diagnostics"];

const ICONS: Record<DashboardSection, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  feed: Rss,
  providers: Server,
  appearance: Palette,
  diagnostics: Activity,
};

export function SlopLensDashboardApp({
  section,
  onSectionChange,
  version,
  health,
  metrics,
  feed,
  onFeedChange,
  locale,
  onLocaleChange,
  motionPreference,
  onMotionPreferenceChange,
  formValues,
  providerOptions,
  onSubmitCapability,
  settingsLoading,
  settingsError,
  onTestHealth,
}: {
  section: DashboardSection;
  onSectionChange: (next: DashboardSection) => void;
  version: string;
  health: DashboardHealth;
  metrics: MetricsResponse | null;
  feed: DashboardFeedPreferences;
  onFeedChange: (next: DashboardFeedPreferences) => void;
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  motionPreference: MotionPreference;
  onMotionPreferenceChange: (next: MotionPreference) => void;
  formValues: SettingsFormValues | null;
  providerOptions: Record<ProviderCapability, { id: string; label: string }[]>;
  onSubmitCapability: (payload: SettingsFormSubmitPayload) => Promise<void> | void;
  settingsLoading: boolean;
  settingsError: string | null;
  onTestHealth: () => void;
}) {
  const { t } = useSlopLensI18n();
  const { preference } = useSlopLensTheme();
  const healthLabel =
    health === "ok"
      ? t("popup.online")
      : health === "degraded"
        ? t("dashboard.degraded")
        : health === "checking"
          ? t("popup.checking")
          : t("popup.offline");
  const healthStatus = health === "ok" ? "success" : health === "checking" ? "loading" : "danger";

  return (
    <AnimatedSidebarProvider className="min-h-svh bg-background" data-sloplens-dashboard="true">
      <AnimatedSidebar collapsible="none" ariaLabel={t("app.name")}>
        <AnimatedSidebarHeader className="px-4 py-5">
          <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent>
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {SECTIONS.map((item) => {
                  const Icon = ICONS[item];
                  return (
                    <AnimatedSidebarMenuItem key={item}>
                      <AnimatedSidebarMenuButton
                        isActive={section === item}
                        icon={<Icon className="size-4" />}
                        onSelect={() => onSectionChange(item)}
                      >
                        {t(`dashboard.${item}`)}
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  );
                })}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>
        <AnimatedSidebarFooter className="gap-2 px-4 py-4">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.version")} {version}
          </p>
          <AnimatedBadge status={healthStatus} size="sm" pulse={health === "checking"}>
            {healthLabel}
          </AnimatedBadge>
        </AnimatedSidebarFooter>
      </AnimatedSidebar>

      <AnimatedSidebarInset>
        <div className="flex min-h-svh flex-col px-6 py-6 xl:px-10 xl:py-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AnimatedSidebarTrigger className="xl:hidden" aria-label={t("dashboard.openMenu")}>
                <Menu className="size-4" />
              </AnimatedSidebarTrigger>
              <h1 className="text-2xl font-semibold tracking-tight">{t(`dashboard.${section}`)}</h1>
            </div>
            {section === "diagnostics" ? (
              <Button type="button" size="sm" onClick={onTestHealth}>
                {t("dashboard.testHealth")}
              </Button>
            ) : (
              <SlopLensThemeToggleButton />
            )}
          </header>

          {section === "overview" ? <OverviewSection metrics={metrics} health={health} /> : null}
          {section === "feed" ? <FeedSection feed={feed} onFeedChange={onFeedChange} /> : null}
          {section === "providers" ? (
            <ProvidersSection
              formValues={formValues}
              providerOptions={providerOptions}
              onSubmitCapability={onSubmitCapability}
              settingsLoading={settingsLoading}
              settingsError={settingsError}
            />
          ) : null}
          {section === "appearance" ? (
            <AppearanceSection
              locale={locale}
              onLocaleChange={onLocaleChange}
              themePreference={preference}
              motionPreference={motionPreference}
              onMotionPreferenceChange={onMotionPreferenceChange}
            />
          ) : null}
          {section === "diagnostics" ? (
            <DiagnosticsSection health={health} metrics={metrics} version={version} />
          ) : null}
        </div>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  );
}

function OverviewSection({
  metrics,
  health,
}: {
  metrics: MetricsResponse | null;
  health: DashboardHealth;
}) {
  const { t } = useSlopLensI18n();
  const status = metrics?.status ?? (health === "checking" ? "checking" : health);
  const lastActivity = formatActivity(metrics?.lastActivityAt, t("dashboard.none"));

  return (
    <div className="space-y-6">
      <DashboardCard title={t("dashboard.backendStatus")} className="min-h-40">
        <p className="text-3xl font-semibold tracking-tight">{statusLabel(status, t)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.lastActivity")}: {lastActivity}
        </p>
      </DashboardCard>
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard
          title={t("dashboard.contentsAnalyzed")}
          value={metrics?.counts.contentItems ?? null}
        />
        <MetricCard
          title={t("dashboard.cachedAnalyses")}
          value={metrics?.counts.cachedAnalyses ?? null}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <MetricCard title={t("dashboard.clusters")} value={metrics?.counts.clusters ?? null} />
        <MetricCard title={t("dashboard.relations")} value={metrics?.counts.relations ?? null} />
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number | null }) {
  const { t } = useSlopLensI18n();
  return (
    <DashboardCard title={title}>
      {value == null ? (
        <p className="text-3xl font-semibold text-muted-foreground">{t("dashboard.unavailable")}</p>
      ) : (
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
    </DashboardCard>
  );
}

function FeedSection({
  feed,
  onFeedChange,
}: {
  feed: DashboardFeedPreferences;
  onFeedChange: (next: DashboardFeedPreferences) => void;
}) {
  const { t } = useSlopLensI18n();
  return (
    <div className="max-w-xl space-y-4">
      <DashboardCard>
        <div className="space-y-4">
          <Tooltip content={t("popup.autoAnalyze")} side="top">
            <Switch
              checked={feed.autoAnalyze}
              onCheckedChange={(autoAnalyze) => onFeedChange({ ...feed, autoAnalyze })}
              label={t("popup.autoAnalyze")}
            />
          </Tooltip>
          <Tooltip content={t("popup.dimHighSlop")} side="top">
            <Switch
              checked={feed.dimHighSlop}
              onCheckedChange={(dimHighSlop) => onFeedChange({ ...feed, dimHighSlop })}
              label={t("popup.dimHighSlop")}
            />
          </Tooltip>
          <Tooltip content={t("popup.showStamp")} side="top">
            <Switch
              checked={feed.showSlopStamp}
              onCheckedChange={(showSlopStamp) => onFeedChange({ ...feed, showSlopStamp })}
              label={t("popup.showStamp")}
            />
          </Tooltip>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("popup.thresholdSummary", { percent: Math.round(feed.slopThreshold * 100) })}
            </p>
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
      </DashboardCard>
    </div>
  );
}

function ProvidersSection({
  formValues,
  providerOptions,
  onSubmitCapability,
  settingsLoading,
  settingsError,
}: {
  formValues: SettingsFormValues | null;
  providerOptions: Record<ProviderCapability, { id: string; label: string }[]>;
  onSubmitCapability: (payload: SettingsFormSubmitPayload) => Promise<void> | void;
  settingsLoading: boolean;
  settingsError: string | null;
}) {
  const { t } = useSlopLensI18n();
  if (settingsLoading) {
    return <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>;
  }
  if (settingsError || !formValues) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("settings.loadError")}
      </p>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {formValues.capabilities.map((entry) => (
        <DashboardCard
          key={entry.capability}
          title={entry.capability}
          action={
            <span className="text-xs text-muted-foreground">
              {entry.hasStoredKey ? t("popup.configured") : t("popup.notConfigured")}
            </span>
          }
        >
          <SlopLensSettingsForm
            key={`${entry.capability}:${entry.selection.providerId}:${entry.hasStoredKey ? "1" : "0"}`}
            initialValues={{ capabilities: [entry] }}
            providerOptions={providerOptions}
            onSubmitCapability={onSubmitCapability}
            lockedCapability={entry.capability}
            hideTitle
          />
        </DashboardCard>
      ))}
    </div>
  );
}

function AppearanceSection({
  locale,
  onLocaleChange,
  themePreference,
  motionPreference,
  onMotionPreferenceChange,
}: {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  themePreference: ThemePreference;
  motionPreference: MotionPreference;
  onMotionPreferenceChange: (next: MotionPreference) => void;
}) {
  const { t } = useSlopLensI18n();
  return (
    <div className="max-w-xl space-y-4">
      <DashboardCard title={t("dashboard.theme")}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t(`theme.${themePreference}`)}</p>
          <SlopLensThemeToggleButton />
        </div>
      </DashboardCard>
      <DashboardCard title={t("dashboard.language")}>
        <Select value={locale} onValueChange={(value) => onLocaleChange(value as Locale)}>
          <SelectTrigger aria-label={t("popup.language")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("popup.langEn")}</SelectItem>
            <SelectItem value="es">{t("popup.langEs")}</SelectItem>
          </SelectContent>
        </Select>
      </DashboardCard>
      <DashboardCard title={t("motion.label")}>
        <Select
          value={motionPreference}
          onValueChange={(value) => onMotionPreferenceChange(value as MotionPreference)}
        >
          <SelectTrigger aria-label={t("motion.label")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{t("motion.system")}</SelectItem>
            <SelectItem value="reduce">{t("motion.reduce")}</SelectItem>
          </SelectContent>
        </Select>
      </DashboardCard>
    </div>
  );
}

function DiagnosticsSection({
  health,
  metrics,
  version,
}: {
  health: DashboardHealth;
  metrics: MetricsResponse | null;
  version: string;
}) {
  const { t } = useSlopLensI18n();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DashboardCard title={t("dashboard.backendStatus")}>
        <p className="text-2xl font-semibold">{statusLabel(health, t)}</p>
      </DashboardCard>
      <DashboardCard title={t("dashboard.database")}>
        <p className="text-2xl font-semibold">
          {metrics?.checks.database ? t("popup.online") : t("dashboard.unavailable")}
        </p>
      </DashboardCard>
      <DashboardCard title={t("dashboard.pgvector")}>
        <p className="text-2xl font-semibold">
          {metrics?.checks.pgvector ? t("popup.online") : t("dashboard.unavailable")}
        </p>
      </DashboardCard>
      <DashboardCard title={t("dashboard.version")}>
        <p className="text-2xl font-semibold">{version}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.noPaidPings")}</p>
      </DashboardCard>
    </div>
  );
}

function statusLabel(
  status: DashboardHealth | MetricsResponse["status"],
  t: (key: "popup.online" | "popup.offline" | "popup.checking" | "dashboard.degraded") => string,
): string {
  if (status === "ok") return t("popup.online");
  if (status === "degraded") return t("dashboard.degraded");
  if (status === "checking") return t("popup.checking");
  return t("popup.offline");
}

function formatActivity(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString();
}
