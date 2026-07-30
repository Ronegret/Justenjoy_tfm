# Planificador de Viajes — v40
## Documentación de Arquitectura

> **Versión:** v40 (canónica y activa del proyecto)
> **Plataforma:** n8n 2.25.7 (Self Hosted)
> **Estado:** Estable — versión activa del proyecto (TFM)
> **Workflow:** 1 main workflow, id `8Kym9GIgNKp7Nrdh` (reutiliza el id de v34/v38/v39: al
> reimportar hace *upsert* sobre el workflow existente, sin duplicar ni chocar en el webhook)
> **Persistencia:** Supabase (tablas `travel_plans` y `plan_holders`)
> **Spec:** [`../../docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md`](../../docs/specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md)

## Relación con v39

v40 se construye **directamente sobre v39**, con el que comparte id de workflow, los tres
webhooks (`travel-planner` / `travel-refine` / `holders-search`), los 33 nodos y **todos sus
UUIDs**. v39 queda congelado en
[`../workflows/archive/Planificador_de_Viajes_v39.json`](../workflows/archive/Planificador_de_Viajes_v39.json)
y toda su arquitectura sigue descrita en
[`Planificador_Viajes_v39_Arquitectura.md`](Planificador_Viajes_v39_Arquitectura.md).

**No hay nodos nuevos, ni conexiones nuevas, ni cambios en los Code nodes ni en el contrato
de los webhooks.** v40 corrige exclusivamente **cómo persiste** lo que ya calculaba, y va
acompañada de dos migraciones de esquema que son la mitad del arreglo.

### Cambios en v40

| Nodo | Cambio | Por qué |
|---|---|---|
| `Supabase — Guardar Plan` | Se elimina `onError: continueRegularOutput`; nota corregida | Hallazgo **#30** |
| `Supabase — Guardar Titular` | Se elimina `onError: continueRegularOutput`; nota corregida | Hallazgo **#31** |

Diff completo frente a v39: **8 líneas**.

## §1 — #30: el plan refinado ya se persiste

Hasta v39, `travel_plans.session_id` era `TEXT UNIQUE` y `Supabase — Guardar Plan` es un
`create`. El primer `plan_ready` insertaba su fila; **el refinamiento, que reutiliza el mismo
`session_id`, se rechazaba**, y `onError: continueRegularOutput` convertía el rechazo en
silencio: el webhook devolvía 200 con un plan revisado que no se había guardado. Verificado por
E2E el 2026-07-30 (tras refinar: 1 fila, `created_at == updated_at`).

En v40, **cada `plan_ready` deja su propia fila**, gracias a la migración
`supabase/migrations/2026-07-30_0002_travel_plans_revisiones.sql`, que quita ese `UNIQUE` y
deja índice no único.

- **No hay columna de revisión.** El número ya viaja dentro del jsonb: `plan.revision_snapshot`
  (0 en el plan inicial, incrementado en cada refinamiento). Añadir una columna habría roto la
  compatibilidad con v38 — ver abajo.
- **El plan vigente de una sesión es el de `created_at` más reciente.** Hay índice
  `idx_travel_plans_session_created (session_id, created_at DESC)` para esa consulta.

## §2 — #31: un titular por viaje, no por persona

La migración 0001 dedupaba `plan_holders` por email con semántica *first-wins*. Efecto
colateral verificado: el **segundo** viaje de un cliente ya registrado no creaba fila, así que
la tabla conservaba el `session_id` del primero y el buscador del dashboard —que filtra por los
`session_id` que el usuario posee— **nunca encontraba los viajes posteriores**.

En v40, `supabase/migrations/2026-07-30_0003_plan_holders_por_sesion.sql` sustituye
`uq_plan_holders_email` por `uq_plan_holders_email_session (email, session_id)`:

- Un titular tiene **una fila por viaje**; sigue sin duplicarse el **mismo** viaje
  (idempotencia ante reintentos del nodo).
