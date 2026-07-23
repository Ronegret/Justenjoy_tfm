# Spec — Buscador de clientes en "Mis Viajes Guardados"

- **Fecha:** 2026-07-23
- **Tipo:** funcionalidad nueva (UI, solo frontend/cliente)
- **Estado:** DOCUMENTADA a posteriori. La feature ya está implementada en el commit
  `379ca22` (rama `feature/buscador-clientes-dashboard`); esta spec la documenta para el
  registro (AGENTS.md §4 pide spec antes de codificar — aquí va después, se deja constancia).
- **No requiere aprobación de contrato** (§3.2): no toca webhooks, ni el workflow n8n, ni
  el esquema de Supabase, ni añade dependencias, ni escribe datos de clientes. Es filtrado
  **en cliente** sobre datos ya presentes en memoria.
- **Depende de:** la feature del titular (`feature/registro-titular-plan`), de la que toma
  `TripData.user_preferences.holder` y `holderFullName` (`lib/holder.ts`). Va apilada encima.

## Contexto

El dashboard "Mis Viajes Guardados" (`/dashboard`) listaba todos los planes guardados sin
forma de filtrarlos. Con el registro del titular por plan, un agente/comercial quiere poder
**encontrar el plan de un cliente concreto** por su nombre, teléfono o email, o por el
destino, sin recorrer la lista a mano.

## Qué hace

- Añade una **caja de búsqueda única** en `/dashboard` (visible solo si hay planes) que
  filtra el listado por:
  - **Datos del titular**: nombre + apellidos (vía `holderFullName`), teléfono, email.
  - **Viaje**: destino y título.
- **Comparación campo a campo** (no sobre un texto concatenado) para no generar
  coincidencias falsas cruzando el límite entre dos campos.
- **Insensible a mayúsculas, acentos y separadores de formato** mediante
  `normalizeLoose` (minúsculas + sin diacríticos + sin espacios/guiones/signos/`+`):
  `"jose perez"` casa `"José Pérez"`; `"600123456"` casa `"+34 600 123 456"`.
- Con la caja vacía se muestran todos. Los planes **sin titular** solo pueden casar por
  destino/título.
- La **fila de stats** (match medio, destinos únicos) se recalcula sobre el subconjunto
  filtrado, para que sea coherente con la grid cuando hay búsqueda activa.
- **Estado vacío de "sin resultados"** distinto del de "no hay viajes", vía un componente
  `EmptyState` reutilizable (unifica dos bloques de JSX casi idénticos).

## Refactors incluidos

- **`frontend/src/lib/text.ts` (nuevo):** `stripDiacritics`, `normalizeForSearch`
  (minúsculas + sin acentos, conserva espacios) y `normalizeLoose` (además sin separadores).
  Fuente única para quitar acentos.
- **`frontend/src/lib/tripPdf.tsx`:** `slugify` pasa a reutilizar `normalizeForSearch` en
  vez de duplicar la lógica de `normalize('NFD')` + eliminación de diacríticos.

## Qué NO hace (fuera de alcance)

- **No** consulta el backend ni la tabla `plan_holders`: filtra `savedTrips` en memoria.
- **No** añade paginación, orden ni filtros avanzados (rango de fechas, presupuesto…).
- **No** persiste la última búsqueda ni la comparte por URL.

## Flujo de usuario

1. El usuario entra en `/dashboard` con planes guardados.
2. Escribe en la caja (nombre de cliente, email, teléfono o destino).
3. La grid y los stats se filtran en vivo. La "X" limpia la búsqueda.
4. Si nada coincide, ve el `EmptyState` de "sin resultados" con opción de limpiar.

## Interacción crítica con la minimización de PII (⚠️ limitación conocida)

La feature del titular **no persiste `holder` en `localStorage`** (solo vive en memoria
durante la sesión; su fuente de verdad es `plan_holders` en el servidor). Consecuencia
directa sobre este buscador:

- **En la misma sesión** en que se generan los planes, `savedTrips` tiene `holder` en
  memoria → la búsqueda **por cliente funciona**.
- **Tras recargar la página**, `savedTrips` se rehidrata desde `localStorage` **sin
  `holder`** → la búsqueda por nombre/teléfono/email **no encuentra nada**; solo funciona
  por **destino/título**.

Es decir, el "buscador de clientes" queda limitado a la sesión activa. Si se requiere
buscar clientes de forma persistente, la vía correcta **no** es reintroducir PII en
`localStorage` (reabre el hallazgo de privacidad), sino un **dashboard que consulte
`plan_holders` en el servidor**. Queda como decisión pendiente para el equipo.

## Ficheros que toca

- `frontend/src/app/dashboard/page.tsx` — caja de búsqueda, filtrado (`useMemo`), stats
  sobre el subconjunto, `EmptyState`.
- `frontend/src/lib/text.ts` — **nuevo** util de normalización.
- `frontend/src/lib/tripPdf.tsx` — `slugify` reutiliza el util.

## Qué puede salir mal / riesgos

- **Falsa expectativa por la limitación de PII** (ver arriba): tras recargar, la búsqueda
  por cliente "no funciona". Es el mayor riesgo de percepción; debe documentarse en la UI o
  resolverse con consulta server-side.
- **Coste de filtrado**: `normalizeLoose` se ejecuta por campo y plan en cada tecla, dentro
  de `useMemo`. Con volúmenes de dashboard (decenas de planes) es despreciable; no escala a
  miles sin server-side (fuera de alcance).

## Verificación

- `.\verify.ps1` en verde (tsc + lint del frontend).
- Manual en `/dashboard` (misma sesión, con planes con titular):
  - Buscar por nombre con acento/caso distinto y por teléfono con separadores → casa.
  - Buscar por destino → casa; buscar algo inexistente → `EmptyState` de "sin resultados".
  - Recargar y repetir la búsqueda por cliente → confirma la limitación (solo destino/título).
- `/code-review` sobre el diff antes del PR (AGENTS.md §10) — **pendiente**.
