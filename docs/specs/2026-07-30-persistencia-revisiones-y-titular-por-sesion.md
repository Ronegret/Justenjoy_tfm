# Spec — Persistir las revisiones del plan y el titular por sesión (workflow v40)

- **Fecha:** 2026-07-30
- **Tipo:** corrección de dos defectos de persistencia (esquema Supabase + nodos n8n)
- **Estado:** **APROBADA** el 2026-07-30 por Enrique, que confirma tener autoridad para
  aprobarla. Cubre lo que AGENTS.md §3.2 exige aprobar: cambio de nodos del workflow y del
  esquema de la base de datos. **El contrato de los webhooks NO cambia** (ni entradas ni
  salidas), así que el frontend no se toca.
- **Rama (prevista):** `fix/persistencia-revisiones-y-titular`

## Contexto

El E2E del workflow v39 del 2026-07-30 (9 casos sobre los tres webhooks) destapó dos
defectos, anotados como **#30** y **#31** en §0.6 de
[`docs/auditoria-cumplimiento-legal-seguridad.md`](../auditoria-cumplimiento-legal-seguridad.md):

- **#30 — el plan refinado nunca se guarda.** `Supabase — Guardar Plan` es `operation: create`
  y `travel_plans.session_id` es `TEXT UNIQUE`, así que el segundo guardado de una sesión se
  rechaza; `onError: continueRegularOutput` se traga el fallo y el webhook responde 200
  igualmente. Verificado: tras refinar, una sola fila con `created_at == updated_at`.
- **#31 — el segundo viaje de un cliente no registra titular.** El índice
  `uq_plan_holders_email` impide la segunda fila del mismo email, así que `plan_holders`
  conserva el `session_id` del primer viaje y el buscador del dashboard nunca encuentra los
  posteriores. Verificado con dos planes del mismo email: la búsqueda por nombre, email y
  teléfono devuelve siempre la primera sesión.

Los dos comparten causa: **un `UNIQUE` que el workflow trata como si no existiera**, y un
`onError` que convierte el rechazo en silencio.

## Qué hace

- **Quita el `UNIQUE` de `travel_plans.session_id`** y deja índice no único: cada `plan_ready`
  —inicial o refinamiento— pasa a dejar su propia fila. El número de revisión ya viaja dentro
  del `plan` jsonb (`plan.revision_snapshot`), así que **no hace falta ninguna columna nueva**.
- **Sustituye `uq_plan_holders_email` por un `UNIQUE (email, session_id)`**: un titular puede
  tener tantas filas como viajes, y se sigue evitando el duplicado del mismo viaje (idempotencia
  ante reintentos). Como efecto secundario deseable, queda **evidencia de consentimiento por
  viaje**, no solo del primero.
- **Deja de silenciar los fallos de persistencia**: se elimina `onError: continueRegularOutput`
  de `Supabase — Guardar Plan` y `Supabase — Guardar Titular`.
- **Versiona por primera vez el DDL de `travel_plans`**, que hoy solo existe en prosa dentro de
  un documento archivado. Cierra el gap **#15** de la auditoría para esa tabla.
- Corrige dos textos del repo que afirman lo contrario de lo que hace el código.

## Qué NO hace (fuera de alcance)

- **No** toca el frontend: `travel_plans` no la lee nadie y el buscador de titulares ya
  deduplica con un `Set`, así que funciona sin cambios con varias filas por cliente.
