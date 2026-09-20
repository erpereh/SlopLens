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
| Clasificación | Jev inicialmente |
| Embeddings | provider-agnostic |
| Search | provider-agnostic |
| Vision/multimodal | provider-agnostic |
| LLM complejo | provider-agnostic |
| Tests unitarios | Vitest |
| E2E | Playwright |
| Lint/format | Biome |
| CI | no GitHub Actions en el MVP |
| Cloud | no obligatorio |

## Arquitectura general

```text
                    SlopLens Extension
                      WXT + React
                        + beUI
                           │
                           ▼
                    Local Hono API
                  http://localhost:3001
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

## Estructura objetivo del repositorio

```text
sloplens/
├── apps/
│   ├── extension/
│   │   ├── entrypoints/
│   │   ├── components/
│   │   └── platform-adapters/
│   │
│   ├── api/
│   │   └── src/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── providers/
│   │       └── index.ts
│   │
│   └── web/
│
├── packages/
│   ├── ui/
│   ├── core/
│   ├── ai/
│   ├── platforms/
│   ├── shared/
│   └── config/
│
├── supabase/
│   ├── migrations/
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
└── package.json
```

La estructura puede evolucionar cuando exista código real, pero cualquier cambio estructural relevante debe actualizar este documento.

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

Dashboard/web independiente cuando sea necesario.

No es requisito para obtener valor del MVP; la extensión es la superficie principal.

### `packages/ui`

Componentes compartidos basados en beUI.

No debe convertirse en un sistema de diseño paralelo. beUI es la fuente visual.

### `packages/core`

Tipos y lógica de dominio independiente de proveedor y plataforma.

### `packages/ai`

Contratos y adapters para:

- decision/classification;
- embeddings;
- search;
- vision;
- reasoning.

### `packages/platforms`

Normalización y lógica común de adapters de plataformas.

### `packages/shared`

Utilidades compartidas sin lógica de dominio específica.

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

Contrato orientativo:

```ts
interface NormalizedContent {
  platform: Platform;
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

El core no debe depender del DOM específico de X o YouTube.

## Backend local

Hono + TypeScript es el backend principal del MVP.

URL orientativa:

```text
http://localhost:3001
```

Endpoints iniciales:

```text
GET  /health
POST /analyze
POST /verify
POST /trace
POST /related
```

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

Contrato orientativo:

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

Los detalles exactos pueden ajustarse tras pruebas. No tratar este ejemplo como API congelada.

## Provider interfaces

Las integraciones externas deben estar desacopladas.

Contratos conceptuales:

```ts
interface DecisionProvider {
  analyze(input: DecisionInput): Promise<ContentDecision>;
}

interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedMany(texts: string[]): Promise<number[][]>;
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

Jev es el `DecisionProvider` inicial, no una dependencia que deba filtrarse por todo el dominio.

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

Tablas iniciales propuestas:

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

Índice inicial preferido: HNSW.

El proveedor de embeddings debe poder cambiar sin reescribir el dominio.

Cuando cambie la dimensión o el modelo de embeddings, tratarlo como una migración de datos explícita.

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

- Las API keys viven en backend/local env, nunca en el bundle de la extensión.
- Incluir `.env.example`, nunca secretos reales.
- Validar inputs con Zod.
- No confiar en HTML/DOM externo.
- Sanitizar contenido renderizado.
- Reducir permisos del manifest al mínimo necesario.
- No almacenar contenido sensible si no es necesario.
- BYOK debe mantenerse local y documentado.

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
