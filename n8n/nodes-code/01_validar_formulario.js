// Nodo Code: "Validar Formulario" (Ruta A)
// ---------------------------------------------------------------------------
// Normaliza la entrada (body/query/raiz), genera session_id, valida los 8
// campos obligatorios y construye session_state con defaults. Persiste en
// $getWorkflowStaticData('global') indexado por session_id.
// Ver doc de arquitectura, seccion 4.2.
//
// Output OK:    { session_id, session_state, route, _error: false }
// Output Error: { _error: true, error_detail, session_id }

const incoming = $input.first().json;

// 1) Normalizar: aceptar datos en body, query o en la raiz del JSON.
const src = incoming.body || incoming.query || incoming;

// 2) Generar session_id unico: session_[timestamp]_[9 chars alfanumericos].
const rand9 = Math.random().toString(36).slice(2, 11).padEnd(9, '0');
const session_id = `session_${Date.now()}_${rand9}`;

// 3) Validar 8 campos obligatorios.
const required = [
  'origin_city',
  'destination_city',
  'departure_date',
  'return_date',
  'travelers',
  'budget_total_usd',
  'accommodation_type',
  'activity_interests',
];

const missing = [];
for (const field of required) {
  const v = src[field];
  const empty =
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0);
  if (empty) missing.push(field);
}

if (missing.length > 0) {
  return [
    {
      json: {
        _error: true,
        error_detail: `Campos faltantes: ${missing.join(', ')}`,
        session_id,
      },
    },
  ];
}

// 4) Normalizar destino a array (acepta string o array).
const destination_city = Array.isArray(src.destination_city)
  ? src.destination_city
  : [src.destination_city];

// 5) Construir travel_brief con defaults para campos opcionales.
const flightPrefsIn = src.flight_preferences || {};
const travel_brief = {
  origin_city: src.origin_city,
  destination_city,
  departure_date: src.departure_date,
  return_date: src.return_date,
  travelers: {
    adults: Number(src.travelers?.adults ?? 1),
    children: Array.isArray(src.travelers?.children) ? src.travelers.children : [],
  },
  budget_total_usd: Number(src.budget_total_usd),
  accommodation_type: src.accommodation_type,
  flight_preferences: {
    cabin_class: flightPrefsIn.cabin_class || 'economy',
    max_layover_hours: Number(flightPrefsIn.max_layover_hours ?? 4),
    preferred_airlines: Array.isArray(flightPrefsIn.preferred_airlines)
      ? flightPrefsIn.preferred_airlines
      : [],
  },
  activity_interests: Array.isArray(src.activity_interests)
    ? src.activity_interests
    : [src.activity_interests],
  special_requirements: src.special_requirements || 'ninguno',
  flexible_dates: src.flexible_dates === true,
  hotel_location_preference: src.hotel_location_preference || '',
  car_rental_needed: src.car_rental_needed === true,
};

// 6) Session state inicial.
const session_state = {
  session_id,
  status: 'awaiting_search',
  revision_count: 0,
  created_at: new Date().toISOString(),
  travel_brief,
  current_plan: null,
};

// 7) Persistir en static data global, indexado por session_id.
const store = $getWorkflowStaticData('global');
if (!store.sessions) store.sessions = {};
store.sessions[session_id] = session_state;

return [
  {
    json: {
      _error: false,
      route: 'plan_inicial',
      session_id,
      session_state,
    },
  },
];
