# Inventario Técnico (Fase 0) — Just Enjoy

> **Alcance:** este documento inventaría ÚNICAMENTE lo que existe técnicamente en el
> repositorio (el TO-BE ya construido). No reconstruye el proceso manual previo (as-is)
> ni propone mejoras. Cada afirmación no trivial cita su fuente.
>
> **Fecha de levantamiento:** 2026-07-21 · **Rama:** `develop` · **Commit base:** `dd4fe76`
>
> **Convención de cita:** `— fuente: ruta (detalle)`. Lo que no puede determinarse
> del código se marca como **[HUECO]**.

---

## 1. Estructura de carpetas

Árbol resumido (se omiten `node_modules`, `dist`, `.git`). 185 ficheros versionados.

```
Justenjoy_tfm/
├── n8n/                         MOTOR del sistema (orquestación del planificador)
│   ├── workflows/
│   │   ├── Planificador_de_Viajes_v38.json   Workflow canónico ACTIVO (27 nodos)
│   │   └── archive/             Versiones congeladas v24, v26, v27, v28, v29, v31, v34
│   ├── nodes-code/              Código de los 10 nodos "Code" versionado (fuente de verdad)
│   │   ├── 01..10_*.js          + _inject.py (reinyecta en el JSON) + _smoketest.js
│   ├── credentials/             credentials.json (estructura SIN secretos) + README
│   ├── docs/                    Arquitectura por versión (v24, v31, v34, v38)
│   └── examples/                JSON de entrada y salidas reales por versión (testing)
├── frontend/                    Portal del viajero — Next.js 16 (App Router)
│   ├── src/app/                 Páginas + rutas API (/api/plan-trip, /api/auth/session)
│   ├── src/components/          UI (planner, results, trip, dashboard, shared, legal)
│   ├── src/context/             AuthContext + TripContext (estado cliente)
│   ├── src/lib/                 firebase, firebaseAdmin, sessionCookie, budget, pdf…
│   ├── src/proxy.ts             Middleware de Next 16 (auth de rutas privadas)
│   ├── src/data/mockTripData.ts Plantillas mock de respaldo
│   └── src/types/               Contratos TS (trip.ts, planResult.ts)
├── botpress/                    Agente conversacional — SOLO README (placeholder)
├── docs/
│   ├── ARCHITECTURE.md          Visión general del sistema
│   ├── adr/                     Decisiones de arquitectura (ADR)
│   ├── specs/                   Especificaciones aprobadas de funcionalidades
│   ├── bitacora-*.md            Bitácoras de trabajo
│   └── levantamiento/           (este documento)
├── .github/                     CODEOWNERS, plantilla de PR, workflow de CI (secret-scan)
├── .githooks/                   Scripts de git-flow y protección de ramas
├── docker-compose.yml           Stack: n8n + servicio efímero n8n-import
├── verify.ps1                   Gate de verificación local (Windows/PowerShell)
├── AGENTS.md / CONTRIBUTING.md / ONBOARDING.md / README.md
└── .env.example                 Plantilla de variables de entorno (sin valores)
```

— fuente: `git ls-files`, `README.md` (§Estructura), `docs/ARCHITECTURE.md`

**Observación:** El sistema es **no-code/low-code**: no hay servidor de aplicación
tradicional; la lógica vive en el workflow n8n y en LLMs conectados por API
— fuente: `docs/ARCHITECTURE.md` (línea 14).

---

## 2. Stack y versiones

### 2.1 Motor de orquestación (n8n)

| Componente | Valor | Fuente |
|---|---|---|
| Imagen del contenedor | `n8nio/n8n:latest` (sin pin de versión) | `docker-compose.yml` (línea 15) |
| Versión declarada en docs | "n8n self-hosted 2.23.2+" | `README.md` (tabla de stack) |
| Community nodes gestionados por entorno | `n8n-nodes-serpapi`, `@tavily/n8n-nodes-tavily` | `docker-compose.yml` (línea 42) |
| Workflow activo | `Planificador_de_Viajes_v38.json`, id `8Kym9GIgNKp7Nrdh` | `docker-compose.yml` (línea 86) |

