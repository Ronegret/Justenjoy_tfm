# Credenciales de n8n (estructura versionable, SIN secretos)

`credentials.json` define la **estructura** de las credenciales que usa el workflow
(mismos `id`, `name` y `type` que referencian los nodos en `n8n/workflows/`).

**No contiene claves reales.** El valor de cada `apiKey` es una expresión que n8n
resuelve en tiempo de ejecución leyendo una variable de entorno del contenedor:

```json
"data": { "apiKey": "={{ $env.OPENAI_API_KEY }}" }
```

## Flujo

1. Las claves reales viven en `.env` (raíz del repo, **no versionado**):
   `OPENAI_API_KEY`, `SERPAPI_KEY`, `TAVILY_API_KEY`.
2. `docker-compose.yml` pasa esas variables al contenedor de n8n y activa
   `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` (imprescindible en n8n v2.x para que
   `$env` se resuelva dentro de credenciales/expresiones).
3. Al arrancar el stack, el servicio `n8n-import` ejecuta automáticamente:
   `n8n import:credentials --input=/import/credentials.json`
   creando/actualizando las 3 credenciales por su `id`.
4. En ejecución, cada nodo resuelve su `apiKey` desde la variable de entorno.

## Reimportar manualmente (si hiciera falta)

```powershell
docker compose exec -u node n8n n8n import:credentials --input=/import/credentials.json
```

La importación es idempotente: sobrescribe por `id` con la misma expresión.
