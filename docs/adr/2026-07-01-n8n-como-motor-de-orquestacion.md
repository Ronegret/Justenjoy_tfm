# ADR-0001: n8n self-hosted como motor de orquestación

**Fecha:** 2026-07-01
**Estado:** aceptada

## Contexto

El núcleo de Just Enjoy es un pipeline que, a partir de un formulario de viaje,
orquesta varias llamadas encadenadas: uno o varios LLMs (planificación y
refinamiento) más APIs externas de datos reales (vuelos, hoteles, mapas, búsqueda
web). Necesitábamos una plataforma que coordinara ese flujo, gestionara el estado
de sesión entre pasos, expusiera un webhook de entrada y permitiera iterar rápido
sobre la lógica sin montar y desplegar un backend a medida.

## Decisión

Usar **n8n self-hosted** (en Docker) como motor de orquestación del planificador
de viajes. El sistema entero se articula en torno a un workflow de n8n (actualmente
`Planificador de Viajes v26`) que contiene los nodos de validación, el AI Agent y
las herramientas (SerpAPI, Tavily).

## Razones

- **Iteración rápida sin desplegar código:** el flujo se edita visualmente y se
  versiona como JSON; no hay ciclo de build/deploy para cada cambio de lógica.
- **Integración nativa con LLMs y community nodes** (SerpAPI, Tavily) como tools del
  AI Agent, justo el patrón que necesita el planificador.
- **Self-hosted en Docker:** reproducible, sin coste de plataforma, y las
  credenciales viven en su base de datos cifrada (no en el código).
- **Adecuado al alcance de un TFM:** el equipo puede centrarse en la lógica de
  negocio en vez de en infraestructura.

## Alternativas consideradas

- **Backend a medida (Node/Python):** máxima flexibilidad, pero mucho más código que
  escribir, testear y desplegar; excesivo para el alcance y el plazo del TFM.
- **Orquestadores gestionados en la nube (p. ej. servicios de workflows de un
  proveedor):** menos control, posible coste, y acoplamiento a un proveedor.

## Consecuencias

- **Ventaja:** velocidad de desarrollo y baja fricción operativa.
- **Desventaja / deuda técnica conocida:** el estado de sesión se guarda en
  `$getWorkflowStaticData` (memoria del proceso n8n), que es **volátil** — suficiente
  para el TFM, pero habría que migrarlo a una base de datos persistente
  (p. ej. PostgreSQL) para producción real.
- **Dependencia estructural:** todo el sistema depende de n8n; cambiar de motor sería
  costoso. De ahí que esta decisión merezca un ADR.
- El workflow JSON versionado en `n8n/workflows/` es la fuente de verdad de la lógica;
  las credenciales se inyectan por variables de entorno (ver `n8n/credentials/`).
