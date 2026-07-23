import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// Búsqueda persistente de clientes para el dashboard (spec
// 2026-07-23-buscador-clientes-servidor, D1=server-side puro, D2=vía n8n).
//
// El cliente aporta los `session_id` que ya posee (localStorage) + la query; este
// endpoint autentica la sesión y reenvía al webhook de LECTURA de n8n, que consulta
// `plan_holders` (con service_role, que se queda en n8n) y devuelve SOLO los
// `session_id` que casan. **Nunca** se devuelve PII al navegador.
export async function POST(req: NextRequest) {
  // Misma verificación autoritativa que /api/plan-trip.
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error('[holders-search] Firebase Admin no configurado; rechazando petición');
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 });
  }
  const session = req.cookies.get('justenjoy-session');
  if (!session?.value) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  try {
    await adminAuth.verifySessionCookie(session.value, true);
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const rawIds = (body as { session_ids?: unknown })?.session_ids;
  const rawQuery = (body as { query?: unknown })?.query;
  const sessionIds = Array.isArray(rawIds) ? rawIds.filter((s): s is string => typeof s === 'string') : null;
  const query = typeof rawQuery === 'string' ? rawQuery : '';
  if (!sessionIds) {
    return NextResponse.json({ error: 'session_ids requerido' }, { status: 400 });
  }
  // Sin planes que aportar o sin query no hay nada que consultar (no golpeamos n8n).
  if (sessionIds.length === 0 || !query.trim()) {
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
    return NextResponse.json({ matching_session_ids: matching });
  } catch (e) {
    console.warn('[holders-search] fallo al consultar n8n:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Búsqueda no disponible temporalmente' }, { status: 502 });
  }
}
