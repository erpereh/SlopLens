# Arquitectura

Este documento describe CÓMO está construido técnicamente SlopLens.

Debe representar la arquitectura actual y las decisiones de implementación vigentes.

## Principios

- Local-first.
- Open-source-first.
- Arquitectura simple antes que infraestructura prematura.
- Backend local durante el MVP.
- PostgreSQL como fuente de verdad.
- pgvector antes que una base vectorial externa.
- Jev como clasificador/router inicial.
- Modelos caros solo cuando aporten valor.
- Proveedores desacoplados.
- UI inyectada aislada de la página anfitriona.
- Ningún servicio cloud es requisito del MVP.

## Stack

| Área | Decisión |
|---|---|
| Lenguaje | TypeScript |
| Extensión | WXT |
| UI | React |
| Manifest | MV3 |
| Sistema visual | beUI público/gratuito |
| Aislamiento UI | Shadow DOM |
| Estado frontend | Zustand |
| Data fetching | TanStack Query |
| Schemas | Zod |
| Package manager | pnpm |
| Monorepo | pnpm workspaces |
| Orquestación | Turborepo |
| Backend | Hono + TypeScript |
| Backend MVP | local |
| Runtime local | Docker |
| Datos | Supabase Local |
| Base de datos | PostgreSQL |
| Vectores | pgvector |
| Índice vectorial | HNSW |
| Administración DB | Supabase Studio |
| Auth | Supabase Auth disponible, no obligatoria inicialmente |
| Realtime | disponible, no obligatorio inicialmente |
| Storage | disponible, usar solo si hace falta |
| Clasificación | provider-agnostic; TypeSafe + Jev como default inicial |
| Embeddings | provider-agnostic |
| Search | provider-agnostic |
| Vision/multimodal | provider-agnostic |
| LLM complejo | provider-agnostic |
| Configuración providers | desde la app; `.env` solo como bootstrap/default local |
| Tests unitarios | Vitest |
| E2E | Playwright |
| Lint/format | Biome |
| CI | no GitHub Actions en el MVP |
| Cloud | no obligatorio |

## Estado de implementación

El monorepo pnpm + Turborepo está operativo. Los contratos compartidos están congelados en TypeScript + Zod.

**Backend local (Hono):**

- Servidor en `http://127.0.0.1:3001` (`apps/api`).
- Rutas reales: `GET /health`, `GET /metrics`, `GET /providers`, `GET /settings`, `PUT /settings/providers`, `POST /analyze`, `POST /verify`, `POST /trace`, `POST /related`.
- Cliente PostgreSQL vía `DATABASE_URL` (`postgres`).
- Caché por `content_hash` + `decision_provider_id` + `decision_model_id` para análisis; embeddings por `content_item_id` + `model_id` del vector devuelto por el provider.
- CORS: loopback HTTP y orígenes `chrome-extension://` (MV3); no se abre a `*`.
- `SecretStore` OS-first con `@napi-rs/keyring` (service `sloplens`, account `${capability}:${providerId}`). Fallback explícito `FileSecretStore` (`.data/secret-store.json`, gitignored, ACL/0600), etiquetado `kind: "file"` / `isFallback: true`. No es equivalente a un keychain.
- Resolución de credenciales: SecretStore del usuario → bootstrap `.env` → `provider_not_configured`. Settings nunca devuelve el valor de una key.

**Proveedores (adapters, no dominio):**

- Decision: TypeSafe AI oficial (`@ai-sdk/typesafe-ai`, `providerId: typesafe`, modelo `jev-latest`). Jev clasifica; no se usa Vercel AI Gateway.
- Una selección persistida `jev` o `typesafe-ai/jev` se normaliza a `typesafe` + `jev-latest` y se reescribe en `provider_selections`.
- Embedding / vision / reasoning: OpenRouter.
- Search: Tavily (`include_answer: false`; el campo answer nunca es un veredicto).
- Registry por `providerId` (`packages/ai`); `apps/api` resuelve credenciales/settings y obtiene instancias vía `createDefaultProviderRegistry`, sin switches duplicados en dominio.

**Embeddings / pgvector (G1b):**

