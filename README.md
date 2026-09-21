# SlopLens

**See beyond the slop.**

SlopLens es una extensión open source que añade contexto al contenido que consumes en Internet: slop/IA, clickbait, claims, fuentes, contenido relacionado y trazabilidad de la información.

Acciones centrales:

> **Analyze · Verify · Trace**

## Estado

Gate 0: monorepo y contratos compartidos. Aún no hay servidor Hono, overlays ni columnas `vector(N)`.

MVP previsto:

- X / Twitter.
- YouTube.
- Extensión WXT + React.
- UI beUI.
- Backend local Hono.
- Supabase Local + PostgreSQL + pgvector.
- Docker.
- Jev como clasificador/router inicial.
- Sin suscripciones ni paywalls.
- Sin cloud obligatorio.
- Sin `apps/web` en el MVP.

## Arranque

Requisitos: Node 22+, pnpm 12. Docker Desktop hace falta más adelante para `supabase start`, no para typecheck.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Cuando Docker Desktop esté en marcha (Foundation / G1):

```bash
supabase start
pnpm dev
```

La migración actual solo habilita la extensión `vector`. No crea `vector(N)` ni HNSW.

Los `.env` locales viven en `apps/api/.env` y `apps/extension/.env` (ignorados). Copiar desde los `.env.example`. La extensión solo admite `WXT_API_BASE_URL`; nunca secrets.

## Documentación

La documentación es la fuente persistente de contexto entre agentes:

- [`docs/PRODUCT.md`](docs/PRODUCT.md) — producto, funcionalidades, alcance y roadmap.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arquitectura y decisiones técnicas.
- [`docs/DESIGN.md`](docs/DESIGN.md) — UI, UX y reglas beUI.
- [`AGENTS.md`](AGENTS.md) — cómo debe trabajar cualquier agente dentro del repositorio.

## Filosofía

- Open source.
- Local-first.
- beUI-first.
- Provider-agnostic.
- Contexto antes que veredicto.
- Arquitectura simple antes que infraestructura prematura.
