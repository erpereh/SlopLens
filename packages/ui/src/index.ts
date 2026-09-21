export { AgentProgress } from "./components/agents/loading-states/agent-progress";
export { AnimatedToastStack } from "./components/motion/animated-toast-stack";
// Re-export beUI primitives used by extension options / composition
export { Button } from "./components/motion/button/base";
export { Loader } from "./components/motion/loader";
export { ThemeToggle } from "./components/motion/theme-toggle";
export { SlopLensI18nProvider, useSlopLensI18n } from "./i18n/context";
export { type Locale, messages, t } from "./i18n/messages";
export { SlopLensCompactSurface } from "./sloplens/compact-surface";
export { SlopLensDetailPanel } from "./sloplens/detail-panel";
export { FeatureErrorPanel, FeatureStatePanel } from "./sloplens/feature-state";
export {
  ScorePercentSignal,
  ScoreTextSignal,
  scoreToPercent,
  toneFromScore,
} from "./sloplens/score-signal";
export {
  type SettingsFormSubmitPayload,
  SlopLensSettingsForm,
} from "./sloplens/settings-form";
export { SlopLensShell, type SlopLensShellProps } from "./sloplens/sloplens-shell";
export { SlopLensUiRoot } from "./sloplens/sloplens-ui-root";
export { SlopLensThemeToggleButton } from "./sloplens/theme-toggle-button";
export type {
  AnalyzePanelContent,
  CompactSignals,
  FeatureError,
  FeaturePhase,
  FeatureViewState,
  RelatedItem,
  SettingsCapabilityDraft,
  SettingsFormValues,
  SlopLensPanelTab,
  SourceItem,
  TracePanelContent,
  VerifyPanelContent,
} from "./sloplens/types";
export { NARROW_LAYOUT_MAX_WIDTH } from "./sloplens/types";
export { useNarrowLayout } from "./sloplens/use-narrow-layout";
export { SlopLensThemeProvider, useSlopLensTheme } from "./theme/context";
export {
  type ResolvedTheme,
  resolveTheme,
  type ThemePreference,
} from "./theme/types";
