# Código de los nodos Code del workflow Planificador v34

Los 10 nodos `n8n-nodes-base.code` del workflow `../workflows/Planificador_de_Viajes_v34.json`
viven aquí como **fuente de verdad versionada**. El JSON del workflow lleva el código
embebido en el campo `jsCode` de cada nodo, pero es frágil (n8n puede vaciarlo al
reimportar, y editar JS dentro de un string JSON es incómodo). Estos `.js` son la copia
canónica y revisable.

> **Contrato de gobernanza:** estos ficheros deben coincidir exactamente con el
> `jsCode` embebido en v34. `_inject.py` es reversible: reinyectar los `.js` sin
> editarlos deja el JSON byte-idéntico. Si añades, quitas o renombras un nodo Code
> en v34, actualiza el mapeo de `_inject.py` y esta tabla en el mismo commit.

## Ficheros

| Fichero | Nodo n8n | Función |
|---|---|---|
| `01_validar_formulario.js` | Validar Formulario | Normaliza entrada, genera `session_id`, valida campos, construye `session_state` |
| `02_cargar_sesion.js` | Cargar Sesión | Recupera sesión por `session_id` (ruta de refinamiento) |
| `03_parsear_refinamiento.js` | Parsear Refinamiento | Parsea el JSON del agente de refinamiento con fallback |
| `04_preparar_motor.js` | Preparar Motor Planificador | Unifica rutas A/B, construye `segments[]` |
| `05_convertir_iata.js` | Convertir Ciudades a IATA | Tablas de ciudades: IATA, GPS, nombre de aeropuerto |
| `06_validar_output.js` | Validar Output del Planificador | Parse seguro + safety nets del plan (itinerario del LLM; safety net de `daily_itinerary` solo si viene vacío) |
| `07_logger_metricas.js` | Logger — Métricas | Añade `_debug` con métricas de ejecución (sin captura de tokens — nunca funcionó) |
| `08_preparar_payload_supabase.js` | Preparar Payload Supabase | Construye el `_supabase_record` (solo si `status === plan_ready`); marca `_skip_supabase` |
| `09_extraer_record.js` | Extraer Record | Aísla el `_supabase_record` para el nodo de inserción en Supabase |
| `10_enriquecer_coordenadas.js` | Enriquecer Coordenadas (OpenStreetMap) | Añade 1 coordenada/día al `daily_itinerary` (actividad → geocoding Nominatim del `points_of_interest` del LLM → centro de ciudad) para el mapa del frontend |

## Reaplicar el código al workflow JSON

Tras editar cualquier `.js`, reinyecta en el JSON:

```bash
python _inject.py
```

`_inject.py` mapea cada nodo por su `id` en v34 y reescribe solo el campo `jsCode`,
preservando el resto del JSON (round-trip byte-idéntico si no editaste nada).

Luego reimporta en n8n. **No uses publish/unpublish en caliente** (corrompe el
volumen): reaprovisiona vía el servicio `n8n-import` del compose, o manualmente por
upsert de ID (no duplica):

```bash
docker compose cp n8n/workflows/Planificador_de_Viajes_v34.json n8n:/tmp/wf.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/wf.json
```

## Smoke test (sin APIs externas)

Verifica la cadena determinista Validar → Preparar → IATA con el input de ejemplo:

```bash
docker compose cp n8n/nodes-code/_smoketest.js n8n:/tmp/st.js
docker compose cp n8n/examples n8n:/tmp/examples   # ajusta rutas si hace falta
docker compose exec -T n8n node /tmp/st.js
```
