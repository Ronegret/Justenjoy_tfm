-- Migración: plan_holders — un titular por SESIÓN, no por persona
-- Fecha: 2026-07-30
-- Spec: docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md
-- Runbook: docs/runbooks/2026-07-30-activacion-v40-revisiones.md
--
-- IMPORTANTE: este fichero NO se aplica automáticamente. Lo ejecuta INFRA en el
-- editor SQL de Supabase (ver runbook).
--
-- Corrige el hallazgo #31. La migración 0001 creó `uq_plan_holders_email` (UNIQUE
-- parcial sobre el email) para deduplicar leads con semántica first-wins. Efecto
-- colateral verificado por E2E el 2026-07-30: el SEGUNDO viaje de un cliente ya
-- registrado no crea fila, así que plan_holders conserva el session_id del PRIMER
-- viaje y el buscador del dashboard —que filtra por los session_id que el usuario
-- posee— nunca encuentra los viajes posteriores.
--
-- Se sustituye por un UNIQUE sobre (email, session_id): un titular puede tener
-- tantas filas como viajes, y se sigue evitando el duplicado del MISMO viaje
-- (idempotencia ante reintentos del nodo). Efecto secundario deseable: queda
-- evidencia de consentimiento (consent_at/consent_version) por viaje, no solo del
-- primero, que es más defendible para el art. 6.1.a.
--
-- Contrapartida asumida: se retienen más datos del titular por persona (una fila
-- por viaje). Reflejado en docs/legal/ROPA.md, Actividad 6.
--
-- No afecta al workflow v38 de `master`: esa versión no escribe en plan_holders
-- (esa rama entró con la v39). Idempotente.

-- ── Fuera el UNIQUE por email (causa de #31) ──────────────────────────────────
-- Era un índice suelto (CREATE UNIQUE INDEX en la migración 0001), pero se
-- contempla también la variante constraint por si alguna instancia se creó a mano.
ALTER TABLE plan_holders DROP CONSTRAINT IF EXISTS uq_plan_holders_email;
DROP INDEX IF EXISTS uq_plan_holders_email;

-- ── Dedup por (email, session_id) ─────────────────────────────────────────────
-- Los titulares sin email siguen sin deduplicarse (índice parcial), igual que antes.
--
-- NOTA: aquí NO va el bloque `DELETE ... USING` de deduplicación que llevaba la
-- migración 0001. Aquel borrado ya se ejecutó y era destructivo; este índice es
-- MENOS restrictivo que el anterior, así que no puede chocar con los datos
-- existentes (si (email) era único, (email, session_id) lo es por fuerza).
CREATE UNIQUE INDEX IF NOT EXISTS uq_plan_holders_email_session
  ON plan_holders (email, session_id) WHERE email IS NOT NULL;

-- ── Búsqueda por titular ──────────────────────────────────────────────────────
-- El buscador (n8n/nodes-code/12_buscar_titulares.js) lee la tabla entera y filtra
-- en el code node por posesión del session_id, así que no necesita índice nuevo ni
-- cambio de código: ya deduplica los resultados con un Set.

-- ── Conservación (RGPD 5.1.e): 24 meses ───────────────────────────────────────
-- Sin cambios respecto de la migración 0001: sigue operando por created_at, y ahora
-- caduca cada vínculo titular↔viaje por separado, que es lo coherente con el modelo.
--
--   DELETE FROM plan_holders WHERE created_at < NOW() - INTERVAL '24 months';

-- ── Rollback ──────────────────────────────────────────────────────────────────
-- Volver al UNIQUE por email exige borrar antes los duplicados que esta migración
-- permite (DESTRUCTIVO: pierde el vínculo con los viajes posteriores de cada cliente):
--
--   DROP INDEX IF EXISTS uq_plan_holders_email_session;
--   DELETE FROM plan_holders a USING plan_holders b
--     WHERE a.email = b.email AND a.email IS NOT NULL AND a.created_at > b.created_at;
--   CREATE UNIQUE INDEX uq_plan_holders_email ON plan_holders (email) WHERE email IS NOT NULL;
