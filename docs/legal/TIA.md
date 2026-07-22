# Revisión de transferencias internacionales + Transfer Impact Assessment (TIA)

**Norma:** RGPD Capítulo V (arts. 44-49) · **Hallazgo:** #19
**Fecha:** `[COMPLETAR]` · **Sistema:** Planificador v38

> Mecanismos verificados contra fuente oficial en el anexo de cumplimiento (T21-T22). El estatus DPF
> puede cambiar: **A VERIFICAR** en dataprivacyframework.gov antes de cada cita definitiva.

## 1. Inventario de transferencias por proveedor

| Proveedor | Entidad / país | Datos transferidos | Mecanismo (art.) | Fuente |
|---|---|---|---|---|
| Google (Firebase, Maps/Places) | Google LLC (EEUU) | Identidad/cuenta, consultas de lugares | **DPF — adecuación (art. 45)** + SCC de reserva | policies.google.com/privacy/frameworks; registro DPF |
| OpenAI | OpenAI (EEUU) | Brief de viaje, texto libre | **SCC (art. 46)** + DPA; no entrena por defecto | openai.com/security-and-privacy |
| Anthropic | Anthropic (EEUU) | Brief de viaje (fallback) | **SCC (art. 46)**; no certificada en DPF | privacy.claude.com |
| Supabase | Supabase Inc. (EEUU) | Plan generado (tabla `travel_plans`) | **SCC (art. 46) + TIA** | DPA oficial de Supabase |
| SerpAPI | SerpApi, LLC (EEUU) | Ciudades y fechas | **SCC (art. 46)** | serpapi.com/legal |
| Tavily | AlphaAI Technologies Inc. (EEUU) | Consultas de destino | **SCC (art. 46)**; **AUP prohíbe datos del art. 9** | tavily.com/privacy, /acceptable-use-policy |
| Open-Meteo | Europa | Coordenadas | Sin transferencia a 3.er país | — |
| OpenStreetMap / Nominatim | Europa | Topónimos/coordenadas | Sin transferencia a 3.er país | — |

## 2. TIA por proveedor (esquema a completar para cada uno con SCC)

Para **cada** proveedor con SCC (OpenAI, Anthropic, Supabase, SerpAPI, Tavily) documentar:

1. **Datos y sensibilidad** — qué se envía; ¿incluye art. 9? (minimizar; recordar la AUP de Tavily).
2. **Legislación del destino (EEUU)** — evaluación del acceso gubernamental (FISA 702, EO 12333) y su
   impacto sobre los datos concretos transferidos.
3. **Medidas suplementarias** — cifrado en tránsito/reposo, minimización, pseudonimización,
   políticas de no-entrenamiento / retención cero cuando estén disponibles.
4. **Conclusión** — si las garantías + medidas ofrecen un nivel esencialmente equivalente.
5. **Revisión** — fecha de próxima reevaluación.

### Caso Supabase (prioritario)
Supabase Inc. es entidad de EEUU: las SCC aplican **aunque el hosting sea región UE**. La región solo
reduce la residencia de datos, no elimina al encargado en EEUU. **A VERIFICAR** región del proyecto y
reflejarlo en la conclusión.

### Caso Google (DPF)
Al ampararse en adecuación (DPF), **no requiere SCC ni TIA** mientras la entidad siga "Active" en la
lista DPF. **A VERIFICAR** periódicamente; mantener SCC como mecanismo de reserva.

## 3. Base del mecanismo SCC
Cláusulas Contractuales Tipo modernizadas adoptadas por la Comisión Europea el **4-jun-2021**
(commission.europa.eu). Firmar el módulo aplicable (responsable → encargado) con cada proveedor y
conservar copia.

## 4. Acciones pendientes
- [ ] Formalizar/firmar SCC con OpenAI, Anthropic, Supabase, SerpAPI, Tavily.
- [ ] Confirmar DPF "Active" de Google.
- [ ] Completar un TIA por proveedor (esquema §2).
- [ ] Verificar región del proyecto Supabase.
- [ ] Implementar el filtrado de art. 9 antes de enviar a LLM y buscadores (#4).

---

> **Estado: Aprobado v1.0 (2026-07-22, Grupo 7 TFM)** — pendiente formalizar las SCC y un TIA por proveedor. La aprobación no sustituye la validación jurídica.

*Documento de trabajo (TFM). No constituye asesoramiento jurídico.*
