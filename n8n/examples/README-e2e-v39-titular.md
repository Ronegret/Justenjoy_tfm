# E2E v39 — Registro del titular (salidas reales)

Ejecución de extremo a extremo contra n8n real (v39, id `8Kym9GIgNKp7Nrdh`) y la
Supabase real, tras reprovisionar el stack (`docker compose down && up -d`). Fecha
de la corrida: 2026-07-23.

Las respuestas del webhook se guardan aquí como salidas reales (el `holder` **no**
aparece en la respuesta: se comprobó que no se filtra). La verificación de filas se
hizo con la REST API de Supabase (`--ssl-no-revoke` por la intercepción TLS del
antivirus en el host).

| Caso | Entrada | Fichero salida | `status` | `session_id` | `travel_plans` | `plan_holders` |
|---|---|---|---|---|---|---|
| 1 · A con titular | Barcelona→Lisbon 3 noches | `output-plan-v39-e2e-plan-ready-con-titular.json` | `plan_ready` | `session_1784808529102_x9p7ycc2c` | 1 fila | **1 (Ana)** |
| 2 · A sin titular | Barcelona→Lisbon 3 noches | `output-plan-v39-e2e-plan-ready-sin-titular.json` | `plan_ready` | `session_1784808683332_pqnle2aew` | 1 fila | **[] (ninguna)** |
| 3 · A fechas pasadas | 2025-01, con titular | `output-plan-v39-e2e-fechas-pasadas.json` | `plan_ready` (sin vuelo) | `session_1784808756171_9z0x8jr8v` | 1 fila | 1 (Carlos) |
| 4 · A presupuesto ínfimo | Tokyo, 50 USD, con titular | `output-plan-v39-e2e-needs-user-input.json` | `needs_user_input` (budget_exceeded → 3647) | `session_1784808824879_igfbofsb8` | **[] (no persiste)** | **1 (Diego)** |
| 5 · A viaje largo | Tokyo 20 días, con titular | `output-plan-v39-e2e-error-viaje-largo.json` | `error` (truncamiento, 0 días) | `session_1784808933406_s3vzcd8kb` | **[] (no persiste)** | **1 (Elena)** |
| 6 · B refinamiento | sesión del caso 1, "más barato" | `output-plan-v39-e2e-refinamiento.json` | `plan_ready`, `revision_count=2` | `session_1784808529102_x9p7ycc2c` | 1 (UNIQUE) | 1 (no duplica) |

## Comportamientos validados

- **Titular condicional:** `plan_holders` recibe fila **solo** si se rellenó el titular
  (caso 1 vs 2).
- **Captación aunque el plan falle:** en `needs_user_input` (caso 4) y `error` (caso 5)
  el plan **no** se persiste en `travel_plans`, pero el lead **sí** queda en
  `plan_holders` (rama paralela tras validar el formulario).
- **Refinamiento no duplica el lead** (caso 6): RUTA B no pasa por la rama del titular.
- **Sin fuga de PII:** el `holder` no aparece en la respuesta del webhook.

## Observación fuera de alcance (flujo existente, no del titular)

En el caso 6, `travel_plans` sigue con **1** fila para esa sesión, no 2. `travel_plans.session_id`
es `UNIQUE` (DDL de v34), así que el insert del refinamiento choca con la unicidad y el
nodo Supabase lo traga por `onError: continueRegularOutput`. Contradice la doc de v34
("cada refinamiento crea un registro nuevo"). Pendiente de decidir como issue aparte.
