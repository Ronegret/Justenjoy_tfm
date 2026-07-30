import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// Gate de autenticación compartido por las rutas API que llaman a n8n/LLM
// (/api/plan-trip, /api/refine-trip). Cierra la API abierta y el vector de coste
// de llamadas anónimas. Verificación autoritativa con el Admin SDK de Firebase
// sobre la cookie de sesión.
//
// Devuelve el `uid` verificado si la petición está autenticada; si no, devuelve la
// `NextResponse` de error ya construida para que el handler la retorne tal cual:
//
//   const session = await requireSession(req, 'refine-trip');
//   if (session.error) return session.error;
//   session.uid  // ← uid de Firebase, verificado
//
// El `uid` hace falta para acreditar la PROPIEDAD de un plan (ver lib/refineToken):
// la cookie prueba que hay usuario, pero no cuál de los planes es suyo.
export type SessionCheck =
  | { error: NextResponse; uid?: undefined }
  | { error?: undefined; uid: string };

export async function requireSession(req: NextRequest, logTag: string): Promise<SessionCheck> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error(`[${logTag}] Firebase Admin no configurado; rechazando petición`);
    return { error: NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 }) };
  }
  const session = req.cookies.get('justenjoy-session');
  if (!session?.value) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  try {
    const decoded = await adminAuth.verifySessionCookie(session.value, true);
    return { uid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ error: 'Sesión inválida' }, { status: 401 }) };
  }
}
