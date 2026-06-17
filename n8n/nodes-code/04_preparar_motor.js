// Nodo Code: "Preparar Motor Planificador" (compartido Ruta A + Ruta B)
// ---------------------------------------------------------------------------
// Unifica la entrada de ambas rutas. Construye segments[] (soporta multi-
// destino). Extrae steps_to_run, existing_plan y feedback_instruction para
// pasarlos al Agente Motor. Ver doc de arquitectura, seccion 4.4.

const incoming = $input.first().json;

// session_state puede venir de "Validar Formulario" (Ruta A) o de
// "Parsear Refinamiento" (Ruta B).
const session_state = incoming.session_state;
if (!session_state || !session_state.travel_brief) {
  throw new Error('Preparar Motor: falta session_state.travel_brief en la entrada');
}

const brief = session_state.travel_brief;
const session_id = session_state.session_id;

// Ruta A => ejecucion inicial completa. Ruta B => valores del refinamiento.
const isRefine = incoming.route === 'refinamiento';
const steps_to_run = isRefine ? incoming.steps_to_run || 'all' : 'all';
const feedback_instruction = isRefine
  ? incoming.feedback_instruction || 'refinamiento'
  : '';
const existing_plan = isRefine ? incoming.existing_plan || null : null;
const revision_count = Number(
  isRefine ? incoming.revision_count ?? session_state.revision_count ?? 0 : 0,
);

// Construir segments[] (un segmento por destino para soporte multi-ciudad).
const destinations = Array.isArray(brief.destination_city)
  ? brief.destination_city
  : [brief.destination_city];

const segments = destinations.map((dest, idx) => ({
  segment_index: idx,
  origin: idx === 0 ? brief.origin_city : destinations[idx - 1],
  destination: dest,
}));

// Lista de destinos unicos para las consultas Tavily.
const unique_destinations = [...new Set(destinations)];

return [
  {
    json: {
      session_id,
      session_state,
      segments,
      unique_destinations,
      steps_to_run,
      feedback_instruction,
      existing_plan,
      revision_count,
    },
  },
];
