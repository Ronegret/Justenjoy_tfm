# Onboarding para desarrolladores — Just Enjoy

Guía para empezar a trabajar en el proyecto: **poner en marcha** el stack en tu
equipo, **probar** el frontend y **contribuir** sin romper nada.

- **Idioma del proyecto:** español (docs y mensajes de commit). Artefactos técnicos
  (variables, rutas, JSON) en inglés.
- **Contrato del repo (léelo entero):** [`AGENTS.md`](AGENTS.md).
- **Puesta en marcha detallada:** [`docs/levantar-stack-local.md`](docs/levantar-stack-local.md).

---

## 1. Arquitectura en 30 segundos

```
Navegador ──► Frontend (Next.js 16, :3000) ──► n8n (Docker, :5678) ──► SerpAPI / OpenAI / Tavily
                     │                              (workflow "Planificador de Viajes v27")
                     └─ Auth: Firebase (Google Sign-In)
```

- **Frontend** (`frontend/`): Next.js 16 + Firebase Auth + Tailwind v4.
- **Backend** (`n8n/`): workflow que orquesta vuelos/hotel/actividades y devuelve el plan.
- **Cada dev corre TODO en su equipo** (frontend + su propio n8n en Docker). Sin depender
  de la máquina de otra persona ni de ngrok.

## 2. Requisitos

- **Docker Desktop** (para n8n).
- **Node.js 20+** y npm (para el frontend).
- **Git**.
- **Claves propias** (cuentas gratuitas): **OpenAI** y **SerpAPI** obligatorias; **Tavily** opcional.
- **Config de Firebase** del proyecto (incluye una *service account*): te la pasa el equipo
  de forma segura (gestor de contraseñas), **nunca por git**.

---

## 3. Puesta en marcha

> Versión resumida. El paso a paso completo, con capturas de comandos y solución de
> problemas, está en [`docs/levantar-stack-local.md`](docs/levantar-stack-local.md).

### 3.1 Clonar

```bash
git clone <repo> && cd Justenjoy_tfm
git checkout develop
```

### 3.2 Backend (n8n) — `.env` de la raíz

```bash
cp .env.example .env
```
Rellena en `.env` **tus** claves: `OPENAI_API_KEY`, `SERPAPI_KEY` (y `TAVILY_API_KEY` si tienes),
y un `N8N_ENCRYPTION_KEY` aleatorio (`openssl rand -hex 32`). Luego:

```bash
docker compose up -d
```
Esto crea n8n en `localhost:5678` e **importa y activa solo** el workflow v27 (no hay que
tocar la UI). Comprueba: `curl http://localhost:5678/healthz` → `{"status":"ok"}`.

### 3.3 Frontend — `frontend/.env.local`

```bash
cd frontend
npm install
cp .env.local.example .env.local   # y rellena los valores
```
En `frontend/.env.local`: la config **Firebase** (`NEXT_PUBLIC_FIREBASE_*` + la *service
account* `FIREBASE_ADMIN_*`) y el webhook de tu n8n:
```
N8N_WEBHOOK_URL=http://localhost:5678/webhook/travel-planner
```

### 3.4 Arrancar y probar

```bash
npm run dev
```
Abre **http://localhost:3000** → **Iniciar sesión** (Google) → **Planificar** → genera un
viaje (p. ej. Valencia → Londres). Verás un plan real con vuelo de ida y vuelta, hotel e
itinerario servido por **tu** n8n.

---

## 4. Cómo contribuir (reglas del repo)

> El contrato completo está en [`AGENTS.md`](AGENTS.md). Lo esencial:

### 4.1 Git Flow
- **Nunca** hagas push directo a `master` ni a `develop`. Todo va por **Pull Request contra `develop`**.
- Crea ramas con prefijo válido: **`bugfix/`**, **`chore/`**, **`docs/`**, **`feature/`**
  (⚠️ `fix/` lo rechaza el hook de git-flow).

### 4.2 Antes de commitear
- Ejecuta el gate local y déjalo **en verde**:
  ```powershell
  .\verify.ps1
  ```
  Comprueba: `.env` ignorado, JSON de n8n válido, typecheck del frontend (`tsc`), lint
  (informativo), y el guardián de secretos (gitleaks) activo.
- **Secretos:** nunca commitees claves, tokens ni URLs con token. Instala el hook una vez:
  ```bash
  pip install pre-commit && pre-commit install
  ```

### 4.3 Mensajes de commit
En **español**, imperativo, con prefijo de tipo: `feat:`, `fix:`, `docs:`, `chore:`,
`test:`, `refactor:`.

### 4.4 Antes del Pull Request
- Pasa una revisión del diff (**`/code-review`** si usas Claude Code) — es obligatorio.
- Funcionalidad **nueva** (feature) requiere una **spec aprobada** en `docs/specs/` antes de
  codificar (ver `AGENTS.md` §4). Los bugfix/chore triviales no.

### 4.5 Si tocas el workflow de n8n
- Edítalo en la UI de n8n, **expórtalo** y actualiza el JSON en `n8n/workflows/` + el doc
  `n8n/docs/Planificador_Viajes_v24_Arquitectura.md`. Así el cambio es reproducible para todos.

---

## 5. Estructura del repo (mapa rápido)

| Ruta | Qué |
|---|---|
| `frontend/` | Portal web (Next.js 16 + Firebase + Tailwind) |
| `n8n/workflows/` | Workflows versionados (el activo es **v27**) |
| `n8n/docs/` | Arquitectura del workflow |
| `n8n/examples/` | Ejemplos de entrada/salida para testing |
| `docs/` | Documentación (arquitectura, specs, guías) |
| `docs/levantar-stack-local.md` | Puesta en marcha detallada |
| `AGENTS.md` | Contrato del repo (léelo) |
| `verify.ps1` | Gate de verificación local (Windows) |
| `docker-compose.yml` | Stack de n8n |

---

## 6. Problemas frecuentes

- **El plan sale con datos genéricos/"mock"** → `N8N_WEBHOOK_URL` no apunta a tu n8n, o n8n
  no está arriba. Verifica `curl http://localhost:5678/healthz` y la variable en `.env.local`.
- **`no_valid_flight` en muchos destinos** → tu cuota de SerpAPI se agotó (250/mes por cuenta),
  o el destino no está en la tabla IATA del workflow.
- **El login no funciona** → faltan las `FIREBASE_ADMIN_*` en `frontend/.env.local`.
- **n8n no arranca** → revisa que Docker está corriendo y que `.env` tiene `N8N_ENCRYPTION_KEY`.
  Reinicia: `docker compose down && docker compose up -d`.
- **`verify.ps1` en rojo por tipos** → hay un error de TypeScript; corrígelo (`cd frontend; npx tsc --noEmit`).

---

## 7. Punteros

- Contrato y reglas: [`AGENTS.md`](AGENTS.md)
- Puesta en marcha detallada: [`docs/levantar-stack-local.md`](docs/levantar-stack-local.md)
- Arquitectura del workflow n8n: [`n8n/docs/Planificador_Viajes_v24_Arquitectura.md`](n8n/docs/Planificador_Viajes_v24_Arquitectura.md)
- Flujo de ramas/PRs: [`docs/git-flow.md`](docs/git-flow.md) · [`CONTRIBUTING.md`](CONTRIBUTING.md)
