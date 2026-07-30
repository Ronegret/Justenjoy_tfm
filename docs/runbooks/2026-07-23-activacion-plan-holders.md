# Runbook — Activación de `plan_holders` (RLS + consentimiento + webhooks)

- **Fecha:** 2026-07-23
- **Alcance:** puesta en producción de los frentes 1–3 sobre `plan_holders`.
  Operación de **infra** (requiere acceso admin a Supabase y al host de n8n).
- **Specs:** [`2026-07-23-rgpd-plan-holders-rls.md`](../specs/2026-07-23-rgpd-plan-holders-rls.md),
  [`2026-07-23-buscador-clientes-servidor.md`](../specs/2026-07-23-buscador-clientes-servidor.md).
- **PRs:** #74 (RLS + migración + legales), #75 (consentimiento), #76 (buscador server-side).

> **Orden crítico:** aplicar la **migración (paso 2) ANTES** de reaprovisionar n8n (paso 4).
> Si se reaprovisiona primero, el nodo que escribe `consent_*` fallaría en silencio (columnas
> inexistentes + `onError: continueRegularOutput` → el lead se pierde sin aviso).

> **Entorno:** ejecutar los `curl`/`node` en Git Bash; los `docker compose` en PowerShell.
> Norton hace MITM TLS en esta máquina → usar `curl --ssl-no-revoke` (ver la nota de entorno del
> equipo). Las claves salen del `.env` local (no versionado).

---

## 0. Prerrequisito
Merge de **#76** en `develop` y checkout de `develop` actualizado (para que el workflow v39
tenga la rama de lectura `holders-search` y el nodo 11 con `consent_*`).

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
Si sale cualquier `PARA` → detente: activar RLS rompería el guardado. Corrige la env antes de seguir.

## 2. Aplicar la migración (DDL + `consent_*` + RLS)
No se puede por REST (es DDL). En el **SQL Editor de Supabase** (o `psql`) ejecutar el contenido de:
`supabase/migrations/2026-07-23_0001_plan_holders.sql`

## 3. Verificar RLS por REST
```bash
HOST="tu-proyecto.supabase.co"          # = SUPABASE_HOST sin https://
SR="$SUPABASE_SERVICE_ROLE_KEY"
ANON="<clave anon del panel Supabase>"  # Project Settings -> API

# (a) service_role DEBE devolver filas (o [] si tabla vacía, pero SIN error 401):
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?select=id&limit=1" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"

# (b) anon DEBE devolver [] (RLS bloquea):
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?select=id&limit=1" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
`(a)` con filas/`[]` sin 401 y `(b)` `[]` → RLS correcta.

## 4. Reaprovisionar n8n (nodo 11 con `consent_*` + webhook `holders-search`)
Upsert por id, **sin `-v`** (conserva owner/sesión/historial):
```powershell
# PowerShell, en la raíz del repo
docker compose down; docker compose up -d
```
Confirmar en la UI de n8n que el workflow v39 tiene los **3 webhooks** (`travel-planner`,
`travel-refine`, `holders-search`) y definir en la env del **frontend** (`.env` / Vercel):
```
N8N_HOLDERS_SEARCH_WEBHOOK_URL=https://<tu-host-n8n>/webhook/holders-search
```

## 5. Prueba de humo — frente 2 (consentimiento)
Generar un plan **con** titular y casilla **marcada** (frontend, usar `localhost:3000`). Luego:
```bash
curl -sS --ssl-no-revoke "https://$HOST/rest/v1/plan_holders?email=eq.<email-de-prueba>&select=*" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR"
```
Debe salir la fila **con `consent_at` y `consent_version` poblados**.
- Si **falla el guardado** → rollback: `ALTER TABLE plan_holders DISABLE ROW LEVEL SECURITY;` y revisar el paso 1.
- Repetir **sin** marcar la casilla → no debe poder avanzar y **no** se inserta fila.

## 6. Prueba — frente 3 (buscador persistente)
Webhook directo:
```bash
curl -sS --ssl-no-revoke -X POST "https://<tu-host-n8n>/webhook/holders-search" \
  -H "Content-Type: application/json" \
  -d '{"session_ids":["<session_id-real-del-paso-5>"],"query":"<nombre del titular>"}'
# Espera: {"matching_session_ids":["<session_id-real>"]}
```
UI: recargar `/dashboard` y buscar por el nombre/email/teléfono del cliente → debe **encontrarlo
tras recargar** (antes de esta entrega solo funcionaba en la sesión activa).

## 7. Programar el borrado a 24 meses (RGPD 5.1.e)
En Supabase (pg_cron si está disponible, o un job externo). SQL de referencia (también en la migración):
```sql
DELETE FROM plan_holders WHERE created_at < NOW() - INTERVAL '24 months';
```

---

## Rollback global
```sql
ALTER TABLE plan_holders DISABLE ROW LEVEL SECURITY;
```
La rama `holders-search` y el nodo 11 no necesitan rollback: sin RLS/columnas siguen operando; el
único fallo real aparece si RLS queda activa con una credencial `anon` (por eso el paso 1).

## Verificación final (checklist)
- [ ] Paso 1: `role=service_role` confirmado.
- [ ] Paso 2: migración aplicada sin error.
- [ ] Paso 3: `service_role` lee; `anon` devuelve `[]`.
- [ ] Paso 4: 3 webhooks activos + `N8N_HOLDERS_SEARCH_WEBHOOK_URL` definida.
- [ ] Paso 5: fila con `consent_at`; sin casilla no se inserta.
- [ ] Paso 6: webhook y dashboard encuentran al cliente tras recargar.
- [ ] Paso 7: borrado a 24 meses programado.
