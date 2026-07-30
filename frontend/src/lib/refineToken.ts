import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TripData } from '@/types/trip';

// Prueba de propiedad del plan para el refinamiento.
//
// El `session_id` lo genera n8n y el frontend se lo pasa tal cual a
// /api/refine-trip, que carga esa sesión y devuelve el plan completo. Sin más
// comprobación, cualquier usuario autenticado que conociera un `session_id`
// ajeno podría leer ese plan y mutarlo (escribe una revisión nueva en Supabase).
// La cookie de sesión solo demuestra que hay usuario, no CUÁL plan es suyo.
//
// Solución sin depender de n8n ni de Supabase: cuando /api/plan-trip crea un plan
// conoce a la vez el `uid` autenticado y el `session_id` recién nacido, así que
// firma el par y devuelve la firma como `refine_token`. Al refinar, la ruta
// recalcula la firma con el `uid` de la cookie y el `session_id` recibido: si no
// coincide, el plan no es de quien lo pide. El token no lleva datos dentro (no es
// un JWT), solo prueba la asociación, y no sirve de nada con otra cuenta.
//
// El secreto es SERVER-ONLY y nunca sale del servidor: al navegador solo llega la
// firma. Si no está configurado no se emiten tokens y el refinamiento queda
// deshabilitado (falla cerrado) — ver `isRefineTokenConfigured`.

function getSecret(): string | undefined {
  const secret = process.env.REFINE_TOKEN_SECRET;
  return secret && secret.trim() ? secret : undefined;
}

export function isRefineTokenConfigured(): boolean {
  return getSecret() !== undefined;
}

function computeSignature(secret: string, uid: string, sessionId: string): string {
  // Los campos van separados por ':' y el uid de Firebase no contiene ':', así
  // que no hay ambigüedad entre (uid, sessionId) distintos que concatenen igual.
  return createHmac('sha256', secret).update(`${uid}:${sessionId}`).digest('base64url');
}

/**
 * Firma el par (uid, session_id). Devuelve `undefined` si no hay secreto
 * configurado o si el plan no es de n8n (sin `session_id` no hay nada que
 * refinar), y en ese caso el plan simplemente viaja sin token.
 */
export function signRefineToken(uid: string, sessionId: string | undefined): string | undefined {
  const secret = getSecret();
  if (!secret || !sessionId) return undefined;
  return computeSignature(secret, uid, sessionId);
}

/**
 * Adjunta el `refine_token` al plan mapeado. Los planes de fallback
 * (OpenAI/Claude/mock) no llevan `session_id`, así que salen sin token: no son
 * refinables de todos modos.
 */
export function withRefineToken(trip: TripData, uid: string): TripData {
  const token = signRefineToken(uid, trip.session_id);
  return token ? { ...trip, refine_token: token } : trip;
}

/**
 * ¿El token acredita que este `session_id` pertenece a este `uid`? Comparación en
 * tiempo constante para no filtrar cuánto prefijo de la firma se ha acertado.
 */
export function verifyRefineToken(token: string | undefined, uid: string, sessionId: string): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;
  const expected = Buffer.from(computeSignature(secret, uid, sessionId));
  const received = Buffer.from(token);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
