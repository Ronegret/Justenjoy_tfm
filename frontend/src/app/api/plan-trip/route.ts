import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import { mockTrips } from '@/data/mockTripData';
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

const SYSTEM_PROMPT = `
Eres el motor de orquestación de viajes de "JUST ENJOY". Tu tarea es actuar como un agente de viajes experto y automatizado, generando un itinerario completo, justificado y optimizado basado en las preferencias de viaje del usuario.
Debes devolver ÚNICAMENTE un objeto JSON estructurado que cumpla exactamente con la interfaz TypeScript 'TripData'. No agregues explicaciones fuera del JSON, no utilices bloques de código markdown (\`\`\`json ... \`\`\`), devuelve solo el objeto JSON puro listo para parsear. El JSON debe estar en español, usando un tono cercano, amable y natural, como un amigo experto en viajes ("compi de viaje").

La estructura JSON que debes devolver es la siguiente:
{
  "trip_id": "temp-id",
  "user_preferences": {
    "origin": "Ciudad de origen",
    "destination": "Ciudad de destino",
    "dates": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "flexible": boolean
    },
    "travelers": {
      "adults": number,
      "children": number
    },
    "budget": "low" | "balanced" | "premium" | "luxury",
    "style": ["estilos"],
    "pace": "relax" | "medium" | "intense" | "all",
    "restrictions": ["filtros"]
  },
  "justgo_score": {
    "overall_match": number (un valor entre 0 y 100 de coincidencia total basado en el perfil),
    "price_score": number (0-100),
    "comfort_score": number (0-100),
    "location_score": number (0-100),
    "activities_score": number (0-100),
    "friction_score": number (0-100),
    "friction_label": "Baja" | "Media" | "Alta"
  },
  "best_option": {
    "title": "Título del viaje sugerente (ej: Escapada Gastronómica a Lisboa)",
    "destination": "Nombre del destino en mayúscula",
    "summary": "Resumen justificado de por qué este viaje encaja con sus preferencias en base a la IA",
    "estimated_total": number (coste total estimado en euros, ej: 450),
    "currency": "EUR",
    "why_selected": [
      "Factor decisivo 1 (ej: Vuelo directo desde BCN)",
      "Factor decisivo 2 (ej: Hotel céntrico con excelente nota)",
      "Factor decisivo 3 (ej: Actividades culturales incluidas sin coste adicional)"
    ],
    "tradeoffs": [
      "Compromiso asumido 1 (ej: Vuelo de vuelta a las 06:40)",
      "Compromiso asumido 2 (ej: No incluye maleta facturada grande)"
    ]
  },
  "alternatives": [
    {
      "type": "cheapest",
      "destination": "Destino alternativo más barato",
      "match": number (0-100),
      "estimated_total": number (coste estimado menor),
      "reason": "Explicación de por qué es la opción económica viable"
    },
    {
      "type": "premium",
      "destination": "Destino alternativo de mayor comodidad o coste",
      "match": number (0-100),
      "estimated_total": number (coste estimado mayor),
      "reason": "Explicación de por qué es la opción premium"
    }
  ],
  "flights": [
    {
      "provider": "Aerolínea real (ej: Vueling, Iberia, Air Europa)",
      "airline": "Nombre aerolínea",
      "from": "IATA de origen (ej: BCN)",
      "to": "IATA de destino (ej: LIS)",
      "departure": "Hora de salida real sugerida (ej: 09:15)",
      "arrival": "Hora de llegada real sugerida (ej: 10:10)",
      "duration": "Duración de vuelo (ej: 1h 55m)",
      "stops": number (0 para directo),
      "price": number (precio estimado por persona),
      "baggage": "Detalle de equipaje (ej: Maleta de cabina de 10kg incluida)",
      "booking_url": "https://www.google.com/travel/flights"
    }
  ],
  "hotels": [
    {
      "provider": "Booking.com",
      "name": "Nombre de un hotel real en el destino que encaje con el presupuesto (ej: Hotel Rossio Plaza)",
      "area": "Barrio o área del hotel (ej: Baixa-Chiado)",
      "rating": number (escala 1.0 a 5.0, ej: 4.6),
      "price_per_night": number,
      "total_price": number (coste total de la estancia para todos los días y huéspedes),
      "pros": [
        "A 150m de la plaza principal",
        "Desayuno buffet incluido"
      ],
      "cons": [
        "Calle con ruido moderado de tranvía"
      ],
      "booking_url": "https://www.booking.com"
    }
  ],
  "activities": [
    {
      "provider": "Civitatis",
      "name": "Actividad sugerida 1 real (ej: Tour a Sintra y Quinta da Regaleira)",
      "category": "Cultura" | "Playa" | "Gastronomía" | "Aventura" | "Naturaleza",
      "price": number (precio por persona, 0 si es libre),
      "duration": "Duración (ej: 4h 30m)",
      "requires_booking": boolean,
      "opening_hours": "Horario (ej: 09:00 - 18:00)",
      "best_time": "Mejor hora (ej: 10:00 AM para evitar colas)",
      "booking_url": "https://www.civitatis.com",
      "why": "Por qué se ha elegido en base a sus estilos"
    }
  ],
  "events": [
    {
      "provider": "Ticketmaster / Local",
      "name": "Un mercado o evento local sugerido (ej: Fado en vivo en Alfama)",
      "date": "Fecha del evento",
      "time": "Hora",
      "price_from": number,
      "venue": "Nombre del local o lugar",
      "url": "#"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "Fecha formateada (ej: 15 de Mayo)",
      "title": "Título del Día 1",
      "summary": "Resumen breve del plan diario",
      "blocks": [
        {
          "time": "Hora (ej: 09:30)",
          "period": "Mañana" | "Mediodía" | "Tarde" | "Noche",
          "title": "Actividad o parada (ej: Desayuno en Pastelería local)",
          "type": "flight" | "food" | "activity" | "hotel" | "transit" | "rest",
          "duration": "Duración (ej: 1h)",
          "cost": number (precio estimado por persona),
          "location": "Lugar específico",
          "description": "Explicación detallada y animada de lo que hará el usuario en este momento.",
          "tip": "Consejo útil opcional",
          "alternative": "Actividad opcional secundaria"
        }
      ]
    }
  ],
  "budget": {
    "flights": number (total vuelos para todos los viajeros),
    "hotel": number (total hotel),
    "activities": number (total actividades estimadas),
    "transport": number (total transporte local),
    "food": number (total comidas estimadas),
    "extras": number (imprevistos),
    "total": number (suma total de todos los campos anteriores)
  },
  "share": {
    "private_url": "/trip/temp-id",
    "pdf_enabled": true,
    "calendar_enabled": true
  }
}

Investiga y sugiere opciones de vuelos, hoteles, monumentos, restaurantes y actividades REALES y congruentes con el destino indicado por el usuario. Ajusta el presupuesto total para que encaje con el tipo de presupuesto (low = hostel/vuelos low-cost, balanced = hotel 3 estrellas/vuelos directos normales, premium = hotel 4 estrellas/vuelos en horarios cómodos, luxury = hotel 5 estrellas/transporte privado).
`;

