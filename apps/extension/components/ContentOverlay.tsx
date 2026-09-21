import type { ContentDecision, NormalizedContent, SlopPresentationSignal } from "@sloplens/core";
import {
  deriveSlopSignal,
  extractCanonicalClaim,
  slopSignalExceedsThreshold,
} from "@sloplens/core";
import { getPlatformAdapter } from "@sloplens/platforms";
import {
  type FeatureViewState,
  formatAnalyzeSummary,
  type SlopLensPanelTab,
  SlopLensShell,
  SlopLensUiRoot,
  type TracePanelContent,
  type VerifyPanelContent,
} from "@sloplens/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { createAnalyzeScheduler } from "../lib/analyze-scheduler";
import { createExtensionApiClient } from "../lib/api-client";
import { hashContentKey } from "../lib/content-key";
import { writeDashboardSection } from "../lib/dashboard";
import { toFeatureError } from "../lib/feature-error";
import type { FeedPreferences } from "../lib/feed-preferences";
import type { Locale } from "../lib/i18n";
import { openDashboardPage } from "../lib/open-dashboard";
import { applySlopMarker, clearSlopMarker } from "../lib/slop-marker";
import type { MotionPreference, ThemePreference } from "../lib/theme";

export interface ContentOverlayProps {
  content: NormalizedContent;
  host: HTMLElement;
  locale: Locale;
  themePreference: ThemePreference;
  onThemePreferenceChange: (next: ThemePreference) => void;
  reducedMotion: boolean;
  motionPreference: MotionPreference;
  feedPreferences: FeedPreferences;
  scheduler: ReturnType<typeof createAnalyzeScheduler>;
}

const idle: FeatureViewState = { phase: "idle" };

