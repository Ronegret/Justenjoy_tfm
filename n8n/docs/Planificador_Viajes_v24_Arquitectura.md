# Planificador de Viajes — v24
## Documentación de Arquitectura y Setup

> ⚠️ **DOCUMENTO HISTÓRICO — v24 está archivada.** La versión canónica es **v38**:
> ver [`Planificador_Viajes_v38_Arquitectura.md`](Planificador_Viajes_v38_Arquitectura.md).
> El JSON de v24 vive en `../workflows/archive/`. Se conserva solo como referencia.

> **Versión:** v24
> **Plataforma:** n8n 2.23.2 (Self Hosted)
> **Estado:** Funcional — output completo con actividades, itinerario día a día y métricas de ejecución
> **Fecha de documento:** Junio 2026
> **Workflows:** 1 workflow único (Main)

---

## 1. Descripción General

El Planificador de Viajes v24 es un agente de IA automatizado en n8n que genera planes de viaje completos a partir de un formulario web estructurado. Dada una entrada de datos del usuario (origen, destino, fechas, presupuesto, preferencias), el sistema:

1. Busca vuelos reales en las fechas solicitadas (SerpAPI Google Flights)
2. Busca el hotel con mejor review disponible en las fechas del vuelo confirmado (SerpAPI Google Hotels)
3. Busca actividades reales en el destino mediante Google Maps (SerpAPI Google Maps)
4. Calcula la ruta y tiempo de traslado aeropuerto-hotel (SerpAPI Google Maps Directions)
5. Obtiene contexto del destino: visado, clima, transporte (Tavily)
6. Genera un itinerario día a día narrativo en español
7. Valida presupuesto, fechas y coherencia del plan
8. Devuelve un JSON estructurado completo con métricas de ejecución

El sistema permite además **refinamiento iterativo**: el usuario puede enviar una instrucción de texto corta ("prefiero un hotel más barato", "añadir más actividades culturales") y el sistema re-ejecuta solo los pasos afectados sin repetir las búsquedas que ya están correctas.

---

## 2. Evolución de la Versión — Principales Mejoras respecto a v23

| Cambio | Descripción | Impacto |
|---|---|---|
| GPS Coordinates en Google Maps | Tabla de coordenadas `@lat,lng,15z` para ~60 ciudades | Resultados en la ciudad correcta (sin GPS devolvía resultados en California) |
| Query simplificada Google Maps | `[interests[0]] in [ciudad]` en lugar de query genérica | Más resultados relevantes |
| Tool: Google Maps Directions | Nueva herramienta para traslado aeropuerto→hotel | `estimated_local_transport_usd` con datos reales |
| Logger de tokens y métricas | Nodo Code entre Validar Output y Responder | Campo `_debug` en JSON de respuesta |
| Tabla de nombres de aeropuertos | IATA → nombre completo del aeropuerto | Parámetro `start_addr` preciso para Directions |

---

## 3. Arquitectura del Workflow

### Vista general del flujo

```
RUTA A — Formulario inicial
────────────────────────────────────────────────────────────────────
Webhook Formulario → Validar Formulario → ¿Error Formulario?
  ├─ true  → Responder Error (HTTP 400)
  └─ false → Preparar Motor → Convertir Ciudades a IATA
                                      ↓
                              Motor Planificador — Agent 2
                              (5 tools según steps_to_run)
                                      ↓
                              Validar Output → Logger → Responder Plan (HTTP 200)

RUTA B — Refinamiento del plan
────────────────────────────────────────────────────────────────────
Webhook Refinamiento → Cargar Sesión → ¿Error Refinamiento?
  ├─ true  → Responder Error (HTTP 400)
  └─ false → Agente de Refinamiento (GPT-4o-mini)
                    ↓
              Parsear Refinamiento → Preparar Motor → Convertir Ciudades a IATA
                                                              ↓
                                                      Motor Planificador (pasos selectivos)
                                                              ↓
                                                      Validar Output → Logger → Responder Plan
```

### Prioridad de ejecución del Motor Planificador

