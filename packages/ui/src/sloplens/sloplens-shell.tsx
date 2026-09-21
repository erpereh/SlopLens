import { useState } from "react";
import { SlopLensCompactSurface } from "./compact-surface";
import { SlopLensDetailPanel } from "./detail-panel";
import type {
  AnalyzePanelContent,
  CompactSignals,
  FeatureViewState,
  RelatedItem,
  SlopLensPanelTab,
  SourceItem,
  TracePanelContent,
  VerifyPanelContent,
} from "./types";
import { useNarrowLayout } from "./use-narrow-layout";

export type SlopLensShellProps = {
  signals: CompactSignals;
  detailOpen?: boolean;
  onDetailOpenChange?: (open: boolean) => void;
  activeTab?: SlopLensPanelTab;
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
  /** Override responsive drawer behavior (e.g. host width in shadow root). */
  forceDrawer?: boolean;
};

export function SlopLensShell({
  signals,
  detailOpen,
  onDetailOpenChange,
  activeTab = "analyze",
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
  forceDrawer,
}: SlopLensShellProps) {
  const narrow = useNarrowLayout();
  const asDrawer = forceDrawer ?? narrow;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = detailOpen ?? internalOpen;
  const setOpen = onDetailOpenChange ?? setInternalOpen;

  return (
    <div className="relative inline-flex flex-col items-end gap-2">
      {!open || asDrawer ? (
        <SlopLensCompactSurface
          signals={signals}
          analyzeState={analyzeState}
          onOpenDetail={() => setOpen(true)}
          onRetryAnalyze={onRetryAnalyze}
          onOpenSettings={onOpenSettings}
        />
      ) : null}

      <SlopLensDetailPanel
        open={open}
        onOpenChange={setOpen}
        asDrawer={asDrawer}
        activeTab={activeTab}
        onTabChange={onTabChange}
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
      />
    </div>
  );
}
