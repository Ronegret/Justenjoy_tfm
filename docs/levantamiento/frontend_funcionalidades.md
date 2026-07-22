# Frontend — Catálogo exhaustivo de funcionalidades (Just Enjoy)

> **Alcance:** portal web del viajero (`frontend/`, Next.js 16 App Router). Descubierto
> del código, no de la documentación (Pasada A a ciegas; Pasada B contrasta con
> `00_inventario_tecnico.md` al final). Cada afirmación no trivial cita `fichero:línea`.
> No se modificó ningún fuente. El build se ejecutó en modo solo-lectura de fuentes.
>
> **Fecha:** 2026-07-21 · **Rama:** `develop` · **Commit base:** `dd4fe76`
>
> **Doble eje de etiquetado** (independientes, no se colapsan):
> - **CONEXIÓN:** CONECTADO / MAL-CABLEADO / HUÉRFANO / AUSENTE.
> - **VERIFICABILIDAD:** COMPILA-OK / ERROR-DE-BUILD / SOLO-RUNTIME / CUBIERTO-POR-SMOKE-TEST.
> - No se usa "funcional": leyendo código se sabe que algo está **cableado**, no que
>   funcione. No hay tests ni despliegue; "compila" es la cota inferior de verificación.

---

## 0. Veredicto global de compilación

**COMPILA-OK.** `npm run build` (Next 16.2.7 + Turbopack) termina con **exit 0**:
compila, pasa TypeScript (`Finished TypeScript`), y prerenderiza 15 páginas. `npx tsc
--noEmit` también sale **0**. No hay **ningún** ERROR-DE-BUILD. El `verify.ps1` trata
`tsc` y `lint` como gate duro (`verify.ps1:120-179`); ambos en verde.

- El build detectó `.env.local` presente en local (`Environments: .env.local`), así que
  la ausencia de secretos **no** aplica aquí; ninguna funcionalidad queda como
  ERROR-DE-BUILD por config faltante — solo como **SOLO-RUNTIME** las que dependen de una
  clave externa en ejecución (Google Maps/Places, Firebase, n8n, LLMs).
- Rutas del build: estáticas `○` `/ /about /cookies /dashboard /login /planner /pricing
  /privacy /results /terms`; dinámicas `ƒ` `/api/auth/session /api/plan-trip /trip/[id]`;
  `Proxy (Middleware)` activo.

> Como el frontend entero compila, la columna VERIFICABILIDAD de la tabla es
> **COMPILA-OK por funcionalidad** salvo donde el comportamiento real exige una clave o
> servicio externo en runtime (marcado **+SOLO-RUNTIME**), que el build no puede ejercitar.

---

## 1. Tabla-resumen de TODAS las funcionalidades

Núcleo = captación → generación → resultados → cockpit (profundidad en §3).

