// Preparar el registro del titular/cliente para Supabase (tabla plan_holders).
// Corre en una SUB-EJECUCIÓN propia (entra por `Trigger — Guardar Titular`, que
// lanza `Lanzar Guardado del Titular` justo tras validar el formulario), para que
// el lead se guarde aunque la planificación posterior no llegue a plan_ready
// (captación). Los datos del titular son OPCIONALES: si el viajero omitió el paso
// en el frontend, este nodo no emite ítems (return []).
//
// POR QUÉ UNA SUB-EJECUCIÓN Y NO UNA RAMA PARALELA (hallazgo #38): en la misma
// ejecución, n8n recorre las ramas en PROFUNDIDAD y un nodo que falla sin onError
// hace `break`, descartando la pila pendiente. Con el titular como rama paralela,
// un fallo del insert del PLAN —que ocurre al final de la cadena— dejaba este nodo
// sin ejecutar y el lead se perdía. Verificado en la ejecución 78 de la BD de n8n:
// `Preparar Payload Titular` no aparecía en `runData` y seguía en la pila al
// abortar. Aislado en su propia ejecución, ni el plan puede matar al lead ni el
// lead al plan. Ver n8n/docs/Planificador_Viajes_v40_Arquitectura.md §7.3.
//
// DEDUP POR (EMAIL, SESSION_ID) desde v40. NO se hace aquí con una consulta HTTP
// (frágil en el sandbox del code node), sino a nivel de BD: índice UNIQUE parcial
// sobre plan_holders(email, session_id) — migración 2026-07-30_0003.
//
// ANTES (v39) el índice era solo sobre (email), con semántica "un lead por persona,
// first-wins". Se cambió porque ocultaba los viajes POSTERIORES del mismo cliente:
// su segundo plan no creaba fila y el buscador del dashboard solo encontraba el
// primero (hallazgo #31 de la auditoría). Ahora hay una fila POR VIAJE, y sigue sin
// duplicarse el mismo viaje si el nodo se reintenta.
//
// OJO: el nodo Supabase ya NO lleva onError=continueRegularOutput (v40). Un choque
// contra el UNIQUE deja la ejecución en FALLIDA en vez de ignorarse en silencio;
// es deliberado (AGENTS.md §5), pero en operación normal no puede ocurrir: el
// session_id es distinto en cada ejecución.
// Ver n8n/docs/Planificador_Viajes_v40_Arquitectura.md §2.
const input = $input.first().json;
const holderRaw = input.session_state?.travel_brief?.holder || null;
const sessionId = input.session_id || null;

// Recortar y decidir "hay datos" sobre los valores ya recortados (mismo criterio
// que el frontend). Sin ningún dato real → no insertar.
const holder = holderRaw
  ? {
      first_name: (holderRaw.first_name || '').trim(),
      last_name: (holderRaw.last_name || '').trim(),
      phone: (holderRaw.phone || '').trim(),
      email: (holderRaw.email || '').trim(),
      // Evidencia de consentimiento (RGPD 6.1.a): el frontend la sella al marcar
      // la casilla. `consent_at` es el momento (ISO), `consent_version` la versión
      // de la política aceptada.
      consent_at: (holderRaw.consent_at || '').trim(),
      consent_version: (holderRaw.consent_version || '').trim()
    }
  : null;
const hasAny = holder && (holder.first_name || holder.last_name || holder.phone || holder.email);
if (!hasAny) {
  return [];
}
// RGPD 6.1.a: no persistir PII del titular sin evidencia de consentimiento. El
// frontend ya bloquea el envío sin marcar la casilla; esta es la segunda barrera.
if (!holder.consent_at) {
  return [];
}

// Columnas de la tabla plan_holders (autoMapInputData en el nodo Supabase).
const record = {
  session_id: sessionId,
  first_name: holder.first_name || null,
  last_name: holder.last_name || null,
  phone: holder.phone || null,
  email: holder.email || null,
  consent_at: holder.consent_at,
  consent_version: holder.consent_version || null
};

return [{ json: record }];
