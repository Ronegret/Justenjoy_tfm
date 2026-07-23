# Spec — Búsqueda persistente de clientes (server-side, sobre `plan_holders`)

- **Fecha:** 2026-07-23
- **Tipo:** funcionalidad nueva (endpoint server-side nuevo + **nodo de lectura nuevo en el
  workflow n8n** + wiring en `/dashboard`).
- **Estado:** **PROPUESTA — pendiente de validación humana.** Añade un flujo que **lee PII real
  de clientes** (`plan_holders`) y **añade estructura al workflow n8n** → AGENTS.md §3.2
  (acción sobre datos reales de clientes **y** nodos/conexiones nuevas del workflow) y §9.1
  (ejemplo nuevo en `n8n/examples/`). **No se codifica nada hasta aprobar.** La aprobación de
  la spec puede darla cualquier miembro del equipo; el **merge** y el **acceso a infra** dependen
  de admin ([[owner-y-permisos-github]]).
- **Rama (prevista):** `feature/buscador-clientes-servidor`
- **Depende de:** la tabla `plan_holders` y su endurecimiento RLS
  ([2026-07-23-rgpd-plan-holders-rls.md](2026-07-23-rgpd-plan-holders-rls.md)). La lectura la
  hace n8n con `service_role`, que sigue funcionando tras activar RLS.
- **Resuelve:** la limitación conocida de
  [2026-07-23-buscador-clientes-dashboard.md](2026-07-23-buscador-clientes-dashboard.md)
  (§"Interacción crítica con la minimización de PII").

## Decisiones tomadas (equipo, 2026-07-23)

| # | Decisión | Elegido |
|---|---|---|
| **D1** | ¿Dónde ocurre la búsqueda por cliente? | **(B) Server-side pura** — el servidor filtra y devuelve **solo los `session_id` que casan**; el PII **nunca** sale del servidor. La tarjeta del dashboard no muestra el titular, así que no se necesita en el cliente. |
| **D2** | ¿Cómo accede el servidor a `plan_holders`? | **(2) Vía webhook n8n** — Next.js reenvía a un webhook de lectura nuevo en n8n, que consulta Supabase. El `service_role` **queda solo en n8n** (no entra en el frontend/Vercel). Coste: nodos nuevos en el workflow (§3.2). |
| **D3** | ¿Qué identidad autoriza? | **Sesión válida + posesión de `session_id`** — el endpoint exige cookie `justenjoy-session` (como `/api/plan-trip`) y solo consulta los `session_id` que el cliente aporta. Coherente con el modelo actual (sin `user_id`). |

## Contexto

