# Spec — Toggle de modo oscuro (frontend)

- **Fecha:** 2026-07-04
- **Tipo:** feature (nueva funcionalidad)
- **Estado:** aprobada (2026-07-04) e implementada. Decisiones D1–D4 según la propuesta recomendada.
- **Rama:** `feature/toggle-tema`

## Contexto

El frontend tiene cientos de clases `dark:*` repartidas por los componentes, pero
**nada añade nunca la clase `.dark`** al documento, así que ese CSS está muerto: la
app siempre se ve en claro. Tailwind v4 ya declara el modo oscuro como *class-based*
en `globals.css` (`@custom-variant dark (&:where(.dark, .dark *))`) y `<html>` ya
lleva `suppressHydrationWarning`. Falta solo el mecanismo que active `.dark` y un
control para el usuario. Decisión de producto tomada: **añadir un toggle** (en vez de
borrar el CSS muerto).

## Qué hace

- Añade un control de tema (botón sol/luna) en la `Navbar` que alterna entre **claro**
  y **oscuro**.
- Aplica/quita la clase `.dark` en `<html>` (`document.documentElement`), activando el
  CSS `dark:*` existente.
- **Persiste** la preferencia del usuario en `localStorage` (clave `justenjoy-theme`).
- **Primer arranque:** si no hay preferencia guardada, sigue el sistema operativo
  (`prefers-color-scheme`).
- **Sin flash (FOUC):** un script inline mínimo y bloqueante en el `<head>` lee la
  preferencia y fija la clase **antes** del primer pintado, de modo que no se ve un
  parpadeo claro→oscuro al recargar.

## Qué NO hace (fuera de alcance)

- **No** corrige contraste/legibilidad en oscuro (a11y, #4) — lo cubre Rodrigo. Este
  toggle puede *destapar* problemas de contraste en dark que #4 deberá atender.
- **No** añade un tri-estado "seguir al sistema" en la UI (ver D3, alternativa).
- **No** toca `mockTripData.ts`, `types/trip.ts`, `next.config.ts`, `DayPlanCard.tsx`,
  `RouteDecisionCard.tsx`, `ItineraryTimeline.tsx` ni los componentes de mapas/imágenes
  (ficheros de la rama de Rodrigo) → sin conflictos.
- **No** añade dependencias nuevas (React + config Tailwind ya presente).

## Flujo de usuario

1. El usuario abre la app → se muestra en el tema de su sistema (o el último elegido).
2. Pulsa el botón sol/luna de la `Navbar` → la interfaz cambia al instante.
3. Recarga o vuelve más tarde → se mantiene su elección, sin parpadeo inicial.

## Decisiones a confirmar

| # | Decisión | Propuesta (recomendada) | Alternativa |
|---|---|---|---|
| D1 | Tema por defecto en primer arranque | Seguir el sistema (`prefers-color-scheme`) | Forzar claro siempre |
| D2 | Anti-flash | Script inline bloqueante en `layout.tsx` | Aceptar un parpadeo breve (más simple, peor UX) |
| D3 | Estados del toggle | 2 estados: claro / oscuro (inicial = sistema) | 3 estados: claro / oscuro / sistema |
| D4 | Ubicación del control | Botón icono en `Navbar` (desktop y móvil) | Solo en un menú de ajustes |

## Ficheros que toca (previsto)

- `frontend/src/context/ThemeContext.tsx` (nuevo) — estado del tema, `toggle`, escritura
  en `localStorage` y aplicación de `.dark` en `document.documentElement`.
- `frontend/src/components/shared/ThemeToggle.tsx` (nuevo) — botón sol/luna (lucide-react,
  ya es dependencia).
- `frontend/src/app/layout.tsx` — envolver con `ThemeProvider` y añadir el script
  anti-flash inline en `<head>`.
- `frontend/src/components/shared/Navbar.tsx` — insertar el `ThemeToggle`.

## Qué puede salir mal / riesgos

- **Hydration mismatch:** el servidor no conoce la preferencia del cliente. Mitigado por
  el `suppressHydrationWarning` ya presente en `<html>` + el script anti-flash que fija
  la clase antes de que React hidrate. El estado inicial del contexto debe leerse en un
  `useEffect` para no divergir del HTML del servidor.
- **Contraste en oscuro sin QA:** los `dark:*` nunca se han visto en uso; al activarlos
  pueden aparecer combinaciones ilegibles. Se documenta como interfaz con #4 (a11y).
- **localStorage no disponible** (modo privado estricto): degradar a "seguir sistema" sin
  romper.

## Verificación (tras implementar)

- `.\verify.ps1` verde (incluye el nuevo gate `tsc` del #5 si ya está mergeado).
- Manual: alternar el toggle cambia toda la UI; la elección persiste tras recargar; no hay
  parpadeo claro→oscuro en carga; primera visita respeta el tema del sistema.
- Revisar visualmente páginas clave en ambos temas: `/`, `/dashboard`, `/planner`,
  `/results`, `/trip/[id]`.
- `/code-review` obligatorio antes del PR.

## Dependencias / auditoría

- Ninguna nueva.
