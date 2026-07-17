const result = $input.first().json;

// (v34) ELIMINADA la captura de token usage. Nunca funcionó y no podía funcionar:
// el item de salida del nodo Agent es {output: "..."} — no contiene tokenUsage,
// usage ni llmOutput, así que los tres fallbacks caían siempre en null. El
// consumo real vive en el sub-nodo del modelo (OpenAI GPT-4.1), y los sub-nodos
// de LangChain no están en el flujo principal: un Code node no los alcanza con $().
// Ese dato solo existe en la runData de la ejecución (rama ai_languageModel),
// visible en el panel de Logs de la UI. Ver PENDIENTES: leerlo vía la API de n8n
// (/api/v1/executions/{id}?includeData=true) está por validar en un workflow aparte.

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