| # | Funcionalidad | Entrada UI | CONEXIÓN | VERIFICABILIDAD | Evidencia |
|---|---|---|---|---|---|
| **CAPTACIÓN** |
| 1 | Landing: buscador de destino + chips "ideas rápidas" | `/` | CONECTADO (navega a `/planner?dest=/style=`) | COMPILA-OK | `app/page.tsx:24-35,109-115` |
| 2 | Wizard de captación de 8 pasos ("chat") | `/planner` | CONECTADO (estado local → `generateTrip`) | COMPILA-OK | `components/planner/ChatPlanner.tsx:234-257` |
| 3 | Autocompletado de ciudad (origen/destino) | `/planner` pasos 1-2 | CONECTADO (Google Places cliente) | COMPILA-OK **+SOLO-RUNTIME** | `components/planner/CityAutocompleteInput.tsx:53-79,129` |
| 4 | Aviso país→ciudad y ciudad ambigua | `/planner` pasos 1-2 | CONECTADO (tablas locales) | COMPILA-OK | `ChatPlanner.tsx:54-147,482-534` |
| 5 | Slider de presupuesto real (USD) + tiers | `/planner` paso 5 | CONECTADO (`budgetAmountUsd`) | COMPILA-OK | `ChatPlanner.tsx:662-719`, `lib/budget.ts:30-49` |
| 6 | Panel-resumen lateral en vivo | `/planner` | CONECTADO (lee `preferences`) | COMPILA-OK | `components/planner/TravelSummaryPanel.tsx` |
| **GENERACIÓN** |
| 7 | Generar plan (`generateTrip` → `/api/plan-trip`) | botón paso 8 | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `context/TripContext.tsx:112-196`, `api/plan-trip/route.ts:994` |
| 8 | Cascada de fallback n8n→OpenAI→Claude→mock | (servidor) | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `route.ts:1024,1113,1168,1226` |
| 9 | Traducción respuesta n8n → `TripData` | (servidor) | CONECTADO | COMPILA-OK | `route.ts:504` (`mapN8nToTripData`) |
| 10 | Fallback a mocks en cliente si el fetch falla | (cliente) | CONECTADO | COMPILA-OK | `TripContext.tsx:146-175` |
| 11 | Pantalla de "hiperautomatización" (9 pasos animados) | overlay | CONECTADO a `isLoading`; **animación cosmética** | COMPILA-OK | `components/planner/AiProcessingScreen.tsx`, `TripContext.tsx:177-187` |
| 12 | Manejo `needs_user_input` + avisos reales de n8n | `/planner` | CONECTADO | COMPILA-OK | `planner/page.tsx:67-167` |
| 13 | Botón "usar presupuesto sugerido y reintentar" | banner aviso | CONECTADO | COMPILA-OK | `planner/page.tsx:88-94,136-147` |
| **RESULTADOS** |
| 14 | Vista de resultados (JustGo score, resumen ejecutivo) | `/results?id=` | CONECTADO (lee `currentTrip`) | COMPILA-OK | `app/results/page.tsx:165-208` |
| 15 | Tarjeta explicativa "por qué esta ruta" | `/results` | CONECTADO | COMPILA-OK | `components/results/RouteDecisionCard.tsx` |
| 16 | Reconstruir / Más económico / Premium | `/results` | **MAL-CABLEADO** (lanza plan nuevo, no refinamiento) | COMPILA-OK **+SOLO-RUNTIME** | `results/page.tsx:53-90`, `components/trip/RegenerateActionBar.tsx:21-25` |
| 17 | Descargar PDF (desde resultados) | `/results` | CONECTADO (genera en cliente) | COMPILA-OK **+SOLO-RUNTIME** | `results/page.tsx:123-141`, `lib/tripPdf.tsx:21-40` |
| **COCKPIT `/trip/[id]`** |
| 18 | Hero editorial del viaje (clima, fechas, presupuesto) | `/trip/[id]` | CONECTADO | COMPILA-OK | `components/trip/PrivateTripHero.tsx` |
| 19 | Itinerario día a día (timeline con tabs) | `/trip/[id]` | CONECTADO | COMPILA-OK | `components/trip/ItineraryTimeline.tsx`, `DayPlanCard.tsx` |
| 20 | Mapa del viaje (marcadores + ruta a pie por día) | `/trip/[id]` | CONECTADO (Google Maps) | COMPILA-OK **+SOLO-RUNTIME** | `components/trip/TripMapOverview.tsx` |
| 21 | Desglose de presupuesto (marca estimaciones) | `/trip/[id]` | CONECTADO | COMPILA-OK | `components/trip/BudgetBreakdown.tsx` |
| 22 | Info práctica (visado/clima/transporte) | `/trip/[id]` | CONECTADO | COMPILA-OK | `components/trip/PracticalInfoCard.tsx` |
| 23 | Tarjetas de vuelo y hotel (con "Reservar") | `/trip/[id]` | CONECTADO (enlace externo real si lo trae n8n) | COMPILA-OK | `components/trip/FlightCard.tsx:95`, `HotelCard.tsx:94` |
| 24 | Checklist de preparación (marcable) | `/trip/[id]` | CONECTADO a estado local; **NO persiste** | COMPILA-OK | `trip/[id]/page.tsx:37-45,71-75` |
| 25 | Descargar PDF (cockpit + panel share) | `/trip/[id]` | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `trip/[id]/page.tsx:77-88` |
| 26 | Compartir: copiar enlace | `/trip/[id]` | CONECTADO (`clipboard`) | COMPILA-OK **+SOLO-RUNTIME** | `components/trip/ShareTripPanel.tsx:16-23` |
| 27 | Compartir: "Añadir a Calendar" | `/trip/[id]` | **HUÉRFANO** (solo `alert()`) | COMPILA-OK | `ShareTripPanel.tsx:59` |
| 28 | Compartir: email a acompañante | `/trip/[id]` | **HUÉRFANO** (solo `alert()`) | COMPILA-OK | `ShareTripPanel.tsx:88-95` |
| 29 | Compartir desde el hero (`onShare`) | `/trip/[id]` | **HUÉRFANO** (`alert("copiado")` sin copiar) | COMPILA-OK | `trip/[id]/page.tsx:105` |
| **DASHBOARD** |
| 30 | Lista de viajes guardados | `/dashboard` | CONECTADO (`localStorage`) | COMPILA-OK | `app/dashboard/page.tsx:56-65` |
| 31 | Eliminar viaje | tarjeta | CONECTADO | COMPILA-OK | `dashboard/page.tsx:15,59`, `TripContext.tsx:91-100` |
| 32 | Stats (match promedio, destinos únicos) | `/dashboard` | CONECTADO (cálculo real) | COMPILA-OK | `dashboard/page.tsx:23-26` |
| 33 | Badge de "estado" de la tarjeta de viaje | tarjeta | **MAL-CABLEADO** (estado inventado por substring del id) | COMPILA-OK | `components/dashboard/DashboardTripCard.tsx:28-33` |
| **AUTENTICACIÓN / SESIÓN** |
| 34 | Login con Google (popup → redirect fallback) | `/login` | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `context/AuthContext.tsx:223-261` |
| 35 | Login / registro con email y contraseña | `/login` | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `AuthContext.tsx:180-221`, `login/page.tsx:52-76` |
| 36 | Recuperar contraseña | `/login` | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `AuthContext.tsx:271-288`, `login/page.tsx:78-91` |
| 37 | Gestión de sesión (cookie servidor + proxy) | (servidor) | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `api/auth/session/route.ts`, `proxy.ts`, `lib/sessionCookie.ts` |
| 38 | Logout | Navbar | CONECTADO | COMPILA-OK | `AuthContext.tsx:263-269` |
| 39 | Pasos de carga simulados en login | `/login` | CONECTADO; **cosmético** | COMPILA-OK | `login/page.tsx:108-115` |
| **TRANSVERSAL / VARIOS** |
| 40 | Banner de cookies (técnica) | global | CONECTADO (`localStorage`) | COMPILA-OK | `components/shared/CookieNotice.tsx` |
| 41 | Navbar (nav + auth + menú móvil) | global | CONECTADO | COMPILA-OK | `components/shared/Navbar.tsx` |
| 42 | Footer + nube de "integraciones" | global | CONECTADO (Footer) / decorativo (nube) | COMPILA-OK | `components/shared/Footer.tsx`, `IntegrationLogoCloud.tsx` |
| 43 | Registro de Service Worker (PWA) | layout | CONECTADO (solo producción) | COMPILA-OK **+SOLO-RUNTIME** | `app/layout.tsx:52-68` |
| 44 | Fotos reales de lugares (Google Places, server) | (servidor) | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `route.ts:289-316,826-843` |
| 45 | Clima real histórico (Open-Meteo, server) | (servidor) | CONECTADO | COMPILA-OK **+SOLO-RUNTIME** | `route.ts:338-373,949-952` |
| **PÁGINAS ESTÁTICAS** (una línea, §5) |
| 46 | `/about` | — | CONECTADO (estática) | COMPILA-OK | `app/about/page.tsx` |
| 47 | `/pricing` | — | CONECTADO (placeholder "Próximamente") | COMPILA-OK | `app/pricing/page.tsx` |
| 48 | `/cookies` `/privacy` `/terms` | — | CONECTADO (estáticas) | COMPILA-OK | `app/{cookies,privacy,terms}/page.tsx` |
| **CÓDIGO MUERTO** |
| 49 | `PreferenceWizard` (wizard alternativo) | — | **HUÉRFANO** (no se importa en ningún sitio) | COMPILA-OK | `components/planner/PreferenceWizard.tsx` (0 imports) |

