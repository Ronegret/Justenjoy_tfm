# Levantar el stack completo en tu equipo

Guía para que **cada desarrollador** ejecute Just Enjoy entero en su propia
máquina (n8n + frontend), **sin depender de ngrok ni del equipo de otra persona**.
Todo corre en `localhost`.

```
Navegador ──► Frontend (Next.js, :3000) ──► n8n (Docker, :5678) ──► SerpAPI / OpenAI / Tavily
```

## 0. Requisitos
- **Docker Desktop** (para n8n).
- **Node.js 20+** (para el frontend).
- **Git**.
- **Claves propias** (cuentas gratuitas): OpenAI y SerpAPI obligatorias, Tavily opcional.
- Config de **Firebase** del proyecto (te la pasa el equipo; incluye una *service account*).

---

## 1. Clonar y configurar n8n (`.env` de la raíz)

```bash
git clone <repo> && cd Justenjoy_tfm
git checkout develop
cp .env.example .env
```

Edita `.env` y rellena **tus** claves:
- `OPENAI_API_KEY`, `SERPAPI_KEY` (y `TAVILY_API_KEY` si tienes).
- `N8N_ENCRYPTION_KEY` → un valor aleatorio de 32+ chars (`openssl rand -hex 32`).

> `.env` está ignorado por git — nunca se sube.

## 2. Levantar n8n

```bash
docker compose up -d
```

Esto, en un equipo nuevo:
1. Crea un volumen vacío para n8n.
2. **Importa automáticamente** las credenciales (leen tus claves del `.env`) **y el
   workflow `Planificador de Viajes v27`**, y lo deja **activo** (webhook registrado).

Comprueba que está sano y el webhook responde:
```bash
curl http://localhost:5678/healthz          # -> {"status":"ok"}
```
La UI de n8n está en `http://localhost:5678` (deberías ver el workflow v27 activo).

## 3. Configurar el frontend (`frontend/.env.local`)

```bash
cd frontend
npm install
```

Crea `frontend/.env.local` (ignorado por git) con:
- La config **Firebase** del proyecto:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
    (la *service account*; te la pasa el equipo de forma segura, **no** por git)
- El webhook de **tu** n8n local:
  ```
  N8N_WEBHOOK_URL=http://localhost:5678/webhook/travel-planner
  ```

## 4. Arrancar el frontend y probar

```bash
npm run dev
```

Abre `http://localhost:3000` → **Iniciar sesión** (Google) → **Planificar** →
elige origen/destino (p. ej. Valencia → Londres) y genera. Verás un viaje real
(vuelo de ida y vuelta, hotel, itinerario) servido por **tu** n8n.

---

## Notas
- **No hace falta ngrok**: frontend y n8n están en la misma máquina, se hablan por
  `localhost`. ngrok solo se necesita para exponer *tu* n8n a **otras** máquinas.
- **Cuota SerpAPI**: el plan gratuito son 250 búsquedas/mes **por cuenta**, y cada
  viaje gasta 4-6. Como cada dev usa su propia clave, cada uno tiene su cuota.
- **Cambiar el workflow**: si editas el workflow en la UI de n8n, expórtalo y
  actualiza `n8n/workflows/` en el repo para que el cambio sea reproducible
  (ver `n8n/docs/Planificador_Viajes_v24_Arquitectura.md`).

## Problemas frecuentes
- **El plan sale con datos "mock"/genéricos** → `N8N_WEBHOOK_URL` no apunta a tu n8n,
  o n8n no está arriba. Verifica el `curl` del healthz y la variable en `.env.local`.
- **`no_valid_flight` en muchos destinos** → probablemente tu cuota de SerpAPI se
  agotó, o el destino no está en la tabla IATA (ver el doc de arquitectura).
- **n8n no arranca / falla el import** → revisa que `.env` tiene `N8N_ENCRYPTION_KEY`
  y que Docker Desktop está corriendo. Reinicia con `docker compose down && docker compose up -d`.
- **Login no funciona** → faltan las `FIREBASE_ADMIN_*` en `frontend/.env.local`.
