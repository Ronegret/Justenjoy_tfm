# Revisión del arnés de IA — Just Enjoy

> Este fichero deja constancia del nivel de arnés (conjunto de reglas y ficheros que
> hacen seguro y eficiente trabajar en el repo con agentes de IA) y de cuándo toca
> revisarlo. Es la referencia para futuras revisiones: no reinstalar desde cero,
> leer esto primero.

## Estado inicial

- **Nivel aplicado:** STANDARD
- **Fecha de esta revisión:** 2026-07-01
- **Justificación:** equipo de 3-5 personas, sin clientes en producción (proyecto
  académico en desarrollo), ~48 ficheros de código en 3 dominios (n8n, frontend,
  botpress). La heurística sitúa el proyecto claramente en STANDARD; subir a FULL no
  está justificado sin clientes reales ni criticidad.

> **Nota:** el arnés (AGENTS.md, verify.ps1, pre-commit, CODEOWNERS, CI con gitleaks,
> ARCHITECTURE.md, framework de ADRs, política de ramas) ya existía cuando se hizo
> esta revisión. Se creó con una ejecución anterior de esta misma skill. El
> `HARNESS_REVIEW.md` faltaba y se ha creado ahora para dejar constancia.

## Próximas revisiones (recordatorios fechados)

### Revisión 1 — tras 3-5 features (estimado ~2026-08-01)
Disparador real: cuando se completen 3-5 funcionalidades. Revisar el histórico de PRs
buscando: bloqueos recurrentes, reglas del arnés violadas más de una vez, pasos del
`verify.ps1` que se saltan sistemáticamente. Aplicar el proceso de mejora descrito en
`AGENTS.md §10` y anotar el resultado en la bitácora.

### Revisión 2 — cobertura de tests (estimado ~2026-08-01)
El proyecto no tiene aún umbral de cobertura de tests configurado. Cuando haya una
suite de tests estable en el frontend, evaluar si conviene añadir una alerta suave de
cobertura (empezar como *warning*, no bloqueante). Revisar en esta fecha.

### Revisión 3 — nivel del arnés (trimestral, ~2026-10-01)
¿El equipo sigue en 3-5 personas? ¿Han aparecido clientes en producción? ¿El repo
creció mucho en ficheros/dominios? Si la respuesta cambia la heurística de nivel,
crear un ADR y aplicar el delta (subir de nivel) o abrir discusión (bajar de nivel,
nunca automático).

## Bitácora de revisiones

<!-- append-only: una entrada por revisión, la más reciente arriba -->

- **2026-07-01** — Revisión de arnés existente (modo revisión). Veredicto: **MANTENER
  nivel STANDARD** (adecuado a equipo de 3-5 sin clientes en producción). Acciones
  realizadas dentro del nivel STANDARD, sin subir de nivel:
  - Creado este fichero (`docs/HARNESS_REVIEW.md`), que faltaba.
  - Formalizado el primer ADR: [ADR-0001 — n8n como motor de orquestación](adr/2026-07-01-n8n-como-motor-de-orquestacion.md).
  - `.gitattributes` revisado: ya existía y es correcto, no se tocó.
  - Próxima revisión trimestral: **2026-10-01**.
