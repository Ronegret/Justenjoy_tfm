# Arquitectura del sistema — Just Enjoy

> **Estado:** en desarrollo (TFM Grupo 7 · EBIS Business TechSchool · Junio 2026)
> **Actualiza este fichero cada vez que cambie la arquitectura.**

---

## Visión general

Just Enjoy es una **plataforma de hiperautomatización para la planificación de viajes**.
Transforma el proceso manual (30-60 min por cliente) en un flujo automatizado
que cubre el ciclo completo: Captación → Curación → Transacción → Fidelización.

El sistema es **no-code/low-code**: no hay servidor de aplicación tradicional.
La lógica vive en herramientas de orquestación y en LLMs, conectados mediante APIs.

---

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTE                                                        │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │   Botpress   │    │   Portal del Viajero (Frontend)      │  │
│  │  (chat IA)   │    │   Landing privada por cliente        │  │
│  └──────┬───────┘    └──────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────────────┘
          │ POST webhook (JSON travel_brief)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n  (orquestador — motor del sistema)                        │
│                                                                 │
│  Ruta A: Formulario inicial                                    │
│    Webhook → Validar → Preparar → Convertir IATA               │
│    → Motor Planificador (Agent 2 / GPT-4o)                     │
│    → Validar Output → Logger → Responder                       │
│                                                                 │
│  Ruta B: Refinamiento iterativo                                │
│    Webhook → Cargar Sesión → Agente Refinamiento (GPT-4o-mini) │
│    → Parsear → Preparar → Motor Planificador → Responder       │
└────────────────────┬────────────────────────────────────────────┘
                     │ Tool calls (paralelo)
          ┌──────────┴──────────────────────────┐
          ▼                                     ▼
┌──────────────────┐                 ┌──────────────────────────┐
│  SerpAPI         │                 │  Tavily                  │
│  · Google Flights│                 │  (búsqueda web)          │
│  · Google Hotels │                 │  · Visado y clima        │
│  · Google Maps   │                 │  · Fallback actividades  │
│  · Maps Direction│                 └──────────────────────────┘
└──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Output JSON estructurado                                       │
│  (plan completo: vuelos, hotel, actividades, itinerario diario) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes principales

### 1. Botpress — Agente conversacional (Captación)
- **Rol:** punto de contacto con el cliente.
- **Función:** capturar preferencias mediante Smart Chips y lenguaje natural.
- **Output:** JSON `travel_brief` enviado al webhook de n8n.
- **Estado:** pendiente de integrar en este repositorio.

### 2. n8n — Orquestador (Curación + Transacción)
- **Rol:** motor del sistema. Gestiona toda la lógica condicional y las llamadas a APIs.
- **Versión canónica:** v40 (ver `n8n/docs/Planificador_Viajes_v40_Arquitectura.md`).
  El código de sus 11 nodos Code vive versionado en `n8n/nodes-code/`. Las versiones
  anteriores (v24–v38) están congeladas en `n8n/workflows/archive/`.
- **Despliegue:** self-hosted. URL expuesta via ngrok en desarrollo.
- **Workflow único:** simplifica el testeo (una sola importación en n8n).

### 3. LLMs — Motor de decisión
- **Motor Planificador:** GPT-4o (temperature 0.1, maxTokens 4096)
- **Agente de Refinamiento:** GPT-4o-mini (temperature 0.1, maxTokens 1024)
- **Migración a Claude posible:** el sistema prompt es compatible; el nodo LLM
  de n8n se puede cambiar sin tocar la lógica.

### 4. APIs externas

| API | Proveedor | Uso | Plan |
|---|---|---|---|
| Google Flights | SerpAPI | Búsqueda de vuelos reales | Gratuito (250 búsquedas/mes) |
| Google Hotels | SerpAPI | Búsqueda de hoteles con rating | Gratuito |
| Google Maps | SerpAPI | Actividades en el destino | Gratuito |
| Google Maps Directions | SerpAPI | Traslado aeropuerto→hotel | Gratuito |
| Tavily | Tavily | Información de destino + fallback | Gratuito |
| Stripe Connect | Stripe | Pagos y comisiones (futuro) | Por transacción |

### 5. Frontend — Portal del Viajero (Fidelización)
- **Rol:** landing privada generada automáticamente por cliente.
- **Contenido:** itinerario visual, documentos, recordatorios, feedback post-viaje.
- **Estado:** pendiente de desarrollar.

---

## Flujo de datos principal

```
Cliente rellena formulario / chat Botpress
  └→ JSON travel_brief (origen, destino, fechas, presupuesto, preferencias)
       └→ POST /webhook/travel-planner (n8n)
            └→ Validación y construcción de session_state
                 └→ Motor Planificador (GPT-4o + 5 tools en paralelo)
                      ├→ SerpAPI Flights  → vuelo óptimo
                      ├→ SerpAPI Hotels   → hotel con mejor rating
                      ├→ Google Maps      → actividades (scoring por intereses)
                      ├→ Maps Directions  → traslado aeropuerto→hotel
                      └→ Tavily          → visado, clima, transporte local
                           └→ Plan completo (JSON estructurado)
                                └→ Respuesta HTTP 200 al frontend
                                     └→ Portal del Viajero renderiza el plan
```

