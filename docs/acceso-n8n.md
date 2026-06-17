# Acceso a n8n — local y a través de ngrok

Guía para iniciar sesión en la instancia de n8n del proyecto, tanto en local
(`localhost`) como a través del túnel público de ngrok.

> **Importante — ambas URLs son la MISMA instancia, alojada en el equipo de
> Enrique Izquierdo (máquina anfitriona del proyecto; no hay servidor remoto).**
> Es el equipo donde están Docker, el `.env` y la cuenta de ngrok
> (`enrique.izquierdo@gmail.com`), y por tanto el **único desde el que se levanta
> el túnel ngrok y se arranca n8n**.
> - `http://localhost:5678` → acceso **solo desde el propio equipo de Enrique**
>   (la máquina donde corre Docker). Nadie más en la red puede usar esta dirección.
> - `https://changeful-knox-bracted.ngrok-free.dev` → la **misma** n8n de ese
>   equipo, pero expuesta a Internet por el túnel ngrok. Solo está disponible
>   **mientras el equipo de Enrique tenga el túnel ngrok y Docker en marcha.**
>   Si su equipo está apagado o sin túnel, la URL no responde y los webhooks
>   externos (Stripe, Telegram…) dejan de llegar.
>
> En ambos casos se entra con las mismas credenciales (es la misma base de datos).

> n8n gestiona su propio login con una **cuenta de propietario** (owner account)
> que se crea la primera vez. El `docker-compose.yml` **no** usa basic auth: las
> credenciales se guardan en el volumen `n8n_data` (base de datos interna de n8n).

---

## Requisitos previos

- Docker Desktop arrancado.
- n8n levantado: `docker compose up -d` desde la raíz del repo.
- (Para el acceso por ngrok) túnel activo — ver [README.md](../README.md) paso 4.

---

## 1. Acceso en LOCAL (desde tu propio equipo)

> Esta es la forma habitual de trabajar tú en tu máquina. Funciona aunque ngrok
> no esté arrancado. No es accesible desde otros equipos.

1. Asegúrate de que n8n está corriendo:

   ```powershell
   docker compose ps        # el contenedor n8n debe estar "Up (healthy)"
   ```

2. Abre en el navegador:

   ```
   http://localhost:5678
   ```

3. Inicia sesión:
   - **Primera vez:** n8n muestra la pantalla *Set up owner account*. Crea el
     usuario propietario (email + contraseña). **Guarda estas credenciales** — son
     las mismas para el acceso local y por ngrok (es la misma instancia).
   - **Veces siguientes:** pantalla *Sign in* → introduce el email y la contraseña
     del owner.

