import type { ProviderCapability } from "@sloplens/config/browser";
import type { ContentHistoryItem, ContentListQuery, MetricsResponse } from "@sloplens/shared";
import { AtSign, Clapperboard, LayoutDashboard, Menu, Settings } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/motion/input";
import { NumberTicker } from "@/components/motion/number-ticker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/motion/select";
import { useSlopLensI18n } from "@/i18n/context";
import type { Locale } from "@/i18n/messages";
import { useSlopLensTheme } from "@/theme/context";
import type { MotionPreference, ThemePreference } from "@/theme/types";
import { DashboardCard } from "./dashboard-card";
import { HistoryList } from "./history-list";
import { PlatformMark } from "./platform-mark";
import { ProviderSettingsList } from "./provider-settings";
import { scoreToPercent } from "./score-signal";
import type { SettingsFormSubmitPayload } from "./settings-form";
import { formatSeriesRange, SlopSparkline, SlopTimeChart } from "./slop-chart";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";
import type { SettingsFormValues } from "./types";

export type DashboardSection = "overview" | "x" | "youtube" | "settings";

export type DashboardHealth = HealthStatus | "checking";
type HealthStatus = MetricsResponse["status"];

export type DashboardHistory = {
  items: ContentHistoryItem[];
  nextCursor: string | null;
  phase: "loading" | "ready" | "error";
};

const PRIMARY: DashboardSection[] = ["overview", "x", "youtube"];

const ICONS = {
  overview: LayoutDashboard,
  x: AtSign,
  youtube: Clapperboard,
  settings: Settings,
} as const;

