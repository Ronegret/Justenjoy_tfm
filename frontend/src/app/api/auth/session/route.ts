import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { idToken } = body;

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('justenjoy-session', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('justenjoy-session');
  return response;
}
