// Mapeo de la respuesta de n8n al modelo TripData del frontend.
//
// Extraído de `app/api/plan-trip/route.ts` para poder reutilizarlo desde la ruta
// de refinamiento (`app/api/refine-trip/route.ts`): la RUTA B (refinamiento) de
// n8n devuelve EXACTAMENTE el mismo esquema de plan que la RUTA A (planificación),
// así que ambas rutas mapean con `mapN8nToTripData`. No se duplica lógica.

import {
  TripData,
  TripPreferences,
  Flight,
  Hotel,
  Activity,
  DayPlan,
  ItineraryBlock,
  BudgetBreakdown
} from '@/types/trip';
import { N8nWarning } from '@/types/planResult';
import { todayISO } from '@/lib/dates';

/**
 * n8n a veces devuelve el `address` del hotel como coordenadas GPS crudas
 * (p. ej. "48.8919654, 2.4093141") en vez de un barrio. Detectarlo para no
 * pintar coordenadas donde la UI espera un área legible.
 */
function isGpsCoordinates(value: string): boolean {
  return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(value);
}

/**
 * Fallback por si el agente aún no sigue la instrucción de rellenar hotel.lat/lng
 * y sigue colando las coordenadas crudas en address (ver isGpsCoordinates).
 */
function parseGpsCoordinates(value: string): { lat: number; lng: number } | null {
  if (!isGpsCoordinates(value)) return null;
  const [lat, lng] = value.split(',').map((n) => parseFloat(n.trim()));
  return { lat, lng };
}

/**
 * Construye enlaces de búsqueda de forma determinista en vez de confiar en que
 * el LLM escriba una URL correcta (comprobado: el formato de Google Flights que
 * generaba n8n usaba el hash "#flt=" descontinuado, que ya no aplica la búsqueda).
 */
