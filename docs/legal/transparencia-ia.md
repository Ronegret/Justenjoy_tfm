# Aviso de transparencia de IA

**Norma:** Reglamento de IA (UE) 2024/1689, **art. 50** · **Hallazgo:** #23
**Rol del proyecto:** *deployer* (desplegador) de sistemas de IA · **Clasificación:** riesgo limitado

> **A VERIFICAR (fecha sensible):** las obligaciones de transparencia del art. 50 son aplicables
> **desde el 2 de agosto de 2026** (no aplazadas por el Digital Omnibus). Las obligaciones de
> proveedores de modelos GPAI (OpenAI, Anthropic) aplican desde el 2-ago-2025.

## 1. Clasificación
Un planificador de viajes **no** encaja en el Anexo III del RIA (no es alto riesgo). La "Tarjeta de
Decisión" no lo eleva a alto riesgo. Obligación material principal: **transparencia (art. 50)**.

## 2. Obligaciones aplicables como deployer

### 2.1 Informar de la interacción con IA (art. 50.1)
El usuario debe saber que interactúa con un sistema de IA cuando no sea evidente.

- **Chat "Concierge"** (`frontend/src/components/planner/ChatPlanner.tsx`): añadir una etiqueta
  visible del tipo *"Asistente de IA — las respuestas se generan automáticamente"* junto al
  encabezado "Concierge Inteligente".
- **Botpress** (cuando se implemente, `.env.example`): mismo aviso al inicio de la conversación.

### 2.2 Etiquetar el contenido generado por IA (art. 50.2)
El itinerario, descripciones y recomendaciones se generan con IA.

- **Resultados** (`frontend/src/app/results/page.tsx`) y **Tarjeta de Decisión**
  (`frontend/src/components/results/RouteDecisionCard.tsx`): mostrar un distintivo
  *"Contenido generado por IA"* y un recordatorio de verificar datos críticos.

### 2.3 Textos sugeridos (ES)
- Chat: *"Estás hablando con un asistente de IA de Just Enjoy. Sus respuestas se generan
  automáticamente y pueden contener errores."*
- Resultados: *"Este plan se ha generado con inteligencia artificial a partir de búsquedas reales.
  Revisa precios, horarios y requisitos de visado en las fuentes oficiales antes de reservar."*

## 3. Reparto de roles (GPAI)
- **OpenAI y Anthropic**: proveedores de modelos de IA de propósito general (GPAI), con sus propias
  obligaciones. Just Enjoy, como **deployer**, debe conservar sus instrucciones de uso/documentación.
- Contratar la capa API/Enterprise con **opt-out de entrenamiento** y política homologada.

## 4. Supervisión humana (art. 14 RIA)
No obligatoria fuera del alto riesgo, pero recomendable: mantener revisión humana y **no presentar la
recomendación como infalible** (enlaza con el deber de exactitud, #30).

## 5. Alfabetización en IA (art. 4 RIA)
`[COMPLETAR]` medida mínima: nota interna de que el equipo conoce las capacidades/límites del sistema.
**A VERIFICAR:** art. 4 aplicable desde el 2-feb-2025 (alcance limitado en un TFM sin operativa).

## 6. Sanciones (referencia, art. 99 RIA — A VERIFICAR importes)
- Hasta 35 M€ / 7 % — prácticas prohibidas (art. 5).
- Hasta 15 M€ / 3 % — otras obligaciones (incluye art. 50).
- Hasta 7,5 M€ / **1 %** — información incorrecta a autoridades (art. 99.5).

## 7. Acciones pendientes
- [ ] Etiqueta de interacción con IA en el chat.
- [ ] Distintivo "contenido generado por IA" en resultados y Tarjeta de Decisión.
- [ ] Nota de supervisión humana + límites.
- [ ] Aplicar antes del 2-ago-2026.

---

> **Estado: Aprobado v1.0 (2026-07-22, Grupo 7 TFM)** — pendiente implementar los avisos de IA en la UI (art. 50, aplicable 2-ago-2026). La aprobación no sustituye la validación jurídica.

*Documento de trabajo (TFM). No constituye asesoramiento jurídico.*
