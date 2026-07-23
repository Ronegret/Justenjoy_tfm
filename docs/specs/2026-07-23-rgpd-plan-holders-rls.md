# Spec — RGPD de `plan_holders`: consentimiento + RLS + docs legales + versionar el DDL

- **Fecha:** 2026-07-23
- **Tipo:** endurecimiento de seguridad/infra + **captura de consentimiento (frontend + esquema
  + n8n)** + documentación legal + versionado de esquema.
- **Estado:** **PROPUESTA — pendiente de validación humana.** Toca **datos reales de clientes**
  (RLS + consentimiento) y **cambia el contrato del `holder`** (campos de consentimiento) y el
  **nodo de escritura n8n** → AGENTS.md §3.2 (datos de clientes + contrato de API + nodos). La
  **ejecución del SQL en Supabase** requiere acceso admin ([[owner-y-permisos-github]]):
  **decidido dejar todo listo sin ejecutar**.
- **Rama(s) previstas:** `feature/consentimiento-titular` (checkbox + esquema + nodo n8n +
  contrato) y `chore/rgpd-plan-holders-rls` (SQL versionado + RLS + docs legales). Pueden ir
  apiladas o juntas; la de consentimiento cambia contrato y conviene aislarla para revisión.
- **Relacionada:** [2026-07-23-buscador-clientes-servidor.md](2026-07-23-buscador-clientes-servidor.md).
- **Cierra/avanza:** gap #15 (DDL no versionado) y hallazgos #8/#9/#17/#18 para `plan_holders`.

## Decisiones tomadas (equipo, 2026-07-23)

| Tema | Elegido | Consecuencia |
|---|---|---|
| Base jurídica del titular | **Art. 6.1.a — consentimiento explícito** | Requiere **casilla de consentimiento** en el wizard + **prueba** del consentimiento + poder **retirarlo**. |
| Conservación de leads | **24 meses** desde `created_at` | Requiere **borrado programado** (operable por `created_at`, sin `user_id`). |
| RLS | **Activar sin políticas** (solo `service_role`) | Cierra `anon`; n8n sigue accediendo (BYPASSRLS). |
| Ejecución en Supabase | **Dejar listo, no ejecutar** | Se entrega SQL + runbook + verificación; lo aplica infra. |

## Contexto

`plan_holders` guarda **PII de contacto real** (nombre, apellidos, teléfono, email) con **RLS
desactivado** (`DISABLE ROW LEVEL SECURITY`, en prosa en
[`n8n/docs/Planificador_Viajes_v39_Arquitectura.md §9.1`](../../n8n/docs/Planificador_Viajes_v39_Arquitectura.md)).
Objetivo: que **solo** `service_role` acceda, documentar el tratamiento bajo **6.1.a**, y
versionar el DDL (hoy solo en prosa; la tabla se creó a mano).

## Precondición (crítica) — no romper el guardado en silencio

El nodo de escritura del titular usa `onError: continueRegularOutput`: si tras activar RLS la
credencial de n8n fuese `anon` en vez de `service_role`, el insert fallaría **en silencio**.

