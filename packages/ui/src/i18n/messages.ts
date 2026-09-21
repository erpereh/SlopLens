import type { ErrorCode } from "@sloplens/shared";

export type Locale = "en" | "es";

export type MessageKey =
  | "app.name"
  | "overlay.open"
  | "overlay.close"
  | "overlay.expand"
  | "tab.analyze"
  | "tab.verify"
  | "tab.trace"
  | "tab.sources"
  | "tab.related"
  | "signal.aiSlop"
  | "signal.clickbait"
  | "signal.engagementBait"
  | "signal.claim"
  | "signal.claim.detected"
  | "signal.claim.none"
  | "signal.primarySource"
  | "signal.primarySource.none"
  | "signal.similar"
  | "signal.similar.none"
  | "signal.scoreHint"
  | "status.loading"
  | "status.empty"
  | "status.retry"
  | "status.openSettings"
  | "loading.analyzing"
  | "loading.verifying"
  | "loading.tracing"
  | "loading.searchingSources"
  | "empty.analyze"
  | "empty.verify"
  | "empty.trace"
  | "empty.sources"
  | "empty.related"
  | "settings.title"
  | "settings.capability"
  | "settings.provider"
  | "settings.model"
  | "settings.baseUrl"
  | "settings.apiKey"
  | "settings.apiKey.placeholder"
  | "settings.save"
  | "settings.saved"
  | "theme.light"
  | "theme.dark"
  | "theme.system"
  | "theme.toggle";

type ErrorMessageKey = `error.${ErrorCode}`;

const en: Record<MessageKey | ErrorMessageKey, string> = {
  "app.name": "SlopLens",
  "overlay.open": "Open",
  "overlay.close": "Close",
  "overlay.expand": "Details",
  "tab.analyze": "Analyze",
  "tab.verify": "Verify",
  "tab.trace": "Trace",
  "tab.sources": "Sources",
  "tab.related": "Related",
  "signal.aiSlop": "AI / slop signal",
  "signal.clickbait": "Clickbait signal",
  "signal.engagementBait": "Engagement bait",
  "signal.claim": "Verifiable claim",
  "signal.claim.detected": "Detected",
  "signal.claim.none": "None detected",
  "signal.primarySource": "Primary source",
  "signal.primarySource.none": "None found",
  "signal.similar": "Similar items",
  "signal.similar.none": "—",
  "signal.scoreHint": "Signal strength, not a verdict",
  "status.loading": "Working…",
  "status.empty": "No data yet",
  "status.retry": "Try again",
  "status.openSettings": "Open settings",
  "loading.analyzing": "Analyzing content…",
  "loading.verifying": "Checking evidence…",
  "loading.tracing": "Tracing origin…",
  "loading.searchingSources": "Searching sources…",
  "empty.analyze": "Run Analyze to summarize what you are viewing.",
  "empty.verify": "Run Verify to look for supporting or conflicting evidence.",
  "empty.trace": "Run Trace to explore possible origins and derivatives.",
  "empty.sources": "No sources to show yet.",
  "empty.related": "No related items yet.",
  "settings.title": "Provider settings",
  "settings.capability": "Capability",
  "settings.provider": "Provider",
  "settings.model": "Model",
  "settings.baseUrl": "Base URL",
  "settings.apiKey": "API key",
  "settings.apiKey.placeholder": "Enter a new key (never shown after save)",
  "settings.save": "Save",
  "settings.saved": "Saved",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "theme.toggle": "Toggle theme",
  "error.validation_error": "Request could not be validated.",
  "error.provider_not_configured": "Provider is not configured yet.",
  "error.rate_limited": "Rate limit reached. Wait and try again.",
  "error.backend_unavailable": "Local backend is unreachable.",
  "error.insufficient_evidence": "Not enough evidence for a conclusion.",
  "error.transcript_unavailable": "Transcript is not available on this page.",
  "error.source_unreachable": "A source could not be reached.",
};

const es: Record<MessageKey | ErrorMessageKey, string> = {
  "app.name": "SlopLens",
  "overlay.open": "Abrir",
  "overlay.close": "Cerrar",
  "overlay.expand": "Detalle",
  "tab.analyze": "Analizar",
  "tab.verify": "Verificar",
  "tab.trace": "Rastrear",
  "tab.sources": "Fuentes",
  "tab.related": "Relacionados",
  "signal.aiSlop": "Señal IA / slop",
  "signal.clickbait": "Señal clickbait",
  "signal.engagementBait": "Cebo de engagement",
  "signal.claim": "Afirmación verificable",
  "signal.claim.detected": "Detectada",
  "signal.claim.none": "No detectada",
  "signal.primarySource": "Fuente principal",
  "signal.primarySource.none": "Sin fuente",
  "signal.similar": "Elementos similares",
  "signal.similar.none": "—",
  "signal.scoreHint": "Intensidad de señal, no un veredicto",
  "status.loading": "Trabajando…",
  "status.empty": "Sin datos aún",
  "status.retry": "Reintentar",
  "status.openSettings": "Abrir ajustes",
  "loading.analyzing": "Analizando contenido…",
  "loading.verifying": "Comprobando evidencia…",
  "loading.tracing": "Rastreando origen…",
  "loading.searchingSources": "Buscando fuentes…",
  "empty.analyze": "Ejecuta Analizar para resumir lo que estás viendo.",
  "empty.verify": "Ejecuta Verificar para buscar evidencia a favor o en contra.",
  "empty.trace": "Ejecuta Rastrear para explorar posibles orígenes.",
  "empty.sources": "Aún no hay fuentes.",
  "empty.related": "Aún no hay relacionados.",
  "settings.title": "Ajustes de proveedores",
  "settings.capability": "Capacidad",
  "settings.provider": "Proveedor",
  "settings.model": "Modelo",
  "settings.baseUrl": "URL base",
  "settings.apiKey": "Clave API",
  "settings.apiKey.placeholder": "Introduce una clave nueva (no se muestra tras guardar)",
  "settings.save": "Guardar",
  "settings.saved": "Guardado",
  "theme.light": "Claro",
  "theme.dark": "Oscuro",
  "theme.system": "Sistema",
  "theme.toggle": "Cambiar tema",
  "error.validation_error": "No se pudo validar la solicitud.",
  "error.provider_not_configured": "El proveedor aún no está configurado.",
  "error.rate_limited": "Límite de uso alcanzado. Espera y reintenta.",
  "error.backend_unavailable": "El backend local no responde.",
  "error.insufficient_evidence": "Evidencia insuficiente para concluir.",
  "error.transcript_unavailable": "La transcripción no está disponible en esta página.",
  "error.source_unreachable": "No se pudo acceder a una fuente.",
};

export const messages: Record<Locale, Record<MessageKey | ErrorMessageKey, string>> = {
  en,
  es,
};

export function t(
  locale: Locale,
  key: MessageKey | ErrorMessageKey,
  vars?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages.en[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