export function SlopLensDashboardApp({
  section,
  onSectionChange,
  version,
  health,
  metrics,
  history,
  onHistoryQueryChange,
  onHistoryLoadMore,
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
  history: DashboardHistory;
  onHistoryQueryChange: (query: ContentListQuery) => void;
  onHistoryLoadMore: () => void;
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
  const { preference, setPreference } = useSlopLensTheme();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "slop">("recent");
  const [signal, setSignal] = useState<"all" | "claim" | "highSlop">("all");
  const [filterSection, setFilterSection] = useState(section);
  if (filterSection !== section) {
    setFilterSection(section);
    setSearch("");
    setDebouncedSearch("");
    setSort("recent");
    setSignal("all");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const historyQuery = useMemo(() => {
    if (section === "settings") {
      return null;
    }
    const platform = section === "overview" ? undefined : section;
    return {
      ...(platform ? { platform } : {}),
      ...(section !== "overview" && debouncedSearch ? { q: debouncedSearch } : {}),
      sort: section === "overview" ? "recent" : sort,
      ...(section !== "overview" && signal !== "all" ? { signal } : {}),
      limit: section === "overview" ? 8 : 20,
    } satisfies ContentListQuery;
  }, [section, debouncedSearch, sort, signal]);

  useEffect(() => {
    if (historyQuery) {
      onHistoryQueryChange(historyQuery);
    }
  }, [historyQuery, onHistoryQueryChange]);

  const surfaceStatus = combinedStatus(health, metrics);
  const healthLabel = statusLabel(surfaceStatus, t);
  const healthStatus =
    surfaceStatus === "ok"
      ? "success"
      : surfaceStatus === "checking"
        ? "loading"
        : surfaceStatus === "degraded"
          ? "warning"
          : "danger";
  const browsing = section === "x" || section === "youtube";

  return (
    <AnimatedSidebarProvider className="min-h-svh bg-background" data-sloplens-dashboard="true">
      <AnimatedSidebar collapsible="none" ariaLabel={t("app.name")}>
        <AnimatedSidebarHeader className="px-4 py-5">
          <p className="text-sm font-semibold tracking-tight">{t("app.name")}</p>
          <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
        </AnimatedSidebarHeader>
        <AnimatedSidebarContent>
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {PRIMARY.map((item) => (
                  <NavItem
                    key={item}
                    item={item}
                    active={section === item}
                    label={t(`dashboard.${item}`)}
                    onSelect={() => onSectionChange(item)}
                  />
                ))}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
          <AnimatedSidebarGroup className="mt-auto border-t border-border">
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                <NavItem
                  item="settings"
                  active={section === "settings"}
                  label={t("dashboard.settings")}
                  onSelect={() => onSectionChange("settings")}
                />
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
            <div className="flex items-center gap-2">
              {section === "overview" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  className="rounded-md"
                  onClick={onTestHealth}
                >
                  {t("dashboard.testHealth")}
                </Button>
              ) : null}
              <SlopLensThemeToggleButton />
            </div>
          </header>

          {section === "overview" ? (
            <OverviewSection
              metrics={metrics}
              health={health}
              history={history}
              onLoadMore={onHistoryLoadMore}
            />
          ) : null}
          {browsing ? (
            <PlatformSection
              platform={section}
              search={search}
              onSearch={setSearch}
              sort={sort}
              onSort={setSort}
              signal={signal}
              onSignal={setSignal}
              history={history}
              unavailable={combinedStatus(health, metrics) === "unavailable"}
              onLoadMore={onHistoryLoadMore}
            />
          ) : null}
          {section === "settings" ? (
            <SettingsSection
              locale={locale}
              onLocaleChange={onLocaleChange}
              themePreference={preference}
              onThemePreferenceChange={setPreference}
              motionPreference={motionPreference}
              onMotionPreferenceChange={onMotionPreferenceChange}
              formValues={formValues}
              providerOptions={providerOptions}
              onSubmitCapability={onSubmitCapability}
              settingsLoading={settingsLoading}
              settingsError={settingsError}
            />
          ) : null}
        </div>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  );
}

function NavItem({
  item,
  active,
  label,
  onSelect,
}: {
  item: DashboardSection;
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  const Icon = ICONS[item];
  return (
    <AnimatedSidebarMenuItem>
      <AnimatedSidebarMenuButton
        isActive={active}
        icon={<Icon className="size-4" />}
        onSelect={onSelect}
      >
        {label}
      </AnimatedSidebarMenuButton>
    </AnimatedSidebarMenuItem>
  );
}

function OverviewSection({
  metrics,
  health,
  history,
  onLoadMore,
}: {
  metrics: MetricsResponse | null;
  health: DashboardHealth;
  history: DashboardHistory;
  onLoadMore: () => void;
}) {
  const { t, locale } = useSlopLensI18n();
  const status = combinedStatus(health, metrics);
  const unavailable = status === "unavailable";
  const series = metrics?.slopSeries ?? null;
  const total = shareTotal(metrics);
  const range = formatSeriesRange(series, locale);

  return (
    <div className="space-y-4">
      <DashboardCard>
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <IconWell>
              <LayoutDashboard className="size-4" />
            </IconWell>
            <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.contentsAnalyzed")}</p>
            <div className="mt-1">
              <StatFigure value={metrics?.counts.contentItems ?? null} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {statusLabel(status, t)}
              {" · "}
              {t("dashboard.lastActivity")}:{" "}
              {formatActivity(metrics?.lastActivityAt, t("dashboard.none"))}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.verifications")} {countText(metrics?.counts.claims ?? null, t)}
              {" · "}
              {t("dashboard.relations")} {countText(metrics?.counts.relations ?? null, t)}
            </p>
          </div>
          <SlopSparkline series={series} className="hidden h-16 w-44 shrink-0 sm:block" />
        </div>
      </DashboardCard>
      <div className="grid gap-4 md:grid-cols-2">
        <PlatformStat
          platform="x"
          label={t("dashboard.xAnalyzed")}
          value={metrics?.counts.byPlatform.x ?? null}
          context={platformContext(metrics?.counts.byPlatform.x ?? null, total, series, "x", t)}
        />
        <PlatformStat
          platform="youtube"
          label={t("dashboard.youtubeAnalyzed")}
          value={metrics?.counts.byPlatform.youtube ?? null}
          context={platformContext(
            metrics?.counts.byPlatform.youtube ?? null,
            total,
            series,
            "youtube",
            t,
          )}
        />
      </div>
      <DashboardCard title={t("dashboard.slopOverTime")} description={range ?? undefined}>
        <SlopTimeChart series={series} />
      </DashboardCard>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t("dashboard.recentHistory")}</h2>
        <HistoryList
          items={history.items}
          phase={history.phase}
          unavailable={unavailable}
          nextCursor={history.nextCursor}
          onLoadMore={onLoadMore}
        />
      </section>
    </div>
  );
}

function PlatformStat({
  platform,
  label,
  value,
  context,
}: {
  platform: "x" | "youtube";
  label: string;
  value: number | null;
  context: string | null;
}) {
  return (
    <DashboardCard>
      <IconWell>
        <PlatformMark platform={platform} />
      </IconWell>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <div className="mt-1">
        <StatFigure value={value} />
      </div>
      {context ? <p className="mt-2 text-sm text-muted-foreground">{context}</p> : null}
    </DashboardCard>
  );
}

function PlatformSection({
  platform,
  search,
  onSearch,
  sort,
  onSort,
  signal,
  onSignal,
  history,
  unavailable,
  onLoadMore,
}: {
  platform: "x" | "youtube";
  search: string;
  onSearch: (value: string) => void;
  sort: "recent" | "slop";
  onSort: (value: "recent" | "slop") => void;
  signal: "all" | "claim" | "highSlop";
  onSignal: (value: "all" | "claim" | "highSlop") => void;
  history: DashboardHistory;
  unavailable: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useSlopLensI18n();
  const items = history.items.filter((item) => item.platform === platform);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <Input
          label={t("history.search")}
          value={search}
          onChange={onSearch}
          className="min-w-0 md:flex-1"
          classNames={{ field: "h-10 rounded-lg" }}
        />
        <div className="grid grid-cols-2 gap-3 md:flex md:shrink-0">
          <Select value={sort} onValueChange={(value) => onSort(value as "recent" | "slop")}>
            <SelectTrigger aria-label={t("history.sort.recent")} className="h-10 w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("history.sort.recent")}</SelectItem>
              <SelectItem value="slop">{t("history.sort.slop")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={signal}
            onValueChange={(value) => onSignal(value as "all" | "claim" | "highSlop")}
          >
            <SelectTrigger aria-label={t("history.signal.all")} className="h-10 w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.signal.all")}</SelectItem>
              <SelectItem value="claim">{t("history.signal.claim")}</SelectItem>
              <SelectItem value="highSlop">{t("history.signal.highSlop")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <HistoryList
        items={items}
        phase={history.phase}
        unavailable={unavailable}
        nextCursor={history.nextCursor}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}

function SettingsSection({
  locale,
  onLocaleChange,
  themePreference,
  onThemePreferenceChange,
  motionPreference,
  onMotionPreferenceChange,
  formValues,
  providerOptions,
  onSubmitCapability,
  settingsLoading,
  settingsError,
}: {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  themePreference: ThemePreference;
  onThemePreferenceChange: (next: ThemePreference) => void;
  motionPreference: MotionPreference;
  onMotionPreferenceChange: (next: MotionPreference) => void;
  formValues: SettingsFormValues | null;
  providerOptions: Record<ProviderCapability, { id: string; label: string }[]>;
  onSubmitCapability: (payload: SettingsFormSubmitPayload) => Promise<void> | void;
  settingsLoading: boolean;
  settingsError: string | null;
}) {
  const { t } = useSlopLensI18n();
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("settings.appearance")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <DashboardCard title={t("dashboard.theme")} className="p-4">
            <Select
              value={themePreference}
              onValueChange={(value) => onThemePreferenceChange(value as ThemePreference)}
            >
              <SelectTrigger aria-label={t("dashboard.theme")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("theme.light")}</SelectItem>
                <SelectItem value="dark">{t("theme.dark")}</SelectItem>
                <SelectItem value="system">{t("theme.system")}</SelectItem>
              </SelectContent>
            </Select>
          </DashboardCard>
          <DashboardCard title={t("dashboard.language")} className="p-4">
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
          <DashboardCard title={t("motion.label")} className="p-4">
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
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("settings.providers")}</h2>
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground">{t("settings.loading")}</p>
        ) : null}
        {settingsError || (!settingsLoading && !formValues) ? (
          <p role="alert" className="text-sm text-destructive">
            {t("settings.loadError")}
          </p>
        ) : null}
        {formValues ? (
          <ProviderSettingsList
            formValues={formValues}
            providerOptions={providerOptions}
            onSubmitCapability={onSubmitCapability}
          />
        ) : null}
      </section>
    </div>
  );
}

