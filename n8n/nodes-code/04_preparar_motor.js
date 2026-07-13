// Preparar session_state para el motor planificador
// Unifica ambas rutas (formulario inicial y refinamiento)
const input = $input.first().json;

const sessionState = input.session_state;
const tb = sessionState.travel_brief || {};
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
