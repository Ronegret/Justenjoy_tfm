import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/requireSession';
import { withRefineToken } from '@/lib/refineToken';
import { mockTrips } from '@/data/mockTripData';
import { TripPreferences } from '@/types/trip';
import { holderToN8nPayload } from '@/lib/holder';
// Mapeo n8n → TripData: extraído a lib para compartirlo con /api/refine-trip
// (la RUTA B de n8n devuelve el mismo esquema). Ver src/lib/n8nPlan.ts.
import { isUnusableN8nPlan, mapN8nToTripData, getErrorMessage, ensureWarnings } from '@/lib/n8nPlan';

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
// Evita volcar PII del titular (`holder`: nombre, teléfono, email) a los logs del
// servidor. Devuelve una copia superficial con `holder` redactado si viene.
function redactHolderForLog(obj: unknown): unknown {
  if (obj && typeof obj === 'object' && 'holder' in obj && (obj as { holder?: unknown }).holder) {
    return { ...(obj as Record<string, unknown>), holder: '[REDACTADO]' };
  }
  return obj;
}

function mapPreferencesToN8n(prefs: TripPreferences) {
  const start = new Date(prefs.dates.start);
  const end = new Date(prefs.dates.end);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalTravelers = (prefs.travelers.adults || 1) + (prefs.travelers.children || 0);

  // `budgetAmountUsd` es el monto real que el usuario fija con el slider del
  // wizard: es la fuente de verdad. El cálculo por tarifa/día de abajo es solo
  // un fallback defensivo por si llega una preferencia antigua sin ese campo
  // (nunca debería pasar desde el wizard actual, pero evita un total de 0).
  let dailyRate = 150;
  if (prefs.budget === 'low') dailyRate = 80;
  else if (prefs.budget === 'balanced') dailyRate = 150;
  else if (prefs.budget === 'premium') dailyRate = 300;
  else if (prefs.budget === 'luxury') dailyRate = 600;

  const budget_total_usd = prefs.budgetAmountUsd && prefs.budgetAmountUsd > 0
    ? prefs.budgetAmountUsd
    : days * totalTravelers * dailyRate;

  let accommodation_type: 'budget' | 'mid-range' | 'luxury' = 'mid-range';
  if (prefs.budget === 'low') accommodation_type = 'budget';
  else if (prefs.budget === 'premium' || prefs.budget === 'luxury') accommodation_type = 'luxury';

  let hotel_location_preference = 'any';
  if (prefs.restrictions.includes('central_hotel')) {
    hotel_location_preference = 'city center';
  }

  const childrenAges = Array.from({ length: prefs.travelers.children || 0 }, () => 10);

  // Titular/cliente (opcional): se mapea a snake_case (recortado, o undefined si
  // no hay datos) con el helper compartido, para que el criterio de "hay titular"
  // sea idéntico al de la captura y la visualización. n8n lo arrastra hasta la
  // tabla `plan_holders`; el planificador no lo usa.
  const holder = holderToN8nPayload(prefs.holder);

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
    // Sin intereses no forzamos una preselección en la UI (el usuario debe elegir
    // libremente), pero si de verdad no marcó nada, mandamos un fallback genérico
    // en inglés para que el motor tenga algo con que buscar actividades.
    activity_interests: prefs.style.length > 0 ? prefs.style : ['culture', 'food'],
    special_requirements: prefs.restrictions.length > 0 ? prefs.restrictions.join(', ') : 'ninguno',
    flexible_dates: prefs.dates.flexible || false,
    hotel_location_preference,
    car_rental_needed: false,
    ...(holder ? { holder } : {})
  };
}

export async function POST(req: NextRequest) {
  // Autenticación obligatoria: cierra la API abierta y el vector de coste
  // (llamadas anónimas a LLM/n8n). Gate compartido con /api/refine-trip.
  const session = await requireSession(req, 'plan-trip');
  if (session.error) return session.error;

  try {
    const body: TripPreferences = await req.json();
    const { destination, budget } = body;

    console.log('Received travel preferences for Just Enjoy API:', redactHolderForLog(body));

    // El titular (`holder`) es PII de contacto del lead y NO interviene en generar
    // el plan: solo se persiste en `plan_holders` (rama n8n, con consentimiento).
    // Los respaldos directos a LLM (OpenAI/Anthropic) reciben este cuerpo saneado,
    // para no filtrar nombre/teléfono/email a terceros ni saltarse el gate de
    // consentimiento (que solo cubre la rama n8n vía holderToN8nPayload).
    const bodyForLlm = { ...body };
    delete (bodyForLlm as Partial<TripPreferences>).holder;

    // -------------------------------------------------------------------------
    // 1. INTENTAR LLAMADA A WEBHOOK DE N8N (Si está configurada)
    // -------------------------------------------------------------------------
    if (process.env.N8N_WEBHOOK_URL) {
      console.log('Forwarding request to n8n webhook:', process.env.N8N_WEBHOOK_URL);
      const n8nInputBody = mapPreferencesToN8n(body);
      console.log('Mapped input for n8n:', redactHolderForLog(n8nInputBody));

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
                // n8n puede cortar con status "error" y warnings vacío: p. ej. el
                // motor planificador devuelve JSON truncado en viajes largos (la
                // salida del LLM excede su límite de tokens y el parser la rechaza).
                // Sin un aviso legible, el planner pinta la cabecera de error pero
                // una lista vacía ("error en blanco"). ensureWarnings garantiza al
                // menos un aviso accionable según el tipo de fallo.
                const warnings = ensureWarnings(
                  rawData.warnings,
                  rawData.status === 'error'
                    ? {
                        type: 'plan_generation_failed',
                        detail: 'No hemos podido generar el plan completo para este viaje. Suele ocurrir en viajes de muchos días.',
                        proposed_change: 'Prueba con menos días o divide el viaje en tramos más cortos y vuelve a intentarlo.'
                      }
                    : {
                        type: 'incomplete_plan',
                        detail: 'No hemos podido completar el plan con los datos indicados.',
                        proposed_change: 'Revisa el origen, el destino y las fechas, y vuelve a intentarlo.'
                      }
                );
                console.warn(`n8n devolvió un plan no utilizable (status=${rawData.status}). Propagando ${warnings.length} aviso(s).`);
                return NextResponse.json({ status: 'needs_user_input', warnings });
              }
              console.log('Detected n8n G7 workflow schema. Mapping to TripData...');
              const mappedData = await mapN8nToTripData(n8nData, body);
              // Se firma (uid, session_id) para que /api/refine-trip pueda
              // comprobar que quien refina es el dueño del plan. Solo los planes
              // de n8n llevan session_id; los de fallback salen sin token.
              return NextResponse.json(withRefineToken(mappedData, session.uid));
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
              { role: 'user', content: `Genera un viaje completo con las siguientes preferencias del usuario: ${JSON.stringify(bodyForLlm)}` }
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
                content: `${SYSTEM_PROMPT}\n\nGenera un viaje completo con las siguientes preferencias. Recuerda responder únicamente con el objeto JSON puro solicitado: ${JSON.stringify(bodyForLlm)}`
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
