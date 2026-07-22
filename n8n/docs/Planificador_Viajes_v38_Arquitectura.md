# Planificador de Viajes — v38
## Documentación de Arquitectura

> **Versión:** v38
> **Plataforma:** n8n 2.23.2 (Self Hosted)
> **Estado:** Estable — versión activa del proyecto (TFM)
> **Workflow:** 1 main workflow (27 nodos)
> **Modelo Motor Planificador:** GPT-4.1 (maxTokens 4096, temperature 0.1, retry on fail 65s)
> **Modelo Agente Refinamiento:** GPT-4o-mini (maxTokens 1024, temperature 0.1)
> **Persistencia:** Supabase (tabla `travel_plans`)
> **Scope declarado:** viajes de hasta 21 días

## Actualizaciones sobre este documento (migración v34 → v38)

v38 se construye directamente sobre v34: mismo `id` de workflow, mismos 27 nodos con los
mismos UUIDs (incluidos los 10 nodos Code — `_inject.py` no necesitó tocar su mapeo, solo la
ruta del fichero canónico). Solo **2 nodos cambian de verdad**: el `systemMessage` del
Agente 2 y el código de `Validar Output del Planificador`. Dos nodos más (`Convertir
Ciudades a IATA`, `Enriquecer Coordenadas`) llegaron con los comentarios reescritos pero la
misma lógica exacta — confirmado con un diff línea a línea, no se tocaron.

El salto v34 → v38 resume el trabajo de dos iteraciones internas (v36/v37, no publicadas)
que quedaron fuera de producción:

- **Reparto declarativo, no procedimental**: la fórmula de intervalo anterior
  (`intervalo=max(1,floor(dias_utiles/N))`, con verbos como "recorre", "de una en una")
  inducía al modelo a encadenar llamadas de herramienta hasta agotar el límite de 30.000 TPM.
  Se sustituye por una descripción del *estado final* del itinerario (cuántas actividades,
  cuántas por día, cómo se ocupan los huecos) sin lenguaje de proceso.
- **Objetivo de cantidad reintroducido (el fix real de v38)**: quitar el lenguaje iterativo
  dejó el reparto sin ancla — el modelo elegía 3, 5 o 13 actividades en viajes de 6, 11 o 16
  días sin relación con los días disponibles. v38 fija la cantidad como propiedad del
  resultado: `N = min(días disponibles, 20, nº de utilizables)`.
- **Fin de la duplicación de actividades**: el LLM ya no escribe `segments[].activities[]`
  aparte de `daily_itinerary[].activities[]` — lo hacía dos veces, gastando ~40 tokens extra
  por actividad. Ahora cada actividad de `daily_itinerary[]` lleva su propio `lat`/`lng`/
  `category`, y `06_validar_output.js` reconstruye `segments[].activities[]` en código con la
  forma exacta de siempre (10 campos). **Contrato de salida final idéntico byte a byte** — el
  frontend no necesitó ningún cambio.
- **Salvaguarda de concisión en viajes largos (≥17 días)**: con la cantidad ya corregida, un
  viaje de 21 días (19 actividades) volvía a rozar el techo de tokens. En viajes de 17 días o
  más, los `summary` diarios se escriben en una frase breve y el `trip_summary` en 2 frases —
  es una propiedad del texto, no recorta días ni actividades.

## Pendientes de fondo (heredados, sin tocar en v38)

- `activities_usd: 0` cuando hay atracciones de pago (Google Maps no siempre da precio de
  atracciones en el `json_restrictor` actual).
- Coordenada de hotel ocasionalmente rota (un caso real: hotel de Santiago apareció
  geolocalizado en Filipinas).
- `plan_notes` a veces inventa requisitos de visado/ETIAS en vez de citar la fuente de Tavily.
- `local_transport_data_source` puede llegar como el string `"null"` en vez de `null` real.

---

## 1. Descripción General

El Planificador de Viajes v38 es un agente de IA automatizado en n8n que genera planes de viaje completos a partir de un formulario web estructurado. Dada la entrada del usuario (origen, destino, fechas, presupuesto, preferencias), el sistema:

1. Busca vuelo de ida y vuelo de vuelta mediante dos búsquedas one-way independientes (SerpAPI Google Flights)
2. Busca el hotel con mejor valoración en las fechas reales del vuelo confirmado (SerpAPI Google Hotels)
3. Busca actividades reales en el destino con una query genérica (SerpAPI Google Maps, una sola llamada), aplica el filtro de intereses del usuario como scoring posterior, y selecciona una cantidad exacta según los días disponibles
4. Obtiene inteligencia de destino — visado, clima, transporte — y actúa como fallback de actividades si es necesario (Tavily)
5. Genera un itinerario día a día narrativo en español, con un punto de interés real por día
6. Enriquece cada día del itinerario con una coordenada geográfica (GPS de actividad, geocoding, o centro de ciudad) para un mapa en el frontend
7. Valida presupuesto (recalculado de forma determinista por nº real de viajeros), fechas y coherencia del plan
8. Persiste el plan completo en Supabase, sentando base para una futura búsqueda tipo RAG
9. Devuelve un JSON estructurado completo con métricas de ejecución

El sistema permite además **refinamiento iterativo**: el usuario puede enviar una instrucción de texto libre y el sistema re-ejecuta solo los pasos afectados, conservando el resto del plan.

---

## 2. Novedades de v38 respecto a v34

| Característica | Estado |
|---|---|
| Itinerario redactado por el LLM, query de Maps genérica, booking_url consolidado | Heredado de v34 |
| Código IATA `XXX` + sugerencia de ciudades reales por país | Heredado (post-v31, `develop`) |
| Recalculo determinista de coste por nº de viajeros | Heredado (post-v31, `develop`) |
| **Reparto de actividades declarativo** (ya no procedimental/iterativo) | **Cambiado en v38** |
| **Cantidad exacta de actividades = `min(días disponibles, 20, utilizables)`** | **Corregido en v38** |
| **`segments[].activities[]` reconstruido en código**, ya no lo emite el LLM | **Nuevo en v38** |
| **Resúmenes concisos en viajes de 17-21 días** (salvaguarda de tokens) | **Nuevo en v38** |

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
Tool Call 4: Google Maps — Actividades (query genérica + GPS + gps_coordinates, UNA sola llamada)
Tool Call 5: Tavily — inteligencia destino (+ fallback actividades si Maps<3)
```

Máximo 5 tool calls por ejecución completa, 6 rondas. El geocoding de coordenadas por día ocurre **después**, en un nodo Code aislado — no consume tokens del LLM.

---

## 4. Inventario de Nodos — v38 (27 nodos, sin cambios respecto a v34)

Ver §4 de [`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md) — la lista completa de nodos, tipos y conexiones es idéntica. Solo cambia el contenido interno de `Motor Planificador — Agent 2` (prompt) y `Validar Output del Planificador` (código).

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
| System prompt | 12,046 caracteres (~3,010 tokens) |

**Por qué el reparto declarativo importa para el TPM:** un prompt que describe el reparto de actividades como una secuencia de pasos ("recorre los días uno a uno", "repite hasta cubrir todos") empuja al modelo a razonar el problema como un bucle — y un modelo que razona en bucle tiende a encadenar tool calls de verificación intermedias, agotando el límite de 30.000 TPM en frío. Describir el reparto como el *estado final* esperado (cuántas actividades, cómo se distribuyen, qué pasa con los huecos) evita ese patrón sin perder precisión.

### Los 6 pasos de ejecución

| Paso | Nombre | Bloqueante |
|---|---|---|
| 1 | Vuelos (2 llamadas one-way) | Sí |
| 2 | Hotel | Sí |
| 3 | Actividades (scoring por intereses + cantidad exacta + coordenadas) | No |
| 4 | Inteligencia de destino (Tavily) | No |
| 5 | Validación | — |
| 6 | Trip Summary + Itinerario día a día (conciso si ≥17 días) | — |

Condicionados por `steps_to_run`: `all` (todos), `flights`, `hotels`, `activities`, `validation` (para refinamientos parciales).

