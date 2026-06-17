# Código de los nodos Code del workflow Planificador v24

Los 7 nodos `n8n-nodes-base.code` del workflow `../workflows/Planificador_de_Viajes_v24.json`
viven aquí como **fuente de verdad versionada**. El JSON del workflow lleva el código
embebido en el campo `jsCode` de cada nodo, pero es frágil (n8n puede vaciarlo al
reimportar, y editar JS dentro de un string JSON es incómodo). Estos `.js` son la copia
canónica y revisable.

## Ficheros

| Fichero | Nodo n8n | Función |
|---|---|---|
| `01_validar_formulario.js` | Validar Formulario | Normaliza entrada, genera `session_id`, valida 8 campos, construye `session_state` |
| `02_cargar_sesion.js` | Cargar Sesión | Recupera sesión por `session_id` (ruta de refinamiento) |
| `03_parsear_refinamiento.js` | Parsear Refinamiento | Parsea el JSON del agente de refinamiento con fallback |
| `04_preparar_motor.js` | Preparar Motor Planificador | Unifica rutas A/B, construye `segments[]` |
| `05_convertir_iata.js` | Convertir Ciudades a IATA | 3 tablas (~75 ciudades): IATA, GPS, nombre aeropuerto |
| `06_validar_output.js` | Validar Output del Planificador | Parse seguro + safety nets del plan |
| `07_logger_metricas.js` | Logger - Tokens y Métricas | Añade `_debug` con métricas |

## Reaplicar el código al workflow JSON

Tras editar cualquier `.js`, reinyecta en el JSON:

```bash
python _inject.py
```

Luego reimporta en n8n (upsert por ID, no duplica):

```bash
docker compose cp n8n/workflows/Planificador_de_Viajes_v24.json n8n:/tmp/wf.json
docker compose exec -T n8n n8n import:workflow --input=/tmp/wf.json
```

## Smoke test (sin APIs externas)

Verifica la cadena determinista Validar → Preparar → IATA con el input de ejemplo:

```bash
docker compose cp n8n/nodes-code/_smoketest.js n8n:/tmp/st.js
docker compose cp n8n/examples n8n:/tmp/examples   # ajusta rutas si hace falta
docker compose exec -T n8n node /tmp/st.js
```
