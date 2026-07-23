# Spec — Registro de los datos del titular/cliente por plan

- **Fecha:** 2026-07-23
- **Tipo:** funcionalidad nueva (UI nueva + cambio de contrato del webhook n8n + tabla
  nueva en Supabase)
- **Estado:** PROPUESTA — pendiente de validación humana. Toca el **contrato de la API**
  (nuevo campo `holder` en el webhook `travel-planner`), añade **nodos al workflow n8n** y
  persiste **datos personales de clientes** (PII) → requiere aprobación previa de Rodrigo
  (AGENTS.md §3.2). **No se codifica nada hasta aprobar.**
- **Rama (prevista):** `feature/registro-titular-plan`

## Contexto

Hoy un plan de viaje **no guarda ningún dato de la persona titular/cliente**. Lo más
parecido es:

- `TripPreferences.travelers` ([`trip.ts:9`](../../frontend/src/types/trip.ts#L9)) → solo
  un **conteo** (adultos + edades de niños), sin nombres ni datos de contacto.
- La cuenta de Firebase Auth (`AuthContext.tsx`) tiene `name` + `email`, pero pertenecen a
  la **cuenta**, no se propagan al payload del plan ni a Supabase, y **no hay teléfono**.

Se quiere poder **registrar, por cada plan, los datos del titular: nombre y apellidos,
teléfono y email**. El dato atraviesa las tres capas del sistema:
frontend (Next.js) → contrato del webhook n8n → persistencia en Supabase.

**Decisiones de diseño ya tomadas** (validadas con el solicitante):

| # | Decisión | Elegido |
|---|---|---|
| D1 | ¿Dónde se persiste? | **Tabla separada `plan_holders`** (no columnas en `travel_plans` ni dentro del JSONB) |
| D2 | ¿Dónde/cómo se captura? | **Paso nuevo en el wizard**, con los 4 campos **en blanco** (sin prellenar desde la cuenta) |
| D3 | ¿Obligatorio? | **Opcional** — el plan se genera sin titular; si se rellena, se guarda |

## Qué hace

- Añade un **paso nuevo y opcional** ("Datos del titular") al wizard del planificador
  (`ChatPlanner`), con cuatro campos en blanco —nombre, apellidos, teléfono, email— y un
  botón **"Omitir"**.
- Propaga esos datos como un objeto **`holder`** en el payload que el frontend ya envía a
  n8n (solo si el usuario los rellenó).
- n8n arrastra `holder` como **passthrough** hasta la persistencia (el planificador no lo
  usa; no afecta a la búsqueda de vuelos/hotel/actividades).
- Persiste el titular en una **tabla nueva `plan_holders`**, ligada al plan por
  `session_id`, mediante un nodo de escritura Supabase nuevo y **no bloqueante**.
- Muestra el titular en la vista del plan (`/trip/[id]`) cuando existe.

## Qué NO hace (fuera de alcance)

- **No** hace obligatorio el titular ni bloquea la generación del plan si falta.
- **No** prellena desde la cuenta de Firebase (decisión D2: campos en blanco).
- **No** añade columnas a `travel_plans` ni cambia su esquema (decisión D1).
- **No** implementa un CRM, edición posterior del titular, ni gestión/baja de leads: solo
  captura y persistencia en el momento de generar el plan.
- **No** añade dependencias npm nuevas (validación manual, como el resto del repo).

## Flujo de usuario

1. El usuario completa el wizard del planificador como hasta ahora.
2. Aparece un paso nuevo "Datos del titular" con 4 campos vacíos y un botón "Omitir".
3a. Si los rellena (todos o algunos) → al generar, el frontend incluye `holder` en el POST.
3b. Si pulsa "Omitir" → el plan se genera igual, sin `holder`.
4. n8n procesa el plan y, en paralelo, si `holder` viene informado, inserta una fila en
   `plan_holders` con el `session_id` del plan.
5. En `/trip/[id]`, si el plan tiene titular, se muestra en un bloque de contacto.

## Contrato de datos (cambio de API)

**Nuevo campo opcional en el payload de entrada del webhook `travel-planner`:**

```jsonc
{
  // ...campos actuales...
  "holder": {
    "first_name": "Ana",
    "last_name": "García",
    "phone": "+34600111222",
    "email": "ana@example.com"
  }
}
```

- Todos los subcampos son opcionales; `holder` se omite si el usuario no rellenó nada.
- `holder` **no** entra en la lista de campos obligatorios de
  [`01_validar_formulario.js`](../../n8n/nodes-code/01_validar_formulario.js) (no rompe el
  contrato existente); se añade a `session_state.travel_brief.holder` como passthrough.

**Tabla nueva en Supabase (DDL manual — el repo no tiene migraciones, solo DDL en prosa):**

```sql
CREATE TABLE plan_holders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,   -- referencia a travel_plans.session_id (indexado, SIN FK dura)
  first_name TEXT,
  last_name  TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Sin FK dura a `travel_plans.session_id`: así el lead se guarda **aunque el plan no llegue
> a `plan_ready`** (valor de captación). RLS desactivado, coherente con `travel_plans`.

## Ficheros que toca (previsto)

- `frontend/src/types/trip.ts` — interfaz nueva `PlanHolder` + campo opcional `holder?` en
  `TripPreferences` y `TripData`. **Coordinar con la rama de refinamiento** (también toca
  este fichero).
- `frontend/src/components/planner/ChatPlanner.tsx` + `frontend/src/app/planner/page.tsx` —
  paso nuevo de captura (no tocar `PreferenceWizard.tsx`, es legacy no renderizado).
- `frontend/src/app/api/plan-trip/route.ts` — `mapPreferencesToN8n` envía `holder`;
  `mapN8nToTripData` lo recupera a `TripData`.
- `frontend/src/app/trip/[id]/page.tsx` (o componente en `components/trip/`) — mostrar el
  titular si existe.
- `n8n/nodes-code/01_validar_formulario.js` — passthrough de `holder` al `travel_brief`.
- `n8n/nodes-code/11_preparar_payload_titular.js` — **nodo nuevo**: construye el record de
  `plan_holders` (o `_skip_holder: true` si no hay datos).
- `n8n/workflows/Planificador_de_Viajes_v39.json` — **workflow nuevo** (copia de v38, que se
  archiva; mismo id `8Kym9GIgNKp7Nrdh`): nodo code + nodo Supabase (`create`,
  `tableId: plan_holders`, `onError: continueRegularOutput`) + conexiones. El nodo de código
  emite `[]` si no hay titular (sin IF extra). Editar `jsCode` vía `n8n/nodes-code/_inject.py`,
  **no** a mano.
- `docs/ARCHITECTURE.md` + `n8n/docs/Planificador_Viajes_v38_Arquitectura.md` §9 — DDL de
  `plan_holders` y nuevo flujo de escritura (AGENTS.md §9.1).
- `n8n/examples/` — ejemplo nuevo de entrada (con `holder`) y salida que documente el
  contrato (obligatorio por §9.1 al cambiar el contrato).
- Sin `.env` nueva (misma credencial Supabase, distinto `tableId`). Sin dependencias npm.

## Qué puede salir mal / riesgos

- **PII / RGPD (crítico):** se persiste dato personal real de contacto. Debe encajar con la
  documentación legal existente (`docs/legal/politica-privacidad.md`, `ROPA.md`, `EIPD.md`):
  confirmar base legal, finalidad, plazo de conservación y que la tabla queda con RLS y
  acceso coherentes. Actualizar ROPA si procede.
- **Cambio de contrato + nodos n8n + tabla nueva:** requiere aprobación previa de Rodrigo
  (§3.2) y ejemplo en `n8n/examples/` (§9.1).
- **Coordinación de ramas:** `types/trip.ts` y `route.ts` también los toca la spec de
  refinamiento en curso — coordinar para no chocar.
- **Leads huérfanos:** sin FK dura, pueden quedar filas en `plan_holders` sin plan asociado
  (plan que falló). Es intencionado (captación), pero conviene documentarlo.
- **Validación laxa:** al ser opcional y sin librería, un email/teléfono malformado podría
  guardarse. Mitigación: regex simple + `<input type="email">` + saneado básico de teléfono;
  no bloquea, pero evita basura evidente.

## Verificación (tras implementar)

- `.\verify.ps1` en verde (gate tsc del frontend + JSON del workflow válido).
- Round-trip de nodes-code: los `.js` reinyectan byte-idéntico (`_inject.py` / `_smoketest`).
- E2E local contra n8n real:
  - Plan **con** titular → `plan_ready` + 1 fila en `plan_holders` con los 4 campos y el
    `session_id` del plan; el titular se ve en `/trip/[id]`.
  - Plan **sin** titular (paso omitido) → el plan se genera igual y **no** se inserta fila.
  - Email inválido en el front → aviso no bloqueante; corregido, guarda.
- Ejemplo nuevo en `n8n/examples/` con entrada/salida del contrato con `holder`.
- `/code-review` obligatorio antes del PR (AGENTS.md §10).

## Dependencias / auditoría

- Ninguna dependencia npm nueva prevista.
- Requiere crear manualmente la tabla `plan_holders` en Supabase antes del despliegue.
