// Preparar el registro del titular/cliente para Supabase (tabla plan_holders).
// Corre justo tras validar el formulario, en RAMA PARALELA a la planificación,
// para que el lead se guarde aunque la planificación posterior no llegue a
// plan_ready (captación). Los datos del titular son OPCIONALES: si el viajero
// omitió el paso en el frontend, este nodo no emite ítems (return []), con lo
// que el nodo Supabase siguiente no inserta ninguna fila vacía.
const input = $input.first().json;
const holder = input.session_state?.travel_brief?.holder || null;
const sessionId = input.session_id || null;

// Sin ningún dato de titular → no insertar.
const hasAny = holder && (holder.first_name || holder.last_name || holder.phone || holder.email);
if (!hasAny) {
  return [];
}

// Columnas de la tabla plan_holders (autoMapInputData en el nodo Supabase).
const record = {
  session_id: sessionId,
  first_name: holder.first_name || null,
  last_name: holder.last_name || null,
  phone: holder.phone || null,
  email: holder.email || null
};

return [{ json: record }];
