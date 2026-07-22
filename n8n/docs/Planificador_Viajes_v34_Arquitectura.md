# Planificador de Viajes — v34

> ⚠️ **DOCUMENTO HISTÓRICO — v34 está archivada.** La versión canónica es **v39**:
> ver [`Planificador_Viajes_v39_Arquitectura.md`](Planificador_Viajes_v39_Arquitectura.md).
> El JSON de v34 vive en `../workflows/archive/`. Se conserva solo como referencia.

## Documentación de Arquitectura

> **Versión:** v34
> **Plataforma:** n8n 2.23.2 (Self Hosted)
> **Estado:** Estable — versión activa del proyecto (TFM)
> **Workflow:** 1 main workflow (27 nodos)
> **Modelo Motor Planificador:** GPT-4.1 (maxTokens 4096, temperature 0.1, retry on fail 65s)
> **Modelo Agente Refinamiento:** GPT-4o-mini (maxTokens 1024, temperature 0.1)
> **Persistencia:** Supabase (tabla `travel_plans`)

## Actualizaciones sobre este documento (migración v31 → v34)

v34 fue diseñada y exportada por el equipo desde una instancia n8n separada (IDs de nodo
completamente distintos a v31), sobre el mismo código base que `develop`, con cambios
adicionales encima. Tras comparar ambos JSON nodo a nodo, solo cambian **2 nodos de
configuración** (el `systemMessage` del Agente 2 y los parámetros del tool Google Maps) y
**2 nodos de código** (`Validar Output del Planificador`, `Logger`); el resto —incluyendo
Flights/Hotels/Tavily, Supabase, los dos webhooks y las ramas de refinamiento— es idéntico.

- **`daily_itinerary[]` vuelve a redactarlo el LLM** (reversión de la versión determinista de
  v31/v32/v33). El agente ahora escribe título, resumen narrativo y `points_of_interest` de
  cada día directamente en el prompt (§7, §11); `06_validar_output.js` deja de construir el
  itinerario siempre y vuelve a ser un **safety net condicional**: solo genera una estructura
  mínima si el LLM devolvió `daily_itinerary` vacío. `plan.landmarks[]` desaparece del
  contrato — ya no hace falta, `points_of_interest` sale directo del LLM cada día.
- **Query de Google Maps genérica**: pasa de `'[activity_interests[0]] in [destino]'`
  (prefiltrada, sesga los 20 resultados a un solo rubro) a `'things to do in [destino]'`
  (fórmula fija, en inglés). Los intereses del usuario ya NO se usan para filtrar la
  búsqueda — se aplican DESPUÉS, como scoring (+1 punto por término de
  `activity_interests` que aparezca en `title`/`type`) sobre el pool completo de 20
  resultados. Esto da más variedad de categorías entre las que elegir.
- **Fórmula exacta de número de actividades** (antes "hasta N"): `dias_utiles = días totales
  - 2` (excluye llegada/regreso); `N = min(dias_utiles, 12, nº utilizables)`. El agente debe
  devolver exactamente N actividades, nunca menos por decisión propia, repartidas máx. 1 por
  día. La hora de cada actividad se deriva de su categoría (comida→13:00,
  bar/nightlife→20:00, resto→10:00) en vez de quedar a discreción del LLM.
- **`booking_url` de vuelos consolidado**: un único enlace round-trip con el formato
  `...on <fecha ida> through <fecha vuelta>` en vez de dos enlaces one-way separados. Mismo
  enlace para `outbound` y `return`. Verificado con una petición real (HTTP 200, `<title>`
  con la ruta y fechas correctas) antes de adoptarlo.
- **`Logger — Tokens y Métricas` → `Logger — Métricas`**: se elimina la captura de
  `tokenUsage`, que nunca funcionó (el item de salida del nodo Agent es `{output: "..."}`,
  sin `tokenUsage`/`usage`/`llmOutput`; ese dato vive en el sub-nodo del modelo, fuera del
  alcance de un Code node vía `$()`). El resto de `_debug.plan_metrics` se mantiene igual.
- Los fixes deterministas de `06_validar_output.js` que ya existían en `develop` antes de esta
  migración —código IATA `XXX` con sugerencia de ciudades reales por país, recálculo de
  coste por nº real de viajeros, eliminación de la extracción de transporte local por regex,
  `stars:null` si `hotel_class` no es válido— se conservan intactos: v34 los trae todos.

