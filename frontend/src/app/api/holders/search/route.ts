import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/requireSession';
import { isRefineTokenConfigured, verifyRefineToken } from '@/lib/refineToken';

// Búsqueda persistente de clientes para el dashboard (spec
// 2026-07-23-buscador-clientes-servidor, D1=server-side puro, D2=vía n8n).
//
// El cliente aporta los planes que ya posee (localStorage) + la query; este endpoint
// autentica la sesión, **comprueba que cada plan es suyo** y reenvía al webhook de
// LECTURA de n8n, que consulta `plan_holders` (con service_role, que se queda en n8n)
// y devuelve SOLO los `session_id` que casan. **Nunca** se devuelve PII al navegador.
//
// PROPIEDAD DE LOS PLANES (obligatoria, no cosmética). Autenticar no basta: los
// `session_id` los aporta el cliente y el resultado dice si el titular de ESE plan casa
// con la query. Sin comprobar propiedad, el endpoint es un oráculo de subcadenas contra
// el `plan_holders` de otra persona: probando "a", "ab", "abc"… se reconstruye su email o
// su teléfono carácter a carácter, aunque la respuesta solo devuelva `session_id`. Se usa
// la misma prueba que /api/refine-trip: el `refine_token` que /api/plan-trip firmó para
// el par (uid, session_id) — ver lib/refineToken.
interface SearchRequestBody {
  // Planes que el cliente dice poseer, cada uno con su firma de propiedad.
  sessions?: Array<{ session_id?: unknown; refine_token?: unknown }>;
  query?: unknown;
}

export async function POST(req: NextRequest) {
  // Misma verificación autoritativa que /api/plan-trip y /api/refine-trip.
  const session = await requireSession(req, 'holders-search');
  if (session.error) return session.error;

  let body: SearchRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const rawSessions = body?.sessions;
  const query = typeof body?.query === 'string' ? body.query : '';
  if (!Array.isArray(rawSessions)) {
    return NextResponse.json({ error: 'sessions requerido' }, { status: 400 });
  }
  // Sin planes que aportar o sin query no hay nada que consultar (no golpeamos n8n).
  if (rawSessions.length === 0 || !query.trim()) {
    return NextResponse.json({ matching_session_ids: [] });
  }

  // Falla cerrado: sin secreto no se puede acreditar la propiedad de ningún plan, y
  // consultar sin comprobarla es justo el agujero que esto cierra.
  if (!isRefineTokenConfigured()) {
    console.error('[holders-search] REFINE_TOKEN_SECRET no configurada; búsqueda por cliente deshabilitada');
    return NextResponse.json({ error: 'Búsqueda no disponible' }, { status: 503 });
  }

  const sessionIds = rawSessions
    .filter(
      (s) => typeof s?.session_id === 'string' && verifyRefineToken(s.refine_token, session.uid, s.session_id)
    )
    .map((s) => s.session_id as string);

  const descartados = rawSessions.length - sessionIds.length;
  if (descartados > 0) {
    // No es necesariamente un ataque: los planes guardados antes de que existiera el
    // token no llevan firma y dejan de ser buscables por cliente (misma regresión
    // asumida que en el refinamiento). Se registra el recuento, nunca los ids.
    console.warn(`[holders-search] ${descartados} de ${rawSessions.length} planes sin firma válida; excluidos.`);
  }
  if (sessionIds.length === 0) {
    return NextResponse.json({ matching_session_ids: [] });
  }

  const webhookUrl = process.env.N8N_HOLDERS_SEARCH_WEBHOOK_URL;
  if (!webhookUrl) {
    // La búsqueda persistente por cliente no está configurada en este entorno.
    console.warn('[holders-search] N8N_HOLDERS_SEARCH_WEBHOOK_URL no definida');
    return NextResponse.json({ error: 'Búsqueda no disponible' }, { status: 503 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_ids: sessionIds, query }),
    });
    if (!res.ok) {
      throw new Error(`n8n holders-search respondió ${res.status}`);
    }
    const data = await res.json();
    const matching = Array.isArray(data?.matching_session_ids)
      ? data.matching_session_ids.filter((s: unknown): s is string => typeof s === 'string')
      : [];
    // Cinturón y tirantes: solo se devuelven ids que el usuario haya acreditado. Si n8n
    // devolviera algo de más, no sale de aquí.
    const permitidos = new Set(sessionIds);
    return NextResponse.json({ matching_session_ids: matching.filter((s: string) => permitidos.has(s)) });
  } catch (e) {
    console.warn('[holders-search] fallo al consultar n8n:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Búsqueda no disponible temporalmente' }, { status: 502 });
  }
}
