# Spec — Manejo honesto de respuestas incompletas de n8n (needs_user_input / warnings)

- **Fecha:** 2026-07-04
- **Tipo:** bugfix de comportamiento (con UI nueva de aviso)
- **Estado:** PROPUESTA — pendiente de aprobación humana. **No codificar hasta el OK** (AGENTS.md §4).
- **Rama prevista:** `bugfix/frontend-respeta-needs-user-input`

## Contexto

Verificado en local con n8n real: cuando n8n **no puede completar un plan** (p. ej.
Valencia→Londres sin vuelos), responde:

```
status: "needs_user_input"
warnings: [{ type: "no_valid_flight", detail: "No se encontraron vuelos válidos…",
             proposed_change: "Cambiar fechas o buscar desde otro aeropuerto",
             requires_user_approval: true }]
flights/hotel/activities/daily_itinerary: vacíos ; cost_summary: 0
```

El frontend **ignora `status` y `warnings`**: `mapN8nToTripData` mapea igualmente y
rellena los huecos con **valores por defecto fijos** (hotel "Recomendado en X / Centro
Histórico / 95€ / 285€", itinerario placeholder "Día libre / Explorar la ciudad", vuelo
con hora por defecto, score 90, alternativas Oporto/Roma). Como esos defaults son
siempre iguales, **cada plan fallido se ve idéntico** → percepción de "siempre devuelve
la misma información" y de datos falsos. Además el vuelo por defecto se renderiza como
"Invalid Date".

La conexión frontend↔n8n **funciona**; el defecto es que el frontend **enmascara** los
fallos de n8n en vez de comunicarlos.

## Qué hace

- `/api/plan-trip` detecta cuando la respuesta de n8n **no es un plan usable** y, en vez
  de devolver un `TripData` relleno de defaults, devuelve una respuesta discriminada
  `{ status: 'needs_user_input', warnings: [...] }` (con los `warnings` reales de n8n).
- `TripContext.generateTrip` detecta esa respuesta: **no** guarda un viaje falso en
  `localStorage` ni navega a `/results`; propaga los `warnings` al llamador.
- El **planner** muestra el aviso real de n8n (p. ej. "No encontramos vuelos para esas
  fechas — prueba otras fechas o un aeropuerto cercano") y deja al usuario corregir la
  entrada. No se genera un viaje de mentira.

## Qué NO hace (fuera de alcance)

- **No** cambia el contrato del webhook de n8n ni el workflow (solo **consume** `status`/
  `warnings` que n8n **ya** envía).
- **No** arregla por qué n8n no encuentra vuelos (eso es del workflow v26 / SerpAPI →
  backend, Rodrigo). Esta spec solo hace que el frontend lo comunique con honestidad.
- **No** elimina el relleno de defaults para planes **parcialmente** completos: si n8n
  devuelve un plan usable al que le falta alguna pieza, se sigue rellenando esa pieza
  (comportamiento actual). Solo se corta cuando el plan es **inservible**.
- **No** toca `types/trip.ts`, `mockTripData.ts`, `DayPlanCard.tsx` ni otros ficheros de
  la rama de Rodrigo (el tipo de la respuesta se define en `route.ts`/`TripContext`).

## Flujo de usuario

1. El usuario completa el wizard y pulsa generar.
2. Si n8n devuelve un plan usable → como hoy: se guarda y navega a `/results`.
3. Si n8n devuelve `needs_user_input` (o plan vacío) → **no** navega; el planner muestra
   el aviso de n8n y sugiere el cambio (fechas/aeropuerto). El usuario ajusta y reintenta.

## Decisiones a confirmar

| # | Decisión | Propuesta (recomendada) | Alternativa |
|---|---|---|---|
| D1 | Forma de la respuesta de `/api/plan-trip` cuando no hay plan | HTTP 200 con union discriminada `{ status, warnings }` (el cliente ramifica por `status`) | HTTP 422 y leer el body de error |
| D2 | Cómo detectar "inservible" | `status === 'needs_user_input'` **o** (sin vuelo outbound **y** sin hotel **y** sin itinerario) | Solo confiar en `status` |
| D3 | Dónde se muestra el aviso | En el **planner** (se queda, banner con `detail` + `proposed_change`) | Página dedicada de "necesita ajustes" |
| D4 | Planes parciales (usables pero incompletos) | Mantener el relleno de defaults por pieza | Cortar también en parciales |

## Ficheros que toca (previsto)

- `frontend/src/app/api/plan-trip/route.ts` — tras recibir la respuesta de n8n, si no es
  usable, devolver `{ status, warnings }` en vez de `mapN8nToTripData(...)`. (El mapper no
  cambia.)
- `frontend/src/context/TripContext.tsx` — `generateTrip` detecta `status: needs_user_input`,
  no guarda ni navega, y devuelve/expone los `warnings`.
- `frontend/src/app/planner/page.tsx` (+ posible pequeño componente de aviso) — mostrar el
  aviso real y permitir reintentar.

## Qué puede salir mal / riesgos

- **Falsos negativos/positivos en la detección:** un plan parcial válido podría
  confundirse con "inservible". Mitigación: priorizar el `status` explícito de n8n y usar
  la heurística de vacío solo como respaldo (D2).
- **Cambio de forma en la API interna:** `/api/plan-trip` pasa a poder devolver dos
  formas; hay que actualizar **todos** los consumidores (`generateTrip`). No afecta al
  contrato de n8n.
- **UX:** hay que dejar claro al usuario que puede reintentar; no dejarlo en un limbo.

## Verificación (tras implementar)

- `.\verify.ps1` verde (tsc gate).
- E2E local contra n8n real:
  - Valencia→Londres (sin vuelos) → el planner muestra el aviso `no_valid_flight`, **no**
    navega a `/results`, **no** guarda viaje falso.
  - Un destino con plan usable (p. ej. el que devuelva `plan_ready` con vuelos) → sigue
    generando y navegando como hoy.
- `/code-review` obligatorio antes del PR.

## Dependencias / auditoría

- Ninguna nueva.
