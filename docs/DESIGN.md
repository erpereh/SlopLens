# Diseño

Este documento define CÓMO debe verse y sentirse SlopLens.

Debe representar la dirección visual, UI y UX actual.

## Dirección visual

SlopLens debe sentirse:

- minimalista;
- moderno;
- limpio;
- técnico;
- rápido;
- discreto;
- accesible;
- integrado con la web sin confundirse con ella;
- animado cuando la animación aporta contexto;
- coherente entre extensión, paneles y dashboard.

La interfaz debe priorizar información y contexto sobre decoración.

## Estado actual de la UI

- Kit beUI público en `packages/ui`, montado en la extensión dentro de `sloplens-root` (Shadow DOM).
- Superficies: `SlopLensUiRoot` → `SlopLensShell` (badge compacto + panel/drawer con tabs Analyze · Verify · Trace · Sources · Related).
- Options usa `SlopLensSettingsForm`; las keys se envían al API y no se persisten en la extensión.
- En Shadow DOM el control de tema es `SlopLensThemeToggleButton` (el Theme Toggle de beUI opera sobre `document.documentElement` y no sirve aislado).
- Sustitutos locales porque el registry público devolvió 404: `button-base`, `number-ticker`, `agent-progress`. El resto del kit se instaló desde `@beui`.
- i18n en/es. Light / dark / system persistido en `chrome.storage.local`.
- Viewport estrecho (≤1024): el detalle pasa a drawer.
- El overlay compacto muestra loading/error de Analyze (no un vacío falso). Primary source y similares solo aparecen cuando Verify/Related han corrido.
- Verify muestra una señal de evidencia (`Backed by sources` / `Unverified` / etc.), nunca un veredicto absoluto.
- El panel de detalle en viewport ancho es un diálogo no modal (`aria-modal=false`) para no bloquear la página; a ≤1024 usa drawer.
- El drawer del overlay no bloquea el scroll de la página anfitriona.
- `sloplens-root` se limita a ~20rem de ancho para no empujar el layout del host.

No existe `apps/web` ni dashboard.

## Sistema visual: beUI

beUI público y gratuito es la fuente de verdad visual de SlopLens.

La aplicación debe utilizar sus componentes siempre que exista una opción exacta o razonablemente adaptable.

Regla central:

> **Si beUI tiene un componente que resuelve la necesidad, o uno parecido que pueda modificarse, se utiliza beUI como base antes de crear UI propia.**

## Regla beUI-first

Orden obligatorio:

```text
1. ¿Existe en beUI exactamente?
        ↓ sí
   usarlo

2. ¿Existe algo parecido/adaptable en beUI?
        ↓ sí
   instalarlo y modificarlo

3. ¿Puede resolverse componiendo varios componentes beUI?
        ↓ sí
   componerlos

4. Solo entonces:
   crear componente propio
```

No crear una versión custom por comodidad si ya existe una base útil en beUI.

Cuando sea necesario crear UI propia:

- reutilizar tokens existentes;
- respetar el lenguaje visual de beUI;
- respetar light/dark;
- respetar motion y reduced motion;
- mantener estados y accesibilidad equivalentes;
- evitar que parezca una librería distinta.

## Solo beUI gratuito

Permitido:

```text
@beui/*
https://beui.dev/*
https://beui.dev/r/{name}.json
```

No debe ser requisito:

```text
@beui-pro/*
BEUI_PRO_TOKEN
beUI Pro MCP
beUI Pro Agent Skill
componentes Pro de pago
```

SlopLens debe seguir siendo completamente open source y utilizable sin licencias de UI de pago.

## Registry público

`components.json` deberá permitir el registry público:

```json
{
  "registries": {
    "@beui": "https://beui.dev/r/{name}.json"
  }
}
```

Instalación típica:

```bash
npx shadcn@latest add @beui/button
npx shadcn@latest add @beui/tabs
npx shadcn@latest add @beui/drawer
npx shadcn@latest add @beui/number-ticker
```

Los agentes deben comprobar el nombre real del componente en la documentación antes de instalarlo. No inventar slugs.

Los componentes instalados pasan a formar parte del código del proyecto y pueden adaptarse.

## Workflow de UI para agentes

Antes de implementar una superficie:

1. Entender qué información debe mostrar.
2. Revisar este documento.
3. Buscar componentes públicos de beUI que encajen.
4. Revisar su `Usage`/API.
5. Instalar el componente exacto.
6. Reutilizar un componente ya instalado antes de instalar otro parecido.
7. Componer antes de rediseñar.
8. Adaptar únicamente lo necesario.
9. Validar light/dark.
10. Validar teclado/foco.
11. Validar `prefers-reduced-motion`.
12. Actualizar este documento si cambia una regla visual del proyecto.

Referencias:

```text
https://beui.dev/
https://beui.dev/components/motion
https://beui.dev/docs/openui
https://github.com/starc007/ui-components/blob/main/AGENTS.md
```

## Tema

SlopLens tendrá desde el MVP:

- light;
- dark;
- system.

La preferencia debe persistirse.

En superficies propias debe utilizarse como base el Theme Toggle público de beUI y su transición animada cuando sea compatible.

Requisitos:

- transición coherente con beUI;
- respetar `prefers-reduced-motion`;
- contraste correcto en ambos temas;
- no depender solo del color;
- no producir flashes de tema incorrecto al cargar.

## Shadow DOM y aislamiento

La extensión se inyectará sobre páginas como X y YouTube.

La UI inyectada debe usar Shadow DOM para evitar colisiones.

```text
Página anfitriona
        │
        └── <sloplens-root>
               #shadow-root
                    │
                    ├── beUI
                    ├── tokens
                    ├── tema
                    └── SlopLens UI
```

La página anfitriona no debe romper estilos de SlopLens y SlopLens no debe contaminar la página.

## Principios de diseño

### 1. Mínima intrusión

SlopLens no debe dominar visualmente la plataforma.

Por defecto mostrar:

- una señal compacta;
- un badge;
- un pequeño control;
- un estado.

El detalle se abre bajo demanda.

Ejemplo:

```text
⚠ Claim sin fuente    [Open]
```

### 2. Información antes que decoración

No añadir cards, bordes, gradientes o animaciones sin una función clara.

### 3. Progressive disclosure

La jerarquía debe ser:

```text
señal
  ↓
resumen
  ↓
evidencia
  ↓
detalle / fuentes / relaciones
```

No mostrar todas las métricas al mismo tiempo.

### 4. La incertidumbre debe verse

Diferenciar visualmente:

- detectado;
- probable;
- sin verificar;
- contradictorio;
- respaldado;
- desconocido.

Sin usar diseño que parezca sentencia absoluta cuando el resultado es probabilístico.

### 5. Consistencia entre plataformas

X y YouTube pueden necesitar layouts distintos, pero deben compartir:

- tokens;
- componentes;
- semántica;
- iconografía;
- estados;
- lenguaje de motion.

## Jerarquía de acciones

Las tres acciones principales son:

### Analyze

¿Qué estoy viendo?

### Verify

¿Qué evidencia existe?

### Trace

¿De dónde viene?

Cuando aparezcan juntas, mantener este orden:

```text
Analyze · Verify · Trace
```

## Superficie compacta

Ejemplo conceptual:

```text
┌──────────────────────────────┐
│ SlopLens                     │
│                              │
│ AI/Slop            82%       │
│ Clickbait           91%       │
│ Claim               detected  │
│ Primary source      none      │
│ Similar             37        │
│                              │
│ Analyze · Verify · Trace      │
└──────────────────────────────┘
```

No tomar estos números como estilo definitivo; ilustran jerarquía.

## Componentes beUI prioritarios

Cuando encajen:

### Badges / status

Para:

- AI Slop;
- Clickbait;
- Claim;
- Spam;
- Source;
- Verified;
- Unverified;
- Contradicted.

### Number ticker (`number-ticker`)

Para scores y contadores. El slug público `number-ticker` no estaba disponible en el registry (404); el proyecto usa un sustituto local con la misma función (no usar `animated-number` como nombre por defecto):

```text
Slop       82%
Clickbait  91%
Similar    37
```

### Tabs

Para:

```text
Analyze
Verify
Trace
Sources
Related
```

### Drawer

Para expandir información sin sacar al usuario de la página.

### Toast

Para eventos puntuales:

```text
Source found
Verification updated
12 similar posts detected
```

### Loaders / estados de agente

Solo para progreso real:

```text
Analyzing…
Searching sources…
Comparing claims…
Tracing origin…
```

No inventar porcentajes de progreso si el backend no los conoce.

### Sidebar

Para dashboard o superficies amplias.

## Colores

