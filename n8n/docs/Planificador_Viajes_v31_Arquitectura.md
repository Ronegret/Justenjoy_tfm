# Planificador de Viajes — v31
## Documentación de Arquitectura

> **Versión:** v31
> **Plataforma:** n8n 2.23.2 (Self Hosted)
> **Estado:** Estable — versión activa del proyecto (TFM)
> **Workflow:** 1 main workflow (28 nodos)
> **Modelo Motor Planificador:** GPT-4.1 (maxTokens 4096, temperature 0.1, retry on fail 65s)
> **Modelo Agente Refinamiento:** GPT-4o-mini (maxTokens 1024, temperature 0.1)
> **Persistencia:** Supabase (tabla `travel_plans`)

## Actualizaciones sobre este documento (reconciliación con feature/mapas-e-imagenes-destino)

Esta rama portó las siguientes mejoras al v31 original de `master`, manteniendo intacto
el motor de geocoding por día (Nominatim) descrito abajo:

- **Reserva real de vuelos**: nuevo nodo `Tool: SerpApi Google Flights - Reserva` (28º nodo).
  Usa el `booking_token` de cada vuelo elegido para pedir `booking_options[]` a SerpAPI y
  obtener la URL real de reserva (`booking_options[].together.booking_request.url`), en vez
  de solo el enlace de búsqueda `travel/flights?q=...`. Si falla, cae al enlace de búsqueda
  (el safety net de `Validar Output` ahora es condicional, no sobreescribe una URL real).
- **Coordenadas de hotel**: `hotel.lat`/`hotel.lng` en el contrato, poblados desde
  `gps_coordinates` de Google Hotels (el restrictor ya lo traía, solo faltaba pedirlo).
- **Itinerario completo por día**: la sección "ITINERARIO DÍA A DÍA" ahora exige
  mañana/mediodía/tarde/noche en cada día intermedio (actividad real cuando existe,
  sugerencia libre sin inventar negocios cuando no) en vez de una sola actividad suelta.
  `points_of_interest` se mantiene intacto para el nodo de geocoding.
- **Presupuesto verificado en código**: `Validar Output del Planificador` recalcula el
  coste total de forma determinista y fuerza `needs_user_input` + `budget_exceeded` si el
  LLM no se autovalidó bien la aritmética.

---

## 1. Descripción General

El Planificador de Viajes v31 es un agente de IA automatizado en n8n que genera planes de viaje completos a partir de un formulario web estructurado. Dada la entrada del usuario (origen, destino, fechas, presupuesto, preferencias), el sistema:

1. Busca vuelo de ida y vuelo de vuelta mediante dos búsquedas one-way independientes (SerpAPI Google Flights)
2. Busca el hotel con mejor valoración en las fechas reales del vuelo confirmado (SerpAPI Google Hotels)
3. Busca actividades reales en el destino según los intereses del usuario (SerpAPI Google Maps), incluyendo coordenadas GPS
4. Obtiene inteligencia de destino — visado, clima, transporte — y actúa como fallback de actividades si es necesario (Tavily)
5. Genera un itinerario día a día narrativo en español
6. Enriquece cada día del itinerario con una coordenada geográfica (GPS de actividad, geocoding, o centro de ciudad) para un mapa en el frontend
7. Valida presupuesto, fechas y coherencia del plan
8. Persiste el plan completo en Supabase, sentando base para una futura búsqueda tipo RAG
9. Devuelve un JSON estructurado completo con métricas de ejecución

El sistema permite además **refinamiento iterativo**: el usuario puede enviar una instrucción de texto libre y el sistema re-ejecuta solo los pasos afectados, conservando el resto del plan.

---

## 2. Novedades de v31 respecto a versiones anteriores

