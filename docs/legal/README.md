# Artefactos de cumplimiento — Just Enjoy

Esta carpeta reúne los documentos de cumplimiento legal y de gobernanza de IA del proyecto,
derivados de la [auditoría de cumplimiento](../auditoria-cumplimiento-legal-seguridad.md).

> ⚠️ **Naturaleza de estos documentos.** Son **borradores técnicos** elaborados para la memoria
> del TFM, no asesoramiento jurídico ni documentos legales definitivos. Antes de un uso real
> (go-live con usuarios) deben revisarse por un profesional del Derecho. Los campos entre
> `[COMPLETAR: …]` requieren datos de la organización; los marcados **A VERIFICAR** dependen de
> fuentes oficiales sensibles al tiempo (fechas de aplicación, estatus DPF, cuantías).

## Índice

| Artefacto | Norma | Fichero | Estado |
|---|---|---|---|
| 1. Política de Privacidad | RGPD arts. 13/14 | [politica-privacidad.md](politica-privacidad.md) | Borrador (portar a `frontend/src/app/privacy/page.tsx`) |
| 2. Registro de Actividades de Tratamiento (ROPA/RAT) | RGPD art. 30 | [ROPA.md](ROPA.md) | Borrador |
| 3. Evaluación de Impacto (EIPD/DPIA) | RGPD art. 35 | [EIPD.md](EIPD.md) | Borrador |
| 4. Acuerdos de Encargo (DPA) por proveedor | RGPD art. 28 | [DPA/README.md](DPA/README.md) | Borrador + plantilla |
| 5. Procedimiento de notificación de brechas | RGPD arts. 33/34 | [procedimiento-brechas.md](procedimiento-brechas.md) | Borrador |
| 6. Aviso de transparencia de IA | RIA art. 50 | [transparencia-ia.md](transparencia-ia.md) | Borrador |
| 7. Revisión de transferencias internacionales + TIA | RGPD Cap. V | [TIA.md](TIA.md) | Borrador |

## Datos base del responsable (a completar una vez, referenciado por todos los documentos)

| Campo | Valor |
|---|---|
| Responsable del tratamiento | `[COMPLETAR: razón social / grupo de TFM]` — Grupo 7, TFM EBIS Business Techschool |
| NIF/identificación | `[COMPLETAR]` |
| Contacto de privacidad | soporte@justenjoy.app |
| Delegado de Protección de Datos (DPD/DPO) | No designado (proyecto académico); ver justificación en cada documento |
| Ámbito | España / Unión Europea |
| Estado del sistema | Prototipo de TFM en pre-producción (sin usuarios reales; Stripe y Botpress declarados pero no implementados) |

## Trazabilidad

Cada documento enlaza con el hallazgo correspondiente de la auditoría (#1–#31) para poder seguir
qué obligación cubre y qué evidencia de código la motivó.
