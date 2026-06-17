// Nodo Code: "Parsear Refinamiento" (Ruta B)
// ---------------------------------------------------------------------------
// Limpia markdown fences del output del Agente de Refinamiento, parsea el JSON
// con fallback a steps_to_run='all', incrementa revision_count y persiste el
// session_state actualizado. Ver doc de arquitectura, seccion 4.3.

const incoming = $input.first().json;

// El agente (toolsAgent) deja su salida en .output (string) o, segun version,
// directamente como objeto. Soportamos ambos.
let raw = incoming.output ?? incoming.text ?? incoming.response ?? incoming;

// Recuperar contexto previo: el item entrante deberia arrastrar session_id /
// current_session, pero por robustez los recuperamos tambien del static data.
const store = $getWorkflowStaticData('global');
const sessions = store.sessions || {};

// Intentar localizar session_id desde el input o desde el JSON del agente.
let session_id = incoming.session_id || null;

function stripFences(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

let parsed = null;
let parseFailed = false;

if (typeof raw === 'string') {
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch (e) {
    parseFailed = true;
  }
} else if (raw && typeof raw === 'object') {
  parsed = raw;
}

// Recuperar la sesion previa para tener una base sobre la que aplicar cambios.
if (!session_id && parsed && parsed.session_id) session_id = parsed.session_id;
const prev = session_id ? sessions[session_id] : null;
const prevBrief = prev?.travel_brief || {};
const prevRevision = Number(prev?.revision_count ?? 0);

// Fallback: si el parse fallo o el agente no devolvio un travel_brief usable,
// re-ejecutamos todo conservando el brief anterior.
if (parseFailed || !parsed || typeof parsed !== 'object') {
  parsed = {
    session_id,
    steps_to_run: 'all',
    feedback_instruction: 'fallback: no se pudo interpretar la instruccion',
    travel_brief: prevBrief,
    revision_count: prevRevision + 1,
  };
}

// Normalizar campos esperados.
const steps_to_run = parsed.steps_to_run || 'all';
const feedback_instruction =
  parsed.feedback_instruction || incoming.feedback_text || 'refinamiento';
const travel_brief = parsed.travel_brief || prevBrief;
session_id = parsed.session_id || session_id;

// Construir session_state actualizado y persistirlo.
const updated = {
  session_id,
  status: 'awaiting_search',
  revision_count: prevRevision + 1,
  updated_at: new Date().toISOString(),
  travel_brief,
  current_plan: prev?.current_plan || null,
};

if (session_id) {
  if (!store.sessions) store.sessions = {};
  store.sessions[session_id] = updated;
}

return [
  {
    json: {
      _error: false,
      route: 'refinamiento',
      session_id,
      session_state: updated,
      steps_to_run,
      feedback_instruction,
      existing_plan: updated.current_plan,
      revision_count: updated.revision_count,
    },
  },
];