| Característica | Estado |
|---|---|
| Vuelos: dos búsquedas one-way (ida + vuelta) | Heredado, estable |
| System prompt comprimido (~57% más corto) | Heredado |
| Persistencia en Supabase (`travel_plans`) | Heredado |
| **Coordenadas GPS en actividades** | **Nuevo en v31** |
| **`points_of_interest` por día del itinerario** | **Nuevo en v31** |
| **Nodo de geocoding (OpenStreetMap / Nominatim)** | **Nuevo en v31** |
| **Una coordenada garantizada por cada día del itinerario** | **Nuevo en v31** |

**Objetivo de v31:** habilitar un mapa interactivo en el frontend mostrando un punto geográfico por cada día del viaje, sin añadir tool calls al agente (y por tanto sin impactar el consumo de tokens del LLM).

---

## 3. Arquitectura del Workflow

### Vista general del flujo

```
RUTA A — Formulario inicial
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Webhook Formulario → Validar Formulario → ¿Error Formulario?
  ├── true  → Responder Error Formulario (HTTP 400)
  └── false → Preparar Motor Planificador
                    ↓
              Convertir Ciudades a IATA
                    ↓
              Motor Planificador — Agent 2 (GPT-4.1)
              Tools: Flights (×2) → Hotels → Google Maps → Tavily
                    ↓
              Validar Output del Planificador
                    ↓
              Enriquecer Coordenadas (OpenStreetMap)   ← NUEVO EN v31
                    ↓
              Logger — Tokens y Métricas
                    ↓
              Preparar Payload Supabase
                ├──→ Responder — Plan Listo (HTTP 200, SIEMPRE responde)
                └──→ ¿Guardar en Supabase?
                        └── true → Extraer Record → Supabase — Guardar Plan

RUTA B — Refinamiento del plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Webhook Refinamiento → Cargar Sesión → ¿Error Refinamiento?
  ├── true  → Responder Error Refinamiento (HTTP 400)
  └── false → Agente de Refinamiento (GPT-4o-mini)
                    ↓
              Parsear Refinamiento
                    ↓
              Preparar Motor Planificador → [mismo flujo de Ruta A]
```

### Secuencia de tool calls del Motor Planificador

```
Tool Call 1: SerpApi Google Flights — IDA (one-way)
Tool Call 2: SerpApi Google Flights — VUELTA (one-way)
Tool Call 3: SerpApi Google Hotels (fechas reales del vuelo)
Tool Call 4: Google Maps — Actividades (query + GPS + gps_coordinates)
Tool Call 5: Tavily — inteligencia destino (+ fallback actividades si Maps<3)
```

Máximo 5 tool calls por ejecución completa. El geocoding de coordenadas por día ocurre **después**, en un nodo Code aislado — no consume tokens del LLM.

---

## 4. Inventario de Nodos — v31 (27 nodos)

### Flujo principal (Ruta A)

| Nodo | Tipo | Función |
|---|---|---|
| Webhook — Formulario | webhook | Entrada POST `/webhook/travel-planner` |
| Validar Formulario | code | Normaliza input, genera `session_id`, valida campos |
| ¿Error Formulario? | if | Enruta errores de validación |
| Responder — Error Formulario | respondToWebhook | HTTP 400 |
| Preparar Motor Planificador | code | Construye segmentos, extrae `steps_to_run` |
| Convertir Ciudades a IATA | code | ciudad→IATA, ciudad→GPS, IATA→aeropuerto (~110 ciudades) |
| Motor Planificador — Agent 2 | agent | Agente principal GPT-4.1 |
| Validar Output del Planificador | code | Safety nets, `generated_at`, persistencia en memoria |
| **Enriquecer Coordenadas (OpenStreetMap)** | **code** | **Asigna lat/lng a cada día del itinerario** |
| Logger — Tokens y Métricas | code | Campo `_debug` con métricas de ejecución |
| Preparar Payload Supabase | code | Extrae metadatos y construye el registro para la tabla |
| ¿Guardar en Supabase? | if | Solo si `status = plan_ready` |
| Extraer Record | code | Aísla los campos que van a la tabla `travel_plans` |
| Supabase — Guardar Plan | supabase | Inserta el registro (operación Create) |
| Responder — Plan Listo | respondToWebhook | HTTP 200 con JSON completo — rama SIEMPRE ejecutada |

