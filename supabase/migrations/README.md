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
