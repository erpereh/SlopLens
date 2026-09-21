import type { ContentDecision } from "@sloplens/core";
import { deriveSlopSignal } from "@sloplens/core";
import {
  type DashboardSection,
  type FeatureViewState,
  formatAnalyzeSummary,
  type MotionPreference,
  type RelatedItem,
  SlopLensDashboardApp,
  SlopLensPopupControl,
  SlopLensShell,
  SlopLensUiRoot,
  type ThemePreference,
  type TracePanelContent,
  type VerifyPanelContent,
} from "@sloplens/ui";
import { type ReactNode, useMemo, useState } from "react";

const decision: ContentDecision = {
  aiSlop: 0.82,
  engagementBait: 0.4,
  clickbait: 0.91,
  spam: 0.1,
  advertisement: 0.05,
  containsClaim: true,
  needsVerification: true,
  needsWebSearch: true,
  needsImageAnalysis: false,
  needsPowerfulModel: false,
  likelyDuplicate: false,
  contentType: "news",
};

const idle: FeatureViewState = { phase: "idle" };
const success: FeatureViewState = { phase: "success" };
const loading: FeatureViewState = { phase: "loading" };

const verify: VerifyPanelContent = {
  summary: "The claim is backed by the cited note.",
  stance: "supported",
  sources: [{ id: "1", title: "Primary research note", url: "https://example.com/source" }],
};

const related: RelatedItem[] = [
  { id: "1", title: "Related post", url: "https://x.com/other/status/99", platform: "x" },
];

const trace: TracePanelContent = {
  possibleOrigin: {
    url: "https://example.com/origin",
    title: "Origin article",
    whyThisMayBeTheOrigin: "Candidate earlier source, not a confirmed origin.",
    confidence: "low",
  },
  uncertainty: "This is a possible earlier source, not a confirmed origin.",
  related,
  evidence: [{ summary: "Short evidence blurb.", sourceUrl: "https://example.com/origin" }],
};

type Scene = "tweet" | "youtube" | "states" | "popup" | "dashboard";

function sceneFromLocation(): Scene {
  const value = new URLSearchParams(window.location.search).get("scene");
  if (value === "youtube" || value === "states" || value === "popup" || value === "dashboard") {
    return value;
  }
  return "tweet";
}

