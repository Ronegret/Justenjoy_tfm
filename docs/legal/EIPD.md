# Evaluación de Impacto relativa a la Protección de Datos (EIPD / DPIA)

**Norma:** RGPD art. 35 · **Hallazgo de auditoría:** #18
**Responsable:** `[COMPLETAR]` · **Fecha:** `[COMPLETAR]` · **Sistema:** Planificador v39

> **Naturaleza:** borrador para la memoria del TFM. La decisión final sobre si procede consulta
> previa a la AEPD (art. 36) debe validarse con asesoría jurídica.

## 1. ¿Procede la EIPD?

Concurren varios criterios de la lista de la AEPD (**A VERIFICAR** contra la lista vigente):

- **Uso de nuevas tecnologías** — orquestación con modelos de lenguaje (LLM).
- **Datos que pueden revelar categorías especiales (art. 9)** — texto libre `feedback_text` y opción de accesibilidad (#4).
- **Transferencias internacionales** a EEUU (#19).
- Tratamiento a escala de datos que reflejan hábitos/preferencias.

Con **dos o más** criterios, la EIPD se considera **exigible antes del go-live**.

## 2. Descripción sistemática del tratamiento

**Flujo de datos:**
```
Usuario → Frontend (Next.js) → /api/plan-trip (autenticado, Firebase Admin)
   → Webhook n8n (Planificador v39)
       → LLMs (OpenAI / Anthropic)         [EEUU]
       → Buscadores (SerpAPI, Tavily)      [EEUU]
       → Google Places/Maps                [EEUU, DPF]
       → Open-Meteo, Nominatim             [UE]
       → Supabase (tabla travel_plans)     [EEUU]
   → Respuesta saneada (status, session_id, plan, warnings) → Frontend → localStorage
```

- **Finalidades:** generar y conservar planes de viaje personalizados.
- **Bases jurídicas:** art. 6.1.b; art. 9.2.a para el texto libre con posible art. 9; art. 6.1.f (seguridad, con LIA).
- **Interesados y datos:** ver [ROPA.md](ROPA.md).

## 3. Necesidad y proporcionalidad

| Principio | Evaluación | Acción |
|---|---|---|
| Minimización (5.1.c) | El `feedback_text` libre puede recoger más de lo necesario | Filtrar/pseudonimizar antes de enviarlo a LLM y buscadores (#4) |
| Limitación de finalidad (5.1.b) | Los datos solo se usan para el plan; sin publicidad/perfilado comercial | OK; documentar en política |
| Exactitud (5.1.d) | El LLM puede alucinar (visado/clima/transporte) | Disclaimers in-situ + fuentes oficiales (#30) |
| Conservación (5.1.e) | Plazos no definidos | Definir plazos concretos en ROPA/política |
| Transparencia | Falta base jurídica y transferencias en la política | Completar política (#1, #5, #19) |

## 4. Evaluación de riesgos para los derechos y libertades

| ID | Riesgo | Prob. | Impacto | Nivel | Medida mitigadora | Hallazgo |
|---|---|---|---|---|---|---|
| R1 | Tratamiento de datos del art. 9 sin garantías (texto libre → LLM/buscadores) | Media | Alto | **Alto** | Consentimiento explícito 9.2.a + filtrado + aviso previo | #4 |
| R2 | Transferencia a EEUU sin mecanismo formalizado | Alta | Medio | **Alto** | SCC + TIA por proveedor; DPF para Google | #19 |
| R3 | Fuga de campos internos por el webhook (`_debug`, `_supabase_record`, `session_state`) | Media | Medio | **Medio** | **Resuelto en v39**: respuesta saneada | #13 |
| R4 | Acceso no autorizado a `travel_plans` (RLS desactivado + service_role) | Media | Alto | **Alto** | Activar RLS + políticas por sesión; minimizar service_role | #8, #9 |
| R5 | Copia sin cifrar en `localStorage` | Baja | Bajo | **Bajo** | Valorar cifrado o traslado a servidor | #22 |
| R6 | Decisiones inexactas por alucinación de IA | Media | Medio | **Medio** | Disclaimers + no presentar como infalible | #30 |
| R7 | Imagen de contenedor no fijada (comportamiento no reproducible) | Baja | Medio | **Bajo** | **Resuelto en v39**: pin `n8nio/n8n:2.25.7` | #7 |

## 5. Art. 22 RGPD — decisiones automatizadas

La "Tarjeta de Decisión" (recomendación de viaje) **no** produce efectos jurídicos ni
significativos similares. Con las **3 condiciones** (tratamiento de datos personales + decisión
únicamente automatizada + efectos jurídicos/significativos), **no se cumple la tercera** → art. 22.1
no se activa. Se aplican no obstante los deberes de información (arts. 13/14) y explicabilidad
(ya cubierta por la propia tarjeta). Ver #6.

## 6. Conclusión

Riesgo residual tras medidas: **aceptable** siempre que se implementen R1, R2 y R4 antes del
go-live. Con las medidas aplicadas no se prevé necesidad de **consulta previa** a la AEPD (art. 36),
salvo que el tratamiento del art. 9 se amplíe. **A VERIFICAR** con asesoría jurídica.

---

*Documento de trabajo (TFM). No constituye asesoramiento jurídico.*