### Ruta de refinamiento (Ruta B)

| Nodo | Tipo | Función |
|---|---|---|
| Webhook — Refinamiento | webhook | Entrada POST `/webhook/travel-refine` |
| Cargar Sesión | code | Recupera `session_state` desde memoria por `session_id` |
| ¿Error Refinamiento? | if | Enruta errores de sesión no encontrada |
| Responder — Error Refinamiento | respondToWebhook | HTTP 400 |
| Agente de Refinamiento | agent | GPT-4o-mini — interpreta la instrucción del usuario |
| OpenAI GPT-4o-mini (Refinamiento) | lmChatOpenAi | Modelo del agente de refinamiento |
| Parsear Refinamiento | code | Parsea JSON, preserva el plan existente |

### Nodos de modelo y tools del Motor

| Nodo | Tipo n8n | Configuración |
|---|---|---|
| OpenAI GPT-4.1 (Planificador) | lmChatOpenAi | maxTokens 4096, temp 0.1, timeout 120000ms, maxRetries 0, retryOnFail (65000ms) |
| Tool: SerpApi Google Flights | serpApiTool | `google_flights`, type=2 one-way |
| Tool: SerpApi Google Hotels | serpApiTool | `google_hotels` |
| Tool: Google Maps (Actividades) | serpApiTool | `google_maps`, con `gps_coordinates` |
| Tool: Tavily | tavilyTool | Tavily Search API |

---

## 5. El Motor Planificador — Diseño

### Modelo y límites

| Parámetro | Valor |
|---|---|
| Modelo | gpt-4.1 |
| maxTokens | 4096 |
| Temperature | 0.1 |
| Timeout (cliente OpenAI) | 120000 ms |
| maxRetries (cliente OpenAI) | 0 — deshabilitado para evitar llamadas en cascada |
| Retry on Fail (n8n) | Activado — maxTries 2, wait 65000 ms |
| Límite TPM OpenAI | 30,000 |
| System prompt | 9,268 caracteres (~2,300 tokens) |

**Por qué timeout 120s y maxRetries 0:** el cliente OpenAI, si tarda más de X segundos, reintenta automáticamente. Con 5 tool calls una ejecución puede tardar 40-60s; un timeout corto (60s) cortaba la ejecución a mitad y el reintento automático del cliente (maxRetries>0) repetía tool calls ya completadas, disparando el consumo de tokens en cascada. Con timeout 120s y maxRetries 0, solo el retry de n8n (más controlado, con espera de 65s) actúa si algo falla.

### Los 6 pasos de ejecución

| Paso | Nombre | Bloqueante |
|---|---|---|
| 1 | Vuelos (2 llamadas one-way) | Sí |
| 2 | Hotel | Sí |
| 3 | Actividades (+ coordenadas GPS) | No |
| 4 | Inteligencia de destino (Tavily) | No |
| 5 | Validación | — |
| 6 | Trip Summary + Itinerario | — |

Condicionados por `steps_to_run`: `all` (todos), `flights`, `hotels`, `activities`, `validation` (para refinamientos parciales).

---

## 6. Herramientas del Motor Planificador

### Tool: SerpApi Google Flights (dos llamadas one-way)

| Campo | Valor |
|---|---|
| Motor | `google_flights` |
| type | 2 (one-way) |
| stops | 0 |
| json_restrictor | `best_flights[].{price,total_duration,flights[].{airline,flight_number,departure_airport.{id,name,time},arrival_airport.{id,name,time},duration},layovers[].{name,id,duration}}` |

El agente hace **dos llamadas independientes**: IDA (origen→destino, fecha de salida) y VUELTA (destino→origen, fecha de regreso). Esto resuelve el problema del `departure_token` que afecta al modo round-trip (type=1), donde SerpAPI exige una segunda llamada con un token que el `json_restrictor` eliminaba.

