// Parsear output del agente de refinamiento
const agentOutput = $input.first().json.output || $input.first().json.text || '';
const currentSession = $('Cargar Sesión').first().json.current_session;
const sessionId = $('Cargar Sesión').first().json.session_id;
const staticData = $getWorkflowStaticData('global');

let refinedState;
let cleaned = agentOutput.trim();
if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').trim();
if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').trim();
if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '').trim();

try {
  refinedState = JSON.parse(cleaned);
} catch(e) {
  // Si falla el parse, ejecutar todo con el brief actual sin cambios
  refinedState = {
    ...currentSession,
    revision_count: (currentSession.revision_count || 0) + 1,
    status: 'awaiting_search',
    steps_to_run: 'all',
    feedback_instruction: 'Instrucción no interpretada — re-ejecutando plan completo'
  };
}

// Asegurar campos obligatorios
refinedState.session_id = sessionId;
refinedState.status = 'awaiting_search';
if (!refinedState.steps_to_run) refinedState.steps_to_run = 'all';

// FIX v25.3: preservar el plan original — el Agente de Refinamiento no lo gestiona
// ni lo incluye en su contrato de output. Sin esto, el plan existente se pierde
// y steps_to_run parciales (ej. 'hotels') no tienen nada que conservar.
refinedState.plan = currentSession.plan || null;

// Guardar estado actualizado
staticData[sessionId] = refinedState;

return [{ json: {
  session_id: sessionId,
  session_state: refinedState,
  route: 'refinamiento'
} }];