## Actualizaciones previas (heredadas de v31 — siguen vigentes)

- **`destination_city_ll` sin sufijo de zoom en ~25 ciudades**: corregido añadiendo `,15z`
  a las entradas afectadas de la tabla de coordenadas de `05_convertir_iata.js`.
- **Fallback de centro de ciudad en `10_enriquecer_coordenadas.js`**: corregido para leer
  `destination_city_ll` del nodo `Convertir Ciudades a IATA` (que sí lo calcula), no de
  `Preparar Motor Planificador` (que corre antes y nunca tuvo ese campo).
- **Reserva real de vuelos (probado y descartado)**: SerpAPI devuelve la MISMA url genérica
  `travel/clk/f` para todos los proveedores del `booking_token` — sin datos adicionales que
  la API no expone, esa url da 404. No reintentar ese flujo; el enlace de búsqueda
  `travel/flights?q=...` es el que funciona de forma fiable.
- **Mapa del frontend**: dibuja la ruta real a pie (Google Directions API, del lado del
  navegador) entre las paradas de un día cuando hay 2+ con coordenada propia y distinta, y
  añade el aeropuerto de llegada/salida como punto propio.

---

## 1. Descripción General

El Planificador de Viajes v34 es un agente de IA automatizado en n8n que genera planes de viaje completos a partir de un formulario web estructurado. Dada la entrada del usuario (origen, destino, fechas, presupuesto, preferencias), el sistema:

1. Busca vuelo de ida y vuelo de vuelta mediante dos búsquedas one-way independientes (SerpAPI Google Flights)
2. Busca el hotel con mejor valoración en las fechas reales del vuelo confirmado (SerpAPI Google Hotels)
3. Busca actividades reales en el destino con una query genérica (SerpAPI Google Maps), aplica el filtro de intereses del usuario como scoring posterior, e incluye coordenadas GPS
4. Obtiene inteligencia de destino — visado, clima, transporte — y actúa como fallback de actividades si es necesario (Tavily)
5. Genera un itinerario día a día narrativo en español, con un punto de interés real por día
6. Enriquece cada día del itinerario con una coordenada geográfica (GPS de actividad, geocoding, o centro de ciudad) para un mapa en el frontend
7. Valida presupuesto (recalculado de forma determinista por nº real de viajeros), fechas y coherencia del plan
8. Persiste el plan completo en Supabase, sentando base para una futura búsqueda tipo RAG
9. Devuelve un JSON estructurado completo con métricas de ejecución

El sistema permite además **refinamiento iterativo**: el usuario puede enviar una instrucción de texto libre y el sistema re-ejecuta solo los pasos afectados, conservando el resto del plan.

---

## 2. Novedades de v34 respecto a v31

