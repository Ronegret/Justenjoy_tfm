# Botpress — Agente Conversacional de Captación

> **Estado:** pendiente de integrar en este repositorio.

Esta carpeta contendrá las exportaciones y configuración del agente conversacional
desarrollado en **Botpress**: el punto de contacto inicial con el cliente.

---

## Funcionalidad prevista

- Interfaz de chat con Smart Chips (píldoras sugeridas) y lenguaje natural
- Captura de preferencias: destino, fechas, presupuesto, must-haves, gustos culinarios
- Generación del JSON `travel_brief` enviado al webhook de n8n

---

## Integración con el backend

El agente envía un POST al webhook de n8n (`/webhook/travel-planner`) con el JSON
`travel_brief`. Ver `n8n/examples/input-formulario.json` para la estructura exacta
que espera el workflow.

---

## Cuando llegue el contenido

Al añadir la configuración de Botpress a esta carpeta:

1. Documenta el proceso de exportación/importación del bot.
2. Actualiza `.env.example` con las variables de Botpress necesarias.
3. Actualiza `docs/ARCHITECTURE.md` con la integración concreta.
4. Actualiza `AGENTS.md` §1 con las rutas relevantes.