> **[HUECO / inconsistencia]** La imagen usa `:latest` (no reproducible en el tiempo)
> mientras el README fija "2.23.2+". La versión real depende de cuándo se hizo `docker pull`.

### 2.2 LLMs

| Uso | Modelo real | Parámetros | Fuente |
|---|---|---|---|
| Motor Planificador (Agent 2) | **`gpt-4.1`** | maxTokens 4096, temp 0.1, timeout 120s, maxRetries 0 | workflow v38, nodo *OpenAI GPT-4.1 (Planificador)* |
| Agente de Refinamiento | `gpt-4o-mini` | maxTokens 1024, temp 0.1 | workflow v38, nodo *OpenAI GPT-4o-mini (Refinamiento)* |
| Fallback directo frontend (2º) | `gpt-4o-mini` | json_object, temp 0.7 | `frontend/src/app/api/plan-trip/route.ts:1123` |
| Fallback directo frontend (3º) | `claude-3-5-sonnet-20241022` | max_tokens 4000, temp 0.7, `anthropic-version: 2023-06-01` | `route.ts:1179` |

> **[HUECO / inconsistencia]** `README.md` y `docs/ARCHITECTURE.md` describen el
> planificador como **GPT-4o**; el workflow real usa **gpt-4.1**. No hay SDK de
> Anthropic instalado: la llamada a Claude es un `fetch` directo a la API REST
> (`https://api.anthropic.com/v1/messages`) — fuente: `route.ts:1171`.

### 2.3 Frontend (Next.js)

| Dependencia | Versión | Fuente |
|---|---|---|
| `next` | `16.2.7` | `frontend/package.json` |
| `react` / `react-dom` | `19.2.4` | `frontend/package.json` |
| `firebase` (cliente) | `^12.15.0` | `frontend/package.json` |
| `firebase-admin` (servidor) | `^14.1.0` | `frontend/package.json` |
| `jose` (verificación cookie ligera) | `^6.2.3` | `frontend/package.json` |
| `@vis.gl/react-google-maps` | `^1.9.0` | `frontend/package.json` |
| `@react-pdf/renderer` | `^4.5.1` | `frontend/package.json` |
| `framer-motion` | `^12.40.0` | `frontend/package.json` |
| `lucide-react` | `^1.17.0` | `frontend/package.json` |
| TypeScript / Tailwind CSS | `^5` / `^4` | `frontend/package.json` (devDeps) |

- El `package.json` de la raíz es un simple proxy de scripts hacia `frontend/`
  — fuente: `package.json` (root).
- Runtime esperado: Docker Desktop, Python 3.8+ (pre-commit), ngrok, Node (implícito por Next)
  — fuente: `README.md` (§Requisitos).

### 2.4 Botpress y Stripe

- **Botpress:** **[HUECO]** no hay código ni configuración; solo `botpress/README.md`
  (placeholder que describe la funcionalidad prevista). Sin versión.
- **Stripe Connect:** **[HUECO]** declarado en README/ARCHITECTURE como "(futuro)".
  No hay ninguna referencia a Stripe en `frontend/src` ni en `n8n/`
  — fuente: búsqueda `grep -i stripe` (0 resultados en código). Solo aparece como
  variables de plantilla en `.env.example` (líneas 53-56).

---

## 3. Integraciones externas

### 3.1 Desde el workflow n8n (v38)