/**
 * Mapea las preferencias del frontend (TripPreferences) al formato de entrada
 * esperado por el orquestador n8n (input-formulario.json).
 */
function mapPreferencesToN8n(prefs: TripPreferences) {
  const start = new Date(prefs.dates.start);
  const end = new Date(prefs.dates.end);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalTravelers = (prefs.travelers.adults || 1) + (prefs.travelers.children || 0);

  let dailyRate = 150;
  if (prefs.budget === 'low') dailyRate = 80;
  else if (prefs.budget === 'balanced') dailyRate = 150;
  else if (prefs.budget === 'premium') dailyRate = 300;
  else if (prefs.budget === 'luxury') dailyRate = 600;

  const budget_total_usd = days * totalTravelers * dailyRate;

  let accommodation_type: 'budget' | 'mid-range' | 'luxury' = 'mid-range';
  if (prefs.budget === 'low') accommodation_type = 'budget';
  else if (prefs.budget === 'premium' || prefs.budget === 'luxury') accommodation_type = 'luxury';

  let hotel_location_preference = 'any';
  if (prefs.restrictions.includes('central_hotel')) {
    hotel_location_preference = 'city center';
  }

  const childrenAges = Array.from({ length: prefs.travelers.children || 0 }, () => 10);

  return {
    origin_city: prefs.origin || 'Barcelona',
    destination_city: [prefs.destination || 'Lisboa'],
    departure_date: prefs.dates.start,
    return_date: prefs.dates.end,
    travelers: {
      adults: prefs.travelers.adults || 1,
      children: childrenAges
    },
    budget_total_usd,
    accommodation_type,
    flight_preferences: {
      cabin_class: prefs.budget === 'luxury' || prefs.budget === 'premium' ? 'business' : 'economy',
      max_layover_hours: prefs.restrictions.includes('avoid_scales') ? 2 : 8,
      preferred_airlines: []
    },
    activity_interests: prefs.style || ['culture', 'food'],
    special_requirements: prefs.restrictions.length > 0 ? prefs.restrictions.join(', ') : 'ninguno',
    flexible_dates: prefs.dates.flexible || false,
    hotel_location_preference,
    car_rental_needed: false
  };
}

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

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Esquema (parcial) de la respuesta de n8n que consume el mapper. Todos los
// campos son opcionales: n8n puede omitirlos y el mapper aplica defaults.
interface N8nFlightLeg {
  airline?: string;
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
}