function buildGoogleFlightsSearchUrl(originIata: string, destIata: string, date: string): string {
  const query = `Flights from ${originIata} to ${destIata} on ${date}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

function buildBookingSearchUrl(hotelName: string, destination: string, checkIn?: string, checkOut?: string): string {
  const params = new URLSearchParams({ ss: `${hotelName} ${destination}` });
  if (checkIn) params.set('checkin', checkIn);
  if (checkOut) params.set('checkout', checkOut);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

function buildGoogleMapsSearchUrl(placeName: string, destination: string): string {
  const query = `${placeName} ${destination}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Busca una foto real del lugar vía Google Places (Find Place From Text +
 * Place Photo). Devuelve undefined ante cualquier fallo (API no habilitada,
 * sin resultados, etc.) para que DestinationImage caiga a su placeholder —
 * nunca debe romper la generación del plan.
 */
async function fetchPlacePhotoUrl(query: string, apiKey: string): Promise<string | undefined> {
  try {
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=photos&key=${apiKey}`;
    const res = await fetch(findUrl);
    if (!res.ok) return undefined;
    const data = await res.json();
    const photoRef = data?.candidates?.[0]?.photos?.[0]?.photo_reference;
    if (!photoRef) return undefined;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
  } catch {
    return undefined;
  }
}

/**
 * Resuelve fotos reales para un conjunto de lugares en paralelo, con caché
 * por nombre para no repetir llamadas al mismo lugar dentro del mismo viaje.
 */
async function fetchPlacePhotos(queries: string[], apiKey: string): Promise<Map<string, string>> {
  const uniqueQueries = Array.from(new Set(queries));
  const results = await Promise.all(uniqueQueries.map((q) => fetchPlacePhotoUrl(q, apiKey)));
  const map = new Map<string, string>();
  uniqueQueries.forEach((q, i) => {
    const url = results[i];
    if (url) map.set(q, url);
  });
  return map;
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1 || code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvioso';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve';
  if ([95, 96, 99].includes(code)) return 'Tormenta';
  return 'Variable';
}

/**
 * Clima real vía Open-Meteo (gratis, sin API key): antes el hero mostraba
 * "25°C - Soleado" fijo para prácticamente cualquier destino, sin importar el
 * mes del viaje. Open-Meteo no pronostica con meses de antelación, así que se
 * usa el histórico real del mismo rango de fechas del año pasado como
 * referencia de clima típico — no se inventa ningún valor: si la petición
 * falla, se devuelve null y el frontend no muestra el dato en vez de fingirlo.
 */
async function fetchClimateAverage(
  lat: number,
  lng: number,
  tripStartDate: string,
  tripEndDate: string
): Promise<{ avgTempC: number; description: string } | null> {
  try {
    const refYear = new Date().getFullYear() - 1;
    const startMD = tripStartDate.slice(5);
    let endMD = tripEndDate.slice(5);
    if (endMD < startMD) endMD = startMD;
    const start = `${refYear}-${startMD}`;
    const end = `${refYear}-${endMD}`;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const maxTemps: number[] = data?.daily?.temperature_2m_max || [];
    const minTemps: number[] = data?.daily?.temperature_2m_min || [];
    const codes: number[] = data?.daily?.weathercode || [];
    if (maxTemps.length === 0 || minTemps.length === 0) return null;
    const avgMax = maxTemps.reduce((a: number, b: number) => a + b, 0) / maxTemps.length;
    const avgMin = minTemps.reduce((a: number, b: number) => a + b, 0) / minTemps.length;
    const avgTempC = Math.round((avgMax + avgMin) / 2);
    const codeCounts = new Map<number, number>();
    codes.forEach((c) => codeCounts.set(c, (codeCounts.get(c) || 0) + 1));
    let mostCommonCode = codes[0] ?? 0;
    let maxCount = 0;
    codeCounts.forEach((count, code) => {
      if (count > maxCount) { maxCount = count; mostCommonCode = code; }
    });
    return { avgTempC, description: weatherCodeToLabel(mostCommonCode) };
  } catch {
    return null;
  }
}

/**
 * Duración del viaje en días, derivada de las fechas reales (misma convención
 * que mapPreferencesToN8n: ceil de la diferencia). Fallback a las fechas de
 * check-in/check-out del hotel. Devuelve 0 si no hay fechas usables, para que
 * el llamador aplique su propio fallback. NO usar el nº de entradas del
 * itinerario: n8n puede devolver pocas para un viaje largo.
 */
function computeTripDays(prefs: TripPreferences, hotel: { check_in?: string; check_out?: string }): number {
  const start = prefs?.dates?.start || hotel?.check_in;
  const end = prefs?.dates?.end || hotel?.check_out;
  if (!start || !end) return 0;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0;
  return Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
}

export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Esquema (parcial) de la respuesta de n8n que consume el mapper. Todos los
// campos son opcionales: n8n puede omitirlos y el mapper aplica defaults.
interface N8nFlightLeg {
  airline?: string;
  flight_no?: string;
  origin?: string;
  destination?: string;
  departure_datetime?: string;
  arrival_datetime?: string;
  duration?: string;
  layovers?: unknown[];
  price_usd?: number;
  booking_url?: string;
}

interface N8nHotel {
  name?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  stars?: number | null;
  rating?: number;
  price_per_night_usd?: number;
  total_usd?: number;
  booking_url?: string;
  check_in?: string;
  check_out?: string;
}

interface N8nActivity {
  source?: string;
  name?: string;
  category?: string;
  price_usd?: number;
  duration_hours?: number;
  booking_url?: string;
  start_time?: string;
  time?: string;
  lat?: number | null;
  lng?: number | null;
}

interface N8nDay {
  day?: number;
  date?: string;
  title?: string;
  summary?: string;
  activities?: N8nActivity[];
  // v31: coordenada garantizada por día, calculada en n8n (geocoding de
  // points_of_interest vía Nominatim/OpenStreetMap, sin coste de tokens LLM).
  lat?: number | null;
  lng?: number | null;
  coordinate_source?: string;
  // El día de llegada/regreso usa aquí el nombre del aeropuerto (ver prompt
  // "ITINERARIO DÍA A DÍA"); lo usamos para el punto de aeropuerto del mapa.
  points_of_interest?: string[];
}

interface N8nCostSummary {
  flights_usd?: number;
  hotel_usd?: number;
  activities_usd?: number;
  inter_city_transport_usd?: number;
  estimated_local_transport_usd?: number;
  total_usd?: number;
  budget_total_usd?: number;
}

interface N8nSegment {
  destination?: string;
  origin?: string;
  flights?: { outbound?: N8nFlightLeg; return?: N8nFlightLeg };
  hotel?: N8nHotel;
  activities?: N8nActivity[];
}

export interface N8nResponse {
  session_id?: string;
  status?: string;
  warnings?: N8nWarning[];
  plan?: {
    segments?: N8nSegment[];
    daily_itinerary?: N8nDay[];
    plan_notes?: string[];
    cost_summary?: N8nCostSummary;
  };
}

/**
 * Normaliza los `warnings` de n8n a un array y garantiza al menos un aviso
 * accionable: si n8n corta sin ninguno (p. ej. el motor devuelve status "error"
 * con warnings vacío), se añade el `fallback` para que la UI no pinte un "error
 * en blanco". Compartido por /api/plan-trip y /api/refine-trip.
 */
export function ensureWarnings(raw: unknown, fallback: N8nWarning): N8nWarning[] {
  const warnings: N8nWarning[] = Array.isArray(raw) ? [...raw] : [];
  if (warnings.length === 0) warnings.push(fallback);
  return warnings;
}

/**
 * Determina si la respuesta de n8n NO es un plan utilizable. Se corta cuando n8n
 * pide intervención (`needs_user_input`) o cuando el plan viene vacío (sin vuelo
 * de ida, sin hotel y sin itinerario). En ese caso el frontend debe mostrar los
 * `warnings` reales en vez de rellenar con defaults y fingir un viaje.
 */
export function isUnusableN8nPlan(rawData: N8nResponse): boolean {
  if (!rawData) return true;
  if (rawData.status === 'needs_user_input') return true;
  const segment = rawData.plan?.segments?.[0];
  const hasFlight = !!segment?.flights?.outbound?.airline;
  const hasHotel = !!segment?.hotel?.name;
  const hasItinerary = (rawData.plan?.daily_itinerary?.length ?? 0) > 0;
  return !hasFlight && !hasHotel && !hasItinerary;
}

/**
 * Mapea la respuesta generada por n8n (output-plan.json) a la interfaz
 * TripData requerida por la interfaz gráfica del frontend.
 */
export async function mapN8nToTripData(n8nResponse: N8nResponse | N8nResponse[], originalPrefs: TripPreferences): Promise<TripData> {
  const data = Array.isArray(n8nResponse) ? n8nResponse[0] : n8nResponse;

  const plan: NonNullable<N8nResponse['plan']> = data?.plan ?? {};
  const segment: N8nSegment = plan?.segments?.[0] ?? {};
  const flights: NonNullable<N8nSegment['flights']> = segment?.flights ?? {};
  const hotel: N8nHotel = segment?.hotel ?? {};
  const costSummary: N8nCostSummary = plan?.cost_summary ?? {};

  const destination = segment?.destination || originalPrefs.destination || 'Viaje';
  const generatedId = data?.session_id || `justenjoy-${destination.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  // 1. Mapear vuelos
  // booking_url: se usa el enlace REAL de n8n si lo trae (booking_options vía
  // booking_token — ver prompt del agente), y solo si no lo trae se construye
  // una búsqueda en código como respaldo. El LLM antes generaba URLs de Google
  // Flights con el hash "#flt=" descontinuado, que abre la home sin buscar; la
  // query "q=" en texto natural sí funciona como último recurso.
  const mappedFlights: Flight[] = [];
  if (flights.outbound) {
    const outboundOrigin = flights.outbound.origin || originalPrefs.origin;
    const outboundDest = flights.outbound.destination || destination;
    const outboundDate = flights.outbound.departure_datetime?.split('T')[0] || originalPrefs.dates?.start || todayISO();
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.outbound.airline || 'Aerolínea',
      from: outboundOrigin,
      to: outboundDest,
      departure: flights.outbound.departure_datetime || `${outboundDate}T09:00:00`,
      arrival: flights.outbound.arrival_datetime || `${outboundDate}T11:00:00`,
      duration: flights.outbound.duration || '2h',
      stops: Array.isArray(flights.outbound.layovers) ? flights.outbound.layovers.length : 0,
      price: flights.outbound.price_usd || 150,
      baggage: 'Maleta de cabina de 10kg incluida',
      booking_url: flights.outbound.booking_url || buildGoogleFlightsSearchUrl(outboundOrigin, outboundDest, outboundDate)
    });
  }
  if (flights.return) {
    const returnOrigin = flights.return.origin || destination;
    const returnDest = flights.return.destination || originalPrefs.origin;
    const returnDate = flights.return.departure_datetime?.split('T')[0] || originalPrefs.dates?.end || todayISO();
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.return.airline || 'Aerolínea',
      from: returnOrigin,
      to: returnDest,
      departure: flights.return.departure_datetime || `${returnDate}T15:00:00`,
      arrival: flights.return.arrival_datetime || `${returnDate}T17:00:00`,
      duration: flights.return.duration || '2h',
      stops: Array.isArray(flights.return.layovers) ? flights.return.layovers.length : 0,
      price: flights.return.price_usd || 150,
      baggage: 'Maleta de cabina de 10kg incluida',
      booking_url: flights.return.booking_url || buildGoogleFlightsSearchUrl(returnOrigin, returnDest, returnDate)
    });
  }

  // 2. Mapear hoteles
  const mappedHotels: Hotel[] = [];
  if (hotel.name) {
    const hotelGps = hotel.address ? parseGpsCoordinates(hotel.address) : null;
    const hasRealAddress = !!hotel.address && !isGpsCoordinates(hotel.address);
    // Ventajas construidas SOLO con datos reales del hotel — nada de frases
    // genéricas tipo "excelente ubicación" que no verificamos.
    const realPros: string[] = [];
    if (hotel.rating) realPros.push(`Puntuación real de huéspedes: ${hotel.rating}/5`);
    if (hotel.stars) realPros.push(`Hotel de ${hotel.stars} estrellas`);
    if (hasRealAddress) realPros.push(`Dirección verificada: ${hotel.address}`);
    mappedHotels.push({
      provider: 'Booking.com',
      name: hotel.name,
      area: hasRealAddress ? hotel.address! : `Centro de ${destination}`,
      rating: hotel.rating || 4.5,
      price_per_night: hotel.price_per_night_usd || 100,
      total_price: hotel.total_usd || 300,
      pros: realPros,
      cons: [
        'Sujeto a disponibilidad de tarifas'
      ],
      // Se usa el link real que devuelve Google Hotels vía SerpAPI (el mismo que
      // usa su botón "Ver oferta"); solo si falta se cae a una búsqueda en
      // Booking.com como respaldo.
      booking_url: hotel.booking_url || buildBookingSearchUrl(hotel.name, destination, hotel.check_in, hotel.check_out),
      lat: hotel.lat ?? hotelGps?.lat,
      lng: hotel.lng ?? hotelGps?.lng
    });
  } else {
    // No encontramos ningún hotel real para este plan. Antes se mostraba un
    // hotel completamente inventado ("Hotel Recomendado en X", 4.2★, 95€/
    // noche) indistinguible de un resultado real. Ahora se deja explícito que
    // no hay datos confirmados, sin fingir una valoración ni un precio.
    mappedHotels.push({
      provider: 'Booking.com',
      name: `Alojamiento pendiente de confirmar en ${destination}`,
      area: `Centro de ${destination}`,
      rating: 0,
      price_per_night: 0,
      total_price: 0,
      pros: [],
      cons: ['No pudimos confirmar disponibilidad real — búscalo directamente antes de reservar el resto del viaje.'],
      booking_url: buildBookingSearchUrl(`hotel en ${destination}`, destination, originalPrefs.dates.start, originalPrefs.dates.end)
    });
  }

  // 3. Mapear actividades
  const rawActivities = segment.activities || [];
  const mappedActivities: Activity[] = rawActivities.map((act: N8nActivity) => ({
    provider: act.source || 'Google Maps',
    name: act.name || 'Actividad sugerida',
    category: act.category || 'Cultura',
    price: act.price_usd || 0,
    duration: act.duration_hours ? `${act.duration_hours}h` : '3h',
    requires_booking: !!act.booking_url,
    // No tenemos el horario real (requeriría el nivel "Atmosphere" de Google
    // Places, con coste adicional por llamada) — antes se mostraba "09:00 -
    // 18:00" fijo para cualquier actividad, como si fuera un dato verificado.
    opening_hours: 'Consultar horario actualizado',
    best_time: act.start_time || '10:00',
    // Si no hay link.website real, buscar el lugar en Google Maps en vez de
    // abrir la home genérica de Maps sin ninguna búsqueda aplicada.
    booking_url: act.booking_url || buildGoogleMapsSearchUrl(act.name || 'actividad', destination),
    // Antes: frase idéntica para cualquier actividad ("encaja en tu perfil").
    // Ahora referencia el dato real que sí tenemos (categoría real de Google
    // Maps, o si es gratuita).
    why: act.price_usd === 0 || !act.price_usd
      ? `Actividad gratuita de tipo "${act.category || 'punto de interés'}" encontrada cerca de tu ruta.`
      : `Actividad de tipo "${act.category || 'punto de interés'}" con precio real detectado.`
  }));

  // 4. Mapear itinerario diario
  const rawItinerary = plan.daily_itinerary || [];
  // Fallback de ubicación para bloques sin coordenadas propias (días libres,
  // check-in/check-out, o actividades de Tavily sin gps_coordinates): usar el
  // hotel como aproximación, para que el mapa por día nunca quede vacío.
  const hotelGpsFallback = hotel.address ? parseGpsCoordinates(hotel.address) : null;
  const hotelLat = hotel.lat ?? hotelGpsFallback?.lat;
  const hotelLng = hotel.lng ?? hotelGpsFallback?.lng;
  const mappedItinerary: DayPlan[] = rawItinerary.map((dayPlan: N8nDay, index: number) => {
    const dayActivities = dayPlan.activities || [];

    const blocks: ItineraryBlock[] = dayActivities.map((act: N8nActivity) => {
      const timeStr = act.time || '10:00';
      const hr = parseInt(timeStr.split(':')[0]) || 10;
      let period: 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche' = 'Mañana';
      if (hr >= 12 && hr < 15) period = 'Mediodía';
      else if (hr >= 15 && hr < 20) period = 'Tarde';
      else if (hr >= 20) period = 'Noche';

      const actName = act.name || 'Actividad sugerida';
      return {
        time: timeStr,
        period,
        title: actName,
        type: (act.category || '').toLowerCase().includes('restaurant') || (act.category || '').toLowerCase().includes('food') ? 'food' : 'activity',
        duration: act.duration_hours ? `${act.duration_hours}h` : '2h',
        cost: act.price_usd || 0,
        location: actName,
        description: `Visita recomendada a ${actName}.`,
        tip: act.booking_url ? 'Se aconseja reservar online con antelación.' : undefined,
        // Prioridad: coordenada de la actividad real > coordenada del día
        // (geocoding de points_of_interest en n8n, v31) > hotel como último recurso.
        lat: act.lat ?? dayPlan.lat ?? hotelLat,
        lng: act.lng ?? dayPlan.lng ?? hotelLng
      };
    });

    // Relleno si no hay bloques de actividad ese día.
    // Se usa el índice del array (no dayPlan.day): en viajes largos n8n puede
    // devolver pocas entradas con números de día salteados (p. ej. 1, 2, 15),
    // así que comparar dayPlan.day contra la longitud nunca acertaba el último día.
    if (blocks.length === 0) {
      if (index === 0) {
        blocks.push({
          time: '15:00',
          period: 'Tarde',
          title: 'Registro en el alojamiento',
          type: 'hotel',
          duration: '1h',
          cost: 0,
          location: hotel.name || 'Alojamiento',
          description: 'Llegada y check-in en tu hotel para dejar el equipaje y descansar.',
          lat: hotelLat,
          lng: hotelLng
        });
      } else if (index === rawItinerary.length - 1) {
        blocks.push({
          time: '11:00',
          period: 'Mañana',
          title: 'Check-out y traslado al aeropuerto',
          type: 'transit',
          duration: '2h',
          cost: 0,
          location: hotel.name || 'Alojamiento',
          lat: hotelLat,
          lng: hotelLng,
          description: 'Registro de salida en el alojamiento y viaje hacia el aeropuerto para tu vuelo de regreso.'
        });
      } else {
        // Sin actividad propia asignada ese día: usa la coordenada geocodificada
        // del día (points_of_interest, v31) si existe, y el hotel como último
        // recurso, para que ese día no quede vacío en el filtro por día del mapa.
        blocks.push({
          time: '10:00',
          period: 'Mañana',
          title: 'Explorar la ciudad',
          type: 'activity',
          duration: '4h',
          cost: 0,
          location: destination,
          description: 'Día libre sugerido para pasear por los rincones más bonitos del destino.',
          lat: dayPlan.lat ?? hotelLat,
          lng: dayPlan.lng ?? hotelLng
        });
      }
    }

    // Punto de aeropuerto para el mapa: el día de llegada añade el aeropuerto de
    // destino al principio del día, el día de regreso añade el de salida al
    // final. Así el mapa (total y por día) marca también los tramos aéreos, no
    // solo hotel/actividades — usa la coordenada que n8n ya geocodificó para
    // ese día (points_of_interest[0] es el nombre del aeropuerto en llegada/
    // regreso, ver prompt "ITINERARIO DÍA A DÍA").
    const periodFromTime = (timeStr: string): 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche' => {
      const hr = parseInt(timeStr.split(':')[0]) || 0;
      if (hr >= 12 && hr < 15) return 'Mediodía';
      if (hr >= 15 && hr < 20) return 'Tarde';
      if (hr >= 20 || hr < 6) return 'Noche';
      return 'Mañana';
    };
    if (index === 0 && flights.outbound) {
      const poi = dayPlan.points_of_interest?.[0];
      const airportName = poi && /aeropuerto|airport/i.test(poi)
        ? poi
        : `Aeropuerto de ${flights.outbound.destination || destination}`;
      const time = flights.outbound.arrival_datetime?.split('T')[1]?.slice(0, 5) || '09:00';
      blocks.unshift({
        time,
        period: periodFromTime(time),
        title: `Llegada: ${airportName}`,
        type: 'airport',
        duration: flights.outbound.duration || '—',
        cost: 0,
        location: airportName,
        description: `Aterrizaje del vuelo ${flights.outbound.flight_no || ''} en ${airportName}.`.trim(),
        lat: dayPlan.lat ?? hotelLat,
        lng: dayPlan.lng ?? hotelLng
      });
    }
    if (index === rawItinerary.length - 1 && flights.return) {
      const poi = dayPlan.points_of_interest?.[0];
      const airportName = poi && /aeropuerto|airport/i.test(poi)
        ? poi
        : `Aeropuerto de ${flights.return.origin || destination}`;
      const time = flights.return.departure_datetime?.split('T')[1]?.slice(0, 5) || '18:00';
      blocks.push({
        time,
        period: periodFromTime(time),
        title: `Salida: ${airportName}`,
        type: 'airport',
        duration: flights.return.duration || '—',
        cost: 0,
        location: airportName,
        description: `Despegue del vuelo ${flights.return.flight_no || ''} desde ${airportName}.`.trim(),
        lat: dayPlan.lat ?? hotelLat,
        lng: dayPlan.lng ?? hotelLng
      });
    }

    const dayNumber = dayPlan.day ?? index + 1;
    return {
      day: dayNumber,
      date: dayPlan.date || '',
      title: dayPlan.title || `Día ${dayNumber}`,
      summary: dayPlan.summary || 'Jornada libre en el destino.',
      blocks
    };
  });

  // Garantiza al menos un día: n8n puede responder sin `daily_itinerary`
  // (p. ej. status "needs_user_input"), y un itinerario vacío rompe la vista
  // del viaje (ItineraryTimeline accede a itinerary[0].title).
  if (mappedItinerary.length === 0) {
    mappedItinerary.push({
      day: 1,
      date: originalPrefs.dates?.start || '',
      title: `Día libre en ${destination}`,
      summary: 'Itinerario aún por detallar; explora el destino a tu ritmo.',
      blocks: [
        {
          time: '10:00',
          period: 'Mañana',
          title: 'Explorar la ciudad',
          type: 'activity',
          duration: '4h',
          cost: 0,
          location: destination,
          description: 'Día libre sugerido para pasear por los rincones más bonitos del destino.'
        }
      ]
    });
  }

  // Fotos reales de Google Places para las paradas del itinerario (spec
  // "imagenes-y-mapas"): solo se piden para bloques con nombre real de lugar
  // (actividad/comida), no para rellenos genéricos como "Explorar la ciudad".
  // Incluye también una foto del destino en sí para la cabecera del viaje
  // (antes usaba una imagen local fija de una lista de 10 ciudades y caía a
  // Barcelona para cualquier destino no listado — p. ej. Río de Janeiro).
  // Si falta la API key o falla la llamada, los componentes ya caen a su
  // placeholder — nunca bloquea la generación del plan.
  let destinationImageUrl: string | undefined;
  // Estas llamadas corren en el servidor y NO llevan referrer, así que necesitan
  // una clave sin restricción de referrer (restringida por API a solo Places).
  // Preferimos GOOGLE_PLACES_API_KEY (server-only) y caemos a la pública si no
  // está definida, para no romper entornos que aún usan una sola clave.
  // Un valor placeholder ('changeme', que es lo que trae .env.example) cuenta
  // como NO definida: si no, el || lo elegiría por ser truthy y romperíamos el
  // fallback a la clave pública.
  const isUsableKey = (k: string | undefined): k is string =>
    !!k && k !== 'changeme';
  const placesApiKey = isUsableKey(process.env.GOOGLE_PLACES_API_KEY)
    ? process.env.GOOGLE_PLACES_API_KEY
    : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (isUsableKey(placesApiKey)) {
    const isRealPlaceBlock = (b: ItineraryBlock) =>
      (b.type === 'activity' || b.type === 'food') && b.title !== 'Explorar la ciudad';
    const photoQueries = mappedItinerary
      .flatMap((day) => day.blocks)
      .filter(isRealPlaceBlock)
      .map((b) => `${b.title} ${destination}`);
    photoQueries.push(destination);
    const photoMap = await fetchPlacePhotos(photoQueries, placesApiKey);
    mappedItinerary.forEach((day) => {
      day.blocks.forEach((b) => {
        if (isRealPlaceBlock(b)) {
          b.imageUrl = photoMap.get(`${b.title} ${destination}`);
        }
      });
    });
    destinationImageUrl = photoMap.get(destination);
  }

  // 5. Mapear desglose de presupuesto.
  // La comida se costea por la duración REAL del viaje (fechas), no por el nº de
  // entradas del itinerario: n8n puede devolver pocas para un viaje largo y antes
  // se infravaloraba (p. ej. 3 días en un viaje de 2 semanas).
  const travelersCount = originalPrefs.travelers.adults + originalPrefs.travelers.children;
  const tripDays = computeTripDays(originalPrefs, hotel) || mappedItinerary.length || 3;

  const flightsCost = costSummary.flights_usd || (mappedFlights.reduce((acc, f) => acc + f.price, 0) * travelersCount);
  const hotelCost = costSummary.hotel_usd || (hotel.total_usd || 0);
  const activitiesCost = costSummary.activities_usd || (mappedActivities.reduce((acc, a) => acc + a.price, 0) * travelersCount);
  // Transporte: cadena de fallback entre ciudades → local, pero SIN el "50 USD"
  // fijo de antes cuando no hay ningún dato real — eso presentaba un precio
  // inventado como si fuera detectado. Si no hay cifra real, queda `null` y la
  // UI muestra "No disponible" en vez de un número falso.
  const transportCost = costSummary.inter_city_transport_usd || costSummary.estimated_local_transport_usd || null;
  // Comida y extras: nunca vienen de ninguna búsqueda real (no hay API que las
  // consulte) — son una estimación de guía de viaje genérica. Se mantienen
  // porque omitirlas haría ver el total sospechosamente bajo, pero se marcan
  // en `estimatedFields` para que la UI las distinga de precios reales.
  const foodCost = 30 * travelersCount * tripDays;
  const extrasCost = 20 * travelersCount;
  const estimatedFields: BudgetBreakdown['estimatedFields'] = ['food', 'extras'];
  // El total se calcula SIEMPRE como la suma de los componentes mostrados para
  // que el desglose cuadre con el total. Antes se tomaba costSummary.total_usd,
  // que no incluía comida/extras/transporte y dejaba el desglose descuadrado.
  const totalCost = flightsCost + hotelCost + activitiesCost + (transportCost || 0) + foodCost + extrasCost;

  const budget: BudgetBreakdown = {
    flights: flightsCost,
    hotel: hotelCost,
    activities: activitiesCost,
    transport: transportCost,
    food: foodCost,
    extras: extrasCost,
    total: totalCost,
    estimatedFields
  };

  // 6. JustGo Score — antes 5 de sus 7 métricas eran constantes fijas (90,
  // 92, 90, 15/"Baja") para CUALQUIER viaje. Ahora cada una sale de una señal
  // real del propio plan; ninguna se inventa.
  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Precio: qué tan ajustado quedó el coste real frente al presupuesto real pedido.
  const budgetTotalUsd = costSummary.budget_total_usd || 0;
  const priceScore = budgetTotalUsd > 0
    ? Math.round(Math.max(0, Math.min(100, 100 - Math.max(0, ((totalCost - budgetTotalUsd) / budgetTotalUsd) * 100))))
    : 70;

  // Confort: valoración real del hotel encontrado (SerpAPI), no la categoría pedida.
  const hotelRatingForScore = mappedHotels[0]?.rating || 0;
  const comfortScore = hotelRatingForScore > 0 ? Math.round((hotelRatingForScore / 5) * 100) : 70;

  // Ubicación: distancia real (Haversine) entre el hotel y las actividades reales del plan.
  const hotelCoordForScore = mappedHotels[0] && typeof mappedHotels[0].lat === 'number' && typeof mappedHotels[0].lng === 'number'
    ? { lat: mappedHotels[0].lat, lng: mappedHotels[0].lng }
    : null;
  const activityCoordsForScore = rawActivities.filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number');
  let locationScore = 70;
  if (hotelCoordForScore && activityCoordsForScore.length > 0) {
    const avgDistKm = activityCoordsForScore.reduce(
      (sum, a) => sum + haversineKm(hotelCoordForScore.lat, hotelCoordForScore.lng, a.lat as number, a.lng as number),
      0
    ) / activityCoordsForScore.length;
    locationScore = Math.round(Math.max(30, Math.min(100, 100 - avgDistKm * 12)));
  }

  // Actividades: cobertura real encontrada vs el objetivo del propio plan (2/día útil).
  const idealActivitiesCount = Math.max(1, (tripDays - 2) * 2);
  const activitiesScore = Math.round(Math.min(100, (mappedActivities.length / idealActivitiesCount) * 100));

  // Fricción: escalas reales de los vuelos encontrados + hotel mal valorado.
  const totalStops = mappedFlights.reduce((acc, f) => acc + (f.stops || 0), 0);
  const frictionScore = Math.min(100, totalStops * 25 + (hotelRatingForScore > 0 && hotelRatingForScore < 3.5 ? 20 : 0));
  const frictionLabel: 'Baja' | 'Media' | 'Alta' = frictionScore <= 20 ? 'Baja' : frictionScore <= 50 ? 'Media' : 'Alta';

  const overallMatch = Math.round((priceScore + comfortScore + locationScore + activitiesScore + (100 - frictionScore)) / 5);

  const score = {
    overall_match: overallMatch,
    price_score: priceScore,
    comfort_score: comfortScore,
    location_score: locationScore,
    activities_score: activitiesScore,
    friction_score: frictionScore,
    friction_label: frictionLabel
  };

  // 7. Alternativas: antes se inventaba un destino distinto (Oporto/Roma) con
  // precio y match ficticios (total × 0.75 / × 1.4). No hay ninguna búsqueda
  // real detrás de esos números. El frontend ahora ofrece "más económico" /
  // "premium" como una búsqueda real (mismo destino, presupuesto ajustado) vía
  // el mismo mecanismo del botón "Reconstruir viaje" — no necesita datos aquí.
  const alternatives: TripData['alternatives'] = [];

  // 8. Clima real (Open-Meteo) anclado a la coordenada real del hotel. Si no
  // hay coordenada o la API falla, queda undefined — el hero no muestra nada
  // en vez de un "25°C Soleado" inventado.
  const climateAnchor = mappedHotels[0];
  const climate = climateAnchor && typeof climateAnchor.lat === 'number' && typeof climateAnchor.lng === 'number'
    ? await fetchClimateAverage(climateAnchor.lat, climateAnchor.lng, originalPrefs.dates.start, originalPrefs.dates.end)
    : null;

  return {
    trip_id: generatedId,
    // Identificador de sesión de n8n: presente SOLO en planes reales de n8n
    // (RUTA A/B). Es la señal de "plan refinable" en el frontend y la clave que
    // la RUTA B usa para cargar la sesión en memoria. En planes de fallback
    // (OpenAI/Claude/mock) n8n no interviene, así que queda undefined.
    session_id: data?.session_id,
    user_preferences: originalPrefs,
    justgo_score: score,
    best_option: {
      title: `Viaje personalizado a ${destination}`,
      destination: destination.toUpperCase(),
      summary: plan.plan_notes?.join('. ') || `Hemos seleccionado este itinerario a ${destination} por encajar óptimamente en tus fechas, ritmo de viaje y presupuesto.`,
      estimated_total: totalCost,
      currency: 'EUR',
      imageUrl: destinationImageUrl,
      why_selected: plan.plan_notes || [
        'Vuelo conveniente reservado para tus fechas',
        'Hotel con gran relación calidad-precio y notas excelentes',
        'Itinerario equilibrado combinando tus intereses'
      ],
      tradeoffs: [
        'Los horarios de vuelos están sujetos a disponibilidad de tarifa',
        'No incluye el transporte de equipaje facturado grande'
      ],
      ...(climate ? { climate } : {})
    },
    alternatives,
    flights: mappedFlights,
    hotels: mappedHotels,
    activities: mappedActivities,
    events: [],
    itinerary: mappedItinerary,
    budget,
    notices: (data?.warnings || [])
      .filter((w) => !w.requires_user_approval && w.detail)
      .map((w) => w.detail as string),
    share: {
      private_url: `/trip/${generatedId}`,
      pdf_enabled: true,
      calendar_enabled: true
    }
  };
}
