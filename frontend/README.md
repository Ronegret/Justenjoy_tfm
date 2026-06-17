# Frontend — Portal del Viajero

> **Estado:** pendiente de desarrollar.

Esta carpeta contendrá el código del **Portal del Viajero**: la landing page privada
y dinámica que se genera automáticamente para cada cliente tras confirmar su plan.

---

## Funcionalidad prevista

- Visualización del itinerario día a día
- Acceso a documentos y confirmaciones de reserva
- Recordatorios automatizados
- Espacio para feedback post-viaje
- Acceso con credenciales personales (un portal por cliente)

---

## Integración con el backend

El frontend consume el JSON generado por el workflow n8n
(ver `n8n/examples/output-plan.json` para la estructura completa).

El campo `plan.daily_itinerary[]` mapea directamente a la vista de itinerario;
`plan.cost_summary` a la vista de resumen de costes.

---

## Cuando llegue el código

Al añadir el código del frontend a esta carpeta:

1. Actualiza este README con el stack elegido, los requisitos y los comandos de arranque.
2. Añade los comandos de lint y tests a `AGENTS.md` §2.
3. Añade los patrones de build a `.gitignore` si no están ya.
4. Actualiza las variables de entorno en `.env.example`.
