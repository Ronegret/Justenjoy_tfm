# Auditoría de cumplimiento legal y de seguridad — Just Enjoy (Revisión 2)

> 📌 **Documento VIGENTE (Revisión 2).** La **Revisión 1** (evaluación inicial, congelada tal como
> se entregó antes de la remediación) vive en un fichero aparte:
> [`auditoria-cumplimiento-legal-seguridad-rev1.md`](auditoria-cumplimiento-legal-seguridad-rev1.md).

> **Alcance:** frontend Next.js 16 (App Router), orquestador n8n `Planificador_de_Viajes_v39` (27 nodos),
> LLMs OpenAI (`gpt-4.1`/`gpt-4o-mini`) y Anthropic (`claude-3-5-sonnet`), Firebase Auth/Admin,
> Supabase Postgres (`travel_plans`), e integraciones SerpAPI, Tavily, Google Places/Maps,
> Open-Meteo, OpenStreetMap/Nominatim. Botpress y Stripe están **declarados pero NO implementados**.
>
> **Fecha de la auditoría:** 2026-07-22 · **Revisión 2:** 2026-07-22 (tras remediación — ver §0)
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

### 0.1 Delta de estados

**Resueltos por código (en `develop`):**

| # | Obligación | Rev1 | Rev2 | Evidencia del cambio |
|---|---|---|---|---|
| 7 | Pin de imagen n8n | FALTA | ✅ **CUMPLE** | `docker-compose.yml` → `n8nio/n8n:2.25.7` (PR #66) |
| 13 | Fuga de `_debug`/`_supabase_record` | FALTA | ✅ **CUMPLE** | Responder saneado a `{status, session_id, plan, warnings}` + ejemplo `n8n/examples/output-plan-v39-saneado.json` (PR #66) |
| 28 | "Enlace copiado" sin manejo de error | PARCIAL | ✅ **CUMPLE** | `ShareTripPanel.tsx` `handleCopyLink` con `try/catch` + fallback (PR #65) |
| 29 | Botones `alert()` que fingen éxito | FALTA | ✅ **CUMPLE** | Calendar/email deshabilitados "Pronto" + `calendar_enabled=false` en todas las rutas (PR #65) |

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

### 0.2 Resumen de estados — Revisión 2

| Estado | Rev1 | **Rev2** |
|---|---|---|
| CUMPLE | 1 | **5** (#7, #13, #21, #28, #29) |
| PARCIAL | 13 | **19** |
| FALTA | 16 | **6** (#2, #4, #8, #15, #25, #26) |
| NO APLICA | 1 | **1** (#6) |

> **Prioridad restante:** los 6 en FALTA. Los más críticos para un go-live: **#8** (RLS Supabase) y
> **#4** (filtrado de categorías especiales antes de LLM/buscadores).

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
| 4 | **RGPD 9 (categorías especiales – feedback libre / dieta)** | **SÍ existe campo de texto libre**: el backend acepta `body.feedback_text` y lo procesa un agente de refinamiento vía LLM → `n8n/nodes-code/02_cargar_sesion.js:3` y `:15-26`. Vectores estructurados del art. 9: `accessibility`/"Necesito accesibilidad" (`frontend/src/components/planner/PreferenceWizard.tsx:57`, `ChatPlanner.tsx:192`) y `accessible`/`pet_friendly`/`kids_friendly`. Todo va a `special_requirements`/`feedback_text` → LLM (`route.ts:235`, `route.ts:1128`) y a buscadores (SerpAPI/Tavily) | **FALTA** | **[CORREGIDO tras contraste con anexo oficial]** Mi dictamen previo ("no existe texto libre") era erróneo: el wizard inicial es estructurado, pero el **contrato de refinamiento sí expone `feedback_text`** (texto libre, ~350 car. según memoria/`frontend_funcionalidades.md`) que puede revelar salud/religión/convicciones (art. 9). No hay doble cerrojo, ni consentimiento explícito (9.2.a), ni aviso previo, ni minimización/filtrado. **Refuerzo verificado (anexo §5):** la AUP de **Tavily prohíbe enviar datos del art. 9** — mandar el texto libre sin filtrar a Tavily/SerpAPI incumpliría además su propia AUP. Corrección: (a) advertir antes de marcar "accesibilidad" y antes del campo de feedback; (b) consentimiento explícito 9.2.a o reencuadre funcional; (c) **filtrar/pseudonimizar el texto libre antes de enviarlo a LLM Y a buscadores**. |
| 5 | **RGPD 13/14 (política de privacidad)** | `frontend/src/app/privacy/page.tsx:19-127` | **PARCIAL** | Existe y es legible; cubre datos, finalidad, encargados (§4), plazos (§5), derechos (§6). **Faltan**: base jurídica (art. 13.1.c), transferencias internacionales y garantías (art. 13.1.f → ver #19), identidad/NIF del responsable y vía de reclamación ante la AEPD, plazo concreto de conservación. Completar según Artefacto 1. |
| 6 | **RGPD 22 (decisión automatizada – Tarjeta de Decisión)** | `frontend/src/components/results/RouteDecisionCard.tsx:12-92`; cálculo del score en `frontend/src/app/api/plan-trip/route.ts:883-937` | **CUMPLE (no aplica 22.1) — sin documentar** | La "Ruta Óptima Justificada" es una **recomendación de viaje**: no produce efectos jurídicos ni significativos similares (no deniega crédito, empleo, etc.). No aplica art. 22.1. **Acción**: dejar constancia de la no-aplicación en la ROPA/EIPD; la explicación de la lógica (`RouteDecisionCard.tsx:44-88`) favorece la transparencia. |
| 7 | **RGPD 25/32 – pin de imagen n8n** | `docker-compose.yml:15` y `docker-compose.yml:79` → `n8nio/n8n:latest` | **FALTA** | `:latest` no es reproducible ni auditable (arranques distintos = versiones distintas). Fijar `n8nio/n8n:2.x.y` (idealmente digest `@sha256:`) en ambos servicios (`n8n` y `n8n-import`). |
| 8 | **RGPD 25/32 – RLS Supabase** | `n8n/docs/Planificador_Viajes_v38_Arquitectura.md:392` → "tabla `travel_plans` … **con RLS desactivado**" | **FALTA** | RLS desactivado = cualquier clave anon podría leer/escribir todos los planes. Activar RLS y políticas por `session_id`/usuario. **A VERIFICAR** si la tabla es accesible con la anon key públicamente. |
| 9 | **RGPD 25/32 – uso de `SUPABASE_SERVICE_ROLE_KEY`** | `docker-compose.yml:56`; `n8n/credentials/credentials.json:29-34`; nodo Supabase `n8n/workflows/Planificador_de_Viajes_v38.json:503-523` | **PARCIAL** | La `service_role` **salta RLS por diseño**; combinada con #8 no hay control de acceso a nivel de fila. Aceptable server-side si RLS estuviera activo y la clave nunca llega al cliente (`.env.example:48-49` lo advierte). Corrección: activar RLS (#8) y limitar permisos. |
| 10 | **RGPD 25/32 – cifrado en reposo** | Supabase = Postgres gestionado (cifrado por defecto, **A VERIFICAR** región/plan); n8n cifra credenciales con `N8N_ENCRYPTION_KEY` (`.env.example:71-74`) | **PARCIAL** | El cifrado de la BD de planes no está documentado. Confirmar cifrado en reposo del proyecto Supabase y región (ver #17). |
| 11 | **RGPD 25/32 – persistencia no volátil de sesión** | Volumen Docker `docker-compose.yml:60-62` (persiste la BD); **pero** el estado de sesión de refinamiento se guarda en `$getWorkflowStaticData('global')` → `n8n/nodes-code/02_cargar_sesion.js:4-5` | **PARCIAL** | **[MATIZADO tras contraste con anexo §3/§5.1]** El volumen persiste la BD de n8n (correcto). El estado de sesión, en cambio, vive en *workflow static data*, que es frágil: no fiable en ejecuciones manuales/modo cola y **puede resetearse en el re-import del workflow que hace `n8n-import` en cada arranque** (`docker-compose.yml:78-86`). Mover la sesión a un almacén duradero (p. ej. la propia tabla Supabase) o documentar la limitación. |
| 12 | **RGPD 25/32 – protección de `/results` por middleware** | Matcher del proxy = `['/dashboard','/planner','/trip']` en `frontend/src/proxy.ts:30-32` → **`/results` NO está protegido** | **PARCIAL** | `/results` no pasa por el proxy. Mitigante: `/results` no lee datos de servidor, se hidrata desde `TripContext`/localStorage cliente (`frontend/src/app/results/page.tsx:20-31`) y `/api/plan-trip` sí exige sesión (`route.ts:994-1013`). Aun así, añadir `/results` al matcher por coherencia. |
| 13 | **RGPD 32 – fuga de `_debug`/`_supabase_record`** | Responder n8n: `responseBody = JSON.stringify($json)` en `n8n/workflows/Planificador_de_Viajes_v38.json:342-343`; el nodo previo "Preparar Payload Supabase" alimenta **a la vez** al Responder y a Supabase (`…v38.json:769-783`); añade `_supabase_record`/`_skip_supabase` (`n8n/nodes-code/08_preparar_payload_supabase.js:42-46`) y `_debug` (`n8n/nodes-code/07_logger_metricas.js:24-35`) | **FALTA** | La respuesta del webhook devuelve campos internos: `_debug` (métricas), `_supabase_record` (copia exacta del registro persistido), `_skip_supabase`, y `session_state`/`travel_brief`. El frontend remapea a `TripData` limpio (`route.ts:504-991`), pero **quien llame directo al webhook (expuesto por ngrok) recibe todo**. Corrección: en `…v38.json:343` serializar solo los campos públicos del plan, o insertar un nodo "sanitize" que borre `_*`, `session_state`, `travel_brief` antes de responder. |
| 14 | **RGPD 25/32 – tests** | No hay suite automatizada; solo `n8n/nodes-code/_smoketest.js` y `frontend/test-frontend.ps1` (scripts manuales); `verify.ps1` hace tsc+lint | **PARCIAL** | Sin tests de la lógica de mapeo/auth/sanitización, un cambio puede reintroducir la fuga (#13). Añadir tests unitarios de `/api/plan-trip` (auth, sanitize) y de los nodos code. |
| 15 | **RGPD 25/32 – migraciones/DDL versionadas** | `git ls-files` no devuelve ningún `.sql`/migración; el esquema solo se describe en prosa (`n8n/docs/Planificador_Viajes_v38_Arquitectura.md:392`) | **FALTA** | El esquema de `travel_plans` (incl. RLS) no está versionado. Crear `supabase/migrations/*.sql` con la DDL y las políticas RLS. |
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

> Estado actualizado en Revisión 2 (ver §0).

1. ✅ **#13 (RESUELTO)** — fuga de `_debug`/`_supabase_record`/`session_state` en la respuesta del webhook → saneada en `n8n/workflows/Planificador_de_Viajes_v39.json:343` (PR #66).
2. ⏳ **#8 / #9 (PENDIENTE)** — RLS desactivado + service_role → activar RLS y versionar DDL (#15). **Sigue abierto — máxima prioridad.**
3. ✅ **#29 (RESUELTO)** — botones `alert()` que fingían éxito → deshabilitados y marcados "Pronto" (PR #65).
4. ⏳ **#4 (PENDIENTE)** — texto libre `feedback_text` / accesibilidad enviados a LLM y buscadores sin base ni filtrado → reencuadrar o consentimiento explícito + filtrar. **Sigue abierto.**
5. ✅ **#7 (RESUELTO)** — pin de imagen → `n8nio/n8n:2.25.7` (PR #66).

> **Nota operativa:** #7, #13 y el rename v39 están en `develop` pero **requieren re-import** (`docker compose up`) para surtir efecto en la instancia n8n en marcha; falta el **E2E** post-reimport.

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