```
PRIORIDAD 1 — VUELOS (bloqueante)
  Sin vuelo válido → el plan no continúa.
  Las fechas REALES del vuelo determinan las fechas del hotel y las actividades.

PRIORIDAD 2 — HOTEL (bloqueante)
  Solo tras confirmar el vuelo.
  check_in  = arrival_datetime del vuelo de ida (YYYY-MM-DD)
  check_out = departure_datetime del vuelo de regreso (YYYY-MM-DD)
  Criterio: mayor overall_rating dentro del presupuesto. Empate → menor total_rate.

COMPLEMENTO 1 — ACTIVIDADES (no bloqueante)
  Solo tras confirmar vuelo + hotel.
  Presupuesto actividades = budget_total_usd - flights_usd - hotel_usd
  Query Google Maps: [interests[0]] in [ciudad]
  Scoring por activity_interests sobre local_results[]

COMPLEMENTO 2 — INTELIGENCIA DE DESTINO (no bloqueante)
  Google Maps Directions: aeropuerto → hotel (traslado)
  Tavily: visado, clima, transporte local
  plan_notes[] obligatorio si Tavily responde
```

---

## 4. Nodos del Workflow — Descripción Detallada

### 4.1 Triggers

#### `Webhook — Formulario`
- **Tipo:** `n8n-nodes-base.webhook` — POST
- **Path:** `/webhook/travel-planner`
- **Función:** Entrada principal. Recibe JSON del formulario con el `travel_brief` completo.
- **Response Mode:** `responseNode` — la respuesta la gestiona el nodo Responder al final del flujo.

#### `Webhook — Refinamiento`
- **Tipo:** `n8n-nodes-base.webhook` — POST
- **Path:** `/webhook/travel-refine`
- **Función:** Entrada para refinamientos iterativos desde la caja de feedback del frontend.
- **Campos requeridos:** `{ session_id: string, feedback_text: string }`

### 4.2 Ruta A — Validación del Formulario

#### `Validar Formulario`
- **Tipo:** Code (JavaScript)
- **Función:**
  - Normaliza la entrada: acepta datos en `body`, `query` o raíz del JSON
  - Genera `session_id` único: `session_[timestamp]_[random9chars]`
  - Valida 8 campos obligatorios
  - Construye `session_state` inicial con defaults para campos opcionales
  - Persiste en `$getWorkflowStaticData('global')` indexado por `session_id`
- **Campos obligatorios:** `origin_city`, `destination_city` (array), `departure_date`, `return_date`, `travelers`, `budget_total_usd`, `accommodation_type`, `activity_interests`
- **Output OK:** `{ session_id, session_state, route: 'plan_inicial', _error: false }`
- **Output Error:** `{ _error: true, error_detail: 'Campos faltantes: ...', session_id }`

#### `¿Error Formulario?`
- **Tipo:** IF — `true →` Responder Error (HTTP 400); `false →` Preparar Motor Planificador

### 4.3 Ruta B — Refinamiento

#### `Cargar Sesión`
- **Tipo:** Code (JavaScript)
- **Función:** Normaliza entrada. Recupera `session_state` existente. Valida que la sesión exista y `feedback_text` no esté vacío.

#### `Agente de Refinamiento`
- **Tipo:** `@n8n/n8n-nodes-langchain.agent` — toolsAgent
- **Modelo:** GPT-4o-mini (temperature 0.1, maxTokens 1024)
- **Función:** Interpreta la instrucción de texto y determina qué campos del `travel_brief` cambian y qué `steps_to_run` se necesita.

**Tabla de mapeo de instrucciones:**

| Tipo de instrucción | Campos actualizados | steps_to_run |
|---|---|---|
| Vuelo (precio, clase, escalas) | `flight_preferences` | `flights` |
| Hotel (categoría, ubicación) | `accommodation_type` / `hotel_location_preference` | `hotels` |
| Actividades (intereses) | `activity_interests` | `activities` |
| Presupuesto | `budget_total_usd` | `all` |
| Fechas / Destino | `departure_date` / `return_date` / `destination_city` | `all` |
| Vuelo + Hotel simultáneo | múltiples campos | `all` |