### Tool: SerpApi Google Hotels

| Campo | Valor |
|---|---|
| Motor | `google_hotels` |
| sort_by | 3 (mayor valoración) |
| rating | 8 (mínimo ~4★) |
| json_restrictor | `properties[].{name,hotel_class,overall_rating,reviews,rate_per_night.{lowest,extracted_lowest},total_rate.{lowest,extracted_lowest},link,gps_coordinates}` |

Fechas siempre desde el vuelo confirmado, no del formulario original.

### Tool: Google Maps — Actividades (con coordenadas GPS)

| Campo | Valor |
|---|---|
| Motor | `google_maps` |
| query | `[activity_interests[0]] in [destination_city[0]]` |
| ll | `destination_city_ll` (`@lat,lng,15z`) — crítico para resultados en la ciudad correcta |
| json_restrictor | `local_results[].{title,type,rating,reviews,address,hours,price,links.website,gps_coordinates}` |

**Novedad v31:** el `json_restrictor` incluye `gps_coordinates`, que el agente mapea a `lat`/`lng` en cada actividad del plan. Este dato ya existía en la respuesta de SerpAPI — antes se descartaba.

### Tool: Tavily

| Campo | Valor |
|---|---|
| maxResults | 3 |
| searchDepth | basic |
| includeAnswer | true |

Doble propósito: inteligencia de destino (visa, clima, transporte → `plan_notes[]`) y fallback de actividades si Google Maps devolvió menos de 3 resultados.

---

## 7. Coordenadas por día — Diseño detallado (novedad v31)

### Parte 1 — Coordenadas de actividades concretas

El `json_restrictor` de Google Maps ahora incluye `gps_coordinates`. El agente mapea:
```
gps_coordinates.latitude → activity.lat
gps_coordinates.longitude → activity.lng
```
Sin coste adicional de tool calls — el dato ya llegaba en la respuesta de SerpAPI.

### Parte 2 — `points_of_interest` por día

Cada entrada de `daily_itinerary[]` incluye un campo nuevo:
```json
"points_of_interest": ["nombre de un lugar real y geolocalizable"]
```
El agente recibe la instrucción de mencionar, para cada día, un lugar real (museo, plaza, barrio, monumento, o la actividad principal) que pueda buscarse en un mapa. Para los días de llegada/regreso, se usa el aeropuerto o la zona del hotel.

### Parte 3 — Nodo `Enriquecer Coordenadas (OpenStreetMap)`

Insertado entre `Validar Output del Planificador` y `Logger — Tokens y Métricas`. Es un nodo Code (JavaScript puro) que **no involucra al LLM** — usa `this.helpers.httpRequest` para llamar a la API pública de **Nominatim** (el servicio de geocoding oficial de OpenStreetMap), sin necesidad de API key.

**Lógica de prioridad, por cada día del itinerario:**

```
1. ¿Hay una actividad concreta ese día con gps_coordinates?
   → usar esas coordenadas.                         source: "activity"

2. ¿Hay un points_of_interest para ese día?
   → geocodificar el nombre vía Nominatim
     (query: "[nombre], [ciudad destino]")           source: "geocoded"

3. Si ninguna de las anteriores funciona
   → usar el centro de la ciudad (destination_city_ll,
     ya calculado en Convertir Ciudades a IATA)       source: "city_center"
```

Cada día queda enriquecido con `lat`, `lng`, y `coordinate_source` (para que el frontend sepa el origen del dato).

**Detalles técnicos:**
- User-Agent identificable requerido por la política de uso de Nominatim: `TFM-TravelPlanner/1.0`
- Rate limit de Nominatim: 1 petición/segundo — el nodo respeta una pausa de 1100ms entre geocodificaciones
- `onError: continueRegularOutput` — si el geocoding falla para un día, no bloquea el resto del workflow
- Como el nodo corre **antes** de Supabase, las coordenadas quedan también persistidas en la base de datos — útil para búsqueda geográfica en la Fase 2 (RAG)

