# AGENTS.md

## Objetivo

Este archivo define cómo debe trabajar cualquier agente de IA dentro de SlopLens.

Su finalidad es mantener consistencia entre agentes, evitar decisiones contradictorias y garantizar que el código y la documentación representen siempre el estado actual del proyecto.

## Flujo de trabajo

Antes de modificar código:

1. Entender exactamente el cambio solicitado.
2. Revisar el código existente relacionado con la tarea.
3. Identificar qué documentación es relevante.
4. Leer solo la documentación necesaria.
5. Respetar las decisiones ya cerradas.
6. Modificar únicamente lo necesario.
7. Validar el resultado.
8. Actualizar automáticamente la documentación afectada antes de finalizar.

## Carga de contexto

No leer toda la documentación por defecto.

- Leer `docs/PRODUCT.md` cuando la tarea afecte a funcionalidad, comportamiento, reglas de negocio, usuarios, alcance, plataformas soportadas o roadmap.
- Leer `docs/ARCHITECTURE.md` cuando la tarea afecte a arquitectura, flujo de datos, dependencias, backend, base de datos, IA, Docker, estructura del proyecto, APIs o integraciones.
- Leer `docs/DESIGN.md` cuando la tarea afecte a UI, UX, estilos, responsive, componentes visuales, temas, animaciones o accesibilidad.
- Leer varios documentos solo cuando la tarea realmente afecte a varias áreas.
- Para cambios pequeños y aislados, revisar directamente el código relacionado y el documento que gobierna esa parte si existe.

## Fuentes de verdad

Cada documento tiene una responsabilidad concreta:

- `docs/PRODUCT.md`: qué es SlopLens, qué debe hacer, reglas de producto, alcance actual y futuro.
- `docs/ARCHITECTURE.md`: cómo está construido técnicamente y qué decisiones de implementación están vigentes.
- `docs/DESIGN.md`: cómo debe verse y comportarse visualmente.
- El código representa la implementación real actual.

No duplicar la misma decisión con explicaciones distintas en varios documentos. Cuando una decisión afecte a varias áreas, documentar el detalle en su fuente principal y referenciarla desde las demás si hace falta.

Si el código y la documentación se contradicen, no asumir silenciosamente que uno de los dos es correcto. Analizar la discrepancia y dejar ambos coherentes con la decisión actual.

## Persistencia entre agentes

La documentación es la memoria persistente del proyecto entre agentes.

Por tanto:

- Si una tarea cambia una funcionalidad, regla, plataforma, alcance o comportamiento observable, actualizar `docs/PRODUCT.md` en la misma tarea.
- Si una tarea cambia arquitectura, stack, dependencias, estructura, flujo de datos, persistencia, proveedores, endpoints o despliegue, actualizar `docs/ARCHITECTURE.md` en la misma tarea.
- Si una tarea cambia UI, UX, componentes, tema, animaciones, responsive, accesibilidad o reglas visuales, actualizar `docs/DESIGN.md` en la misma tarea.
- Si una tarea afecta a varias áreas, actualizar todos los documentos afectados.
- No esperar a que el usuario pida explícitamente actualizar la documentación.
- Una tarea no se considera terminada si deja documentación relevante desactualizada.
- No usar estos documentos como changelog. Deben describir el estado ACTUAL.
- Eliminar o reescribir información obsoleta cuando una decisión cambie.
- No añadir decisiones futuras como si ya estuvieran implementadas. Colocarlas en `Futuro`, `Fuera de alcance` o una sección equivalente.

Cambios puramente internos que no alteren producto, arquitectura ni diseño no necesitan modificar documentación.

## Reglas generales

- Reutilizar código existente antes de crear nuevas abstracciones.
- Seguir los patrones ya existentes en el proyecto.
- No modificar funcionalidad no relacionada con la tarea.
- No introducir nuevas dependencias salvo que sean necesarias.
- No duplicar lógica existente.
- Mantener los cambios pequeños, claros y enfocados.
- Evitar sobreingeniería.
- Preferir soluciones simples, mantenibles y coherentes con el proyecto.
- No inventar arquitectura, componentes o patrones si ya existe una solución equivalente.
- No implementar funcionalidades fuera del alcance definido en `docs/PRODUCT.md` salvo que se solicite explícitamente.
- Respetar la filosofía local-first, open-source-first y provider-agnostic descrita en `docs/ARCHITECTURE.md`.
- No hardcodear proveedores o modelos concretos en lógica de dominio; deben vivir en adapters, defaults o configuración.

## Regla de UI: beUI-first

Cuando una tarea incluya UI:

1. Leer `docs/DESIGN.md`.
2. Buscar primero si existe un componente equivalente en el catálogo público y gratuito de beUI.
3. Si no existe uno exacto, buscar uno parecido que pueda adaptarse.
4. Si existe, instalarlo desde el registry público `@beui` y modificarlo si hace falta.
5. Intentar componer componentes beUI antes de crear uno nuevo.
6. Crear UI propia solo cuando no exista una base razonablemente adaptable.
7. Mantener el lenguaje visual, motion, accesibilidad, light/dark y estados de beUI.
8. No usar `@beui-pro`, `BEUI_PRO_TOKEN`, MCP Pro ni componentes de pago como requisito del proyecto.

La UI completa de SlopLens debe sentirse como una aplicación construida sobre beUI, no como una mezcla de librerías visuales.

## Decisiones que no deben reabrirse sin petición explícita

Para el MVP están cerradas, entre otras, estas decisiones:

- Extensión con WXT, React y TypeScript.
- Manifest V3.
- UI aislada mediante Shadow DOM cuando se inyecte sobre páginas externas.
- beUI público/gratuito como sistema visual.
- Modo light, dark y system.
- Monorepo con pnpm workspaces y Turborepo.
- Backend local con Hono + TypeScript.
- Supabase Local mediante Docker.
- PostgreSQL + pgvector.
- Sin Supabase Cloud obligatorio.
- Sin Supabase Edge Functions en el MVP.
- Sin GitHub Actions en el MVP.
- Jev como clasificador/router inicial.
- Proveedores de IA, embeddings, búsqueda y multimodal desacoplados mediante interfaces.
- Ningún proveedor concreto es obligatorio: los `.env` son solo defaults de bootstrap y la configuración debe poder evolucionar/operar desde la propia app.

Si una tarea requiere cambiar una de estas decisiones, hacerlo solo si el usuario lo pide o si existe una incompatibilidad técnica demostrable. En ese caso, actualizar `docs/ARCHITECTURE.md`.

## Idioma

- La documentación del proyecto debe escribirse en español.
- Los nombres de variables, funciones, componentes, tipos, rutas y archivos de código deben mantenerse en inglés.
- Los nombres oficiales de librerías, frameworks, APIs y tecnologías no deben traducirse.
- La interfaz de usuario debe prepararse para i18n desde el inicio, con inglés y español como idiomas iniciales.

## Validación

Antes de finalizar una tarea:

- Revisar los archivos modificados.
- Comprobar que no se hayan introducido cambios no relacionados.
- Ejecutar typecheck, lint, build o tests relevantes cuando existan y tenga sentido.
- Comprobar que el comportamiento implementado coincide con `docs/PRODUCT.md`.
- Comprobar que la arquitectura real coincide con `docs/ARCHITECTURE.md`.
- Comprobar que la UI coincide con `docs/DESIGN.md`.
- Confirmar que la documentación afectada se ha actualizado.
- No afirmar que una tarea está completada sin haber validado el cambio relevante.
