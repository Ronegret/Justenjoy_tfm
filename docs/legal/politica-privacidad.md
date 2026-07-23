# Política de Privacidad — Just Enjoy (borrador ampliado)

**Norma:** RGPD arts. 13/14 · **Hallazgos:** #1, #5, #19
**Destino:** portar este texto a `frontend/src/app/privacy/page.tsx` (ya existe una versión más corta;
este borrador **añade** base jurídica, transferencias, plazos y reclamación ante la AEPD).

> Última actualización: `[COMPLETAR: fecha]`

## 1. Responsable del tratamiento
`[COMPLETAR: razón social / grupo]` — Grupo 7, Trabajo Final de Máster en EBIS Business Techschool.
NIF/identificación: `[COMPLETAR]`. Contacto: **soporte@justenjoy.app**.
Proyecto académico en pre-producción. No se ha designado Delegado de Protección de Datos (no
concurren los supuestos del art. 37.1); las solicitudes se atienden por el correo indicado.

## 2. Qué datos tratamos
- **Cuenta:** nombre, correo, identificador de cuenta Google (vía Firebase Authentication).
- **Preferencias de viaje:** origen, destino, fechas, presupuesto, nº de viajeros, estilos y restricciones.
- **Texto libre de refinamiento:** comentarios que escribas para ajustar el plan. **Evita incluir datos
  sensibles** (salud, religión, etc.); si los incluyes, ver §4.
- **Planes generados:** itinerario, vuelos, hotel y actividades (se guardan sin vincular a tu nombre/email).
- **Datos del titular/cliente del plan (opcional):** si los facilitas en el paso "Datos del titular",
  guardamos nombre, apellidos, teléfono y email para gestionar y contactar sobre ese plan. Es
  **opcional** y requiere tu **consentimiento** explícito (una casilla que debes marcar); ver §3 y §7.
- **Cookie de sesión** (`justenjoy-session`) y **almacenamiento local** (`justenjoy_trips`) — ver Política de Cookies.

## 3. Para qué y con qué base jurídica
| Finalidad | Base jurídica (RGPD) |
|---|---|
| Crear tu cuenta y mantener la sesión | Art. 6.1.b (contrato) |
| Generar y conservar tu plan de viaje | Art. 6.1.b (contrato) |
| Registrar los datos del titular/cliente del plan (opcional) | Art. 6.1.a (**consentimiento explícito**) — puedes retirarlo cuando quieras |
| Tratar datos sensibles que incluyas en el texto libre | Art. 9.2.a (**consentimiento explícito**) |
| Prevenir el abuso del servicio | Art. 6.1.f (interés legítimo) |

No usamos tus datos para publicidad, perfilado comercial ni los vendemos.

## 4. Datos sensibles (categorías especiales)
El campo de texto libre y opciones como "necesito accesibilidad" pueden revelar datos del art. 9.
**Te avisaremos antes de enviarlos** a los proveedores de IA y **minimizamos** lo que se transmite.
Puedes usar el servicio sin aportar datos sensibles.

## 5. Con quién compartimos datos (encargados)
| Encargado | Función | País | Garantía de transferencia |
|---|---|---|---|
| Google (Firebase, Maps/Places) | Cuenta, sesión, mapas, fotos | EEUU | **DPF** (A VERIFICAR) |
| OpenAI | Generación del itinerario (LLM) | EEUU | **SCC** |
| Anthropic | Generación (LLM, alternativa) | EEUU | **SCC** |
| SerpAPI | Búsqueda de vuelos/hoteles/lugares | EEUU | **SCC** |
| Tavily | Contexto de destino (visado/clima) | EEUU | **SCC** |
| Supabase | Almacenamiento del plan y del titular del plan | EEUU | **SCC + TIA** |
| Open-Meteo, OpenStreetMap/Nominatim | Clima y geolocalización | UE | Sin transferencia |

Detalle en [TIA.md](TIA.md) y contratos en [DPA/](DPA/README.md).

## 6. Transferencias internacionales
Parte de los proveedores están en EEUU. Aplicamos las garantías del Capítulo V del RGPD (adecuación
DPF para Google; Cláusulas Contractuales Tipo para el resto, con evaluación de impacto de la
transferencia). Puedes solicitar copia de las garantías en soporte@justenjoy.app.

## 7. Cuánto tiempo conservamos tus datos
Tu cuenta y planes se conservan mientras la cuenta esté activa. Plazo máximo de conservación:
`[COMPLETAR]`. Puedes pedir la supresión en cualquier momento.

Los **datos del titular/cliente del plan** (si los facilitaste) se conservan un **máximo de 24 meses**
desde su registro. Puedes **retirar tu consentimiento** o pedir su supresión en cualquier momento
escribiendo a **soporte@justenjoy.app**.

## 8. Tus derechos
Acceso, rectificación, supresión, oposición, limitación y portabilidad, escribiendo a
**soporte@justenjoy.app**. Tienes derecho a **reclamar ante la Agencia Española de Protección de
Datos (AEPD, www.aepd.es)** si consideras que tratamos tus datos indebidamente.

## 9. Decisiones automatizadas e IA
El plan se genera con inteligencia artificial (ver [Aviso de transparencia de IA](transparencia-ia.md)).
La recomendación **no** produce efectos jurídicos sobre ti; es orientativa y puede contener errores
(revisa siempre datos críticos como visados en fuentes oficiales).

## 10. Seguridad
Sesión verificada en servidor con cookies firmadas (`httpOnly`). Las claves de proveedores no se
exponen en el navegador salvo las públicas por diseño (config de Firebase). Ver medidas técnicas en
la [ROPA](ROPA.md).

---

> **Estado: Aprobado v1.1 (2026-07-23, Grupo 7 TFM)** — v1.0 (2026-07-22) + **datos del titular del
> plan** (`plan_holders`, base 6.1.a, conservación 24 meses, retirada del consentimiento). Pendiente
> portar a `frontend/src/app/privacy/page.tsx`. La aprobación no sustituye la validación jurídica.

*Borrador para portar a la web. No constituye asesoramiento jurídico.*
