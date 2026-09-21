import { X } from "lucide-react";
import { Citations } from "@/components/agents/citations";
import { Button } from "@/components/motion/button/base";
import { Drawer } from "@/components/motion/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { useSlopLensI18n } from "@/i18n/context";
import { safeExternalHttpUrl } from "@/lib/safe-http-url";
import { cn } from "@/lib/utils";
import { FeatureStatePanel } from "./feature-state";
import { ScorePercentSignal, type ScoreSignalTone, ScoreTextSignal } from "./score-signal";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";
import type {
  AnalyzePanelContent,
  FeatureViewState,
  RelatedItem,
  SlopLensPanelTab,
  TracePanelContent,
  VerifyPanelContent,
} from "./types";

export function SlopLensDetailPanel({
  open,
  onOpenChange,
  asDrawer,
  activeTab,
  onTabChange,
  analyzeState,
  verifyState,
  traceState,
  analyze,
  verify,
  trace,
  onRetryAnalyze,
  onRetryVerify,
  onRetryTrace,
  onOpenSettings,
  className,
  embedded = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asDrawer: boolean;
  activeTab: SlopLensPanelTab;
  onTabChange?: (tab: SlopLensPanelTab) => void;
  analyzeState: FeatureViewState;
  verifyState: FeatureViewState;
  traceState: FeatureViewState;
  analyze?: AnalyzePanelContent;
  verify?: VerifyPanelContent;
  trace?: TracePanelContent;
  onRetryAnalyze?: () => void;
  onRetryVerify?: () => void;
  onRetryTrace?: () => void;
  onOpenSettings?: () => void;
  className?: string;
  embedded?: boolean;
}) {
  const { t } = useSlopLensI18n();
  const body = (
    <PanelBody
      tab={activeTab}
      onTabChange={(next) => onTabChange?.(next)}
      analyzeState={analyzeState}
      verifyState={verifyState}
      traceState={traceState}
      analyze={analyze}
      verify={verify}
      trace={trace}
      onRetryAnalyze={onRetryAnalyze}
      onRetryVerify={onRetryVerify}
      onRetryTrace={onRetryTrace}
      onOpenSettings={onOpenSettings}
      onClose={() => onOpenChange(false)}
    />
  );

  if (asDrawer) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        side="right"
        ariaLabel={t("app.name")}
        closeAriaLabel={t("overlay.close")}
        lightBackdrop
        lockBodyScroll={false}
        className={cn("w-[min(24rem,85vw)] overflow-hidden", className)}
      >
        {body}
      </Drawer>
    );
  }

  if (!open) return null;

  if (embedded) {
    return <div className={cn("overflow-x-hidden", className)}>{body}</div>;
  }

  return (
    <div
      className={cn(
        "w-[min(100%,24rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl",
        className,
      )}
      role="dialog"
      aria-modal="false"
      aria-label={t("app.name")}
      data-sloplens-panel="true"
    >
      {body}
    </div>
  );
}

