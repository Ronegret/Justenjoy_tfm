# Registro de Actividades de Tratamiento (ROPA / RAT)

**Norma:** RGPD art. 30 · **Hallazgo de auditoría:** #17
**Responsable:** `[COMPLETAR: Grupo 7 — TFM EBIS Business Techschool]` · **Contacto:** soporte@justenjoy.app
**Última actualización:** `[COMPLETAR: fecha]` · **Versión del sistema:** Planificador v39

> **Por qué es obligatorio.** La excepción del art. 30.5 (menos de 250 empleados) **no aplica**
> porque el tratamiento no es ocasional y puede incluir **categorías especiales** (art. 9) a través
> del texto libre de refinamiento (`feedback_text`) — ver hallazgo #4. Por tanto, la ROPA es exigible.

> **Nota.** Los tres almacenes (Firebase, `localStorage`, Supabase) se enlazan por `session_id`,
> **no por `user_id`**: los planes en Supabase no van vinculados directamente a la identidad.

---

## Actividad 1 — Gestión de cuenta y autenticación

| Campo | Contenido |
|---|---|
| Finalidad | Registro, inicio de sesión y mantenimiento de la sesión del usuario |
| Base jurídica | **Art. 6.1.b** (ejecución del contrato / prestación del servicio solicitado) |
| Categorías de interesados | Usuarios registrados del portal |
| Categorías de datos | Nombre, correo electrónico, identificador de cuenta Google; cookie de sesión firmada (`justenjoy-session`) |
| ¿Categorías especiales (art. 9)? | No |
| Origen de los datos | Del propio interesado (registro email/contraseña o Google Sign-In) |
| Destinatarios / Encargados | **Google (Firebase Authentication)** |
| Transferencias a 3.er país | EEUU — **DPF** (adecuación art. 45); ver [TIA.md](TIA.md) · **A VERIFICAR** estatus DPF |
| Plazo de supresión | Mientras la cuenta esté activa; supresión a petición (soporte@justenjoy.app) `[COMPLETAR: plazo máx.]` |
| Medidas de seguridad (art. 32) | Cookie `httpOnly`/`secure`/`sameSite=lax`, verificación server-side (jose + Admin SDK); contraseña gestionada y cifrada por Firebase |

## Actividad 2 — Generación del plan de viaje (orquestación IA)

| Campo | Contenido |
|---|---|
| Finalidad | Generar el itinerario, vuelos, alojamiento y actividades a partir de las preferencias |
| Base jurídica | **Art. 6.1.b** (contrato); para el texto libre con posible art. 9 → **Art. 9.2.a** (consentimiento explícito) — ver #4 |
| Categorías de interesados | Usuarios que usan el planificador |
| Categorías de datos | Origen, destino, fechas, presupuesto, nº de viajeros, estilos, restricciones (incl. `accessibility`), y **texto libre de refinamiento `feedback_text`** |
| ¿Categorías especiales (art. 9)? | **Sí, potencialmente** — `feedback_text` y la opción "accesibilidad" pueden revelar salud/convicciones |
| Origen de los datos | Del propio interesado (formulario + chat de refinamiento) |
| Destinatarios / Encargados | **OpenAI** (gpt-4.1 / gpt-4o-mini), **Anthropic** (fallback), **SerpAPI**, **Tavily**, **Google Maps/Places**; servicios sin datos personales de contacto: **Open-Meteo**, **OpenStreetMap/Nominatim** |
| Transferencias a 3.er país | EEUU — **SCC** (OpenAI, Anthropic, SerpAPI, Tavily) y **DPF** (Google); UE sin transferencia (Open-Meteo, Nominatim). Ver [TIA.md](TIA.md) |
| Plazo de supresión | El plan se persiste en la Actividad 3; los prompts a LLM no se almacenan por Just Enjoy `[COMPLETAR: confirmar retención en cada proveedor]` |
| Medidas de seguridad (art. 32) | `/api/plan-trip` autenticado; **minimización pendiente**: filtrar `feedback_text` antes de enviarlo a LLM y buscadores (la AUP de Tavily prohíbe art. 9) — ver #4 |

## Actividad 3 — Persistencia del plan generado

| Campo | Contenido |
|---|---|
| Finalidad | Guardar el plan para que el usuario lo consulte de nuevo |
| Base jurídica | **Art. 6.1.b** (contrato) |
| Categorías de interesados | Usuarios con plan generado |
| Categorías de datos | `session_id`, origen, destino, fechas, presupuesto, coste total, nº de viajeros, intereses, y el `plan` (jsonb). **Sin email/nombre** (enlazado por `session_id`, no `user_id`) |
| ¿Categorías especiales (art. 9)? | Indirectamente, si el plan refleja preferencias del `feedback_text` |
| Destinatarios / Encargados | **Supabase** (Postgres gestionado) |
| Transferencias a 3.er país | EEUU — **SCC + TIA** (Supabase Inc. es entidad de EEUU) · **A VERIFICAR** región del proyecto |
| Plazo de supresión | Mientras la cuenta esté activa; supresión a petición `[COMPLETAR: plazo]` |
| Medidas de seguridad (art. 32) | **Pendiente**: activar RLS en `travel_plans` (hoy desactivado, #8) y minimizar el uso de `service_role` (#9); cifrado en reposo del proveedor (**A VERIFICAR**) |

## Actividad 4 — Copia local en el dispositivo del usuario

| Campo | Contenido |
|---|---|
| Finalidad | Cache local de viajes para carga rápida |
| Base jurídica | **Art. 6.1.b** + almacenamiento técnico (LSSI art. 22.2, exento) |
| Categorías de datos | Copia de los planes guardados (`localStorage: justenjoy_trips`) |
| Destinatarios | Ninguno — no sale del navegador salvo que el usuario comparta |
| Medidas de seguridad | **Pendiente**: los datos no se cifran en `localStorage` (#22); valorar cifrado o traslado a servidor |

## Actividad 5 — Seguridad y prevención de abuso *(si se implementa)*

| Campo | Contenido |
|---|---|
| Finalidad | Rate-limiting / prevención de uso abusivo del planificador (coste de LLM/APIs) — anunciado en Términos |
| Base jurídica | **Art. 6.1.f** (interés legítimo) — requiere **test de ponderación (LIA)** documentado (#2) |
| Estado | `[COMPLETAR: documentar LIA si se activa]` |

---

> **Estado: Aprobado v1.0 (2026-07-22, Grupo 7 TFM)** — pendiente completar los campos `[COMPLETAR]`. La aprobación no sustituye la validación jurídica.

*Documento de trabajo (TFM). No constituye asesoramiento jurídico.*
