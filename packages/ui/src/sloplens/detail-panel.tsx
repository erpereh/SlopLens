import { useState } from "react";
import { Citations } from "@/components/agents/citations";
import { Button } from "@/components/motion/button/base";
import { Drawer } from "@/components/motion/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { useSlopLensI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import { FeatureStatePanel } from "./feature-state";
import { ScorePercentSignal } from "./score-signal";
import { SlopLensThemeToggleButton } from "./theme-toggle-button";
import type {
  AnalyzePanelContent,
  FeatureViewState,
  RelatedItem,
  SlopLensPanelTab,
  SourceItem,
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
  sourcesState,
  relatedState,
  analyze,
  verify,
  trace,
  sources,
  related,
  onRetryAnalyze,
  onRetryVerify,
  onRetryTrace,
  onOpenSettings,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asDrawer: boolean;
  activeTab: SlopLensPanelTab;
  onTabChange?: (tab: SlopLensPanelTab) => void;
  analyzeState: FeatureViewState;
  verifyState: FeatureViewState;
  traceState: FeatureViewState;
  sourcesState: FeatureViewState;
  relatedState: FeatureViewState;
  analyze?: AnalyzePanelContent;
  verify?: VerifyPanelContent;
  trace?: TracePanelContent;
  sources?: SourceItem[];
  related?: RelatedItem[];
  onRetryAnalyze?: () => void;
  onRetryVerify?: () => void;
  onRetryTrace?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}) {
  const { t } = useSlopLensI18n();
  const [internalTab, setInternalTab] = useState(activeTab);
  const isControlled = onTabChange !== undefined;
  const currentTab = isControlled ? activeTab : internalTab;
  const setCurrentTab = (next: SlopLensPanelTab) => {
    if (isControlled) {
      onTabChange(next);
    } else {
      setInternalTab(next);
    }
  };

  const body = (
    <PanelBody
      tab={currentTab}
      onTabChange={setCurrentTab}
      analyzeState={analyzeState}
      verifyState={verifyState}
      traceState={traceState}
      sourcesState={sourcesState}
      relatedState={relatedState}
      analyze={analyze}
      verify={verify}
      trace={trace}
      sources={sources}
      related={related}
      onRetryAnalyze={onRetryAnalyze}
      onRetryVerify={onRetryVerify}
      onRetryTrace={onRetryTrace}
      onOpenSettings={onOpenSettings}
      onClose={() => onOpenChange(false)}
    />
  );

  if (asDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} side="right" className={className}>
        {body}
      </Drawer>
    );
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "w-[min(100%,24rem)] rounded-xl border border-border bg-card shadow-xl",
        className,
      )}
      role="dialog"
      aria-modal="true"
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
  sourcesState,
  relatedState,
  analyze,
  verify,
  trace,
  sources,
  related,
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
  sourcesState: FeatureViewState;
  relatedState: FeatureViewState;
  analyze?: AnalyzePanelContent;
  verify?: VerifyPanelContent;
  trace?: TracePanelContent;
  sources?: SourceItem[];
  related?: RelatedItem[];
  onRetryAnalyze?: () => void;
  onRetryVerify?: () => void;
  onRetryTrace?: () => void;
  onOpenSettings?: () => void;
  onClose: () => void;
}) {
  const { t } = useSlopLensI18n();

  return (
    <div className="flex h-full max-h-[min(80vh,32rem)] flex-col p-4">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("app.name")}</h2>
        <div className="flex items-center gap-1">
          <SlopLensThemeToggleButton />
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            {t("overlay.close")}
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as SlopLensPanelTab)} variant="segment">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="analyze">{t("tab.analyze")}</TabsTrigger>
          <TabsTrigger value="verify">{t("tab.verify")}</TabsTrigger>
          <TabsTrigger value="trace">{t("tab.trace")}</TabsTrigger>
          <TabsTrigger value="sources">{t("tab.sources")}</TabsTrigger>
          <TabsTrigger value="related">{t("tab.related")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="mt-3 flex-1 overflow-y-auto">
          {analyzeState.phase === "success" && analyze?.decision ? (
            <div className="mb-3 space-y-1.5">
              <ScorePercentSignal label={t("signal.aiSlop")} score={analyze.decision.aiSlop} />
              <ScorePercentSignal
                label={t("signal.clickbait")}
                score={analyze.decision.clickbait}
              />
              <ScorePercentSignal
                label={t("signal.engagementBait")}
                score={analyze.decision.engagementBait}
              />
            </div>
          ) : null}
          {analyzeState.phase === "success" && analyze?.summary ? (
            <p className="text-sm leading-relaxed text-foreground">{analyze.summary}</p>
          ) : (
            <FeatureStatePanel
              state={analyzeState}
              emptyMessage={t("empty.analyze")}
              loadingLabel={t("loading.analyzing")}
              onRetry={onRetryAnalyze}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="verify" className="mt-3 flex-1 overflow-y-auto">
          {verifyState.phase === "success" && verify?.summary ? (
            <p className="text-sm leading-relaxed">{verify.summary}</p>
          ) : (
            <FeatureStatePanel
              state={verifyState}
              emptyMessage={t("empty.verify")}
              loadingLabel={t("loading.verifying")}
              onRetry={onRetryVerify}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="trace" className="mt-3 flex-1 overflow-y-auto">
          {traceState.phase === "success" && trace?.summary ? (
            <div className="space-y-2 text-sm">
              {trace.originCandidate ? (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{trace.originCandidate}</span>
                </p>
              ) : null}
              <p className="leading-relaxed">{trace.summary}</p>
            </div>
          ) : (
            <FeatureStatePanel
              state={traceState}
              emptyMessage={t("empty.trace")}
              loadingLabel={t("loading.tracing")}
              onRetry={onRetryTrace}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-3 flex-1 overflow-y-auto">
          {sourcesState.phase === "success" && sources && sources.length > 0 ? (
            <Citations
              title={t("tab.sources")}
              citations={sources.map((s) => ({
                id: s.id,
                title: s.title,
                url: s.url,
                domain: s.url,
              }))}
              defaultOpen
            />
          ) : (
            <FeatureStatePanel
              state={sourcesState}
              emptyMessage={t("empty.sources")}
              loadingLabel={t("loading.searchingSources")}
              onOpenSettings={onOpenSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="related" className="mt-3 flex-1 overflow-y-auto">
          {relatedState.phase === "success" && related && related.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {related.map((item) => (
                <li key={item.id} className="rounded-md border border-border p-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
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
              ))}
            </ul>
          ) : (
            <FeatureStatePanel
              state={relatedState}
              emptyMessage={t("empty.related")}
              loadingLabel={t("status.loading")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
