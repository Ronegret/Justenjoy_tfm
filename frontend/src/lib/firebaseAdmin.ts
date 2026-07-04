// Inicialización del Firebase Admin SDK — SOLO servidor (route handlers).
// No importar desde componentes de cliente ni desde el proxy (edge/ligero).
//
// Verificación autoritativa de sesión (incluye revocación) con las credenciales
// de una service account inyectadas por variables de entorno. Fail-closed: si no
// están configuradas, getAdminAuth() devuelve null y el llamante responde 401/503
// en vez de dejar pasar.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let cachedApp: App | null = null;

function getAdminApp(): App | null {
  if (cachedApp) return cachedApp;

  // Reutiliza la app ya inicializada (evita doble init con el hot-reload de dev).
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // La clave privada viaja en una sola línea con los saltos escapados como \n.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null; // fail-closed: sin credenciales no hay Admin SDK
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

/** true si el Admin SDK tiene credenciales y puede verificar tokens. */
export function isAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/** Instancia de Auth del Admin SDK, o null si no está configurado (fail-closed). */
export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}
