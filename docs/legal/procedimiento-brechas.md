# Procedimiento de notificación de brechas de seguridad

**Norma:** RGPD arts. 33 y 34 · **Hallazgo:** #20
**Responsable:** `[COMPLETAR]` · **Contacto interno:** soporte@justenjoy.app

## 1. Objeto
Definir cómo detectar, evaluar, notificar y registrar una violación de seguridad de los datos
personales (confidencialidad, integridad o disponibilidad).

## 2. Roles
| Rol | Responsable | Función |
|---|---|---|
| Punto de contacto | `[COMPLETAR: nombre/email]` | Recibe y coordina el incidente |
| Evaluador de riesgo | `[COMPLETAR]` | Valora impacto y probabilidad |
| Interlocutor AEPD | `[COMPLETAR]` | Presenta la notificación si procede |

## 3. Flujo
```
1. DETECCIÓN  → cualquier miembro reporta al punto de contacto (incluye avisos externos:
   la política invita a reportar problemas de seguridad a soporte@justenjoy.app).
2. CONTENCIÓN → limitar el alcance (rotar claves, revocar sesiones, aislar el servicio).
3. REGISTRO   → anotar en el registro interno de brechas (§5) — SIEMPRE, aunque no se notifique.
4. EVALUACIÓN DE RIESGO → ¿hay riesgo para los derechos y libertades?
      - Sin riesgo    → registrar y cerrar.
      - Con riesgo    → notificar a la AEPD (art. 33).
      - Alto riesgo   → además, comunicar a los afectados (art. 34).
5. NOTIFICACIÓN AEPD → en un plazo máximo de 72 h desde el conocimiento (sede.aepd.es).
      Si se notifica pasadas 72 h, indicar motivos del retraso.
6. COMUNICACIÓN A AFECTADOS → si alto riesgo: lenguaje claro, sin dilación indebida.
7. COORDINACIÓN → según el caso, con INCIBE-CERT.
8. CIERRE → lecciones aprendidas y medidas correctoras.
```

## 4. Contenido mínimo de la notificación a la AEPD (art. 33.3)
- Naturaleza de la brecha; categorías y nº aproximado de interesados y de registros afectados.
- Datos de contacto (punto de contacto).
- Consecuencias probables.
- Medidas adoptadas o propuestas.

## 5. Registro interno de brechas (obligatorio, art. 33.5)
| Campo | Ejemplo |
|---|---|
| ID / fecha de detección | BR-2026-001 / `[fecha]` |
| Descripción | p. ej. exposición de `travel_plans` por RLS desactivado |
| Datos y nº de afectados | `[…]` |
| Evaluación de riesgo | Bajo / Medio / Alto |
| ¿Notificada a AEPD? (fecha) | Sí/No |
| ¿Comunicada a afectados? | Sí/No |
| Medidas correctoras | p. ej. activar RLS (#8), rotar service_role (#9) |
| Estado / cierre | Abierto / Cerrado |

## 6. Escenarios probables en Just Enjoy (de la auditoría)
- Exposición de planes por **RLS desactivado** en Supabase (#8) o filtración de la `service_role` (#9).
- Fuga de campos internos por el webhook (#13 — mitigado en v39).
- Exposición de claves API en el historial de git (`.env.example:8` exige rotación — **A VERIFICAR**).

---

> **Estado: Aprobado v1.0 (2026-07-22, Grupo 7 TFM)** — pendiente asignar los roles `[COMPLETAR]`. La aprobación no sustituye la validación jurídica.

*Documento de trabajo (TFM). No constituye asesoramiento jurídico.*