#### `Parsear Refinamiento`
- **Tipo:** Code (JavaScript)
- **Función:** Limpia markdown fences del output del agente. Parsea JSON. Aplica fallback a `steps_to_run: 'all'` si el parse falla. Persiste el `session_state` actualizado.

### 4.4 Motor de Planificación (compartido por ambas rutas)

#### `Preparar Motor Planificador`
- **Tipo:** Code (JavaScript)
- **Función:** Unifica entrada de Ruta A y Ruta B. Construye array `segments[]` para viajes multi-ciudad. Extrae `steps_to_run`, `existing_plan` y `feedback_instruction`.

#### `Convertir Ciudades a IATA`
- **Tipo:** Code (JavaScript)
- **Función:** Mantiene **tres tablas** (~60 ciudades cada una):
  - **Tabla 1 — IATA:** `ciudad → código IATA`. Añade `origin_city_iata`, `destination_city_iata`
  - **Tabla 2 — GPS:** `ciudad → @lat,lng,15z`. Añade `destination_city_ll`. Requerido por `google_maps` para resultados en la ciudad correcta.
  - **Tabla 3 — Aeropuertos:** `IATA → nombre completo`. Añade `destination_airport_name`. Requerido por `google_maps_directions` como `start_addr`.
- **Fallback IATA:** si ciudad no está en la tabla → primeros 3 chars en mayúsculas
- **Fallback GPS:** si ciudad no está → `null`

**Ejemplo para destino París:**
```json
{
  "destination_city_iata": "CDG",
  "destination_city_ll": "@48.8566,2.3522,15z",
  "destination_airport_name": "Paris Charles de Gaulle Airport"
}
```

#### `Motor Planificador — Agent 2`
- **Tipo:** `@n8n/n8n-nodes-langchain.agent` — toolsAgent
- **Modelo:** GPT-4o (temperature 0.1, maxTokens 4096)
- **Herramientas (ai_tool):** 5 tools (ver sección 5)
- **System prompt:** ~17.000 caracteres — incluye prioridades, descripción de herramientas, secuencia de ejecución, construcción del itinerario, taxonomía de advertencias y contrato de output

**Lógica de steps_to_run:**

| Valor | Pasos ejecutados | Datos conservados |
|---|---|---|
| `all` | 1, 2, 3, 4a, 4b, 5 | — |
| `flights` | 1, 5 | Hotel, actividades, itinerario |
| `hotels` | 2, 5 | Vuelos, actividades, itinerario |
| `activities` | 3, 5 | Vuelos, hotel |
| `validation` | 5 | Todo el plan existente |

**Scoring de actividades:** por cada término de `activity_interests` que aparezca en `title` o `type` del resultado de Google Maps → +1 punto. Ordenar: puntuación DESC → rating DESC. Seleccionar top 5.

**Construcción del itinerario:** `daily_itinerary[]` cubre TODOS los días del viaje:
- **Día de llegada:** título `"Día de llegada a [destino]"`, summary con hora de llegada y sugerencias de tarde
- **Días con actividades:** título = nombre de la actividad, summary narrativo contextualizado
- **Días libres:** título `"Día libre para caminar y conocer [destino]"`
- **Día de regreso:** título `"Último día en [destino] — Regreso a [origen]"`

### 4.5 Procesamiento del Output

#### `Validar Output del Planificador`
- **Tipo:** Code (JavaScript)
- **Función:**
  - Limpia markdown fences si el LLM los añadió
  - Parsea JSON de forma segura (try/catch con error descriptivo)
  - **`generated_at` incondicional:** siempre sobrescribe con `new Date().toISOString()`
  - **Safety net `daily_itinerary[]`:** si el agente devuelve el campo vacío, lo construye desde `segments[].activities[]`
  - **Safety net transporte:** regex sobre `plan_notes[]` para extraer costes de transporte
  - Aplica regla de seguridad: `status: plan_ready` + warnings críticas → fuerza `needs_user_input`
  - Persiste el plan completo en static data