---

## 6. Herramientas del Motor Planificador

### Tool: SerpApi Google Flights / Hotels / Tavily

Sin cambios respecto a v34 — ver §6 de
[`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md).

### Tool: Google Maps — Actividades (selección corregida en v38)

| Campo | Valor |
|---|---|
| Motor | `google_maps` |
| query | `'things to do in [destino]'` — fórmula fija, en inglés, sin `activity_interests` |
| ll | `destination_city_ll` (`@lat,lng,15z`) |
| json_restrictor | `local_results[].{title,type,rating,price,links.website,gps_coordinates}` |

La query y el `json_restrictor` no cambian respecto a v34. Lo que cambia es cómo el prompt le pide al modelo que use los resultados (Paso 3, §7):

**Días disponibles:** `día_llegada = arrival[:10]`, `día_regreso = departure[:10]` (ambos con `activities:[]`, son días de aeropuerto). Días disponibles = de llegada+1 a regreso-1.

**Estado final del itinerario (declarativo, no procedimental):**
- **Cantidad:** `N = min(nº días disponibles, 20, nº de utilizables)`. Ejemplos: 4 días
  disponibles → 4 actividades; 14 días → 14; 25 días → 20 (tope del scope). Con menos
  utilizables que ese número, se usan todos los utilizables — nunca menos por decisión propia
  del modelo.
- Cada día disponible tiene como **máximo 1 actividad**.
- Las actividades utilizables ocupan los días disponibles **en orden**: la 1ª del ranking
  (scoring de intereses DESC, luego rating DESC) va al primer día disponible, la 2ª al
  segundo, y así sucesivamente por posición — no por fecha calculada con una fórmula de
  intervalo.
- Si hay menos utilizables que días disponibles, los días sobrantes quedan libres
  (`activities:[]`) **al final**, nunca intercalados.
- Cada lugar aparece una sola vez en todo el itinerario.

**Hora según categoría** (sin cambios): comida/café/bar-restaurante → 13:00, bar/nightlife →
20:00, resto (museos, monumentos, parques...) → 10:00.

---

## 7. `daily_itinerary[]` — Único punto de verdad para las actividades (novedad v38)

En v34, el LLM ya redactaba `daily_itinerary[]` completo (título, resumen, `points_of_interest`
por día — ver v34 §7 Parte 2), pero **también** tenía que emitir por separado
`segments[].activities[]` con la forma de 10 campos que espera el resto del contrato
(`name`, `date`, `start_time`, `duration_hours`, `price_usd`, `booking_url`, `category`,
`source`, `lat`, `lng`). Esa duplicación costaba ~40 tokens extra por actividad sin aportar
información nueva — todo lo que hay en `segments[].activities[]` ya estaba en
`daily_itinerary[].activities[]`.

**v38 elimina la duplicación en origen.** El LLM escribe cada actividad **una sola vez**,
dentro de `daily_itinerary[].activities[]`, y ahora incluye también `lat`, `lng` y `category`
en cada una (antes solo llevaban `time`, `name`, `duration_hours`, `price_usd`,
`booking_url`). El contrato de salida del LLM **ya no tiene** `segments[].activities[]` — está
prohibido explícitamente en las REGLAS CRÍTICAS del prompt.

`06_validar_output.js` reconstruye `segments[].activities[]` en código, recorriendo
`daily_itinerary[]` y mapeando cada actividad a la forma exacta de siempre:

```javascript
if (result.plan && Array.isArray(result.plan.segments) && Array.isArray(result.plan.daily_itinerary)) {
  const rebuilt = [];
  for (const day of result.plan.daily_itinerary) {
    if (!Array.isArray(day.activities)) continue;
    for (const a of day.activities) {
      if (!a || !a.name) continue;
      rebuilt.push({
        name: a.name, date: day.date || '', start_time: a.time || '10:00',
        duration_hours: a.duration_hours || 3, price_usd: a.price_usd || 0,
        booking_url: a.booking_url || '', category: a.category || '',
        source: a.source || 'google_maps',
        lat: (a.lat !== undefined ? a.lat : null), lng: (a.lng !== undefined ? a.lng : null)
      });
    }
  }
  if (result.plan.segments[0]) result.plan.segments[0].activities = rebuilt;
}
```

Este bloque corre **antes** del recálculo de coste por viajero (que lee
`segCost.activities`), así que el total de actividades sigue calculándose sobre datos reales
reconstruidos, no sobre lo que el LLM haya dejado en `segments[0].activities` (que ahora
siempre es `undefined` en la salida cruda del modelo).

**Contrato de salida final: idéntico byte a byte al de v34.** El frontend consume
`segments[].activities[]` con la misma forma de siempre — no necesitó ningún cambio.

### 7.1 Agrupar huecos al final (v38.1 — fix post-lanzamiento)

El prompt le pide al modelo, cuando hay menos actividades utilizables que días disponibles,
que agrupe los días libres al final ("los huecos van al final, nunca en medio" — ver §6).
**Verificado con una ejecución real que esta instrucción no se cumplía de forma fiable**: un
viaje de 19 días (17 disponibles, 11 actividades utilizables) salió con los días libres
intercalados en vez de agrupados.

En vez de seguir puliendo el texto del prompt para un problema de **orden mecánico** —
exactamente el tipo de tarea que un LLM resuelve de forma inconsistente y que un bucle en
código resuelve siempre igual—, se aplicó el mismo criterio que ya rige el resto de este
nodo: **se corrige en código, después de que el modelo responda.**

```javascript
// daily_itinerary[] ya validado: días intermedios (sin contar llegada/regreso)
// se reordenan moviendo el CONTENIDO completo de cada día (title, summary,
// points_of_interest, activities) — los días con actividad quedan agrupados
// al principio, los libres al final. day/date de cada slot no se tocan.
if (result.plan && Array.isArray(result.plan.daily_itinerary) && result.plan.daily_itinerary.length > 2) {
  const days = result.plan.daily_itinerary;
  const first = days[0];
  const last = days[days.length - 1];
  const middle = days.slice(1, -1);
  const withActivity = middle.filter((d) => Array.isArray(d.activities) && d.activities.length > 0);
  const withoutActivity = middle.filter((d) => !Array.isArray(d.activities) || d.activities.length === 0);
  if (withActivity.length > 0 && withoutActivity.length > 0) {
    const reordered = middle.map((slot, i) => {
      const source = i < withActivity.length ? withActivity[i] : withoutActivity[i - withActivity.length];
      return { ...source, day: slot.day, date: slot.date };
    });
    result.plan.daily_itinerary = [first, ...reordered, last];
  }
}
```

Este paso corre **antes** de la reconstrucción de `segments[].activities[]` (§7), así que las
fechas reconstruidas ya reflejan el orden correcto. Reejecutar el mismo caso de 19 días tras
el fix: días 2-11 (10 seguidos) con actividad, días 12-18 (7 seguidos) libres — agrupados
correctamente, sin actividades repetidas.

---

## 8. Nodo Validar Output del Planificador

Safety nets aplicados en orden (idénticos a v34, más los dos nuevos pasos 7 y 8):

1. **`generated_at` incondicional**
2. **Código IATA `XXX` no resuelto** → `needs_user_input` + sugerencia de ciudades reales por país
3. **`stars: null`** si `hotel.stars` no es válido
4. **`booking_url` de vuelos** — un solo enlace round-trip con `through`
5. **`plan_notes[]`** — mínimo 1 nota genérica si el agente la omite
6. **`trip_summary`** — versión mínima si se omite
7. **`daily_itinerary[]` reordenado**: días con actividad agrupados al principio, libres al final (nuevo en v38.1, ver §7.1)
8. **`segments[].activities[]` reconstruido desde `daily_itinerary[]`** (nuevo en v38, ver §7)
9. **Recalculo de coste por nº real de viajeros**
10. **`budget_exceeded` determinista**
11. **Status seguro** — fuerza `needs_user_input` si hay warnings críticos con `plan_ready`
12. **`daily_itinerary[]` — safety net condicional**: solo si el LLM lo devolvió vacío
13. **Persistencia** en memoria indexada por `session_id`

---

## 9. Persistencia en Supabase

Sin cambios respecto a v34 — ver §9 de
[`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md).

