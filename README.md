# SlopLens

**See beyond the slop.**

SlopLens es una extensión open source que añade contexto al contenido que consumes en Internet: slop/IA, clickbait, claims, fuentes, contenido relacionado y trazabilidad de la información.

Acciones centrales:

> **Analyze · Verify · Trace**

## Estado

Proyecto en fase inicial de diseño e implementación.

MVP:

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