export function ContentOverlay({
  content,
  host,
  locale,
  themePreference,
  onThemePreferenceChange,
  reducedMotion,
  motionPreference,
  feedPreferences,
  scheduler,
}: ContentOverlayProps) {
  const client = useMemo(() => createExtensionApiClient(), []);
  const contentKey = useMemo(
    () =>
      hashContentKey([content.platform, content.url, content.externalId ?? "", content.text ?? ""]),
    [content],
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [tab, setTab] = useState<SlopLensPanelTab>("analyze");
  const [analyzeState, setAnalyzeState] = useState<FeatureViewState>(
    feedPreferences.autoAnalyze ? { phase: "loading" } : idle,
  );
  const [verifyState, setVerifyState] = useState<FeatureViewState>(idle);
  const [traceState, setTraceState] = useState<FeatureViewState>(idle);
  const [decision, setDecision] = useState<ContentDecision>();
  const [verify, setVerify] = useState<VerifyPanelContent>();
  const [trace, setTrace] = useState<TracePanelContent>();
  const slopSignal: SlopPresentationSignal | undefined = decision
    ? deriveSlopSignal(decision)
    : undefined;

  const slopValue = slopSignal?.value;
  const dimHighSlop = feedPreferences.dimHighSlop;
  const showSlopStamp = feedPreferences.showSlopStamp;
  const slopThreshold = feedPreferences.slopThreshold;

  const applyMarker = useCallback(
    (signal: SlopPresentationSignal | undefined) => {
      const adapter = getPlatformAdapter(content.platform);
      const regions = adapter.findDimmableRegions(host);
      if (
        !signal ||
        !slopSignalExceedsThreshold(signal, slopThreshold) ||
        !(dimHighSlop || showSlopStamp)
      ) {
        clearSlopMarker(host);
        return;
      }
      applySlopMarker({
        host,
        regions,
        dim: dimHighSlop,
        showStamp: showSlopStamp,
        contentKey,
        slopScore: signal.value,
        threshold: slopThreshold,
        reduceMotion: reducedMotion,
      });
    },
    [content.platform, contentKey, dimHighSlop, host, reducedMotion, showSlopStamp, slopThreshold],
  );

  const analyzeCallbacks = useMemo(
    () => ({
      onLoading: () => setAnalyzeState({ phase: "loading" }),
      onSuccess: (result: { decision: ContentDecision }) => {
        setDecision(result.decision);
        setAnalyzeState({ phase: "success" });
        applyMarker(deriveSlopSignal(result.decision));
      },
      onError: (error: unknown) => {
        setAnalyzeState({ phase: "error", error: toFeatureError(error) });
        clearSlopMarker(host);
      },
    }),
    [applyMarker, host],
  );

  useEffect(() => {
    applyMarker(
      typeof slopValue === "number"
        ? { value: slopValue, label: "slop", source: "aiSlop" }
        : undefined,
    );
  }, [applyMarker, slopValue]);

  useEffect(() => {
    if (!feedPreferences.autoAnalyze) {
      setAnalyzeState((current) => (current.phase === "loading" ? idle : current));
      return;
    }
    const stop = scheduler.observe({
      host,
      content,
      contentKey,
      callbacks: analyzeCallbacks,
      autoAnalyze: true,
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          scheduler.scheduleVisible({
            host,
            content,
            contentKey,
            callbacks: analyzeCallbacks,
          });
        }
      },
      { rootMargin: "320px 0px", threshold: 0 },
    );
    observer.observe(host);
    return () => {
      stop();
      observer.disconnect();
    };
  }, [analyzeCallbacks, content, contentKey, feedPreferences.autoAnalyze, host, scheduler]);

  const runAnalyze = useCallback(() => {
    scheduler.request({
      host,
      content,
      contentKey,
      callbacks: analyzeCallbacks,
    });
  }, [analyzeCallbacks, content, contentKey, host, scheduler]);

  const runVerify = useCallback(async () => {
    setVerifyState({ phase: "loading" });
    try {
      const claim = extractCanonicalClaim(content);
      const result = await client.verify({ claim, content });
      const empty = result.status === "insufficient_evidence" && result.sources.length === 0;
      setVerify({
        summary: empty ? undefined : (result.evidence[0]?.summary ?? result.sources[0]?.title),
        stance: stanceFromEvidence(result.evidence.map((item) => item.stance)),
        claim: result.claim,
        uncertainty: empty ? result.status : undefined,
        sources: result.sources.map((source, index) => ({
          id: source.url || String(index),
          title: source.title ?? source.url,
          url: source.url,
          kind: source.kind,
        })),
      });
      setVerifyState(empty ? { phase: "empty" } : { phase: "success" });
    } catch (error) {
      setVerifyState({ phase: "error", error: toFeatureError(error) });
    }
  }, [client, content]);

  const runTrace = useCallback(async () => {
    setTraceState({ phase: "loading" });
    try {
      const result = await client.trace({ content });
      if (result.status === "insufficient_evidence") {
        setTrace({
          uncertainty: result.uncertainty,
          related: [],
          derivatives: [],
          evidence: [],
        });
        setTraceState({ phase: "empty" });
        return;
      }
      setTrace({
        possibleOrigin: result.possibleOrigin,
        uncertainty: result.uncertainty,
        evidence: result.evidence,
        related: (result.relatedVersions ?? result.graph.similar).map((item, index) => ({
          id: item.url || String(index),
          title: item.title ?? item.url,
          url: item.url,
          platform: item.platform,
        })),
        derivatives: (result.possibleDerivatives ?? result.graph.derivations).map(
          (item, index) => ({
            id: item.url || String(index),
            title: item.title ?? item.url,
            url: item.url,
            platform: item.platform,
          }),
        ),
      });
      setTraceState({ phase: "success" });
    } catch (error) {
      setTraceState({ phase: "error", error: toFeatureError(error) });
    }
  }, [client, content]);

  useEffect(() => {
    if (!detailOpen) {
      return;
    }
    if (tab === "verify" && verifyState.phase === "idle") {
      void runVerify();
    }
    if (tab === "trace" && traceState.phase === "idle") {
      void runTrace();
    }
  }, [detailOpen, runTrace, runVerify, tab, traceState.phase, verifyState.phase]);

  const [localTheme, setLocalTheme] = useState(themePreference);
  useEffect(() => {
    setLocalTheme(themePreference);
  }, [themePreference]);

  const openSettings = () => {
    void writeDashboardSection("settings").then(() => openDashboardPage());
  };

  return (
    <SlopLensUiRoot
      locale={locale}
      themePreference={localTheme}
      motionPreference={motionPreference}
      reducedMotion={reducedMotion}
      onThemePreferenceChange={(next) => {
        setLocalTheme(next);
        onThemePreferenceChange(next);
      }}
      className="inline-flex w-fit bg-transparent"
    >
      <SlopLensShell
        signals={{ slopSignal, decision }}
        detailOpen={detailOpen}
        onDetailOpenChange={setDetailOpen}
        activeTab={tab}
        onTabChange={setTab}
        analyzeState={analyzeState}
        verifyState={verifyState}
        traceState={traceState}
        analyze={{
          decision,
          summary: decision ? formatAnalyzeSummary(locale, decision) : undefined,
        }}
        verify={verify}
        trace={trace}
        onRetryAnalyze={runAnalyze}
        onAnalyze={runAnalyze}
        onRetryVerify={() => void runVerify()}
        onRetryTrace={() => void runTrace()}
        onOpenSettings={openSettings}
      />
    </SlopLensUiRoot>
  );
}

function stanceFromEvidence(
  stances: ReadonlyArray<"supports" | "contradicts" | "neutral">,
): VerifyPanelContent["stance"] {
  const hasSupport = stances.includes("supports");
  const hasContradict = stances.includes("contradicts");
  if (hasSupport && hasContradict) {
    return "mixed";
  }
  if (hasSupport) {
    return "supported";
  }
  if (hasContradict) {
    return "contradicted";
  }
  return "unverified";
}