| Característica | Estado |
|---|---|
| Vuelos: dos búsquedas one-way (ida + vuelta) | Heredado, estable |
| Coordenadas GPS en actividades + geocoding por día | Heredado de v31 |
| Persistencia en Supabase (`travel_plans`) | Heredado |
| Código IATA `XXX` + sugerencia de ciudades reales por país | Heredado (post-v31, `develop`) |
| Recalculo determinista de coste por nº de viajeros | Heredado (post-v31, `develop`) |
| **`daily_itinerary[]` redactado por el LLM** (ya no siempre por código) | **Cambiado en v34** |
| **Query de Maps genérica** (`'things to do in [destino]'`) | **Cambiado en v34** |
| **Nº exacto de actividades por fórmula** (`min(dias_utiles,12,utilizables)`) | **Nuevo en v34** |
| **`booking_url` de vuelos: un solo enlace round-trip con `through`** | **Nuevo en v34** |
| **Captura de `tokenUsage` eliminada** (nunca funcionó) | **Eliminado en v34** |

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
              Enriquecer Coordenadas (OpenStreetMap)
                    ↓
              Logger — Métricas
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
Tool Call 4: Google Maps — Actividades (query genérica + GPS + gps_coordinates)
Tool Call 5: Tavily — inteligencia destino (+ fallback actividades si Maps<3)
```

Máximo 5 tool calls por ejecución completa. El geocoding de coordenadas por día ocurre **después**, en un nodo Code aislado — no consume tokens del LLM.

---

## 4. Inventario de Nodos — v34 (27 nodos)

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
| Enriquecer Coordenadas (OpenStreetMap) | code | Asigna lat/lng a cada día del itinerario |
| Logger — Métricas | code | Campo `_debug` con métricas de ejecución |
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
| Tool: Google Maps (Actividades) | serpApiTool | `google_maps`, query genérica |
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
| System prompt | 11,124 caracteres (~2,780 tokens) |

**Por qué timeout 120s y maxRetries 0:** el cliente OpenAI, si tarda más de X segundos, reintenta automáticamente. Con 5 tool calls una ejecución puede tardar 40-60s; un timeout corto (60s) cortaba la ejecución a mitad y el reintento automático del cliente (maxRetries>0) repetía tool calls ya completadas, disparando el consumo de tokens en cascada. Con timeout 120s y maxRetries 0, solo el retry de n8n (más controlado, con espera de 65s) actúa si algo falla.

### Los 6 pasos de ejecución

| Paso | Nombre | Bloqueante |
|---|---|---|
| 1 | Vuelos (2 llamadas one-way) | Sí |
| 2 | Hotel | Sí |
| 3 | Actividades (scoring por intereses + coordenadas GPS) | No |
| 4 | Inteligencia de destino (Tavily) | No |
| 5 | Validación | — |
| 6 | Trip Summary + Itinerario día a día | — |

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

Fechas siempre desde el vuelo confirmado, no del formulario original. Solo esta tool recibe el número de pasajeros (`adults`) — Flights y Maps no, por eso `price_usd` de esas dos es siempre por persona (ver §8).

### Tool: Google Maps — Actividades (query genérica, novedad v34)

| Campo | Valor |
|---|---|
| Motor | `google_maps` |
| query | `'things to do in [destino]'` — fórmula fija, en inglés, **sin** `activity_interests` |
| ll | `destination_city_ll` (`@lat,lng,15z`) — crítico para resultados en la ciudad correcta |
| json_restrictor | `local_results[].{title,type,rating,price,links.website,gps_coordinates}` |

**Cambio clave respecto a v31:** antes la query incluía `[activity_interests[0]] in [destino]`, lo que prefiltraba los 20 resultados a un solo rubro (p. ej. todo restaurantes si el primer interés era "food"). Ahora la query es genérica y el filtro de intereses se aplica **después**, como scoring (Paso 3 del prompt: +1 punto por cada término de `activity_interests` que aparezca en `title` o `type`, orden por puntuación DESC y luego rating DESC) sobre el pool completo — da más variedad de categorías entre las que el ranking puede elegir.

**Nº de actividades — fórmula exacta:** `dias_utiles = días totales del viaje - 2` (excluye llegada y regreso). `N = min(dias_utiles, 12, nº de resultados utilizables con gps_coordinates)`. El agente debe devolver exactamente N actividades (nunca menos por decisión propia), repartidas máximo 1 por día, con intervalo `max(1, floor(dias_utiles/N))` entre fechas. La hora de cada actividad se deriva de su categoría: comida/café/bar-restaurante → 13:00, bar/pub/nightlife → 20:00, el resto (museos, monumentos, parques, tours...) → 10:00.

### Tool: Tavily

| Campo | Valor |
|---|---|
| maxResults | 3 |
| searchDepth | basic |
| includeAnswer | true |

Doble propósito: inteligencia de destino (visa, clima, transporte → `plan_notes[]`) y fallback de actividades si Google Maps devolvió menos de 3 resultados utilizables.

---

## 7. Coordenadas e itinerario por día — Diseño detallado

### Parte 1 — Coordenadas de actividades concretas

El `json_restrictor` de Google Maps incluye `gps_coordinates`. El agente mapea:
```
gps_coordinates.latitude → activity.lat
gps_coordinates.longitude → activity.lng
```
Sin coste adicional de tool calls — el dato ya llegaba en la respuesta de SerpAPI.

### Parte 2 — `daily_itinerary[]` y `points_of_interest` (vuelve a escribirlos el LLM en v34)

A diferencia de v31/v32/v33 (donde `06_validar_output.js` construía siempre el itinerario día
a día en código, combinando actividades reales con una lista de `plan.landmarks[]` generada
aparte), en v34 el **propio agente redacta `daily_itinerary[]` completo** como parte del PASO 6
del prompt (ver `ITINERARIO DÍA A DÍA (MANDATORIO)`):

- Día de llegada: `title='Día de llegada a [destino]'`, `summary` con hora de llegada +
  check-in + sugerencia para la tarde, `activities:[]`.
- Día con actividad real: `title`=nombre de la actividad, `summary` narrando el día con datos
  reales, `activities:[{time,name,duration_hours,price_usd,booking_url}]` (referencia a la
  actividad de `segments[].activities[]`, sin duplicar ni inventar).
- Día libre: `title='Día libre para caminar y conocer [destino]'`, `summary` con sugerencias
  (mercados, barrios, cafés), `activities:[]`.
- Día de regreso: `title='Último día en [destino] — Regreso a [origin]'`, `summary` con
  check-out + hora de vuelo, `activities:[]`.

Cada día, sin excepción, debe incluir `points_of_interest`: un array con el nombre de **un**
lugar real y geolocalizable mencionado ese día (la actividad principal, un barrio, plaza,
museo o monumento concreto — nunca una descripción genérica). Para llegada/regreso, el
aeropuerto o la zona del hotel. Este campo es el que alimenta el nodo de geocoding (Parte 3) y,
por tanto, el mapa del frontend.

`plan.landmarks[]` **ya no existe** en el contrato de salida — quedó obsoleto junto con el
constructor determinista de itinerario que lo consumía.

`06_validar_output.js` conserva un **safety net condicional**: solo si el LLM devolvió
`daily_itinerary` vacío (o ausente), construye una estructura mínima desde
`segments[].activities[]` — no se ejecuta si el LLM ya cumplió su parte.

### Parte 3 — Nodo `Enriquecer Coordenadas (OpenStreetMap)`

Insertado entre `Validar Output del Planificador` y `Logger — Métricas`. Es un nodo Code (JavaScript puro) que **no involucra al LLM** — usa `this.helpers.httpRequest` para llamar a la API pública de **Nominatim** (el servicio de geocoding oficial de OpenStreetMap), sin necesidad de API key. Su lógica no cambió respecto a v31; lo que cambió es el origen del `points_of_interest` que geocodifica (ahora viene directo del LLM, no de un round-robin de `plan.landmarks[]`).

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

---

## 8. Nodo Validar Output del Planificador

Safety nets aplicados en orden:

1. **`generated_at` incondicional** — siempre `new Date().toISOString()`
2. **Código IATA `XXX` no resuelto** — si `destination_city_iata` u `origin_city_iata` quedó
   en `XXX` (ciudad no reconocida por `05_convertir_iata.js`), fuerza `needs_user_input` y un
   warning `no_valid_flight` sugiriendo ciudades reales del país escrito (tabla
   `COUNTRY_TO_CITIES`, alineada con la que usa `ChatPlanner.tsx` en el formulario). Bug real
   que motivó este safety net: "Marruecos" (un país) se convertía en el código IATA "MAR", que
   por coincidencia es un aeropuerto real de Maracaibo, Venezuela — SerpAPI encontraba vuelos
   "válidos" a un continente equivocado sin dar ningún error.
3. **`stars: null`** — si `hotel.stars` es 0/ausente/vacío → fuerza `null` (nunca `0`)
4. **`booking_url` de vuelos — un solo enlace round-trip con `through`**:
   ```javascript
   booking_url = `https://www.google.com/travel/flights?q=Flights%20to%20${destino}%20from%20${origen}%20on%20${fechaIda}%20through%20${fechaVuelta}`
   ```
   Mismo enlace para `outbound` y `return`. Formato verificado con una petición real (HTTP
   200, `<title>` con ruta y fechas correctas antes de adoptarlo).
5. **`plan_notes[]`** — mínimo 1 nota genérica si el agente la omite
6. **`trip_summary`** — versión mínima si se omite
7. **Recalculo de coste por nº real de viajeros** — Flights y Maps no reciben el número de
   pasajeros (solo Hoteles), así que `price_usd` de vuelos/actividades es siempre por persona;
   este paso multiplica `flights_usd`/`activities_usd` por el total de viajeros reales del
   `travel_brief` y recalcula `total_usd`/`budget_remaining_usd`.
8. **`budget_exceeded` determinista** — si tras el recálculo el total supera el presupuesto
   (`budget_total_usd > 0`), fuerza el warning con `amount_over` y `suggested_budget_usd`
   (`Math.ceil` del total real, para que un reintento con "usar este presupuesto" no vuelva a
   fallar por céntimos) y `status: needs_user_input`, sobrescribiendo el propio cálculo del
   agente si ya había emitido uno (incluido su `detail`, que puede llevar la aritmética mal).
9. **Status seguro** — fuerza `needs_user_input` si hay warnings críticos con `plan_ready`
10. **`daily_itinerary[]` — safety net condicional (novedad v34)**: solo si el LLM devolvió
    el itinerario vacío o ausente, construye una estructura mínima desde
    `segments[].activities[]`. Si el LLM ya lo redactó (caso normal), este bloque no se
    ejecuta — ver §7 Parte 2.
11. **Persistencia** — guarda el plan en memoria (`$getWorkflowStaticData('global')`) indexado por `session_id`, para el refinamiento posterior

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

## 11. Output JSON — Estructura (fragmento relevante a v34)

El LLM devuelve `daily_itinerary[]` completo (título, resumen y `points_of_interest` por día,
ver §7 Parte 2) además de `segments[].activities[]`. `06_validar_output.js` solo interviene si
el LLM lo dejó vacío. `plan.landmarks[]` ya no existe en el contrato.

```json
{
  "session_id": "session_...",
  "status": "plan_ready",
  "plan": {
    "segments": [{
      "flights": {
        "outbound": {"...": "...", "booking_url": "https://www.google.com/travel/flights?q=Flights%20to%20CDG%20from%20AMS%20on%202026-09-15%20through%202026-09-30"},
        "return":   {"...": "...", "booking_url": "https://www.google.com/travel/flights?q=Flights%20to%20CDG%20from%20AMS%20on%202026-09-15%20through%202026-09-30"}
      },
      "hotel": {"...": "..."},
      "activities": [
        {"name": "Musée du Louvre", "category": "museum", "date": "2026-09-17", "start_time": "10:00", "duration_hours": 3, "lat": 48.8606111, "lng": 2.337644, "...": "..."}
      ]
    }],
    "daily_itinerary": [
      {
        "day": 1, "date": "2026-09-15",
        "title": "Día de llegada a Paris",
        "summary": "Llegada por la tarde y traslado al hotel en el Marais. Check-in y tarde libre para pasear por el barrio antes de cenar cerca del alojamiento.",
        "points_of_interest": ["Le Marais"],
        "activities": []
      },
      {
        "day": 3, "date": "2026-09-17",
        "title": "Musée du Louvre",
        "summary": "Mañana dedicada al Louvre. Tras la visita, tiempo libre para almorzar cerca y seguir explorando el centro histórico.",
        "points_of_interest": ["Musée du Louvre"],
        "activities": [
          {"time": "10:00", "name": "Musée du Louvre", "duration_hours": 3, "price_usd": 22, "booking_url": "https://..."}
        ]
      },
      {
        "day": 4, "date": "2026-09-18",
        "title": "Día libre para caminar y conocer Paris",
        "summary": "Día libre para pasear por Saint-Germain-des-Prés, descubrir mercados locales y disfrutar de un café con vistas al Sena.",
        "points_of_interest": ["Saint-Germain-des-Prés"],
        "activities": []
      }
    ]
  }
}
```

---

## 12. Taxonomía de Advertencias

| Tipo | requires_user_approval | Descripción |
|---|---|---|
| `no_valid_flight` | true | Sin vuelo disponible en un trayecto (o código IATA `XXX` no resuelto). Guía al usuario a refinar con nuevas fechas o una ciudad concreta. |
| `no_valid_hotel` | true | Sin hotel disponible |
| `budget_exceeded` | true | Coste total supera presupuesto (recalculado de forma determinista) |
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
| Enriquecer Coordenadas (OpenStreetMap) | Ninguna — Nominatim es público y gratuito |

---

## 14. Setup — Paso a Paso

### 14.1 Importar y configurar
1. **Workflows → Import from File** → `Planificador_de_Viajes_v34.json`
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
- El número de días con `activities` no vacío coincide con la fórmula `min(dias_utiles,12,utilizables)`
- Predominan `source: activity` y `source: geocoded` sobre `city_center` (indica que el agente genera POIs suficientemente específicos)
- El `booking_url` de vuelos abre Google Flights con la ruta y ambas fechas precargadas (`... on <ida> through <vuelta>`)

---

## 16. Limitaciones Conocidas

| Limitación | Descripción |
|---|---|
| `booking_url` de vuelos son búsquedas, no reservas exactas | Formato `travel/flights?q=...on...through...` abre la ruta correcta; para reserva exacta se requeriría el `booking_token` de SerpAPI, ya probado y descartado (ver arriba, devuelve una url genérica que da 404) |
| `hotel.booking_url` a veces genérico o vacío | Depende del campo `link` que devuelva Google Hotels para ese alojamiento |
| `hotel.address` a veces vacío | Limitación de datos de origen (SerpAPI) |
| Latencia añadida por geocoding | ~1.1s por día que requiere geocodificación (límite de Nominatim); mitigado porque los días con actividad concreta no necesitan geocoding |
| Operación Supabase es `Create`, no `Upsert` | La versión del nodo nativo disponible no soporta upsert; cada refinamiento genera un registro nuevo en vez de sobreescribir |
| Sin métricas reales de consumo de tokens | El sub-nodo del modelo (LangChain) no es alcanzable desde un Code node vía `$()`; ese dato solo existe en la `runData` de la ejecución (rama `ai_languageModel`), visible en el panel de Logs de la UI. Leerlo vía la API de n8n (`/api/v1/executions/{id}?includeData=true`) está pendiente de validar en un workflow aparte |

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
| v31 | Coordenadas GPS por día del itinerario vía OpenStreetMap/Nominatim, para mapa en frontend |
| v32 (post-v31, `develop`) | `daily_itinerary` determinista siempre construido en código; código IATA `XXX` + sugerencia de ciudades por país (fix "Marruecos→Maracaibo"); recálculo de coste por nº real de viajeros; eliminada extracción de transporte local por regex |
| v33 (post-v31, `develop`) | `budget_exceeded` determinista refinado (guarda contra `budget=0`, sugiere presupuesto redondeado al alza) |
| **v34** | **Reversión: `daily_itinerary` vuelve a redactarlo el LLM; query de Maps genérica con scoring de intereses posterior; nº exacto de actividades por fórmula; `booking_url` de vuelos consolidado en un enlace round-trip; captura de tokens eliminada (nunca funcionó)** |

---

## 18. Learnings Clave

1. **Nominatim (OpenStreetMap) es gratuito y sin API key** — ideal para geocoding puntual fuera del contexto de un agente LLM.
2. **El geocoding debe vivir fuera del agente** — hacerlo dentro del loop del LLM multiplicaría tool calls y reintroduciría problemas de límite de tokens.
3. **Los datos de coordenadas a veces ya existen en las respuestas de las tools** — antes de añadir nueva infraestructura, revisar si el `json_restrictor` está descartando información útil (caso de `gps_coordinates` en Google Maps).
4. **Las URLs de Google Flights cambian de formato sin aviso** — el patrón antiguo `#flt=...` dejó de funcionar; validar en navegador antes de dar por bueno un formato de URL construida.
5. **gpt-4.1 es compatible con la tool de Flights únicamente si el diseño usa dos llamadas one-way explícitas** — con round-trip (type=1) el modelo tiende a duplicar llamadas de forma incorrecta.
6. **Separar la escritura en Supabase del camino de respuesta al usuario** — el usuario nunca debe esperar (ni depender) de que la persistencia en base de datos tenga éxito.
7. **Un código IATA "inventado" puede coincidir con un aeropuerto real de otro sitio** — el fallback de `toIata()` que recortaba las 3 primeras letras de una ciudad no reconocida generaba `XXX` codes que a veces eran aeropuertos reales (p. ej. "Marruecos"→"MAR"→Maracaibo), produciendo vuelos "válidos" al destino equivocado sin ningún error. La solución no es intentar adivinar mejor, sino usar un código claramente inválido (`XXX`) que fuerce el flujo de "no hay vuelo" ya existente.
8. **Texto libre de un LLM (Tavily) no es una fuente fiable para un número que se usa en aritmética** — extraer por regex "el primer precio mencionado" para usarlo como coste total es frágil: ese texto suele hablar de UN ítem suelto (un billete de metro), no del total del viaje. Si no hay un dato estructurado y fiable, es mejor `null` (+ "No disponible" en el frontend) que inventar un número.
9. **No toda "mejora" mecánica es la decisión correcta a largo plazo** — el itinerario determinista de v32/v33 era más rápido (60s→15.5s) y consistente, pero el equipo decidió revertir a redacción por LLM en v34 por motivos de producto (narrativa más natural, `points_of_interest` más específicos por día). Vale la pena registrar el trade-off explícitamente en vez de asumir que la versión más reciente es siempre estrictamente mejor en todos los ejes.