- Dimensión canónica: `PGVECTOR_EMBEDDING_DIMENSIONS` en `@sloplens/config` (2048 hoy); migraciones SQL deben mantener `vector(N)` / `halfvec(N)` alineadas con esa constante.
- Smoke (`SLOPLENS_SMOKE=1`): `embedding.values.length === PGVECTOR_EMBEDDING_DIMENSIONS`.
- Tabla `content_embeddings` con `model_id`, `dim`, `embedding vector(N)`.
- Índice HNSW sobre `halfvec(N)` porque pgvector limita HNSW en `vector` a 2000 dimensiones.
- Persistencia rechaza `values.length !== dim` de la columna verificada.

**Extensión:**

- WXT MV3, content scripts en X e YouTube, custom element `sloplens-root` + Shadow DOM.
- Overlay con `@sloplens/ui` (`SlopLensUiRoot` + `SlopLensShell`). El sello del host es idempotente (`applySlopMarker` reutiliza el mismo `HTMLElement`; el observer ignora mutaciones propias de SlopLens).
- Dashboard (Options `open_in_tab`): `SlopLensDashboardApp` + `SlopLensSettingsForm` por capability → `PUT /settings/providers`. Keys nunca se guardan en la extensión ni se loguean. Deep-link de sección vía `chrome.storage.local` (`sloplens.dashboardSection`).
- Transporte: content, popup y dashboard **no** hacen fetch a localhost. Envían `chrome.runtime` messaging (`type: sloplens.api`, operations cerradas). El service worker valida `sender.id === chrome.runtime.id`, rechaza URL/path/headers arbitrarios y llama a Hono con `createHttpApiTransport`.
- Env de la extensión: solo `WXT_API_BASE_URL` (usado por el SW).
- `@sloplens/shared` y `@sloplens/config/browser` no arrastran Node (`fs`, keyring, `child_process`) al bundle.

**UI:**

- Kit beUI público en `packages/ui` (`animated-sidebar`, `popover`, tabs, switch, etc.).
- Tema de cascade root via `applyResolvedTheme` (`html` / `:host(.dark)`). Reduced motion con `MotionConfig` y `data-reduce-motion`.
- En Shadow DOM se usa `SlopLensThemeToggleButton` (no el ThemeToggle de documento).

No implementado / fuera del MVP:

- `apps/web` (no existe; no es requisito).
- Mapa de propagación, narrativas, Feed Quality, filtros, spoilers, Auth, Redis, Edge Functions, GitHub Actions.

## Arquitectura general

```text
                    SlopLens Extension
                      WXT + React
                        + beUI
                           │
              chrome.runtime messaging
                           │
                  MV3 service worker
                           │
                           ▼
                    Local Hono API
                  http://127.0.0.1:3001
                           │
          ┌────────────────┼────────────────┐
          │                │                │
         TypeSafe/Jev  Embeddings          Search
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                     Verification
                           │
                           ▼
                    Supabase Local
                       Docker
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      PostgreSQL        pgvector          Studio
```

La extensión no debe contener secretos de proveedores.

## Estructura actual del repositorio

```text
sloplens/
├── apps/
│   ├── extension/          # WXT MV3: content, popup, options, Shadow DOM
│   └── api/                # Hono local :3001
│
├── packages/
│   ├── core/               # NormalizedContent, ContentDecision
│   ├── ai/                 # interfaces + adapters TypeSafe/OpenRouter/Tavily
│   ├── platforms/          # adapters X y YouTube
│   ├── shared/             # error envelope, schemas API, cliente HTTP
│   ├── config/             # ProviderSelection, resolución, SecretStore
│   │                       # browser entry: `@sloplens/config/browser`
│   └── ui/                 # beUI + SlopLensShell / Settings
│
├── supabase/
│   ├── migrations/         # vector, tablas de dominio, content_embeddings vector(2048)
│   ├── seed.sql
│   └── config.toml
│
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   └── DESIGN.md
│
├── AGENTS.md
├── README.md
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── tsconfig.base.json
└── package.json
```

`apps/web` no existe y no es requisito del MVP. La extensión es la superficie principal.

Cualquier cambio estructural relevante debe actualizar este documento.

