import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// Gate de autenticación compartido por las rutas API que llaman a n8n/LLM
// (/api/plan-trip, /api/refine-trip). Cierra la API abierta y el vector de coste
// de llamadas anónimas. Verificación autoritativa con el Admin SDK de Firebase
// sobre la cookie de sesión.
//
// Devuelve `null` si la petición está autenticada; si no, devuelve la
// `NextResponse` de error ya construida para que el handler la retorne tal cual:
//
//   const authError = await requireSession(req, 'refine-trip');
//   if (authError) return authError;
export async function requireSession(req: NextRequest, logTag: string): Promise<NextResponse | null> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error(`[${logTag}] Firebase Admin no configurado; rechazando petición`);
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
  return null;
}