function IconWell({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-9 place-items-center rounded-lg border border-border bg-muted/50 text-foreground">
      {children}
    </span>
  );
}

function StatFigure({ value }: { value: number | null }) {
  const { t } = useSlopLensI18n();
  if (value == null) {
    return (
      <p className="text-4xl font-semibold tracking-tight text-muted-foreground">
        {t("dashboard.unavailable")}
      </p>
    );
  }
  return (
    <NumberTicker
      value={value}
      startOnView={false}
      className="text-4xl font-semibold tracking-tight"
    />
  );
}

function countText(value: number | null, t: (key: "dashboard.unavailable") => string): string {
  return value == null ? t("dashboard.unavailable") : String(value);
}

function shareTotal(metrics: MetricsResponse | null): number | null {
  if (metrics?.counts.contentItems != null) return metrics.counts.contentItems;
  const x = metrics?.counts.byPlatform.x;
  const youtube = metrics?.counts.byPlatform.youtube;
  if (x == null || youtube == null) return null;
  return x + youtube;
}

function platformContext(
  count: number | null,
  total: number | null,
  series: MetricsResponse["slopSeries"],
  platform: "x" | "youtube",
  t: (
    key: "dashboard.shareOfTotal" | "dashboard.averageSlop",
    vars?: Record<string, string | number>,
  ) => string,
): string | null {
  const parts: string[] = [];
  if (count != null && total != null && total > 0) {
    parts.push(t("dashboard.shareOfTotal", { count, total }));
  }
  const average = meanPlatformSlop(series, platform);
  if (average != null) {
    parts.push(`${t("dashboard.averageSlop")} ${scoreToPercent(average)}%`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function meanPlatformSlop(
  series: MetricsResponse["slopSeries"],
  platform: "x" | "youtube",
): number | null {
  const values = (series ?? [])
    .map((point) => point[platform])
    .filter((value): value is number => value != null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function combinedStatus(
  health: DashboardHealth,
  metrics: MetricsResponse | null,
): DashboardHealth | MetricsResponse["status"] {
  if (health === "checking") {
    return "checking";
  }
  if (health === "unavailable") {
    return "unavailable";
  }
  if (
    metrics?.status === "unavailable" ||
    metrics?.status === "degraded" ||
    health === "degraded"
  ) {
    return "degraded";
  }
  return "ok";
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