## Responsabilidades

### `apps/extension`

Extensión del navegador.

Responsabilidades:

- detectar contenido visible;
- integrarse con X, YouTube y futuras plataformas;
- capturar metadata necesaria;
- renderizar overlays y paneles;
- enviar peticiones al backend local;
- mostrar resultados;
- gestionar preferencias locales;
- usar Shadow DOM para aislar la UI inyectada.

### `apps/api`

Backend local Hono.

Responsabilidades:

- exponer endpoints;
- validar payloads;
- proteger secretos;
- llamar a proveedores;
- orquestar TypeSafe/Jev, embeddings, búsqueda y verificación;
- consultar/escribir en Supabase;
- aplicar caché lógica;
- normalizar respuestas.

### `apps/web`

No existe en el repositorio. No es requisito del MVP; la extensión es la superficie principal.

### `packages/ui`

Componentes beUI públicos y superficies SlopLens (`SlopLensUiRoot`, `SlopLensShell`, `SlopLensSettingsForm`). En Shadow DOM el toggle de tema es `SlopLensThemeToggleButton`.

No debe convertirse en un sistema de diseño paralelo.

### `packages/core`

Tipos y schemas de dominio independientes de proveedor y plataforma: `NormalizedContent`, `ContentDecision`.

### `packages/config`

`ProviderSelection`, resolución user → env → unconfigured, y `SecretStore`.

La extensión solo puede importar `@sloplens/config/browser` (schemas). `FileSecretStore` vive en `@sloplens/config/secrets/file` y es Node-only.

### `packages/ai`

Contratos de providers e implementaciones adapter (TypeSafe/Jev, OpenRouter, Tavily). IDs de modelo solo aquí y en defaults de bootstrap.

### `packages/platforms`

Adapters X y YouTube: extraen `NormalizedContent` desde el DOM. El core no conoce selectores.

### `packages/shared`

Error envelope, schemas Zod de la API, `ApiTransport` (HTTP o runtime messaging) y cliente tipado. Importa `@sloplens/config/browser`, no el barrel Node.

### `supabase`

- migraciones;
- seed;
- configuración local;
- extensiones;
- cambios reproducibles de esquema.

## Extensión

## WXT

WXT es el framework oficial de la extensión.

WXT reserva el alias `@` para el root de la extensión. `packages/ui` sigue el convenio beUI (`@/…`). El build de WXT reescribe esas importaciones (plugin `sloplens-ui-at` en `apps/extension/wxt.config.ts`) para que Vite 8 / Rolldown no las resuelva contra `apps/extension`.

Objetivos iniciales:

- Chrome;
- Edge;
- Firefox.

Safari queda para una fase posterior.

La extensión utilizará Manifest V3.

### Entry points esperados

- content scripts;
- background/service worker;
- popup mínimo (salud, Auto Analyze, umbral, tema, CTA dashboard);
- dashboard/options a pestaña completa (Overview, Feed, Providers, Appearance, Diagnostics);
- side panel cuando sea útil.

No crear superficies por defecto si no aportan valor.

## Overlay y feed

El content script serializa los scans del MutationObserver (un pase en vuelo + uno en cola) y el `OverlayMountManager` encadena mounts por host. El observer ignora batches cuyas mutaciones son solo nodos SlopLens (`sloplens-root`, `data-sloplens-*`, estilo del marker). Si `contentKey` y el runtime (locale/theme/feed/motion) no cambian, `OverlayMountManager` no vuelve a `render()`.

`applySlopMarker` compara un snapshot (`contentKey`, `slopScore`, `threshold`, `dim`, `showStamp`, `revealed`/reduce). Si coincide, no escribe. El sello reutiliza el mismo nodo; la animación de entrada solo ocurre en el primer insert (`animationend` retira la clase). Tras 20 rescans con los mismos inputs, el `HTMLElement` del stamp es el mismo (`===`).

Auto Analyze no dispara una llamada por cada nodo del feed. `createAnalyzeScheduler` encola solo hosts visibles o con `rootMargin` de 320px, limita la concurrencia a 2, reutiliza in-flight y cache por `contentKey`/`content_hash`, y cancela o ignora jobs cuyo host se desconectó.

