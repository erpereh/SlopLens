import type { ErrorCode } from "@sloplens/shared";
import { AlertCircle, Settings2 } from "lucide-react";
import { AgentProgress } from "@/components/agents/loading-states/agent-progress";
import { Button } from "@/components/motion/button/base";
import { useSlopLensI18n } from "@/i18n/context";
import type { FeatureViewState } from "./types";

export function FeatureStatePanel({
  state,
  emptyMessage,
  emptyIdleMessage,
  emptyResultMessage,
  loadingLabel,
  onRetry,
  onOpenSettings,
}: {
  state: FeatureViewState;
  emptyMessage: string;
  emptyIdleMessage?: string;
  emptyResultMessage?: string;
  loadingLabel: string;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}) {
  if (state.phase === "idle") {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {emptyIdleMessage ?? emptyMessage}
      </p>
    );
  }

  if (state.phase === "empty") {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {emptyResultMessage ?? emptyMessage}
      </p>
    );
  }

  if (state.phase === "loading") {
    return <AgentProgress label={loadingLabel} className="w-full" />;
  }

  if (state.phase === "error") {
    return (
      <FeatureErrorPanel
        code={state.error.code}
        message={state.error.message}
        retryable={state.error.retryable ?? false}
        onRetry={onRetry}
        onOpenSettings={onOpenSettings}
      />
    );
  }

  return null;
}

export function FeatureErrorPanel({
  code,
  message,
  retryable,
  onRetry,
  onOpenSettings,
}: {
  code: ErrorCode;
  message?: string;
  retryable?: boolean;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}) {
  const { t } = useSlopLensI18n();
  const showSettings = code === "provider_not_configured" && onOpenSettings;

  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-2">
          <p className="font-medium text-foreground">{t(`error.${code}`)}</p>
          {message ? <p className="text-muted-foreground">{message}</p> : null}
          <div className="flex flex-wrap gap-2">
            {retryable && onRetry ? (
              <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                {t("status.retry")}
              </Button>
            ) : null}
            {showSettings ? (
              <Button type="button" size="sm" variant="secondary" onClick={onOpenSettings}>
                <Settings2 className="size-3.5" aria-hidden />
                {t("status.openSettings")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
