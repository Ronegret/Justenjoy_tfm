// Extraer solo el registro para Supabase (los campos de la tabla)
const record = $input.first().json._supabase_record;
if (!record) {
  return [{ json: { _no_record: true } }];
}
return [{ json: record }];