#### `Logger — Tokens y Métricas`
- **Tipo:** Code (JavaScript)
- **Función:** Añade campo `_debug` al JSON de respuesta con `token_usage`, `execution_time_ms` y `plan_metrics` (activities_found, itinerary_days, plan_notes, warnings, has_flights, has_hotel, tools_called).
- **Utilidad para el TFM:** métricas de consumo visibles directamente en Postman.

#### `Responder — Plan Listo`
- **Tipo:** respondToWebhook — HTTP 200 — Body: `JSON.stringify($json)`

---

## 5. Herramientas del Motor Planificador

### Tool: SerpApi Google Flights
| Campo | Valor |
|---|---|
| Motor | `google_flights` |
| type | `2` (SOLO IDA / one-way) — **desde v27** |
| departure_id / arrival_id | códigos IATA (origin/destination_city_iata) |
| outbound_date | fecha del trayecto (departure_date en la IDA, return_date en la VUELTA) |
| stops | `0` (vuelos directos primero) |
| json_restrictor | `best_flights[].{price,total_duration,flights[].{...},layovers[].{...}}` |

> **v27 — Vuelos ida/vuelta como dos búsquedas one-way.** Hasta v26 la herramienta
> hacía una única búsqueda round-trip (`outbound_date` + `return_date`). Google Flights
> devuelve en ese caso solo la **ida** más un `departure_token`, y la **vuelta** exige
> una **segunda** llamada con ese token — que el `json_restrictor` eliminaba. Resultado:
> la vuelta se perdía de forma intermitente (`no_valid_flight`). Desde v27 la herramienta
> es one-way (`type=2`, sin `return_date`) y el agente la llama **dos veces** (IDA
> origen→destino, VUELTA destino→origen invirtiendo IATAs), lo que hace la búsqueda del
> regreso fiable y determinista.

El restrictor elimina `other_flights[]` y metadata. Reducción ~95% de tokens.

### Tool: SerpApi Google Hotels
| Campo | Valor |
|---|---|
| Motor | `google_hotels` |
| q | `hotels in [destination] [location_preference] [accommodation_type]` |
| check_in / check_out | fechas REALES del vuelo confirmado |
| rating | `8` · sort_by | `3` (mayor valoración primero) |
| json_restrictor | `properties[].{name,hotel_class,overall_rating,...,gps_coordinates}` |

`gps_coordinates.{latitude,longitude}` → `plan.segments[].hotel.{lat,lng}` en el output (mapa del
hotel en el frontend). El agente NUNCA debe copiar estas coordenadas al campo `address`.

### Tool: Google Maps (Actividades)
| Campo | Valor |
|---|---|
| Motor | `google_maps` · type | `search` |
| query | `[activity_interests[0]] in [destination]` |
| ll | `destination_city_ll` (@lat,lng,15z) — **crítico** |
| json_restrictor | `local_results[].{title,type,rating,reviews,address,hours,price,links.website,gps_coordinates}` |

Sin `ll`, SerpAPI usa geolocalización del servidor (EEUU) y devuelve resultados incorrectos.

`gps_coordinates.{latitude,longitude}` → `activities[].{lat,lng}` y se repite en
`daily_itinerary[].activities[].{lat,lng}` (mapa por actividad en el frontend, componente
`MapViewer`). Actividades de fallback vía Tavily no traen coordenadas → `lat`/`lng`: `null`.

### Tool: Google Maps Directions
| Campo | Valor |
|---|---|
| Motor | `google_maps_directions` |
| start_addr | `destination_airport_name` |
| end_addr | `plan.segments[0].hotel.address` |

No bloqueante: si falla, el plan continúa.

### Tool: Tavily
| Campo | Valor |
|---|---|
| maxResults | `3` · searchDepth | `basic` · includeAnswer | `true` |

Doble uso: inteligencia de destino (visado, clima, transporte) + fallback de actividades.

---

## 6. Session State — Estructura

Persiste en `$getWorkflowStaticData('global')` indexado por `session_id`. **Volátil** — se pierde si n8n se reinicia. Ver ejemplo completo en `n8n/examples/`.

---

## 7. Output JSON — Estructura