El chip, el atenuado y el sello leen `deriveSlopSignal(decision)` (`packages/core`), no `decision.aiSlop` directo. En esta iteración la señal deriva de `aiSlop`; otras combinaciones deben entrar por ese helper.

El atenuado y el sello se aplican con clases/atributos en el DOM del host (`slop-marker.ts`) sobre regiones que expone `findDimmableRegions` del adapter. No se envuelven nodos React de X/YouTube.

## Shadow DOM

La UI inyectada en páginas externas debe vivir dentro de Shadow DOM siempre que sea compatible con el caso de uso.

Objetivo:

```text
x.com / youtube.com
        │
        └── <sloplens-root>
               #shadow-root
                    │
                    ├── beUI
                    ├── tokens
                    └── SlopLens UI
```

Esto evita:

- que CSS externo rompa SlopLens;
- que SlopLens contamine la página;
- inconsistencias de tema;
- colisiones de clases.

## Platform adapters

Cada plataforma debe normalizar contenido al mismo contrato interno.

Estructura conceptual:

```text
platforms/
├── x/
├── youtube/
├── reddit/
├── bluesky/
├── tiktok/
├── instagram/
├── linkedin/
└── web/
```

Contrato congelado en `packages/core` (`NormalizedContent`):

```ts
interface NormalizedContent {
  platform: Platform; // "x" | "youtube"
  externalId?: string;
  url: string;
  author?: string;
  title?: string;
  text?: string;
  publishedAt?: string;
  media?: MediaReference[];
  metadata: Record<string, unknown>;
}
```

El core no debe depender del DOM específico de X o YouTube. Añadir una plataforma es un cambio explícito de contrato.

## Backend local

Hono + TypeScript es el backend principal del MVP.

URL:

```text
http://127.0.0.1:3001
```

Endpoints:

```text
GET  /health
GET  /metrics
GET  /providers
GET  /settings
PUT  /settings/providers
POST /analyze
POST /verify
POST /trace
POST /related
```

El cliente tipado vive en `packages/shared` (`createSlopLensApiClient`). La extensión solo puede usar `WXT_API_BASE_URL`; cero secrets en su env.

### `/metrics`

- GET, read-only, sin token de emparejamiento.
- Responde siempre 200: si PostgreSQL/pgvector falla, `status` degradado/unavailable y conteos `null`.
- Contrato: solo `status`, checks (`database`, `pgvector`), conteos agregados (`contentItems`, `cachedAnalyses`, `clusters`, `relations`) y `lastActivityAt`.
- No devuelve `localToken`, API keys, URLs sensibles, texto de posts, hashes, SQL ni filas.
- Un fallo de métricas no tumba `/health` ni el dashboard Overview.

### `/analyze`

- recibe contenido normalizado;
- reutiliza análisis por `content_hash` + provider/model de decisión salvo `forceRefresh`;
- llama al `DecisionProvider` (TypeSafe + Jev por defecto);
- en YouTube, o si `needsImageAnalysis`, analiza el thumbnail con `VisionProvider` cuando está configurado; si vision falla tras una decisión válida, la respuesta incluye `warnings` (p. ej. `capability: vision`) sin invalidar la decisión;
- no descarga transcripciones: usa `NormalizedContent.text` solo si el adapter ya lo aportó;
- persiste `content_items` + `content_analysis`.

### `/verify`

- extrae una claim canónica corta del contenido (no usa el post entero como query);
- busca evidencia con `SearchProvider` (Tavily);
- filtra y reordena por solapamiento léxico con la claim antes del ranking de fuente primaria;
- ordena fuentes primarias primero (gov/edu/agencias antes que posts);
- nunca trata el campo `answer` de búsqueda como veredicto;
- llama al LLM de razonamiento solo si `needsPowerfulModel` (análisis cacheado) o la evidencia es ambigua;
- `insufficient_evidence` cuando no hay resultados relevantes o solo hay señales neutrales.

### `/trace`

Trace **básico** del MVP:

