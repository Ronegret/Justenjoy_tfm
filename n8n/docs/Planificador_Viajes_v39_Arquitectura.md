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
  (`{ first_name, last_name, phone, email, consent_at, consent_version }`).
  `01_validar_formulario.js` **no** lo exige; lo arrastra como passthrough (objeto entero)
  a `session_state.travel_brief.holder`. `consent_at` (ISO) y `consent_version` son la
  **evidencia del consentimiento (RGPD 6.1.a)**: el frontend solo envía el `holder` si el
  usuario marcó la casilla del paso "Datos del titular" (`holderToN8nPayload` devuelve
  `undefined` sin consentimiento). Ejemplo:
  [`../examples/input-formulario-con-titular.json`](../examples/input-formulario-con-titular.json).
- **Escritura:** rama **paralela** a la planificación que arranca tras validar el
  formulario (salida de éxito de `¿Error Formulario?`), de modo que el lead se guarda
  **aunque la planificación no llegue a `plan_ready`**:
  - `Preparar Payload Titular` (`11_preparar_payload_titular.js`) construye el registro
    (con los valores recortados, incluidos `consent_at`/`consent_version`); si no hay ningún
    dato de titular emite `[]` (no inserta). **Segunda barrera RGPD 6.1.a:** si hay datos pero
    falta `consent_at`, también emite `[]` (no persiste PII sin consentimiento).
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
- **DDL — fuente de verdad versionada:** [`supabase/migrations/2026-07-23_0001_plan_holders.sql`](../../supabase/migrations/2026-07-23_0001_plan_holders.sql)
  (cierra el gap #15 de la auditoría; antes el DDL vivía solo en esta prosa). Resumen:

```sql
CREATE TABLE plan_holders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      TEXT NOT NULL,   -- referencia a travel_plans.session_id (indexado, SIN FK dura)
  first_name      TEXT,
  last_name       TEXT,
  phone           TEXT,
  email           TEXT,
  consent_at      TIMESTAMPTZ,     -- RGPD 6.1.a: momento del consentimiento (captura: frente titular)
  consent_version TEXT,            -- RGPD 6.1.a: versión de la política aceptada
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_plan_holders_session_id ON plan_holders (session_id);
CREATE UNIQUE INDEX uq_plan_holders_email ON plan_holders (email) WHERE email IS NOT NULL;  -- dedup
ALTER TABLE plan_holders ENABLE ROW LEVEL SECURITY;  -- OBJETIVO (pendiente de aplicar); solo service_role (BYPASSRLS)
```

> Sin FK dura a `travel_plans.session_id`: así el lead se guarda aunque el plan falle
> (captación). Contiene **datos personales** (PII): tratar según `docs/legal/`
> (ROPA Actividad 6 / EIPD R8 / política de privacidad; base jurídica **6.1.a consentimiento**,
> conservación **24 meses**). **Estado del endurecimiento RLS:** el SQL está versionado en la
> migración, **pendiente de aplicar en la instancia** por infra (requiere admin). Antes de
> activar hay que confirmar que la credencial de n8n usa la clave `service_role` (que salta la
> RLS); si usara la `anon`, activar RLS rompería el guardado en silencio
> (`onError: continueRegularOutput`). Ver el runbook en
> [`docs/specs/2026-07-23-rgpd-plan-holders-rls.md`](../../docs/specs/2026-07-23-rgpd-plan-holders-rls.md).
> Las columnas `consent_at`/`consent_version` las **rellena** la captura de consentimiento
> del frontend (casilla del paso "Datos del titular"): `consent_at` = momento (ISO) en que se
> marcó, `consent_version` = versión de la política aceptada. Sin consentimiento el titular no
> se envía ni se persiste (doble barrera: `holderToN8nPayload` en frontend + nodo 11 en n8n).

### Minimización de PII del titular

- El `holder` **no** se persiste en la static data global de n8n (`01_validar_formulario.js`
  guarda una copia de `session_state` sin `holder`); solo viaja en el item que alimenta la
  rama de `plan_holders`. Evita retener PII indefinidamente en la BD de n8n.
- El frontend **no** serializa el `holder` en `localStorage` (solo lo mantiene en memoria
  durante la sesión); su fuente de verdad es `plan_holders`.
- **Dedup por email** (un lead por persona) mediante un índice `UNIQUE` parcial sobre
  `plan_holders(email) WHERE email IS NOT NULL`. Evita acumular leads duplicados por
  regeneraciones/reintentos. El DDL exacto (con el `DELETE` de deduplicación previo,
  obligatorio antes de crear el índice si ya hubiera duplicados) está en la migración
  versionada [`supabase/migrations/2026-07-23_0001_plan_holders.sql`](../../supabase/migrations/2026-07-23_0001_plan_holders.sql)
  — **fuente de verdad única**; no dupliques el DDL aquí.

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

---

## 9.2 Búsqueda de titulares — rama de lectura (`holders-search`)

Rama **independiente** del planificador que sostiene la búsqueda **persistente por cliente**
del dashboard (spec `docs/specs/2026-07-23-buscador-clientes-servidor.md`, D1=server-side puro,
D2=vía n8n). Tiene su **propio webhook**; no se conecta con el flujo de planificación.

- **Entrada:** `POST /webhook/holders-search` con `{ session_ids: string[], query: string }`.
  El endpoint autenticado `frontend/.../api/holders/search` reenvía los `session_id` que el
  cliente ya posee (localStorage) + la query. Ejemplo:
  [`../examples/input-holders-search.json`](../examples/input-holders-search.json).
- **Nodos:** `Webhook — Buscar Titulares` → `Supabase — Leer Titulares` (`getAll` sobre
  `plan_holders`, `alwaysOutputData` para correr aunque la tabla esté vacía) → `Buscar Titulares`
  (`12_buscar_titulares.js`) → `Responder — Titulares`.
- **Por qué se lee toda la tabla y se filtra en el code node:** el filtrado por `session_id`
  (posesión) y por la query se hace en JS, **no** en la consulta a Supabase, para no meter
  input del cliente en el filtro (sin superficie de inyección). El `service_role` se queda en
  n8n. Coste: lee `plan_holders` completa en memoria del nodo — aceptable a escala de este
  proyecto; para escalar, añadir paginación/índice. Mismo criterio de match laxo que el frontend.
- **Salida:** `{ matching_session_ids: string[] }` — **solo** `session_id`, **nunca PII**.
  Ejemplo: [`../examples/output-holders-search.json`](../examples/output-holders-search.json).
- **Contrato de datos = cambio de API →** requiere ejemplo en `n8n/examples/` (§9.1) y
  aprobación previa (§3.2). Variable de entorno nueva: `N8N_HOLDERS_SEARCH_WEBHOOK_URL`.
