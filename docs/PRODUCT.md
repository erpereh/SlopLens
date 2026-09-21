# Producto

Este documento describe QUÉ es SlopLens, PARA QUÉ existe y QUÉ debe hacer.

Debe representar el estado actual del producto y su alcance. Los detalles técnicos pertenecen a `ARCHITECTURE.md` y las reglas visuales a `DESIGN.md`.

## Resumen

SlopLens es una capa inteligente, gratuita y open source de contexto para Internet.

Su objetivo es analizar el contenido que el usuario está consumiendo y añadir señales útiles sobre:

- slop y contenido generado o asistido por IA;
- clickbait, ragebait y engagement bait;
- spam y publicidad encubierta;
- afirmaciones verificables;
- fuentes y evidencia;
- contenido repetido o reciclado;
- publicaciones y vídeos relacionados;
- origen y propagación de una información;
- diferencias entre una fuente original y sus reinterpretaciones;
- calidad informativa;
- posibles spoilers.

SlopLens no pretende decidir qué debe creer el usuario. Debe aportar contexto, evidencia y trazabilidad para que el usuario pueda decidir por sí mismo.

Tagline principal:

> **See beyond the slop.**

Acciones centrales:

> **Analyze · Verify · Trace**

## Propósito

Internet produce y redistribuye contenido a una velocidad en la que es difícil distinguir:

- qué aporta información nueva;
- qué es una copia o reformulación;
- qué está exagerado;
- qué tiene una fuente real;
- qué contiene una afirmación verificable;
- qué se ha generado o amplificado de forma automática;
- qué merece una investigación adicional;
- de dónde salió originalmente una historia.

SlopLens existe para añadir esa capa de contexto directamente sobre el contenido que el usuario ya está viendo.

## Problema que resuelve

El usuario se encuentra constantemente con:

- contenido generado en masa;
- publicaciones formulaicas;
- titulares desproporcionados;
- vídeos con mucho relleno;
- afirmaciones sin fuente;
- noticias antiguas publicadas como si fueran nuevas;
- la misma historia repetida en muchas cuentas;
- contenido copiado entre plataformas;
- información que cambia o se exagera a medida que se propaga.

Las herramientas existentes suelen resolver una única parte del problema: detectar texto IA, verificar claims, bloquear spam o buscar fuentes.

SlopLens quiere unir esas señales en una sola experiencia.

## Principios de producto

### 1. Contexto antes que veredicto

SlopLens no debe presentar una inferencia de IA como una verdad absoluta.

Evitar:

> ❌ FALSO

Preferir estados como:

- 🟢 Respaldado por fuentes.
- 🟡 Sin verificar.
- 🟠 Evidencia contradictoria.
- 🔴 Contradicho por la fuente original.
- 🔵 Opinión.
- 🟣 Afirmación verificable.
- ⚪ No hay suficiente información.

Cuando exista evidencia, el usuario debe poder verla.

### 2. Mostrar incertidumbre

Los scores y clasificaciones son señales, no certezas.

Especialmente para detección de contenido generado por IA, slop, intención o clickbait, la UI debe evitar presentar probabilidades como hechos.

### 3. Fuente primaria primero

Cuando SlopLens investigue una afirmación debe priorizar:

1. fuente primaria;
2. organismo oficial;
3. paper o documentación;
4. empresa o persona directamente implicada;
5. agencias de noticias;
6. medios fiables;
7. otras fuentes secundarias.

No debe usar otros posts como única evidencia cuando exista una fuente primaria accesible.

### 4. Análisis bajo demanda y no intrusivo

La extensión debe mostrar la mínima señal necesaria y permitir profundizar cuando el usuario lo pida. En el overlay compacto eso se traduce en un chip con una sola señal resumida (no una card con todas las métricas); el resumen “qué estás viendo” y las puntuaciones viven en el panel expandido. Verify muestra fuentes en el propio tab cuando existen.

### 5. Gratuito y abierto

SlopLens es un proyecto open source.

No habrá:

- suscripciones;
- planes Free/Pro;
- paywalls;
- funciones bloqueadas por pago;
- licencias comerciales necesarias para desbloquear características.

## Usuarios

### Usuario de la extensión

Puede:

- analizar contenido visible;
- ver señales de slop, clickbait, spam o engagement bait;
- detectar claims;
- verificar afirmaciones;
- consultar fuentes;
- rastrear el origen de una historia;
- ver contenido relacionado;
- filtrar o atenuar contenido según sus preferencias;
- usar modo claro, oscuro o sistema;
- guardar preferencias si en el futuro usa cuenta.