- búsqueda opcional (`topic: news` si el provider está configurado) + vecinos pgvector + `content_relations`;
- respuesta estructurada: `possibleOrigin` (candidato + por qué + confianza baja/media, nunca certeza), evidencia corta, `relatedVersions`, `possibleDerivatives`, `uncertainty`;
- `insufficient_evidence` solo si búsqueda, vecinos y relaciones están vacíos;
- deduplica `originates_from` antes de insertar en `content_relations`;
- no hay mapa de propagación.

### `/related`

- genera o reutiliza embedding por `model_id` de settings o el devuelto por `embed()`;
- consulta HNSW (`halfvec`) en la dimensión verificada;
- los casts `vector(N)` / `halfvec(N)` se interpolan con `sql.unsafe` porque postgres.js parametriza `${N}` y pgvector exige type modifiers constantes;
- omite vecinos cuya URL no sea parseable para no convertir un 500 de Zod en fallo de Related;
- rechaza persistir si `values.length !== PGVECTOR_EMBEDDING_DIMENSIONS`;
- agrupa en `clusters` cuando hay ≥2 vecinos con score alto.

## Pipeline de IA

Jev no debe hacer todo.

Su función inicial es clasificar y decidir cuándo hace falta procesamiento adicional.

```text
Contenido
   │
   ▼
Extracción / normalización
   │
   ▼
Jev
   │
   ├── normal ───────────────► resultado ligero
   │
   ├── slop/clickbait ───────► señal
   │
   ├── duplicado ────────────► embeddings
   │
   ├── necesita imagen ──────► multimodal
   │
   ├── claim ────────────────► búsqueda/verificación
   │
   └── caso complejo ────────► LLM potente
```

Regla:

> El modelo caro no se llama si el clasificador puede decidir razonablemente que no hace falta.

## Esquema de decisión

Contrato congelado en `packages/core` (`ContentDecision`). Los scores son el intervalo cerrado 0–1.

```ts
type ContentType =
  | "news"
  | "opinion"
  | "meme"
  | "advertisement"
  | "personal"
  | "spam"
  | "unknown";

interface ContentDecision {
  aiSlop: number;
  engagementBait: number;
  clickbait: number;
  spam: number;
  advertisement: number;
  containsClaim: boolean;
  needsVerification: boolean;
  needsWebSearch: boolean;
  needsImageAnalysis: boolean;
  needsPowerfulModel: boolean;
  likelyDuplicate: boolean;
  informationQuality?: number;
  originality?: number;
  contentType: ContentType;
}
```

## Provider interfaces

Las integraciones externas deben estar desacopladas.

Contratos congelados en `packages/ai`. No hay llamadas reales a SDKs de vendor en Gate 0; solo interfaces, registry y tipos.

```ts
interface DecisionProvider {
  analyze(input: DecisionInput): Promise<ContentDecision>;
}

interface EmbeddingVector {
  modelId: string;
  dimensions: number;
  values: number[];
}

interface EmbeddingProvider {
  embed(text: string): Promise<EmbeddingVector>;
  embedMany(texts: string[]): Promise<EmbeddingVector[]>;
}

interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

interface VisionProvider {
  analyze(input: VisionInput): Promise<VisionResult>;
}

interface ReasoningProvider {
  complete(input: ReasoningInput): Promise<ReasoningResult>;
}
```

Los embeddings siempre llevan `modelId` y `dimensions`. El dominio no conoce un número mágico de dimensiones. Persistencia futura debe rechazar `values.length !== dim` verificada del modelo (`assertEmbeddingDimensions`).

Jev (vía TypeSafe AI) es el clasificador/router inicial, no una dependencia que deba filtrarse por todo el dominio. El registry se indexa por `providerId` (`typesafe` para decisión).

### Configuración dinámica de proveedores

Los proveedores configurados actualmente mediante `.env` son únicamente **defaults de bootstrap para desarrollo local**.

La arquitectura final debe permitir que el usuario seleccione y cambie proveedores desde SlopLens sin editar archivos del proyecto.

La resolución de configuración está congelada en `packages/config` (`resolveProviderConfig`) con este orden:

```text
Configuración guardada por el usuario
        ↓
defaults locales / .env
        ↓
unconfigured / provider_not_configured
```

