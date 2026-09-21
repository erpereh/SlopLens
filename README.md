# SlopLens

**See beyond the slop.**

SlopLens es una extensión open source que añade contexto al contenido que consumes en Internet: slop/IA, clickbait, claims, fuentes, contenido relacionado y trazabilidad de la información.

Acciones centrales:

> **Analyze · Verify · Trace**

## Estado

MVP local en `main`: extensión WXT (X / YouTube) con chip `Slop · XX%`, sello/atenuado opcionales y panel Analyze · Verify · Trace; backend Hono; Supabase Local + pgvector (`vector(2048)` + HNSW `halfvec`); popup de controles del feed; dashboard de extensión (Resumen / X / YouTube / Ajustes) con historial local y SecretStore OS-first.

No existe `apps/web`; no es requisito del MVP.

## Arranque

Requisitos: Node 22+, pnpm 12, Docker Desktop para Supabase Local.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e   # Playwright: build MV3 + Chromium empaquetado + fixtures
pnpm harness    # UI de overlay sin cargar la extensión (http://127.0.0.1:4177)
```

Copiar `apps/api/.env.example` → `apps/api/.env` y `apps/extension/.env.example` → `apps/extension/.env`. La extensión solo admite `WXT_API_BASE_URL`; nunca secrets.

Con Docker Desktop en marcha:

```bash
npx supabase start
npx supabase db reset   # aplica migraciones, incluida content_embeddings vector(2048)
pnpm --filter @sloplens/api dev
```

En otro terminal:

```bash
pnpm --filter @sloplens/extension dev
```

Cargar la extensión empaquetada (Chrome / Edge unpacked) desde `apps/extension/.output/chrome-mv3` tras `pnpm --filter @sloplens/extension build`.

Puertos:

```text
SlopLens API       http://127.0.0.1:3001
PostgreSQL         localhost:54322
Supabase Studio    localhost:54323
```

Smoke real de providers (opcional, gasta cuota):

```bash
SLOPLENS_SMOKE=1 pnpm --filter @sloplens/ai test
```

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
