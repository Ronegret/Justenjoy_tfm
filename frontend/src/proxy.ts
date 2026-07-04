import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookieLight } from '@/lib/sessionCookie';

// Proxy de Next 16 (antes "middleware"): primera barrera de autenticación.
// Verifica criptográficamente la session cookie (firma + issuer/audience + exp)
// con `jose`; no basta con que la cookie exista. La verificación autoritativa
// con revocación la hacen los route handlers vía Admin SDK.
export async function proxy(request: NextRequest) {
  const session = request.cookies.get('justenjoy-session');
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!session?.value || !projectId) {
    return redirectToLogin(request);
  }

  const verified = await verifySessionCookieLight(session.value, projectId);
  if (!verified) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/planner/:path*', '/trip/:path*']
};
