-- Migración: travel_plans — política de conservación de 24 meses (RGPD 5.1.e)
-- Fecha: 2026-07-30
-- Spec: docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md
--
-- IMPORTANTE: este fichero NO se aplica automáticamente. Lo ejecuta INFRA en el
-- editor SQL de Supabase.
--
-- CIERRA UNA DECISIÓN ABIERTA. La Actividad 3 del ROPA tenía el plazo de supresión
-- en `[COMPLETAR]`, y la migración 0002 (guardar una fila por revisión) lo volvió
-- urgente: un plan muy refinado multiplica las copias del jsonb `plan`. Decidido el
-- **2026-07-30**: **24 meses desde `created_at`**, el mismo criterio y la misma
-- cadencia que ya usa `plan_holders` (migración 0001), para no tener dos relojes
-- distintos en la misma base de datos.
--
-- La 0002 dejaba este SQL como "referencia pendiente de firma"; esta migración lo
-- adopta. No se edita la 0002 porque ya está aplicada: las migraciones aplicadas no
-- se tocan.

-- ── Borrado por antigüedad ────────────────────────────────────────────────────
-- Nota sobre revisiones: al borrar por `created_at` de CADA fila, un plan que se
-- refinó hace poco conserva sus revisiones recientes y pierde solo las que ya han
-- cumplido 24 meses. Es el comportamiento deseado (minimización sin perder el plan
-- vigente). Cuando TODAS las revisiones de una sesión caducan, la sesión desaparece
-- entera, que es justo el propósito del plazo.
DELETE FROM travel_plans WHERE created_at < NOW() - INTERVAL '24 months';

-- ── Programación mensual (pg_cron) ────────────────────────────────────────────
-- Misma cadencia que el job de plan_holders (día 1 de cada mes, 03:00 UTC) para que
-- ambos borrados caigan en la misma ventana. `cron.schedule` con un jobname que ya
-- existe lo ACTUALIZA, así que es idempotente.
--
-- Requiere la extensión pg_cron habilitada (Database → Extensions en Supabase). Si
-- no lo estuviera, habilitarla antes o agendar el DELETE de arriba con un job
-- externo; en ese caso, anotarlo en el ROPA.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'purge_travel_plans_24m',
  '0 3 1 * *',
  $$DELETE FROM travel_plans WHERE created_at < NOW() - INTERVAL '24 months'$$
);

-- ── Verificación ──────────────────────────────────────────────────────────────
--   SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'purge_%';
-- Deben aparecer los dos: purge_plan_holders_24m y purge_travel_plans_24m.

-- ── Rollback ──────────────────────────────────────────────────────────────────
-- Quita solo la programación; lo ya borrado no se recupera.
--
--   SELECT cron.unschedule('purge_travel_plans_24m');

-- ── Alternativa NO adoptada (se deja documentada) ─────────────────────────────
-- Podar revisiones antiguas conservando siempre la vigente de cada sesión, con
-- independencia de su antigüedad. Más agresivo en volumen, pero rompe la trazabilidad
-- del historial que la 0002 vino a habilitar, así que se descartó:
--
--   DELETE FROM travel_plans t USING travel_plans v
--     WHERE t.session_id = v.session_id AND t.created_at < v.created_at;