**Leyenda de matices**
- **MAL-CABLEADO #16:** la acción llega a un backend, pero no al previsto (`travel-refine`);
  ver ficha detallada §3.4 y reconciliación §6.
- **HUÉRFANO #27/#28/#29:** UI que aparenta un efecto (calendario/email/compartir) sin
  ninguna llamada — solo `alert()`.
- **MAL-CABLEADO #33:** presenta un dato inventado como si fuera un estado real.

---

## 2. Arquitectura resumida (barrido de superficie, Pasada A.1)

- **Rutas de página** (`src/app/`): `/`, `/login`, `/planner`, `/results`, `/trip/[id]`,
  `/dashboard`, `/about`, `/pricing`, `/cookies`, `/privacy`, `/terms`.
- **Rutas API** (`src/app/api/`): `POST/DELETE /api/auth/session`, `POST /api/plan-trip`.
- **Middleware:** `src/proxy.ts` (en Next 16 el "middleware" se llama `proxy`); matcher
  `['/dashboard/:path*','/planner/:path*','/trip/:path*']` (`proxy.ts:31`).
- **Contextos** (`src/context/`): `AuthContext` (auth Firebase + cookie servidor),
  `TripContext` (estado de viajes + generación + `localStorage`).
- **Lib** (`src/lib/`): `firebase.ts` (SDK cliente), `firebaseAdmin.ts` (Admin, fail-closed),
  `sessionCookie.ts` (verificación ligera con `jose`), `dates.ts`, `budget.ts`,
  `tripLabels.ts`, `destinationImages.ts`, `tripPdf.tsx`.
- **Types** (`src/types/`): `trip.ts` (`TripData`, `TripPreferences`, …), `planResult.ts`
  (`N8nWarning`, `GenerateTripResult`).
- **Componentes:** `planner/` (ChatPlanner, CityAutocompleteInput, TravelSummaryPanel,
  AiProcessingScreen, **PreferenceWizard** = muerto), `results/` (JustGoScoreCard,
  RouteDecisionCard, TripOptionCard), `trip/` (PrivateTripHero, ItineraryTimeline,
  DayPlanCard, TripMapOverview, MapViewer, FlightCard, HotelCard, BudgetBreakdown,
  PracticalInfoCard, ShareTripPanel, DestinationImage, RegenerateActionBar,
  TripPdfDocument), `dashboard/` (DashboardTripCard), `shared/` (Navbar, Footer,
  CookieNotice, SmartChip, IntegrationLogoCloud), `legal/` (LegalPageLayout).