---

## 10. Agente de Refinamiento

Sin cambios respecto a v34 — ver §10 de
[`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md).

---

## 11. Output JSON — Estructura (fragmento relevante a v38)

El contrato de salida **final** (tras `06_validar_output.js`) es idéntico byte a byte al de
v34 — `segments[].activities[]` sigue teniendo los mismos 10 campos de siempre. Lo que cambia
es que ya no lo escribe el LLM directamente, sino que se reconstruye desde
`daily_itinerary[].activities[]`, que ahora también lleva `lat`, `lng` y `category`:

```json
{
  "plan": {
    "segments": [{
      "activities": [
        {"name": "Musée du Louvre", "date": "2026-09-17", "start_time": "10:00", "duration_hours": 3, "price_usd": 22, "booking_url": "https://...", "category": "museum", "source": "google_maps", "lat": 48.8606111, "lng": 2.337644}
      ]
    }],
    "daily_itinerary": [
      {
        "day": 3, "date": "2026-09-17",
        "title": "Musée du Louvre",
        "summary": "Mañana dedicada al Louvre. Tras la visita, tiempo libre para almorzar cerca.",
        "points_of_interest": ["Musée du Louvre"],
        "activities": [
          {"time": "10:00", "name": "Musée du Louvre", "duration_hours": 3, "price_usd": 22, "booking_url": "https://...", "category": "museum", "lat": 48.8606111, "lng": 2.337644}
        ]
      }
    ]
  }
}
```

---

## 12. Taxonomía de Advertencias

Sin cambios respecto a v34 — ver §12 de
[`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md).