El MVP debe poder funcionar sin obligar al usuario a crear una cuenta.

### Colaborador / self-hoster

Puede:

- clonar el repositorio;
- ejecutar backend y datos en local;
- usar sus propias API keys;
- cambiar proveedores;
- usar modelos locales cuando sea posible;
- añadir plataformas;
- añadir detectores;
- contribuir al proyecto.

## Configuración de proveedores

SlopLens no debe estar atado a ningún proveedor de IA, embeddings, búsqueda, visión o razonamiento.

Durante el desarrollo inicial los proveedores y modelos pueden definirse mediante variables de entorno para facilitar el bootstrap local, pero esa no será la experiencia final del producto.

La aplicación deberá permitir configurar desde su propia interfaz:

- proveedor de clasificación/decision;
- modelo de clasificación;
- proveedor de embeddings;
- modelo de embeddings;
- proveedor de búsqueda web;
- proveedor de visión/multimodal;
- modelo de visión;
- proveedor de razonamiento;
- modelo de razonamiento;
- API keys o credenciales BYOK cuando sean necesarias;
- endpoints/base URLs compatibles cuando el proveedor permita configurarlos;
- modelos locales cuando exista soporte.

El usuario deberá poder cambiar estas opciones sin editar manualmente archivos `.env`.

Principios:

- ningún proveedor debe convertirse en requisito funcional de SlopLens;
- los proveedores configurados inicialmente son defaults de desarrollo, no dependencias permanentes;
- cambiar de proveedor no debe obligar a reescribir la lógica de producto;
- las credenciales introducidas por el usuario deben gestionarse como secretos y no exponerse en la UI ni en el bundle de la extensión;
- cuando un proveedor no esté configurado, SlopLens debe degradar la funcionalidad de forma explícita en vez de fallar silenciosamente;
- cuando sea posible, se deben soportar alternativas gratuitas, open source o locales;
- la configuración debe distinguir entre proveedor y modelo para permitir cambiar ambos de forma independiente.

La filosofía es:

> **Bring your own provider. SlopLens aporta la capa de producto; el usuario decide qué modelos y servicios utiliza.**

## Acciones universales

### Analyze

Analiza el contenido actual.

Puede detectar o puntuar:

- AI/slop;
- clickbait;
- ragebait;
- engagement bait;
- spam;
- publicidad;
- contenido reciclado;
- claims;
- opinión;
- noticias;
- contenido informativo;
- posibles spoilers;
- posible necesidad de verificación;
- posible duplicidad;
- calidad informativa.

### Verify

Investiga una afirmación verificable.

Debe buscar:

- fuente oficial;
- fuente primaria;
- noticias relacionadas;
- documentos;
- papers;
- cobertura independiente;
- evidencia a favor;
- evidencia en contra;
- fecha de la información.

El resultado debe explicar qué evidencia se encontró y permitir abrir las fuentes.

### Trace

Busca el origen y las relaciones del contenido.

Debe intentar responder:

- ¿Dónde apareció primero?
- ¿Qué fuente primaria existe?
- ¿Qué publicaciones derivan de ella?
- ¿Qué versiones similares existen?
- ¿Cómo ha cambiado el mensaje?
- ¿Se ha exagerado o reinterpretado?
- ¿Qué plataformas lo están repitiendo?

## Funcionalidades principales

## X / Twitter

X es una de las plataformas objetivo del MVP.

### Slop / AI-assisted

Detectar patrones compatibles con:

- contenido generado o asistido por IA;
- producción masiva;
- escritura formulaica;
- posts repetitivos;
- optimización artificial para engagement.

La salida nunca debe presentarse como certeza de autoría.

### Engagement bait y ragebait

Detectar patrones como:

- promesas exageradas;
- urgencia artificial;
- llamadas forzadas a comentar;
- “this changes everything”;
- “nobody is talking about this”;
- contenido diseñado principalmente para provocar interacción.

### Claims

Detectar automáticamente afirmaciones verificables y permitir lanzar `Verify`.

### Fuente original

Intentar localizar:

- comunicado;
- paper;
- tweet/post original;
- blog;
- artículo;
- entrevista;
- vídeo;
- documento.

### Posts similares

Agrupar publicaciones semánticamente equivalentes aunque no usen las mismas palabras.

### Información reciclada

Detectar cuando una historia antigua se presenta como nueva.

### Propagación

A futuro, visualizar:

- primera aparición encontrada;
- hora;
- número de copias;
- cuentas que amplificaron el contenido;
- variantes;
- velocidad de propagación.

## YouTube

YouTube es la segunda plataforma objetivo del MVP.