- **Hooks:** no hay carpeta `hooks/`; los únicos hooks propios son `useAuth`/`useTrips`
  (definidos en sus contextos).
- **Dependencias de `package.json` — uso verificado en `src/`:** todas usadas.
  `next`/`react`/`react-dom` (base), `firebase` (`lib/firebase.ts`, `AuthContext`),
  `firebase-admin` (`lib/firebaseAdmin.ts`), `jose` (`lib/sessionCookie.ts`),
  `@vis.gl/react-google-maps` (mapas + autocompletado), `@react-pdf/renderer` (`tripPdf`),
  `framer-motion` (animaciones, ubicua), `lucide-react` (iconos, ubicuo). **Ninguna
  dependencia declarada quedó sin uso.**

---

## 3. Fichas detalladas del núcleo

### 3.1 Captación — Wizard de 8 pasos (`ChatPlanner`)

- **Punto de entrada:** `/planner`; la landing puede prellenar `?dest=` / `?style=`
  (`page.tsx:24-35`), leídos en `planner/page.tsx:44-57`.
- **Ficheros:** `app/planner/page.tsx`, `components/planner/ChatPlanner.tsx`,
  `CityAutocompleteInput.tsx`, `SmartChip.tsx`, `TravelSummaryPanel.tsx`, `lib/budget.ts`.
- **Qué hace:** recopila 8 campos en pasos secuenciales — destino, origen, fechas,
  viajeros, presupuesto, estilos, filtros, confirmación (`ChatPlanner.tsx:462-787`). El
  "diálogo" de chat es una **narrativa scriptada**: `getDialogueHistory()`
  (`ChatPlanner.tsx:266-384`) reconstruye burbujas de agente/usuario a partir del **estado
  del wizard**, no de mensajes reales del usuario. No hay caja de texto libre conversacional.
- **Estado que toca:** `TripPreferences` en `planner/page.tsx:23-32`; el paso 5 usa
  `budgetAmountUsd` como fuente de verdad del presupuesto (`ChatPlanner.tsx:662-669`,
  `lib/budget.ts`).
- **Efecto/backend:** ninguno hasta el paso 8; `onComplete` → `handleCompleteWizard`
  (`planner/page.tsx:67-81`) → `generateTrip`.
- **CONEXIÓN:** CONECTADO. **VERIFICABILIDAD:** COMPILA-OK.
- **Detalle "smart chips":** los chips del paso 1 (`ChatPlanner.tsx:467-480`) **fijan
  preferencias**, no disparan interpretación: seleccionar "Quiero el más barato" escribe el
  literal `'El más barato'` en `destination`; "Recomiéndame uno" escribe `'Recomiéndame
  uno'`. Estos literales se envían tal cual como `destination` (ningún LLM los interpreta
  en el frontend). Los chips de estilo/filtros (pasos 6-7) togglean valores en inglés
  (`STYLE_OPTIONS`, `RESTRICTION_OPTIONS`) que van a `activity_interests`/
  `special_requirements` en n8n.

### 3.2 Autocompletado de ciudad (`CityAutocompleteInput`)

- **Qué hace:** input con Google Places Autocomplete restringido a `(cities)`
  (`CityAutocompleteInput.tsx:53-56`); al elegir una sugerencia extrae **solo** el nombre
  de ciudad (`extractCitySelection`, líneas 26-36) y fija país confirmado.
- **Backend:** Google Places JS (cliente), `language="en"` forzado (línea 129) para casar
  con la tabla `cityToIata` de n8n.
- **Degradación:** sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (o `='changeme'`) cae a un
  `<input>` de texto normal (líneas 106-119) — el wizard sigue.
- **CONEXIÓN:** CONECTADO (a Google Places). **VERIFICABILIDAD:** COMPILA-OK +SOLO-RUNTIME.

### 3.3 Generación del plan y cascada de fallback

- **Cliente:** `TripContext.generateTrip` (`TripContext.tsx:112-196`) hace `POST
  /api/plan-trip` con las `TripPreferences` (líneas 123-129). Si la respuesta es
  `needs_user_input`, devuelve los `warnings` sin fingir viaje (139-142). Si el fetch
  falla, **fallback en cliente** a plantillas mock por destino/presupuesto (146-175).
- **Servidor (`api/plan-trip/route.ts`):**
  1. **Gate de auth** (994-1013): exige Admin SDK configurado (503 si no) + cookie de
     sesión válida verificada con `verifySessionCookie(...,true)` (401 si no). La API **no
     es anónima**.
  2. **Cascada** (con disparadores exactos):
     - **n8n** si `process.env.N8N_WEBHOOK_URL` (1024): `mapPreferencesToN8n` (184-240) →
       POST webhook; **2 intentos, 20 s de espera** (1035-1037); cuerpo vacío = fallo
       transitorio → reintenta (1049-1051). Detecta plan inutilizable
       (`isUnusableN8nPlan`, 490-498) → devuelve `needs_user_input` con aviso accionable
       garantizado (1061-1086). Plan válido → `mapN8nToTripData` (1088).
     - **OpenAI `gpt-4o-mini`** si `OPENAI_API_KEY` (1113-1163), `response_format
       json_object`, temp 0.7.
     - **Anthropic `claude-3-5-sonnet-20241022`** si `ANTHROPIC_API_KEY` (1168-1221),
       `max_tokens 4000`, vía `fetch` REST directo.
     - **Mocks locales** (1226-1260) por defecto: selecciona plantilla por
       destino/`budget`.
