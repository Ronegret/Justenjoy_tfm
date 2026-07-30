# Runbook — Activación de v40 (revisiones del plan + titular por sesión)

- **Fecha:** 2026-07-30
- **Alcance:** corregir los hallazgos **#30** y **#31** de la auditoría. Operación de **infra**
  (requiere acceso admin a Supabase y al host de n8n).
- **Spec:** [`2026-07-30-persistencia-revisiones-y-titular-por-sesion.md`](../specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md)
- **Arquitectura:** [`Planificador_Viajes_v40_Arquitectura.md`](../../n8n/docs/Planificador_Viajes_v40_Arquitectura.md)

> **Orden crítico:** aplicar las **migraciones (paso 2) ANTES** de publicar la v40 (paso 4).
> La v40 ya **no silencia** los errores de guardado: si se publica antes de quitar el `UNIQUE`,
> cada refinamiento dejará la ejecución en rojo. Al revés no pasa nada.

> **Quien siga en `master` no se rompe.** `master` lleva la v38, que escribe en `travel_plans`
> con 11 columnas y **no toca `plan_holders`**. Estas migraciones no añaden columnas: la 0003 le
> es indiferente y la 0002 le arregla el mismo bug #30 sin que tenga que hacer nada.

> **Entorno:** los `curl`/`node` en Git Bash; los `docker compose` en PowerShell. Norton hace
> MITM TLS en esta máquina → `curl --ssl-no-revoke`. Las claves salen del `.env` local.

---

## 0. Prerrequisito
Rama con la v40 fusionada (o checkout de la rama de trabajo), de forma que
`n8n/workflows/Planificador_de_Viajes_v40.json` exista y `docker-compose.yml` lo apunte.

## 1. Verificar que la credencial de n8n es `service_role` (NO `anon`)
```bash
# La clave vive en .env, NO exportada en el shell. Soporta los DOS formatos que
# usa Supabase: el nuevo (`sb_secret_...`, sin puntos) y el JWT legacy (3 partes).
KEY=$(grep -h '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '\r')
case "$KEY" in
  sb_secret_*)      echo "OK — clave SECRETA (formato nuevo)";;
  sb_publishable_*) echo "PARA — es la clave PUBLICABLE, no la secreta";;
  *.*.*)            node -e "const r=JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64').toString()).role; console.log(r==='service_role' ? 'OK — service_role (JWT legacy)' : 'PARA — rol '+r)" "$KEY";;
  '')               echo "PARA — SUPABASE_SERVICE_ROLE_KEY no definida en .env";;
  *)                echo "PARA — formato de clave no reconocido";;
esac
```

> ⚠️ **No imprimas la clave.** El bloque de arriba solo evalúa el prefijo; evita
> `echo "$KEY"` o cualquier variante que muestre el valor: es una credencial que
> **salta RLS** y acaba en el historial del terminal.

Comprobación funcional (la que de verdad importa): la clave debe poder leer una tabla
con RLS activa. `plan_holders` tiene RLS **sin políticas**, así que solo una clave con
bypass devuelve algo distinto de un 401:

```bash
HOST=$(grep -h '^SUPABASE_HOST=' .env | cut -d= -f2- | tr -d '\r' | sed 's#https://##; s#/$##')
curl -sS --ssl-no-revoke -o /dev/null -w "service_role -> %{http_code} (debe ser 200)\n" \
  "https://$HOST/rest/v1/plan_holders?select=id&limit=1" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
```
Si sale cualquier `PARA` → detente: sin la clave secreta la escritura fallaría, y ahora
además de forma visible.

## 2. Aplicar las dos migraciones
No se pueden por REST (son DDL). En el **SQL Editor de Supabase** (o `psql`), en este orden:

1. `supabase/migrations/2026-07-30_0002_travel_plans_revisiones.sql` — versiona el DDL de
   `travel_plans` y **quita el `UNIQUE` de `session_id`**.
2. `supabase/migrations/2026-07-30_0003_plan_holders_por_sesion.sql` — dedup por
   `(email, session_id)` en vez de por email.

