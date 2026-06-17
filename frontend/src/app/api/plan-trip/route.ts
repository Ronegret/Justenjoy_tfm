import { NextRequest, NextResponse } from 'next/server';
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
      max_layover_hours: prefs.restrictions.includes('avoid_early_flights') ? 2 : 5,
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
 * Mapea la respuesta generada por n8n (output-plan.json) a la interfaz
 * TripData requerida por la interfaz gráfica del frontend.
 */
function mapN8nToTripData(n8nResponse: any, originalPrefs: TripPreferences): TripData {
  const data = Array.isArray(n8nResponse) ? n8nResponse[0] : n8nResponse;

  const plan = data?.plan || {};
  const segment = plan?.segments?.[0] || {};
  const flights = segment?.flights || {};
  const hotel = segment?.hotel || {};
  const costSummary = plan?.cost_summary || {};

  const destination = segment?.destination || originalPrefs.destination || 'Viaje';
  const generatedId = data?.session_id || `justenjoy-${destination.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

  // 1. Mapear vuelos
  const mappedFlights: Flight[] = [];
  if (flights.outbound) {
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.outbound.airline || 'Aerolínea',
      from: flights.outbound.origin || originalPrefs.origin,
      to: flights.outbound.destination || destination,
      departure: flights.outbound.departure_datetime ? flights.outbound.departure_datetime.split('T')[1]?.substring(0, 5) || '09:00' : '09:00',
      arrival: flights.outbound.arrival_datetime ? flights.outbound.arrival_datetime.split('T')[1]?.substring(0, 5) || '11:00' : '11:00',
      duration: flights.outbound.duration || '2h',
      stops: Array.isArray(flights.outbound.layovers) ? flights.outbound.layovers.length : 0,
      price: flights.outbound.price_usd || 150,
      baggage: 'Maleta de cabina de 10kg incluida',
      booking_url: flights.outbound.booking_url || 'https://www.google.com/travel/flights'
    });
  }
  if (flights.return) {
    mappedFlights.push({
      provider: 'SerpAPI Google Flights',
      airline: flights.return.airline || 'Aerolínea',
      from: flights.return.origin || destination,
      to: flights.return.destination || originalPrefs.origin,
      departure: flights.return.departure_datetime ? flights.return.departure_datetime.split('T')[1]?.substring(0, 5) || '15:00' : '15:00',
      arrival: flights.return.arrival_datetime ? flights.return.arrival_datetime.split('T')[1]?.substring(0, 5) || '17:00' : '17:00',
      duration: flights.return.duration || '2h',
      stops: Array.isArray(flights.return.layovers) ? flights.return.layovers.length : 0,
      price: flights.return.price_usd || 150,
      baggage: 'Maleta de cabina de 10kg incluida',
      booking_url: flights.return.booking_url || 'https://www.google.com/travel/flights'
    });
  }

  // 2. Mapear hoteles
  const mappedHotels: Hotel[] = [];
  if (hotel.name) {
    mappedHotels.push({
      provider: 'Booking.com',
      name: hotel.name,
      area: hotel.address || 'Centro',
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
      booking_url: hotel.booking_url || 'https://www.booking.com'
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
  const mappedActivities: Activity[] = rawActivities.map((act: any) => ({
    provider: act.source || 'Google Maps',
    name: act.name || 'Actividad sugerida',
    category: act.category || 'Cultura',
    price: act.price_usd || 0,
    duration: act.duration_hours ? `${act.duration_hours}h` : '3h',
    requires_booking: !!act.booking_url,
    opening_hours: '09:00 - 18:00',
    best_time: act.start_time || '10:00',
    booking_url: act.booking_url || 'https://www.google.com/maps',
    why: `Seleccionada especialmente por encajar en tu perfil de viaje.`
  }));

  // 4. Mapear itinerario diario
  const rawItinerary = plan.daily_itinerary || [];
  const mappedItinerary: DayPlan[] = rawItinerary.map((dayPlan: any) => {
    const dayActivities = dayPlan.activities || [];

    const blocks: ItineraryBlock[] = dayActivities.map((act: any) => {
      const timeStr = act.time || '10:00';
      const hr = parseInt(timeStr.split(':')[0]) || 10;
      let period: 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche' = 'Mañana';
      if (hr >= 12 && hr < 15) period = 'Mediodía';
      else if (hr >= 15 && hr < 20) period = 'Tarde';
      else if (hr >= 20) period = 'Noche';

      return {
        time: timeStr,
        period,
        title: act.name,
        type: (act.category || '').toLowerCase().includes('restaurant') || (act.category || '').toLowerCase().includes('food') ? 'food' : 'activity',
        duration: act.duration_hours ? `${act.duration_hours}h` : '2h',
        cost: act.price_usd || 0,
        location: act.name,
        description: `Visita recomendada a ${act.name}.`,
        tip: act.booking_url ? 'Se aconseja reservar online con antelación.' : undefined
      };
    });

    // Relleno si no hay bloques de actividad ese día
    if (blocks.length === 0) {
      if (dayPlan.day === 1) {
        blocks.push({
          time: '15:00',
          period: 'Tarde',
          title: 'Registro en el alojamiento',
          type: 'hotel',
          duration: '1h',
          cost: 0,
          location: hotel.name || 'Alojamiento',
          description: 'Llegada y check-in en tu hotel para dejar el equipaje y descansar.'
        });
      } else if (dayPlan.day === rawItinerary.length) {
        blocks.push({
          time: '11:00',
          period: 'Mañana',
          title: 'Check-out y traslado al aeropuerto',
          type: 'transit',
          duration: '2h',
          cost: 0,
          location: hotel.name || 'Alojamiento',
          description: 'Registro de salida en el alojamiento y viaje hacia el aeropuerto para tu vuelo de regreso.'
        });
      } else {
        blocks.push({
          time: '10:00',
          period: 'Mañana',
          title: 'Explorar la ciudad',
          type: 'activity',
          duration: '4h',
          cost: 0,
          location: destination,
          description: 'Día libre sugerido para pasear por los rincones más bonitos del destino.'
        });
      }
    }

    return {
      day: dayPlan.day,
      date: dayPlan.date || '',
      title: dayPlan.title || `Día ${dayPlan.day}`,
      summary: dayPlan.summary || 'Jornada libre en el destino.',
      blocks
    };
  });

  // 5. Mapear desglose de presupuesto
  const daysCount = mappedItinerary.length || 3;
  const travelersCount = originalPrefs.travelers.adults + originalPrefs.travelers.children;

  const flightsCost = costSummary.flights_usd || (mappedFlights.reduce((acc, f) => acc + f.price, 0) * travelersCount);
  const hotelCost = costSummary.hotel_usd || (hotel.total_usd || 0);
  const activitiesCost = costSummary.activities_usd || (mappedActivities.reduce((acc, a) => acc + a.price, 0) * travelersCount);
  const transportCost = costSummary.inter_city_transport_usd || costSummary.estimated_local_transport_usd || 50;
  const foodCost = 30 * travelersCount * daysCount;
  const extrasCost = 20 * travelersCount;
  const totalCost = costSummary.total_usd || (flightsCost + hotelCost + activitiesCost + transportCost + foodCost + extrasCost);

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
  try {
    const body: TripPreferences = await req.json();
    const { destination, budget } = body;

    console.log('Received travel preferences for Just Enjoy API:', body);

    // -------------------------------------------------------------------------
    // 1. INTENTAR LLAMADA A WEBHOOK DE N8N (Si está configurada)
    // -------------------------------------------------------------------------
    if (process.env.N8N_WEBHOOK_URL) {
      console.log('Forwarding request to n8n webhook:', process.env.N8N_WEBHOOK_URL);
      try {
        // Mapear los datos de entrada al formato de n8n
        const n8nInputBody = mapPreferencesToN8n(body);
        console.log('Mapped input for n8n:', n8nInputBody);

        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nInputBody),
        });

        if (response.ok) {
          const n8nData = await response.json();
          console.log('Trip successfully orchestrated by n8n. Response received.');

          // Detectar si la respuesta viene con el esquema oficial de n8n o es directa
          const rawData = Array.isArray(n8nData) ? n8nData[0] : n8nData;
          if (rawData && (rawData.plan || rawData.status)) {
            console.log('Detected n8n G7 workflow schema. Mapping to TripData...');
            const mappedData = mapN8nToTripData(n8nData, body);
            return NextResponse.json(mappedData);
          } else {
            console.log('n8n response does not match G7 schema; returning directly as TripData.');
            return NextResponse.json(n8nData);
          }
        } else {
          console.warn(`n8n webhook error: ${response.statusText}. Trying direct LLM API...`);
        }
      } catch (e: any) {
        console.warn('Failed to contact n8n webhook, trying direct LLM API:', e.message);
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
      } catch (e: any) {
        console.warn('Failed to request itinerary from OpenAI:', e.message);
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
      } catch (e: any) {
        console.warn('Failed to request itinerary from Anthropic Claude:', e.message);
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
  } catch (error: any) {
    console.error('Error in plan-trip API route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el viaje.', details: error.message },
      { status: 500 }
    );
  }
}
