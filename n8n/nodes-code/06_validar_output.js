// Nodo Code: "Validar Output del Planificador"
// ---------------------------------------------------------------------------
// Limpia markdown fences del output del Agente Motor, parsea el JSON de forma
// segura, sobreescribe generated_at, aplica safety-net de daily_itinerary[]
// vacio, extrae costes de transporte de plan_notes[], fuerza needs_user_input
// si hay warnings criticas, y persiste el plan. Ver doc arquitectura, sec 4.5.

const incoming = $input.first().json;

// El toolsAgent deja su salida en .output (string JSON) normalmente.
let raw = incoming.output ?? incoming.text ?? incoming.response ?? incoming;

function stripFences(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

let result;
if (typeof raw === 'string') {
  try {
    result = JSON.parse(stripFences(raw));
  } catch (e) {
    return [
      {
        json: {
          status: 'error',
          error_detail: `No se pudo parsear el output del planificador: ${e.message}`,
          raw_output: typeof raw === 'string' ? raw.slice(0, 1000) : raw,
          session_id: incoming.session_id || null,
        },
      },
    ];
  }
} else if (raw && typeof raw === 'object') {
  result = raw;
} else {
  return [
    {
      json: {
        status: 'error',
        error_detail: 'Output del planificador vacio o de tipo inesperado',
        session_id: incoming.session_id || null,
      },
    },
  ];
}

// 1) generated_at incondicional.
result.generated_at = new Date().toISOString();

const plan = result.plan || {};
const seg0 = (plan.segments && plan.segments[0]) || {};

// 2) Safety net: daily_itinerary[] vacio -> construir desde activities[].
if (!Array.isArray(plan.daily_itinerary) || plan.daily_itinerary.length === 0) {
  const activities = Array.isArray(seg0.activities) ? seg0.activities : [];
  const byDate = {};
  for (const a of activities) {
    const d = a.date || '';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push({
      time: a.start_time || '10:00',
      name: a.name || '',
      duration_hours: a.duration_hours || 3,
      price_usd: a.price_usd || 0,
      booking_url: a.booking_url || '',
    });
  }
  const dest = seg0.destination || '';
  plan.daily_itinerary = Object.keys(byDate)
    .sort()
    .map((date, i) => ({
      day: i + 1,
      date,
      title: byDate[date][0] ? byDate[date][0].name : `Dia en ${dest}`,
      summary: `Actividades planificadas en ${dest}.`,
      activities: byDate[date],
    }));
}

// 3) Safety net transporte: extraer coste numerico de plan_notes[].
const cost = plan.cost_summary || (plan.cost_summary = {});
if (
  cost.estimated_local_transport_usd === undefined ||
  cost.estimated_local_transport_usd === null
) {
  let transport = null;
  for (const note of plan.plan_notes || []) {
    const m = String(note).match(/(?:USD|\$)\s*(\d+(?:\.\d+)?)/i);
    if (m && /transport|metro|taxi|traslado/i.test(note)) {
      transport = Number(m[1]);
      break;
    }
  }
  cost.estimated_local_transport_usd = transport ?? 0;
  cost.local_transport_data_source = transport != null ? 'tavily' : 'null';
}

// 4) Regla de seguridad: warnings criticas fuerzan needs_user_input.
const warnings = Array.isArray(result.warnings) ? result.warnings : [];
const hasCritical = warnings.some((w) => w && w.requires_user_approval === true);
if (hasCritical && result.status === 'plan_ready') {
  result.status = 'needs_user_input';
}

// 5) Persistir el plan en el session_state (static data).
const session_id = result.session_id || incoming.session_id || null;
if (session_id) {
  const store = $getWorkflowStaticData('global');
  if (!store.sessions) store.sessions = {};
  if (!store.sessions[session_id]) store.sessions[session_id] = { session_id };
  store.sessions[session_id].current_plan = result;
  store.sessions[session_id].status = result.status;
}

result.plan = plan;
return [{ json: result }];
