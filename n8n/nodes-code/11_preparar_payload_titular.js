// Preparar el registro del titular/cliente para Supabase (tabla plan_holders).
// Corre justo tras validar el formulario, en RAMA PARALELA a la planificación,
// para que el lead se guarde aunque la planificación posterior no llegue a
// plan_ready (captación). Los datos del titular son OPCIONALES: si el viajero
// omitió el paso en el frontend, este nodo no emite ítems (return []).
//
// DEDUP POR EMAIL (decisión de producto, opción 2): un lead por persona. NO se
// hace aquí con una consulta HTTP (frágil en el sandbox del code node), sino a
// nivel de BD: un índice UNIQUE parcial sobre plan_holders(email). El nodo Supabase
// usa operation=create con onError=continueRegularOutput, así que un segundo insert
// con el mismo email choca con el UNIQUE y se ignora (first-wins), sin duplicar y
// a prueba de carreras. Ver n8n/docs/Planificador_Viajes_v39_Arquitectura.md §9.1.
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
