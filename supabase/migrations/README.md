# Migraciones de Supabase

DDL versionado del proyecto (cierra el gap #15 de la auditoría: antes el esquema
vivía solo en prosa en `n8n/docs/`). **Fuente de verdad del esquema de la base de
datos.**

## Convención

- Un fichero por cambio: `YYYY-MM-DD_NNNN_descripcion.sql` (orden lexicográfico).
- SQL **idempotente** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`): la instancia
  real ya tiene tablas creadas a mano, así que las migraciones deben poder
  ejecutarse sobre ese estado sin chocar.

## Importante: NO se aplican solas

Estos ficheros **no** se ejecutan automáticamente (no hay pipeline de migraciones).
Los aplica **infra** manualmente en el editor SQL de Supabase / por REST / psql,
siguiendo el runbook de la spec correspondiente. Acceso admin al proyecto requerido
(ver `docs/legal/` y la política de permisos del repo).

## Índice

| Fichero | Qué hace | Spec |
|---|---|---|
| `2026-07-23_0001_plan_holders.sql` | Esquema de `plan_holders` + consentimiento (6.1.a) + activar RLS | `docs/specs/2026-07-23-rgpd-plan-holders-rls.md` |
| `2026-07-30_0002_travel_plans_revisiones.sql` | DDL de `travel_plans` + quita el `UNIQUE` de `session_id` para guardar las revisiones del plan (#30) | `docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md` |
| `2026-07-30_0003_plan_holders_por_sesion.sql` | Dedup de `plan_holders` por `(email, session_id)` en vez de por email (#31) | `docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md` |
| `2026-07-30_0004_travel_plans_retencion_24m.sql` | Conservación de `travel_plans`: 24 meses por `created_at` + job pg_cron mensual | `docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md` |

> Orden de aplicación: 0002 y 0003 van **antes** de publicar el workflow v40 (ver
> `docs/runbooks/2026-07-30-activacion-v40-revisiones.md`). Ninguna de las dos rompe al
> workflow v38 que sigue en `master`.