- **Traducción `mapN8nToTripData` (504-992):** costura real motor↔UI. Traduce vuelos
  (516-558), hoteles (560-605, con hotel "pendiente de confirmar" si no hay dato real en
  vez de inventarlo), actividades (607-630), itinerario día a día con relleno y puntos de
  aeropuerto (632-803), fotos Places (805-843), presupuesto con `transport: number|null`
  y `estimatedFields` (845-881), y **JustGo score derivado de señales reales** del plan
  (883-937). Alternativas se dejan vacías a propósito (939-944).
- **CONEXIÓN:** CONECTADO. **VERIFICABILIDAD:** COMPILA-OK +SOLO-RUNTIME.

### 3.4 Resultados y "Reconstruir / Más económico / Premium"

- **Vista (`results/page.tsx`):** lee `currentTrip` por `?id=` (25-31); pinta JustGo score
  (`JustGoScoreCard`), resumen ejecutivo con datos reales del viaje (178-198),
  `RegenerateActionBar`, comparativa de 3 opciones y `RouteDecisionCard`.
- **Acción "Reconstruir" (`handleRegenerateAction`, 53-76):** modifica `user_preferences`
  (ajusta `budget` **y** `budgetAmountUsd ×0.7/×1.5`, estilos/restricciones según el
  botón) y llama a **`generateTrip`** → nuevo `POST /api/plan-trip`.
  - **[MAL-CABLEADO respecto a lo previsto]** No invoca el webhook de **refinamiento**
    (`travel-refine`) de n8n: lanza un **plan nuevo completo**. La cadena de sesión/
    refinamiento de n8n queda sin consumidor desde el portal (confirma inventario §9.2).
- **`RegenerateActionBar` (componente):** su spinner "Recalculando…" se limpia con un
  `setTimeout(2500)` fijo **desacoplado** de la respuesta real del padre
  (`RegenerateActionBar.tsx:21-25`): es cosmético (relevante para análisis de procesos).
- **Tarjetas "Más económico/Premium" (`TripOptionCard`):** ya **no** inventan destino/
  precio/match; muestran "Buscar esta opción" y al pulsar disparan una búsqueda real
  (`results/page.tsx:83-90,236-260`).
- **CONEXIÓN:** CONECTADO (con matiz MAL-CABLEADO). **VERIFICABILIDAD:** COMPILA-OK +SOLO-RUNTIME.

### 3.5 Cockpit `/trip/[id]` — itinerario, mapa, checklist

- **Fichero:** `app/trip/[id]/page.tsx` (protegido por proxy).
- **Itinerario (`ItineraryTimeline` + `DayPlanCard`):** tabs por día, bloques con hora/
  icono/coste/tip; guardas defensivas ante itinerario vacío
  (`ItineraryTimeline.tsx:23-35`). `DayPlanCard` embebe `MapViewer` por bloque con
  coordenada.
- **Mapa (`TripMapOverview`):** marcadores de todas las paradas con coordenada, filtro por
  día, y **ruta a pie real** (Directions API `WALKING`) entre paradas únicas del día
  (`TripMapOverview.tsx:39-96,128-138`); encuadre por `bounds` para viajes multi-destino
  (153-163). Sin API key → placeholder informativo (218-224). No finge trayectos si
  Google no encuentra ruta (74-90).
- **Checklist (`page.tsx:37-45,71-75`):** 7 ítems, **todos empiezan sin marcar**; el toggle
  vive en `useState` local. **NO se persiste** (ni `localStorage` ni servidor): al recargar
  se pierde el marcado. Relevante para "portal privado" (§7).
- **PDF, presupuesto, info práctica, vuelo/hotel:** ver tabla #17-23.
- **CONEXIÓN:** CONECTADO. **VERIFICABILIDAD:** COMPILA-OK (mapa +SOLO-RUNTIME).

### 3.6 Exportación a PDF

- **`lib/tripPdf.tsx:21-40`:** `downloadTripPdf` importa **dinámicamente**
  `@react-pdf/renderer` y `TripPdfDocument` (evita el bundle SSR), genera un `Blob` y
  fuerza descarga con un `<a download>`. **Propaga** errores (no los silencia) — el
  llamador muestra `alert()` (`results/page.tsx:129-133`, `trip/[id]/page.tsx:82-84`).
- **CONEXIÓN:** CONECTADO (genera en cliente; ningún backend). **VERIFICABILIDAD:**
  COMPILA-OK +SOLO-RUNTIME (ejecuta solo al pulsar).