function PanelBody({
  tab,
  onTabChange,
  analyzeState,
  verifyState,
  traceState,
  analyze,
  verify,
  trace,
  onRetryAnalyze,
  onRetryVerify,
  onRetryTrace,
  onOpenSettings,
  onClose,
}: {
  tab: SlopLensPanelTab;
  onTabChange: (tab: SlopLensPanelTab) => void;
  analyzeState: FeatureViewState;
  verifyState: FeatureViewState;
  traceState: FeatureViewState;
  analyze?: AnalyzePanelContent;
  verify?: VerifyPanelContent;
  trace?: TracePanelContent;
  onRetryAnalyze?: () => void;
  onRetryVerify?: () => void;
  onRetryTrace?: () => void;
  onOpenSettings?: () => void;
  onClose: () => void;
}) {
  const { t } = useSlopLensI18n();
  const decision = analyze?.decision;
  const sources = verify?.sources ?? [];

  return (
    <div className="flex flex-col overflow-x-hidden p-4" data-sloplens-panel="true">
      <header className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("app.name")}</h2>
        <div className="flex items-center gap-1">
          <SlopLensThemeToggleButton />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={t("overlay.close")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as SlopLensPanelTab)}
        variant="segment"
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="w-full">
          <TabsTrigger value="analyze">{t("tab.analyze")}</TabsTrigger>
          <TabsTrigger value="verify">{t("tab.verify")}</TabsTrigger>
          <TabsTrigger value="trace">{t("tab.trace")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="mt-3 overflow-x-hidden">
          {analyzeState.phase === "success" && analyze?.summary ? (
            <p className="mb-3 text-sm leading-relaxed text-foreground">{analyze.summary}</p>
          ) : null}
          {analyzeState.phase === "success" && decision ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">{t("signal.scoreHint")}</p>
              <ScorePercentSignal label={t("signal.aiSlop")} score={decision.aiSlop} />
              <ScorePercentSignal label={t("signal.clickbait")} score={decision.clickbait} />
              <ScorePercentSignal
                label={t("signal.engagementBait")}
                score={decision.engagementBait}
              />
              <ScorePercentSignal label={t("signal.spam")} score={decision.spam} />
              <ScoreTextSignal
                label={t("signal.claim")}
                value={decision.containsClaim ? t("signal.claim.detected") : t("signal.claim.none")}
                tone={decision.containsClaim ? "info" : "neutral"}
              />
            </div>
          ) : analyzeState.phase !== "success" ? (
            <FeatureStatePanel
              state={analyzeState}
              emptyMessage={t("empty.analyze")}
              loadingLabel={t("loading.analyzing")}
              onRetry={onRetryAnalyze}
              onOpenSettings={onOpenSettings}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="verify" className="mt-3 overflow-x-hidden">
          {verifyState.phase === "success" ? (
            <div className="space-y-3">
              {verify?.stance ? (
                <ScoreTextSignal
                  label={t("signal.evidence")}
                  value={t(`signal.stance.${verify.stance}`)}
                  tone={stanceTone(verify.stance)}
                />
              ) : null}
              {verify?.claim ? (
                <p className="text-xs text-muted-foreground">{verify.claim}</p>
              ) : null}
              {verify?.summary ? <p className="text-sm leading-relaxed">{verify.summary}</p> : null}
              {verify?.uncertainty ? (
                <p className="text-xs text-muted-foreground">{verify.uncertainty}</p>
              ) : null}
              {sources.length > 0 ? (
                <Citations
                  title={t("tab.sources")}
                  citations={sources.map((source) => ({
                    id: source.id,
                    title: source.title,
                    url: source.url,
                    domain: hostnameOf(source.url),
                  }))}
                  defaultOpen
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t("empty.sources")}</p>
              )}
            </div>
          ) : (
            <FeatureStatePanel
              state={verifyState}
              emptyMessage={t("empty.verify")}
              emptyIdleMessage={t("empty.verify")}
              emptyResultMessage={t("empty.verify.insufficient")}
              loadingLabel={t("loading.verifying")}
              onRetry={onRetryVerify}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="trace" className="mt-3 overflow-x-hidden">
          {traceState.phase === "success" ? (
            <TraceSections trace={trace} />
          ) : (
            <FeatureStatePanel
              state={traceState}
              emptyMessage={t("empty.trace")}
              emptyIdleMessage={t("empty.trace")}
              emptyResultMessage={t("empty.trace.insufficient")}
              loadingLabel={t("loading.tracing")}
              onRetry={onRetryTrace}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TraceSections({ trace }: { trace?: TracePanelContent }) {
  const { t } = useSlopLensI18n();
  const origin = trace?.possibleOrigin;
  const originHref = safeExternalHttpUrl(origin?.url);

  return (
    <div className="space-y-3" data-sloplens-trace="stack">
      <section className="rounded-lg border border-border bg-muted/40 p-3">
        <h3 className="text-xs font-medium text-muted-foreground">{t("trace.possibleOrigin")}</h3>
        {origin ? (
          <div className="mt-2 space-y-1.5 text-sm text-foreground">
            {originHref ? (
              <a
                href={originHref}
                className="break-words font-medium text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {origin.title ?? origin.url}
              </a>
            ) : (
              <p className="font-medium">{origin.title ?? origin.url}</p>
            )}
            {origin.publishedAt ? (
              <p className="text-xs text-muted-foreground">{origin.publishedAt}</p>
            ) : null}
            <p className="leading-relaxed">{origin.whyThisMayBeTheOrigin}</p>
            <p className="text-xs text-muted-foreground">
              {t(`trace.confidence.${origin.confidence}`)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("trace.noOrigin")}</p>
        )}
      </section>

      <section className="space-y-1.5">
        <h3 className="text-xs font-medium text-muted-foreground">{t("trace.evidence")}</h3>
        {trace?.evidence && trace.evidence.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {trace.evidence.map((item) => (
              <li key={`${item.sourceUrl ?? item.summary}`} className="leading-relaxed">
                {item.summary}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("empty.sources")}</p>
        )}
      </section>

      <section className="space-y-1.5">
        <h3 className="text-xs font-medium text-muted-foreground">{t("tab.related")}</h3>
        <RelatedList items={trace?.related ?? []} empty={t("empty.related")} />
      </section>

      {trace?.derivatives && trace.derivatives.length > 0 ? (
        <section className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">{t("trace.derivatives")}</h3>
          <RelatedList items={trace.derivatives} empty={t("trace.noDerivatives")} />
        </section>
      ) : null}

      {trace?.uncertainty ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{trace.uncertainty}</p>
      ) : null}
    </div>
  );
}

function RelatedList({ items, empty }: { items: RelatedItem[]; empty: string }) {
  if (items.length === 0) {
    return <p>{empty}</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => {
        const href = safeExternalHttpUrl(item.url);
        return (
          <li key={item.id} className="overflow-hidden rounded-md border border-border p-2">
            {href ? (
              <a
                href={href}
                className="break-words font-medium text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
            ) : (
              <span className="font-medium">{item.title}</span>
            )}
            {item.platform ? (
              <p className="text-xs text-muted-foreground">{item.platform}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function stanceTone(stance: NonNullable<VerifyPanelContent["stance"]>): ScoreSignalTone {
  switch (stance) {
    case "supported":
      return "positive";
    case "contradicted":
      return "negative";
    case "mixed":
      return "warning";
    case "unverified":
    case "unknown":
      return "unknown";
  }
}
