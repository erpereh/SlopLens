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
| Clasificación | provider-agnostic; Jev como default inicial |
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

## Estado de implementación (Gate 0)

El monorepo pnpm + Turborepo existe. Los contratos compartidos están congelados en TypeScript + Zod. Todavía **no** hay servidor Hono, adapters de proveedor, overlays, content scripts ni columnas `vector(N)`.

Implementado ahora:

- Workspace: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `tsconfig.base.json`.
- Apps stub: `apps/api` (sin Hono) y `apps/extension` (WXT mínimo, sin content scripts).
- Packages: `core`, `ai`, `platforms`, `shared`, `config`; `ui` es un stub de `package.json`.
- Migración Gate 0: solo `create extension vector`. **No** hay `vector(N)` ni índice HNSW.
- `supabase/seed.sql` vacío.
- Scripts raíz: `dev`, `build`, `lint`, `typecheck`, `test`.
- Vitest en los packages con contratos.

No implementado todavía (gates posteriores):

- Servidor Hono y rutas reales.
- SecretStore del SO (solo interfaz + fallback de archivo etiquetado).
- Adapters Jev / OpenRouter / Tavily.
- Tablas de dominio (`content_items`, `content_embeddings`, etc.).
- UI beUI, overlays, Analyze / Verify / Trace / Related / Vision.
- `apps/web` (no creado; no es requisito del MVP).

## Arquitectura general

```text
                    SlopLens Extension
                      WXT + React
                        + beUI
                           │
                           ▼
                    Local Hono API
                  http://127.0.0.1:3001
                           │
          ┌────────────────┼────────────────┐
          │                │                │
         Jev          Embeddings          Search
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
│   ├── extension/          # WXT mínimo (background stub). Sin content scripts.
│   └── api/                # stub; Hono llega en Foundation
│
├── packages/
│   ├── core/               # NormalizedContent, ContentDecision
│   ├── ai/                 # interfaces de providers + registry
│   ├── platforms/          # contrato PlatformAdapter
│   ├── shared/             # error envelope, schemas API, cliente HTTP
│   ├── config/             # ProviderSelection, resolución, SecretStore
│   └── ui/                 # stub (solo package.json)
│
├── supabase/
│   ├── migrations/         # solo extensión vector
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
- orquestar Jev, embeddings, búsqueda y verificación;
- consultar/escribir en Supabase;
- aplicar caché lógica;
- normalizar respuestas.

### `apps/web`

No existe en el repositorio. No es requisito del MVP; la extensión es la superficie principal.

### `packages/ui`

Stub en Gate 0 (solo `package.json`). beUI público/gratuito será la fuente visual cuando se implemente la UI.

No debe convertirse en un sistema de diseño paralelo.

### `packages/core`

Tipos y schemas de dominio independientes de proveedor y plataforma: `NormalizedContent`, `ContentDecision`.

### `packages/config`

`ProviderSelection`, resolución user → env → unconfigured, y `SecretStore`.

### `packages/ai`

Contratos de providers (interfaces + registry). Adapters reales en gates posteriores.

### `packages/platforms`

Normalización y lógica común de adapters de plataformas.

### `packages/shared`

Error envelope, schemas Zod de la API y cliente HTTP tipado extensión ↔ API. Sin lógica de dominio de contenido.

### `supabase`

- migraciones;
- seed;
- configuración local;
- extensiones;
- cambios reproducibles de esquema.

## Extensión

## WXT

WXT es el framework oficial de la extensión.

Objetivos iniciales:

- Chrome;
- Edge;
- Firefox.

Safari queda para una fase posterior.

La extensión utilizará Manifest V3.

### Entry points esperados

- content scripts;
- background/service worker;
- popup cuando aporte valor;
- options/settings;
- side panel cuando sea útil.

No crear superficies por defecto si no aportan valor.

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

En Gate 0 el proceso aún no escucha; el contrato HTTP ya está congelado.

Endpoints:

```text
GET  /health
GET  /providers
GET  /settings
PUT  /settings/providers
POST /analyze
POST /verify
POST /trace
POST /related
```

El cliente tipado vive en `packages/shared` (`createSlopLensApiClient`). La extensión solo puede usar `WXT_API_BASE_URL`; cero secrets en su env.

### `/analyze`

- recibe contenido normalizado;
- llama al clasificador;
- devuelve scores/decisiones;
- detecta si existe un claim;
- decide si hacen falta pasos adicionales;
- puede persistir resultado reutilizable.

### `/verify`

- recibe un claim;
- busca fuentes;
- prioriza fuente primaria;
- contrasta evidencia;
- usa un LLM complejo solo si aporta valor;
- devuelve evidencia estructurada.

### `/trace`

- busca origen;
- consulta relaciones existentes;
- relaciona contenido;
- identifica posibles derivaciones;
- devuelve grafo parcial y evidencia.

### `/related`

- genera o reutiliza embedding;
- consulta pgvector;
- devuelve vecinos semánticos y clusters.

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

Jev es el `DecisionProvider` inicial previsto, no una dependencia que deba filtrarse por todo el dominio. El registry se indexa por `providerId`.

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

- Primario: credential store del SO. Service name `sloplens`. Solo el backend local accede. Gate 0 congela la interfaz (`OsSecretStore`); la implementación OS llega en Foundation.
- Fallback: `FileSecretStore` (`kind: "file"`, `isFallback: true`). Path gitignored `.data/secret-store.json`. Permisos restrictivos. No es el diseño objetivo ni almacenamiento seguro definitivo.
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
Decision     → configurable; Jev como default inicial
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
# Foundation / G1 (requiere Docker Desktop en marcha):
supabase start
pnpm dev
```

`supabase start` levanta el stack local mediante Docker.

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

**Gate 0:** la única migración aplicada en el repo habilita la extensión `vector` en el schema `extensions`. No existe ninguna columna `vector(N)` ni índice HNSW. La dimensión se fijará en una migración posterior tras verificarla (documentación del modelo configurado + respuesta real de API + smoke que mide `embedding.length`). Si docs y API discrepan, prevalece la longitud observada.

Tablas previstas para Foundation (aún no creadas):

```text
users
user_preferences

content_items
content_embeddings
content_analysis

claims
claim_sources
claim_verifications

sources

clusters
cluster_members

narratives
narrative_members

content_relations

platform_accounts
saved_filters
spoiler_progress
```

No crear todas las tablas desde el primer commit si el MVP todavía no las necesita. Crear el mínimo esquema que soporte la funcionalidad implementada.

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

Índice previsto: HNSW, **después** de verificar N.

El proveedor de embeddings debe poder cambiar sin reescribir el dominio.

Reglas vigentes:

- El dominio no hardcodea 2048 ni ninguna otra dimensión.
- Cada fila futura de embeddings guardará `model_id` y `dim`.
- Persistencia rechaza vectores cuya longitud no coincida con la dimensión verificada de ese modelo.
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

La caché debe evitar repetir verificaciones o embeddings idénticos cuando el contenido no ha cambiado.

## Seguridad

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

Playwright.

Casos iniciales:

- inyección en X;
- inyección en YouTube;
- Shadow DOM;
- apertura/cierre de panel;
- cambio de tema;
- llamada al backend local;
- estados de error.

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