**Resultado verificado en ejecución real** (Amsterdam → Paris, 15-30 sept): 16 días, 5 con coordenadas de actividad, 9 geocodificados (Le Marais, Barrio Latino, Île de la Cité, Montmartre, Museo del Louvre, Canal Saint-Martin, Torre Eiffel, Saint-Germain-des-Prés, Río Sena), 2 sin coordenada (llegada/regreso, `lat: null`). Cero fallbacks a `city_center` — Nominatim encontró todos los POIs generados por el agente.

---

## 8. Nodo Validar Output del Planificador

Safety nets aplicados en orden:

1. **`generated_at` incondicional** — siempre `new Date().toISOString()`
2. **`stars: null`** — si `hotel.stars` es 0/ausente/vacío → fuerza `null` (nunca `0`)
3. **`booking_url` de vuelos — reconstruido SIEMPRE**:
   ```javascript
   booking_url = `https://www.google.com/travel/flights?q=Flights%20to%20${destino}%20from%20${origen}%20on%20${fecha}`
   ```
   Formato verificado que carga correctamente Google Flights con la ruta y fecha precargadas. Se sobreescribe incondicionalmente porque el agente puede generar formatos antiguos (`#flt=...`) que Google ya no interpreta.
4. **`plan_notes[]`** — mínimo 1 nota genérica si el agente la omite
5. **`trip_summary`** — versión mínima si se omite
6. **`daily_itinerary[]`** — reconstruido desde `activities[]` si viene vacío
7. **Status seguro** — fuerza `needs_user_input` si hay warnings críticos con `plan_ready`
8. **Persistencia** — guarda el plan en memoria (`$getWorkflowStaticData('global')`) indexado por `session_id`, para el refinamiento posterior

---

## 9. Persistencia en Supabase

### Tabla `travel_plans`

```sql
CREATE TABLE travel_plans (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  origin          TEXT NOT NULL,
  departure_date  DATE NOT NULL,
  return_date     DATE NOT NULL,
  budget_usd      NUMERIC,
  total_cost_usd  NUMERIC,
  travelers_count INTEGER,
  activity_interests TEXT[],
  plan            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

RLS desactivado para esta tabla (proyecto académico, sin usuarios externos con acceso directo a la API de Supabase).

### Flujo de escritura (no bloqueante)

```
Logger → Preparar Payload Supabase
              ├──→ Responder — Plan Listo   (rama principal, SIEMPRE responde al usuario)
              └──→ ¿Guardar en Supabase?    (rama paralela)
                        └── true → Extraer Record → Supabase — Guardar Plan