El buscador de `/dashboard` (PR #73) filtra por titular (nombre/teléfono/email) y por
destino/título, pero **solo en la sesión activa**: el `holder` es PII y **no se persiste en
`localStorage`** ([`TripContext.tsx:80-85`](../../frontend/src/context/TripContext.tsx#L80-L85),
`stripHolderForStorage`). Tras recargar, `savedTrips` se rehidrata **sin** `holder`, así que la
búsqueda por cliente deja de encontrar nada y solo funciona por destino/título.

La fuente de verdad del titular es **`plan_holders`** en Supabase, ligada al plan por
`session_id`. En el frontend, `trip_id === session_id` para los planes reales de n8n
([`route.ts:531`](../../frontend/src/app/api/plan-trip/route.ts#L531)), y ese `trip_id` **sí**
persiste en `localStorage`. El navegador conoce **qué planes posee**; solo le falta consultar
el match por cliente en el servidor.

## Qué hace

- Añade un endpoint autenticado **`POST /api/holders/search`** en Next.js que:
  1. Verifica la sesión con Firebase Admin (mismo guardián que `/api/plan-trip`).
  2. Reenvía `{ session_ids, query }` a un **webhook de lectura nuevo de n8n**.
  3. Devuelve al cliente **`{ matching_session_ids }`** — **sin PII**.
- Añade al workflow n8n una **rama de lectura** (webhook nuevo, p. ej. path `holders-search`):
  - **Nodo Supabase** (`getAll` sobre `plan_holders`) filtrando **por `session_id`** entre los
    aportados —usando el filtro propio del nodo, **no** `httpRequest`+`qs`, que no filtró en el
    sandbox ([[n8n-code-node-httprequest-qs]])—.
  - **Code node** que normaliza (sin acentos/separadores, mismo criterio que el cliente) y casa
    la `query` contra nombre/apellidos/teléfono/email, devolviendo **solo los `session_id`** que
    coinciden (nunca el PII).
- `/dashboard` llama al endpoint cuando hay búsqueda activa y combina su resultado (match por
  cliente, **persistente entre recargas**) con el filtro en cliente por **destino/título**.
- Ajusta el microcopy del buscador (elimina la nota de "solo sesión activa").

## Qué NO hace (fuera de alcance)

- **No** devuelve PII al navegador ni la reintroduce en `localStorage`.
- **No** mete `service_role` en el frontend (queda solo en n8n, por D2=2).
- **No** añade `user_id` ni cambia el esquema de `plan_holders`/`travel_plans`.
- **No** añade paginación, orden, filtros avanzados ni un CRM de leads.
- **No** añade dependencias npm.

## Flujo de usuario

1. El usuario abre `/dashboard` (recargado): `savedTrips` viene de `localStorage`, con
   `trip_id`/`session_id` pero **sin** `holder`.
2. Escribe en la caja (nombre/email/teléfono de cliente, o destino).
3. El dashboard pide a `/api/holders/search` los `session_id` que casan por cliente (para el
   conjunto de `trip_id` que posee) y, en paralelo, filtra por destino/título en cliente.
4. La grid muestra la unión de ambos criterios. **Persistente entre recargas.**
5. Sin resultados → `EmptyState` de "sin resultados" (ya existente).

## Contrato de datos

**Endpoint Next.js (interno del frontend):**
```jsonc
// POST /api/holders/search   (requiere cookie justenjoy-session)
// Request
{ "session_ids": ["8Kym…", "justenjoy-…"], "query": "jose perez" }
// Response 200
{ "matching_session_ids": ["8Kym…"] }        // subconjunto; SIN datos personales
// 401 sin sesión · 400 cuerpo inválido · 502/503 si n8n no responde
```

**Webhook n8n nuevo (cambio de contrato del workflow — requiere aprobación §3.2 + ejemplo):**
```jsonc
// POST /webhook/holders-search
// In:  { "session_ids": [...], "query": "..." }
// Out: { "matching_session_ids": [...] }      // SIN PII de salida
```

## Ficheros que toca (previsto)

- `frontend/src/app/api/holders/search/route.ts` — **nuevo**: guardián de sesión + reenvío al
  webhook n8n + respuesta sin PII.
- `frontend/src/lib/text.ts` — (posible) exponer la normalización para reutilizar el criterio;
  la normalización de match vive en el code node de n8n (no en el frontend, por D1=B).
- `frontend/src/app/dashboard/page.tsx` — llamar al endpoint y combinar con el filtro por
  destino/título; actualizar microcopy.
- `n8n/nodes-code/12_buscar_titulares.js` — **nuevo** code node: normaliza + casa la query,
  emite solo `session_id`. (Editar `jsCode` vía `_inject.py`, no a mano — [[nodes-code-roundtrip-y-eof-hook]].)
- `n8n/workflows/Planificador_de_Viajes_v39.json` — **nodos nuevos** (webhook `holders-search`,
  nodo Supabase `getAll` sobre `plan_holders`, code node, respuesta) + conexiones. Mismo id.
- `n8n/docs/Planificador_Viajes_v39_Arquitectura.md` — documentar la rama de lectura (§9.1).
- `n8n/examples/` — ejemplo entrada/salida del nuevo webhook (obligatorio por §9.1).
- `.env.example` — URL del webhook de lectura de n8n (si se separa de `N8N_WEBHOOK_URL`).
- `docs/ARCHITECTURE.md` — nuevo flujo de lectura frontend → n8n → Supabase para el dashboard.

## Qué puede salir mal / riesgos

- **Ampliar el workflow n8n (D2=2):** nodos/conexiones nuevas → aprobación §3.2, ejemplo §9.1 y
  round-trip de `nodes-code`. Reprovisionar con `down && up -d` (upsert, mismo id) según
  [[v31-activo-y-provision-n8n]]. Más latencia por el salto extra Next→n8n→Supabase.
- **Filtrado fiable en n8n:** usar el **nodo Supabase** para filtrar por `session_id`; **no**
  `httpRequest`+`qs` (devolvió todas las filas en el sandbox — [[n8n-code-node-httprequest-qs]]).
- **Autorización por posesión de `session_id` (D3):** un usuario autenticado podría pedir el
  match de cualquier `session_id` que conozca; los `session_id` reales no son adivinables y la
  respuesta **no** incluye PII (solo `session_id`), así que la fuga máxima es "este id casa/《no
  casa》esta query". Coherente con el modelo actual (sin `user_id`). Se documenta como aceptada.
- **Dependencia de la RLS:** funciona igual antes o después de activar RLS (n8n usa
  `service_role`); coordinar con la spec RGPD para cerrar `anon`.
- **Rehidratación de mocks:** los `trip_id` de `mockTrips` no existen en `plan_holders`; el
  endpoint simplemente no los devuelve. Sin efecto adverso.

## Verificación (tras implementar)

- `.\verify.ps1` en verde (gate tsc del frontend + JSON del workflow válido).
- Round-trip de `nodes-code`: el `.js` nuevo reinyecta byte-idéntico (`_inject.py`/`_smoketest`).
- E2E local (n8n real + Supabase con RLS activado):
  - Generar un plan **con** titular, **recargar** `/dashboard`, buscar por nombre/email/teléfono
    → **encuentra** el plan (corrige la regresión).
  - Buscar por destino/título → sigue funcionando (ruta cliente).
  - `session_ids` ajenos/inventados → el endpoint/n8n no filtran fuera de los aportados.
  - Sin cookie de sesión → 401.
- Confirmar por inspección de red que la respuesta **no** contiene PII (solo `session_id`s).
- Ejemplo nuevo en `n8n/examples/` del webhook de lectura.
- `/code-review` obligatorio sobre el diff antes del PR (AGENTS.md §10).

## Notas

- No existe `docs/SPEC_TEMPLATE.md` pese a referenciarlo AGENTS.md §0.2/§4; esta spec sigue la
  estructura de las specs aprobadas existentes. (Gap menor, para otra tarea.)