---

## Contrato de la API (webhook)

### Entrada (POST `/webhook/travel-planner`)
Ver `n8n/examples/input-formulario.json` para el esquema completo.
Campos obligatorios: `origin_city`, `destination_city[]`, `departure_date`,
`return_date`, `travelers`, `budget_total_usd`, `accommodation_type`, `activity_interests[]`.

Campo **opcional** `holder` (`{ first_name, last_name, phone, email, consent_at, consent_version }`):
datos del titular/cliente del plan (novedad de **v39**). Solo se envía con **consentimiento
explícito** (RGPD 6.1.a): `consent_at` (ISO) y `consent_version` son la evidencia; sin ellos el
frontend no manda el `holder` y n8n no lo persiste. Si viene informado, se persiste en la tabla
`plan_holders` de Supabase (rama paralela, no bloqueante; ver §9.1 de
`n8n/docs/Planificador_Viajes_v39_Arquitectura.md`). Ejemplo:
`n8n/examples/input-formulario-con-titular.json`. Contiene PII → tratar según `docs/legal/`.

> ⚠️ **Al probar, usa fechas futuras.** SerpAPI (Google Flights/Hotels) rechaza
> consultas con `outbound_date` en el pasado (`` `outbound_date` cannot be in the
> past ``). Con fechas caducadas el plan vuelve con `status: needs_user_input` y
> warnings `no_valid_flight` / `no_valid_hotel` (las actividades sí aparecen porque
> Google Maps no depende de la fecha). No es un fallo del workflow: actualiza las
> fechas del ejemplo antes de lanzar la prueba.

### Salida (HTTP 200)
Ver `n8n/examples/output-plan.json` (genérico) y
`n8n/examples/output-plan-v29-amsterdam-paris.json` (respuesta real de v29) para el esquema completo.
Campos clave: `status`, `plan.segments[]`, `plan.cost_summary`, `plan.daily_itinerary[]`,
`warnings[]`, `_debug`. Desde v29 la respuesta añade además campos internos de la
persistencia en Supabase (`_supabase_record`, `_skip_supabase`); el frontend los ignora.
Desde v31 cada elemento de `plan.daily_itinerary[]` incluye `lat`, `lng` y
`coordinate_source` (`activity` | `geocoded` | `city_center` | `none`), que alimentan el
mapa del portal del viajero (nodo "Enriquecer Coordenadas (OpenStreetMap)").

### Refinamiento (POST `/webhook/travel-refine`)
Entrada: `{ session_id, feedback_text }` (opcional `current_plan`, forward-compat).
El sistema re-ejecuta **solo los pasos afectados** por el feedback (no replanifica
desde cero), y devuelve un plan con el **mismo esquema que la RUTA A** y
`revision_count` incrementado.

**Consumo desde el frontend (novedad):** la página de detalle del viaje
`/trip/[id]` monta un control de refinamiento (caja de texto libre + chips de
sugerencia) **solo para planes reales de n8n** (los que llevan `session_id`; los
de fallback OpenAI/Claude/mock no son refinables y el control no aparece). El
endpoint autenticado `/api/refine-trip` (server-side) reenvía
`{ session_id, feedback_text }` a este webhook y mapea la respuesta con el
**mismo `mapN8nToTripData`** que `/api/plan-trip` (extraído a
`frontend/src/lib/n8nPlan.ts` para compartirlo). No envía `current_plan`: n8n lo
reconstruye desde su memoria. Env `N8N_REFINE_WEBHOOK_URL`.

> ⚠️ **Estado de sesión en memoria.** `Cargar Sesión` reconstruye el `current_plan`
> desde la memoria interna de n8n (`$getWorkflowStaticData`) indexada por
> `session_id` — esa memoria es la fuente de verdad, no el body. Si n8n se reinicia
> o la sesión caduca, la RUTA B responde error y `/api/refine-trip` lo traduce a
> `session_expired`: el frontend **conserva el plan actual** y avisa, sin fingir un
> plan nuevo. Para cambiar el plan en ese caso hay que replanificar (RUTA A).

> 🔒 **Guardarraíl de datos sensibles (RGPD art. 9).** El `feedback_text` es texto
> libre que acabaría en el LLM y en los buscadores (SerpAPI/Tavily, cuya AUP
> prohíbe datos del art. 9). Antes de reenviar a n8n, `/api/refine-trip` escanea el
> texto con `frontend/src/lib/sensitiveData.ts`: si detecta señales de categorías
> especiales (salud, religión, orientación sexual, ideología, afiliación sindical,
> origen étnico) **no reenvía nada** y responde `blocked_sensitive`, pidiendo al
> usuario reformular en términos de viaje. La UI (`RefineTripPanel`) además avisa de
> forma permanente y pre-chequea en cliente (mismo módulo). El `feedback_text` no se
> registra en logs. Control **best-effort** de minimización, complementario a la base
> jurídica de la política de privacidad (no la sustituye). Ver hallazgo #4 de
> `docs/auditoria-cumplimiento-legal-seguridad.md`.

