# Guía rápida (para personal no técnico)

Cómo poner en marcha y usar **Just Enjoy** sin ser informático. Sigue los pasos en
orden. No necesitas saber programar; solo copiar, pegar y pulsar Enter.

> **¿Qué es esto?** Just Enjoy es un planificador de viajes automático. Le das un
> origen, un destino y unas fechas, y te devuelve un plan completo: vuelos, hotel,
> actividades y un itinerario día a día. El "motor" que hace todo eso se llama
> **n8n** y corre en tu propio ordenador dentro de un programa llamado **Docker**.

---

## 1. Instalar lo necesario (solo la primera vez)

Necesitas **dos programas**. Se instalan una vez y ya no se vuelven a tocar.

1. **Docker Desktop** — el contenedor donde vive el motor.
   - Descárgalo de https://www.docker.com/products/docker-desktop/
   - Instálalo con las opciones por defecto (Siguiente → Siguiente → Finalizar).
   - **Reinicia el ordenador** si te lo pide.
   - Ábrelo y espera a que el icono de la ballena (abajo a la derecha, junto al
     reloj) deje de moverse y se quede fijo: eso significa "listo".

2. **Git** — sirve para descargar el proyecto.
   - Descárgalo de https://git-scm.com/download/win
   - Instálalo con las opciones por defecto.

> Si alguien del equipo ya te ha pasado la carpeta del proyecto en un USB o ZIP,
> puedes **saltarte Git** y el paso 2: descomprime la carpeta y ve directo al paso 3.

---

## 2. Descargar el proyecto (solo la primera vez)

1. Abre **PowerShell** (botón Inicio → escribe `PowerShell` → Enter).
2. Copia y pega esta línea y pulsa Enter (descarga el proyecto a tu carpeta de usuario):

   ```powershell
   git clone https://github.com/enriqueizquierdo-lab/TFM_G7_Just_Enjoy.git
   ```

   > Si el repositorio es privado, te pedirá iniciar sesión en GitHub. Usa la
   > cuenta que te haya invitado el equipo.

3. Entra en la carpeta del proyecto:

   ```powershell
   cd TFM_G7_Just_Enjoy
   ```

---

## 3. Preparar las claves (solo la primera vez)

El motor necesita unas "contraseñas" (claves de API) para hablar con los servicios
de vuelos, hoteles y la inteligencia artificial. **Pídeselas a Enrique** (el
responsable técnico): él te dirá si tienes que rellenarlas tú o si te entrega ya el
ordenador configurado.

1. Crea tu fichero de configuración a partir de la plantilla:

   ```powershell
   copy .env.example .env
   ```

2. Abre el fichero `.env` con el Bloc de notas y sustituye cada `changeme` por la
   clave real que te haya dado Enrique. **Guarda y cierra.**

> ⚠️ **Nunca** compartas el fichero `.env` por correo ni lo subas a internet:
> contiene claves secretas. Se queda solo en tu ordenador.
>
> Si te entregan el ordenador ya configurado, este paso puede estar hecho. En ese
> caso pasa directamente al paso 4.

---

## 4. Arrancar el motor

Cada vez que quieras usar Just Enjoy:

1. Comprueba que **Docker Desktop está abierto** (ballena fija abajo a la derecha).
2. En PowerShell, dentro de la carpeta del proyecto, escribe:

   ```powershell
   docker compose up -d
   ```

   La primera vez tarda unos minutos (descarga el motor). Las siguientes, segundos.

3. Comprueba que está en marcha:

   ```powershell
   docker compose ps
   ```

   Debe aparecer una línea con el estado **`Up (healthy)`**. Si lo ves, ¡ya está!

---

## 5. Usar Just Enjoy

Abre el navegador (Chrome, Edge…) y entra en:

```
http://localhost:5678
```

- **La primera vez** te pedirá crear una cuenta (correo + contraseña). Apúntala bien.
- **Las siguientes** entrarás con esa misma cuenta.

Una vez dentro verás el panel de n8n con el flujo **"Planificador de Viajes - v24"**.
Desde ahí el equipo técnico te enseñará a lanzar una planificación.

> Para entrar desde fuera de tu casa/oficina (demos, móvil de un compañero) existe
> una dirección pública vía **ngrok**. Eso lo gestiona Enrique. Todos los detalles
> en **[Acceso a n8n (local y ngrok)](acceso-n8n.md)**.

---

## 6. Apagar al terminar

Cuando acabes, puedes dejar el motor parado (no consume y no pierdes nada):

```powershell
docker compose stop
```

Para volver a usarlo otro día, repite el **paso 4**. Tus datos (cuenta, flujos)
se conservan.

---

## Problemas frecuentes

| Lo que ves | Qué pasa | Qué hacer |
|---|---|---|
| `http://localhost:5678` no abre | El motor no está arrancado | Repite el **paso 4** |
| El comando dice "docker no se reconoce" | Docker Desktop no está abierto/instalado | Abre Docker Desktop y espera a la ballena fija |
| El navegador pide usuario y no lo recuerdas | Cuenta de n8n olvidada | Avisa a Enrique (ver *Recuperación de acceso* en [acceso-n8n.md](acceso-n8n.md)) |
| Errores al planificar un viaje | Suele ser una clave mal puesta en `.env` | Revisa el **paso 3** o avisa a Enrique |

---

_Para más detalle técnico: [README.md](../README.md) · [Acceso a n8n](acceso-n8n.md) · `docker-compose.yml`_