**Verificado (código):** [`credentials.json:26-34`](../../n8n/credentials/credentials.json#L26-L34)
usa `"serviceRole": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}"`. **Falta confirmar en la instancia
real** antes de activar RLS:
1. **Decodificar el JWT** de `SUPABASE_SERVICE_ROLE_KEY` → payload `"role":"service_role"`.
2. **Prueba de humo tras activar** (ver runbook) + **rollback** listo.

## Frente A — Captura de consentimiento (6.1.a)

Para sostener 6.1.a hay que **recabar y probar** el consentimiento (art. 7.1) y permitir
retirarlo:

- **Wizard:** en el paso "Datos del titular" (ya mergeado), añadir una **casilla obligatoria**
  ("He leído y acepto la [política de privacidad]…") que **debe marcarse para enviar el
  `holder`**. Si el usuario omite el titular, no hay casilla ni consentimiento (el titular sigue
  siendo opcional; el consentimiento solo aplica si se rellenan datos).
- **Prueba del consentimiento (evidencia):** añadir al `holder` y a `plan_holders`:
  - `consent_at TIMESTAMPTZ` — momento del consentimiento.
  - `consent_version TEXT` — versión de la política aceptada (p. ej. fecha o hash de
    `politica-privacidad.md`).
- **Contrato del `holder` (cambio de API — §3.2):** el objeto `holder` del webhook gana
  `consent_at` y `consent_version`. `01_validar_formulario.js` (passthrough) y
  `11_preparar_payload_titular.js` (record de `plan_holders`) los arrastran.
- **Retirada:** documentar el canal (soporte@justenjoy.app) en la política + el borrado a los
  24 meses. (Un flujo self-service de baja queda fuera de alcance.)

> Este frente **modifica una feature ya mergeada** (registro del titular) y **cambia contrato +
> esquema + nodo n8n**. Es el mayor volumen de trabajo de esta spec; por eso rama propia.

## Frente B — SQL versionado (nuevo `supabase/migrations/`)

Se crea `supabase/migrations/` (no existía; gap #15) reflejando el DDL **real** de §9.1 +
consentimiento + RLS. Versionarlo **no ejecuta nada**.

```sql
-- supabase/migrations/2026-07-23_0001_plan_holders.sql
-- Esquema de plan_holders (reflejo del DDL a mano) + consentimiento (6.1.a) + RLS.
-- NO se aplica automáticamente: lo ejecuta infra en ventana coordinada (ver runbook).

CREATE TABLE IF NOT EXISTS plan_holders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT NOT NULL,        -- ref. a travel_plans.session_id (indexado, SIN FK dura)
  first_name      TEXT,
  last_name       TEXT,
  phone           TEXT,
  email           TEXT,
  consent_at      TIMESTAMPTZ,          -- 6.1.a: momento del consentimiento
  consent_version TEXT,                 -- 6.1.a: versión de política aceptada
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Columnas de consentimiento sobre la tabla ya existente (idempotente):
ALTER TABLE plan_holders ADD COLUMN IF NOT EXISTS consent_at      TIMESTAMPTZ;
ALTER TABLE plan_holders ADD COLUMN IF NOT EXISTS consent_version TEXT;

CREATE INDEX IF NOT EXISTS idx_plan_holders_session_id ON plan_holders (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_holders_email
  ON plan_holders (email) WHERE email IS NOT NULL;   -- dedup por email

-- Endurecimiento RLS: sin políticas → anon/authenticated obtienen 0 filas;
-- service_role (BYPASSRLS) sigue insertando/leyendo (n8n escritura y lectura del dashboard).
ALTER TABLE plan_holders ENABLE ROW LEVEL SECURITY;
```

> No se usa `FORCE ROW LEVEL SECURITY`: `service_role` hace *bypass* por diseño, que es lo que
> queremos.

**Conservación (24 meses) — política de borrado documentada (a programar por infra):**
```sql
-- Ejecutar periódicamente (pg_cron, o job externo). Borra leads > 24 meses.
DELETE FROM plan_holders WHERE created_at < NOW() - INTERVAL '24 months';
```

## Runbook de ejecución (infra / ventana coordinada)

1. **Antes:** decodificar `SUPABASE_SERVICE_ROLE_KEY` → confirmar `role=service_role`.
2. Ejecutar la migración (editor SQL de Supabase o REST/psql).
3. **Prueba de humo (guardado):** E2E con titular → confirmar fila nueva con `consent_at`.
4. **Prueba de cierre (anon):** confirmar que `anon` ya **no** lee la tabla.
5. Programar el borrado a 24 meses (pg_cron o job externo).
6. Si (3) falla → **rollback**: `ALTER TABLE plan_holders DISABLE ROW LEVEL SECURITY;` +
   diagnosticar la credencial.

## Verificación por REST (Norton MITM → `--ssl-no-revoke`, [[norton-tls-interception-contenedores]])

```bash
# (a) service_role DEBE devolver filas (bypass de RLS):
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?select=id&limit=1" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE"
# (b) anon DEBE devolver [] tras activar:
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
# (c) lead recién insertado con consentimiento (prueba de humo):
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?email=eq.<email>&select=*" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE"
```

## Frente C — Documentación legal (`docs/legal/`)

- **`ROPA.md` — nueva Actividad 6 «Registro del titular/cliente del plan»:**
  - Finalidad: registrar datos de contacto del titular por plan.
  - **Base jurídica: Art. 6.1.a (consentimiento explícito)** — casilla en el wizard; evidencia en
    `consent_at`/`consent_version`; retirada por soporte@justenjoy.app.
  - Categorías: nombre, apellidos, teléfono, email. Origen: del interesado (paso opcional).
  - Encargado: **Supabase** (`plan_holders`). Transferencia: EEUU — SCC + TIA.
  - **Conservación: 24 meses** desde `created_at` (borrado programado).
  - Medidas (art. 32): **RLS activado + dedup por email + `service_role` server-only**; PII no en
    `localStorage`.
- **`EIPD.md`:** actualizar el flujo (§2, añadir `→ Supabase plan_holders`), añadir riesgo **R8**
  (PII de contacto real persistida; mitigación RLS + consentimiento + minimización + borrado a 24
  meses) y sustituir "v38" por **v39**.
- **`politica-privacidad.md`:** describir el tratamiento del titular, la base 6.1.a, el plazo de
  24 meses y el canal de retirada del consentimiento; fijar la `consent_version`.

## Qué NO hace (fuera de alcance)

- **No** ejecuta el SQL en Supabase (decidido: dejar listo).
- **No** añade políticas RLS por sesión/usuario (basta "sin políticas + service_role"); sin `user_id`.
- **No** implementa un flujo self-service de baja/retirada (se documenta el canal manual).
- **No** programa técnicamente el pg_cron (se entrega el SQL y la indicación; lo agenda infra).

## Qué puede salir mal / riesgos

- **Credencial `anon` en producción:** rompería el guardado en silencio. Mitigado por precondición
  + prueba de humo + rollback.
- **Consentimiento y feature ya mergeada:** el checkbox modifica el wizard existente y el contrato
  del `holder`; coordinar para no chocar con otras ramas que tocan `types/trip.ts`/`route.ts`.
- **Evidencia insuficiente de consentimiento:** guardar `consent_at`+`consent_version` es el mínimo
  para 6.1.a; validar con asesoría si basta para el caso de uso.
- **Coherencia doc vs realidad:** actualizar §9.1 (de `DISABLE` a `ENABLE`) en el mismo cambio.
- **Índice único de email ya existente:** `IF NOT EXISTS` evita el choque al ejecutar sobre la
  tabla actual.

## Verificación (de esta entrega, sin ejecutar en Supabase)

- `.\verify.ps1` en verde (tsc del frontend por el checkbox; JSON del workflow válido por el nodo
  de escritura ampliado).
- `supabase/migrations/*.sql` refleja fielmente §9.1 + consentimiento + RLS.
- Ejemplo en `n8n/examples/` con `holder` incluyendo `consent_at`/`consent_version`.
- E2E: titular **con** casilla marcada → fila con `consent_at`; sin marcar → no se envía `holder`.
- ROPA/EIPD/política revisadas por un miembro del equipo.
- Runbook + verificación REST listos para infra.
- `/code-review` sobre el diff antes del PR (AGENTS.md §10).
