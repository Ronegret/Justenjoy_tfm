# Spec — Conectar el refinamiento (RUTA B de v38) desde la página de detalle del viaje

- **Fecha:** 2026-07-23
- **Tipo:** funcionalidad nueva (UI nueva + nuevo consumo de webhook n8n)
- **Estado:** PROPUESTA — pendiente de validación humana. Toca el contrato de la API
  (nueva webhook + propagación de `session_id`) → requiere aprobación previa de Rodrigo
  (AGENTS.md §3.2). No se codifica nada hasta aprobar.
- **Rama (prevista):** `feature/refinamiento-plan-frontend`

## Contexto

El workflow v38 ya expone **dos webhooks**:

| Ruta | Path | Entrada | Salida |
|---|---|---|---|
| A (planificar) | `travel-planner` | `{ origin_city, destination_city, dates, travelers... }` | plan completo |
| **B (refinar)** | `travel-refine` | `{ session_id, feedback_text, current_plan }` | mismo esquema de plan, `revision_count` +1 |

La RUTA B funciona de extremo a extremo en n8n (verificado con
[`output-plan-v38-e2e-refinamiento.json`](../../n8n/examples/output-plan-v38-e2e-refinamiento.json):
`revision_count: 2`, `status: plan_ready`). Su flujo es: `Cargar Sesión` (estado en
memoria indexado por `session_id`) → `Agente de Refinamiento` (GPT-4o-mini) interpreta
`feedback_text` y decide qué `steps_to_run` re-ejecutar → mismo Motor Planificador de la
RUTA A → devuelve el plan revisado.