La configuración debe separar siempre:

```text
capability
provider
model
base URL opcional
credentials
provider-specific options
```

Capabilities iniciales:

```text
decision
embedding
search
vision
reasoning
```

Ejemplo conceptual:

```ts
type ProviderCapability =
  | "decision"
  | "embedding"
  | "search"
  | "vision"
  | "reasoning";

interface ProviderSelection {
  capability: ProviderCapability;
  providerId: string;
  modelId?: string;
  baseUrl?: string;
  options?: Record<string, unknown>;
}
```

Las API keys no deben almacenarse como texto plano en tablas generales ni enviarse a la extensión.

### SecretStore

Interface congelada: `SecretStore { get, set, delete }`.

Prioridad:

```text
OS credential store / keychain / Credential Manager
        ↓ si no es viable en runtime
FileSecretStore (fallback encapsulado, no equivalente a keychain)
        ↓
provider_not_configured
```

- Primario: credential store del SO vía `@napi-rs/keyring`. Service name `sloplens`, account `${capability}:${providerId}`. Solo el backend local accede.
- Fallback: `FileSecretStore` (`kind: "file"`, `isFallback: true`). Path gitignored `.data/secret-store.json`. Permisos restrictivos (ACL solo usuario en Windows, `0600` en Unix). No es el diseño objetivo ni almacenamiento seguro definitivo.
- Tests usan `MemorySecretStore`. Nunca loguear valores.
- Settings y routes no leen/escriben JSON de secrets directamente.

Reglas:

- no hardcodear OpenRouter, Vercel, Tavily, NVIDIA, Gemini, OpenAI u otro proveedor en la lógica de dominio;
- no usar IDs de modelos concretos fuera de adapters, defaults o configuración;
- cada integración debe implementar el contrato correspondiente;
- la UI de settings debe descubrir únicamente providers soportados por el build actual;
- cambiar provider/model no debe requerir recompilar la extensión cuando el backend ya soporte esa integración;
- si un provider no está configurado, devolver un estado explícito como `provider_not_configured`;
- los defaults del `.env` deben seguir siendo útiles para desarrollo, tests y primera ejecución;
- las variables de entorno no constituyen la fuente de verdad permanente de las preferencias del usuario.

Configuración inicial de desarrollo prevista:

```text
Decision     → configurable; TypeSafe + Jev (`jev-latest`) como default inicial
Embedding    → configurable
Search       → configurable
Vision       → configurable
Reasoning    → configurable
```

Los proveedores concretos elegidos durante el bootstrap pueden cambiar sin modificar esta arquitectura.

## Supabase Local

Supabase se usa localmente principalmente como:

> PostgreSQL + pgvector + Studio.

Servicios disponibles:

- PostgreSQL;
- pgvector;
- Studio;
- Auth;
- Realtime;
- Storage.

Para el MVP se priorizan:

- PostgreSQL;
- pgvector;
- Studio.

Auth, Realtime y Storage se activarán únicamente cuando exista una necesidad real.

No se usarán Supabase Edge Functions en el MVP.

No existe dependencia obligatoria de Supabase Cloud.

## Desarrollo local

Flujo esperado:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
# Requiere Docker Desktop en marcha:
npx supabase start
pnpm --filter @sloplens/api dev
pnpm --filter @sloplens/extension dev
```

`supabase start` levanta el stack local mediante Docker.

El proceso de `apps/api` carga `apps/api/.env` como bootstrap al arrancar, sin pisar variables ya presentes en el entorno y sin registrar esos valores.

`pnpm dev` debe poder arrancar los procesos de desarrollo del monorepo.

Puertos orientativos:

```text
SlopLens API       localhost:3001
Supabase API       localhost:54321
PostgreSQL         localhost:54322
Supabase Studio    localhost:54323
```

Los puertos finales pueden cambiar en configuración.

Meta de onboarding:

```text
git clone
pnpm install
supabase start
pnpm dev
```

## Base de datos

PostgreSQL es la fuente de verdad.

**G1b:** dimensión verificada por smoke = **2048**. Migración `content_embeddings` con `vector(2048)` e índice HNSW sobre `halfvec(2048)` (pgvector limita HNSW en `vector` a 2000 dims).

Tablas actuales:

```text
content_items
content_embeddings
content_analysis
claims
sources
content_relations
clusters
cluster_members
provider_selections
```

## `content_items`

Modelo conceptual:

```text
id
platform
external_id
url
author
title
body
published_at
captured_at
language
content_type
metadata
content_hash
```

## Relaciones

`content_relations` podrá modelar:

```text
originates_from
cites
copies
paraphrases
supports
contradicts
exaggerates
reposts
derived_from
related_to
```

Estas relaciones deben almacenar evidencia suficiente para explicar por qué existe la relación cuando sea posible.

## Embeddings y pgvector

Usos:

- posts similares;
- vídeos similares;
- artículos relacionados;
- contenido reciclado;
- clustering;
- búsqueda semántica;
- posibles fuentes;
- relaciones entre plataformas;
- narrativas.

Pipeline:

```text
Contenido
   ↓
