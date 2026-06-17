## Descripción

<!-- Explica QUÉ cambia y POR QUÉ. Enlaza el issue si existe. -->

## Tipo de cambio

- [ ] `feat` — Nueva funcionalidad
- [ ] `fix` — Corrección de bug
- [ ] `docs` — Solo documentación
- [ ] `chore` — Mantenimiento / dependencias
- [ ] `refactor` — Sin cambio de comportamiento

## Origen del código

- [ ] Escrito por humano
- [ ] Generado por IA con revisión completa  → añade `[AI-generated]` al título del PR
- [ ] Generado por IA con revisión parcial   → añade `[AI-generated]` al título del PR

## Checklist universal

- [ ] `.\verify.ps1` pasa sin errores en local
- [ ] No hay secretos, claves ni tokens en el diff (`pre-commit run --all-files`)
- [ ] No hay dependencias nuevas sin justificar (ver CONTRIBUTING.md §Dependencias)
- [ ] Si cambia el contrato JSON (webhook entrada/salida): ejemplo actualizado en `n8n/examples/`
- [ ] Si cambia la arquitectura: `docs/ARCHITECTURE.md` actualizado en este mismo PR
- [ ] Si cambia el workflow n8n: `n8n/docs/` actualizado

## Checklist adicional — código generado por IA

*(Completa solo si el origen es IA)*

- [ ] He validado el comportamiento con datos reales (no solo con el ejemplo de ejemplo)
- [ ] He revisado edge cases y escenarios de error
- [ ] El código es coherente con `docs/ARCHITECTURE.md` y los ADRs existentes
- [ ] No hay lógica duplicada respecto a lo que ya existe en el repo
- [ ] Las dependencias nuevas existen en su registro oficial

## Contexto para el revisor

<!-- Cualquier cosa que el revisor deba saber: decisiones tomadas,
     alternativas descartadas, riesgos conocidos, cómo probar. -->