interface N8nCostSummary {
  flights_usd?: number;
  hotel_usd?: number;
  activities_usd?: number;
  inter_city_transport_usd?: number;
  estimated_local_transport_usd?: number;
  total_usd?: number;
}

interface N8nSegment {
  destination?: string;
  origin?: string;
  flights?: { outbound?: N8nFlightLeg; return?: N8nFlightLeg };
  hotel?: N8nHotel;
  activities?: N8nActivity[];
}

interface N8nResponse {
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
 * Determina si la respuesta de n8n NO es un plan utilizable. Se corta cuando n8n
 * pide intervención (`needs_user_input`) o cuando el plan viene vacío (sin vuelo
 * de ida, sin hotel y sin itinerario). En ese caso el frontend debe mostrar los
 * `warnings` reales en vez de rellenar con defaults y fingir un viaje.
 */
function isUnusableN8nPlan(rawData: N8nResponse): boolean {
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
async function mapN8nToTripData(n8nResponse: N8nResponse | N8nResponse[], originalPrefs: TripPreferences): Promise<TripData> {
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
    const outboundDate = flights.outbound.departure_datetime?.split('T')[0] || originalPrefs.dates?.start || '';
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.outbound.airline || 'Aerolínea',
      from: outboundOrigin,
      to: outboundDest,
      departure: flights.outbound.departure_datetime ? flights.outbound.departure_datetime.split('T')[1]?.substring(0, 5) || '09:00' : '09:00',
      arrival: flights.outbound.arrival_datetime ? flights.outbound.arrival_datetime.split('T')[1]?.substring(0, 5) || '11:00' : '11:00',
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
    const returnDate = flights.return.departure_datetime?.split('T')[0] || originalPrefs.dates?.end || '';
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.return.airline || 'Aerolínea',
      from: returnOrigin,
      to: returnDest,
      departure: flights.return.departure_datetime ? flights.return.departure_datetime.split('T')[1]?.substring(0, 5) || '15:00' : '15:00',
      arrival: flights.return.arrival_datetime ? flights.return.arrival_datetime.split('T')[1]?.substring(0, 5) || '17:00' : '17:00',
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
    mappedHotels.push({
      provider: 'Booking.com',
      name: hotel.name,
      area: hotel.address && !isGpsCoordinates(hotel.address) ? hotel.address : `Centro de ${destination}`,
      rating: hotel.rating || 4.5,
      price_per_night: hotel.price_per_night_usd || 100,
      total_price: hotel.total_usd || 300,
      pros: [
        'Excelente ubicación en la zona',
        'Puntuación de usuarios de ' + (hotel.rating || '4.5') + '/5'
      ],
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
    mappedHotels.push({
      provider: 'Booking.com',
      name: `Hotel Recomendado en ${destination}`,
      area: 'Centro Histórico',
      rating: 4.2,
      price_per_night: 95,
      total_price: 285,
      pros: ['Cerca de transporte público', 'Desayuno opcional disponible'],
      cons: ['Habitaciones estándar'],
      booking_url: 'https://www.booking.com'
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
    opening_hours: '09:00 - 18:00',
    best_time: act.start_time || '10:00',
    // Si no hay link.website real, buscar el lugar en Google Maps en vez de
    // abrir la home genérica de Maps sin ninguna búsqueda aplicada.
    booking_url: act.booking_url || buildGoogleMapsSearchUrl(act.name || 'actividad', destination),
    why: `Seleccionada especialmente por encajar en tu perfil de viaje.`
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
  const placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (placesApiKey && placesApiKey !== 'changeme') {
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
  // Cadena de fallback: transporte entre ciudades → transporte local → default.
  // Se mantiene || (no ??) porque aquí un 0 significa "no aplica, prueba el siguiente".
  const transportCost = costSummary.inter_city_transport_usd || costSummary.estimated_local_transport_usd || 50;
  const foodCost = 30 * travelersCount * tripDays;
  const extrasCost = 20 * travelersCount;
  // El total se calcula SIEMPRE como la suma de los componentes mostrados para
  // que el desglose cuadre con el total. Antes se tomaba costSummary.total_usd,
  // que no incluía comida/extras/transporte y dejaba el desglose descuadrado.
  const totalCost = flightsCost + hotelCost + activitiesCost + transportCost + foodCost + extrasCost;

  const budget: BudgetBreakdown = {
    flights: flightsCost,
    hotel: hotelCost,
    activities: activitiesCost,
    transport: transportCost,
    food: foodCost,
    extras: extrasCost,
    total: totalCost
  };

  // 6. Mapear puntuación Just Enjoy
  const score = {
    overall_match: 90,
    price_score: originalPrefs.budget === 'low' ? 95 : 88,
    comfort_score: originalPrefs.pace === 'relax' ? 95 : 85,
    location_score: 92,
    activities_score: 90,
    friction_score: 15,
    friction_label: 'Baja' as const
  };

  // 7. Generar alternativas de viaje visuales
  const alternatives = [
    {
      type: 'cheapest' as const,
      destination: originalPrefs.budget === 'low' ? 'Oporto' : 'Lisboa',
      match: 86,
      estimated_total: Math.round(totalCost * 0.75),
      reason: 'Alternativa más económica optimizando vuelos y estancia básica.'
    },
    {
      type: 'premium' as const,
      destination: originalPrefs.budget === 'premium' ? 'París' : 'Roma',
      match: 89,
      estimated_total: Math.round(totalCost * 1.4),
      reason: 'Alternativa de confort superior con mejores alojamientos históricos.'
    }
  ];

  return {
    trip_id: generatedId,
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
      ]
    },
    alternatives,
    flights: mappedFlights,
    hotels: mappedHotels,
    activities: mappedActivities,
    events: [],
    itinerary: mappedItinerary,
    budget,
    share: {
      private_url: `/trip/${generatedId}`,
      pdf_enabled: true,
      calendar_enabled: true
    }
  };
}

export async function POST(req: NextRequest) {
  // Autenticación obligatoria: cierra la API abierta y el vector de coste
  // (llamadas anónimas a LLM/n8n). Verificación autoritativa con Admin SDK.
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error('[plan-trip] Firebase Admin no configurado; rechazando petición');
    return NextResponse.json(
      { error: 'Servicio no disponible' },
      { status: 503 }
    );
  }
  const session = req.cookies.get('justenjoy-session');
  if (!session?.value) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  try {
    await adminAuth.verifySessionCookie(session.value, true);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  try {
    const body: TripPreferences = await req.json();
    const { destination, budget } = body;

    console.log('Received travel preferences for Just Enjoy API:', body);

    // -------------------------------------------------------------------------
    // 1. INTENTAR LLAMADA A WEBHOOK DE N8N (Si está configurada)
    // -------------------------------------------------------------------------
    if (process.env.N8N_WEBHOOK_URL) {
      console.log('Forwarding request to n8n webhook:', process.env.N8N_WEBHOOK_URL);
      const n8nInputBody = mapPreferencesToN8n(body);
      console.log('Mapped input for n8n:', n8nInputBody);

      // Reintenta antes de degradar al respaldo de OpenAI directo (sin n8n),
      // que no lleva coordenadas, links de reserva reales ni fotos: un fallo
      // transitorio de n8n (p. ej. rate limit de OpenAI dentro del workflow,
      // que devuelve 200 con cuerpo vacío) NO debe tirar toda la experiencia
      // completa por la borda. El propio error de OpenAI indica que se
      // resuelve en segundos, así que un reintento corto suele bastar.
      const maxAttempts = 2;
      const retryDelayMs = 20000;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nInputBody),
          });

          if (response.ok) {
            const rawText = await response.text();
            if (!rawText) {
              throw new Error('n8n devolvió un cuerpo vacío (probable fallo interno transitorio)');
            }
            const n8nData = JSON.parse(rawText);
            console.log('Trip successfully orchestrated by n8n. Response received.');

            // Detectar si la respuesta viene con el esquema oficial de n8n o es directa
            const rawData = Array.isArray(n8nData) ? n8nData[0] : n8nData;
            if (rawData && (rawData.plan || rawData.status)) {
              // Si n8n no pudo completar el plan (p. ej. sin vuelos), NO fingimos un
              // viaje con defaults: devolvemos su señal y sus avisos para que el
              // frontend los muestre y el usuario ajuste la entrada.
              if (isUnusableN8nPlan(rawData)) {
                console.warn('n8n devolvió un plan no utilizable (needs_user_input / vacío). Propagando warnings.');
                const warnings: N8nWarning[] = Array.isArray(rawData.warnings) ? rawData.warnings : [];
                return NextResponse.json({ status: 'needs_user_input', warnings });
              }
              console.log('Detected n8n G7 workflow schema. Mapping to TripData...');
              const mappedData = await mapN8nToTripData(n8nData, body);
              return NextResponse.json(mappedData);
            } else {
              console.log('n8n response does not match G7 schema; returning directly as TripData.');
              return NextResponse.json(n8nData);
            }
          } else {
            throw new Error(`n8n webhook error: ${response.statusText}`);
          }
        } catch (e: unknown) {
          const isLastAttempt = attempt === maxAttempts;
          console.warn(
            `n8n webhook attempt ${attempt}/${maxAttempts} failed: ${getErrorMessage(e)}.` +
            (isLastAttempt ? ' Trying direct LLM API...' : ` Reintentando en ${retryDelayMs / 1000}s...`)
          );
          if (!isLastAttempt) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. INTENTAR INTEGRACIÓN DIRECTA CON OPENAI (Si está configurado)
    // -------------------------------------------------------------------------
    if (process.env.OPENAI_API_KEY) {
      console.log('Generating travel itinerary via OpenAI (GPT-4o-mini)...');
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            temperature: 0.7,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Genera un viaje completo con las siguientes preferencias del usuario: ${JSON.stringify(body)}` }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          let responseText = result.choices[0]?.message?.content || '';

          if (responseText.includes('```')) {
            responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          }

          const tripData = JSON.parse(responseText);

          // Inyectar ID personalizado
          const generatedId = `justenjoy-${(tripData.best_option?.destination || destination || 'viaje').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          tripData.trip_id = generatedId;
          tripData.user_preferences = {
            ...body,
            destination: tripData.best_option?.destination || destination
          };
          if (tripData.share) {
            tripData.share.private_url = `/trip/${generatedId}`;
          }

          console.log('Itinerary successfully generated by OpenAI API.');
          return NextResponse.json(tripData);
        } else {
          const errText = await response.text();
          console.warn(`OpenAI API returned error: ${response.status} - ${errText}. Trying Claude API...`);
        }
      } catch (e: unknown) {
        console.warn('Failed to request itinerary from OpenAI:', getErrorMessage(e));
      }
    }

    // -------------------------------------------------------------------------
    // 3. INTENTAR INTEGRACIÓN DIRECTA CON ANTHROPIC CLAUDE (Si está configurado)
    // -------------------------------------------------------------------------
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Generating travel itinerary via Anthropic Claude (Claude 3.5 Sonnet)...');
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: 0.7,
            messages: [
              {
                role: 'user',
                content: `${SYSTEM_PROMPT}\n\nGenera un viaje completo con las siguientes preferencias. Recuerda responder únicamente con el objeto JSON puro solicitado: ${JSON.stringify(body)}`
              }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          let responseText = result.content[0]?.text || '';

          if (responseText.includes('```')) {
            responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          }

          const tripData = JSON.parse(responseText);

          // Inyectar ID personalizado
          const generatedId = `justenjoy-${(tripData.best_option?.destination || destination || 'viaje').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          tripData.trip_id = generatedId;
          tripData.user_preferences = {
            ...body,
            destination: tripData.best_option?.destination || destination
          };
          if (tripData.share) {
            tripData.share.private_url = `/trip/${generatedId}`;
          }

          console.log('Itinerary successfully generated by Anthropic Claude API.');
          return NextResponse.json(tripData);
        } else {
          const errText = await response.text();
          console.warn(`Anthropic API returned error: ${response.status} - ${errText}. Trying mock fallback...`);
        }
      } catch (e: unknown) {
        console.warn('Failed to request itinerary from Anthropic Claude:', getErrorMessage(e));
      }
    }

    // -------------------------------------------------------------------------
    // 4. FALLBACK GENERAL: SELECCIÓN DE PLANTILLAS MOCK (Si nada de lo anterior está configurado)
    // -------------------------------------------------------------------------
    console.log('Using local offline mock templates fallback.');
    let selectedTripId = 'justenjoy-lisbon-2026';
    const destClean = (destination || '').toLowerCase();

    if (destClean.includes('porto') || destClean.includes('oport') || budget === 'low') {
      selectedTripId = 'justenjoy-oporto-cheapest';
    } else if (destClean.includes('roma') || destClean.includes('rome') || budget === 'premium' || budget === 'luxury') {
      selectedTripId = 'justenjoy-roma-premium';
    }

    const tripData = mockTrips[selectedTripId];

    if (!tripData) {
      return NextResponse.json(
        { error: 'No se encontró una plantilla de viaje adecuada para esta simulación.' },
        { status: 404 }
      );
    }

    const generatedId = `justenjoy-${tripData.best_option.destination.toLowerCase()}-${Date.now()}`;
    const customizedTrip = {
      ...tripData,
      trip_id: generatedId,
      user_preferences: {
        ...tripData.user_preferences,
        ...body,
        destination: tripData.best_option.destination
      },
      share: {
        ...tripData.share,
        private_url: `/trip/${generatedId}`
      }
    };

    return NextResponse.json(customizedTrip);
  } catch (error: unknown) {
    console.error('Error in plan-trip API route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el viaje.', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