Embedding
   ↓
PostgreSQL + pgvector
   ↓
nearest-neighbor search
   ↓
contenido relacionado
```

Índice actual: HNSW sobre `embedding::halfvec(2048)` (`halfvec_cosine_ops`). La columna sigue siendo `vector(2048)`; el cast es solo del índice porque HNSW en `vector` maxea a 2000 dims.

Las consultas de persistencia y vecinos interpolan `extensions.vector(2048)` / `extensions.halfvec(2048)` como SQL literal (`pgvectorTypmodSql`). Parametrizar el type modifier produce `vector($2)` y el error `type modifiers must be simple constants or identifiers`.

El proveedor de embeddings debe poder cambiar sin reescribir el dominio.

Reglas vigentes:

- El dominio no hardcodea 2048; la constante de columna vive en el API (`PGVECTOR_EMBEDDING_DIMENSIONS`) como tamaño de schema verificado por smoke.
- Cada fila de embeddings guarda `model_id` y `dim`.
- Persistencia rechaza vectores cuya longitud no coincida con la dimensión verificada de la columna.
- Cambiar provider/modelo/dimensión es una migración de datos explícita (re-embed o nueva columna/tabla); nunca mezclar espacios vectoriales.

## Auth

El flujo básico del MVP no requiere cuenta.

Supabase Auth queda disponible para funciones futuras como:

- sincronizar preferencias;
- historial;
- progreso de spoilers;
- contenido guardado;
- temas monitorizados.

Si se activa Auth, toda tabla privada debe usar Row Level Security.

## Realtime

Disponible para fases posteriores:

- verificaciones que se actualizan;
- clusters que reciben nuevos elementos;
- fuentes nuevas;
- narrativas;
- dashboard.

No introducir Realtime hasta necesitarlo.

## Storage

Usar solo para artefactos necesarios.

Ejemplos:

- imágenes procesadas;
- thumbnails si legalmente procede;
- exports;
- snapshots mínimos de evidencia.

No almacenar masivamente contenido audiovisual de terceros.

## Caché

MVP:

- caché local/browser cuando sea seguro;
- persistencia en PostgreSQL para análisis reutilizables;
- no Redis.

La caché debe evitar repetir verificaciones o embeddings idénticos cuando el contenido no ha cambiado. Claims reutilizables por `(content_item_id, claim_text)` cuando el contenido está vinculado.

## Seguridad

### API local (loopback)

- El servidor del MVP escucha solo en `127.0.0.1` (no en todas las interfaces).
- Cualquier proceso en la misma máquina puede llamar al API local; eso es inherente a un backend single-user en loopback y no se trata como autenticación multiusuario.
- Aun así, las mutaciones de configuración (`PUT /settings/providers`) exigen un **token de emparejamiento local** generado al arrancar, persistido en `SecretStore` y devuelto en `GET /health` únicamente cuando el `Host` es loopback (`127.0.0.1` / `localhost`). El **service worker** obtiene el token con `GET /health` y lo envía en `X-SlopLens-Local-Token`; content, popup y options no lo ven.
- Objetivo: impedir que otro proceso local redirija API keys a un `baseUrl` remoto arbitrario al guardar providers. Los `baseUrl` de providers conocidos (`openrouter`, `tavily`) están en allowlist de URLs oficiales; cualquier otro `baseUrl` remoto se rechaza. Solo se permiten URLs `http`/`https` hacia loopback o redes privadas (p. ej. mocks locales).

- Las API keys viven en SecretStore (OS primero) o en `.env` de bootstrap del API; nunca en el bundle de la extensión.
- Incluir `.env.example`, nunca secretos reales.
- Validar inputs con Zod.
- No confiar en HTML/DOM externo.
- Sanitizar contenido renderizado.
- Reducir permisos del manifest al mínimo necesario.
- No almacenar contenido sensible si no es necesario.
- BYOK debe mantenerse local y documentado.
- La configuración desde la app no debe exponer secretos al bundle de la extensión.
- Los `.env` son defaults de bootstrap, no el mecanismo definitivo de configuración del usuario.

## Estado frontend

- Zustand para estado de aplicación.
- TanStack Query para server state/cache de requests.
- Evitar convertir Zustand en caché duplicada del backend.

## Testing

### Unit/integration

Vitest.

Priorizar tests de:

- normalización;
- clasificación estructurada;
- thresholds;
- relaciones;
- adapters;
- utilidades críticas.

### E2E

Playwright con el **Chromium empaquetado** (`launchPersistentContext` + `--load-extension`), no Chrome stable.

La extensión se construye primero (`apps/extension/.output/chrome-mv3`). Los tests usan páginas HTML de fixture que imitan un tweet de X (`article[data-testid=tweet]`) y un watch de YouTube; no dependen de X/YouTube en vivo.

El API local se intercepta con `browserContext.route` (mock de Analyze/Verify/Related/Trace/Health/Metrics). El fetch lo hace el **service worker**, no el document. Los tests auditan `request.serviceWorker()`: page→localhost = 0; SW→localhost = rutas esperadas. Analyze se dispara al montar el overlay (salvo Auto Analyze desactivado) y el mock cubre ese POST. Un modo offline aborta `http://127.0.0.1:3001` para el error `backend_unavailable`. Playwright cubre el chip `Slop signal`, el panel anclado de 3 tabs, Sources anidadas en Verify, Related en Trace, el sello/dimming, tema/reduced-motion, el popup mínimo y el dashboard.

