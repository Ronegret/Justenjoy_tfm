-- Migración: plan_holders — esquema + consentimiento (RGPD 6.1.a) + RLS
-- Fecha: 2026-07-23
-- Spec: docs/specs/2026-07-23-rgpd-plan-holders-rls.md
--
-- IMPORTANTE: este fichero NO se aplica automáticamente. Es el DDL versionado
-- (cierra el gap #15 de la auditoría: el esquema vivía solo en prosa en
-- n8n/docs/Planificador_Viajes_v39_Arquitectura.md §9.1). Lo ejecuta INFRA en una
-- ventana coordinada, siguiendo el runbook de la spec:
--   1) Antes: confirmar que SUPABASE_SERVICE_ROLE_KEY tiene role=service_role.
--   2) Ejecutar esta migración.
--   3) Prueba de humo: E2E con titular → fila nueva con consent_at.
--   4) Confirmar que anon ya NO lee la tabla.
--   5) Rollback si el guardado falla: ALTER TABLE plan_holders DISABLE ROW LEVEL SECURITY;
--
-- Es idempotente (IF NOT EXISTS) para poder ejecutarse sobre la tabla ya creada a
-- mano en la instancia real sin chocar.

-- ── Tabla ─────────────────────────────────────────────────────────────────────
-- session_id: referencia a travel_plans.session_id (indexado, SIN FK dura, a
-- propósito: el lead se guarda aunque el plan no llegue a plan_ready — captación).
CREATE TABLE IF NOT EXISTS plan_holders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  phone           TEXT,
  email           TEXT,
  consent_at      TIMESTAMPTZ,   -- RGPD 6.1.a: momento del consentimiento explícito
  consent_version TEXT,          -- RGPD 6.1.a: versión de la política aceptada
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Columnas de consentimiento sobre una tabla plan_holders preexistente (idempotente):
ALTER TABLE plan_holders ADD COLUMN IF NOT EXISTS consent_at      TIMESTAMPTZ;
ALTER TABLE plan_holders ADD COLUMN IF NOT EXISTS consent_version TEXT;

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plan_holders_session_id ON plan_holders (session_id);

-- Dedup por email (un lead por persona); los titulares sin email no se deduplican.
-- El nodo Supabase usa create + onError:continueRegularOutput → el 2º insert con el
-- mismo email choca con este UNIQUE y se ignora (first-wins), a prueba de carreras.
--
-- PREREQUISITO: si la tabla ya tuviera filas con emails duplicados (p. ej. una
-- instancia provisionada antes de existir el índice), CREATE UNIQUE INDEX abortaría.
-- Se limpian primero los duplicados conservando el más antiguo (idempotente: no hace
-- nada si no hay duplicados). Ver n8n/docs/Planificador_Viajes_v39_Arquitectura.md §9.1.
DELETE FROM plan_holders a USING plan_holders b
  WHERE a.email = b.email AND a.email IS NOT NULL AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_holders_email
  ON plan_holders (email) WHERE email IS NOT NULL;

-- ── Endurecimiento RLS ────────────────────────────────────────────────────────
-- Sin políticas: los roles anon/authenticated de PostgREST obtienen 0 filas.
-- service_role tiene BYPASSRLS → n8n (escritura del titular y lectura del buscador
-- del dashboard) sigue accediendo. No se usa FORCE: service_role debe hacer bypass.
ALTER TABLE plan_holders ENABLE ROW LEVEL SECURITY;

-- ── Conservación (RGPD 5.1.e): 24 meses ───────────────────────────────────────
-- Política de borrado a programar por INFRA (pg_cron o job externo). No se agenda
-- aquí; se deja el SQL de referencia. Operable por created_at (no requiere user_id).
--
--   DELETE FROM plan_holders WHERE created_at < NOW() - INTERVAL '24 months';