No fijar una paleta paralela mientras beUI ya aporte tokens adecuados.

Usar tokens semánticos.

Necesitamos estados como:

- neutral;
- info;
- positive;
- warning;
- negative;
- unknown.

Nunca depender únicamente de rojo/verde para comunicar significado.

Los estados deben combinar:

- texto;
- icono;
- etiqueta;
- color como refuerzo.

## Tipografía

Usar la tipografía y jerarquía compatibles con el stack visual de beUI salvo que se tome una decisión explícita posterior.

Prioridades:

- legibilidad;
- densidad compacta;
- diferenciación clara entre dato, etiqueta y evidencia;
- tamaños adecuados dentro de overlays pequeños.

No introducir tipografías decorativas en el MVP.

## Layout

### Overlay en plataforma

- compacto;
- respetar el contenido anfitrión;
- evitar bloquear acciones nativas;
- no ocupar ancho excesivo;
- permitir cerrar/colapsar;
- no alterar el layout original de la página más de lo necesario.

### Drawer/panel

- detalle estructurado;
- navegación clara;
- tabs cuando haya varias vistas;
- fuentes y evidencia fácilmente escaneables.

### Dashboard

Si se implementa:

- mayor densidad;
- clusters;
- historial;
- filtros;
- gráficos solo cuando aporten comprensión.

## Motion

La animación debe explicar:

- aparición/desaparición;
- cambio de estado;
- expansión;
- cambio de tema;
- carga;
- transición entre vistas.

Evitar:

- motion constante;
- animaciones decorativas repetitivas;
- rebotes innecesarios;
- transiciones largas;
- efectos que dificulten leer scores o fuentes.

Usar el lenguaje de motion de beUI.

Respetar siempre `prefers-reduced-motion`.

## Responsive

SlopLens debe funcionar en distintos tamaños de viewport.

- No limitarse a apilar layouts de escritorio.
- Mantener touch targets adecuados.
- Evitar overflow horizontal.
- Replantear jerarquía cuando el espacio sea pequeño.
- El overlay debe poder transformarse en drawer/panel si el ancho es insuficiente.

## Accesibilidad

- Contraste suficiente.
- Focus visible.
- Navegación por teclado.
- Semántica HTML cuando aplique.
- Etiquetas accesibles.
- No depender solo del color.
- No usar iconos sin texto/tooltip cuando su significado no sea universal.
- Respetar `prefers-reduced-motion`.
- Evitar animaciones que impidan leer.
- El tema oscuro no debe reducir legibilidad de evidencia o fuentes.

## Semántica de confianza

Ejemplos recomendados:

- `Respaldado por fuentes`
- `Sin verificar`
- `Evidencia contradictoria`
- `Contradicho por la fuente original`
- `Opinión`
- `Afirmación verificable`
- `Información insuficiente`

Evitar:

- `100% real`
- `100% fake`
- `mentira`
- `verdad absoluta`

salvo que se esté citando literalmente una fuente que use ese término y sea relevante.

## Estados de error

Los errores no deben parecer resultados de análisis.

Diferenciar claramente:

- no se pudo analizar;
- backend local desconectado;
- proveedor sin configurar;
- rate limit;
- fuente inaccesible;
- transcripción no disponible;
- evidencia insuficiente.

Debe existir una acción clara de reintento o configuración cuando proceda.

## Vacíos

Cuando no haya datos:

- explicar qué falta;
- no rellenar con valores falsos;
- no mostrar `0%` cuando realmente significa “no calculado”.

## i18n

La UI debe prepararse para traducción desde el principio.

Idiomas iniciales:

- English;
- Español.

No hardcodear textos repetidos dentro de componentes si pueden formar parte del sistema de traducción.

## Evitar

- mezclar beUI con otra librería visual para resolver componentes equivalentes;
- exceso de cards;
- exceso de gradientes;
- glassmorphism innecesario;
- bordes decorativos sin función;
- animaciones excesivas;
- dashboards que parezcan más importantes que el contenido;
- scores sin explicación;
- colores sin texto;
- UI custom cuando existe un componente beUI adaptable;
- estilos genéricos que rompan la identidad.

## Notas

Este archivo describe la experiencia visual ACTUAL.

La funcionalidad pertenece a `PRODUCT.md`.

La implementación técnica pertenece a `ARCHITECTURE.md`.

Si una decisión visual cambia, el agente que la cambie debe actualizar este documento en la misma tarea.