Comando: `pnpm test:e2e` (requiere `pnpm exec playwright install chromium` la primera vez).

Harness visual sin MV3: `pnpm harness` (`tests/harness`, puerto 4177). El navegador embebido de Cursor no carga la extensión MV3 unpacked; X/YouTube reales se validan con Playwright empaquetado y el harness.

## Formato y calidad

Biome para lint y format.

GitHub Actions no forma parte del MVP.

Los comandos de validación deberán poder ejecutarse localmente.

## Despliegue

Estado actual:

- desarrollo local;
- backend local;
- Supabase Local;
- Docker;
- sin cloud obligatorio.

Cuando exista una necesidad real de despliegue público se evaluará por separado. No asumir ahora Vercel, Railway, Fly.io, Supabase Cloud ni Edge Functions.

## Decisiones explícitamente fuera del MVP

No introducir sin necesidad:

```text
Supabase Cloud obligatorio
Supabase Edge Functions
GitHub Actions
Redis
vector DB externo
microservicios
Kubernetes
colas externas
backend serverless obligatorio
servicios de pago obligatorios
```

## Referencias técnicas

### beUI

```text
https://beui.dev/
https://beui.dev/components/motion
https://beui.dev/docs/openui
https://github.com/starc007/ui-components/blob/main/AGENTS.md
https://beui.dev/r/{name}.json
```

### Supabase

```text
https://supabase.com/docs
https://supabase.com/docs/guides/database/extensions/pgvector
https://supabase.com/docs/guides/local-development
https://supabase.com/docs/guides/auth
```

Los agentes deben consultar documentación oficial actual cuando una integración sea sensible a versiones.

## Notas

Este archivo describe cómo funciona técnicamente SlopLens AHORA.

No utilizarlo como historial de arquitecturas antiguas. Si una decisión cambia, actualizarla.
