// Verificación LIGERA de la session cookie de Firebase para el proxy.
//
// El proxy de Next se ejecuta como capa ligera (idealmente sin el Admin SDK ni
// la service account), así que aquí verificamos criptográficamente la cookie con
// `jose`: firma RS256 contra las claves públicas x509 de Google + issuer/audience
// + expiración. Es la primera barrera (defensa en profundidad); la verificación
// autoritativa —con revocación— la hace el Admin SDK en los route handlers.
import { importX509, jwtVerify, decodeProtectedHeader } from 'jose';

// Certificados públicos de las session cookies de Firebase (formato { kid: x509 }).
const CERT_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && certCache && certCache.expiresAt > now) return certCache.certs;

  try {
    const res = await fetch(CERT_URL);
    if (!res.ok) {
      throw new Error(`claves públicas de Firebase: HTTP ${res.status}`);
    }
    const certs = (await res.json()) as Record<string, string>;

    // Respeta el max-age que devuelve Google para no refetch en cada request.
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAge = parseInt((cacheControl.match(/max-age=(\d+)/) || [])[1] || '3600', 10);
    certCache = { certs, expiresAt: now + maxAge * 1000 };
    return certs;
  } catch (e) {
    // Gracia: ante un fallo transitorio de la red de Google, seguimos usando el
    // último set conocido (aunque haya caducado) para no expulsar a todos los
    // usuarios. Sin caché previa, propagamos el error (fail-closed).
    if (certCache) {
      console.warn('[auth] no se pudieron refrescar los certs de Firebase; uso caché previa:', (e as Error).message);
      return certCache.certs;
    }
    throw e;
  }
}

export interface VerifiedSession {
  uid: string;
  email?: string;
}

/**
 * Devuelve la sesión verificada, o null si la cookie es inválida/expirada/forjada.
 * Devolver null es el resultado esperado de una verificación fallida (no es un
 * error silenciado): significa "no autenticado".
 */
export async function verifySessionCookieLight(
  cookie: string,
  projectId: string
): Promise<VerifiedSession | null> {
  try {
    const { kid, alg } = decodeProtectedHeader(cookie);
    if (alg !== 'RS256' || !kid) return null;

    let certs = await getCerts();
    let pem = certs[kid];
    if (!pem) {
      // kid no encontrado: probablemente Google rotó la clave de firma y nuestra
      // caché es anterior. Forzamos un refetch una vez antes de rendirnos.
      certs = await getCerts(true);
      pem = certs[kid];
    }
    if (!pem) return null;

    const key = await importX509(pem, 'RS256');
    const { payload } = await jwtVerify(cookie, key, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });

    if (!payload.sub) return null;
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    // Firma inválida, token expirado, kid desconocido, etc. → no autenticado.
    return null;
  }
}