```

El usuario recibe su respuesta independientemente de lo que ocurra con Supabase. El nodo de Supabase tiene `onError: continueRegularOutput`.

**Operación:** `Create` (no upsert — la versión del nodo Supabase nativo disponible no lo soporta). Cada `plan_ready` genera un nuevo registro; los refinamientos generan un registro adicional con el mismo `session_id` pero distinto `id`, preservando el historial de evolución del plan.

**El `plan` guardado en JSONB incluye las coordenadas por día** (`lat`, `lng`, `coordinate_source`) generadas por el nodo de geocoding — quedan disponibles para la Fase 2 del proyecto (búsqueda tipo RAG sobre planes ya generados).

---

## 10. Agente de Refinamiento

**Modelo:** GPT-4o-mini (200,000 TPM — pool independiente del Motor Planificador)

| Instrucción del usuario | Campos actualizados | `steps_to_run` |
|---|---|---|
| Vuelo (precio, clase, aerolínea) | `flight_preferences` | `flights` |
| Hotel (categoría, ubicación) | `accommodation_type`, `hotel_location_preference` | `hotels` |
| Actividades (intereses) | `activity_interests` | `activities` |
| Presupuesto | `budget_total_usd` | `all` |
| Fechas o destino | `departure_date`, `return_date`, `destination_city` | `all` |

**Fix crítico:** `refinedState.plan = currentSession.plan || null` — preserva el plan existente en refinamientos parciales, evitando que se pierdan vuelos/hotel/actividades ya confirmados.

---

## 11. Output JSON — Estructura (fragmento relevante a v31)

```json
{
  "session_id": "session_...",
  "status": "plan_ready",
  "plan": {
    "segments": [{
      "flights": {
        "outbound": {"...": "...", "booking_url": "https://www.google.com/travel/flights?q=Flights%20to%20CDG%20from%20AMS%20on%202026-09-15"},
        "return":   {"...": "...", "booking_url": "https://www.google.com/travel/flights?q=Flights%20to%20AMS%20from%20CDG%20on%202026-09-30"}
      },
      "hotel": {"...": "..."},
      "activities": [
        {"name": "Loulou", "date": "2026-09-16", "lat": 48.8512011, "lng": 2.3448571, "...": "..."}
      ]
    }],
    "daily_itinerary": [
      {
        "day": 2, "date": "2026-09-16",
        "title": "Descubre la cocina australiana en Loulou",
        "summary": "...",
        "points_of_interest": ["Loulou"],
        "activities": [{"...": "..."}],
        "lat": 48.8512011,
        "lng": 2.3448571,
        "coordinate_source": "activity"
      },
      {
        "day": 3, "date": "2026-09-17",
        "title": "Día libre para caminar y conocer Paris",
        "summary": "...",
        "points_of_interest": ["Le Marais"],
        "activities": [],
        "lat": 48.8603823,
        "lng": 2.360742,
        "coordinate_source": "geocoded"
      }
    ]
  }
}
```

---

## 12. Taxonomía de Advertencias

| Tipo | requires_user_approval | Descripción |
|---|---|---|
| `no_valid_flight` | true | Sin vuelo disponible en un trayecto. Guía al usuario a refinar con nuevas fechas. |
| `no_valid_hotel` | true | Sin hotel disponible |
| `budget_exceeded` | true | Coste total supera presupuesto |
| `layover_violation` | true | Escala fuera de límites |
| `date_unavailable` / `date_mismatch` | true | Problemas de coherencia de fechas |
| `tool_timeout` | true | Herramienta falló |
| `date_adjusted` | false | Vuelo en fecha alternativa (±1 día). Plan avanza con `plan_ready`. |
| `budget_headroom` | false | Coste ≤ 85% del presupuesto |
| `no_activities_found` | false | Sin actividades encontradas ni por Maps ni por Tavily |

---

## 13. Credenciales Requeridas

| Nodo | Credencial |
|---|---|
| OpenAI GPT-4.1 (Planificador) | OpenAI API |
| OpenAI GPT-4o-mini (Refinamiento) | OpenAI API |
| Tool: SerpApi Google Flights / Hotels / Maps | SerpAPI account |
| Tool: Tavily | Tavily account |
| Supabase — Guardar Plan | Supabase account (URL + service_role key) |
| **Enriquecer Coordenadas (OpenStreetMap)** | **Ninguna — Nominatim es público y gratuito** |

---

## 14. Setup — Paso a Paso

### 14.1 Importar y configurar
1. **Workflows → Import from File** → `Planificador_de_Viajes_v31.json`
2. Asignar credenciales de OpenAI, SerpAPI, Tavily y Supabase en los nodos correspondientes
3. Verificar en `Tool: Google Maps (Actividades)` que los campos `query` y `ll` tengan el ícono ✨ activo (modo `$fromAI`)
4. Verificar que la tabla `travel_plans` existe en Supabase con RLS desactivado

### 14.2 Publicar
Toggle **Publish** (punto verde). Ambos webhooks quedan activos.

### 14.3 Verificar acceso saliente a Nominatim
El nodo de geocoding requiere que la instancia de n8n tenga acceso de red saliente a `nominatim.openstreetmap.org` — el mismo tipo de acceso que ya usan SerpAPI y Tavily.

---

## 15. Testing con Postman

### Plan inicial

```
POST https://[ngrok-url]/webhook/travel-planner
```

```json
{
  "origin_city": "Amsterdam",
  "destination_city": ["Paris"],
  "departure_date": "2026-09-15",
  "return_date": "2026-09-30",
  "travelers": {"adults": 2, "children": []},
  "budget_total_usd": 3600,
  "accommodation_type": "mid-range",
  "flight_preferences": {"cabin_class": "economy", "max_layover_hours": 4, "preferred_airlines": []},
  "activity_interests": ["food", "culture", "museums"],
  "special_requirements": "ninguno",
  "flexible_dates": true,
  "hotel_location_preference": "city center",
  "car_rental_needed": false
}
```

**Verificación de calidad recomendada tras cada ejecución:**
- Cada día de `daily_itinerary[]` tiene `lat`, `lng` y `coordinate_source`
- Predominan `source: activity` y `source: geocoded` sobre `city_center` (indica que el agente genera POIs suficientemente específicos)
- Los `booking_url` de vuelos abren Google Flights con la ruta precargada

---

## 16. Limitaciones Conocidas

| Limitación | Descripción |
|---|---|
| `booking_url` de vuelos son búsquedas, no reservas exactas | Formato `travel/flights?q=...` abre la ruta correcta; para reserva exacta se requeriría el `booking_token` de SerpAPI (implica una llamada adicional por vuelo) |
| `hotel.booking_url` a veces genérico o vacío | Depende del campo `link` que devuelva Google Hotels para ese alojamiento |
| `hotel.address` a veces vacío | Limitación de datos de origen (SerpAPI) |
| Latencia añadida por geocoding | ~1.1s por día que requiere geocodificación (límite de Nominatim); mitigado porque los días con actividad concreta no necesitan geocoding |
| Operación Supabase es `Create`, no `Upsert` | La versión del nodo nativo disponible no soporta upsert; cada refinamiento genera un registro nuevo en vez de sobreescribir |
| Actividades del mismo tipo | La query usa solo `activity_interests[0]`, por lo que las 5 actividades tienden a ser del mismo rubro (ej. todas restaurantes si el primer interés es "food") |

---

## 17. Historial de Versiones (resumen)

| Versión | Cambio principal |
|---|---|
| v19 | `json_restrictor` en todas las tools SerpAPI |
| v22-v23 | Google Maps para actividades reales, `daily_itinerary` mandatorio |
| v26 | Base estable, integra fixes de versiones anteriores |
| v27 (equipo) | Fix de raíz: dos búsquedas one-way para vuelos; tabla IATA ampliada a ~110 ciudades |
| v27.4 | System prompt comprimido 57%; fixes de timeout/maxRetries del nodo LLM |
| v27.2 / v29 | Integración de Supabase (persistencia) |
| **v31** | **Coordenadas GPS por día del itinerario vía OpenStreetMap/Nominatim, para mapa en frontend** |

---

## 18. Learnings Clave

1. **Nominatim (OpenStreetMap) es gratuito y sin API key** — ideal para geocoding puntual fuera del contexto de un agente LLM.
2. **El geocoding debe vivir fuera del agente** — hacerlo dentro del loop del LLM multiplicaría tool calls y reintroduciría problemas de límite de tokens.
3. **Los datos de coordenadas a veces ya existen en las respuestas de las tools** — antes de añadir nueva infraestructura, revisar si el `json_restrictor` está descartando información útil (caso de `gps_coordinates` en Google Maps).
4. **Las URLs de Google Flights cambian de formato sin aviso** — el patrón antiguo `#flt=...` dejó de funcionar; validar en navegador antes de dar por bueno un formato de URL construida.
5. **gpt-4.1 es compatible con la tool de Flights únicamente si el diseño usa dos llamadas one-way explícitas** — con round-trip (type=1) el modelo tiende a duplicar llamadas de forma incorrecta.
6. **Separar la escritura en Supabase del camino de respuesta al usuario** — el usuario nunca debe esperar (ni depender) de que la persistencia en base de datos tenga éxito.