### 3.7 Login, registro y gestión de sesión

- **`/login` (`login/page.tsx`):** modos login/signup/reset; Google SSO; redirección a
  `?next=` validada contra open-redirect (`getRedirectTarget`, 35-43). Muestra "pasos de
  carga" simulados (108-115) — cosméticos.
- **`AuthContext`:** login/signup/google esperan a `establishServerSession`
  (61-83) antes de resolver: obtiene ID token fresco y hace `POST /api/auth/session` con
  **1 reintento**; si el servidor no crea la cookie, **fail-closed**: `signOut` + error
  (172-178). `resetPassword` no filtra si el email existe (271-288).
- **`/api/auth/session`:** verifica el ID token con Admin SDK (`verifyIdToken(...,true)`),
  emite **session cookie firmada por Firebase** (no el token en crudo), `httpOnly`,
  `sameSite lax`, `secure` en producción, 14 días (`route.ts:30-46`). `DELETE` la borra.
- **`proxy.ts` + `sessionCookie.ts`:** primera barrera; verifica cripto (RS256 + issuer/
  audience/exp con `jose`) sin Admin SDK; la autoritativa (con revocación) la hacen los
  route handlers.
- **CONEXIÓN:** CONECTADO. **VERIFICABILIDAD:** COMPILA-OK +SOLO-RUNTIME.

---

## 4. Veredicto de captación

**WIZARD CON ESTÉTICA DE CHAT** (no NL-real, no híbrido).

Traza del dato punta a punta:
- **Input del usuario:** clics en chips + inputs estructurados (autocompletado de ciudad,
  `type="date"`, contadores +/-, slider, toggles). El único texto libre es el nombre de la
  ciudad, que **no se interpreta** semánticamente: se envía como string `destination`
  (`ChatPlanner.tsx:490-491`).
- **Estado:** `TripPreferences` (objeto plano).
- **Generación:** `generateTrip` → `POST /api/plan-trip` → `mapPreferencesToN8n`
  (mapeo determinista de campos, `route.ts:184-240`).
- **¿Algún LLM interpreta texto libre ANTES del planificador?** **No.** El chat es una
  narrativa reconstruida del estado (`getDialogueHistory`, `ChatPlanner.tsx:266-384`). El
  planificador (LLM) recibe un JSON de campos, no la conversación.
- **Sobre el refinamiento:** n8n **sí** tiene un agente LLM que interpreta instrucciones en
  lenguaje natural (`travel-refine`), pero ese flujo resultó **HUÉRFANO** desde el frontend
  (§3.4, §6). Por tanto **no cuenta como conversación en la captación** — se separa
  explícitamente.

Conclusión: el "Concierge Inteligente / Planificación Conversacional"
(`ChatPlanner.tsx:398-402`) es un wizard de formulario con presentación de chat.

---

## 5. Páginas estáticas (una línea cada una)

- **`/about`** (`app/about/page.tsx`): marketing estático (equipo, capturas, valores); sin backend.
- **`/pricing`** (`app/pricing/page.tsx`): placeholder "Próximamente", sin precios reales; solo enlaces internos.
- **`/cookies`** (`app/cookies/page.tsx`): Server Component estático; tabla de la cookie `justenjoy-session`.
- **`/privacy`** (`app/privacy/page.tsx`): estático; enumera proveedores y `mailto:soporte@justenjoy.app`.
- **`/terms`** (`app/terms/page.tsx`): estático; recalca "los planes son propuestas, no reservas".

---

## 6. Pasada B — Reconciliación con `00_inventario_tecnico.md`

### 6.1 Reconciliación temática

| Afirmación del inventario | Mi hallazgo | Estado |
|---|---|---|
| Rutas y protección proxy (`/planner`,`/trip`,`/dashboard` sí; `/results` no) (§9.2) | Idéntico (`proxy.ts:31`) | **Coincide** |
| Cascada n8n→OpenAI→Claude→mock (2 reintentos, 20 s) (§3.2) | Idéntico (`route.ts:1024-1260`) | **Coincide** |
| `TripData` ≠ esquema n8n; costura en `mapN8nToTripData` (§9.1) | Idéntico (`route.ts:504`) | **Coincide** |
| Persistencia cliente en `localStorage justenjoy_trips`; sin Firestore (§5.3) | Idéntico (`TripContext.tsx:52,72,86`) | **Coincide** |
| Auth: cookie servidor + fail-closed (§9.2) | Idéntico (`AuthContext`, `api/auth/session`) | **Coincide** |
| UX de espera de 9 pasos ~500 ms **simulados** aunque el plan ya llegó (§9.2) | Idéntico (`TripContext.tsx:177-187`) | **Coincide** |
| Webhook `travel-refine` **huérfano**; "Reconstruir" lanza plan nuevo (§9.2, Ap.7) | Idéntico (`results/page.tsx:53-76`) | **Coincide** |
| Fallbacks LLM directos GPT-4o-mini / Claude 3.5 (§2.2) | Idéntico (`route.ts:1123,1179`) | **Coincide** |
| Integraciones frontend server-side (Places, Open-Meteo) (§3.2) | Idéntico (`route.ts:291,297,351`) | **Coincide** |
| — (no mencionado) | `PreferenceWizard.tsx` es **código muerto** (0 imports) | **Nuevo** |
| — (no mencionado) | `RegenerateActionBar` spinner `setTimeout(2500)` cosmético desacoplado | **Nuevo** |
| — (no mencionado) | Botones "Añadir a Calendar" / email / hero-share = `alert()` sin efecto | **Nuevo** |
| — (no mencionado) | Badge de estado en `DashboardTripCard` inventado por substring del id | **Nuevo** |
| — (no mencionado) | Divergencia de etiqueta de presupuesto: `tripLabels` vs `TravelSummaryPanel` | **Nuevo** |
| — (no mencionado) | Checklist del cockpit **no persiste** (estado en memoria) | **Nuevo (matiz)** |

