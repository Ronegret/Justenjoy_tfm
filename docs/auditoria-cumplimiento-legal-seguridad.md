# Auditoría de cumplimiento legal y de seguridad — Just Enjoy (Revisión 2)

> 📌 **Documento VIGENTE (Revisión 2).** La **Revisión 1** (evaluación inicial, congelada tal como
> se entregó antes de la remediación) vive en un fichero aparte:
> [`auditoria-cumplimiento-legal-seguridad-rev1.md`](auditoria-cumplimiento-legal-seguridad-rev1.md).

> **Alcance:** frontend Next.js 16 (App Router), orquestador n8n `Planificador_de_Viajes_v38` (27 nodos),
> LLMs OpenAI (`gpt-4.1`/`gpt-4o-mini`) y Anthropic (`claude-3-5-sonnet`), Firebase Auth/Admin,
> Supabase Postgres (`travel_plans`), e integraciones SerpAPI, Tavily, Google Places/Maps,
> Open-Meteo, OpenStreetMap/Nominatim. Botpress y Stripe están **declarados pero NO implementados**.
>
> **Fecha de la auditoría:** 2026-07-22 · **Revisión 2:** 2026-07-22 (tras remediación — ver §0)
> · **Revisión 2.2:** 2026-07-23 (refinamiento del plan en el frontend — ver §0.3)
> · **Revisión 2.3:** 2026-07-30 (E2E del workflow → §0.6; tercera ronda de `/code-review` sobre
> el diff completo de la rama → **§0.7**, con dos hallazgos de cumplimiento: #32 PII del titular
> al LLM y #34 oráculo de subcadenas en la búsqueda de clientes)
> · **Revisión 2.4:** 2026-07-30 (cuarta ronda, sobre los propios arreglos → **§0.8**: #38 el lead
> del titular se perdía al fallar el guardado del plan, #39 invariante de orden de ejecución
> documentada al revés, #40 y #41 en el frontend)
> · **Revisión 2.5:** 2026-07-30 (quinta ronda, pila completa contra `develop` → **§0.9**: #42-#44
> sobre el estado de divergencia con la sesión de n8n y #45 una contradicción interna en la
> Actividad 6 del ROPA)
> **Método:** revisión estática del repositorio con cita `fichero:línea` en cada afirmación sobre el código.
> **Normas evaluadas:** RGPD (arts. 6, 9, 13/14, 22, 25/32, 28, 30, 33/34, 35, Cap. V), LSSI art. 22.2,
> Reglamento de IA (RIA) arts. 4 y 50, Ley 3/1991 de Competencia Desleal / TRLGDCU, y Ley 1/2019 de Secretos Comerciales.
>
> **Nota metodológica:** donde el enunciado de partida asumía un hecho que el código **no** confirma
> (p. ej. "enlace copiado que no copia", "texto libre de feedback/dietético"), se corrige explícitamente.
> Los datos legales sensibles al tiempo se marcan **A VERIFICAR**.

---

## 0. Revisión 2 — estado tras remediación (2026-07-22)

> Esta sección refleja el estado **después** de aplicar las primeras correcciones. La evaluación
> inicial completa (Revisión 1) está congelada en su propio fichero
> [`auditoria-cumplimiento-legal-seguridad-rev1.md`](auditoria-cumplimiento-legal-seguridad-rev1.md).
> La §1 de abajo reproduce el **detalle de hallazgos** (evidencia y acción); para el **estado
> vigente** de cada obligación prevalece la tabla delta de esta §0.

Cambios integrados en `develop` desde la Revisión 1:
- **PR #63** — esta auditoría · **PR #64** — 7 artefactos en `docs/legal/`
- **PR #65** — fixes de UX engañosa (#28, #29) · **PR #66** — endurecimiento n8n (#7, #13) + rename v38→v39
- **PR #70 (REVERT)** — a petición del cliente se **revirtieron #65 y #66**: el workflow vuelve a **v38** (reaparecen la fuga #13 y `:latest`) y el frontend recupera los patrones #28/#29. Los artefactos (#64) **siguen aprobados**.

> ⚠️ **Revisión 2.1 — tras el revert (PR #70).** Los fixes de código #7, #13, #28 y #29 quedaron
> **DESHECHOS**; sus estados vuelven a los de la Revisión 1 (ver columna "Rev2.1"). El rename a v39
> también se revirtió: el workflow vigente es de nuevo **v38**. Los artefactos de `docs/legal/`
> **no** se revirtieron (siguen aprobados v1.0).

### 0.1 Delta de estados

**Correcciones de código: aplicadas en Rev2 y luego REVERTIDAS (PR #70) → vuelven a su estado de Rev1:**

| # | Obligación | Rev1 | Rev2 (fix) | **Rev2.1 (tras revert)** | Nota |
|---|---|---|---|---|---|
| 7 | Pin de imagen n8n | FALTA | ✅ CUMPLE | ↩️ **FALTA** | vuelve a `n8nio/n8n:latest` |
| 13 | Fuga de `_debug`/`_supabase_record` | FALTA | ✅ CUMPLE | ↩️ **FALTA** | responder vuelve a `JSON.stringify($json)` |
| 28 | "Enlace copiado" sin manejo de error | PARCIAL | ✅ CUMPLE | ↩️ **PARCIAL** | `handleCopyLink` sin `try/catch` de nuevo |
| 29 | Botones `alert()` que fingen éxito | FALTA | ✅ CUMPLE | ↩️ **FALTA** | Calendar/email vuelven a `alert()`; `calendar_enabled=true` |

**Artefactos redactados y APROBADOS v1.0 (2026-07-22, Grupo 7 TFM) (FALTA → PARCIAL; siguen PARCIAL porque la aprobación no completa las acciones externas — firmar/portar/implementar/`[COMPLETAR]`):**

| # | Obligación | Rev1 | Rev2 | Borrador |
|---|---|---|---|---|
| 1 | Base jurídica en la política | FALTA | 🟡 PARCIAL | `docs/legal/politica-privacidad.md` (pendiente portar a `/privacy`) |
| 16 | DPA por proveedor | FALTA | 🟡 PARCIAL | `docs/legal/DPA/` (índice + plantilla; pendiente firmar) |
| 17 | ROPA/RAT | FALTA | 🟡 PARCIAL | `docs/legal/ROPA.md` (pendiente `[COMPLETAR]`) |
| 18 | EIPD | FALTA | 🟡 PARCIAL | `docs/legal/EIPD.md` (pendiente validación jurídica) |
| 19 | Transferencias + TIA | FALTA | 🟡 PARCIAL | `docs/legal/TIA.md` (pendiente formalizar SCC) |
| 20 | Procedimiento de brechas | FALTA | 🟡 PARCIAL | `docs/legal/procedimiento-brechas.md` (pendiente adoptar) |
| 23 | Transparencia IA (art. 50) | PARCIAL | 🟡 PARCIAL | `docs/legal/transparencia-ia.md` (pendiente implementar avisos en UI) |
| 24 | Alfabetización IA (art. 4) | FALTA | 🟡 PARCIAL | Mención mínima en `transparencia-ia.md §5` |

**Sin abordar todavía (siguen igual que en Rev1):**
- **FALTA:** #2 (LIA 6.1.f), #4 (filtrado del texto libre art. 9 en código), #8 (RLS Supabase), #15 (DDL/migraciones versionadas), #25 (progreso simulado ~4,5 s), #26 (checklist de tareas inventada).
- **NO APLICA (mejor documentado ahora en EIPD):** #6 (art. 22).

### 0.2 Resumen de estados — Revisión 2.1 (tras el revert PR #70)

| Estado | Rev1 | Rev2 (fix) | **Rev2.1 (tras revert)** |
|---|---|---|---|
| CUMPLE | 1 | 5 | **1** (#21) |
| PARCIAL | 13 | 19 | **20** |
| FALTA | 16 | 6 | **9** (#2, #4, #7, #8, #13, #15, #25, #26, #29) |
| NO APLICA | 1 | 1 | **1** (#6) |

> El revert deja el **código** igual que en la Revisión 1 (reaparecen #7, #13, #28, #29); lo único
> que se conserva de la remediación son los **artefactos aprobados** de `docs/legal/` (#1, #16–20,
> #23, #24 siguen PARCIAL). Los 9 en FALTA son ahora la prioridad, con #8 (RLS) y #13 (fuga) al frente.

> **Prioridad restante:** los 6 en FALTA. Los más críticos para un go-live: **#8** (RLS Supabase) y
> **#4** (filtrado de categorías especiales antes de LLM/buscadores).

### 0.3 Cambios del 2026-07-23 — refinamiento del plan en el frontend (rama `feature/refinamiento-plan-frontend`)

> ⚠️ **Sin fusionar.** Los cambios están commiteados en la rama, aún no en `develop` ni en el
> remoto. La spec (`docs/specs/2026-07-23-refinamiento-plan-frontend.md`) quedó **APROBADA el
> 2026-07-30**, con el cambio de contrato de la API que exige AGENTS.md §3.2 (incluida la
> decisión D7: `refine_token` + `REFINE_TOKEN_SECRET`). Esta entrada documenta su **impacto de
> cumplimiento** para que se evalúe **antes** del merge.

**Qué se ha añadido (RUTA B de n8n, ya existente, ahora consumida desde el portal):**
- **Panel de refinamiento con caja de texto libre** en la página de detalle del viaje:
  `frontend/src/components/trip/RefineTripPanel.tsx:93-100` (`<textarea>` "¿Qué cambiarías de este
  plan?") + chips de sugerencia preset (`:15-21`). Se monta solo si el plan tiene `session_id`
  (`frontend/src/app/trip/[id]/page.tsx:145-149`).
- **Ruta interna nueva** `frontend/src/app/api/refine-trip/route.ts` → reenvía `{ session_id,
  feedback_text }` al webhook `travel-refine`; **auth obligatoria** con `requireSession` (`route.ts:32`),
  mismo gate que `/api/plan-trip`.
- **Refactor:** `mapN8nToTripData`/`requireSession` extraídos a `frontend/src/lib/n8nPlan.ts` y
  `frontend/src/lib/requireSession.ts` (compartidos por ambas rutas; `plan-trip/route.ts` −790 líneas).
- **`session_id` explícito** en `TripData` (`frontend/src/types/trip.ts:174-181`) y en la respuesta
  mapeada; `refineTrip(...)` en `frontend/src/context/TripContext.tsx:212-268`.
- **Env nueva** `N8N_REFINE_WEBHOOK_URL` (server-only, documentada en `.env.example` y
  `frontend/.env.local.example`); ejemplo `n8n/examples/input-refine.json`; doc `docs/ARCHITECTURE.md`.

**Impacto de cumplimiento:**

| # | Efecto del cambio | Estado |
|---|---|---|
| **4** | **MATERIALIZADO y luego MITIGADO (mismo día).** La Rev1/2.1 anotaba que el contrato `feedback_text` existía en n8n **pero "el portal nunca lo invoca"**. Este cambio lo expuso en la UI (`RefineTripPanel.tsx`, texto libre → `/api/refine-trip` → LLM + SerpAPI/Tavily). **Mitigación aplicada el 2026-07-23** (ver §0.4): (a) **aviso permanente** de reencuadre funcional en el panel; (b) **guardarraíl server-side** en `/api/refine-trip` (`frontend/src/lib/sensitiveData.ts`) que **no reenvía** el texto si detecta categorías especiales (responde `blocked_sensitive`), respetando la AUP de Tavily; (c) pre-chequeo en cliente y **no-logging** del `feedback_text`. **Pendiente** (no de código): base jurídica/consentimiento en la política de privacidad (Artefacto 1) y el vector estructurado de accesibilidad del wizard (RUTA A). | 🟡 **PARCIAL** (control técnico del texto libre en vigor; base jurídica pendiente) |
| **13** | El nuevo webhook `travel-refine` comparte el patrón de respuesta cruda de la RUTA A → **misma fuga potencial** de campos internos (`_debug`/`_supabase_record`/`session_state`) para quien llame **directo** al webhook. El frontend sí limpia (usa el mismo `mapN8nToTripData`), pero la superficie expuesta por ngrok crece de 1 a 2 webhooks. | **FALTA** (sin cambio de estado; superficie ampliada) |
| — | **Positivos del diseño:** ruta interna **autenticada** (`requireSession`, `route.ts:32`); env **server-only** y documentada; **no** se envía `current_plan` (minimización — n8n reconstruye desde memoria); la **PII del titular no se reenvía** a n8n en el refinamiento, se conserva en cliente (`TripContext.tsx:255-258`). | ✅ buenas prácticas |
| — | **Nuevo dato en cliente:** `session_id` (identificador interno de n8n) pasa a `TripData` y a `localStorage`. Riesgo bajo (ya coincidía con `trip_id`), pero documentar en la política/ROPA como identificador técnico. | 🟡 documentar |

> **Recomendación previa al merge (mitigación de #4):** añadir en `RefineTripPanel.tsx` un **aviso
> visible** antes de la caja ("no incluyas datos de salud, religión u otros datos sensibles") y/o un
> **filtro server-side en `/api/refine-trip`** que detecte/pseudonimice categorías especiales antes de
> reenviar a n8n. Es el momento óptimo: el contrato aún no está aprobado ni fusionado.
> ✅ **HECHO el 2026-07-23 — ver §0.4.**

### 0.4 Mitigación de #4 aplicada (2026-07-23) — guardarraíl de categorías especiales

Implementada en la misma rama, como parte de resolver el hallazgo #4 sobre el texto libre de
refinamiento. **Defensa en profundidad** en tres capas:

1. **Reencuadre funcional en la UI** — aviso permanente bajo la caja de texto en
   `frontend/src/components/trip/RefineTripPanel.tsx`: *"Usa este espacio solo para preferencias de
   viaje… no incluyas datos de salud, religión, ideología u otros datos personales sensibles"*. Es la
   defensa principal: el campo se acota explícitamente a datos funcionales.
2. **Guardarraíl server-side (autoritativo)** — `frontend/src/lib/sensitiveData.ts`
   (`scanForSpecialCategoryData`) detecta señales de las 6 categorías del art. 9 (salud, religión,
   orientación sexual, ideología, afiliación sindical, origen étnico). `frontend/src/app/api/refine-trip/route.ts`
   lo invoca **antes** de contactar con n8n: si hay coincidencia, responde `blocked_sensitive` y **no
   reenvía nada** al LLM ni a los buscadores → respeta la AUP de **Tavily** (§7.2) y minimiza. El
   `feedback_text` **no se registra** en logs.
3. **Pre-chequeo en cliente + UX** — `TripContext.refineTrip` corre el mismo módulo antes de la
   llamada de red (evita la ida y vuelta) y `RefineTripPanel` muestra un mensaje claro pidiendo
   reformular en términos de viaje; el plan actual se conserva intacto.

**Diseño consciente:** el detector es **best-effort** y **no bloquea preferencias funcionales
legítimas** (hotel accesible, zona "gay-friendly", menú vegetariano) para no incurrir en sobrebloqueo
—solo marca la revelación de un atributo personal sensible ("soy diabético", "soy musulmán", "comida
halal")—. Documentado como control complementario, **no sustituto de la base jurídica**.

**Qué NO cubre esta mitigación (queda abierto):**
- **Base jurídica / consentimiento (9.2.a) e información previa** en la política de privacidad →
  **Artefacto 1** (sigue PARCIAL).
- **Vector estructurado de accesibilidad** del wizard (`accessibility`/`accessible`/`pet_friendly`,
  RUTA A) → tratamiento intencional de datos funcionales que requiere base/aviso en la política, no un
  filtro (un toggle de accesibilidad no se puede "bloquear"). Recomendado: microaviso + base en la
  política (Artefacto 1).
- **Pseudonimización aguas abajo en n8n** (lo que el agente de refinamiento envíe a Tavily) →
  backend/Rodrigo, fuera del alcance del frontend.

> Con la capa (2) el texto libre sensible **ya no sale del servidor del portal** hacia LLM/buscadores.
> Por eso #4 pasa de FALTA a **PARCIAL**: el riesgo técnico principal está contenido; resta la
> formalización jurídica (Artefacto 1) y el vector estructurado.

Ficheros de la mitigación: `frontend/src/lib/sensitiveData.ts` (nuevo),
`frontend/src/app/api/refine-trip/route.ts`, `frontend/src/context/TripContext.tsx`,
`frontend/src/components/trip/RefineTripPanel.tsx`, `frontend/src/types/planResult.ts`,
`docs/ARCHITECTURE.md`.

### 0.5 Control de acceso al plan en el refinamiento (2026-07-23) — RGPD art. 32

Detectado en la revisión de la propia rama, **antes de fusionar**: `/api/refine-trip`
autenticaba la petición pero **no comprobaba que el `session_id` fuera del usuario que lo
enviaba**. Como el identificador lo aporta el cliente y la ruta devuelve el plan completo
mapeado, cualquier usuario con cuenta que conociera un `session_id` ajeno podía **leer el
itinerario de otra persona** (destino, fechas, hotel, vuelos, presupuesto) y además mutar su
sesión en la memoria de n8n. *(Matiz verificado en el E2E del 2026-07-30: **no** llegaba a
escribir en Supabase, porque el refinamiento no se persiste — ver §0.6; el acceso indebido a
los datos del plan sí era real.)* Agravante: el `session_id` se genera con
`Math.random()` (`n8n/nodes-code/01_validar_formulario.js:9`), no con un CSPRNG.

**Corregido en la misma rama:** `/api/plan-trip` firma el par (`uid` de Firebase,
`session_id`) con HMAC-SHA256 y un secreto server-only (`REFINE_TOKEN_SECRET`) y lo devuelve
como `refine_token`; `/api/refine-trip` lo verifica contra el `uid` de la cookie y rechaza con
`not_refinable` si no casa. Falla cerrado si no hay secreto. El `session_id` deja de
registrarse en logs. Ficheros: `frontend/src/lib/refineToken.ts` (nuevo),
`frontend/src/lib/requireSession.ts`, `frontend/src/app/api/plan-trip/route.ts`,
`frontend/src/app/api/refine-trip/route.ts`.

> **Pendiente relacionado (no bloqueante):** generar el `session_id` con `crypto.randomUUID()`
> en el nodo de n8n — es del backend (Rodrigo). Con la firma en vigor ya no es explotable
> desde el portal, pero sigue siendo un identificador débil para quien llame al webhook directo
> (ver #13).

### 0.6 E2E del workflow v39 (2026-07-30) — hallazgos nuevos

Ejecutados **todos los comportamientos de los tres webhooks** contra la instancia local
(9 casos; ver el detalle en el informe de la sesión). Resultado: el flujo funciona de punta a
punta y se **cierran dos bugs** que seguían anotados como abiertos (truncamiento en viajes
largos y `travelers_count=0`). Dos hallazgos nuevos, ambos de **backend/Rodrigo**:

> ✅ **RESUELTOS Y VERIFICADOS EN VIVO el 2026-07-30** (rama `fix/persistencia-revisiones-y-titular`,
> workflow v40 publicado y las dos migraciones aplicadas en Supabase).
>
> **Evidencia #30:** plan + refinamiento sobre la misma sesión → **2 filas** en `travel_plans`,
> con `plan.revision_snapshot` 0 y 2, y coste 1165 → 289 USD. Antes: 1 fila.
> **Evidencia #31:** dos viajes del mismo titular (`marta.lopez.v40@example.com`, Lisboa y Oporto)
> → **2 filas** en `plan_holders`, y `holders-search` devuelve **ambos** `session_id` buscando por
> nombre y por email. Antes: 1 fila y solo la primera sesión.
>
> _(Redacción previa, ya superada: corregidos en la rama, pendientes de aplicar por infra.)_ El arreglo son dos migraciones SQL +
> quitar el `onError` de los dos nodos de escritura; ver
> [spec](specs/2026-07-30-persistencia-revisiones-y-titular-por-sesion.md) y
> [runbook](runbooks/2026-07-30-activacion-v40-revisiones.md). El DDL **no se puede aplicar por
> REST**, así que #30 y #31 siguen vivos en la instancia hasta que infra ejecute las migraciones
> en el SQL Editor de Supabase. Ambos constraints causantes quedaron **confirmados
> empíricamente** el 2026-07-30 (violación `23505` en los dos casos).

| # | Hallazgo | Estado |
|---|---|---|
| **30** | **El refinamiento no se persiste y el fallo se silencia.** `Supabase — Guardar Plan` es un `create`; el segundo guardado de una sesión ya existente se rechaza y `onError: continueRegularOutput` se lo traga, así que el webhook responde 200 con el plan refinado que **nunca se guardó**. Verificado: tras refinar, `travel_plans` mantiene 1 fila con `created_at == updated_at`. Viola AGENTS.md §5 (no silenciar errores) y deja el plan refinado sin copia server-side. Corrección: `upsert` por `session_id` (o insertar una revisión nueva) y **dejar de tragarse el error**. **[2026-07-30] CORREGIDO EN CÓDIGO (v40):** migración `2026-07-30_0002_travel_plans_revisiones.sql` quita el `UNIQUE` de `session_id` (cada `plan_ready` deja su fila; el nº de revisión ya viaja en `plan.revision_snapshot`) y se elimina el `onError` del nodo. **Pendiente de que infra aplique la migración.** | ✅ **RESUELTO** (verificado en vivo 2026-07-30) |
| **31** | **La dedup de `plan_holders` por email oculta los viajes posteriores del mismo cliente.** El segundo plan de un titular ya registrado no crea fila, así que `plan_holders` conserva el `session_id` del **primero** y la búsqueda del dashboard solo encuentra ese. Verificado con dos planes del mismo email: la búsqueda por nombre, email y teléfono devuelve siempre la primera sesión. Corrección: relación 1:N titular→sesiones, o actualizar la fila con la sesión más reciente. **[2026-07-30] CORREGIDO EN CÓDIGO (v40):** migración `2026-07-30_0003_plan_holders_por_sesion.sql` sustituye `uq_plan_holders_email` por `UNIQUE (email, session_id)` → una fila por viaje, con evidencia de consentimiento por viaje. Sin cambios de código (el buscador ya deduplica). **Pendiente de que infra aplique la migración.** | ✅ **RESUELTO** (verificado en vivo 2026-07-30) |

> ⚠️ **Hallazgo colateral del E2E de v40 — ventana de carrera al refinar.** Si se refina un plan
> **inmediatamente** después de recibirlo (≈1,5 s), la RUTA B responde `Sesión no encontrada`
> (HTTP 400): n8n vuelca el `staticData` de la sesión a su BD de forma **asíncrona**, y el
> refinamiento lee antes de que aterrice. Con unos segundos de margen funciona (verificado: mismo
> caso a 8 s → `revision_count: 2`). No lo causa v40 —es cómo n8n persiste `staticData`— y en la
> UI real el usuario tarda en escribir su ajuste, pero conviene documentarlo: el frontend ya
> maneja ese 400 como `session_expired` sin romperse, aunque el mensaje que muestra
> ("la sesión ha caducado") es engañoso en este caso concreto. No es un problema de cumplimiento;
> se anota aquí porque salió del mismo E2E.

> **Confirmado en vivo el #13:** la respuesta cruda del webhook sigue devolviendo `_debug`,
> `_supabase_record` y `_skip_supabase` a quien llame directo. El frontend los descarta al
> mapear, pero la superficie expuesta por ngrok es real y ahora son dos webhooks.

### 0.7 Tercera ronda de `/code-review` (2026-07-30) — diff completo de la rama

Revisión del diff `master...HEAD` (80 ficheros) antes del PR, ya con la v40 publicada y las
cuatro migraciones aplicadas. **Seis hallazgos, los seis corregidos en la misma rama**; dos son
de cumplimiento (#32 y #34), el resto de correción funcional. Ninguno estaba en la tabla de la §1.

| # | Hallazgo | Corrección | Estado |
|---|---|---|---|
| **32** | **PII del titular enviada a OpenAI en cada plan (RGPD 5.1.c / 28 / ROPA Act. 6).** `Validar Formulario` arrastra `travel_brief.holder` —nombre, teléfono y email del cliente— como passthrough para `plan_holders`, pero el `session_state` seguía hasta el prompt del planificador, que lo serializa entero (`{{ JSON.stringify($json.session_state) }}`). Contradecía la nota del propio nodo ("el planificador no lo usa"), el recorte que el frontend ya hace en `bodyForLlm` y la Actividad 6 del ROPA, que declara **Supabase como único destinatario** del titular. Sin base jurídica para esa comunicación y sin DPA que la cubra (#16). | `04_preparar_motor.js` reenvía una **copia** del `session_state` sin `holder`. Es la única entrada al motor, común a las rutas A y B. La rama de `plan_holders` no se ve afectada (lee la salida de `Validar Formulario`) y `travel_plans` nunca recibió el titular. Cubierto por asserts en `_smoketest.js`. Ver `n8n/docs/Planificador_Viajes_v40_Arquitectura.md` §7.1. | ✅ **RESUELTO y VERIFICADO EN VIVO** (plan real del 2026-07-30 con titular: su email no aparece ni en la salida de `Preparar Motor Planificador` ni en el nodo del agente de OpenAI) |
| **33** | **El "Deshacer el ajuste" no revierte la sesión de n8n.** El deshacer recién añadido restaura el plan en el frontend, pero `Validar Output del Planificador` ya escribió el plan refinado en el `staticData` y `Cargar Sesión` parte **siempre** de ahí (ignora cualquier `current_plan` del cuerpo), así que el siguiente ajuste reaplicaba en silencio lo deshecho. | No hay arreglo posible desde el frontend (no guarda el plan crudo — D3 de la spec). Se hace **visible**: el panel avisa de la divergencia mientras dura (`refineBaseOutOfSync`) y sugiere crear un plan nuevo para partir del que se ve. El arreglo de fondo es de backend (contrato de `travel-refine`) → Rodrigo. | 🟡 **MITIGADO** (avisado, no revertido) |
| **34** | **`/api/holders/search` era un oráculo de subcadenas sobre `plan_holders` (RGPD 32).** El endpoint autenticaba pero **no** comprobaba que los `session_id` fueran del solicitante, al contrario que `/api/refine-trip` en esta misma rama. Con prefijos crecientes ("a", "ab", "abc"…) contra un `session_id` ajeno, el booleano casa/no-casa **reconstruye el email o el teléfono del titular carácter a carácter**, aunque la respuesta solo devuelva `session_id`. Invalida el riesgo que la spec del buscador había documentado como *aceptado*. | El endpoint exige `refine_token` **por plan** y verifica cada uno contra el `uid` de la cookie (misma prueba que el refinamiento, `lib/refineToken`); descarta el resto antes de llamar a n8n, y filtra la respuesta contra los ids acreditados. Sin `REFINE_TOKEN_SECRET` responde 503 (falla cerrado). Cambio de contrato del endpoint interno (`sessions[]`), enmendado en la spec del buscador. | ✅ **RESUELTO** |
| **35** | **El chip de India rompía el ancla geográfica de las actividades.** `New Delhi` estaba en `cityToIata` pero no en `cityToGps`, así que `destination_city_ll` salía `null` y los resultados de Maps aparecían en otra ubicación (el system prompt marca ese campo como CRÍTICO). | `'new delhi'` añadido a `cityToGps`. Verificado que **los 67 valores de chip de ciudad** resuelven ahora en las dos tablas; era el único asimétrico. Assert en `_smoketest.js`. | ✅ **RESUELTO** |
| **36** | **Resultados de búsqueda obsoletos en el dashboard.** Si `/api/holders/search` respondía distinto de 200, el efecto salía sin limpiar `serverMatchIds`: las coincidencias de la consulta **anterior** seguían mostrándose —y contando en la fila de estadísticas— para la consulta nueva. Falso positivo silencioso. | Se limpia el conjunto también en la rama de error. | ✅ **RESUELTO** |
| **37** | **`N8N_HOLDERS_SEARCH_WEBHOOK_URL` solo en la plantilla de la raíz.** La lee el frontend, y Next **no** lee el `.env` de la raíz: quien montara el entorno desde `frontend/.env.local.example` se quedaba sin búsqueda persistente (503) sin pista de por qué. | Añadida a `frontend/.env.local.example` con su explicación; nota en `.env.example` de que también hace falta en el frontend. | ✅ **RESUELTO** |

### 0.8 Cuarta ronda de `/code-review` (2026-07-30) — sobre los arreglos de la §0.7

Revisión de los dos commits propios de la rama sobre su padre. Cuatro hallazgos, **los cuatro
corregidos**. Los dos primeros son de n8n y salieron de leer el motor de ejecución, no el grafo.

| # | Hallazgo | Corrección | Estado |
|---|---|---|---|
| **38** | **Quitar el `onError` de `Supabase — Guardar Plan` (#30) hacía que se perdiera el lead del titular.** n8n recorre las ramas en **profundidad** y un nodo que falla sin `onError` hace `break`, descartando la pila pendiente. La rama del titular esperaba ahí su turno, así que un fallo del insert del plan la dejaba **sin ejecutar** — rompiendo justo lo que esa rama existía para garantizar ("que el lead se guarde aunque la planificación no llegue a `plan_ready`"). **Confirmado en la BD de n8n**, ejecución 78: `runData` no contiene `Preparar Payload Titular` y la pila al abortar era `['Supabase — Guardar Plan', 'Preparar Payload Titular']`. La prueba en vivo del runbook no lo vio porque hizo fallar los dos nodos a la vez y dio por ejecutado el segundo. | La persistencia del titular pasa a una **sub-ejecución** del mismo workflow (dos nodos nuevos, mismo id, `waitForSubWorkflow: false`), lanzada **antes** de la planificación. Aislamiento en los dos sentidos: el plan no puede matar al lead ni el lead al plan. Ver §7.3 del doc de arquitectura de v40 y **D4** de la spec de persistencia. | ✅ **RESUELTO y VERIFICADO EN VIVO** (paso 7 del runbook reejecutado: ejecución 83 `webhook`/`error` con la pila pendiente reducida a su propio nodo + ejecución 84 `integrated`/`error` con los 3 nodos del titular ejecutados; y en el camino feliz, 85/86 en `success` con 1 fila en cada tabla) |
| **39** | **La invariante documentada estaba al revés.** El doc de arquitectura afirmaba que bajo `executionOrder: v1` el orden lo decide el **índice de la conexión** y que por eso reordenar el canvas era inocuo. Falso: las dos ramas del fan-out salen del **mismo `main[0]`** y el orden lo decide la **posición** (verificado en el comparador de `workflow-execute.js`: `y` menor primero, empate por `x` menor). Con esa creencia, el commit `707c938` ("reordena el canvas sin tocar la lógica") pudo haber hecho que un fallo de Supabase costara el plan al usuario. | §3 reescrita con la regla real y la advertencia de que **reordenar el canvas cambia el orden de ejecución**; corregida también la descripción de la prueba en vivo en el runbook. La verificación de topología comprueba ahora las dos precedencias que importan. | ✅ **RESUELTO** |
| **40** | **El aviso de divergencia con n8n (#33) aparecía en el viaje equivocado.** `refineBaseOutOfSync` era un booleano global y `setCurrentTripById` no lo limpiaba: tras deshacer en el viaje A, el aviso salía también en el B, sin forma de quitarlo. | El estado pasa a guardar el `trip_id` afectado; el aviso solo se muestra en ese viaje. | ✅ **RESUELTO** |
| **41** | **El guardarraíl recortado dejó de detectar un `itinerary` vacío.** Al eliminar la comparación de longitudes, `isPlaceholderItinerary` (que exige `length === 1`) no cubre el array vacío, que antes caía por longitud. | Comprobación explícita de "vacío o ausente" —no de "menos días que antes"—, con la misma justificación que la de vuelos: el mapper nunca lo devuelve vacío y la vista accede a `itinerary[0]` sin guarda. | ✅ **RESUELTO** |

### 0.9 Quinta ronda de `/code-review` (2026-07-30) — pila completa contra `develop`

Revisión de los 16 commits de la pila (~4,7k líneas). Cuatro hallazgos, los cuatro corregidos;
tres son del estado de divergencia introducido en §0.8 y uno es de coherencia documental.

| # | Hallazgo | Corrección | Estado |
|---|---|---|---|
| **42** | **El descarte del guardarraíl no marcaba la divergencia.** Cuando se rechaza un refinamiento incompleto, n8n **ya** lo había escrito en su `staticData` (lo hace `Validar Output del Planificador` antes de responder), pero no se marcaba `outOfSyncTripId`: se le decía al usuario "tu plan sigue intacto" —cierto solo en el navegador— y el siguiente ajuste partía del plan rechazado. Es el mismo escenario del que `undoRefine` sí avisaba. | Se marca la divergencia también al descartar, y el aviso del panel se reescribe para cubrir **las dos** vías sin mencionar cuál fue (antes decía "has deshecho un ajuste", falso en este caso). El mensaje de error deja de prometer intacto sin matices. | ✅ **RESUELTO** |
| **43** | **Carrera al navegar durante un refinamiento.** `setCurrentTrip(refined)` corría tras un `await` de varios segundos sin comprobar que el usuario siguiera en ese viaje: cambiando de viaje a media petición, `/trip/B` pintaba el contenido del viaje A. | `setCurrentTrip` pasa a la forma funcional y solo sustituye si el viaje mostrado sigue siendo el refinado. `saveTrip` se mantiene siempre (va indexado por `trip_id`, así que persistir es correcto en cualquier caso). | ✅ **RESUELTO** |
| **44** | **`generateTrip` borraba la divergencia de otros viajes.** Limpiaba `outOfSyncTripId` en global, deshaciendo en parte el arreglo por-viaje de #40. | Se limpia solo si el marcador es del viaje nuevo. El snapshot de deshacer sí se sigue descartando entero, y queda anotado por qué: solo se ofrece dentro del mensaje de éxito del panel, que muere al salir de la pantalla. | ✅ **RESUELTO** |
| **45** | **Dos celdas de la Actividad 6 del ROPA se contradecían**: una daba el job `purge_plan_holders_24m` por activo y **verificado en `cron.job`** (lo que exige acceso SQL) y la de al lado seguía diciendo que la migración que crea la RLS estaba **pendiente de aplicar por infra**. En un artefacto de cumplimiento, una de las dos sobra. | Se elimina la contradicción con lo que **sí** consta (tabla en uso, escritura por `service_role` verificada el 2026-07-30, dedup de la 0003 en vigor, job verificado por SQL ese día) y se deja explícito lo que **no** se puede verificar desde el repo: el flag de RLS no es legible por REST y el `.env` local no tiene clave `anon`. El **A VERIFICAR** se cerró el mismo día: `SELECT relrowsecurity FROM pg_class WHERE relname = 'plan_holders'` → **`true`** (Enrique, SQL Editor de Supabase). La RLS de `plan_holders` está **aplicada y verificada**; no confundir con `travel_plans`, que sigue **sin** RLS por decisión del equipo (#8/#9). | ✅ **RESUELTO y VERIFICADO** |

> **Revisado y sin hallazgo** en esta quinta ronda: el diseño de la prueba de propiedad, el
> contrato nuevo de `holders/search`, `withRefreshedDates` y la topología de la sub-ejecución del
> titular. Verificado además que la extracción de `lib/n8nPlan.ts` es un movimiento fiel (las
> únicas adiciones de comportamiento son `session_id` en el viaje mapeado, las constantes de
> relleno compartidas y `ensureWarnings`), que `requireSession` es equivalente a los chequeos que
> sustituye, y que los 12 Code nodes coinciden byte a byte con el `jsCode` incrustado en la v40.

> **Revisado y sin hallazgo** en la cuarta ronda (§0.8): la comprobación de propiedad de
> `/api/holders/search` (incluido el filtro final contra los ids acreditados), los type guards y el
> rechazo de `changeme` en `verifyRefineToken`, la guarda de fechas incoherentes de
> `withRefreshedDates`, el strip de PII de `04_preparar_motor.js` (ningún prompt vuelve a ver el
> `holder` y la rama de `plan_holders` sigue leyendo `Validar Formulario`) y las tres migraciones
> SQL (idempotentes; `session_id` es `NOT NULL`, así que el UNIQUE parcial `(email, session_id)`
> deduplica de verdad).

> **Revisado y sin hallazgo** en la tercera ronda (§0.7): el HMAC de `refineToken` (falla cerrado con
> `changeme`, comparación en tiempo constante, con type guards), la guarda de fechas incoherentes
> de `withRefreshedDates`, el guardarraíl de no-regresión ya recortado del refinamiento, las
> ventanas de negación de `sensitiveData`, el round-trip de los 12 Code nodes y la eliminación del
> `onError` en los dos nodos de Supabase (respaldada por la prueba en vivo de §3 del doc de
> arquitectura: la respuesta sale antes de la rama de persistencia).

---

## 1. Detalle de hallazgos (evidencia y acción)

> Los **estados** de esta tabla son los de partida (se conservan por trazabilidad). Para el
> **estado vigente** tras la remediación, consulta la **§0**. Los ítems #1, #7, #13, #16-20, #23,
> #24, #28, #29 han cambiado; el resto no. La instantánea íntegra de la evaluación inicial está en
> [`auditoria-cumplimiento-legal-seguridad-rev1.md`](auditoria-cumplimiento-legal-seguridad-rev1.md).


| # | Obligación | Evidencia (`fichero:línea`) | Estado | Hueco y corrección |
|---|---|---|---|---|
| 1 | **RGPD 6.1.b (contrato)** | `frontend/src/app/privacy/page.tsx:70-77` — describe la finalidad pero **no nombra base jurídica alguna** | **FALTA** | No se declara ninguna base del art. 6. Añadir sección "Base jurídica" en `privacy/page.tsx`: generación del plan y cuenta = 6.1.b; ver ROPA (Artefacto 2). |
| 2 | **RGPD 6.1.f (interés legítimo + test 3 pasos)** | Sin evidencia en repo | **FALTA** | No hay test de ponderación (LIA) documentado para ningún tratamiento (p. ej. logging, antifraude/rate-limit citado en `frontend/src/app/terms/page.tsx:46-53`). Documentar LIA en `docs/legal/` si se invoca 6.1.f. |
| 3 | **RGPD 6.1.a (consentimiento)** | `frontend/src/components/shared/CookieNotice.tsx:9-13`; no hay recogida de consentimiento para IA | **PARCIAL / N/A** | Cookie técnica no requiere consentimiento (correcto). Pero el envío de datos a LLM (§4 de la política) no tiene base declarada. Ver #6. |
| 4 | **RGPD 9 (categorías especiales – feedback libre / dieta)** | **[ACTUALIZADO 2026-07-23 — ver §0.3]** El campo de texto libre `feedback_text` **ya se expone en la UI**: `frontend/src/components/trip/RefineTripPanel.tsx:93-100` (`<textarea>` en `/trip/[id]`) → `/api/refine-trip` → webhook `travel-refine`. Antes solo existía en el contrato n8n. El backend lo procesa un agente de refinamiento vía LLM → `n8n/nodes-code/02_cargar_sesion.js:3` y `:15-26`. Vectores estructurados del art. 9: `accessibility`/"Necesito accesibilidad" (`frontend/src/components/planner/PreferenceWizard.tsx:57`, `ChatPlanner.tsx:192`) y `accessible`/`pet_friendly`/`kids_friendly`. Todo va a `special_requirements`/`feedback_text` → LLM (`route.ts:235`, `route.ts:1128`) y a buscadores (SerpAPI/Tavily) | **FALTA** | **[CORREGIDO tras contraste con anexo oficial]** Mi dictamen previo ("no existe texto libre") era erróneo: el wizard inicial es estructurado, pero el **contrato de refinamiento sí expone `feedback_text`** (texto libre, ~350 car. según memoria/`frontend_funcionalidades.md`) que puede revelar salud/religión/convicciones (art. 9). No hay doble cerrojo, ni consentimiento explícito (9.2.a), ni aviso previo, ni minimización/filtrado. **Refuerzo verificado (anexo §5):** la AUP de **Tavily prohíbe enviar datos del art. 9** — mandar el texto libre sin filtrar a Tavily/SerpAPI incumpliría además su propia AUP. Corrección: (a) advertir antes de marcar "accesibilidad" y antes del campo de feedback; (b) consentimiento explícito 9.2.a o reencuadre funcional; (c) **filtrar/pseudonimizar el texto libre antes de enviarlo a LLM Y a buscadores**. **[MITIGADO 2026-07-23 — §0.4]** Aplicado (a) aviso permanente en el panel, (b) reencuadre funcional del campo y (c) guardarraíl server-side (`lib/sensitiveData.ts`) que **no reenvía** el texto si detecta categorías especiales. Estado vigente → **PARCIAL** (resta base jurídica en la política, Artefacto 1, y el vector estructurado de accesibilidad). |
| 5 | **RGPD 13/14 (política de privacidad)** | `frontend/src/app/privacy/page.tsx:19-127` | **PARCIAL** | Existe y es legible; cubre datos, finalidad, encargados (§4), plazos (§5), derechos (§6). **Faltan**: base jurídica (art. 13.1.c), transferencias internacionales y garantías (art. 13.1.f → ver #19), identidad/NIF del responsable y vía de reclamación ante la AEPD, plazo concreto de conservación. Completar según Artefacto 1. |
| 6 | **RGPD 22 (decisión automatizada – Tarjeta de Decisión)** | `frontend/src/components/results/RouteDecisionCard.tsx:12-92`; cálculo del score en `frontend/src/app/api/plan-trip/route.ts:883-937` | **CUMPLE (no aplica 22.1) — sin documentar** | La "Ruta Óptima Justificada" es una **recomendación de viaje**: no produce efectos jurídicos ni significativos similares (no deniega crédito, empleo, etc.). No aplica art. 22.1. **Acción**: dejar constancia de la no-aplicación en la ROPA/EIPD; la explicación de la lógica (`RouteDecisionCard.tsx:44-88`) favorece la transparencia. |
| 7 | **RGPD 25/32 – pin de imagen n8n** | `docker-compose.yml:15` y `docker-compose.yml:79` → `n8nio/n8n:latest` | **FALTA** | `:latest` no es reproducible ni auditable (arranques distintos = versiones distintas). Fijar `n8nio/n8n:2.x.y` (idealmente digest `@sha256:`) en ambos servicios (`n8n` y `n8n-import`). |
| 8 | **RGPD 25/32 – RLS Supabase** | `n8n/docs/Planificador_Viajes_v38_Arquitectura.md:392` → "tabla `travel_plans` … **con RLS desactivado**" | **FALTA** | RLS desactivado = cualquier clave anon podría leer/escribir todos los planes. Activar RLS y políticas por `session_id`/usuario. **A VERIFICAR** si la tabla es accesible con la anon key públicamente. |
| 9 | **RGPD 25/32 – uso de `SUPABASE_SERVICE_ROLE_KEY`** | `docker-compose.yml:56`; `n8n/credentials/credentials.json:29-34`; nodo Supabase `n8n/workflows/Planificador_de_Viajes_v38.json:503-523` | **PARCIAL** | La `service_role` **salta RLS por diseño**; combinada con #8 no hay control de acceso a nivel de fila. Aceptable server-side si RLS estuviera activo y la clave nunca llega al cliente (`.env.example:48-49` lo advierte). Corrección: activar RLS (#8) y limitar permisos. |
| 10 | **RGPD 25/32 – cifrado en reposo** | Supabase = Postgres gestionado (cifrado por defecto, **A VERIFICAR** región/plan); n8n cifra credenciales con `N8N_ENCRYPTION_KEY` (`.env.example:71-74`) | **PARCIAL** | El cifrado de la BD de planes no está documentado. Confirmar cifrado en reposo del proyecto Supabase y región (ver #17). |
| 11 | **RGPD 25/32 – persistencia no volátil de sesión** | Volumen Docker `docker-compose.yml:60-62` (persiste la BD); **pero** el estado de sesión de refinamiento se guarda en `$getWorkflowStaticData('global')` → `n8n/nodes-code/02_cargar_sesion.js:4-5` | **PARCIAL** | **[MATIZADO tras contraste con anexo §3/§5.1]** El volumen persiste la BD de n8n (correcto). El estado de sesión, en cambio, vive en *workflow static data*, que es frágil: no fiable en ejecuciones manuales/modo cola y **puede resetearse en el re-import del workflow que hace `n8n-import` en cada arranque** (`docker-compose.yml:78-86`). Mover la sesión a un almacén duradero (p. ej. la propia tabla Supabase) o documentar la limitación. |
| 12 | **RGPD 25/32 – protección de `/results` por middleware** | Matcher del proxy = `['/dashboard','/planner','/trip']` en `frontend/src/proxy.ts:30-32` → **`/results` NO está protegido** | **PARCIAL** | `/results` no pasa por el proxy. Mitigante: `/results` no lee datos de servidor, se hidrata desde `TripContext`/localStorage cliente (`frontend/src/app/results/page.tsx:20-31`) y `/api/plan-trip` sí exige sesión (`route.ts:994-1013`). Aun así, añadir `/results` al matcher por coherencia. |
| 13 | **RGPD 32 – fuga de `_debug`/`_supabase_record`** | Responder n8n: `responseBody = JSON.stringify($json)` en `n8n/workflows/Planificador_de_Viajes_v38.json:342-343`; el nodo previo "Preparar Payload Supabase" alimenta **a la vez** al Responder y a Supabase (`…v38.json:769-783`); añade `_supabase_record`/`_skip_supabase` (`n8n/nodes-code/08_preparar_payload_supabase.js:42-46`) y `_debug` (`n8n/nodes-code/07_logger_metricas.js:24-35`) | **FALTA** | La respuesta del webhook devuelve campos internos: `_debug` (métricas), `_supabase_record` (copia exacta del registro persistido), `_skip_supabase`, y `session_state`/`travel_brief`. El frontend remapea a `TripData` limpio (`route.ts:504-991`), pero **quien llame directo al webhook (expuesto por ngrok) recibe todo**. Corrección: en `…v38.json:343` serializar solo los campos públicos del plan, o insertar un nodo "sanitize" que borre `_*`, `session_state`, `travel_brief` antes de responder. **[2026-07-23]** El nuevo webhook `travel-refine` (RUTA B, §0.3) comparte este patrón → aplicar el saneo a **ambos** webhooks. |
| 14 | **RGPD 25/32 – tests** | No hay suite automatizada; solo `n8n/nodes-code/_smoketest.js` y `frontend/test-frontend.ps1` (scripts manuales); `verify.ps1` hace tsc+lint | **PARCIAL** | Sin tests de la lógica de mapeo/auth/sanitización, un cambio puede reintroducir la fuga (#13). Añadir tests unitarios de `/api/plan-trip` (auth, sanitize) y de los nodos code. |
| 15 | **RGPD 25/32 – migraciones/DDL versionadas** | `git ls-files` no devuelve ningún `.sql`/migración; el esquema solo se describe en prosa (`n8n/docs/Planificador_Viajes_v38_Arquitectura.md:392`) | **FALTA** | El esquema de `travel_plans` (incl. RLS) no está versionado. Crear `supabase/migrations/*.sql` con la DDL y las políticas RLS. **[2026-07-23]** Cerrado para `plan_holders` (`2026-07-23_0001_plan_holders.sql`). **[2026-07-30]** Cerrado para `travel_plans` (`2026-07-30_0002_travel_plans_revisiones.sql`): su DDL deja de vivir solo en prosa de un doc archivado. Las **políticas RLS** siguen fuera a propósito (ver #8/#9, decisión del equipo), así que el hallazgo queda **PARCIAL** por esa parte, no por el DDL. |
| 16 | **RGPD 28 – DPA con encargados** | `frontend/src/app/privacy/page.tsx:79-92` los llama "encargados"; **ningún DPA en el repo** | **FALTA** | No hay contrato/registro de DPA con OpenAI, Anthropic, Supabase, SerpAPI, Tavily, Google. Recopilar y registrar (Artefacto 4). |
| 17 | **RGPD 30 – ROPA/RAT** | Sin evidencia | **FALTA** | No existe ROPA. Crear (Artefacto 2). |
| 18 | **RGPD 35 – EIPD** | Sin evidencia | **FALTA (procede)** | Concurren **nuevas tecnologías (LLM)**, posible art. 9 (#4) y **transferencias a EEUU** (#19) → EIPD recomendable. Redactar (Artefacto 3). **A VERIFICAR** contra la lista de la AEPD de tratamientos que requieren EIPD. |
| 19 | **RGPD Cap. V – transferencias EEUU** | Encargados en EEUU listados en `frontend/src/app/privacy/page.tsx:85-91`; **no se menciona ningún mecanismo de transferencia** | **FALTA (mecanismo ya identificado por proveedor)** | **[ACTUALIZADO con verificación del anexo §5]** El código no declara mecanismo, pero el anexo ya los verificó contra fuente oficial: **Google LLC → DPF "Active"** (adecuación art. 45) + SCC de reserva; **OpenAI, Anthropic, SerpAPI, Tavily → SCC art. 46**; **Supabase → SCC art. 46 + TIA** (entidad Supabase Inc. es EEUU: SCC aplican aunque el hosting sea UE — la región solo reduce residencia de datos, no elimina el encargado en EEUU); Open-Meteo/Nominatim → Europa, sin transferencia. Falta **formalizar** SCC y una **TIA por proveedor** (Artefacto 7). **A VERIFICAR (recurrente)**: reconfirmar estatus DPF de Google en dataprivacyframework.gov antes de cita definitiva. |
| 20 | **RGPD 33/34 – brechas** | Menciones informales en `frontend/src/app/privacy/page.tsx:118-125` ("si detectas un problema… escríbenos") | **FALTA** | Sin procedimiento de notificación 72 h ni registro de brechas. Crear (Artefacto 5). |
| 21 | **LSSI 22.2 – cookie `justenjoy-session` exenta** | `frontend/src/app/api/auth/session/route.ts:39-45` (`httpOnly`, `secure` en prod, `sameSite:lax`, 14 d); `frontend/src/app/cookies/page.tsx:29-45` | **CUMPLE** | Cookie estrictamente técnica de autenticación → exenta de consentimiento (art. 22.2 LSSI). Deber de información cubierto en `cookies/page.tsx` y `CookieNotice.tsx:42-48`. |
| 22 | **LSSI 22.2 – localStorage `justenjoy_trips`** | Escritura/lectura en `frontend/src/context/TripContext.tsx:52`, `:72`, `:86`; descrito en `frontend/src/app/cookies/page.tsx:48-55` | **PARCIAL/CUMPLE** | El uso del dispositivo se informa. Almacena planes (destino/fechas) sin cifrar en el navegador — aceptable como almacenamiento técnico funcional; documentado. Mantener como "estrictamente necesario". |
| 23 | **RIA art. 50 – aviso de interacción con IA** | Chat "Concierge" sin etiqueta IA explícita `frontend/src/components/planner/ChatPlanner.tsx:397-403`; Tarjeta de Decisión sin etiqueta `frontend/src/components/results/RouteDecisionCard.tsx`; Botpress **no implementado** (`.env.example:76-79`) | **PARCIAL** | Sí hay aviso genérico de contenido IA en `terms/page.tsx:55-61` y microcopy "MOTOR IA" (`AiProcessingScreen.tsx:70`). Falta un **aviso claro de interacción con IA** en el propio chat y **etiquetado del contenido generado**. Añadir aviso en el chat y disclaimer "generado por IA" en resultados. **A VERIFICAR**: art. 50 RIA aplicable **desde el 2 de agosto de 2026**. |
| 24 | **RIA art. 4 – alfabetización en IA** | Sin evidencia | **FALTA / N/A parcial** | No hay medidas documentadas. Al ser TFM sin empleados operando el sistema, el alcance es limitado; documentar nota mínima. **A VERIFICAR**: art. 4 RIA aplicable **desde el 2 de febrero de 2025**. |
| 25 | **Ley 3/1991 / TRLGDCU – patrón: progreso simulado ~4,5 s** | `frontend/src/context/TripContext.tsx:178-187` (9 pasos × 500 ms = **4,5 s**) ejecutado **después** de recibir ya la respuesta real; UI en `frontend/src/components/planner/AiProcessingScreen.tsx:98-132` | **FALTA (patrón oscuro)** | El retardo es puramente cosmético tras tener el dato → induce percepción falsa de "trabajo". Eliminar el bucle artificial o vincular el progreso a hitos reales. |
| 26 | **Patrón: checklist de tareas inventada** | `frontend/src/components/planner/AiProcessingScreen.tsx:11-19` y `:98-132`; pasos en `frontend/src/context/TripContext.tsx:23-33` | **FALTA (patrón oscuro)** | Marca tareas como completadas sin relación con el trabajo real del backend. Sustituir por estados reales o texto neutro. |
| 27 | **Patrón: "badge de estado por substring"** | Selección por `startsWith`/`includes`: iconos de nota `frontend/src/components/trip/PracticalInfoCard.tsx:13-19`; tipo de bloque por substring `route.ts:656`; "Directo/escala" derivado `frontend/src/app/results/page.tsx:183` | **PARCIAL (bajo riesgo)** | Estas heurísticas por substring son de presentación (icono/etiqueta) y **no fingen un estado de negocio**; riesgo bajo. Vigilar que no deriven en afirmaciones no verificadas. |
| 28 | **Patrón: "enlace copiado que no copia"** | `frontend/src/components/trip/ShareTripPanel.tsx:16-23` — **sí ejecuta** `navigator.clipboard.writeText`, pero **sin `try/catch`** | **PARCIAL (matizado con anexo §6)** | En contexto seguro (localhost/HTTPS) el botón **sí copia**, luego no es un engaño deliberado como los `alert()` (#29). **Pero** `navigator.clipboard` no existe en contexto inseguro (http por IP de LAN, ver memoria del proyecto): ahí lanza excepción no capturada y no copia. Añadir `try/catch` + fallback y feedback de error, para que "¡Copiado!" no se muestre si falla. |
| 29 | **Patrón: botones que solo hacen `alert()` sin backend** | "Añadir a Calendar": `frontend/src/components/trip/ShareTripPanel.tsx:58-64`; compartir por email: `ShareTripPanel.tsx:93-99` — ambos `alert()` afirmando éxito ("¡Sincronización lista!", "¡Itinerario compartido!") | **FALTA (patrón oscuro / publicidad engañosa)** | Afirman una acción que no ocurre (no hay integración Calendar ni envío de email). También `share.calendar_enabled:true` en `route.ts:988-989`. Corrección: desactivar/ocultar estos botones o marcarlos "próximamente"; nunca afirmar éxito de una acción no realizada. |
| 30 | **Deber de exactitud 5.1.d – disclaimers alucinaciones (visado/clima/transporte)** | Disclaimer general en `frontend/src/app/terms/page.tsx:55-61` (menciona visado); `frontend/src/components/trip/PracticalInfoCard.tsx` **no** muestra advertencia; clima anclado a dato real Open-Meteo `route.ts:338-373` | **PARCIAL** | Buen diseño anti-invención (clima/precios reales o `null`, ver `route.ts:855-870`). Falta disclaimer **in-situ** en la tarjeta de info práctica (visado/transporte) recordando verificar en fuente oficial. Añadir nota en `PracticalInfoCard.tsx`. |
| 31 | **Ley 1/2019 Secretos – protección workflow/prompts** | `.gitignore`+.env fuera del repo; `.env.example:10-14` advierte; `n8n/credentials/credentials.json:1-35` usa `{{ $env.X }}` sin secretos; gitleaks `.gitleaks.toml` + CI `.github/workflows/secret-scan.yml`; `.github/CODEOWNERS` | **PARCIAL/CUMPLE** | Buenas medidas de secreto de claves. **Pero el prompt del sistema y el workflow (prompts, tablas IATA, lógica) están versionados en claro** (`route.ts:17-178`, `n8n/workflows/Planificador_de_Viajes_v38.json`) — legítimo si el repo es privado. Verificar visibilidad del repo y marcar el "know-how" como confidencial en CONTRIBUTING/licencia. **A VERIFICAR**: rotación de claves históricamente expuestas (`.env.example:8`). |

---

## 2. Resumen de estados

| Estado | Nº | Obligaciones |
|---|---|---|
| CUMPLE | 1 | #21 |
| PARCIAL | 13 | #3, #5, #9, #10, #11, #12, #14, #22, #23, #27, #28, #30, #31 |
| FALTA | 16 | #1, #2, #4, #7, #8, #13, #15, #16, #17, #18, #19, #20, #24, #25, #26, #29 |
| NO APLICA (documentar) | 1 | #6 (art. 22.1 — justificar con las 3 condiciones) |

> Recuento actualizado tras el contraste con el anexo oficial: #4 pasa de PARCIAL a **FALTA**;
> #11 y #28 pasan de CUMPLE a **PARCIAL**. Ver §7.

---

## 3. Hallazgos prioritarios (acción inmediata)

> Estado actualizado en **Revisión 2.1** tras el revert (PR #70): los fixes #7/#13/#29 se DESHICIERON.

1. ⏳ **#13 (ABIERTO de nuevo)** — fuga de `_debug`/`_supabase_record`/`session_state` en la respuesta del webhook. Se saneó en Rev2 pero **el revert (PR #70) lo deshizo**: `n8n/workflows/Planificador_de_Viajes_v38.json:343` vuelve a `JSON.stringify($json)`. **Máxima prioridad.**
2. ⏳ **#8 / #9 (ABIERTO)** — RLS desactivado + service_role → activar RLS y versionar DDL (#15). **Máxima prioridad.**
3. ⏳ **#29 (ABIERTO de nuevo)** — botones `alert()` que fingen éxito → el revert restauró los `alert()`; volver a deshabilitarlos/etiquetarlos.
4. ✅ **#4 (MITIGADO 2026-07-23 — §0.4)** — el texto libre `feedback_text` expuesto en la UI
   (`RefineTripPanel.tsx`) ya cuenta con **aviso permanente + guardarraíl server-side** que no
   reenvía categorías especiales a LLM/buscadores (`lib/sensitiveData.ts`). Pasa a **PARCIAL**;
   resta la base jurídica en la política (Artefacto 1) y el vector estructurado de accesibilidad.
5. ⏳ **#7 (ABIERTO de nuevo)** — pin de imagen → el revert devolvió `n8nio/n8n:latest`; volver a fijar versión/digest.

> **Nota operativa:** el código vigente es v38 (sin saneo). La instancia n8n local puede seguir
> sirviendo el v39 saneado del último E2E; para alinearla con el código v38 hay que **reimportar**
> (`docker compose up`).

---

## 4. Artefactos de cumplimiento a producir

> ✅ **Actualización Rev2:** los 7 artefactos ya existen como **borrador** en **`docs/legal/`** (PR #64).
> El esquema de abajo se conserva como especificación; el estado de cada uno (borrador creado,
> pendiente de completar/firmar/implementar) está en §0.1. Índice: `docs/legal/README.md`.

> Ubicación propuesta para todos: nueva carpeta **`docs/legal/`** (versionada), salvo las páginas de usuario que ya viven en `frontend/src/app/`.

### Artefacto 1 — Política de Privacidad (arts. 13/14) → actualizar `frontend/src/app/privacy/page.tsx`
Añadir a lo existente:
1. **Responsable**: identidad, NIF/entidad académica (EBIS/TFM) y contacto DPO o su ausencia motivada.
2. **Base jurídica por tratamiento**: cuenta y generación del plan = **6.1.b (contrato)**; seguridad/antiabuso = **6.1.f** (con LIA, #2); datos de accesibilidad = **9.2.a (consentimiento explícito)** o reencuadre funcional (#4).
3. **Transferencias internacionales** (art. 13.1.f): proveedores EEUU + mecanismo (DPF/SCC) y enlace al TIA (Artefacto 7).
4. **Plazos concretos** de conservación (hoy genérico, §5).
5. **Derechos + reclamación ante la AEPD** (art. 13.2.d).
6. **Advertencia previa al envío a LLM** para campos sensibles (#4).

### Artefacto 2 — ROPA / RAT (art. 30) → `docs/legal/ROPA.md`
Esquema de fila por tratamiento:
```
Tratamiento | Finalidad | Base jurídica | Categorías de interesados | Categorías de datos
(incl. art.9?) | Destinatarios/Encargados | Transferencias 3.º país + garantía
| Plazo de supresión | Medidas técnicas/organizativas (art.32)
```
Filas mínimas: (a) Gestión de cuenta (Firebase, 6.1.b); (b) Generación de itinerario (OpenAI/Anthropic/SerpAPI/Tavily/Google/Open-Meteo/Nominatim, 6.1.b, transferencias EEUU); (c) Persistencia del plan (Supabase, 6.1.b); (d) Seguridad/rate-limit (6.1.f); (e) Soporte/derechos.

### Artefacto 3 — EIPD (art. 35) → `docs/legal/EIPD.md`
Secciones: descripción del tratamiento y flujos (frontend → `/api/plan-trip` → n8n → LLM/APIs → Supabase); necesidad y proporcionalidad; **riesgos**: (1) art. 9 vía accesibilidad (#4), (2) transferencias EEUU (#19), (3) fuga de campos internos (#13), (4) RLS desactivado (#8), (5) alucinaciones IA (#30); medidas mitigadoras y riesgo residual; conclusión sobre consulta previa. **A VERIFICAR** contra lista AEPD de tratamientos con EIPD obligatoria.

### Artefacto 4 — Cláusulas DPA por proveedor (art. 28) → `docs/legal/DPA/`
Un fichero por encargado (`openai.md`, `anthropic.md`, `supabase.md`, `serpapi.md`, `tavily.md`, `google.md`) con: rol (encargado), objeto y duración, instrucciones documentadas, confidencialidad, subencargados, medidas art. 32, asistencia en derechos y brechas, devolución/supresión, auditoría, y **anexo SCC** (módulo 2 responsable→encargado) para los de EEUU. Enlazar al DPA estándar público de cada proveedor.

### Artefacto 5 — Procedimiento de notificación de brechas (arts. 33/34) → `docs/legal/procedimiento-brechas.md`
Flujo: detección → registro interno (**registro de brechas obligatorio** art. 33.5) → evaluación de riesgo → notificación AEPD **≤72 h** si procede → comunicación a afectados si alto riesgo → medidas correctoras → cierre. Incluir plantilla de registro y roles/contacto. Sustituye al texto informal de `privacy/page.tsx:118-125`.

### Artefacto 6 — Aviso de transparencia de IA (art. 50 RIA) → componentes + `docs/legal/transparencia-ia.md`
1. Etiqueta de **interacción con IA** visible en el chat (`ChatPlanner.tsx:397-403`).
2. Marca **"contenido generado por IA"** en resultados/itinerario y en la Tarjeta de Decisión (`RouteDecisionCard.tsx`).
3. Cuando se implemente Botpress (`.env.example:76-79`), aplicar el mismo aviso. **A VERIFICAR**: exigible desde **02/08/2026**.

### Artefacto 7 — Revisión de transferencias internacionales + TIA por proveedor (Cap. V) → `docs/legal/TIA.md`
Tabla por proveedor: entidad importadora | país | mecanismo (**Google LLC → DPF** *A VERIFICAR en lista DPF*; **OpenAI/Anthropic/SerpAPI/Tavily → SCC**) | evaluación de la legislación del destino (FISA 702/EO 12333) | medidas suplementarias (cifrado, minimización — recordar que SerpAPI solo recibe ciudades/fechas, `privacy/page.tsx:93-96`) | conclusión. Para **Supabase**: **A VERIFICAR región del proyecto** — si es UE, no hay transferencia y decae el TIA.

---

## 5. Datos legales marcados "A VERIFICAR" (sensibles al tiempo)

- **RIA art. 50** (transparencia): aplicación **02/08/2026**.
- **RIA art. 4** (alfabetización): aplicación **02/02/2025**.
- **Estatus DPF** de Google LLC (y de cualquier otro proveedor adherido) en la lista activa del Data Privacy Framework.
- **Región de procesamiento** de OpenAI, Anthropic, SerpAPI, Tavily y **región del proyecto Supabase** (determina si hay transferencia).
- **Cuantías sancionadoras**: RIA art. 99 verificado en el anexo → hasta 35 M€/7 % (prácticas prohibidas art. 5), hasta 15 M€/3 % (otras obligaciones, incl. art. 50), hasta **7,5 M€ o 1 %** (información incorrecta a autoridades, art. 99.5 — **es 1 %, no 1,5 %** como decían las slides del curso). RGPD/LSSI: verificar importes vigentes.
- **Lista AEPD** de tratamientos que obligan a EIPD.
- **Rotación efectiva** de las claves API que estuvieron expuestas en el historial de git (`.env.example:8`).

---

## 6. Anexo — Ficheros revisados (evidencia)

- `docker-compose.yml`
- `.env.example`, `.gitleaks.toml`, `.github/workflows/secret-scan.yml`, `.github/CODEOWNERS`
- `frontend/src/proxy.ts`
- `frontend/src/app/api/plan-trip/route.ts`
- `frontend/src/app/api/auth/session/route.ts`
- `frontend/src/lib/sessionCookie.ts`
- `frontend/src/app/privacy/page.tsx`, `frontend/src/app/cookies/page.tsx`, `frontend/src/app/terms/page.tsx`
- `frontend/src/app/results/page.tsx`
- `frontend/src/context/TripContext.tsx`
- `frontend/src/components/planner/{AiProcessingScreen,PreferenceWizard,ChatPlanner}.tsx`
- `frontend/src/components/shared/{SmartChip,CookieNotice}.tsx`
- `frontend/src/components/results/RouteDecisionCard.tsx`
- `frontend/src/components/trip/{ShareTripPanel,PracticalInfoCard}.tsx`
- `n8n/workflows/Planificador_de_Viajes_v38.json`
- `n8n/nodes-code/{07_logger_metricas,08_preparar_payload_supabase,09_extraer_record}.js`
- `n8n/credentials/credentials.json`
- `n8n/docs/Planificador_Viajes_v38_Arquitectura.md`

---

## 7. Verificación contra el anexo oficial (Temas 21-22) y correcciones

Se ha contrastado esta auditoría (basada en revisión de código) con el `Anexo de Cumplimiento
JustEnjoy T21-T22`, que verifica sus datos legales contra fuentes oficiales (eur-lex, BOE, AEPD,
dataprivacyframework.gov y los DPA de cada proveedor). Resultado: **fuerte coincidencia en los
hallazgos técnicos/seguridad**; se corrigen los siguientes puntos de la auditoría de código.

### 7.1 Correcciones (el anexo tenía razón)

| # | Antes (mi auditoría) | Después (corregido) | Evidencia en código |
|---|---|---|---|
| 4 | "No existe campo de texto libre" → PARCIAL | **Sí existe** `feedback_text` (texto libre de refinamiento → LLM y buscadores) → **FALTA** | `n8n/nodes-code/02_cargar_sesion.js:3`, `:15-26` |
| 11 | Persistencia CUMPLE (volumen Docker) | El estado de sesión usa *workflow static data* (frágil, se puede perder en re-import) → **PARCIAL** | `n8n/nodes-code/02_cargar_sesion.js:4-5`; `docker-compose.yml:78-86` |
| 28 | "Copia bien" → CUMPLE | Copia en contexto seguro, pero sin `try/catch`: falla en http/IP → **PARCIAL** | `frontend/src/components/trip/ShareTripPanel.tsx:16-23` |
| 19 | DPF/región "A VERIFICAR" | Mecanismos ya verificados por el anexo: Google DPF *Active*; resto SCC; Supabase EEUU+SCC+TIA | `frontend/src/app/privacy/page.tsx:85-91` |

### 7.2 Puntos donde el anexo aporta y mi auditoría coincide o se refuerza

- **Vector art. 9 hacia buscadores**: la AUP de **Tavily prohíbe** datos del art. 9; el filtrado/minimización del texto libre debe aplicarse también a SerpAPI/Tavily, no solo a los LLM (incorporado a #4).
- **Sanción RIA art. 99.5 = 7,5 M€ o 1 %** (no 1,5 %): dato verificado; incorporado a §5.
- **Transferencias por proveedor** verificadas [OK-oficial]: incorporado a #19 y al Artefacto 7.
- **Coincidencia total** en las debilidades de seguridad (anexo §3): `n8nio/n8n:latest` sin fijar (#7), `SERVICE_ROLE_KEY`/RLS (#8-#9), `/results` sin proteger (#12), fuga de `_debug`/`_supabase_record` (#13), sin tests ni DDL (#14-#15), `localStorage` sin cifrar (#22), y ausencia de RAT/EIPD/DPA/procedimiento de brechas (#16-#20).

### 7.3 Fuera del alcance de mi lista original (confirmado por el anexo)

- **DORA (Reg. UE 2022/2554), NIS2 (Dir. UE 2022/2555) y ENS (RD 311/2022): NO aplican** a Just Enjoy (sectores/umbral no cumplidos; ENS solo con sector público). Reevaluar si cambia tamaño/sector o si se integra Stripe (PSD2/PCI-DSS).
- **RIA — clasificación de riesgo limitado** y rol de **deployer** (OpenAI/Anthropic son proveedores GPAI): coherente con el dictamen de no-alto-riesgo de #6/#23.

### 7.4 Datos sensibles al tiempo confirmados por el anexo (mantener "A VERIFICAR" / recurrente)

- **RIA art. 50** (transparencia): **2-ago-2026**, no aplazado por el Digital Omnibus. [OK-oficial]
- **Digital Omnibus** (aplazamiento de alto riesgo a dic-2027 / Anexo I a ago-2028): **pendiente de publicación en DOUE**.
- **Régimen sancionador nacional de IA** y **transposición española de NIS2**: en tramitación, **no en BOE** a julio 2026.
- **Estatus DPF** de proveedores: reconfirmar en dataprivacyframework.gov antes de cada cita.

---

> **Aviso**: este informe es una revisión técnica de cumplimiento, no asesoramiento jurídico.
> Los puntos "A VERIFICAR" y la validez legal final deben confirmarse con un profesional del Derecho.