| Servicio | Operación | Método | Ubicación (nodo) | Credencial |
|---|---|---|---|---|
| SerpAPI — Google Flights | `google_flights` (type 2, round-trip) | vía nodo SerpApiTool | *Tool: SerpApi Google Flights* | `serpApi` (`$env.SERPAPI_KEY`) |
| SerpAPI — Google Hotels | `google_hotels` | SerpApiTool | *Tool: SerpApi Google Hotels* | `serpApi` |
| SerpAPI — Google Maps | `google_maps` (things to do) | SerpApiTool | *Tool: Google Maps (Actividades)* | `serpApi` |
| Tavily | búsqueda web (visado/clima/fallback) | TavilyTool | *Tool: Tavily* | `tavilyApi` (`$env.TAVILY_API_KEY`) |
| OpenAI | chat completions (planificador y refinamiento) | nodo langchain lmChatOpenAi | 2 nodos LLM | `openAiApi` (`$env.OPENAI_API_KEY`) |
| OpenStreetMap / Nominatim | `GET /search` (geocoding, sin API key) | `this.helpers.httpRequest` | *Enriquecer Coordenadas (OpenStreetMap)* | — (User-Agent obligatorio) |
| Supabase | `create` en tabla `travel_plans` | nodo supabase | *Supabase — Guardar Plan* | `supabaseApi` (`$env.SUPABASE_HOST`, `$env.SUPABASE_SERVICE_ROLE_KEY`) |

— fuente: `n8n/workflows/Planificador_de_Viajes_v38.json` (parámetros de nodos),
`n8n/credentials/credentials.json`, `n8n/nodes-code/10_enriquecer_coordenadas.js:35-43`.

> **[HUECO / inconsistencia]** `docs/ARCHITECTURE.md` lista **5 tools** incluyendo
> "Google Maps Directions" (traslado aeropuerto→hotel). En el workflow v38 real solo
> hay **4 tools** conectadas al Agent; "Directions" aparece en texto de prompts pero
> NO existe como nodo — fuente: grafo de conexiones del workflow (4 aristas `ai_tool`).

### 3.2 Desde el frontend (route handlers server-side)

| Servicio | Endpoint | Método | Ubicación |
|---|---|---|---|
| n8n webhook | `${N8N_WEBHOOK_URL}` (`/webhook/travel-planner`) | POST | `route.ts:1039` |
| OpenAI (fallback 2) | `https://api.openai.com/v1/chat/completions` | POST | `route.ts:1116` |
| Anthropic (fallback 3) | `https://api.anthropic.com/v1/messages` | POST | `route.ts:1171` |
| Google Places — Find Place | `.../maps/api/place/findplacefromtext/json` | GET | `route.ts:291` (`fetchPlacePhotoUrl`) |
| Google Places — Photo | `.../maps/api/place/photo` | GET | `route.ts:297` |
| Open-Meteo (histórico clima) | `https://archive-api.open-meteo.com/v1/archive` | GET | `route.ts:351` (`fetchClimateAverage`) |
| Firebase Auth (cliente) | SDK `firebase` (Google Sign-In) | — | `frontend/src/lib/firebase.ts` |
| Firebase Admin (servidor) | SDK `firebase-admin` (verify token / session cookie) | — | `frontend/src/lib/firebaseAdmin.ts`, `api/auth/session/route.ts` |
| Google Maps JS (cliente) | `@vis.gl/react-google-maps` | — | componentes de `trip/` (mapa) |

El orquestador principal es n8n; si falla (2 reintentos, 20 s de espera) degrada a
OpenAI directo → Claude directo → plantillas mock locales — fuente: `route.ts:1024-1260`.

---

## 4. Configuración esperada (variables de entorno)

Agrupadas por servicio. **Sin volcar valores** (todas placeholder `changeme` en las plantillas).