> 🔒 **Prueba de propiedad del plan.** Autenticar no basta: el `session_id` lo
> aporta el cliente, así que sin más comprobación cualquier usuario con cuenta
> podría refinar —y por tanto **leer entero**— el plan de otra persona con solo
> conocer su `session_id`. Al crear el plan, `/api/plan-trip` firma el par
> (`uid` de Firebase, `session_id`) con HMAC-SHA256 y `REFINE_TOKEN_SECRET`
> (server-only) y devuelve la firma como `refine_token` dentro de `TripData`;
> `/api/refine-trip` la recalcula con el `uid` de la cookie y rechaza con
> `not_refinable` si no casa. El token no contiene datos —solo prueba la
> asociación— y es inútil desde otra cuenta. **Falla cerrado:** sin secreto
> configurado no se emiten tokens y el refinamiento queda deshabilitado. Los
> planes guardados antes de esta medida no llevan token y hay que recrearlos.
> Ver `frontend/src/lib/refineToken.ts`.

**Nota:** el `refine_token` viaja solo entre el navegador y `/api/refine-trip`;
a n8n se le sigue enviando únicamente `{ session_id, feedback_text }`, así que el
contrato del webhook no cambia.

Ejemplos: `n8n/examples/input-refine.json` (entrada desde el frontend) /
`output-plan-v39-e2e-refinamiento.json` (salida real, `revision_count: 2`).

### Búsqueda de titulares (POST `/webhook/holders-search`)
Rama de **lectura** para la búsqueda persistente de clientes en el dashboard (novedad **v39**).
Entrada `{ session_ids[], query }`; salida `{ matching_session_ids[] }` — **solo `session_id`,
sin PII**. El endpoint autenticado `/api/holders/search` (frontend) reenvía aquí los
`session_id` que el cliente posee + la query; n8n consulta `plan_holders` con `service_role`
(que no sale de n8n) y filtra por posesión + query en un code node. Env
`N8N_HOLDERS_SEARCH_WEBHOOK_URL`. Ejemplos: `n8n/examples/input-holders-search.json` /
`output-holders-search.json`. Ver §9.2 de `n8n/docs/Planificador_Viajes_v39_Arquitectura.md`.

---

## Gestión de sesiones

El estado de sesión se persiste en `$getWorkflowStaticData('global')` de n8n,
indexado por `session_id`. **Es volátil**: se pierde si n8n se reinicia.
Para producción, migrar a PostgreSQL Memory.

---

## Autenticación (portal del viajero)

El frontend usa **Firebase Auth** en el cliente y una **session cookie firmada
por el servidor** para autorizar peticiones. Modelo de verificación en dos capas:

```
Cliente (Firebase Auth) --ID token--> POST /api/auth/session
                                         │  verifyIdToken (firebase-admin)
                                         │  createSessionCookie (14 días)
                                         ▼
                              cookie httpOnly "justenjoy-session"
   ┌──────────────────────────────────────────────────────────────┐
   │ Proxy (src/proxy.ts)  → verificación LIGERA con jose          │
   │   firma RS256 vs claves públicas de Google + iss/aud/exp      │
   │   protege /dashboard, /planner, /trip                         │
   ├──────────────────────────────────────────────────────────────┤
   │ Route handlers        → verificación AUTORITATIVA (Admin SDK) │
   │   verifySessionCookie(..., checkRevoked) en /api/plan-trip    │
   └──────────────────────────────────────────────────────────────┘
```

- **Fail-closed:** sin credenciales del Admin SDK, los endpoints devuelven 503 y
  el proxy redirige a `/login`.
- **Credenciales del servidor:** service account vía `FIREBASE_ADMIN_*` (ver
  `.env.example`). Secretas; nunca en el repo ni en el cliente.
- La config `NEXT_PUBLIC_FIREBASE_*` sigue siendo pública por diseño (solo Auth).
- Detalle e historial de decisiones: `docs/specs/2026-07-04-auth-verificacion-servidor.md`.

> ⚠️ El despliegue de esta auth **requiere** configurar la service account en el
> entorno (local y Vercel). Sin ella, nadie puede iniciar sesión (fail-closed).

---

## Decisiones de arquitectura

Ver `docs/adr/` para el registro completo de decisiones y su motivación.

---

## Anti-patterns a evitar en este proyecto

- **Hardcodear la URL de ngrok** en código versionado (usar `.env`).
- **Versionar el fichero `.env`** con claves reales.
- **Añadir claves de credenciales** al JSON del workflow (n8n las gestiona aparte).
- **Usar `other_flights[]`** de SerpAPI (solo `best_flights[]`; los otros no están filtrados).
- **Poner coordenadas GPS** de una ciudad incorrecta en la tabla IATA del nodo
  "Convertir Ciudades a IATA" (rompe los resultados de Google Maps).
- **Temperature > 0.1** en los agentes LLM (produce resultados no deterministas
  que dificultan el debugging).
