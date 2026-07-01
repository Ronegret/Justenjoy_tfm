# Registro de Decisiones de Arquitectura (ADR)

Un ADR documenta **por qué** se tomó una decisión técnica importante,
no solo el resultado. Ayuda al equipo a no repetir debates ya zanjados
y a entender las restricciones que motivaron cada elección.

---

## Cuándo crear un ADR

Crea un ADR cuando:
- Eliges entre dos o más alternativas técnicas con trade-offs reales
- Tomas una decisión que será difícil o costosa de revertir
- Un nuevo integrante del equipo podría preguntarse "¿por qué está hecho así?"

No crees un ADR para decisiones triviales o convenciones de estilo.

---

## Cómo crear un ADR

1. Crea el fichero: `docs/adr/YYYY-MM-DD-titulo-corto.md`
2. Usa esta estructura mínima:

```markdown
# ADR-XXXX: Título descriptivo

**Fecha:** YYYY-MM-DD
**Estado:** propuesta | aceptada | obsoleta | sustituida por ADR-XXXX

## Contexto
Qué problema o necesidad motivó esta decisión.

## Decisión
Qué se decidió hacer.

## Razones
Por qué esta opción frente a las alternativas.

## Alternativas consideradas
- Alternativa A: por qué se descartó.
- Alternativa B: por qué se descartó.

## Consecuencias
Qué implica esta decisión: ventajas, desventajas, deuda técnica conocida.
```

3. Referencia el ADR desde `docs/ARCHITECTURE.md` si afecta al diseño general.
4. Nunca borres un ADR obsoleto: márcalo como `obsoleta` y enlaza el que lo sustituye.

---

## ADRs existentes

| Fichero | Fecha | Decisión | Estado |
|---|---|---|---|
| [2026-07-01-n8n-como-motor-de-orquestacion.md](2026-07-01-n8n-como-motor-de-orquestacion.md) | 2026-07-01 | n8n self-hosted como motor de orquestación | aceptada |

---

## Decisiones ya tomadas (documentadas en el proyecto pero sin ADR formal)

Estas decisiones están implícitas en la arquitectura actual. Se pueden formalizar
como ADR si generan debate o si alguien del equipo las cuestiona:

- ~~**n8n como motor de orquestación**~~ → formalizada en [ADR-0001](2026-07-01-n8n-como-motor-de-orquestacion.md).
- **Un único workflow n8n** (vs. múltiples workflows separados) → facilita el testeo.
- **GPT-4o para el planificador, GPT-4o-mini para refinamiento** → balance coste/calidad.
- **SerpAPI para vuelos/hoteles/mapas** → plan gratuito suficiente para el TFM.
- **json_restrictor en todas las tools SerpAPI** → reducción ~95% de tokens por llamada.
- **Session state en `$getWorkflowStaticData`** → volátil pero suficiente para TFM;
  migrar a PostgreSQL en producción.
- **Coordenadas GPS hardcodeadas en tabla** (vs. API de geocoding) → evita llamada extra.
