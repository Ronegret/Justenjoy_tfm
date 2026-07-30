// Preparar session_state para el motor planificador
// Unifica ambas rutas (formulario inicial y refinamiento)
const input = $input.first().json;

// AQUÍ SE QUITA LA PII DEL TITULAR. Este nodo es la única entrada al motor
// planificador, y el prompt del agente serializa entero lo que salga de aquí
// (`JSON.stringify($json.session_state)`): si el `holder` (nombre, teléfono y email
// del cliente) siguiera dentro, el contacto viajaría a OpenAI en CADA plan, sin base
// jurídica y contra la Actividad 6 del ROPA (Supabase como único destinatario). El
// planificador no lo necesita: solo lo usa la rama paralela que lo guarda en
// `plan_holders`, que lee la salida de `Validar Formulario`, no la de este nodo.
// Se copia en vez de mutar el input, para no vaciar de paso esa otra rama.
const rawSessionState = input.session_state;
const sessionState = {
  ...rawSessionState,
  travel_brief: { ...(rawSessionState.travel_brief || {}) }
};
delete sessionState.travel_brief.holder;

const tb = sessionState.travel_brief;
const revisionCount = sessionState.revision_count || 0;
const stepsToRun = sessionState.steps_to_run || 'all';

// Construir segmentos
const destinations = tb.destination_city || [];
const segments = [];

if (destinations.length === 1) {
  segments.push({
    segment_index: 0,
    origin: tb.origin_city,
    destination: destinations[0],
    departure_date: tb.departure_date,
    return_date: tb.return_date
  });
} else {
  segments.push({
    segment_index: 0,
    origin: tb.origin_city,
    destination: destinations[0],
    departure_date: tb.departure_date,
    return_date: null
  });
  for (let i = 1; i < destinations.length; i++) {
    segments.push({
      segment_index: i,
      origin: destinations[i - 1],
      destination: destinations[i],
      departure_date: null,
      return_date: i === destinations.length - 1 ? tb.return_date : null
    });
  }
}

return [{ json: {
  session_state: sessionState,
  travel_brief: tb,
  revision_count: revisionCount,
  steps_to_run: stepsToRun,
  segments: segments,
  unique_destinations: [...new Set(destinations)],
  existing_plan: sessionState.plan || null,
  feedback_instruction: sessionState.feedback_instruction || null
} }];