**Raíz `.env` (inyectado al contenedor n8n)** — fuente: `.env.example`, `docker-compose.yml`:
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- SerpAPI: `SERPAPI_KEY`
- Tavily: `TAVILY_API_KEY`
- Supabase: `SUPABASE_HOST`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe (futuro, sin uso en código): `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- ngrok: `NGROK_URL`
- n8n: `N8N_HOST`, `N8N_PORT`, `N8N_PROTOCOL`, `N8N_ENCRYPTION_KEY` (obligatorio, ≥32 chars)
- Botpress: **[HUECO]** comentado como `[COMPLETAR-INFO]` (`BOTPRESS_TOKEN`, `BOTPRESS_BOT_ID`)

**Frontend `frontend/.env.local`** — fuente: `frontend/.env.local.example`, `.env.example` (líneas 81-131):
- API pública: `NEXT_PUBLIC_API_URL`
- Webhook n8n (server-only): `N8N_WEBHOOK_URL` (si falta → cae a mocks)
- Google Maps pública (cliente, referrer): `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Google Places servidor (fotos, sin referrer, API clásica): `GOOGLE_PLACES_API_KEY`
- Firebase Auth (público por diseño): `NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,STORAGE_BUCKET,MESSAGING_SENDER_ID,APP_ID}`
- Firebase Admin (SECRETO, servidor): `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`

Nota: las credenciales de n8n leen las claves como expresiones `{{ $env.X }}`; el
servicio `n8n-import` importa la estructura sin secretos — fuente: `n8n/credentials/credentials.json`.

---

## 5. Persistencia

Hay **tres almacenes distintos**, con propósitos separados:

### 5.1 Estado de sesión del planificador (dónde se quedó el cliente)
- **Motor:** memoria interna de n8n vía `$getWorkflowStaticData('global')`, **indexado por `session_id`**.
- **Escritura:**
  - Al validar el formulario inicial se crea `session_state` con
    `status: 'awaiting_search'`, `revision_count: 0`, `steps_to_run: 'all'` y el
    `travel_brief` — fuente: `n8n/nodes-code/01_validar_formulario.js:34-63`.
  - Al refinar se sobreescribe el estado — fuente: `03_parsear_refinamiento.js:37`.
  - Tras generar/validar el plan se persiste `{status, plan, warnings, revision_count, generated_at}`
    — fuente: `06_validar_output.js:352-361`.
- **Lectura:** el refinamiento recupera la sesión por `session_id`; si no existe,
  responde "Sesión no encontrada" — fuente: `02_cargar_sesion.js:5-13`.
- **El "paso" del cliente** se representa por el campo **`status`**, con valores
  observados: `awaiting_search` → `plan_ready` / `needs_user_input` / `error`
  — fuente: `01_validar_formulario.js:37`, `06_validar_output.js`, `08_preparar_payload_supabase.js:6`.
- **⚠️ VOLÁTIL:** se pierde si n8n se reinicia; los docs indican migrar a PostgreSQL
  Memory para producción — fuente: `docs/ARCHITECTURE.md:153-157`.

### 5.2 Persistencia del plan generado (Supabase)
- **Motor:** Supabase (Postgres gestionado), tabla **`travel_plans`**, operación `create`,
  `autoMapInputData` — fuente: workflow v38, nodo *Supabase — Guardar Plan*.
- **Solo se guarda si `status === 'plan_ready'`** (si no, `_skip_supabase: true`)
  — fuente: `08_preparar_payload_supabase.js:6-9`, gate *¿Guardar en Supabase?*.
- **Campos del registro:** `session_id, status, destination, origin, departure_date,
  return_date, budget_usd, total_cost_usd, travelers_count, activity_interests, plan (jsonb)`
  — fuente: `08_preparar_payload_supabase.js:25-39`.
- **[HUECO]** No hay DDL/migraciones de la tabla en el repo: el esquema de
  `travel_plans` solo se infiere del payload; no se versiona su definición.

### 5.3 Estado del frontend (portal)
- Los viajes del usuario se guardan **en el navegador** vía `localStorage`
  (clave `justenjoy_trips`), inicializados desde mocks — fuente: `frontend/src/context/TripContext.tsx:52,72,86,94`.
- **Firebase se usa SOLO para autenticación**, no como base de datos: **[HUECO]**
  no hay Firestore ni persistencia server-side de viajes en el frontend
  — fuente: búsqueda `firestore`/`getFirestore` (0 resultados en `src/lib` y `src/context`).

**Relaciones:** los tres almacenes se enlazan por `session_id` (n8n staticData ↔
`travel_plans.session_id`). El frontend NO consume Supabase directamente; recibe el
plan por HTTP y lo mapea a `TripData` — fuente: `route.ts:504` (`mapN8nToTripData`).

