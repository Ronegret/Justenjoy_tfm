const result = $input.first().json;

// Capturar token usage del Motor Planificador
// n8n expone el tokenUsage en el contexto del nodo agente
let tokenUsage = null;
try {
  const agentNode = $('Motor Planificador — Agent 2').first();
  tokenUsage = agentNode.json?.tokenUsage
    || agentNode.json?.usage
    || agentNode.json?.llmOutput?.tokenUsage
    || null;
} catch(e) {
  tokenUsage = null;
}

// Calcular tiempo de ejecución aproximado
const generatedAt = new Date(result.generated_at || Date.now());
const now = new Date();
const executionMs = now.getTime() - generatedAt.getTime();

// Contar elementos del plan para métricas
const segment = result.plan?.segments?.[0] || {};
const activitiesCount = segment.activities?.length || 0;
const itineraryDays = result.plan?.daily_itinerary?.length || 0;
const planNotesCount = result.plan?.plan_notes?.length || 0;
const warningsCount = result.warnings?.length || 0;

result._debug = {
  token_usage: tokenUsage,
  execution_time_ms: executionMs > 0 && executionMs < 300000 ? executionMs : null,
  plan_metrics: {
    activities_found: activitiesCount,
    itinerary_days: itineraryDays,
    plan_notes: planNotesCount,
    warnings: warningsCount,
    has_flights: !!(segment.flights?.outbound?.airline),
    has_hotel: !!(segment.hotel?.name),
    tools_called: result.steps_executed || 'all'
  }
};

return [{ json: result }];
