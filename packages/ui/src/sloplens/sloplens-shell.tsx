import { useState } from "react";
import { SlopLensCompactSurface } from "./compact-surface";
import { SlopLensDetailPanel } from "./detail-panel";
import type {
  AnalyzePanelContent,
  CompactSignals,
  FeatureViewState,
  SlopLensPanelTab,
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
  analyze?: AnalyzePanelContent;
  verify?: VerifyPanelContent;
  trace?: TracePanelContent;
  onRetryAnalyze?: () => void;
  onRetryVerify?: () => void;
  onRetryTrace?: () => void;
  onAnalyze?: () => void;
  onOpenSettings?: () => void;
  forceDrawer?: boolean;
};

export function SlopLensShell({
  signals,
  detailOpen,
  onDetailOpenChange,
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
  onAnalyze,
  onOpenSettings,
  forceDrawer,
}: SlopLensShellProps) {
  const narrow = useNarrowLayout();
  const asDrawer = forceDrawer ?? narrow;
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<SlopLensPanelTab>("analyze");
  const open = detailOpen ?? internalOpen;
  const setOpen = onDetailOpenChange ?? setInternalOpen;
  const tab = activeTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  return (
    <div className="relative inline-flex flex-col items-start gap-2">
      {!open || asDrawer ? (
        <SlopLensCompactSurface
          signals={signals}
          analyzeState={analyzeState}
          onOpenDetail={() => setOpen(true)}
          onRetryAnalyze={onRetryAnalyze}
          onOpenSettings={onOpenSettings}
          onAnalyze={onAnalyze}
        />
      ) : null}

      <SlopLensDetailPanel
        open={open}
        onOpenChange={setOpen}
        asDrawer={asDrawer}
        activeTab={tab}
        onTabChange={setTab}
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
      />
    </div>
  );
}