---

## 6. Disparadores de ejecución

### 6.1 Webhooks n8n (v38)
| Ruta | Método | Invocado por | Encadena a |
|---|---|---|---|
| `/webhook/travel-planner` | POST | Frontend `route.ts` y (previsto) Botpress | *Validar Formulario* → … → *Responder — Plan Listo* |
| `/webhook/travel-refine` | POST | Cliente al refinar (`{session_id, feedback_text}`) | *Cargar Sesión* → *Agente Refinamiento* → *Preparar Motor* |

— fuente: workflow v38 (nodos *Webhook — Formulario* / *Webhook — Refinamiento*,
`responseMode: responseNode`); `botpress/README.md:20`; `docs/ARCHITECTURE.md:147`.

**Grafo de ejecución (Ruta A, formulario):**
`Webhook Formulario → Validar Formulario → ¿Error Formulario? →(no) Preparar Motor →
Convertir Ciudades a IATA → Motor Planificador (Agent 2 + 4 tools + gpt-4.1) →
Validar Output → Enriquecer Coordenadas (OSM) → Logger Métricas → Preparar Payload
Supabase → [Responder Plan Listo] y [¿Guardar en Supabase? → Extraer Record → Supabase]`
— fuente: sección `connections` del workflow v38.

**Ruta B (refinamiento):** `Webhook Refinamiento → Cargar Sesión → ¿Error Refinamiento?
→(no) Agente de Refinamiento (gpt-4o-mini) → Parsear Refinamiento → Preparar Motor …`
(converge con la Ruta A en *Preparar Motor Planificador*).

### 6.2 Cron / triggers programados
- **[HUECO]** No hay ningún nodo cron/schedule ni cron externo en el repo.
  El workflow es 100% reactivo a webhook.

### 6.3 Agente conversacional
- **[HUECO]** Botpress no está implementado; el disparo real hoy proviene del
  frontend (`/api/plan-trip`), no de un bot.

### 6.4 Ejecución manual / arranque
- `n8n-import` (servicio efímero) importa y **activa** el workflow v38 al levantar el
  stack (`n8n publish:workflow --id=8Kym9GIgNKp7Nrdh`) — fuente: `docker-compose.yml:78-93`.
- El JSON versionado tiene `active: false`; queda activo por el `publish` del import
  — fuente: workflow v38 (`"active": false`), `docker-compose.yml:86`.

---

## 7. Artefactos de calidad / despliegue

| Artefacto | Estado | Fuente |
|---|---|---|
| Docker Compose | **SÍ** — n8n + n8n-import, red y volumen gestionados | `docker-compose.yml` |
| CI/CD | **PARCIAL** — solo escaneo de secretos (gitleaks) en push/PR a main/master/develop | `.github/workflows/secret-scan.yml` |
| Gate local de verificación | **SÍ** — `verify.ps1` (JSON n8n válido, .env ignorado, gitleaks activo, tsc duro + lint) | `verify.ps1` |
| pre-commit | **SÍ** — configurado (gitleaks) | `.pre-commit-config.yaml`, `.gitleaks.toml` |
| Protección de ramas / git-flow | **SÍ** (scripts) — hooks para no push directo a main | `.githooks/`, `.github/CODEOWNERS` |
| README de arranque | **SÍ** — completo (Docker, ngrok, prueba) | `README.md`, `docs/levantar-stack-local.md` |
| Docs de arquitectura | **SÍ** — general + por versión de workflow + ADRs + specs | `docs/ARCHITECTURE.md`, `n8n/docs/`, `docs/adr/`, `docs/specs/` |
| **Tests unitarios/e2e** | **CASI AUSENTES** — ver abajo | — |
| IaC (Terraform, etc.) | **NO EXISTE** | — |
| Despliegue frontend (Vercel) | **[HUECO]** — mencionado en docs/env, sin fichero de config (`vercel.json`) en el repo | `.env.example:120` |

