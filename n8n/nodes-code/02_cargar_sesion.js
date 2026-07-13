const body = $input.first().json.body || $input.first().json;
const sessionId = body.session_id;
const feedbackText = body.feedback_text || '';
const staticData = $getWorkflowStaticData('global');
const currentSession = staticData[sessionId];

if (!currentSession) {
  return [{ json: {
    _error: true,
    error_detail: 'Sesión no encontrada. Por favor envía el formulario de nuevo.',
    session_id: sessionId
  }}];
}

if (!feedbackText.trim()) {
  return [{ json: {
    _error: true,
    error_detail: 'El campo de refinamiento está vacío.',
    session_id: sessionId
  }}];
}

// Preparar para el agente de refinamiento
return [{ json: {
  session_id: sessionId,
  feedback_text: feedbackText,
  current_session: currentSession,
  current_plan: currentSession.plan || null,
  route: 'refinamiento',
  _error: false
} }];