---

## 13. Credenciales Requeridas

Sin cambios respecto a v34 — ver §13 de
[`Planificador_Viajes_v34_Arquitectura.md`](Planificador_Viajes_v34_Arquitectura.md).

---

## 14. Setup — Paso a Paso

### 14.1 Importar y configurar
1. **Workflows → Import from File** → `Planificador_de_Viajes_v38.json`
2. Asignar credenciales de OpenAI, SerpAPI, Tavily y Supabase en los nodos correspondientes
3. Verificar en `Tool: Google Maps (Actividades)` que los campos `query` y `ll` tengan el ícono ✨ activo (modo `$fromAI`)
4. Verificar que la tabla `travel_plans` existe en Supabase con RLS desactivado

### 14.2 Publicar
Toggle **Publish** (punto verde). Ambos webhooks quedan activos.

### 14.3 Verificar acceso saliente a Nominatim
El nodo de geocoding requiere que la instancia de n8n tenga acceso de red saliente a `nominatim.openstreetmap.org`.

---

## 15. Testing — Casos a validar

A diferencia de versiones anteriores, v38 declara un **scope explícito de hasta 21 días** y
requiere revalidar varios tamaños de viaje, no solo el caso de demo:

| Caso | Qué comprobar |
|---|---|
| 5 / 12 / 15 días (demo) | Todos los días útiles llenos, 1 actividad cada uno, narrativa completa |
| Escala con los días | Un viaje de 14 días debe traer ~14 actividades, no 3 ni 5 |
| 17-21 días | No trunca por tokens; `summary` diarios y `trip_summary` salen en formato conciso |
| TPM en frío | La primera ejecución tras reiniciar n8n no debe cortarse por el límite de 30.000 TPM |

```
POST https://[ngrok-url]/webhook/travel-planner
```

```json
{
  "origin_city": "Madrid",
  "destination_city": ["Roma"],
  "departure_date": "2026-09-01",
  "return_date": "2026-09-17",
  "travelers": {"adults": 2, "children": []},
  "budget_total_usd": 4000,
  "accommodation_type": "mid-range",
  "flight_preferences": {"cabin_class": "economy", "max_layover_hours": 4, "preferred_airlines": []},
  "activity_interests": ["food", "culture", "museums"],
  "special_requirements": "ninguno",
  "flexible_dates": true,
  "hotel_location_preference": "city center",
  "car_rental_needed": false
}
```

