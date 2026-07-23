const raw = $input.first().json;
const body = (raw.body && Object.keys(raw.body).length > 0)
  ? raw.body
  : (raw.query && Object.keys(raw.query).length > 0 && raw.query.origin_city)
  ? raw.query
  : raw;

// Generar session_id único para este plan
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Validar campos obligatorios
const tb = body;
const required = [
  ['origin_city', tb.origin_city],
  ['destination_city', Array.isArray(tb.destination_city) && tb.destination_city.length > 0 ? tb.destination_city : null],
  ['departure_date', tb.departure_date],
  ['return_date', tb.return_date],
  ['travelers', tb.travelers],
  ['budget_total_usd', tb.budget_total_usd],
  ['accommodation_type', tb.accommodation_type],
  ['activity_interests', Array.isArray(tb.activity_interests) && tb.activity_interests.length > 0 ? tb.activity_interests : null]
];

const missing = required.filter(([k, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  return [{ json: {
    _error: true,
    error_detail: `Campos obligatorios faltantes: ${missing.join(', ')}`,
    session_id: sessionId
  }}];
}

// Construir session_state limpio
const sessionState = {
  session_id: sessionId,
  revision_count: 0,
  status: 'awaiting_search',
  feedback_instruction: null,
  steps_to_run: 'all',
  travel_brief: {
    origin_city: tb.origin_city,
    destination_city: Array.isArray(tb.destination_city) ? tb.destination_city : [tb.destination_city],
    departure_date: tb.departure_date,
    return_date: tb.return_date,
    travelers: tb.travelers,
    budget_total_usd: Number(tb.budget_total_usd),
    accommodation_type: tb.accommodation_type,
    flight_preferences: {
      cabin_class: tb.flight_preferences?.cabin_class || 'economy',
      max_layover_hours: tb.flight_preferences?.max_layover_hours || 4,
      preferred_airlines: tb.flight_preferences?.preferred_airlines || []
    },
    activity_interests: tb.activity_interests,
    special_requirements: tb.special_requirements || 'ninguno',
    flexible_dates: tb.flexible_dates || false,
    hotel_location_preference: tb.hotel_location_preference || 'sin preferencia',
    car_rental_needed: tb.car_rental_needed || false,
    // Titular/cliente del plan (opcional). No es campo obligatorio: solo se
    // arrastra como passthrough hasta el nodo que lo guarda en `plan_holders`.
    // El planificador no lo usa.
    holder: tb.holder || null
  }
};

// Guardar en static data. NO se retiene el titular (PII) aquí: la static data
// persiste indefinidamente en la BD de n8n y solo la usa el refinamiento (RUTA B),
// que no necesita el holder. El holder sí viaja en el item devuelto abajo, para la
// rama de persistencia en plan_holders.
const staticData = $getWorkflowStaticData('global');
const staticState = { ...sessionState, travel_brief: { ...sessionState.travel_brief } };
delete staticState.travel_brief.holder;
staticData[sessionId] = staticState;

return [{ json: {
  session_id: sessionId,
  session_state: sessionState,
  route: 'plan_inicial',
  _error: false
} }];
