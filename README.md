# Just Enjoy — Plataforma de Hiperautomatización para Viajes

**TFM Grupo 7 · EBIS Business TechSchool · 2026**

Integrantes: Roberto Barrios González · Enrique Izquierdo Jiménez · Rodrigo Negrete Aros

---

## Qué es esto

Just Enjoy transforma la planificación de viajes: lo que antes llevaba 30-60 minutos
de trabajo manual por cliente se convierte en un plan personalizado generado en segundos,
con vuelos reales, hotel con buenas valoraciones, actividades ajustadas a los intereses
del viajero, e itinerario día a día.

El sistema cubre el ciclo completo de una agencia de viajes digital:
**Captación → Curación → Transacción → Fidelización**.

---

## Stack tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Orquestador (motor) | n8n self-hosted | 2.23.2+ |
| Agente conversacional | Botpress | — |
| LLM planificador | GPT-4o (migrable a Claude) | — |
| LLM refinamiento | GPT-4o-mini | — |
| Vuelos / Hoteles / Mapas | SerpAPI | — |
| Búsqueda web | Tavily | — |
| Pagos y comisiones | Stripe Connect | (futuro) |
| Portal del viajero | Frontend web | (en desarrollo) |
| Túnel desarrollo | ngrok | — |

---

## Estructura del repositorio

```
TFM_G7_Just_Enjoy/
├── n8n/                  Motor del sistema (workflow orquestador)
│   ├── workflows/        JSONs de workflows importables en n8n
│   ├── docs/             Documentación de arquitectura de cada workflow
│   └── examples/         Ejemplos de entrada/salida para testing
├── frontend/             Portal del viajero (en desarrollo)
├── botpress/             Agente conversacional (en desarrollo)
├── docs/
│   ├── ARCHITECTURE.md   Visión general del sistema
│   ├── adr/              Registro de decisiones de arquitectura
│   └── specs/            Especificaciones de funcionalidades
├── .github/              Configuración de GitHub (CODEOWNERS, plantilla PR)
├── AGENTS.md             Contrato del repo para agentes IA
├── CONTRIBUTING.md       Guía de contribución para el equipo
├── .env.example          Plantilla de variables de entorno
└── verify.ps1            Script de verificación local (Windows)
```

---

## Requisitos

- **Docker Desktop** (Windows) o Docker Engine + Compose (Linux/Mac)
- **Python 3.8+** (para pre-commit y el guardián de secretos)
- **ngrok** (para exponer el webhook en desarrollo)
- Cuentas en: OpenAI · SerpAPI · Tavily · (Stripe para pagos)

---

## Inicio rápido (con Docker)

### 1. Clonar y configurar

```powershell
git clone https://github.com/enriqueizquierdo-lab/TFM_G7_Just_Enjoy.git
cd TFM_G7_Just_Enjoy

# Copiar variables de entorno (NUNCA commitear .env)
cp .env.example .env
# Edita .env con tus claves reales (N8N_ENCRYPTION_KEY obligatorio)

# Configurar git para Windows
git config --global core.autocrlf input

# Instalar guardián de secretos
pip install pre-commit
pre-commit install
```

### 2. Arrancar el stack con Docker

```powershell
# Arrancar n8n en segundo plano
docker compose up -d

# Ver los logs en tiempo real
docker compose logs -f n8n

# Parar
docker compose down
```

n8n estará disponible en: **http://localhost:5678**

### 3. Importar el workflow en n8n

> Cómo iniciar sesión en n8n (local y vía ngrok): ver [docs/acceso-n8n.md](docs/acceso-n8n.md).

1. Abre http://localhost:5678
2. Ve a **Workflows → Import from File**
3. Selecciona `n8n/workflows/Planificador de Viajes v26.json` (versión más reciente)
4. Activa el workflow con el toggle **Publish**

> **Credenciales — ya automatizadas.** No hace falta introducir las API keys a mano
> en la UI. Al arrancar el stack, el servicio `n8n-import` importa la estructura de
> credenciales desde [n8n/credentials/credentials.json](n8n/credentials/credentials.json)
> (sin secretos) y n8n resuelve cada clave desde las variables de entorno del `.env`
> (`OPENAI_API_KEY`, `SERPAPI_KEY`, `TAVILY_API_KEY`). Detalles en
> [n8n/credentials/README.md](n8n/credentials/README.md).

### 4. Exponer el webhook para pruebas

```powershell
# Autentícate una sola vez con el authtoken de tu cuenta ngrok:
ngrok config add-authtoken TU_TOKEN
# Expón n8n con tu dominio FIJO (en otra terminal). No cambia entre reinicios:
ngrok http --url=tu-dominio-fijo.ngrok-free.dev 5678
# La URL ya está en tu .env como NGROK_URL, así que solo reinicia el stack:
docker compose down && docker compose up -d
```

> Con el dominio fijo del plan gratuito solo configuras `NGROK_URL` una vez.
> Los webhooks registrados en servicios externos (Stripe, Telegram…) no se
> rompen al reiniciar ngrok.

### 5. Probar el workflow

```powershell
# Envía un POST al webhook con Postman
# URL: https://tu-dominio-fijo.ngrok-free.dev/webhook/travel-planner
# Body: ver n8n/examples/input-formulario.json
```

### 6. Verificación antes de commitear

```powershell
.\verify.ps1
```

---

## Comandos de desarrollo

```powershell
# Verificación local (SIEMPRE antes de commitear)
.\verify.ps1

# Ejecutar todos los hooks de seguridad manualmente
pre-commit run --all-files

# Validar JSON de workflow
Get-Content n8n/workflows/Planificador_de_Viajes_v24.json | ConvertFrom-Json
```

---

## Seguridad: escaneo de secretos

El repositorio tiene **doble red de seguridad** contra el filtrado de claves de API:

1. **Local (pre-commit + gitleaks nativo):** bloquea el commit en tu máquina si
   detecta un secreto. Requiere instalar gitleaks (ver [CONTRIBUTING.md](CONTRIBUTING.md)).
2. **En la nube (GitHub Actions):** `.github/workflows/secret-scan.yml` ejecuta
   gitleaks en cada push y pull request a `main` y `develop`. Es el gate que protege a todo el
   equipo por igual, sin depender de la máquina de cada uno. Si detecta un secreto,
   el PR se marca en rojo y no debe mergearse.

> Si gitleaks detecta una clave que ya se subió: **rótala inmediatamente** (genera
> una nueva en el proveedor) — una vez en el historial de git, se considera comprometida.

---

## Cómo contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de trabajo en equipo.
Lee [AGENTS.md](AGENTS.md) si vas a usar un agente IA para contribuir.

---

## Cómo reportar un problema

Abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducirlo
- Output de error (sin claves ni tokens)
- Versión de n8n y del workflow

**Si el problema es de seguridad** (posible fuga de secretos, etc.),
**no abras un issue público**: contacta directamente con un integrante del grupo.