Ver `n8n/examples/output-plan.json` para un ejemplo completo y real.
Campos clave: `session_id`, `status`, `plan.segments[]`, `plan.cost_summary`,
`plan.daily_itinerary[]`, `plan.plan_notes[]`, `warnings[]`, `_debug`.

---

## 8. Taxonomía de Advertencias

| Tipo | requires_user_approval | Condición |
|---|---|---|
| `no_valid_flight` | true | Sin vuelo tras reintento |
| `no_valid_hotel` | true | Sin hotel tras reintento |
| `budget_exceeded` | true | total_cost > budget_total_usd |
| `layover_violation` | true | Escala < 45 min o > max_layover_hours |
| `date_unavailable` | true | Fecha sin disponibilidad |
| `date_mismatch` | true | Fechas hotel/actividad no alineadas con vuelo |
| `tool_timeout` | true | Tool falló tras reintento |
| `activity_swap` | false | Actividad sustituida |
| `budget_exceeded_activities` | false | Presupuesto < 50 USD/viajero/día |
| `budget_headroom` | false | total_cost ≤ 85% del presupuesto |
| `no_activities_found` | false | Google Maps sin resultados; fallback Tavily |

---

## 9. Credenciales Requeridas

| Credencial | Nodo(s) | Servicio |
|---|---|---|
| OpenAI API | OpenAI GPT-4o / GPT-4o-mini | Motor + Refinamiento |
| SerpAPI account | Tools Flights/Hotels/Maps/Directions | SerpAPI |
| Tavily account | Tool: Tavily | Tavily |

> **Seguridad:** las credenciales se configuran en la UI de n8n (Settings → Credentials).
> El JSON del workflow solo contiene los **IDs internos** de credencial, nunca las claves.
> Las claves reales van en `.env` (nunca versionado).

---

## 10. Setup — Paso a Paso

### 10.1 Arrancar n8n con Docker
```powershell
cp .env.example .env   # Rellena claves y N8N_ENCRYPTION_KEY
docker compose up -d
# n8n disponible en http://localhost:5678
```

### 10.2 Importar el workflow
1. n8n → **Workflows → Import from File**
2. Selecciona `n8n/workflows/Planificador_de_Viajes_v24.json`

### 10.3 Configurar credenciales
Abrir cada nodo con credencial y seleccionarla del dropdown (OpenAI, SerpAPI, Tavily).

### 10.4 Verificar System Messages de los agentes
- **Motor Planificador — Agent 2:** debe empezar con "Eres un constructor y validador de planes de viaje..."
- **Agente de Refinamiento:** debe empezar con "Eres un intérprete de instrucciones de refinamiento..."

> **NOTA:** Este JSON versionado contiene los system prompts COMPLETOS e íntegros
> (Motor Planificador ~17.000 caracteres; Agente de Refinamiento ~3.500). Tras
> importar en n8n, verifica que ambos system messages se cargaron correctamente
> (n8n a veces deja el campo vacío tras un import). Si quedaran vacíos, esta misma
> documentación (secciones 4.4, 5, 7 y 8) reproduce toda la lógica del prompt.

### 10.5 Activar
Toggle **Publish**. Activa ambos webhooks simultáneamente.

---

## 11. Testing con Postman

### Ruta A — Plan inicial
```
POST https://[tu-ngrok].ngrok-free.app/webhook/travel-planner
Content-Type: application/json
Body: ver n8n/examples/input-formulario.json
```

### Ruta B — Refinamiento
```
POST https://[tu-ngrok].ngrok-free.app/webhook/travel-refine
Body: { "session_id": "session_...", "feedback_text": "Prefiero un hotel mas economico" }
```

---

## 12. Ciudades en la tabla IATA/GPS

~110 ciudades soportadas tras la ampliación de v27. El frontend envía nombres en
**español**, así que la tabla incluye alias en español (p. ej. `londres`→LHR,
`múnich`→MUC). Cobertura: capitales y grandes ciudades de Europa, América, Asia,
Oriente Medio, Oceanía y África, más las ciudades españolas secundarias
(Valencia/Sevilla/Málaga/Bilbao/Palma/Alicante).