**Sobre tests (punto débil):**
- No hay framework de test (ni Jest/Vitest/Playwright en `frontend/package.json`).
- Existe **un único smoke test** de la cadena determinista de n8n (sin APIs):
  `Validar → Preparar Motor → Convertir IATA`, con asserts fijos (AMS→CDG)
  — fuente: `n8n/nodes-code/_smoketest.js`.
- `frontend/test-frontend.ps1` es un script de comprobaciones (typecheck + lint +
  pruebas de auth por curl), **no** una suite de tests automatizada — fuente: cabecera del fichero.
- La "cobertura de cambios" se apoya en ejemplos JSON en `n8n/examples/`, no en asserts
  automáticos — fuente: `AGENTS.md` §9.2.

---

## 8. Prompts de los agentes LLM (contrato de comportamiento)

El comportamiento real del planificador vive **en los prompts embebidos en el JSON del
workflow**, no en código. Ambos agentes son `@n8n/n8n-nodes-langchain.agent` con
`promptType: define` (prompt de usuario + `systemMessage`) — fuente: workflow v38.

### 8.1 Agente de Refinamiento (`gpt-4o-mini`)
- **Rol:** intérprete de instrucciones de refinamiento; NO habla con el usuario, devuelve
  solo JSON — fuente: `systemMessage` (3.473 chars) del nodo *Agente de Refinamiento*.
- **Entrada:** `feedback_text`, `current_session`, `current_plan` — fuente: prompt de usuario (350 chars).
- **Lógica clave (mapeo instrucción → campo → `steps_to_run`):**
  - vuelos → `flight_preferences` → `steps_to_run: 'flights'`
  - hotel → `accommodation_type`/`hotel_location_preference` → `'hotels'`
  - actividades → `activity_interests` → `'activities'`
  - presupuesto / fechas / destino → `'all'`
- **Reglas duras:** actualizar solo los campos afectados, copiar el resto sin cambios;
  `revision_count += 1`; `status` siempre `awaiting_search`; nunca inventar datos ni emitir
  texto fuera del JSON — fuente: `systemMessage` (§REGLAS CRÍTICAS).

### 8.2 Motor Planificador — Agent 2 (`gpt-4.1`)
Es el núcleo del sistema. `systemMessage` de **12.046 chars** — fuente: nodo *Motor
Planificador — Agent 2*. Define una secuencia de 6 pasos + itinerario:

| Paso | Qué hace | Detalle de fuente |
|---|---|---|
| **1 — Vuelos** (bloqueante) | 2 llamadas one-way (ida+vuelta), `best_flights[]`, `stops=0` | máx 2 llamadas/trayecto; reintentos con downgrade de cabina y ±1 día si `flexible_dates` |
| **2 — Hotel** (bloqueante) | mayor `overall_rating` dentro de presupuesto, `sort_by=3` | `stars:null` si no hay clase; nunca copiar GPS a `address` |
| **3 — Actividades** | 1 sola llamada a Maps `things to do in [destino]`; scoring por `activity_interests` | nº actividades = `min(días disponibles, 20, utilizables)`; 1/día; huecos al final |
| **4 — Inteligencia destino** (Tavily) | visado/clima/transporte → `plan_notes[]` | fallback de actividades solo si Maps < 3 resultados |
| **5 — Validación** (siempre) | recalcula `total_cost`; si > presupuesto → `budget_exceeded` + `needs_user_input` | precios de vuelos/actividades son **por persona**; el validador multiplica |
| **6 — Trip summary** (siempre) | 2-3 frases; modo conciso en viajes ≥17 días | — |
| **Itinerario día a día** | cubre llegada→regreso; cada día con `points_of_interest` (1 lugar real geolocalizable) | alimenta el mapa del frontend |