> Si olvidaste la contraseña del owner, ver [Recuperación de acceso](#recuperación-de-acceso).

---

## 2. Acceso a través de NGROK (equipo de Enrique, expuesto a Internet)

Es **la misma instancia y las mismas credenciales** que en local; solo cambia la
URL pública. Sigue siendo el equipo de Enrique: ngrok solo crea un túnel hacia su
`localhost:5678`. Útil para recibir webhooks externos y para demos.

> **El túnel lo levanta Enrique Izquierdo desde su equipo** (es donde está la
> cuenta de ngrok y el authtoken configurado). Ningún otro miembro del grupo
> puede levantar este dominio fijo desde su propia máquina.

1. (Enrique) Levanta el túnel con el dominio fijo (terminal aparte, **déjala abierta**):

   ```powershell
   ngrok http --url=changeful-knox-bracted.ngrok-free.dev 5678
   ```

   Debe mostrar `Session Status: online`.

2. Abre en el navegador:

   ```
   https://changeful-knox-bracted.ngrok-free.dev
   ```

3. Si aparece la **pantalla de aviso de ngrok** (intersticial del plan gratuito),
   pulsa **Visit Site**.

4. Inicia sesión con el **mismo email y contraseña** del owner que en local.

> **Dominio fijo:** `changeful-knox-bracted.ngrok-free.dev` (plan Free, no cambia
> entre reinicios). Inspección de peticiones en vivo: http://127.0.0.1:4040

---

## 3. Otras instancias del equipo (un setup por miembro)

Cada miembro del grupo puede levantar **su propia instancia local de n8n** con
**su propia cuenta y dominio fijo de ngrok**. Son instancias independientes: cada
una vive en el equipo de su dueño, con su propia base de datos (`n8n_data`) y sus
propias credenciales de owner. **No comparten datos** entre sí.

El procedimiento es idéntico al de las secciones 1 y 2, sustituyendo el dominio y
la cuenta por los de cada uno. Cada miembro debe:

1. Crear su cuenta gratuita en [ngrok.com](https://ngrok.com) y copiar su dominio
   fijo del dashboard (*Domains*) y su authtoken (*Your Authtoken*).
2. Configurar el authtoken una vez: `ngrok config add-authtoken <SU_TOKEN>`.
3. Poner su dominio en su `.env` local como `NGROK_URL` (nunca commitear el `.env`).
4. Levantar túnel + Docker como en las secciones 1 y 2.

### Tabla de instancias

> Rellena los `[COMPLETAR-INFO]` cuando cada miembro tenga su setup.

| Miembro | Equipo anfitrión | Cuenta ngrok | Dominio fijo | URL de webhook |
|---|---|---|---|---|
| **Enrique Izquierdo** | Sí (principal) | `enrique.izquierdo@gmail.com` | `changeful-knox-bracted.ngrok-free.dev` | `https://changeful-knox-bracted.ngrok-free.dev/webhook/travel-planner` |
| **Miembro 2** `[COMPLETAR-INFO]` | Sí / No `[COMPLETAR-INFO]` | `[COMPLETAR-INFO]` | `[COMPLETAR-INFO].ngrok-free.dev` | `https://[COMPLETAR-INFO].ngrok-free.dev/webhook/travel-planner` |
| **Miembro 3** `[COMPLETAR-INFO]` | Sí / No `[COMPLETAR-INFO]` | `[COMPLETAR-INFO]` | `[COMPLETAR-INFO].ngrok-free.dev` | `https://[COMPLETAR-INFO].ngrok-free.dev/webhook/travel-planner` |

### Comandos por miembro (plantilla)

**Miembro 2 — `[COMPLETAR-INFO: nombre]`:**

```powershell
# Una sola vez:
ngrok config add-authtoken [COMPLETAR-INFO: authtoken de Miembro 2]
# Cada sesión (terminal aparte, dejar abierta):
ngrok http --url=[COMPLETAR-INFO: dominio de Miembro 2].ngrok-free.dev 5678
```

**Miembro 3 — `[COMPLETAR-INFO: nombre]`:**

```powershell
# Una sola vez:
ngrok config add-authtoken [COMPLETAR-INFO: authtoken de Miembro 3]
# Cada sesión (terminal aparte, dejar abierta):
ngrok http --url=[COMPLETAR-INFO: dominio de Miembro 3].ngrok-free.dev 5678
```

> ⚠️ El **authtoken es secreto**: cada miembro lo configura en su propia máquina y
> **nunca** se escribe en el repo ni en este documento. Aquí solo van el nombre,
> la cuenta (email) y el dominio fijo, que son datos públicos.

---

## Recuperación de acceso

Si pierdes la contraseña del owner y no hay SMTP configurado para el reset, la vía
más rápida en desarrollo es **reiniciar la cuenta de propietario** borrando los
datos. **Esto borra workflows y credenciales guardados** en n8n, así que expórtalos
antes si los necesitas.

```powershell
docker compose down -v        # ⚠️ elimina el volumen n8n_data (borra TODO)
docker compose up -d          # arranca limpio → vuelve a "Set up owner account"
```

Alternativa sin borrar datos: usar la CLI de n8n dentro del contenedor para
resetear el owner (consultar la documentación oficial de n8n para la versión en uso).

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `localhost:5678` no carga | n8n no está arrancado | `docker compose up -d` |
| La URL de ngrok no carga | Túnel caído | Reabre la terminal de ngrok |
| `ERR_NGROK_121` | Agente ngrok obsoleto (<3.20) | `ngrok update` |
| Norton bloquea `ngrok.exe` | Falso positivo `FileRepPup` | Restaurar/excluir en Norton |
| Login no acepta credenciales | Owner distinto / instancia reiniciada | Ver [Recuperación de acceso](#recuperación-de-acceso) |

---

_Relacionado: [README.md](../README.md) · `docker-compose.yml` · `.env.example`_
