// Nodo Code: "Logger - Tokens y Metricas"
// ---------------------------------------------------------------------------
// Anade result._debug = { token_usage, execution_time_ms, plan_metrics } al
// JSON de respuesta. Util para el TFM: metricas visibles en Postman.
// Ver doc de arquitectura, seccion 4.5.
//
// NOTA (limitacion v24): n8n no expone tokenUsage en el output JSON del agente,
// por lo que token_usage suele quedar null. Ver Executions para el dato real.

const result = $input.first().json;

const plan = result.plan || {};
const seg0 = (plan.segments && plan.segments[0]) || {};
const activities = Array.isArray(seg0.activities) ? seg0.activities : [];
const itinerary = Array.isArray(plan.daily_itinerary) ? plan.daily_itinerary : [];
const notes = Array.isArray(plan.plan_notes) ? plan.plan_notes : [];
const warnings = Array.isArray(result.warnings) ? result.warnings : [];

// Tiempo de ejecucion: desde el inicio del workflow hasta ahora (si disponible).
let execution_time_ms = null;
try {
  const startedAt = $execution?.startedAt || $workflow?.startedAt;
  if (startedAt) {
    execution_time_ms = Date.now() - new Date(startedAt).getTime();
  }
} catch (e) {
  execution_time_ms = null;
}

// Intento best-effort de leer token usage (normalmente null en n8n).
let token_usage = null;
try {
  token_usage =
    result.tokenUsage ||
    result._tokenUsage ||
    result.usage ||
    null;
} catch (e) {
  token_usage = null;
}

result._debug = {
  token_usage,
  execution_time_ms,
  plan_metrics: {
    activities_found: activities.length,
    itinerary_days: itinerary.length,
    plan_notes: notes.length,
    warnings: warnings.length,
    has_flights: !!(seg0.flights && seg0.flights.outbound),
    has_hotel: !!(seg0.hotel && seg0.hotel.name),
    tools_called: result.steps_executed || 'all',
  },
};

return [{ json: result }];