- **Taxonomía de warnings** (define qué bloquea el plan): `requires_user_approval: true` →
  `no_valid_flight, no_valid_hotel, budget_exceeded, layover_violation, date_unavailable,
  date_mismatch, tool_timeout`; `false` → `activity_swap, budget_headroom, no_activities_found,
  date_adjusted`, etc. — fuente: `systemMessage` (§TAXONOMÍA WARNINGS).
- **Contrato de salida** completo (JSON con `status`, `plan.segments[]`, `cost_summary`,
  `daily_itinerary[]`, `warnings[]`) definido dentro del propio prompt.
- **Acoplamiento prompt ↔ código:** el prompt ordena explícitamente NO emitir
  `segments[].activities[]` (lo reconstruye el nodo 06) y dejar `booking_url` de vuelos vacío
  (lo construye el nodo 06). Es decir, prompt y `06_validar_output.js` son **un solo contrato
  repartido**; tocar uno sin el otro rompe la salida — fuente: `systemMessage` (§REGLAS CRÍTICAS)
  + `06_validar_output.js:124-243`.

> **[Observación]** Los prompts hardcodean nombres de ciudades/aeropuertos de ejemplo y una
> extensa lógica de negocio en lenguaje natural: son el punto de mayor densidad funcional y
> el más frágil (cualquier cambio de modelo puede alterar el cumplimiento).

---

## 9. Contratos de tipos del frontend y flujo de páginas

### 9.1 Tipos (fuente de verdad de la UI)
- `frontend/src/types/trip.ts` — define **`TripData`** (lo que renderiza la UI) y sus
  sub-interfaces: `TripPreferences` (entrada del wizard, incluye `budgetAmountUsd` como fuente
  de verdad del presupuesto), `JustGoScore`, `Flight`, `Hotel`, `Activity`, `Event`,
  `ItineraryBlock` (incluye `type: 'airport'` y `lat/lng/imageUrl`), `DayPlan`,
  `BudgetBreakdown` (con `transport: number | null` y `estimatedFields[]` para distinguir
  estimaciones de datos reales).
- `frontend/src/types/planResult.ts` — `N8nWarning` y `GenerateTripResult`
  (`{status:'ok', tripId}` | `{status:'needs_user_input', warnings}`).

> **[Nota]** `TripData` (forma que consume la UI) **NO** es el mismo esquema que el contrato
> de salida de n8n (§8.2). La traducción entre ambos la hace `mapN8nToTripData` en
> `route.ts:504` — es la costura real entre motor y portal.

### 9.2 Flujo de páginas (App Router)
Rutas verificadas — fuente: `frontend/src/app/` + `git ls-files`:

| Ruta | Propósito | Protegida por `proxy.ts` |
|---|---|---|
| `/` (landing) | CTA → `/planner?dest=&style=` | No |
| `/login` | Firebase Auth (Google + email/password) | No |
| `/planner` | Wizard conversacional (8 pasos) → `generateTrip()` | **Sí** |
| `/results?id=` | Muestra el plan + barra "Reconstruir" | **Sí** (`/trip` sí; `/results` **no** en el matcher) |
| `/trip/[id]` | Cockpit del viaje (itinerario, mapa, PDF, checklist) | **Sí** |
| `/dashboard` | Lista de viajes guardados | **Sí** |
| `/about`, `/pricing`, `/cookies`, `/privacy`, `/terms` | Estáticas | No |

- **Generación del plan:** `planner` → `TripContext.generateTrip()` → `POST /api/plan-trip`.
  Si falla el fetch, cae a **plantillas mock locales** (misma lógica de selección que el
  servidor) — fuente: `TripContext.tsx:112-196`.
- **Persistencia cliente:** los viajes se guardan en `localStorage` (`justenjoy_trips`); el
  `dashboard` y `trip/[id]` leen de ahí — fuente: `TripContext.tsx`.
- **Auth:** `AuthContext` establece la cookie de servidor vía `POST /api/auth/session` tras el
  login de Firebase, con reintento y fail-closed (si el servidor no crea la sesión, hace
  `signOut`) — fuente: `AuthContext.tsx:61-83,136-163`.