function themeFromLocation(): ThemePreference {
  const value = new URLSearchParams(window.location.search).get("theme");
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

function motionFromLocation(): MotionPreference {
  return window.location.search.includes("motion=reduce") ? "reduce" : "system";
}

export function App() {
  const [scene, setScene] = useState<Scene>(sceneFromLocation);
  const [themePreference, setThemePreference] = useState<ThemePreference>(themeFromLocation);
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(motionFromLocation);
  const [detailOpen, setDetailOpen] = useState(false);
  const slopSignal = deriveSlopSignal(decision);

  const overlay = useMemo(
    () => (
      <SlopLensUiRoot
        locale="en"
        themePreference={themePreference}
        motionPreference={motionPreference}
        onThemePreferenceChange={setThemePreference}
        onMotionPreferenceChange={setMotionPreference}
        className="inline-flex w-fit bg-transparent"
      >
        <SlopLensShell
          signals={{ slopSignal, decision }}
          detailOpen={detailOpen}
          onDetailOpenChange={setDetailOpen}
          analyzeState={success}
          verifyState={success}
          traceState={success}
          analyze={{ decision, summary: formatAnalyzeSummary("en", decision) }}
          verify={verify}
          trace={trace}
        />
      </SlopLensUiRoot>
    ),
    [detailOpen, motionPreference, slopSignal, themePreference],
  );

  return (
    <>
      <nav className="harness-chrome" aria-label="Harness scenes">
        <strong>SlopLens harness</strong>
        <a href="?scene=tweet" aria-current={scene === "tweet" ? "page" : undefined}>
          Tweet
        </a>
        <a href="?scene=youtube" aria-current={scene === "youtube" ? "page" : undefined}>
          YouTube
        </a>
        <a href="?scene=states" aria-current={scene === "states" ? "page" : undefined}>
          States
        </a>
        <a href="?scene=popup" aria-current={scene === "popup" ? "page" : undefined}>
          Popup
        </a>
        <a href="?scene=dashboard" aria-current={scene === "dashboard" ? "page" : undefined}>
          Dashboard
        </a>
        <button type="button" onClick={() => setThemePreference("light")}>
          Light
        </button>
        <button type="button" onClick={() => setThemePreference("dark")}>
          Dark
        </button>
        <button type="button" onClick={() => setThemePreference("system")}>
          System
        </button>
        <button type="button" onClick={() => setMotionPreference("reduce")}>
          Reduce motion
        </button>
        <button type="button" onClick={() => setScene(sceneFromLocation())}>
          Reload scene
        </button>
      </nav>
      {scene === "tweet" ? <TweetHost overlay={overlay} /> : null}
      {scene === "youtube" ? <YouTubeHost overlay={overlay} /> : null}
      {scene === "states" ? (
        <StatesGallery
          themePreference={themePreference}
          motionPreference={motionPreference}
          onTheme={setThemePreference}
        />
      ) : null}
      {scene === "popup" ? (
        <PopupScene
          themePreference={themePreference}
          motionPreference={motionPreference}
          onTheme={setThemePreference}
        />
      ) : null}
      {scene === "dashboard" ? (
        <DashboardScene
          themePreference={themePreference}
          motionPreference={motionPreference}
          onTheme={setThemePreference}
          onMotion={setMotionPreference}
        />
      ) : null}
    </>
  );
}

function TweetHost({ overlay }: { overlay: ReactNode }) {
  return (
    <div className="host-x">
      <div className="timeline">
        <article data-testid="tweet">
          <div data-testid="User-Name">Jane Doe</div>
          <div data-testid="tweetText">Hello from SlopLens</div>
          <time dateTime="2026-01-15T12:00:00.000Z">Jan 15</time>
        </article>
        <div className="sloplens-host">{overlay}</div>
      </div>
    </div>
  );
}

function YouTubeHost({ overlay }: { overlay: ReactNode }) {
  return (
    <div className="host-yt">
      <div className="player" aria-hidden="true" />
      <div id="primary-inner">
        <h1 className="ytd-watch-metadata">Clickbait title</h1>
        <div id="owner">
          <a href="/channel/x">Creator Channel</a>
        </div>
        <div className="sloplens-host">{overlay}</div>
      </div>
    </div>
  );
}

function StatesGallery({
  themePreference,
  motionPreference,
  onTheme,
}: {
  themePreference: ThemePreference;
  motionPreference: MotionPreference;
  onTheme: (next: ThemePreference) => void;
}) {
  const error: FeatureViewState = {
    phase: "error",
    error: { code: "backend_unavailable", retryable: true },
  };

  return (
    <div className="states-grid">
      <section>
        <h2>Loading</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          motionPreference={motionPreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell signals={{}} analyzeState={loading} verifyState={idle} traceState={idle} />
        </SlopLensUiRoot>
      </section>
      <section>
        <h2>Backend offline</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          motionPreference={motionPreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell
            signals={{}}
            analyzeState={error}
            verifyState={idle}
            traceState={idle}
            onRetryAnalyze={() => undefined}
          />
        </SlopLensUiRoot>
      </section>
      <section>
        <h2>Success</h2>
        <SlopLensUiRoot
          locale="en"
          themePreference={themePreference}
          motionPreference={motionPreference}
          onThemePreferenceChange={onTheme}
        >
          <SlopLensShell
            signals={{ slopSignal: deriveSlopSignal(decision), decision }}
            analyzeState={success}
            verifyState={success}
            traceState={{ phase: "empty" }}
            analyze={{ decision, summary: formatAnalyzeSummary("en", decision) }}
            verify={{ stance: "unverified", summary: "No corroborating sources yet." }}
          />
        </SlopLensUiRoot>
      </section>
    </div>
  );
}

function PopupScene({
  themePreference,
  motionPreference,
  onTheme,
}: {
  themePreference: ThemePreference;
  motionPreference: MotionPreference;
  onTheme: (next: ThemePreference) => void;
}) {
  return (
    <div className="states-grid">
      <SlopLensUiRoot
        locale="en"
        themePreference={themePreference}
        motionPreference={motionPreference}
        onThemePreferenceChange={onTheme}
      >
        <SlopLensPopupControl
          health="ok"
          onRefreshHealth={() => undefined}
          feed={{
            autoAnalyze: true,
            dimHighSlop: true,
            showSlopStamp: true,
            slopThreshold: 0.7,
          }}
          onFeedChange={() => undefined}
          onOpenDashboard={() => undefined}
        />
      </SlopLensUiRoot>
    </div>
  );
}

function DashboardScene({
  themePreference,
  motionPreference,
  onTheme,
  onMotion,
}: {
  themePreference: ThemePreference;
  motionPreference: MotionPreference;
  onTheme: (next: ThemePreference) => void;
  onMotion: (next: MotionPreference) => void;
}) {
  const [section, setSection] = useState<DashboardSection>("overview");
  const degraded = window.location.search.includes("metrics=unavailable");
  return (
    <SlopLensUiRoot
      locale="en"
      themePreference={themePreference}
      motionPreference={motionPreference}
      onThemePreferenceChange={onTheme}
      onMotionPreferenceChange={onMotion}
      className="min-h-svh"
    >
      <SlopLensDashboardApp
        section={section}
        onSectionChange={setSection}
        version="0.0.0-harness"
        health={degraded ? "unavailable" : "ok"}
        metrics={
          degraded
            ? {
                status: "unavailable",
                checks: { database: false, pgvector: false },
                counts: {
                  contentItems: null,
                  cachedAnalyses: null,
                  clusters: null,
                  relations: null,
                  byPlatform: { x: null, youtube: null },
                  claims: null,
                  averageSlop: null,
                },
                lastActivityAt: null,
                slopSeries: null,
              }
            : {
                status: "ok",
                checks: { database: true, pgvector: true },
                counts: {
                  contentItems: 12,
                  cachedAnalyses: 9,
                  clusters: 3,
                  relations: 4,
                  byPlatform: { x: 8, youtube: 4 },
                  claims: 2,
                  averageSlop: 0.41,
                },
                lastActivityAt: "2026-09-21T12:00:00.000Z",
                slopSeries: [{ day: "2026-09-21", slop: 0.41, x: 0.3, youtube: 0.6 }],
              }
        }
        history={
          degraded
            ? { items: [], nextCursor: null, phase: "ready" }
            : {
                phase: "ready",
                nextCursor: null,
                items: [
                  {
                    id: "11111111-1111-4111-8111-111111111111",
                    platform: "x",
                    url: "https://x.com/jane/status/123",
                    author: "Jane Doe",
                    handle: "@jane",
                    title: null,
                    text: "A stored post from the local history fixture.",
                    publishedAt: "2026-09-21T11:00:00.000Z",
                    capturedAt: "2026-09-21T12:00:00.000Z",
                    slop: 0.82,
                    clickbait: 0.2,
                    engagementBait: 0.66,
                    containsClaim: true,
                    needsVerification: true,
                    claimText: "The launch happened on Monday.",
                    thumbnailUrl: null,
                  },
                  {
                    id: "22222222-2222-4222-8222-222222222222",
                    platform: "youtube",
                    url: "https://www.youtube.com/watch?v=abcdefghijk",
                    author: "Creator Channel",
                    handle: null,
                    title: "A stored video",
                    text: "Description captured with the analysis.",
                    publishedAt: null,
                    capturedAt: "2026-09-21T12:05:00.000Z",
                    slop: 0.4,
                    clickbait: 0.71,
                    engagementBait: 0.1,
                    containsClaim: false,
                    needsVerification: false,
                    claimText: null,
                    thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
                  },
                ],
              }
        }
        onHistoryQueryChange={() => undefined}
        onHistoryLoadMore={() => undefined}
        locale="en"
        onLocaleChange={() => undefined}
        motionPreference={motionPreference}
        onMotionPreferenceChange={onMotion}
        formValues={{
          capabilities: [
            {
              capability: "decision",
              selection: { capability: "decision", providerId: "typesafe", modelId: "jev-latest" },
              hasStoredKey: true,
            },
          ],
        }}
        providerOptions={{
          decision: [{ id: "typesafe", label: "TypeSafe" }],
          embedding: [],
          search: [],
          vision: [],
          reasoning: [],
        }}
        onSubmitCapability={() => undefined}
        settingsLoading={false}
        settingsError={null}
        onTestHealth={() => undefined}
      />
    </SlopLensUiRoot>
  );
}
