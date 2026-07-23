// Buscar titulares por datos de cliente (nombre/apellidos/teléfono/email) entre
// los planes que el propio cliente posee. Rama de LECTURA (webhook holders-search),
// independiente del planificador. Sostiene la búsqueda persistente del dashboard.
//
// PRIVACIDAD (D1 de la spec, server-side puro): devuelve SOLO los `session_id` que
// casan, NUNCA PII. El endpoint del frontend solo aporta los `session_id` que ya
// posee (localStorage) + la query; el filtrado por posesión se hace aquí (no en la
// consulta a Supabase, que trae todas las filas: así no hay input de cliente en la
// query → sin superficie de inyección). El match usa la MISMA normalización laxa
// que el frontend (lib/text.ts normalizeLoose): minúsculas, sin acentos ni
// separadores ("jose perez" casa "José Pérez"; "600123456" casa "+34 600 123 456").
const normalizeLoose = (v) =>
  (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

// Cuerpo del webhook: { session_ids: string[], query: string }.
const req = $('Webhook — Buscar Titulares').first().json.body || {};
const sessionIds = Array.isArray(req.session_ids)
  ? req.session_ids.filter((s) => typeof s === 'string')
  : [];
const q = normalizeLoose(typeof req.query === 'string' ? req.query : '');

// Sin query o sin planes que aportar → nada que casar (no exponemos toda la tabla).
if (!q || sessionIds.length === 0) {
  return [{ json: { matching_session_ids: [] } }];
}

// Filas de plan_holders (nodo Supabase getAll). Con alwaysOutputData puede venir un
// item vacío si la tabla está vacía; se descarta al no tener session_id propio.
const owned = new Set(sessionIds);
const rows = $input
  .all()
  .map((i) => i.json)
  .filter((r) => r && owned.has(r.session_id));

// Match campo a campo (nombre completo, teléfono, email), igual que el frontend.
const matching = [];
for (const r of rows) {
  const fields = [
    `${r.first_name || ''} ${r.last_name || ''}`,
    r.phone || '',
    r.email || ''
  ];
  if (fields.some((f) => normalizeLoose(f).includes(q))) {
    matching.push(r.session_id);
  }
}

return [{ json: { matching_session_ids: Array.from(new Set(matching)) } }];