### Clickbait

Analizar conjuntamente:

- título;
- thumbnail;
- descripción;
- transcripción;
- contenido real del vídeo cuando sea accesible.

Debe estimar si el título o miniatura representan fielmente el contenido.

### Coherencia título/contenido

Mostrar una señal de coherencia entre el packaging del vídeo y lo que realmente explica.

### Información útil vs relleno

A partir de la transcripción, identificar:

- introducciones largas;
- promociones;
- repeticiones;
- relleno;
- partes informativas;
- conclusiones.

### Timeline inteligente

Detectar segmentos como:

- contexto;
- opinión;
- claim sin fuente;
- información principal;
- patrocinio;
- fuente primaria.

### Save me time

Permitir identificar los tramos con mayor densidad de información útil.

### Vídeos relacionados

Detectar vídeos que hablan esencialmente de la misma historia.

### Originalidad

Estimar cuánto contenido nuevo aporta respecto a piezas anteriores relacionadas.

## Plataformas futuras

No forman parte del primer MVP, pero el producto está diseñado para ampliarse.

### TikTok / Reels / Shorts

Posibles análisis:

- clips reciclados;
- contenido fuera de contexto;
- voz o imagen generada;
- claims virales;
- clickbait;
- contenido copiado;
- fuente original;
- vídeos relacionados.

### Reddit

Posibles análisis:

- reposts;
- spam;
- astroturfing;
- promoción encubierta;
- claims;
- contenido copiado;
- narrativas repetidas;
- posibles patrones coordinados.

### LinkedIn

Posibles análisis:

- AI slop;
- posts formulaicos;
- engagement farming;
- publicaciones copiadas;
- promoción encubierta;
- noticias reescritas.

### Noticias y medios

Posibles análisis:

- titular frente a contenido;
- fuente primaria;
- evidencias citadas;
- fecha real de la información;
- cobertura relacionada;
- contenido reciclado;
- claims principales.

### Blogs y web general

Posibles análisis:

- SEO slop;
- contenido masivo;
- ausencia de fuentes;
- contenido copiado;
- afiliación;
- publicidad encubierta;
- información desactualizada.

## Contexto entre plataformas

Una de las metas diferenciales de SlopLens es no tratar cada plataforma como un silo.

Ejemplo conceptual:

```text
Fuente primaria
      │
      ├── X
      ├── Reddit
      ├── YouTube
      └── TikTok
```

El producto debe poder relacionar distintas piezas que hablen del mismo hecho.

## Deformación de una historia

SlopLens debe poder representar, cuando exista evidencia suficiente, cómo cambia una afirmación.

Ejemplo:

```text
Fuente original
      ↓
Interpretación
      ↓
Exageración
      ↓
Afirmación distinta
```

No debe inferir malicia. Debe describir diferencias observables entre versiones.

## Clustering semántico

Agrupar contenido relacionado por tema o claim.

Ejemplo:

```text
Cluster
├── X
├── Reddit
├── YouTube
├── TikTok
└── Web
```

Los clusters pueden alimentar:

- contenido relacionado;
- detección de duplicados;
- búsqueda de origen;
- narrativas;
- reutilización de verificaciones.

## Narrativas

A futuro, detectar temas o claims que aparecen repetidamente y seguir:

- primera aparición;
- crecimiento;
- variantes;
- comunidades/plataformas;
- fuentes;
- nueva evidencia.

## Feed Quality

Posible vista de calidad del feed:

- contenido normal;
- engagement bait;
- AI slop;
- spam;
- claims sin fuente;
- contenido repetido.

Debe usarse como resumen informativo, no como puntuación moral del usuario.

## Filtros personalizados

El usuario podrá decidir qué quiere:

- marcar;
- atenuar;
- ocultar;
- dejar sin cambios.

Categorías posibles:

- AI slop;
- clickbait;
- noticias repetidas;
- spam;
- publicidad;
- spoilers.

El filtrado debe ser configurable y reversible.

## Spoilers

Función futura.

El usuario podría indicar su progreso en:

- anime;
- series;
- manga;
- películas;
- videojuegos;
- eventos deportivos grabados.

SlopLens podría ocultar o advertir sobre contenido potencialmente posterior al progreso marcado.

## “Why am I seeing this?”

Clasificación rápida del contenido:

- información;
- opinión;
- promoción;
- engagement bait;
- contenido reciclado;
- meme;
- noticia;
- spam;
- AI slop.

## Flujo principal de usuario

MVP:

```text
Usuario navega por X o YouTube
        ↓
SlopLens detecta contenido visible
        ↓
análisis ligero
        ↓
muestra señal mínima si es relevante
        ↓
usuario puede abrir detalle
        ↓
Analyze / Verify / Trace
        ↓
fuentes, relacionados y contexto
```

No debe ser obligatorio abrir un dashboard para obtener valor.

## Sistema de confianza

En lugar de una única etiqueta, SlopLens puede mostrar componentes separados como:

- fuente primaria encontrada;
- número de fuentes independientes;
- evidencia a favor;
- evidencia en contra;
- antigüedad;
- existencia de contradicciones;
- nivel de confianza de la clasificación.

## Reglas de negocio

- Ninguna inferencia de IA por sí sola debe presentarse como prueba factual.
- Las verificaciones deben mostrar fuentes cuando existan.
- Debe distinguirse entre hecho, opinión e inferencia.
- Si no hay evidencia suficiente, decirlo.
- Los scores deben entenderse como señales.
- El usuario mantiene el control sobre ocultar o mostrar contenido.
- El análisis automático debe intentar minimizar coste y latencia.
- Si un análisis ya existe y sigue siendo válido, puede reutilizarse.
- El contenido visible en el navegador es la fuente principal de entrada del MVP.
- SlopLens no debe necesitar indexar Internet completo para funcionar.
- No se debe exigir cuenta para el flujo básico del MVP.
- Todas las funciones del repositorio son gratuitas y abiertas.
- Los proveedores externos son intercambiables y deben poder configurarse desde la aplicación; los `.env` solo actúan como bootstrap/defaults durante el desarrollo inicial.

## Alcance actual del MVP

Implementado ahora:

- Extensión WXT en X / YouTube con overlay Analyze · Verify · Trace · Sources · Related.
- El overlay, popup y Options hablan con Hono a través del service worker; la página de X o YouTube no hace fetch a localhost.
- Backend local Hono con esas rutas (ya no son stubs 501).
- Settings de proveedores en Options; keys en SecretStore del SO (archivo local solo como fallback etiquetado).
- Vision del thumbnail de YouTube cuando Jev lo pide o la plataforma es YouTube.
- Related vía embeddings pgvector (N=2048 verificada).
- Trace básico: búsqueda + vecinos + `content_relations`; sin mapa de propagación.

### Plataformas

- X / Twitter.
- YouTube.

### Funciones

- análisis de slop;
- engagement bait;
- clickbait;
- detección de claims;
- spam;
- clasificación de tipo de contenido;
- búsqueda de fuente original;
- contenido relacionado mediante embeddings;
- `Analyze`;
- `Verify`;
- `Trace` básico;
- light/dark/system;
- interfaz no intrusiva integrada en las páginas.

### Proyecto

- extensión local;
- backend local;
- base de datos local;
- BYOK para APIs externas;
- configuración de proveedores preparada para evolucionar desde defaults de `.env` hacia ajustes gestionados desde la propia app;
- sin dependencia cloud obligatoria.

## Fuera de alcance del MVP

- indexar o scrapear masivamente X, YouTube o Internet;
- TikTok;
- Instagram;
- LinkedIn;
- análisis global de narrativas en tiempo real;
- mapa completo de propagación;
- detección avanzada de coordinación;
- B2B;
- monetización;
- suscripciones;
- paywalls;
- backend cloud obligatorio;
- Supabase Cloud obligatorio;
- Supabase Edge Functions;
- GitHub Actions;
- infraestructura distribuida;
- Kubernetes;
- microservicios;
- Redis;
- una base vectorial externa.

## Futuro

### Fase 2

- Reddit.
- Bluesky.
- web general.
- noticias.
- clustering global mejorado.

### Fase 3

- TikTok.
- Instagram.
- LinkedIn.
- knowledge graph.
- narrativas.

### Fase 4

- alertas;
- tendencias;
- API;
- monitorización de temas;
- investigación y OSINT;
- herramientas avanzadas para periodismo y comunidades.

## Knowledge Graph

A largo plazo, SlopLens puede construir relaciones como:

```text
Claim
 ├── Source
 ├── Post
 ├── Article
 ├── Video
 └── Thread
```

Relaciones conceptuales:

- originates_from;
- cites;
- copies;
- paraphrases;
- supports;
- contradicts;
- exaggerates;
- derived_from;
- related_to.

La meta final es poder responder:

> ¿De dónde ha salido realmente esta historia?

## Notas

Este archivo describe el producto ACTUAL y su roadmap.

No introducir aquí detalles de implementación que pertenezcan a `ARCHITECTURE.md`.

No introducir aquí decisiones visuales detalladas que pertenezcan a `DESIGN.md`.