---

## 16. Limitaciones Conocidas

| Limitación | Descripción |
|---|---|
| `booking_url` de vuelos son búsquedas, no reservas exactas | Igual que en v34 |
| `activities_usd` puede salir en 0 | Google Maps no siempre da precio de atracciones en el `json_restrictor` actual |
| Coordenada de hotel ocasionalmente incorrecta | Caso real: hotel de Santiago geolocalizado en Filipinas — pendiente de investigar la fuente del dato |
| `plan_notes` puede inventar requisitos de visado/ETIAS | Tavily no siempre da una respuesta clara y el modelo rellena el hueco — pendiente de un safety net determinista |
| `local_transport_data_source` a veces es el string `"null"` | En vez de `null` real — pendiente de normalizar en `06_validar_output.js` |
| Scope declarado de hasta 21 días | No probado ni calibrado más allá de ese rango |

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
| v32 (post-v31, `develop`) | `daily_itinerary` determinista siempre construido en código; código IATA `XXX` + sugerencia de ciudades por país; recálculo de coste por nº real de viajeros |
| v33 (post-v31, `develop`) | `budget_exceeded` determinista refinado |
| v34 | Reversión: `daily_itinerary` vuelve a redactarlo el LLM; query de Maps genérica; nº exacto de actividades por fórmula (primera versión, con intervalo procedimental); `booking_url` consolidado |
| v36-v37 (internas, no publicadas) | Reparto declarativo (fix del TPM en frío); quedó sin ancla de cantidad |
| v38 | Reintroduce la cantidad exacta de actividades como propiedad declarativa; fin de la duplicación de actividades (reconstrucción en código); salvaguarda de concisión en viajes ≥17 días |
| **v38.1** | **Fix post-lanzamiento: agrupa los días con actividad al principio y los libres al final en código (§7.1) — el prompt lo pedía pero no lo cumplía de forma fiable en viajes largos** |

---

## 18. Learnings Clave (nuevos en v38, además de los de v34)

1. **El lenguaje del prompt (declarativo vs. procedimental) afecta el comportamiento de tool-calling del modelo**, no solo la salida de texto. Describir un reparto como una secuencia de pasos ("recorre, reparte, repite") empuja al modelo a razonar en bucle y encadenar llamadas de verificación — agotando el límite de TPM en frío. Describir el mismo reparto como el *estado final* esperado evita ese patrón.
2. **Quitar el "cómo" de una instrucción no debe implicar quitar el "cuánto".** El fix declarativo de v36/v37 resolvió el TPM pero, al eliminar la fórmula de intervalo, se llevó por delante el único número que fijaba la cantidad — el modelo quedó sin ancla y eligió cantidades arbitrarias. La cantidad exacta necesita su propia frase declarativa, independiente de cómo se reparten las fechas.
3. **Cuando el LLM repite el mismo dato en dos sitios del contrato de salida, casi siempre se puede reconstruir uno desde el otro en código**, gratis en tokens y sin ningún riesgo de inconsistencia entre las dos copias (que era justo lo que pasaba antes: el "maestro" `segments[].activities[]` y `daily_itinerary[].activities[]` podían desincronizarse si el modelo era descuidado en una de las dos).
4. **Un scope explícito (aquí, "hasta 21 días") obliga a testear el borde, no solo el caso feliz.** El bug de cantidad de v37 solo se detectó al probar viajes de 6/11/16/22 días — los casos de demo de 5/12/15 días, más cortos, nunca lo habrían revelado.
5. **Un problema de ORDEN mecánico (agrupar unos elementos al principio y otros al final de una lista) es exactamente el tipo de instrucción que conviene resolver en código, no en el prompt.** El texto "los huecos van al final, nunca en medio" era claro y correcto, pero un LLM no ejecuta un reordenamiento de lista con la fiabilidad de un `Array.map` — verificado con una ejecución real que lo incumplía. La lección no es "redactar mejor esa frase", es reconocer cuándo una instrucción describe un algoritmo determinista y moverla a código.
