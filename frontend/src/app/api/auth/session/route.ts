import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// Duración de la session cookie (14 días). Resuelve el desajuste anterior:
// el ID token de Firebase caduca en 1h pero la cookie duraba 7 días sin verificar.
const EXPIRES_IN_MS = 60 * 60 * 24 * 14 * 1000;

export async function POST(req: NextRequest) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error('[auth] Firebase Admin no configurado; no se puede crear sesión');
    return NextResponse.json(
      { error: 'Servicio de autenticación no disponible' },
      { status: 503 }
    );
  }

  let idToken: unknown;
  try {
    const body = await req.json();
    idToken = body?.idToken;
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  try {
    // Verificación autoritativa del ID token (con comprobación de revocación).
    await adminAuth.verifyIdToken(idToken, true);
    // Emite una session cookie firmada por Firebase, no el ID token en crudo.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('justenjoy-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: EXPIRES_IN_MS / 1000,
      path: '/',
    });
    return response;
  } catch (e) {
    console.warn('[auth] verificación de ID token fallida:', (e as Error).message);
    return NextResponse.json({ error: 'Token no verificado' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('justenjoy-session');
  return response;
}
