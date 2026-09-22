import type { ErrorCode } from "@sloplens/shared";

export type Locale = "en" | "es";

export type MessageKey =
  | "app.name"
  | "app.tagline"
  | "overlay.open"
  | "overlay.close"
  | "overlay.expand"
  | "overlay.loading"
  | "overlay.analyze"
  | "analyze.look"
  | "analyze.look.withClaim"
  | "contentType.news"
  | "contentType.opinion"
  | "contentType.meme"
  | "contentType.advertisement"
  | "contentType.personal"
  | "contentType.spam"
  | "contentType.unknown"
  | "signal.compact.verifiableClaim"
  | "signal.compact.highSlop"
  | "signal.compact.highClickbait"
  | "signal.compact.highEngagement"
  | "settings.loading"
  | "settings.loadError"
  | "settings.apiKey.stored"
  | "tab.analyze"
  | "tab.verify"
  | "tab.trace"
  | "tab.sources"
  | "tab.related"
  | "signal.aiSlop"
  | "signal.spam"
  | "signal.slop.label"
  | "signal.slop.accessible"
  | "signal.notVerdict"
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
  | "signal.evidence"
  | "signal.stance.supported"
  | "signal.stance.contradicted"
  | "signal.stance.mixed"
  | "signal.stance.unverified"
  | "signal.stance.unknown"
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
  | "empty.verify.insufficient"
  | "empty.trace"
  | "empty.trace.insufficient"
  | "empty.sources"
  | "empty.related"
  | "trace.possibleOrigin"
  | "trace.noOrigin"
  | "trace.evidence"
  | "trace.derivatives"
  | "trace.noDerivatives"
  | "trace.uncertainty"
  | "trace.confidence.low"
  | "trace.confidence.medium"
  | "popup.feed"
  | "popup.autoAnalyze"
  | "popup.dimHighSlop"
  | "popup.showStamp"
  | "popup.threshold"
  | "popup.appearance"
  | "popup.providers"
  | "popup.manageProviders"
  | "popup.configured"
  | "popup.notConfigured"
  | "popup.backend"
  | "popup.online"
  | "popup.offline"
  | "popup.checking"
  | "popup.language"
  | "popup.langEn"
  | "popup.langEs"
  | "popup.openDashboard"
  | "popup.thresholdSummary"
  | "dashboard.overview"
  | "dashboard.feed"
  | "dashboard.providers"
  | "dashboard.appearance"
  | "dashboard.diagnostics"
  | "dashboard.version"
  | "dashboard.unavailable"
  | "dashboard.lastActivity"
  | "dashboard.none"
  | "dashboard.contentsAnalyzed"
  | "dashboard.cachedAnalyses"
  | "dashboard.clusters"
  | "dashboard.relations"
  | "dashboard.backendStatus"
  | "dashboard.database"
  | "dashboard.pgvector"
  | "dashboard.providersConfigured"
  | "dashboard.testHealth"
  | "dashboard.degraded"
  | "dashboard.openMenu"
  | "dashboard.manage"
  | "dashboard.theme"
  | "dashboard.language"
  | "dashboard.noPaidPings"
  | "dashboard.x"
  | "dashboard.youtube"
  | "dashboard.settings"
  | "dashboard.xAnalyzed"
  | "dashboard.youtubeAnalyzed"
  | "dashboard.averageSlop"
  | "dashboard.verifications"
  | "dashboard.recentHistory"
  | "dashboard.platformSplit"
  | "dashboard.slopOverTime"
  | "dashboard.noSeries"
  | "history.empty"
  | "history.error"
  | "history.openX"
  | "history.openYouTube"
  | "history.untitled"
  | "dashboard.shareOfTotal"
  | "history.search"
  | "history.sort.recent"
  | "history.sort.slop"
  | "history.signal.all"
  | "history.signal.claim"
  | "history.signal.highSlop"
  | "history.loadMore"
  | "history.needsVerification"
  | "history.noClaim"
  | "settings.capability.decision"
  | "settings.capability.embedding"
  | "settings.capability.search"
  | "settings.capability.vision"
  | "settings.capability.reasoning"
  | "settings.appearance"
  | "settings.providers"
  | "motion.label"
  | "motion.system"
  | "motion.reduce"
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
  "app.tagline": "See beyond the slop.",
  "overlay.open": "Open",
  "overlay.close": "Close",
  "overlay.expand": "Details",
  "overlay.loading": "Analyzing…",
  "overlay.analyze": "Analyze",
  "analyze.look": "You're looking at {type}.",
  "analyze.look.withClaim": "You're looking at {type} with a verifiable claim.",
  "contentType.news": "news-style content",
  "contentType.opinion": "opinion or commentary",
  "contentType.meme": "meme or humor",
  "contentType.advertisement": "promotional content",
  "contentType.personal": "personal update",
  "contentType.spam": "possible spam",
  "contentType.unknown": "content",
  "signal.compact.verifiableClaim": "Verifiable claim",
  "signal.compact.highSlop": "High AI / slop signal",
  "signal.compact.highClickbait": "High clickbait signal",
  "signal.compact.highEngagement": "High engagement bait",
  "settings.loading": "Loading settings…",
  "settings.loadError": "Could not load settings.",
  "settings.apiKey.stored": "A key is stored. Enter a new one to replace it.",
  "tab.analyze": "Analyze",
  "tab.verify": "Verify",
  "tab.trace": "Trace",
  "tab.sources": "Sources",
  "tab.related": "Related",
  "signal.aiSlop": "AI / slop signal",
  "signal.spam": "Spam signal",
  "signal.slop.label": "Slop",
  "signal.slop.accessible": "Slop signal · {percent}%",
  "signal.notVerdict": "Signal, not a verdict.",
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
  "signal.evidence": "Evidence",
  "signal.stance.supported": "Backed by sources",
  "signal.stance.contradicted": "Contradicted by sources",
  "signal.stance.mixed": "Conflicting evidence",
  "signal.stance.unverified": "Unverified",
  "signal.stance.unknown": "Not enough information",
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
  "empty.verify.insufficient":
    "Verify finished, but there wasn't enough evidence to assess this claim.",
  "empty.trace": "Run Trace to explore possible origins and derivatives.",
  "empty.trace.insufficient":
    "Trace finished, but there wasn't enough evidence to suggest an origin.",
  "empty.sources": "No sources to show yet.",
  "empty.related": "No related items yet.",
  "trace.possibleOrigin": "Possible origin",
  "trace.noOrigin": "No earlier source candidate with enough evidence.",
  "trace.evidence": "Evidence",
  "trace.derivatives": "Possible derivatives",
  "trace.noDerivatives": "No derivative versions found.",
  "trace.uncertainty": "Uncertainty",
  "trace.confidence.low": "Low confidence",
  "trace.confidence.medium": "Medium confidence",
  "popup.feed": "Feed behavior",
  "popup.autoAnalyze": "Auto Analyze",
  "popup.dimHighSlop": "Dim high-slop content",
  "popup.showStamp": "Show Slop stamp",
  "popup.threshold": "Slop threshold",
  "popup.appearance": "Appearance",
  "popup.providers": "Providers",
  "popup.manageProviders": "Manage providers",
  "popup.configured": "Configured",
  "popup.notConfigured": "Not configured",
  "popup.backend": "Backend",
  "popup.online": "Online",
  "popup.offline": "Offline",
  "popup.checking": "Checking…",
  "popup.language": "Language",
  "popup.langEn": "English",
  "popup.langEs": "Spanish",
  "popup.openDashboard": "Open Dashboard",
  "popup.thresholdSummary": "Slop threshold {percent}%",
  "dashboard.overview": "Overview",
  "dashboard.feed": "Feed",
  "dashboard.providers": "Providers",
  "dashboard.appearance": "Appearance",
  "dashboard.diagnostics": "Diagnostics",
  "dashboard.version": "Version",
  "dashboard.unavailable": "Unavailable",
  "dashboard.lastActivity": "Last activity",
  "dashboard.none": "None yet",
  "dashboard.contentsAnalyzed": "Contents analyzed",
  "dashboard.cachedAnalyses": "Cached analyses",
  "dashboard.clusters": "Clusters",
  "dashboard.relations": "Related links",
  "dashboard.backendStatus": "Backend",
  "dashboard.database": "Database",
  "dashboard.pgvector": "pgvector",
  "dashboard.providersConfigured": "Providers configured",
  "dashboard.testHealth": "Test backend",
  "dashboard.degraded": "Degraded",
  "dashboard.openMenu": "Open menu",
  "dashboard.manage": "Manage",
  "dashboard.theme": "Theme",
  "dashboard.language": "Language",
  "dashboard.noPaidPings":
    "Diagnostics only check the local backend. Provider adapters are not pinged.",
  "dashboard.x": "X",
  "dashboard.youtube": "YouTube",
  "dashboard.settings": "Settings",
  "dashboard.xAnalyzed": "X analyzed",
  "dashboard.youtubeAnalyzed": "YouTube analyzed",
  "dashboard.averageSlop": "Average slop",
  "dashboard.verifications": "Verifications",
  "dashboard.recentHistory": "Recent analyses",
  "dashboard.platformSplit": "X and YouTube",
  "dashboard.slopOverTime": "Slop over time",
  "dashboard.noSeries": "No analyzed days yet.",
  "history.empty": "Nothing analyzed yet.",
  "history.error": "Could not load analyzed content.",
  "history.openX": "Open on X",
  "history.openYouTube": "Open on YouTube",
  "history.untitled": "Untitled",
  "dashboard.shareOfTotal": "{count} of {total}",
  "history.search": "Search author or text",
  "history.sort.recent": "Recent",
  "history.sort.slop": "Highest slop",
  "history.signal.all": "All signals",
  "history.signal.claim": "Has a claim",
  "history.signal.highSlop": "High slop",
  "history.loadMore": "Load more",
  "history.needsVerification": "Needs verification",
  "history.noClaim": "No claim stored",
  "settings.capability.decision": "Decision",
  "settings.capability.embedding": "Embedding",
  "settings.capability.search": "Search",
  "settings.capability.vision": "Vision",
  "settings.capability.reasoning": "Reasoning",
  "settings.appearance": "Appearance",
  "settings.providers": "Providers",
  "motion.label": "Motion",
  "motion.system": "Match system",
  "motion.reduce": "Reduce",
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
  "app.tagline": "Ver más allá del slop.",
  "overlay.open": "Abrir",
  "overlay.close": "Cerrar",
  "overlay.expand": "Detalle",
  "overlay.loading": "Analizando…",
  "overlay.analyze": "Analizar",
  "analyze.look": "Estás viendo {type}.",
  "analyze.look.withClaim": "Estás viendo {type} con una afirmación verificable.",
  "contentType.news": "contenido tipo noticia",
  "contentType.opinion": "opinión o comentario",
  "contentType.meme": "meme u humor",
  "contentType.advertisement": "contenido promocional",
  "contentType.personal": "actualización personal",
  "contentType.spam": "posible spam",
  "contentType.unknown": "contenido",
  "signal.compact.verifiableClaim": "Afirmación verificable",
  "signal.compact.highSlop": "Alta señal IA / slop",
  "signal.compact.highClickbait": "Alta señal clickbait",
  "signal.compact.highEngagement": "Alto cebo de engagement",
  "settings.loading": "Cargando ajustes…",
  "settings.loadError": "No se pudieron cargar los ajustes.",
  "settings.apiKey.stored": "Hay una clave guardada. Introduce otra para reemplazarla.",
  "tab.analyze": "Analizar",
  "tab.verify": "Verificar",
  "tab.trace": "Rastrear",
  "tab.sources": "Fuentes",
  "tab.related": "Relacionados",
  "signal.aiSlop": "Señal IA / slop",
  "signal.spam": "Señal spam",
  "signal.slop.label": "Slop",
  "signal.slop.accessible": "Señal slop · {percent}%",
  "signal.notVerdict": "Señal, no un veredicto.",
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
  "signal.evidence": "Evidencia",
  "signal.stance.supported": "Respaldado por fuentes",
  "signal.stance.contradicted": "Contradicho por fuentes",
  "signal.stance.mixed": "Evidencia contradictoria",
  "signal.stance.unverified": "Sin verificar",
  "signal.stance.unknown": "Información insuficiente",
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
  "empty.verify.insufficient":
    "Verificar terminó, pero no hubo evidencia suficiente para valorar la afirmación.",
  "empty.trace": "Ejecuta Rastrear para explorar posibles orígenes.",
  "empty.trace.insufficient":
    "Rastrear terminó, pero no hubo evidencia suficiente para sugerir un origen.",
  "empty.sources": "Aún no hay fuentes.",
  "empty.related": "Aún no hay relacionados.",
  "trace.possibleOrigin": "Posible origen",
  "trace.noOrigin": "No hay un candidato anterior con evidencia suficiente.",
  "trace.evidence": "Evidencia",
  "trace.derivatives": "Posibles derivados",
  "trace.noDerivatives": "No se encontraron versiones derivadas.",
  "trace.uncertainty": "Incertidumbre",
  "trace.confidence.low": "Confianza baja",
  "trace.confidence.medium": "Confianza media",
  "popup.feed": "Comportamiento del feed",
  "popup.autoAnalyze": "Analizar automáticamente",
  "popup.dimHighSlop": "Atenuar contenido high-slop",
  "popup.showStamp": "Mostrar sello Slop",
  "popup.threshold": "Umbral de slop",
  "popup.appearance": "Apariencia",
  "popup.providers": "Proveedores",
  "popup.manageProviders": "Gestionar proveedores",
  "popup.configured": "Configurado",
  "popup.notConfigured": "Sin configurar",
  "popup.backend": "Backend",
  "popup.online": "En línea",
  "popup.offline": "Desconectado",
  "popup.checking": "Comprobando…",
  "popup.language": "Idioma",
  "popup.langEn": "Inglés",
  "popup.langEs": "Español",
  "popup.openDashboard": "Abrir dashboard",
  "popup.thresholdSummary": "Umbral de slop {percent}%",
  "dashboard.overview": "Resumen",
  "dashboard.feed": "Feed",
  "dashboard.providers": "Proveedores",
  "dashboard.appearance": "Apariencia",
  "dashboard.diagnostics": "Diagnóstico",
  "dashboard.version": "Versión",
  "dashboard.unavailable": "No disponible",
  "dashboard.lastActivity": "Última actividad",
  "dashboard.none": "Aún no hay datos",
  "dashboard.contentsAnalyzed": "Contenidos analizados",
  "dashboard.cachedAnalyses": "Análisis en caché",
  "dashboard.clusters": "Clusters",
  "dashboard.relations": "Relaciones",
  "dashboard.backendStatus": "Backend",
  "dashboard.database": "Base de datos",
  "dashboard.pgvector": "pgvector",
  "dashboard.providersConfigured": "Proveedores configurados",
  "dashboard.testHealth": "Probar backend",
  "dashboard.degraded": "Degradado",
  "dashboard.openMenu": "Abrir menú",
  "dashboard.manage": "Gestionar",
  "dashboard.theme": "Tema",
  "dashboard.language": "Idioma",
  "dashboard.noPaidPings":
    "El diagnóstico solo comprueba el backend local. No se hacen pings de pago a proveedores.",
  "dashboard.x": "X",
  "dashboard.youtube": "YouTube",
  "dashboard.settings": "Ajustes",
  "dashboard.xAnalyzed": "X analizados",
  "dashboard.youtubeAnalyzed": "YouTube analizados",
  "dashboard.averageSlop": "Slop medio",
  "dashboard.verifications": "Verificaciones",
  "dashboard.recentHistory": "Análisis recientes",
  "dashboard.platformSplit": "X y YouTube",
  "dashboard.slopOverTime": "Slop en el tiempo",
  "dashboard.noSeries": "Todavía no hay días analizados.",
  "history.empty": "Todavía no hay contenido analizado.",
  "history.error": "No se pudo cargar el contenido analizado.",
  "history.openX": "Abrir en X",
  "history.openYouTube": "Abrir en YouTube",
  "history.untitled": "Sin título",
  "dashboard.shareOfTotal": "{count} de {total}",
  "history.search": "Buscar autor o texto",
  "history.sort.recent": "Recientes",
  "history.sort.slop": "Mayor slop",
  "history.signal.all": "Todas las señales",
  "history.signal.claim": "Con afirmación",
  "history.signal.highSlop": "Slop alto",
  "history.loadMore": "Cargar más",
  "history.needsVerification": "Necesita verificación",
  "history.noClaim": "Sin afirmación guardada",
  "settings.capability.decision": "Decisión",
  "settings.capability.embedding": "Embedding",
  "settings.capability.search": "Búsqueda",
  "settings.capability.vision": "Visión",
  "settings.capability.reasoning": "Razonamiento",
  "settings.appearance": "Apariencia",
  "settings.providers": "Proveedores",
  "motion.label": "Movimiento",
  "motion.system": "Seguir el sistema",
  "motion.reduce": "Reducir",
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