Ambas son idempotentes; se pueden reejecutar sin efecto.

3. `supabase/migrations/2026-07-30_0004_travel_plans_retencion_24m.sql` — conservación a
   **24 meses** por `created_at` + job `pg_cron` mensual (`purge_travel_plans_24m`). Decidido el
   2026-07-30. Requiere la extensión `pg_cron` habilitada; verificar después con:
   `SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'purge_%';` → deben salir
   los dos jobs, el de `plan_holders` y el de `travel_plans`.

> La 0004 **no** condiciona la publicación de la v40: se puede aplicar antes o después.

## 3. Verificar el esquema por REST (antes de tocar n8n)
```bash
# HOST y SR salen del .env: NO estan exportados en el shell (lo dice el paso 1).
# Copiar estas dos lineas en cada terminal nueva; sin ellas los curl dan 401 y se
# confunden con "la migracion no se aplico".
HOST=$(grep -h '^SUPABASE_HOST=' .env | cut -d= -f2- | tr -d '\r' | sed 's#https://##; s#/$##')
SR=$(grep -h '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '\r')

# (a) Prueba del UNIQUE: insertar DOS filas con el mismo session_id de prueba.
#     Ambas deben devolver 201. Si la segunda da 409 → la migración 0002 no se aplicó.
for i in 1 2; do
  curl -sS --ssl-no-revoke -o /dev/null -w "insert $i -> %{http_code}\n" \
    -X POST "https://$HOST/rest/v1/travel_plans" \
    -H "apikey: $SR" -H "Authorization: Bearer $SR" -H "Content-Type: application/json" \
    -d '{"session_id":"runbook_smoke_v40","status":"plan_ready","destination":"X","origin":"Y",
         "departure_date":"2026-09-01","return_date":"2026-09-02","plan":{}}'
done

# (b) Limpieza de la prueba (IMPORTANTE: no dejar basura en la tabla)
curl -sS --ssl-no-revoke -X DELETE \
  "https://$HOST/rest/v1/travel_plans?session_id=eq.runbook_smoke_v40" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"
```

## 4. Publicar la v40
```powershell
docker compose down
docker compose up -d
```
**Sin `-v`**: el import hace *upsert* por id (`8Kym9GIgNKp7Nrdh`) y así se conservan el owner,
el historial de ejecuciones y —crítico para el refinamiento— la memoria de sesión en
`workflow_entity.staticData`.

Confirmar en la UI de n8n que el workflow se llama **"Planificador de Viajes — v40"** y tiene
los **3 webhooks**: `travel-planner`, `travel-refine`, `holders-search`.

## 5. Humo de #30 — el refinamiento se guarda
```bash
# HOST y SR salen del .env: NO estan exportados en el shell (lo dice el paso 1).
# Copiar estas dos lineas en cada terminal nueva; sin ellas los curl dan 401 y se
# confunden con "la migracion no se aplico".
HOST=$(grep -h '^SUPABASE_HOST=' .env | cut -d= -f2- | tr -d '\r' | sed 's#https://##; s#/$##')
SR=$(grep -h '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '\r')

# 1) Plan corto (usa fechas FUTURAS) y quédate con el session_id
curl -s -X POST http://localhost:5678/webhook/travel-planner \
  -H 'Content-Type: application/json' -d @n8n/examples/input-formulario-con-titular.json \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log(r.session_id)})"

# 2) Refinar esa sesión
curl -s -X POST http://localhost:5678/webhook/travel-refine -H 'Content-Type: application/json' \
  -d '{"session_id":"<SID>","feedback_text":"Hazlo mas barato"}' > /dev/null

# 3) DEBE haber 2 filas, con revision_snapshot distinto
curl -sS --ssl-no-revoke \
  "https://$HOST/rest/v1/travel_plans?select=created_at,plan->revision_snapshot&session_id=eq.<SID>&order=created_at" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"
```

