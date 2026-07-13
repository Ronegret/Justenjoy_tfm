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
    car_rental_needed: tb.car_rental_needed || false
  }
};

// Guardar en static data
const staticData = $getWorkflowStaticData('global');
staticData[sessionId] = sessionState;

return [{ json: {
  session_id: sessionId,
  session_state: sessionState,
  route: 'plan_inicial',
  _error: false
} }];
