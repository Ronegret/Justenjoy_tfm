-- Migración: travel_plans — DDL versionado + historial de revisiones
-- Fecha: 2026-07-30
-- Spec: docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md
-- Runbook: docs/runbooks/2026-07-30-activacion-v40-revisiones.md
--
-- IMPORTANTE: este fichero NO se aplica automáticamente. Lo ejecuta INFRA en el
-- editor SQL de Supabase, ANTES de publicar el workflow v40 (ver runbook: al revés,
-- la v40 —que ya no silencia los errores— fallaría en cada refinamiento).
--
-- Hace dos cosas:
--   1) Versiona por primera vez el DDL de travel_plans. Hasta hoy solo existía en
--      prosa, en un documento ARCHIVADO (n8n/docs/Planificador_Viajes_v34_Arquitectura.md
--      §9). Cierra el gap #15 de la auditoría para esta tabla.
--   2) Quita el UNIQUE de session_id, que es la causa del hallazgo #30: el nodo
--      `Supabase — Guardar Plan` es un `create`, así que el segundo guardado de una
--      sesión (el refinamiento) se rechazaba y `onError: continueRegularOutput` se
--      tragaba el fallo → el plan refinado NO se guardaba nunca.
--
-- Idempotente (IF NOT EXISTS / IF EXISTS): la tabla ya existe creada a mano en la
-- instancia real y el proyecto Supabase es COMPARTIDO por el equipo.

-- ── Tabla ─────────────────────────────────────────────────────────────────────
-- Sin UNIQUE en session_id, a propósito: cada plan_ready (inicial o refinamiento)
-- deja su propia fila. El número de revisión NO es una columna: viaja dentro del
-- jsonb `plan` como `plan.revision_snapshot`, que ya emite el motor. Así el esquema
-- sigue siendo compatible con el workflow v38 de `master`, que inserta exactamente
-- 11 columnas con autoMapInputData y no conoce ninguna columna nueva.
CREATE TABLE IF NOT EXISTS travel_plans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         TEXT NOT NULL,
  status             TEXT NOT NULL,
  destination        TEXT NOT NULL,
  origin             TEXT NOT NULL,
  departure_date     DATE NOT NULL,
  return_date        DATE NOT NULL,
  budget_usd         NUMERIC,
  total_cost_usd     NUMERIC,
  travelers_count    INTEGER,
  activity_interests TEXT[],
  plan               JSONB NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── Liberar session_id (hallazgo #30) ─────────────────────────────────────────
-- El UNIQUE pudo crearse de dos formas según cómo se creara la tabla a mano:
-- como CONSTRAINT (`session_id TEXT UNIQUE` → travel_plans_session_id_key) o como
-- índice suelto. Se contemplan ambas para que la migración funcione en cualquier
-- instancia. DROP CONSTRAINT elimina también su índice asociado.
ALTER TABLE travel_plans DROP CONSTRAINT IF EXISTS travel_plans_session_id_key;
DROP INDEX IF EXISTS travel_plans_session_id_key;
DROP INDEX IF EXISTS uq_travel_plans_session_id;

-- Índice NO único: se sigue consultando por sesión (todas sus revisiones).
CREATE INDEX IF NOT EXISTS idx_travel_plans_session_id ON travel_plans (session_id);

-- Cuál es el plan vigente de una sesión: el más reciente por created_at.
-- Se usa created_at y NO una columna de revisión a propósito: las filas escritas
-- por el workflow v38 (el de `master`) no tendrían esa columna rellena.
CREATE INDEX IF NOT EXISTS idx_travel_plans_session_created
  ON travel_plans (session_id, created_at DESC);

-- ── RLS: NO se toca ───────────────────────────────────────────────────────────
-- travel_plans se deja SIN RLS por decisión explícita del equipo (2026-07-23).
-- Los gaps #8/#9 de la auditoría siguen abiertos a propósito; esta migración no
-- los cierra ni los contradice. NO añadir aquí ENABLE ROW LEVEL SECURITY sin esa
-- decisión: rompería la escritura si la credencial no fuese service_role.

-- ── Conservación (RGPD 5.1.e) ─────────────────────────────────────────────────
-- ATENCIÓN: guardar revisiones multiplica las copias del jsonb `plan` por sesión.
-- El plazo de supresión de la Actividad 3 del ROPA está sin definir ([COMPLETAR]).
-- Propuesta pendiente de firma del equipo: alinearlo con los 24 meses de
-- plan_holders. No se agenda nada aquí; SQL de referencia:
--
--   DELETE FROM travel_plans WHERE created_at < NOW() - INTERVAL '24 months';
--
-- Variante para podar solo revisiones antiguas conservando la vigente de cada sesión:
--
--   DELETE FROM travel_plans t USING travel_plans v
--     WHERE t.session_id = v.session_id AND t.created_at < v.created_at;

-- ── Rollback ──────────────────────────────────────────────────────────────────
-- Recrear el UNIQUE **fallará** si ya se han guardado revisiones: hay que dejar
-- una fila por sesión antes (la más reciente), lo cual es DESTRUCTIVO.
--
--   DELETE FROM travel_plans t USING travel_plans v
--     WHERE t.session_id = v.session_id AND t.created_at < v.created_at;
--   ALTER TABLE travel_plans ADD CONSTRAINT travel_plans_session_id_key UNIQUE (session_id);