**El portal nunca la invoca.** El frontend solo conoce `N8N_WEBHOOK_URL` (→ RUTA A) en
[`route.ts:1024`](../../frontend/src/app/api/plan-trip/route.ts#L1024). Búsqueda de
`travel-refine` / `feedback_text` / `current_plan` en todo `frontend/` → cero resultados.
El botón "Ajustar y Regenerar" de `/results` **no** es refinamiento: muta preferencias y
lanza una planificación **completa desde cero** por la RUTA A
([`results/page.tsx:53`](../../frontend/src/app/results/page.tsx#L53)), perdiendo el estado
del plan anterior y pagando de nuevo toda la búsqueda.

Además, la pantalla donde el usuario **querría** refinar —el detalle completo del viaje
`/trip/[id]`— **no tiene ningún control de ajuste**. La única barra vive en `/results`,
una pantalla intermedia que el usuario abandona al pulsar "Ver plan completo".

## Qué hace

- Añade un **control de refinamiento** en la página de detalle del viaje `/trip/[id]`: una
  **caja de texto libre** ("¿Qué cambiarías de este plan?") + un pequeño juego de
  **sugerencias rápidas** (chips que rellenan el texto: "Más barato", "Menos caminatas",
  "Más cultura"…). Al enviar, muestra estado de carga y, al volver, **reemplaza el plan
  mostrado** por la versión refinada.
- Añade una **ruta interna nueva** en el frontend (p. ej. `/api/refine-trip`) que reenvía
  a la webhook `travel-refine` de n8n el `{ session_id, feedback_text, current_plan }` y
  mapea la respuesta con el **mismo `mapN8nToTripData` ya existente** (la salida de la
  RUTA B tiene el mismo esquema que la RUTA A).
- **Propaga y persiste el `session_id`** del plan para poder refinar: hoy `TripData`
  guarda `trip_id` (que para planes reales de n8n **ya es** el `session_id`, ver
  [`route.ts:514`](../../frontend/src/app/api/plan-trip/route.ts#L514)), pero no de forma
  explícita ni fiable para fallbacks. Se guarda el `session_id` como campo propio.
- Reutiliza el manejo de `needs_user_input` ya existente: si el refinamiento no puede
  completarse, muestra los `warnings` en vez de fingir un plan.

## Qué NO hace (fuera de alcance)

- **No** modifica el workflow n8n ni la webhook `travel-refine` (solo la **consume**; ya
  existe y funciona).
- **No** toca la barra "Ajustar y Regenerar" de `/results` en esta spec (sigue como está,
  por la RUTA A). Si se decide unificar, va en spec aparte.
- **No** implementa historial de revisiones ni "deshacer" (volver a una revisión anterior).
  Cada refinamiento reemplaza el plan visible; el historial vive en Supabase del lado n8n
  (un registro por `plan_ready`, mismo `session_id`), no en el frontend.
- **No** resuelve la caducidad del estado de sesión en memoria de n8n (ver riesgos): eso es
  del backend/Rodrigo. El frontend solo lo maneja con gracia si falla.

## Flujo de usuario

1. El usuario está en `/trip/[id]` viendo su plan completo.
2. Escribe en la caja de refinamiento (o pulsa un chip que la rellena) y envía.
3. El frontend llama a `/api/refine-trip` con `{ session_id, feedback_text, current_plan }`.
4. n8n re-ejecuta solo los pasos afectados y devuelve el plan revisado.
5. El frontend mapea la respuesta y **actualiza el viaje mostrado** (mismo `trip_id`/
   `session_id`), guardándolo en `localStorage`.
6. Si n8n devuelve `needs_user_input` / error de sesión → se muestra el aviso y el plan
   actual se conserva intacto.

## Decisiones a confirmar

| # | Decisión | Propuesta (recomendada) | Alternativa |
|---|---|---|---|
| D1 | ¿Dónde va el control? | En `/trip/[id]` (donde el usuario ve el plano completo) | Reactivar/duplicar la barra de `/results` |
| D2 | Forma del control | Caja de texto libre + chips de sugerencia que rellenan el texto | Solo botones preset (sin texto libre) |
| D3 | Qué mandar como `current_plan` | El **plan crudo de n8n** (hay que persistirlo, hoy no se guarda) | No mandarlo y confiar en `Cargar Sesión` de n8n (memoria por `session_id`) |
| D4 | Ruta interna | Nueva `/api/refine-trip` (separa responsabilidades) | Ampliar `/api/plan-trip` con un modo `refine` |
| D5 | Nueva env var | `N8N_REFINE_WEBHOOK_URL` (+ `.env.example`) | Derivarla de `N8N_WEBHOOK_URL` por reemplazo de path |
| D6 | Fallback si no hay `session_id` real (plan mock/OpenAI) | Ocultar el control (refinamiento solo para planes de n8n) | Degradar a replanificación completa (RUTA A) |
| D7 | ¿Cómo se acredita que el plan es de quien lo refina? | **Token firmado en el frontend** (`refine_token` = HMAC de `uid`+`session_id` con `REFINE_TOKEN_SECRET`), sin tocar n8n ni Supabase | Validar el `uid` en n8n (cambia el contrato del webhook) · columna de propietario en Supabase (DDL nuevo) |

> **D7 se añadió durante la implementación**, tras detectar en la revisión que autenticar no
> basta: el `session_id` lo aporta el cliente, así que sin firma cualquier usuario con cuenta
> podría refinar —y leer— el plan de otro. Implica **campo nuevo** `refine_token` en `TripData`
> (contrato interno) y **env nueva** `REFINE_TOKEN_SECRET`. Los planes ya guardados no llevan
> token y dejan de ser refinables (hay que recrearlos). Ver auditoría §0.5.

> **D3 es la decisión crítica.** La RUTA B espera `current_plan`, pero también hace
> `Cargar Sesión` desde su memoria interna indexada por `session_id`. Si la memoria es la
> fuente de verdad, persistir el plan crudo en el frontend puede ser innecesario; si no, es
> obligatorio. Hay que confirmar con Rodrigo **cuál gana** y si el estado sobrevive a
> reinicios de n8n.

## Ficheros que toca (previsto)

- `frontend/src/components/trip/` — **componente nuevo** de refinamiento (caja + chips +
  estado de carga).
- `frontend/src/app/trip/[id]/page.tsx` — montar el componente nuevo.
- `frontend/src/app/api/refine-trip/route.ts` — **ruta nueva**: auth (igual que
  `plan-trip`), reenvío a `N8N_REFINE_WEBHOOK_URL`, mapeo con `mapN8nToTripData`.
- `frontend/src/context/TripContext.tsx` — función `refineTrip(...)`; persistir/actualizar
  el viaje revisado.
- `frontend/src/types/trip.ts` — añadir `session_id` (y, si D3=crudo, el plan n8n crudo) a
  `TripData`. **Requiere coordinar con Rodrigo** (es de su rama).
- `frontend/src/app/api/plan-trip/route.ts` — exponer `session_id` explícito en la
  respuesta mapeada (hoy va camuflado en `trip_id`).
- `.env.example` + `frontend/.env.local.example` — `N8N_REFINE_WEBHOOK_URL`.
- `docs/ARCHITECTURE.md` + `n8n/examples/` — documentar el nuevo consumo y añadir ejemplo
  de entrada/salida del refinamiento desde el frontend (AGENTS.md §9.2).

## Qué puede salir mal / riesgos

- **Estado de sesión en memoria de n8n (crítico):** la arquitectura v38 persiste la sesión
  "en memoria indexada por `session_id`" (doc arquitectura §3, punto 13). Si n8n se
  reinicia o la sesión caduca, `Cargar Sesión` falla → la RUTA B devuelve error 400. El
  frontend debe manejarlo (mensaje claro + opción de replanificar por RUTA A), no romperse.
- **`session_id` no fiable en fallbacks:** los planes de OpenAI/Claude/mock no tienen
  `session_id` de n8n → no son refinables. Mitigación: D6 (ocultar el control).
- **Contrato de la API interna:** `/api/refine-trip` y el campo `session_id` en `TripData`
  son cambios de contrato → aprobación previa (AGENTS.md §3.2) y ejemplo en `n8n/examples/`.
- **Coordinación con la rama de Rodrigo:** tocar `types/trip.ts` puede chocar con su trabajo.
- **Coste:** cada refinamiento consume LLM + SerpAPI de los pasos re-ejecutados. Aun así es
  más barato que la RUTA A (re-ejecuta solo los pasos afectados, no todo).

## Verificación (tras implementar)

- `.\verify.ps1` en verde (gate tsc del frontend).
- E2E local contra n8n real:
  - Plan Barcelona (`plan_ready`) → escribir "hazlo más barato" → vuelve un plan con
    `revision_count` incrementado y coste menor; el viaje mostrado se actualiza.
  - Sesión inexistente/caducada → aviso claro, el plan actual se conserva.
  - Plan de fallback (sin `session_id` n8n) → el control no aparece (D6).
- Ejemplo nuevo en `n8n/examples/` que documente entrada/salida del refinamiento vía
  frontend.
- `/code-review` obligatorio antes del PR (AGENTS.md §10).

## Dependencias / auditoría

- Ninguna dependencia npm nueva prevista.
