import { useCallback, useState } from "react";
import { SlopLensAnchoredPanel } from "./anchored-panel";
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
  /** @deprecated Overlay no longer uses a host drawer. Kept for tests. */
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
}: SlopLensShellProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalTab, setInternalTab] = useState<SlopLensPanelTab>("analyze");
  const open = detailOpen ?? internalOpen;
  const setOpen = onDetailOpenChange ?? setInternalOpen;
  const tab = activeTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  return (
    <SlopLensAnchoredPanel
      open={open}
      onOpenChange={setOpen}
      trigger={
        <SlopLensCompactSurface
          signals={signals}
          analyzeState={analyzeState}
          onOpenDetail={toggle}
          onRetryAnalyze={onRetryAnalyze}
          onOpenSettings={onOpenSettings}
          onAnalyze={onAnalyze}
          expanded={open}
        />
      }
    >
      <SlopLensDetailPanel
        open={open}
        onOpenChange={setOpen}
        asDrawer={false}
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
        embedded
      />
    </SlopLensAnchoredPanel>
  );
}