Ninguna contradicción con el inventario; solo hallazgos **adicionales** de detalle UI.

### 6.2 Reconciliación nominal (nombres esperados)

| Nombre esperado | Resultado |
|---|---|
| `route.ts` / `mapN8nToTripData` | **Hallado con el nombre esperado** (`api/plan-trip/route.ts:504`) |
| `TripContext` / `AuthContext` | **Hallado con el nombre esperado** |
| `TripPreferences` en `types/trip.ts` | **Hallado con el nombre esperado** |
| `proxy.ts` (middleware Next 16) | **Hallado con el nombre esperado** |
| `localStorage justenjoy_trips` | **Hallado con el nombre esperado** (`TripContext.tsx:52`) |
| Webhook de refinamiento `travel-refine` | **Esperado pero NO hallado en el frontend** (0 consumidores; huérfano) |
| Wizard `PreferenceWizard` | **Hallado con OTRO nombre en uso**: el activo es `ChatPlanner`; `PreferenceWizard` existe pero está muerto |

### 6.3 Código muerto, features a medias, choques UI↔realidad

- **Código muerto:** `components/planner/PreferenceWizard.tsx` (definido, nunca importado).
- **Features a medias / UI sin backend (choques UI↔realidad):**
  1. "Añadir a Calendar" promete sincronización pero solo hace `alert()` (`ShareTripPanel.tsx:59`).
  2. Compartir por email: `alert()`, sin envío (`ShareTripPanel.tsx:88-95`).
  3. `onShare` del hero: `alert("enlace copiado")` **sin copiar nada** (`trip/[id]/page.tsx:105`)
     — mientras que el botón "Copiar Enlace" del panel sí usa `clipboard` (`ShareTripPanel.tsx:16-23`).
  4. `RegenerateActionBar`: "Recalculando…" con temporizador fijo, no atado a la respuesta.
  5. Badge de estado de viaje inventado (`DashboardTripCard.tsx:28-33`).
  6. Recomendación fija del dashboard ("tarifas bajas a Oporto y Milán") es texto estático
     (`dashboard/page.tsx:142-143`).
- **Inconsistencias de datos/etiquetas** (no bloquean build, ensucian la UI):
  - Etiqueta de presupuesto divergente: `lib/tripLabels.ts` (`low→Económico`) vs
    `TravelSummaryPanel` (`low→Low Cost`); el comentario de `tripLabels.ts:1` promete
    reutilización que este componente no cumple.
  - "Cálculo para el total de la reserva (2 personas)" fijo en `BudgetBreakdown.tsx:40`,
    independiente de `travelers`.
  - `DestinationImage` cae a Barcelona (`lib/destinationImages.ts:25`) para destino
    desconocido — mitigado por la foto real de Places, pero persiste como último recurso.
  - Desajustes de claves en los mocks (`low-walking` vs `low_walking`, `hotel_cheap` vs
    `cheap_hotel`, `alternatives.type:'balanced'` fuera del union) → se muestran crudos.
  - Typos: `FlightCard.tsx:91` "TARISA"; `data/mockTripData.ts` "Macho de cabina".
- **`_debug` / `_supabase_record` / `_skip_supabase`:** el frontend los ignora
  (fuga de campos internos ya anotada en inventario §10; no es un bug del frontend).

---

## 7. Seguridad / privacidad (para NFR)

- **Rutas protegidas** (proxy, `proxy.ts:31`): `/dashboard`, `/planner`, `/trip/*`.
  **Desprotegidas:** `/`, `/login`, `/results`, y todas las estáticas.
  - **Hueco:** `/results` **no** está en el matcher — es accesible sin sesión (aunque sin
    un viaje en estado/`localStorage` no muestra datos). El inventario ya lo señala.
- **API:** `POST /api/plan-trip` **exige auth** (Admin SDK + cookie verificada,
  `route.ts:994-1013`) → cierra el vector de coste (llamadas anónimas a LLM/n8n).