> Sin la entrada correspondiente, el nodo hace fallback a las 3 primeras letras del
> nombre (p. ej. "Valencia"→`VAL` en vez de `VLC`), lo que genera IATA inválidas y hace
> fallar la búsqueda de vuelos. Por eso la tabla debe cubrir los destinos reales que
> ofrece el frontend, con su alias en español.

Para añadir una ciudad: editar el nodo `Convertir Ciudades a IATA` (tres tablas:
`cityToIata`, `cityToGps`, `iataToAirportName`) e incluir el/los alias en español.

---

## 13. Consumo de API — Estimación

### SerpAPI (plan gratuito: 250 búsquedas/mes)
- Ejecución completa: 4-6 llamadas
- Refinamiento parcial: 1-3 llamadas
- Capacidad: ~40-60 ejecuciones completas/mes

### OpenAI (GPT-4o)
- ~8.000-10.000 tokens por ejecución (gracias al json_restrictor en las tools SerpAPI)

---

## 14. Limitaciones Conocidas en v24

| Limitación | Descripción | Próximo fix |
|---|---|---|
| `token_usage: null` | n8n no expone tokenUsage en el output JSON | Ver en Executions |
| `stars: 0` en hoteles boutique | Sin clasificación formal en Google Hotels | Mostrar `null` |
| `booking_url: ""` en vuelos | SerpAPI devuelve booking_token, no URL | Construir URL con el token |
| Actividades mismo tipo | Query usa solo `interests[0]` | Rotar intereses |
| Static data volátil | Session_state se pierde al reiniciar n8n | Migrar a Postgres Memory |
| Tabla IATA/GPS limitada (~60) | Ciudades secundarias usan fallback | Ampliar tabla |

---

## 15. Historial de Versiones (resumen)

| Versión | Cambio principal |
|---|---|
| v18 | Fix IATA, instrucciones de filtrado, `stops=0`, `sort_by=3` |
| v19 | json_restrictor en todas las tools SerpAPI (reducción 88-95% tokens) |
| v22 | Google Maps reemplaza Travel Explore para actividades reales |
| v23 | `daily_itinerary[]` mandatorio, query Google Maps simplificada, scoring |
| v24 | GPS coordinates, Google Maps Directions, Logger de métricas, tabla de aeropuertos |
| v26 | Ampliación de ciudades ES en la tabla IATA (Valencia/Sevilla/Málaga/Bilbao/Palma/Alicante) |
| **v27** | **Vuelos ida/vuelta como DOS búsquedas one-way (`type=2`) → arregla la vuelta que fallaba de forma intermitente (`no_valid_flight`) por el `departure_token` que el restrictor eliminaba** |
| v28 | Ajustes menores del planificador (sin cambio de contrato) |
| **v29** | **Persistencia del plan en Supabase (tabla `travel_plans`): nodos `Preparar Payload Supabase` → `¿Guardar en Supabase?` → `Extraer Record` → `Supabase — Guardar Plan`, en paralelo al responder (no bloquea la respuesta). Credencial `supabaseApi` vía `{{ $env.SUPABASE_HOST }}` / `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`. La respuesta del webhook incluye campos internos `_supabase_record`/`_skip_supabase`/`_debug`. Nota: el nodo Supabase usa `onError: continueRegularOutput`, así que si faltan las vars el guardado falla en silencio pero el plan se sigue devolviendo** |

---

## 16. Learnings Clave del Proyecto

1. **json_restrictor** filtra la respuesta de SerpAPI antes de llegar al agente → reducción 88-95% de tokens.
2. **GPS coordinates obligatorias** para `google_maps`: sin `ll`, resultados en EEUU.
3. **Query específica de categoría** (`food in Paris`) > query genérica (`things to do in Paris`).
4. **toolsAgent**, no `conversationalAgent` (deprecated en n8n 2.23).
5. **$fromAI() descriptions** actúan como instrucciones al LLM: evitar ejemplos hardcodeados de ciudades.
6. **Locale europeo**: n8n puede mostrar `0,1` con coma en temperaturas; verificar punto decimal.
