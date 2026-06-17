// Nodo Code: "Cargar Sesion" (Ruta B - refinamiento)
// ---------------------------------------------------------------------------
// Normaliza la entrada, recupera el session_state existente por session_id,
// valida que la sesion exista y que feedback_text no este vacio.
// Ver doc de arquitectura, seccion 4.3.
//
// Output OK:    { _error: false, session_id, feedback_text, current_session,
//                 current_plan }
// Output Error: { _error: true, error_detail, session_id }

const incoming = $input.first().json;
const src = incoming.body || incoming.query || incoming;

const session_id = (src.session_id || '').trim();
const feedback_text = (src.feedback_text || '').trim();

// Validar campos minimos de la ruta de refinamiento.
if (!session_id) {
  return [
    {
      json: {
        _error: true,
        error_detail: 'Falta session_id en la peticion de refinamiento',
        session_id: '',
      },
    },
  ];
}

if (!feedback_text) {
  return [
    {
      json: {
        _error: true,
        error_detail: 'feedback_text vacio: no hay instruccion de refinamiento',
        session_id,
      },
    },
  ];
}

// Recuperar sesion del static data.
const store = $getWorkflowStaticData('global');
const sessions = store.sessions || {};
const current_session = sessions[session_id];

if (!current_session) {
  return [
    {
      json: {
        _error: true,
        error_detail: `Sesion no encontrada: ${session_id}. Puede haberse perdido si n8n se reinicio (static data volatil).`,
        session_id,
      },
    },
  ];
}

return [
  {
    json: {
      _error: false,
      route: 'refinamiento',
      session_id,
      feedback_text,
      current_session,
      current_plan: current_session.current_plan || null,
    },
  },
];