## 6. Humo de #31 — el cliente recurrente es localizable
Lanzar **dos** planes con el **mismo** `holder.email` (fechas o destino distintos) y comprobar:
```bash
# HOST y SR salen del .env: NO estan exportados en el shell (lo dice el paso 1).
# Copiar estas dos lineas en cada terminal nueva; sin ellas los curl dan 401 y se
# confunden con "la migracion no se aplico".
HOST=$(grep -h '^SUPABASE_HOST=' .env | cut -d= -f2- | tr -d '\r' | sed 's#https://##; s#/$##')
SR=$(grep -h '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '\r')

# (a) 2 filas en plan_holders para ese email
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?select=session_id,created_at&email=eq.<EMAIL>" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"

# (b) el buscador devuelve LAS DOS sesiones
curl -s -X POST http://localhost:5678/webhook/holders-search -H 'Content-Type: application/json' \
  -d '{"session_ids":["<SID1>","<SID2>"],"query":"<nombre del titular>"}'
```
Antes de v40, (a) devolvía 1 fila y (b) solo el primer `session_id`.

## 7. Comprobar que los errores ya NO se silencian
Con la v40 publicada, poner temporalmente un `SUPABASE_HOST` inválido en el entorno de n8n,
lanzar un plan y comprobar que:
- el webhook **sigue devolviendo el plan** al usuario (200), y
- la ejecución aparece **fallida** en la lista de ejecuciones de n8n.

Restaurar la variable al terminar. Este paso es el que valida el cambio de operativa: a partir
de ahora un fallo de persistencia es visible en vez de desaparecer.

> ✅ **Ya ejecutado el 2026-07-30** contra la instancia local, con titular incluido: el usuario
> recibió su plan completo (200, `plan_ready`) y la ejecución salió `error`.
>
> ⚠️ **Corrección (misma fecha, tercera lectura).** Este párrafo decía que habían fallado "los dos
> nodos de escritura" y que la prueba confirmaba que un fallo del titular no cuesta el plan.
> **Ninguna de las dos cosas era cierta:** `Supabase — Guardar Titular` no llegó a ejecutarse. En
> la ejecución 78 de la BD de n8n, `runData` no contiene ni `Preparar Payload Titular` ni
> `Supabase — Guardar Titular`, y la pila pendiente al abortar era
> `['Supabase — Guardar Plan', 'Preparar Payload Titular']`: el fallo del insert del plan
> **descartó la rama del titular** y el lead se perdió (hallazgo #38). Corregido moviendo esa
> persistencia a una **sub-ejecución** (§7.3 del doc de arquitectura), lo que **sí** da el
> aislamiento en los dos sentidos. Al repetir este paso, comprobar ahora **dos** cosas: que el plan
> llega al usuario y que la **sub-ejecución** del titular aparece por separado en la lista (fallida
> si Supabase está caído, correcta si no).

---

## Rollback

- **Workflow:** reimportar `n8n/workflows/archive/Planificador_de_Viajes_v39.json` (mismo id →
  upsert). Vuelve el `onError` y con él el silencio.
- **Migración 0003:** ver el bloque de rollback al final del `.sql`. **Destructivo**: recrear el
  UNIQUE por email exige borrar los titulares de los viajes posteriores.
- **Migración 0002:** ver el bloque de rollback al final del `.sql`. **Destructivo**: recrear el
  UNIQUE exige dejar una sola fila por sesión (se pierden las revisiones).

## Checklist

- [ ] Credencial verificada como `service_role`
- [ ] Migración 0002 aplicada
- [ ] Migración 0003 aplicada
- [ ] Migración 0004 aplicada y job `purge_travel_plans_24m` visible en `cron.job`
- [ ] Esquema verificado por REST (dos inserts con el mismo `session_id` → 201/201) y basura borrada
- [ ] v40 publicada, 3 webhooks visibles, nombre "— v40"
- [ ] Humo #30: 2 filas tras refinar
- [ ] Humo #31: 2 filas de titular y el buscador devuelve ambas sesiones
- [ ] Comprobado que un fallo de guardado deja la ejecución en rojo
