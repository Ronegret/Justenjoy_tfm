# Spec — Verificación de autenticación en servidor (frontend)

- **Fecha:** 2026-07-04
- **Tipo:** bugfix de seguridad (crítico)
- **Estado:** implementada y verificada E2E en local (login real + rechazo de inválidos); pendiente configurar la service account en Vercel antes de desplegar
- **Rama:** `bugfix/auth-verificacion-servidor`

## Contexto

La autenticación del frontend era **decorativa**: el ID token de Firebase se
guardaba en crudo en una cookie sin verificarse jamás, el proxy solo comprobaba
que la cookie existiera, y `/api/plan-trip` respondía sin sesión. Se demostró
empíricamente (curl) el bypass completo: cookie inventada → acceso; token falso →
sesión acuñada; API abierta.

## Qué hace

- Verifica **en el servidor** el ID token de Firebase con el Admin SDK antes de
  emitir sesión.
- Sustituye la cookie con el ID token en crudo por una **session cookie de
  Firebase** firmada por el servidor (14 días), resolviendo el desajuste anterior
  (ID token caduca en 1h, cookie duraba 7 días).
- **Doble verificación (defensa en profundidad):**
  - **Proxy** (`src/proxy.ts`): verificación criptográfica ligera con `jose`
    (firma RS256 contra las claves públicas x509 de Google + issuer/audience/exp).
    Primera barrera para las páginas `/dashboard`, `/planner`, `/trip`.
  - **Route handlers**: verificación autoritativa con `firebase-admin`
    (`verifySessionCookie(..., true)`, incluye revocación).
- Exige sesión válida en `/api/plan-trip` (cierra la API abierta y el vector de
  coste por llamadas anónimas a LLM/n8n).
- **Fail-closed:** sin credenciales del Admin SDK, los endpoints responden 503 y
  el proxy redirige a `/login`; nunca se deja pasar.

## Qué NO hace (fuera de alcance)

- No cambia el contrato del webhook de n8n ni el workflow.
- No resuelve el modelo de compartición de `/trip` (los enlaces compartidos siguen
  requiriendo sesión). Decisión de producto separada.
- No corrige otros bugs detectados (mapeo n8n, precio "/persona", contraste, ESLint).
- No cambia de proveedor de auth (sigue Firebase).

## Decisiones tomadas

| # | Decisión |
|---|---|
| D1 | Session cookie de Firebase (14 días) en vez de ID token en crudo. |
| D2 | Verificación **completa**: servidor (firebase-admin) + proxy (jose). |
| D3 | `/api/plan-trip` exige sesión válida siempre (401/503 sin ella). |
| D4 | Dependencias nuevas aprobadas: `firebase-admin` y `jose`. |

## Ficheros tocados

- `frontend/src/lib/firebaseAdmin.ts` (nuevo) — init del Admin SDK, fail-closed.
- `frontend/src/lib/sessionCookie.ts` (nuevo) — verificación ligera con jose + caché de certs.
- `frontend/src/app/api/auth/session/route.ts` — verificar ID token + emitir session cookie.
- `frontend/src/proxy.ts` — verificar la cookie (no solo presencia).
- `frontend/src/app/api/plan-trip/route.ts` — exigir sesión válida.
- `.env.example` — variables `FIREBASE_ADMIN_*`.
- `frontend/package.json` — `firebase-admin`, `jose`.
- `docs/ARCHITECTURE.md` — sección de autenticación.

## Riesgos y mitigaciones

- **Admin SDK mal configurado → login roto para todos.** Por eso NO se mergea
  hasta configurar la service account en el entorno (local + Vercel) y verificar
  el flujo real. Fail-closed evita "falsa sensación de seguridad".
- **Credenciales del service account filtradas → acceso total.** Solo por variable
  de entorno; nunca en repo; `.env` ignorado.
- **Proxy sin acceso a las claves públicas de Google → rechaza sesiones.** Se
  cachea el cert-set según su `max-age`; si Google no responde, fail-closed
  (redirige a login).
- **Revocación:** el proxy (jose) no comprueba revocación; sí lo hace el Admin SDK
  en los endpoints. Aceptable como defensa en profundidad.

## Verificación

- `npx tsc --noEmit` → OK.
- `npx next build` → OK; proxy reconocido (`ƒ Proxy`).
- Fail-closed (sin service account): `/dashboard` con cookie falsa → 307;
  `/api/auth/session` con token falso → 503 (sin cookie); `/api/plan-trip` sin
  auth → 503. **Ninguna devuelve 200.**
- **E2E en local (con service account):** `test-frontend.ps1` → 5 OK / 0 FAIL
  (bypass de cookie falsa → 307; token falso → 401; `/api/plan-trip` sin auth →
  401); y login real en navegador → acceso a `/dashboard` confirmado.
- **Pendiente:** configurar `FIREBASE_ADMIN_*` en Vercel antes de mergear/desplegar.

## Dependencias / auditoría

- `firebase-admin@^14`, `jose@^6`. `npm audit`: 8 moderadas transitivas
  (`uuid` vía `@google-cloud/storage` —módulo Storage no usado, solo Auth— y
  `postcss` vía Next). El fix automático es breaking (degradaría firebase-admin a
  v10); se documenta y no se fuerza.

## Pasos operativos pendientes (humano)

1. Crear service account en Firebase Console (`justenjoy-tfm-g7`) → generar clave.
2. Configurar `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
   `FIREBASE_ADMIN_PRIVATE_KEY` en `.env` local y en Vercel.
3. Verificar el flujo feliz y reejecutar `test-frontend.ps1`.
