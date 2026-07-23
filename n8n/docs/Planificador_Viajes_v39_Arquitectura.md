# Planificador de Viajes — v39
## Documentación de Arquitectura

> **Versión:** v39 (canónica y activa del proyecto)
> **Plataforma:** n8n 2.23.2 (Self Hosted)
> **Estado:** Estable — versión activa del proyecto (TFM)
> **Workflow:** 1 main workflow, id `8Kym9GIgNKp7Nrdh` (reutiliza el id de v34/v38: al
> reimportar hace *upsert* sobre el workflow existente, sin duplicar ni chocar en el webhook)
> **Persistencia:** Supabase (tablas `travel_plans` y `plan_holders`)

## Relación con v38

v39 se construye **directamente sobre v38**, con el que comparte id de workflow, rutas de
webhook (`travel-planner` / `travel-refine`) y los 27 nodos previos con sus UUIDs. v38 queda
congelado en [`../workflows/archive/Planificador_de_Viajes_v38.json`](../workflows/archive/Planificador_de_Viajes_v38.json);
toda la arquitectura base (motor planificador, rutas A/B, refinamiento, validaciones,
persistencia del plan en `travel_plans`) está descrita en
[`Planificador_Viajes_v38_Arquitectura.md`](Planificador_Viajes_v38_Arquitectura.md) y **no
cambia**.

**Único cambio funcional en v39:** captura y persistencia **opcional** de los datos del
titular/cliente del plan (nombre, apellidos, teléfono, email) — ver §9.1.

### Nodos nuevos respecto a v38

| Nodo | Tipo | Función |
|---|---|---|
| `Preparar Payload Titular` | code (`11_preparar_payload_titular.js`) | Construye el registro de `plan_holders` desde `travel_brief.holder`; emite `[]` si no hay titular |
| `Supabase — Guardar Titular` | `n8n-nodes-base.supabase` | `create` sobre `plan_holders`, `onError: continueRegularOutput` |

Además, `01_validar_formulario.js` arrastra el campo opcional `holder` a
`session_state.travel_brief.holder` (passthrough; **no** es campo obligatorio).

---

## 9.1 Titular/cliente del plan — tabla `plan_holders`

Se añade la captura **opcional** de los datos del titular por plan. Contrato y flujo:

- **Entrada:** el webhook `travel-planner` acepta un campo **opcional** `holder`
  (`{ first_name, last_name, phone, email }`). `01_validar_formulario.js` **no** lo exige;
  lo arrastra como passthrough a `session_state.travel_brief.holder`. Ejemplo:
  [`../examples/input-formulario-con-titular.json`](../examples/input-formulario-con-titular.json).
- **Escritura:** rama **paralela** a la planificación que arranca tras validar el
  formulario (salida de éxito de `¿Error Formulario?`), de modo que el lead se guarda
  **aunque la planificación no llegue a `plan_ready`**:
  - `Preparar Payload Titular` (`11_preparar_payload_titular.js`) construye el registro
    (con los valores recortados); si no hay ningún dato de titular emite `[]` (no inserta).
  - **Dedup por email** (un lead por persona) a nivel de **BD**: un índice `UNIQUE` parcial
    sobre `plan_holders(email)`. El nodo Supabase usa `create` + `onError:
    continueRegularOutput`, así que un segundo insert con el mismo email choca con el
    `UNIQUE` y se ignora (first-wins), sin duplicar y a prueba de carreras. Así, regenerar/
    ajustar el plan (cada regeneración es una RUTA A nueva) no crea leads duplicados. Los
    titulares sin email no se deduplican. (No se hace con una consulta HTTP en el code node:
    `this.helpers.httpRequest` no aplica el filtro de forma fiable en el sandbox.)
  - `Supabase — Guardar Titular` (`operation: create`, `tableId: plan_holders`,
    `onError: continueRegularOutput`, credencial `Supabase - JustEnjoy`).
  - Salida de ejemplo: [`../examples/output-plan-holders-record.json`](../examples/output-plan-holders-record.json).
- **DDL (crear manualmente en Supabase; el repo no versiona migraciones, solo el DDL en
  prosa, igual que `travel_plans`):**

```sql
CREATE TABLE plan_holders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  TEXT NOT NULL,   -- referencia a travel_plans.session_id (indexado, SIN FK dura)
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_plan_holders_session_id ON plan_holders (session_id);
ALTER TABLE plan_holders DISABLE ROW LEVEL SECURITY;
```

> Sin FK dura a `travel_plans.session_id`: así el lead se guarda aunque el plan falle
> (captación). RLS desactivado, coherente con `travel_plans`. Contiene **datos personales**
> (PII): tratar según `docs/legal/` (ROPA/EIPD/política de privacidad). Endurecimiento
> pendiente: activar RLS sin políticas cuando se confirme que la credencial de n8n usa la
> clave `service_role` (que salta la RLS); si usara la `anon`, activar RLS rompería el
> guardado en silencio (`onError: continueRegularOutput`).

### Minimización de PII del titular

- El `holder` **no** se persiste en la static data global de n8n (`01_validar_formulario.js`
  guarda una copia de `session_state` sin `holder`); solo viaja en el item que alimenta la
  rama de `plan_holders`. Evita retener PII indefinidamente en la BD de n8n.
- El frontend **no** serializa el `holder` en `localStorage` (solo lo mantiene en memoria
  durante la sesión); su fuente de verdad es `plan_holders`.
- **Dedup por email** (un lead por persona) mediante un índice `UNIQUE` parcial sobre
  `plan_holders(email) WHERE email IS NOT NULL` (crear manualmente en Supabase, como la
  propia tabla). Evita acumular leads duplicados por regeneraciones/reintentos:

```sql
-- Deduplicar emails existentes (conserva el más antiguo) antes de crear el índice:
DELETE FROM plan_holders a USING plan_holders b
  WHERE a.email = b.email AND a.email IS NOT NULL AND a.created_at > b.created_at;
-- Índice único parcial (dedup por email; los titulares sin email no se deduplican):
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_holders_email
  ON plan_holders (email) WHERE email IS NOT NULL;
```

---

## Diagrama de escritura (v39)

```
Validar Formulario → ¿Error Formulario?
  ├── true  → Responder Error Formulario (HTTP 400)
  └── false → Preparar Motor Planificador → [flujo v38: plan + travel_plans]
              └──(rama paralela)→ Preparar Payload Titular
                                    └── (si hay holder) → Supabase — Guardar Titular → plan_holders
```

La rama del titular es independiente y no bloqueante: un fallo (o la ausencia de titular) no
afecta ni a la respuesta al usuario ni a la persistencia del plan.