- **Cookie/sesión:** session cookie **firmada por Firebase** (no el ID token crudo),
  `httpOnly`, `sameSite lax`, `secure` en prod, 14 días (`api/auth/session/route.ts:30-46`).
  Verificación en dos capas: ligera con `jose` en el proxy + autoritativa con revocación
  en handlers. **Fail-closed** en todos lados: sin Admin SDK → 503/401; sin cookie → 401;
  sin sesión servidor → `signOut` en cliente (`AuthContext.tsx:146-153,172-178`).
- **Exposición de claves:**
  - **Públicas por diseño:** config Firebase (`next.config.ts:25-38`, con fallback
    hardcodeado — identifican el proyecto, no son secreto) y
    `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (cliente, restringible por referrer).
  - **Server-only:** `GOOGLE_PLACES_API_KEY` (fotos, sin referrer, `route.ts:823-825`),
    `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `N8N_WEBHOOK_URL`, `FIREBASE_ADMIN_*`. Se leen
    vía `process.env` en servidor; **no** figuran en `next.config.ts env{}` (comentario
    explícito `next.config.ts:20-24`).
- **¿"Portal privado" realmente privado?** **Parcialmente.** El acceso a rutas está
  protegido, **pero los viajes viven en `localStorage` del navegador**, no en servidor
  (`TripContext.tsx`). Consecuencias: (a) los datos no se comparten entre dispositivos;
  (b) el "enlace privado" `/trip/{id}` no sirve datos server-side — sin ese id en el
  `localStorage`/estado local no hay nada que mostrar (no es un enlace compartible real);
  (c) el checklist de preparación no persiste. La privacidad es de *ruta*, no de *dato
  server-side*.

---

## 8. UX relevante para análisis de procesos

- **Esperas/animaciones simuladas que corren aunque la respuesta ya haya llegado:**
  - Generación: tras recibir la respuesta (o el fallback), `generateTrip` reproduce
    **9 pasos × 500 ms** secuenciales (`TripContext.tsx:177-187`) → mínimo ~4,5 s de espera
    artificial añadida a la latencia real. El overlay `AiProcessingScreen` los muestra.
  - Login: `triggerLoadingSteps` añade ~2,2 s de pasos cosméticos (`login/page.tsx:108-115`).
  - "Reconstruir": spinner de 2,5 s fijo (`RegenerateActionBar.tsx:21-25`).
- **Estados de error y qué ve el usuario:**
  - n8n no puede completar → banner ámbar con `warnings` reales + botones "usar presupuesto
    sugerido", "revisar fechas", "revisar filtros" (`planner/page.tsx:115-167`).
  - Aviso vacío de n8n (p. ej. JSON truncado en viajes largos) → el servidor **garantiza**
    un aviso accionable (`route.ts:1069-1086`) para no dejar un "error en blanco".
  - Avisos no bloqueantes (fecha ajustada ±1 día) → banner azul en resultados
    (`results/page.tsx:155-163`).
  - PDF: `alert()` si falla (`results/page.tsx:131`, `trip/[id]/page.tsx:83-84`).
  - Sin trip cargado: pantalla "Buscando tu ruta…" con CTA al planner (`results/page.tsx:34-48`).
- **Acciones que aparentan hacer algo sin llegar a backend:** "Añadir a Calendar", email a
  acompañante, y compartir desde el hero (`alert()`); ver §6.3.

---

## 9. CHECKLIST DE CIERRE

| Funcionalidad esperada | Estado catalogado |
|---|---|
| Captación de preferencias | **Presente** — wizard 8 pasos (`ChatPlanner`), CONECTADO (§3.1). |
| Generación del plan | **Presente** — cascada n8n/OpenAI/Claude/mock, CONECTADO (§3.3). |
| Visualización de resultados | **Presente** — `/results`, CONECTADO (§3.4). |
| "Reconstruir/Más económico/Premium" | **Presente pero MAL-CABLEADO** — lanza plan nuevo, no `travel-refine`; spinner cosmético (§3.4). |
| Cockpit `trip/[id]` (itinerario, mapa, checklist) | **Presente** — CONECTADO; checklist **no persiste** (§3.5). |
| Exportación PDF | **Presente** — cliente, CONECTADO (§3.6). |
| Dashboard de viajes guardados | **Presente** — `localStorage`, CONECTADO; badge de estado inventado (§tabla #30-33). |
| Login (Google/email) | **Presente** — CONECTADO (§3.7). |
| Gestión de sesión | **Presente** — cookie servidor + proxy, fail-closed, CONECTADO (§3.7, §7). |
| Banner de cookies | **Presente** — `localStorage`, CONECTADO (§tabla #40). |
| Compartir por calendario/email | **A medias** — HUÉRFANO (`alert()`), sin backend (§6.3). |
| Refinamiento conversacional (`travel-refine`) | **AUSENTE en el frontend** — webhook sin consumidor (§4, §6.2). |

> **Nada quedó sin catalogar.** Las únicas capacidades "esperadas" que no existen como tal
> en el frontend son el **consumo del refinamiento** (`travel-refine`, huérfano) y las
> acciones de **compartir por calendario/email** (stubs con `alert()`).