- **UX de espera:** `generateTrip` reproduce 9 pasos animados de ~500 ms **simulados** aunque
  el plan ya haya llegado (cosmético) — fuente: `TripContext.tsx:23-33,177-187`.

> **[HUECO / hallazgo relevante]** El **webhook de refinamiento (`/webhook/travel-refine`,
> Ruta B) NO tiene ningún consumidor en el frontend.** La barra "Reconstruir viaje" /
> "Más económico" / "Premium" (`RegenerateActionBar` → `handleRegenerateAction`) **no** llama a
> `travel-refine`: modifica las preferencias y lanza un **plan nuevo completo** vía
> `/api/plan-trip` — fuente: `results/page.tsx:53-76`, y búsqueda `grep -i refine` en
> `frontend/src` (0 llamadas al webhook). Toda la maquinaria de sesión/refinamiento de n8n
> (nodos 02, 03, agente de refinamiento) queda hoy **sin usar desde el portal**.

---

## 10. Nodos Code 03, 07 y 09 (cierre del código n8n)

Con estos se completa la lectura de los 10 nodos Code versionados en `n8n/nodes-code/`.

- **`03_parsear_refinamiento.js`** — parsea el JSON del agente de refinamiento; si el parse
  falla, degrada a re-ejecutar el plan completo (`steps_to_run: 'all'`) sin romper. Fuerza
  `status: 'awaiting_search'` y **preserva el `plan` original** desde `current_session` (fix
  v25.3: el agente de refinamiento no gestiona el plan) — fuente: `03_parsear_refinamiento.js:13-37`.
- **`07_logger_metricas.js`** — añade `result._debug` con `execution_time_ms` y `plan_metrics`
  (activities_found, itinerary_days, plan_notes, warnings, has_flights, has_hotel, tools_called).
  **[Deuda documentada en el propio código]** la captura de consumo de tokens fue ELIMINADA en
  v34: nunca funcionó porque el item del nodo Agent es `{output:"..."}` sin `tokenUsage`; el dato
  real vive en el sub-nodo del modelo, inaccesible desde un Code node — fuente: `07_logger_metricas.js:3-10`.
- **`09_extraer_record.js`** — trivial: extrae `_supabase_record` para el nodo Supabase; si no
  existe devuelve `{_no_record: true}` — fuente: `09_extraer_record.js`.

> **[Observación]** El campo `_debug` (nodo 07) y los campos `_supabase_record`/`_skip_supabase`
> (nodo 08) viajan en la respuesta HTTP; el frontend los ignora, pero son **fuga de campos
> internos** en el contrato de salida — coincide con lo ya anotado en `docs/ARCHITECTURE.md:141`.

---

## Apéndice — Inconsistencias detectadas (para fases posteriores)

1. **Modelo LLM:** docs dicen GPT-4o; el workflow usa `gpt-4.1`. (§2.2)
2. **Nº de tools:** docs dicen 5 (incl. Maps Directions); el workflow tiene 4. (§3.1)
3. **Versión n8n:** `:latest` vs "2.23.2+" documentado. (§2.1)
4. **Stripe/Botpress:** declarados en la narrativa, ausentes en el código. (§2.4)
5. **Esquema Supabase:** sin DDL versionado. (§5.2)
6. **Estado de sesión volátil:** en memoria de n8n, se pierde al reiniciar. (§5.1)
7. **Webhook de refinamiento huérfano:** `travel-refine` (Ruta B) y toda su cadena de
   sesión no se invocan desde el frontend; "Reconstruir" lanza un plan nuevo entero. (§9.2)
8. **Fuga de campos internos:** `_debug`, `_supabase_record`, `_skip_supabase` viajan en la
   respuesta HTTP. (§10)
9. **Métricas de tokens no capturadas:** eliminado en v34, inaccesible desde Code node. (§10)
10. **Lógica de negocio en prompts NL:** el comportamiento del planificador vive en un
    `systemMessage` de 12 KB acoplado a `06_validar_output.js`. (§8.2)