- **No** activa RLS en `travel_plans`: hay decisión explícita del equipo de dejarla sin RLS
  (gaps #8/#9, abiertos a propósito). Esta spec no la contradice.
- **No** añade columnas: ver la restricción de compatibilidad de abajo.
- **No** deja el borrado por retención sin decidir: el plazo de la Actividad 3 se cierra en
  **24 meses** (ver riesgos) y se agenda por `pg_cron` en la migración 0004.
- **No** cambia el contrato de los webhooks ni la respuesta al cliente.

## Decisiones

| # | Decisión | Alternativa descartada |
|---|---|---|
| D1 | **#30 = historial de revisiones** (una fila por `plan_ready`) | Upsert por `session_id` vía HTTP Request a PostgREST — el nodo Supabase de n8n v1 no tiene `upsert` |
| D2 | **#31 = una fila por `(email, session_id)`** | Tabla hija 1:N `plan_holder_sessions` (mejor en minimización, pero obliga a join en la lectura y `ON DELETE CASCADE`); upsert last-wins (no resuelve "ver todos sus viajes") |
| D3 | **Workflow nuevo v40**, mismo id `8Kym9GIgNKp7Nrdh` | Parchear v39 en sitio |

## Compatibilidad con `master` (restricción de diseño)

`master` lleva la **v38**: escribe en `travel_plans` con `autoMapInputData` y exactamente 11
columnas, y **no escribe en `plan_holders`**.

- **#31 no le afecta**: no toca esa tabla.
- **#30 le beneficia**: la v38 sufre el mismo bug; al caer el `UNIQUE`, sus refinamientos
  empiezan a persistirse solos.
- **Regla dura:** toda columna nueva iría `NULL`-able o con `DEFAULT`. Una `NOT NULL` sin
  default rompería los inserts de la v38 **en silencio**. Esta spec no añade ninguna.
- El criterio de "plan vigente" es **`created_at DESC`**, válido para filas de v38 y de v40.

## Qué puede salir mal

- **El orden de despliegue no es opcional.** La migración va **antes** de publicar la v40: al
  revés, la v40 ya sin `onError` fallaría ruidosamente en cada refinamiento. Lo fija el runbook.
- **La BD es compartida** por el equipo: la migración se aplica una vez y la ven los tres,
  corran v38 o v40. Por eso el SQL es idempotente.
- **Volumen y retención — RESUELTO el 2026-07-30.** Con revisiones, un plan muy refinado guarda
  N copias del `plan` jsonb, que según el ROPA puede reflejar indirectamente categorías del
  art. 9, y el plazo de la Actividad 3 estaba en `[COMPLETAR]`. **Decidido: 24 meses desde
  `created_at`**, igual que `plan_holders`, con job `pg_cron` mensual
  (`2026-07-30_0004_travel_plans_retencion_24m.sql`). Cada revisión caduca por separado.
- **Más PII retenida por persona** (#31): una fila de titular por viaje en vez de una por
  persona. Contrapartida aceptada a cambio de la evidencia de consentimiento por viaje; hay que
  reflejarlo en el ROPA.
- **Quitar `onError` cambia la operativa**: fallos antes invisibles pasarán a aparecer como
  ejecuciones fallidas en n8n. Es el objetivo, pero conviene avisar al equipo para que no lo lea
  como una regresión.

## Ficheros que toca

- `supabase/migrations/2026-07-30_0002_travel_plans_revisiones.sql`,
  `2026-07-30_0003_plan_holders_por_sesion.sql` y `2026-07-30_0004_travel_plans_retencion_24m.sql`
  (nuevos) + el índice del `README.md`.
- `n8n/workflows/Planificador_de_Viajes_v40.json` (nuevo) y v39 → `archive/`.
- Arrastre de la subida de versión: `docker-compose.yml` (ruta hardcodeada del import),
  `n8n/nodes-code/_inject.py`, `n8n/nodes-code/README.md`, `n8n/workflows/archive/README.md`,
  `docs/ARCHITECTURE.md`, `README.md`, `AGENTS.md`.
- `n8n/docs/Planificador_Viajes_v40_Arquitectura.md` (nuevo, solo el delta).
- `docs/auditoria-cumplimiento-legal-seguridad.md`, `docs/legal/ROPA.md`,
  `n8n/docs/Planificador_Viajes_v34_Arquitectura.md` (nota falsa).
- `docs/runbooks/2026-07-30-activacion-v40-revisiones.md` (nuevo).

## Verificación

- `.\verify.ps1` en verde y `python n8n/nodes-code/_inject.py` sin diferencias.
- **#30:** plan corto → refinar → `travel_plans` debe tener **2 filas** para ese `session_id`,
  con `revision_snapshot` distinto dentro de `plan`.
- **#31:** dos planes con el mismo `holder.email` → **2 filas** en `plan_holders`, y
  `holders-search` con ambas sesiones devuelve **los dos** `session_id`.
- **No regresión de v38:** insertar por REST una fila con exactamente sus 11 columnas y
  comprobar que entra. (Reimportar la v38 en n8n **no**: comparte id y machacaría la v40.)
- **Error ya no silenciado:** forzar un fallo de Supabase y comprobar que la ejecución sale
  fallida en n8n mientras el webhook sigue devolviendo el plan al usuario.