- Queda **evidencia de consentimiento por viaje** (`consent_at`/`consent_version`), más
  defendible para el art. 6.1.a que heredar la del primero.
- **No hay cambio de código**: `12_buscar_titulares.js` ya deduplica los resultados con un
  `Set` y filtra por posesión, así que funciona igual con N filas por cliente.
- Contrapartida asumida: se retienen más datos del titular por persona. Reflejado en
  `docs/legal/ROPA.md`, Actividad 6.

## §3 — Los fallos de persistencia dejan de ser invisibles

Ambos nodos de escritura llevaban `onError: continueRegularOutput`, que es exactamente lo que
AGENTS.md §5 y §9.4 prohíben: el error desaparecía y la ejecución salía verde.

**Quitarlo es seguro para el cliente.** El fan-out de `Preparar Payload Supabase` conecta
`Responder — Plan Listo` en el **índice 0** y `¿Guardar en Supabase?` en el **1**; con
`executionOrder: v1` el orden por índice y por posición en el canvas coinciden, así que **el
HTTP 200 ya se ha enviado** cuando corre la rama de persistencia:

```
Preparar Payload Supabase
  ├─[0] Responder — Plan Listo      ← el usuario ya tiene su plan
  └─[1] ¿Guardar en Supabase? → Extraer Record → Supabase — Guardar Plan
```

A partir de v40, un fallo de guardado **marca la ejecución como fallida** en n8n, visible en la
lista de ejecuciones, sin afectar a la respuesta del usuario. Es un cambio de operativa: lo que
antes se perdía en silencio ahora se ve.

## §4 — Compatibilidad con v38 (la versión de `master`)

`master` sigue en v38, que escribe en `travel_plans` con `autoMapInputData` y **exactamente 11
columnas**, y **no escribe en `plan_holders`**. Las dos migraciones son compatibles:

- La 0003 **no le afecta**: v38 no toca esa tabla.
- La 0002 **le beneficia**: v38 sufre el mismo #30, y al caer el `UNIQUE` sus refinamientos
  empiezan a persistirse solos.
- **Regla que respeta v40:** ninguna columna nueva. Una columna `NOT NULL` sin `DEFAULT`
  rompería los inserts de v38 y —por su `onError`— en silencio.

## §5 — Orden de despliegue (no es opcional)

Las migraciones van **antes** de publicar la v40. Al revés, la v40 —que ya no silencia
errores— fallaría ruidosamente en cada refinamiento contra el `UNIQUE` todavía presente.
Procedimiento completo en
[`../../docs/runbooks/2026-07-30-activacion-v40-revisiones.md`](../../docs/runbooks/2026-07-30-activacion-v40-revisiones.md).

## §5.1 — Ventana de carrera al refinar (comportamiento de n8n, no de v40)

Detectado en el E2E de v40: refinar un plan **~1,5 s** después de recibirlo devuelve
`Sesión no encontrada` (HTTP 400). n8n vuelca el `staticData` de la sesión a su base de datos
de forma **asíncrona** al terminar la ejecución, y el refinamiento —que lo lee de ahí— llega
antes. Con unos segundos de margen funciona (verificado: el mismo caso a 8 s devolvió
`revision_count: 2`).

No lo introduce v40 y no tiene arreglo desde el workflow. En la UI real el usuario tarda en
escribir su ajuste, así que es difícil de alcanzar; y si ocurre, el frontend ya trata ese 400
como `session_expired` y conserva el plan intacto. El único matiz es que el mensaje
("la sesión ha caducado") no describe bien esta situación concreta.

## §6 — Lo que NO cambia

Contrato de los webhooks (entradas y salidas), Code nodes, motor planificador, rutas A/B,
validaciones, enriquecimiento de coordenadas y el frontend. `travel_plans` **sigue sin RLS**
por decisión del equipo (gaps #8/#9 de la auditoría, abiertos a propósito); v40 no lo cambia.
